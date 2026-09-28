/**
 * AdversaryAI voice engine — the ONLY thing in the app allowed to play opponent audio.
 *
 * Why this exists: audio used to be played from three different places (a Web Audio
 * buffer path, an <audio> element fallback, and replay re-synthesis), each with its own
 * stop logic, so two voices could overlap. Now there is a single AudioContext, a single
 * output chain, and a generation counter: `stop()` bumps the generation and every
 * scheduled source from an older generation is silenced.
 *
 * Lip sync: Azure viseme events are stored on a track keyed to the AudioContext clock
 * (not setTimeout), so the mouth stays locked to what the listener actually hears —
 * including output latency (Bluetooth, etc.). Avatars pull `voice.frame()` every
 * animation frame.
 */

// ---------------------------------------------------------------- viseme tables
// Azure viseme id (0-21) → Oculus/ReadyPlayerMe viseme morph name.
export const AZURE_TO_OCULUS = [
  "viseme_sil", // 0 silence
  "viseme_aa", // 1 æ ə ʌ
  "viseme_aa", // 2 ɑ
  "viseme_O", // 3 ɔ
  "viseme_E", // 4 ɛ ʊ
  "viseme_RR", // 5 ɝ
  "viseme_I", // 6 j i ɪ
  "viseme_U", // 7 w u
  "viseme_O", // 8 o
  "viseme_aa", // 9 aʊ
  "viseme_O", // 10 ɔɪ
  "viseme_aa", // 11 aɪ
  "viseme_kk", // 12 h
  "viseme_RR", // 13 ɹ
  "viseme_nn", // 14 l
  "viseme_SS", // 15 s z
  "viseme_CH", // 16 ʃ tʃ dʒ ʒ
  "viseme_TH", // 17 ð
  "viseme_FF", // 18 f v
  "viseme_DD", // 19 d t n θ
  "viseme_kk", // 20 k g ŋ
  "viseme_PP", // 21 p b m
];
// Peak weight per viseme — full 1.0 on every shape looks cartoonish.
export const VISEME_GAIN = {
  viseme_sil: 0,
  viseme_aa: 0.85,
  viseme_O: 0.8,
  viseme_U: 0.75,
  viseme_E: 0.7,
  viseme_I: 0.6,
  viseme_RR: 0.6,
  viseme_nn: 0.6,
  viseme_SS: 0.65,
  viseme_CH: 0.75,
  viseme_TH: 0.6,
  viseme_FF: 0.85,
  viseme_DD: 0.6,
  viseme_kk: 0.55,
  viseme_PP: 1,
};
// How far the jaw opens for each shape (drives jawOpen on ARKit rigs).
export const VISEME_JAW = { viseme_aa: 0.55, viseme_O: 0.4, viseme_U: 0.25, viseme_E: 0.3, viseme_I: 0.18, viseme_CH: 0.2, viseme_RR: 0.2, viseme_TH: 0.12, viseme_DD: 0.15, viseme_kk: 0.18, viseme_nn: 0.12, viseme_SS: 0.08 };

// ---------------------------------------------------------------- engine
class VoiceEngine {
  constructor() {
    this.ctx = null;
    this.gain = null;
    this.analyser = null;
    this.freq = null;
    this.time = null;
    this.gen = 0;
    this.sources = new Set();
    this.track = []; // [{t (ctx seconds), name}]
    this.nextStart = 0;
    this.speakingUntil = 0;
    this.segs = []; // [{start, end, hasVis}] — which scheduled chunks carry Azure visemes
    this.listeners = new Set();
    this.lastUtterance = null; // {segments:[{buffer, visemes}]} for free local replay
    this._state = "idle";
    this._cls = { lowAvg: 0, last: 0, lastAt: 0, lastPlosiveAt: -1e9 };
  }

  get state() {
    return this._state;
  }
  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  _emit(state) {
    if (state === this._state) return;
    this._state = state;
    for (const fn of this.listeners) {
      try {
        fn(state);
      } catch {}
    }
  }

  ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("Web Audio unsupported");
      this.ctx = new AC({ latencyHint: "interactive" });
      this.gain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.45;
      this.gain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
      this.time = new Uint8Array(this.analyser.fftSize);
    }
    // Safari uses "interrupted" after a phone call / Siri; both need an explicit resume.
    if (this.ctx.state !== "running" && this.ctx.state !== "closed") this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** Call from a user gesture (click/tap) so iOS/Safari allow audio later. */
  unlock() {
    try {
      // iOS: play through the silent switch like a video would (Safari 16.4+).
      if (navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback";
    } catch {}
    try {
      const ctx = this.ensureContext();
      const b = ctx.createBuffer(1, 1, ctx.sampleRate);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start();
    } catch {}
  }

  /** The time the listener is actually hearing right now, in ctx seconds. */
  heardTime() {
    const ctx = this.ctx;
    if (!ctx) return 0;
    const lat = (typeof ctx.outputLatency === "number" ? ctx.outputLatency : 0) || ctx.baseLatency || 0;
    return ctx.currentTime - lat;
  }

  /** Silence everything immediately. Safe to call any time, any number of times. */
  stop() {
    this.gen++;
    for (const s of this.sources) {
      try {
        s.onended = null;
        s.stop();
      } catch {}
    }
    this.sources.clear();
    this.track = [];
    this.segs = [];
    this.nextStart = 0;
    this.speakingUntil = 0;
    this._emit("idle");
  }

  /** Stop and forget the last utterance (new session: Replay must not play the old voice). */
  reset() {
    this.stop();
    this.lastUtterance = null;
  }

  /** Start a new utterance. Stops anything already playing. */
  begin() {
    this.stop();
    this.ensureContext();
    const gen = this.gen;
    const segments = [];
    this.lastUtterance = { segments, complete: false };
    let pending = 0;
    let ended = false;
    let resolveDone;
    const done = new Promise((r) => (resolveDone = r));
    const finishIfDrained = () => {
      if (ended && pending === 0 && this.sources.size === 0 && gen === this.gen) {
        this._emit("idle");
        resolveDone(true);
      }
    };
    const self = this;
    // Chunks can finish decoding out of order; play them strictly in enqueue order.
    let chain = Promise.resolve();
    return {
      get active() {
        return gen === self.gen;
      },
      /** Queue one chunk of audio (encoded MP3/WAV) with optional Azure visemes [{id, ms}]. */
      enqueue(encoded, visemes = null) {
        if (gen !== self.gen) return Promise.resolve(false);
        pending++;
        const decoded = self.ctx.decodeAudioData(encoded.slice(0)).catch((e) => {
          console.warn("[voice] decode failed", e);
          return null;
        });
        const p = chain.then(async () => {
          try {
            const buffer = await decoded;
            if (!buffer || gen !== self.gen) return false;
            segments.push({ buffer, visemes });
            self._schedule(buffer, visemes, gen, finishIfDrained);
            return true;
          } finally {
            pending--;
            finishIfDrained();
          }
        });
        chain = p.catch(() => {});
        return p;
      },
      /** Queue already-decoded audio (used by replay). */
      enqueueDecoded(buffer, visemes = null) {
        if (gen !== self.gen) return false;
        segments.push({ buffer, visemes });
        self._schedule(buffer, visemes, gen, finishIfDrained);
        return true;
      },
      /** No more chunks are coming. */
      end() {
        ended = true;
        self.lastUtterance.complete = true;
        finishIfDrained();
      },
      done,
    };
  }

  _schedule(buffer, visemes, gen, onEnded) {
    const ctx = this.ctx;
    const start = Math.max(ctx.currentTime + 0.05, this.nextStart);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.gain);
    src.onended = () => {
      this.sources.delete(src);
      if (gen === this.gen) onEnded();
    };
    this.sources.add(src);
    src.start(start);
    this.nextStart = start + buffer.duration;
    this.speakingUntil = this.nextStart;
    const hasVis = !!(visemes && visemes.length);
    this.segs.push({ start, end: start + buffer.duration, hasVis });
    if (this.segs.length > 60) this.segs.splice(0, this.segs.length - 60);
    if (hasVis) {
      for (const v of visemes) this.track.push({ t: start + v.ms / 1000, name: AZURE_TO_OCULUS[v.id] || "viseme_sil" });
      this.track.push({ t: start + buffer.duration, name: "viseme_sil" });
    }
    // drop track entries that are long past to keep lookups cheap
    const cutoff = ctx.currentTime - 2;
    if (this.track.length > 400) this.track = this.track.filter((e) => e.t > cutoff);
    this._emit("speaking");
  }

  /** Replay the last utterance from memory — no network, no TTS cost. */
  replay() {
    const last = this.lastUtterance;
    if (!last || !last.segments.length) return null;
    const segs = last.segments.slice();
    const u = this.begin();
    for (const s of segs) u.enqueueDecoded(s.buffer, s.visemes);
    u.end();
    return u;
  }

  hasReplay() {
    return !!(this.lastUtterance && this.lastUtterance.segments.length);
  }

  /**
   * Per-animation-frame snapshot for avatars.
   * { speaking, level (0..1), viseme: {name, weight}, prev: {name, weight}, freq }
   */
  frame() {
    const out = { speaking: false, level: 0, viseme: null, prev: null, freq: null };
    const ctx = this.ctx;
    if (!ctx || !this.speakingUntil) return out;
    const heard = this.heardTime();
    // Judge "speaking" by what is audible (heard time), not by the context clock, so the
    // mouth doesn't close early on high-latency outputs like Bluetooth.
    out.speaking = heard < this.speakingUntil + 0.03;
    // loudness from the real output
    this.analyser.getByteTimeDomainData(this.time);
    let sum = 0;
    for (let i = 0; i < this.time.length; i++) {
      const d = (this.time[i] - 128) / 128;
      sum += d * d;
    }
    out.level = Math.min(1, Math.sqrt(sum / this.time.length) * 4.5);
    this.analyser.getByteFrequencyData(this.freq);
    out.freq = this.freq;
    if (!out.speaking) return out;

    const seg = this.segs.find((g) => heard >= g.start - 0.02 && heard < g.end + 0.02);
    if (seg && seg.hasVis && this.track.length) {
      // look slightly ahead: lips form a shape just before the sound comes out
      const t = heard + 0.035;
      let i = this._findIdx(t);
      if (i < 0) return out;
      const cur = this.track[i];
      const next = this.track[i + 1];
      const prev = this.track[i - 1];
      const span = next ? Math.max(0.02, next.t - cur.t) : 0.12;
      const into = Math.min(1, (t - cur.t) / Math.min(0.07, span));
      out.viseme = { name: cur.name, weight: into };
      out.prev = prev && heard - cur.t < 0.07 ? { name: prev.name, weight: 1 - into } : null;
      return out;
    }
    // Fallback (no viseme data): classify mouth shape from the spectrum
    out.viseme = { name: this._classify(), weight: 1 };
    return out;
  }

  _findIdx(t) {
    const tr = this.track;
    let lo = 0,
      hi = tr.length - 1,
      ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (tr[mid].t <= t) {
        ans = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return ans;
  }

  _classify() {
    const f = this.freq;
    const binHz = this.ctx.sampleRate / this.analyser.fftSize;
    const band = (lo, hi) => {
      const a = Math.max(1, Math.floor(lo / binHz));
      const b = Math.min(f.length - 1, Math.ceil(hi / binHz));
      let s = 0;
      for (let i = a; i <= b; i++) s += f[i];
      return s / Math.max(1, b - a + 1);
    };
    const c = this._cls;
    const now = performance.now();
    const total = band(90, 8000);
    let id;
    if (total < 14) {
      c.lowAvg *= 0.9;
      id = 0;
    } else {
      const vowel = band(150, 1100);
      const sibHi = band(5500, 8000);
      const sibMid = band(2600, 5200);
      const low = band(90, 320);
      if (c.lowAvg > 4 && low > 3 * c.lowAvg && low > 20 && now - c.lastPlosiveAt > 160) {
        id = 21;
        c.lastPlosiveAt = now;
        c.lowAvg = low;
      } else {
        c.lowAvg += (low - c.lowAvg) * 0.12;
        if (sibHi > 14 && sibHi >= vowel) id = 15;
        else if (sibMid > 12 && sibMid >= vowel * 1.2) id = 16;
        else {
          let num = 0,
            den = 0;
          const a = Math.max(1, Math.floor(200 / binHz)),
            b = Math.min(f.length - 1, Math.ceil(2500 / binHz));
          for (let i = a; i <= b; i++) {
            num += f[i] * i * binHz;
            den += f[i];
          }
          const centroid = den > 40 ? num / den : 800;
          id = centroid < 620 ? 8 : centroid < 900 ? 2 : centroid < 1200 ? 4 : 6;
        }
      }
    }
    if (id !== c.last && (id === 0 || now - c.lastAt >= 80)) {
      c.last = id;
      c.lastAt = now;
    }
    return AZURE_TO_OCULUS[c.last] || "viseme_sil";
  }
}

export const voice = new VoiceEngine();
if (typeof window !== "undefined") {
  window.__voice = voice;
  // Leaving the page or backgrounding the tab must never leave a voice talking.
  window.addEventListener("pagehide", () => voice.stop());
}

// ---------------------------------------------------------------- Azure TTS (browser SDK)
const SDK_URL = "/app/vendor/speech-sdk.min.js";
let sdkPromise = null;
let sdkFailedAt = 0;
/** Resolves to window.SpeechSDK or null if the SDK is not deployed/blocked. */
export function loadSpeechSdk() {
  if (window.SpeechSDK) return Promise.resolve(window.SpeechSDK);
  if (sdkPromise) return sdkPromise;
  if (Date.now() - sdkFailedAt < 5 * 60 * 1000) return Promise.resolve(null);
  sdkPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    const t = setTimeout(() => resolve(null), 10000);
    s.onload = () => {
      clearTimeout(t);
      resolve(window.SpeechSDK || null);
    };
    s.onerror = () => {
      clearTimeout(t);
      resolve(null);
    };
    document.head.appendChild(s);
  }).then((sdk) => {
    if (!sdk) {
      sdkPromise = null; // allow a retry later, but don't hammer a missing file every turn
      sdkFailedAt = Date.now();
    }
    return sdk;
  });
  return sdkPromise;
}

let tokenCache = null; // {token, region, at}
export async function getSpeechToken() {
  if (tokenCache && Date.now() - tokenCache.at < 8 * 60 * 1000) return tokenCache;
  const res = await fetch("/api/speech/token", { method: "POST", credentials: "include" });
  if (!res.ok) throw new Error(`token http ${res.status}`);
  const j = await res.json();
  if (!j.token || !j.region) throw new Error("token malformed");
  tokenCache = { token: j.token, region: j.region, at: Date.now() };
  return tokenCache;
}

function escXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
export function buildSsml(text, v) {
  const inner = v.style
    ? `<mstts:express-as style="${v.style}"${v.styleDegree ? ` styledegree="${v.styleDegree}"` : ""}>${escXml(text)}</mstts:express-as>`
    : escXml(text);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${v.voice}">${inner}</voice></speak>`;
}

/** Synthesize one chunk of text → {audio: ArrayBuffer, visemes:[{id, ms}]}. */
export async function synthesize(sdk, text, voiceCfg) {
  const { token, region } = await getSpeechToken();
  const cfg = sdk.SpeechConfig.fromAuthorizationToken(token, region);
  cfg.speechSynthesisVoiceName = voiceCfg.voice;
  cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
  const stream = sdk.AudioOutputStream.createPullStream();
  const synth = new sdk.SpeechSynthesizer(cfg, sdk.AudioConfig.fromStreamOutput(stream));
  const visemes = [];
  synth.visemeReceived = (_s, e) => visemes.push({ id: e.visemeId, ms: e.audioOffset / 1e4 });
  try {
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("synthesis timeout")), 10000);
      synth.speakSsmlAsync(
        buildSsml(text, voiceCfg),
        (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        (err) => {
          clearTimeout(timer);
          reject(new Error(String(err || "synthesis error")));
        },
      );
    });
    if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted || !result.audioData?.byteLength) {
      throw new Error("synthesis failed: " + (result.errorDetails || result.reason));
    }
    return { audio: result.audioData, visemes };
  } finally {
    try {
      synth.close();
    } catch {}
  }
}

/**
 * Speak text that arrives as a token stream. Sentences are synthesized with one
 * sentence of look-ahead and scheduled back-to-back on the audio clock.
 *
 * onFallback(offset) is called once if the SDK fails; `offset` is the character
 * index in the full reply from which audio is still missing, so the caller can ask
 * the server for exactly that remainder (never replaying what was already heard).
 */
export function createStreamingSpeaker({ voiceCfg, onFallback, transform = (x) => x }) {
  const utter = voice.begin();
  const queue = []; // {text, offset}
  let buffer = "";
  let consumed = 0; // chars of the reply already handed to `queue`
  let finished = false;
  let failed = false;
  let pumping = false;
  let cancelled = false;

  const splitSentences = (force) => {
    const re = /[.!?…]+["'”’)\]]*\s+/g;
    let m,
      cut = 0;
    while ((m = re.exec(buffer)) !== null) {
      // don't split into tiny fragments ("Dr. " etc.) — need ≥ 25 chars per chunk
      if (m.index + m[0].length - cut >= 25) {
        const piece = buffer.slice(cut, m.index + m[0].length);
        queue.push({ text: piece.trim(), offset: consumed + cut });
        cut = m.index + m[0].length;
      }
    }
    if (buffer.length - cut > 420) {
      const sp = buffer.lastIndexOf(" ", cut + 360);
      const end = sp > cut + 150 ? sp : cut + 360;
      queue.push({ text: buffer.slice(cut, end).trim(), offset: consumed + cut });
      cut = end;
    }
    if (force && buffer.slice(cut).trim()) {
      queue.push({ text: buffer.slice(cut).trim(), offset: consumed + cut });
      cut = buffer.length;
    }
    buffer = buffer.slice(cut);
    consumed += cut;
  };

  const fail = (offset, anchor = "") => {
    if (failed || cancelled) return;
    failed = true;
    queue.length = 0;
    onFallback?.(offset, utter, anchor);
  };

  const pump = async () => {
    if (pumping || failed || cancelled) return;
    pumping = true;
    try {
      const sdk = await loadSpeechSdk();
      if (!sdk) return fail(queue[0]?.offset ?? consumed, queue[0] ? transform(queue[0].text) : "");
      let ahead = null; // {item, promise}
      const start = (item) => ({ item, promise: synthesize(sdk, transform(item.text), voiceCfg) });
      while (!cancelled && utter.active) {
        if (!ahead) {
          const item = queue.shift();
          if (!item) break;
          ahead = start(item);
        }
        const cur = ahead;
        ahead = null;
        const nextItem = queue.shift();
        if (nextItem) ahead = start(nextItem);
        let res;
        try {
          res = await cur.promise;
        } catch (e) {
          console.warn("[voice] SDK synthesis failed, falling back", e);
          ahead?.promise.catch(() => {});
          return fail(cur.item.offset, transform(cur.item.text));
        }
        if (cancelled || !utter.active) return;
        const ok = await utter.enqueue(res.audio, res.visemes);
        if (!ok && utter.active && !cancelled) {
          ahead?.promise.catch(() => {});
          return fail(cur.item.offset, transform(cur.item.text));
        }
      }
    } finally {
      pumping = false;
      if (!failed && !cancelled && queue.length) pump();
      else if (!failed && !cancelled && finished && !queue.length) utter.end();
    }
  };

  return {
    utter,
    push(tok) {
      if (cancelled || failed) return;
      buffer += tok;
      splitSentences(false);
      if (queue.length) pump();
    },
    finish() {
      if (cancelled) return;
      finished = true;
      splitSentences(true);
      if (failed) return;
      if (queue.length) pump();
      else if (!pumping) utter.end();
    },
    cancel() {
      cancelled = true;
      queue.length = 0;
    },
    get failed() {
      return failed;
    },
  };
}
