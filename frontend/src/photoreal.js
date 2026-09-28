/**
 * Champion photoreal opponent — HeyGen LiveAvatar in LITE mode.
 *
 * Our pipeline stays the same (DeepSeek → Azure TTS in the browser). Instead of playing
 * that audio locally, the voice engine hands each sentence to this sink as 24 kHz PCM;
 * LiveAvatar renders a lip-synced video of a real-looking person and streams it back
 * over WebRTC (LiveKit), with the audio inside the video. So there's still exactly one
 * voice — it just comes out of the video.
 *
 * Cost control: the server meters minutes (heartbeats) and caps session length; we also
 * close the stream after IDLE_MS without speech and reopen it when the user speaks again.
 * Any failure → we detach and the 3D/portrait avatar with local audio carries on.
 */
import { voice } from "./voice.js";

const LK_LOCAL = "/app/vendor/livekit-client.umd.js";
const LK_CDN = "https://cdn.jsdelivr.net/npm/livekit-client@2.15.7/dist/livekit-client.umd.js";
const IDLE_MS = 120000;
const HEARTBEAT_MS = 30000;

let lkPromise = null;
function loadScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}
function loadLivekit() {
  if (window.LivekitClient) return Promise.resolve(window.LivekitClient);
  if (!lkPromise)
    lkPromise = (async () => {
      if ((await loadScript(LK_LOCAL)) && window.LivekitClient) return window.LivekitClient;
      if ((await loadScript(LK_CDN)) && window.LivekitClient) return window.LivekitClient;
      lkPromise = null;
      return null;
    })();
  return lkPromise;
}

export async function fetchPhotorealStatus(debateId) {
  try {
    const r = await fetch(`/api/avatar/status?debateId=${encodeURIComponent(debateId)}`, { credentials: "include" });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export class PhotorealAvatar {
  /**
   * @param {{stage: HTMLElement, debateId: string, onStatus?: (s: {state: string, remainingSeconds?: number, error?: string}) => void}} o
   */
  constructor({ stage, debateId, onStatus }) {
    this.stage = stage;
    this.debateId = debateId;
    this.onStatus = onStatus || (() => {});
    this.ready = false;
    this.talking = false;
    this.disposed = false;
    this.starting = null;
    this.lastActivity = Date.now();
    this.video = document.createElement("video");
    this.video.playsInline = true;
    this.video.autoplay = true;
    this.video.setAttribute("playsinline", "");
    this.video.className = "photoreal-video";
    stage.appendChild(this.video);
    this.idleTimer = setInterval(() => {
      if (this.ready && !this.talking && voice.state === "idle" && Date.now() - this.lastActivity > IDLE_MS) this.sleep();
    }, 10000);
  }

  /** Something is about to happen (user typing/sending) — keep or reopen the stream. */
  touch() {
    this.lastActivity = Date.now();
    if (!this.ready && !this.starting && !this.disposed && !this.exhausted) this.start().catch(() => {});
  }

  start() {
    if (this.starting) return this.starting;
    this.starting = this._start()
      .catch((e) => {
        console.warn("[photoreal] unavailable:", e?.message || e);
        this._teardown(false);
        this.onStatus({ state: "error", error: e?.code || "photoreal_unavailable", detail: e?.detail });
        if (e?.code === "video_minutes_exhausted" || e?.code === "champion_required") this.exhausted = true;
      })
      .finally(() => {
        this.starting = null;
      });
    return this.starting;
  }

  async _start() {
    this.onStatus({ state: "connecting" });
    const r = await fetch("/api/avatar/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debateId: this.debateId }),
    });
    const s = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(s.error || "session"), { code: s.error, detail: s.detail });
    if (this.disposed) return;
    this.token = s.sessionToken;
    this.sessionId = s.sessionId;
    this.api = s.apiUrl;
    this.remaining = s.remainingSeconds;
    const info = await this._api("/v1/sessions/start");
    const LK = await loadLivekit();
    if (!LK) throw new Error("livekit_unavailable");
    if (this.disposed) return this._teardown(true);

    // Video + audio from the "heygen" participant
    this.room = new LK.Room({ adaptiveStream: false, dynacast: false });
    const gotVideo = new Promise((resolve) => {
      this.room.on(LK.RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        if (participant.identity !== "heygen") return;
        track.attach(this.video);
        if (track.kind === "video") this.vTrack = track;
        if (track.kind === "audio") this.aTrack = track;
        if (track.kind === "video") resolve(true);
      });
    });
    this.room.on(LK.RoomEvent.Disconnected, () => this._lost("room_disconnected"));
    await this.room.connect(info.livekit_url, info.livekit_client_token);

    // Command channel (LITE mode)
    if (!info.ws_url) throw new Error("no_ws_url");
    this.ws = new WebSocket(info.ws_url);
    const wsReady = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("ws_timeout")), 15000);
      this.ws.onmessage = (ev) => {
        let m = null;
        try {
          m = JSON.parse(ev.data);
        } catch {
          return;
        }
        this._onEvent(m);
        if (m.type === "session.state_updated" && m.state === "connected") {
          clearTimeout(t);
          resolve();
        }
      };
      this.ws.onerror = () => {};
      this.ws.onclose = () => {
        clearTimeout(t);
        this._lost("ws_closed");
        reject(new Error("ws_closed"));
      };
      // Some deployments don't emit session.state_updated; treat "open + video" as ready.
      this.ws.onopen = () => setTimeout(() => (clearTimeout(t), resolve()), 2500);
    });
    await Promise.all([wsReady, Promise.race([gotVideo, new Promise((_, rej) => setTimeout(() => rej(new Error("video_timeout")), 20000))])]);
    if (this.disposed) return this._teardown(true);

    // Autoplay with sound needs a user gesture on some browsers.
    try {
      this.video.muted = false;
      await this.video.play();
    } catch {
      this.onStatus({ state: "needs_tap" });
      await new Promise((resolve) => {
        const go = () => {
          this.video.play().then(resolve, resolve);
          this.stage.removeEventListener("click", go);
        };
        this.stage.addEventListener("click", go);
      });
    }
    this.ready = true;
    this.stage.classList.add("photoreal-live");
    voice.setSink(this); // takes effect at the next utterance
    this.beat = setInterval(() => this._heartbeat(), HEARTBEAT_MS);
    this.keep = setInterval(() => this._send({ type: "session.keep_alive" }), 60000);
    this._startAvSync();
    this.onStatus({ state: "live", remainingSeconds: this.remaining });
  }

  _onEvent(m) {
    switch (m.type) {
      case "agent.speak_started":
        this.talking = true;
        this.lastActivity = Date.now();
        break;
      case "agent.speak_ended":
      case "agent.speak_interrupted":
        this.talking = false;
        this.lastActivity = Date.now();
        break;
      case "agent.state_updated":
        this.talking = m.new_state === "talking";
        break;
      case "session.state_updated":
        if (m.state === "disconnected") this._lost("server_disconnected");
        break;
      case "error":
        console.warn("[photoreal] server error", m.error);
        break;
    }
  }

  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }
  // ---- sink interface used by voice.js
  speak(eventId, chunks) {
    this.lastActivity = Date.now();
    for (const audio of chunks) this._send({ type: "agent.speak", event_id: eventId, audio });
  }
  speakEnd(eventId) {
    this._send({ type: "agent.speak_end", event_id: eventId });
  }
  interrupt() {
    this.talking = false;
    this._send({ type: "agent.interrupt" });
  }

  /**
   * Lip-sync alignment. The avatar's audio and video arrive as separate WebRTC tracks with
   * separate jitter buffers, and audio usually plays out ahead of the video (voice slightly
   * before the lips). Every 2 s we measure how long each track is being held (jitter buffer +
   * video decode) and ask the browser to hold the audio for as long as the video.
   */
  _startAvSync() {
    clearInterval(this.avSync);
    const prev = { v: null, a: null };
    const sample = async (track, key) => {
      const rx = track?.receiver;
      if (!rx?.getStats) return null;
      let cur = null;
      (await rx.getStats()).forEach((st) => {
        if (st.type === "inbound-rtp") cur = { jb: st.jitterBufferDelay || 0, n: st.jitterBufferEmittedCount || 0, dec: st.totalDecodeTime || 0, fr: st.framesDecoded || 0 };
      });
      if (!cur) return null;
      const p = prev[key];
      prev[key] = cur;
      if (!p || cur.n <= p.n) return null;
      const jb = (cur.jb - p.jb) / (cur.n - p.n);
      const dec = cur.fr > p.fr ? (cur.dec - p.dec) / (cur.fr - p.fr) : 0;
      return jb + dec; // seconds
    };
    let target = 0;
    this.avSync = setInterval(async () => {
      try {
        const [v, a] = await Promise.all([sample(this.vTrack, "v"), sample(this.aTrack, "a")]);
        const rx = this.aTrack?.receiver;
        if (v == null || a == null || !rx) return;
        // Video delay + one frame of render, clamped; smoothed so it doesn't wobble.
        const want = Math.max(0, Math.min(400, Math.round((v + 0.02) * 1000)));
        const next = target ? Math.round(target * 0.6 + want * 0.4) : want;
        if (Math.abs(next - target) < 15) return;
        target = next;
        if ("jitterBufferTarget" in rx) rx.jitterBufferTarget = target;
        else if ("playoutDelayHint" in rx) rx.playoutDelayHint = target / 1000;
      } catch {}
    }, 2000);
  }

  async _api(path) {
    const r = await fetch(`${this.api}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || (j.code !== undefined && j.code !== 1000)) throw new Error(j.message || `liveavatar ${path} ${r.status}`);
    return j.data ?? j;
  }
  async _heartbeat() {
    try {
      const r = await fetch("/api/avatar/heartbeat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: this.sessionId }),
      });
      const j = await r.json();
      this.remaining = j.remainingSeconds;
      this.onStatus({ state: "live", remainingSeconds: j.remainingSeconds });
      if (j.stop) {
        this.exhausted = true;
        this.sleep();
        this.onStatus({ state: "error", error: "video_minutes_exhausted" });
      }
    } catch {}
  }

  _lost(why) {
    if (!this.ready && !this.room) return;
    console.warn("[photoreal] stream lost:", why);
    this._teardown(true);
    if (!this.disposed) this.onStatus({ state: "off" });
  }

  /** Close the stream to stop billing; `touch()` reopens it. */
  sleep() {
    this._teardown(true);
    if (!this.disposed && !this.exhausted) this.onStatus({ state: "sleeping" });
  }

  _teardown(notifyServer) {
    const wasLive = this.ready || this.room || this.ws;
    this.ready = false;
    this.talking = false;
    if (voice.sink === this || voice.pendingSink === this) voice.setSink(null);
    this.stage.classList.remove("photoreal-live");
    clearInterval(this.beat);
    clearInterval(this.keep);
    clearInterval(this.avSync);
    this.vTrack = this.aTrack = null;
    try {
      if (this.ws) {
        this.ws.onclose = null;
        this.ws.onmessage = null;
        this.ws.close();
      }
    } catch {}
    this.ws = null;
    try {
      this.room?.removeAllListeners?.();
      this.room?.disconnect();
    } catch {}
    this.room = null;
    try {
      this.video.srcObject = null;
    } catch {}
    if (notifyServer && wasLive && this.token) {
      fetch(`${this.api}/v1/sessions/stop`, { method: "POST", keepalive: true, headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" } }).catch(() => {});
      fetch("/api/avatar/end", { method: "POST", keepalive: true, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: this.sessionId }) }).catch(() => {});
    }
    this.token = null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    clearInterval(this.idleTimer);
    this._teardown(true);
    this.video.remove();
  }
}
