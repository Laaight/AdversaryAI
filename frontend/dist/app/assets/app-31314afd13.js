var Jd=["viseme_sil","viseme_aa","viseme_aa","viseme_O","viseme_E","viseme_RR","viseme_I","viseme_U","viseme_O","viseme_aa","viseme_O","viseme_aa","viseme_kk","viseme_RR","viseme_nn","viseme_SS","viseme_CH","viseme_TH","viseme_FF","viseme_DD","viseme_kk","viseme_PP"],eu={viseme_sil:0,viseme_aa:.85,viseme_O:.8,viseme_U:.75,viseme_E:.7,viseme_I:.6,viseme_RR:.6,viseme_nn:.6,viseme_SS:.65,viseme_CH:.75,viseme_TH:.6,viseme_FF:.85,viseme_DD:.6,viseme_kk:.55,viseme_PP:1},tu={viseme_aa:.55,viseme_O:.4,viseme_U:.25,viseme_E:.3,viseme_I:.18,viseme_CH:.2,viseme_RR:.2,viseme_TH:.12,viseme_DD:.15,viseme_kk:.18,viseme_nn:.12,viseme_SS:.08},_l=class{constructor(){this.ctx=null,this.gain=null,this.analyser=null,this.freq=null,this.time=null,this.gen=0,this.sources=new Set,this.track=[],this.nextStart=0,this.speakingUntil=0,this.segs=[],this.sink=null,this.pendingSink=void 0,this.remote=!1,this.utterId="",this.sinkChain=Promise.resolve(),this.listeners=new Set,this.blockedListeners=new Set,this.lastUtterance=null,this._state="idle",this._cls={lowAvg:0,last:0,lastAt:0,lastPlosiveAt:-1e9}}get state(){return this._state}on(e){return this.listeners.add(e),()=>this.listeners.delete(e)}_emit(e){if(e!==this._state){this._state=e;for(let t of this.listeners)try{t(e)}catch{}}}onBlocked(e){return this.blockedListeners.add(e),()=>this.blockedListeners.delete(e)}_blocked(e=!0){for(let t of this.blockedListeners)try{t(e)}catch{}}_checkBlocked(){let e=this.ctx;e&&e.state!=="running"&&e.state!=="closed"&&this._state==="speaking"&&this._blocked(!0)}ensureContext(){if(!this.ctx){let e=window.AudioContext||window.webkitAudioContext;if(!e)throw new Error("Web Audio unsupported");this.ctx=new e({latencyHint:"interactive"}),this.gain=this.ctx.createGain(),this.analyser=this.ctx.createAnalyser(),this.analyser.fftSize=1024,this.analyser.smoothingTimeConstant=.45,this.gain.connect(this.analyser),this.analyser.connect(this.ctx.destination),this.freq=new Uint8Array(this.analyser.frequencyBinCount),this.time=new Uint8Array(this.analyser.fftSize),this.ctx.onstatechange=()=>this.ctx?.state==="running"&&this._blocked(!1)}return this.ctx.state!=="running"&&this.ctx.state!=="closed"&&this.ctx.resume().catch(()=>{}),this.ctx}unlock(){try{navigator.audioSession&&navigator.audioSession.type!=="playback"&&(navigator.audioSession.type="playback")}catch{}try{let e=this.ensureContext(),t=e.createBuffer(1,1,e.sampleRate),i=e.createBufferSource();i.buffer=t,i.connect(e.destination),i.start()}catch{}}heardTime(){let e=this.ctx;if(!e)return 0;let t=(typeof e.outputLatency=="number"?e.outputLatency:0)||e.baseLatency||0;return e.currentTime-t}stop(){if(this.gen++,this.remote)try{this.sink?.interrupt()}catch{}this.remote=!1;for(let e of this.sources)try{e.onended=null,e.stop()}catch{}this.sources.clear(),this.track=[],this.segs=[],this.nextStart=0,this.speakingUntil=0,this._emit("idle")}reset(){this.stop(),this.lastUtterance=null}begin(){this.stop(),this.ensureContext(),this.pendingSink!==void 0&&(this.sink=this.pendingSink,this.pendingSink=void 0),this.remote=!!(this.sink&&this.sink.ready),this.utterId=Qp(),this.sinkChain=Promise.resolve(),this.gain.gain.value=this.remote?0:1;let e=this.gen,t=[];this.lastUtterance={segments:t,complete:!1};let i=0,n=!1,s,a=new Promise(d=>s=d),o=()=>{if(n&&i===0&&this.sources.size===0&&e===this.gen){let d=()=>{e===this.gen&&(this._emit("idle"),s(!0))};this.remote&&this.sink?this._whenRemoteQuiet(e,d):d()}},l=this,c=Promise.resolve();return{get active(){return e===l.gen},enqueue(d,u=null){if(e!==l.gen)return Promise.resolve(!1);i++;let h=l.ctx.decodeAudioData(d.slice(0)).catch(g=>(console.warn("[voice] decode failed",g),null)),p=c.then(async()=>{try{let g=await h;return!g||e!==l.gen?!1:(t.push({buffer:g,visemes:u}),l._schedule(g,u,e,o),!0)}finally{i--,o()}});return c=p.catch(()=>{}),p},enqueueDecoded(d,u=null){return e!==l.gen?!1:(t.push({buffer:d,visemes:u}),l._schedule(d,u,e,o),!0)},end(){if(!n&&l.remote&&e===l.gen){let d=l.utterId;l.sinkChain=l.sinkChain.then(()=>l.sink?.speakEnd(d)).catch(()=>{})}n=!0,l.lastUtterance.complete=!0,o()},done:a}}_schedule(e,t,i,n){let s=this.ctx,a=Math.max(s.currentTime+.05,this.nextStart),o=s.createBufferSource();if(o.buffer=e,o.connect(this.gain),o.onended=()=>{this.sources.delete(o),i===this.gen&&n()},this.sources.add(o),o.start(a),this.remote&&this.sink){let d=this.utterId;this.sinkChain=this.sinkChain.then(()=>em(e)).then(u=>i===this.gen&&this.remote&&this.sink?.speak(d,u)).catch(u=>console.warn("[voice] photoreal send failed",u))}this.nextStart=a+e.duration,this.speakingUntil=this.nextStart;let l=!!(t&&t.length);if(this.segs.push({start:a,end:a+e.duration,hasVis:l}),this.segs.length>60&&this.segs.splice(0,this.segs.length-60),l){for(let d of t)this.track.push({t:a+d.ms/1e3,name:Jd[d.id]||"viseme_sil"});this.track.push({t:a+e.duration,name:"viseme_sil"})}let c=s.currentTime-2;this.track.length>400&&(this.track=this.track.filter(d=>d.t>c)),s.state!=="running"&&(s.resume().catch(()=>{}),clearTimeout(this._blockT),this._blockT=setTimeout(()=>this._checkBlocked(),600)),this._emit("speaking")}replay(){let e=this.lastUtterance;if(!e||!e.segments.length)return null;let t=e.segments.slice(),i=this.begin();for(let n of t)i.enqueueDecoded(n.buffer,n.visemes);return i.end(),i}setSink(e){if(!e&&this.sink){this.gain&&(this.gain.gain.value=1),this.remote=!1,this.sink=null,this.pendingSink=void 0;return}this.pendingSink=e}_whenRemoteQuiet(e,t){let i=performance.now(),n=()=>{if(e!==this.gen)return;(!this.sink||!this.sink.talking)&&performance.now()-i>300||performance.now()-i>8e3?t():setTimeout(n,120)};setTimeout(n,120)}hasReplay(){return!!(this.lastUtterance&&this.lastUtterance.segments.length)}frame(){let e={speaking:!1,level:0,viseme:null,prev:null,freq:null};if(!this.ctx||!this.speakingUntil)return e;let i=this.heardTime();e.speaking=i<this.speakingUntil+.03,this.analyser.getByteTimeDomainData(this.time);let n=0;for(let a=0;a<this.time.length;a++){let o=(this.time[a]-128)/128;n+=o*o}if(e.level=Math.min(1,Math.sqrt(n/this.time.length)*4.5),this.analyser.getByteFrequencyData(this.freq),e.freq=this.freq,!e.speaking)return e;let s=this.segs.find(a=>i>=a.start-.02&&i<a.end+.02);if(s&&s.hasVis&&this.track.length){let a=i+.035,o=this._findIdx(a);if(o<0)return e;let l=this.track[o],c=this.track[o+1],d=this.track[o-1],u=c?Math.max(.02,c.t-l.t):.12,h=Math.min(1,(a-l.t)/Math.min(.07,u));return e.viseme={name:l.name,weight:h},e.prev=d&&i-l.t<.07?{name:d.name,weight:1-h}:null,e}return e.viseme={name:this._classify(),weight:1},e}_findIdx(e){let t=this.track,i=0,n=t.length-1,s=-1;for(;i<=n;){let a=i+n>>1;t[a].t<=e?(s=a,i=a+1):n=a-1}return s}_classify(){let e=this.freq,t=this.ctx.sampleRate/this.analyser.fftSize,i=(l,c)=>{let d=Math.max(1,Math.floor(l/t)),u=Math.min(e.length-1,Math.ceil(c/t)),h=0;for(let p=d;p<=u;p++)h+=e[p];return h/Math.max(1,u-d+1)},n=this._cls,s=performance.now(),a=i(90,8e3),o;if(a<14)n.lowAvg*=.9,o=0;else{let l=i(150,1100),c=i(5500,8e3),d=i(2600,5200),u=i(90,320);if(n.lowAvg>4&&u>3*n.lowAvg&&u>20&&s-n.lastPlosiveAt>160)o=21,n.lastPlosiveAt=s,n.lowAvg=u;else if(n.lowAvg+=(u-n.lowAvg)*.12,c>14&&c>=l)o=15;else if(d>12&&d>=l*1.2)o=16;else{let h=0,p=0,g=Math.max(1,Math.floor(200/t)),v=Math.min(e.length-1,Math.ceil(2500/t));for(let f=g;f<=v;f++)h+=e[f]*f*t,p+=e[f];let m=p>40?h/p:800;o=m<620?8:m<900?2:m<1200?4:6}}return o!==n.last&&(o===0||s-n.lastAt>=80)&&(n.last=o,n.lastAt=s),Jd[n.last]||"viseme_sil"}};function Qp(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)}async function em(r){let t=Math.max(1,Math.ceil(r.duration*24e3)),i=window.OfflineAudioContext||window.webkitOfflineAudioContext,n=new i(1,t,24e3),s=n.createBufferSource();s.buffer=r,s.connect(n.destination),s.start();let o=(await n.startRendering()).getChannelData(0),l=[];for(let c=0;c<o.length;){let d=c===0?Math.round(9600):24e3,u=Math.min(d,o.length-c),h=new Uint8Array(u*2),p=new DataView(h.buffer);for(let v=0;v<u;v++){let m=Math.max(-1,Math.min(1,o[c+v]));p.setInt16(v*2,m<0?m*32768:m*32767,!0)}let g="";for(let v=0;v<h.length;v+=32768)g+=String.fromCharCode.apply(null,h.subarray(v,v+32768));l.push(btoa(g)),c+=u}return l}var ke=new _l;if(typeof window<"u"){window.__voice=ke,window.addEventListener("pagehide",()=>ke.stop());let r=()=>{let t=ke.ctx;document.visibilityState!=="visible"||!t||t.state==="running"||t.state==="closed"||(t.resume().catch(()=>{}),setTimeout(()=>ke._checkBlocked(),400))};document.addEventListener("visibilitychange",r),window.addEventListener("pageshow",r),window.addEventListener("focus",r);let e=()=>{let t=ke.ctx;t&&t.state!=="running"&&t.state!=="closed"&&t.resume().catch(()=>{})};document.addEventListener("touchend",e,{capture:!0,passive:!0}),document.addEventListener("click",e,{capture:!0,passive:!0})}var tm="/app/vendor/speech-sdk.min.js",rs=null,yl=0;function iu(){return!window.SpeechSDK&&Date.now()-yl<300*1e3}function na(){return window.SpeechSDK?Promise.resolve(window.SpeechSDK):rs||(Date.now()-yl<300*1e3?Promise.resolve(null):(rs=new Promise(r=>{let e=document.createElement("script");e.src=tm,e.async=!0;let t=setTimeout(()=>r(null),1e4);e.onload=()=>{clearTimeout(t),r(window.SpeechSDK||null)},e.onerror=()=>{clearTimeout(t),r(null)},document.head.appendChild(e)}).then(r=>(r||(rs=null,yl=Date.now()),r)),rs))}var xl={},ns={};async function ru(r=!1){let e=r?"hd":"std",t=xl[e];return t&&Date.now()-t.at<480*1e3?t:(ns[e]||(ns[e]=(async()=>{let i=await fetch(`/api/speech/token${r?"?hd=1":""}`,{method:"POST",credentials:"include"});if(!i.ok)throw new Error(`token http ${i.status}`);let n=await i.json();if(!n.token||!n.region)throw new Error("token malformed");return xl[e]={token:n.token,region:n.region,at:Date.now()},xl[e]})().finally(()=>delete ns[e])),ns[e])}function Qd(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}function im(r,e){let t=e.style&&!e.hd?`<mstts:express-as style="${e.style}"${e.styleDegree?` styledegree="${e.styleDegree}"`:""}>${Qd(r)}</mstts:express-as>`:Qd(r);return`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${e.voice}">${t}</voice></speak>`}async function rm(r,e,t,i=1e4){let{token:n,region:s}=await ru(!!t.hd),a=r.SpeechConfig.fromAuthorizationToken(n,s);a.speechSynthesisVoiceName=t.voice,a.speechSynthesisOutputFormat=r.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;let o=r.AudioOutputStream.createPullStream(),l=new r.SpeechSynthesizer(a,r.AudioConfig.fromStreamOutput(o)),c=[];l.visemeReceived=(d,u)=>c.push({id:u.visemeId,ms:u.audioOffset/1e4});try{let d=await new Promise((u,h)=>{let p=setTimeout(()=>h(new Error("synthesis timeout")),i);l.speakSsmlAsync(im(e,t),g=>{clearTimeout(p),u(g)},g=>{clearTimeout(p),h(new Error(String(g||"synthesis error")))})});if(d.reason!==r.ResultReason.SynthesizingAudioCompleted||!d.audioData?.byteLength)throw new Error("synthesis failed: "+(d.errorDetails||d.reason));return{audio:d.audioData,visemes:c}}finally{try{l.close()}catch{}}}function nu({voiceCfg:r,onFallback:e,transform:t=i=>i}){let i=ke.begin();ru(!!r.hd).catch(()=>{});let n=[],s="",a=0,o=!1,l=!1,c=!1,d=!1,u=!0,h=v=>{let m=/[.!?…]+["'”’)\]]*\s+/g,f,M=0;for(;(f=m.exec(s))!==null;)if(f.index+f[0].length-M>=25){let w=s.slice(M,f.index+f[0].length);n.push({text:w.trim(),offset:a+M}),M=f.index+f[0].length}if(s.length-M>420){let w=s.lastIndexOf(" ",M+360),_=w>M+150?w:M+360;n.push({text:s.slice(M,_).trim(),offset:a+M}),M=_}v&&s.slice(M).trim()&&(n.push({text:s.slice(M).trim(),offset:a+M}),M=s.length),s=s.slice(M),a+=M},p=(v,m="")=>{l||d||(l=!0,n.length=0,e?.(v,i,m))},g=async()=>{if(!(c||l||d||!i.active)){c=!0;try{let v=await na();if(!v)return p(n[0]?.offset??a,n[0]?t(n[0].text):"");let m=null,f=M=>{let w=t(M.text),_=Math.max(1e4,4e3+40*w.length)+(u?5e3:0);return u=!1,{item:M,promise:rm(v,w,r,_).catch(D=>({err:D||new Error("synthesis error")}))}};for(;!d&&i.active;){if(!m){let A=n.shift();if(!A)break;m=f(A)}let M=m;m=null;let w=n.shift();w&&(m=f(w));let _=await M.promise;if(_.err&&!/timeout/.test(String(_.err.message||_.err))&&!d&&i.active&&(console.warn("[voice] SDK synthesis failed, retrying once",_.err),_=await f(M.item).promise),_.err)return console.warn("[voice] SDK synthesis failed, falling back",_.err),p(M.item.offset,t(M.item.text));if(d||!i.active)return;if(!await i.enqueue(_.audio,_.visemes)&&i.active&&!d)return p(M.item.offset,t(M.item.text))}}finally{c=!1,i.active?!l&&!d&&n.length?g():!l&&!d&&o&&!n.length&&i.end():(d=!0,n.length=0)}}};return{utter:i,push(v){d||l||!i.active||(s+=v,h(!1),n.length&&g())},finish({dropTail:v=!1}={}){if(!d){if(!i.active)return void(d=!0);o=!0,v&&(s=s.match(/^[\s\S]*[.!?…]+["'”’)\]]*(?=\s|$)/)?.[0]??""),h(!0),!l&&(n.length?g():c||i.end())}},cancel(){d=!0,n.length=0},get failed(){return l},get offset(){return a},pending(){return!d&&!l&&(c||n.length>0||!o&&s.trim().length>0)}}}var nm="/app/vendor/livekit-client.umd.js",sm="https://cdn.jsdelivr.net/npm/livekit-client@2.15.7/dist/livekit-client.umd.js",am=12e4,om=3e4,sa=null;function su(r){return new Promise(e=>{let t=document.createElement("script");t.src=r,t.async=!0,t.onload=()=>e(!0),t.onerror=()=>e(!1),document.head.appendChild(t)})}function lm(){return window.LivekitClient?Promise.resolve(window.LivekitClient):(sa||(sa=(async()=>await su(nm)&&window.LivekitClient||await su(sm)&&window.LivekitClient?window.LivekitClient:(sa=null,null))()),sa)}async function au(r){try{let e=await fetch(`/api/avatar/status?debateId=${encodeURIComponent(r)}`,{credentials:"include"});return e.ok?await e.json():null}catch{return null}}var aa=class{constructor({stage:e,debateId:t,onStatus:i}){this.stage=e,this.debateId=t,this.onStatus=i||(()=>{}),this.ready=!1,this.talking=!1,this.disposed=!1,this.starting=null,this.lastActivity=Date.now(),this.video=document.createElement("video"),this.video.playsInline=!0,this.video.autoplay=!0,this.video.setAttribute("playsinline",""),this.video.className="photoreal-video",e.appendChild(this.video),this.idleTimer=setInterval(()=>{!this.ready||this.talking||ke.state!=="idle"||(Date.now()-this.lastActivity>am||this._expiring(9e4))&&this.sleep()},1e4),this.onVis=()=>{if(clearTimeout(this.hiddenT),document.visibilityState!=="hidden")return;let n=()=>{document.visibilityState!=="hidden"||!this.ready||(!this.talking&&ke.state==="idle"?this.sleep():this.hiddenT=setTimeout(n,1e4))};this.hiddenT=setTimeout(n,6e4)},document.addEventListener("visibilitychange",this.onVis)}_expiring(e){return!!this.expiresAt&&this.expiresAt-Date.now()<e&&(this.remaining??0)>120}touch(){this.lastActivity=Date.now(),this.ready&&this._expiring(6e4)&&!this.talking&&ke.state==="idle"&&this.sleep(),!this.ready&&!this.starting&&!this.disposed&&!this.exhausted&&this.start().catch(()=>{})}start(){if(this.starting)return this.starting;let e=new Set(["photoreal_out_of_credits","champion_required","video_minutes_exhausted","photoreal_not_configured","no_avatar_for_persona","debate_ended","debate_not_found","unauthorized"]);return this.starting=(async()=>{let t=null;for(let n=0;n<3&&!this.disposed;n++){if(n&&(this.onStatus({state:"connecting"}),await new Promise(s=>setTimeout(s,n===1?2500:6e3)),this.disposed))return;try{await this._start();return}catch(s){if(t=s,console.warn(`[photoreal] attempt ${n+1} failed:`,s?.message||s),this._teardown(!0),e.has(s?.code))break}}if(this.disposed||!t)return;let i=t;this.onStatus({state:"error",error:i?.code||"photoreal_unavailable",detail:i?.detail||i?.message||String(i)}),(i?.code==="video_minutes_exhausted"||i?.code==="champion_required")&&(this.exhausted=!0)})().finally(()=>{this.starting=null}),this.starting}async _start(){this.onStatus({state:"connecting"}),this.stopping&&(await Promise.race([this.stopping,new Promise(l=>setTimeout(l,3e3))]),this.stopping=null);let e=Date.now(),t=await fetch("/api/avatar/session",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:this.debateId})}),i=await t.json().catch(()=>({}));if(!t.ok)throw Object.assign(new Error(i.error||"session"),{code:i.error,detail:i.detail});if(this.disposed)return;this.token=i.sessionToken,this.sessionId=i.sessionId,this.api=i.apiUrl,this.remaining=i.remainingSeconds,this.expiresAt=i.maxSeconds?e+i.maxSeconds*1e3-5e3:0;let n=i.start?.livekit_url?i.start:await this._api("/v1/sessions/start");this.remoteStarted=!0;let s=await lm();if(!s)throw new Error("livekit_unavailable");if(this.disposed)return this._teardown(!0);this.room=new s.Room({adaptiveStream:!1,dynacast:!1});let a=new Promise(l=>{this.room.on(s.RoomEvent.TrackSubscribed,(c,d,u)=>{u.identity==="heygen"&&(c.attach(this.video),c.kind==="video"&&(this.vTrack=c),c.kind==="audio"&&(this.aTrack=c),c.kind==="video"&&l(!0))})});if(this.room.on(s.RoomEvent.Disconnected,()=>this._lost("room_disconnected")),await this.room.connect(n.livekit_url,n.livekit_client_token),!n.ws_url)throw new Error("no_ws_url");this.ws=new WebSocket(n.ws_url);let o=new Promise((l,c)=>{let d=setTimeout(()=>c(new Error("ws_timeout")),15e3);this.ws.onmessage=u=>{let h=null;try{h=JSON.parse(u.data)}catch{return}this._onEvent(h),h.type==="session.state_updated"&&h.state==="connected"&&(clearTimeout(d),l())},this.ws.onerror=()=>{},this.ws.onclose=()=>{clearTimeout(d),this._lost("ws_closed"),c(new Error("ws_closed"))},this.ws.onopen=()=>setTimeout(()=>(clearTimeout(d),l()),2500)});if(await Promise.all([o,Promise.race([a,new Promise((l,c)=>setTimeout(()=>c(new Error("video_timeout")),2e4))])]),this.disposed)return this._teardown(!0);try{this.video.muted=!1,await this.video.play()}catch{this.onStatus({state:"needs_tap"}),await new Promise(l=>{let c=()=>{this.video.play().then(l,l),this.stage.removeEventListener("click",c)};this.stage.addEventListener("click",c)})}this.ready=!0,this.stage.classList.add("photoreal-live"),ke.setSink(this),this.beat=setInterval(()=>this._heartbeat(),om),this.keep=setInterval(()=>this._send({type:"session.keep_alive"}),6e4),this._startAvSync(),this.onStatus({state:"live",remainingSeconds:this.remaining})}_onEvent(e){switch(e.type){case"agent.speak_started":this.talking=!0,this.lastActivity=Date.now();break;case"agent.speak_ended":case"agent.speak_interrupted":this.talking=!1,this.lastActivity=Date.now();break;case"agent.state_updated":this.talking=e.new_state==="talking";break;case"session.state_updated":e.state==="disconnected"&&this._lost("server_disconnected");break;case"error":console.warn("[photoreal] server error",e.error);break}}_send(e){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}speak(e,t){this.lastActivity=Date.now();for(let i of t)this._send({type:"agent.speak",event_id:e,audio:i})}speakEnd(e){this._send({type:"agent.speak_end",event_id:e})}interrupt(){this.talking=!1,this._send({type:"agent.interrupt"})}_startAvSync(){clearInterval(this.avSync);let e={v:null,a:null},t=async(a,o)=>{let l=a?.receiver;if(!l?.getStats)return null;let c=null;if((await l.getStats()).forEach(p=>{p.type==="inbound-rtp"&&(c={jb:p.jitterBufferDelay||0,n:p.jitterBufferEmittedCount||0,dec:p.totalDecodeTime||0,fr:p.framesDecoded||0})}),!c)return null;let d=e[o];if(e[o]=c,!d||c.n<=d.n)return null;let u=(c.jb-d.jb)/(c.n-d.n),h=c.fr>d.fr?(c.dec-d.dec)/(c.fr-d.fr):0;return u+h},i=0,n=0,s=[];this.avSync=setInterval(async()=>{try{let[a,o]=await Promise.all([t(this.vTrack,"v"),t(this.aTrack,"a")]),l=this.aTrack?.receiver;if(a==null||o==null||!l||(s.push(Math.max(0,Math.min(400,Math.round((a+.02)*1e3)))),s.length>5&&s.shift(),s.length<3))return;let c=s.slice().sort((u,h)=>u-h)[Math.floor(s.length/2)],d=Date.now();if(i&&(Math.abs(c-i)<60||d-n<2e4))return;i=c,n=d,"jitterBufferTarget"in l?l.jitterBufferTarget=i:"playoutDelayHint"in l&&(l.playoutDelayHint=i/1e3)}catch{}},2e3)}async _api(e){let t=await fetch(`${this.api}${e}`,{method:"POST",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"}}),i=await t.json().catch(()=>({}));if(!t.ok||i.code!==void 0&&i.code!==1e3)throw new Error(i.message||`liveavatar ${e} ${t.status}`);return i.data??i}async _heartbeat(){try{let t=await(await fetch("/api/avatar/heartbeat",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:this.sessionId})})).json();this.remaining=t.remainingSeconds,this.onStatus({state:"live",remainingSeconds:t.remainingSeconds}),t.stop&&!(this.expiresAt&&Date.now()<this.expiresAt)&&(this.exhausted=!0,this.sleep(),this.onStatus({state:"error",error:"video_minutes_exhausted"}))}catch{}}_lost(e){!this.ready&&!this.room||(console.warn("[photoreal] stream lost:",e),this._teardown(!0),this.disposed||this.onStatus({state:"off"}))}sleep(){this._teardown(!0),!this.disposed&&!this.exhausted&&this.onStatus({state:"sleeping"})}_teardown(e){let t=this.ready||this.room||this.ws||this.remoteStarted;this.remoteStarted=!1,this.ready=!1,this.talking=!1,(ke.sink===this||ke.pendingSink===this)&&ke.setSink(null),this.stage.classList.remove("photoreal-live"),clearInterval(this.beat),clearInterval(this.keep),clearInterval(this.avSync),this.vTrack=this.aTrack=null;try{this.ws&&(this.ws.onclose=null,this.ws.onmessage=null,this.ws.close())}catch{}this.ws=null;try{this.room?.removeAllListeners?.(),this.room?.disconnect()}catch{}this.room=null;try{this.video.srcObject=null}catch{}e&&t&&this.token&&(this.stopping=Promise.allSettled([fetch(`${this.api}/v1/sessions/stop`,{method:"POST",keepalive:!0,headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"}}),fetch("/api/avatar/end",{method:"POST",keepalive:!0,credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:this.sessionId})})])),this.token=null,this.expiresAt=0}dispose(){this.disposed||(this.disposed=!0,clearInterval(this.idleTimer),clearTimeout(this.hiddenT),document.removeEventListener("visibilitychange",this.onVis),this._teardown(!0),this.video.remove())}};var cm=Object.defineProperty,dm=(r,e,t)=>e in r?cm(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ou=(r,e,t)=>dm(r,typeof e!="symbol"?e+"":e,t);(function(){let r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(let i of document.querySelectorAll('link[rel="modulepreload"]'))t(i);new MutationObserver(i=>{for(let n of i)if(n.type==="childList")for(let s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&t(s)}).observe(document,{childList:!0,subtree:!0});function e(i){let n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function t(i){if(i.ep)return;i.ep=!0;let n=e(i);fetch(i.href,n)}})();var Lt=class extends Error{constructor(e,t,i){super(i??`Request failed with status ${e}`),ou(this,"status"),ou(this,"body"),this.name="ApiError",this.status=e,this.body=t}};async function _d(r,e={}){let t=await fetch(r,{credentials:"include",...e,headers:{"Content-Type":"application/json",...e.headers??{}}});if(!t.ok){let i=null;try{i=await t.json()}catch{}throw new Lt(t.status,i)}if(t.status!==204)return await t.json()}var Dt=r=>_d(r),Ct=(r,e)=>_d(r,{method:"POST",body:e===void 0?void 0:JSON.stringify(e)}),uc=r=>_d(r,{method:"DELETE"}),Lh="adversaryai-theme";function yd(){try{let r=localStorage.getItem(Lh);if(r==="light"||r==="dark")return r}catch{}return"dark"}function Ph(r){document.documentElement.dataset.theme=r;try{localStorage.setItem(Lh,r)}catch{}let e=document.querySelector('meta[name="theme-color"]');e&&e.setAttribute("content",r==="light"?"#f6f7f9":"#07080b")}function um(){Ph(yd())}function hm(){let r=yd()==="dark"?"light":"dark";return Ph(r),r}function pm(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var mm='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',fm='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';function hc(r=""){let e=document.createElement("button");e.type="button",e.className=`inline-flex h-11 w-11 items-center justify-center md:h-auto md:w-auto md:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition-colors ${r}`.trim();let t=()=>{let i=yd()==="dark";e.innerHTML=i?mm:fm,e.setAttribute("aria-label",i?"Switch to light theme":"Switch to dark theme"),e.title=i?"Switch to light theme":"Switch to dark theme",e.setAttribute("aria-pressed",String(!i))};return e.addEventListener("click",()=>{hm(),t()}),t(),e}var nl='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',Ih='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';function Nt(r,e=24){return`<svg width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${r}</svg>`}var Xe={mic:Nt('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',20),stop:Nt('<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/>',18),grow:Nt('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',18),shrink:Nt('<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>',18),warning:nl,bolt:Ih,scale:Nt('<line x1="12" y1="4" x2="12" y2="20"/><line x1="5" y1="6" x2="19" y2="6"/><path d="M5 6l-2.5 6a2.9 2.9 0 0 0 5 0L5 6z"/><path d="M19 6l-2.5 6a2.9 2.9 0 0 0 5 0L19 6z"/><line x1="8" y1="20" x2="16" y2="20"/>',22),cap:Nt('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><line x1="22" y1="10" x2="22" y2="16"/>',22),swap:Nt('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',22),clipboard:Nt('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',22),trophy:Nt('<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 2 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.5-2 4-4 4"/>',26),target:Nt('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',26),trending:Nt('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',26),compass:Nt('<circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',26),megaphone:Nt('<path d="M3 11l18-7v16L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',28),landmark:Nt('<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',28),briefcase:Nt('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',28),chat:Nt('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',28)};function sl(r="card"){let e=document.createElement("div");e.setAttribute("aria-hidden","true");let t=(i,n="0.875rem")=>`<div class="skeleton" style="width:${i};height:${n}"></div>`;return r==="list"?e.innerHTML=[0,1,2].map(()=>`
      <div class="card p-4 mb-3 flex items-center gap-4">
        <div class="skeleton shrink-0" style="width:3rem;height:3rem;border-radius:0.75rem"></div>
        <div class="flex-1 space-y-2">${t("60%")}${t("35%","0.75rem")}</div>
      </div>`).join(""):r==="text"?(e.className="space-y-2.5",e.innerHTML=`${t("95%")}${t("88%")}${t("70%","0.875rem")}`):r==="page"?(e.className="max-w-4xl mx-auto px-4 py-8 w-full",e.innerHTML=`
      ${t("40%","2rem")}
      <div class="mt-6 grid sm:grid-cols-2 gap-4">
        <div class="card p-6 space-y-3">${t("30%","0.75rem")}${t("70%","1.5rem")}${t("100%","0.625rem")}</div>
        <div class="card p-6 space-y-3">${t("30%","0.75rem")}${t("70%","1.5rem")}${t("100%","0.625rem")}</div>
      </div>
      <div class="mt-4 grid sm:grid-cols-3 gap-4">
        <div class="card p-6 space-y-3">${t("50%")}${t("30%","2rem")}${t("100%","2.5rem")}</div>
        <div class="card p-6 space-y-3">${t("50%")}${t("30%","2rem")}${t("100%","2.5rem")}</div>
        <div class="card p-6 space-y-3">${t("50%")}${t("30%","2rem")}${t("100%","2.5rem")}</div>
      </div>`):(e.className="card p-6 space-y-3",e.innerHTML=`${t("35%","0.75rem")}${t("60%","1.75rem")}${t("100%")}${t("85%")}`),e}function Kn(r,e){let t=document.createElement("div");return t.className="text-center py-14 px-6 animate-fade-up",t.setAttribute("role","alert"),t.innerHTML=`
    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-danger-dim bg-danger-dim/15 text-danger" aria-hidden="true">${nl}</div>
    <h2 class="text-display-sm text-white mb-2">Something went wrong</h2>
    <p class="text-body-sm text-slate-400 max-w-sm mx-auto mb-6">${pm(r)}</p>
    ${e?'<button type="button" class="btn-ghost">Try again</button>':""}`,e&&t.querySelector("button").addEventListener("click",e),t}function pc(){let r=document.createElement("div");return r.className="quota-card card max-w-md mx-auto my-12 p-8 text-center animate-pop-in shadow-glow border-accent-600/50",r.setAttribute("role","alert"),r.innerHTML=`
    <div class="quota-icon mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 border border-accent-600/40 text-accent-400" aria-hidden="true">${Ih}</div>
    <h2 class="quota-title text-display-md text-white mb-2">You're out of rounds</h2>
    <p class="quota-body text-body-sm text-slate-400 mb-7">
      You've used all the rounds in your wallet for now. Pick a plan or grab a one-time pack
      to keep practicing \u2014 pack credits never expire, and unused plan rounds roll over.
    </p>
    <div class="quota-actions flex flex-col sm:flex-row gap-3 justify-center">
      <a href="#/account?plans=1" class="btn-primary">View plans</a>
      <a href="#/account?plans=1&packs=1" class="btn-ghost">Buy a pack</a>
    </div>`,r}function Dh(r,e,t,i){let n=t==="/login",s=document.createElement("div");s.className="w-full max-w-md animate-fade-up",s.innerHTML=`
    <div class="text-center mb-8">
      <svg width="56" height="56" viewBox="0 0 512 512" aria-hidden="true" class="mx-auto mb-5 drop-shadow-[0_8px_24px_rgba(255,46,63,0.35)]"><rect width="512" height="512" rx="112" fill="#0d0f14"/><polygon points="256,104 400,392 112,392" fill="none" stroke="#e8392e" stroke-width="34" stroke-linejoin="round"/><g fill="#e8392e"><rect x="165" y="264" width="22" height="44" rx="11"/><rect x="193" y="244" width="22" height="84" rx="11"/><rect x="221" y="226" width="22" height="120" rx="11"/><rect x="249" y="212" width="22" height="148" rx="11"/><rect x="277" y="230" width="22" height="112" rx="11"/><rect x="305" y="248" width="22" height="76" rx="11"/><rect x="333" y="266" width="22" height="40" rx="11"/></g></svg>
      <h1 class="font-display text-display-lg text-white">${r}</h1>
      <p class="text-slate-400 mt-2 text-body-md">${e}</p>
    </div>
    <div class="card p-6 sm:p-8 relative overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/60 to-transparent" aria-hidden="true"></div>
      <div class="hidden mb-5" data-error></div>
      <form novalidate>
        <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="auth-email">Email</label>
        <input id="auth-email" type="email" required autocomplete="email" placeholder="you@example.com"
          class="field mb-4" />
        <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="auth-password">Password</label>
        <input id="auth-password" type="password" required autocomplete="${n?"new-password":"current-password"}" minlength="8" placeholder="Minimum 8 characters"
          class="field mb-6" />
        ${n?"":'<div class="-mt-4 mb-6 text-right"><a href="mailto:support@getadversaryai.com?subject=Password%20reset" class="link text-body-sm">Forgot password?</a></div>'}
        <button type="submit" class="btn-primary w-full py-3">
          ${r}
        </button>
        ${n?'<p class="mt-4 text-center text-xs leading-relaxed text-slate-500">By creating an account you agree to our <a href="/terms.html" target="_blank" rel="noopener" class="link">Terms</a> and <a href="/privacy.html" target="_blank" rel="noopener" class="link">Privacy Policy</a>, and confirm you are 13 or older (or a school-enrolled student). Your practice sessions are recorded as text so you can review them; audio isn\u2019t stored.</p>':""}
      </form>
    </div>
    <p class="text-center text-body-sm text-slate-500 mt-6">
      ${i} <a href="#${t}" class="link font-medium">${t==="/signup"?"Create an account":"Log in"}</a>
    </p>`;let a=s.querySelector("form"),o=s.querySelector("[data-error]");return{el:s,form:a,errorBox:o}}function Kr(r,e){r.className="error-box mb-5 animate-fade-in",r.setAttribute("role","alert"),r.innerHTML=`<span aria-hidden="true" class="shrink-0 mt-0.5 text-danger">${nl}</span><span></span>`,r.querySelector("span:last-child").textContent=e}function Oa(r,e,t){r.disabled=e,r.classList.toggle("opacity-60",e),e?r.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Please wait\u2026</span>':r.textContent=t}function bd(){return hc("fixed top-[calc(1rem+var(--safe-top))] right-4 z-30 border border-ink-700 bg-ink-900/80 backdrop-blur")}function As(r,e){try{window.adversaryTrack?.(r,e||{})}catch{}}async function Uh(r,e,t){let i=r.querySelector("#auth-email").value.trim(),n=r.querySelector("#auth-password").value,s=r.querySelector('button[type="submit"]'),a=t==="/api/auth/signup"?"Sign up":"Log in";if(e.classList.add("hidden"),e.removeAttribute("role"),!i||!n){Kr(e,"Enter your email and password.");return}if(n.length<8){Kr(e,"Password must be at least 8 characters.");return}Oa(s,!0,a);try{await Ct(t,{email:i,password:n,attribution:window.adversaryAttribution?.()||null});let o=await Dt("/api/auth/me");t==="/api/auth/signup"&&As("sign_up",{method:"email"}),Zs(o);let l=new URLSearchParams(location.hash.split("?")[1]||"").get("next");location.hash=l&&/^#?\/[\w\-\/?=&%.]*$/.test(l)?l.startsWith("#")?l:"#"+l:"#/"}catch(o){let l=o.status;l===409?Kr(e,"An account with that email already exists. Try logging in instead."):l===401?Kr(e,"Wrong email or password. Try again \u2014 or, if you forgot it, email support@getadversaryai.com."):Kr(e,"Something went wrong. Please try again.")}finally{Oa(s,!1,a)}}function gm(r){let{el:e,form:t,errorBox:i}=Dh("Log in","Your sparring partner is waiting.","/signup","New to AdversaryAI?");r.appendChild(bd()),t.addEventListener("submit",n=>{n.preventDefault(),Uh(t,i,"/api/auth/login")}),r.appendChild(e)}function vm(r){let{el:e,form:t,errorBox:i}=Dh("Sign up","Create your account and start practicing in minutes.","/login","Already have an account?");r.appendChild(bd()),t.addEventListener("submit",n=>{n.preventDefault(),Uh(t,i,"/api/auth/signup")}),r.appendChild(e)}var Sd={debate:Xe.megaphone,historical:Xe.landmark,acting:Xe.mic,interview:Xe.briefcase,negotiation:Xe.swap,sales:Xe.trending,difficult:Xe.chat,thesis:Xe.cap,expert:Xe.target,rapbattle:Nt('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',28),witness:Nt('<path d="M12 2v20M5 8h14"/>',28)},oa=null;async function Zn(r=!1){if(oa&&!r)return oa;let{modes:e}=await Dt("/api/modes");return oa=e??[],oa}function bl(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Nh(r){return Array.from({length:r},()=>`
    <div class="flex flex-row items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4 animate-pulse sm:flex-col sm:items-stretch sm:gap-0 sm:p-6" aria-hidden="true">
      <div class="h-11 w-11 shrink-0 rounded-xl bg-ink-700 sm:mb-4"></div>
      <div class="min-w-0 flex-1">
        <div class="h-5 w-2/3 rounded bg-ink-700 sm:h-6"></div>
        <div class="mt-2 h-3 w-1/2 rounded bg-ink-800 sm:mb-3"></div>
        <div class="hidden sm:block">
          <div class="mb-2 h-3.5 w-full rounded bg-ink-800"></div>
          <div class="mb-2 h-3.5 w-full rounded bg-ink-800"></div>
          <div class="h-3.5 w-4/5 rounded bg-ink-800"></div>
          <div class="mt-6 h-4 w-1/4 rounded bg-ink-800"></div>
        </div>
      </div>
    </div>`).join("")}async function xm(r){r.innerHTML=`<div class="max-w-6xl mx-auto px-4 py-6 sm:py-10" id="modes-root">
    <div class="text-center mb-8 sm:mb-10">
      <h1 class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">What do you want to practice?</h1>
      <p class="text-slate-400 mt-2 max-w-xl mx-auto text-sm sm:text-base">Pick an arena. A live AI opponent meets you there \u2014 with voice, pushback, and a scorecard when you\u2019re done.</p>
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" id="mode-grid">
      ${Nh(11)}
    </div>
  </div>`;let e=r.querySelector("#mode-grid");await kh(e)}async function kh(r){try{let e=await Zn(!0);if(e.length===0){r.innerHTML=`
        <div class="col-span-full text-center py-16 rounded-2xl border border-ink-700 bg-ink-900">
          <p class="text-white font-semibold mb-1">No practice modes available</p>
          <p class="text-sm text-slate-400">Check back in a moment.</p>
        </div>`;return}r.innerHTML="";let t=["interview","debate","historical","sales","negotiation","difficult","thesis","expert","acting","rapbattle","witness"],i=n=>t.indexOf(n)<0?99:t.indexOf(n);for(let n of[...e].sort((s,a)=>i(s.id)-i(a.id))){let s=document.createElement("a");s.href=`#/setup/${encodeURIComponent(n.id)}`,s.className="group card flex flex-row items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/60 sm:flex-col sm:items-stretch sm:gap-0 sm:p-6",s.innerHTML=`
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-accent-500 transition-colors group-hover:border-accent-500/50 sm:mb-4 [&>svg]:h-6 [&>svg]:w-6">${Sd[n.id]??Xe.chat}</div>
        <div class="min-w-0 flex-1 sm:flex sm:flex-col">
          <div class="text-base font-bold leading-tight text-white sm:text-lg">${bl(n.name)}</div>
          <div class="mt-1 text-xs font-semibold uppercase tracking-wide text-accent-400 line-clamp-1 sm:mb-2 sm:line-clamp-none">${bl(n.tagline)}</div>
          <p class="text-sm leading-relaxed text-slate-400 line-clamp-3 max-sm:hidden">${bl(n.description)}</p>
        </div>
        <span aria-hidden="true" class="shrink-0 text-xl leading-none text-accent-400 sm:hidden">\u203A</span>
        <div class="mt-auto hidden pt-4 text-sm font-semibold text-accent-400 sm:block">Set up <span aria-hidden="true" class="inline-block transition-transform group-hover:translate-x-0.5">\u2192</span></div>`,r.appendChild(s)}}catch{r.innerHTML=`
      <div class="col-span-full text-center py-16 rounded-2xl border border-ink-700 bg-ink-900">
        <div class="mb-4 flex justify-center text-danger [&>svg]:w-10 [&>svg]:h-10">${Xe.warning}</div>
        <p class="text-white font-semibold mb-1">Couldn\u2019t load practice modes</p>
        <p class="text-sm text-slate-400 mb-6">Check your connection and try again.</p>
        <button id="modes-retry" class="btn-primary text-sm">Retry</button>
      </div>`,r.querySelector("#modes-retry").addEventListener("click",()=>{r.innerHTML=Nh(11),kh(r)})}}var lu={"teen-boy":{id:"teen-boy",model:"/models/personas/teen-boy.glb",label:"Teenage boy"},"teen-girl":{id:"teen-girl",model:"/models/personas/teen-girl.glb",label:"Teenage girl"},"man-pro":{id:"man-pro",model:"/models/personas/man-pro.glb",label:"Professional man"},"woman-pro":{id:"woman-pro",model:"/models/personas/woman-pro.glb",label:"Professional woman"},"older-man":{id:"older-man",model:"/models/personas/older-man.glb",label:"Older gentleman"},"older-woman":{id:"older-woman",model:"/models/personas/older-woman.glb",label:"Older woman"},"man-casual":{id:"man-casual",model:"/models/adversary-masc.glb",label:"Man"},"woman-casual":{id:"woman-casual",model:"/models/adversary-fem.glb",label:"Woman"},"default-masc":{id:"default-masc",model:"/models/adversary-masc.glb",label:"Opponent"},"default-fem":{id:"default-fem",model:"/models/adversary-fem.glb",label:"Opponent"}};function Oh(r){return r&&lu[r]||lu["default-masc"]}var _m={lincoln:"older-man",churchill:"older-man",socrates:"older-man",douglass:"man-pro",mlk:"man-pro",einstein:"older-man",aurelius:"older-man",voltaire:"man-pro",eleanor:"older-woman",smith:"older-man",god_reformed:"older-man",the_devil:"man-pro",cs_lewis:"older-man",aquinas:"older-man",nietzsche:"older-man",hitchens:"man-pro"};function ym(r){return r&&_m[r]||"default-masc"}var ms=[{id:"son",label:"Son",otherParty:"my teenage son"},{id:"daughter",label:"Daughter",otherParty:"my teenage daughter"},{id:"partner",label:"Partner",otherParty:"my partner"},{id:"parent",label:"Parent",otherParty:"my parent"},{id:"boss",label:"Boss",otherParty:"my boss"},{id:"coworker",label:"Coworker",otherParty:"my coworker"},{id:"friend",label:"Friend",otherParty:"my friend"}],bm={son:"teen",daughter:"teen",partner:"adult",parent:"older",boss:"pro",coworker:"adult",friend:"adult"};function Sm(r,e){let t=ms.find(s=>s.id===r)?.id??"coworker",i=e==="fem",n=bm[t];return n==="teen"?i?"teen-girl":"teen-boy":n==="older"?i?"older-woman":"older-man":n==="pro"?i?"woman-pro":"man-pro":i?"woman-casual":"man-casual"}var wm={debate:"default-masc",acting:"man-casual",interview:"man-pro",negotiation:"man-pro",sales:"woman-pro",thesis:"older-man",rapbattle:"man-casual",witness:"man-casual",expert:"man-pro"},Mm={prosecutor:"man-pro",professor:"older-man",contrarian:"woman-pro",coach:"woman-casual",theist_mathematician:"older-man",secular_rationalist:"man-pro",evolutionary_biologist:"older-man",islamic_theologian:"man-pro",biblical_creationist:"older-man",moral_humanist:"woman-pro",archetypal_psychologist:"man-pro",jordan_peterson:"man-pro"};function Tm(r){return r&&Mm[r]||"default-masc"}function Em(r){return r&&wm[r]||"default-masc"}var cu=[{id:"prosecutor",name:"The Prosecutor",tagline:"Relentless cross-examiner",description:"Treats every claim like testimony. Expect rapid-fire questions, demands for evidence, and zero mercy for hand-waving.",icon:Xe.scale},{id:"professor",name:"The Professor",tagline:"Socratic questioner",description:"Never tells you the answer \u2014 asks the question that unravels your argument. Patient, precise, and quietly devastating.",icon:Xe.cap},{id:"contrarian",name:"The Contrarian",tagline:"Steelmans the other side",description:"Takes the strongest version of the opposing view and defends it brilliantly, forcing you to earn every inch of ground.",icon:Xe.swap},{id:"coach",name:"The Coach",tagline:"Supportive sparring partner",description:"Pushes hard during the round, then breaks down exactly what worked and what didn\u2019t \u2014 with detailed, actionable scores.",icon:Xe.clipboard},{id:"theist_mathematician",name:"The Cambridge Theist",tagline:"Fine-tuning & teleology",description:"Defends classical theism via universal fine-tuning, the unreasonable effectiveness of math, and DNA digital code.",icon:Xe.landmark},{id:"secular_rationalist",name:"The Secular Rationalist",tagline:"Analytic skepticism & reason",description:"Attacks supernatural claims with Ockham's razor, the problem of animal suffering, divine hiddenness, and Euthyphro.",icon:Xe.compass},{id:"evolutionary_biologist",name:"The Evolutionary Biologist",tagline:"Common descent & deep time",description:"Defends neo-Darwinian evolution with endogenous retroviruses, comparative anatomy, transitional fossils, and deep time.",icon:Xe.trending},{id:"islamic_theologian",name:"The Islamic Theologian",tagline:"Kalam cosmology & Tawhid",description:"Argues cosmic contingency necessitates an uncaused Creator; defends strict Monotheism against naturalism and Trinity.",icon:Xe.target},{id:"biblical_creationist",name:"The Biblical Creationist",tagline:"Special creation & scripture",description:"Challenges naturalist epistemology, uniformitarian age dating, the impossibility of abiogenesis, and information loss.",icon:Xe.trophy},{id:"moral_humanist",name:"The Moral Humanist",tagline:"Secular ethics & well-being",description:"Grounds objective morality in conscious suffering and flourishing; critiques ancient dogma while defending human dignity.",icon:Xe.chat},{id:"archetypal_psychologist",name:"The Archetypal Psychologist",tagline:"Meaning, responsibility & archetypes",description:"Analyzes reality through evolutionary psychology, biblical narratives as deep psychological truth, and voluntary confrontation with chaos.",icon:Xe.compass}];function gt(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var Am={round:[{v:3,t:"3 rounds",s:"Quick spar"},{v:6,t:"6 rounds",s:"Standard bout"},{v:10,t:"10 rounds",s:"Full debate"},{v:0,t:"Open-ended",s:"End when you want"}],question:[{v:3,t:"3 questions",s:"Quick screen"},{v:6,t:"6 questions",s:"Standard"},{v:10,t:"10 questions",s:"Full loop"},{v:0,t:"Open-ended",s:"End when you want"}],exchange:[{v:4,t:"4 exchanges",s:"Short"},{v:8,t:"8 exchanges",s:"Standard"},{v:12,t:"12 exchanges",s:"Deep dive"},{v:0,t:"Open-ended",s:"End when you want"}],bars:[{v:2,t:"2 rounds",s:"Quick cypher"},{v:3,t:"3 rounds",s:"Classic battle"},{v:5,t:"5 rounds",s:"Main event"},{v:0,t:"Open-ended",s:"Until someone taps"}]},Sl={v:"cointoss",t:"\u{1FA99} Coin toss",s:"50/50 flip"},Rm={debate:{unit:"round",def:6,first:[Sl,{v:"user",t:"You open",s:"Opening statement"},{v:"opponent",t:"Opponent opens",s:"They take the floor"}],defFirst:"cointoss",styles:!0,side:!0,judge:!0},historical:{unit:"round",def:6,first:[Sl,{v:"user",t:"You open",s:"Opening statement"},{v:"opponent",t:"They open",s:"History speaks first"}],defFirst:"cointoss",styles:!0,side:!0,judge:!0},thesis:{unit:"question",def:6,fixedFirst:"opponent",fixedNote:"The committee opens with the first question."},interview:{unit:"question",def:6,fixedFirst:"opponent",fixedNote:"The interviewer greets you and asks the first question."},expert:{unit:"question",def:6,fixedFirst:"opponent",fixedNote:"They open with the first question for you, the expert."},negotiation:{unit:"exchange",def:8,first:[{v:"user",t:"You open",s:"Make the first move"},{v:"opponent",t:"They open",s:"Counterpart anchors first"}],defFirst:"opponent",judge:!0},sales:{unit:"exchange",def:8,first:[{v:"user",t:"You open the call",s:"Lead the pitch"},{v:"opponent",t:"Buyer speaks first",s:"Cold, skeptical start"}],defFirst:"user",judge:!0},difficult:{unit:"exchange",def:8,first:[{v:"user",t:"You bring it up",s:"Start the talk"},{v:"opponent",t:"They bring it up",s:"Caught off guard"}],defFirst:"user"},acting:{unit:"exchange",def:8,first:[{v:"user",t:"You have the first line",s:""},{v:"opponent",t:"Partner starts",s:""}],defFirst:"user"},witness:{unit:"exchange",def:8,first:[{v:"user",t:"You start",s:"Open the conversation"},{v:"opponent",t:"They start",s:"They ask you first"}],defFirst:"user"},rapbattle:{unit:"bars",def:3,first:[Sl,{v:"user",t:"You drop first",s:"Set the tone"},{v:"opponent",t:"MC drops first",s:"Answer back"}],defFirst:"cointoss",judge:!0}},Cm={unit:"exchange",def:8,first:[{v:"user",t:"You start",s:""},{v:"opponent",t:"They start",s:""}],defFirst:"user"};function wd(r){return Rm[r]||Cm}var Lm=[{v:"easy",t:"Easy",s:"Gives ground \u2014 good for learning"},{v:"normal",t:"Normal",s:"Fair fight \u2014 admits good points"},{v:"hard",t:"Hard",s:"Relentless \u2014 no easy wins"}],Pm={easy:"Easy",normal:"Normal",hard:"Hard"},Fh=[{v:"oxford",t:"Oxford",s:"Classic structure"},{v:"lincoln_douglas",t:"L\u2013D",s:"Lincoln\u2013Douglas values"},{v:"rapid",t:"Rapid fire",s:"Short, punchy turns"},{v:"freeform",t:"Freeform",s:"Open sparring"}],Im=[{v:"for",t:"I argue FOR",s:"Defend the motion"},{v:"against",t:"I argue AGAINST",s:"Oppose the motion"},{v:"open",t:"No fixed sides",s:"Free-flowing clash"}];function vn(r,e,t){return e.map(i=>`<button type="button" class="opt-chip" data-opt="${r}" data-value="${gt(String(i.v))}" aria-pressed="${String(i.v)===String(t)}">
        <span class="opt-title">${gt(i.t)}</span>${i.s?`<span class="opt-sub">${gt(i.s)}</span>`:""}
      </button>`).join("")}function Dm(r){let e=`setup-${gt(r.key)}`,t=r.required?'<span class="text-accent-400 ml-0.5" aria-hidden="true">*</span>':"",i=r.help?`<p class="help">${gt(r.help)}</p>`:"",n=`<label class="label" for="${e}">${gt(r.label)}${t}</label>`;if(r.type==="textarea")return`${n}<textarea id="${e}" data-key="${gt(r.key)}" rows="3" placeholder="${gt(r.placeholder??"")}" class="field resize-none"></textarea>${i}`;if(r.type==="select"){let s=(r.options??[]).map(a=>`<option value="${gt(a.value)}">${gt(a.label)}</option>`).join("");return`${n}<select id="${e}" data-key="${gt(r.key)}" class="field">${r.required?"":'<option value="">\u2014</option>'}${s}</select>${i}`}return`${n}<input id="${e}" data-key="${gt(r.key)}" type="text" placeholder="${gt(r.placeholder??"")}" class="field" />${i}`}function Um(r){return`
    <button type="button" class="figure-card persona-card flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-3 text-left hover:border-slate-500"
      data-figure-id="${gt(r.id)}" aria-pressed="false">
      <span class="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-ink-600 bg-ink-950">
        <img src="/img/figures/${gt(r.id)}.jpg" alt="" loading="lazy" class="h-full w-full object-cover object-top" onerror="this.style.visibility='hidden'" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-semibold leading-tight text-white">${gt(r.name)}</span>
        <span class="mt-0.5 block truncate text-xs text-slate-400">${gt(r.era)}</span>
        <span class="mt-1 hidden text-xs leading-snug text-slate-500 sm:line-clamp-2">${gt(r.bio)}</span>
      </span>
    </button>`}function Nm(r,e){try{sessionStorage.setItem(`adversaryai:session:${r}`,JSON.stringify(e))}catch{}}var wl=r=>String(r||"").replace(/\([^)]*\)/g,"").replace(/[^\p{L}\p{N} .'\-]/gu,"").replace(/\.+$/,"").trim().toUpperCase().replace(/\s+/g," "),km=r=>String(r||"").replace(/\([^)]*\)/g," ").replace(/\[[^\]]*\]/g," ").replace(/\s+/g," ").trim();function mc(r){let e=[],t=null,i=null,n=(s,a)=>{let o=km(a);!s||!o||(t&&t.name===s?t.text+=" "+o:e.push(t={name:s,text:o}))};for(let s of String(r||"").replace(/\r\n?/g,`
`).split(`
`)){let a=s.trim();if(!a){i=null;continue}if(/^(INT|EXT|INT\/EXT|I\/E)[.\s]/.test(a)||/^(FADE|CUT TO|DISSOLVE|SMASH CUT|THE END)/.test(a)){i=null;continue}let o=a.match(/^([\p{L}][\p{L}\p{N} .'\-]{0,30}?)\s*(\([^)]*\))?\s*:\s*(.+)$/u);if(o&&o[1].split(" ").length<=4){n(wl(o[1]),o[3]),i=null;continue}let l=a.match(/^([A-Z][A-Z .'\-]{1,30}?)\.\s+(.+)$/);if(l&&l[1]===l[1].toUpperCase()&&l[1].split(" ").length<=4){n(wl(l[1]),l[2]),i=null;continue}let c=a.match(/^([A-Z][A-Z0-9 .'\-]{0,30})(\s*\([^)]*\))?$/);if(c&&/[A-Z]{2}/.test(c[1])&&c[1].trim().split(/\s+/).length<=4){i=wl(c[1]);continue}i&&n(i,a)}return e}function Bh(r,e){let t=[],i=!1;for(let n of r){let s=n.name===e;s&&i?t[t.length-1]+=" "+n.text:s&&t.push(n.text),i=s}return t}function Om(r,e){let t=a=>String(a||"").toLowerCase().replace(/[’']/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(Boolean),i=t(r).slice(0,600),n=t(e).slice(0,600);if(!i.length)return 100;if(!n.length)return 0;let s=new Array(n.length+1).fill(0);for(let a=1;a<=i.length;a++){let o=0;for(let l=1;l<=n.length;l++){let c=s[l];s[l]=i[a-1]===n[l-1]?o+1:Math.max(s[l],s[l-1]),o=c}}return Math.round(200*s[n.length]/(i.length+n.length))}var Ml=r=>String(r||"").toLowerCase().replace(new RegExp("(^|[\\s'-])\\p{L}","gu"),e=>e.toUpperCase());function Fm(r,e,t){if(e.topic)return e.topic;let i=n=>String(n).slice(0,300);switch(r.id){case"thesis":return i(e.thesisStatement?`Thesis: ${e.thesisStatement}${e.field?` (${e.field})`:""}`:"Thesis defense");case"acting":return i(e.yourRole?`Acting: ${e.yourRole}${e.sceneContext?` \u2014 ${e.sceneContext}`:""}`:"Acting rehearsal");case"interview":return i(e.jobTitle?`Interview: ${e.jobTitle}${e.company?` at ${e.company}`:""}`:"Job interview");case"negotiation":return i(e.scenario||e.yourGoal?`Negotiation: ${e.scenario||e.yourGoal}`:"Negotiation practice");case"sales":return i(e.product?`Pitch: ${e.product}${e.buyerPersona?` to ${e.buyerPersona}`:""}`:"Sales roleplay");case"difficult":return i(e.situation||"Difficult conversation");case"historical":return i(t?.suggestedTopic||(t?`Debate with ${t.name}`:"Historical debate"));case"rapbattle":return i(e.theme?`Rap battle: ${e.theme}`:"Open rap battle");case"witness":return i(e.who?`Sharing the gospel with ${e.who}`:"Sharing the gospel");case"expert":return i(e.profession?`Expert: ${e.profession}`:"Domain expert");default:return i((r.name||"Sparring")+" session")}}function Bm(r,e){return new Promise((t,i)=>{let n=document.createElement("div");n.className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in",n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.innerHTML=`<div class="relative w-full max-w-sm overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 p-7 text-center shadow-2xl">
      <p class="eyebrow mb-5 !text-amber-400">Coin toss</p>
      <div class="coin-container my-6"><div class="coin-3d coin-flipping" id="toss-coin">
        <div class="coin-side coin-side-front"><span class="text-[11px] font-black uppercase tracking-wider">You</span></div>
        <div class="coin-side coin-side-back"><span class="text-[11px] font-black uppercase tracking-wider">Them</span></div>
      </div></div>
      <div id="toss-status" class="mb-1.5 text-base font-semibold text-white">Flipping\u2026</div>
      <p id="toss-sub" class="text-sm text-slate-400">Heads you open \xB7 Tails they open</p>
      <button type="button" id="toss-go" class="btn-primary mt-6 hidden w-full py-3">Enter the floor \u2192</button>
    </div>`,document.body.appendChild(n);let s=n.querySelector("#toss-coin"),a=n.querySelector("#toss-status"),o=n.querySelector("#toss-sub"),l=n.querySelector("#toss-go");r.then(c=>{setTimeout(()=>{s.classList.remove("coin-flipping");let d=c.resolvedFirstSpeaker==="user";s.classList.add(d?"coin-land-heads":"coin-land-tails"),a.innerHTML=d?'<span class="text-emerald-400">Heads \u2014 you open.</span>':`<span class="text-amber-400">Tails \u2014 ${ze(e)} opens.</span>`,o.textContent=d?"Deliver your opening statement.":`${e} takes the floor first.`,l.classList.remove("hidden"),l.focus();let u=setTimeout(()=>{n.remove(),t(c)},2200);l.onclick=()=>{clearTimeout(u),n.remove(),t(c)}},1200)}).catch(c=>{n.remove(),i(c)})})}async function Hm(r,e){r.innerHTML=`<div class="mx-auto max-w-2xl px-4 py-6 sm:py-10" id="setup-root">${sl("page").outerHTML}</div>`;let t=r.querySelector("#setup-root"),i;try{i=await Zn()}catch{t.innerHTML='<div class="py-16 text-center text-slate-400"><p class="mb-2 font-semibold text-white">Couldn\u2019t load this mode</p><p class="mb-6 text-sm">Check your connection and try again.</p><a href="#/" class="btn-primary">Back to practice</a></div>';return}let n=i.find(T=>T.id===e);if(n&&t.isConnected&&(document.title=`${n.name} setup \xB7 AdversaryAI`),!n){t.innerHTML='<div class="py-16 text-center text-slate-400"><h1 class="mb-3 text-display-md text-white">Mode not found</h1><p class="mb-6 text-sm">That practice mode doesn\u2019t exist.</p><a href="#/" class="btn-primary">Back to practice</a></div>';return}let s=wd(n.id),a=n.id==="debate",o=n.id==="difficult",l=n.figures??[],c=new Map(l.map(T=>[T.id,T])),d={persona:cu[0],figure:null,rel:"coworker",present:"masc",rounds:s.def,first:s.fixedFirst||s.defFirst,style:"oxford",side:"for",difficulty:"normal"},u=(n.setupFields||[]).filter(T=>T.key!=="figureId");(a||n.id==="historical")&&!u.some(T=>T.key==="topic")&&u.push({key:"topic",label:(n.id==="historical","Debate motion"),type:"textarea",placeholder:n.id==="historical"?"Pick a figure to get a suggested motion \u2014 or write your own":"e.g. Social media platforms should be regulated as public utilities",required:!0});let h=new URLSearchParams(location.hash.split("?")[1]||"").get("topic"),p=Am[s.unit];if(t.innerHTML=`
    <a href="#/" class="-my-2 inline-flex items-center gap-1 py-3 text-sm text-slate-500 hover:text-slate-300">\u2190 All modes</a>
    <div class="mb-2 mt-4 flex items-center gap-4">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900 text-accent-500 [&>svg]:h-7 [&>svg]:w-7">${Sd[n.id]??Xe.chat}</div>
      <div class="min-w-0">
        <h1 class="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-display-md">${gt(n.name)}</h1>
        <p class="text-sm font-medium text-accent-400">${gt(n.tagline)}</p>
      </div>
    </div>
    <p class="mb-2 text-sm leading-relaxed text-slate-400 sm:text-base">${gt(n.introCopy??n.description)}</p>
    ${n.disclaimer?`<div class="mt-5 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"><span class="shrink-0 text-amber-400 [&>svg]:h-5 [&>svg]:w-5">${Xe.warning}</span><p class="text-sm leading-relaxed text-slate-300" id="mode-disclaimer"></p></div>`:""}

    ${l.length?`<section class="setup-section"><h2 class="section-title">Choose your figure</h2><p class="section-sub">Each argues from their documented views and writings, in their own voice.</p><div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2" id="figure-grid">${l.map(Um).join("")}</div></section>`:""}

    ${a?'<section class="setup-section"><h2 class="section-title">Choose your opponent</h2><p class="section-sub">Each has a different style of attack.</p><div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2" id="persona-grid"></div></section>':""}

    ${o?`<section class="setup-section"><h2 class="section-title">Who is this conversation with?</h2><p class="section-sub">They\u2019ll look and sound the part.</p>
      <div class="mb-4 flex flex-wrap gap-2" id="rel-grid">${ms.map(T=>`<button type="button" class="pill-chip" data-rel="${T.id}" aria-pressed="${T.id===d.rel}">${T.label}</button>`).join("")}</div>
      <p class="mb-2 text-xs font-medium text-slate-400">Their voice &amp; look</p>
      <div class="flex flex-wrap gap-2" id="present-grid"><button type="button" class="pill-chip" data-present="masc" aria-pressed="true">Masculine</button><button type="button" class="pill-chip" data-present="fem" aria-pressed="false">Feminine</button></div></section>`:""}

    ${n.id==="acting"?`<section class="setup-section"><h2 class="section-title">How do you want to rehearse?</h2><div class="opt-grid grid-cols-1 sm:grid-cols-2">${vn("actMode",[{v:"script",t:"Run my script",s:"Paste your scene \u2014 your partner reads every other part, word for word"},{v:"improv",t:"Improvise",s:"Describe a scene \u2014 your partner improvises in character"}],"script")}</div></section>
    <section class="setup-section" id="script-sec">
      <label class="label" for="setup-script">Your scene</label>
      <textarea id="setup-script" rows="9" class="field text-sm leading-relaxed" placeholder="ROMEO: But soft, what light through yonder window breaks?&#10;JULIET: Ay me.&#10;ROMEO: She speaks!"></textarea>
      <p class="help">One line per speech as <b>NAME: line</b> \u2014 screenplay format (name on its own line) works too. Stage directions in (parentheses) are skipped.</p>
      <div class="mt-2 flex flex-wrap items-center gap-3"><label class="btn-ghost btn-sm cursor-pointer">Upload a .txt<input type="file" id="script-file" accept=".txt,.fountain,.md,text/plain" class="hidden" /></label><span id="script-stats" class="text-xs text-slate-400"></span></div>
      <div id="role-sec" class="mt-5 hidden"><p class="label">Which character are you?</p><div class="flex flex-wrap gap-2" id="role-grid"></div></div>
    </section>`:""}

    <section class="setup-section space-y-5" id="field-list">${u.map(T=>`<div>${Dm(T)}</div>`).join("")}</section>

    ${s.side?`<section class="setup-section"><h2 class="section-title">Your side</h2><div class="opt-grid grid-cols-1 sm:grid-cols-3">${vn("side",Im,d.side)}</div></section>`:""}

    ${s.styles?`<section class="setup-section"><h2 class="section-title">Format</h2><div class="opt-grid grid-cols-2 sm:grid-cols-4">${vn("style",Fh,d.style)}</div></section>`:""}

    ${n.id!=="acting"?`<section class="setup-section"><h2 class="section-title">Difficulty</h2><div class="opt-grid grid-cols-1 sm:grid-cols-3">${vn("difficulty",Lm,"normal")}</div></section>`:""}

    <section class="setup-section" id="len-sec"><h2 class="section-title">Length</h2><p class="section-sub">Each ${s.unit==="bars"?"round":s.unit} uses one credit.</p><div class="opt-grid grid-cols-2 sm:grid-cols-4">${vn("rounds",p,d.rounds)}</div></section>

    ${s.first?`<section class="setup-section" id="first-sec"><h2 class="section-title">Who speaks first?</h2><div class="opt-grid ${s.first.length===3?"grid-cols-1 sm:grid-cols-3":"grid-cols-2"}">${vn("first",s.first,d.first)}</div></section>`:`<p class="setup-section flex items-center gap-2 text-sm text-slate-400"><span class="text-accent-400">\u25CF</span>${gt(s.fixedNote)}</p>`}

    <div class="mt-6 hidden" id="setup-error"></div>
    <button id="start-btn" type="button" class="btn-primary mt-7 w-full py-3.5 text-base">Start session</button>
    <p class="mt-3 text-center text-xs text-slate-500" id="start-note"></p>
    <div id="quota-slot"></div>`,h){let T=t.querySelector('[data-key="topic"]');T&&(T.value=h)}let g=t.querySelector("#mode-disclaimer"),v=()=>{g&&(g.textContent=n.disclaimer.replace("[Name]",d.figure?c.get(d.figure)?.name:"this figure"))};v();let m=t.querySelector("#start-note"),f=()=>{if(n.id==="acting"&&d.actMode==="script"){m.textContent="Your partner reads every other part, word for word. You get a line-accuracy check after each line and coaching notes at the end.";return}let T=s.judge?" An impartial judge scores both sides at the end.":" You\u2019ll get a coaching scorecard at the end.",b=s.fixedFirst?"":d.first==="user"?"You speak first.":d.first==="opponent"?"They speak first.":"A coin toss decides who opens.";m.textContent=`${b}${T}`.trim()};f();let M=null;if(t.addEventListener("click",T=>{let b=T.target.closest("[data-opt]");if(!b)return;let x=b.getAttribute("data-opt");t.querySelectorAll(`[data-opt="${x}"]`).forEach(U=>U.setAttribute("aria-pressed",String(U===b)));let C=b.getAttribute("data-value");d[x]=x==="rounds"?Number(C):C,x==="actMode"&&M?.(),f()}),n.id==="acting"){d.actMode="script",d.role=null,d.scriptEntries=[];let T=t.querySelector("#setup-script"),b=t.querySelector("#script-stats"),x=t.querySelector("#role-sec"),C=t.querySelector("#role-grid"),U=(L,P)=>t.querySelector(L)?.classList.toggle("hidden",!P);M=()=>{let L=d.actMode==="script";U("#script-sec",L),U("#field-list",!L),U("#len-sec",!L),U("#first-sec",!L)};let G=()=>{let L=d.scriptEntries=mc(T.value),P=new Map;L.forEach(H=>P.set(H.name,(P.get(H.name)||0)+1));let B=[...P.keys()];if(B.includes(d.role)||(d.role=null),!T.value.trim())b.textContent="";else if(B.length<2)b.textContent="Couldn\u2019t find two characters yet \u2014 use NAME: line.";else{let H=d.role?Bh(L,d.role).length:0;b.textContent=`${L.length} lines \xB7 ${B.length} characters${d.role?` \xB7 you have ${H} cue${H===1?"":"s"} (${H} credit${H===1?"":"s"})`:""}`}x.classList.toggle("hidden",B.length<2),C.innerHTML=B.slice(0,12).map(H=>`<button type="button" class="pill-chip" data-role="${gt(H)}" aria-pressed="${H===d.role}">${gt(Ml(H))} <span class="text-slate-500">\xB7 ${P.get(H)}</span></button>`).join("")},W=0;T.addEventListener("input",()=>{clearTimeout(W),W=setTimeout(G,250)}),C.addEventListener("click",L=>{let P=L.target.closest("[data-role]");P&&(d.role=P.getAttribute("data-role"),G())}),t.querySelector("#script-file").addEventListener("change",async L=>{let P=L.target.files?.[0];if(P){if(P.size>2e5)return b.textContent="That file is too big \u2014 paste just the scene you\u2019re rehearsing.";T.value=(await P.text()).slice(0,3e4),G()}}),M()}if(a){let T=t.querySelector("#persona-grid");for(let b of cu){let x=document.createElement("button");x.type="button",x.setAttribute("aria-pressed",b.id===d.persona.id?"true":"false"),x.className="persona-card flex items-start gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4 text-left hover:border-slate-500",x.innerHTML=`<span class="mt-0.5 shrink-0 text-accent-400 [&>svg]:h-6 [&>svg]:w-6">${b.icon}</span>
        <span class="min-w-0"><span class="block font-semibold leading-tight text-white">${gt(b.name)}</span>
        <span class="mt-0.5 block text-xs font-medium uppercase tracking-wide text-accent-400">${gt(b.tagline)}</span>
        <span class="mt-1.5 text-sm leading-snug text-slate-400 line-clamp-2">${gt(b.description)}</span></span>`,x.addEventListener("click",()=>{d.persona=b,T.querySelectorAll(".persona-card").forEach(C=>C.setAttribute("aria-pressed",String(C===x)))}),T.appendChild(x)}}let w=t.querySelector("#figure-grid");if(w){let T="";w.addEventListener("click",b=>{let x=b.target.closest(".figure-card");if(!x)return;d.figure=x.getAttribute("data-figure-id"),w.querySelectorAll(".figure-card").forEach(G=>G.setAttribute("aria-pressed",String(G===x)));let C=t.querySelector('[data-key="topic"]'),U=c.get(d.figure);C&&U&&(!C.value.trim()||C.value===T)&&(C.value=U.suggestedTopic||"",T=C.value),v()})}if(o){let T=t.querySelector("#rel-grid"),b=t.querySelector("#present-grid"),x=()=>t.querySelector("#setup-otherParty"),C=ms.find(G=>G.id===d.rel)?.otherParty||"",U=x();U&&!U.value.trim()&&(U.value=C),T.addEventListener("click",G=>{let W=G.target.closest("[data-rel]");if(!W)return;d.rel=W.getAttribute("data-rel"),T.querySelectorAll("[data-rel]").forEach(B=>B.setAttribute("aria-pressed",String(B===W)));let L=x(),P=ms.find(B=>B.id===d.rel);L&&P&&(!L.value.trim()||L.value===C)&&(L.value=P.otherParty,C=P.otherParty)}),b.addEventListener("click",G=>{let W=G.target.closest("[data-present]");W&&(d.present=W.getAttribute("data-present"),b.querySelectorAll("[data-present]").forEach(L=>L.setAttribute("aria-pressed",String(L===W))))})}let _=t.querySelector("#start-btn"),D=t.querySelector("#setup-error"),A=t.querySelector("#quota-slot"),R=T=>{Kr(D,T),D.classList.remove("hidden"),D.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"})};_.addEventListener("click",async()=>{ke.unlock(),na(),D.classList.add("hidden");let T={},b=null;l.length&&!d.figure&&(b="Pick a figure to spar with first.");let x=n.id==="acting"&&d.actMode==="script";for(let P of u){let B=(t.querySelector(`#setup-${CSS.escape(P.key)}`)?.value??"").trim();T[P.key]=B,P.required&&!B&&!b&&!x&&(b=`Please fill in \u201C${P.label}\u201D.`)}if(n.id==="acting"&&(T.actingMode=x?"script":"improv",x)){let P=t.querySelector("#setup-script").value.trim(),B=[...new Set(mc(P).map(H=>H.name))];P?B.length<2?b="We couldn\u2019t find two characters \u2014 put each line as NAME: line.":d.role||(b="Pick which character you\u2019re playing."):b="Paste your scene first.",T.script=P.slice(0,3e4),T.scriptRole=d.role||"",T.yourRole=Ml(d.role||""),T.partnerRole=B.filter(H=>H!==d.role).slice(0,3).map(Ml).join(" & "),T.sceneContext=""}if(b)return R(b);let C=d.figure?c.get(d.figure):null;C&&(T.figureId=C.id);let U=C?ym(C.id):o?Sm(d.rel,d.present):a?Tm(d.persona.id):Em(n.id);T.personaVisual=U;let G=Oh(U),W;a?W=d.persona.name:C?W=C.name:o?W=`Your ${(ms.find(P=>P.id===d.rel)?.label||"partner").toLowerCase()}`:n.id==="rapbattle"?W=String(T.mcName||"").trim()||"Verse Vice":n.id==="witness"?W=String(T.who||"").trim()||n.name:n.id==="interview"?W="Hiring manager":n.id==="thesis"?W="Thesis committee":n.id==="negotiation"?W=String(T.counterpartRole||"").trim()||"Counterpart":n.id==="sales"?W="The buyer":n.id==="acting"?W=String(T.partnerRole||"").trim()||"Scene partner":W=n.name;let L=Fm(n,T,C);s.side&&(T.userSide=d.side),n.id!=="acting"&&(T.difficulty=d.difficulty),T.personaLabel=W,_.disabled=!0,_.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Setting up\u2026</span>';try{let P=Ct("/api/debate/start",{mode:n.id,persona:a?d.persona.id:T.persona||void 0,topic:L,setup:T,targetRounds:d.rounds,firstSpeaker:d.first,debateStyle:s.styles?d.style:void 0}),B=d.first==="cointoss"?await Bm(P,W):await P,H=B.debateId;As("session_start",{mode:n.id}),Nm(H,{modeId:n.id,modeName:n.name,topic:L,personaLabel:W,judgeEnabled:!!B.judge,personaVisual:G.model,targetRounds:B.targetRounds??d.rounds,firstSpeaker:d.first,resolvedFirstSpeaker:B.resolvedFirstSpeaker||d.first,debateStyle:B.debateStyle||null,userSide:T.userSide||null,figureId:C?C.id:void 0}),location.hash=`#/session/${encodeURIComponent(H)}`}catch(P){P instanceof Lt&&P.status===402?(A.replaceChildren(pc()),_.classList.add("hidden"),m.classList.add("hidden")):(R(P instanceof Lt&&(P.body?.message||P.body?.error)||"Could not start the session. Please try again."),_.disabled=!1,_.textContent="Start session")}})}var al="170",Hh=0,fc=1,zh=2,Md=1,Vh=2,Vi=3,qi=0,Yt=1,Ci=2,hr=0,Jr=1,gc=2,vc=3,xc=4,Gh=5,Pr=100,$h=101,Wh=102,jh=103,qh=104,Xh=200,Yh=201,Kh=202,Zh=203,Fa=204,Ba=205,Jh=206,Qh=207,ep=208,tp=209,ip=210,rp=211,np=212,sp=213,ap=214,Ha=0,za=1,Va=2,en=3,Ga=4,$a=5,Wa=6,ja=7,Td=0,op=1,lp=2,pr=0,cp=1,dp=2,up=3,Ed=4,hp=5,pp=6,mp=7,_c="attached",fp="detached",Ad=300,tn=301,rn=302,qa=303,Xa=304,Js=306,nn=1e3,dr=1001,Rs=1002,Kt=1003,Rd=1004,Un=1005,si=1006,xs=1007,Wi=1008,Xi=1009,Cd=1010,Ld=1011,Bn=1012,ol=1013,Nr=1014,yi=1015,Jn=1016,ll=1017,cl=1018,sn=1020,Pd=35902,Id=1021,Dd=1022,ui=1023,Ud=1024,Nd=1025,Qr=1026,an=1027,dl=1028,ul=1029,kd=1030,hl=1031,pl=1033,_s=33776,ys=33777,bs=33778,Ss=33779,Ya=35840,Ka=35841,Za=35842,Ja=35843,Qa=36196,eo=37492,to=37496,io=37808,ro=37809,no=37810,so=37811,ao=37812,oo=37813,lo=37814,co=37815,uo=37816,ho=37817,po=37818,mo=37819,fo=37820,go=37821,ws=36492,vo=36494,xo=36495,Od=36283,_o=36284,yo=36285,bo=36286,Hn=2300,zn=2301,ka=2302,yc=2400,bc=2401,Sc=2402,gp=2500,vp=0,Fd=1,So=2,xp=3200,_p=3201,Bd=0,yp=1,cr="",Bt="srgb",Zt="srgb-linear",Qs="linear",ct="srgb",Xr=7680,wc=519,bp=512,Sp=513,wp=514,Hd=515,Mp=516,Tp=517,Ep=518,Ap=519,wo=35044,Mc="300 es",ji=2e3,Cs=2001,fr=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let i=this._listeners[e];if(i!==void 0){let n=i.indexOf(t);n!==-1&&i.splice(n,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let i=t.slice(0);for(let n=0,s=i.length;n<s;n++)i[n].call(this,e);e.target=null}}},jt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],du=1234567,Ms=Math.PI/180,Vn=180/Math.PI;function Di(){let r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(jt[r&255]+jt[r>>8&255]+jt[r>>16&255]+jt[r>>24&255]+"-"+jt[e&255]+jt[e>>8&255]+"-"+jt[e>>16&15|64]+jt[e>>24&255]+"-"+jt[t&63|128]+jt[t>>8&255]+"-"+jt[t>>16&255]+jt[t>>24&255]+jt[i&255]+jt[i>>8&255]+jt[i>>16&255]+jt[i>>24&255]).toLowerCase()}function Xt(r,e,t){return Math.max(e,Math.min(t,r))}function zd(r,e){return(r%e+e)%e}function zm(r,e,t,i,n){return i+(r-e)*(n-i)/(t-e)}function Vm(r,e,t){return r!==e?(t-r)/(e-r):0}function Ts(r,e,t){return(1-t)*r+t*e}function Gm(r,e,t,i){return Ts(r,e,1-Math.exp(-t*i))}function $m(r,e=1){return e-Math.abs(zd(r,e*2)-e)}function Wm(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e),r*r*(3-2*r))}function jm(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e),r*r*r*(r*(r*6-15)+10))}function qm(r,e){return r+Math.floor(Math.random()*(e-r+1))}function Xm(r,e){return r+Math.random()*(e-r)}function Ym(r){return r*(.5-Math.random())}function Km(r){r!==void 0&&(du=r);let e=du+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Zm(r){return r*Ms}function Jm(r){return r*Vn}function Qm(r){return(r&r-1)===0&&r!==0}function ef(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function tf(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function rf(r,e,t,i,n){let s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+i)/2),d=a((e+i)/2),u=s((e-i)/2),h=a((e-i)/2),p=s((i-e)/2),g=a((i-e)/2);switch(n){case"XYX":r.set(o*d,l*u,l*h,o*c);break;case"YZY":r.set(l*h,o*d,l*u,o*c);break;case"ZXZ":r.set(l*u,l*h,o*d,o*c);break;case"XZX":r.set(o*d,l*g,l*p,o*c);break;case"YXY":r.set(l*p,o*d,l*g,o*c);break;case"ZYZ":r.set(l*g,l*p,o*d,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function Li(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function dt(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}var Rp={DEG2RAD:Ms,RAD2DEG:Vn,generateUUID:Di,clamp:Xt,euclideanModulo:zd,mapLinear:zm,inverseLerp:Vm,lerp:Ts,damp:Gm,pingpong:$m,smoothstep:Wm,smootherstep:jm,randInt:qm,randFloat:Xm,randFloatSpread:Ym,seededRandom:Km,degToRad:Zm,radToDeg:Jm,isPowerOfTwo:Qm,ceilPowerOfTwo:ef,floorPowerOfTwo:tf,setQuaternionFromProperEuler:rf,normalize:dt,denormalize:Li},nt=class r{constructor(e=0,t=0){r.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,n=e.elements;return this.x=n[0]*t+n[3]*i+n[6],this.y=n[1]*t+n[4]*i+n[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Xt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),n=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*n+e.x,this.y=s*n+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},$e=class r{constructor(e,t,i,n,s,a,o,l,c){r.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,n,s,a,o,l,c)}set(e,t,i,n,s,a,o,l,c){let d=this.elements;return d[0]=e,d[1]=n,d[2]=o,d[3]=t,d[4]=s,d[5]=l,d[6]=i,d[7]=a,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,n=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],d=i[4],u=i[7],h=i[2],p=i[5],g=i[8],v=n[0],m=n[3],f=n[6],M=n[1],w=n[4],_=n[7],D=n[2],A=n[5],R=n[8];return s[0]=a*v+o*M+l*D,s[3]=a*m+o*w+l*A,s[6]=a*f+o*_+l*R,s[1]=c*v+d*M+u*D,s[4]=c*m+d*w+u*A,s[7]=c*f+d*_+u*R,s[2]=h*v+p*M+g*D,s[5]=h*m+p*w+g*A,s[8]=h*f+p*_+g*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8];return t*a*d-t*o*c-i*s*d+i*o*l+n*s*c-n*a*l}invert(){let e=this.elements,t=e[0],i=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],u=d*a-o*c,h=o*l-d*s,p=c*s-a*l,g=t*u+i*h+n*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return e[0]=u*v,e[1]=(n*c-d*i)*v,e[2]=(o*i-n*a)*v,e[3]=h*v,e[4]=(d*t-n*l)*v,e[5]=(n*s-o*t)*v,e[6]=p*v,e[7]=(i*l-c*t)*v,e[8]=(a*t-i*s)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,n,s,a,o){let l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-n*c,n*l,-n*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Tl.makeScale(e,t)),this}rotate(e){return this.premultiply(Tl.makeRotation(-e)),this}translate(e,t){return this.premultiply(Tl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let n=0;n<9;n++)if(t[n]!==i[n])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Tl=new $e;function Cp(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function Ls(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Lp(){let r=Ls("canvas");return r.style.display="block",r}var uu={};function fs(r){r in uu||(uu[r]=!0,console.warn(r))}function nf(r,e,t){return new Promise(function(i,n){function s(){switch(r.clientWaitSync(e,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:n();break;case r.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}function sf(r){let e=r.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function af(r){let e=r.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var it={enabled:!0,workingColorSpace:Zt,spaces:{},convert:function(r,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===ct&&(r.r=mr(r.r),r.g=mr(r.g),r.b=mr(r.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(r.applyMatrix3(this.spaces[e].toXYZ),r.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===ct&&(r.r=kn(r.r),r.g=kn(r.g),r.b=kn(r.b))),r},fromWorkingColorSpace:function(r,e){return this.convert(r,this.workingColorSpace,e)},toWorkingColorSpace:function(r,e){return this.convert(r,e,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===cr?Qs:this.spaces[r].transfer},getLuminanceCoefficients:function(r,e=this.workingColorSpace){return r.fromArray(this.spaces[e].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,e,t){return r.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}};function mr(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function kn(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}var hu=[.64,.33,.3,.6,.15,.06],pu=[.2126,.7152,.0722],mu=[.3127,.329],fu=new $e().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),gu=new $e().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);it.define({[Zt]:{primaries:hu,whitePoint:mu,transfer:Qs,toXYZ:fu,fromXYZ:gu,luminanceCoefficients:pu,workingColorSpaceConfig:{unpackColorSpace:Bt},outputColorSpaceConfig:{drawingBufferColorSpace:Bt}},[Bt]:{primaries:hu,whitePoint:mu,transfer:ct,toXYZ:fu,fromXYZ:gu,luminanceCoefficients:pu,outputColorSpaceConfig:{drawingBufferColorSpace:Bt}}});var xn,Mo=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{xn===void 0&&(xn=Ls("canvas")),xn.width=e.width,xn.height=e.height;let i=xn.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=xn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ls("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let n=i.getImageData(0,0,e.width,e.height),s=n.data;for(let a=0;a<s.length;a++)s[a]=mr(s[a]/255)*255;return i.putImageData(n,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(mr(t[i]/255)*255):t[i]=mr(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},of=0,Ps=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:of++}),this.uuid=Di(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},n=this.data;if(n!==null){let s;if(Array.isArray(n)){s=[];for(let a=0,o=n.length;a<o;a++)n[a].isDataTexture?s.push(El(n[a].image)):s.push(El(n[a]))}else s=El(n);i.url=s}return t||(e.images[this.uuid]=i),i}};function El(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?Mo.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var lf=0,Vt=class r extends fr{constructor(e=r.DEFAULT_IMAGE,t=r.DEFAULT_MAPPING,i=dr,n=dr,s=si,a=Wi,o=ui,l=Xi,c=r.DEFAULT_ANISOTROPY,d=cr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:lf++}),this.uuid=Di(),this.name="",this.source=new Ps(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=n,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new nt(0,0),this.repeat=new nt(1,1),this.center=new nt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new $e,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ad)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case nn:e.x=e.x-Math.floor(e.x);break;case dr:e.x=e.x<0?0:1;break;case Rs:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case nn:e.y=e.y-Math.floor(e.y);break;case dr:e.y=e.y<0?0:1;break;case Rs:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Vt.DEFAULT_IMAGE=null;Vt.DEFAULT_MAPPING=Ad;Vt.DEFAULT_ANISOTROPY=1;var at=class r{constructor(e=0,t=0,i=0,n=1){r.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=n}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,n){return this.x=e,this.y=t,this.z=i,this.w=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,n=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*n+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*n+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*n+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*n+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,n,s,a=e.elements,o=a[0],l=a[4],c=a[8],d=a[1],u=a[5],h=a[9],p=a[2],g=a[6],v=a[10];if(Math.abs(l-d)<.01&&Math.abs(c-p)<.01&&Math.abs(h-g)<.01){if(Math.abs(l+d)<.1&&Math.abs(c+p)<.1&&Math.abs(h+g)<.1&&Math.abs(o+u+v-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let f=(o+1)/2,M=(u+1)/2,w=(v+1)/2,_=(l+d)/4,D=(c+p)/4,A=(h+g)/4;return f>M&&f>w?f<.01?(i=0,n=.707106781,s=.707106781):(i=Math.sqrt(f),n=_/i,s=D/i):M>w?M<.01?(i=.707106781,n=0,s=.707106781):(n=Math.sqrt(M),i=_/n,s=A/n):w<.01?(i=.707106781,n=.707106781,s=0):(s=Math.sqrt(w),i=D/s,n=A/s),this.set(i,n,s,t),this}let m=Math.sqrt((g-h)*(g-h)+(c-p)*(c-p)+(d-l)*(d-l));return Math.abs(m)<.001&&(m=1),this.x=(g-h)/m,this.y=(c-p)/m,this.z=(d-l)/m,this.w=Math.acos((o+u+v-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},To=class extends fr{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new at(0,0,e,t),this.scissorTest=!1,this.viewport=new at(0,0,e,t);let n={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:si,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let s=new Vt(n,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];let a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let n=0,s=this.textures.length;n<s;n++)this.textures[n].image.width=e,this.textures[n].image.height=t,this.textures[n].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,n=e.textures.length;i<n;i++)this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Ps(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Yi=class extends To{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Is=class extends Vt{constructor(e=null,t=1,i=1,n=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:n},this.magFilter=Kt,this.minFilter=Kt,this.wrapR=dr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Eo=class extends Vt{constructor(e=null,t=1,i=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:n},this.magFilter=Kt,this.minFilter=Kt,this.wrapR=dr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ni=class{constructor(e=0,t=0,i=0,n=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=n}static slerpFlat(e,t,i,n,s,a,o){let l=i[n+0],c=i[n+1],d=i[n+2],u=i[n+3],h=s[a+0],p=s[a+1],g=s[a+2],v=s[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u;return}if(o===1){e[t+0]=h,e[t+1]=p,e[t+2]=g,e[t+3]=v;return}if(u!==v||l!==h||c!==p||d!==g){let m=1-o,f=l*h+c*p+d*g+u*v,M=f>=0?1:-1,w=1-f*f;if(w>Number.EPSILON){let D=Math.sqrt(w),A=Math.atan2(D,f*M);m=Math.sin(m*A)/D,o=Math.sin(o*A)/D}let _=o*M;if(l=l*m+h*_,c=c*m+p*_,d=d*m+g*_,u=u*m+v*_,m===1-o){let D=1/Math.sqrt(l*l+c*c+d*d+u*u);l*=D,c*=D,d*=D,u*=D}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,n,s,a){let o=i[n],l=i[n+1],c=i[n+2],d=i[n+3],u=s[a],h=s[a+1],p=s[a+2],g=s[a+3];return e[t]=o*g+d*u+l*p-c*h,e[t+1]=l*g+d*h+c*u-o*p,e[t+2]=c*g+d*p+o*h-l*u,e[t+3]=d*g-o*u-l*h-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,n){return this._x=e,this._y=t,this._z=i,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,n=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),d=o(n/2),u=o(s/2),h=l(i/2),p=l(n/2),g=l(s/2);switch(a){case"XYZ":this._x=h*d*u+c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u-h*p*g;break;case"YXZ":this._x=h*d*u+c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u+h*p*g;break;case"ZXY":this._x=h*d*u-c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u-h*p*g;break;case"ZYX":this._x=h*d*u-c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u+h*p*g;break;case"YZX":this._x=h*d*u+c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u-h*p*g;break;case"XZY":this._x=h*d*u-c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u+h*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,n=Math.sin(i);return this._x=e.x*n,this._y=e.y*n,this._z=e.z*n,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],n=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],d=t[6],u=t[10],h=i+o+u;if(h>0){let p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(d-l)*p,this._y=(s-c)*p,this._z=(a-n)*p}else if(i>o&&i>u){let p=2*Math.sqrt(1+i-o-u);this._w=(d-l)/p,this._x=.25*p,this._y=(n+a)/p,this._z=(s+c)/p}else if(o>u){let p=2*Math.sqrt(1+o-i-u);this._w=(s-c)/p,this._x=(n+a)/p,this._y=.25*p,this._z=(l+d)/p}else{let p=2*Math.sqrt(1+u-i-o);this._w=(a-n)/p,this._x=(s+c)/p,this._y=(l+d)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Xt(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let n=Math.min(1,t/i);return this.slerp(e,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,n=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,d=t._w;return this._x=i*d+a*o+n*c-s*l,this._y=n*d+a*l+s*o-i*c,this._z=s*d+a*c+i*l-n*o,this._w=a*d-i*o-n*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,n=this._y,s=this._z,a=this._w,o=a*e._w+i*e._x+n*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=i,this._y=n,this._z=s,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*i+t*this._x,this._y=p*n+t*this._y,this._z=p*s+t*this._z,this.normalize(),this}let c=Math.sqrt(l),d=Math.atan2(c,o),u=Math.sin((1-t)*d)/c,h=Math.sin(t*d)/c;return this._w=a*u+this._w*h,this._x=i*u+this._x*h,this._y=n*u+this._y*h,this._z=s*u+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),n=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(n*Math.sin(e),n*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},z=class r{constructor(e=0,t=0,i=0){r.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(vu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(vu.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,n=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*n,this.y=s[1]*t+s[4]*i+s[7]*n,this.z=s[2]*t+s[5]*i+s[8]*n,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,n=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*n+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*n+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*n+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*n+s[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,n=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*n-o*i),d=2*(o*t-s*n),u=2*(s*i-a*t);return this.x=t+l*c+a*u-o*d,this.y=i+l*d+o*c-s*u,this.z=n+l*u+s*d-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,n=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*n,this.y=s[1]*t+s[5]*i+s[9]*n,this.z=s[2]*t+s[6]*i+s[10]*n,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,n=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=n*l-s*o,this.y=s*a-i*l,this.z=i*o-n*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Al.copy(this).projectOnVector(e),this.sub(Al)}reflect(e){return this.sub(Al.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Xt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,n=this.z-e.z;return t*t+i*i+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let n=Math.sin(t)*e;return this.x=n*Math.sin(i),this.y=Math.cos(t)*e,this.z=n*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),n=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=n,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Al=new z,vu=new Ni,Si=class{constructor(e=new z(1/0,1/0,1/0),t=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Ti.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Ti.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Ti.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Ti):Ti.fromBufferAttribute(s,a),Ti.applyMatrix4(e.matrixWorld),this.expandByPoint(Ti);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),la.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),la.copy(i.boundingBox)),la.applyMatrix4(e.matrixWorld),this.union(la)}let n=e.children;for(let s=0,a=n.length;s<a;s++)this.expandByObject(n[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ti),Ti.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ss),ca.subVectors(this.max,ss),_n.subVectors(e.a,ss),yn.subVectors(e.b,ss),bn.subVectors(e.c,ss),Mr.subVectors(yn,_n),Tr.subVectors(bn,yn),zr.subVectors(_n,bn);let t=[0,-Mr.z,Mr.y,0,-Tr.z,Tr.y,0,-zr.z,zr.y,Mr.z,0,-Mr.x,Tr.z,0,-Tr.x,zr.z,0,-zr.x,-Mr.y,Mr.x,0,-Tr.y,Tr.x,0,-zr.y,zr.x,0];return!Rl(t,_n,yn,bn,ca)||(t=[1,0,0,0,1,0,0,0,1],!Rl(t,_n,yn,bn,ca))?!1:(da.crossVectors(Mr,Tr),t=[da.x,da.y,da.z],Rl(t,_n,yn,bn,ca))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ti).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ti).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ir[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ir[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ir[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ir[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ir[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ir[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ir[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ir[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ir),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},ir=[new z,new z,new z,new z,new z,new z,new z,new z],Ti=new z,la=new Si,_n=new z,yn=new z,bn=new z,Mr=new z,Tr=new z,zr=new z,ss=new z,ca=new z,da=new z,Vr=new z;function Rl(r,e,t,i,n){for(let s=0,a=r.length-3;s<=a;s+=3){Vr.fromArray(r,s);let o=n.x*Math.abs(Vr.x)+n.y*Math.abs(Vr.y)+n.z*Math.abs(Vr.z),l=e.dot(Vr),c=t.dot(Vr),d=i.dot(Vr);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>o)return!1}return!0}var cf=new Si,as=new z,Cl=new z,pi=class{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):cf.setFromPoints(e).getCenter(i);let n=0;for(let s=0,a=e.length;s<a;s++)n=Math.max(n,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(n),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;as.subVectors(e,this.center);let t=as.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),n=(i-this.radius)*.5;this.center.addScaledVector(as,n/i),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Cl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(as.copy(e.center).add(Cl)),this.expandByPoint(as.copy(e.center).sub(Cl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},rr=new z,Ll=new z,ua=new z,Er=new z,Pl=new z,ha=new z,Il=new z,on=class{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,rr)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=rr.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(rr.copy(this.origin).addScaledVector(this.direction,t),rr.distanceToSquared(e))}distanceSqToSegment(e,t,i,n){Ll.copy(e).add(t).multiplyScalar(.5),ua.copy(t).sub(e).normalize(),Er.copy(this.origin).sub(Ll);let s=e.distanceTo(t)*.5,a=-this.direction.dot(ua),o=Er.dot(this.direction),l=-Er.dot(ua),c=Er.lengthSq(),d=Math.abs(1-a*a),u,h,p,g;if(d>0)if(u=a*l-o,h=a*o-l,g=s*d,u>=0)if(h>=-g)if(h<=g){let v=1/d;u*=v,h*=v,p=u*(u+a*h+2*o)+h*(a*u+h+2*l)+c}else h=s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;else h=-s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;else h<=-g?(u=Math.max(0,-(-a*s+o)),h=u>0?-s:Math.min(Math.max(-s,-l),s),p=-u*u+h*(h+2*l)+c):h<=g?(u=0,h=Math.min(Math.max(-s,-l),s),p=h*(h+2*l)+c):(u=Math.max(0,-(a*s+o)),h=u>0?s:Math.min(Math.max(-s,-l),s),p=-u*u+h*(h+2*l)+c);else h=a>0?-s:s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),n&&n.copy(Ll).addScaledVector(ua,h),p}intersectSphere(e,t){rr.subVectors(e.center,this.origin);let i=rr.dot(this.direction),n=rr.dot(rr)-i*i,s=e.radius*e.radius;if(n>s)return null;let a=Math.sqrt(s-n),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,n,s,a,o,l,c=1/this.direction.x,d=1/this.direction.y,u=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,n=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,n=(e.min.x-h.x)*c),d>=0?(s=(e.min.y-h.y)*d,a=(e.max.y-h.y)*d):(s=(e.max.y-h.y)*d,a=(e.min.y-h.y)*d),i>a||s>n||((s>i||isNaN(i))&&(i=s),(a<n||isNaN(n))&&(n=a),u>=0?(o=(e.min.z-h.z)*u,l=(e.max.z-h.z)*u):(o=(e.max.z-h.z)*u,l=(e.min.z-h.z)*u),i>l||o>n)||((o>i||i!==i)&&(i=o),(l<n||n!==n)&&(n=l),n<0)?null:this.at(i>=0?i:n,t)}intersectsBox(e){return this.intersectBox(e,rr)!==null}intersectTriangle(e,t,i,n,s){Pl.subVectors(t,e),ha.subVectors(i,e),Il.crossVectors(Pl,ha);let a=this.direction.dot(Il),o;if(a>0){if(n)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Er.subVectors(this.origin,e);let l=o*this.direction.dot(ha.crossVectors(Er,ha));if(l<0)return null;let c=o*this.direction.dot(Pl.cross(Er));if(c<0||l+c>a)return null;let d=-o*Er.dot(Il);return d<0?null:this.at(d/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},je=class r{constructor(e,t,i,n,s,a,o,l,c,d,u,h,p,g,v,m){r.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,n,s,a,o,l,c,d,u,h,p,g,v,m)}set(e,t,i,n,s,a,o,l,c,d,u,h,p,g,v,m){let f=this.elements;return f[0]=e,f[4]=t,f[8]=i,f[12]=n,f[1]=s,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=d,f[10]=u,f[14]=h,f[3]=p,f[7]=g,f[11]=v,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new r().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,n=1/Sn.setFromMatrixColumn(e,0).length(),s=1/Sn.setFromMatrixColumn(e,1).length(),a=1/Sn.setFromMatrixColumn(e,2).length();return t[0]=i[0]*n,t[1]=i[1]*n,t[2]=i[2]*n,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,n=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(n),c=Math.sin(n),d=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){let h=a*d,p=a*u,g=o*d,v=o*u;t[0]=l*d,t[4]=-l*u,t[8]=c,t[1]=p+g*c,t[5]=h-v*c,t[9]=-o*l,t[2]=v-h*c,t[6]=g+p*c,t[10]=a*l}else if(e.order==="YXZ"){let h=l*d,p=l*u,g=c*d,v=c*u;t[0]=h+v*o,t[4]=g*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*d,t[9]=-o,t[2]=p*o-g,t[6]=v+h*o,t[10]=a*l}else if(e.order==="ZXY"){let h=l*d,p=l*u,g=c*d,v=c*u;t[0]=h-v*o,t[4]=-a*u,t[8]=g+p*o,t[1]=p+g*o,t[5]=a*d,t[9]=v-h*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let h=a*d,p=a*u,g=o*d,v=o*u;t[0]=l*d,t[4]=g*c-p,t[8]=h*c+v,t[1]=l*u,t[5]=v*c+h,t[9]=p*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let h=a*l,p=a*c,g=o*l,v=o*c;t[0]=l*d,t[4]=v-h*u,t[8]=g*u+p,t[1]=u,t[5]=a*d,t[9]=-o*d,t[2]=-c*d,t[6]=p*u+g,t[10]=h-v*u}else if(e.order==="XZY"){let h=a*l,p=a*c,g=o*l,v=o*c;t[0]=l*d,t[4]=-u,t[8]=c*d,t[1]=h*u+v,t[5]=a*d,t[9]=p*u-g,t[2]=g*u-p,t[6]=o*d,t[10]=v*u+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(df,e,uf)}lookAt(e,t,i){let n=this.elements;return ci.subVectors(e,t),ci.lengthSq()===0&&(ci.z=1),ci.normalize(),Ar.crossVectors(i,ci),Ar.lengthSq()===0&&(Math.abs(i.z)===1?ci.x+=1e-4:ci.z+=1e-4,ci.normalize(),Ar.crossVectors(i,ci)),Ar.normalize(),pa.crossVectors(ci,Ar),n[0]=Ar.x,n[4]=pa.x,n[8]=ci.x,n[1]=Ar.y,n[5]=pa.y,n[9]=ci.y,n[2]=Ar.z,n[6]=pa.z,n[10]=ci.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,n=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],d=i[1],u=i[5],h=i[9],p=i[13],g=i[2],v=i[6],m=i[10],f=i[14],M=i[3],w=i[7],_=i[11],D=i[15],A=n[0],R=n[4],T=n[8],b=n[12],x=n[1],C=n[5],U=n[9],G=n[13],W=n[2],L=n[6],P=n[10],B=n[14],H=n[3],Z=n[7],ne=n[11],de=n[15];return s[0]=a*A+o*x+l*W+c*H,s[4]=a*R+o*C+l*L+c*Z,s[8]=a*T+o*U+l*P+c*ne,s[12]=a*b+o*G+l*B+c*de,s[1]=d*A+u*x+h*W+p*H,s[5]=d*R+u*C+h*L+p*Z,s[9]=d*T+u*U+h*P+p*ne,s[13]=d*b+u*G+h*B+p*de,s[2]=g*A+v*x+m*W+f*H,s[6]=g*R+v*C+m*L+f*Z,s[10]=g*T+v*U+m*P+f*ne,s[14]=g*b+v*G+m*B+f*de,s[3]=M*A+w*x+_*W+D*H,s[7]=M*R+w*C+_*L+D*Z,s[11]=M*T+w*U+_*P+D*ne,s[15]=M*b+w*G+_*B+D*de,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],n=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],d=e[2],u=e[6],h=e[10],p=e[14],g=e[3],v=e[7],m=e[11],f=e[15];return g*(+s*l*u-n*c*u-s*o*h+i*c*h+n*o*p-i*l*p)+v*(+t*l*p-t*c*h+s*a*h-n*a*p+n*c*d-s*l*d)+m*(+t*c*u-t*o*p-s*a*u+i*a*p+s*o*d-i*c*d)+f*(-n*o*d-t*l*u+t*o*h+n*a*u-i*a*h+i*l*d)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let n=this.elements;return e.isVector3?(n[12]=e.x,n[13]=e.y,n[14]=e.z):(n[12]=e,n[13]=t,n[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],u=e[9],h=e[10],p=e[11],g=e[12],v=e[13],m=e[14],f=e[15],M=u*m*c-v*h*c+v*l*p-o*m*p-u*l*f+o*h*f,w=g*h*c-d*m*c-g*l*p+a*m*p+d*l*f-a*h*f,_=d*v*c-g*u*c+g*o*p-a*v*p-d*o*f+a*u*f,D=g*u*l-d*v*l-g*o*h+a*v*h+d*o*m-a*u*m,A=t*M+i*w+n*_+s*D;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let R=1/A;return e[0]=M*R,e[1]=(v*h*s-u*m*s-v*n*p+i*m*p+u*n*f-i*h*f)*R,e[2]=(o*m*s-v*l*s+v*n*c-i*m*c-o*n*f+i*l*f)*R,e[3]=(u*l*s-o*h*s-u*n*c+i*h*c+o*n*p-i*l*p)*R,e[4]=w*R,e[5]=(d*m*s-g*h*s+g*n*p-t*m*p-d*n*f+t*h*f)*R,e[6]=(g*l*s-a*m*s-g*n*c+t*m*c+a*n*f-t*l*f)*R,e[7]=(a*h*s-d*l*s+d*n*c-t*h*c-a*n*p+t*l*p)*R,e[8]=_*R,e[9]=(g*u*s-d*v*s-g*i*p+t*v*p+d*i*f-t*u*f)*R,e[10]=(a*v*s-g*o*s+g*i*c-t*v*c-a*i*f+t*o*f)*R,e[11]=(d*o*s-a*u*s-d*i*c+t*u*c+a*i*p-t*o*p)*R,e[12]=D*R,e[13]=(d*v*n-g*u*n+g*i*h-t*v*h-d*i*m+t*u*m)*R,e[14]=(g*o*n-a*v*n-g*i*l+t*v*l+a*i*m-t*o*m)*R,e[15]=(a*u*n-d*o*n+d*i*l-t*u*l-a*i*h+t*o*h)*R,this}scale(e){let t=this.elements,i=e.x,n=e.y,s=e.z;return t[0]*=i,t[4]*=n,t[8]*=s,t[1]*=i,t[5]*=n,t[9]*=s,t[2]*=i,t[6]*=n,t[10]*=s,t[3]*=i,t[7]*=n,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],n=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,n))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),n=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,d=s*o;return this.set(c*a+i,c*o-n*l,c*l+n*o,0,c*o+n*l,d*o+i,d*l-n*a,0,c*l-n*o,d*l+n*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,n,s,a){return this.set(1,i,s,0,e,1,a,0,t,n,1,0,0,0,0,1),this}compose(e,t,i){let n=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,d=a+a,u=o+o,h=s*c,p=s*d,g=s*u,v=a*d,m=a*u,f=o*u,M=l*c,w=l*d,_=l*u,D=i.x,A=i.y,R=i.z;return n[0]=(1-(v+f))*D,n[1]=(p+_)*D,n[2]=(g-w)*D,n[3]=0,n[4]=(p-_)*A,n[5]=(1-(h+f))*A,n[6]=(m+M)*A,n[7]=0,n[8]=(g+w)*R,n[9]=(m-M)*R,n[10]=(1-(h+v))*R,n[11]=0,n[12]=e.x,n[13]=e.y,n[14]=e.z,n[15]=1,this}decompose(e,t,i){let n=this.elements,s=Sn.set(n[0],n[1],n[2]).length(),a=Sn.set(n[4],n[5],n[6]).length(),o=Sn.set(n[8],n[9],n[10]).length();this.determinant()<0&&(s=-s),e.x=n[12],e.y=n[13],e.z=n[14],Ei.copy(this);let l=1/s,c=1/a,d=1/o;return Ei.elements[0]*=l,Ei.elements[1]*=l,Ei.elements[2]*=l,Ei.elements[4]*=c,Ei.elements[5]*=c,Ei.elements[6]*=c,Ei.elements[8]*=d,Ei.elements[9]*=d,Ei.elements[10]*=d,t.setFromRotationMatrix(Ei),i.x=s,i.y=a,i.z=o,this}makePerspective(e,t,i,n,s,a,o=ji){let l=this.elements,c=2*s/(t-e),d=2*s/(i-n),u=(t+e)/(t-e),h=(i+n)/(i-n),p,g;if(o===ji)p=-(a+s)/(a-s),g=-2*a*s/(a-s);else if(o===Cs)p=-a/(a-s),g=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,n,s,a,o=ji){let l=this.elements,c=1/(t-e),d=1/(i-n),u=1/(a-s),h=(t+e)*c,p=(i+n)*d,g,v;if(o===ji)g=(a+s)*u,v=-2*u;else if(o===Cs)g=s*u,v=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*d,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let n=0;n<16;n++)if(t[n]!==i[n])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Sn=new z,Ei=new je,df=new z(0,0,0),uf=new z(1,1,1),Ar=new z,pa=new z,ci=new z,xu=new je,_u=new Ni,ki=class r{constructor(e=0,t=0,i=0,n=r.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=n}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,n=this._order){return this._x=e,this._y=t,this._z=i,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let n=e.elements,s=n[0],a=n[4],o=n[8],l=n[1],c=n[5],d=n[9],u=n[2],h=n[6],p=n[10];switch(t){case"XYZ":this._y=Math.asin(Xt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,p),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Xt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(Xt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Xt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Xt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Xt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-d,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return xu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(xu,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return _u.setFromEuler(this),this.setFromQuaternion(_u,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ki.DEFAULT_ORDER="XYZ";var Ds=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},hf=0,yu=new z,wn=new Ni,nr=new je,ma=new z,os=new z,pf=new z,mf=new Ni,bu=new z(1,0,0),Su=new z(0,1,0),wu=new z(0,0,1),Mu={type:"added"},ff={type:"removed"},Mn={type:"childadded",child:null},Dl={type:"childremoved",child:null},Tt=class r extends fr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:hf++}),this.uuid=Di(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=r.DEFAULT_UP.clone();let e=new z,t=new ki,i=new Ni,n=new z(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new je},normalMatrix:{value:new $e}}),this.matrix=new je,this.matrixWorld=new je,this.matrixAutoUpdate=r.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=r.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ds,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return wn.setFromAxisAngle(e,t),this.quaternion.multiply(wn),this}rotateOnWorldAxis(e,t){return wn.setFromAxisAngle(e,t),this.quaternion.premultiply(wn),this}rotateX(e){return this.rotateOnAxis(bu,e)}rotateY(e){return this.rotateOnAxis(Su,e)}rotateZ(e){return this.rotateOnAxis(wu,e)}translateOnAxis(e,t){return yu.copy(e).applyQuaternion(this.quaternion),this.position.add(yu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(bu,e)}translateY(e){return this.translateOnAxis(Su,e)}translateZ(e){return this.translateOnAxis(wu,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(nr.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?ma.copy(e):ma.set(e,t,i);let n=this.parent;this.updateWorldMatrix(!0,!1),os.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?nr.lookAt(os,ma,this.up):nr.lookAt(ma,os,this.up),this.quaternion.setFromRotationMatrix(nr),n&&(nr.extractRotation(n.matrixWorld),wn.setFromRotationMatrix(nr),this.quaternion.premultiply(wn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Mu),Mn.child=e,this.dispatchEvent(Mn),Mn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ff),Dl.child=e,this.dispatchEvent(Dl),Dl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),nr.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),nr.multiply(e.parent.matrixWorld)),e.applyMatrix4(nr),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Mu),Mn.child=e,this.dispatchEvent(Mn),Mn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,n=this.children.length;i<n;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let n=this.children;for(let s=0,a=n.length;s<a;s++)n[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(os,e,pf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(os,mf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let n=this.children;for(let s=0,a=n.length;s<a;s++)n[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.visibility=this._visibility,n.active=this._active,n.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),n.maxInstanceCount=this._maxInstanceCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.geometryCount=this._geometryCount,n.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(n.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(n.boundingSphere={center:n.boundingSphere.center.toArray(),radius:n.boundingSphere.radius}),this.boundingBox!==null&&(n.boundingBox={min:n.boundingBox.min.toArray(),max:n.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){let u=l[c];s(e.shapes,u)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));n.material=o}else n.material=s(e.materials,this.material);if(this.children.length>0){n.children=[];for(let o=0;o<this.children.length;o++)n.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){n.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];n.animations.push(s(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),d=a(e.images),u=a(e.shapes),h=a(e.skeletons),p=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),u.length>0&&(i.shapes=u),h.length>0&&(i.skeletons=h),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=n,i;function a(o){let l=[];for(let c in o){let d=o[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let n=e.children[i];this.add(n.clone())}return this}};Tt.DEFAULT_UP=new z(0,1,0);Tt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ai=new z,sr=new z,Ul=new z,ar=new z,Tn=new z,En=new z,Tu=new z,Nl=new z,kl=new z,Ol=new z,Fl=new at,Bl=new at,Hl=new at,Ir=class r{constructor(e=new z,t=new z,i=new z){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,n){n.subVectors(i,t),Ai.subVectors(e,t),n.cross(Ai);let s=n.lengthSq();return s>0?n.multiplyScalar(1/Math.sqrt(s)):n.set(0,0,0)}static getBarycoord(e,t,i,n,s){Ai.subVectors(n,t),sr.subVectors(i,t),Ul.subVectors(e,t);let a=Ai.dot(Ai),o=Ai.dot(sr),l=Ai.dot(Ul),c=sr.dot(sr),d=sr.dot(Ul),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;let h=1/u,p=(c*l-o*d)*h,g=(a*d-o*l)*h;return s.set(1-p-g,g,p)}static containsPoint(e,t,i,n){return this.getBarycoord(e,t,i,n,ar)===null?!1:ar.x>=0&&ar.y>=0&&ar.x+ar.y<=1}static getInterpolation(e,t,i,n,s,a,o,l){return this.getBarycoord(e,t,i,n,ar)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,ar.x),l.addScaledVector(a,ar.y),l.addScaledVector(o,ar.z),l)}static getInterpolatedAttribute(e,t,i,n,s,a){return Fl.setScalar(0),Bl.setScalar(0),Hl.setScalar(0),Fl.fromBufferAttribute(e,t),Bl.fromBufferAttribute(e,i),Hl.fromBufferAttribute(e,n),a.setScalar(0),a.addScaledVector(Fl,s.x),a.addScaledVector(Bl,s.y),a.addScaledVector(Hl,s.z),a}static isFrontFacing(e,t,i,n){return Ai.subVectors(i,t),sr.subVectors(e,t),Ai.cross(sr).dot(n)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,n){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[n]),this}setFromAttributeAndIndices(e,t,i,n){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ai.subVectors(this.c,this.b),sr.subVectors(this.a,this.b),Ai.cross(sr).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return r.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return r.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,n,s){return r.getInterpolation(e,this.a,this.b,this.c,t,i,n,s)}containsPoint(e){return r.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return r.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,n=this.b,s=this.c,a,o;Tn.subVectors(n,i),En.subVectors(s,i),Nl.subVectors(e,i);let l=Tn.dot(Nl),c=En.dot(Nl);if(l<=0&&c<=0)return t.copy(i);kl.subVectors(e,n);let d=Tn.dot(kl),u=En.dot(kl);if(d>=0&&u<=d)return t.copy(n);let h=l*u-d*c;if(h<=0&&l>=0&&d<=0)return a=l/(l-d),t.copy(i).addScaledVector(Tn,a);Ol.subVectors(e,s);let p=Tn.dot(Ol),g=En.dot(Ol);if(g>=0&&p<=g)return t.copy(s);let v=p*c-l*g;if(v<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(i).addScaledVector(En,o);let m=d*g-p*u;if(m<=0&&u-d>=0&&p-g>=0)return Tu.subVectors(s,n),o=(u-d)/(u-d+(p-g)),t.copy(n).addScaledVector(Tu,o);let f=1/(m+v+h);return a=v*f,o=h*f,t.copy(i).addScaledVector(Tn,a).addScaledVector(En,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Pp={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Rr={h:0,s:0,l:0},fa={h:0,s:0,l:0};function zl(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+(e-r)*6*t:t<1/2?e:t<2/3?r+(e-r)*6*(2/3-t):r}var Be=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let n=e;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Bt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,it.toWorkingColorSpace(this,t),this}setRGB(e,t,i,n=it.workingColorSpace){return this.r=e,this.g=t,this.b=i,it.toWorkingColorSpace(this,n),this}setHSL(e,t,i,n=it.workingColorSpace){if(e=zd(e,1),t=Xt(t,0,1),i=Xt(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=zl(a,s,e+1/3),this.g=zl(a,s,e),this.b=zl(a,s,e-1/3)}return it.toWorkingColorSpace(this,n),this}setStyle(e,t=Bt){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=n[1],o=n[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=n[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Bt){let i=Pp[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=mr(e.r),this.g=mr(e.g),this.b=mr(e.b),this}copyLinearToSRGB(e){return this.r=kn(e.r),this.g=kn(e.g),this.b=kn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Bt){return it.fromWorkingColorSpace(qt.copy(this),e),Math.round(Xt(qt.r*255,0,255))*65536+Math.round(Xt(qt.g*255,0,255))*256+Math.round(Xt(qt.b*255,0,255))}getHexString(e=Bt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=it.workingColorSpace){it.fromWorkingColorSpace(qt.copy(this),t);let i=qt.r,n=qt.g,s=qt.b,a=Math.max(i,n,s),o=Math.min(i,n,s),l,c,d=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=d<=.5?u/(a+o):u/(2-a-o),a){case i:l=(n-s)/u+(n<s?6:0);break;case n:l=(s-i)/u+2;break;case s:l=(i-n)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=it.workingColorSpace){return it.fromWorkingColorSpace(qt.copy(this),t),e.r=qt.r,e.g=qt.g,e.b=qt.b,e}getStyle(e=Bt){it.fromWorkingColorSpace(qt.copy(this),e);let t=qt.r,i=qt.g,n=qt.b;return e!==Bt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(n*255)})`}offsetHSL(e,t,i){return this.getHSL(Rr),this.setHSL(Rr.h+e,Rr.s+t,Rr.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Rr),e.getHSL(fa);let i=Ts(Rr.h,fa.h,t),n=Ts(Rr.s,fa.s,t),s=Ts(Rr.l,fa.l,t);return this.setHSL(i,n,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,n=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*n,this.g=s[1]*t+s[4]*i+s[7]*n,this.b=s[2]*t+s[5]*i+s[8]*n,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},qt=new Be;Be.NAMES=Pp;var gf=0,hi=class extends fr{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:gf++}),this.uuid=Di(),this.name="",this.blending=Jr,this.side=qi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Fa,this.blendDst=Ba,this.blendEquation=Pr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Be(0,0,0),this.blendAlpha=0,this.depthFunc=en,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=wc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Xr,this.stencilZFail=Xr,this.stencilZPass=Xr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let n=this[t];if(n===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(i):n&&n.isVector3&&i&&i.isVector3?n.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Jr&&(i.blending=this.blending),this.side!==qi&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Fa&&(i.blendSrc=this.blendSrc),this.blendDst!==Ba&&(i.blendDst=this.blendDst),this.blendEquation!==Pr&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==en&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==wc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Xr&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Xr&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Xr&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function n(s){let a=[];for(let o in s){let l=s[o];delete l.metadata,a.push(l)}return a}if(t){let s=n(e.textures),a=n(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let n=t.length;i=new Array(n);for(let s=0;s!==n;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Pi=class extends hi{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new Be(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ki,this.combine=Td,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},It=new z,ga=new nt,zt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=wo,this.updateRanges=[],this.gpuType=yi,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let n=0,s=this.itemSize;n<s;n++)this.array[e+n]=t.array[i+n];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ga.fromBufferAttribute(this,t),ga.applyMatrix3(e),this.setXY(t,ga.x,ga.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)It.fromBufferAttribute(this,t),It.applyMatrix3(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)It.fromBufferAttribute(this,t),It.applyMatrix4(e),this.setXYZ(t,It.x,It.y,It.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)It.fromBufferAttribute(this,t),It.applyNormalMatrix(e),this.setXYZ(t,It.x,It.y,It.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)It.fromBufferAttribute(this,t),It.transformDirection(e),this.setXYZ(t,It.x,It.y,It.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Li(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=dt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Li(t,this.array)),t}setX(e,t){return this.normalized&&(t=dt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Li(t,this.array)),t}setY(e,t){return this.normalized&&(t=dt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Li(t,this.array)),t}setZ(e,t){return this.normalized&&(t=dt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Li(t,this.array)),t}setW(e,t){return this.normalized&&(t=dt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=dt(t,this.array),i=dt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,n){return e*=this.itemSize,this.normalized&&(t=dt(t,this.array),i=dt(i,this.array),n=dt(n,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=n,this}setXYZW(e,t,i,n,s){return e*=this.itemSize,this.normalized&&(t=dt(t,this.array),i=dt(i,this.array),n=dt(n,this.array),s=dt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=n,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==wo&&(e.usage=this.usage),e}},Us=class extends zt{constructor(e,t,i){super(new Uint16Array(e),t,i)}},Ns=class extends zt{constructor(e,t,i){super(new Uint32Array(e),t,i)}},bi=class extends zt{constructor(e,t,i){super(new Float32Array(e),t,i)}},vf=0,xi=new je,Vl=new Tt,An=new z,di=new Si,ls=new Si,Ft=new z,Oi=class r extends fr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:vf++}),this.uuid=Di(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Cp(e)?Ns:Us)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new $e().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return xi.makeRotationFromQuaternion(e),this.applyMatrix4(xi),this}rotateX(e){return xi.makeRotationX(e),this.applyMatrix4(xi),this}rotateY(e){return xi.makeRotationY(e),this.applyMatrix4(xi),this}rotateZ(e){return xi.makeRotationZ(e),this.applyMatrix4(xi),this}translate(e,t,i){return xi.makeTranslation(e,t,i),this.applyMatrix4(xi),this}scale(e,t,i){return xi.makeScale(e,t,i),this.applyMatrix4(xi),this}lookAt(e){return Vl.lookAt(e),Vl.updateMatrix(),this.applyMatrix4(Vl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(An).negate(),this.translate(An.x,An.y,An.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let n=0,s=e.length;n<s;n++){let a=e[n];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new bi(i,3))}else{for(let i=0,n=t.count;i<n;i++){let s=e[i];t.setXYZ(i,s.x,s.y,s.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Si);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,n=t.length;i<n;i++){let s=t[i];di.setFromBufferAttribute(s),this.morphTargetsRelative?(Ft.addVectors(this.boundingBox.min,di.min),this.boundingBox.expandByPoint(Ft),Ft.addVectors(this.boundingBox.max,di.max),this.boundingBox.expandByPoint(Ft)):(this.boundingBox.expandByPoint(di.min),this.boundingBox.expandByPoint(di.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(e){let i=this.boundingSphere.center;if(di.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];ls.setFromBufferAttribute(o),this.morphTargetsRelative?(Ft.addVectors(di.min,ls.min),di.expandByPoint(Ft),Ft.addVectors(di.max,ls.max),di.expandByPoint(Ft)):(di.expandByPoint(ls.min),di.expandByPoint(ls.max))}di.getCenter(i);let n=0;for(let s=0,a=e.count;s<a;s++)Ft.fromBufferAttribute(e,s),n=Math.max(n,i.distanceToSquared(Ft));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],l=this.morphTargetsRelative;for(let c=0,d=o.count;c<d;c++)Ft.fromBufferAttribute(o,c),l&&(An.fromBufferAttribute(e,c),Ft.add(An)),n=Math.max(n,i.distanceToSquared(Ft))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,n=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new zt(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let T=0;T<i.count;T++)o[T]=new z,l[T]=new z;let c=new z,d=new z,u=new z,h=new nt,p=new nt,g=new nt,v=new z,m=new z;function f(T,b,x){c.fromBufferAttribute(i,T),d.fromBufferAttribute(i,b),u.fromBufferAttribute(i,x),h.fromBufferAttribute(s,T),p.fromBufferAttribute(s,b),g.fromBufferAttribute(s,x),d.sub(c),u.sub(c),p.sub(h),g.sub(h);let C=1/(p.x*g.y-g.x*p.y);isFinite(C)&&(v.copy(d).multiplyScalar(g.y).addScaledVector(u,-p.y).multiplyScalar(C),m.copy(u).multiplyScalar(p.x).addScaledVector(d,-g.x).multiplyScalar(C),o[T].add(v),o[b].add(v),o[x].add(v),l[T].add(m),l[b].add(m),l[x].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let T=0,b=M.length;T<b;++T){let x=M[T],C=x.start,U=x.count;for(let G=C,W=C+U;G<W;G+=3)f(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let w=new z,_=new z,D=new z,A=new z;function R(T){D.fromBufferAttribute(n,T),A.copy(D);let b=o[T];w.copy(b),w.sub(D.multiplyScalar(D.dot(b))).normalize(),_.crossVectors(A,b);let x=_.dot(l[T])<0?-1:1;a.setXYZW(T,w.x,w.y,w.z,x)}for(let T=0,b=M.length;T<b;++T){let x=M[T],C=x.start,U=x.count;for(let G=C,W=C+U;G<W;G+=3)R(e.getX(G+0)),R(e.getX(G+1)),R(e.getX(G+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new zt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,p=i.count;h<p;h++)i.setXYZ(h,0,0,0);let n=new z,s=new z,a=new z,o=new z,l=new z,c=new z,d=new z,u=new z;if(e)for(let h=0,p=e.count;h<p;h+=3){let g=e.getX(h+0),v=e.getX(h+1),m=e.getX(h+2);n.fromBufferAttribute(t,g),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,m),d.subVectors(a,s),u.subVectors(n,s),d.cross(u),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,v),c.fromBufferAttribute(i,m),o.add(d),l.add(d),c.add(d),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(v,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,p=t.count;h<p;h+=3)n.fromBufferAttribute(t,h+0),s.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),d.subVectors(a,s),u.subVectors(n,s),d.cross(u),i.setXYZ(h+0,d.x,d.y,d.z),i.setXYZ(h+1,d.x,d.y,d.z),i.setXYZ(h+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Ft.fromBufferAttribute(e,t),Ft.normalize(),e.setXYZ(t,Ft.x,Ft.y,Ft.z)}toNonIndexed(){function e(o,l){let c=o.array,d=o.itemSize,u=o.normalized,h=new c.constructor(l.length*d),p=0,g=0;for(let v=0,m=l.length;v<m;v++){o.isInterleavedBufferAttribute?p=l[v]*o.data.stride+o.offset:p=l[v]*d;for(let f=0;f<d;f++)h[g++]=c[p++]}return new zt(h,d,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new r,i=this.index.array,n=this.attributes;for(let o in n){let l=n[o],c=e(l,i);t.setAttribute(o,c)}let s=this.morphAttributes;for(let o in s){let l=[],c=s[o];for(let d=0,u=c.length;d<u;d++){let h=c[d],p=e(h,i);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let n={},s=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],d=[];for(let u=0,h=c.length;u<h;u++){let p=c[u];d.push(p.toJSON(e.data))}d.length>0&&(n[l]=d,s=!0)}s&&(e.data.morphAttributes=n,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone(t));let n=e.attributes;for(let c in n){let d=n[c];this.setAttribute(c,d.clone(t))}let s=e.morphAttributes;for(let c in s){let d=[],u=s[c];for(let h=0,p=u.length;h<p;h++)d.push(u[h].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,d=a.length;c<d;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Eu=new je,Gr=new on,va=new pi,Au=new z,xa=new z,_a=new z,ya=new z,Gl=new z,ba=new z,Ru=new z,Sa=new z,ut=class extends Tt{constructor(e=new Oi,t=new Pi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=i.length;n<s;n++){let a=i[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}getVertexPosition(e,t){let i=this.geometry,n=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(n,e);let o=this.morphTargetInfluences;if(s&&o){ba.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let d=o[l],u=s[l];d!==0&&(Gl.fromBufferAttribute(u,e),a?ba.addScaledVector(Gl,d):ba.addScaledVector(Gl.sub(t),d))}t.add(ba)}return t}raycast(e,t){let i=this.geometry,n=this.material,s=this.matrixWorld;n!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),va.copy(i.boundingSphere),va.applyMatrix4(s),Gr.copy(e.ray).recast(e.near),!(va.containsPoint(Gr.origin)===!1&&(Gr.intersectSphere(va,Au)===null||Gr.origin.distanceToSquared(Au)>(e.far-e.near)**2))&&(Eu.copy(s).invert(),Gr.copy(e.ray).applyMatrix4(Eu),!(i.boundingBox!==null&&Gr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Gr)))}_computeIntersections(e,t,i){let n,s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,d=s.attributes.uv1,u=s.attributes.normal,h=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=h.length;g<v;g++){let m=h[g],f=a[m.materialIndex],M=Math.max(m.start,p.start),w=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let _=M,D=w;_<D;_+=3){let A=o.getX(_),R=o.getX(_+1),T=o.getX(_+2);n=wa(this,f,e,i,c,d,u,A,R,T),n&&(n.faceIndex=Math.floor(_/3),n.face.materialIndex=m.materialIndex,t.push(n))}}else{let g=Math.max(0,p.start),v=Math.min(o.count,p.start+p.count);for(let m=g,f=v;m<f;m+=3){let M=o.getX(m),w=o.getX(m+1),_=o.getX(m+2);n=wa(this,a,e,i,c,d,u,M,w,_),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,v=h.length;g<v;g++){let m=h[g],f=a[m.materialIndex],M=Math.max(m.start,p.start),w=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let _=M,D=w;_<D;_+=3){let A=_,R=_+1,T=_+2;n=wa(this,f,e,i,c,d,u,A,R,T),n&&(n.faceIndex=Math.floor(_/3),n.face.materialIndex=m.materialIndex,t.push(n))}}else{let g=Math.max(0,p.start),v=Math.min(l.count,p.start+p.count);for(let m=g,f=v;m<f;m+=3){let M=m,w=m+1,_=m+2;n=wa(this,a,e,i,c,d,u,M,w,_),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}}}};function xf(r,e,t,i,n,s,a,o){let l;if(e.side===Yt?l=i.intersectTriangle(a,s,n,!0,o):l=i.intersectTriangle(n,s,a,e.side===qi,o),l===null)return null;Sa.copy(o),Sa.applyMatrix4(r.matrixWorld);let c=t.ray.origin.distanceTo(Sa);return c<t.near||c>t.far?null:{distance:c,point:Sa.clone(),object:r}}function wa(r,e,t,i,n,s,a,o,l,c){r.getVertexPosition(o,xa),r.getVertexPosition(l,_a),r.getVertexPosition(c,ya);let d=xf(r,e,t,i,xa,_a,ya,Ru);if(d){let u=new z;Ir.getBarycoord(Ru,xa,_a,ya,u),n&&(d.uv=Ir.getInterpolatedAttribute(n,o,l,c,u,new nt)),s&&(d.uv1=Ir.getInterpolatedAttribute(s,o,l,c,u,new nt)),a&&(d.normal=Ir.getInterpolatedAttribute(a,o,l,c,u,new z),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));let h={a:o,b:l,c,normal:new z,materialIndex:0};Ir.getNormal(xa,_a,ya,h.normal),d.face=h,d.barycoord=u}return d}var ln=class r extends Oi{constructor(e=1,t=1,i=1,n=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:n,heightSegments:s,depthSegments:a};let o=this;n=Math.floor(n),s=Math.floor(s),a=Math.floor(a);let l=[],c=[],d=[],u=[],h=0,p=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,n,a,2),g("x","z","y",1,-1,e,i,-t,n,a,3),g("x","y","z",1,-1,e,t,i,n,s,4),g("x","y","z",-1,-1,e,t,-i,n,s,5),this.setIndex(l),this.setAttribute("position",new bi(c,3)),this.setAttribute("normal",new bi(d,3)),this.setAttribute("uv",new bi(u,2));function g(v,m,f,M,w,_,D,A,R,T,b){let x=_/R,C=D/T,U=_/2,G=D/2,W=A/2,L=R+1,P=T+1,B=0,H=0,Z=new z;for(let ne=0;ne<P;ne++){let de=ne*C-G;for(let me=0;me<L;me++){let ue=me*x-U;Z[v]=ue*M,Z[m]=de*w,Z[f]=W,c.push(Z.x,Z.y,Z.z),Z[v]=0,Z[m]=0,Z[f]=A>0?1:-1,d.push(Z.x,Z.y,Z.z),u.push(me/R),u.push(1-ne/T),B+=1}}for(let ne=0;ne<T;ne++)for(let de=0;de<R;de++){let me=h+de+L*ne,ue=h+de+L*(ne+1),V=h+(de+1)+L*(ne+1),Y=h+(de+1)+L*ne;l.push(me,ue,Y),l.push(ue,V,Y),H+=6}o.addGroup(p,H,b),p+=H,h+=B}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Gn(r){let e={};for(let t in r){e[t]={};for(let i in r[t]){let n=r[t][i];n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)?n.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=n.clone():Array.isArray(n)?e[t][i]=n.slice():e[t][i]=n}}return e}function ti(r){let e={};for(let t=0;t<r.length;t++){let i=Gn(r[t]);for(let n in i)e[n]=i[n]}return e}function _f(r){let e=[];for(let t=0;t<r.length;t++)e.push(r[t].clone());return e}function Ip(r){let e=r.getRenderTarget();return e===null?r.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:it.workingColorSpace}var Dp={clone:Gn,merge:ti},yf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,bf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Fi=class extends hi{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=yf,this.fragmentShader=bf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Gn(e.uniforms),this.uniformsGroups=_f(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let s=this.uniforms[n].value;s&&s.isTexture?t.uniforms[n]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[n]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[n]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[n]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[n]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[n]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[n]={type:"m4",value:s.toArray()}:t.uniforms[n]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let n in this.extensions)this.extensions[n]===!0&&(i[n]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},ks=class extends Tt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new je,this.projectionMatrix=new je,this.projectionMatrixInverse=new je,this.coordinateSystem=ji}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Cr=new z,Cu=new nt,Lu=new nt,Ht=class extends ks{constructor(e=50,t=1,i=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=n,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Vn*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ms*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Vn*2*Math.atan(Math.tan(Ms*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Cr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Cr.x,Cr.y).multiplyScalar(-e/Cr.z),Cr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Cr.x,Cr.y).multiplyScalar(-e/Cr.z)}getViewSize(e,t){return this.getViewBounds(e,Cu,Lu),t.subVectors(Lu,Cu)}setViewOffset(e,t,i,n,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=n,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ms*.5*this.fov)/this.zoom,i=2*t,n=this.aspect*i,s=-.5*n,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*n/l,t-=a.offsetY*i/c,n*=a.width/l,i*=a.height/c}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+n,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Rn=-90,Cn=1,Ao=class extends Tt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let n=new Ht(Rn,Cn,e,t);n.layers=this.layers,this.add(n);let s=new Ht(Rn,Cn,e,t);s.layers=this.layers,this.add(s);let a=new Ht(Rn,Cn,e,t);a.layers=this.layers,this.add(a);let o=new Ht(Rn,Cn,e,t);o.layers=this.layers,this.add(o);let l=new Ht(Rn,Cn,e,t);l.layers=this.layers,this.add(l);let c=new Ht(Rn,Cn,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,n,s,a,o,l]=t;for(let c of t)this.remove(c);if(e===ji)i.up.set(0,1,0),i.lookAt(1,0,0),n.up.set(0,1,0),n.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Cs)i.up.set(0,-1,0),i.lookAt(-1,0,0),n.up.set(0,-1,0),n.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:n}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,l,c,d]=this.children,u=e.getRenderTarget(),h=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,n),e.render(t,s),e.setRenderTarget(i,1,n),e.render(t,a),e.setRenderTarget(i,2,n),e.render(t,o),e.setRenderTarget(i,3,n),e.render(t,l),e.setRenderTarget(i,4,n),e.render(t,c),i.texture.generateMipmaps=v,e.setRenderTarget(i,5,n),e.render(t,d),e.setRenderTarget(u,h,p),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Os=class extends Vt{constructor(e,t,i,n,s,a,o,l,c,d){e=e!==void 0?e:[],t=t!==void 0?t:tn,super(e,t,i,n,s,a,o,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Ro=class extends Yi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},n=[i,i,i,i,i,i];this.texture=new Os(n,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:si}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},n=new ln(5,5,5),s=new Fi({name:"CubemapFromEquirect",uniforms:Gn(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Yt,blending:hr});s.uniforms.tEquirect.value=t;let a=new ut(n,s),o=t.minFilter;return t.minFilter===Wi&&(t.minFilter=si),new Ao(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,i,n){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,n);e.setRenderTarget(s)}},$l=new z,Sf=new z,wf=new $e,Gi=class{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,n){return this.normal.set(e,t,i),this.constant=n,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let n=$l.subVectors(i,t).cross(Sf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(n,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta($l),n=this.normal.dot(i);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/n;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||wf.getNormalMatrix(e),n=this.coplanarPoint($l).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-n.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},$r=new pi,Ma=new z,$n=class{constructor(e=new Gi,t=new Gi,i=new Gi,n=new Gi,s=new Gi,a=new Gi){this.planes=[e,t,i,n,s,a]}set(e,t,i,n,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(n),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=ji){let i=this.planes,n=e.elements,s=n[0],a=n[1],o=n[2],l=n[3],c=n[4],d=n[5],u=n[6],h=n[7],p=n[8],g=n[9],v=n[10],m=n[11],f=n[12],M=n[13],w=n[14],_=n[15];if(i[0].setComponents(l-s,h-c,m-p,_-f).normalize(),i[1].setComponents(l+s,h+c,m+p,_+f).normalize(),i[2].setComponents(l+a,h+d,m+g,_+M).normalize(),i[3].setComponents(l-a,h-d,m-g,_-M).normalize(),i[4].setComponents(l-o,h-u,m-v,_-w).normalize(),t===ji)i[5].setComponents(l+o,h+u,m+v,_+w).normalize();else if(t===Cs)i[5].setComponents(o,u,v,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),$r.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),$r.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere($r)}intersectsSprite(e){return $r.center.set(0,0,0),$r.radius=.7071067811865476,$r.applyMatrix4(e.matrixWorld),this.intersectsSphere($r)}intersectsSphere(e){let t=this.planes,i=e.center,n=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<n)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let n=t[i];if(Ma.x=n.normal.x>0?e.max.x:e.min.x,Ma.y=n.normal.y>0?e.max.y:e.min.y,Ma.z=n.normal.z>0?e.max.z:e.min.z,n.distanceToPoint(Ma)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Up(){let r=null,e=!1,t=null,i=null;function n(s,a){t(s,a),i=r.requestAnimationFrame(n)}return{start:function(){e!==!0&&t!==null&&(i=r.requestAnimationFrame(n),e=!0)},stop:function(){r.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){r=s}}}function Mf(r){let e=new WeakMap;function t(o,l){let c=o.array,d=o.usage,u=c.byteLength,h=r.createBuffer();r.bindBuffer(l,h),r.bufferData(l,c,d),o.onUploadCallback();let p;if(c instanceof Float32Array)p=r.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=r.HALF_FLOAT:p=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=r.SHORT;else if(c instanceof Uint32Array)p=r.UNSIGNED_INT;else if(c instanceof Int32Array)p=r.INT;else if(c instanceof Int8Array)p=r.BYTE;else if(c instanceof Uint8Array)p=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,l,c){let d=l.array,u=l.updateRanges;if(r.bindBuffer(c,o),u.length===0)r.bufferSubData(c,0,d);else{u.sort((p,g)=>p.start-g.start);let h=0;for(let p=1;p<u.length;p++){let g=u[h],v=u[p];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++h,u[h]=v)}u.length=h+1;for(let p=0,g=u.length;p<g;p++){let v=u[p];r.bufferSubData(c,v.start*d.BYTES_PER_ELEMENT,d,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function n(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(r.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let d=e.get(o);(!d||d.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:n,remove:s,update:a}}var Fs=class r extends Oi{constructor(e=1,t=1,i=1,n=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:n};let s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(n),c=o+1,d=l+1,u=e/o,h=t/l,p=[],g=[],v=[],m=[];for(let f=0;f<d;f++){let M=f*h-a;for(let w=0;w<c;w++){let _=w*u-s;g.push(_,-M,0),v.push(0,0,1),m.push(w/o),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let M=0;M<o;M++){let w=M+c*f,_=M+c*(f+1),D=M+1+c*(f+1),A=M+1+c*f;p.push(w,_,A),p.push(_,D,A)}this.setIndex(p),this.setAttribute("position",new bi(g,3)),this.setAttribute("normal",new bi(v,3)),this.setAttribute("uv",new bi(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.widthSegments,e.heightSegments)}},Tf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ef=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Af=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Rf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Cf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Lf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Pf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,If=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Df=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Uf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Nf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,kf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Of=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Ff=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Bf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Hf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,zf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Vf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Gf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,$f=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Wf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,jf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,qf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Xf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Yf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Kf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Zf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Jf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Qf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,eg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,tg="gl_FragColor = linearToOutputTexel( gl_FragColor );",ig=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,rg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,ng=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,sg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ag=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,og=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,lg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,cg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,dg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ug=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,hg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,pg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,mg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,fg=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,gg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,vg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,xg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,_g=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,yg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,bg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Sg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,wg=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Mg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Tg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Eg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Ag=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Rg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Cg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Lg=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Pg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Ig=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Dg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Ug=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ng=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,kg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Og=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Fg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Bg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Hg=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,zg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Vg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Gg=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,$g=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,jg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,qg=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Xg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Yg=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Kg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Zg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Jg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Qg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,e0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,t0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,i0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,r0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,n0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,s0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,a0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,o0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,l0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,c0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,d0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,u0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,h0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,p0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,m0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,f0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,g0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,v0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,x0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,_0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,y0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,b0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,S0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,w0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,M0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,T0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,E0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,A0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,R0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,C0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,L0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,P0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,I0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,D0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,U0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,N0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,k0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,O0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,F0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,B0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,H0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,z0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,V0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,G0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,W0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,j0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,q0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,X0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Y0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,K0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Z0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,J0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Q0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ev=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,tv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,iv=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,We={alphahash_fragment:Tf,alphahash_pars_fragment:Ef,alphamap_fragment:Af,alphamap_pars_fragment:Rf,alphatest_fragment:Cf,alphatest_pars_fragment:Lf,aomap_fragment:Pf,aomap_pars_fragment:If,batching_pars_vertex:Df,batching_vertex:Uf,begin_vertex:Nf,beginnormal_vertex:kf,bsdfs:Of,iridescence_fragment:Ff,bumpmap_pars_fragment:Bf,clipping_planes_fragment:Hf,clipping_planes_pars_fragment:zf,clipping_planes_pars_vertex:Vf,clipping_planes_vertex:Gf,color_fragment:$f,color_pars_fragment:Wf,color_pars_vertex:jf,color_vertex:qf,common:Xf,cube_uv_reflection_fragment:Yf,defaultnormal_vertex:Kf,displacementmap_pars_vertex:Zf,displacementmap_vertex:Jf,emissivemap_fragment:Qf,emissivemap_pars_fragment:eg,colorspace_fragment:tg,colorspace_pars_fragment:ig,envmap_fragment:rg,envmap_common_pars_fragment:ng,envmap_pars_fragment:sg,envmap_pars_vertex:ag,envmap_physical_pars_fragment:vg,envmap_vertex:og,fog_vertex:lg,fog_pars_vertex:cg,fog_fragment:dg,fog_pars_fragment:ug,gradientmap_pars_fragment:hg,lightmap_pars_fragment:pg,lights_lambert_fragment:mg,lights_lambert_pars_fragment:fg,lights_pars_begin:gg,lights_toon_fragment:xg,lights_toon_pars_fragment:_g,lights_phong_fragment:yg,lights_phong_pars_fragment:bg,lights_physical_fragment:Sg,lights_physical_pars_fragment:wg,lights_fragment_begin:Mg,lights_fragment_maps:Tg,lights_fragment_end:Eg,logdepthbuf_fragment:Ag,logdepthbuf_pars_fragment:Rg,logdepthbuf_pars_vertex:Cg,logdepthbuf_vertex:Lg,map_fragment:Pg,map_pars_fragment:Ig,map_particle_fragment:Dg,map_particle_pars_fragment:Ug,metalnessmap_fragment:Ng,metalnessmap_pars_fragment:kg,morphinstance_vertex:Og,morphcolor_vertex:Fg,morphnormal_vertex:Bg,morphtarget_pars_vertex:Hg,morphtarget_vertex:zg,normal_fragment_begin:Vg,normal_fragment_maps:Gg,normal_pars_fragment:$g,normal_pars_vertex:Wg,normal_vertex:jg,normalmap_pars_fragment:qg,clearcoat_normal_fragment_begin:Xg,clearcoat_normal_fragment_maps:Yg,clearcoat_pars_fragment:Kg,iridescence_pars_fragment:Zg,opaque_fragment:Jg,packing:Qg,premultiplied_alpha_fragment:e0,project_vertex:t0,dithering_fragment:i0,dithering_pars_fragment:r0,roughnessmap_fragment:n0,roughnessmap_pars_fragment:s0,shadowmap_pars_fragment:a0,shadowmap_pars_vertex:o0,shadowmap_vertex:l0,shadowmask_pars_fragment:c0,skinbase_vertex:d0,skinning_pars_vertex:u0,skinning_vertex:h0,skinnormal_vertex:p0,specularmap_fragment:m0,specularmap_pars_fragment:f0,tonemapping_fragment:g0,tonemapping_pars_fragment:v0,transmission_fragment:x0,transmission_pars_fragment:_0,uv_pars_fragment:y0,uv_pars_vertex:b0,uv_vertex:S0,worldpos_vertex:w0,background_vert:M0,background_frag:T0,backgroundCube_vert:E0,backgroundCube_frag:A0,cube_vert:R0,cube_frag:C0,depth_vert:L0,depth_frag:P0,distanceRGBA_vert:I0,distanceRGBA_frag:D0,equirect_vert:U0,equirect_frag:N0,linedashed_vert:k0,linedashed_frag:O0,meshbasic_vert:F0,meshbasic_frag:B0,meshlambert_vert:H0,meshlambert_frag:z0,meshmatcap_vert:V0,meshmatcap_frag:G0,meshnormal_vert:$0,meshnormal_frag:W0,meshphong_vert:j0,meshphong_frag:q0,meshphysical_vert:X0,meshphysical_frag:Y0,meshtoon_vert:K0,meshtoon_frag:Z0,points_vert:J0,points_frag:Q0,shadow_vert:ev,shadow_frag:tv,sprite_vert:iv,sprite_frag:rv},he={common:{diffuse:{value:new Be(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new $e},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new $e}},envmap:{envMap:{value:null},envMapRotation:{value:new $e},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new $e}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new $e}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new $e},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new $e},normalScale:{value:new nt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new $e},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new $e}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new $e}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new $e}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Be(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Be(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0},uvTransform:{value:new $e}},sprite:{diffuse:{value:new Be(16777215)},opacity:{value:1},center:{value:new nt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new $e},alphaMap:{value:null},alphaMapTransform:{value:new $e},alphaTest:{value:0}}},Ri={basic:{uniforms:ti([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.fog]),vertexShader:We.meshbasic_vert,fragmentShader:We.meshbasic_frag},lambert:{uniforms:ti([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Be(0)}}]),vertexShader:We.meshlambert_vert,fragmentShader:We.meshlambert_frag},phong:{uniforms:ti([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Be(0)},specular:{value:new Be(1118481)},shininess:{value:30}}]),vertexShader:We.meshphong_vert,fragmentShader:We.meshphong_frag},standard:{uniforms:ti([he.common,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.roughnessmap,he.metalnessmap,he.fog,he.lights,{emissive:{value:new Be(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag},toon:{uniforms:ti([he.common,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.gradientmap,he.fog,he.lights,{emissive:{value:new Be(0)}}]),vertexShader:We.meshtoon_vert,fragmentShader:We.meshtoon_frag},matcap:{uniforms:ti([he.common,he.bumpmap,he.normalmap,he.displacementmap,he.fog,{matcap:{value:null}}]),vertexShader:We.meshmatcap_vert,fragmentShader:We.meshmatcap_frag},points:{uniforms:ti([he.points,he.fog]),vertexShader:We.points_vert,fragmentShader:We.points_frag},dashed:{uniforms:ti([he.common,he.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:We.linedashed_vert,fragmentShader:We.linedashed_frag},depth:{uniforms:ti([he.common,he.displacementmap]),vertexShader:We.depth_vert,fragmentShader:We.depth_frag},normal:{uniforms:ti([he.common,he.bumpmap,he.normalmap,he.displacementmap,{opacity:{value:1}}]),vertexShader:We.meshnormal_vert,fragmentShader:We.meshnormal_frag},sprite:{uniforms:ti([he.sprite,he.fog]),vertexShader:We.sprite_vert,fragmentShader:We.sprite_frag},background:{uniforms:{uvTransform:{value:new $e},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:We.background_vert,fragmentShader:We.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new $e}},vertexShader:We.backgroundCube_vert,fragmentShader:We.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:We.cube_vert,fragmentShader:We.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:We.equirect_vert,fragmentShader:We.equirect_frag},distanceRGBA:{uniforms:ti([he.common,he.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:We.distanceRGBA_vert,fragmentShader:We.distanceRGBA_frag},shadow:{uniforms:ti([he.lights,he.fog,{color:{value:new Be(0)},opacity:{value:1}}]),vertexShader:We.shadow_vert,fragmentShader:We.shadow_frag}};Ri.physical={uniforms:ti([Ri.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new $e},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new $e},clearcoatNormalScale:{value:new nt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new $e},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new $e},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new $e},sheen:{value:0},sheenColor:{value:new Be(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new $e},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new $e},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new $e},transmissionSamplerSize:{value:new nt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new $e},attenuationDistance:{value:0},attenuationColor:{value:new Be(0)},specularColor:{value:new Be(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new $e},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new $e},anisotropyVector:{value:new nt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new $e}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag};var Ta={r:0,b:0,g:0},Wr=new ki,nv=new je;function sv(r,e,t,i,n,s,a){let o=new Be(0),l=s===!0?0:1,c,d,u=null,h=0,p=null;function g(M){let w=M.isScene===!0?M.background:null;return w&&w.isTexture&&(w=(M.backgroundBlurriness>0?t:e).get(w)),w}function v(M){let w=!1,_=g(M);_===null?f(o,l):_&&_.isColor&&(f(_,1),w=!0);let D=r.xr.getEnvironmentBlendMode();D==="additive"?i.buffers.color.setClear(0,0,0,1,a):D==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(r.autoClear||w)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function m(M,w){let _=g(w);_&&(_.isCubeTexture||_.mapping===Js)?(d===void 0&&(d=new ut(new ln(1,1,1),new Fi({name:"BackgroundCubeMaterial",uniforms:Gn(Ri.backgroundCube.uniforms),vertexShader:Ri.backgroundCube.vertexShader,fragmentShader:Ri.backgroundCube.fragmentShader,side:Yt,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(D,A,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(d)),Wr.copy(w.backgroundRotation),Wr.x*=-1,Wr.y*=-1,Wr.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(Wr.y*=-1,Wr.z*=-1),d.material.uniforms.envMap.value=_,d.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(nv.makeRotationFromEuler(Wr)),d.material.toneMapped=it.getTransfer(_.colorSpace)!==ct,(u!==_||h!==_.version||p!==r.toneMapping)&&(d.material.needsUpdate=!0,u=_,h=_.version,p=r.toneMapping),d.layers.enableAll(),M.unshift(d,d.geometry,d.material,0,0,null)):_&&_.isTexture&&(c===void 0&&(c=new ut(new Fs(2,2),new Fi({name:"BackgroundMaterial",uniforms:Gn(Ri.background.uniforms),vertexShader:Ri.background.vertexShader,fragmentShader:Ri.background.fragmentShader,side:qi,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=_,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.toneMapped=it.getTransfer(_.colorSpace)!==ct,_.matrixAutoUpdate===!0&&_.updateMatrix(),c.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||h!==_.version||p!==r.toneMapping)&&(c.material.needsUpdate=!0,u=_,h=_.version,p=r.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function f(M,w){M.getRGB(Ta,Ip(r)),i.buffers.color.setClear(Ta.r,Ta.g,Ta.b,w,a)}return{getClearColor:function(){return o},setClearColor:function(M,w=1){o.set(M),l=w,f(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,f(o,l)},render:v,addToRenderList:m}}function av(r,e){let t=r.getParameter(r.MAX_VERTEX_ATTRIBS),i={},n=h(null),s=n,a=!1;function o(x,C,U,G,W){let L=!1,P=u(G,U,C);s!==P&&(s=P,c(s.object)),L=p(x,G,U,W),L&&g(x,G,U,W),W!==null&&e.update(W,r.ELEMENT_ARRAY_BUFFER),(L||a)&&(a=!1,_(x,C,U,G),W!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e.get(W).buffer))}function l(){return r.createVertexArray()}function c(x){return r.bindVertexArray(x)}function d(x){return r.deleteVertexArray(x)}function u(x,C,U){let G=U.wireframe===!0,W=i[x.id];W===void 0&&(W={},i[x.id]=W);let L=W[C.id];L===void 0&&(L={},W[C.id]=L);let P=L[G];return P===void 0&&(P=h(l()),L[G]=P),P}function h(x){let C=[],U=[],G=[];for(let W=0;W<t;W++)C[W]=0,U[W]=0,G[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:C,enabledAttributes:U,attributeDivisors:G,object:x,attributes:{},index:null}}function p(x,C,U,G){let W=s.attributes,L=C.attributes,P=0,B=U.getAttributes();for(let H in B)if(B[H].location>=0){let Z=W[H],ne=L[H];if(ne===void 0&&(H==="instanceMatrix"&&x.instanceMatrix&&(ne=x.instanceMatrix),H==="instanceColor"&&x.instanceColor&&(ne=x.instanceColor)),Z===void 0||Z.attribute!==ne||ne&&Z.data!==ne.data)return!0;P++}return s.attributesNum!==P||s.index!==G}function g(x,C,U,G){let W={},L=C.attributes,P=0,B=U.getAttributes();for(let H in B)if(B[H].location>=0){let Z=L[H];Z===void 0&&(H==="instanceMatrix"&&x.instanceMatrix&&(Z=x.instanceMatrix),H==="instanceColor"&&x.instanceColor&&(Z=x.instanceColor));let ne={};ne.attribute=Z,Z&&Z.data&&(ne.data=Z.data),W[H]=ne,P++}s.attributes=W,s.attributesNum=P,s.index=G}function v(){let x=s.newAttributes;for(let C=0,U=x.length;C<U;C++)x[C]=0}function m(x){f(x,0)}function f(x,C){let U=s.newAttributes,G=s.enabledAttributes,W=s.attributeDivisors;U[x]=1,G[x]===0&&(r.enableVertexAttribArray(x),G[x]=1),W[x]!==C&&(r.vertexAttribDivisor(x,C),W[x]=C)}function M(){let x=s.newAttributes,C=s.enabledAttributes;for(let U=0,G=C.length;U<G;U++)C[U]!==x[U]&&(r.disableVertexAttribArray(U),C[U]=0)}function w(x,C,U,G,W,L,P){P===!0?r.vertexAttribIPointer(x,C,U,W,L):r.vertexAttribPointer(x,C,U,G,W,L)}function _(x,C,U,G){v();let W=G.attributes,L=U.getAttributes(),P=C.defaultAttributeValues;for(let B in L){let H=L[B];if(H.location>=0){let Z=W[B];if(Z===void 0&&(B==="instanceMatrix"&&x.instanceMatrix&&(Z=x.instanceMatrix),B==="instanceColor"&&x.instanceColor&&(Z=x.instanceColor)),Z!==void 0){let ne=Z.normalized,de=Z.itemSize,me=e.get(Z);if(me===void 0)continue;let ue=me.buffer,V=me.type,Y=me.bytesPerElement,ve=V===r.INT||V===r.UNSIGNED_INT||Z.gpuType===ol;if(Z.isInterleavedBufferAttribute){let le=Z.data,Ie=le.stride,be=Z.offset;if(le.isInstancedInterleavedBuffer){for(let Pe=0;Pe<H.locationSize;Pe++)f(H.location+Pe,le.meshPerAttribute);x.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let Pe=0;Pe<H.locationSize;Pe++)m(H.location+Pe);r.bindBuffer(r.ARRAY_BUFFER,ue);for(let Pe=0;Pe<H.locationSize;Pe++)w(H.location+Pe,de/H.locationSize,V,ne,Ie*Y,(be+de/H.locationSize*Pe)*Y,ve)}else{if(Z.isInstancedBufferAttribute){for(let le=0;le<H.locationSize;le++)f(H.location+le,Z.meshPerAttribute);x.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let le=0;le<H.locationSize;le++)m(H.location+le);r.bindBuffer(r.ARRAY_BUFFER,ue);for(let le=0;le<H.locationSize;le++)w(H.location+le,de/H.locationSize,V,ne,de*Y,de/H.locationSize*le*Y,ve)}}else if(P!==void 0){let ne=P[B];if(ne!==void 0)switch(ne.length){case 2:r.vertexAttrib2fv(H.location,ne);break;case 3:r.vertexAttrib3fv(H.location,ne);break;case 4:r.vertexAttrib4fv(H.location,ne);break;default:r.vertexAttrib1fv(H.location,ne)}}}}M()}function D(){T();for(let x in i){let C=i[x];for(let U in C){let G=C[U];for(let W in G)d(G[W].object),delete G[W];delete C[U]}delete i[x]}}function A(x){if(i[x.id]===void 0)return;let C=i[x.id];for(let U in C){let G=C[U];for(let W in G)d(G[W].object),delete G[W];delete C[U]}delete i[x.id]}function R(x){for(let C in i){let U=i[C];if(U[x.id]===void 0)continue;let G=U[x.id];for(let W in G)d(G[W].object),delete G[W];delete U[x.id]}}function T(){b(),a=!0,s!==n&&(s=n,c(s.object))}function b(){n.geometry=null,n.program=null,n.wireframe=!1}return{setup:o,reset:T,resetDefaultState:b,dispose:D,releaseStatesOfGeometry:A,releaseStatesOfProgram:R,initAttributes:v,enableAttribute:m,disableUnusedAttributes:M}}function ov(r,e,t){let i;function n(c){i=c}function s(c,d){r.drawArrays(i,c,d),t.update(d,i,1)}function a(c,d,u){u!==0&&(r.drawArraysInstanced(i,c,d,u),t.update(d,i,u))}function o(c,d,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,d,0,u);let h=0;for(let p=0;p<u;p++)h+=d[p];t.update(h,i,1)}function l(c,d,u,h){if(u===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<c.length;g++)a(c[g],d[g],h[g]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,d,0,h,0,u);let g=0;for(let v=0;v<u;v++)g+=d[v]*h[v];t.update(g,i,1)}}this.setMode=n,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function lv(r,e,t,i){let n;function s(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){let R=e.get("EXT_texture_filter_anisotropic");n=r.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function a(R){return!(R!==ui&&i.convert(R)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){let T=R===Jn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Xi&&i.convert(R)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==yi&&!T)}function l(R){if(R==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",d=l(c);d!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);let u=t.logarithmicDepthBuffer===!0,h=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),p=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),g=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=r.getParameter(r.MAX_TEXTURE_SIZE),m=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),f=r.getParameter(r.MAX_VERTEX_ATTRIBS),M=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),w=r.getParameter(r.MAX_VARYING_VECTORS),_=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),D=g>0,A=r.getParameter(r.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:h,maxTextures:p,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:f,maxVertexUniforms:M,maxVaryings:w,maxFragmentUniforms:_,vertexTextures:D,maxSamples:A}}function cv(r){let e=this,t=null,i=0,n=!1,s=!1,a=new Gi,o=new $e,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,h){let p=u.length!==0||h||i!==0||n;return n=h,i=u.length,p},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,h){t=d(u,h,0)},this.setState=function(u,h,p){let g=u.clippingPlanes,v=u.clipIntersection,m=u.clipShadows,f=r.get(u);if(!n||g===null||g.length===0||s&&!m)s?d(null):c();else{let M=s?0:i,w=M*4,_=f.clippingState||null;l.value=_,_=d(g,h,w,p);for(let D=0;D!==w;++D)_[D]=t[D];f.clippingState=_,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(u,h,p,g){let v=u!==null?u.length:0,m=null;if(v!==0){if(m=l.value,g!==!0||m===null){let f=p+v*4,M=h.matrixWorldInverse;o.getNormalMatrix(M),(m===null||m.length<f)&&(m=new Float32Array(f));for(let w=0,_=p;w!==v;++w,_+=4)a.copy(u[w]).applyMatrix4(M,o),a.normal.toArray(m,_),m[_+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,m}}function dv(r){let e=new WeakMap;function t(a,o){return o===qa?a.mapping=tn:o===Xa&&(a.mapping=rn),a}function i(a){if(a&&a.isTexture){let o=a.mapping;if(o===qa||o===Xa)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new Ro(l.height);return c.fromEquirectangularTexture(r,a),e.set(a,c),a.addEventListener("dispose",n),t(c.texture,a.mapping)}else return null}}return a}function n(a){let o=a.target;o.removeEventListener("dispose",n);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function s(){e=new WeakMap}return{get:i,dispose:s}}var Wn=class extends ks{constructor(e=-1,t=1,i=1,n=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=n,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,n,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=n,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,n=(this.top+this.bottom)/2,s=i-e,a=i+e,o=n+t,l=n-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=d*this.view.offsetY,l=o-d*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Nn=4,Pu=[.125,.215,.35,.446,.526,.582],Zr=20,Wl=new Wn,Iu=new Be,jl=null,ql=0,Xl=0,Yl=!1,Yr=(1+Math.sqrt(5))/2,Ln=1/Yr,Du=[new z(-Yr,Ln,0),new z(Yr,Ln,0),new z(-Ln,0,Yr),new z(Ln,0,Yr),new z(0,Yr,-Ln),new z(0,Yr,Ln),new z(-1,1,-1),new z(1,1,-1),new z(-1,1,1),new z(1,1,1)],jn=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,n=100){jl=this._renderer.getRenderTarget(),ql=this._renderer.getActiveCubeFace(),Xl=this._renderer.getActiveMipmapLevel(),Yl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,i,n,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ku(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Nu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(jl,ql,Xl),this._renderer.xr.enabled=Yl,e.scissorTest=!1,Ea(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===tn||e.mapping===rn?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),jl=this._renderer.getRenderTarget(),ql=this._renderer.getActiveCubeFace(),Xl=this._renderer.getActiveMipmapLevel(),Yl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:si,minFilter:si,generateMipmaps:!1,type:Jn,format:ui,colorSpace:Zt,depthBuffer:!1},n=Uu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Uu(e,t,i);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=uv(s)),this._blurMaterial=hv(s,e,t)}return n}_compileMaterial(e){let t=new ut(this._lodPlanes[0],e);this._renderer.compile(t,Wl)}_sceneToCubeUV(e,t,i,n){let s=new Ht(90,1,t,i),a=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],l=this._renderer,c=l.autoClear,d=l.toneMapping;l.getClearColor(Iu),l.toneMapping=pr,l.autoClear=!1;let u=new Pi({name:"PMREM.Background",side:Yt,depthWrite:!1,depthTest:!1}),h=new ut(new ln,u),p=!1,g=e.background;g?g.isColor&&(u.color.copy(g),e.background=null,p=!0):(u.color.copy(Iu),p=!0);for(let v=0;v<6;v++){let m=v%3;m===0?(s.up.set(0,a[v],0),s.lookAt(o[v],0,0)):m===1?(s.up.set(0,0,a[v]),s.lookAt(0,o[v],0)):(s.up.set(0,a[v],0),s.lookAt(0,0,o[v]));let f=this._cubeSize;Ea(n,m*f,v>2?f:0,f,f),l.setRenderTarget(n),p&&l.render(h,s),l.render(e,s)}h.geometry.dispose(),h.material.dispose(),l.toneMapping=d,l.autoClear=c,e.background=g}_textureToCubeUV(e,t){let i=this._renderer,n=e.mapping===tn||e.mapping===rn;n?(this._cubemapMaterial===null&&(this._cubemapMaterial=ku()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Nu());let s=n?this._cubemapMaterial:this._equirectMaterial,a=new ut(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;let l=this._cubeSize;Ea(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,Wl)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let n=this._lodPlanes.length;for(let s=1;s<n;s++){let a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Du[(n-s-1)%Du.length];this._blur(e,s-1,s,a,o)}t.autoClear=i}_blur(e,t,i,n,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,n,"latitudinal",s),this._halfBlur(a,e,i,i,n,"longitudinal",s)}_halfBlur(e,t,i,n,s,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let d=3,u=new ut(this._lodPlanes[n],c),h=c.uniforms,p=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*Zr-1),v=s/g,m=isFinite(s)?1+Math.floor(d*v):Zr;m>Zr&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Zr}`);let f=[],M=0;for(let R=0;R<Zr;++R){let T=R/v,b=Math.exp(-T*T/2);f.push(b),R===0?M+=b:R<m&&(M+=2*b)}for(let R=0;R<f.length;R++)f[R]=f[R]/M;h.envMap.value=e.texture,h.samples.value=m,h.weights.value=f,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);let{_lodMax:w}=this;h.dTheta.value=g,h.mipInt.value=w-i;let _=this._sizeLods[n],D=3*_*(n>w-Nn?n-w+Nn:0),A=4*(this._cubeSize-_);Ea(t,D,A,3*_,2*_),l.setRenderTarget(t),l.render(u,Wl)}};function uv(r){let e=[],t=[],i=[],n=r,s=r-Nn+1+Pu.length;for(let a=0;a<s;a++){let o=Math.pow(2,n);t.push(o);let l=1/o;a>r-Nn?l=Pu[a-r+Nn-1]:a===0&&(l=0),i.push(l);let c=1/(o-2),d=-c,u=1+c,h=[d,d,u,d,u,u,d,d,u,u,d,u],p=6,g=6,v=3,m=2,f=1,M=new Float32Array(v*g*p),w=new Float32Array(m*g*p),_=new Float32Array(f*g*p);for(let A=0;A<p;A++){let R=A%3*2/3-1,T=A>2?0:-1,b=[R,T,0,R+2/3,T,0,R+2/3,T+1,0,R,T,0,R+2/3,T+1,0,R,T+1,0];M.set(b,v*g*A),w.set(h,m*g*A);let x=[A,A,A,A,A,A];_.set(x,f*g*A)}let D=new Oi;D.setAttribute("position",new zt(M,v)),D.setAttribute("uv",new zt(w,m)),D.setAttribute("faceIndex",new zt(_,f)),e.push(D),n>Nn&&n--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Uu(r,e,t){let i=new Yi(r,e,t);return i.texture.mapping=Js,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ea(r,e,t,i,n){r.viewport.set(e,t,i,n),r.scissor.set(e,t,i,n)}function hv(r,e,t){let i=new Float32Array(Zr),n=new z(0,1,0);return new Fi({name:"SphericalGaussianBlur",defines:{n:Zr,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:n}},vertexShader:Vd(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:hr,depthTest:!1,depthWrite:!1})}function Nu(){return new Fi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Vd(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:hr,depthTest:!1,depthWrite:!1})}function ku(){return new Fi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Vd(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:hr,depthTest:!1,depthWrite:!1})}function Vd(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function pv(r){let e=new WeakMap,t=null;function i(o){if(o&&o.isTexture){let l=o.mapping,c=l===qa||l===Xa,d=l===tn||l===rn;if(c||d){let u=e.get(o),h=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==h)return t===null&&(t=new jn(r)),u=c?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let p=o.image;return c&&p&&p.height>0||d&&p&&n(p)?(t===null&&(t=new jn(r)),u=c?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",s),u.texture):null}}}return o}function n(o){let l=0,c=6;for(let d=0;d<c;d++)o[d]!==void 0&&l++;return l===c}function s(o){let l=o.target;l.removeEventListener("dispose",s);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:a}}function mv(r){let e={};function t(i){if(e[i]!==void 0)return e[i];let n;switch(i){case"WEBGL_depth_texture":n=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":n=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":n=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":n=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:n=r.getExtension(i)}return e[i]=n,n}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let n=t(i);return n===null&&fs("THREE.WebGLRenderer: "+i+" extension not supported."),n}}}function fv(r,e,t,i){let n={},s=new WeakMap;function a(u){let h=u.target;h.index!==null&&e.remove(h.index);for(let g in h.attributes)e.remove(h.attributes[g]);for(let g in h.morphAttributes){let v=h.morphAttributes[g];for(let m=0,f=v.length;m<f;m++)e.remove(v[m])}h.removeEventListener("dispose",a),delete n[h.id];let p=s.get(h);p&&(e.remove(p),s.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function o(u,h){return n[h.id]===!0||(h.addEventListener("dispose",a),n[h.id]=!0,t.memory.geometries++),h}function l(u){let h=u.attributes;for(let g in h)e.update(h[g],r.ARRAY_BUFFER);let p=u.morphAttributes;for(let g in p){let v=p[g];for(let m=0,f=v.length;m<f;m++)e.update(v[m],r.ARRAY_BUFFER)}}function c(u){let h=[],p=u.index,g=u.attributes.position,v=0;if(p!==null){let M=p.array;v=p.version;for(let w=0,_=M.length;w<_;w+=3){let D=M[w+0],A=M[w+1],R=M[w+2];h.push(D,A,A,R,R,D)}}else if(g!==void 0){let M=g.array;v=g.version;for(let w=0,_=M.length/3-1;w<_;w+=3){let D=w+0,A=w+1,R=w+2;h.push(D,A,A,R,R,D)}}else return;let m=new(Cp(h)?Ns:Us)(h,1);m.version=v;let f=s.get(u);f&&e.remove(f),s.set(u,m)}function d(u){let h=s.get(u);if(h){let p=u.index;p!==null&&h.version<p.version&&c(u)}else c(u);return s.get(u)}return{get:o,update:l,getWireframeAttribute:d}}function gv(r,e,t){let i;function n(h){i=h}let s,a;function o(h){s=h.type,a=h.bytesPerElement}function l(h,p){r.drawElements(i,p,s,h*a),t.update(p,i,1)}function c(h,p,g){g!==0&&(r.drawElementsInstanced(i,p,s,h*a,g),t.update(p,i,g))}function d(h,p,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,s,h,0,g);let v=0;for(let m=0;m<g;m++)v+=p[m];t.update(v,i,1)}function u(h,p,g,v){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<h.length;f++)c(h[f]/a,p[f],v[f]);else{m.multiDrawElementsInstancedWEBGL(i,p,0,s,h,0,v,0,g);let f=0;for(let M=0;M<g;M++)f+=p[M]*v[M];t.update(f,i,1)}}this.setMode=n,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=d,this.renderMultiDrawInstances=u}function vv(r){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case r.TRIANGLES:t.triangles+=o*(s/3);break;case r.LINES:t.lines+=o*(s/2);break;case r.LINE_STRIP:t.lines+=o*(s-1);break;case r.LINE_LOOP:t.lines+=o*s;break;case r.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function n(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:n,update:i}}function xv(r,e,t){let i=new WeakMap,n=new at;function s(a,o,l){let c=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=d!==void 0?d.length:0,h=i.get(o);if(h===void 0||h.count!==u){let g=function(){b.dispose(),i.delete(o),o.removeEventListener("dispose",g)};var p=g;h!==void 0&&h.texture.dispose();let v=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,f=o.morphAttributes.color!==void 0,M=o.morphAttributes.position||[],w=o.morphAttributes.normal||[],_=o.morphAttributes.color||[],D=0;v===!0&&(D=1),m===!0&&(D=2),f===!0&&(D=3);let A=o.attributes.position.count*D,R=1;A>e.maxTextureSize&&(R=Math.ceil(A/e.maxTextureSize),A=e.maxTextureSize);let T=new Float32Array(A*R*4*u),b=new Is(T,A,R,u);b.type=yi,b.needsUpdate=!0;let x=D*4;for(let C=0;C<u;C++){let U=M[C],G=w[C],W=_[C],L=A*R*4*C;for(let P=0;P<U.count;P++){let B=P*x;v===!0&&(n.fromBufferAttribute(U,P),T[L+B+0]=n.x,T[L+B+1]=n.y,T[L+B+2]=n.z,T[L+B+3]=0),m===!0&&(n.fromBufferAttribute(G,P),T[L+B+4]=n.x,T[L+B+5]=n.y,T[L+B+6]=n.z,T[L+B+7]=0),f===!0&&(n.fromBufferAttribute(W,P),T[L+B+8]=n.x,T[L+B+9]=n.y,T[L+B+10]=n.z,T[L+B+11]=W.itemSize===4?n.w:1)}}h={count:u,texture:b,size:new nt(A,R)},i.set(o,h),o.addEventListener("dispose",g)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",a.morphTexture,t);else{let g=0;for(let m=0;m<c.length;m++)g+=c[m];let v=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(r,"morphTargetBaseInfluence",v),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(r,"morphTargetsTextureSize",h.size)}return{update:s}}function _v(r,e,t,i){let n=new WeakMap;function s(l){let c=i.render.frame,d=l.geometry,u=e.get(l,d);if(n.get(u)!==c&&(e.update(u),n.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),n.get(l)!==c&&(t.update(l.instanceMatrix,r.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,r.ARRAY_BUFFER),n.set(l,c))),l.isSkinnedMesh){let h=l.skeleton;n.get(h)!==c&&(h.update(),n.set(h,c))}return u}function a(){n=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:a}}var Bs=class extends Vt{constructor(e,t,i,n,s,a,o,l,c,d=Qr){if(d!==Qr&&d!==an)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&d===Qr&&(i=Nr),i===void 0&&d===an&&(i=sn),super(null,n,s,a,o,l,d,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Kt,this.minFilter=l!==void 0?l:Kt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Np=new Vt,Ou=new Bs(1,1),kp=new Is,Op=new Eo,Fp=new Os,Fu=[],Bu=[],Hu=new Float32Array(16),zu=new Float32Array(9),Vu=new Float32Array(4);function Qn(r,e,t){let i=r[0];if(i<=0||i>0)return r;let n=e*t,s=Fu[n];if(s===void 0&&(s=new Float32Array(n),Fu[n]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,r[a].toArray(s,o)}return s}function kt(r,e){if(r.length!==e.length)return!1;for(let t=0,i=r.length;t<i;t++)if(r[t]!==e[t])return!1;return!0}function Ot(r,e){for(let t=0,i=e.length;t<i;t++)r[t]=e[t]}function ml(r,e){let t=Bu[e];t===void 0&&(t=new Int32Array(e),Bu[e]=t);for(let i=0;i!==e;++i)t[i]=r.allocateTextureUnit();return t}function yv(r,e){let t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function bv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(kt(t,e))return;r.uniform2fv(this.addr,e),Ot(t,e)}}function Sv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(kt(t,e))return;r.uniform3fv(this.addr,e),Ot(t,e)}}function wv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(kt(t,e))return;r.uniform4fv(this.addr,e),Ot(t,e)}}function Mv(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(kt(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),Ot(t,e)}else{if(kt(t,i))return;Vu.set(i),r.uniformMatrix2fv(this.addr,!1,Vu),Ot(t,i)}}function Tv(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(kt(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),Ot(t,e)}else{if(kt(t,i))return;zu.set(i),r.uniformMatrix3fv(this.addr,!1,zu),Ot(t,i)}}function Ev(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(kt(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),Ot(t,e)}else{if(kt(t,i))return;Hu.set(i),r.uniformMatrix4fv(this.addr,!1,Hu),Ot(t,i)}}function Av(r,e){let t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function Rv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(kt(t,e))return;r.uniform2iv(this.addr,e),Ot(t,e)}}function Cv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(kt(t,e))return;r.uniform3iv(this.addr,e),Ot(t,e)}}function Lv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(kt(t,e))return;r.uniform4iv(this.addr,e),Ot(t,e)}}function Pv(r,e){let t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function Iv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(kt(t,e))return;r.uniform2uiv(this.addr,e),Ot(t,e)}}function Dv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(kt(t,e))return;r.uniform3uiv(this.addr,e),Ot(t,e)}}function Uv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(kt(t,e))return;r.uniform4uiv(this.addr,e),Ot(t,e)}}function Nv(r,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(r.uniform1i(this.addr,n),i[0]=n);let s;this.type===r.SAMPLER_2D_SHADOW?(Ou.compareFunction=Hd,s=Ou):s=Np,t.setTexture2D(e||s,n)}function kv(r,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(r.uniform1i(this.addr,n),i[0]=n),t.setTexture3D(e||Op,n)}function Ov(r,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(r.uniform1i(this.addr,n),i[0]=n),t.setTextureCube(e||Fp,n)}function Fv(r,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(r.uniform1i(this.addr,n),i[0]=n),t.setTexture2DArray(e||kp,n)}function Bv(r){switch(r){case 5126:return yv;case 35664:return bv;case 35665:return Sv;case 35666:return wv;case 35674:return Mv;case 35675:return Tv;case 35676:return Ev;case 5124:case 35670:return Av;case 35667:case 35671:return Rv;case 35668:case 35672:return Cv;case 35669:case 35673:return Lv;case 5125:return Pv;case 36294:return Iv;case 36295:return Dv;case 36296:return Uv;case 35678:case 36198:case 36298:case 36306:case 35682:return Nv;case 35679:case 36299:case 36307:return kv;case 35680:case 36300:case 36308:case 36293:return Ov;case 36289:case 36303:case 36311:case 36292:return Fv}}function Hv(r,e){r.uniform1fv(this.addr,e)}function zv(r,e){let t=Qn(e,this.size,2);r.uniform2fv(this.addr,t)}function Vv(r,e){let t=Qn(e,this.size,3);r.uniform3fv(this.addr,t)}function Gv(r,e){let t=Qn(e,this.size,4);r.uniform4fv(this.addr,t)}function $v(r,e){let t=Qn(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function Wv(r,e){let t=Qn(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function jv(r,e){let t=Qn(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function qv(r,e){r.uniform1iv(this.addr,e)}function Xv(r,e){r.uniform2iv(this.addr,e)}function Yv(r,e){r.uniform3iv(this.addr,e)}function Kv(r,e){r.uniform4iv(this.addr,e)}function Zv(r,e){r.uniform1uiv(this.addr,e)}function Jv(r,e){r.uniform2uiv(this.addr,e)}function Qv(r,e){r.uniform3uiv(this.addr,e)}function ex(r,e){r.uniform4uiv(this.addr,e)}function tx(r,e,t){let i=this.cache,n=e.length,s=ml(t,n);kt(i,s)||(r.uniform1iv(this.addr,s),Ot(i,s));for(let a=0;a!==n;++a)t.setTexture2D(e[a]||Np,s[a])}function ix(r,e,t){let i=this.cache,n=e.length,s=ml(t,n);kt(i,s)||(r.uniform1iv(this.addr,s),Ot(i,s));for(let a=0;a!==n;++a)t.setTexture3D(e[a]||Op,s[a])}function rx(r,e,t){let i=this.cache,n=e.length,s=ml(t,n);kt(i,s)||(r.uniform1iv(this.addr,s),Ot(i,s));for(let a=0;a!==n;++a)t.setTextureCube(e[a]||Fp,s[a])}function nx(r,e,t){let i=this.cache,n=e.length,s=ml(t,n);kt(i,s)||(r.uniform1iv(this.addr,s),Ot(i,s));for(let a=0;a!==n;++a)t.setTexture2DArray(e[a]||kp,s[a])}function sx(r){switch(r){case 5126:return Hv;case 35664:return zv;case 35665:return Vv;case 35666:return Gv;case 35674:return $v;case 35675:return Wv;case 35676:return jv;case 5124:case 35670:return qv;case 35667:case 35671:return Xv;case 35668:case 35672:return Yv;case 35669:case 35673:return Kv;case 5125:return Zv;case 36294:return Jv;case 36295:return Qv;case 36296:return ex;case 35678:case 36198:case 36298:case 36306:case 35682:return tx;case 35679:case 36299:case 36307:return ix;case 35680:case 36300:case 36308:case 36293:return rx;case 36289:case 36303:case 36311:case 36292:return nx}}var Tc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Bv(t.type)}},Ec=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=sx(t.type)}},Ac=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let n=this.seq;for(let s=0,a=n.length;s!==a;++s){let o=n[s];o.setValue(e,t[o.id],i)}}},Kl=/(\w+)(\])?(\[|\.)?/g;function Gu(r,e){r.seq.push(e),r.map[e.id]=e}function ax(r,e,t){let i=r.name,n=i.length;for(Kl.lastIndex=0;;){let s=Kl.exec(i),a=Kl.lastIndex,o=s[1],l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===n){Gu(t,c===void 0?new Tc(o,r,e):new Ec(o,r,e));break}else{let d=t.map[o];d===void 0&&(d=new Ac(o),Gu(t,d)),t=d}}}var On=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let n=0;n<i;++n){let s=e.getActiveUniform(t,n),a=e.getUniformLocation(t,s.name);ax(s,a,this)}}setValue(e,t,i,n){let s=this.map[t];s!==void 0&&s.setValue(e,i,n)}setOptional(e,t,i){let n=t[i];n!==void 0&&this.setValue(e,i,n)}static upload(e,t,i,n){for(let s=0,a=t.length;s!==a;++s){let o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,n)}}static seqWithValue(e,t){let i=[];for(let n=0,s=e.length;n!==s;++n){let a=e[n];a.id in t&&i.push(a)}return i}};function $u(r,e,t){let i=r.createShader(e);return r.shaderSource(i,t),r.compileShader(i),i}var ox=37297,lx=0;function cx(r,e){let t=r.split(`
`),i=[],n=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=n;a<s;a++){let o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}var Wu=new $e;function dx(r){it._getMatrix(Wu,it.workingColorSpace,r);let e=`mat3( ${Wu.elements.map(t=>t.toFixed(4))} )`;switch(it.getTransfer(r)){case Qs:return[e,"LinearTransferOETF"];case ct:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",r),[e,"LinearTransferOETF"]}}function ju(r,e,t){let i=r.getShaderParameter(e,r.COMPILE_STATUS),n=r.getShaderInfoLog(e).trim();if(i&&n==="")return"";let s=/ERROR: 0:(\d+)/.exec(n);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+n+`

`+cx(r.getShaderSource(e),a)}else return n}function ux(r,e){let t=dx(e);return[`vec4 ${r}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function hx(r,e){let t;switch(e){case cp:t="Linear";break;case dp:t="Reinhard";break;case up:t="Cineon";break;case Ed:t="ACESFilmic";break;case pp:t="AgX";break;case mp:t="Neutral";break;case hp:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Aa=new z;function px(){it.getLuminanceCoefficients(Aa);let r=Aa.x.toFixed(4),e=Aa.y.toFixed(4),t=Aa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function mx(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(gs).join(`
`)}function fx(r){let e=[];for(let t in r){let i=r[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function gx(r,e){let t={},i=r.getProgramParameter(e,r.ACTIVE_ATTRIBUTES);for(let n=0;n<i;n++){let s=r.getActiveAttrib(e,n),a=s.name,o=1;s.type===r.FLOAT_MAT2&&(o=2),s.type===r.FLOAT_MAT3&&(o=3),s.type===r.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:r.getAttribLocation(e,a),locationSize:o}}return t}function gs(r){return r!==""}function qu(r,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Xu(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var vx=/^[ \t]*#include +<([\w\d./]+)>/gm;function Rc(r){return r.replace(vx,_x)}var xx=new Map;function _x(r,e){let t=We[e];if(t===void 0){let i=xx.get(e);if(i!==void 0)t=We[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Rc(t)}var yx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Yu(r){return r.replace(yx,bx)}function bx(r,e,t,i){let n="";for(let s=parseInt(e);s<parseInt(t);s++)n+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return n}function Ku(r){let e=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?e+=`
#define HIGH_PRECISION`:r.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Sx(r){let e="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===Md?e="SHADOWMAP_TYPE_PCF":r.shadowMapType===Vh?e="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===Vi&&(e="SHADOWMAP_TYPE_VSM"),e}function wx(r){let e="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case tn:case rn:e="ENVMAP_TYPE_CUBE";break;case Js:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Mx(r){let e="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case rn:e="ENVMAP_MODE_REFRACTION";break}return e}function Tx(r){let e="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case Td:e="ENVMAP_BLENDING_MULTIPLY";break;case op:e="ENVMAP_BLENDING_MIX";break;case lp:e="ENVMAP_BLENDING_ADD";break}return e}function Ex(r){let e=r.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Ax(r,e,t,i){let n=r.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,l=Sx(t),c=wx(t),d=Mx(t),u=Tx(t),h=Ex(t),p=mx(t),g=fx(s),v=n.createProgram(),m,f,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(gs).join(`
`),m.length>0&&(m+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(gs).join(`
`),f.length>0&&(f+=`
`)):(m=[Ku(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(gs).join(`
`),f=[Ku(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+u:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==pr?"#define TONE_MAPPING":"",t.toneMapping!==pr?We.tonemapping_pars_fragment:"",t.toneMapping!==pr?hx("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",We.colorspace_pars_fragment,ux("linearToOutputTexel",t.outputColorSpace),px(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(gs).join(`
`)),a=Rc(a),a=qu(a,t),a=Xu(a,t),o=Rc(o),o=qu(o,t),o=Xu(o,t),a=Yu(a),o=Yu(o),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,f=["#define varying in",t.glslVersion===Mc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Mc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let w=M+m+a,_=M+f+o,D=$u(n,n.VERTEX_SHADER,w),A=$u(n,n.FRAGMENT_SHADER,_);n.attachShader(v,D),n.attachShader(v,A),t.index0AttributeName!==void 0?n.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&n.bindAttribLocation(v,0,"position"),n.linkProgram(v);function R(C){if(r.debug.checkShaderErrors){let U=n.getProgramInfoLog(v).trim(),G=n.getShaderInfoLog(D).trim(),W=n.getShaderInfoLog(A).trim(),L=!0,P=!0;if(n.getProgramParameter(v,n.LINK_STATUS)===!1)if(L=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(n,v,D,A);else{let B=ju(n,D,"vertex"),H=ju(n,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+n.getError()+" - VALIDATE_STATUS "+n.getProgramParameter(v,n.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+U+`
`+B+`
`+H)}else U!==""?console.warn("THREE.WebGLProgram: Program Info Log:",U):(G===""||W==="")&&(P=!1);P&&(C.diagnostics={runnable:L,programLog:U,vertexShader:{log:G,prefix:m},fragmentShader:{log:W,prefix:f}})}n.deleteShader(D),n.deleteShader(A),T=new On(n,v),b=gx(n,v)}let T;this.getUniforms=function(){return T===void 0&&R(this),T};let b;this.getAttributes=function(){return b===void 0&&R(this),b};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=n.getProgramParameter(v,ox)),x},this.destroy=function(){i.releaseStatesOfProgram(this),n.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=lx++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=D,this.fragmentShader=A,this}var Rx=0,Cc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,n=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(n)===!1&&(a.add(n),n.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Lc(e),t.set(e,i)),i}},Lc=class{constructor(e){this.id=Rx++,this.code=e,this.usedTimes=0}};function Cx(r,e,t,i,n,s,a){let o=new Ds,l=new Cc,c=new Set,d=[],u=n.logarithmicDepthBuffer,h=n.vertexTextures,p=n.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(b){return c.add(b),b===0?"uv":`uv${b}`}function m(b,x,C,U,G){let W=U.fog,L=G.geometry,P=b.isMeshStandardMaterial?U.environment:null,B=(b.isMeshStandardMaterial?t:e).get(b.envMap||P),H=B&&B.mapping===Js?B.image.height:null,Z=g[b.type];b.precision!==null&&(p=n.getMaxPrecision(b.precision),p!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",p,"instead."));let ne=L.morphAttributes.position||L.morphAttributes.normal||L.morphAttributes.color,de=ne!==void 0?ne.length:0,me=0;L.morphAttributes.position!==void 0&&(me=1),L.morphAttributes.normal!==void 0&&(me=2),L.morphAttributes.color!==void 0&&(me=3);let ue,V,Y,ve;if(Z){let rt=Ri[Z];ue=rt.vertexShader,V=rt.fragmentShader}else ue=b.vertexShader,V=b.fragmentShader,l.update(b),Y=l.getVertexShaderID(b),ve=l.getFragmentShaderID(b);let le=r.getRenderTarget(),Ie=r.state.buffers.depth.getReversed(),be=G.isInstancedMesh===!0,Pe=G.isBatchedMesh===!0,Je=!!b.map,Ue=!!b.matcap,lt=!!B,k=!!b.aoMap,Gt=!!b.lightMap,Oe=!!b.bumpMap,Ge=!!b.normalMap,Re=!!b.displacementMap,Qe=!!b.emissiveMap,Ee=!!b.metalnessMap,E=!!b.roughnessMap,y=b.anisotropy>0,$=b.clearcoat>0,ee=b.dispersion>0,ie=b.iridescence>0,K=b.sheen>0,Me=b.transmission>0,pe=y&&!!b.anisotropyMap,ye=$&&!!b.clearcoatMap,et=$&&!!b.clearcoatNormalMap,ae=$&&!!b.clearcoatRoughnessMap,_e=ie&&!!b.iridescenceMap,De=ie&&!!b.iridescenceThicknessMap,Ne=K&&!!b.sheenColorMap,ge=K&&!!b.sheenRoughnessMap,Ye=!!b.specularMap,Ve=!!b.specularColorMap,ht=!!b.specularIntensityMap,O=Me&&!!b.transmissionMap,ce=Me&&!!b.thicknessMap,X=!!b.gradientMap,te=!!b.alphaMap,fe=b.alphaTest>0,oe=!!b.alphaHash,qe=!!b.extensions,_t=pr;b.toneMapped&&(le===null||le.isXRRenderTarget===!0)&&(_t=r.toneMapping);let Ut={shaderID:Z,shaderType:b.type,shaderName:b.name,vertexShader:ue,fragmentShader:V,defines:b.defines,customVertexShaderID:Y,customFragmentShaderID:ve,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:p,batching:Pe,batchingColor:Pe&&G._colorsTexture!==null,instancing:be,instancingColor:be&&G.instanceColor!==null,instancingMorph:be&&G.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:le===null?r.outputColorSpace:le.isXRRenderTarget===!0?le.texture.colorSpace:Zt,alphaToCoverage:!!b.alphaToCoverage,map:Je,matcap:Ue,envMap:lt,envMapMode:lt&&B.mapping,envMapCubeUVHeight:H,aoMap:k,lightMap:Gt,bumpMap:Oe,normalMap:Ge,displacementMap:h&&Re,emissiveMap:Qe,normalMapObjectSpace:Ge&&b.normalMapType===yp,normalMapTangentSpace:Ge&&b.normalMapType===Bd,metalnessMap:Ee,roughnessMap:E,anisotropy:y,anisotropyMap:pe,clearcoat:$,clearcoatMap:ye,clearcoatNormalMap:et,clearcoatRoughnessMap:ae,dispersion:ee,iridescence:ie,iridescenceMap:_e,iridescenceThicknessMap:De,sheen:K,sheenColorMap:Ne,sheenRoughnessMap:ge,specularMap:Ye,specularColorMap:Ve,specularIntensityMap:ht,transmission:Me,transmissionMap:O,thicknessMap:ce,gradientMap:X,opaque:b.transparent===!1&&b.blending===Jr&&b.alphaToCoverage===!1,alphaMap:te,alphaTest:fe,alphaHash:oe,combine:b.combine,mapUv:Je&&v(b.map.channel),aoMapUv:k&&v(b.aoMap.channel),lightMapUv:Gt&&v(b.lightMap.channel),bumpMapUv:Oe&&v(b.bumpMap.channel),normalMapUv:Ge&&v(b.normalMap.channel),displacementMapUv:Re&&v(b.displacementMap.channel),emissiveMapUv:Qe&&v(b.emissiveMap.channel),metalnessMapUv:Ee&&v(b.metalnessMap.channel),roughnessMapUv:E&&v(b.roughnessMap.channel),anisotropyMapUv:pe&&v(b.anisotropyMap.channel),clearcoatMapUv:ye&&v(b.clearcoatMap.channel),clearcoatNormalMapUv:et&&v(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ae&&v(b.clearcoatRoughnessMap.channel),iridescenceMapUv:_e&&v(b.iridescenceMap.channel),iridescenceThicknessMapUv:De&&v(b.iridescenceThicknessMap.channel),sheenColorMapUv:Ne&&v(b.sheenColorMap.channel),sheenRoughnessMapUv:ge&&v(b.sheenRoughnessMap.channel),specularMapUv:Ye&&v(b.specularMap.channel),specularColorMapUv:Ve&&v(b.specularColorMap.channel),specularIntensityMapUv:ht&&v(b.specularIntensityMap.channel),transmissionMapUv:O&&v(b.transmissionMap.channel),thicknessMapUv:ce&&v(b.thicknessMap.channel),alphaMapUv:te&&v(b.alphaMap.channel),vertexTangents:!!L.attributes.tangent&&(Ge||y),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!L.attributes.color&&L.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!L.attributes.uv&&(Je||te),fog:!!W,useFog:b.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:b.flatShading===!0,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Ie,skinning:G.isSkinnedMesh===!0,morphTargets:L.morphAttributes.position!==void 0,morphNormals:L.morphAttributes.normal!==void 0,morphColors:L.morphAttributes.color!==void 0,morphTargetsCount:de,morphTextureStride:me,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:b.dithering,shadowMapEnabled:r.shadowMap.enabled&&C.length>0,shadowMapType:r.shadowMap.type,toneMapping:_t,decodeVideoTexture:Je&&b.map.isVideoTexture===!0&&it.getTransfer(b.map.colorSpace)===ct,decodeVideoTextureEmissive:Qe&&b.emissiveMap.isVideoTexture===!0&&it.getTransfer(b.emissiveMap.colorSpace)===ct,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===Ci,flipSided:b.side===Yt,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:qe&&b.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(qe&&b.extensions.multiDraw===!0||Pe)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return Ut.vertexUv1s=c.has(1),Ut.vertexUv2s=c.has(2),Ut.vertexUv3s=c.has(3),c.clear(),Ut}function f(b){let x=[];if(b.shaderID?x.push(b.shaderID):(x.push(b.customVertexShaderID),x.push(b.customFragmentShaderID)),b.defines!==void 0)for(let C in b.defines)x.push(C),x.push(b.defines[C]);return b.isRawShaderMaterial===!1&&(M(x,b),w(x,b),x.push(r.outputColorSpace)),x.push(b.customProgramCacheKey),x.join()}function M(b,x){b.push(x.precision),b.push(x.outputColorSpace),b.push(x.envMapMode),b.push(x.envMapCubeUVHeight),b.push(x.mapUv),b.push(x.alphaMapUv),b.push(x.lightMapUv),b.push(x.aoMapUv),b.push(x.bumpMapUv),b.push(x.normalMapUv),b.push(x.displacementMapUv),b.push(x.emissiveMapUv),b.push(x.metalnessMapUv),b.push(x.roughnessMapUv),b.push(x.anisotropyMapUv),b.push(x.clearcoatMapUv),b.push(x.clearcoatNormalMapUv),b.push(x.clearcoatRoughnessMapUv),b.push(x.iridescenceMapUv),b.push(x.iridescenceThicknessMapUv),b.push(x.sheenColorMapUv),b.push(x.sheenRoughnessMapUv),b.push(x.specularMapUv),b.push(x.specularColorMapUv),b.push(x.specularIntensityMapUv),b.push(x.transmissionMapUv),b.push(x.thicknessMapUv),b.push(x.combine),b.push(x.fogExp2),b.push(x.sizeAttenuation),b.push(x.morphTargetsCount),b.push(x.morphAttributeCount),b.push(x.numDirLights),b.push(x.numPointLights),b.push(x.numSpotLights),b.push(x.numSpotLightMaps),b.push(x.numHemiLights),b.push(x.numRectAreaLights),b.push(x.numDirLightShadows),b.push(x.numPointLightShadows),b.push(x.numSpotLightShadows),b.push(x.numSpotLightShadowsWithMaps),b.push(x.numLightProbes),b.push(x.shadowMapType),b.push(x.toneMapping),b.push(x.numClippingPlanes),b.push(x.numClipIntersection),b.push(x.depthPacking)}function w(b,x){o.disableAll(),x.supportsVertexTextures&&o.enable(0),x.instancing&&o.enable(1),x.instancingColor&&o.enable(2),x.instancingMorph&&o.enable(3),x.matcap&&o.enable(4),x.envMap&&o.enable(5),x.normalMapObjectSpace&&o.enable(6),x.normalMapTangentSpace&&o.enable(7),x.clearcoat&&o.enable(8),x.iridescence&&o.enable(9),x.alphaTest&&o.enable(10),x.vertexColors&&o.enable(11),x.vertexAlphas&&o.enable(12),x.vertexUv1s&&o.enable(13),x.vertexUv2s&&o.enable(14),x.vertexUv3s&&o.enable(15),x.vertexTangents&&o.enable(16),x.anisotropy&&o.enable(17),x.alphaHash&&o.enable(18),x.batching&&o.enable(19),x.dispersion&&o.enable(20),x.batchingColor&&o.enable(21),b.push(o.mask),o.disableAll(),x.fog&&o.enable(0),x.useFog&&o.enable(1),x.flatShading&&o.enable(2),x.logarithmicDepthBuffer&&o.enable(3),x.reverseDepthBuffer&&o.enable(4),x.skinning&&o.enable(5),x.morphTargets&&o.enable(6),x.morphNormals&&o.enable(7),x.morphColors&&o.enable(8),x.premultipliedAlpha&&o.enable(9),x.shadowMapEnabled&&o.enable(10),x.doubleSided&&o.enable(11),x.flipSided&&o.enable(12),x.useDepthPacking&&o.enable(13),x.dithering&&o.enable(14),x.transmission&&o.enable(15),x.sheen&&o.enable(16),x.opaque&&o.enable(17),x.pointsUvs&&o.enable(18),x.decodeVideoTexture&&o.enable(19),x.decodeVideoTextureEmissive&&o.enable(20),x.alphaToCoverage&&o.enable(21),b.push(o.mask)}function _(b){let x=g[b.type],C;if(x){let U=Ri[x];C=Dp.clone(U.uniforms)}else C=b.uniforms;return C}function D(b,x){let C;for(let U=0,G=d.length;U<G;U++){let W=d[U];if(W.cacheKey===x){C=W,++C.usedTimes;break}}return C===void 0&&(C=new Ax(r,x,b,s),d.push(C)),C}function A(b){if(--b.usedTimes===0){let x=d.indexOf(b);d[x]=d[d.length-1],d.pop(),b.destroy()}}function R(b){l.remove(b)}function T(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:_,acquireProgram:D,releaseProgram:A,releaseShaderCache:R,programs:d,dispose:T}}function Lx(){let r=new WeakMap;function e(a){return r.has(a)}function t(a){let o=r.get(a);return o===void 0&&(o={},r.set(a,o)),o}function i(a){r.delete(a)}function n(a,o,l){r.get(a)[o]=l}function s(){r=new WeakMap}return{has:e,get:t,remove:i,update:n,dispose:s}}function Px(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.z!==e.z?r.z-e.z:r.id-e.id}function Zu(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function Ju(){let r=[],e=0,t=[],i=[],n=[];function s(){e=0,t.length=0,i.length=0,n.length=0}function a(u,h,p,g,v,m){let f=r[e];return f===void 0?(f={id:u.id,object:u,geometry:h,material:p,groupOrder:g,renderOrder:u.renderOrder,z:v,group:m},r[e]=f):(f.id=u.id,f.object=u,f.geometry=h,f.material=p,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=v,f.group=m),e++,f}function o(u,h,p,g,v,m){let f=a(u,h,p,g,v,m);p.transmission>0?i.push(f):p.transparent===!0?n.push(f):t.push(f)}function l(u,h,p,g,v,m){let f=a(u,h,p,g,v,m);p.transmission>0?i.unshift(f):p.transparent===!0?n.unshift(f):t.unshift(f)}function c(u,h){t.length>1&&t.sort(u||Px),i.length>1&&i.sort(h||Zu),n.length>1&&n.sort(h||Zu)}function d(){for(let u=e,h=r.length;u<h;u++){let p=r[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:n,init:s,push:o,unshift:l,finish:d,sort:c}}function Ix(){let r=new WeakMap;function e(i,n){let s=r.get(i),a;return s===void 0?(a=new Ju,r.set(i,[a])):n>=s.length?(a=new Ju,s.push(a)):a=s[n],a}function t(){r=new WeakMap}return{get:e,dispose:t}}function Dx(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new z,color:new Be};break;case"SpotLight":t={position:new z,direction:new z,color:new Be,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new z,color:new Be,distance:0,decay:0};break;case"HemisphereLight":t={direction:new z,skyColor:new Be,groundColor:new Be};break;case"RectAreaLight":t={color:new Be,position:new z,halfWidth:new z,halfHeight:new z};break}return r[e.id]=t,t}}}function Ux(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new nt,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[e.id]=t,t}}}var Nx=0;function kx(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function Ox(r){let e=new Dx,t=Ux(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new z);let n=new z,s=new je,a=new je;function o(c){let d=0,u=0,h=0;for(let b=0;b<9;b++)i.probe[b].set(0,0,0);let p=0,g=0,v=0,m=0,f=0,M=0,w=0,_=0,D=0,A=0,R=0;c.sort(kx);for(let b=0,x=c.length;b<x;b++){let C=c[b],U=C.color,G=C.intensity,W=C.distance,L=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)d+=U.r*G,u+=U.g*G,h+=U.b*G;else if(C.isLightProbe){for(let P=0;P<9;P++)i.probe[P].addScaledVector(C.sh.coefficients[P],G);R++}else if(C.isDirectionalLight){let P=e.get(C);if(P.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let B=C.shadow,H=t.get(C);H.shadowIntensity=B.intensity,H.shadowBias=B.bias,H.shadowNormalBias=B.normalBias,H.shadowRadius=B.radius,H.shadowMapSize=B.mapSize,i.directionalShadow[p]=H,i.directionalShadowMap[p]=L,i.directionalShadowMatrix[p]=C.shadow.matrix,M++}i.directional[p]=P,p++}else if(C.isSpotLight){let P=e.get(C);P.position.setFromMatrixPosition(C.matrixWorld),P.color.copy(U).multiplyScalar(G),P.distance=W,P.coneCos=Math.cos(C.angle),P.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),P.decay=C.decay,i.spot[v]=P;let B=C.shadow;if(C.map&&(i.spotLightMap[D]=C.map,D++,B.updateMatrices(C),C.castShadow&&A++),i.spotLightMatrix[v]=B.matrix,C.castShadow){let H=t.get(C);H.shadowIntensity=B.intensity,H.shadowBias=B.bias,H.shadowNormalBias=B.normalBias,H.shadowRadius=B.radius,H.shadowMapSize=B.mapSize,i.spotShadow[v]=H,i.spotShadowMap[v]=L,_++}v++}else if(C.isRectAreaLight){let P=e.get(C);P.color.copy(U).multiplyScalar(G),P.halfWidth.set(C.width*.5,0,0),P.halfHeight.set(0,C.height*.5,0),i.rectArea[m]=P,m++}else if(C.isPointLight){let P=e.get(C);if(P.color.copy(C.color).multiplyScalar(C.intensity),P.distance=C.distance,P.decay=C.decay,C.castShadow){let B=C.shadow,H=t.get(C);H.shadowIntensity=B.intensity,H.shadowBias=B.bias,H.shadowNormalBias=B.normalBias,H.shadowRadius=B.radius,H.shadowMapSize=B.mapSize,H.shadowCameraNear=B.camera.near,H.shadowCameraFar=B.camera.far,i.pointShadow[g]=H,i.pointShadowMap[g]=L,i.pointShadowMatrix[g]=C.shadow.matrix,w++}i.point[g]=P,g++}else if(C.isHemisphereLight){let P=e.get(C);P.skyColor.copy(C.color).multiplyScalar(G),P.groundColor.copy(C.groundColor).multiplyScalar(G),i.hemi[f]=P,f++}}m>0&&(r.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=he.LTC_FLOAT_1,i.rectAreaLTC2=he.LTC_FLOAT_2):(i.rectAreaLTC1=he.LTC_HALF_1,i.rectAreaLTC2=he.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=u,i.ambient[2]=h;let T=i.hash;(T.directionalLength!==p||T.pointLength!==g||T.spotLength!==v||T.rectAreaLength!==m||T.hemiLength!==f||T.numDirectionalShadows!==M||T.numPointShadows!==w||T.numSpotShadows!==_||T.numSpotMaps!==D||T.numLightProbes!==R)&&(i.directional.length=p,i.spot.length=v,i.rectArea.length=m,i.point.length=g,i.hemi.length=f,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=w,i.pointShadowMap.length=w,i.spotShadow.length=_,i.spotShadowMap.length=_,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=w,i.spotLightMatrix.length=_+D-A,i.spotLightMap.length=D,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=R,T.directionalLength=p,T.pointLength=g,T.spotLength=v,T.rectAreaLength=m,T.hemiLength=f,T.numDirectionalShadows=M,T.numPointShadows=w,T.numSpotShadows=_,T.numSpotMaps=D,T.numLightProbes=R,i.version=Nx++)}function l(c,d){let u=0,h=0,p=0,g=0,v=0,m=d.matrixWorldInverse;for(let f=0,M=c.length;f<M;f++){let w=c[f];if(w.isDirectionalLight){let _=i.directional[u];_.direction.setFromMatrixPosition(w.matrixWorld),n.setFromMatrixPosition(w.target.matrixWorld),_.direction.sub(n),_.direction.transformDirection(m),u++}else if(w.isSpotLight){let _=i.spot[p];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(w.matrixWorld),n.setFromMatrixPosition(w.target.matrixWorld),_.direction.sub(n),_.direction.transformDirection(m),p++}else if(w.isRectAreaLight){let _=i.rectArea[g];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),a.identity(),s.copy(w.matrixWorld),s.premultiply(m),a.extractRotation(s),_.halfWidth.set(w.width*.5,0,0),_.halfHeight.set(0,w.height*.5,0),_.halfWidth.applyMatrix4(a),_.halfHeight.applyMatrix4(a),g++}else if(w.isPointLight){let _=i.point[h];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),h++}else if(w.isHemisphereLight){let _=i.hemi[v];_.direction.setFromMatrixPosition(w.matrixWorld),_.direction.transformDirection(m),v++}}}return{setup:o,setupView:l,state:i}}function Qu(r){let e=new Ox(r),t=[],i=[];function n(d){c.camera=d,t.length=0,i.length=0}function s(d){t.push(d)}function a(d){i.push(d)}function o(){e.setup(t)}function l(d){e.setupView(t,d)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:n,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function Fx(r){let e=new WeakMap;function t(n,s=0){let a=e.get(n),o;return a===void 0?(o=new Qu(r),e.set(n,[o])):s>=a.length?(o=new Qu(r),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var Co=class extends hi{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=xp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Lo=class extends hi{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},Bx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Hx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function zx(r,e,t){let i=new $n,n=new nt,s=new nt,a=new at,o=new Co({depthPacking:_p}),l=new Lo,c={},d=t.maxTextureSize,u={[qi]:Yt,[Yt]:qi,[Ci]:Ci},h=new Fi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new nt},radius:{value:4}},vertexShader:Bx,fragmentShader:Hx}),p=h.clone();p.defines.HORIZONTAL_PASS=1;let g=new Oi;g.setAttribute("position",new zt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new ut(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Md;let f=this.type;this.render=function(A,R,T){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;let b=r.getRenderTarget(),x=r.getActiveCubeFace(),C=r.getActiveMipmapLevel(),U=r.state;U.setBlending(hr),U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let G=f!==Vi&&this.type===Vi,W=f===Vi&&this.type!==Vi;for(let L=0,P=A.length;L<P;L++){let B=A[L],H=B.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",B,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;n.copy(H.mapSize);let Z=H.getFrameExtents();if(n.multiply(Z),s.copy(H.mapSize),(n.x>d||n.y>d)&&(n.x>d&&(s.x=Math.floor(d/Z.x),n.x=s.x*Z.x,H.mapSize.x=s.x),n.y>d&&(s.y=Math.floor(d/Z.y),n.y=s.y*Z.y,H.mapSize.y=s.y)),H.map===null||G===!0||W===!0){let de=this.type!==Vi?{minFilter:Kt,magFilter:Kt}:{};H.map!==null&&H.map.dispose(),H.map=new Yi(n.x,n.y,de),H.map.texture.name=B.name+".shadowMap",H.camera.updateProjectionMatrix()}r.setRenderTarget(H.map),r.clear();let ne=H.getViewportCount();for(let de=0;de<ne;de++){let me=H.getViewport(de);a.set(s.x*me.x,s.y*me.y,s.x*me.z,s.y*me.w),U.viewport(a),H.updateMatrices(B,de),i=H.getFrustum(),_(R,T,H.camera,B,this.type)}H.isPointLightShadow!==!0&&this.type===Vi&&M(H,T),H.needsUpdate=!1}f=this.type,m.needsUpdate=!1,r.setRenderTarget(b,x,C)};function M(A,R){let T=e.update(v);h.defines.VSM_SAMPLES!==A.blurSamples&&(h.defines.VSM_SAMPLES=A.blurSamples,p.defines.VSM_SAMPLES=A.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Yi(n.x,n.y)),h.uniforms.shadow_pass.value=A.map.texture,h.uniforms.resolution.value=A.mapSize,h.uniforms.radius.value=A.radius,r.setRenderTarget(A.mapPass),r.clear(),r.renderBufferDirect(R,null,T,h,v,null),p.uniforms.shadow_pass.value=A.mapPass.texture,p.uniforms.resolution.value=A.mapSize,p.uniforms.radius.value=A.radius,r.setRenderTarget(A.map),r.clear(),r.renderBufferDirect(R,null,T,p,v,null)}function w(A,R,T,b){let x=null,C=T.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(C!==void 0)x=C;else if(x=T.isPointLight===!0?l:o,r.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){let U=x.uuid,G=R.uuid,W=c[U];W===void 0&&(W={},c[U]=W);let L=W[G];L===void 0&&(L=x.clone(),W[G]=L,R.addEventListener("dispose",D)),x=L}if(x.visible=R.visible,x.wireframe=R.wireframe,b===Vi?x.side=R.shadowSide!==null?R.shadowSide:R.side:x.side=R.shadowSide!==null?R.shadowSide:u[R.side],x.alphaMap=R.alphaMap,x.alphaTest=R.alphaTest,x.map=R.map,x.clipShadows=R.clipShadows,x.clippingPlanes=R.clippingPlanes,x.clipIntersection=R.clipIntersection,x.displacementMap=R.displacementMap,x.displacementScale=R.displacementScale,x.displacementBias=R.displacementBias,x.wireframeLinewidth=R.wireframeLinewidth,x.linewidth=R.linewidth,T.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let U=r.properties.get(x);U.light=T}return x}function _(A,R,T,b,x){if(A.visible===!1)return;if(A.layers.test(R.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&x===Vi)&&(!A.frustumCulled||i.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,A.matrixWorld);let U=e.update(A),G=A.material;if(Array.isArray(G)){let W=U.groups;for(let L=0,P=W.length;L<P;L++){let B=W[L],H=G[B.materialIndex];if(H&&H.visible){let Z=w(A,H,b,x);A.onBeforeShadow(r,A,R,T,U,Z,B),r.renderBufferDirect(T,null,U,Z,A,B),A.onAfterShadow(r,A,R,T,U,Z,B)}}}else if(G.visible){let W=w(A,G,b,x);A.onBeforeShadow(r,A,R,T,U,W,null),r.renderBufferDirect(T,null,U,W,A,null),A.onAfterShadow(r,A,R,T,U,W,null)}}let C=A.children;for(let U=0,G=C.length;U<G;U++)_(C[U],R,T,b,x)}function D(A){A.target.removeEventListener("dispose",D);for(let R in c){let T=c[R],b=A.target.uuid;b in T&&(T[b].dispose(),delete T[b])}}}var Vx={[Ha]:za,[Va]:Wa,[Ga]:ja,[en]:$a,[za]:Ha,[Wa]:Va,[ja]:Ga,[$a]:en};function Gx(r,e){function t(){let O=!1,ce=new at,X=null,te=new at(0,0,0,0);return{setMask:function(fe){X!==fe&&!O&&(r.colorMask(fe,fe,fe,fe),X=fe)},setLocked:function(fe){O=fe},setClear:function(fe,oe,qe,_t,Ut){Ut===!0&&(fe*=_t,oe*=_t,qe*=_t),ce.set(fe,oe,qe,_t),te.equals(ce)===!1&&(r.clearColor(fe,oe,qe,_t),te.copy(ce))},reset:function(){O=!1,X=null,te.set(-1,0,0,0)}}}function i(){let O=!1,ce=!1,X=null,te=null,fe=null;return{setReversed:function(oe){if(ce!==oe){let qe=e.get("EXT_clip_control");ce?qe.clipControlEXT(qe.LOWER_LEFT_EXT,qe.ZERO_TO_ONE_EXT):qe.clipControlEXT(qe.LOWER_LEFT_EXT,qe.NEGATIVE_ONE_TO_ONE_EXT);let _t=fe;fe=null,this.setClear(_t)}ce=oe},getReversed:function(){return ce},setTest:function(oe){oe?le(r.DEPTH_TEST):Ie(r.DEPTH_TEST)},setMask:function(oe){X!==oe&&!O&&(r.depthMask(oe),X=oe)},setFunc:function(oe){if(ce&&(oe=Vx[oe]),te!==oe){switch(oe){case Ha:r.depthFunc(r.NEVER);break;case za:r.depthFunc(r.ALWAYS);break;case Va:r.depthFunc(r.LESS);break;case en:r.depthFunc(r.LEQUAL);break;case Ga:r.depthFunc(r.EQUAL);break;case $a:r.depthFunc(r.GEQUAL);break;case Wa:r.depthFunc(r.GREATER);break;case ja:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}te=oe}},setLocked:function(oe){O=oe},setClear:function(oe){fe!==oe&&(ce&&(oe=1-oe),r.clearDepth(oe),fe=oe)},reset:function(){O=!1,X=null,te=null,fe=null,ce=!1}}}function n(){let O=!1,ce=null,X=null,te=null,fe=null,oe=null,qe=null,_t=null,Ut=null;return{setTest:function(rt){O||(rt?le(r.STENCIL_TEST):Ie(r.STENCIL_TEST))},setMask:function(rt){ce!==rt&&!O&&(r.stencilMask(rt),ce=rt)},setFunc:function(rt,ii,ri){(X!==rt||te!==ii||fe!==ri)&&(r.stencilFunc(rt,ii,ri),X=rt,te=ii,fe=ri)},setOp:function(rt,ii,ri){(oe!==rt||qe!==ii||_t!==ri)&&(r.stencilOp(rt,ii,ri),oe=rt,qe=ii,_t=ri)},setLocked:function(rt){O=rt},setClear:function(rt){Ut!==rt&&(r.clearStencil(rt),Ut=rt)},reset:function(){O=!1,ce=null,X=null,te=null,fe=null,oe=null,qe=null,_t=null,Ut=null}}}let s=new t,a=new i,o=new n,l=new WeakMap,c=new WeakMap,d={},u={},h=new WeakMap,p=[],g=null,v=!1,m=null,f=null,M=null,w=null,_=null,D=null,A=null,R=new Be(0,0,0),T=0,b=!1,x=null,C=null,U=null,G=null,W=null,L=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS),P=!1,B=0,H=r.getParameter(r.VERSION);H.indexOf("WebGL")!==-1?(B=parseFloat(/^WebGL (\d)/.exec(H)[1]),P=B>=1):H.indexOf("OpenGL ES")!==-1&&(B=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),P=B>=2);let Z=null,ne={},de=r.getParameter(r.SCISSOR_BOX),me=r.getParameter(r.VIEWPORT),ue=new at().fromArray(de),V=new at().fromArray(me);function Y(O,ce,X,te){let fe=new Uint8Array(4),oe=r.createTexture();r.bindTexture(O,oe),r.texParameteri(O,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(O,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let qe=0;qe<X;qe++)O===r.TEXTURE_3D||O===r.TEXTURE_2D_ARRAY?r.texImage3D(ce,0,r.RGBA,1,1,te,0,r.RGBA,r.UNSIGNED_BYTE,fe):r.texImage2D(ce+qe,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,fe);return oe}let ve={};ve[r.TEXTURE_2D]=Y(r.TEXTURE_2D,r.TEXTURE_2D,1),ve[r.TEXTURE_CUBE_MAP]=Y(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),ve[r.TEXTURE_2D_ARRAY]=Y(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),ve[r.TEXTURE_3D]=Y(r.TEXTURE_3D,r.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),le(r.DEPTH_TEST),a.setFunc(en),Oe(!1),Ge(fc),le(r.CULL_FACE),k(hr);function le(O){d[O]!==!0&&(r.enable(O),d[O]=!0)}function Ie(O){d[O]!==!1&&(r.disable(O),d[O]=!1)}function be(O,ce){return u[O]!==ce?(r.bindFramebuffer(O,ce),u[O]=ce,O===r.DRAW_FRAMEBUFFER&&(u[r.FRAMEBUFFER]=ce),O===r.FRAMEBUFFER&&(u[r.DRAW_FRAMEBUFFER]=ce),!0):!1}function Pe(O,ce){let X=p,te=!1;if(O){X=h.get(ce),X===void 0&&(X=[],h.set(ce,X));let fe=O.textures;if(X.length!==fe.length||X[0]!==r.COLOR_ATTACHMENT0){for(let oe=0,qe=fe.length;oe<qe;oe++)X[oe]=r.COLOR_ATTACHMENT0+oe;X.length=fe.length,te=!0}}else X[0]!==r.BACK&&(X[0]=r.BACK,te=!0);te&&r.drawBuffers(X)}function Je(O){return g!==O?(r.useProgram(O),g=O,!0):!1}let Ue={[Pr]:r.FUNC_ADD,[$h]:r.FUNC_SUBTRACT,[Wh]:r.FUNC_REVERSE_SUBTRACT};Ue[jh]=r.MIN,Ue[qh]=r.MAX;let lt={[Xh]:r.ZERO,[Yh]:r.ONE,[Kh]:r.SRC_COLOR,[Fa]:r.SRC_ALPHA,[ip]:r.SRC_ALPHA_SATURATE,[ep]:r.DST_COLOR,[Jh]:r.DST_ALPHA,[Zh]:r.ONE_MINUS_SRC_COLOR,[Ba]:r.ONE_MINUS_SRC_ALPHA,[tp]:r.ONE_MINUS_DST_COLOR,[Qh]:r.ONE_MINUS_DST_ALPHA,[rp]:r.CONSTANT_COLOR,[np]:r.ONE_MINUS_CONSTANT_COLOR,[sp]:r.CONSTANT_ALPHA,[ap]:r.ONE_MINUS_CONSTANT_ALPHA};function k(O,ce,X,te,fe,oe,qe,_t,Ut,rt){if(O===hr){v===!0&&(Ie(r.BLEND),v=!1);return}if(v===!1&&(le(r.BLEND),v=!0),O!==Gh){if(O!==m||rt!==b){if((f!==Pr||_!==Pr)&&(r.blendEquation(r.FUNC_ADD),f=Pr,_=Pr),rt)switch(O){case Jr:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case gc:r.blendFunc(r.ONE,r.ONE);break;case vc:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case xc:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}else switch(O){case Jr:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case gc:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case vc:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case xc:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}M=null,w=null,D=null,A=null,R.set(0,0,0),T=0,m=O,b=rt}return}fe=fe||ce,oe=oe||X,qe=qe||te,(ce!==f||fe!==_)&&(r.blendEquationSeparate(Ue[ce],Ue[fe]),f=ce,_=fe),(X!==M||te!==w||oe!==D||qe!==A)&&(r.blendFuncSeparate(lt[X],lt[te],lt[oe],lt[qe]),M=X,w=te,D=oe,A=qe),(_t.equals(R)===!1||Ut!==T)&&(r.blendColor(_t.r,_t.g,_t.b,Ut),R.copy(_t),T=Ut),m=O,b=!1}function Gt(O,ce){O.side===Ci?Ie(r.CULL_FACE):le(r.CULL_FACE);let X=O.side===Yt;ce&&(X=!X),Oe(X),O.blending===Jr&&O.transparent===!1?k(hr):k(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),a.setFunc(O.depthFunc),a.setTest(O.depthTest),a.setMask(O.depthWrite),s.setMask(O.colorWrite);let te=O.stencilWrite;o.setTest(te),te&&(o.setMask(O.stencilWriteMask),o.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),o.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),Qe(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?le(r.SAMPLE_ALPHA_TO_COVERAGE):Ie(r.SAMPLE_ALPHA_TO_COVERAGE)}function Oe(O){x!==O&&(O?r.frontFace(r.CW):r.frontFace(r.CCW),x=O)}function Ge(O){O!==Hh?(le(r.CULL_FACE),O!==C&&(O===fc?r.cullFace(r.BACK):O===zh?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):Ie(r.CULL_FACE),C=O}function Re(O){O!==U&&(P&&r.lineWidth(O),U=O)}function Qe(O,ce,X){O?(le(r.POLYGON_OFFSET_FILL),(G!==ce||W!==X)&&(r.polygonOffset(ce,X),G=ce,W=X)):Ie(r.POLYGON_OFFSET_FILL)}function Ee(O){O?le(r.SCISSOR_TEST):Ie(r.SCISSOR_TEST)}function E(O){O===void 0&&(O=r.TEXTURE0+L-1),Z!==O&&(r.activeTexture(O),Z=O)}function y(O,ce,X){X===void 0&&(Z===null?X=r.TEXTURE0+L-1:X=Z);let te=ne[X];te===void 0&&(te={type:void 0,texture:void 0},ne[X]=te),(te.type!==O||te.texture!==ce)&&(Z!==X&&(r.activeTexture(X),Z=X),r.bindTexture(O,ce||ve[O]),te.type=O,te.texture=ce)}function $(){let O=ne[Z];O!==void 0&&O.type!==void 0&&(r.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function ee(){try{r.compressedTexImage2D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ie(){try{r.compressedTexImage3D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function K(){try{r.texSubImage2D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Me(){try{r.texSubImage3D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function pe(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ye(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function et(){try{r.texStorage2D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ae(){try{r.texStorage3D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function _e(){try{r.texImage2D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function De(){try{r.texImage3D.apply(r,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Ne(O){ue.equals(O)===!1&&(r.scissor(O.x,O.y,O.z,O.w),ue.copy(O))}function ge(O){V.equals(O)===!1&&(r.viewport(O.x,O.y,O.z,O.w),V.copy(O))}function Ye(O,ce){let X=c.get(ce);X===void 0&&(X=new WeakMap,c.set(ce,X));let te=X.get(O);te===void 0&&(te=r.getUniformBlockIndex(ce,O.name),X.set(O,te))}function Ve(O,ce){let X=c.get(ce).get(O);l.get(ce)!==X&&(r.uniformBlockBinding(ce,X,O.__bindingPointIndex),l.set(ce,X))}function ht(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),a.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),d={},Z=null,ne={},u={},h=new WeakMap,p=[],g=null,v=!1,m=null,f=null,M=null,w=null,_=null,D=null,A=null,R=new Be(0,0,0),T=0,b=!1,x=null,C=null,U=null,G=null,W=null,ue.set(0,0,r.canvas.width,r.canvas.height),V.set(0,0,r.canvas.width,r.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:le,disable:Ie,bindFramebuffer:be,drawBuffers:Pe,useProgram:Je,setBlending:k,setMaterial:Gt,setFlipSided:Oe,setCullFace:Ge,setLineWidth:Re,setPolygonOffset:Qe,setScissorTest:Ee,activeTexture:E,bindTexture:y,unbindTexture:$,compressedTexImage2D:ee,compressedTexImage3D:ie,texImage2D:_e,texImage3D:De,updateUBOMapping:Ye,uniformBlockBinding:Ve,texStorage2D:et,texStorage3D:ae,texSubImage2D:K,texSubImage3D:Me,compressedTexSubImage2D:pe,compressedTexSubImage3D:ye,scissor:Ne,viewport:ge,reset:ht}}function eh(r,e,t,i){let n=$x(i);switch(t){case Id:return r*e;case Ud:return r*e;case Nd:return r*e*2;case dl:return r*e/n.components*n.byteLength;case ul:return r*e/n.components*n.byteLength;case kd:return r*e*2/n.components*n.byteLength;case hl:return r*e*2/n.components*n.byteLength;case Dd:return r*e*3/n.components*n.byteLength;case ui:return r*e*4/n.components*n.byteLength;case pl:return r*e*4/n.components*n.byteLength;case _s:case ys:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case bs:case Ss:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Ka:case Ja:return Math.max(r,16)*Math.max(e,8)/4;case Ya:case Za:return Math.max(r,8)*Math.max(e,8)/2;case Qa:case eo:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case to:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case io:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case ro:return Math.floor((r+4)/5)*Math.floor((e+3)/4)*16;case no:return Math.floor((r+4)/5)*Math.floor((e+4)/5)*16;case so:return Math.floor((r+5)/6)*Math.floor((e+4)/5)*16;case ao:return Math.floor((r+5)/6)*Math.floor((e+5)/6)*16;case oo:return Math.floor((r+7)/8)*Math.floor((e+4)/5)*16;case lo:return Math.floor((r+7)/8)*Math.floor((e+5)/6)*16;case co:return Math.floor((r+7)/8)*Math.floor((e+7)/8)*16;case uo:return Math.floor((r+9)/10)*Math.floor((e+4)/5)*16;case ho:return Math.floor((r+9)/10)*Math.floor((e+5)/6)*16;case po:return Math.floor((r+9)/10)*Math.floor((e+7)/8)*16;case mo:return Math.floor((r+9)/10)*Math.floor((e+9)/10)*16;case fo:return Math.floor((r+11)/12)*Math.floor((e+9)/10)*16;case go:return Math.floor((r+11)/12)*Math.floor((e+11)/12)*16;case ws:case vo:case xo:return Math.ceil(r/4)*Math.ceil(e/4)*16;case Od:case _o:return Math.ceil(r/4)*Math.ceil(e/4)*8;case yo:case bo:return Math.ceil(r/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function $x(r){switch(r){case Xi:case Cd:return{byteLength:1,components:1};case Bn:case Ld:case Jn:return{byteLength:2,components:1};case ll:case cl:return{byteLength:2,components:4};case Nr:case ol:case yi:return{byteLength:4,components:1};case Pd:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}function Wx(r,e,t,i,n,s,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new nt,d=new WeakMap,u,h=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,y){return p?new OffscreenCanvas(E,y):Ls("canvas")}function v(E,y,$){let ee=1,ie=Ee(E);if((ie.width>$||ie.height>$)&&(ee=$/Math.max(ie.width,ie.height)),ee<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){let K=Math.floor(ee*ie.width),Me=Math.floor(ee*ie.height);u===void 0&&(u=g(K,Me));let pe=y?g(K,Me):u;return pe.width=K,pe.height=Me,pe.getContext("2d").drawImage(E,0,0,K,Me),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ie.width+"x"+ie.height+") to ("+K+"x"+Me+")."),pe}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ie.width+"x"+ie.height+")."),E;return E}function m(E){return E.generateMipmaps}function f(E){r.generateMipmap(E)}function M(E){return E.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?r.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function w(E,y,$,ee,ie=!1){if(E!==null){if(r[E]!==void 0)return r[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let K=y;if(y===r.RED&&($===r.FLOAT&&(K=r.R32F),$===r.HALF_FLOAT&&(K=r.R16F),$===r.UNSIGNED_BYTE&&(K=r.R8)),y===r.RED_INTEGER&&($===r.UNSIGNED_BYTE&&(K=r.R8UI),$===r.UNSIGNED_SHORT&&(K=r.R16UI),$===r.UNSIGNED_INT&&(K=r.R32UI),$===r.BYTE&&(K=r.R8I),$===r.SHORT&&(K=r.R16I),$===r.INT&&(K=r.R32I)),y===r.RG&&($===r.FLOAT&&(K=r.RG32F),$===r.HALF_FLOAT&&(K=r.RG16F),$===r.UNSIGNED_BYTE&&(K=r.RG8)),y===r.RG_INTEGER&&($===r.UNSIGNED_BYTE&&(K=r.RG8UI),$===r.UNSIGNED_SHORT&&(K=r.RG16UI),$===r.UNSIGNED_INT&&(K=r.RG32UI),$===r.BYTE&&(K=r.RG8I),$===r.SHORT&&(K=r.RG16I),$===r.INT&&(K=r.RG32I)),y===r.RGB_INTEGER&&($===r.UNSIGNED_BYTE&&(K=r.RGB8UI),$===r.UNSIGNED_SHORT&&(K=r.RGB16UI),$===r.UNSIGNED_INT&&(K=r.RGB32UI),$===r.BYTE&&(K=r.RGB8I),$===r.SHORT&&(K=r.RGB16I),$===r.INT&&(K=r.RGB32I)),y===r.RGBA_INTEGER&&($===r.UNSIGNED_BYTE&&(K=r.RGBA8UI),$===r.UNSIGNED_SHORT&&(K=r.RGBA16UI),$===r.UNSIGNED_INT&&(K=r.RGBA32UI),$===r.BYTE&&(K=r.RGBA8I),$===r.SHORT&&(K=r.RGBA16I),$===r.INT&&(K=r.RGBA32I)),y===r.RGB&&$===r.UNSIGNED_INT_5_9_9_9_REV&&(K=r.RGB9_E5),y===r.RGBA){let Me=ie?Qs:it.getTransfer(ee);$===r.FLOAT&&(K=r.RGBA32F),$===r.HALF_FLOAT&&(K=r.RGBA16F),$===r.UNSIGNED_BYTE&&(K=Me===ct?r.SRGB8_ALPHA8:r.RGBA8),$===r.UNSIGNED_SHORT_4_4_4_4&&(K=r.RGBA4),$===r.UNSIGNED_SHORT_5_5_5_1&&(K=r.RGB5_A1)}return(K===r.R16F||K===r.R32F||K===r.RG16F||K===r.RG32F||K===r.RGBA16F||K===r.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function _(E,y){let $;return E?y===null||y===Nr||y===sn?$=r.DEPTH24_STENCIL8:y===yi?$=r.DEPTH32F_STENCIL8:y===Bn&&($=r.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Nr||y===sn?$=r.DEPTH_COMPONENT24:y===yi?$=r.DEPTH_COMPONENT32F:y===Bn&&($=r.DEPTH_COMPONENT16),$}function D(E,y){return m(E)===!0||E.isFramebufferTexture&&E.minFilter!==Kt&&E.minFilter!==si?Math.log2(Math.max(y.width,y.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?y.mipmaps.length:1}function A(E){let y=E.target;y.removeEventListener("dispose",A),T(y),y.isVideoTexture&&d.delete(y)}function R(E){let y=E.target;y.removeEventListener("dispose",R),x(y)}function T(E){let y=i.get(E);if(y.__webglInit===void 0)return;let $=E.source,ee=h.get($);if(ee){let ie=ee[y.__cacheKey];ie.usedTimes--,ie.usedTimes===0&&b(E),Object.keys(ee).length===0&&h.delete($)}i.remove(E)}function b(E){let y=i.get(E);r.deleteTexture(y.__webglTexture);let $=E.source,ee=h.get($);delete ee[y.__cacheKey],a.memory.textures--}function x(E){let y=i.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),i.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let ee=0;ee<6;ee++){if(Array.isArray(y.__webglFramebuffer[ee]))for(let ie=0;ie<y.__webglFramebuffer[ee].length;ie++)r.deleteFramebuffer(y.__webglFramebuffer[ee][ie]);else r.deleteFramebuffer(y.__webglFramebuffer[ee]);y.__webglDepthbuffer&&r.deleteRenderbuffer(y.__webglDepthbuffer[ee])}else{if(Array.isArray(y.__webglFramebuffer))for(let ee=0;ee<y.__webglFramebuffer.length;ee++)r.deleteFramebuffer(y.__webglFramebuffer[ee]);else r.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&r.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&r.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let ee=0;ee<y.__webglColorRenderbuffer.length;ee++)y.__webglColorRenderbuffer[ee]&&r.deleteRenderbuffer(y.__webglColorRenderbuffer[ee]);y.__webglDepthRenderbuffer&&r.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let $=E.textures;for(let ee=0,ie=$.length;ee<ie;ee++){let K=i.get($[ee]);K.__webglTexture&&(r.deleteTexture(K.__webglTexture),a.memory.textures--),i.remove($[ee])}i.remove(E)}let C=0;function U(){C=0}function G(){let E=C;return E>=n.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+n.maxTextures),C+=1,E}function W(E){let y=[];return y.push(E.wrapS),y.push(E.wrapT),y.push(E.wrapR||0),y.push(E.magFilter),y.push(E.minFilter),y.push(E.anisotropy),y.push(E.internalFormat),y.push(E.format),y.push(E.type),y.push(E.generateMipmaps),y.push(E.premultiplyAlpha),y.push(E.flipY),y.push(E.unpackAlignment),y.push(E.colorSpace),y.join()}function L(E,y){let $=i.get(E);if(E.isVideoTexture&&Re(E),E.isRenderTargetTexture===!1&&E.version>0&&$.__version!==E.version){let ee=E.image;if(ee===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ee.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{V($,E,y);return}}t.bindTexture(r.TEXTURE_2D,$.__webglTexture,r.TEXTURE0+y)}function P(E,y){let $=i.get(E);if(E.version>0&&$.__version!==E.version){V($,E,y);return}t.bindTexture(r.TEXTURE_2D_ARRAY,$.__webglTexture,r.TEXTURE0+y)}function B(E,y){let $=i.get(E);if(E.version>0&&$.__version!==E.version){V($,E,y);return}t.bindTexture(r.TEXTURE_3D,$.__webglTexture,r.TEXTURE0+y)}function H(E,y){let $=i.get(E);if(E.version>0&&$.__version!==E.version){Y($,E,y);return}t.bindTexture(r.TEXTURE_CUBE_MAP,$.__webglTexture,r.TEXTURE0+y)}let Z={[nn]:r.REPEAT,[dr]:r.CLAMP_TO_EDGE,[Rs]:r.MIRRORED_REPEAT},ne={[Kt]:r.NEAREST,[Rd]:r.NEAREST_MIPMAP_NEAREST,[Un]:r.NEAREST_MIPMAP_LINEAR,[si]:r.LINEAR,[xs]:r.LINEAR_MIPMAP_NEAREST,[Wi]:r.LINEAR_MIPMAP_LINEAR},de={[bp]:r.NEVER,[Ap]:r.ALWAYS,[Sp]:r.LESS,[Hd]:r.LEQUAL,[wp]:r.EQUAL,[Ep]:r.GEQUAL,[Mp]:r.GREATER,[Tp]:r.NOTEQUAL};function me(E,y){if(y.type===yi&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===si||y.magFilter===xs||y.magFilter===Un||y.magFilter===Wi||y.minFilter===si||y.minFilter===xs||y.minFilter===Un||y.minFilter===Wi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(E,r.TEXTURE_WRAP_S,Z[y.wrapS]),r.texParameteri(E,r.TEXTURE_WRAP_T,Z[y.wrapT]),(E===r.TEXTURE_3D||E===r.TEXTURE_2D_ARRAY)&&r.texParameteri(E,r.TEXTURE_WRAP_R,Z[y.wrapR]),r.texParameteri(E,r.TEXTURE_MAG_FILTER,ne[y.magFilter]),r.texParameteri(E,r.TEXTURE_MIN_FILTER,ne[y.minFilter]),y.compareFunction&&(r.texParameteri(E,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(E,r.TEXTURE_COMPARE_FUNC,de[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Kt||y.minFilter!==Un&&y.minFilter!==Wi||y.type===yi&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){let $=e.get("EXT_texture_filter_anisotropic");r.texParameterf(E,$.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,n.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function ue(E,y){let $=!1;E.__webglInit===void 0&&(E.__webglInit=!0,y.addEventListener("dispose",A));let ee=y.source,ie=h.get(ee);ie===void 0&&(ie={},h.set(ee,ie));let K=W(y);if(K!==E.__cacheKey){ie[K]===void 0&&(ie[K]={texture:r.createTexture(),usedTimes:0},a.memory.textures++,$=!0),ie[K].usedTimes++;let Me=ie[E.__cacheKey];Me!==void 0&&(ie[E.__cacheKey].usedTimes--,Me.usedTimes===0&&b(y)),E.__cacheKey=K,E.__webglTexture=ie[K].texture}return $}function V(E,y,$){let ee=r.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(ee=r.TEXTURE_2D_ARRAY),y.isData3DTexture&&(ee=r.TEXTURE_3D);let ie=ue(E,y),K=y.source;t.bindTexture(ee,E.__webglTexture,r.TEXTURE0+$);let Me=i.get(K);if(K.version!==Me.__version||ie===!0){t.activeTexture(r.TEXTURE0+$);let pe=it.getPrimaries(it.workingColorSpace),ye=y.colorSpace===cr?null:it.getPrimaries(y.colorSpace),et=y.colorSpace===cr||pe===ye?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,y.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,y.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,et);let ae=v(y.image,!1,n.maxTextureSize);ae=Qe(y,ae);let _e=s.convert(y.format,y.colorSpace),De=s.convert(y.type),Ne=w(y.internalFormat,_e,De,y.colorSpace,y.isVideoTexture);me(ee,y);let ge,Ye=y.mipmaps,Ve=y.isVideoTexture!==!0,ht=Me.__version===void 0||ie===!0,O=K.dataReady,ce=D(y,ae);if(y.isDepthTexture)Ne=_(y.format===an,y.type),ht&&(Ve?t.texStorage2D(r.TEXTURE_2D,1,Ne,ae.width,ae.height):t.texImage2D(r.TEXTURE_2D,0,Ne,ae.width,ae.height,0,_e,De,null));else if(y.isDataTexture)if(Ye.length>0){Ve&&ht&&t.texStorage2D(r.TEXTURE_2D,ce,Ne,Ye[0].width,Ye[0].height);for(let X=0,te=Ye.length;X<te;X++)ge=Ye[X],Ve?O&&t.texSubImage2D(r.TEXTURE_2D,X,0,0,ge.width,ge.height,_e,De,ge.data):t.texImage2D(r.TEXTURE_2D,X,Ne,ge.width,ge.height,0,_e,De,ge.data);y.generateMipmaps=!1}else Ve?(ht&&t.texStorage2D(r.TEXTURE_2D,ce,Ne,ae.width,ae.height),O&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,ae.width,ae.height,_e,De,ae.data)):t.texImage2D(r.TEXTURE_2D,0,Ne,ae.width,ae.height,0,_e,De,ae.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ve&&ht&&t.texStorage3D(r.TEXTURE_2D_ARRAY,ce,Ne,Ye[0].width,Ye[0].height,ae.depth);for(let X=0,te=Ye.length;X<te;X++)if(ge=Ye[X],y.format!==ui)if(_e!==null)if(Ve){if(O)if(y.layerUpdates.size>0){let fe=eh(ge.width,ge.height,y.format,y.type);for(let oe of y.layerUpdates){let qe=ge.data.subarray(oe*fe/ge.data.BYTES_PER_ELEMENT,(oe+1)*fe/ge.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,X,0,0,oe,ge.width,ge.height,1,_e,qe)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,X,0,0,0,ge.width,ge.height,ae.depth,_e,ge.data)}else t.compressedTexImage3D(r.TEXTURE_2D_ARRAY,X,Ne,ge.width,ge.height,ae.depth,0,ge.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ve?O&&t.texSubImage3D(r.TEXTURE_2D_ARRAY,X,0,0,0,ge.width,ge.height,ae.depth,_e,De,ge.data):t.texImage3D(r.TEXTURE_2D_ARRAY,X,Ne,ge.width,ge.height,ae.depth,0,_e,De,ge.data)}else{Ve&&ht&&t.texStorage2D(r.TEXTURE_2D,ce,Ne,Ye[0].width,Ye[0].height);for(let X=0,te=Ye.length;X<te;X++)ge=Ye[X],y.format!==ui?_e!==null?Ve?O&&t.compressedTexSubImage2D(r.TEXTURE_2D,X,0,0,ge.width,ge.height,_e,ge.data):t.compressedTexImage2D(r.TEXTURE_2D,X,Ne,ge.width,ge.height,0,ge.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ve?O&&t.texSubImage2D(r.TEXTURE_2D,X,0,0,ge.width,ge.height,_e,De,ge.data):t.texImage2D(r.TEXTURE_2D,X,Ne,ge.width,ge.height,0,_e,De,ge.data)}else if(y.isDataArrayTexture)if(Ve){if(ht&&t.texStorage3D(r.TEXTURE_2D_ARRAY,ce,Ne,ae.width,ae.height,ae.depth),O)if(y.layerUpdates.size>0){let X=eh(ae.width,ae.height,y.format,y.type);for(let te of y.layerUpdates){let fe=ae.data.subarray(te*X/ae.data.BYTES_PER_ELEMENT,(te+1)*X/ae.data.BYTES_PER_ELEMENT);t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,te,ae.width,ae.height,1,_e,De,fe)}y.clearLayerUpdates()}else t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,ae.width,ae.height,ae.depth,_e,De,ae.data)}else t.texImage3D(r.TEXTURE_2D_ARRAY,0,Ne,ae.width,ae.height,ae.depth,0,_e,De,ae.data);else if(y.isData3DTexture)Ve?(ht&&t.texStorage3D(r.TEXTURE_3D,ce,Ne,ae.width,ae.height,ae.depth),O&&t.texSubImage3D(r.TEXTURE_3D,0,0,0,0,ae.width,ae.height,ae.depth,_e,De,ae.data)):t.texImage3D(r.TEXTURE_3D,0,Ne,ae.width,ae.height,ae.depth,0,_e,De,ae.data);else if(y.isFramebufferTexture){if(ht)if(Ve)t.texStorage2D(r.TEXTURE_2D,ce,Ne,ae.width,ae.height);else{let X=ae.width,te=ae.height;for(let fe=0;fe<ce;fe++)t.texImage2D(r.TEXTURE_2D,fe,Ne,X,te,0,_e,De,null),X>>=1,te>>=1}}else if(Ye.length>0){if(Ve&&ht){let X=Ee(Ye[0]);t.texStorage2D(r.TEXTURE_2D,ce,Ne,X.width,X.height)}for(let X=0,te=Ye.length;X<te;X++)ge=Ye[X],Ve?O&&t.texSubImage2D(r.TEXTURE_2D,X,0,0,_e,De,ge):t.texImage2D(r.TEXTURE_2D,X,Ne,_e,De,ge);y.generateMipmaps=!1}else if(Ve){if(ht){let X=Ee(ae);t.texStorage2D(r.TEXTURE_2D,ce,Ne,X.width,X.height)}O&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,_e,De,ae)}else t.texImage2D(r.TEXTURE_2D,0,Ne,_e,De,ae);m(y)&&f(ee),Me.__version=K.version,y.onUpdate&&y.onUpdate(y)}E.__version=y.version}function Y(E,y,$){if(y.image.length!==6)return;let ee=ue(E,y),ie=y.source;t.bindTexture(r.TEXTURE_CUBE_MAP,E.__webglTexture,r.TEXTURE0+$);let K=i.get(ie);if(ie.version!==K.__version||ee===!0){t.activeTexture(r.TEXTURE0+$);let Me=it.getPrimaries(it.workingColorSpace),pe=y.colorSpace===cr?null:it.getPrimaries(y.colorSpace),ye=y.colorSpace===cr||Me===pe?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,y.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,y.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,ye);let et=y.isCompressedTexture||y.image[0].isCompressedTexture,ae=y.image[0]&&y.image[0].isDataTexture,_e=[];for(let te=0;te<6;te++)!et&&!ae?_e[te]=v(y.image[te],!0,n.maxCubemapSize):_e[te]=ae?y.image[te].image:y.image[te],_e[te]=Qe(y,_e[te]);let De=_e[0],Ne=s.convert(y.format,y.colorSpace),ge=s.convert(y.type),Ye=w(y.internalFormat,Ne,ge,y.colorSpace),Ve=y.isVideoTexture!==!0,ht=K.__version===void 0||ee===!0,O=ie.dataReady,ce=D(y,De);me(r.TEXTURE_CUBE_MAP,y);let X;if(et){Ve&&ht&&t.texStorage2D(r.TEXTURE_CUBE_MAP,ce,Ye,De.width,De.height);for(let te=0;te<6;te++){X=_e[te].mipmaps;for(let fe=0;fe<X.length;fe++){let oe=X[fe];y.format!==ui?Ne!==null?Ve?O&&t.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,fe,0,0,oe.width,oe.height,Ne,oe.data):t.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,fe,Ye,oe.width,oe.height,0,oe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ve?O&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,fe,0,0,oe.width,oe.height,Ne,ge,oe.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,fe,Ye,oe.width,oe.height,0,Ne,ge,oe.data)}}}else{if(X=y.mipmaps,Ve&&ht){X.length>0&&ce++;let te=Ee(_e[0]);t.texStorage2D(r.TEXTURE_CUBE_MAP,ce,Ye,te.width,te.height)}for(let te=0;te<6;te++)if(ae){Ve?O&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,_e[te].width,_e[te].height,Ne,ge,_e[te].data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,Ye,_e[te].width,_e[te].height,0,Ne,ge,_e[te].data);for(let fe=0;fe<X.length;fe++){let oe=X[fe].image[te].image;Ve?O&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,fe+1,0,0,oe.width,oe.height,Ne,ge,oe.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,fe+1,Ye,oe.width,oe.height,0,Ne,ge,oe.data)}}else{Ve?O&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,Ne,ge,_e[te]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,Ye,Ne,ge,_e[te]);for(let fe=0;fe<X.length;fe++){let oe=X[fe];Ve?O&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,fe+1,0,0,Ne,ge,oe.image[te]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+te,fe+1,Ye,Ne,ge,oe.image[te])}}}m(y)&&f(r.TEXTURE_CUBE_MAP),K.__version=ie.version,y.onUpdate&&y.onUpdate(y)}E.__version=y.version}function ve(E,y,$,ee,ie,K){let Me=s.convert($.format,$.colorSpace),pe=s.convert($.type),ye=w($.internalFormat,Me,pe,$.colorSpace),et=i.get(y),ae=i.get($);if(ae.__renderTarget=y,!et.__hasExternalTextures){let _e=Math.max(1,y.width>>K),De=Math.max(1,y.height>>K);ie===r.TEXTURE_3D||ie===r.TEXTURE_2D_ARRAY?t.texImage3D(ie,K,ye,_e,De,y.depth,0,Me,pe,null):t.texImage2D(ie,K,ye,_e,De,0,Me,pe,null)}t.bindFramebuffer(r.FRAMEBUFFER,E),Ge(y)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,ee,ie,ae.__webglTexture,0,Oe(y)):(ie===r.TEXTURE_2D||ie>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&ie<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,ee,ie,ae.__webglTexture,K),t.bindFramebuffer(r.FRAMEBUFFER,null)}function le(E,y,$){if(r.bindRenderbuffer(r.RENDERBUFFER,E),y.depthBuffer){let ee=y.depthTexture,ie=ee&&ee.isDepthTexture?ee.type:null,K=_(y.stencilBuffer,ie),Me=y.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,pe=Oe(y);Ge(y)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,pe,K,y.width,y.height):$?r.renderbufferStorageMultisample(r.RENDERBUFFER,pe,K,y.width,y.height):r.renderbufferStorage(r.RENDERBUFFER,K,y.width,y.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,Me,r.RENDERBUFFER,E)}else{let ee=y.textures;for(let ie=0;ie<ee.length;ie++){let K=ee[ie],Me=s.convert(K.format,K.colorSpace),pe=s.convert(K.type),ye=w(K.internalFormat,Me,pe,K.colorSpace),et=Oe(y);$&&Ge(y)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,et,ye,y.width,y.height):Ge(y)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,et,ye,y.width,y.height):r.renderbufferStorage(r.RENDERBUFFER,ye,y.width,y.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function Ie(E,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(r.FRAMEBUFFER,E),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let $=i.get(y.depthTexture);$.__renderTarget=y,(!$.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),L(y.depthTexture,0);let ee=$.__webglTexture,ie=Oe(y);if(y.depthTexture.format===Qr)Ge(y)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,ee,0,ie):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,ee,0);else if(y.depthTexture.format===an)Ge(y)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,ee,0,ie):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,ee,0);else throw new Error("Unknown depthTexture format")}function be(E){let y=i.get(E),$=E.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==E.depthTexture){let ee=E.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),ee){let ie=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,ee.removeEventListener("dispose",ie)};ee.addEventListener("dispose",ie),y.__depthDisposeCallback=ie}y.__boundDepthTexture=ee}if(E.depthTexture&&!y.__autoAllocateDepthBuffer){if($)throw new Error("target.depthTexture not supported in Cube render targets");Ie(y.__webglFramebuffer,E)}else if($){y.__webglDepthbuffer=[];for(let ee=0;ee<6;ee++)if(t.bindFramebuffer(r.FRAMEBUFFER,y.__webglFramebuffer[ee]),y.__webglDepthbuffer[ee]===void 0)y.__webglDepthbuffer[ee]=r.createRenderbuffer(),le(y.__webglDepthbuffer[ee],E,!1);else{let ie=E.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,K=y.__webglDepthbuffer[ee];r.bindRenderbuffer(r.RENDERBUFFER,K),r.framebufferRenderbuffer(r.FRAMEBUFFER,ie,r.RENDERBUFFER,K)}}else if(t.bindFramebuffer(r.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=r.createRenderbuffer(),le(y.__webglDepthbuffer,E,!1);else{let ee=E.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ie=y.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,ie),r.framebufferRenderbuffer(r.FRAMEBUFFER,ee,r.RENDERBUFFER,ie)}t.bindFramebuffer(r.FRAMEBUFFER,null)}function Pe(E,y,$){let ee=i.get(E);y!==void 0&&ve(ee.__webglFramebuffer,E,E.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),$!==void 0&&be(E)}function Je(E){let y=E.texture,$=i.get(E),ee=i.get(y);E.addEventListener("dispose",R);let ie=E.textures,K=E.isWebGLCubeRenderTarget===!0,Me=ie.length>1;if(Me||(ee.__webglTexture===void 0&&(ee.__webglTexture=r.createTexture()),ee.__version=y.version,a.memory.textures++),K){$.__webglFramebuffer=[];for(let pe=0;pe<6;pe++)if(y.mipmaps&&y.mipmaps.length>0){$.__webglFramebuffer[pe]=[];for(let ye=0;ye<y.mipmaps.length;ye++)$.__webglFramebuffer[pe][ye]=r.createFramebuffer()}else $.__webglFramebuffer[pe]=r.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){$.__webglFramebuffer=[];for(let pe=0;pe<y.mipmaps.length;pe++)$.__webglFramebuffer[pe]=r.createFramebuffer()}else $.__webglFramebuffer=r.createFramebuffer();if(Me)for(let pe=0,ye=ie.length;pe<ye;pe++){let et=i.get(ie[pe]);et.__webglTexture===void 0&&(et.__webglTexture=r.createTexture(),a.memory.textures++)}if(E.samples>0&&Ge(E)===!1){$.__webglMultisampledFramebuffer=r.createFramebuffer(),$.__webglColorRenderbuffer=[],t.bindFramebuffer(r.FRAMEBUFFER,$.__webglMultisampledFramebuffer);for(let pe=0;pe<ie.length;pe++){let ye=ie[pe];$.__webglColorRenderbuffer[pe]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,$.__webglColorRenderbuffer[pe]);let et=s.convert(ye.format,ye.colorSpace),ae=s.convert(ye.type),_e=w(ye.internalFormat,et,ae,ye.colorSpace,E.isXRRenderTarget===!0),De=Oe(E);r.renderbufferStorageMultisample(r.RENDERBUFFER,De,_e,E.width,E.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+pe,r.RENDERBUFFER,$.__webglColorRenderbuffer[pe])}r.bindRenderbuffer(r.RENDERBUFFER,null),E.depthBuffer&&($.__webglDepthRenderbuffer=r.createRenderbuffer(),le($.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(r.FRAMEBUFFER,null)}}if(K){t.bindTexture(r.TEXTURE_CUBE_MAP,ee.__webglTexture),me(r.TEXTURE_CUBE_MAP,y);for(let pe=0;pe<6;pe++)if(y.mipmaps&&y.mipmaps.length>0)for(let ye=0;ye<y.mipmaps.length;ye++)ve($.__webglFramebuffer[pe][ye],E,y,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+pe,ye);else ve($.__webglFramebuffer[pe],E,y,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0);m(y)&&f(r.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Me){for(let pe=0,ye=ie.length;pe<ye;pe++){let et=ie[pe],ae=i.get(et);t.bindTexture(r.TEXTURE_2D,ae.__webglTexture),me(r.TEXTURE_2D,et),ve($.__webglFramebuffer,E,et,r.COLOR_ATTACHMENT0+pe,r.TEXTURE_2D,0),m(et)&&f(r.TEXTURE_2D)}t.unbindTexture()}else{let pe=r.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(pe=E.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(pe,ee.__webglTexture),me(pe,y),y.mipmaps&&y.mipmaps.length>0)for(let ye=0;ye<y.mipmaps.length;ye++)ve($.__webglFramebuffer[ye],E,y,r.COLOR_ATTACHMENT0,pe,ye);else ve($.__webglFramebuffer,E,y,r.COLOR_ATTACHMENT0,pe,0);m(y)&&f(pe),t.unbindTexture()}E.depthBuffer&&be(E)}function Ue(E){let y=E.textures;for(let $=0,ee=y.length;$<ee;$++){let ie=y[$];if(m(ie)){let K=M(E),Me=i.get(ie).__webglTexture;t.bindTexture(K,Me),f(K),t.unbindTexture()}}}let lt=[],k=[];function Gt(E){if(E.samples>0){if(Ge(E)===!1){let y=E.textures,$=E.width,ee=E.height,ie=r.COLOR_BUFFER_BIT,K=E.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Me=i.get(E),pe=y.length>1;if(pe)for(let ye=0;ye<y.length;ye++)t.bindFramebuffer(r.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ye,r.RENDERBUFFER,null),t.bindFramebuffer(r.FRAMEBUFFER,Me.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+ye,r.TEXTURE_2D,null,0);t.bindFramebuffer(r.READ_FRAMEBUFFER,Me.__webglMultisampledFramebuffer),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Me.__webglFramebuffer);for(let ye=0;ye<y.length;ye++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(ie|=r.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(ie|=r.STENCIL_BUFFER_BIT)),pe){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,Me.__webglColorRenderbuffer[ye]);let et=i.get(y[ye]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,et,0)}r.blitFramebuffer(0,0,$,ee,0,0,$,ee,ie,r.NEAREST),l===!0&&(lt.length=0,k.length=0,lt.push(r.COLOR_ATTACHMENT0+ye),E.depthBuffer&&E.resolveDepthBuffer===!1&&(lt.push(K),k.push(K),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,k)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,lt))}if(t.bindFramebuffer(r.READ_FRAMEBUFFER,null),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),pe)for(let ye=0;ye<y.length;ye++){t.bindFramebuffer(r.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ye,r.RENDERBUFFER,Me.__webglColorRenderbuffer[ye]);let et=i.get(y[ye]).__webglTexture;t.bindFramebuffer(r.FRAMEBUFFER,Me.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+ye,r.TEXTURE_2D,et,0)}t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Me.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){let y=E.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[y])}}}function Oe(E){return Math.min(n.maxSamples,E.samples)}function Ge(E){let y=i.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function Re(E){let y=a.render.frame;d.get(E)!==y&&(d.set(E,y),E.update())}function Qe(E,y){let $=E.colorSpace,ee=E.format,ie=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||$!==Zt&&$!==cr&&(it.getTransfer($)===ct?(ee!==ui||ie!==Xi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",$)),y}function Ee(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(c.width=E.naturalWidth||E.width,c.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(c.width=E.displayWidth,c.height=E.displayHeight):(c.width=E.width,c.height=E.height),c}this.allocateTextureUnit=G,this.resetTextureUnits=U,this.setTexture2D=L,this.setTexture2DArray=P,this.setTexture3D=B,this.setTextureCube=H,this.rebindTextures=Pe,this.setupRenderTarget=Je,this.updateRenderTargetMipmap=Ue,this.updateMultisampleRenderTarget=Gt,this.setupDepthRenderbuffer=be,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=Ge}function Bp(r,e){function t(i,n=cr){let s,a=it.getTransfer(n);if(i===Xi)return r.UNSIGNED_BYTE;if(i===ll)return r.UNSIGNED_SHORT_4_4_4_4;if(i===cl)return r.UNSIGNED_SHORT_5_5_5_1;if(i===Pd)return r.UNSIGNED_INT_5_9_9_9_REV;if(i===Cd)return r.BYTE;if(i===Ld)return r.SHORT;if(i===Bn)return r.UNSIGNED_SHORT;if(i===ol)return r.INT;if(i===Nr)return r.UNSIGNED_INT;if(i===yi)return r.FLOAT;if(i===Jn)return r.HALF_FLOAT;if(i===Id)return r.ALPHA;if(i===Dd)return r.RGB;if(i===ui)return r.RGBA;if(i===Ud)return r.LUMINANCE;if(i===Nd)return r.LUMINANCE_ALPHA;if(i===Qr)return r.DEPTH_COMPONENT;if(i===an)return r.DEPTH_STENCIL;if(i===dl)return r.RED;if(i===ul)return r.RED_INTEGER;if(i===kd)return r.RG;if(i===hl)return r.RG_INTEGER;if(i===pl)return r.RGBA_INTEGER;if(i===_s||i===ys||i===bs||i===Ss)if(a===ct)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===_s)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ys)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===bs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ss)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===_s)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ys)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===bs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ss)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Ya||i===Ka||i===Za||i===Ja)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Ya)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Ka)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Za)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Ja)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Qa||i===eo||i===to)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Qa||i===eo)return a===ct?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===to)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===io||i===ro||i===no||i===so||i===ao||i===oo||i===lo||i===co||i===uo||i===ho||i===po||i===mo||i===fo||i===go)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===io)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===ro)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===no)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===so)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===ao)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===oo)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===lo)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===co)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===uo)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ho)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===po)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===mo)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===fo)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===go)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ws||i===vo||i===xo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===ws)return a===ct?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===vo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===xo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Od||i===_o||i===yo||i===bo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===ws)return s.COMPRESSED_RED_RGTC1_EXT;if(i===_o)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===yo)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===bo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===sn?r.UNSIGNED_INT_24_8:r[i]!==void 0?r[i]:null}return{convert:t}}var Po=class extends Ht{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Ii=class extends Tt{constructor(){super(),this.isGroup=!0,this.type="Group"}},jx={type:"move"},Es=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ii,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ii,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ii,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let n=null,s=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let v of e.hand.values()){let m=t.getJointPose(v,i),f=this._getHandJoint(c,v);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}let d=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],h=d.position.distanceTo(u.position),p=.02,g=.005;c.inputState.pinching&&h>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(n=t.getPose(e.targetRaySpace,i),n===null&&s!==null&&(n=s),n!==null&&(o.matrix.fromArray(n.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,n.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(n.linearVelocity)):o.hasLinearVelocity=!1,n.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(n.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(jx)))}return o!==null&&(o.visible=n!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Ii;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},qx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Xx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Pc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let n=new Vt,s=e.properties.get(n);s.__webglTexture=t.texture,(t.depthNear!=i.depthNear||t.depthFar!=i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new Fi({vertexShader:qx,fragmentShader:Xx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ut(new Fs(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ic=class extends fr{constructor(e,t){super();let i=this,n=null,s=1,a=null,o="local-floor",l=1,c=null,d=null,u=null,h=null,p=null,g=null,v=new Pc,m=t.getContextAttributes(),f=null,M=null,w=[],_=[],D=new nt,A=null,R=new Ht;R.viewport=new at;let T=new Ht;T.viewport=new at;let b=[R,T],x=new Po,C=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(V){let Y=w[V];return Y===void 0&&(Y=new Es,w[V]=Y),Y.getTargetRaySpace()},this.getControllerGrip=function(V){let Y=w[V];return Y===void 0&&(Y=new Es,w[V]=Y),Y.getGripSpace()},this.getHand=function(V){let Y=w[V];return Y===void 0&&(Y=new Es,w[V]=Y),Y.getHandSpace()};function G(V){let Y=_.indexOf(V.inputSource);if(Y===-1)return;let ve=w[Y];ve!==void 0&&(ve.update(V.inputSource,V.frame,c||a),ve.dispatchEvent({type:V.type,data:V.inputSource}))}function W(){n.removeEventListener("select",G),n.removeEventListener("selectstart",G),n.removeEventListener("selectend",G),n.removeEventListener("squeeze",G),n.removeEventListener("squeezestart",G),n.removeEventListener("squeezeend",G),n.removeEventListener("end",W),n.removeEventListener("inputsourceschange",L);for(let V=0;V<w.length;V++){let Y=_[V];Y!==null&&(_[V]=null,w[V].disconnect(Y))}C=null,U=null,v.reset(),e.setRenderTarget(f),p=null,h=null,u=null,n=null,M=null,ue.stop(),i.isPresenting=!1,e.setPixelRatio(A),e.setSize(D.width,D.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(V){s=V,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(V){o=V,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(V){c=V},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return n},this.setSession=async function(V){if(n=V,n!==null){if(f=e.getRenderTarget(),n.addEventListener("select",G),n.addEventListener("selectstart",G),n.addEventListener("selectend",G),n.addEventListener("squeeze",G),n.addEventListener("squeezestart",G),n.addEventListener("squeezeend",G),n.addEventListener("end",W),n.addEventListener("inputsourceschange",L),m.xrCompatible!==!0&&await t.makeXRCompatible(),A=e.getPixelRatio(),e.getSize(D),n.renderState.layers===void 0){let Y={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(n,t,Y),n.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),M=new Yi(p.framebufferWidth,p.framebufferHeight,{format:ui,type:Xi,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil})}else{let Y=null,ve=null,le=null;m.depth&&(le=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Y=m.stencil?an:Qr,ve=m.stencil?sn:Nr);let Ie={colorFormat:t.RGBA8,depthFormat:le,scaleFactor:s};u=new XRWebGLBinding(n,t),h=u.createProjectionLayer(Ie),n.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),M=new Yi(h.textureWidth,h.textureHeight,{format:ui,type:Xi,depthTexture:new Bs(h.textureWidth,h.textureHeight,ve,void 0,void 0,void 0,void 0,void 0,void 0,Y),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await n.requestReferenceSpace(o),ue.setContext(n),ue.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(n!==null)return n.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function L(V){for(let Y=0;Y<V.removed.length;Y++){let ve=V.removed[Y],le=_.indexOf(ve);le>=0&&(_[le]=null,w[le].disconnect(ve))}for(let Y=0;Y<V.added.length;Y++){let ve=V.added[Y],le=_.indexOf(ve);if(le===-1){for(let be=0;be<w.length;be++)if(be>=_.length){_.push(ve),le=be;break}else if(_[be]===null){_[be]=ve,le=be;break}if(le===-1)break}let Ie=w[le];Ie&&Ie.connect(ve)}}let P=new z,B=new z;function H(V,Y,ve){P.setFromMatrixPosition(Y.matrixWorld),B.setFromMatrixPosition(ve.matrixWorld);let le=P.distanceTo(B),Ie=Y.projectionMatrix.elements,be=ve.projectionMatrix.elements,Pe=Ie[14]/(Ie[10]-1),Je=Ie[14]/(Ie[10]+1),Ue=(Ie[9]+1)/Ie[5],lt=(Ie[9]-1)/Ie[5],k=(Ie[8]-1)/Ie[0],Gt=(be[8]+1)/be[0],Oe=Pe*k,Ge=Pe*Gt,Re=le/(-k+Gt),Qe=Re*-k;if(Y.matrixWorld.decompose(V.position,V.quaternion,V.scale),V.translateX(Qe),V.translateZ(Re),V.matrixWorld.compose(V.position,V.quaternion,V.scale),V.matrixWorldInverse.copy(V.matrixWorld).invert(),Ie[10]===-1)V.projectionMatrix.copy(Y.projectionMatrix),V.projectionMatrixInverse.copy(Y.projectionMatrixInverse);else{let Ee=Pe+Re,E=Je+Re,y=Oe-Qe,$=Ge+(le-Qe),ee=Ue*Je/E*Ee,ie=lt*Je/E*Ee;V.projectionMatrix.makePerspective(y,$,ee,ie,Ee,E),V.projectionMatrixInverse.copy(V.projectionMatrix).invert()}}function Z(V,Y){Y===null?V.matrixWorld.copy(V.matrix):V.matrixWorld.multiplyMatrices(Y.matrixWorld,V.matrix),V.matrixWorldInverse.copy(V.matrixWorld).invert()}this.updateCamera=function(V){if(n===null)return;let Y=V.near,ve=V.far;v.texture!==null&&(v.depthNear>0&&(Y=v.depthNear),v.depthFar>0&&(ve=v.depthFar)),x.near=T.near=R.near=Y,x.far=T.far=R.far=ve,(C!==x.near||U!==x.far)&&(n.updateRenderState({depthNear:x.near,depthFar:x.far}),C=x.near,U=x.far),R.layers.mask=V.layers.mask|2,T.layers.mask=V.layers.mask|4,x.layers.mask=R.layers.mask|T.layers.mask;let le=V.parent,Ie=x.cameras;Z(x,le);for(let be=0;be<Ie.length;be++)Z(Ie[be],le);Ie.length===2?H(x,R,T):x.projectionMatrix.copy(R.projectionMatrix),ne(V,x,le)};function ne(V,Y,ve){ve===null?V.matrix.copy(Y.matrixWorld):(V.matrix.copy(ve.matrixWorld),V.matrix.invert(),V.matrix.multiply(Y.matrixWorld)),V.matrix.decompose(V.position,V.quaternion,V.scale),V.updateMatrixWorld(!0),V.projectionMatrix.copy(Y.projectionMatrix),V.projectionMatrixInverse.copy(Y.projectionMatrixInverse),V.isPerspectiveCamera&&(V.fov=Vn*2*Math.atan(1/V.projectionMatrix.elements[5]),V.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(h===null&&p===null))return l},this.setFoveation=function(V){l=V,h!==null&&(h.fixedFoveation=V),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=V)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(x)};let de=null;function me(V,Y){if(d=Y.getViewerPose(c||a),g=Y,d!==null){let ve=d.views;p!==null&&(e.setRenderTargetFramebuffer(M,p.framebuffer),e.setRenderTarget(M));let le=!1;ve.length!==x.cameras.length&&(x.cameras.length=0,le=!0);for(let be=0;be<ve.length;be++){let Pe=ve[be],Je=null;if(p!==null)Je=p.getViewport(Pe);else{let lt=u.getViewSubImage(h,Pe);Je=lt.viewport,be===0&&(e.setRenderTargetTextures(M,lt.colorTexture,h.ignoreDepthValues?void 0:lt.depthStencilTexture),e.setRenderTarget(M))}let Ue=b[be];Ue===void 0&&(Ue=new Ht,Ue.layers.enable(be),Ue.viewport=new at,b[be]=Ue),Ue.matrix.fromArray(Pe.transform.matrix),Ue.matrix.decompose(Ue.position,Ue.quaternion,Ue.scale),Ue.projectionMatrix.fromArray(Pe.projectionMatrix),Ue.projectionMatrixInverse.copy(Ue.projectionMatrix).invert(),Ue.viewport.set(Je.x,Je.y,Je.width,Je.height),be===0&&(x.matrix.copy(Ue.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),le===!0&&x.cameras.push(Ue)}let Ie=n.enabledFeatures;if(Ie&&Ie.includes("depth-sensing")){let be=u.getDepthInformation(ve[0]);be&&be.isValid&&be.texture&&v.init(e,be,n.renderState)}}for(let ve=0;ve<w.length;ve++){let le=_[ve],Ie=w[ve];le!==null&&Ie!==void 0&&Ie.update(le,Y,c||a)}de&&de(V,Y),Y.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Y}),g=null}let ue=new Up;ue.setAnimationLoop(me),this.setAnimationLoop=function(V){de=V},this.dispose=function(){}}},jr=new ki,Yx=new je;function Kx(r,e){function t(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function i(m,f){f.color.getRGB(m.fogColor.value,Ip(r)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function n(m,f,M,w,_){f.isMeshBasicMaterial||f.isMeshLambertMaterial?s(m,f):f.isMeshToonMaterial?(s(m,f),u(m,f)):f.isMeshPhongMaterial?(s(m,f),d(m,f)):f.isMeshStandardMaterial?(s(m,f),h(m,f),f.isMeshPhysicalMaterial&&p(m,f,_)):f.isMeshMatcapMaterial?(s(m,f),g(m,f)):f.isMeshDepthMaterial?s(m,f):f.isMeshDistanceMaterial?(s(m,f),v(m,f)):f.isMeshNormalMaterial?s(m,f):f.isLineBasicMaterial?(a(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?l(m,f,M,w):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function s(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,t(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===Yt&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,t(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===Yt&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,t(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,t(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);let M=e.get(f),w=M.envMap,_=M.envMapRotation;w&&(m.envMap.value=w,jr.copy(_),jr.x*=-1,jr.y*=-1,jr.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(jr.y*=-1,jr.z*=-1),m.envMapRotation.value.setFromMatrix4(Yx.makeRotationFromEuler(jr)),m.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap&&(m.lightMap.value=f.lightMap,m.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,m.lightMapTransform)),f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,m.aoMapTransform))}function a(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform))}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,M,w){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*M,m.scale.value=w*.5,f.map&&(m.map.value=f.map,t(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function d(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function u(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function h(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,m.roughnessMapTransform)),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,M){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Yt&&m.clearcoatNormalScale.value.negate())),f.dispersion>0&&(m.dispersion.value=f.dispersion),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function v(m,f){let M=e.get(f).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:n}}function Zx(r,e,t,i){let n={},s={},a=[],o=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,w){let _=w.program;i.uniformBlockBinding(M,_)}function c(M,w){let _=n[M.id];_===void 0&&(g(M),_=d(M),n[M.id]=_,M.addEventListener("dispose",m));let D=w.program;i.updateUBOMapping(M,D);let A=e.render.frame;s[M.id]!==A&&(h(M),s[M.id]=A)}function d(M){let w=u();M.__bindingPointIndex=w;let _=r.createBuffer(),D=M.__size,A=M.usage;return r.bindBuffer(r.UNIFORM_BUFFER,_),r.bufferData(r.UNIFORM_BUFFER,D,A),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,w,_),_}function u(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(M){let w=n[M.id],_=M.uniforms,D=M.__cache;r.bindBuffer(r.UNIFORM_BUFFER,w);for(let A=0,R=_.length;A<R;A++){let T=Array.isArray(_[A])?_[A]:[_[A]];for(let b=0,x=T.length;b<x;b++){let C=T[b];if(p(C,A,b,D)===!0){let U=C.__offset,G=Array.isArray(C.value)?C.value:[C.value],W=0;for(let L=0;L<G.length;L++){let P=G[L],B=v(P);typeof P=="number"||typeof P=="boolean"?(C.__data[0]=P,r.bufferSubData(r.UNIFORM_BUFFER,U+W,C.__data)):P.isMatrix3?(C.__data[0]=P.elements[0],C.__data[1]=P.elements[1],C.__data[2]=P.elements[2],C.__data[3]=0,C.__data[4]=P.elements[3],C.__data[5]=P.elements[4],C.__data[6]=P.elements[5],C.__data[7]=0,C.__data[8]=P.elements[6],C.__data[9]=P.elements[7],C.__data[10]=P.elements[8],C.__data[11]=0):(P.toArray(C.__data,W),W+=B.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,U,C.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function p(M,w,_,D){let A=M.value,R=w+"_"+_;if(D[R]===void 0)return typeof A=="number"||typeof A=="boolean"?D[R]=A:D[R]=A.clone(),!0;{let T=D[R];if(typeof A=="number"||typeof A=="boolean"){if(T!==A)return D[R]=A,!0}else if(T.equals(A)===!1)return T.copy(A),!0}return!1}function g(M){let w=M.uniforms,_=0,D=16;for(let R=0,T=w.length;R<T;R++){let b=Array.isArray(w[R])?w[R]:[w[R]];for(let x=0,C=b.length;x<C;x++){let U=b[x],G=Array.isArray(U.value)?U.value:[U.value];for(let W=0,L=G.length;W<L;W++){let P=G[W],B=v(P),H=_%D,Z=H%B.boundary,ne=H+Z;_+=Z,ne!==0&&D-ne<B.storage&&(_+=D-ne),U.__data=new Float32Array(B.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=_,_+=B.storage}}}let A=_%D;return A>0&&(_+=D-A),M.__size=_,M.__cache={},this}function v(M){let w={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(w.boundary=4,w.storage=4):M.isVector2?(w.boundary=8,w.storage=8):M.isVector3||M.isColor?(w.boundary=16,w.storage=12):M.isVector4?(w.boundary=16,w.storage=16):M.isMatrix3?(w.boundary=48,w.storage=48):M.isMatrix4?(w.boundary=64,w.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),w}function m(M){let w=M.target;w.removeEventListener("dispose",m);let _=a.indexOf(w.__bindingPointIndex);a.splice(_,1),r.deleteBuffer(n[w.id]),delete n[w.id],delete s[w.id]}function f(){for(let M in n)r.deleteBuffer(n[M]);a=[],n={},s={}}return{bind:l,update:c,dispose:f}}var Io=class{constructor(e={}){let{canvas:t=Lp(),context:i=null,depth:n=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=a;let g=new Uint32Array(4),v=new Int32Array(4),m=null,f=null,M=[],w=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Bt,this.toneMapping=pr,this.toneMappingExposure=1;let _=this,D=!1,A=0,R=0,T=null,b=-1,x=null,C=new at,U=new at,G=null,W=new Be(0),L=0,P=t.width,B=t.height,H=1,Z=null,ne=null,de=new at(0,0,P,B),me=new at(0,0,P,B),ue=!1,V=new $n,Y=!1,ve=!1,le=new je,Ie=new je,be=new z,Pe=new at,Je={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ue=!1;function lt(){return T===null?H:1}let k=i;function Gt(S,F){return t.getContext(S,F)}try{let S={alpha:!0,depth:n,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${al}`),t.addEventListener("webglcontextlost",te,!1),t.addEventListener("webglcontextrestored",fe,!1),t.addEventListener("webglcontextcreationerror",oe,!1),k===null){let F="webgl2";if(k=Gt(F,S),k===null)throw Gt(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let Oe,Ge,Re,Qe,Ee,E,y,$,ee,ie,K,Me,pe,ye,et,ae,_e,De,Ne,ge,Ye,Ve,ht,O;function ce(){Oe=new mv(k),Oe.init(),Ve=new Bp(k,Oe),Ge=new lv(k,Oe,e,Ve),Re=new Gx(k,Oe),Ge.reverseDepthBuffer&&h&&Re.buffers.depth.setReversed(!0),Qe=new vv(k),Ee=new Lx,E=new Wx(k,Oe,Re,Ee,Ge,Ve,Qe),y=new dv(_),$=new pv(_),ee=new Mf(k),ht=new av(k,ee),ie=new fv(k,ee,Qe,ht),K=new _v(k,ie,ee,Qe),Ne=new xv(k,Ge,E),ae=new cv(Ee),Me=new Cx(_,y,$,Oe,Ge,ht,ae),pe=new Kx(_,Ee),ye=new Ix,et=new Fx(Oe),De=new sv(_,y,$,Re,K,p,l),_e=new zx(_,K,Ge),O=new Zx(k,Qe,Ge,Re),ge=new ov(k,Oe,Qe),Ye=new gv(k,Oe,Qe),Qe.programs=Me.programs,_.capabilities=Ge,_.extensions=Oe,_.properties=Ee,_.renderLists=ye,_.shadowMap=_e,_.state=Re,_.info=Qe}ce();let X=new Ic(_,k);this.xr=X,this.getContext=function(){return k},this.getContextAttributes=function(){return k.getContextAttributes()},this.forceContextLoss=function(){let S=Oe.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=Oe.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(S){S!==void 0&&(H=S,this.setSize(P,B,!1))},this.getSize=function(S){return S.set(P,B)},this.setSize=function(S,F,q=!0){if(X.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}P=S,B=F,t.width=Math.floor(S*H),t.height=Math.floor(F*H),q===!0&&(t.style.width=S+"px",t.style.height=F+"px"),this.setViewport(0,0,S,F)},this.getDrawingBufferSize=function(S){return S.set(P*H,B*H).floor()},this.setDrawingBufferSize=function(S,F,q){P=S,B=F,H=q,t.width=Math.floor(S*q),t.height=Math.floor(F*q),this.setViewport(0,0,S,F)},this.getCurrentViewport=function(S){return S.copy(C)},this.getViewport=function(S){return S.copy(de)},this.setViewport=function(S,F,q,j){S.isVector4?de.set(S.x,S.y,S.z,S.w):de.set(S,F,q,j),Re.viewport(C.copy(de).multiplyScalar(H).round())},this.getScissor=function(S){return S.copy(me)},this.setScissor=function(S,F,q,j){S.isVector4?me.set(S.x,S.y,S.z,S.w):me.set(S,F,q,j),Re.scissor(U.copy(me).multiplyScalar(H).round())},this.getScissorTest=function(){return ue},this.setScissorTest=function(S){Re.setScissorTest(ue=S)},this.setOpaqueSort=function(S){Z=S},this.setTransparentSort=function(S){ne=S},this.getClearColor=function(S){return S.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor.apply(De,arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha.apply(De,arguments)},this.clear=function(S=!0,F=!0,q=!0){let j=0;if(S){let N=!1;if(T!==null){let re=T.texture.format;N=re===pl||re===hl||re===ul}if(N){let re=T.texture.type,xe=re===Xi||re===Nr||re===Bn||re===sn||re===ll||re===cl,Se=De.getClearColor(),we=De.getClearAlpha(),He=Se.r,Fe=Se.g,Ce=Se.b;xe?(g[0]=He,g[1]=Fe,g[2]=Ce,g[3]=we,k.clearBufferuiv(k.COLOR,0,g)):(v[0]=He,v[1]=Fe,v[2]=Ce,v[3]=we,k.clearBufferiv(k.COLOR,0,v))}else j|=k.COLOR_BUFFER_BIT}F&&(j|=k.DEPTH_BUFFER_BIT),q&&(j|=k.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k.clear(j)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",te,!1),t.removeEventListener("webglcontextrestored",fe,!1),t.removeEventListener("webglcontextcreationerror",oe,!1),ye.dispose(),et.dispose(),Ee.dispose(),y.dispose(),$.dispose(),K.dispose(),ht.dispose(),O.dispose(),Me.dispose(),X.dispose(),X.removeEventListener("sessionstart",Fr),X.removeEventListener("sessionend",Bi),Ki.stop()};function te(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),D=!0}function fe(){console.log("THREE.WebGLRenderer: Context Restored."),D=!1;let S=Qe.autoReset,F=_e.enabled,q=_e.autoUpdate,j=_e.needsUpdate,N=_e.type;ce(),Qe.autoReset=S,_e.enabled=F,_e.autoUpdate=q,_e.needsUpdate=j,_e.type=N}function oe(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function qe(S){let F=S.target;F.removeEventListener("dispose",qe),_t(F)}function _t(S){Ut(S),Ee.remove(S)}function Ut(S){let F=Ee.get(S).programs;F!==void 0&&(F.forEach(function(q){Me.releaseProgram(q)}),S.isShaderMaterial&&Me.releaseShaderCache(S))}this.renderBufferDirect=function(S,F,q,j,N,re){F===null&&(F=Je);let xe=N.isMesh&&N.matrixWorld.determinant()<0,Se=is(S,F,q,j,N);Re.setMaterial(j,xe);let we=q.index,He=1;if(j.wireframe===!0){if(we=ie.getWireframeAttribute(q),we===void 0)return;He=2}let Fe=q.drawRange,Ce=q.attributes.position,Ke=Fe.start*He,vt=(Fe.start+Fe.count)*He;re!==null&&(Ke=Math.max(Ke,re.start*He),vt=Math.min(vt,(re.start+re.count)*He)),we!==null?(Ke=Math.max(Ke,0),vt=Math.min(vt,we.count)):Ce!=null&&(Ke=Math.max(Ke,0),vt=Math.min(vt,Ce.count));let pt=vt-Ke;if(pt<0||pt===1/0)return;ht.setup(N,j,Se,q,we);let mt,ft=ge;if(we!==null&&(mt=ee.get(we),ft=Ye,ft.setIndex(mt)),N.isMesh)j.wireframe===!0?(Re.setLineWidth(j.wireframeLinewidth*lt()),ft.setMode(k.LINES)):ft.setMode(k.TRIANGLES);else if(N.isLine){let Te=j.linewidth;Te===void 0&&(Te=1),Re.setLineWidth(Te*lt()),N.isLineSegments?ft.setMode(k.LINES):N.isLineLoop?ft.setMode(k.LINE_LOOP):ft.setMode(k.LINE_STRIP)}else N.isPoints?ft.setMode(k.POINTS):N.isSprite&&ft.setMode(k.TRIANGLES);if(N.isBatchedMesh)if(N._multiDrawInstances!==null)ft.renderMultiDrawInstances(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount,N._multiDrawInstances);else if(Oe.get("WEBGL_multi_draw"))ft.renderMultiDraw(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount);else{let Te=N._multiDrawStarts,Qi=N._multiDrawCounts,wi=N._multiDrawCount,yt=we?ee.get(we).bytesPerElement:1,gi=Ee.get(j).currentProgram.getUniforms();for(let $t=0;$t<wi;$t++)gi.setValue(k,"_gl_DrawID",$t),ft.render(Te[$t]/yt,Qi[$t])}else if(N.isInstancedMesh)ft.renderInstances(Ke,pt,N.count);else if(q.isInstancedBufferGeometry){let Te=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,Qi=Math.min(q.instanceCount,Te);ft.renderInstances(Ke,pt,Qi)}else ft.render(Ke,pt)};function rt(S,F,q){S.transparent===!0&&S.side===Ci&&S.forceSinglePass===!1?(S.side=Yt,S.needsUpdate=!0,Pt(S,F,q),S.side=qi,S.needsUpdate=!0,Pt(S,F,q),S.side=Ci):Pt(S,F,q)}this.compile=function(S,F,q=null){q===null&&(q=S),f=et.get(q),f.init(F),w.push(f),q.traverseVisible(function(N){N.isLight&&N.layers.test(F.layers)&&(f.pushLight(N),N.castShadow&&f.pushShadow(N))}),S!==q&&S.traverseVisible(function(N){N.isLight&&N.layers.test(F.layers)&&(f.pushLight(N),N.castShadow&&f.pushShadow(N))}),f.setupLights();let j=new Set;return S.traverse(function(N){if(!(N.isMesh||N.isPoints||N.isLine||N.isSprite))return;let re=N.material;if(re)if(Array.isArray(re))for(let xe=0;xe<re.length;xe++){let Se=re[xe];rt(Se,q,N),j.add(Se)}else rt(re,q,N),j.add(re)}),w.pop(),f=null,j},this.compileAsync=function(S,F,q=null){let j=this.compile(S,F,q);return new Promise(N=>{function re(){if(j.forEach(function(xe){Ee.get(xe).currentProgram.isReady()&&j.delete(xe)}),j.size===0){N(S);return}setTimeout(re,10)}Oe.get("KHR_parallel_shader_compile")!==null?re():setTimeout(re,10)})};let ii=null;function ri(S){ii&&ii(S)}function Fr(){Ki.stop()}function Bi(){Ki.start()}let Ki=new Up;Ki.setAnimationLoop(ri),typeof self<"u"&&Ki.setContext(self),this.setAnimationLoop=function(S){ii=S,X.setAnimationLoop(S),S===null?Ki.stop():Ki.start()},X.addEventListener("sessionstart",Fr),X.addEventListener("sessionend",Bi),this.render=function(S,F){if(F!==void 0&&F.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),X.enabled===!0&&X.isPresenting===!0&&(X.cameraAutoUpdate===!0&&X.updateCamera(F),F=X.getCamera()),S.isScene===!0&&S.onBeforeRender(_,S,F,T),f=et.get(S,w.length),f.init(F),w.push(f),Ie.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),V.setFromProjectionMatrix(Ie),ve=this.localClippingEnabled,Y=ae.init(this.clippingPlanes,ve),m=ye.get(S,M.length),m.init(),M.push(m),X.enabled===!0&&X.isPresenting===!0){let re=_.xr.getDepthSensingMesh();re!==null&&un(re,F,-1/0,_.sortObjects)}un(S,F,0,_.sortObjects),m.finish(),_.sortObjects===!0&&m.sort(Z,ne),Ue=X.enabled===!1||X.isPresenting===!1||X.hasDepthSensing()===!1,Ue&&De.addToRenderList(m,S),this.info.render.frame++,Y===!0&&ae.beginShadows();let q=f.state.shadowsArray;_e.render(q,S,F),Y===!0&&ae.endShadows(),this.info.autoReset===!0&&this.info.reset();let j=m.opaque,N=m.transmissive;if(f.setupLights(),F.isArrayCamera){let re=F.cameras;if(N.length>0)for(let xe=0,Se=re.length;xe<Se;xe++){let we=re[xe];es(j,N,S,we)}Ue&&De.render(S);for(let xe=0,Se=re.length;xe<Se;xe++){let we=re[xe];ai(m,S,we,we.viewport)}}else N.length>0&&es(j,N,S,F),Ue&&De.render(S),ai(m,S,F);T!==null&&(E.updateMultisampleRenderTarget(T),E.updateRenderTargetMipmap(T)),S.isScene===!0&&S.onAfterRender(_,S,F),ht.resetDefaultState(),b=-1,x=null,w.pop(),w.length>0?(f=w[w.length-1],Y===!0&&ae.setGlobalState(_.clippingPlanes,f.state.camera)):f=null,M.pop(),M.length>0?m=M[M.length-1]:m=null};function un(S,F,q,j){if(S.visible===!1)return;if(S.layers.test(F.layers)){if(S.isGroup)q=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(F);else if(S.isLight)f.pushLight(S),S.castShadow&&f.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||V.intersectsSprite(S)){j&&Pe.setFromMatrixPosition(S.matrixWorld).applyMatrix4(Ie);let re=K.update(S),xe=S.material;xe.visible&&m.push(S,re,xe,q,Pe.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||V.intersectsObject(S))){let re=K.update(S),xe=S.material;if(j&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),Pe.copy(S.boundingSphere.center)):(re.boundingSphere===null&&re.computeBoundingSphere(),Pe.copy(re.boundingSphere.center)),Pe.applyMatrix4(S.matrixWorld).applyMatrix4(Ie)),Array.isArray(xe)){let Se=re.groups;for(let we=0,He=Se.length;we<He;we++){let Fe=Se[we],Ce=xe[Fe.materialIndex];Ce&&Ce.visible&&m.push(S,re,Ce,q,Pe.z,Fe)}}else xe.visible&&m.push(S,re,xe,q,Pe.z,null)}}let N=S.children;for(let re=0,xe=N.length;re<xe;re++)un(N[re],F,q,j)}function ai(S,F,q,j){let N=S.opaque,re=S.transmissive,xe=S.transparent;f.setupLightsView(q),Y===!0&&ae.setGlobalState(_.clippingPlanes,q),j&&Re.viewport(C.copy(j)),N.length>0&&Br(N,F,q),re.length>0&&Br(re,F,q),xe.length>0&&Br(xe,F,q),Re.buffers.depth.setTest(!0),Re.buffers.depth.setMask(!0),Re.buffers.color.setMask(!0),Re.setPolygonOffset(!1)}function es(S,F,q,j){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[j.id]===void 0&&(f.state.transmissionRenderTarget[j.id]=new Yi(1,1,{generateMipmaps:!0,type:Oe.has("EXT_color_buffer_half_float")||Oe.has("EXT_color_buffer_float")?Jn:Xi,minFilter:Wi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:it.workingColorSpace}));let N=f.state.transmissionRenderTarget[j.id],re=j.viewport||C;N.setSize(re.z,re.w);let xe=_.getRenderTarget();_.setRenderTarget(N),_.getClearColor(W),L=_.getClearAlpha(),L<1&&_.setClearColor(16777215,.5),_.clear(),Ue&&De.render(q);let Se=_.toneMapping;_.toneMapping=pr;let we=j.viewport;if(j.viewport!==void 0&&(j.viewport=void 0),f.setupLightsView(j),Y===!0&&ae.setGlobalState(_.clippingPlanes,j),Br(S,q,j),E.updateMultisampleRenderTarget(N),E.updateRenderTargetMipmap(N),Oe.has("WEBGL_multisampled_render_to_texture")===!1){let He=!1;for(let Fe=0,Ce=F.length;Fe<Ce;Fe++){let Ke=F[Fe],vt=Ke.object,pt=Ke.geometry,mt=Ke.material,ft=Ke.group;if(mt.side===Ci&&vt.layers.test(j.layers)){let Te=mt.side;mt.side=Yt,mt.needsUpdate=!0,Zi(vt,q,j,pt,mt,ft),mt.side=Te,mt.needsUpdate=!0,He=!0}}He===!0&&(E.updateMultisampleRenderTarget(N),E.updateRenderTargetMipmap(N))}_.setRenderTarget(xe),_.setClearColor(W,L),we!==void 0&&(j.viewport=we),_.toneMapping=Se}function Br(S,F,q){let j=F.isScene===!0?F.overrideMaterial:null;for(let N=0,re=S.length;N<re;N++){let xe=S[N],Se=xe.object,we=xe.geometry,He=j===null?xe.material:j,Fe=xe.group;Se.layers.test(q.layers)&&Zi(Se,F,q,we,He,Fe)}}function Zi(S,F,q,j,N,re){S.onBeforeRender(_,F,q,j,N,re),S.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),N.onBeforeRender(_,F,q,j,S,re),N.transparent===!0&&N.side===Ci&&N.forceSinglePass===!1?(N.side=Yt,N.needsUpdate=!0,_.renderBufferDirect(q,F,j,N,S,re),N.side=qi,N.needsUpdate=!0,_.renderBufferDirect(q,F,j,N,S,re),N.side=Ci):_.renderBufferDirect(q,F,j,N,S,re),S.onAfterRender(_,F,q,j,N,re)}function Pt(S,F,q){F.isScene!==!0&&(F=Je);let j=Ee.get(S),N=f.state.lights,re=f.state.shadowsArray,xe=N.state.version,Se=Me.getParameters(S,N.state,re,F,q),we=Me.getProgramCacheKey(Se),He=j.programs;j.environment=S.isMeshStandardMaterial?F.environment:null,j.fog=F.fog,j.envMap=(S.isMeshStandardMaterial?$:y).get(S.envMap||j.environment),j.envMapRotation=j.environment!==null&&S.envMap===null?F.environmentRotation:S.envMapRotation,He===void 0&&(S.addEventListener("dispose",qe),He=new Map,j.programs=He);let Fe=He.get(we);if(Fe!==void 0){if(j.currentProgram===Fe&&j.lightsStateVersion===xe)return Ji(S,Se),Fe}else Se.uniforms=Me.getUniforms(S),S.onBeforeCompile(Se,_),Fe=Me.acquireProgram(Se,we),He.set(we,Fe),j.uniforms=Se.uniforms;let Ce=j.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Ce.clippingPlanes=ae.uniform),Ji(S,Se),j.needsLights=Sr(S),j.lightsStateVersion=xe,j.needsLights&&(Ce.ambientLightColor.value=N.state.ambient,Ce.lightProbe.value=N.state.probe,Ce.directionalLights.value=N.state.directional,Ce.directionalLightShadows.value=N.state.directionalShadow,Ce.spotLights.value=N.state.spot,Ce.spotLightShadows.value=N.state.spotShadow,Ce.rectAreaLights.value=N.state.rectArea,Ce.ltc_1.value=N.state.rectAreaLTC1,Ce.ltc_2.value=N.state.rectAreaLTC2,Ce.pointLights.value=N.state.point,Ce.pointLightShadows.value=N.state.pointShadow,Ce.hemisphereLights.value=N.state.hemi,Ce.directionalShadowMap.value=N.state.directionalShadowMap,Ce.directionalShadowMatrix.value=N.state.directionalShadowMatrix,Ce.spotShadowMap.value=N.state.spotShadowMap,Ce.spotLightMatrix.value=N.state.spotLightMatrix,Ce.spotLightMap.value=N.state.spotLightMap,Ce.pointShadowMap.value=N.state.pointShadowMap,Ce.pointShadowMatrix.value=N.state.pointShadowMatrix),j.currentProgram=Fe,j.uniformsList=null,Fe}function ts(S){if(S.uniformsList===null){let F=S.currentProgram.getUniforms();S.uniformsList=On.seqWithValue(F.seq,S.uniforms)}return S.uniformsList}function Ji(S,F){let q=Ee.get(S);q.outputColorSpace=F.outputColorSpace,q.batching=F.batching,q.batchingColor=F.batchingColor,q.instancing=F.instancing,q.instancingColor=F.instancingColor,q.instancingMorph=F.instancingMorph,q.skinning=F.skinning,q.morphTargets=F.morphTargets,q.morphNormals=F.morphNormals,q.morphColors=F.morphColors,q.morphTargetsCount=F.morphTargetsCount,q.numClippingPlanes=F.numClippingPlanes,q.numIntersection=F.numClipIntersection,q.vertexAlphas=F.vertexAlphas,q.vertexTangents=F.vertexTangents,q.toneMapping=F.toneMapping}function is(S,F,q,j,N){F.isScene!==!0&&(F=Je),E.resetTextureUnits();let re=F.fog,xe=j.isMeshStandardMaterial?F.environment:null,Se=T===null?_.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:Zt,we=(j.isMeshStandardMaterial?$:y).get(j.envMap||xe),He=j.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,Fe=!!q.attributes.tangent&&(!!j.normalMap||j.anisotropy>0),Ce=!!q.morphAttributes.position,Ke=!!q.morphAttributes.normal,vt=!!q.morphAttributes.color,pt=pr;j.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(pt=_.toneMapping);let mt=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ft=mt!==void 0?mt.length:0,Te=Ee.get(j),Qi=f.state.lights;if(Y===!0&&(ve===!0||S!==x)){let bt=S===x&&j.id===b;ae.setState(j,S,bt)}let wi=!1;j.version===Te.__version?(Te.needsLights&&Te.lightsStateVersion!==Qi.state.version||Te.outputColorSpace!==Se||N.isBatchedMesh&&Te.batching===!1||!N.isBatchedMesh&&Te.batching===!0||N.isBatchedMesh&&Te.batchingColor===!0&&N.colorTexture===null||N.isBatchedMesh&&Te.batchingColor===!1&&N.colorTexture!==null||N.isInstancedMesh&&Te.instancing===!1||!N.isInstancedMesh&&Te.instancing===!0||N.isSkinnedMesh&&Te.skinning===!1||!N.isSkinnedMesh&&Te.skinning===!0||N.isInstancedMesh&&Te.instancingColor===!0&&N.instanceColor===null||N.isInstancedMesh&&Te.instancingColor===!1&&N.instanceColor!==null||N.isInstancedMesh&&Te.instancingMorph===!0&&N.morphTexture===null||N.isInstancedMesh&&Te.instancingMorph===!1&&N.morphTexture!==null||Te.envMap!==we||j.fog===!0&&Te.fog!==re||Te.numClippingPlanes!==void 0&&(Te.numClippingPlanes!==ae.numPlanes||Te.numIntersection!==ae.numIntersection)||Te.vertexAlphas!==He||Te.vertexTangents!==Fe||Te.morphTargets!==Ce||Te.morphNormals!==Ke||Te.morphColors!==vt||Te.toneMapping!==pt||Te.morphTargetsCount!==ft)&&(wi=!0):(wi=!0,Te.__version=j.version);let yt=Te.currentProgram;wi===!0&&(yt=Pt(j,F,N));let gi=!1,$t=!1,wr=!1,ot=yt.getUniforms(),oi=Te.uniforms;if(Re.useProgram(yt.program)&&(gi=!0,$t=!0,wr=!0),j.id!==b&&(b=j.id,$t=!0),gi||x!==S){Re.buffers.depth.getReversed()?(le.copy(S.projectionMatrix),sf(le),af(le),ot.setValue(k,"projectionMatrix",le)):ot.setValue(k,"projectionMatrix",S.projectionMatrix),ot.setValue(k,"viewMatrix",S.matrixWorldInverse);let bt=ot.map.cameraPosition;bt!==void 0&&bt.setValue(k,be.setFromMatrixPosition(S.matrixWorld)),Ge.logarithmicDepthBuffer&&ot.setValue(k,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(j.isMeshPhongMaterial||j.isMeshToonMaterial||j.isMeshLambertMaterial||j.isMeshBasicMaterial||j.isMeshStandardMaterial||j.isShaderMaterial)&&ot.setValue(k,"isOrthographic",S.isOrthographicCamera===!0),x!==S&&(x=S,$t=!0,wr=!0)}if(N.isSkinnedMesh){ot.setOptional(k,N,"bindMatrix"),ot.setOptional(k,N,"bindMatrixInverse");let bt=N.skeleton;bt&&(bt.boneTexture===null&&bt.computeBoneTexture(),ot.setValue(k,"boneTexture",bt.boneTexture,E))}N.isBatchedMesh&&(ot.setOptional(k,N,"batchingTexture"),ot.setValue(k,"batchingTexture",N._matricesTexture,E),ot.setOptional(k,N,"batchingIdTexture"),ot.setValue(k,"batchingIdTexture",N._indirectTexture,E),ot.setOptional(k,N,"batchingColorTexture"),N._colorsTexture!==null&&ot.setValue(k,"batchingColorTexture",N._colorsTexture,E));let Wt=q.morphAttributes;if((Wt.position!==void 0||Wt.normal!==void 0||Wt.color!==void 0)&&Ne.update(N,q,yt),($t||Te.receiveShadow!==N.receiveShadow)&&(Te.receiveShadow=N.receiveShadow,ot.setValue(k,"receiveShadow",N.receiveShadow)),j.isMeshGouraudMaterial&&j.envMap!==null&&(oi.envMap.value=we,oi.flipEnvMap.value=we.isCubeTexture&&we.isRenderTargetTexture===!1?-1:1),j.isMeshStandardMaterial&&j.envMap===null&&F.environment!==null&&(oi.envMapIntensity.value=F.environmentIntensity),$t&&(ot.setValue(k,"toneMappingExposure",_.toneMappingExposure),Te.needsLights&&hn(oi,wr),re&&j.fog===!0&&pe.refreshFogUniforms(oi,re),pe.refreshMaterialUniforms(oi,j,H,B,f.state.transmissionRenderTarget[S.id]),On.upload(k,ts(Te),oi,E)),j.isShaderMaterial&&j.uniformsNeedUpdate===!0&&(On.upload(k,ts(Te),oi,E),j.uniformsNeedUpdate=!1),j.isSpriteMaterial&&ot.setValue(k,"center",N.center),ot.setValue(k,"modelViewMatrix",N.modelViewMatrix),ot.setValue(k,"normalMatrix",N.normalMatrix),ot.setValue(k,"modelMatrix",N.matrixWorld),j.isShaderMaterial||j.isRawShaderMaterial){let bt=j.uniformsGroups;for(let Hr=0,Mi=bt.length;Hr<Mi;Hr++){let pn=bt[Hr];O.update(pn,yt),O.bind(pn,yt)}}return yt}function hn(S,F){S.ambientLightColor.needsUpdate=F,S.lightProbe.needsUpdate=F,S.directionalLights.needsUpdate=F,S.directionalLightShadows.needsUpdate=F,S.pointLights.needsUpdate=F,S.pointLightShadows.needsUpdate=F,S.spotLights.needsUpdate=F,S.spotLightShadows.needsUpdate=F,S.rectAreaLights.needsUpdate=F,S.hemisphereLights.needsUpdate=F}function Sr(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(S,F,q){Ee.get(S.texture).__webglTexture=F,Ee.get(S.depthTexture).__webglTexture=q;let j=Ee.get(S);j.__hasExternalTextures=!0,j.__autoAllocateDepthBuffer=q===void 0,j.__autoAllocateDepthBuffer||Oe.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),j.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(S,F){let q=Ee.get(S);q.__webglFramebuffer=F,q.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(S,F=0,q=0){T=S,A=F,R=q;let j=!0,N=null,re=!1,xe=!1;if(S){let Se=Ee.get(S);if(Se.__useDefaultFramebuffer!==void 0)Re.bindFramebuffer(k.FRAMEBUFFER,null),j=!1;else if(Se.__webglFramebuffer===void 0)E.setupRenderTarget(S);else if(Se.__hasExternalTextures)E.rebindTextures(S,Ee.get(S.texture).__webglTexture,Ee.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Fe=S.depthTexture;if(Se.__boundDepthTexture!==Fe){if(Fe!==null&&Ee.has(Fe)&&(S.width!==Fe.image.width||S.height!==Fe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(S)}}let we=S.texture;(we.isData3DTexture||we.isDataArrayTexture||we.isCompressedArrayTexture)&&(xe=!0);let He=Ee.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(He[F])?N=He[F][q]:N=He[F],re=!0):S.samples>0&&E.useMultisampledRTT(S)===!1?N=Ee.get(S).__webglMultisampledFramebuffer:Array.isArray(He)?N=He[q]:N=He,C.copy(S.viewport),U.copy(S.scissor),G=S.scissorTest}else C.copy(de).multiplyScalar(H).floor(),U.copy(me).multiplyScalar(H).floor(),G=ue;if(Re.bindFramebuffer(k.FRAMEBUFFER,N)&&j&&Re.drawBuffers(S,N),Re.viewport(C),Re.scissor(U),Re.setScissorTest(G),re){let Se=Ee.get(S.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_CUBE_MAP_POSITIVE_X+F,Se.__webglTexture,q)}else if(xe){let Se=Ee.get(S.texture),we=F||0;k.framebufferTextureLayer(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,Se.__webglTexture,q||0,we)}b=-1},this.readRenderTargetPixels=function(S,F,q,j,N,re,xe){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=Ee.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&xe!==void 0&&(Se=Se[xe]),Se){Re.bindFramebuffer(k.FRAMEBUFFER,Se);try{let we=S.texture,He=we.format,Fe=we.type;if(!Ge.textureFormatReadable(He)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ge.textureTypeReadable(Fe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=S.width-j&&q>=0&&q<=S.height-N&&k.readPixels(F,q,j,N,Ve.convert(He),Ve.convert(Fe),re)}finally{let we=T!==null?Ee.get(T).__webglFramebuffer:null;Re.bindFramebuffer(k.FRAMEBUFFER,we)}}},this.readRenderTargetPixelsAsync=async function(S,F,q,j,N,re,xe){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=Ee.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&xe!==void 0&&(Se=Se[xe]),Se){let we=S.texture,He=we.format,Fe=we.type;if(!Ge.textureFormatReadable(He))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ge.textureTypeReadable(Fe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(F>=0&&F<=S.width-j&&q>=0&&q<=S.height-N){Re.bindFramebuffer(k.FRAMEBUFFER,Se);let Ce=k.createBuffer();k.bindBuffer(k.PIXEL_PACK_BUFFER,Ce),k.bufferData(k.PIXEL_PACK_BUFFER,re.byteLength,k.STREAM_READ),k.readPixels(F,q,j,N,Ve.convert(He),Ve.convert(Fe),0);let Ke=T!==null?Ee.get(T).__webglFramebuffer:null;Re.bindFramebuffer(k.FRAMEBUFFER,Ke);let vt=k.fenceSync(k.SYNC_GPU_COMMANDS_COMPLETE,0);return k.flush(),await nf(k,vt,4),k.bindBuffer(k.PIXEL_PACK_BUFFER,Ce),k.getBufferSubData(k.PIXEL_PACK_BUFFER,0,re),k.deleteBuffer(Ce),k.deleteSync(vt),re}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(S,F=null,q=0){S.isTexture!==!0&&(fs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),F=arguments[0]||null,S=arguments[1]);let j=Math.pow(2,-q),N=Math.floor(S.image.width*j),re=Math.floor(S.image.height*j),xe=F!==null?F.x:0,Se=F!==null?F.y:0;E.setTexture2D(S,0),k.copyTexSubImage2D(k.TEXTURE_2D,q,0,0,xe,Se,N,re),Re.unbindTexture()},this.copyTextureToTexture=function(S,F,q=null,j=null,N=0){S.isTexture!==!0&&(fs("WebGLRenderer: copyTextureToTexture function signature has changed."),j=arguments[0]||null,S=arguments[1],F=arguments[2],N=arguments[3]||0,q=null);let re,xe,Se,we,He,Fe,Ce,Ke,vt,pt=S.isCompressedTexture?S.mipmaps[N]:S.image;q!==null?(re=q.max.x-q.min.x,xe=q.max.y-q.min.y,Se=q.isBox3?q.max.z-q.min.z:1,we=q.min.x,He=q.min.y,Fe=q.isBox3?q.min.z:0):(re=pt.width,xe=pt.height,Se=pt.depth||1,we=0,He=0,Fe=0),j!==null?(Ce=j.x,Ke=j.y,vt=j.z):(Ce=0,Ke=0,vt=0);let mt=Ve.convert(F.format),ft=Ve.convert(F.type),Te;F.isData3DTexture?(E.setTexture3D(F,0),Te=k.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(E.setTexture2DArray(F,0),Te=k.TEXTURE_2D_ARRAY):(E.setTexture2D(F,0),Te=k.TEXTURE_2D),k.pixelStorei(k.UNPACK_FLIP_Y_WEBGL,F.flipY),k.pixelStorei(k.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),k.pixelStorei(k.UNPACK_ALIGNMENT,F.unpackAlignment);let Qi=k.getParameter(k.UNPACK_ROW_LENGTH),wi=k.getParameter(k.UNPACK_IMAGE_HEIGHT),yt=k.getParameter(k.UNPACK_SKIP_PIXELS),gi=k.getParameter(k.UNPACK_SKIP_ROWS),$t=k.getParameter(k.UNPACK_SKIP_IMAGES);k.pixelStorei(k.UNPACK_ROW_LENGTH,pt.width),k.pixelStorei(k.UNPACK_IMAGE_HEIGHT,pt.height),k.pixelStorei(k.UNPACK_SKIP_PIXELS,we),k.pixelStorei(k.UNPACK_SKIP_ROWS,He),k.pixelStorei(k.UNPACK_SKIP_IMAGES,Fe);let wr=S.isDataArrayTexture||S.isData3DTexture,ot=F.isDataArrayTexture||F.isData3DTexture;if(S.isRenderTargetTexture||S.isDepthTexture){let oi=Ee.get(S),Wt=Ee.get(F),bt=Ee.get(oi.__renderTarget),Hr=Ee.get(Wt.__renderTarget);Re.bindFramebuffer(k.READ_FRAMEBUFFER,bt.__webglFramebuffer),Re.bindFramebuffer(k.DRAW_FRAMEBUFFER,Hr.__webglFramebuffer);for(let Mi=0;Mi<Se;Mi++)wr&&k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Ee.get(S).__webglTexture,N,Fe+Mi),S.isDepthTexture?(ot&&k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Ee.get(F).__webglTexture,N,vt+Mi),k.blitFramebuffer(we,He,re,xe,Ce,Ke,re,xe,k.DEPTH_BUFFER_BIT,k.NEAREST)):ot?k.copyTexSubImage3D(Te,N,Ce,Ke,vt+Mi,we,He,re,xe):k.copyTexSubImage2D(Te,N,Ce,Ke,vt+Mi,we,He,re,xe);Re.bindFramebuffer(k.READ_FRAMEBUFFER,null),Re.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else ot?S.isDataTexture||S.isData3DTexture?k.texSubImage3D(Te,N,Ce,Ke,vt,re,xe,Se,mt,ft,pt.data):F.isCompressedArrayTexture?k.compressedTexSubImage3D(Te,N,Ce,Ke,vt,re,xe,Se,mt,pt.data):k.texSubImage3D(Te,N,Ce,Ke,vt,re,xe,Se,mt,ft,pt):S.isDataTexture?k.texSubImage2D(k.TEXTURE_2D,N,Ce,Ke,re,xe,mt,ft,pt.data):S.isCompressedTexture?k.compressedTexSubImage2D(k.TEXTURE_2D,N,Ce,Ke,pt.width,pt.height,mt,pt.data):k.texSubImage2D(k.TEXTURE_2D,N,Ce,Ke,re,xe,mt,ft,pt);k.pixelStorei(k.UNPACK_ROW_LENGTH,Qi),k.pixelStorei(k.UNPACK_IMAGE_HEIGHT,wi),k.pixelStorei(k.UNPACK_SKIP_PIXELS,yt),k.pixelStorei(k.UNPACK_SKIP_ROWS,gi),k.pixelStorei(k.UNPACK_SKIP_IMAGES,$t),N===0&&F.generateMipmaps&&k.generateMipmap(Te),Re.unbindTexture()},this.copyTextureToTexture3D=function(S,F,q=null,j=null,N=0){return S.isTexture!==!0&&(fs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),q=arguments[0]||null,j=arguments[1]||null,S=arguments[2],F=arguments[3],N=arguments[4]||0),fs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(S,F,q,j,N)},this.initRenderTarget=function(S){Ee.get(S).__webglFramebuffer===void 0&&E.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?E.setTextureCube(S,0):S.isData3DTexture?E.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?E.setTexture2DArray(S,0):E.setTexture2D(S,0),Re.unbindTexture()},this.resetState=function(){A=0,R=0,T=null,Re.reset(),ht.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ji}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=it._getDrawingBufferColorSpace(e),t.unpackColorSpace=it._getUnpackColorSpace()}},Hs=class extends Tt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ki,this.environmentIntensity=1,this.environmentRotation=new ki,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Do=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=wo,this.updateRanges=[],this.version=0,this.uuid=Di()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let n=0,s=this.stride;n<s;n++)this.array[e+n]=t.array[i+n];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Di()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Di()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},ei=new z,Uo=class r{constructor(e,t,i,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)ei.fromBufferAttribute(this,t),ei.applyMatrix4(e),this.setXYZ(t,ei.x,ei.y,ei.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)ei.fromBufferAttribute(this,t),ei.applyNormalMatrix(e),this.setXYZ(t,ei.x,ei.y,ei.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)ei.fromBufferAttribute(this,t),ei.transformDirection(e),this.setXYZ(t,ei.x,ei.y,ei.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Li(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=dt(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=dt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Li(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Li(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Li(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Li(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=dt(t,this.array),i=dt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=dt(t,this.array),i=dt(i,this.array),n=dt(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=n,this}setXYZW(e,t,i,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=dt(t,this.array),i=dt(i,this.array),n=dt(n,this.array),s=dt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=n,this.data.array[e+3]=s,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let n=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[n+s])}return new zt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new r(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let n=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[n+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},th=new z,ih=new at,rh=new at,Jx=new z,nh=new je,Ra=new z,Zl=new pi,sh=new je,Jl=new on,No=class extends ut{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=_c,this.bindMatrix=new je,this.bindMatrixInverse=new je,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Si),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,Ra),this.boundingBox.expandByPoint(Ra)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new pi),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,Ra),this.boundingSphere.expandByPoint(Ra)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let i=this.material,n=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Zl.copy(this.boundingSphere),Zl.applyMatrix4(n),e.ray.intersectsSphere(Zl)!==!1&&(sh.copy(n).invert(),Jl.copy(e.ray).applyMatrix4(sh),!(this.boundingBox!==null&&Jl.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Jl)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new at,t=this.geometry.attributes.skinWeight;for(let i=0,n=t.count;i<n;i++){e.fromBufferAttribute(t,i);let s=1/e.manhattanLength();s!==1/0?e.multiplyScalar(s):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===_c?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===fp?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let i=this.skeleton,n=this.geometry;ih.fromBufferAttribute(n.attributes.skinIndex,e),rh.fromBufferAttribute(n.attributes.skinWeight,e),th.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let s=0;s<4;s++){let a=rh.getComponent(s);if(a!==0){let o=ih.getComponent(s);nh.multiplyMatrices(i.bones[o].matrixWorld,i.boneInverses[o]),t.addScaledVector(Jx.copy(th).applyMatrix4(nh),a)}}return t.applyMatrix4(this.bindMatrixInverse)}},zs=class extends Tt{constructor(){super(),this.isBone=!0,this.type="Bone"}},Vs=class extends Vt{constructor(e=null,t=1,i=1,n,s,a,o,l,c=Kt,d=Kt,u,h){super(null,a,o,l,c,d,n,s,u,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},ah=new je,Qx=new je,ko=class r{constructor(e=[],t=[]){this.uuid=Di(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,n=this.bones.length;i<n;i++)this.boneInverses.push(new je)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let i=new je;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){let e=this.bones,t=this.boneInverses,i=this.boneMatrices,n=this.boneTexture;for(let s=0,a=e.length;s<a;s++){let o=e[s]?e[s].matrixWorld:Qx;ah.multiplyMatrices(o,t[s]),ah.toArray(i,s*16)}n!==null&&(n.needsUpdate=!0)}clone(){return new r(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let i=new Vs(t,e,e,ui,yi);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){let n=this.bones[t];if(n.name===e)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,n=e.bones.length;i<n;i++){let s=e.bones[i],a=t[s];a===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",s),a=new zs),this.bones.push(a),this.boneInverses.push(new je().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){let e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,i=this.boneInverses;for(let n=0,s=t.length;n<s;n++){let a=t[n];e.bones.push(a.uuid);let o=i[n];e.boneInverses.push(o.toArray())}return e}},qn=class extends zt{constructor(e,t,i,n=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Pn=new je,oh=new je,Ca=[],lh=new Si,e_=new je,cs=new ut,ds=new pi,Oo=class extends ut{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new qn(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<i;n++)this.setMatrixAt(n,e_)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Si),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Pn),lh.copy(e.boundingBox).applyMatrix4(Pn),this.boundingBox.union(lh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new pi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Pn),ds.copy(e.boundingSphere).applyMatrix4(Pn),this.boundingSphere.union(ds)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,n=this.morphTexture.source.data.data,s=i.length+1,a=e*s+1;for(let o=0;o<i.length;o++)i[o]=n[a+o]}raycast(e,t){let i=this.matrixWorld,n=this.count;if(cs.geometry=this.geometry,cs.material=this.material,cs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ds.copy(this.boundingSphere),ds.applyMatrix4(i),e.ray.intersectsSphere(ds)!==!1))for(let s=0;s<n;s++){this.getMatrixAt(s,Pn),oh.multiplyMatrices(i,Pn),cs.matrixWorld=oh,cs.raycast(e,Ca);for(let a=0,o=Ca.length;a<o;a++){let l=Ca[a];l.instanceId=s,l.object=this,t.push(l)}Ca.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new qn(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let i=t.morphTargetInfluences,n=i.length+1;this.morphTexture===null&&(this.morphTexture=new Vs(new Float32Array(n*this.count),n,this.count,dl,yi));let s=this.morphTexture.source.data.data,a=0;for(let c=0;c<i.length;c++)a+=i[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=n*e;s[l]=o,s.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}},Gs=class extends hi{static get type(){return"LineBasicMaterial"}constructor(e){super(),this.isLineBasicMaterial=!0,this.color=new Be(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Fo=new z,Bo=new z,ch=new je,us=new on,La=new pi,Ql=new z,dh=new z,Xn=class extends Tt{constructor(e=new Oi,t=new Gs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let n=1,s=t.count;n<s;n++)Fo.fromBufferAttribute(t,n-1),Bo.fromBufferAttribute(t,n),i[n]=i[n-1],i[n]+=Fo.distanceTo(Bo);e.setAttribute("lineDistance",new bi(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,n=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),La.copy(i.boundingSphere),La.applyMatrix4(n),La.radius+=s,e.ray.intersectsSphere(La)===!1)return;ch.copy(n).invert(),us.copy(e.ray).applyMatrix4(ch);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,d=i.index,u=i.attributes.position;if(d!==null){let h=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let g=h,v=p-1;g<v;g+=c){let m=d.getX(g),f=d.getX(g+1),M=Pa(this,e,us,l,m,f);M&&t.push(M)}if(this.isLineLoop){let g=d.getX(p-1),v=d.getX(h),m=Pa(this,e,us,l,g,v);m&&t.push(m)}}else{let h=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let g=h,v=p-1;g<v;g+=c){let m=Pa(this,e,us,l,g,g+1);m&&t.push(m)}if(this.isLineLoop){let g=Pa(this,e,us,l,p-1,h);g&&t.push(g)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=i.length;n<s;n++){let a=i[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}};function Pa(r,e,t,i,n,s){let a=r.geometry.attributes.position;if(Fo.fromBufferAttribute(a,n),Bo.fromBufferAttribute(a,s),t.distanceSqToSegment(Fo,Bo,Ql,dh)>i)return;Ql.applyMatrix4(r.matrixWorld);let o=e.ray.origin.distanceTo(Ql);if(!(o<e.near||o>e.far))return{distance:o,point:dh.clone().applyMatrix4(r.matrixWorld),index:n,face:null,faceIndex:null,barycoord:null,object:r}}var uh=new z,hh=new z,Ho=class extends Xn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let n=0,s=t.count;n<s;n+=2)uh.fromBufferAttribute(t,n),hh.fromBufferAttribute(t,n+1),i[n]=n===0?0:i[n-1],i[n+1]=i[n]+uh.distanceTo(hh);e.setAttribute("lineDistance",new bi(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},zo=class extends Xn{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},$s=class extends hi{static get type(){return"PointsMaterial"}constructor(e){super(),this.isPointsMaterial=!0,this.color=new Be(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ph=new je,Dc=new on,Ia=new pi,Da=new z,Vo=class extends Tt{constructor(e=new Oi,t=new $s){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,n=this.matrixWorld,s=e.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ia.copy(i.boundingSphere),Ia.applyMatrix4(n),Ia.radius+=s,e.ray.intersectsSphere(Ia)===!1)return;ph.copy(n).invert(),Dc.copy(e.ray).applyMatrix4(ph);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,d=i.attributes.position;if(c!==null){let u=Math.max(0,a.start),h=Math.min(c.count,a.start+a.count);for(let p=u,g=h;p<g;p++){let v=c.getX(p);Da.fromBufferAttribute(d,v),mh(Da,v,l,n,e,t,this)}}else{let u=Math.max(0,a.start),h=Math.min(d.count,a.start+a.count);for(let p=u,g=h;p<g;p++)Da.fromBufferAttribute(d,p),mh(Da,p,l,n,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=i.length;n<s;n++){let a=i[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}};function mh(r,e,t,i,n,s,a){let o=Dc.distanceSqToPoint(r);if(o<t){let l=new z;Dc.closestPointToPoint(r,l),l.applyMatrix4(i);let c=n.ray.origin.distanceTo(l);if(c<n.near||c>n.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var kr=class extends hi{static get type(){return"MeshStandardMaterial"}constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Be(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Be(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Bd,this.normalScale=new nt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ki,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},mi=class extends kr{static get type(){return"MeshPhysicalMaterial"}constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new nt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Xt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Be(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Be(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Be(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};function Ua(r,e,t){return!r||!t&&r.constructor===e?r:typeof e.BYTES_PER_ELEMENT=="number"?new e(r):Array.prototype.slice.call(r)}function t_(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function i_(r){function e(n,s){return r[n]-r[s]}let t=r.length,i=new Array(t);for(let n=0;n!==t;++n)i[n]=n;return i.sort(e),i}function fh(r,e,t){let i=r.length,n=new r.constructor(i);for(let s=0,a=0;a!==i;++s){let o=t[s]*e;for(let l=0;l!==e;++l)n[a++]=r[o+l]}return n}function Hp(r,e,t,i){let n=1,s=r[0];for(;s!==void 0&&s[i]===void 0;)s=r[n++];if(s===void 0)return;let a=s[i];if(a!==void 0)if(Array.isArray(a))do a=s[i],a!==void 0&&(e.push(s.time),t.push.apply(t,a)),s=r[n++];while(s!==void 0);else if(a.toArray!==void 0)do a=s[i],a!==void 0&&(e.push(s.time),a.toArray(t,t.length)),s=r[n++];while(s!==void 0);else do a=s[i],a!==void 0&&(e.push(s.time),t.push(a)),s=r[n++];while(s!==void 0)}var Or=class{constructor(e,t,i,n){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=n!==void 0?n:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,n=t[i],s=t[i-1];i:{e:{let a;t:{r:if(!(e<n)){for(let o=i+2;;){if(n===void 0){if(e<s)break r;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=n,n=t[++i],e<n)break e}a=t.length;break t}if(!(e>=s)){let o=t[1];e<o&&(i=2,s=o);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(n=s,s=t[--i-1],e>=s)break e}a=i,i=0;break t}break i}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(n=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,n)}return this.interpolate_(i,s,e,n)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,n=this.valueSize,s=e*n;for(let a=0;a!==n;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Go=class extends Or{constructor(e,t,i,n){super(e,t,i,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:yc,endingEnd:yc}}intervalChanged_(e,t,i){let n=this.parameterPositions,s=e-2,a=e+1,o=n[s],l=n[a];if(o===void 0)switch(this.getSettings_().endingStart){case bc:s=e,o=2*t-i;break;case Sc:s=n.length-2,o=t+n[s]-n[s+1];break;default:s=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case bc:a=e,l=2*i-t;break;case Sc:a=1,l=i+n[1]-n[0];break;default:a=e-1,l=t}let c=(i-t)*.5,d=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=s*d,this._offsetNext=a*d}interpolate_(e,t,i,n){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=this._offsetPrev,u=this._offsetNext,h=this._weightPrev,p=this._weightNext,g=(i-t)/(n-t),v=g*g,m=v*g,f=-h*m+2*h*v-h*g,M=(1+h)*m+(-1.5-2*h)*v+(-.5+h)*g+1,w=(-1-p)*m+(1.5+p)*v+.5*g,_=p*m-p*v;for(let D=0;D!==o;++D)s[D]=f*a[d+D]+M*a[c+D]+w*a[l+D]+_*a[u+D];return s}},$o=class extends Or{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e,t,i,n){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=(i-t)/(n-t),u=1-d;for(let h=0;h!==o;++h)s[h]=a[c+h]*u+a[l+h]*d;return s}},Wo=class extends Or{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e){return this.copySampleValue_(e-1)}},fi=class{constructor(e,t,i,n){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Ua(t,this.TimeBufferType),this.values=Ua(i,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Ua(e.times,Array),values:Ua(e.values,Array)};let n=e.getInterpolation();n!==e.DefaultInterpolation&&(i.interpolation=n)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Wo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new $o(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Go(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Hn:t=this.InterpolantFactoryMethodDiscrete;break;case zn:t=this.InterpolantFactoryMethodLinear;break;case ka:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Hn;case this.InterpolantFactoryMethodLinear:return zn;case this.InterpolantFactoryMethodSmooth:return ka}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,n=t.length;i!==n;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,n=t.length;i!==n;++i)t[i]*=e}return this}trim(e,t){let i=this.times,n=i.length,s=0,a=n-1;for(;s!==n&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==n){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,n=this.values,s=i.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(n!==void 0&&t_(n))for(let o=0,l=n.length;o!==l;++o){let c=n[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),n=this.getInterpolation()===ka,s=e.length-1,a=1;for(let o=1;o<s;++o){let l=!1,c=e[o],d=e[o+1];if(c!==d&&(o!==1||c!==e[0]))if(n)l=!0;else{let u=o*i,h=u-i,p=u+i;for(let g=0;g!==i;++g){let v=t[u+g];if(v!==t[h+g]||v!==t[p+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*i,h=a*i;for(let p=0;p!==i;++p)t[h+p]=t[u+p]}++a}}if(s>0){e[a]=e[s];for(let o=s*i,l=a*i,c=0;c!==i;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,n=new i(this.name,e,t);return n.createInterpolant=this.createInterpolant,n}};fi.prototype.TimeBufferType=Float32Array;fi.prototype.ValueBufferType=Float32Array;fi.prototype.DefaultInterpolation=zn;var gr=class extends fi{constructor(e,t,i){super(e,t,i)}};gr.prototype.ValueTypeName="bool";gr.prototype.ValueBufferType=Array;gr.prototype.DefaultInterpolation=Hn;gr.prototype.InterpolantFactoryMethodLinear=void 0;gr.prototype.InterpolantFactoryMethodSmooth=void 0;var Ws=class extends fi{};Ws.prototype.ValueTypeName="color";var vr=class extends fi{};vr.prototype.ValueTypeName="number";var jo=class extends Or{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e,t,i,n){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-t)/(n-t),c=e*o;for(let d=c+o;c!==d;c+=4)Ni.slerpFlat(s,0,a,c-o,a,c,l);return s}},xr=class extends fi{InterpolantFactoryMethodLinear(e){return new jo(this.times,this.values,this.getValueSize(),e)}};xr.prototype.ValueTypeName="quaternion";xr.prototype.InterpolantFactoryMethodSmooth=void 0;var _r=class extends fi{constructor(e,t,i){super(e,t,i)}};_r.prototype.ValueTypeName="string";_r.prototype.ValueBufferType=Array;_r.prototype.DefaultInterpolation=Hn;_r.prototype.InterpolantFactoryMethodLinear=void 0;_r.prototype.InterpolantFactoryMethodSmooth=void 0;var yr=class extends fi{};yr.prototype.ValueTypeName="vector";var qo=class{constructor(e="",t=-1,i=[],n=gp){this.name=e,this.tracks=i,this.duration=t,this.blendMode=n,this.uuid=Di(),this.duration<0&&this.resetDuration()}static parse(e){let t=[],i=e.tracks,n=1/(e.fps||1);for(let a=0,o=i.length;a!==o;++a)t.push(n_(i[a]).scale(n));let s=new this(e.name,e.duration,t,e.blendMode);return s.uuid=e.uuid,s}static toJSON(e){let t=[],i=e.tracks,n={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let s=0,a=i.length;s!==a;++s)t.push(fi.toJSON(i[s]));return n}static CreateFromMorphTargetSequence(e,t,i,n){let s=t.length,a=[];for(let o=0;o<s;o++){let l=[],c=[];l.push((o+s-1)%s,o,(o+1)%s),c.push(0,1,0);let d=i_(l);l=fh(l,1,d),c=fh(c,1,d),!n&&l[0]===0&&(l.push(s),c.push(c[0])),a.push(new vr(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/i))}return new this(e,-1,a)}static findByName(e,t){let i=e;if(!Array.isArray(e)){let n=e;i=n.geometry&&n.geometry.animations||n.animations}for(let n=0;n<i.length;n++)if(i[n].name===t)return i[n];return null}static CreateClipsFromMorphTargetSequences(e,t,i){let n={},s=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){let c=e[o],d=c.name.match(s);if(d&&d.length>1){let u=d[1],h=n[u];h||(n[u]=h=[]),h.push(c)}}let a=[];for(let o in n)a.push(this.CreateFromMorphTargetSequence(o,n[o],t,i));return a}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let i=function(d,u,h,p,g){if(h.length!==0){let v=[],m=[];Hp(h,v,m,p),v.length!==0&&g.push(new d(u,v,m))}},n=[],s=e.name||"default",a=e.fps||30,o=e.blendMode,l=e.length||-1,c=e.hierarchy||[];for(let d=0;d<c.length;d++){let u=c[d].keys;if(!(!u||u.length===0))if(u[0].morphTargets){let h={},p;for(p=0;p<u.length;p++)if(u[p].morphTargets)for(let g=0;g<u[p].morphTargets.length;g++)h[u[p].morphTargets[g]]=-1;for(let g in h){let v=[],m=[];for(let f=0;f!==u[p].morphTargets.length;++f){let M=u[p];v.push(M.time),m.push(M.morphTarget===g?1:0)}n.push(new vr(".morphTargetInfluence["+g+"]",v,m))}l=h.length*a}else{let h=".bones["+t[d].name+"]";i(yr,h+".position",u,"pos",n),i(xr,h+".quaternion",u,"rot",n),i(yr,h+".scale",u,"scl",n)}}return n.length===0?null:new this(s,l,n,o)}resetDuration(){let e=this.tracks,t=0;for(let i=0,n=e.length;i!==n;++i){let s=this.tracks[i];t=Math.max(t,s.times[s.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}};function r_(r){switch(r.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return vr;case"vector":case"vector2":case"vector3":case"vector4":return yr;case"color":return Ws;case"quaternion":return xr;case"bool":case"boolean":return gr;case"string":return _r}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+r)}function n_(r){if(r.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=r_(r.type);if(r.times===void 0){let t=[],i=[];Hp(r.keys,t,i,"value"),r.times=t,r.values=i}return e.parse!==void 0?e.parse(r):new e(r.name,r.times,r.values,r.interpolation)}var ur={enabled:!1,files:{},add:function(r,e){this.enabled!==!1&&(this.files[r]=e)},get:function(r){if(this.enabled!==!1)return this.files[r]},remove:function(r){delete this.files[r]},clear:function(){this.files={}}},Xo=class{constructor(e,t,i){let n=this,s=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(d){o++,s===!1&&n.onStart!==void 0&&n.onStart(d,a,o),s=!0},this.itemEnd=function(d){a++,n.onProgress!==void 0&&n.onProgress(d,a,o),a===o&&(s=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(d){n.onError!==void 0&&n.onError(d)},this.resolveURL=function(d){return l?l(d):d},this.setURLModifier=function(d){return l=d,this},this.addHandler=function(d,u){return c.push(d,u),this},this.removeHandler=function(d){let u=c.indexOf(d);return u!==-1&&c.splice(u,2),this},this.getHandler=function(d){for(let u=0,h=c.length;u<h;u+=2){let p=c[u],g=c[u+1];if(p.global&&(p.lastIndex=0),p.test(d))return g}return null}}},zp=new Xo,br=class{constructor(e){this.manager=e!==void 0?e:zp,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(n,s){i.load(e,n,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};br.DEFAULT_MATERIAL_NAME="__DEFAULT";var or={},Uc=class extends Error{constructor(e,t){super(e),this.response=t}},js=class extends br{constructor(e){super(e)}load(e,t,i,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=ur.get(e);if(s!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0),s;if(or[e]!==void 0){or[e].push({onLoad:t,onProgress:i,onError:n});return}or[e]=[],or[e].push({onLoad:t,onProgress:i,onError:n});let a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let d=or[e],u=c.body.getReader(),h=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),p=h?parseInt(h):0,g=p!==0,v=0,m=new ReadableStream({start(f){M();function M(){u.read().then(({done:w,value:_})=>{if(w)f.close();else{v+=_.byteLength;let D=new ProgressEvent("progress",{lengthComputable:g,loaded:v,total:p});for(let A=0,R=d.length;A<R;A++){let T=d[A];T.onProgress&&T.onProgress(D)}f.enqueue(_),M()}},w=>{f.error(w)})}}});return new Response(m)}else throw new Uc(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(d=>new DOMParser().parseFromString(d,o));case"json":return c.json();default:if(o===void 0)return c.text();{let d=/charset="?([^;"\s]*)"?/i.exec(o),u=d&&d[1]?d[1].toLowerCase():void 0,h=new TextDecoder(u);return c.arrayBuffer().then(p=>h.decode(p))}}}).then(c=>{ur.add(e,c);let d=or[e];delete or[e];for(let u=0,h=d.length;u<h;u++){let p=d[u];p.onLoad&&p.onLoad(c)}}).catch(c=>{let d=or[e];if(d===void 0)throw this.manager.itemError(e),c;delete or[e];for(let u=0,h=d.length;u<h;u++){let p=d[u];p.onError&&p.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}},Yo=class extends br{constructor(e){super(e)}load(e,t,i,n){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=ur.get(e);if(a!==void 0)return s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a;let o=Ls("img");function l(){d(),ur.add(e,this),t&&t(this),s.manager.itemEnd(e)}function c(u){d(),n&&n(u),s.manager.itemError(e),s.manager.itemEnd(e)}function d(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),s.manager.itemStart(e),o.src=e,o}},Ko=class extends br{constructor(e){super(e)}load(e,t,i,n){let s=new Vt,a=new Yo(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},i,n),s}},cn=class extends Tt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Be(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},ec=new je,gh=new z,vh=new z,qs=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new nt(512,512),this.map=null,this.mapPass=null,this.matrix=new je,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new $n,this._frameExtents=new nt(1,1),this._viewportCount=1,this._viewports=[new at(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;gh.setFromMatrixPosition(e.matrixWorld),t.position.copy(gh),vh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(vh),t.updateMatrixWorld(),ec.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ec),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(ec)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Nc=class extends qs{constructor(){super(new Ht(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,i=Vn*2*e.angle*this.focus,n=this.mapSize.width/this.mapSize.height,s=e.distance||t.far;(i!==t.fov||n!==t.aspect||s!==t.far)&&(t.fov=i,t.aspect=n,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},Zo=class extends cn{constructor(e,t,i=0,n=Math.PI/3,s=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.distance=i,this.angle=n,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new Nc}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},xh=new je,hs=new z,tc=new z,kc=class extends qs{constructor(){super(new Ht(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new nt(4,2),this._viewportCount=6,this._viewports=[new at(2,1,1,1),new at(0,1,1,1),new at(3,1,1,1),new at(1,1,1,1),new at(3,0,1,1),new at(1,0,1,1)],this._cubeDirections=[new z(1,0,0),new z(-1,0,0),new z(0,0,1),new z(0,0,-1),new z(0,1,0),new z(0,-1,0)],this._cubeUps=[new z(0,1,0),new z(0,1,0),new z(0,1,0),new z(0,1,0),new z(0,0,1),new z(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,n=this.matrix,s=e.distance||i.far;s!==i.far&&(i.far=s,i.updateProjectionMatrix()),hs.setFromMatrixPosition(e.matrixWorld),i.position.copy(hs),tc.copy(i.position),tc.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(tc),i.updateMatrixWorld(),n.makeTranslation(-hs.x,-hs.y,-hs.z),xh.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(xh)}},dn=class extends cn{constructor(e,t,i=0,n=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=n,this.shadow=new kc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Oc=class extends qs{constructor(){super(new Wn(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Xs=class extends cn{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.shadow=new Oc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Jo=class extends cn{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}},Dr=class{static decodeText(e){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let i=0,n=e.length;i<n;i++)t+=String.fromCharCode(e[i]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}},Qo=class extends br{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,i,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=ur.get(e);if(a!==void 0){if(s.manager.itemStart(e),a.then){a.then(c=>{t&&t(c),s.manager.itemEnd(e)}).catch(c=>{n&&n(c)});return}return setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader;let l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(c){return ur.add(e,c),t&&t(c),s.manager.itemEnd(e),c}).catch(function(c){n&&n(c),ur.remove(e),s.manager.itemError(e),s.manager.itemEnd(e)});ur.add(e,l),s.manager.itemStart(e)}},el=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=_h(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=_h();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};function _h(){return performance.now()}var Gd="\\[\\]\\.:\\/",s_=new RegExp("["+Gd+"]","g"),$d="[^"+Gd+"]",a_="[^"+Gd.replace("\\.","")+"]",o_=/((?:WC+[\/:])*)/.source.replace("WC",$d),l_=/(WCOD+)?/.source.replace("WCOD",a_),c_=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",$d),d_=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",$d),u_=new RegExp("^"+o_+l_+c_+d_+"$"),h_=["material","materials","bones","map"],Fc=class{constructor(e,t,i){let n=i||xt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,n)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,n=this._bindings[i];n!==void 0&&n.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let n=this._targetGroup.nCachedObjects_,s=i.length;n!==s;++n)i[n].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},xt=class r{constructor(e,t,i){this.path=t,this.parsedPath=i||r.parseTrackName(t),this.node=r.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new r.Composite(e,t,i):new r(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(s_,"")}static parseTrackName(e){let t=u_.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},n=i.nodeName&&i.nodeName.lastIndexOf(".");if(n!==void 0&&n!==-1){let s=i.nodeName.substring(n+1);h_.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,n),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},n=i(e.children);if(n)return n}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)e[t++]=i[n]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,n=t.propertyName,s=t.propertyIndex;if(e||(e=r.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let d=0;d<e.length;d++)if(e[d].name===c){c=d;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[n];if(a===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+n+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(n==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=n;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};xt.Composite=Fc;xt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};xt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};xt.prototype.GetterByBindingType=[xt.prototype._getValue_direct,xt.prototype._getValue_array,xt.prototype._getValue_arrayElement,xt.prototype._getValue_toArray];xt.prototype.SetterByBindingTypeAndVersioning=[[xt.prototype._setValue_direct,xt.prototype._setValue_direct_setNeedsUpdate,xt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_array,xt.prototype._setValue_array_setNeedsUpdate,xt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_arrayElement,xt.prototype._setValue_arrayElement_setNeedsUpdate,xt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_fromArray,xt.prototype._setValue_fromArray_setNeedsUpdate,xt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:al}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=al);var p_=Object.freeze(Object.defineProperty({__proto__:null,ACESFilmicToneMapping:Ed,AddEquation:Pr,AddOperation:lp,AdditiveBlending:gc,AgXToneMapping:pp,AlphaFormat:Id,AlwaysCompare:Ap,AlwaysDepth:za,AlwaysStencilFunc:wc,AmbientLight:Jo,AnimationClip:qo,ArrayCamera:Po,AttachedBindMode:_c,BackSide:Yt,BasicDepthPacking:xp,Bone:zs,BooleanKeyframeTrack:gr,Box3:Si,BoxGeometry:ln,BufferAttribute:zt,BufferGeometry:Oi,ByteType:Cd,Cache:ur,Camera:ks,CineonToneMapping:up,ClampToEdgeWrapping:dr,Clock:el,Color:Be,ColorKeyframeTrack:Ws,ColorManagement:it,ConstantAlphaFactor:sp,ConstantColorFactor:rp,CubeCamera:Ao,CubeReflectionMapping:tn,CubeRefractionMapping:rn,CubeTexture:Os,CubeUVReflectionMapping:Js,CubicInterpolant:Go,CullFaceBack:fc,CullFaceFront:zh,CullFaceNone:Hh,CustomBlending:Gh,CustomToneMapping:hp,Data3DTexture:Eo,DataArrayTexture:Is,DataTexture:Vs,DefaultLoadingManager:zp,DepthFormat:Qr,DepthStencilFormat:an,DepthTexture:Bs,DetachedBindMode:fp,DirectionalLight:Xs,DiscreteInterpolant:Wo,DoubleSide:Ci,DstAlphaFactor:Jh,DstColorFactor:ep,EqualCompare:wp,EqualDepth:Ga,EquirectangularReflectionMapping:qa,EquirectangularRefractionMapping:Xa,Euler:ki,EventDispatcher:fr,FileLoader:js,Float32BufferAttribute:bi,FloatType:yi,FrontSide:qi,Frustum:$n,GLSL3:Mc,GreaterCompare:Mp,GreaterDepth:Wa,GreaterEqualCompare:Ep,GreaterEqualDepth:$a,Group:Ii,HalfFloatType:Jn,ImageBitmapLoader:Qo,ImageLoader:Yo,ImageUtils:Mo,InstancedBufferAttribute:qn,InstancedMesh:Oo,IntType:ol,InterleavedBuffer:Do,InterleavedBufferAttribute:Uo,Interpolant:Or,InterpolateDiscrete:Hn,InterpolateLinear:zn,InterpolateSmooth:ka,KeepStencilOp:Xr,KeyframeTrack:fi,Layers:Ds,LessCompare:Sp,LessDepth:Va,LessEqualCompare:Hd,LessEqualDepth:en,Light:cn,Line:Xn,LineBasicMaterial:Gs,LineLoop:zo,LineSegments:Ho,LinearFilter:si,LinearInterpolant:$o,LinearMipmapLinearFilter:Wi,LinearMipmapNearestFilter:xs,LinearSRGBColorSpace:Zt,LinearToneMapping:cp,LinearTransfer:Qs,Loader:br,LoaderUtils:Dr,LoadingManager:Xo,LuminanceAlphaFormat:Nd,LuminanceFormat:Ud,Material:hi,MathUtils:Rp,Matrix3:$e,Matrix4:je,MaxEquation:qh,Mesh:ut,MeshBasicMaterial:Pi,MeshDepthMaterial:Co,MeshDistanceMaterial:Lo,MeshPhysicalMaterial:mi,MeshStandardMaterial:kr,MinEquation:jh,MirroredRepeatWrapping:Rs,MixOperation:op,MultiplyBlending:xc,MultiplyOperation:Td,NearestFilter:Kt,NearestMipmapLinearFilter:Un,NearestMipmapNearestFilter:Rd,NeutralToneMapping:mp,NeverCompare:bp,NeverDepth:Ha,NoBlending:hr,NoColorSpace:cr,NoToneMapping:pr,NormalAnimationBlendMode:gp,NormalBlending:Jr,NotEqualCompare:Tp,NotEqualDepth:ja,NumberKeyframeTrack:vr,Object3D:Tt,ObjectSpaceNormalMap:yp,OneFactor:Yh,OneMinusConstantAlphaFactor:ap,OneMinusConstantColorFactor:np,OneMinusDstAlphaFactor:Qh,OneMinusDstColorFactor:tp,OneMinusSrcAlphaFactor:Ba,OneMinusSrcColorFactor:Zh,OrthographicCamera:Wn,PCFShadowMap:Md,PCFSoftShadowMap:Vh,PMREMGenerator:jn,PerspectiveCamera:Ht,Plane:Gi,PlaneGeometry:Fs,PointLight:dn,Points:Vo,PointsMaterial:$s,PropertyBinding:xt,Quaternion:Ni,QuaternionKeyframeTrack:xr,QuaternionLinearInterpolant:jo,RED_GREEN_RGTC2_Format:yo,RED_RGTC1_Format:Od,REVISION:al,RGBADepthPacking:_p,RGBAFormat:ui,RGBAIntegerFormat:pl,RGBA_ASTC_10x10_Format:mo,RGBA_ASTC_10x5_Format:uo,RGBA_ASTC_10x6_Format:ho,RGBA_ASTC_10x8_Format:po,RGBA_ASTC_12x10_Format:fo,RGBA_ASTC_12x12_Format:go,RGBA_ASTC_4x4_Format:io,RGBA_ASTC_5x4_Format:ro,RGBA_ASTC_5x5_Format:no,RGBA_ASTC_6x5_Format:so,RGBA_ASTC_6x6_Format:ao,RGBA_ASTC_8x5_Format:oo,RGBA_ASTC_8x6_Format:lo,RGBA_ASTC_8x8_Format:co,RGBA_BPTC_Format:ws,RGBA_ETC2_EAC_Format:to,RGBA_PVRTC_2BPPV1_Format:Ja,RGBA_PVRTC_4BPPV1_Format:Za,RGBA_S3TC_DXT1_Format:ys,RGBA_S3TC_DXT3_Format:bs,RGBA_S3TC_DXT5_Format:Ss,RGBFormat:Dd,RGB_BPTC_SIGNED_Format:vo,RGB_BPTC_UNSIGNED_Format:xo,RGB_ETC1_Format:Qa,RGB_ETC2_Format:eo,RGB_PVRTC_2BPPV1_Format:Ka,RGB_PVRTC_4BPPV1_Format:Ya,RGB_S3TC_DXT1_Format:_s,RGFormat:kd,RGIntegerFormat:hl,Ray:on,RedFormat:dl,RedIntegerFormat:ul,ReinhardToneMapping:dp,RenderTarget:To,RepeatWrapping:nn,ReverseSubtractEquation:Wh,SIGNED_RED_GREEN_RGTC2_Format:bo,SIGNED_RED_RGTC1_Format:_o,SRGBColorSpace:Bt,SRGBTransfer:ct,Scene:Hs,ShaderChunk:We,ShaderLib:Ri,ShaderMaterial:Fi,ShortType:Ld,Skeleton:ko,SkinnedMesh:No,Source:Ps,Sphere:pi,SpotLight:Zo,SrcAlphaFactor:Fa,SrcAlphaSaturateFactor:ip,SrcColorFactor:Kh,StaticDrawUsage:wo,StringKeyframeTrack:_r,SubtractEquation:$h,SubtractiveBlending:vc,TangentSpaceNormalMap:Bd,Texture:Vt,TextureLoader:Ko,Triangle:Ir,TriangleFanDrawMode:So,TriangleStripDrawMode:Fd,TrianglesDrawMode:vp,UVMapping:Ad,Uint16BufferAttribute:Us,Uint32BufferAttribute:Ns,UniformsLib:he,UniformsUtils:Dp,UnsignedByteType:Xi,UnsignedInt248Type:sn,UnsignedInt5999Type:Pd,UnsignedIntType:Nr,UnsignedShort4444Type:ll,UnsignedShort5551Type:cl,UnsignedShortType:Bn,VSMShadowMap:Vi,Vector2:nt,Vector3:z,Vector4:at,VectorKeyframeTrack:yr,WebGLCoordinateSystem:ji,WebGLCubeRenderTarget:Ro,WebGLRenderTarget:Yi,WebGLRenderer:Io,WebGLUtils:Bp,WebGPUCoordinateSystem:Cs,WrapAroundEnding:Sc,ZeroCurvatureEnding:yc,ZeroFactor:Xh,ZeroSlopeEnding:bc,createCanvasElement:Lp},Symbol.toStringTag,{value:"Module"})),ic=["viseme_sil","viseme_PP","viseme_FF","viseme_TH","viseme_DD","viseme_kk","viseme_CH","viseme_SS","viseme_nn","viseme_RR","viseme_aa","viseme_E","viseme_I","viseme_O","viseme_U"];async function m_(r,e,t,i={}){let n=(await new e().loadAsync(t)).scene,s=[];n.traverse(U=>{U.isMesh&&U.morphTargetDictionary&&s.push(U)});let a=null,o=0,l=0;n.traverse(U=>{!a&&U.isBone&&/head/i.test(U.name)&&(a=U,o=U.rotation.x,l=U.rotation.y)});let c=new r.Group,d=new r.Group;d.add(n),c.add(d),n.updateMatrixWorld(!0);let u=new r.Box3().setFromObject(n),h=Math.max(u.getSize(new r.Vector3).y,.001)/7.5,p=new r.Vector3;a?(a.getWorldPosition(p),p.y+=h*.35):u.getCenter(p);let g=1/h;d.scale.setScalar(g),d.position.set(-p.x*g,-p.y*g,-p.z*g);let v=(i.faceYawDeg??0)*(Math.PI/180),m={};for(let U of ic)m[U]=0;let f=-1,M=1.5,w=0,_=-1,D={x:0,y:0},A=2,R=0,T=0;function b(){for(let L of ic)m[L]=0;R=0;let U=ke.frame();if(T=U.speaking?U.level:0,!U.speaking||!U.viseme)return;let G=Math.min(1,.6+U.level*.8),W=(L,P)=>{if(!L||L==="viseme_sil"||P<=0)return;let B=eu[L]??.6;m[L]=Math.max(m[L]||0,B*P*G),R=Math.max(R,(tu[L]||0)*P*G)};W(U.viseme.name,U.viseme.weight),U.prev&&W(U.prev.name,U.prev.weight*.85)}function x(U,G){b();let W=1-Math.exp(-U*32),L=1-Math.exp(-U*16);for(let B of s){let H=B.morphTargetDictionary,Z=B.morphTargetInfluences;for(let de of ic){let me=H[de];if(me===void 0)continue;let ue=de==="viseme_sil"?0:m[de]||0;Z[me]+=(ue-Z[me])*(ue>Z[me]?W:L)}let ne=H.jawOpen;ne!==void 0&&(Z[ne]+=(R-Z[ne])*(R>Z[ne]?W:L))}if(f<0&&G>M&&(f=0),f>=0){f+=U;let B=f/.16;w=B<1?Math.sin(B*Math.PI):0,B>=1&&(f=-1,w=0,M=G+1.8+Math.random()*3.4)}for(let B of s){let H=B.morphTargetDictionary,Z=B.morphTargetInfluences;for(let ne of["eyeBlinkLeft","eyeBlinkRight","eyesClosed"]){let de=H[ne];de!==void 0&&(Z[de]+=(w-Z[de])*Math.min(1,U*30))}}c.position.y=Math.sin(G*1.25)*.008,c.rotation.y=v+Math.sin(G*.22)*.035,G>A&&(D.x=(Math.random()-.5)*.22,D.y=(Math.random()-.5)*.12,A=G+2.5+Math.random()*4);let P=D.y+T*.035;_>=0&&(_+=U,_>=.85?_=-1:P+=Math.sin(_/.85*Math.PI*2)*.2),a&&(a.rotation.y+=(l+D.x-a.rotation.y)*Math.min(1,U*3),a.rotation.x+=(o+P-a.rotation.x)*Math.min(1,U*6))}function C(){n.traverse(U=>{if(U.isMesh){U.geometry&&U.geometry.dispose();let G=Array.isArray(U.material)?U.material:[U.material];for(let W of G)if(W){for(let L of Object.keys(W)){let P=W[L];P&&P.isTexture&&P.dispose()}W.dispose()}}}),c.removeFromParent()}return{group:c,nod(){_<0&&(_=0)},update:x,dispose:C}}function yh(r,e){if(e===vp)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),r;if(e===So||e===Fd){let t=r.getIndex();if(t===null){let a=[],o=r.getAttribute("position");if(o!==void 0){for(let l=0;l<o.count;l++)a.push(l);r.setIndex(a),t=r.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),r}let i=t.count-2,n=[];if(e===So)for(let a=1;a<=i;a++)n.push(t.getX(0)),n.push(t.getX(a)),n.push(t.getX(a+1));else for(let a=0;a<i;a++)a%2===0?(n.push(t.getX(a)),n.push(t.getX(a+1)),n.push(t.getX(a+2))):(n.push(t.getX(a+2)),n.push(t.getX(a+1)),n.push(t.getX(a)));n.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let s=r.clone();return s.setIndex(n),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),r}var Bc=class extends br{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Gc(t)}),this.register(function(t){return new $c(t)}),this.register(function(t){return new Qc(t)}),this.register(function(t){return new ed(t)}),this.register(function(t){return new td(t)}),this.register(function(t){return new jc(t)}),this.register(function(t){return new qc(t)}),this.register(function(t){return new Xc(t)}),this.register(function(t){return new Yc(t)}),this.register(function(t){return new Vc(t)}),this.register(function(t){return new Kc(t)}),this.register(function(t){return new Wc(t)}),this.register(function(t){return new Jc(t)}),this.register(function(t){return new Zc(t)}),this.register(function(t){return new Hc(t)}),this.register(function(t){return new id(t)}),this.register(function(t){return new rd(t)})}load(e,t,i,n){let s=this,a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){let c=Dr.extractUrlBase(e);a=Dr.resolveURL(c,this.path)}else a=Dr.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){n?n(c):console.error(c),s.manager.itemError(e),s.manager.itemEnd(e)},l=new js(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{s.parse(c,a,function(d){t(d),s.manager.itemEnd(e)},o)}catch(d){o(d)}},i,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,n){let s,a={},o={},l=new TextDecoder;if(typeof e=="string")s=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===Vp){try{a[Ze.KHR_BINARY_GLTF]=new nd(e)}catch(d){n&&n(d);return}s=JSON.parse(a[Ze.KHR_BINARY_GLTF].content)}else s=JSON.parse(l.decode(e));else s=e;if(s.asset===void 0||s.asset.version[0]<2){n&&n(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new ud(s,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let d=0;d<this.pluginCallbacks.length;d++){let u=this.pluginCallbacks[d](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,a[u.name]=!0}if(s.extensionsUsed)for(let d=0;d<s.extensionsUsed.length;++d){let u=s.extensionsUsed[d],h=s.extensionsRequired||[];switch(u){case Ze.KHR_MATERIALS_UNLIT:a[u]=new zc;break;case Ze.KHR_DRACO_MESH_COMPRESSION:a[u]=new sd(s,this.dracoLoader);break;case Ze.KHR_TEXTURE_TRANSFORM:a[u]=new ad;break;case Ze.KHR_MESH_QUANTIZATION:a[u]=new od;break;default:h.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(a),c.setPlugins(o),c.parse(i,n)}parseAsync(e,t){let i=this;return new Promise(function(n,s){i.parse(e,t,n,s)})}};function f_(){let r={};return{get:function(e){return r[e]},add:function(e,t){r[e]=t},remove:function(e){delete r[e]},removeAll:function(){r={}}}}var Ze={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Hc=class{constructor(e){this.parser=e,this.name=Ze.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let i=0,n=t.length;i<n;i++){let s=t[i];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(e){let t=this.parser,i="light:"+e,n=t.cache.get(i);if(n)return n;let s=t.json,a=((s.extensions&&s.extensions[this.name]||{}).lights||[])[e],o,l=new Be(16777215);a.color!==void 0&&l.setRGB(a.color[0],a.color[1],a.color[2],Zt);let c=a.range!==void 0?a.range:0;switch(a.type){case"directional":o=new Xs(l),o.target.position.set(0,0,-1),o.add(o.target);break;case"point":o=new dn(l),o.distance=c;break;case"spot":o=new Zo(l),o.distance=c,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,o.angle=a.spot.outerConeAngle,o.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,o.target.position.set(0,0,-1),o.add(o.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return o.position.set(0,0,0),o.decay=2,lr(o,a),a.intensity!==void 0&&(o.intensity=a.intensity),o.name=t.createUniqueName(a.name||"light_"+e),n=Promise.resolve(o),t.cache.add(i,n),n}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,i=this.parser,n=i.json.nodes[e],s=(n.extensions&&n.extensions[this.name]||{}).light;return s===void 0?null:this._loadLight(s).then(function(a){return i._getNodeRef(t.cache,s,a)})}},zc=class{constructor(){this.name=Ze.KHR_MATERIALS_UNLIT}getMaterialType(){return Pi}extendParams(e,t,i){let n=[];e.color=new Be(1,1,1),e.opacity=1;let s=t.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){let a=s.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],Zt),e.opacity=a[3]}s.baseColorTexture!==void 0&&n.push(i.assignTexture(e,"map",s.baseColorTexture,Bt))}return Promise.all(n)}},Vc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let n=i.extensions[this.name].emissiveStrength;return n!==void 0&&(t.emissiveIntensity=n),Promise.resolve()}},Gc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];if(a.clearcoatFactor!==void 0&&(t.clearcoat=a.clearcoatFactor),a.clearcoatTexture!==void 0&&s.push(i.assignTexture(t,"clearcoatMap",a.clearcoatTexture)),a.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=a.clearcoatRoughnessFactor),a.clearcoatRoughnessTexture!==void 0&&s.push(i.assignTexture(t,"clearcoatRoughnessMap",a.clearcoatRoughnessTexture)),a.clearcoatNormalTexture!==void 0&&(s.push(i.assignTexture(t,"clearcoatNormalMap",a.clearcoatNormalTexture)),a.clearcoatNormalTexture.scale!==void 0)){let o=a.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new nt(o,o)}return Promise.all(s)}},$c=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_DISPERSION}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let n=i.extensions[this.name];return t.dispersion=n.dispersion!==void 0?n.dispersion:0,Promise.resolve()}},Wc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];return a.iridescenceFactor!==void 0&&(t.iridescence=a.iridescenceFactor),a.iridescenceTexture!==void 0&&s.push(i.assignTexture(t,"iridescenceMap",a.iridescenceTexture)),a.iridescenceIor!==void 0&&(t.iridescenceIOR=a.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),a.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=a.iridescenceThicknessMinimum),a.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=a.iridescenceThicknessMaximum),a.iridescenceThicknessTexture!==void 0&&s.push(i.assignTexture(t,"iridescenceThicknessMap",a.iridescenceThicknessTexture)),Promise.all(s)}},jc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_SHEEN}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[];t.sheenColor=new Be(0,0,0),t.sheenRoughness=0,t.sheen=1;let a=n.extensions[this.name];if(a.sheenColorFactor!==void 0){let o=a.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],Zt)}return a.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=a.sheenRoughnessFactor),a.sheenColorTexture!==void 0&&s.push(i.assignTexture(t,"sheenColorMap",a.sheenColorTexture,Bt)),a.sheenRoughnessTexture!==void 0&&s.push(i.assignTexture(t,"sheenRoughnessMap",a.sheenRoughnessTexture)),Promise.all(s)}},qc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];return a.transmissionFactor!==void 0&&(t.transmission=a.transmissionFactor),a.transmissionTexture!==void 0&&s.push(i.assignTexture(t,"transmissionMap",a.transmissionTexture)),Promise.all(s)}},Xc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_VOLUME}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];t.thickness=a.thicknessFactor!==void 0?a.thicknessFactor:0,a.thicknessTexture!==void 0&&s.push(i.assignTexture(t,"thicknessMap",a.thicknessTexture)),t.attenuationDistance=a.attenuationDistance||1/0;let o=a.attenuationColor||[1,1,1];return t.attenuationColor=new Be().setRGB(o[0],o[1],o[2],Zt),Promise.all(s)}},Yc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_IOR}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let n=i.extensions[this.name];return t.ior=n.ior!==void 0?n.ior:1.5,Promise.resolve()}},Kc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_SPECULAR}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];t.specularIntensity=a.specularFactor!==void 0?a.specularFactor:1,a.specularTexture!==void 0&&s.push(i.assignTexture(t,"specularIntensityMap",a.specularTexture));let o=a.specularColorFactor||[1,1,1];return t.specularColor=new Be().setRGB(o[0],o[1],o[2],Zt),a.specularColorTexture!==void 0&&s.push(i.assignTexture(t,"specularColorMap",a.specularColorTexture,Bt)),Promise.all(s)}},Zc=class{constructor(e){this.parser=e,this.name=Ze.EXT_MATERIALS_BUMP}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];return t.bumpScale=a.bumpFactor!==void 0?a.bumpFactor:1,a.bumpTexture!==void 0&&s.push(i.assignTexture(t,"bumpMap",a.bumpTexture)),Promise.all(s)}},Jc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:mi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];return a.anisotropyStrength!==void 0&&(t.anisotropy=a.anisotropyStrength),a.anisotropyRotation!==void 0&&(t.anisotropyRotation=a.anisotropyRotation),a.anisotropyTexture!==void 0&&s.push(i.assignTexture(t,"anisotropyMap",a.anisotropyTexture)),Promise.all(s)}},Qc=class{constructor(e){this.parser=e,this.name=Ze.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,i=t.json,n=i.textures[e];if(!n.extensions||!n.extensions[this.name])return null;let s=n.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,s.source,a)}},ed=class{constructor(e){this.parser=e,this.name=Ze.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){let t=this.name,i=this.parser,n=i.json,s=n.textures[e];if(!s.extensions||!s.extensions[t])return null;let a=s.extensions[t],o=n.images[a.source],l=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return i.loadTextureImage(e,a.source,l);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return i.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},td=class{constructor(e){this.parser=e,this.name=Ze.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){let t=this.name,i=this.parser,n=i.json,s=n.textures[e];if(!s.extensions||!s.extensions[t])return null;let a=s.extensions[t],o=n.images[a.source],l=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return i.loadTextureImage(e,a.source,l);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return i.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},id=class{constructor(e){this.name=Ze.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){let n=i.extensions[this.name],s=this.parser.getDependency("buffer",n.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(o){let l=n.byteOffset||0,c=n.byteLength||0,d=n.count,u=n.byteStride,h=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(d,u,h,n.mode,n.filter).then(function(p){return p.buffer}):a.ready.then(function(){let p=new ArrayBuffer(d*u);return a.decodeGltfBuffer(new Uint8Array(p),d,u,h,n.mode,n.filter),p})})}else return null}},rd=class{constructor(e){this.name=Ze.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;let n=t.meshes[i.mesh];for(let l of n.primitives)if(l.mode!==_i.TRIANGLES&&l.mode!==_i.TRIANGLE_STRIP&&l.mode!==_i.TRIANGLE_FAN&&l.mode!==void 0)return null;let s=i.extensions[this.name].attributes,a=[],o={};for(let l in s)a.push(this.parser.getDependency("accessor",s[l]).then(c=>(o[l]=c,o[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{let c=l.pop(),d=c.isGroup?c.children:[c],u=l[0].count,h=[];for(let p of d){let g=new je,v=new z,m=new Ni,f=new z(1,1,1),M=new Oo(p.geometry,p.material,u);for(let w=0;w<u;w++)o.TRANSLATION&&v.fromBufferAttribute(o.TRANSLATION,w),o.ROTATION&&m.fromBufferAttribute(o.ROTATION,w),o.SCALE&&f.fromBufferAttribute(o.SCALE,w),M.setMatrixAt(w,g.compose(v,m,f));for(let w in o)if(w==="_COLOR_0"){let _=o[w];M.instanceColor=new qn(_.array,_.itemSize,_.normalized)}else w!=="TRANSLATION"&&w!=="ROTATION"&&w!=="SCALE"&&p.geometry.setAttribute(w,o[w]);Tt.prototype.copy.call(M,p),this.parser.assignFinalMaterial(M),h.push(M)}return c.isGroup?(c.clear(),c.add(...h),c):h[0]}))}},Vp="glTF",ps=12,bh={JSON:1313821514,BIN:5130562},nd=class{constructor(e){this.name=Ze.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,ps),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Vp)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let n=this.header.length-ps,s=new DataView(e,ps),a=0;for(;a<n;){let o=s.getUint32(a,!0);a+=4;let l=s.getUint32(a,!0);if(a+=4,l===bh.JSON){let c=new Uint8Array(e,ps+a,o);this.content=i.decode(c)}else if(l===bh.BIN){let c=ps+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},sd=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Ze.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let i=this.json,n=this.dracoLoader,s=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(let d in a){let u=cd[d]||d.toLowerCase();o[u]=a[d]}for(let d in e.attributes){let u=cd[d]||d.toLowerCase();if(a[d]!==void 0){let h=i.accessors[e.attributes[d]],p=Fn[h.componentType];c[u]=p.name,l[u]=h.normalized===!0}}return t.getDependency("bufferView",s).then(function(d){return new Promise(function(u,h){n.decodeDracoFile(d,function(p){for(let g in p.attributes){let v=p.attributes[g],m=l[g];m!==void 0&&(v.normalized=m)}u(p)},o,c,Zt,h)})})}},ad=class{constructor(){this.name=Ze.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},od=class{constructor(){this.name=Ze.KHR_MESH_QUANTIZATION}},tl=class extends Or{constructor(e,t,i,n){super(e,t,i,n)}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,n=this.valueSize,s=e*n*3+n;for(let a=0;a!==n;a++)t[a]=i[s+a];return t}interpolate_(e,t,i,n){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,d=n-t,u=(i-t)/d,h=u*u,p=h*u,g=e*c,v=g-c,m=-2*p+3*h,f=p-h,M=1-m,w=f-h+u;for(let _=0;_!==o;_++){let D=a[v+_+o],A=a[v+_+l]*d,R=a[g+_+o],T=a[g+_]*d;s[_]=M*D+w*A+m*R+f*T}return s}},g_=new Ni,ld=class extends tl{interpolate_(e,t,i,n){let s=super.interpolate_(e,t,i,n);return g_.fromArray(s).normalize().toArray(s),s}},_i={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Fn={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Sh={9728:Kt,9729:si,9984:Rd,9985:xs,9986:Un,9987:Wi},wh={33071:dr,33648:Rs,10497:nn},rc={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},cd={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Lr={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},v_={CUBICSPLINE:void 0,LINEAR:zn,STEP:Hn},nc={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function x_(r){return r.DefaultMaterial===void 0&&(r.DefaultMaterial=new kr({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:qi})),r.DefaultMaterial}function qr(r,e,t){for(let i in t.extensions)r[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function lr(r,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(r.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function __(r,e,t){let i=!1,n=!1,s=!1;for(let c=0,d=e.length;c<d;c++){let u=e[c];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(n=!0),u.COLOR_0!==void 0&&(s=!0),i&&n&&s)break}if(!i&&!n&&!s)return Promise.resolve(r);let a=[],o=[],l=[];for(let c=0,d=e.length;c<d;c++){let u=e[c];if(i){let h=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):r.attributes.position;a.push(h)}if(n){let h=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):r.attributes.normal;o.push(h)}if(s){let h=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):r.attributes.color;l.push(h)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l)]).then(function(c){let d=c[0],u=c[1],h=c[2];return i&&(r.morphAttributes.position=d),n&&(r.morphAttributes.normal=u),s&&(r.morphAttributes.color=h),r.morphTargetsRelative=!0,r})}function y_(r,e){if(r.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)r.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(r.morphTargetInfluences.length===t.length){r.morphTargetDictionary={};for(let i=0,n=t.length;i<n;i++)r.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function b_(r){let e,t=r.extensions&&r.extensions[Ze.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+sc(t.attributes):e=r.indices+":"+sc(r.attributes)+":"+r.mode,r.targets!==void 0)for(let i=0,n=r.targets.length;i<n;i++)e+=":"+sc(r.targets[i]);return e}function sc(r){let e="",t=Object.keys(r).sort();for(let i=0,n=t.length;i<n;i++)e+=t[i]+":"+r[t[i]]+";";return e}function dd(r){switch(r){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function S_(r){return r.search(/\.jpe?g($|\?)/i)>0||r.search(/^data\:image\/jpeg/)===0?"image/jpeg":r.search(/\.webp($|\?)/i)>0||r.search(/^data\:image\/webp/)===0?"image/webp":r.search(/\.ktx2($|\?)/i)>0||r.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var w_=new je,ud=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new f_,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,n=-1,s=!1,a=-1;if(typeof navigator<"u"){let o=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(o)===!0;let l=o.match(/Version\/(\d+)/);n=i&&l?parseInt(l[1],10):-1,s=o.indexOf("Firefox")>-1,a=s?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&n<17||s&&a<98?this.textureLoader=new Ko(this.options.manager):this.textureLoader=new Qo(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new js(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let i=this,n=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(a){let o={scene:a[0][n.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:n.asset,parser:i,userData:{}};return qr(s,o,n),lr(o,n),Promise.all(i._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(let l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let n=0,s=t.length;n<s;n++){let a=t[n].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let n=0,s=e.length;n<s;n++){let a=e[n];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(i[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;let n=i.clone(),s=(a,o)=>{let l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(let[c,d]of a.children.entries())s(d,o.children[c])};return s(i,n),n.name+="_instance_"+e.uses[t]++,n}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){let n=e(t[i]);if(n)return n}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let i=[];for(let n=0;n<t.length;n++){let s=e(t[n]);s&&i.push(s)}return i}getDependency(e,t){let i=e+":"+t,n=this.cache.get(i);if(!n){switch(e){case"scene":n=this.loadScene(t);break;case"node":n=this._invokeOne(function(s){return s.loadNode&&s.loadNode(t)});break;case"mesh":n=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(t)});break;case"accessor":n=this.loadAccessor(t);break;case"bufferView":n=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(t)});break;case"buffer":n=this.loadBuffer(t);break;case"material":n=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(t)});break;case"texture":n=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(t)});break;case"skin":n=this.loadSkin(t);break;case"animation":n=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(t)});break;case"camera":n=this.loadCamera(t);break;default:if(n=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(e,t)}),!n)throw new Error("Unknown type: "+e);break}this.cache.add(i,n)}return n}getDependencies(e){let t=this.cache.get(e);if(!t){let i=this,n=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(n.map(function(s,a){return i.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Ze.KHR_BINARY_GLTF].body);let n=this.options;return new Promise(function(s,a){i.load(Dr.resolveURL(t.uri,n.path),s,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){let n=t.byteLength||0,s=t.byteOffset||0;return i.slice(s,s+n)})}loadAccessor(e){let t=this,i=this.json,n=this.json.accessors[e];if(n.bufferView===void 0&&n.sparse===void 0){let a=rc[n.type],o=Fn[n.componentType],l=n.normalized===!0,c=new o(n.count*a);return Promise.resolve(new zt(c,a,l))}let s=[];return n.bufferView!==void 0?s.push(this.getDependency("bufferView",n.bufferView)):s.push(null),n.sparse!==void 0&&(s.push(this.getDependency("bufferView",n.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",n.sparse.values.bufferView))),Promise.all(s).then(function(a){let o=a[0],l=rc[n.type],c=Fn[n.componentType],d=c.BYTES_PER_ELEMENT,u=d*l,h=n.byteOffset||0,p=n.bufferView!==void 0?i.bufferViews[n.bufferView].byteStride:void 0,g=n.normalized===!0,v,m;if(p&&p!==u){let f=Math.floor(h/p),M="InterleavedBuffer:"+n.bufferView+":"+n.componentType+":"+f+":"+n.count,w=t.cache.get(M);w||(v=new c(o,f*p,n.count*p/d),w=new Do(v,p/d),t.cache.add(M,w)),m=new Uo(w,l,h%p/d,g)}else o===null?v=new c(n.count*l):v=new c(o,h,n.count*l),m=new zt(v,l,g);if(n.sparse!==void 0){let f=rc.SCALAR,M=Fn[n.sparse.indices.componentType],w=n.sparse.indices.byteOffset||0,_=n.sparse.values.byteOffset||0,D=new M(a[1],w,n.sparse.count*f),A=new c(a[2],_,n.sparse.count*l);o!==null&&(m=new zt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let R=0,T=D.length;R<T;R++){let b=D[R];if(m.setX(b,A[R*l]),l>=2&&m.setY(b,A[R*l+1]),l>=3&&m.setZ(b,A[R*l+2]),l>=4&&m.setW(b,A[R*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=g}return m})}loadTexture(e){let t=this.json,i=this.options,n=t.textures[e].source,s=t.images[n],a=this.textureLoader;if(s.uri){let o=i.manager.getHandler(s.uri);o!==null&&(a=o)}return this.loadTextureImage(e,n,a)}loadTextureImage(e,t,i){let n=this,s=this.json,a=s.textures[e],o=s.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];let c=this.loadImageSource(t,i).then(function(d){d.flipY=!1,d.name=a.name||o.name||"",d.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(d.name=o.uri);let u=(s.samplers||{})[a.sampler]||{};return d.magFilter=Sh[u.magFilter]||si,d.minFilter=Sh[u.minFilter]||Wi,d.wrapS=wh[u.wrapS]||nn,d.wrapT=wh[u.wrapT]||nn,d.generateMipmaps=!d.isCompressedTexture&&d.minFilter!==Kt&&d.minFilter!==si,n.associations.set(d,{textures:e}),d}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){let i=this,n=this.json,s=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let a=n.images[e],o=self.URL||self.webkitURL,l=a.uri||"",c=!1;if(a.bufferView!==void 0)l=i.getDependency("bufferView",a.bufferView).then(function(u){c=!0;let h=new Blob([u],{type:a.mimeType});return l=o.createObjectURL(h),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let d=Promise.resolve(l).then(function(u){return new Promise(function(h,p){let g=h;t.isImageBitmapLoader===!0&&(g=function(v){let m=new Vt(v);m.needsUpdate=!0,h(m)}),t.load(Dr.resolveURL(u,s.path),g,void 0,p)})}).then(function(u){return c===!0&&o.revokeObjectURL(l),lr(u,a),u.userData.mimeType=a.mimeType||S_(a.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[e]=d,d}assignTexture(e,t,i,n){let s=this;return this.getDependency("texture",i.index).then(function(a){if(!a)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(a=a.clone(),a.channel=i.texCoord),s.extensions[Ze.KHR_TEXTURE_TRANSFORM]){let o=i.extensions!==void 0?i.extensions[Ze.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let l=s.associations.get(a);a=s.extensions[Ze.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),s.associations.set(a,l)}}return n!==void 0&&(a.colorSpace=n),e[t]=a,a})}assignFinalMaterial(e){let t=e.geometry,i=e.material,n=t.attributes.tangent===void 0,s=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+i.uuid,l=this.cache.get(o);l||(l=new $s,hi.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,l.sizeAttenuation=!1,this.cache.add(o,l)),i=l}else if(e.isLine){let o="LineBasicMaterial:"+i.uuid,l=this.cache.get(o);l||(l=new Gs,hi.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,this.cache.add(o,l)),i=l}if(n||s||a){let o="ClonedMaterial:"+i.uuid+":";n&&(o+="derivative-tangents:"),s&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=i.clone(),s&&(l.vertexColors=!0),a&&(l.flatShading=!0),n&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(i))),i=l}e.material=i}getMaterialType(){return kr}loadMaterial(e){let t=this,i=this.json,n=this.extensions,s=i.materials[e],a,o={},l=s.extensions||{},c=[];if(l[Ze.KHR_MATERIALS_UNLIT]){let u=n[Ze.KHR_MATERIALS_UNLIT];a=u.getMaterialType(),c.push(u.extendParams(o,s,t))}else{let u=s.pbrMetallicRoughness||{};if(o.color=new Be(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let h=u.baseColorFactor;o.color.setRGB(h[0],h[1],h[2],Zt),o.opacity=h[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",u.baseColorTexture,Bt)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),a=this._invokeOne(function(h){return h.getMaterialType&&h.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(h){return h.extendMaterialParams&&h.extendMaterialParams(e,o)})))}s.doubleSided===!0&&(o.side=Ci);let d=s.alphaMode||nc.OPAQUE;if(d===nc.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,d===nc.MASK&&(o.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&a!==Pi&&(c.push(t.assignTexture(o,"normalMap",s.normalTexture)),o.normalScale=new nt(1,1),s.normalTexture.scale!==void 0)){let u=s.normalTexture.scale;o.normalScale.set(u,u)}if(s.occlusionTexture!==void 0&&a!==Pi&&(c.push(t.assignTexture(o,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&a!==Pi){let u=s.emissiveFactor;o.emissive=new Be().setRGB(u[0],u[1],u[2],Zt)}return s.emissiveTexture!==void 0&&a!==Pi&&c.push(t.assignTexture(o,"emissiveMap",s.emissiveTexture,Bt)),Promise.all(c).then(function(){let u=new a(o);return s.name&&(u.name=s.name),lr(u,s),t.associations.set(u,{materials:e}),s.extensions&&qr(n,u,s),u})}createUniqueName(e){let t=xt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,i=this.extensions,n=this.primitiveCache;function s(o){return i[Ze.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return Mh(l,o,t)})}let a=[];for(let o=0,l=e.length;o<l;o++){let c=e[o],d=b_(c),u=n[d];if(u)a.push(u.promise);else{let h;c.extensions&&c.extensions[Ze.KHR_DRACO_MESH_COMPRESSION]?h=s(c):h=Mh(new Oi,c,t),n[d]={primitive:c,promise:h},a.push(h)}}return Promise.all(a)}loadMesh(e){let t=this,i=this.json,n=this.extensions,s=i.meshes[e],a=s.primitives,o=[];for(let l=0,c=a.length;l<c;l++){let d=a[l].material===void 0?x_(this.cache):this.getDependency("material",a[l].material);o.push(d)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(l){let c=l.slice(0,l.length-1),d=l[l.length-1],u=[];for(let p=0,g=d.length;p<g;p++){let v=d[p],m=a[p],f,M=c[p];if(m.mode===_i.TRIANGLES||m.mode===_i.TRIANGLE_STRIP||m.mode===_i.TRIANGLE_FAN||m.mode===void 0)f=s.isSkinnedMesh===!0?new No(v,M):new ut(v,M),f.isSkinnedMesh===!0&&f.normalizeSkinWeights(),m.mode===_i.TRIANGLE_STRIP?f.geometry=yh(f.geometry,Fd):m.mode===_i.TRIANGLE_FAN&&(f.geometry=yh(f.geometry,So));else if(m.mode===_i.LINES)f=new Ho(v,M);else if(m.mode===_i.LINE_STRIP)f=new Xn(v,M);else if(m.mode===_i.LINE_LOOP)f=new zo(v,M);else if(m.mode===_i.POINTS)f=new Vo(v,M);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(f.geometry.morphAttributes).length>0&&y_(f,s),f.name=t.createUniqueName(s.name||"mesh_"+e),lr(f,s),m.extensions&&qr(n,f,m),t.assignFinalMaterial(f),u.push(f)}for(let p=0,g=u.length;p<g;p++)t.associations.set(u[p],{meshes:e,primitives:p});if(u.length===1)return s.extensions&&qr(n,u[0],s),u[0];let h=new Ii;s.extensions&&qr(n,h,s),t.associations.set(h,{meshes:e});for(let p=0,g=u.length;p<g;p++)h.add(u[p]);return h})}loadCamera(e){let t,i=this.json.cameras[e],n=i[i.type];if(!n){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new Ht(Rp.radToDeg(n.yfov),n.aspectRatio||1,n.znear||1,n.zfar||2e6):i.type==="orthographic"&&(t=new Wn(-n.xmag,n.xmag,n.ymag,-n.ymag,n.znear,n.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),lr(t,i),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],i=[];for(let n=0,s=t.joints.length;n<s;n++)i.push(this._loadNodeShallow(t.joints[n]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(n){let s=n.pop(),a=n,o=[],l=[];for(let c=0,d=a.length;c<d;c++){let u=a[c];if(u){o.push(u);let h=new je;s!==null&&h.fromArray(s.array,c*16),l.push(h)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new ko(o,l)})}loadAnimation(e){let t=this.json,i=this,n=t.animations[e],s=n.name?n.name:"animation_"+e,a=[],o=[],l=[],c=[],d=[];for(let u=0,h=n.channels.length;u<h;u++){let p=n.channels[u],g=n.samplers[p.sampler],v=p.target,m=v.node,f=n.parameters!==void 0?n.parameters[g.input]:g.input,M=n.parameters!==void 0?n.parameters[g.output]:g.output;v.node!==void 0&&(a.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",f)),l.push(this.getDependency("accessor",M)),c.push(g),d.push(v))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(d)]).then(function(u){let h=u[0],p=u[1],g=u[2],v=u[3],m=u[4],f=[];for(let M=0,w=h.length;M<w;M++){let _=h[M],D=p[M],A=g[M],R=v[M],T=m[M];if(_===void 0)continue;_.updateMatrix&&_.updateMatrix();let b=i._createAnimationTracks(_,D,A,R,T);if(b)for(let x=0;x<b.length;x++)f.push(b[x])}return new qo(s,void 0,f)})}createNodeMesh(e){let t=this.json,i=this,n=t.nodes[e];return n.mesh===void 0?null:i.getDependency("mesh",n.mesh).then(function(s){let a=i._getNodeRef(i.meshCache,n.mesh,s);return n.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=n.weights.length;l<c;l++)o.morphTargetInfluences[l]=n.weights[l]}),a})}loadNode(e){let t=this.json,i=this,n=t.nodes[e],s=i._loadNodeShallow(e),a=[],o=n.children||[];for(let c=0,d=o.length;c<d;c++)a.push(i.getDependency("node",o[c]));let l=n.skin===void 0?Promise.resolve(null):i.getDependency("skin",n.skin);return Promise.all([s,Promise.all(a),l]).then(function(c){let d=c[0],u=c[1],h=c[2];h!==null&&d.traverse(function(p){p.isSkinnedMesh&&p.bind(h,w_)});for(let p=0,g=u.length;p<g;p++)d.add(u[p]);return d})}_loadNodeShallow(e){let t=this.json,i=this.extensions,n=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let s=t.nodes[e],a=s.name?n.createUniqueName(s.name):"",o=[],l=n._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),s.camera!==void 0&&o.push(n.getDependency("camera",s.camera).then(function(c){return n._getNodeRef(n.cameraCache,s.camera,c)})),n._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let d;if(s.isBone===!0?d=new zs:c.length>1?d=new Ii:c.length===1?d=c[0]:d=new Tt,d!==c[0])for(let u=0,h=c.length;u<h;u++)d.add(c[u]);if(s.name&&(d.userData.name=s.name,d.name=a),lr(d,s),s.extensions&&qr(i,d,s),s.matrix!==void 0){let u=new je;u.fromArray(s.matrix),d.applyMatrix4(u)}else s.translation!==void 0&&d.position.fromArray(s.translation),s.rotation!==void 0&&d.quaternion.fromArray(s.rotation),s.scale!==void 0&&d.scale.fromArray(s.scale);return n.associations.has(d)||n.associations.set(d,{}),n.associations.get(d).nodes=e,d}),this.nodeCache[e]}loadScene(e){let t=this.extensions,i=this.json.scenes[e],n=this,s=new Ii;i.name&&(s.name=n.createUniqueName(i.name)),lr(s,i),i.extensions&&qr(t,s,i);let a=i.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(n.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let d=0,u=l.length;d<u;d++)s.add(l[d]);let c=d=>{let u=new Map;for(let[h,p]of n.associations)(h instanceof hi||h instanceof Vt)&&u.set(h,p);return d.traverse(h=>{let p=n.associations.get(h);p!=null&&u.set(h,p)}),u};return n.associations=c(s),s})}_createAnimationTracks(e,t,i,n,s){let a=[],o=e.name?e.name:e.uuid,l=[];Lr[s.path]===Lr.weights?e.traverse(function(h){h.morphTargetInfluences&&l.push(h.name?h.name:h.uuid)}):l.push(o);let c;switch(Lr[s.path]){case Lr.weights:c=vr;break;case Lr.rotation:c=xr;break;case Lr.position:case Lr.scale:c=yr;break;default:switch(i.itemSize){case 1:c=vr;break;case 2:case 3:default:c=yr;break}break}let d=n.interpolation!==void 0?v_[n.interpolation]:zn,u=this._getArrayFromAccessor(i);for(let h=0,p=l.length;h<p;h++){let g=new c(l[h]+"."+Lr[s.path],t.array,u,d);n.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),a.push(g)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let i=dd(t.constructor),n=new Float32Array(t.length);for(let s=0,a=t.length;s<a;s++)n[s]=t[s]*i;t=n}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(t){let i=this instanceof xr?ld:tl;return new i(this.times,this.values,this.getValueSize()/3,t)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function M_(r,e,t){let i=e.attributes,n=new Si;if(i.POSITION!==void 0){let o=t.json.accessors[i.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(n.set(new z(l[0],l[1],l[2]),new z(c[0],c[1],c[2])),o.normalized){let d=dd(Fn[o.componentType]);n.min.multiplyScalar(d),n.max.multiplyScalar(d)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let s=e.targets;if(s!==void 0){let o=new z,l=new z;for(let c=0,d=s.length;c<d;c++){let u=s[c];if(u.POSITION!==void 0){let h=t.json.accessors[u.POSITION],p=h.min,g=h.max;if(p!==void 0&&g!==void 0){if(l.setX(Math.max(Math.abs(p[0]),Math.abs(g[0]))),l.setY(Math.max(Math.abs(p[1]),Math.abs(g[1]))),l.setZ(Math.max(Math.abs(p[2]),Math.abs(g[2]))),h.normalized){let v=dd(Fn[h.componentType]);l.multiplyScalar(v)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}n.expandByVector(o)}r.boundingBox=n;let a=new pi;n.getCenter(a.center),a.radius=n.min.distanceTo(n.max)/2,r.boundingSphere=a}function Mh(r,e,t){let i=e.attributes,n=[];function s(a,o){return t.getDependency("accessor",a).then(function(l){r.setAttribute(o,l)})}for(let a in i){let o=cd[a]||a.toLowerCase();o in r.attributes||n.push(s(i[a],o))}if(e.indices!==void 0&&!r.index){let a=t.getDependency("accessor",e.indices).then(function(o){r.setIndex(o)});n.push(a)}return it.workingColorSpace!==Zt&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${it.workingColorSpace}" not supported.`),lr(r,e),M_(r,e,t),Promise.all(n).then(function(){return e.targets!==void 0?__(r,e.targets,t):r})}var hd=class extends Hs{constructor(){super();let e=new ln;e.deleteAttribute("uv");let t=new kr({side:Yt}),i=new kr,n=new dn(16777215,900,28,2);n.position.set(.418,16.199,.3),this.add(n);let s=new ut(e,t);s.position.set(-.757,13.219,.717),s.scale.set(31.713,28.305,28.591),this.add(s);let a=new ut(e,i);a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),this.add(a);let o=new ut(e,i);o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),this.add(o);let l=new ut(e,i);l.position.set(6.167,.857,7.803),l.rotation.set(0,.561,0),l.scale.set(3.927,6.285,3.687),this.add(l);let c=new ut(e,i);c.position.set(-2.017,.018,6.124),c.rotation.set(0,.333,0),c.scale.set(2.002,4.566,2.064),this.add(c);let d=new ut(e,i);d.position.set(2.291,-.756,-2.621),d.rotation.set(0,-.286,0),d.scale.set(1.546,1.552,1.496),this.add(d);let u=new ut(e,i);u.position.set(-2.193,-.369,-5.547),u.rotation.set(0,.516,0),u.scale.set(3.875,3.487,2.986),this.add(u);let h=new ut(e,In(50));h.position.set(-16.116,14.37,8.208),h.scale.set(.1,2.428,2.739),this.add(h);let p=new ut(e,In(50));p.position.set(-16.109,18.021,-8.207),p.scale.set(.1,2.425,2.751),this.add(p);let g=new ut(e,In(17));g.position.set(14.904,12.198,-1.832),g.scale.set(.15,4.265,6.331),this.add(g);let v=new ut(e,In(43));v.position.set(-.462,8.89,14.52),v.scale.set(4.38,5.441,.088),this.add(v);let m=new ut(e,In(20));m.position.set(3.235,11.486,-12.541),m.scale.set(2.5,2,.1),this.add(m);let f=new ut(e,In(100));f.position.set(0,20,0),f.scale.set(1,.1,1),this.add(f)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function In(r){let e=new Pi;return e.color.setScalar(r),e}var T_="/models/adversary-masc.glb",pd=class{constructor(e,t){this.canvas=e,this.ctx=e.getContext("2d"),this.disposed=!1,this.img=new Image,this.loaded=!1,this.level=0,this.speaking=!1,this.nodUntil=0,this.bars=Array(24).fill(0),this.startTime=performance.now(),this.img.src=`/img/figures/${t}.jpg`,this.img.onload=()=>{this.loaded=!0,this.resize()},this.resize=()=>{if(this.disposed)return;let i=Math.min(window.devicePixelRatio||1,2),n=this.canvas.clientWidth||340,s=this.canvas.clientHeight||260;(this.canvas.width!==Math.round(n*i)||this.canvas.height!==Math.round(s*i))&&(this.canvas.width=Math.round(n*i),this.canvas.height=Math.round(s*i))},this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(e),this.loop=()=>{this.disposed||(this.raf=requestAnimationFrame(this.loop),this.update(),this.render())},this.loop()}nod(){this.nodUntil=performance.now()+420}stop(){}dispose(){this.disposed=!0,cancelAnimationFrame(this.raf),this.ro?.disconnect()}update(){let e=ke.frame();this.speaking=e.speaking,this.level+=((e.speaking?e.level:0)-this.level)*.25;let t=(performance.now()-this.startTime)/1e3,i=this.bars.length;for(let n=0;n<i;n++){let s;if(e.speaking&&e.freq){let a=2+Math.floor(Math.pow(n/i,1.6)*90);s=Math.min(1,e.freq[a]/255*1.25)}else s=.06+Math.sin(t*2+n*.45)*.04;this.bars[n]+=(s-this.bars[n])*.35}}render(){let{ctx:e,canvas:t}=this;if(!e||!this.loaded)return;let i=t.width,n=t.height;e.clearRect(0,0,i,n);let s=this.img.width/this.img.height,a=n*.14,o=n-a*.4,l=o*s;l>i&&(l=i,o=i/s);let c=(i-l)/2,d=Math.max(0,(n-a*.4-o)/2);e.save(),e.filter="blur(22px) brightness(0.32)",e.drawImage(this.img,-i*.1,-n*.1,i*1.2,n*1.2),e.restore();let u=performance.now(),h=1+Math.sin(u*.0016)*.003+this.level*.004,p=u<this.nodUntil?Math.sin((this.nodUntil-u)/420*Math.PI)*.012:0;if(e.save(),e.translate(i/2,n/2),e.scale(h,h),e.rotate(p),e.translate(-i/2,-n/2),e.drawImage(this.img,c,d,l,o),e.restore(),c>4){let A=Math.min(40,c+10),R=e.createLinearGradient(c,0,c+A,0);R.addColorStop(0,"rgba(7,8,11,0.9)"),R.addColorStop(1,"rgba(7,8,11,0)"),e.fillStyle=R,e.fillRect(c-1,0,A,n),R=e.createLinearGradient(c+l-A,0,c+l,0),R.addColorStop(0,"rgba(7,8,11,0)"),R.addColorStop(1,"rgba(7,8,11,0.9)"),e.fillStyle=R,e.fillRect(c+l-A+1,0,A,n)}let g=e.createLinearGradient(0,n*.62,0,n);g.addColorStop(0,"rgba(7,8,11,0)"),g.addColorStop(1,"rgba(7,8,11,0.92)"),e.fillStyle=g,e.fillRect(0,n*.62,i,n*.38);let v=this.bars.length,m=Math.min(i*.6,320*(window.devicePixelRatio||1)),f=m/v,M=Math.max(2,f*.55),w=(i-m)/2,_=n-n*.05,D=a;for(let A=0;A<v;A++){let R=Math.max(.05,this.bars[A])*D;e.fillStyle=this.speaking?`rgba(255,${120+Math.round(this.bars[A]*90)},90,0.95)`:"rgba(148,163,184,0.45)",e.beginPath(),e.roundRect?e.roundRect(w+A*f,_-R,M,R,M/2):e.rect(w+A*f,_-R,M,R),e.fill()}}};function E_(r,e={}){return e.figureId?new pd(r,e.figureId):new md(r,e.personaVisual||void 0,e)}var md=class{constructor(e,t=T_,i={}){this.disposed=!1,this.human=null,this.clock=new el,this.onError=i.onError,this.loop=()=>{if(this.disposed)return;this.raf=requestAnimationFrame(this.loop);let n=Math.min(this.clock.getDelta(),.05);this.human?.update(n,this.clock.elapsedTime),this.renderer.render(this.scene,this.camera)},this.renderer=new Io({canvas:e,antialias:!0,alpha:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.setClearColor(0,0),this.renderer.toneMapping=Ed,this.renderer.toneMappingExposure=1.15,this.scene=new Hs,this.camera=new Ht(30,1,.1,100),this.root=new Ii,this.root.position.y=-.05,this.scene.add(this.root),this.buildLights(),this.ready=m_(p_,Bc,t).then(n=>{if(this.disposed)return n.dispose();this.human=n,this.root.add(n.group),e.dispatchEvent(new CustomEvent("avatar-ready"))}).catch(n=>{console.error("[avatar] failed to load model",t,n),this.onError?.(n)}),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(e),this.resize(),this.loop()}buildLights(){this.scene.add(new Jo(2303803,.75));let e=new Xs(16774634,2.8);e.position.set(2.2,3,3.6),this.scene.add(e);let t=new dn(9353445,40,25,1.4);t.position.set(-2.8,1.8,2.2),this.scene.add(t);let i=new dn(16316668,30,22,3.2);i.position.set(0,3.5,-2.8),this.scene.add(i);try{let n=new jn(this.renderer);this.scene.environment=n.fromScene(new hd,.04).texture,n.dispose()}catch{}}nod(){this.human?.nod()}stop(){}dispose(){this.disposed=!0,cancelAnimationFrame(this.raf),this.ro?.disconnect(),this.human?.dispose(),this.human=null,this.renderer.dispose(),this.renderer.forceContextLoss?.()}resize(){let e=this.renderer.domElement,t=e.clientWidth||1,i=e.clientHeight||1;this.renderer.setSize(t,i,!1),this.camera.aspect=t/i;let n=t/i<1,s=t/i>1.8,a=n?3.4:s?3.5:2.9,o=n?-.14:s?.02:-.04;this.camera.position.set(0,o+.06,a),this.camera.lookAt(0,o,0),this.camera.updateProjectionMatrix()}};function ze(r){return String(r??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Yn(r){return r==null?"\u2014":Number(r).toFixed(1).replace(/\.0$/,"")}function Ur({title:r,body:e="",actions:t=[]}){return new Promise(i=>{let n=document.activeElement,s=document.createElement("div");s.className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 pb-[calc(1rem+var(--safe-bottom))] backdrop-blur-sm animate-fade-in sm:items-center",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.setAttribute("aria-labelledby","ui-modal-title"),s.innerHTML=`<div class="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-ink-700 bg-ink-900 p-5 shadow-2xl animate-pop-in sm:p-6">
      <h3 id="ui-modal-title" class="text-display-sm text-white">${ze(r)}</h3>
      ${e?`<p class="mt-2 text-sm leading-relaxed text-slate-400">${e}</p>`:""}
      <div class="mt-5 flex flex-col gap-2.5 sm:mt-6">${t.map((c,d)=>`<button type="button" data-idx="${d}" class="${c.kind==="primary"?"btn-primary":c.kind==="danger"?"btn-danger":"btn-ghost"} w-full ${c.hint?"flex-col items-start gap-0.5 px-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5":"justify-center"} py-3"><span>${ze(c.label)}</span>${c.hint?`<span class="shrink-0 whitespace-nowrap text-xs font-medium opacity-70">${ze(c.hint)}</span>`:""}</button>`).join("")}</div></div>`;let a=c=>{document.removeEventListener("keydown",o),s.remove(),n?.isConnected&&n!==document.body&&!n.matches("textarea,input,[contenteditable]")&&n.focus({preventScroll:!0}),i(c)},o=c=>{if(c.key==="Escape")return a(null);if(c.key!=="Tab")return;let d=[...s.querySelectorAll("button")],u=d.indexOf(document.activeElement);(u<0||(c.shiftKey?u===0:u===d.length-1))&&(c.preventDefault(),d[c.shiftKey?d.length-1:0]?.focus())};document.addEventListener("keydown",o),s.addEventListener("click",c=>{if(c.target===s)return a(null);let d=c.target.closest("[data-idx]");d&&a(t[Number(d.dataset.idx)].value)}),document.body.appendChild(s);let l=[...s.querySelectorAll("button")];(l.find(c=>c.classList.contains("btn-primary"))||l.find(c=>!c.classList.contains("btn-danger"))||l[0])?.focus()})}var A_=new Set(["debate","historical"]),Gp={round:"Round",question:"Question",exchange:"Exchange",bars:"Round"};async function $p(r,e){r.innerHTML='<div class="mx-auto max-w-6xl px-4 py-6" id="session-root"><div class="py-16 text-center text-slate-500"><span class="spinner mr-2 align-[-3px]"></span>Loading your session\u2026</div></div>';let t=r.querySelector("#session-root"),i=await R_(e);if(t.isConnected){if(!i||i.error){let n=i?.error instanceof Lt?i.error.status:0;!i||n===404?t.innerHTML='<div class="py-16 text-center text-slate-400"><h1 class="mb-3 text-display-md text-white">Session not found</h1><p class="mb-6 text-sm">That session doesn\u2019t exist or was deleted.</p><a href="#/" class="btn-primary">Back to practice</a></div>':n===401?(Zs(null),location.hash=`#/login?next=${encodeURIComponent("/session/"+e)}`):t.replaceChildren(Kn("Couldn\u2019t load your session. Check your connection and try again.",()=>$p(r,e)));return}C_(t,e,i.meta,i.data)}}async function R_(r){let e=null;try{let c=sessionStorage.getItem(`adversaryai:session:${r}`);c&&(e=JSON.parse(c))}catch{}let t;try{t=await Dt(`/api/debates/${encodeURIComponent(r)}`)}catch(c){return console.error("Failed to load session",c),{error:c}}let i=t.debate;if(!i)return null;let n=i.setup&&typeof i.setup=="object"?i.setup:(()=>{try{return JSON.parse(i.setup_json||"{}")}catch{return{}}})(),s=null;try{s=(await Zn()).find(c=>c.id===i.mode)||null}catch{}let a=n.figureId||(i.mode==="historical"?i.personality:void 0),o=e?.personaVisual||Oh(n.personaVisual).model;return{meta:{modeId:i.mode||"debate",modeName:s?.name||e?.modeName||"Session",topic:i.topic,personaLabel:e?.personaLabel||i.personaLabel||s?.name||"Opponent",judgeEnabled:n.judge==="1",personaVisual:o,targetRounds:parseInt(n.targetRounds||"0",10)||0,resolvedFirstSpeaker:n.resolvedFirstSpeaker||"user",debateStyle:n.debateStyle||null,userSide:n.userSide||null,figureId:a||void 0,ended:!!i.ended_at,difficulty:n.difficulty||null,actingScript:i.mode==="acting"&&n.actingMode==="script"&&n.script?{script:n.script,role:n.scriptRole}:null},data:t}}function C_(r,e,t,i){let n=wd(t.modeId),s=Gp[n.unit]||"Round",a=A_.has(t.modeId),o=t.targetRounds||0;t.topic&&(document.title=`${t.topic} \xB7 AdversaryAI`),r.className="mx-auto w-full max-w-6xl px-4",r.innerHTML=`
    <div class="session-shell" id="session-shell">
      <aside class="session-aside shrink-0 pt-2 lg:pt-6">
        <div class="mb-2.5 hidden items-center justify-between gap-3 lg:flex">
          <div class="min-w-0">
            <p class="eyebrow truncate !tracking-[0.14em]">${ze(t.modeName)}</p>
            <h2 class="truncate text-lg font-bold leading-tight text-white">${ze(t.personaLabel)}</h2>
          </div>
          <span id="round-badge" class="badge border-accent-500/30 bg-accent-500/10 text-accent-300"></span>
        </div>
        <div class="avatar-stage-wrap session-stage border border-ink-700 shadow-card">
          <canvas id="avatar-canvas" class="avatar-canvas" aria-label="${ze(t.personaLabel)}"></canvas>
          <div id="avatar-loading" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500 ${t.figureId?"hidden":""}"><span class="spinner mr-2"></span>Loading ${ze(t.personaLabel)}\u2026</div>
          <div class="stage-tl">
            ${a?'<span id="phase-badge" class="badge absolute left-3 top-3 border-white/10 bg-black/60 text-slate-200 backdrop-blur"></span>':""}
            <span id="round-badge-m" class="badge border-white/10 bg-black/60 text-slate-200 backdrop-blur lg:hidden"></span>
            <span id="status-pill" class="badge absolute bottom-3 left-3 border-white/10 bg-black/60 text-slate-200 backdrop-blur"><span id="status-dot" class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span><span id="status-text">Ready</span></span>
            <span id="photo-badge" class="absolute right-3 top-3 hidden"></span>
          </div>
        </div>
        <div class="session-controls mt-2.5 flex items-center gap-2">
          <span class="stage-name flex min-w-0 flex-1 lg:hidden" aria-hidden="true"><span class="badge min-w-0 shrink"><span class="truncate">${ze(t.personaLabel)}</span></span></span>
          <button id="replay-btn" type="button" class="btn-ghost btn-sm h-11 w-11 px-0 sm:w-auto sm:px-3 lg:h-auto" disabled aria-label="Replay last reply">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg><span class="hidden sm:inline">Replay</span></button>
          <button id="stop-btn" type="button" class="btn-ghost btn-sm h-11 w-11 px-0 sm:w-auto sm:px-3 lg:h-auto" disabled aria-label="Stop audio">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg><span class="hidden sm:inline">Stop</span></button>
          <button id="size-btn" type="button" class="btn-ghost btn-sm h-11 w-11 px-0 lg:hidden" aria-pressed="false" aria-label="Show more of ${ze(t.personaLabel)}" title="Bigger / smaller"></button>
          ${t.actingScript?'<button id="cue-btn" type="button" class="btn-ghost btn-sm h-11 whitespace-nowrap lg:h-auto" title="Show your next line" aria-label="Show your next line">Line?</button>':""}
          <button id="view-btn" type="button" class="btn-ghost btn-sm hidden h-11 whitespace-nowrap lg:h-auto" title="Owner: switch between video and 3D"></button>
          <button id="end-btn" type="button" class="btn-danger btn-sm ml-auto h-11 shrink-0 whitespace-nowrap lg:h-auto">End &amp; grade</button>
        </div>
        <div id="upsell-slot" class="hidden"></div>
        <div id="photo-debug" class="mt-2.5 hidden items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs leading-relaxed text-amber-200 break-words"><span class="min-w-0 flex-1"></span><button type="button" class="-my-1 -mr-1 shrink-0 rounded px-1.5 py-1 text-amber-200/80 hover:text-amber-100" aria-label="Hide this message">\u2715</button></div>
      </aside>

      <section class="flex min-h-0 min-w-0 flex-1 flex-col pt-2 lg:pt-6">
        <div class="session-topic mb-1.5 shrink-0 sm:mb-2">
          <h1 id="session-topic" class="text-[15px] font-bold leading-snug text-white line-clamp-1 max-sm:cursor-pointer sm:text-lg sm:line-clamp-2 lg:text-xl" title="${ze(t.topic||"")}">${ze(t.topic||"Live session")}</h1>
          <div class="mt-1 flex flex-nowrap items-center gap-1.5 overflow-hidden sm:mt-1.5 sm:flex-wrap" id="meta-badges">
            ${t.debateStyle&&a?`<span class="meta-extra badge hidden border-ink-700 bg-ink-900 text-slate-400 sm:inline-flex">${ze((Fh.find(I=>I.v===t.debateStyle)||{}).t||t.debateStyle)}</span>`:""}
            ${t.userSide&&t.userSide!=="open"?`<span class="badge border-ink-700 bg-ink-900 text-slate-400">You argue ${t.userSide==="for"?"FOR":"AGAINST"}</span>`:""}
            ${t.difficulty?`<span class="meta-extra badge hidden border-ink-700 bg-ink-900 text-slate-400 sm:inline-flex">${Pm[t.difficulty]||""}</span>`:""}
            <span id="wallet-badge" class="badge hidden border-amber-500/30 bg-amber-500/10 text-amber-300"></span>
          </div>
        </div>
        <div id="banner-slot" class="shrink-0"></div>
        <div class="relative flex min-h-0 flex-1 flex-col">
          <div id="transcript" class="transcript-scroll relative min-h-0 flex-1 space-y-3 overflow-y-auto pb-2 pr-1"></div>
          <button id="jump-btn" type="button" hidden aria-label="Jump to latest" class="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-ink-600 bg-ink-800/95 px-3.5 py-2 text-xs font-semibold text-white shadow-lift backdrop-blur">\u2193 Latest</button>
        </div>
        <div id="sr-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>
        <div id="quota-slot" class="shrink-0"></div>
        ${t.actingScript?'<div id="cue-box" class="mb-1 hidden shrink-0 rounded-xl border border-accent-500/25 bg-accent-500/5 px-3.5 py-2.5 text-sm leading-relaxed text-slate-200"></div>':""}
        <div class="session-composer shrink-0 pt-1.5 sm:pt-2">
          <div class="flex items-end gap-2 rounded-2xl border border-ink-700 bg-ink-900 p-1.5 focus-within:border-accent-500/70 sm:p-2">
            <textarea id="msg-input" rows="1" maxlength="4000" class="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-snug text-white placeholder:text-slate-500 focus:outline-none" placeholder=""></textarea>
            <button id="mic-btn" type="button" class="icon-btn hidden h-11 w-11 [&>svg]:h-5 [&>svg]:w-5" aria-label="Speak your reply" title="Speak your reply">${Xe.mic}</button>
            <button id="send-btn" type="button" class="btn-primary h-11 shrink-0 px-4" aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg><span class="hidden sm:inline">Send</span></button>
          </div>
          <div class="composer-foot">
            <p id="mic-hint" class="mt-2 hidden text-xs text-slate-400"></p>
            <button id="hf-btn" type="button" class="mt-1.5 hidden text-xs text-slate-400 hover:text-slate-200" title="Mic turns on when it's your turn and sends when you pause"></button>
          </div>
        </div>
      </section>
    </div>`;let l=I=>r.querySelector(I),c=l("#transcript"),d=l("#msg-input"),u=l("#send-btn"),h=l("#mic-btn"),p=l("#mic-hint"),g=l("#replay-btn"),v=l("#stop-btn"),m=l("#end-btn"),f=l("#quota-slot"),M=l("#banner-slot"),w=l("#sr-live"),_=l("#jump-btn");l("#session-topic").addEventListener("click",I=>I.currentTarget.classList.toggle("line-clamp-1"));let D;try{D=E_(l("#avatar-canvas"),{figureId:t.figureId,personaVisual:t.personaVisual,onError:()=>{let I=l("#avatar-loading");I&&(I.innerHTML="Avatar unavailable \u2014 voice and text still work.")}})}catch(I){console.warn("[avatar] unavailable:",I?.message||I),D={dispose(){}};let Q=l("#avatar-loading");Q&&(Q.innerHTML="Avatar unavailable on this device \u2014 voice and text still work.")}l("#avatar-canvas").addEventListener("avatar-ready",()=>l("#avatar-loading")?.classList.add("hidden"),{once:!0}),na();let A=null,R,T=Promise.race([new Promise(I=>R=I),new Promise(I=>setTimeout(I,8e3))]),b=l("#photo-badge"),x=l("#photo-debug"),C=(I,Q="")=>{b.className=`absolute right-3 top-3 max-w-[calc(100%-24px)] ${I?"":"hidden"}`,b.innerHTML=I?`<span class="badge inline-block max-w-full truncate whitespace-nowrap border-white/10 bg-black/60 backdrop-blur ${Q}">${I}</span>`:""},U="";x?.querySelector("button").addEventListener("click",()=>{U=x.dataset.msg||"",x.classList.add("hidden"),x.classList.remove("flex")});let G=I=>{if(!x)return;let Q=!!I&&I!==U;x.dataset.msg=I||"",x.firstElementChild.textContent=I?`Photoreal error (owner only): ${I}`:"",x.classList.toggle("hidden",!Q),x.classList.toggle("flex",Q)},W=I=>`${Math.max(0,Math.floor((I||0)/60))} min left`,L=l("#avatar-canvas").parentElement,P="aai_photoreal_hint",B=I=>{try{if(I===void 0)return localStorage.getItem(P)==="1";I?localStorage.setItem(P,"1"):localStorage.removeItem(P)}catch{return!1}};!t.figureId&&B()&&L.classList.add("photoreal-probe");let H=I=>{L.classList.remove("photoreal-probe"),L.classList.add("photoreal-mode");let Q=L.querySelector(".photoreal-poster");Q||(Q=document.createElement("div"),Q.className="photoreal-poster",L.prepend(Q)),Q.innerHTML=`${I?`<img src="${ze(I)}" alt="" />`:""}<span class="photoreal-poster-msg"><span data-spin class="spinner !h-3.5 !w-3.5"></span><span data-msg>Connecting to your opponent\u2026</span></span>`},Z=(I,Q=!1)=>{let J=L.querySelector(".photoreal-poster-msg");J&&(J.style.display=I?"":"none",J.querySelector("[data-msg]").textContent=I||"",J.querySelector("[data-spin]").style.display=Q?"":"none")},ne=()=>{L.classList.remove("photoreal-probe","photoreal-mode"),L.querySelector(".photoreal-poster")?.remove()};(async()=>{let I=await Ks().catch(()=>null);if(!V||!I?.photoreal||t.figureId||Y)return ne(),R();if(I.isOwner){let J="aai_owner_view",se="video";try{se=localStorage.getItem(J)||"video"}catch{}let Ae=l("#view-btn");if(Ae.textContent=se==="3d"?"Show video":"Show 3D",Ae.classList.remove("hidden"),Ae.onclick=()=>{try{localStorage.setItem(J,se==="3d"?"video":"3d")}catch{}location.reload()},se==="3d")return ne(),C("3D view (owner)","text-slate-300"),R()}if(!I.champion){ne(),B(!1),R();let J=l("#upsell-slot");J.className="mt-2.5 hidden lg:block",J.innerHTML='<a href="#/account?plans=1" class="flex items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-3.5 py-2.5 text-xs text-amber-100 transition-colors hover:border-amber-400/50"><span><span class="font-semibold text-amber-300">\u2726 Champion</span> \u2014 face a photoreal opponent on video</span><span aria-hidden="true">\u2192</span></a>';return}let Q=await au(e);if(!V||!Q?.enabled||!Q.eligible)return ne(),Q?.owner&&Q.outOfCredits&&G("LiveAvatar is out of credits \u2014 video is paused for everyone (3D) until you add credits at liveavatar.com. Rechecks every 15 min."),Q&&!Q.eligible&&B(!1),R();if(!Q.mapped){ne(),R(),Q.owner&&C("Photoreal: no avatar for this opponent","text-slate-300");return}if(Q.remainingSeconds<60)return ne(),R(),C("Video minutes used this month","text-slate-300");B(!0),H(Q.avatarImage),A=new aa({stage:L,debateId:e,onStatus:J=>{V&&(J.state!=="connecting"&&R(),J.state!=="error"&&G(null),J.state==="connecting"?(C(""),Z("Connecting to your opponent\u2026",!0)):J.state==="live"?(Z(""),C(`<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>Photoreal \xB7 ${W(J.remainingSeconds)}`,"text-amber-200")):J.state==="needs_tap"?(Z("Tap to start the video"),C("")):J.state==="sleeping"||J.state==="off"?(Z("Video resumes when you reply"),C("")):J.state==="error"?(ne(),J.error==="video_minutes_exhausted"?C("Video minutes used this month","text-slate-300"):(C("Photoreal unavailable \u2014 using 3D","text-slate-300"),G(Q.owner&&(J.detail||J.error)||null))):C(""))}}),Y||A.start()})();let de=[],me=0,ue=!1,V=!0,Y=!!t.ended,ve=!1,le=!1,Ie=null,be=null,Pe=0,Je=null,Ue=!1,lt=0,k=!1,Gt=!1,Oe=!1,Ge=!1,Re=!1,Qe=!1,Ee=0,E=null,y=()=>k||Oe||Re||Qe,$=()=>{E?.remove(),E=null},ee=()=>{E||!V||(E=document.createElement("button"),E.type="button",E.className="absolute inset-0 z-[3] flex items-center justify-center bg-black/55 text-white",E.innerHTML='<span class="rounded-full border border-white/20 bg-black/60 px-5 py-3 text-sm font-semibold backdrop-blur">\u25B6 Tap to keep listening</span>',E.addEventListener("click",()=>{ke.unlock(),$()}),L.appendChild(E))},ie=ke.onBlocked(I=>I?ee():$()),K=null,Me=!1,pe=0,ye=async()=>{if(clearTimeout(pe),pe=setTimeout(()=>{K?.release().catch(()=>{}),K=null},5*6e4),!(!("wakeLock"in navigator)||K||Me||!V||Y||document.visibilityState!=="visible")){Me=!0;try{let I=await navigator.wakeLock.request("screen");if(!V||Y)return void I.release().catch(()=>{});K=I,I.addEventListener("release",()=>K===I&&(K=null))}catch{}finally{Me=!1}}},et=()=>{if(V){if(document.visibilityState!=="visible"){clearTimeout(Wt),Ue&&window.matchMedia("(pointer: coarse)").matches&&mt();return}Ee=performance.now(),ye(),ke.state==="idle"&&bt()}};document.addEventListener("visibilitychange",et);let ae=ke.on(I=>{I==="idle"&&$(),Pt()}),_e=()=>{if(V){V=!1;try{Ie?.abort()}catch{}be?.cancel(),ke.stop();try{Je?.abort()}catch{}ae(),ie(),Hr?.(),clearTimeout(Wt),document.removeEventListener("visibilitychange",et),$(),clearTimeout(pe),K?.release().catch(()=>{}),K=null,A?.dispose(),ke.reset(),D.dispose(),window.removeEventListener("hashchange",_e),window.__sessionCleanup===_e&&(window.__sessionCleanup=null)}};window.__sessionCleanup?.(),window.__sessionCleanup=_e,window.addEventListener("hashchange",_e),ke.reset();let De=/\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|a+s+s+(h+o+l+e+)?|d+a+m+n+|d+i+c+k+|p+u+s+s+y+|c+u+n+t+|w+h+o+r+e+|s+l+u+t+|n+i+g+g+[aeiou]+|f+a+g+(g+o+t+)?|t+i+t+s+|b+o+o+b+s?|p+e+n+i+s+|v+a+g+i+n+a+|c+l+i+t+|o+r+g+a+s+m+|m+a+s+t+u+r+b+a+t+e+|p+o+r+n+|h+e+n+t+a+i+|r+a+p+i+s+t+|m+o+l+e+s+t+)\b/gi,Ne=I=>t.modeId==="rapbattle"?I.replace(De,"****"):I,ge=t.actingScript?Bh(mc(t.actingScript.script),t.actingScript.role):null,Ye=()=>r.querySelector("#cue-box"),Ve=()=>Ye()?.classList.add("hidden");r.querySelector("#cue-btn")?.addEventListener("click",()=>{let I=Ye();if(!I)return;if(!I.classList.contains("hidden"))return Ve();let Q=ge?.[me];I.innerHTML=Q?`<span class="text-[11px] font-semibold uppercase tracking-wide text-accent-400">Your line</span><br>${ze(Q)}`:"That\u2019s the end of your lines \u2014 tap End &amp; grade for your notes.",I.classList.remove("hidden")});function ht(I,Q,J){if(!ge||!I||!ge[J])return;let se=Om(ge[J],Q),Ae=se>=90,St=document.createElement("div");St.className=`mt-2 border-t border-white/10 pt-2 text-xs ${Ae?"text-emerald-300":"text-amber-300"}`,St.textContent=Ae?`\u2713 ${se}% on script`:`${se}% on script \u2014 the line was: \u201C${ge[J]}\u201D`,I.row.firstElementChild.appendChild(St)}let O=window.matchMedia("(max-width: 1023px)"),ce=!0,X=null,te=-1,fe=null;function oe(I){if(I&&(ce=!0),!ce)return void(_.hidden=!1);let Q=c.scrollHeight-c.clientHeight,J=X?.isConnected?Math.min(Q,X.offsetTop-8):Q;c.scrollTop=J,te=c.scrollTop,_.hidden=J>=Q-1}c.addEventListener("scroll",()=>{Math.abs(c.scrollTop-te)<2||(te=-1,ce=c.scrollHeight-c.scrollTop-c.clientHeight<40,ce&&(_.hidden=!0,X&&c.scrollTop>X.offsetTop+32&&(X=null)))},{passive:!0}),_.addEventListener("click",()=>{X=null,oe(!0)}),new ResizeObserver(()=>ce&&oe(!1)).observe(c);let qe={msg:"",at:0};function _t(I){I=String(I||"").trim(),!(!I||I===qe.msg&&Date.now()-qe.at<4e3)&&(qe={msg:I,at:Date.now()},w.textContent="",requestAnimationFrame(()=>w.textContent=I))}function Ut(I){let Q=I?.row;!Q?.isConnected||Q.dataset.said||(Q.dataset.said="1",Q.firstElementChild?.removeAttribute("aria-busy"),_t(`${t.personaLabel}: ${I.textEl.textContent}`))}let rt=l("#session-shell");d.addEventListener("focus",()=>rt.classList.add("kb")),d.addEventListener("blur",()=>rt.classList.remove("kb"));let ii="aai_stage_big",ri=l("#size-btn"),Fr=I=>{rt.classList.toggle("stage-big",I),ri.setAttribute("aria-pressed",String(I)),ri.innerHTML=I?Xe.shrink:Xe.grow,ri.setAttribute("aria-label",I?`Show less of ${t.personaLabel}`:`Show more of ${t.personaLabel}`);try{localStorage.setItem(ii,I?"1":"0")}catch{}};try{Fr(localStorage.getItem(ii)==="1")}catch{Fr(!1)}ri.addEventListener("click",()=>Fr(!rt.classList.contains("stage-big"))),l("#avatar-canvas").addEventListener("click",()=>{window.matchMedia("(min-width: 1024px)").matches||L.querySelector(".photoreal-poster")||Fr(!rt.classList.contains("stage-big"))});function Bi(I,Q){de.push({role:I,text:Q});let J=document.createElement("div"),se=I==="you",Ae=!se&&!Q;J.className=`flex ${se?"justify-end":"justify-start"} animate-fade-up`,J.innerHTML=`<div class="t-bubble max-w-[92%] rounded-2xl px-3.5 py-2.5 text-base leading-relaxed sm:max-w-[80%] sm:px-4 sm:py-3 sm:text-[15px] ${se?"rounded-br-md border border-accent-500/30 bg-accent-500/10 text-slate-100":"rounded-bl-md border border-ink-700 bg-ink-800 text-slate-100"}"${Ae?' aria-busy="true"':""}>
      <div class="mb-1 text-xs font-semibold uppercase tracking-wide ${se?"bubble-you text-accent-400":"text-slate-400"}">${se?"You":ze(t.personaLabel)}</div>
      <div class="whitespace-pre-wrap break-words" data-text>${ze(Q)}</div></div>`,c.appendChild(J),fe?.remove(),fe=null,X=Ae&&O.matches?J:null,oe(!0);let St=J.querySelector("[data-text]");return Ae&&Ki(J,St),{row:J,textEl:St,entry:de[de.length-1]}}function Ki(I,Q){let J=0,se=new MutationObserver(()=>{clearTimeout(J),J=setTimeout(Ae,800)}),Ae=()=>{if(!V||!I.isConnected||I.dataset.said)return se.disconnect();if(ue)return void(J=setTimeout(Ae,400));se.disconnect(),Ut({row:I,textEl:Q})};se.observe(Q,{childList:!0,characterData:!0,subtree:!0})}function un(){let I=document.createElement("div");return I.className="flex justify-start",I.innerHTML=`<div class="flex gap-1.5 rounded-2xl rounded-bl-md border border-ink-700 bg-ink-800 px-4 py-3.5" aria-label="${ze(t.personaLabel)} is thinking"><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span></div>`,c.appendChild(I),X=null,oe(!0),I}function ai(I,Q="muted"){let J=document.createElement("p");J.className=`text-center text-sm ${Q==="error"?"text-red-300":"text-slate-500"}`,J.textContent=I;let se=c.lastElementChild;if(se?.tagName==="P"&&se.textContent===I&&se.remove(),Q==="error"){fe?.remove(),fe=J,X=null;for(let Ae of c.querySelectorAll("[aria-busy]"))Ae.removeAttribute("aria-busy"),Ae.parentElement.dataset.said="1"}return c.appendChild(J),_t(I),oe(!0),J}function es(){return ue?Math.max(1,me):me+1}function Br(I){return ve||o&&I>=o?{label:"Closing",cls:"text-purple-200"}:I<=1?{label:"Opening",cls:"text-sky-200"}:{label:"Rebuttal",cls:"text-rose-200"}}function Zi(){let I=Math.min(es(),o||1/0);l("#round-badge").textContent=l("#round-badge-m").textContent=o?`${s} ${I} of ${o}`:`${s} ${I}`;let Q=l("#phase-badge");if(Q){let se=Br(I);Q.className=`badge absolute left-3 top-3 border-white/10 bg-black/60 backdrop-blur ${se.cls}`,Q.textContent=se.label}let J;if(Y)J="This session is finished.";else if(k)J="Your opponent opens first\u2026";else if(a){let se=Br(es()).label;J=se==="Opening"?"Your opening statement\u2026":se==="Closing"?"Your closing argument\u2026":"Your rebuttal\u2026"}else t.modeId==="interview"||t.modeId==="thesis"||t.modeId==="expert"?J="Your answer\u2026":t.modeId==="rapbattle"?J="Drop your bars\u2026":t.actingScript?J=ge&&me>=ge.length?"End of scene \u2014 tap End & grade":"Your line\u2026":J=de.length?"Your reply\u2026":"Say something to begin\u2026";d.placeholder=J}function Pt(){if(!V)return;let I=ke.state==="speaking",Q=l("#status-dot"),J=l("#status-text");Ue?(Q.className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse",J.textContent="Listening to you"):I?(Q.className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse",J.textContent="Speaking"):ue?(Q.className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse",J.textContent="Thinking"):Y?(Q.className="h-1.5 w-1.5 rounded-full bg-slate-500",J.textContent="Finished"):Oe||k?(Q.className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse",J.textContent=Oe?"Waiting for reply":Gt?"Tap to hear your opponent":"Opponent is about to open\u2026"):(Q.className="h-1.5 w-1.5 rounded-full bg-emerald-400",J.textContent="Your turn"),v.disabled=!I,g.disabled=I||ue||!ke.hasReplay(),u.disabled=ue||Y||le||k||Oe||Qe,m.disabled=ue&&!Y||Qe}let ts=window.CSS?.supports?.("field-sizing","content");ts&&(d.style.fieldSizing="content");function Ji(){if(ts)return;let I=window.scrollY,Q=c.scrollTop;d.style.height="auto",d.style.height=Math.min(160,d.scrollHeight)+"px",window.scrollY!==I&&window.scrollTo(0,I),c.scrollTop!==Q&&(c.scrollTop=Q)}d.addEventListener("input",()=>{if(Ji(),A?.touch(),d.value.length>=4e3&&!Ue){let I="That\u2019s the 4,000-character limit \u2014 anything past it was left out.";p.textContent=I,p.className="mt-2 text-xs text-amber-300",setTimeout(()=>p.textContent===I&&p.classList.add("hidden"),6e3)}});function is(){!o||me<o||Y||M.firstChild||(M.innerHTML=`<div class="target-banner mb-2 flex items-center justify-between gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-3 py-1.5 sm:mb-3 sm:gap-3 sm:rounded-2xl sm:p-4">
      <p class="min-w-0 text-xs leading-snug text-slate-200 sm:text-sm"><span class="tb-short sm:hidden"><span class="font-semibold text-white">Final ${s.toLowerCase()} done.</span> Extra ${s.toLowerCase()}s use a credit.</span><span class="tb-long hidden sm:inline"><span class="font-semibold text-white">That was the final ${s.toLowerCase()}.</span> Get your scorecard now \u2014 or keep going (each extra ${s.toLowerCase()} uses a credit).</span></p>
      <button type="button" class="btn-primary btn-xs shrink-0 sm:btn-sm" id="banner-score">Get my scorecard</button></div>`,l("#banner-score").onclick=()=>Fe(!0))}function hn(I){let Q=l("#wallet-badge");typeof I=="number"&&I>=0&&I<=25?(Q.classList.remove("hidden"),Q.textContent=`${I} credit${I===1?"":"s"} left`):Q.classList.add("hidden")}let Sr=!1;async function S(I,Q=0,J=""){if(!I.active||!V)return I.end();Sr=!0;try{let se=await fetch("/api/speech/turn-audio",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:e,offset:Q,anchor:J})});if(!se.ok)throw new Error("http "+se.status);let Ae=await se.arrayBuffer();if(!I.active||!V||!Ae.byteLength)return;await I.enqueue(Ae,null)}catch(se){console.warn("[voice] server audio unavailable",se),V&&I.active&&ai("Voice unavailable for this reply \u2014 text only.")}finally{Sr=!1,I.end()}}let F=I=>new Promise(Q=>setTimeout(Q,I)),q=[],j=I=>{let Q=ai(I,"error");return q.push(Q),Q},N=()=>q.splice(0).forEach(I=>I.remove());function re(I,Q,J){let se=j(I),Ae=document.createElement("button");return Ae.type="button",Ae.className="btn-ghost btn-xs ml-2 align-middle",Ae.textContent=Q,Ae.addEventListener("click",()=>{ue||Oe||Qe||!V||Y||(se.remove(),J())}),se.append(" ",Ae),se}let xe=I=>re(I,"Retry opening",()=>we({open:!0}));async function Se(I,Q,J=[1500,2500,4e3,6e3,8e3,1e4,1e4]){let se=!1;for(let Ae of J){if(await F(Ae),!V||Y||Qe)return null;let St;try{St=await Dt(`/api/debates/${encodeURIComponent(e)}`)}catch{continue}if(se=!0,!V||Y||Qe)return null;let Jt=St.turns??[],st=Et=>Jt.slice(Et).find(li=>li.role!=="user"),tt;if(I==null)tt=st(0);else{let Et=Jt.filter(wt=>wt.role==="user"),li=Et.at(-1);if(!li||Et.length<Q||String(li.text??"").trim()!==I)return{state:"gone"};tt=st(Jt.indexOf(li)+1)}if(tt)return{state:"reply",text:String(tt.text??""),remaining:St.remainingRounds}}return{state:se?"pending":"offline"}}async function we({open:I=!1,closing:Q=!1}={}){let J=d.value.trim();if(ue||Y||le||Qe||Oe||!I&&(!J||k))return;if(!I&&J.length>4e3)return void j(`That\u2019s ${J.length.toLocaleString()} characters \u2014 keep it under 4,000 and send again.`);ke.unlock(),mt(),A?.touch(),ye(),be?.cancel(),be=null,ke.stop(),ue=!0,Ge=!1;let se=++Pe;lt=0;let Ae=null;I||(d.value="",Ji(),Ae=Bi("you",J),ht(Ae,J,me),Ve(),me++,M.querySelector(".target-banner")&&M.replaceChildren());let St=me,Jt=()=>{if(!Ae)return;Ae.row.remove();let Le=de.indexOf(Ae.entry);Le>=0&&de.splice(Le,1),me=Math.max(0,me-1),Ae=null,d.value||(d.value=J,Ji())};Zi(),Pt();let st=un(),tt=null,Et="",li=0,wt=null,mn=!1,Hi=null,fn=!1,ea="",ta=!1,ia=!1,jd=!1,qd=!iu(),fl=new AbortController;Ie=fl,Ee=performance.now();let Xp=setInterval(()=>{se!==Pe||!V||document.hidden||performance.now()-Ee>(jd?3e4:45e3)&&(ia=!0,fl.abort())},2e3),gl=Le=>{let Mt=performance.now();tt||(st.remove(),tt=Bi("opp","")),(Le||Mt-li>50)&&(tt.textEl.textContent=Et,tt.entry.text=Et,li=Mt,oe(!1))},Xd=()=>{if(!tt)return;tt.row.remove();let Le=de.indexOf(tt.entry);Le>=0&&de.splice(Le,1),tt=null},Yp=Le=>{if(!(se!==Pe||!V))if(Le.t==="hello")qd&&Le.ttsVoice&&lt!==se&&(be=nu({voiceCfg:{voice:Le.ttsVoice,hd:!!Le.ttsHd,style:Le.ttsStyle,styleDegree:Le.ttsStyleDegree},transform:t.actingScript?Mt=>Ne(Mt).replace(/(^|\n)\s*[\p{Lu}][\p{Lu} .'\-]{0,30}:\s*/gu,"$1"):Ne,onFallback:(Mt,Qt,er)=>{wt={offset:Mt,utter:Qt,anchor:er},Hi?S(Qt,Mt,er):mn&&Qt.end()}}));else if(Le.t==="tok")Et+=Le.c??"",gl(!1),be?.push(Le.c??"");else if(Le.t==="done")if(Hi=Le,gl(!0),typeof Le.text=="string"&&Le.text.trim()&&(Et=Le.text,tt.textEl.textContent=Et,tt.entry.text=Et),Ut(tt),hn(Le.remainingRounds),N(),lt===se)be?.cancel();else if(be)be.finish({dropTail:!!Le.truncated}),wt&&(Le.truncated&&wt.offset>=Et.length?wt.utter.end():S(wt.utter,wt.offset,wt.anchor));else if(Le.audioBase64){let Mt=ke.begin(),Qt=Uint8Array.from(atob(Le.audioBase64),er=>er.charCodeAt(0));Mt.enqueue(Qt.buffer,null).finally(()=>Mt.end())}else Le.audioFailed?ai("Voice unavailable for this reply \u2014 text only."):S(ke.begin(),0,"");else Le.t==="err"&&(fn=ta=!0,ea=Le.message||"",st.remove(),Xd())},vi=null,vl="",Kp=()=>{if(!tt||tt.row.querySelector("[data-cut]"))return;let Le=document.createElement("div");Le.dataset.cut="",Le.className="mt-2 border-t border-white/10 pt-2 text-xs text-amber-300",Le.textContent="Reply cut off",tt.row.firstElementChild.appendChild(Le)},Zp=async()=>{if(lt===se||!V)return void wt?.utter.end();Sr=!0;let Le=Date.now();for(;vi&&V&&vi.utter.active&&(vi.pending()||ke.state==="speaking"&&!vi.failed)&&Date.now()-Le<9e4;)await F(200);if(Sr=!1,lt===se||!V||se!==Pe)return void wt?.utter.end();if(wt)return S(wt.utter,wt.offset,wt.anchor);let Mt=vi?Math.max(0,vi.offset-(vl.length-vl.trimStart().length)):0;Mt<Et.trimEnd().length&&S(ke.begin(),Mt,Mt?Et.slice(Mt,Mt+40):"")},Yd=async Le=>{Oe=!0,Pt();let Mt=ai(ia?`${t.personaLabel} went quiet \u2014 checking with the server\u2026`:tt?"The connection dropped mid-reply \u2014 getting the rest\u2026":I?"The connection dropped \u2014 checking on your opponent\u2026":"The connection dropped \u2014 checking whether your message went through\u2026"),Qt=await Se(I?null:J,St,Le);if(Mt.remove(),Oe=!1,!Qt||se!==Pe||!V)return mn=!0,vi?.failed&&wt?.utter.end(),!1;if(Qt.state==="reply")return mn=!1,tt||(tt=Bi("opp","")),tt.row.querySelector("[data-cut]")?.remove(),Et=Qt.text,tt.textEl.textContent=Et,tt.entry.text=Et,oe(!1),hn(Qt.remaining),N(),Ge=!1,I&&(k=!1),Zp(),!0;if(Ge=!0,Qt.state==="gone"||I)return vi?.cancel(),be===vi&&(be=null),ke.stop(),Xd(),I?xe("Your opponent couldn\u2019t start \u2014 the connection dropped."):(Jt(),j(`The connection dropped before ${t.personaLabel} could answer \u2014 your message is back in the box. Tap Send to try again.`)),!1;mn=!0,vi?.failed&&wt?.utter.end(),Kp();let er=async()=>{if(se!==Pe)return;let tr=await Yd([0,2e3,4e3]);V&&se===Pe&&Kd(tr)},gn=Qt.state==="offline",zi=re(gn?"Couldn\u2019t reach the server \u2014 check your connection, then try again.":`${t.personaLabel}\u2019s reply didn\u2019t come through.`,"Check again",er);return gn&&window.addEventListener("online",()=>zi.isConnected&&!ue&&!Oe&&(zi.remove(),er()),{once:!0}),!1},Kd=async Le=>{Zi(),Pt(),is(),bt?.(),ve&&Le&&(await He(9e4),V&&se===Pe&&Fe(!0))};try{let Le=await fetch("/api/debate/turn-stream",{method:"POST",credentials:"include",signal:fl.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:e,text:I?"":J,action:I?"open":void 0,phase:(Q||ve)&&!I?"closing":void 0,clientTts:qd})});jd=!0,Ee=performance.now();let Mt=Le.headers.get("content-type")||"";if(!Le.ok||!Mt.includes("text/event-stream")){let zi={};try{zi=await Le.json()}catch(tr){if(ia)throw tr}if(ta=!0,st.remove(),Jt(),Le.status===402)le=!0,k=!1,f.replaceChildren(pc()),d.disabled=!0,h.disabled=!0,clearTimeout(Wt),ai("You\u2019re out of rounds \u2014 tap End & grade to get your scorecard for this session.");else if(zi.error==="debate_ended")Y=!0,ai("This session has already been scored.");else if(zi.error==="opening_already_delivered"){k=!1;let tr=await Se(null,0,[0]);tr?.state==="reply"&&se===Pe&&V&&!de.some(ra=>ra.role==="opp")?Bi("opp",tr.text):tr?.state!=="reply"&&j("Couldn\u2019t load your opponent\u2019s opening \u2014 reload the page to see it.")}else fn=!0,ea=zi.error==="text_too_long"?"That message is over 4,000 characters \u2014 trim it and send again.":Le.status===401?"You\u2019ve been signed out \u2014 log in again, then come back to this session.":zi.message||"";return}let Qt=Le.body.getReader(),er=new TextDecoder,gn="";for(;;){let{done:zi,value:tr}=await Qt.read();if(zi)break;Ee=performance.now(),gn+=er.decode(tr,{stream:!0});let ra=gn.split(`

`);gn=ra.pop()??"";for(let Jp of ra){let Zd=Jp.trim();if(Zd.startsWith("data:"))try{Yp(JSON.parse(Zd.slice(5).trim()))}catch{}}if(se!==Pe||!V){Qt.cancel().catch(()=>{});break}}}catch(Le){Le?.name==="AbortError"&&!ia&&(ta=!0)}finally{if(clearInterval(Xp),se===Pe&&V){st.remove(),ue=!1,Ie=null;let Le=!Hi&&!ta;Hi||(Le&&tt&&gl(!0),Le&&be&&lt!==se?(vi=be,vi.finish({dropTail:!0})):(be?.cancel(),be=null,ke.stop())),vl=Et,fn&&(Ge=!0,Jt(),I?xe(`Your opponent couldn\u2019t start.${ea.includes("wasn\u2019t charged")?" That round wasn\u2019t charged.":""}`):j(ea||"Your message didn\u2019t go through. Try sending again.")),Hi&&I&&(k=!1),Zi(),Pt();let Mt=Hi?!0:Le?await Yd():!1;V&&se===Pe&&await Kd(Mt)}}}async function He(I){let Q=se=>new Promise(Ae=>setTimeout(Ae,se)),J=Date.now();for(;ke.state==="idle"&&Date.now()-J<1500;)await Q(150);for(;(ke.state!=="idle"||Sr)&&Date.now()-J<I;)await Q(200);await Q(300)}async function Fe(I=!1){if(Y)return Ce();if(Qe||Re)return;if(!I){Re=!0,clearTimeout(Wt),mt();let J;try{if(me===0)J=await Ur({title:"Nothing to grade yet",body:"Say at least one thing before asking for a scorecard.",actions:[{label:"Keep going",value:"stay",kind:"primary"},{label:"Leave session",value:"leave"}]});else{let se=!o,Ae=[];a&&se&&me>=2&&!ve&&Ae.push({label:"Deliver a closing statement first",hint:"1 more round",value:"closing"}),Ae.push({label:"Grade my session now",value:"score",kind:"primary"},{label:"Keep going",value:"stay"}),J=await Ur({title:"End this session?",body:n.judge?"You\u2019ll get your coaching scorecard, and an impartial judge will score both sides.":"You\u2019ll get your coaching scorecard.",actions:Ae})}}finally{Re=!1}if(J==="leave")return void(location.hash="#/");if(J==="closing"){ve=!0,Zi(),d.placeholder="Your closing argument \u2014 why you won\u2026",d.focus();return}if(J!=="score")return void bt()}Qe=!0,clearTimeout(Wt),mt();let Q=l("#banner-score");if(Q&&(Q.disabled=!0),m.disabled=!0,m.innerHTML='<span class="spinner"></span><span>Scoring\u2026</span>',ue){let J=ai("Finishing their reply, then scoring\u2026");for(;ue&&V&&!Y;)await F(200);J.remove()}if(V){be?.cancel(),ke.stop();try{let{scores:J}=await Ct("/api/debate/end",{debateId:e});if(!V)return;Y=!0,Th(r,D,t,e,de,J)}catch(J){if(Qe=!1,!V)return;Q&&(Q.disabled=!1),m.disabled=!1,m.textContent="End & grade",j(J?.body?.message||"Couldn\u2019t fetch your scores. Try again in a moment."),Pt()}}}async function Ce(){try{let I=await Dt(`/api/debates/${encodeURIComponent(e)}`);Th(r,D,t,e,de,I.scorecard||{dimensions:[],overall:null,notes:""})}catch{ai("Couldn\u2019t load the scorecard.","error")}}u.addEventListener("click",()=>we({closing:ve})),d.addEventListener("keydown",I=>{I.key==="Enter"&&!I.shiftKey&&!I.isComposing&&window.matchMedia("(pointer: fine)").matches&&(I.preventDefault(),we({closing:ve}))}),g.addEventListener("click",()=>{ke.unlock(),ke.replay(),Pt()}),v.addEventListener("click",()=>{lt=Pe,be?.cancel(),ke.stop()}),m.addEventListener("click",()=>Y?Ce():Fe(!1)),r.addEventListener("click",ye);let Ke=window.SpeechRecognition||window.webkitSpeechRecognition;function vt(){if(Ue)try{Je?.stop()}catch{}}let pt=null;function mt(){if(clearTimeout(ot),!Je)return;let I=Je;I.onresult=I.onend=I.onerror=null;try{I.abort()}catch{}Ue&&pt?.()}let ft=I=>{let Q="";for(let J of I){let se=J.trim();if(!se)continue;let Ae=Q.toLowerCase(),St=se.toLowerCase();!Q||St.startsWith(Ae)?Q=se:Ae.endsWith(St)||(Q+=" "+se)}return Q},Te=I=>{let Q=[...de].reverse().find(st=>st.role==="opp")?.text||"",J=st=>st.toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu," ").split(/\s+/).filter(Boolean),se=J(I);if(se.length<4||!Q)return!1;let Ae=new Set,St=J(Q);for(let st=0;st+2<St.length;st++)Ae.add(St[st]+" "+St[st+1]+" "+St[st+2]);let Jt=0;for(let st=0;st+2<se.length;st++)Ae.has(se[st]+" "+se[st+1]+" "+se[st+2])&&Jt++;return Jt/(se.length-2)>=.5},Qi=/Android/i.test(navigator.userAgent),wi="aai_handsfree",yt=!1;try{yt=localStorage.getItem(wi)==="1"}catch{}let gi=l("#hf-btn"),$t=()=>{!gi||!Ke||(gi.classList.remove("hidden"),gi.innerHTML=`Hands-free mic: <b class="${yt?"text-emerald-300":"text-slate-300"}">${yt?"On":"Off"}</b>`,gi.setAttribute("aria-pressed",String(yt)))},wr=I=>{yt=I;try{localStorage.setItem(wi,I?"1":"0")}catch{}$t()},ot=0;function oi(I=!1){if(Ue||!Ke)return;ke.unlock(),I||(lt=Pe,be?.cancel(),ke.stop()),mt(),Je=new Ke,Je.lang=navigator.language||"en-US",Je.interimResults=!0,Je.continuous=!Qi;let Q=d.value?d.value.replace(/\s+$/,"")+" ":"",J=()=>d.value.slice(Q.length).trim(),se=()=>{if(!(!yt||ue||!V||Y||le||y()||!J())){if(Te(J())){d.value=Q.trim(),Ji(),p.textContent="That sounded like your opponent\u2019s voice \u2014 try headphones, or turn the volume down.",p.className="mt-2 text-xs text-amber-300";return}we({closing:ve})}};Je.onresult=st=>{let tt=[],Et=[];for(let Hi=0;Hi<st.results.length;Hi++){let fn=st.results[Hi];(fn.isFinal?tt:Et).push(fn[0].transcript)}let li=ft(tt),wt=ft(Et),mn=wt?!li||wt.toLowerCase().startsWith(li.toLowerCase())?wt:`${li} ${wt}`:li;d.value=(Q+mn).replace(/\s+/g," ").trimStart(),Ji(),yt&&(clearTimeout(ot),d.value.trim()&&(ot=setTimeout(()=>Ue&&se(),3500)))};let Ae=!1,St="",Jt=st=>{Ae||(Ae=!0,clearTimeout(ot),pt=null,Ue=!1,h.classList.remove("mic-live"),h.innerHTML=Xe.mic,h.setAttribute("aria-label","Speak your reply"),st?(p.textContent=st,p.className="mt-2 text-xs text-red-300",setTimeout(()=>p.textContent===st&&p.classList.add("hidden"),5e3)):p.className.includes("amber")||p.classList.add("hidden"),Pt())};pt=Jt,Je.onend=()=>{Jt(),St||setTimeout(()=>!Ue&&se(),1500)},Je.onerror=st=>{let tt=st?.error||"";St=tt||"error",Jt(tt==="not-allowed"||tt==="service-not-allowed"?I?"Tap the mic to talk \u2014 your browser needs a tap before it can listen.":"Microphone blocked \u2014 allow mic access for this site, then try again.":tt==="audio-capture"?"No microphone found on this device.":tt==="no-speech"?I?"Didn\u2019t hear anything \u2014 tap the mic when you\u2019re ready.":"Didn\u2019t hear anything \u2014 tap the mic and try again.":tt==="aborted"?"":"Voice input failed \u2014 try again or type instead.")};try{Je.start(),Ue=!0,h.classList.add("mic-live"),h.innerHTML=Xe.stop,h.setAttribute("aria-label","Stop listening"),p.textContent=yt?"Listening\u2026 I\u2019ll send when you pause.":"Listening\u2026 tap the mic again when you\u2019re done, then send.",p.className="mt-2 text-xs text-slate-400",Pt()}catch{Jt(I?"":"Voice input failed \u2014 try again or type instead.")}}var Wt=0;function bt(){if(clearTimeout(Wt),!Ke||!yt||!V||Y||le||ue||Ue||Ge||y())return;let I=L?.classList.contains("photoreal-live")?900:450;Wt=setTimeout(()=>{if(!(!yt||!V||Y||le||ue||Ue||ve||Ge||y()||document.hidden)&&!(ke.state==="speaking"||be&&be.pending?.())){if(Sr||A?.talking)return void(Wt=setTimeout(bt,400));ge&&me>=ge.length||oi(!0)}},I)}var Hr=ke.on(I=>{I==="speaking"?(clearTimeout(Wt),Ue&&mt()):I==="idle"&&bt()});Ke&&(h.classList.remove("hidden"),$t(),gi?.addEventListener("click",()=>{wr(!yt),yt?bt():(clearTimeout(Wt),mt())}),h.addEventListener("click",()=>{if(Ue)return clearTimeout(ot),vt();try{localStorage.getItem(wi)===null&&wr(!0)}catch{}oi(!1)}));let Mi=null;for(let I of i.turns??[])I.role==="user"?(Mi=Bi("you",I.text),me++):Bi("opp",I.text);if(Y){d.disabled=!0;let I=document.createElement("div");I.className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-200",I.innerHTML='<span>\u2713 This session is finished and scored.</span><button type="button" class="btn-ghost btn-xs">View scorecard</button>',I.querySelector("button").onclick=Ce,M.appendChild(I),m.textContent="Scorecard"}else hn(i?.remainingRounds),i?.remainingRounds===0&&(le=!0,f.replaceChildren(pc()),d.disabled=!0,h.disabled=!0);let pn=(i.turns??[]).at(-1);k=!Y&&!le&&!pn&&t.resolvedFirstSpeaker==="opponent",Zi(),Pt(),is();async function qp(I,Q){let J=String(Q.text??"").trim(),se={state:"pending"};if(!(Date.now()-Date.parse(Q.created_at||"")>18e4)){Oe=!0,Pt();let Ae=un();if(se=await Se(J,me,[1500,2500,4e3,6e3,8e3,1e4]),Ae.remove(),Oe=!1,!se||!V)return void Pt()}if(se.state==="reply")Bi("opp",se.text),hn(se.remaining);else if(se.state==="gone"){I.row.remove();let Ae=de.indexOf(I.entry);Ae>=0&&de.splice(Ae,1),me=Math.max(0,me-1),d.value||(d.value=J,Ji()),Ge=!0,j("Your last message didn\u2019t get a reply \u2014 it\u2019s back in the box. Tap Send to try again.")}else se.state==="offline"?ai("Couldn\u2019t check on the reply to your last message \u2014 reload to see it."):ai(`${t.personaLabel} never answered your last message. Send your next point to carry on.`);Zi(),Pt(),is(),bt()}if(k){let I=(()=>{try{return ke.ensureContext().state}catch{return"running"}})(),Q=!1,J=null,se=Ae=>{Q||!V||!k||Ae?.target?.closest?.("#end-btn")||(Q=!0,r.removeEventListener("click",se,!0),J?.remove(),ke.unlock(),Gt=!1,Pt(),T.then(()=>V&&we({open:!0})))};I!=="running"?(Gt=!0,Pt(),J=document.createElement("button"),J.type="button",J.className="absolute inset-0 z-[3] flex items-center justify-center bg-black/55 text-white",J.innerHTML='<span class="rounded-full border border-white/20 bg-black/60 px-5 py-3 text-sm font-semibold backdrop-blur">\u25B6 Tap to hear your opponent</span>',L.appendChild(J),r.addEventListener("click",se,!0)):se()}else!Y&&pn?.role==="user"?qp(Mi,pn):Y||(bt(),window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches&&d.focus({preventScroll:!0}));Y||ye()}function il(r,e,t=10){let i=e==null?0:Math.max(0,Math.min(100,e/t*100));return`
    <div>
      <div class="mb-1.5 flex justify-between gap-3 text-sm">
        <span class="font-medium text-slate-300">${ze(r)}</span>
        <span class="shrink-0 font-semibold text-white">${Yn(e)}<span class="text-slate-500">/${t}</span></span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-ink-800">
        <div class="score-fill h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400" style="width:0%" data-w="${i}"></div>
      </div>
    </div>`}function Th(r,e,t,i,n,s){try{localStorage.setItem("aai_sessions_done","1")}catch{}As("session_complete",{mode:t?.modeId});let a=s?.dimensions??[],o=a.filter(c=>c.score!=null);e?.dispose?.(),window.__sessionCleanup?.(),window.scrollTo({top:0});let l=n.filter(c=>c.role==="you").length;r.className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10",r.innerHTML=`
      <div class="mb-6 text-center">
        <p class="eyebrow mb-2 !text-accent-400">Session complete</p>
        <h1 class="text-display-lg text-white">Your scorecard</h1>
        <p class="mx-auto mt-2 max-w-xl text-sm text-slate-400 line-clamp-2">${ze(t.modeName)}${t.topic?` \xB7 ${ze(t.topic)}`:""}</p>
      </div>
      <div class="card mb-4 p-5 sm:p-7">
        <div class="flex items-center gap-5">
          <div class="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-accent-500/40 bg-accent-500/10">
            <span class="text-4xl font-extrabold leading-none tracking-tight text-accent-400">${Yn(s?.overall)}</span>
            <span class="mt-1 text-[11px] font-semibold text-slate-500">/ 10</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-lg font-bold text-white">Your score</div>
            <p class="text-sm text-slate-400">${l} turn${l===1?"":"s"} vs ${ze(t.personaLabel)}</p>
            ${t.judgeEnabled?'<div id="verdict-pill" class="mt-2"><span class="badge border-ink-700 bg-ink-800 text-slate-400"><span class="spinner !h-3 !w-3"></span>Judge deliberating\u2026</span></div>':""}
          </div>
        </div>
        ${o.length?`<div class="mt-6 grid gap-x-8 gap-y-4 border-t border-ink-700 pt-6 sm:grid-cols-2">${a.map(c=>il(c.label,c.score)).join("")}</div>`:""}
      </div>
      ${t.judgeEnabled?`<div class="card mb-4 p-5 sm:p-7" id="verdict-card"><div class="mb-4 flex items-center gap-3"><span class="text-accent-400 [&>svg]:h-5 [&>svg]:w-5">${Xe.scale}</span><div><div class="font-semibold text-white">Head-to-head</div><p class="text-xs text-slate-500">An impartial judge scored both sides on the same rubric.</p></div></div><div id="verdict-body"><div class="flex items-center justify-center gap-2 py-6 text-sm text-slate-400"><span class="spinner"></span>The judge is deliberating\u2026</div></div></div>`:""}
      <div class="card mb-4 p-5 sm:p-7">
        <div class="mb-2 text-sm font-semibold text-white">Coach\u2019s notes</div>
        <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">${ze(s?.notes||"No notes this time.")}</p>
        <div id="judge-notes"></div>
      </div>
      <div class="card mb-6 p-5 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><div class="font-semibold text-white">Share to the Community Arena</div><p class="text-sm text-slate-400">Let others read the transcript and vote on who won.</p></div>
          <button type="button" id="arena-toggle-btn" class="btn-ghost btn-sm shrink-0">Publish to Arena</button>
        </div>
        <div id="arena-share-tray" class="mt-4 hidden">
          <div class="flex gap-2"><input id="arena-share-link" class="field text-sm" readonly /><button type="button" id="arena-copy-btn" class="btn-ghost btn-sm shrink-0">Copy</button></div>
          <div class="mt-3 flex flex-wrap gap-2"><a id="arena-share-x" target="_blank" rel="noopener" class="btn-ghost btn-sm min-h-[44px]">Share on X</a><a id="arena-share-reddit" target="_blank" rel="noopener" class="btn-ghost btn-sm min-h-[44px]">Share on Reddit</a></div>
        </div>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row">
        <a href="#/setup/${encodeURIComponent(t.modeId)}" class="btn-primary flex-1 py-3">Practice again</a>
        <a href="#/history" class="btn-ghost flex-1 py-3">All sessions</a>
      </div>`,L_(r,i,t),requestAnimationFrame(()=>requestAnimationFrame(()=>{r.querySelectorAll("[data-w]").forEach(c=>c.style.width=`${c.dataset.w}%`)}))}var fd=[["argumentation","Argumentation"],["evidence","Evidence & reasoning"],["rebuttal","Rebuttal"],["composure","Composure & clarity"]];function L_(r,e,t){let i=r.querySelector("#arena-toggle-btn"),n=r.querySelector("#arena-share-tray"),s=r.querySelector("#arena-share-link"),a=r.querySelector("#arena-copy-btn"),o=r.querySelector("#arena-share-x"),l=r.querySelector("#arena-share-reddit");if(i){let d=`${location.origin}/debate/${e}`;s.value=d;let u=!1,h=p=>{u=p,i.textContent=p?"\u2713 Published \u2014 unpublish":"Publish to Arena",n.classList.toggle("hidden",!p);let g=t.topic?`\u201C${t.topic}\u201D`:"this debate";o.href="https://twitter.com/intent/tweet?text="+encodeURIComponent(`Who won? I sparred ${t.personaLabel||"an AI"} on ${g}. Vote on AdversaryAI: ${d}`),l.href="https://reddit.com/submit?url="+encodeURIComponent(d)+"&title="+encodeURIComponent(`Who won this debate? Me vs ${t.personaLabel||"AI"} on ${g}`)};Dt("/api/debates/"+encodeURIComponent(e)).then(p=>p?.debate&&h(!!(p.debate.is_public||p.debate.isPublic))).catch(()=>{}),i.addEventListener("click",async()=>{i.disabled=!0;try{await Ct("/api/debate/toggle-public",{debateId:e,isPublic:!u}),h(!u)}catch{i.textContent="Couldn\u2019t update \u2014 try again"}finally{i.disabled=!1}}),a.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(d),a.textContent="Copied!",setTimeout(()=>a.textContent="Copy",2e3)}catch{s.select()}})}let c=r.querySelector("#verdict-body");if(c){let d=r.querySelector("#verdict-pill"),u=()=>{c.innerHTML='<div class="flex items-center justify-center gap-2 py-6 text-sm text-slate-400"><span class="spinner"></span>The judge is deliberating\u2026</div>',d&&(d.innerHTML='<span class="badge border-ink-700 bg-ink-800 text-slate-400"><span class="spinner !h-3 !w-3"></span>Judge deliberating\u2026</span>'),Ct("/api/debate/judge",{debateId:e}).then(({verdict:h})=>P_(r,t,h)).catch(h=>{let p=h instanceof Lt?h.body?.error:null;if(d&&(d.innerHTML=""),p==="insufficient_transcript"){c.innerHTML='<p class="py-4 text-center text-sm text-slate-400">Not enough of a session to judge \u2014 the verdict needs at least one exchange from each side.</p>';return}let g=!(h instanceof Lt)||h.status>=500||h.status===429||p==="judge_unavailable";c.innerHTML=`<div class="flex flex-col items-center gap-3 py-4 text-center"><p class="text-sm text-slate-400">The judge couldn\u2019t reach a verdict just now. Your scorecard above is unaffected.</p>${g?'<button type="button" class="btn-ghost btn-sm" data-judge-retry>Try again</button>':""}</div>`,c.querySelector("[data-judge-retry]")?.addEventListener("click",v=>(v.currentTarget.disabled=!0,u()),{once:!0})})};u()}}function vs(r){return r.winner==="you"?{icon:Xe.trophy,title:"You win",sub:"The judge scored it for you.",tone:"tone-win"}:r.winner==="opponent"?{icon:Xe.target,title:"Your opponent takes this one",sub:"The judge scored it for them. Review the notes and run it back.",tone:"tone-lose"}:r.winner==="draw"?{icon:Xe.scale,title:"Dead even \u2014 a draw",sub:"The judge could not separate you.",tone:"text-slate-200 border border-ink-600 bg-ink-800/60"}:r.assessment==="strong"?{icon:Xe.trending,title:"Strong performance",sub:"The judge rates this session highly.",tone:"tone-win"}:r.assessment==="developing"?{icon:Xe.target,title:"Developing",sub:"Solid foundation \u2014 keep pushing on the notes below.",tone:"tone-lose"}:{icon:Xe.compass,title:"Needs work",sub:"The judge sees clear room to improve.",tone:"tone-bad"}}function P_(r,e,t){let i=r.querySelector("#verdict-body");if(!i)return;let n=vs(t),s=r.querySelector("#verdict-pill");s&&(s.innerHTML=`<span class="badge ${n.tone}">${ze(n.title)}</span>`);let a=(l,c)=>{let d=t.you?.[l],u=t.opponent?.[l],h=p=>p==null?0:Math.max(0,Math.min(100,p*10));return`<div class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-2.5">
      <span class="text-sm font-medium text-slate-300">${ze(c)}</span>
      <span class="text-sm tabular-nums"><span class="font-bold ${d>=u?"text-white":"text-slate-400"}">${Yn(d)}</span><span class="px-1.5 text-slate-600">vs</span><span class="font-bold ${u>d?"text-white":"text-slate-400"}">${Yn(u)}</span></span>
      <div class="col-span-2 grid grid-cols-2 gap-1.5">
        <div class="h-1.5 overflow-hidden rounded-full bg-ink-800"><div class="score-fill ml-auto h-full rounded-full bg-accent-500" style="width:0%" data-w="${h(d)}"></div></div>
        <div class="h-1.5 overflow-hidden rounded-full bg-ink-800"><div class="score-fill h-full rounded-full bg-slate-500" style="width:0%" data-w="${h(u)}"></div></div>
      </div></div>`};i.innerHTML=`
    <div class="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider"><span class="text-accent-400">You</span><span class="text-slate-400">${ze(e.personaLabel)}</span></div>
    <div class="divide-y divide-ink-700/60">${fd.map(([l,c])=>a(l,c)).join("")}</div>`;let o=r.querySelector("#judge-notes");o&&(o.innerHTML=`${t.reasoning?`<div class="mt-5 border-t border-ink-700 pt-5"><div class="mb-2 text-sm font-semibold text-white">Why the judge decided</div><p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">${ze(t.reasoning)}</p></div>`:""}
      ${t.turningPoint?`<div class="mt-4 rounded-xl border border-accent-500/30 bg-accent-500/5 p-4"><div class="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-300">Turning point</div><p class="text-sm leading-relaxed text-slate-300">${ze(t.turningPoint)}</p></div>`:""}`),requestAnimationFrame(()=>requestAnimationFrame(()=>i.querySelectorAll("[data-w]").forEach(l=>l.style.width=`${l.dataset.w}%`)))}function Rt(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var Wp=r=>`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed sm:text-[15px] ${r?"rounded-br-md border border-accent-500/30 bg-accent-500/10 text-slate-100":"rounded-bl-md border border-ink-700 bg-ink-800 text-slate-200"}`;function Wd(r){let e=new Date(r);return Number.isNaN(e.getTime())?r:e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}async function gd(r){r.innerHTML=`<div class="mx-auto max-w-4xl px-4 py-6 sm:py-10" id="history-root">${sl("list").outerHTML}</div>`;let e=r.querySelector("#history-root"),t,i=new Map;try{let p=await Dt("/api/debates");t=Array.isArray(p)?p:p.debates;try{i=new Map((await Zn()).map(g=>[g.id,g]))}catch{}}catch(p){e.replaceChildren(Kn(`Couldn\u2019t load your history. ${p instanceof Lt?`Error ${p.status}`:"Check your connection."}`,()=>gd(r)));return}let n=p=>`
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 class="text-display-lg text-white">History</h1>
        <p class="mt-1 text-sm text-slate-400" id="history-counter">${p} session${p===1?"":"s"}</p>
      </div>
      <a href="#/" class="btn-primary btn-sm shrink-0">+ New session</a>
    </div>`;if(t.length===0){e.innerHTML=`${n(0)}
      <div class="card px-6 py-16 text-center">
        <div class="mb-4 flex justify-center text-slate-500 [&>svg]:h-10 [&>svg]:w-10">${Xe.mic}</div>
        <p class="mb-1 font-semibold text-white">No sessions yet</p>
        <p class="mb-6 text-sm text-slate-400">Your sessions, transcripts and scorecards will live here.</p>
        <a href="#/" class="btn-primary">Start your first session</a>
      </div>`;return}e.innerHTML=`${n(t.length)}<div class="space-y-3" id="debate-list"></div>`;let s=e.querySelector("#debate-list"),a=p=>i.get(p)?.name||(p?p[0].toUpperCase()+p.slice(1):"Session"),o=p=>(Gp[wd(p).unit]||"Round").toLowerCase();async function l(p,g){if(await Ur({title:"Close & grade this session?",body:"The session ends here and you get your scorecard. You won\u2019t be able to continue it.",actions:[{label:"Close & grade",value:"y",kind:"primary"},{label:"Cancel",value:null}]})){g.disabled=!0,g.innerHTML='<span class="spinner"></span><span>Scoring\u2026</span>';try{await Ct("/api/debate/end",{debateId:p.id}),p.ended_at=new Date().toISOString(),u(),h(p.id)}catch{g.disabled=!1,g.textContent="Close & grade"}}}async function c(p,g){if(await Ur({title:"Delete this session?",body:`\u201C${ze(p.topic||"Untitled")}\u201D and its transcript and scores will be permanently removed.`,actions:[{label:"Delete permanently",value:"y",kind:"danger"},{label:"Cancel",value:null}]}))try{await uc(`/api/debates/${encodeURIComponent(p.id)}`),t=t.filter(m=>m.id!==p.id),g.style.transition="opacity .2s, transform .2s",g.style.opacity="0",g.style.transform="scale(0.98)",setTimeout(()=>t.length?u():gd(r),200)}catch{await Ur({title:"Couldn\u2019t delete",body:"Please try again.",actions:[{label:"OK",value:1,kind:"primary"}]})}}let d=new Map;function u(){d.clear(),e.querySelector("#history-counter").textContent=`${t.length} session${t.length===1?"":"s"}`,s.innerHTML="";for(let p of t){let g=!!p.ended_at,v=document.createElement("article");v.className="card p-4 sm:p-5",v.innerHTML=`
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-accent-400 [&>svg]:h-5 [&>svg]:w-5">${Sd[p.mode]??Xe.chat}</div>
          <button type="button" data-a="open" class="min-w-0 flex-1 text-left">
            <span class="block font-semibold leading-snug text-white line-clamp-2 hover:text-accent-300">${ze(p.topic||"Untitled session")}</span>
            <span class="mt-1 block text-xs leading-relaxed text-slate-400">${[a(p.mode),Wd(p.created_at),p.personaLabel?`vs ${p.personaLabel}`:"",p.targetRounds?`${p.targetRounds} ${o(p.mode)}s`:"open-ended"].filter(Boolean).map(ze).join(" \xB7 ")}</span>
          </button>
          <span class="badge ${g?"border-emerald-700/60 bg-emerald-500/10 text-emerald-300":"border-amber-500/40 bg-amber-500/10 text-amber-300"}">${g?p.overall!=null?`Your score ${Yn(p.overall)}/10`:"Finished":"In progress"}</span>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-700/60 pt-3">
          ${g?'<button type="button" data-a="open" class="btn-ghost btn-xs max-sm:min-h-[44px]">Transcript &amp; scores</button>':'<button type="button" data-a="resume" class="btn-primary btn-xs max-sm:min-h-[44px]">Resume</button><button type="button" data-a="close" class="btn-ghost btn-xs max-sm:min-h-[44px]">Close &amp; grade</button><button type="button" data-a="open" class="btn-ghost btn-xs max-sm:min-h-[44px]">Transcript</button>'}
          <button type="button" data-a="delete" class="ml-auto inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-950/50 hover:text-red-300" aria-label="Delete session" title="Delete session"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </div>
        <div data-detail class="hidden"></div>`,v.addEventListener("click",m=>{let f=m.target.closest("[data-a]");if(!f)return;let M=f.dataset.a;M==="resume"?location.hash=`#/session/${encodeURIComponent(p.id)}`:M==="open"?h(p.id):M==="close"?l(p,f):M==="delete"&&c(p,v)}),d.set(p.id,v),s.appendChild(v)}}async function h(p){let g=d.get(p);if(!g)return;let v=g.querySelector("[data-detail]");if(!v.classList.contains("hidden")&&v.dataset.loaded){v.classList.add("hidden");return}v.className="mt-4 border-t border-ink-700/60 pt-4",v.innerHTML='<p class="text-sm text-slate-500"><span class="spinner mr-2"></span>Loading\u2026</p>';try{let m=await Dt(`/api/debates/${encodeURIComponent(p)}`),f=m.debate.personaLabel||a(m.debate.mode),M=m.scorecard;v.dataset.loaded="1",v.innerHTML=`
        ${M?`<div class="mb-4 rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="mb-3 flex items-center justify-between"><span class="text-sm font-semibold text-white">Your score</span><span class="text-lg font-extrabold text-accent-400">${Yn(M.overall)}<span class="text-sm text-slate-500">/10</span></span></div>
          ${(M.dimensions||[]).length?`<div class="grid gap-x-6 gap-y-3 sm:grid-cols-2">${M.dimensions.map(w=>il(w.label,w.score)).join("")}</div>`:""}
          ${M.notes?`<p class="mt-3 text-sm leading-relaxed text-slate-400">${ze(M.notes)}</p>`:""}</div>`:""}
        ${m.verdict&&m.verdict.winner?`<p class="mb-4 text-sm text-slate-300"><span class="font-semibold text-white">Judge:</span> ${m.verdict.winner==="you"?"you won":m.verdict.winner==="draw"?"a draw":`${ze(f)} won`}${m.verdict.reasoning?` \u2014 ${ze(m.verdict.reasoning)}`:""}</p>`:""}
        <div class="transcript-scroll max-h-[55vh] space-y-3 overflow-y-auto pr-1">${(m.turns||[]).map(w=>{let _=w.role==="user";return`<div class="flex ${_?"justify-end":"justify-start"}"><div class="${Wp(_)}"><div class="mb-1 text-[11px] font-semibold uppercase tracking-wide ${_?"text-accent-400":"text-slate-500"}">${_?"You":ze(f)}</div><div class="whitespace-pre-wrap break-words">${ze(w.text)}</div></div></div>`}).join("")||'<p class="text-sm text-slate-500">No turns recorded.</p>'}</div>`,requestAnimationFrame(()=>requestAnimationFrame(()=>v.querySelectorAll("[data-w]").forEach(w=>w.style.width=`${w.dataset.w}%`)))}catch{v.innerHTML='<p class="text-sm text-red-300">Couldn\u2019t load that transcript. Try again.</p>'}}u()}function At(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ac(r){return r.replace(/\bdebates\b/gi,e=>e[0]===e[0].toUpperCase()?"Sessions":"sessions")}function Eh(r,e){try{return new Intl.NumberFormat(void 0,{style:"currency",currency:e.toUpperCase()}).format(r/100)}catch{return`${(r/100).toFixed(2)} ${e.toUpperCase()}`}}function I_(r){if(!r)return"\u2014";(typeof r=="number"||/^\d{9,11}$/.test(String(r)))&&(r=Number(r)*1e3);let e=new Date(r);return Number.isNaN(e.getTime())?r:e.toLocaleDateString(void 0,{month:"long",day:"numeric",year:"numeric"})}function Ys({title:r,body:e="",label:t="",type:i="text",value:n="",placeholder:s="",autocomplete:a="off",username:o="",readOnly:l=!1,confirm:c="OK",kind:d="primary",cancel:u="Cancel",validate:h=null}){return new Promise(p=>{let g=document.activeElement,v=`uip-${Date.now().toString(36)}`,m=document.createElement("div");m.className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in",m.setAttribute("role","dialog"),m.setAttribute("aria-modal","true"),m.setAttribute("aria-labelledby",`${v}-t`),m.innerHTML=`<form novalidate class="w-full max-w-md rounded-3xl border border-ink-700 bg-ink-900 p-6 shadow-2xl animate-pop-in">
      <h3 id="${v}-t" class="text-display-sm text-white">${ze(r)}</h3>
      ${e?`<p class="mt-2 text-sm leading-relaxed text-slate-400">${e}</p>`:""}
      ${o?`<input type="text" name="username" autocomplete="username" value="${ze(o)}" readonly tabindex="-1" aria-hidden="true" class="sr-only" />`:""}
      ${t?`<label for="${v}-i" class="mt-5 mb-1.5 block text-body-sm font-medium text-slate-300">${ze(t)}</label>`:""}
      <input id="${v}-i" type="${i}" class="field ${t?"":"mt-5"}" ${t?"":`aria-label="${ze(r)}"`} autocomplete="${a}" placeholder="${ze(s)}" ${l?"readonly":""} />
      <div class="hidden" data-err></div>
      <div class="mt-6 flex flex-col gap-2.5">
        <button type="submit" class="${d==="danger"?"btn-danger":"btn-primary"} w-full justify-center py-3">${ze(c)}</button>
        ${u?`<button type="button" data-cancel class="btn-ghost w-full justify-center py-3">${ze(u)}</button>`:""}
      </div>
    </form>`;let f=m.querySelector("form"),M=m.querySelector("input:not([name=username])"),w=m.querySelector("[data-err]"),_=m.querySelector('button[type="submit"]');M.value=n;let D=!1,A=T=>{document.removeEventListener("keydown",R),m.remove(),g&&g.isConnected&&typeof g.focus=="function"&&g.focus({preventScroll:!0}),p(T)},R=T=>{if(T.key==="Escape"&&!D)return A(null);if(T.key!=="Tab")return;let b=[...m.querySelectorAll("input:not([tabindex='-1']), button")].filter(U=>!U.disabled);if(!b.length)return;let x=b[0],C=b[b.length-1];T.shiftKey&&document.activeElement===x?(T.preventDefault(),C.focus()):!T.shiftKey&&document.activeElement===C&&(T.preventDefault(),x.focus())};document.addEventListener("keydown",R),m.addEventListener("click",T=>{D||(T.target===m||T.target.closest("[data-cancel]"))&&A(null)}),f.addEventListener("submit",async T=>{if(T.preventDefault(),D)return;let b=M.value;if(h){D=!0,Oa(_,!0,c);let x=null;try{x=await h(b)}catch{x="Something went wrong. Please try again."}if(D=!1,Oa(_,!1,c),x){Kr(w,x),w.classList.replace("mb-5","mt-4"),M.focus();return}}A(b)}),document.body.appendChild(m),M.focus(),l&&M.select()})}var $i=(r,e="")=>Ur({title:r,body:e&&ze(e),actions:[{label:"OK",value:1,kind:"primary"}]});async function vd(r){r.innerHTML='<div class="max-w-4xl mx-auto px-4 py-6 sm:py-10" id="account-root"></div>';let e=r.querySelector("#account-root");e.appendChild(sl("page"));let t,i;try{[t,i]=await Promise.all([Dt("/api/account"),Dt("/api/billing/prices")])}catch(L){e.innerHTML="";let P=L instanceof Lt?`Error ${L.status}`:"Check your connection and try again.";e.appendChild(Kn(`Couldn't load your account. ${P}`,()=>void vd(r)));return}let n=await Ks(),s=t.usage.quota>0?Math.min(100,t.usage.debates_used/t.usage.quota*100):0,a=t.subscription&&t.subscription.tier!=="none"&&t.subscription.status!=="canceled"?t.subscription:null,o=!!(t.isLifetime||a?.isLifetime),l={active:"Active",trialing:"Trial",past_due:"Payment issue \u2014 update your card in Manage billing",incomplete:"Payment pending",unpaid:"Payment issue \u2014 update your card in Manage billing"},c=a?l[a.status]||(a.status?a.status[0].toUpperCase()+a.status.slice(1).replace(/_/g," "):""):"",d=a?.current_period_end?I_(a.current_period_end):"";e.innerHTML="";let u=new URLSearchParams(location.hash.split("?")[1]??"");if(u.get("checkout")==="success"){let L=document.createElement("div");L.className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200",L.textContent="\u2713 Payment received \u2014 your account is updated. Thank you!",e.appendChild(L);try{let P="aai_purchase_"+(a?.stripe_subscription_id||a?.tier||"pack")+"_"+new Date().toISOString().slice(0,10);sessionStorage.getItem(P)||(sessionStorage.setItem(P,"1"),As("purchase",{plan:a?.tier||"pack",attribution:window.adversaryAttribution?.()||null}))}catch{}}else if(u.get("checkout")==="cancelled"){let L=document.createElement("div");L.className="mb-6 rounded-2xl border border-ink-700 bg-ink-800/60 p-4 text-sm text-slate-300",L.textContent="Checkout cancelled \u2014 nothing was charged.",e.appendChild(L)}let h=document.createElement("div");h.className="mb-8",h.innerHTML=`
    <p class="eyebrow mb-2">Settings</p>
    <h1 class="font-display text-display-lg text-white">Account</h1>
    <p class="text-slate-400 text-body-sm mt-1">${At(n?.email??t.email)}</p>`,e.appendChild(h);let p=document.createElement("div");p.className="grid sm:grid-cols-2 gap-4 mb-10",p.innerHTML=`
    <div class="card card-lift p-6">
      <div class="eyebrow mb-2">Plan</div>
      <div class="text-white font-semibold text-display-sm capitalize">${At(t.plan)}</div>
      ${o?'<p class="text-body-sm text-slate-400 mt-2">Lifetime access \u2014 no renewal, nothing to manage.</p>':a?`<div class="text-body-sm text-slate-400 mt-2">
               <span class="capitalize">${At(a.tier)}</span>${c?` \xB7 <span class="${/^Payment/.test(c)?"text-amber-300":""}">${At(c)}</span>`:""}
               ${d?`<div class="mt-1">${a.cancel_at_period_end?"Ends":"Renews"} ${At(d)}</div>`:""}
             </div>
             <button id="portal-btn" class="btn-ghost mt-5 px-4 py-2 text-sm">Manage billing</button>`:'<p class="text-body-sm text-slate-400 mt-2">No active subscription. Pick a plan below to keep practicing.</p>'}
    </div>

    <div class="card card-lift p-6">
      <div class="eyebrow mb-2">Usage this month</div>
      ${t.usage.quota<0?`<div class="text-white font-semibold text-display-sm">Unlimited <span class="text-slate-500 text-body-md font-normal">rounds</span></div>
           <p class="text-body-sm text-slate-400 mt-2">Owner / VIP access \u2014 unlimited sparring rounds.</p>`:t.usage.quota?`<div class="text-white font-semibold text-display-sm">${t.usage.debates_used}<span class="text-slate-500 text-body-md font-normal"> / ${t.usage.quota} rounds</span></div>
      <div class="h-2.5 rounded-full bg-ink-800 overflow-hidden mt-3" role="progressbar" aria-valuenow="${Math.round(s)}" aria-valuemin="0" aria-valuemax="100" aria-label="Monthly round usage">
        <div class="score-fill h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400" style="width:${s}%"></div>
      </div>`:`<div class="text-white font-semibold text-display-sm">${Math.max(0,(t.trialQuota??15)-(t.trialUsed??0))+(t.creditBalance||0)}<span class="text-slate-500 text-body-md font-normal"> rounds available</span></div>
           <p class="text-body-sm text-slate-400 mt-2">Free trial${t.creditBalance?" + round packs":""}. A round is one exchange with your opponent.</p>`}
      <div class="grid grid-cols-2 gap-3 mt-5 text-sm">
        <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
          <div class="eyebrow !text-[0.65rem]">Round Wallet</div>
          <div class="text-white font-semibold mt-1">${t.creditBalance} rounds</div>
        </div>
        <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
          <div class="eyebrow !text-[0.65rem]">Free trial</div>
          <div class="text-white font-semibold mt-1">${(t.trialQuota??15)-(t.trialUsed??0)<=0?"Used":(t.trialQuota??15)-(t.trialUsed??0)+" rounds left"}</div>
        </div>
      </div>
    </div>`,e.appendChild(p);let g=document.createElement("div");if(g.className="card card-lift p-6 mb-10",g.innerHTML=`
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <h2 class="text-lg text-white font-semibold">Have a promo code?</h2>
        </div>
        ${t.isLifetime?'<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">\u{1F451} Lifetime VIP Active</span>':""}
      </div>
      <p class="text-slate-400 text-body-sm mb-4">Got a code from a promotion, a school, or a friend? Redeem it here for bonus rounds.</p>
      <form id="promo-redeem-form" class="flex flex-wrap gap-2 max-w-md">
        <input type="text" id="promo-code-input" placeholder="Enter code" class="field flex-1 uppercase tracking-wider font-mono text-sm px-4 py-2.5 rounded-xl bg-ink-900 border border-ink-700 text-white focus:outline-none focus:border-accent-400" />
        <button type="submit" id="promo-redeem-btn" class="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm">Redeem</button>
      </form>
      <div id="promo-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>`,e.appendChild(g),setTimeout(()=>{let L=g.querySelector("#promo-redeem-form"),P=g.querySelector("#promo-code-input"),B=g.querySelector("#promo-redeem-btn"),H=g.querySelector("#promo-feedback");L&&L.addEventListener("submit",async Z=>{Z.preventDefault();let ne=(P.value||"").trim().toUpperCase();if(ne){B.disabled=!0,B.textContent="Checking\u2026",H.className="hidden mt-3 text-sm p-3 rounded-xl";try{let de=await fetch("/api/account/promo/redeem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:ne})}),me=await de.json();de.ok&&me.ok?(H.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block",H.textContent=me.message,P.value="",setTimeout(()=>vd(r),2e3)):(H.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",H.textContent=me.error||"Invalid code.")}catch{H.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",H.textContent="Network error. Try again."}finally{B.disabled=!1,B.textContent="Redeem"}}})},0),t.isOwner){let L=document.createElement("div");L.className="card card-lift p-6 mb-10 border border-amber-500/30 bg-amber-500/5",L.innerHTML=`
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">\u{1F451}</span>
          <h2 class="font-display text-lg text-amber-300 font-semibold">Admin: Grant Lifetime VIP</h2>
        </div>
        <p class="text-slate-300 text-body-sm mb-4">Instantly upgrade any registered email to Lifetime Champion VIP with 100,000 rounds and 10 photoreal video minutes a month. They need to sign up first.</p>
        <form id="admin-grant-form" class="flex flex-wrap gap-2 max-w-md">
          <input type="email" id="admin-grant-email" placeholder="family@gmail.com" class="field flex-1 text-sm px-4 py-2.5 rounded-xl bg-ink-900 border border-ink-700 text-white focus:outline-none focus:border-accent-400" />
          <button type="submit" id="admin-grant-btn" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">Grant VIP</button>
        </form>
        <div id="admin-grant-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>`,e.appendChild(L),setTimeout(()=>{let P=L.querySelector("#admin-grant-form"),B=L.querySelector("#admin-grant-email"),H=L.querySelector("#admin-grant-btn"),Z=L.querySelector("#admin-grant-feedback");P&&P.addEventListener("submit",async ne=>{ne.preventDefault();let de=(B.value||"").trim();if(de){H.disabled=!0,H.textContent="Granting\u2026",Z.className="hidden mt-3 text-sm p-3 rounded-xl";try{let me=await fetch("/api/account/admin/grant-vip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:de})}),ue=await me.json();me.ok&&ue.ok?(Z.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block",Z.textContent=ue.message,B.value=""):(Z.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",Z.textContent=ue.error||"Could not grant VIP.")}catch{Z.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",Z.textContent="Network error. Try again."}finally{H.disabled=!1,H.textContent="Grant VIP"}}})},0)}if(t.isOwner){let L=document.createElement("section");L.className="card mb-10 p-6",L.innerHTML=`<h2 class="text-lg font-semibold text-white">Admin: photoreal avatars (Champion)</h2>
      <p class="mt-1 text-sm text-slate-400">Every persona look is cast automatically with a matching LiveAvatar actor \u2014 nothing to set up. Override any of them here if you like. Historical figures always use their own portraits.</p>
      <div data-body class="mt-4"><button type="button" class="btn-ghost btn-sm" data-load>Load avatar catalog</button></div>`,e.appendChild(L);let P=L.querySelector("[data-body]");L.querySelector("[data-load]").addEventListener("click",async()=>{P.innerHTML='<p class="text-sm text-slate-400"><span class="spinner mr-2"></span>Loading\u2026</p>';try{let[B,H]=await Promise.all([Dt("/api/avatar/catalog"),Dt("/api/avatar/map")]),Z=ue=>`<option value="none" ${!ue||ue==="none"?"selected":""}>\u2014 3D (no video) \u2014</option>`+B.avatars.map(V=>`<option value="${At(V.id)}" ${V.id===ue?"selected":""}>${At(V.name||V.id)}${V.own?" (yours)":""}${V.gender?` \xB7 ${At(V.gender)}`:""}</option>`).join(""),ne={"man-pro":"Man \xB7 professional","woman-pro":"Woman \xB7 professional","older-man":"Older man","older-woman":"Older woman","man-casual":"Man \xB7 casual","woman-casual":"Woman \xB7 casual","teen-boy":"Young man","teen-girl":"Young woman","default-masc":"Man \xB7 default","default-fem":"Woman \xB7 default"},de=new Map(B.avatars.map(ue=>[ue.id,ue])),me=ue=>{let V=de.get(ue);return V?.image?`<img src="${At(V.image)}" alt="" class="h-full w-full object-cover object-top" loading="lazy" />`:'<span class="text-[10px] text-slate-500">3D</span>'};P.innerHTML=`<div class="grid gap-3 sm:grid-cols-2">${H.keys.map(ue=>`<div class="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-800/50 p-2.5"><div data-thumb="${At(ue.key)}" class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-900">${me(H.map[ue.key])}</div><label class="block min-w-0 flex-1"><span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">${At(ne[ue.key]||ue.label)}</span><select class="field text-sm" data-key="${At(ue.key)}">${Z(H.map[ue.key])}</select></label></div>`).join("")}</div>
          <div class="mt-4 flex flex-wrap items-center gap-3"><button type="button" class="btn-primary btn-sm" data-save>Save avatars</button><button type="button" class="btn-ghost btn-sm" data-auto>Auto-cast all persona looks</button><span data-msg class="text-sm text-slate-400"></span></div>`,P.querySelectorAll("select[data-key]").forEach(ue=>ue.addEventListener("change",()=>{let V=P.querySelector(`[data-thumb="${ue.dataset.key}"]`);V&&(V.innerHTML=me(ue.value))})),P.querySelector("[data-auto]").addEventListener("click",async ue=>{ue.target.disabled=!0;try{let V=await Ct("/api/avatar/map/auto",{});P.querySelectorAll("select[data-key]").forEach(Y=>{if(!V.map[Y.dataset.key])return;Y.value=V.map[Y.dataset.key];let ve=P.querySelector(`[data-thumb="${Y.dataset.key}"]`);ve&&(ve.innerHTML=me(Y.value))}),P.querySelector("[data-msg]").textContent="Re-cast and saved."}catch{P.querySelector("[data-msg]").textContent="Couldn\u2019t auto-cast \u2014 try again."}finally{ue.target.disabled=!1}}),P.querySelector("[data-save]").addEventListener("click",async ue=>{let V={};P.querySelectorAll("select[data-key]").forEach(Y=>V[Y.dataset.key]=Y.value||"none"),ue.target.disabled=!0;try{await Ct("/api/avatar/map",{map:V}),P.querySelector("[data-msg]").textContent="Saved."}catch{P.querySelector("[data-msg]").textContent="Couldn\u2019t save \u2014 try again."}finally{ue.target.disabled=!1}})}catch(B){P.innerHTML=`<p class="text-sm text-amber-300">${B instanceof Lt&&B.status===503?"Add the LIVEAVATAR_API_KEY secret in Cloudflare first (see README).":"Couldn\u2019t load the LiveAvatar catalog."}</p>`}})}let v=document.createElement("section");v.className="mb-10",v.innerHTML=`
    <h2 class="font-display text-display-md text-white mb-1">Schools &amp; education</h2>
    <p class="text-slate-400 text-body-sm mb-5">Create a school, invite students with a link, and pay centrally \u2014 $6 per seat per month.</p>
    <div class="card card-lift p-6">
      <div data-orgs class="space-y-2 mb-4"><p class="text-body-sm text-slate-500">Loading\u2026</p></div>
      <button class="btn-ghost px-4 py-2 text-sm" data-create-school>+ Create a school</button>
    </div>`,e.appendChild(v);let m=v.querySelector("[data-orgs]");async function f(){try{let{orgs:L}=await Dt("/api/orgs/mine");if(L.length===0){m.innerHTML=`<p class="text-body-sm text-slate-500">You're not part of any school yet.</p>`;return}m.innerHTML="";for(let P of L){let B=document.createElement("a");B.href=`#/org/${P.id}`,B.className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-800/60 border border-ink-700/60 px-4 py-3 hover:border-accent-600/60 transition-colors",B.innerHTML=`
          <span class="text-2xl" aria-hidden="true">\u{1F3EB}</span>
          <span>
            <span class="block text-white font-medium">${At(P.name)}</span>
            <span class="block text-body-sm text-slate-400 capitalize">${At(P.role)} \xB7 ${P.memberCount} members \xB7 ${P.sessionsUsed}/${P.sessionsPool} sessions${P.subscriptionActive?"":' \xB7 <span class="text-amber-300">no subscription</span>'}</span>
          </span>
          <span class="ml-auto text-accent-400 text-body-sm">Open \u2192</span>`,m.appendChild(B)}}catch{m.innerHTML=`<p class="text-body-sm text-slate-500">Couldn't load your schools.</p>`}}f(),v.querySelector("[data-create-school]").addEventListener("click",async()=>{let L=null;await Ys({title:"Create a school",label:"School name",autocomplete:"organization",placeholder:"e.g. Lincoln High Debate Team",confirm:"Create school",validate:async B=>{if(!B.trim())return"Enter a name for your school.";try{L=(await Ct("/api/orgs",{name:B.trim()})).org}catch{return"Could not create the school. Please try again."}}})!=null&&L&&(location.hash=`#/org/${L.id}`)});let w=!!n?.photoreal,_=!!n?.champion,D=a&&/active|trialing/.test(a.status||"")?a.tier:null,R={debater:["300 rounds / month","All 11 practice modes","Voiced 3D opponents with real lip-sync","Scorecards + impartial judge verdicts","Unused rounds roll over"],coach:["1,000 rounds / month \u2014 3\xD7 Debater","Everything in Debater","Best for daily practice, interview season & debate teams","Unused rounds roll over"],champion:["1,000 rounds / month",w?"Photoreal video opponents \u2014 150 min/month":"Photoreal video opponents (rolling out)","Strongest reasoning model \u2014 sharper opponents, deeper judge feedback","Everything in Coach"]},T=document.createElement("section");T.id="plans",T.innerHTML=`
    ${_?"":`<div class="card relative mb-6 overflow-hidden border-amber-500/30 p-6 sm:p-8">
      <div class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" aria-hidden="true"></div>
      <p class="eyebrow mb-2 !text-amber-300">Champion</p>
      <h2 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Practice against someone who looks you in the eye.</h2>
      <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">Pressure is what you're training for. Champion puts a photoreal human opponent on screen \u2014 real eye contact, real facial reactions, lips that match every word \u2014 driven by our sharpest reasoning model.</p>
      <ul class="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <li class="rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="font-semibold text-white">Photoreal video</div><div class="mt-1 text-slate-400">${w?"150 minutes a month of lifelike video opponents.":"Lifelike video opponents \u2014 rolling out to Champions first."}</div></li>
        <li class="rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="font-semibold text-white">Sharper opponent</div><div class="mt-1 text-slate-400">DeepSeek-V4-Pro finds the hole in your argument faster and pushes harder.</div></li>
        <li class="rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="font-semibold text-white">Deeper feedback</div><div class="mt-1 text-slate-400">The judge and coach run on the Pro model too \u2014 more specific notes, better turning points.</div></li>
      </ul>
    </div>`}
    <h2 class="text-display-md text-white mb-1">${D?"Your plan":"Choose a plan"}</h2>
    <p class="text-slate-400 text-body-sm mb-5">Monthly, cancel anytime. Unused rounds roll over.</p>
    <div class="grid gap-4 mb-6 lg:grid-cols-3" id="tier-grid"></div>
    <details class="card mb-10 p-5 text-sm">
      <summary class="cursor-pointer font-semibold text-white">Compare plans</summary>
      <div class="mt-4 overflow-x-auto"><table class="w-full min-w-[520px] text-left">
        <thead class="text-xs uppercase tracking-wider text-slate-500"><tr><th class="py-2 pr-4 font-semibold"></th><th class="py-2 pr-4">Debater</th><th class="py-2 pr-4">Coach</th><th class="py-2 text-amber-300">Champion</th></tr></thead>
        <tbody class="divide-y divide-ink-700/70 text-slate-300">
          <tr><td class="py-2.5 pr-4 text-slate-400">Rounds / month</td><td>300</td><td>1,000</td><td>1,000</td></tr>
          <tr><td class="py-2.5 pr-4 text-slate-400">Opponent on screen</td><td>3D, lip-synced</td><td>3D, lip-synced</td><td class="font-semibold text-white">Photoreal video${w?" (150 min)":" (rolling out)"}</td></tr>
          <tr><td class="py-2.5 pr-4 text-slate-400">Reasoning model</td><td>Standard</td><td>Standard</td><td class="font-semibold text-white">Pro</td></tr>
          <tr><td class="py-2.5 pr-4 text-slate-400">Judge & coach feedback</td><td>\u2713</td><td>\u2713</td><td class="font-semibold text-white">\u2713 Pro-level detail</td></tr>
          <tr><td class="py-2.5 pr-4 text-slate-400">All 11 modes \xB7 unused rounds roll over</td><td>\u2713</td><td>\u2713</td><td>\u2713</td></tr>
        </tbody></table></div>
    </details>`,e.appendChild(T);let b=document.createElement("section");b.innerHTML=`
    <h2 class="text-display-md text-white mb-1">Round packs</h2>
    <p class="text-slate-400 text-body-sm mb-5">One-time top-ups. Credits roll over and never expire \u2014 spent automatically when your plan quota runs out.</p>
    <div class="grid sm:grid-cols-3 gap-4" id="pack-grid"></div>`,e.appendChild(b);let x=e.querySelector("#tier-grid"),C=e.querySelector("#pack-grid");async function U(L,P,B){B.disabled=!0;let H=B.textContent;B.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Redirecting\u2026</span>';try{As("begin_checkout",{kind:L,item:P});let{url:Z}=await Ct("/api/billing/checkout",{kind:L,item:P});window.location.href=Z}catch(Z){if(B.disabled=!1,B.textContent=H??"",Z instanceof Lt&&Z.status===409)try{let{url:ne}=await Ct("/api/billing/portal");window.location.href=ne;return}catch{}$i("Couldn\u2019t start checkout","Please try again.")}}for(let L of i.tiers){let P=L.id==="champion",B=L.id==="coach",H=D===L.id,Z=R[L.id]||[`${(L.rounds||L.debates).toLocaleString()} rounds / month`],ne=document.createElement("div");ne.className=`card relative flex flex-col p-6 ${P?"border-amber-400/50 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_18px_50px_-20px_rgba(251,191,36,0.35)]":B?"border-accent-600/50":""}`,ne.innerHTML=`
      ${P?'<span class="badge mb-3 self-start border-amber-400/40 bg-amber-400/15 text-amber-200">Best experience</span>':B?'<span class="badge mb-3 self-start border-accent-500/40 bg-accent-500/10 text-accent-300">Most popular</span>':'<span class="mb-3 h-[22px]"></span>'}
      <div class="text-lg font-bold text-white">${At(ac(L.name))}</div>
      <div class="mb-4 mt-1"><span class="text-3xl font-extrabold tracking-tight ${P?"text-amber-300":"text-white"}">${At(Eh(L.price,L.currency))}</span><span class="text-sm text-slate-500"> /${At(L.interval)}</span></div>
      <ul class="mb-6 space-y-2 text-sm text-slate-300">${Z.map(me=>`<li class="flex gap-2"><span class="${P?"text-amber-300":"text-accent-400"}" aria-hidden="true">\u2713</span><span>${At(me)}</span></li>`).join("")}</ul>
      <button class="${H?"btn-ghost":P?"btn-primary !bg-amber-400 !text-black hover:!bg-amber-300":B?"btn-primary":"btn-ghost"} mt-auto py-2.5 text-sm" ${H?"disabled":""}>${H?"Current plan":`Choose ${At(ac(L.name))}`}</button>`;let de=ne.querySelector("button");H||de.addEventListener("click",()=>void U("subscription",L.id,de)),x.appendChild(ne)}/plans=1/.test(location.hash)&&setTimeout(()=>T.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),150),i.tiers.length===0&&(x.innerHTML='<p class="text-body-sm text-slate-500 col-span-full">No subscription tiers are available right now.</p>');for(let L of i.packs){let P=document.createElement("div");P.className="card p-6 flex flex-col transition-all duration-200 ease-out-expo hover:-translate-y-1 hover:shadow-lift",P.innerHTML=`
      <div class="font-semibold text-white text-lg">${At(ac(L.name))}</div>
      <div class="mt-2 mb-1"><span class="font-display text-display-md text-white">${At(Eh(L.price,L.currency))}</span></div>
      <p class="text-body-sm text-slate-300 mb-3">${(L.rounds||L.credits).toLocaleString()} sparring rounds \xB7 Credits roll over & never expire</p>
      <button class="btn-ghost mt-auto px-4 py-2.5 text-sm">Buy pack</button>`;let B=P.querySelector("button");B.addEventListener("click",()=>void U("pack",L.id,B)),C.appendChild(P)}i.packs.length===0&&(C.innerHTML='<p class="text-body-sm text-slate-500 col-span-full">No round packs are available right now.</p>'),e.appendChild(v);let G=document.createElement("section");G.className="mb-10",G.innerHTML=`<h2 class="font-display text-display-md text-white mb-1">Delete account</h2>
    <p class="text-slate-400 text-body-sm mb-4">Permanently deletes your account, sessions and scores. Any subscription is cancelled at the end of its billing period. This can\u2019t be undone.</p>
    <button type="button" class="btn-danger btn-sm" data-delete-account>Delete my account\u2026</button>`,e.appendChild(G),G.querySelector("[data-delete-account]").addEventListener("click",async()=>{if(await Ys({title:"Delete your account?",body:"All your sessions, scores and history will be erased. This cannot be undone.",label:"Enter your password to confirm",type:"password",autocomplete:"current-password",username:n?.email??t.email??"",confirm:"Delete everything",kind:"danger",cancel:"Keep my account",validate:async P=>{if(!P)return"Enter your password to confirm.";try{await Ct("/api/auth/delete-account",{password:P})}catch(B){return B instanceof Lt&&B.status===401?"That password didn\u2019t match.":"Couldn\u2019t delete the account \u2014 please email support@getadversaryai.com."}}})!=null){try{localStorage.clear()}catch{}location.hash="#/signup",location.reload()}});let W=e.querySelector("#portal-btn");W&&W.addEventListener("click",async()=>{W.disabled=!0,W.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Opening\u2026</span>';try{let{url:L}=await Ct("/api/billing/portal");window.location.href=L}catch{W.disabled=!1,W.textContent="Manage billing",$i("Couldn\u2019t open the billing portal","Please try again.")}})}function Na(r,e){r.className="error-box mb-5 animate-fade-in",r.setAttribute("role","alert"),r.innerHTML=`<span aria-hidden="true" class="shrink-0 mt-0.5 text-danger">${nl}</span><span></span>`,r.querySelector("span:last-child").textContent=e}function oc(r,e){let t=e?.error;return t==="code_exhausted"||r===410?"This invite link has reached its maximum number of uses. Ask your teacher for a new one.":t==="code_expired"?"This invite link has expired. Ask your teacher for a new one.":t==="already_member"?"You are already a member of this school.":t==="seats_exhausted"||t==="subscription_inactive"?"This school has filled all of its seats. Ask your teacher or school admin to purchase more seats, then try again.":t==="email_taken"||r===409?"An account with that email already exists. Log in first, then open the invite link again to join.":r===404?"We couldn't find that invite. Check the link and try again.":"Something went wrong. Please try again."}async function D_(r,e){let t=document.createElement("div");t.className="w-full max-w-md animate-fade-up",r.appendChild(bd()),r.appendChild(t),t.innerHTML=`
    <div class="text-center mb-8">
      <div class="text-5xl mb-4" aria-hidden="true">\u{1F3EB}</div>
      <h1 class="font-display text-display-lg text-white">Joining\u2026</h1>
      <p class="text-slate-400 mt-2 text-body-md">Checking your invite.</p>
    </div>`;let i;try{i=await Dt(`/api/orgs/join/${encodeURIComponent(e)}`)}catch(c){let d=c instanceof Lt?c.status:0;t.innerHTML=`
      <div class="text-center mb-8">
        <div class="text-5xl mb-4" aria-hidden="true">\u{1F3EB}</div>
        <h1 class="font-display text-display-lg text-white">Invite not valid</h1>
        <p class="text-slate-400 mt-2 text-body-md">${oc(d,c instanceof Lt?c.body:null)}</p>
        <a href="#/" class="link font-medium mt-6 inline-block">Back to AdversaryAI</a>
      </div>`;return}let n=i.role==="teacher"?"teacher":"student",s=await Ks();t.innerHTML=`
    <div class="text-center mb-8">
      <div class="text-5xl mb-4" aria-hidden="true">\u{1F3EB}</div>
      <h1 class="font-display text-display-lg text-white">Join ${lc(i.orgName)}</h1>
      <p class="text-slate-400 mt-2 text-body-md">You've been invited as a <span class="text-white font-medium">${n}</span>. Your school covers the cost \u2014 this is free for you.</p>
    </div>
    <div class="card p-6 sm:p-8 relative overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/60 to-transparent" aria-hidden="true"></div>
      <div class="hidden mb-5" data-error></div>
      <div data-body></div>
    </div>`;let a=t.querySelector("[data-error]"),o=t.querySelector("[data-body]");if(s){o.innerHTML=`
      <p class="text-body-sm text-slate-400 mb-5">Signed in as <span class="text-white">${lc(s.email)}</span></p>
      <button class="btn-primary w-full py-3" data-join>Join ${lc(i.orgName)}</button>`;let c=o.querySelector("[data-join]");c.addEventListener("click",async()=>{c.disabled=!0,c.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Joining\u2026</span>',a.classList.add("hidden");try{await Ct("/api/orgs/join",{code:i.code}),Zs(null),await Ks(!0),location.hash="#/"}catch(d){c.disabled=!1,c.textContent=`Join ${i.orgName}`,Na(a,oc(d instanceof Lt?d.status:0,d instanceof Lt?d.body:null))}});return}o.innerHTML=`
    <form novalidate>
      <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="join-email">Email</label>
      <input id="join-email" type="email" required autocomplete="email" placeholder="you@example.com" class="field mb-4" />
      <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="join-password">Password</label>
      <input id="join-password" type="password" required autocomplete="new-password" minlength="8" placeholder="Minimum 8 characters" class="field mb-6" />
      <button type="submit" class="btn-primary w-full py-3">Create account &amp; join</button>
    </form>
    <p class="text-center text-body-sm text-slate-500 mt-6">Already have an account? <a href="#/login" class="link font-medium">Log in</a>, then open this link again.</p>`;let l=o.querySelector("form");l.addEventListener("submit",async c=>{c.preventDefault();let d=l.querySelector("#join-email").value.trim(),u=l.querySelector("#join-password").value,h=l.querySelector('button[type="submit"]');if(a.classList.add("hidden"),!d||!u){Na(a,"Enter your email and password.");return}if(u.length<8){Na(a,"Password must be at least 8 characters.");return}h.disabled=!0,h.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Creating your account\u2026</span>';try{await Ct("/api/auth/signup",{email:d,password:u,inviteCode:i.code});let p=await Dt("/api/auth/me");Zs(p),location.hash="#/"}catch(p){h.disabled=!1,h.textContent="Create account & join",Na(a,oc(p instanceof Lt?p.status:0,p instanceof Lt?p.body:null))}})}function lc(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ni(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Ah(r){if(!r)return"Never";let e=new Date(r);return Number.isNaN(e.getTime())?r:e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function cc(r){let e={owner:"bg-amber-500/15 text-amber-300 border-amber-500/30",teacher:"bg-sky-500/15 text-sky-300 border-sky-500/30",student:"bg-slate-500/15 text-slate-300 border-slate-500/30"};return`<span class="inline-block text-caption font-semibold uppercase tracking-wider border rounded-full px-2.5 py-0.5 ${e[r]??e.student}">${ni(r)}</span>`}async function jp(r,e){r.innerHTML='<div class="max-w-4xl mx-auto px-4 py-6 sm:py-10" id="org-root"></div>';let t=r.querySelector("#org-root");t.appendChild(sl("page"));let i=new URLSearchParams(location.hash.split("?")[1]??"").get("checkout"),n;try{n=(await Dt(`/api/orgs/${encodeURIComponent(e)}`)).org}catch(w){t.innerHTML="";let _=w instanceof Lt&&w.status===403?"You are not a member of this school.":"Check your connection and try again.";t.appendChild(Kn(`Couldn't load this school. ${_}`,()=>void jp(r,e)));return}let s=n.role==="owner",a=s||n.role==="teacher",o=n.sessionsPool>0?Math.min(100,n.sessionsUsed/n.sessionsPool*100):0;t.innerHTML="",i==="success"?t.innerHTML+='<div class="card p-4 mb-6 border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-body-sm" role="status">Payment successful \u2014 your seats are active. It can take a minute for the new quota to appear.</div>':i==="cancelled"&&(t.innerHTML+='<div class="card p-4 mb-6 border-ink-600 text-slate-300 text-body-sm" role="status">Checkout was cancelled. No payment was taken.</div>');let l=document.createElement("div");l.className="mb-8 flex flex-wrap items-start justify-between gap-4",l.innerHTML=`
    <div>
      <p class="eyebrow mb-2">School</p>
      <h1 class="font-display text-display-lg text-white flex items-center gap-3">${ni(n.name)} ${cc(n.role)}</h1>
      <p class="text-slate-400 text-body-sm mt-2">
        ${n.subscriptionActive?'<span class="text-emerald-300">\u25CF Active subscription</span>':`<span class="text-amber-300">\u25CF No active subscription</span> \u2014 ${s?"buy seats below to activate the shared session pool.":"ask your school admin to activate billing."}`}
      </p>
    </div>
    <a href="#/account" class="btn-ghost px-4 py-2 text-sm">\u2190 Account</a>`,t.appendChild(l);let c=document.createElement("div");if(c.className="card card-lift p-6 mb-6",c.innerHTML=`
    <div class="eyebrow mb-2">Shared sessions this month</div>
    <div class="text-white font-semibold text-display-sm">${n.sessionsUsed}<span class="text-slate-500 text-body-md font-normal"> / ${n.sessionsPool} sessions</span></div>
    <div class="h-2.5 rounded-full bg-ink-800 overflow-hidden mt-3" role="progressbar" aria-valuenow="${Math.round(o)}" aria-valuemin="0" aria-valuemax="100" aria-label="School session usage">
      <div class="score-fill h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400" style="width:${o}%"></div>
    </div>
    <div class="grid grid-cols-3 gap-3 mt-5 text-sm">
      <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
        <div class="eyebrow !text-[0.65rem]">Seats</div>
        <div class="text-white font-semibold mt-1">${n.seatCount}</div>
      </div>
      <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
        <div class="eyebrow !text-[0.65rem]">Members</div>
        <div class="text-white font-semibold mt-1">${n.memberCount}</div>
      </div>
      <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
        <div class="eyebrow !text-[0.65rem]">Per seat</div>
        <div class="text-white font-semibold mt-1">300 rds/mo</div>
      </div>
    </div>`,t.appendChild(c),s){let w=document.createElement("div");w.className="card card-lift p-6 mb-6",w.innerHTML=`
      <h2 class="font-display text-display-md text-white mb-1">Billing</h2>
      <p class="text-slate-400 text-body-sm mb-5">$6 per seat per month. Each seat adds 300 shared sparring rounds per month. Students never pay.</p>
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="seats-input">Seats</label>
          <input id="seats-input" type="number" min="1" max="5000" value="${Math.max(n.seatCount,10)}" class="field w-32" />
        </div>
        <div class="text-body-sm text-slate-400 pb-2.5">= <span class="text-white font-semibold" data-total>$60</span>/month</div>
        <button class="btn-primary px-5 py-2.5 text-sm" data-buy>Buy seats</button>
        ${n.subscriptionActive?'<button class="btn-ghost px-5 py-2.5 text-sm" data-portal>Manage billing</button>':""}
      </div>
      <p class="text-body-sm text-slate-500 mt-3">Need more seats later? Use \u201CManage billing\u201D to change the quantity any time.</p>`,t.appendChild(w);let _=w.querySelector("#seats-input"),D=w.querySelector("[data-total]"),A=()=>{D.textContent=`$${(Math.max(1,Number(_.value)||0)*6).toLocaleString()}`};_.addEventListener("input",A),A();let R=w.querySelector("[data-buy]");R.addEventListener("click",async()=>{let b=Math.max(1,Math.floor(Number(_.value)||0));R.disabled=!0,R.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Redirecting\u2026</span>';try{let{url:x}=await Ct(`/api/orgs/${encodeURIComponent(n.id)}/checkout`,{seats:b});window.location.href=x}catch{R.disabled=!1,R.textContent="Buy seats",$i("Couldn\u2019t start checkout","Please try again.")}});let T=w.querySelector("[data-portal]");T&&T.addEventListener("click",async()=>{T.disabled=!0,T.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Opening\u2026</span>';try{let{url:b}=await Ct(`/api/orgs/${encodeURIComponent(n.id)}/portal`);window.location.href=b}catch{T.disabled=!1,T.textContent="Manage billing",$i("Couldn\u2019t open the billing portal","Please try again.")}})}if(!a)return;let d=document.createElement("div");d.className="card card-lift p-6 mb-6";let u=n.memberCount>=n.seatCount;d.innerHTML=`
    <h2 class="font-display text-display-md text-white mb-1">Invite links</h2>
    <p class="text-slate-400 text-body-sm mb-5">Share a link \u2014 students sign up free and join automatically. Rap battle is not available to school members.</p>
    ${n.subscriptionActive?u?`<div class="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-body-sm px-4 py-3 mb-5" role="status">All ${ni(String(n.seatCount))} seats are filled \u2014 new members are blocked until you purchase more seats.</div>`:`<p class="text-body-sm text-slate-500 mb-5">${ni(String(n.seatCount-n.memberCount))} of ${ni(String(n.seatCount))} seats still open.</p>`:'<div class="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-body-sm px-4 py-3 mb-5" role="status">No active subscription \u2014 new members are blocked from joining until you purchase seats.</div>'}
    <form data-create class="flex flex-wrap items-end gap-3 mb-6">
      <div>
        <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="inv-role">Role</label>
        <select id="inv-role" class="field w-36">
          <option value="student">Student</option>
          ${s?'<option value="teacher">Teacher</option>':""}
        </select>
      </div>
      <div>
        <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="inv-uses">Max uses</label>
        <input id="inv-uses" type="number" min="1" max="1000" value="50" class="field w-28" />
      </div>
      <div>
        <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="inv-days">Expires in (days)</label>
        <input id="inv-days" type="number" min="1" max="365" value="30" class="field w-28" />
      </div>
      <button type="submit" class="btn-primary px-5 py-2.5 text-sm">Create link</button>
    </form>
    <div data-list class="space-y-2"></div>`,t.appendChild(d);let h=d.querySelector("[data-list]"),p=w=>{if(w.length===0){h.innerHTML='<p class="text-body-sm text-slate-500">No invite links yet. Create one above.</p>';return}h.innerHTML="";for(let _ of w){let D=document.createElement("div");D.className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-800/60 border border-ink-700/60 px-4 py-3";let A=Math.max(0,_.max_uses-_.uses);D.innerHTML=`
        <code class="text-accent-300 font-mono text-sm">${ni(_.code)}</code>
        ${cc(_.role)}
        <span class="text-body-sm text-slate-400">${_.uses}/${_.max_uses} used${A===0?' \xB7 <span class="text-amber-300">exhausted</span>':""}</span>
        <span class="text-body-sm text-slate-500">expires ${ni(Ah(_.expires_at))}</span>
        <div class="ml-auto flex gap-2">
          <button class="btn-ghost px-3 py-1.5 text-sm" data-copy>Copy link</button>
          <button class="btn-ghost px-3 py-1.5 text-sm text-danger" data-revoke>Revoke</button>
        </div>`,D.querySelector("[data-copy]").addEventListener("click",async R=>{let T=R.currentTarget;try{await navigator.clipboard.writeText(_.url),T.textContent="Copied!",setTimeout(()=>{T.textContent="Copy link"},1500)}catch{Ys({title:"Copy this invite link",value:_.url,readOnly:!0,confirm:"Done",cancel:""})}}),D.querySelector("[data-revoke]").addEventListener("click",async()=>{if(await Ur({title:"Revoke this invite?",body:`Nobody new can join with <b>${ni(_.code)}</b> after this.`,actions:[{label:"Revoke invite",value:1,kind:"danger"},{label:"Cancel",value:null}]}))try{await uc(`/api/orgs/${encodeURIComponent(n.id)}/invites/${encodeURIComponent(_.code)}`),await M()}catch{$i("Couldn\u2019t revoke the invite","Please try again.")}}),h.appendChild(D)}},g=d.querySelector("[data-create]");g.addEventListener("submit",async w=>{w.preventDefault();let _=g.querySelector('button[type="submit"]');_.disabled=!0;try{let D=await Ct(`/api/orgs/${encodeURIComponent(n.id)}/invites`,{role:g.querySelector("#inv-role").value,maxUses:Number(g.querySelector("#inv-uses").value)||50,expiresInDays:Number(g.querySelector("#inv-days").value)||30}),A=!1;try{await navigator.clipboard.writeText(D.url),A=!0}catch{}Ys({title:A?"Invite link created and copied":"Invite link created",body:A?"It\u2019s on your clipboard \u2014 share it with your students.":"Copy it and share it with your students.",value:D.url,readOnly:!0,confirm:"Done",cancel:""}),await M()}catch{$i("Couldn\u2019t create the invite","Please try again.")}finally{_.disabled=!1}});let v=document.createElement("div");v.className="card card-lift p-6 mb-6",v.innerHTML=`
    <h2 class="font-display text-display-md text-white mb-1">Members</h2>
    <p class="text-slate-400 text-body-sm mb-5">${ni(String(n.memberCount))} people in ${ni(n.name)}.</p>
    <div data-list class="space-y-2"></div>`,t.appendChild(v);let m=v.querySelector("[data-list]"),f=w=>{m.innerHTML="";for(let _ of w){let D=document.createElement("div");D.className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-800/60 border border-ink-700/60 px-4 py-3",D.innerHTML=`
        <span class="text-white text-body-md">${ni(_.email)}</span>
        ${cc(_.role)}
        <span class="text-body-sm text-slate-500">joined ${ni(Ah(_.joined_at))}</span>
        ${s&&_.role!=="owner"?'<button class="btn-ghost px-3 py-1.5 text-sm text-danger ml-auto" data-remove>Remove</button>':""}`;let A=D.querySelector("[data-remove]");A&&A.addEventListener("click",async()=>{if(await Ur({title:"Remove this member?",body:`<b>${ni(_.email)}</b> will lose access to ${ni(n.name)}.`,actions:[{label:"Remove member",value:1,kind:"danger"},{label:"Cancel",value:null}]}))try{await uc(`/api/orgs/${encodeURIComponent(n.id)}/members/${encodeURIComponent(_.id)}`),await M()}catch{$i("Couldn\u2019t remove that member","Please try again.")}}),m.appendChild(D)}};async function M(){try{let w=await Dt(`/api/orgs/${encodeURIComponent(e)}`);p(w.org.invites??[]),f(w.org.members??[])}catch{}}p(n.invites??[]),f(n.members??[])}var Dn;async function Ks(r=!1){if(Dn!==void 0&&!r)return Dn;try{Dn=await Dt("/api/auth/me")}catch(e){if(e instanceof Lt&&e.status===401)Dn=null;else throw e}return Dn}function Zs(r){Dn=r}var Ui=document.getElementById("app");um();function dc(r){let e=document.createElement("header");e.className="app-header border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20",e.innerHTML=`
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
      <a href="#/" class="flex items-center gap-2 shrink-0">
        <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true" class="shrink-0"><rect width="512" height="512" rx="112" fill="#0d0f14"/><polygon points="256,104 400,392 112,392" fill="none" stroke="#e8392e" stroke-width="34" stroke-linejoin="round"/><g fill="#e8392e"><rect x="165" y="264" width="22" height="44" rx="11"/><rect x="193" y="244" width="22" height="84" rx="11"/><rect x="221" y="226" width="22" height="120" rx="11"/><rect x="249" y="212" width="22" height="148" rx="11"/><rect x="277" y="230" width="22" height="112" rx="11"/><rect x="305" y="248" width="22" height="76" rx="11"/><rect x="333" y="266" width="22" height="40" rx="11"/></g></svg>
        <span class="font-display text-lg tracking-tight">Adversary<span class="text-accent-500">AI</span></span>
      </a>
      <nav class="hidden md:flex items-center gap-1 sm:gap-2 text-sm">
        <a href="#/" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">Practice</a>
        <a href="#/arena" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white font-medium flex items-center gap-1"><span class="text-amber-400">\u{1F525}</span> Arena</a>
        <a href="#/history" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">History</a>
        <a href="#/account" class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">Account</a>
        <span id="theme-toggle-slot" class="ml-1"></span><span id="admin-mode-slot" class="ml-1.5"></span>
        <button id="logout-btn" class="ml-1 px-3 py-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-white hover:border-slate-500">Log out</button>
      </nav>
      <div class="flex md:hidden items-center gap-1">
        <span id="theme-toggle-slot-mobile"></span>
        <button id="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu" class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
        </button>
      </div>
    </div>
    <div id="mobile-menu" class="hidden md:hidden border-t border-ink-700 bg-ink-900 px-4 py-2 text-sm">
      <a href="#/" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">Practice</a>
      <a href="#/arena" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800 font-medium">\u{1F525} Community Arena</a>
      <a href="#/history" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">History</a>
      <a href="#/account" class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">Account</a>
      <div id="admin-mode-slot-mobile" class="mt-1"></div><button id="logout-btn-mobile" class="mt-1 w-full text-left px-3 py-2.5 rounded-lg border border-ink-700 text-slate-400 hover:text-white hover:border-slate-500">Log out</button>
    </div>`,e.querySelector("#theme-toggle-slot").appendChild(hc()),e.querySelector("#theme-toggle-slot-mobile").appendChild(hc()),(function(){if(!(r&&(r.isOwner||r.plan==="owner")))return;function l(u){let h=document.createElement("button");h.type="button",h.className=u?"w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between mb-1.5":"px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all";function p(){(document.cookie.match(/adversaryai_admin_mode=([^;]+)/)?.[1]||localStorage.getItem("adversaryai_admin_mode")||"premium").toLowerCase()==="regular"?(h.style.cssText="border-color:rgba(56,189,248,0.5);background:rgba(56,189,248,0.12);color:#7dd3fc;cursor:pointer;",h.innerHTML=u?'<span>\u{1F451} Admin Mode:</span><span class="font-bold text-cyan-300">\u26A1 Regular (Flash)</span>':'<span style="color:#fbbf24">\u{1F451}</span><span>\u26A1 Regular (Flash)</span>'):(h.style.cssText="border-color:rgba(251,191,36,0.5);background:rgba(251,191,36,0.12);color:#fde68a;cursor:pointer;",h.innerHTML=u?'<span>\u{1F451} Admin Mode:</span><span class="font-bold text-amber-300">\u2726 Premium (Pro)</span>':'<span style="color:#fbbf24">\u{1F451}</span><span>\u2726 Premium (Pro)</span>')}return p(),h.addEventListener("click",async()=>{let v=(document.cookie.match(/adversaryai_admin_mode=([^;]+)/)?.[1]||localStorage.getItem("adversaryai_admin_mode")||"premium").toLowerCase()==="regular"?"premium":"regular";document.cookie="adversaryai_admin_mode="+v+";path=/;max-age=31536000;SameSite=Lax;Secure",localStorage.setItem("adversaryai_admin_mode",v);try{await fetch("/api/account/admin-mode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:v})})}catch{}document.querySelectorAll("[data-adm-btn]").forEach(m=>m.__sc&&m.__sc()),$i("Switched to "+(v==="regular"?"Regular Mode (DeepSeek-V4-Flash)":"Premium Mode (DeepSeek-V4-Pro)"))}),h.setAttribute("data-adm-btn","1"),h.__sc=p,h}let c=e.querySelector("#admin-mode-slot"),d=e.querySelector("#admin-mode-slot-mobile");c&&c.appendChild(l(!1)),d&&d.appendChild(l(!0))})();let t=async()=>{try{await Ct("/api/auth/logout")}finally{Zs(null),location.hash="#/login"}};e.querySelector("#logout-btn").addEventListener("click",t),e.querySelector("#logout-btn-mobile").addEventListener("click",t);let i=e.querySelector("#menu-btn"),n=e.querySelector("#mobile-menu"),s=o=>{n.classList.toggle("hidden",!o),i.setAttribute("aria-expanded",String(o)),i.setAttribute("aria-label",o?"Close menu":"Open menu")};i.addEventListener("click",()=>s(n.classList.contains("hidden"))),n.querySelectorAll("a").forEach(o=>o.addEventListener("click",()=>s(!1))),Ui.innerHTML="",Ui.appendChild(e);let a=document.createElement("main");a.className="flex-1 w-full",a.appendChild(r),Ui.appendChild(a)}function Rh(r){Ui.innerHTML="";let e=document.createElement("main");e.className="flex-1 w-full flex items-center justify-center px-4 py-10",e.appendChild(r),Ui.appendChild(e)}function Ch(r){let e=document.createElement("header");e.className="app-header border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20",e.innerHTML=`<div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
    <a href="#/" class="flex shrink-0 items-center gap-2" aria-label="AdversaryAI home">
      <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true" class="shrink-0"><rect width="512" height="512" rx="112" fill="#0d0f14"/><polygon points="256,104 400,392 112,392" fill="none" stroke="#e8392e" stroke-width="34" stroke-linejoin="round"/><g fill="#e8392e"><rect x="165" y="264" width="22" height="44" rx="11"/><rect x="193" y="244" width="22" height="84" rx="11"/><rect x="221" y="226" width="22" height="120" rx="11"/><rect x="249" y="212" width="22" height="148" rx="11"/><rect x="277" y="230" width="22" height="112" rx="11"/><rect x="305" y="248" width="22" height="76" rx="11"/><rect x="333" y="266" width="22" height="40" rx="11"/></g></svg>
      <span class="font-display text-lg tracking-tight">Adversary<span class="text-accent-500">AI</span></span>
    </a>
    <nav class="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
      <a href="#/arena" class="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-accent-400 hover:text-accent-300 sm:flex"><span class="text-base" aria-hidden="true">\u{1F525}</span> Community Arena</a>
      <a href="#/login" class="whitespace-nowrap rounded-lg px-2 py-2.5 text-slate-300 hover:bg-ink-800 hover:text-white sm:px-3">Log in</a>
      <a href="#/signup" class="btn-primary btn-sm whitespace-nowrap px-3 text-xs sm:text-sm"><span class="min-[360px]:hidden">Try free</span><span class="max-[359px]:hidden">Start Free Trial</span></a>
    </nav>
  </div>`,Ui.innerHTML="",Ui.appendChild(e);let t=document.createElement("main");t.className="flex-1 w-full",t.appendChild(r),Ui.appendChild(t)}async function U_(r,e){r.innerHTML=`<div class="max-w-4xl mx-auto px-4 py-8 text-center text-slate-400">
    <div class="inline-block animate-spin text-2xl mb-3">\u26A1</div>
    <p>Loading spectator match\u2026</p>
  </div>`;let t;try{t=await Dt("/api/public/debate/"+encodeURIComponent(e))}catch{r.innerHTML=`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <div class="text-4xl mb-3">\u{1F512}</div>
      <h1 class="text-2xl font-bold text-white mb-2">Debate Not Available</h1>
      <p class="text-sm text-slate-400 mb-6">This debate may be private or has been removed by the author.</p>
      <a href="#/arena" class="btn-primary text-sm">Browse Public Arena</a>
    </div>`;return}let i=new Map;try{i=new Map((await Zn()).map(A=>[A.id,A]))}catch{}let n=A=>i.get(A)?.name||(A?A[0].toUpperCase()+A.slice(1):"Debate"),{debate:s,turns:a,verdict:o,votes:l,userVote:c,reactions:d,userReactions:u}=t,h=l||{you:0,opponent:0,draw:0,total:0},p=c,g=d||{},v=new Set(u||[]),m=s.personaLabel||s.personality||"AI Sparring Partner",f=`${location.origin}/debate/${s.id}`;r.isConnected&&(document.title=`Who won? ${s.topic||"Arena match"} \xB7 AdversaryAI`);function M(){let A=h.total||0,R=A>0?Math.round(h.you/A*100):50,T=A>0?100-R:50,b=[{key:"fire",emoji:"\u{1F525}",label:"Brilliant"},{key:"skull",emoji:"\u{1F480}",label:"Savage"},{key:"brain",emoji:"\u{1F9E0}",label:"High IQ"},{key:"flag",emoji:"\u{1F6A9}",label:"Fallacy"},{key:"clap",emoji:"\u{1F44F}",label:"Respect"}];return`
    <div class="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div class="flex items-center justify-between gap-3 mb-6">
        <a href="#/arena" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <span>\u2190</span> Back to Community Arena
        </a>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 font-mono">\u{1F441}\uFE0F ${s.views||1} views</span>
          <button type="button" id="copy-watch-btn" class="btn-ghost btn-sm shrink-0 whitespace-nowrap">Copy Link</button>
        </div>
      </div>

      <div class="rounded-3xl border border-ink-700 bg-gradient-to-b from-ink-800/90 to-ink-900/90 p-6 sm:p-8 mb-6 shadow-xl">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent-500/15 text-accent-300 border border-accent-500/30">
            ${Rt(n(s.mode))}
          </span>
          <span class="text-xs text-slate-500">Match held on ${Rt(Wd(s.createdAt))}</span>
        </div>
        <h1 class="font-display text-2xl sm:text-3xl text-white font-bold mb-4 leading-tight">${Rt(s.topic)}</h1>
        <div class="flex items-center gap-3 text-sm text-slate-300">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center border border-accent-500/40">${Nt('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',16)}</span>
            <span class="font-semibold text-white">Human Debater</span>
          </div>
          <span class="text-slate-500 font-bold">VS</span>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-ink-700 text-slate-200 font-bold flex items-center justify-center text-xs border border-ink-600">AI</span>
            <span class="font-semibold text-accent-300">${Rt(m)}</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-accent-500/40 bg-ink-900 p-6 sm:p-7 mb-6 shadow-lg relative overflow-hidden" id="voting-card">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-accent-400 flex items-center gap-1.5">
              <span>\u{1F5F3}\uFE0F</span> Community Spectator Verdict
            </div>
            <h2 class="text-lg sm:text-xl font-bold text-white mt-0.5">Who won this debate?</h2>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            <span id="vote-count-label" class="font-bold text-white">${A}</span> spectator vote${A===1?"":"s"} cast
          </div>
        </div>

        <div class="mb-4">
          <div class="flex justify-between text-xs font-bold mb-1.5">
            <span class="text-emerald-400 flex items-center gap-1">Human Debater (${R}%)</span>
            <span class="text-rose-400 flex items-center gap-1">(${T}%) ${Rt(m)}</span>
          </div>
          <div class="w-full h-3 rounded-full bg-ink-950 overflow-hidden flex border border-ink-700">
            <div id="user-vote-bar" class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style="width:${R}%"></div>
            <div id="opp-vote-bar" class="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500" style="width:${T}%"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5" id="vote-buttons-grid">
          <button type="button" data-vote="you" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${p==="you"?"border-emerald-500 bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-500/50":"border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-emerald-400 font-bold mb-0.5">Vote For</span>
            <span>\u{1F3C6} Human Debater</span>
          </button>
          <button type="button" data-vote="opponent" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${p==="opponent"?"border-rose-500 bg-rose-500/20 text-rose-200 ring-2 ring-rose-500/50":"border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-rose-400 font-bold mb-0.5">Vote For</span>
            <span>\u{1F916} ${Rt(m)}</span>
          </button>
          <button type="button" data-vote="draw" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${p==="draw"?"border-amber-500 bg-amber-500/20 text-amber-200 ring-2 ring-amber-500/50":"border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-amber-400 font-bold mb-0.5">Vote For</span>
            <span>\u2696\uFE0F Dead Even Draw</span>
          </button>
        </div>

        <div class="pt-4 border-t border-ink-800 flex flex-wrap items-center justify-between gap-3">
          <div class="text-xs text-slate-400 font-medium">React to match quality:</div>
          <div class="flex flex-wrap items-center gap-1.5" id="reactions-tray">
            ${b.map(x=>`
              <button type="button" data-react="${x.key}" class="react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all ${v.has(x.key)?"border-accent-500 bg-accent-500/25 text-white ring-1 ring-accent-500":"border-ink-700 bg-ink-800/80 text-slate-300 hover:border-slate-500"}">
                <span>${x.emoji}</span>
                <span>${x.label}</span>
                <span class="text-[10px] text-slate-400 font-mono ml-0.5" data-react-count="${x.key}">${g[x.key]||0}</span>
              </button>
            `).join("")}
          </div>
        </div>
      </div>

      ${o?`
      <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6 sm:p-8 mb-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-accent-400 text-2xl">\u2696\uFE0F</span>
          <div>
            <div class="text-white font-semibold text-lg">Official AI Judge Verdict</div>
            <p class="text-xs text-slate-500">Impartial evaluation \u2014 both sides scored by the identical 4-dimension rubric.</p>
          </div>
        </div>
        
        <div class="rounded-xl border ${vs(o).tone} px-5 py-4 mb-6 text-center">
          <div class="mb-2 flex justify-center opacity-90">${vs(o).icon}</div>
          <div class="font-display text-2xl font-semibold">${Rt(vs(o).title)}</div>
          <p class="text-sm opacity-80 mt-1">${Rt(vs(o).sub)}</p>
        </div>

        <div class="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Human Debater</div>
            <div class="space-y-4">
              ${fd.map(([x,C])=>il(C,o.you?.[x]??null)).join("")}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">${Rt(m)}</div>
            <div class="space-y-4">
              ${fd.map(([x,C])=>il(C,o.opponent?.[x]??null)).join("")}
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-ink-800/60 border border-ink-700 p-5 mb-4">
          <div class="text-sm font-semibold text-slate-300 mb-2">The judge's reasoning</div>
          <p class="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">${Rt(o.reasoning||"Scoring rendered.")}</p>
        </div>

        ${o.turningPoint?`
        <div class="rounded-xl border border-accent-500/30 bg-accent-500/5 p-5">
          <div class="text-sm font-semibold text-accent-300 mb-2">Decisive turning point</div>
          <p class="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">${Rt(o.turningPoint)}</p>
        </div>`:""}
      </div>
      `:""}

      <div class="rounded-2xl border border-ink-700 bg-ink-900 p-4 sm:p-6 mb-6">
        <div class="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-ink-700">
          <div>
            <h2 class="text-white font-semibold text-lg">Full Sparring Replay</h2>
            <p class="text-xs text-slate-400 mt-0.5">${a.length} exchange${a.length===1?"":"s"} recorded</p>
          </div>
        </div>
        <div class="space-y-4" id="turns-container">
          ${a.map(x=>{let C=x.role==="user"||x.role==="you";return`
            <div class="flex ${C?"justify-end":"justify-start"}">
              <div class="${Wp(C)}">
                <div class="flex items-center justify-between gap-3 mb-1.5">
                  <span class="text-[11px] font-semibold uppercase tracking-wide ${C?"text-accent-400":"text-slate-400"}">
                    ${C?"Human Debater":Rt(m)}
                  </span>
                  ${C?"":`<button type="button" data-play-text="${encodeURIComponent(x.text)}" class="speak-turn-btn text-[11px] text-accent-400 hover:text-accent-300 font-semibold flex items-center gap-1 cursor-pointer">\u{1F50A} Listen</button>`}
                </div>
                <div class="whitespace-pre-wrap break-words">${Rt(x.text)}</div>
              </div>
            </div>`}).join("")}
        </div>
      </div>

      <div class="rounded-3xl border border-accent-500/40 bg-gradient-to-r from-accent-500/20 via-ink-900 to-ink-900 p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-accent-400">Step Into The Arena</span>
          <h2 class="text-xl sm:text-2xl font-bold text-white mt-1">Think you have better arguments?</h2>
          <p class="text-sm text-slate-300 mt-1 max-w-lg">Spar directly against ${Rt(m)} or any of our 11 practice modes. Real-time 3D voice lip-sync and instant coaching scores.</p>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          <a href="#/setup/${encodeURIComponent(s.mode||"debate")}" class="btn-primary w-full py-3 text-sm sm:w-auto">
            Spar ${Rt(m)} Free
          </a>
          <a href="#/signup" class="btn-ghost w-full py-3 text-sm sm:w-auto">
            Claim 15 Free Rounds
          </a>
        </div>
      </div>
    </div>`}r.innerHTML=M();let w=r.querySelector("#copy-watch-btn");w&&w.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(f),w.textContent="Copied!",setTimeout(()=>{w.textContent="Copy Link"},2e3)}catch{Ys({title:"Share this match",value:f,readOnly:!0,confirm:"Done",cancel:""})}}),r.querySelectorAll(".speak-turn-btn").forEach(A=>{A.addEventListener("click",()=>{let R=decodeURIComponent(A.getAttribute("data-play-text")||"");if(R)if("speechSynthesis"in window){window.speechSynthesis.cancel();let T=new SpeechSynthesisUtterance(R);T.rate=1.05,T.pitch=.95,A.textContent="\u{1F50A} Speaking\u2026",T.onend=()=>{A.textContent="\u{1F50A} Listen"},T.onerror=()=>{A.textContent="\u{1F50A} Listen"},window.speechSynthesis.speak(T)}else $i("Can\u2019t read this aloud","Speech isn\u2019t supported in this browser.")})});let _=r.querySelector("#vote-buttons-grid");_&&_.querySelectorAll(".vote-action-btn").forEach(A=>{A.addEventListener("click",async()=>{let R=A.getAttribute("data-vote");if(R){_.querySelectorAll(".vote-action-btn").forEach(T=>{T.disabled=!0});try{let T=await Ct("/api/public/debate/"+encodeURIComponent(s.id)+"/vote",{vote:R});if(T.ok&&T.votes){h=T.votes,p=T.vote;let b=h.total||0,x=b>0?Math.round(h.you/b*100):50,C=b>0?100-x:50,U=r.querySelector("#user-vote-bar"),G=r.querySelector("#opp-vote-bar"),W=r.querySelector("#vote-count-label");U&&(U.style.width=x+"%"),G&&(G.style.width=C+"%"),W&&(W.textContent=String(b)),_.querySelectorAll(".vote-action-btn").forEach(L=>{L.getAttribute("data-vote")===p?L.className="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all border-accent-500 bg-accent-500/20 text-white ring-2 ring-accent-500/50":L.className="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"})}}catch{$i("Couldn\u2019t record your vote","Please try again.")}finally{_.querySelectorAll(".vote-action-btn").forEach(T=>{T.disabled=!1})}}})});let D=r.querySelector("#reactions-tray");D&&D.querySelectorAll(".react-pill-btn").forEach(A=>{A.addEventListener("click",async()=>{let R=A.getAttribute("data-react");if(R)try{let T=await Ct("/api/public/debate/"+encodeURIComponent(s.id)+"/react",{reaction:R});T.ok&&T.reactions&&(g=T.reactions,T.active?v.add(R):v.delete(R),D.querySelectorAll("[data-react-count]").forEach(b=>{let x=b.getAttribute("data-react-count");x&&g[x]!==void 0&&(b.textContent=String(g[x]))}),T.active?A.className="react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all border-accent-500 bg-accent-500/25 text-white ring-1 ring-accent-500":A.className="react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all border-ink-700 bg-ink-800/80 text-slate-300 hover:border-slate-500")}catch{}})})}async function xd(r){r.innerHTML=`<div class="max-w-6xl mx-auto px-4 py-8 text-center text-slate-400">
    <div class="inline-block animate-spin text-2xl mb-3">\u26A1</div>
    <p>Loading Community Arena\u2026</p>
  </div>`;let e=[];try{let o=await Dt("/api/public/debates");e=Array.isArray(o)?o:o.debates||[]}catch{r.innerHTML=`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 class="text-2xl font-bold text-white mb-2">Couldn't Load Arena</h1>
      <p class="text-sm text-slate-400 mb-6">Check your internet connection and try again.</p>
      <button type="button" id="arena-retry" class="btn-primary text-sm">Try again</button>
    </div>`,r.querySelector("#arena-retry").addEventListener("click",()=>xd(r));return}let t=new Map;try{t=new Map((await Zn()).map(o=>[o.id,o]))}catch{}let i=o=>t.get(o)?.name||(o?o[0].toUpperCase()+o.slice(1):"Debate");function n(o,l="all"){if(o.length===0){let c=l==="all";return`
      <div class="card px-6 py-14 text-center sm:py-16">
        <div class="mb-3 text-4xl" aria-hidden="true">\u{1F3DB}\uFE0F</div>
        <h2 class="mb-2 text-xl font-bold text-white">${c?"The Arena just opened":"No public matches in this category yet"}</h2>
        <p class="mx-auto mb-6 max-w-md text-sm leading-relaxed text-slate-400">${c?'No public matches yet. Finish a practice session, then tap <b class="text-slate-200">Publish to Arena</b> on your scorecard \u2014 yours will be the first one the community watches and votes on.':'Try \u201CAll matches\u201D, or publish one of your own from your scorecard with <b class="text-slate-200">Publish to Arena</b>.'}</p>
        <a href="#/" class="btn-primary">${c?"Start a practice session":"Start your match"}</a>
      </div>`}return`
    <div class="grid md:grid-cols-2 gap-5">
      ${o.map(c=>{let d=c.votes?.total||0,u=d>0?Math.round((c.votes.you||0)/d*100):50,h=d>0?100-u:50,p=c.personaLabel||c.personality||"AI Partner",g='<span class="text-xs px-2.5 py-0.5 rounded-full border border-ink-700 text-slate-400 bg-ink-800">Scored</span>';return c.winner==="you"?g='<span class="text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 font-semibold">\u{1F3C6} Human Won</span>':c.winner==="opponent"?g='<span class="text-xs px-2.5 py-0.5 rounded-full border border-rose-500/40 text-rose-300 bg-rose-500/10 font-semibold">\u{1F916} '+Rt(p)+" Won</span>":c.winner==="draw"&&(g='<span class="text-xs px-2.5 py-0.5 rounded-full border border-amber-500/40 text-amber-300 bg-amber-500/10 font-semibold">\u2696\uFE0F Draw</span>'),`
        <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6 flex flex-col justify-between hover:border-slate-500 transition-all shadow-md">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-[11px] font-bold uppercase tracking-wider text-accent-400">${Rt(i(c.mode))}</span>
              ${g}
            </div>
            <a href="#/watch/${encodeURIComponent(c.id)}" class="block group">
              <h3 class="text-lg font-bold text-white group-hover:text-accent-300 transition-colors line-clamp-2 mb-2 leading-snug">${Rt(c.topic)}</h3>
            </a>
            <div class="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <span>Human</span>
              <span class="text-slate-600 font-bold">VS</span>
              <span class="font-semibold text-slate-200">${Rt(p)}</span>
              <span class="text-slate-600">\xB7</span>
              <span>${Rt(Wd(c.createdAt))}</span>
            </div>
          </div>

          <div>
            <div class="rounded-xl bg-ink-800/80 border border-ink-700/60 p-3 mb-4">
              <div class="flex justify-between text-[11px] font-semibold mb-1 text-slate-300">
                <span class="text-emerald-400">Human (${u}%)</span>
                <span class="text-xs text-slate-400 font-mono">${d} vote${d===1?"":"s"}</span>
                <span class="text-rose-400">${Rt(p)} (${h}%)</span>
              </div>
              <div class="w-full h-2 rounded-full bg-ink-950 overflow-hidden flex border border-ink-700">
                <div class="h-full bg-emerald-500" style="width:${u}%"></div>
                <div class="h-full bg-rose-500" style="width:${h}%"></div>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span class="whitespace-nowrap text-xs text-slate-500 font-mono">\u{1F441}\uFE0F ${c.views||0} views</span>
              <div class="flex items-center gap-2">
                <a href="#/setup/${encodeURIComponent(c.mode||"debate")}?topic=${encodeURIComponent(c.topic)}" class="btn-ghost btn-sm whitespace-nowrap">Spar Topic</a>
                <a href="#/watch/${encodeURIComponent(c.id)}" class="btn-primary btn-sm whitespace-nowrap">Watch &amp; Vote &rarr;</a>
              </div>
            </div>
          </div>
        </div>`}).join("")}
    </div>`}r.innerHTML=`
  <div class="max-w-6xl mx-auto px-4 py-6 sm:py-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-accent-400 mb-1">SPECTATOR FEED & COMMUNITY RATINGS</p>
        <h1 class="font-display text-3xl sm:text-4xl text-white font-bold">\u{1F525} The Community Arena</h1>
        <p class="text-sm text-slate-400 mt-2 max-w-xl">
          Watch real human debaters spar against relentless AI archetypes, see the AI judge's official scoring, and vote on who made the winning arguments.
        </p>
      </div>
      <a href="#/" class="btn-primary shrink-0 self-start text-sm md:self-auto">+ Spar a Topic Yourself</a>
    </div>

    ${e.length?`<div class="flex flex-wrap items-center gap-2 mb-6" id="arena-filter-bar">
      <button type="button" data-filter="all" class="pill-chip" aria-pressed="true">All matches (${e.length})</button>
      <button type="button" data-filter="debate" class="pill-chip" aria-pressed="false">Debate &amp; Worldviews</button>
      <button type="button" data-filter="historical" class="pill-chip" aria-pressed="false">Historical Figures</button>
      <button type="button" data-filter="sales" class="pill-chip" aria-pressed="false">Negotiation &amp; Sales</button>
    </div>`:""}

    <div id="arena-feed-grid">
      ${n(e)}
    </div>
  </div>`;let s=r.querySelector("#arena-filter-bar"),a=r.querySelector("#arena-feed-grid");s&&a&&s.querySelectorAll("button").forEach(o=>{o.addEventListener("click",()=>{s.querySelectorAll("button").forEach(u=>u.setAttribute("aria-pressed",String(u===o)));let l=o.getAttribute("data-filter"),c={debate:["debate","rapbattle"],historical:["historical"],sales:["sales","negotiation"]},d=l==="all"?e:e.filter(u=>(c[l]||[l]).includes(u.mode));a.innerHTML=n(d,l)})})}async function rl(){window.__sessionCleanup?.();let r=location.hash.replace(/^#/,"")||"/",e=r.startsWith("/")?r:"/"+r,t=e.split("?")[0].replace(/\/+$/,"")||"/",i=await Ks()!==null,n=t.match(/^\/join\/([A-Za-z0-9]+)$/),s={"/login":"Log in","/signup":"Sign up","/history":"History","/account":"Account","/arena":"Community Arena"}[t]||[[/^\/setup\//,"Set up a session"],[/^\/session\//,"Session"],[/^\/watch\//,"Arena match"],[/^\/org\//,"School"],[/^\/join\//,"Join a school"]].find(([p])=>p.test(t))?.[1];if(document.title=s?`${s} \xB7 AdversaryAI`:"AdversaryAI \u2014 Practice against anyone",n){let p=document.createElement("div");Rh(p),await D_(p,n[1].toUpperCase());return}let a=t.match(/^\/watch\/([A-Za-z0-9_-]+)$/),o=t==="/arena";if(a){let p=document.createElement("div");i?dc(p):Ch(p),await U_(p,a[1]);return}if(o){let p=document.createElement("div");i?dc(p):Ch(p),await xd(p);return}if(t==="/login"||t==="/signup"){if(i){let g=new URLSearchParams(e.split("?")[1]||"").get("next");location.hash=g&&/^\/[\w\-\/?=&%.]*$/.test(g)?"#"+g:"#/";return}let p=document.createElement("div");Rh(p),t==="/login"?gm(p):vm(p);return}if(!i){let p=e!=="/"?e:"";location.hash=p?`#/signup?next=${encodeURIComponent(p)}`:"#/signup";return}if(t==="/debate"){location.hash="#/";return}let l=document.createElement("div");dc(l);let c={"/":()=>xm(l),"/history":()=>gd(l),"/account":()=>vd(l),"/arena":()=>xd(l)},d=t.match(/^\/session\/([^/?]+)(?:\?(.+))?$/),u=t.match(/^\/setup\/([^/]+)$/),h=t.match(/^\/org\/([^/?]+)(?:\?(.+))?$/);try{if(u)await Hm(l,decodeURIComponent(u[1]));else if(h)await jp(l,decodeURIComponent(h[1]));else if(d)await $p(l,decodeURIComponent(d[1]));else{let p=c[t];p?await p():(document.title="Page not found \xB7 AdversaryAI",l.innerHTML=`<div class="max-w-2xl mx-auto px-4 py-16 text-center text-slate-400">
          <h1 class="text-3xl font-display text-white mb-3">Page not found</h1>
          <p class="mb-6">That corner of the arena doesn't exist.</p>
          <a href="#/" class="btn-primary">Back to practice</a>
        </div>`)}}catch(p){console.error("route render failed",p),document.title="Something went wrong \xB7 AdversaryAI";let g=document.createElement("a");g.href="#/",g.className="link -mt-8 block pb-10 text-center text-sm",g.textContent="Back to practice",l.replaceChildren(Kn("This page hit an unexpected error. Try again, or head back to practice.",()=>rl().catch(()=>{})),g)}}window.addEventListener("hashchange",()=>{rl().catch(r=>{console.error("route failed",r),Ui.innerHTML="",Ui.appendChild(Kn("Couldn\u2019t load that page. Check your connection and try again.",()=>rl().catch(()=>{})))})});rl().catch(r=>{console.error("initial route failed",r),Ui.innerHTML=`<div class="max-w-xl mx-auto px-4 py-20 text-center text-slate-400">
    <h1 class="text-2xl text-white mb-3">AdversaryAI couldn't start</h1>
    <p>Check your connection and reload.</p>
  </div>`});"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})});
