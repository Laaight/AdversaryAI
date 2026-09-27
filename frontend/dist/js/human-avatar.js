/**
 * HumanAvatar — Ultra-realistic human avatar with precise neural lip-sync,
 * micro-saccadic eye contact, organic neck/head articulation, and dynamic facial expression.
 *
 * Morph targets: Oculus Visemes + ARKit jawOpen/blinks
 * Bones: Head, Neck, Left/Right Eye, Eyebrows
 * Lip-sync: Azure Speech exact viseme events (pushViseme) with crisp plosive snaps
 */

/** Azure Speech viseme ID (0-21) -> Oculus viseme morph target name. */
const AZURE_VISEME_TO_OCULUS = [
  'viseme_sil', // 0  sil (silence)
  'viseme_aa',  // 1  ae, ax, ah
  'viseme_aa',  // 2  aa
  'viseme_O',   // 3  ao
  'viseme_E',   // 4  ey, eh, uh
  'viseme_RR',  // 5  er
  'viseme_I',   // 6  y, iy, ih, ix
  'viseme_U',   // 7  w, uw
  'viseme_O',   // 8  ow
  'viseme_O',   // 9  aw
  'viseme_O',   // 10 oy
  'viseme_aa',  // 11 ay
  'viseme_sil', // 12 h
  'viseme_RR',  // 13 r
  'viseme_DD',  // 14 l
  'viseme_SS',  // 15 s, z
  'viseme_CH',  // 16 sh, ch, zh, jh
  'viseme_TH',  // 17 th, dh
  'viseme_FF',  // 18 f, v
  'viseme_DD',  // 19 d, t, n
  'viseme_kk',  // 20 k, g, ng
  'viseme_PP',  // 21 p, b, m
];

const VISEME_NAMES = [
  'viseme_sil',
  'viseme_PP',
  'viseme_FF',
  'viseme_TH',
  'viseme_DD',
  'viseme_kk',
  'viseme_CH',
  'viseme_SS',
  'viseme_nn',
  'viseme_RR',
  'viseme_aa',
  'viseme_E',
  'viseme_I',
  'viseme_O',
  'viseme_U',
];

/** Fast-attack consonants that demand instant lip contact. */
const PLOSIVE_VISEMES = new Set([
  'viseme_PP',
  'viseme_FF',
  'viseme_TH',
  'viseme_DD',
  'viseme_kk',
  'viseme_CH',
  'viseme_SS',
]);

/** Extra jaw opening coupled to open-mouth visemes (ARKit jawOpen, when present). */
const JAW_COUPLING = {
  viseme_aa: 0.65,
  viseme_O: 0.50,
  viseme_U: 0.32,
  viseme_E: 0.22,
  viseme_I: 0.16,
  viseme_CH: 0.26,
  viseme_TH: 0.18,
  viseme_RR: 0.18,
};

/** Syllable-rhythm fallback cycle used when no exact viseme events arrive. */
const ESTIMATED_CYCLE = [
  'viseme_PP',
  'viseme_aa',
  'viseme_SS',
  'viseme_E',
  'viseme_DD',
  'viseme_I',
  'viseme_kk',
  'viseme_O',
  'viseme_FF',
  'viseme_U',
  'viseme_CH',
  'viseme_aa',
];

export async function createHumanAvatar(THREE, GLTFLoaderClass, url, opts = {}) {
  const loader = new GLTFLoaderClass();
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;

  // ---- 1. Discover morph targets ----
  const morphMeshes = [];
  model.traverse((o) => {
    if (o.isMesh && o.morphTargetDictionary) morphMeshes.push(o);
  });

  // ---- 2. Discover bones for articulation: Head, Neck, Eyes, Eyebrows ----
  let headBone = null, headRestX = 0, headRestY = 0;
  let neckBone = null, neckRestX = 0, neckRestY = 0;
  let leftEyeBone = null, lEyeRestX = 0, lEyeRestY = 0;
  let rightEyeBone = null, rEyeRestX = 0, rEyeRestY = 0;
  const eyebrowBones = [];

  model.traverse((o) => {
    if (!o.isBone) return;
    const name = o.name.toLowerCase();

    if (!headBone && name.includes('head')) {
      headBone = o;
      headRestX = o.rotation.x;
      headRestY = o.rotation.y;
    } else if (!neckBone && name.includes('neck')) {
      neckBone = o;
      neckRestX = o.rotation.x;
      neckRestY = o.rotation.y;
    } else if (!leftEyeBone && (name.includes('leye') || name.includes('eye_l') || name.includes('left_eye'))) {
      leftEyeBone = o;
      lEyeRestX = o.rotation.x;
      lEyeRestY = o.rotation.y;
    } else if (!rightEyeBone && (name.includes('reye') || name.includes('eye_r') || name.includes('right_eye'))) {
      rightEyeBone = o;
      rEyeRestX = o.rotation.x;
      rEyeRestY = o.rotation.y;
    } else if (name.includes('eyebrow')) {
      eyebrowBones.push({
        bone: o,
        restY: o.position.y,
        isInner: name.includes('inner'),
        isMiddle: name.includes('middle'),
      });
    }
  });

  // ---- 3. Photorealistic PBR Material Tuning ----
  model.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m) continue;
      const mName = (m.name || '').toLowerCase();

      if (mName.includes('eye') || mName.includes('cornea') || mName.includes('glasses')) {
        // Wet, glistening specular cornea reflections
        m.roughness = 0.04;
        m.metalness = 0.05;
        if (m.envMapIntensity !== undefined) m.envMapIntensity = 1.8;
      } else if (mName.includes('head') || mName.includes('body') || mName.includes('skin')) {
        // Natural human skin (velvety soft specular, non-plastic)
        m.roughness = 0.62;
        m.metalness = 0.0;
        if (m.envMapIntensity !== undefined) m.envMapIntensity = 1.15;
      } else if (mName.includes('hair')) {
        m.roughness = 0.82;
        m.metalness = 0.02;
      }
    }
  });

  // ---- 4. Normalize: Head center at origin, head height ~= 1 unit ----
  const group = new THREE.Group();
  const inner = new THREE.Group();
  inner.add(model);
  group.add(inner);

  model.updateMatrixWorld(true);
  const wholeBox = new THREE.Box3().setFromObject(model);
  const totalH = Math.max(wholeBox.getSize(new THREE.Vector3()).y, 1e-3);
  const headH = totalH / 7.5;
  const headCenter = new THREE.Vector3();

  if (headBone) {
    headBone.getWorldPosition(headCenter);
    headCenter.y += headH * 0.35;
  } else {
    wholeBox.getCenter(headCenter);
  }

  const s = 1 / headH;
  inner.scale.setScalar(s);
  inner.position.set(-headCenter.x * s, -headCenter.y * s, -headCenter.z * s);

  const baseYaw =
    (typeof THREE.MathUtils !== 'undefined' ? THREE.MathUtils.degToRad : (d) => (d * Math.PI) / 180)(
      opts.faceYawDeg !== undefined ? opts.faceYawDeg : 0,
    );

  // ---- 5. Animation & State ----
  const desired = {};
  for (const n of VISEME_NAMES) desired[n] = 0;

  let speaking = false;
  let lastVisemeAt = -1e9;
  let estIdx = 0;
  let nextEstAt = 0;

  let blinkT = -1;
  let nextBlink = 1.5;
  let blinkW = 0;

  const lookTarget = { x: 0, y: 0 };
  let nextLook = 2;
  let nodT = -1;

  // Eye micro-saccades (natural micro-darting)
  const eyeTarget = { x: 0, y: 0 };
  let nextSaccade = 1.2;
  let saccadeDuration = 0.08;
  let saccadeElapsed = 0.08;

  let exactMode = false;

  function pushViseme(azureVisemeId, nowMs) {
    const name = AZURE_VISEME_TO_OCULUS[azureVisemeId] || 'viseme_sil';
    for (const n of VISEME_NAMES) desired[n] = 0;
    desired[name] = 1;
    lastVisemeAt = nowMs !== undefined ? nowMs : performance.now();

    if (window.__visemeDebug) window.__visemeDebug.count++;
  }

  function setSpeaking(on) {
    speaking = on;
    if (!on) {
      exactMode = false;
      for (const n of VISEME_NAMES) desired[n] = 0;
    } else {
      nextEstAt = 0;
    }
  }

  function setSpeakingExact(on) {
    speaking = on;
    exactMode = on;
    if (!on) {
      for (const n of VISEME_NAMES) desired[n] = 0;
    } else {
      lastVisemeAt = performance.now();
    }
  }

  function update(dt, elapsed) {
    const nowMs = performance.now();

    // Fallback syllable rhythm
    if (speaking && !exactMode && nowMs - lastVisemeAt > 320) {
      if (nowMs >= nextEstAt) {
        for (const n of VISEME_NAMES) desired[n] = 0;
        desired[ESTIMATED_CYCLE[estIdx % ESTIMATED_CYCLE.length]] = 0.92;
        estIdx += 1;
        nextEstAt = nowMs + 100 + Math.random() * 110;
      }
    }
    if (speaking && exactMode && nowMs - lastVisemeAt > 550) {
      for (const n of VISEME_NAMES) desired[n] = 0;
    }

    // Razor-sharp asymmetric lip easing: Fast attack for plosives/consonants, smooth vowel decay
    let jaw = 0;
    for (const n of VISEME_NAMES) {
      const w = desired[n] || 0;
      const jc = JAW_COUPLING[n];
      if (jc && w > jaw) jaw = jc * w;
    }

    for (const mesh of morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences;

      for (const n of VISEME_NAMES) {
        const idx = dict[n];
        if (idx === undefined) continue;

        const target = n === 'viseme_sil' ? 0 : desired[n] || 0;
        // Asymmetric easing rate
        const isPlosive = PLOSIVE_VISEMES.has(n);
        const rate = target > infl[idx] ? (isPlosive ? 28 : 22) : 16;
        const k = 1 - Math.exp(-dt * rate);

        infl[idx] += (target - infl[idx]) * k;
      }

      const jawIdx = dict['jawOpen'];
      if (jawIdx !== undefined) {
        const jawRate = 1 - Math.exp(-dt * 20);
        infl[jawIdx] += ((speaking ? jaw : 0) - infl[jawIdx]) * jawRate;
      }
    }

    // Natural blinking
    if (blinkT < 0 && elapsed > nextBlink) blinkT = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      const phase = blinkT / 0.15;
      blinkW = phase < 1 ? Math.sin(phase * Math.PI) : 0;
      if (phase >= 1) {
        blinkT = -1;
        blinkW = 0;
        nextBlink = elapsed + 2.0 + Math.random() * 3.5;
      }
    }
    for (const mesh of morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences;
      for (const n of ['eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed']) {
        const idx = dict[n];
        if (idx !== undefined) infl[idx] += (blinkW - infl[idx]) * Math.min(1, dt * 32);
      }
    }

    // Breathing & organic subtle sway
    group.position.y = Math.sin(elapsed * 1.3) * 0.007;
    group.rotation.y = baseYaw + Math.sin(elapsed * 0.24) * 0.025;

    // Look-around & nod
    if (elapsed > nextLook) {
      lookTarget.x = (Math.random() - 0.5) * 0.18;
      lookTarget.y = (Math.random() - 0.5) * 0.10;
      nextLook = elapsed + 2.6 + Math.random() * 3.8;
    }
    let pitch = lookTarget.y;
    if (nodT >= 0) {
      nodT += dt;
      const total = 0.85;
      if (nodT >= total) nodT = -1;
      else pitch += Math.sin((nodT / total) * Math.PI * 2) * 0.22;
    }

    // Dual-joint spine articulation (Neck + Head)
    if (headBone) {
      const bk = Math.min(1, dt * 3.2);
      headBone.rotation.y += (headRestY + lookTarget.x * 0.7 - headBone.rotation.y) * bk;
      headBone.rotation.x += (headRestX + pitch * 0.7 - headBone.rotation.x) * Math.min(1, dt * 5.5);
    }
    if (neckBone) {
      const nk = Math.min(1, dt * 2.2);
      neckBone.rotation.y += (neckRestY + lookTarget.x * 0.3 - neckBone.rotation.y) * nk;
      neckBone.rotation.x += (neckRestX + pitch * 0.3 - neckBone.rotation.x) * Math.min(1, dt * 3.5);
    }

    // Eye contact & Micro-saccades
    if (elapsed > nextSaccade) {
      eyeTarget.x = (Math.random() - 0.5) * 0.05;
      eyeTarget.y = (Math.random() - 0.5) * 0.035;
      nextSaccade = elapsed + 1.6 + Math.random() * 2.8;
      saccadeElapsed = 0;
    }
    if (saccadeElapsed < saccadeDuration) {
      saccadeElapsed += dt;
      const ek = Math.min(1, dt * 25);
      if (leftEyeBone) {
        leftEyeBone.rotation.y += (lEyeRestY + eyeTarget.x - leftEyeBone.rotation.y) * ek;
        leftEyeBone.rotation.x += (lEyeRestX + eyeTarget.y - leftEyeBone.rotation.x) * ek;
      }
      if (rightEyeBone) {
        rightEyeBone.rotation.y += (rEyeRestY + eyeTarget.x - rightEyeBone.rotation.y) * ek;
        rightEyeBone.rotation.x += (rEyeRestX + eyeTarget.y - rightEyeBone.rotation.x) * ek;
      }
    }

    // Dynamic eyebrow expression during speech
    if (eyebrowBones.length > 0) {
      const browOffset = speaking ? Math.sin(elapsed * 4.5) * 0.003 + 0.002 : 0;
      for (const eb of eyebrowBones) {
        eb.bone.position.y += (eb.restY + (eb.isInner ? browOffset * 1.5 : browOffset) - eb.bone.position.y) * Math.min(1, dt * 10);
      }
    }
  }

  function nod() {
    if (nodT < 0) nodT = 0;
  }

  function stop() {
    setSpeaking(false);
  }

  function setIdle() {
    stop();
  }

  function dispose() {
    model.traverse((o) => {
      if (o.isMesh) {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m) continue;
          for (const key of Object.keys(m)) {
            const v = m[key];
            if (v && v.isTexture) v.dispose();
          }
          m.dispose();
        }
      }
    });
    group.removeFromParent();
  }

  return {
    group,
    pushViseme,
    setSpeaking,
    setSpeakingExact,
    stop,
    setIdle,
    nod,
    update,
    dispose,
  };
}
