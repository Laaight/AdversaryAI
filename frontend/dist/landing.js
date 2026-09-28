/* AdversaryAI landing page — classic script (no ESM statements, so it stays
   build-free and `node --check`-clean). Three.js loads via dynamic import()
   resolved through the importmap in landing.html. */
'use strict';

/* ================= PRICING (fallback copy; live prices win when reachable) ================= */
const PRICING = {
  trial: {
    name: 'Trial',
    price: 0,
    per: '',
    headline: '15 sparring rounds, free',
    cta: 'Start free',
    features: [
      '15 rounds on us',
      'All 11 practice modes',
      'Voice or text sessions',
      'No credit card to start'
    ]
  },
  plans: [
    {
      name: 'Debater',
      price: 12,
      per: '/mo',
      headline: '300 sparring rounds per month',
      cta: 'Start free, upgrade in-app',
      features: [
        '300 sparring rounds per month',
        'All 11 practice modes',
        'Voiced 3D opponents with real lip-sync',
        'Scorecards + impartial judge verdicts',
        'Unused rounds roll over'
      ]
    },
    {
      name: 'Coach',
      price: 29,
      per: '/mo',
      headline: '1,000 sparring rounds per month',
      badge: 'Most popular',
      cta: 'Start free, upgrade in-app',
      features: [
        '1,000 sparring rounds per month — 3× Debater',
        'Everything in Debater',
        'Built for daily practice, interview season & debate teams',
        'Unused rounds roll over'
      ]
    },
    {
      name: 'Champion',
      price: 49,
      per: '/mo',
      headline: 'Photoreal video opponents',
      cta: 'Start free, upgrade in-app',
      features: [
        'Photoreal video opponents (rolling out)',
        'Strongest reasoning model: sharper opponents, deeper feedback',
        '1,000 sparring rounds per month',
        'Everything in Coach'
      ]
    }
  ],
  packs: [
    { credits: 100, price: 9 },
    { credits: 250, price: 19 },
    { credits: 600, price: 39 }
  ],
  packsNote: 'One-time purchase. Pack credits never expire.'
};

const SIGNUP_URL = '/app/#/signup';

/* Live prices: GET /api/billing/prices -> { tiers: [...], packs: [...] }.
   Shapes come from the worker config; anything missing falls back to PRICING. */
function adaptLivePrices(data) {
  if (!data || typeof data !== 'object') return null;
  const rawTiers = data.tiers;
  const packs = data.packs;
  if (!rawTiers) return null;

  const tiers = {};
  if (Array.isArray(rawTiers)) {
    for (const t of rawTiers) {
      tiers[t.id] = t;
    }
  } else if (typeof rawTiers === 'object') {
    Object.assign(tiers, rawTiers);
  }

  const trial = tiers.trial || { name: 'Trial', price: 0, debates: 15, rounds: 15 };
  const debater = tiers.debater || { name: 'Debater', price: 1200, rounds: 300 };
  const coach = tiers.coach || { name: 'Coach', price: 2900, rounds: 1000 };
  const champion = tiers.champion || { name: 'Champion', price: 4900, rounds: 1000 };

  const getPrice = (t, def) => {
    if (typeof t.priceMonthly === 'number') return t.priceMonthly;
    if (typeof t.price === 'number') return t.price > 100 ? Math.round(t.price / 100) : t.price;
    return def;
  };
  const getRounds = (t, def) => t.roundsPerMonth || t.rounds || t.debatesPerMonth || t.debates || def;

  const plans = [
    {
      name: trial.name || 'Trial',
      price: 0,
      per: '',
      headline: getRounds(trial, 15) + ' sparring rounds, free',
      cta: 'Start free',
      features: [
        getRounds(trial, 15) + ' sparring rounds on us',
        'All 11 practice modes',
        'Voice or text sessions',
        'No credit card to start'
      ]
    },
    {
      name: debater.name || 'Debater',
      price: getPrice(debater, 12),
      per: '/mo',
      headline: getRounds(debater, 300).toLocaleString() + ' sparring rounds per month',
      cta: 'Start free, upgrade in-app',
      features: [
        getRounds(debater, 300).toLocaleString() + ' sparring rounds per month',
        'All 11 practice modes',
        'Voiced 3D opponents with real lip-sync',
        'Scorecards + impartial judge verdicts',
        'Unused rounds roll over'
      ]
    },
    {
      name: coach.name || 'Coach',
      price: getPrice(coach, 29),
      per: '/mo',
      headline: getRounds(coach, 1000).toLocaleString() + ' sparring rounds per month',
      badge: 'Most popular',
      cta: 'Start free, upgrade in-app',
      features: [
        getRounds(coach, 1000).toLocaleString() + ' sparring rounds per month — 3× Debater',
        'Everything in Debater',
        'Built for daily practice, interview season & debate teams',
        'Unused rounds roll over'
      ]
    },
    {
      name: champion.name || 'Champion',
      price: getPrice(champion, 49),
      per: '/mo',
      headline: 'Photoreal video opponents',
      badge: 'Best experience',
      cta: 'Start free, upgrade in-app',
      features: [
        champion.photoreal ? 'Photoreal video opponents — ' + (champion.photorealMinutes || 150) + ' min/month' : 'Photoreal video opponents (rolling out)',
        'Strongest reasoning model: sharper opponents, deeper feedback',
        getRounds(champion, 1000).toLocaleString() + ' sparring rounds per month',
        'Everything in Coach'
      ]
    }
  ];

  const livePacks = Array.isArray(packs) && packs.length
    ? packs.map(function (p) { return { credits: p.rounds || p.debates || p.credits, price: Math.round((p.price || 0) / 100) || p.price }; })
    : PRICING.packs;

  return { trial: plans[0], plans: [plans[1], plans[2], plans[3]], packs: livePacks, packsNote: PRICING.packsNote };
}

function loadLivePricing() {
  return fetch('/api/billing/prices', { headers: { 'Accept': 'application/json' } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(adaptLivePrices)
    .catch(function () { return null; });
}

/* ================= PRACTICE MODES ================= */
const MODES_FALLBACK = [
  { id: 'debate', name: 'Debate', icon: '⚔️', blurb: 'Classic argument combat. Pick a motion, argue your case, get scored like an athlete.' },
  { id: 'historical', name: 'Historical Figures', icon: '🏛️', blurb: 'Argue with the great minds of history — challenge their ideas, defend your own.' },
  { id: 'acting', name: 'Acting Coach', icon: '🎭', blurb: 'Run lines and scenes with a partner who never misses a cue.' },
  { id: 'interview', name: 'Interview Prep', icon: '💼', blurb: 'Practice tough interview questions with instant feedback on every answer.' },
  { id: 'negotiation', name: 'Negotiation', icon: '🤝', blurb: 'Hone your deal-making against a counterpart who plays hardball.' },
  { id: 'sales', name: 'Sales Roleplay', icon: '📈', blurb: 'Handle every objection — price, timing, competition — until they melt away.' },
  { id: 'difficult', name: 'Difficult Conversations', icon: '💬', blurb: 'Rehearse the hard talks: feedback, conflict, bad news — safely.' },
  { id: 'rapbattle', name: 'Rap Battle', icon: '🎤', blurb: 'Trade bars against a battle MC with flow, wordplay, and rebuttals.' },
  { id: 'witness', name: 'Evangelism Training', icon: '✝️', blurb: 'Rehearse sharing the gospel with a realistic counterpart — curious, skeptical, or hurting.' },
  { id: 'thesis', name: 'Thesis Defense', icon: '🎓', blurb: 'Defend your thesis against a committee that probes every weakness.' },
  { id: 'expert', name: 'Domain Expert', icon: '🧠', blurb: 'You are the professional. Explain and defend any topic — code, theology, medicine, finance — under probing questions.' }
];

/* Per-mode tile background — no photo asset needed, never breaks. */
const TILE_GRADIENTS = [
  'linear-gradient(135deg,#2a0d12,#4a0f18)',
  'linear-gradient(135deg,#0d1f2a,#0f3a4a)',
  'linear-gradient(135deg,#241030,#3a1650)',
  'linear-gradient(135deg,#0d2a1a,#0f4a2e)',
  'linear-gradient(135deg,#2a1c0d,#4a3410)',
  'linear-gradient(135deg,#2a0d24,#4a1042)',
  'linear-gradient(135deg,#0d1a2a,#123a5a)',
  'linear-gradient(135deg,#2a140d,#4a2010)',
  'linear-gradient(135deg,#141c2a,#1e3050)',
  'linear-gradient(135deg,#2a0d1c,#4a1132)',
  'linear-gradient(135deg,#0d2422,#0f423d)'
];
function tileGradient(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TILE_GRADIENTS[h % TILE_GRADIENTS.length];
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* /api/modes is built by a sibling team; accept anything reasonable:
   an array, { modes: [...] }, or { data: [...] }; items as strings or
   objects with name/title + description/blurb + icon/emoji. */
function normalizeModes(data) {
  const raw = Array.isArray(data) ? data : (data && (data.modes || data.data));
  if (!Array.isArray(raw) || !raw.length) return null;
  const modes = raw.map(function (m, i) {
    var fb = MODES_FALLBACK[i % MODES_FALLBACK.length];
    if (typeof m === 'string') return { id: fb.id, name: m, icon: fb.icon, img: fb.img, blurb: '' };
    var id = m.id || fb.id;
    return {
      id: id,
      name: m.name || m.title || id || 'Practice mode',
      icon: m.icon || m.emoji || fb.icon,
      blurb: m.description || m.blurb || m.tagline || ''
    };
  });
  return modes.length ? modes : null;
}

function loadModes() {
  return fetch('/api/modes', { headers: { 'Accept': 'application/json' } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(normalizeModes)
    .catch(function () { return null; })
    .then(function (modes) { return modes || MODES_FALLBACK; });
}

function renderModes(modes) {
  const grid = document.getElementById('modes-grid');
  if (!grid) return;
  grid.innerHTML = modes.map(function (m, i) {
    const idx = String(i + 1).padStart(2, '0');
    return '' +
      '<a class="mode reveal" href="/app/#/signup?next=' + encodeURIComponent('/setup/' + m.id) + '" data-mode="' + escHtml(m.id) + '">' +
      '<div class="mode-img mode-tile" style="background:' + tileGradient(m.id) + '">' +
      '<span class="mode-tile-icon" aria-hidden="true">' + (m.icon || '') + '</span>' +
      '<span class="mode-idx">' + idx + '</span></div>' +
      '<div class="mode-body">' +
      '<h3>' + escHtml(m.name) + '</h3>' +
      (m.blurb ? '<p>' + escHtml(m.blurb) + '</p>' : '') +
      '<span class="mode-cta">Start practicing <span class="mode-arr" aria-hidden="true">&rarr;</span></span>' +
      '</div></a>';
  }).join('');
  observeReveals(grid);
}

/* ================= pricing render ================= */
function priceLabel(p) {
  return p.price === 0 ? 'Free' : '$' + p.price;
}

function renderPricing(pricing) {
  const plansEl = document.getElementById('plans');
  const packsEl = document.getElementById('packs');
  if (!plansEl || !packsEl) return;

  const cards = [pricing.trial].concat(pricing.plans);
  plansEl.innerHTML = cards.map(function (plan, i) {
    const featured = plan.badge ? ' featured' : '';
    const badge = plan.badge ? '<span class="plan-badge">' + plan.badge + '</span>' : '';
    const per = plan.per ? '<small>' + plan.per + '</small>' : '';
    const features = plan.features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    return '' +
      '<article class="plan' + featured + '">' + badge +
      '<h3>' + plan.name + '</h3>' +
      '<p class="plan-headline">' + plan.headline + '</p>' +
      '<div class="plan-price">' + priceLabel(plan) + ' ' + per + '</div>' +
      '<ul>' + features + '</ul>' +
      '<a class="btn ' + (i === 0 ? 'btn-ghost' : 'btn-primary') + '" href="' + SIGNUP_URL + '">' + plan.cta + '</a>' +
      '</article>';
  }).join('');

  packsEl.innerHTML = pricing.packs.map(function (pack) {
    return '' +
      '<div class="pack">' +
      '<div><div class="pack-credits">' + pack.credits + ' <small>rounds</small></div>' +
      '<div class="pack-price">$' + pack.price + ' one-time</div></div>' +
      '<a class="btn btn-ghost" href="' + SIGNUP_URL + '">Get pack</a>' +
      '</div>';
  }).join('');
}

/* ================= mobile nav ================= */
function wireNav() {
  const toggle = document.getElementById('navToggle');
  const panel = document.getElementById('mobileNav');
  if (!toggle || !panel) return;
  function setOpen(open) {
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.classList.toggle('open', open);
  }
  toggle.addEventListener('click', function () {
    setOpen(panel.classList.contains('hidden'));
  });
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) setOpen(false);
  });
}

/* ================= scroll reveal ================= */
let revealObserver = null;
function observeReveals(scope) {
  const root = scope || document;
  const els = root.querySelectorAll('.reveal:not(.in)');
  if (!els.length) return;
  if (REDUCED_MOTION) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }
  els.forEach(function (el) { revealObserver.observe(el); });
}

/* ================= avatar ================= */
const REDUCED_MOTION = typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Demo opponents — three personas, three faces, three voices. Switching tabs
   hot-swaps the 3D model and the teaser audio; the mouth classifier follows
   whichever audio is playing. */
const DEMO_PERSONAS = {
  prosecutor: {
    label: 'The Prosecutor',
    model: '/models/personas/man-pro.glb?v=1790461873',
    src: '/demo-audio/teaser-prosecutor.mp3',
    caption: 'The Prosecutor cross-examines you',
  },
  contrarian: {
    label: 'The Contrarian',
    model: '/models/personas/woman-pro.glb?v=1790461873',
    src: '/demo-audio/teaser-contrarian.mp3',
    caption: 'The Contrarian steelmans the other side',
  },
  coach: {
    label: 'The Coach',
    model: '/models/personas/woman-casual.glb?v=1790461873',
    src: '/demo-audio/teaser-coach.mp3',
    caption: 'The Coach pushes you, then shows the fix',
  },
};
let demoPersonaId = 'prosecutor';

function initAvatar() {
  const canvas = document.getElementById('avatarCanvas');
  const frame = document.getElementById('avatarFrame');
  const overlay = document.getElementById('avatarOverlay');
  const playBtn = document.getElementById('playBtn');
  const caption = document.getElementById('avatarCaption');
  if (!canvas || !frame) return;

  Promise.all([
    import('three'),
    import('/js/human-avatar.js?v=1790461873'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/environments/RoomEnvironment.js'),
  ]).then(function (mods) {
    buildScene(mods[0], mods[1].createHumanAvatar, mods[2].GLTFLoader, mods[3].RoomEnvironment,
      canvas, frame, overlay, playBtn, caption);
  }).catch(function () {
    if (caption) caption.textContent = 'Avatar failed to load — check your connection and reload.';
  });
}

function buildScene(THREE, createHumanAvatar, GLTFLoader, RoomEnvironment, canvas, frame, overlay, playBtn, caption) {
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  /* head-and-shoulders "video call" framing: head center at origin, head ~= 1 unit */
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.02, 2.7);
  camera.lookAt(0, -0.12, 0);

  /* studio lighting — soft key for skin, brand-red rim for edge */
  scene.add(new THREE.AmbientLight(0x3a3f4a, 0.85));
  const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
  key.position.set(2.2, 3.2, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xff2e3f, 40, 25, 1.8);
  rim.position.set(-3.2, 2.2, -2.4);
  scene.add(rim);
  const fill = new THREE.PointLight(0x4a6fa5, 14, 22, 1.8);
  fill.position.set(3.2, 0.4, 2.6);
  scene.add(fill);

  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  } catch (e) { /* non-fatal: lights alone still carry the shot */ }

  /* ---- The Adversary: a real human opponent ---- */
  let human = null;
  /* Mouth follows the real teaser audio through spectral classification:
     sibilants (s/sh) get teeth visemes, vowels get their shape from the
     formant centroid, plosive onsets (p/b) get a lip pop. Silence = shut.
     Thresholds below are ratios/centroids (scale-free), calibrated against
     the actual teaser audio's spectrum — no random visemes. */
  let mouthCtx = null, mouthAnalyser = null, freqData = null;
  let lastClass = 0, lastClassAt = 0, lowAvg = 0, lastPlosiveAt = 0;
  function ensureMouthAnalyser() {
    if (mouthAnalyser || typeof window === 'undefined') return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || typeof audio === 'undefined') return;
      mouthCtx = new AC();
      const src = mouthCtx.createMediaElementSource(audio);
      mouthAnalyser = mouthCtx.createAnalyser();
      mouthAnalyser.fftSize = 2048;
      mouthAnalyser.smoothingTimeConstant = 0.35;
      freqData = new Uint8Array(mouthAnalyser.frequencyBinCount);
      src.connect(mouthAnalyser);
      mouthAnalyser.connect(mouthCtx.destination);
      if (mouthCtx.state === 'suspended') mouthCtx.resume();
    } catch (e) { mouthAnalyser = null; }
  }
  function bandEnergy(loHz, hiHz) {
    const binHz = mouthCtx.sampleRate / mouthAnalyser.fftSize;
    const lo = Math.max(1, Math.floor(loHz / binHz));
    const hi = Math.min(freqData.length - 1, Math.ceil(hiHz / binHz));
    let sum = 0;
    for (let i = lo; i <= hi; i++) sum += freqData[i];
    return sum / (hi - lo + 1);
  }
  function classifyViseme() {
    mouthAnalyser.getByteFrequencyData(freqData);
    const total = bandEnergy(90, 8000);
    if (total < 12) { lowAvg *= 0.9; return 0; } /* silence: mouth shut */
    const vowel = bandEnergy(150, 1100);
    const sibHi = bandEnergy(5500, 8000);
    const sibMid = bandEnergy(2600, 5200);
    const low = bandEnergy(90, 320);

    /* plosive onset: low band jumps far above its recent average -> lips pop */
    if (lowAvg > 4 && low > 3 * lowAvg && low > 20) {
      const now = performance.now();
      if (now - lastPlosiveAt > 160) {
        lastPlosiveAt = now;
        lowAvg = low;
        return 21; /* p, b, m */
      }
    }
    lowAvg += (low - lowAvg) * 0.12;

    /* sibilants: high-frequency hiss dominates the vowel band */
    if (sibHi > 14 && sibHi >= vowel) return 15; /* s, z — teeth together */
    if (sibMid > 12 && sibMid >= vowel * 1.2) return 16; /* sh, ch */

    /* vowels: formant centroid picks the mouth shape */
    const binHz = mouthCtx.sampleRate / mouthAnalyser.fftSize;
    const lo = Math.max(1, Math.floor(200 / binHz));
    const hi = Math.min(freqData.length - 1, Math.ceil(2500 / binHz));
    let wsum = 0, csum = 0;
    for (let i = lo; i <= hi; i++) {
      const e = freqData[i];
      wsum += e;
      csum += e * i * binHz;
    }
    const centroid = wsum > 40 ? csum / wsum : 800;
    if (centroid < 620) return 8; /* back/rounded: oh, oo */
    if (centroid < 900) return 2; /* open: ah */
    if (centroid < 1200) return 4; /* mid: eh */
    return 6; /* front: ee */
  }
  function driveMouth() {
    if (!human || !mouthAnalyser) return;
    human.setSpeaking(true); /* jaw coupling only engages while speaking */
    const v = classifyViseme();
    const now = performance.now();
    if (v !== lastClass) {
      if (v === 0 || now - lastClassAt >= 90) {
        /* silence applies instantly; shapes hold >=90ms (syllable rate) */
        lastClass = v;
        lastClassAt = now;
      }
    }
    human.pushViseme(lastClass);
  }
  function mouthToSilence() {
    lowAvg = 0;
    lastClass = 0;
    if (human) { try { human.setSpeaking(false); human.pushViseme(0); } catch (e) { /* noop */ } }
  }
  /* Hot-swappable demo avatar: dispose the old model, load the new one. */
  let avatarLoading = null;
  function loadDemoAvatar(modelUrl) {
    if (avatarLoading) avatarLoading.cancelled = true;
    const ticket = { cancelled: false };
    avatarLoading = ticket;
    if (caption) caption.textContent = 'Loading opponent…';
    if (human) {
      try {
        scene.remove(human.group);
        if (typeof human.dispose === 'function') human.dispose();
      } catch (e) { /* noop */ }
      human = null;
    }
    mouthToSilence();
    createHumanAvatar(THREE, GLTFLoader, modelUrl,
        { faceYawDeg: 0 })
      .then(function (h) {
        if (ticket.cancelled) {
          try { if (typeof h.dispose === 'function') h.dispose(); } catch (e) { /* noop */ }
          return;
        }
        human = h;
        h.group.position.y = -0.05;
        scene.add(h.group);
        if (caption && !playing) caption.textContent = '';
        setOverlayForPersona();
      })
      .catch(function () {
        if (!ticket.cancelled && caption) caption.textContent = 'Avatar failed to load — check your connection and reload.';
      });
  }
  loadDemoAvatar(DEMO_PERSONAS[demoPersonaId].model);

  const clock = new THREE.Clock();

  function resize() {
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(resize).observe(frame);
  } else {
    window.addEventListener('resize', resize);
  }

  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (REDUCED_MOTION) {
      renderer.render(scene, camera);
      return;
    }

    if (human) human.update(dt, t);

    /* mouth tracks the real teaser audio; idle otherwise (no silent flapping) */
    if (playing && !REDUCED_MOTION) driveMouth();

    renderer.render(scene, camera);
  }
  tick();

/* ---- demo audio: one teaser per persona, click-to-play ---- */
  const audio = new Audio();
  audio.preload = 'auto';
  let playing = false;
  const probeCache = {}; /* personaId -> boolean */

  function currentPersona() { return DEMO_PERSONAS[demoPersonaId]; }

  function probeTeaser(src) {
    return new Promise(function (resolve) {
      const a = new Audio();
      let settled = false;
      const done = function (ok) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { a.src = ''; } catch (e) { /* noop */ }
        resolve(ok);
      };
      const timer = setTimeout(function () { done(false); }, 6000);
      a.addEventListener('canplaythrough', function () { done(true); }, { once: true });
      a.addEventListener('error', function () { done(false); }, { once: true });
      a.preload = 'auto';
      a.src = src;
    });
  }

  function ensureProbed() {
    const id = demoPersonaId;
    if (probeCache[id] !== undefined) return Promise.resolve(probeCache[id]);
    return probeTeaser(currentPersona().src).then(function (ok) {
      probeCache[id] = ok;
      return ok;
    });
  }

  function setOverlayForPersona() {
    if (!overlay || !playBtn) return;
    const id = demoPersonaId;
    const p = DEMO_PERSONAS[id];
    overlay.classList.remove('hidden');
    playBtn.innerHTML = '<span aria-hidden="true">▶</span> Hear ' + p.label;
    ensureProbed().then(function (ok) {
      if (id !== demoPersonaId || ok) return;
      if (caption) caption.textContent = 'Demo audio coming soon';
    });
  }

  function noAudio() {
    if (overlay) overlay.classList.add('hidden');
    if (caption) caption.textContent = 'Demo audio coming soon';
    mouthToSilence();
  }

  function wireAudio() {
    audio.addEventListener('playing', function () {
      playing = true;
      ensureMouthAnalyser();
      if (overlay) overlay.classList.add('hidden');
      if (caption) caption.textContent = currentPersona().caption;
    });
    audio.addEventListener('pause', function () {
      if (audio.ended) return;
      playing = false;
      mouthToSilence();
      if (caption) caption.textContent = 'Paused — tap to resume';
      if (overlay) overlay.classList.remove('hidden');
    });
    audio.addEventListener('ended', function () {
      playing = false;
      mouthToSilence();
      setOverlayForPersona();
    });
    audio.addEventListener('error', function () {
      playing = false;
      noAudio();
    });
  }

  function playCurrent() {
    const p = currentPersona();
    if (caption) caption.textContent = 'Loading ' + p.label + '…';
    audio.src = p.src;
    const pr = audio.play();
    if (pr && typeof pr.catch === 'function') {
      pr.catch(function () {
        /* autoplay blocked or load failed — leave overlay up */
        playing = false;
        mouthToSilence();
        if (caption) caption.textContent = 'Tap again to play';
        if (overlay) overlay.classList.remove('hidden');
      });
    }
  }

  function selectDemoPersona(id) {
    if (!DEMO_PERSONAS[id] || id === demoPersonaId) return;
    demoPersonaId = id;
    try { audio.pause(); } catch (e) { /* noop */ }
    audio.removeAttribute('src');
    playing = false;
    mouthToSilence();
    const tabs = document.getElementById('demoPersonaTabs');
    if (tabs) {
      tabs.querySelectorAll('.demo-persona-tab').forEach(function (btn) {
        const on = btn.getAttribute('data-demo-persona') === id;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    loadDemoAvatar(currentPersona().model);
  }

  if (playBtn) {
    wireAudio();
    playBtn.addEventListener('click', function () {
      if (playing) { audio.pause(); return; }
      if (caption) caption.textContent = 'Loading the demo…';
      const sameSrc = audio.src && audio.src.indexOf(currentPersona().src) !== -1;
      if (sameSrc && !audio.ended && audio.currentTime > 0) {
        /* resume a paused teaser */
        const pr = audio.play();
        if (pr && typeof pr.catch === 'function') {
          pr.catch(function () {
            if (caption) caption.textContent = 'Tap again to play';
          });
        }
        return;
      }
      ensureProbed().then(function (ok) {
        if (ok) { playCurrent(); }
        else { noAudio(); }
      });
    });
  } else if (caption) {
    ensureProbed().then(function (ok) {
      if (!ok) caption.textContent = 'Demo audio coming soon';
    });
  }

  /* persona tabs: hot-swap the opponent (model + voice) */
  const tabsEl = document.getElementById('demoPersonaTabs');
  if (tabsEl) {
    tabsEl.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-demo-persona]');
      if (btn) selectDemoPersona(btn.getAttribute('data-demo-persona'));
    });
  }
}

/* ================= boot ================= */
document.addEventListener('DOMContentLoaded', function () {
  /* Pricing: live API wins, hardcoded copy is the fallback. */
  loadLivePricing().then(function (live) {
    renderPricing(live || PRICING);
  });

  /* Practice modes: live API wins, hardcoded list is the fallback. */
  loadModes().then(renderModes);

  wireNav();
  observeReveals(document);

  /* The 3D opponent is 7-10 MB of model + three.js. Desktop: load it once the frame is near the
     viewport. Phones / slow or metered connections: show the play button and load on tap, so
     ad traffic doesn't pay for a download it may never scroll to. */
  var frame = document.getElementById('avatarFrame');
  var conn = navigator.connection || {};
  var light = window.matchMedia('(max-width: 640px)').matches || conn.saveData || /(^|[^\d])2g/.test(conn.effectiveType || '');
  var started = false;
  function startAvatar() { if (started) return; started = true; initAvatar(); }
  if (!frame) return;
  if (light) {
    var caption = document.getElementById('avatarCaption');
    if (caption) caption.textContent = 'Tap to load the 3D opponent';
    var playBtn = document.getElementById('playBtn');
    var kick = function (ev) { ev && ev.preventDefault(); if (caption) caption.textContent = 'Loading your opponent…'; startAvatar(); };
    if (playBtn) playBtn.addEventListener('click', kick, { once: true });
    frame.addEventListener('click', kick, { once: true });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); startAvatar(); }
    }, { rootMargin: '300px' });
    io.observe(frame);
  } else startAvatar();
});

/* Register the service worker (PWA installability + offline resilience). */
/* Service worker registration lives in /js/pwa-helper.js. */
