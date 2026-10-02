var lu=["viseme_sil","viseme_aa","viseme_aa","viseme_O","viseme_E","viseme_RR","viseme_I","viseme_U","viseme_O","viseme_aa","viseme_O","viseme_aa","viseme_kk","viseme_RR","viseme_nn","viseme_SS","viseme_CH","viseme_TH","viseme_FF","viseme_DD","viseme_kk","viseme_PP"],cu={viseme_sil:0,viseme_aa:.85,viseme_O:.8,viseme_U:.75,viseme_E:.7,viseme_I:.6,viseme_RR:.6,viseme_nn:.6,viseme_SS:.65,viseme_CH:.75,viseme_TH:.6,viseme_FF:.85,viseme_DD:.6,viseme_kk:.55,viseme_PP:1},du={viseme_aa:.55,viseme_O:.4,viseme_U:.25,viseme_E:.3,viseme_I:.18,viseme_CH:.2,viseme_RR:.2,viseme_TH:.12,viseme_DD:.15,viseme_kk:.18,viseme_nn:.12,viseme_SS:.08},Rl=class{constructor(){this.ctx=null,this.gain=null,this.analyser=null,this.freq=null,this.time=null,this.gen=0,this.sources=new Set,this.track=[],this.nextStart=0,this.speakingUntil=0,this.segs=[],this.sink=null,this.pendingSink=void 0,this.remote=!1,this.utterId="",this.sinkChain=Promise.resolve(),this.listeners=new Set,this.blockedListeners=new Set,this.lastUtterance=null,this._state="idle",this._cls={lowAvg:0,last:0,lastAt:0,lastPlosiveAt:-1e9}}get state(){return this._state}on(e){return this.listeners.add(e),()=>this.listeners.delete(e)}_emit(e){if(e!==this._state){this._state=e;for(let t of this.listeners)try{t(e)}catch{}}}onBlocked(e){return this.blockedListeners.add(e),()=>this.blockedListeners.delete(e)}_blocked(e=!0){for(let t of this.blockedListeners)try{t(e)}catch{}}_checkBlocked(){let e=this.ctx;e&&e.state!=="running"&&e.state!=="closed"&&this._state==="speaking"&&this._blocked(!0)}ensureContext(){if(!this.ctx){let e=window.AudioContext||window.webkitAudioContext;if(!e)throw new Error("Web Audio unsupported");this.ctx=new e({latencyHint:"interactive"}),this.gain=this.ctx.createGain(),this.analyser=this.ctx.createAnalyser(),this.analyser.fftSize=1024,this.analyser.smoothingTimeConstant=.45,this.gain.connect(this.analyser),this.analyser.connect(this.ctx.destination),this.freq=new Uint8Array(this.analyser.frequencyBinCount),this.time=new Uint8Array(this.analyser.fftSize),this.ctx.onstatechange=()=>this.ctx?.state==="running"&&this._blocked(!1)}return this.ctx.state!=="running"&&this.ctx.state!=="closed"&&this.ctx.resume().catch(()=>{}),this.ctx}unlock(){try{navigator.audioSession&&navigator.audioSession.type!=="playback"&&(navigator.audioSession.type="playback")}catch{}try{let e=this.ensureContext(),t=e.createBuffer(1,1,e.sampleRate),i=e.createBufferSource();i.buffer=t,i.connect(e.destination),i.start()}catch{}}heardTime(){let e=this.ctx;if(!e)return 0;let t=(typeof e.outputLatency=="number"?e.outputLatency:0)||e.baseLatency||0;return e.currentTime-t}stop(){if(this.gen++,this.remote)try{this.sink?.interrupt()}catch{}this.remote=!1;for(let e of this.sources)try{e.onended=null,e.stop()}catch{}this.sources.clear(),this.track=[],this.segs=[],this.nextStart=0,this.speakingUntil=0,this._emit("idle")}reset(){this.stop(),this.lastUtterance=null}begin(){this.stop(),this.ensureContext(),this.pendingSink!==void 0&&(this.sink=this.pendingSink,this.pendingSink=void 0),this.remote=!!(this.sink&&this.sink.ready),this.utterId=cm(),this.sinkChain=Promise.resolve(),this.gain.gain.value=this.remote?0:1;let e=this.gen,t=[];this.lastUtterance={segments:t,complete:!1};let i=0,r=!1,s,a=new Promise(d=>s=d),o=()=>{if(r&&i===0&&this.sources.size===0&&e===this.gen){let d=()=>{e===this.gen&&(this._emit("idle"),s(!0))};this.remote&&this.sink?this._whenRemoteQuiet(e,d):d()}},l=this,c=Promise.resolve();return{get active(){return e===l.gen},enqueue(d,u=null){if(e!==l.gen)return Promise.resolve(!1);i++;let h=l.ctx.decodeAudioData(d.slice(0)).catch(g=>(console.warn("[voice] decode failed",g),null)),p=c.then(async()=>{try{let g=await h;return!g||e!==l.gen?!1:(t.push({buffer:g,visemes:u}),l._schedule(g,u,e,o),!0)}finally{i--,o()}});return c=p.catch(()=>{}),p},enqueueDecoded(d,u=null){return e!==l.gen?!1:(t.push({buffer:d,visemes:u}),l._schedule(d,u,e,o),!0)},end(){if(!r&&l.remote&&e===l.gen){let d=l.utterId;l.sinkChain=l.sinkChain.then(()=>l.sink?.speakEnd(d)).catch(()=>{})}r=!0,l.lastUtterance.complete=!0,o()},done:a}}_schedule(e,t,i,r){let s=this.ctx,a=Math.max(s.currentTime+.05,this.nextStart),o=s.createBufferSource();if(o.buffer=e,o.connect(this.gain),o.onended=()=>{this.sources.delete(o),i===this.gen&&r()},this.sources.add(o),o.start(a),this.remote&&this.sink){let d=this.utterId;this.sinkChain=this.sinkChain.then(()=>dm(e)).then(u=>i===this.gen&&this.remote&&this.sink?.speak(d,u)).catch(u=>console.warn("[voice] photoreal send failed",u))}this.nextStart=a+e.duration,this.speakingUntil=this.nextStart;let l=!!(t&&t.length);if(this.segs.push({start:a,end:a+e.duration,hasVis:l}),this.segs.length>60&&this.segs.splice(0,this.segs.length-60),l){for(let d of t)this.track.push({t:a+d.ms/1e3,name:lu[d.id]||"viseme_sil"});this.track.push({t:a+e.duration,name:"viseme_sil"})}let c=s.currentTime-2;this.track.length>400&&(this.track=this.track.filter(d=>d.t>c)),s.state!=="running"&&(s.resume().catch(()=>{}),clearTimeout(this._blockT),this._blockT=setTimeout(()=>this._checkBlocked(),600)),this._emit("speaking")}replay(){let e=this.lastUtterance;if(!e||!e.segments.length)return null;let t=e.segments.slice(),i=this.begin();for(let r of t)i.enqueueDecoded(r.buffer,r.visemes);return i.end(),i}setSink(e){if(!e&&this.sink){this.gain&&(this.gain.gain.value=1),this.remote=!1,this.sink=null,this.pendingSink=void 0;return}this.pendingSink=e}_whenRemoteQuiet(e,t){let i=performance.now(),r=()=>{if(e!==this.gen)return;(!this.sink||!this.sink.talking)&&performance.now()-i>300||performance.now()-i>8e3?t():setTimeout(r,120)};setTimeout(r,120)}hasReplay(){return!!(this.lastUtterance&&this.lastUtterance.segments.length)}frame(){let e={speaking:!1,level:0,viseme:null,prev:null,next:null,freq:null};if(!this.ctx||!this.speakingUntil)return e;let i=this.heardTime();e.speaking=i<this.speakingUntil+.03,this.analyser.getByteTimeDomainData(this.time);let r=0;for(let a=0;a<this.time.length;a++){let o=(this.time[a]-128)/128;r+=o*o}if(e.level=Math.min(1,Math.sqrt(r/this.time.length)*4.5),this.analyser.getByteFrequencyData(this.freq),e.freq=this.freq,!e.speaking)return e;let s=this.segs.find(a=>i>=a.start-.02&&i<a.end+.02);if(s&&s.hasVis&&this.track.length){let a=i+.05,o=this._findIdx(a);if(o<0)return e;let l=this.track[o],c=this.track[o+1],d=this.track[o-1],u=c?Math.max(.02,c.t-l.t):.12,h=Math.min(1,(a-l.t)/Math.min(.07,u));e.viseme={name:l.name,weight:h},e.prev=d&&i-l.t<.07?{name:d.name,weight:1-h}:null;let p=c?c.t-a:1/0;return e.next=c&&p<.07?{name:c.name,weight:1-p/.07}:null,e}return e.viseme={name:this._classify(),weight:1},e}_findIdx(e){let t=this.track,i=0,r=t.length-1,s=-1;for(;i<=r;){let a=i+r>>1;t[a].t<=e?(s=a,i=a+1):r=a-1}return s}_classify(){let e=this.freq,t=this.ctx.sampleRate/this.analyser.fftSize,i=(l,c)=>{let d=Math.max(1,Math.floor(l/t)),u=Math.min(e.length-1,Math.ceil(c/t)),h=0;for(let p=d;p<=u;p++)h+=e[p];return h/Math.max(1,u-d+1)},r=this._cls,s=performance.now(),a=i(90,8e3),o;if(a<14)r.lowAvg*=.9,o=0;else{let l=i(150,1100),c=i(5500,8e3),d=i(2600,5200),u=i(90,320);if(r.lowAvg>4&&u>3*r.lowAvg&&u>20&&s-r.lastPlosiveAt>160)o=21,r.lastPlosiveAt=s,r.lowAvg=u;else if(r.lowAvg+=(u-r.lowAvg)*.12,c>14&&c>=l)o=15;else if(d>12&&d>=l*1.2)o=16;else{let h=0,p=0,g=Math.max(1,Math.floor(200/t)),v=Math.min(e.length-1,Math.ceil(2500/t));for(let m=g;m<=v;m++)h+=e[m]*m*t,p+=e[m];let f=p>40?h/p:800;o=f<620?8:f<900?2:f<1200?4:6}}return o!==r.last&&(o===0||s-r.lastAt>=80)&&(r.last=o,r.lastAt=s),lu[r.last]||"viseme_sil"}};function cm(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)}async function dm(n){let t=Math.max(1,Math.ceil(n.duration*24e3)),i=window.OfflineAudioContext||window.webkitOfflineAudioContext,r=new i(1,t,24e3),s=r.createBufferSource();s.buffer=n,s.connect(r.destination),s.start();let o=(await r.startRendering()).getChannelData(0),l=[];for(let c=0;c<o.length;){let d=c===0?Math.round(9600):24e3,u=Math.min(d,o.length-c),h=new Uint8Array(u*2),p=new DataView(h.buffer);for(let v=0;v<u;v++){let f=Math.max(-1,Math.min(1,o[c+v]));p.setInt16(v*2,f<0?f*32768:f*32767,!0)}let g="";for(let v=0;v<h.length;v+=32768)g+=String.fromCharCode.apply(null,h.subarray(v,v+32768));l.push(btoa(g)),c+=u}return l}var Fe=new Rl;if(typeof window<"u"){window.__voice=Fe,window.addEventListener("pagehide",()=>Fe.stop());let n=()=>{let t=Fe.ctx;document.visibilityState!=="visible"||!t||t.state==="running"||t.state==="closed"||(t.resume().catch(()=>{}),setTimeout(()=>Fe._checkBlocked(),400))};document.addEventListener("visibilitychange",n),window.addEventListener("pageshow",n),window.addEventListener("focus",n);let e=()=>{let t=Fe.ctx;t&&t.state!=="running"&&t.state!=="closed"&&t.resume().catch(()=>{})};document.addEventListener("touchend",e,{capture:!0,passive:!0}),document.addEventListener("click",e,{capture:!0,passive:!0})}var um="/app/vendor/speech-sdk.min.js",ss=null,Cl=0;function uu(){return!window.SpeechSDK&&Date.now()-Cl<300*1e3}function ca(){return window.SpeechSDK?Promise.resolve(window.SpeechSDK):ss||(Date.now()-Cl<300*1e3?Promise.resolve(null):(ss=new Promise(n=>{let e=document.createElement("script");e.src=um,e.async=!0;let t=setTimeout(()=>n(null),1e4);e.onload=()=>{clearTimeout(t),n(window.SpeechSDK||null)},e.onerror=()=>{clearTimeout(t),n(null)},document.head.appendChild(e)}).then(n=>(n||(ss=null,Cl=Date.now()),n)),ss))}var Al={},as={};async function hu(n=!1){let e=n?"hd":"std",t=Al[e];return t&&Date.now()-t.at<480*1e3?t:(as[e]||(as[e]=(async()=>{let i=await fetch(`/api/speech/token${n?"?hd=1":""}`,{method:"POST",credentials:"include"});if(!i.ok)throw new Error(`token http ${i.status}`);let r=await i.json();if(!r.token||!r.region)throw new Error("token malformed");return Al[e]={token:r.token,region:r.region,at:Date.now()},Al[e]})().finally(()=>delete as[e])),as[e])}function os(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}function hm(n){let e=n.split(/\n+/).map(i=>i.trim()).filter(Boolean);return`<prosody rate="+6%">${e.map((i,r)=>{let s=i.match(/^(.*?)([^\s]+?)([^\w']*)$/),a=s?`${os(s[1])}<prosody rate="-12%" pitch="+6%" volume="+12%">${os(s[2])}</prosody>${os(s[3])}`:os(i);return r===e.length-1?a:`${a}<break time="${(r+1)%4===0?420:190}ms"/>`}).join(" ")}</prosody>`}function pm(n,e){let i=e.rap&&!e.hd?hm(n):os(n),r=e.style&&!e.hd?`<mstts:express-as style="${e.style}"${e.styleDegree?` styledegree="${e.styleDegree}"`:""}>${i}</mstts:express-as>`:i;return`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${e.voice}">${r}</voice></speak>`}async function mm(n,e,t,i=1e4){let{token:r,region:s}=await hu(!!t.hd),a=n.SpeechConfig.fromAuthorizationToken(r,s);a.speechSynthesisVoiceName=t.voice,a.speechSynthesisOutputFormat=n.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;let o=n.AudioOutputStream.createPullStream(),l=new n.SpeechSynthesizer(a,n.AudioConfig.fromStreamOutput(o)),c=[];l.visemeReceived=(d,u)=>c.push({id:u.visemeId,ms:u.audioOffset/1e4});try{let d=await new Promise((u,h)=>{let p=setTimeout(()=>h(new Error("synthesis timeout")),i);l.speakSsmlAsync(pm(e,t),g=>{clearTimeout(p),u(g)},g=>{clearTimeout(p),h(new Error(String(g||"synthesis error")))})});if(d.reason!==n.ResultReason.SynthesizingAudioCompleted||!d.audioData?.byteLength)throw new Error("synthesis failed: "+(d.errorDetails||d.reason));return{audio:d.audioData,visemes:c}}finally{try{l.close()}catch{}}}function pu({voiceCfg:n,onFallback:e,transform:t=i=>i}){let i=Fe.begin();hu(!!n.hd).catch(()=>{});let r=[],s="",a=0,o=!1,l=!1,c=!1,d=!1,u=!0,h=0,p=f=>{if(n.rap){let S=h===0?2:4,k=0,R=0,E=0;for(;;){let b=s.indexOf(`
`,k);if(b===-1)break;if(s.slice(k,b).trim()&&R++,k=b+1,R>=S){r.push({text:s.slice(E,k).trim(),offset:a+E}),E=k,R=0,h++;break}}if(E)return s=s.slice(E),a+=E,p(f);if(f&&s.trim()&&(r.push({text:s.trim(),offset:a}),a+=s.length,s=""),s.length<=260||s.includes(`
`))return}let m=/[.!?…]+["'”’)\]]*\s+/g,T,M=0;for(;(T=m.exec(s))!==null;)if(T.index+T[0].length-M>=25){let S=s.slice(M,T.index+T[0].length);r.push({text:S.trim(),offset:a+M}),M=T.index+T[0].length}if(s.length-M>420){let S=s.lastIndexOf(" ",M+360),k=S>M+150?S:M+360;r.push({text:s.slice(M,k).trim(),offset:a+M}),M=k}f&&s.slice(M).trim()&&(r.push({text:s.slice(M).trim(),offset:a+M}),M=s.length),s=s.slice(M),a+=M},g=(f,m="")=>{l||d||(l=!0,r.length=0,e?.(f,i,m))},v=async()=>{if(!(c||l||d||!i.active)){c=!0;try{let f=await ca();if(!f)return g(r[0]?.offset??a,r[0]?t(r[0].text):"");let m=null,T=M=>{let S=t(M.text),k=Math.max(1e4,4e3+40*S.length)+(u?5e3:0);return u=!1,{item:M,promise:mm(f,S,n,k).catch(R=>({err:R||new Error("synthesis error")}))}};for(;!d&&i.active;){if(!m){let E=r.shift();if(!E)break;m=T(E)}let M=m;m=null;let S=r.shift();S&&(m=T(S));let k=await M.promise;if(k.err&&!/timeout/.test(String(k.err.message||k.err))&&!d&&i.active&&(console.warn("[voice] SDK synthesis failed, retrying once",k.err),k=await T(M.item).promise),k.err)return console.warn("[voice] SDK synthesis failed, falling back",k.err),g(M.item.offset,t(M.item.text));if(d||!i.active)return;if(!await i.enqueue(k.audio,k.visemes)&&i.active&&!d)return g(M.item.offset,t(M.item.text))}}finally{c=!1,i.active?!l&&!d&&r.length?v():!l&&!d&&o&&!r.length&&i.end():(d=!0,r.length=0)}}};return{utter:i,push(f){d||l||!i.active||(s+=f,p(!1),r.length&&v())},finish({dropTail:f=!1}={}){if(!d){if(!i.active)return void(d=!0);o=!0,f&&(s=s.match(/^[\s\S]*[.!?…]+["'”’)\]]*(?=\s|$)/)?.[0]??""),p(!0),!l&&(r.length?v():c||i.end())}},cancel(){d=!0,r.length=0},get failed(){return l},get offset(){return a},pending(){return!d&&!l&&(c||r.length>0||!o&&s.trim().length>0)}}}var fm="/app/vendor/livekit-client.umd.js",gm="https://cdn.jsdelivr.net/npm/livekit-client@2.15.7/dist/livekit-client.umd.js",vm=6e4,xm=3e4,da=null;function mu(n){return new Promise(e=>{let t=document.createElement("script");t.src=n,t.async=!0,t.onload=()=>e(!0),t.onerror=()=>e(!1),document.head.appendChild(t)})}function _m(){return window.LivekitClient?Promise.resolve(window.LivekitClient):(da||(da=(async()=>await mu(fm)&&window.LivekitClient||await mu(gm)&&window.LivekitClient?window.LivekitClient:(da=null,null))()),da)}async function fu(n){try{let e=await fetch(`/api/avatar/status?debateId=${encodeURIComponent(n)}`,{credentials:"include"});return e.ok?await e.json():null}catch{return null}}var ua=class{constructor({stage:e,debateId:t,onStatus:i}){this.stage=e,this.debateId=t,this.onStatus=i||(()=>{}),this.ready=!1,this.talking=!1,this.disposed=!1,this.starting=null,this.lastActivity=Date.now(),this.video=document.createElement("video"),this.video.playsInline=!0,this.video.autoplay=!0,this.video.setAttribute("playsinline",""),this.video.className="photoreal-video",e.appendChild(this.video),this.key=document.createElement("canvas"),this.key.className="photoreal-video photoreal-key",e.appendChild(this.key),this.idleTimer=setInterval(()=>{!this.ready||this.talking||Fe.state!=="idle"||(Date.now()-this.lastActivity>vm||this._expiring(9e4))&&this.sleep()},1e4),this.onVis=()=>{if(clearTimeout(this.hiddenT),document.visibilityState!=="hidden")return;let r=()=>{document.visibilityState!=="hidden"||!this.ready||(!this.talking&&Fe.state==="idle"?this.sleep():this.hiddenT=setTimeout(r,1e4))};this.hiddenT=setTimeout(r,6e4)},document.addEventListener("visibilitychange",this.onVis),this.onHide=()=>this._teardown(!0),window.addEventListener("pagehide",this.onHide)}_expiring(e){return!!this.expiresAt&&this.expiresAt-Date.now()<e&&(this.remaining??0)>120}touch(){this.lastActivity=Date.now(),this.ready&&this._expiring(6e4)&&!this.talking&&Fe.state==="idle"&&this.sleep(),!this.ready&&!this.starting&&!this.disposed&&!this.exhausted&&!this.halted&&Date.now()>=(this.retryAt||0)&&this.start().catch(()=>{})}start(){if(this.starting)return this.starting;let e=new Set(["photoreal_out_of_credits","champion_required","video_minutes_exhausted","photoreal_not_configured","no_avatar_for_persona","debate_ended","debate_not_found","unauthorized"]);return this.starting=(async()=>{let t=null;for(let r=0;r<3&&!this.disposed;r++){if(r&&(this.onStatus({state:"connecting"}),await new Promise(s=>setTimeout(s,r===1?2500:6e3)),this.disposed))return;try{await this._start();return}catch(s){if(t=s,console.warn(`[photoreal] attempt ${r+1} failed:`,s?.message||s),this._teardown(!0),e.has(s?.code))break}}if(this.disposed||!t)return;let i=t;this.onStatus({state:"error",error:i?.code||"photoreal_unavailable",detail:i?.detail||i?.message||String(i)}),(i?.code==="video_minutes_exhausted"||i?.code==="champion_required")&&(this.exhausted=!0),e.has(i?.code)?this.halted=!0:this.retryAt=Date.now()+6e4})().finally(()=>{this.starting=null}),this.starting}async _start(){this.onStatus({state:"connecting"}),this.stopping&&(await Promise.race([this.stopping,new Promise(l=>setTimeout(l,3e3))]),this.stopping=null);let e=Date.now(),t=await fetch("/api/avatar/session",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:this.debateId})}),i=await t.json().catch(()=>({}));if(!t.ok)throw Object.assign(new Error(i.error||"session"),{code:i.error,detail:i.detail});if(this.disposed)return;this.token=i.sessionToken,this.sessionId=i.sessionId,this.api=i.apiUrl,this.remaining=i.remainingSeconds,this.expiresAt=i.maxSeconds?e+i.maxSeconds*1e3-5e3:0;let r=i.start?.livekit_url?i.start:await this._api("/v1/sessions/start");this.remoteStarted=!0;let s=await _m();if(!s)throw new Error("livekit_unavailable");if(this.disposed)return this._teardown(!0);this.room=new s.Room({adaptiveStream:!1,dynacast:!1});let a=new Promise(l=>{this.room.on(s.RoomEvent.TrackSubscribed,(c,d,u)=>{u.identity==="heygen"&&(c.attach(this.video),c.kind==="video"&&(this.vTrack=c),c.kind==="audio"&&(this.aTrack=c),c.kind==="video"&&l(!0))})});if(this.room.on(s.RoomEvent.Disconnected,()=>this._lost("room_disconnected")),await this.room.connect(r.livekit_url,r.livekit_client_token),!r.ws_url)throw new Error("no_ws_url");this.ws=new WebSocket(r.ws_url);let o=new Promise((l,c)=>{let d=setTimeout(()=>c(new Error("ws_timeout")),15e3);this.ws.onmessage=u=>{let h=null;try{h=JSON.parse(u.data)}catch{return}this._onEvent(h),h.type==="session.state_updated"&&h.state==="connected"&&(clearTimeout(d),l())},this.ws.onerror=()=>{},this.ws.onclose=()=>{clearTimeout(d),this._lost("ws_closed"),c(new Error("ws_closed"))},this.ws.onopen=()=>setTimeout(()=>(clearTimeout(d),l()),2500)});if(await Promise.all([o,Promise.race([a,new Promise((l,c)=>setTimeout(()=>c(new Error("video_timeout")),2e4))])]),this.disposed)return this._teardown(!0);try{this.video.muted=!1,await this.video.play()}catch{this.onStatus({state:"needs_tap"}),await new Promise(l=>{let c=()=>{this.video.play().then(l,l),this.stage.removeEventListener("click",c)};this.stage.addEventListener("click",c)})}this.ready=!0,this.stage.classList.add("photoreal-live"),Fe.setSink(this),this.beat=setInterval(()=>this._heartbeat(),xm),this.keep=setInterval(()=>this._send({type:"session.keep_alive"}),6e4),this._startAvSync(),this._startKeying(),this.onStatus({state:"live",remainingSeconds:this.remaining})}_startKeying(){this._stopKeying();let e=this.video,t=document.createElement("canvas");t.width=t.height=16;let i=t.getContext("2d",{willReadFrequently:!0}),r=null,s=null,a=!1,o=0,l=()=>{if(!e.videoWidth)return null;i.drawImage(e,0,0,16,16);let h=i.getImageData(0,0,16,16).data,p=[0,15,7,8,240,255],g=0;for(let v of p){let f=h[v*4],m=h[v*4+1],T=h[v*4+2];m>90&&m>f*1.6&&m>T*1.6&&g++}return g>=4},c=()=>{if(r=this.key.getContext("webgl",{premultipliedAlpha:!0,alpha:!0,antialias:!1}),!r)return!1;let h=(f,m)=>{let T=r.createShader(f);return r.shaderSource(T,m),r.compileShader(T),T},p=r.createProgram();if(r.attachShader(p,h(r.VERTEX_SHADER,"attribute vec2 p;varying vec2 t;void main(){t=vec2(p.x*0.5+0.5,0.5-p.y*0.5);gl_Position=vec4(p,0.,1.);}")),r.attachShader(p,h(r.FRAGMENT_SHADER,"precision mediump float;varying vec2 t;uniform sampler2D s;void main(){vec4 c=texture2D(s,t);float m=max(c.r,c.b);float g=c.g-m;float a=1.0-smoothstep(0.04,0.22,g);c.g=min(c.g,m+0.06);gl_FragColor=vec4(c.rgb*a,a);}")),r.linkProgram(p),!r.getProgramParameter(p,r.LINK_STATUS))return!1;r.useProgram(p);let g=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,g),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),r.STATIC_DRAW);let v=r.getAttribLocation(p,"p");return r.enableVertexAttribArray(v),r.vertexAttribPointer(v,2,r.FLOAT,!1,0,0),s=r.createTexture(),r.bindTexture(r.TEXTURE_2D,s),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.LINEAR),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),!0},d=()=>{if(!(!r||this.disposed||!this.ready)){(this.key.width!==e.videoWidth||this.key.height!==e.videoHeight)&&(this.key.width=e.videoWidth,this.key.height=e.videoHeight,r.viewport(0,0,e.videoWidth,e.videoHeight));try{r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,e),r.drawArrays(r.TRIANGLE_STRIP,0,4)}catch{}this.keyRaf=requestAnimationFrame(d)}},u=()=>{if(this.disposed||!this.ready)return;let h=l();if(h===null||h===!1&&++o<5)return void(this.keyT=setTimeout(u,250));a=!0,h&&c()&&(this.stage.classList.add("photoreal-keyed"),d()),this.stage.classList.add("photoreal-checked")};this.keyT=setTimeout(u,50)}_stopKeying(){clearTimeout(this.keyT),cancelAnimationFrame(this.keyRaf),this.stage.classList.remove("photoreal-keyed","photoreal-checked")}_onEvent(e){switch(e.type){case"agent.speak_started":this.talking=!0,this.lastActivity=Date.now();break;case"agent.speak_ended":case"agent.speak_interrupted":this.talking=!1,this.lastActivity=Date.now();break;case"agent.state_updated":this.talking=e.new_state==="talking";break;case"session.state_updated":e.state==="disconnected"&&this._lost("server_disconnected");break;case"error":console.warn("[photoreal] server error",e.error);break}}_send(e){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}speak(e,t){this.lastActivity=Date.now();for(let i of t)this._send({type:"agent.speak",event_id:e,audio:i})}speakEnd(e){this._send({type:"agent.speak_end",event_id:e})}interrupt(){this.talking=!1,this._send({type:"agent.interrupt"})}_startAvSync(){clearInterval(this.avSync);let e={v:null,a:null},t=async(a,o)=>{let l=a?.receiver;if(!l?.getStats)return null;let c=null;if((await l.getStats()).forEach(p=>{p.type==="inbound-rtp"&&(c={jb:p.jitterBufferDelay||0,n:p.jitterBufferEmittedCount||0,dec:p.totalDecodeTime||0,fr:p.framesDecoded||0})}),!c)return null;let d=e[o];if(e[o]=c,!d||c.n<=d.n)return null;let u=(c.jb-d.jb)/(c.n-d.n),h=c.fr>d.fr?(c.dec-d.dec)/(c.fr-d.fr):0;return u+h},i=0,r=0,s=[];this.avSync=setInterval(async()=>{try{let[a,o]=await Promise.all([t(this.vTrack,"v"),t(this.aTrack,"a")]),l=this.aTrack?.receiver;if(a==null||o==null||!l||(s.push(Math.max(0,Math.min(400,Math.round((a+.02)*1e3)))),s.length>5&&s.shift(),s.length<3))return;let c=s.slice().sort((u,h)=>u-h)[Math.floor(s.length/2)],d=Date.now();if(i&&(Math.abs(c-i)<60||d-r<2e4))return;i=c,r=d,"jitterBufferTarget"in l?l.jitterBufferTarget=i:"playoutDelayHint"in l&&(l.playoutDelayHint=i/1e3)}catch{}},2e3)}async _api(e){let t=await fetch(`${this.api}${e}`,{method:"POST",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"}}),i=await t.json().catch(()=>({}));if(!t.ok||i.code!==void 0&&i.code!==1e3)throw new Error(i.message||`liveavatar ${e} ${t.status}`);return i.data??i}async _heartbeat(){try{let t=await(await fetch("/api/avatar/heartbeat",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:this.sessionId})})).json();this.remaining=t.remainingSeconds,this.onStatus({state:"live",remainingSeconds:t.remainingSeconds}),t.stop&&!(this.expiresAt&&Date.now()<this.expiresAt)&&(this.exhausted=!0,this.sleep(),this.onStatus({state:"error",error:"video_minutes_exhausted"}))}catch{}}_lost(e){!this.ready&&!this.room||(console.warn("[photoreal] stream lost:",e),this._teardown(!0),this.disposed||this.onStatus({state:"off"}))}sleep(){this._teardown(!0),!this.disposed&&!this.exhausted&&this.onStatus({state:"sleeping"})}_teardown(e){let t=this.ready||this.room||this.ws||this.remoteStarted;this.remoteStarted=!1,this.ready=!1,this.talking=!1,(Fe.sink===this||Fe.pendingSink===this)&&Fe.setSink(null),this.stage.classList.remove("photoreal-live"),clearInterval(this.beat),clearInterval(this.keep),clearInterval(this.avSync),this.vTrack=this.aTrack=null;try{this.ws&&(this.ws.onclose=null,this.ws.onmessage=null,this.ws.close())}catch{}this.ws=null,this._stopKeying();try{this.room?.removeAllListeners?.(),this.room?.disconnect()}catch{}this.room=null;try{this.video.srcObject=null}catch{}e&&t&&this.token&&(this.stopping=Promise.allSettled([fetch(`${this.api}/v1/sessions/stop`,{method:"POST",keepalive:!0,headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"}}),fetch("/api/avatar/end",{method:"POST",keepalive:!0,credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:this.sessionId})})])),this.token=null,this.expiresAt=0}dispose(){this.disposed||(this.disposed=!0,clearInterval(this.idleTimer),clearTimeout(this.hiddenT),document.removeEventListener("visibilitychange",this.onVis),window.removeEventListener("pagehide",this.onHide),this._teardown(!0),this.video.remove(),this.key.remove())}};var ym=Object.defineProperty,bm=(n,e,t)=>e in n?ym(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t,gu=(n,e,t)=>bm(n,typeof e!="symbol"?e+"":e,t);(function(){let n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(let i of document.querySelectorAll('link[rel="modulepreload"]'))t(i);new MutationObserver(i=>{for(let r of i)if(r.type==="childList")for(let s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&t(s)}).observe(document,{childList:!0,subtree:!0});function e(i){let r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(i){if(i.ep)return;i.ep=!0;let r=e(i);fetch(i.href,r)}})();var Ct=class extends Error{constructor(e,t,i){super(i??`Request failed with status ${e}`),gu(this,"status"),gu(this,"body"),this.name="ApiError",this.status=e,this.body=t}};async function Rd(n,e={}){let t=await fetch(n,{credentials:"include",...e,headers:{"Content-Type":"application/json",...e.headers??{}}});if(!t.ok){let i=null;try{i=await t.json()}catch{}throw new Ct(t.status,i)}if(t.status!==204)return await t.json()}var St=n=>Rd(n),Tt=(n,e)=>Rd(n,{method:"POST",body:e===void 0?void 0:JSON.stringify(e)}),yc=n=>Rd(n,{method:"DELETE"}),Fh="adversaryai-theme";function Cd(){try{let n=localStorage.getItem(Fh);if(n==="light"||n==="dark")return n}catch{}return"dark"}function Bh(n){document.documentElement.dataset.theme=n;try{localStorage.setItem(Fh,n)}catch{}let e=document.querySelector('meta[name="theme-color"]');e&&e.setAttribute("content",n==="light"?"#f6f7f9":"#07080b")}function Sm(){Bh(Cd())}function wm(){let n=Cd()==="dark"?"light":"dark";return Bh(n),n}function Mm(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var Tm='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',Em='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';function bc(n=""){let e=document.createElement("button");e.type="button",e.className=`inline-flex h-11 w-11 items-center justify-center md:h-auto md:w-auto md:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition-colors ${n}`.trim();let t=()=>{let i=Cd()==="dark";e.innerHTML=i?Tm:Em,e.setAttribute("aria-label",i?"Switch to light theme":"Switch to dark theme"),e.title=i?"Switch to light theme":"Switch to dark theme",e.setAttribute("aria-pressed",String(!i))};return e.addEventListener("click",()=>{wm(),t()}),t(),e}var dl='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',Hh='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';function xt(n,e=24){return`<svg width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${n}</svg>`}var Xe={mic:xt('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',20),stop:xt('<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/>',18),grow:xt('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',18),shrink:xt('<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>',18),warning:dl,bolt:Hh,scale:xt('<line x1="12" y1="4" x2="12" y2="20"/><line x1="5" y1="6" x2="19" y2="6"/><path d="M5 6l-2.5 6a2.9 2.9 0 0 0 5 0L5 6z"/><path d="M19 6l-2.5 6a2.9 2.9 0 0 0 5 0L19 6z"/><line x1="8" y1="20" x2="16" y2="20"/>',22),cap:xt('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><line x1="22" y1="10" x2="22" y2="16"/>',22),swap:xt('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',22),clipboard:xt('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',22),trophy:xt('<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 2 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.5-2 4-4 4"/>',26),target:xt('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',26),trending:xt('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',26),compass:xt('<circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',26),megaphone:xt('<path d="M3 11l18-7v16L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',28),landmark:xt('<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',28),briefcase:xt('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',28),chat:xt('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',28)};function ul(n="card"){let e=document.createElement("div");e.setAttribute("aria-hidden","true");let t=(i,r="0.875rem")=>`<div class="skeleton" style="width:${i};height:${r}"></div>`;return n==="list"?e.innerHTML=[0,1,2].map(()=>`
      <div class="card p-4 mb-3 flex items-center gap-4">
        <div class="skeleton shrink-0" style="width:3rem;height:3rem;border-radius:0.75rem"></div>
        <div class="flex-1 space-y-2">${t("60%")}${t("35%","0.75rem")}</div>
      </div>`).join(""):n==="text"?(e.className="space-y-2.5",e.innerHTML=`${t("95%")}${t("88%")}${t("70%","0.875rem")}`):n==="page"?(e.className="max-w-4xl mx-auto px-4 py-8 w-full",e.innerHTML=`
      ${t("40%","2rem")}
      <div class="mt-6 grid sm:grid-cols-2 gap-4">
        <div class="card p-6 space-y-3">${t("30%","0.75rem")}${t("70%","1.5rem")}${t("100%","0.625rem")}</div>
        <div class="card p-6 space-y-3">${t("30%","0.75rem")}${t("70%","1.5rem")}${t("100%","0.625rem")}</div>
      </div>
      <div class="mt-4 grid sm:grid-cols-3 gap-4">
        <div class="card p-6 space-y-3">${t("50%")}${t("30%","2rem")}${t("100%","2.5rem")}</div>
        <div class="card p-6 space-y-3">${t("50%")}${t("30%","2rem")}${t("100%","2.5rem")}</div>
        <div class="card p-6 space-y-3">${t("50%")}${t("30%","2rem")}${t("100%","2.5rem")}</div>
      </div>`):(e.className="card p-6 space-y-3",e.innerHTML=`${t("35%","0.75rem")}${t("60%","1.75rem")}${t("100%")}${t("85%")}`),e}function Jn(n,e){let t=document.createElement("div");return t.className="text-center py-14 px-6 animate-fade-up",t.setAttribute("role","alert"),t.innerHTML=`
    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-danger-dim bg-danger-dim/15 text-danger" aria-hidden="true">${dl}</div>
    <h2 class="text-display-sm text-white mb-2">Something went wrong</h2>
    <p class="text-body-sm text-slate-400 max-w-sm mx-auto mb-6">${Mm(n)}</p>
    ${e?'<button type="button" class="btn-ghost">Try again</button>':""}`,e&&t.querySelector("button").addEventListener("click",e),t}function xs(){let n=location.hash.slice(1);return/^\/(session|setup)\//.test(n)?`&next=${encodeURIComponent(n)}`:""}function Sc(n){let e=document.createElement("div"),t=n?{title:"That\u2019s your rounds used up \u2014 nicely fought",body:"Your scorecard is ready when you are: where you were strong, where you slipped, and what to say instead. Keep sparring from $12 a month, or grab a $9 pack that never expires."}:{title:"You\u2019re out of rounds",body:"You\u2019ve used all the rounds in your wallet for now. Pick a plan or grab a one-time pack to keep practicing \u2014 pack credits never expire, and unused plan rounds roll over."};return e.className="quota-card card max-w-md mx-auto my-12 p-8 text-center animate-pop-in shadow-glow border-accent-600/50",e.setAttribute("role","alert"),e.innerHTML=`
    <div class="quota-icon mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 border border-accent-600/40 text-accent-400" aria-hidden="true">${Hh}</div>
    <h2 class="quota-title text-display-md text-white mb-2">${t.title}</h2>
    <p class="quota-body text-body-sm text-slate-400 mb-7">${t.body}</p>
    <div class="quota-actions flex flex-col sm:flex-row gap-3 justify-center">
      ${n?`<button type="button" data-get-score class="btn-primary">See my scorecard</button>
      <a href="#/account?plans=1${xs()}" class="btn-ghost">Keep sparring \u2014 plans</a>`:`<a href="#/account?plans=1${xs()}" class="btn-primary">View plans</a>
      <a href="#/account?packs=1${xs()}" class="btn-ghost">Buy a pack</a>`}
    </div>
    ${n?`<p class="mt-4 text-xs text-slate-500"><a href="#/account?packs=1${xs()}" class="link">Or buy a round pack</a></p>`:""}`,e}function zh(n,e,t,i){let r=t==="/login",s=document.createElement("div");s.className="w-full max-w-md animate-fade-up",s.innerHTML=`
    <div class="text-center mb-8">
      <svg width="56" height="56" viewBox="0 0 512 512" aria-hidden="true" class="mx-auto mb-5 drop-shadow-[0_8px_24px_rgba(255,46,63,0.35)]"><rect width="512" height="512" rx="112" fill="#0d0f14"/><polygon points="256,104 400,392 112,392" fill="none" stroke="#e8392e" stroke-width="34" stroke-linejoin="round"/><g fill="#e8392e"><rect x="165" y="264" width="22" height="44" rx="11"/><rect x="193" y="244" width="22" height="84" rx="11"/><rect x="221" y="226" width="22" height="120" rx="11"/><rect x="249" y="212" width="22" height="148" rx="11"/><rect x="277" y="230" width="22" height="112" rx="11"/><rect x="305" y="248" width="22" height="76" rx="11"/><rect x="333" y="266" width="22" height="40" rx="11"/></g></svg>
      <h1 class="font-display text-display-lg text-white">${n}</h1>
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
        <input id="auth-password" type="password" required autocomplete="${r?"new-password":"current-password"}" minlength="8" placeholder="Minimum 8 characters"
          class="field mb-6" />
        ${r?"":'<div class="-mt-4 mb-6 flex flex-wrap items-center justify-between gap-2"><a href="#" data-billing-login class="link text-body-sm hidden" target="_blank" rel="noopener">Manage or cancel billing by email</a><a href="mailto:support@getadversaryai.com?subject=Password%20reset" class="link text-body-sm ml-auto">Forgot password?</a></div>'}
        <button type="submit" class="btn-primary w-full py-3">
          ${n}
        </button>
        ${r?'<p class="mt-4 text-center text-xs leading-relaxed text-slate-500">By creating an account you agree to our <a href="/terms.html" target="_blank" rel="noopener" class="link">Terms</a> and <a href="/privacy.html" target="_blank" rel="noopener" class="link">Privacy Policy</a>, and confirm you are 13 or older. Under 13? Join through your school\u2019s invite link instead. Your practice sessions are recorded as text so you can review them; audio isn\u2019t stored.</p>':""}
      </form>
    </div>
    <p class="text-center text-body-sm text-slate-500 mt-6">
      ${i} <a href="#${t}" class="link font-medium">${t==="/signup"?"Create an account":"Log in"}</a>
    </p>`;let a=s.querySelector("form"),o=s.querySelector("[data-error]"),l=s.querySelector("[data-billing-login]");return l&&St("/api/billing/prices").then(c=>{c?.portalLoginUrl&&(l.href=c.portalLoginUrl,l.classList.remove("hidden"))}).catch(()=>{}),{el:s,form:a,errorBox:o}}function Nr(n,e){n.className="error-box mb-5 animate-fade-in",n.setAttribute("role","alert"),n.innerHTML=`<span aria-hidden="true" class="shrink-0 mt-0.5 text-danger">${dl}</span><span></span>`,n.querySelector("span:last-child").textContent=e}function Ga(n,e,t){n.disabled=e,n.classList.toggle("opacity-60",e),e?n.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Please wait\u2026</span>':n.textContent=t}function Ld(){return bc("fixed top-[calc(1rem+var(--safe-top))] right-4 z-30 border border-ink-700 bg-ink-900/80 backdrop-blur")}function Ps(n,e){try{window.adversaryTrack?.(n,e||{})}catch{}}async function Vh(n,e,t){let i=n.querySelector("#auth-email").value.trim(),r=n.querySelector("#auth-password").value,s=n.querySelector('button[type="submit"]'),a=t==="/api/auth/signup"?"Start your 15 free rounds":"Log in";if(e.classList.add("hidden"),e.removeAttribute("role"),!i||!r){Nr(e,"Enter your email and password.");return}if(r.length<8){Nr(e,"Password must be at least 8 characters.");return}Ga(s,!0,a);try{await Tt(t,{email:i,password:r,attribution:window.adversaryAttribution?.()||null});let o=await St("/api/auth/me");t==="/api/auth/signup"&&Ps("sign_up",{method:"email"}),ea(o);let l=new URLSearchParams(location.hash.split("?")[1]||"").get("next");location.hash=l&&/^#?\/[\w\-\/?=&%.]*$/.test(l)?l.startsWith("#")?l:"#"+l:"#/"}catch(o){let l=o.status;l===409?Nr(e,"An account with that email already exists. Try logging in instead."):l===401?Nr(e,"Wrong email or password. Try again \u2014 or, if you forgot it, email support@getadversaryai.com."):l===429?Nr(e,o.body?.message||"Too many attempts from this network \u2014 try again in an hour."):Nr(e,"Something went wrong. Please try again.")}finally{Ga(s,!1,a)}}function Am(n){let{el:e,form:t,errorBox:i}=zh("Log in","Your sparring partner is waiting.","/signup","New to AdversaryAI?");n.appendChild(Ld()),t.addEventListener("submit",r=>{r.preventDefault(),Vh(t,i,"/api/auth/login")}),n.appendChild(e)}function Rm(n){let{el:e,form:t,errorBox:i}=zh("Start your 15 free rounds","No credit card. Your first scorecard is about five minutes away.","/login","Already have an account?");n.appendChild(Ld()),t.addEventListener("submit",r=>{r.preventDefault(),Vh(t,i,"/api/auth/signup")}),n.appendChild(e)}var Pd={debate:Xe.megaphone,historical:Xe.landmark,acting:Xe.mic,interview:Xe.briefcase,negotiation:Xe.swap,sales:Xe.trending,difficult:Xe.chat,thesis:Xe.cap,expert:Xe.target,rapbattle:xt('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',28),witness:xt('<path d="M12 2v20M5 8h14"/>',28),rights:xt('<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/>',28),auditor:xt('<rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 11l5-3v8l-5-3z"/>',28),trafficstop:xt('<path d="M5 17h14l-2-7H7z"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/><path d="M12 3v3M7 5l1.5 2M17 5l-1.5 2"/>',28),deescalate:xt('<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',28),testify:xt('<path d="M12 3v18M5 7h14M5 7l-3 6h6zM19 7l-3 6h6zM8 21h8"/>',28),customer:xt('<path d="M4 5h4l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 7a2 2 0 0 1 2-2z"/>',28),speaking:xt('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/>',28),salary:xt('<path d="M12 2v20M17 6.5a4 4 0 0 0-4-2.5h-2a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2a4 4 0 0 1-4-2.5"/>',28)},ha=null;async function Qn(n=!1){if(ha&&!n)return ha;let{modes:e}=await St("/api/modes");return ha=e??[],ha}function ls(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Gh(n){return Array.from({length:n},()=>`
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
    </div>`).join("")}async function Cm(n){n.innerHTML=`<div class="max-w-6xl mx-auto px-4 py-6 sm:py-10" id="modes-root">
    <div class="text-center mb-8 sm:mb-10">
      <h1 class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">What do you want to practice?</h1>
      <p class="text-slate-400 mt-2 max-w-xl mx-auto text-sm sm:text-base">Pick an arena. A live AI opponent meets you there \u2014 with voice, pushback, and a scorecard when you\u2019re done.</p>
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" id="mode-grid">
      ${Gh(19)}
    </div>
  </div>`;let e=n.querySelector("#mode-grid");await Promise.all([$h(e),Lm(n.querySelector("#modes-root"))])}async function Lm(n){try{let e=await St("/api/debates"),t=(Array.isArray(e)?e:e?.debates||e?.items||[]).filter(r=>r&&!r.ended_at).slice(0,2);if(!t.length||!n)return;let i=document.createElement("div");i.className="mb-6 grid gap-3 sm:grid-cols-2",i.innerHTML=t.map(r=>`<a href="#/session/${encodeURIComponent(r.id)}" class="card card-lift flex items-center justify-between gap-3 border-amber-500/30 bg-amber-500/5 p-4"><div class="min-w-0"><div class="text-xs font-semibold uppercase tracking-wide text-amber-300">Continue where you left off</div><div class="truncate text-sm font-semibold text-white">${Le(r.topic||"Session")}</div></div><span class="shrink-0 text-amber-300">Resume \u2192</span></a>`).join(""),n.insertBefore(i,n.querySelector("#mode-grid"))}catch{}}async function $h(n){try{let e=await Qn(!0);if(e.length===0){n.innerHTML=`
        <div class="col-span-full text-center py-16 rounded-2xl border border-ink-700 bg-ink-900">
          <p class="text-white font-semibold mb-1">No practice modes available</p>
          <p class="text-sm text-slate-400">Check back in a moment.</p>
        </div>`;return}n.innerHTML="";let t=[{title:"Career",blurb:"Interviews, raises and the conversations that decide them.",ids:["interview","salary","difficult"]},{title:"Business & sales",blurb:"Buyers, customers and the deal.",ids:["sales","customer","negotiation"]},{title:"Police training",blurb:"For officers: the encounters that end up on bodycam and in court.",ids:["trafficstop","deescalate","auditor","testify"]},{title:"Know your rights",blurb:"For everyone else: handle a police encounter calmly.",ids:["rights"]},{title:"Debate & argument",blurb:"Hold a position under fire.",ids:["debate","historical","thesis","expert"]},{title:"Performance & faith",blurb:"Talks, scenes, bars and the hardest conversations of all.",ids:["speaking","acting","rapbattle","witness"]}],i=Object.fromEntries(e.map(a=>[a.id,a])),r=new Set(t.flatMap(a=>a.ids)),s=e.filter(a=>!r.has(a.id));s.length&&t.push({title:"More",blurb:"",ids:s.map(a=>a.id)});for(let a of t){let o=a.ids.map(c=>i[c]).filter(Boolean);if(!o.length)continue;let l=document.createElement("div");l.className="col-span-full pt-4 first:pt-0",l.innerHTML=`<h2 class="font-display text-xl font-bold text-white">${ls(a.title)}</h2>${a.blurb?`<p class="mt-0.5 text-sm text-slate-400">${ls(a.blurb)}</p>`:""}`,n.appendChild(l);for(let c of o){let d=document.createElement("a");d.href=`#/setup/${encodeURIComponent(c.id)}`,d.className="group card flex flex-row items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/60 sm:flex-col sm:items-stretch sm:gap-0 sm:p-6",d.innerHTML=`
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-accent-500 transition-colors group-hover:border-accent-500/50 sm:mb-4 [&>svg]:h-6 [&>svg]:w-6">${Pd[c.id]??Xe.chat}</div>
        <div class="min-w-0 flex-1 sm:flex sm:flex-col">
          <div class="text-base font-bold leading-tight text-white sm:text-lg">${ls(c.name)}</div>
          <div class="mt-1 text-xs font-semibold uppercase tracking-wide text-accent-400 line-clamp-1 sm:mb-2 sm:line-clamp-none">${ls(c.tagline)}</div>
          <p class="text-sm leading-relaxed text-slate-400 line-clamp-3 max-sm:hidden">${ls(c.description)}</p>
        </div>
        <span aria-hidden="true" class="shrink-0 text-xl leading-none text-accent-400 sm:hidden">\u203A</span>
        <div class="mt-auto hidden pt-4 text-sm font-semibold text-accent-400 sm:block">Set up <span aria-hidden="true" class="inline-block transition-transform group-hover:translate-x-0.5">\u2192</span></div>`,n.appendChild(d)}}}catch{n.innerHTML=`
      <div class="col-span-full text-center py-16 rounded-2xl border border-ink-700 bg-ink-900">
        <div class="mb-4 flex justify-center text-danger [&>svg]:w-10 [&>svg]:h-10">${Xe.warning}</div>
        <p class="text-white font-semibold mb-1">Couldn\u2019t load practice modes</p>
        <p class="text-sm text-slate-400 mb-6">Check your connection and try again.</p>
        <button id="modes-retry" class="btn-primary text-sm">Retry</button>
      </div>`,n.querySelector("#modes-retry").addEventListener("click",()=>{n.innerHTML=Gh(11),$h(n)})}}var vu={"teen-boy":{id:"teen-boy",model:"/models/personas/teen-boy.glb?v=face67b",label:"Teenage boy"},"teen-girl":{id:"teen-girl",model:"/models/personas/teen-girl.glb?v=face67b",label:"Teenage girl"},"man-pro":{id:"man-pro",model:"/models/personas/man-pro.glb?v=face67b",label:"Professional man"},"woman-pro":{id:"woman-pro",model:"/models/personas/woman-pro.glb?v=face67b",label:"Professional woman"},"older-man":{id:"older-man",model:"/models/personas/older-man.glb?v=face67b",label:"Older gentleman"},"older-woman":{id:"older-woman",model:"/models/personas/older-woman.glb?v=face67b",label:"Older woman"},"man-casual":{id:"man-casual",model:"/models/adversary-masc.glb",label:"Man"},"woman-casual":{id:"woman-casual",model:"/models/adversary-fem.glb",label:"Woman"},"default-masc":{id:"default-masc",model:"/models/adversary-masc.glb",label:"Opponent"},"default-fem":{id:"default-fem",model:"/models/adversary-fem.glb",label:"Opponent"}};function Wh(n){return n&&vu[n]||vu["default-masc"]}var Pm={lincoln:"older-man",churchill:"older-man",socrates:"older-man",douglass:"man-pro",mlk:"man-pro",einstein:"older-man",aurelius:"older-man",voltaire:"man-pro",eleanor:"older-woman",smith:"older-man",god_reformed:"older-man",the_devil:"man-pro",cs_lewis:"older-man",aquinas:"older-man",nietzsche:"older-man",hitchens:"man-pro"};function Im(n){return n&&Pm[n]||"default-masc"}var kn=[{id:"son",label:"Son",otherParty:"my teenage son"},{id:"daughter",label:"Daughter",otherParty:"my teenage daughter"},{id:"partner",label:"Partner",otherParty:"my partner"},{id:"parent",label:"Parent",otherParty:"my parent"},{id:"boss",label:"Boss",otherParty:"my boss"},{id:"coworker",label:"Coworker",otherParty:"my coworker"},{id:"friend",label:"Friend",otherParty:"my friend"}],km={son:"teen",daughter:"teen",partner:"adult",parent:"older",boss:"pro",coworker:"adult",friend:"adult"};function Dm(n,e){let t=kn.find(s=>s.id===n)?.id??"coworker",i=e==="fem",r=km[t];return r==="teen"?i?"teen-girl":"teen-boy":r==="older"?i?"older-woman":"older-man":r==="pro"?i?"woman-pro":"man-pro":i?"woman-casual":"man-casual"}var Um={debate:"default-masc",acting:"man-casual",interview:"man-pro",negotiation:"man-pro",sales:"woman-pro",thesis:"older-man",rapbattle:"man-casual",witness:"man-casual",rights:"man-pro",auditor:"man-casual",trafficstop:"woman-casual",deescalate:"man-casual",testify:"woman-pro",customer:"woman-casual",salary:"woman-pro",speaking:"man-pro",expert:"man-pro"},Nm={prosecutor:"man-pro",professor:"older-man",contrarian:"woman-pro",coach:"woman-casual",theist_mathematician:"older-man",secular_rationalist:"man-pro",evolutionary_biologist:"older-man",islamic_theologian:"man-pro",biblical_creationist:"older-man",moral_humanist:"woman-pro",archetypal_psychologist:"man-pro",jordan_peterson:"man-pro"};function Om(n){return n&&Nm[n]||"default-masc"}function Fm(n){return n&&Um[n]||"default-masc"}var xu=[{id:"prosecutor",name:"The Prosecutor",tagline:"Relentless cross-examiner",description:"Treats every claim like testimony. Expect rapid-fire questions, demands for evidence, and zero mercy for hand-waving.",icon:Xe.scale},{id:"professor",name:"The Professor",tagline:"Socratic questioner",description:"Never tells you the answer \u2014 asks the question that unravels your argument. Patient, precise, and quietly devastating.",icon:Xe.cap},{id:"contrarian",name:"The Contrarian",tagline:"Steelmans the other side",description:"Takes the strongest version of the opposing view and defends it brilliantly, forcing you to earn every inch of ground.",icon:Xe.swap},{id:"coach",name:"The Coach",tagline:"Supportive sparring partner",description:"Pushes hard during the round, then breaks down exactly what worked and what didn\u2019t \u2014 with detailed, actionable scores.",icon:Xe.clipboard},{id:"theist_mathematician",name:"The Cambridge Theist",tagline:"Fine-tuning & teleology",description:"Defends classical theism via universal fine-tuning, the unreasonable effectiveness of math, and DNA digital code.",icon:Xe.landmark},{id:"secular_rationalist",name:"The Secular Rationalist",tagline:"Analytic skepticism & reason",description:"Attacks supernatural claims with Ockham's razor, the problem of animal suffering, divine hiddenness, and Euthyphro.",icon:Xe.compass},{id:"evolutionary_biologist",name:"The Evolutionary Biologist",tagline:"Common descent & deep time",description:"Defends neo-Darwinian evolution with endogenous retroviruses, comparative anatomy, transitional fossils, and deep time.",icon:Xe.trending},{id:"islamic_theologian",name:"The Islamic Theologian",tagline:"Kalam cosmology & Tawhid",description:"Argues cosmic contingency necessitates an uncaused Creator; defends strict Monotheism against naturalism and Trinity.",icon:Xe.target},{id:"biblical_creationist",name:"The Biblical Creationist",tagline:"Special creation & scripture",description:"Challenges naturalist epistemology, uniformitarian age dating, the impossibility of abiogenesis, and information loss.",icon:Xe.trophy},{id:"moral_humanist",name:"The Moral Humanist",tagline:"Secular ethics & well-being",description:"Grounds objective morality in conscious suffering and flourishing; critiques ancient dogma while defending human dignity.",icon:Xe.chat},{id:"archetypal_psychologist",name:"The Archetypal Psychologist",tagline:"Meaning, responsibility & archetypes",description:"Analyzes reality through evolutionary psychology, biblical narratives as deep psychological truth, and voluntary confrontation with chaos.",icon:Xe.compass}];function _t(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var _u={round:[{v:3,t:"3 rounds",s:"Quick spar"},{v:6,t:"6 rounds",s:"Standard bout"},{v:10,t:"10 rounds",s:"Full debate"},{v:0,t:"Open-ended",s:"End when you want"}],question:[{v:3,t:"3 questions",s:"Quick screen"},{v:6,t:"6 questions",s:"Standard"},{v:10,t:"10 questions",s:"Full loop"},{v:0,t:"Open-ended",s:"End when you want"}],exchange:[{v:4,t:"4 exchanges",s:"Short"},{v:8,t:"8 exchanges",s:"Standard"},{v:12,t:"12 exchanges",s:"Deep dive"},{v:0,t:"Open-ended",s:"End when you want"}],bars:[{v:2,t:"2 rounds",s:"Quick cypher"},{v:3,t:"3 rounds",s:"Classic battle"},{v:5,t:"5 rounds",s:"Main event"},{v:0,t:"Open-ended",s:"Until someone taps"}]},Ll={v:"cointoss",t:"\u{1FA99} Coin toss",s:"50/50 flip"},Bm={debate:{unit:"round",def:6,first:[Ll,{v:"user",t:"You open",s:"Opening statement"},{v:"opponent",t:"Opponent opens",s:"They take the floor"}],defFirst:"cointoss",styles:!0,side:!0,judge:!0},historical:{unit:"round",def:6,first:[Ll,{v:"user",t:"You open",s:"Opening statement"},{v:"opponent",t:"They open",s:"History speaks first"}],defFirst:"cointoss",styles:!0,side:!0,judge:!0},thesis:{unit:"question",def:6,fixedFirst:"opponent",fixedNote:"The committee opens with the first question."},interview:{unit:"question",def:6,open:{t:"Interviewer decides",s:"Ends with a hiring decision"},fixedFirst:"opponent",fixedNote:"The interviewer greets you and asks the first question."},expert:{unit:"question",def:6,fixedFirst:"opponent",fixedNote:"They open with the first question for you, the expert."},negotiation:{unit:"exchange",def:8,first:[{v:"user",t:"You open",s:"Make the first move"},{v:"opponent",t:"They open",s:"Counterpart anchors first"}],defFirst:"opponent",judge:!0},sales:{unit:"exchange",def:8,first:[{v:"user",t:"You open the call",s:"Lead the pitch"},{v:"opponent",t:"Buyer speaks first",s:"Cold, skeptical start"}],defFirst:"user",judge:!0},difficult:{unit:"exchange",def:8,first:[{v:"user",t:"You bring it up",s:"Start the talk"},{v:"opponent",t:"They bring it up",s:"Caught off guard"}],defFirst:"user"},acting:{unit:"exchange",def:8,first:[{v:"user",t:"You have the first line",s:""},{v:"opponent",t:"Partner starts",s:""}],defFirst:"user"},witness:{unit:"exchange",def:8,first:[{v:"user",t:"You start",s:"Open the conversation"},{v:"opponent",t:"They start",s:"They ask you first"}],defFirst:"user"},rights:{unit:"exchange",def:8,fixedFirst:"opponent",fixedNote:"The officer walks up and speaks first."},auditor:{unit:"exchange",def:8,fixedFirst:"opponent",fixedNote:"The auditor is already filming and speaks first."},trafficstop:{unit:"exchange",def:8,fixedFirst:"user",fixedNote:"You walk up to the window and speak first."},deescalate:{unit:"exchange",def:10,fixedFirst:"opponent",fixedNote:"They\u2019re already agitated and speak first."},testify:{unit:"question",def:8,fixedFirst:"opponent",fixedNote:"Defense counsel asks the first question."},customer:{unit:"exchange",def:8,fixedFirst:"opponent",fixedNote:"The customer is already upset and speaks first."},salary:{unit:"exchange",def:8,fixedFirst:"opponent",fixedNote:"They open the meeting."},speaking:{unit:"exchange",def:8,fixedFirst:"user",fixedNote:"You have the floor. Deliver the talk, then take questions."},rapbattle:{unit:"bars",def:3,first:[Ll,{v:"user",t:"You drop first",s:"Set the tone"},{v:"opponent",t:"MC drops first",s:"Answer back"}],defFirst:"cointoss",judge:!0}},Hm={unit:"exchange",def:8,first:[{v:"user",t:"You start",s:""},{v:"opponent",t:"They start",s:""}],defFirst:"user"};function Id(n){return Bm[n]||Hm}var zm=[{v:"easy",t:"Easy",s:"Gives ground \u2014 good for learning"},{v:"normal",t:"Normal",s:"Fair fight \u2014 admits good points"},{v:"hard",t:"Hard",s:"Relentless \u2014 no easy wins"}],Vm={easy:"Easy",normal:"Normal",hard:"Hard"},jh=[{v:"oxford",t:"Oxford",s:"Classic structure"},{v:"lincoln_douglas",t:"L\u2013D",s:"Lincoln\u2013Douglas values"},{v:"rapid",t:"Rapid fire",s:"Short, punchy turns"},{v:"freeform",t:"Freeform",s:"Open sparring"}],Gm=[{v:"for",t:"I argue FOR",s:"Defend the motion"},{v:"against",t:"I argue AGAINST",s:"Oppose the motion"},{v:"open",t:"No fixed sides",s:"Free-flowing clash"}];function vn(n,e,t){return e.map(i=>`<button type="button" class="opt-chip" data-opt="${n}" data-value="${_t(String(i.v))}" aria-pressed="${String(i.v)===String(t)}">
        <span class="opt-title">${_t(i.t)}</span>${i.s?`<span class="opt-sub">${_t(i.s)}</span>`:""}
      </button>`).join("")}function $m(n){let e=`setup-${_t(n.key)}`,t=n.required?'<span class="text-accent-400 ml-0.5" aria-hidden="true">*</span>':"",i=n.help?`<p class="help">${_t(n.help)}</p>`:"",r=`<label class="label" for="${e}">${_t(n.label)}${t}</label>`;if(n.type==="textarea")return`${r}<textarea id="${e}" data-key="${_t(n.key)}" rows="3" placeholder="${_t(n.placeholder??"")}" class="field resize-none"></textarea>${i}`;if(n.type==="select"){let s=(n.options??[]).map(a=>`<option value="${_t(a.value)}">${_t(a.label)}</option>`).join("");return`${r}<select id="${e}" data-key="${_t(n.key)}" class="field">${n.required?"":'<option value="">\u2014</option>'}${s}</select>${i}`}return`${r}<input id="${e}" data-key="${_t(n.key)}" type="text" placeholder="${_t(n.placeholder??"")}" class="field" />${i}`}function Wm(n){return`
    <button type="button" class="figure-card persona-card flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-3 text-left hover:border-slate-500"
      data-figure-id="${_t(n.id)}" aria-pressed="false">
      <span class="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-ink-600 bg-ink-950">
        <img src="/img/figures/${_t(n.id)}.jpg" alt="" loading="lazy" class="h-full w-full object-cover object-top" onerror="this.style.visibility='hidden'" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-semibold leading-tight text-white">${_t(n.name)}</span>
        <span class="mt-0.5 block truncate text-xs text-slate-400">${_t(n.era)}</span>
        <span class="mt-1 hidden text-xs leading-snug text-slate-500 sm:line-clamp-2">${_t(n.bio)}</span>
      </span>
    </button>`}function jm(n,e){try{sessionStorage.setItem(`adversaryai:session:${n}`,JSON.stringify(e))}catch{}}var Pl=n=>String(n||"").replace(/\([^)]*\)/g,"").replace(/[^\p{L}\p{N} .'\-]/gu,"").replace(/\.+$/,"").trim().toUpperCase().replace(/\s+/g," "),qm=n=>String(n||"").replace(/\([^)]*\)/g," ").replace(/\[[^\]]*\]/g," ").replace(/\s+/g," ").trim();function wc(n){let e=[],t=null,i=null,r=(s,a)=>{let o=qm(a);!s||!o||(t&&t.name===s?t.text+=" "+o:e.push(t={name:s,text:o}))};for(let s of String(n||"").replace(/\r\n?/g,`
`).split(`
`)){let a=s.trim();if(!a){i=null;continue}if(/^(INT|EXT|INT\/EXT|I\/E)[.\s]/.test(a)||/^(FADE|CUT TO|DISSOLVE|SMASH CUT|THE END)/.test(a)){i=null;continue}let o=a.match(/^([\p{L}][\p{L}\p{N} .'\-]{0,30}?)\s*(\([^)]*\))?\s*:\s*(.+)$/u);if(o&&o[1].split(" ").length<=4){r(Pl(o[1]),o[3]),i=null;continue}let l=a.match(/^([A-Z][A-Z .'\-]{1,30}?)\.\s+(.+)$/);if(l&&l[1]===l[1].toUpperCase()&&l[1].split(" ").length<=4){r(Pl(l[1]),l[2]),i=null;continue}let c=a.match(/^([A-Z][A-Z0-9 .'\-]{0,30})(\s*\([^)]*\))?$/);if(c&&/[A-Z]{2}/.test(c[1])&&c[1].trim().split(/\s+/).length<=4){i=Pl(c[1]);continue}i&&r(i,a)}return e}function qh(n,e){let t=[],i=!1;for(let r of n){let s=r.name===e;s&&i?t[t.length-1]+=" "+r.text:s&&t.push(r.text),i=s}return t}function Xm(n,e){let t=a=>String(a||"").toLowerCase().replace(/[’']/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(Boolean),i=t(n).slice(0,600),r=t(e).slice(0,600);if(!i.length)return 100;if(!r.length)return 0;let s=new Array(r.length+1).fill(0);for(let a=1;a<=i.length;a++){let o=0;for(let l=1;l<=r.length;l++){let c=s[l];s[l]=i[a-1]===r[l-1]?o+1:Math.max(s[l],s[l-1]),o=c}}return Math.round(200*s[r.length]/(i.length+r.length))}var Il=n=>String(n||"").toLowerCase().replace(new RegExp("(^|[\\s'-])\\p{L}","gu"),e=>e.toUpperCase());function Ym(n,e,t){if(e.topic)return e.topic;let i=r=>String(r).slice(0,300);switch(n.id){case"thesis":return i(e.thesisStatement?`Thesis: ${e.thesisStatement}${e.field?` (${e.field})`:""}`:"Thesis defense");case"acting":return i(e.yourRole?`Acting: ${e.yourRole}${e.sceneContext?` \u2014 ${e.sceneContext}`:""}`:"Acting rehearsal");case"interview":return i(e.jobTitle?`Interview: ${e.jobTitle}${e.company?` at ${e.company}`:""}`:"Job interview");case"negotiation":return i(e.scenario||e.yourGoal?`Negotiation: ${e.scenario||e.yourGoal}`:"Negotiation practice");case"sales":return i(e.product?`Pitch: ${e.product}${e.buyerPersona?` to ${e.buyerPersona}`:""}`:"Sales roleplay");case"difficult":return i(e.situation||"Difficult conversation");case"historical":return i(t?.suggestedTopic||(t?`Debate with ${t.name}`:"Historical debate"));case"rapbattle":return i(e.theme?`Rap battle: ${e.theme}`:"Open rap battle");case"witness":return i(e.who?`Sharing the gospel with ${e.who}`:"Sharing the gospel");case"trafficstop":return i(`Traffic stop: ${{nervous:"nervous driver",argumentative:"argumentative driver",sovereign:"sovereign citizen",impaired:"possibly impaired driver",ccw:"driver with a firearm"}[e.driver]||"driver"}`);case"deescalate":return i({mental:"Crisis call: mental health",refuse:"Crisis call: refusing to leave",intox:"Crisis call: intoxicated",domestic:"Crisis call: domestic",selfharm:"Crisis call: overpass"}[e.call]||"Crisis call");case"testify":return i(`Cross-examination: ${e.caseFacts||"the case"}`);case"speaking":return i(`Talk: ${e.topic||"public speaking"}`);case"salary":return i(`${{offer:"Job offer",raise:"Raise",promotion:"Promotion",counter:"Counter-offer"}[e.kind]||"Pay"}: ${e.role||"negotiation"}`);case"customer":return i(`Angry customer: ${e.complaint||e.role||"complaint"}`);case"auditor":return i({lobby:"Audit: station lobby",sidewalk:"Audit: from the sidewalk",postoffice:"Audit: post office",complaint:"Audit: filming a business",scene:"Audit: near an active scene"}[e.scenario]||"First Amendment audit");case"rights":return i({traffic:"Traffic stop",dui:"Late-night stop",walking:"Stopped on the street",passenger:"Passenger in a stopped car",door:"Officers at the door"}[e.scenario]||"Police stop");case"expert":return i(e.profession?`Expert: ${e.profession}`:"Domain expert");default:return i((n.name||"Sparring")+" session")}}function Km(n,e){return new Promise((t,i)=>{let r=document.createElement("div");r.className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in",r.setAttribute("role","dialog"),r.setAttribute("aria-modal","true"),r.innerHTML=`<div class="relative w-full max-w-sm overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 p-7 text-center shadow-2xl">
      <p class="eyebrow mb-5 !text-amber-400">Coin toss</p>
      <div class="coin-container my-6"><div class="coin-3d coin-flipping" id="toss-coin">
        <div class="coin-side coin-side-front"><span class="text-[11px] font-black uppercase tracking-wider">You</span></div>
        <div class="coin-side coin-side-back"><span class="text-[11px] font-black uppercase tracking-wider">Them</span></div>
      </div></div>
      <div id="toss-status" class="mb-1.5 text-base font-semibold text-white">Flipping\u2026</div>
      <p id="toss-sub" class="text-sm text-slate-400">Heads you open \xB7 Tails they open</p>
      <button type="button" id="toss-go" class="btn-primary mt-6 hidden w-full py-3">Enter the floor \u2192</button>
    </div>`,document.body.appendChild(r);let s=r.querySelector("#toss-coin"),a=r.querySelector("#toss-status"),o=r.querySelector("#toss-sub"),l=r.querySelector("#toss-go");n.then(c=>{setTimeout(()=>{s.classList.remove("coin-flipping");let d=c.resolvedFirstSpeaker==="user";s.classList.add(d?"coin-land-heads":"coin-land-tails"),a.innerHTML=d?'<span class="text-emerald-400">Heads \u2014 you open.</span>':`<span class="text-amber-400">Tails \u2014 ${Le(e)} opens.</span>`,o.textContent=d?"Deliver your opening statement.":`${e} takes the floor first.`,l.classList.remove("hidden"),l.focus();let u=setTimeout(()=>{r.remove(),t(c)},2200);l.onclick=()=>{clearTimeout(u),r.remove(),t(c)}},1200)}).catch(c=>{r.remove(),i(c)})})}async function Zm(n,e){n.innerHTML=`<div class="mx-auto max-w-2xl px-4 py-6 sm:py-10" id="setup-root">${ul("page").outerHTML}</div>`;let t=n.querySelector("#setup-root"),i;try{i=await Qn()}catch{t.innerHTML='<div class="py-16 text-center text-slate-400"><p class="mb-2 font-semibold text-white">Couldn\u2019t load this mode</p><p class="mb-6 text-sm">Check your connection and try again.</p><a href="#/" class="btn-primary">Back to practice</a></div>';return}let r=i.find(b=>b.id===e);if(r&&t.isConnected&&(document.title=`${r.name} setup \xB7 AdversaryAI`),!r){t.innerHTML='<div class="py-16 text-center text-slate-400"><h1 class="mb-3 text-display-md text-white">Mode not found</h1><p class="mb-6 text-sm">That practice mode doesn\u2019t exist.</p><a href="#/" class="btn-primary">Back to practice</a></div>';return}let s=Id(r.id),a=r.id==="debate",o=r.id==="difficult",l=r.figures??[],c=new Map(l.map(b=>[b.id,b])),d={persona:xu[0],figure:null,rel:"coworker",present:"masc",rounds:s.def,first:s.fixedFirst||s.defFirst,style:"oxford",side:"for",difficulty:"normal"},u=(r.setupFields||[]).filter(b=>b.key!=="figureId");(a||r.id==="historical")&&!u.some(b=>b.key==="topic")&&u.push({key:"topic",label:(r.id==="historical","Debate motion"),type:"textarea",placeholder:r.id==="historical"?"Pick a figure to get a suggested motion \u2014 or write your own":"e.g. Social media platforms should be regulated as public utilities",required:!0});let h=new URLSearchParams(location.hash.split("?")[1]||"").get("topic"),p=s.open?_u[s.unit].map(b=>b.v===0?{...b,...s.open}:b):_u[s.unit];if(t.innerHTML=`
    <a href="#/" class="-my-2 inline-flex items-center gap-1 py-3 text-sm text-slate-500 hover:text-slate-300">\u2190 All modes</a>
    <div class="mb-2 mt-4 flex items-center gap-4">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900 text-accent-500 [&>svg]:h-7 [&>svg]:w-7">${Pd[r.id]??Xe.chat}</div>
      <div class="min-w-0">
        <h1 class="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-display-md">${_t(r.name)}</h1>
        <p class="text-sm font-medium text-accent-400">${_t(r.tagline)}</p>
      </div>
    </div>
    <p class="mb-2 text-sm leading-relaxed text-slate-400 sm:text-base">${_t(r.introCopy??r.description)}</p>
    ${r.disclaimer?`<div class="mt-5 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"><span class="shrink-0 text-amber-400 [&>svg]:h-5 [&>svg]:w-5">${Xe.warning}</span><p class="text-sm leading-relaxed text-slate-300" id="mode-disclaimer"></p></div>`:""}

    ${l.length?`<section class="setup-section"><h2 class="section-title">Choose your figure</h2><p class="section-sub">Each argues from their documented views and writings, in their own voice.</p><div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2" id="figure-grid">${l.map(Wm).join("")}</div></section>`:""}

    ${a?'<section class="setup-section"><h2 class="section-title">Choose your opponent</h2><p class="section-sub">Each has a different style of attack.</p><div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2" id="persona-grid"></div></section>':""}

    ${o?`<section class="setup-section"><h2 class="section-title">Who is this conversation with?</h2><p class="section-sub">They\u2019ll look and sound the part.</p>
      <div class="mb-4 flex flex-wrap gap-2" id="rel-grid">${kn.map(b=>`<button type="button" class="pill-chip" data-rel="${b.id}" aria-pressed="${b.id===d.rel}">${b.label}</button>`).join("")}</div>
      <p class="mb-2 text-xs font-medium text-slate-400">Their voice &amp; look</p>
      <div class="flex flex-wrap gap-2" id="present-grid"><button type="button" class="pill-chip" data-present="masc" aria-pressed="true">Masculine</button><button type="button" class="pill-chip" data-present="fem" aria-pressed="false">Feminine</button></div></section>`:""}

    ${r.id==="acting"?`<section class="setup-section"><h2 class="section-title">How do you want to rehearse?</h2><div class="opt-grid grid-cols-1 sm:grid-cols-2">${vn("actMode",[{v:"script",t:"Run my script",s:"Paste your scene \u2014 your partner reads every other part, word for word"},{v:"improv",t:"Improvise",s:"Describe a scene \u2014 your partner improvises in character"}],"script")}</div></section>
    <section class="setup-section" id="script-sec">
      <label class="label" for="setup-script">Your scene</label>
      <textarea id="setup-script" rows="9" class="field text-sm leading-relaxed" placeholder="ROMEO: But soft, what light through yonder window breaks?&#10;JULIET: Ay me.&#10;ROMEO: She speaks!"></textarea>
      <p class="help">One line per speech as <b>NAME: line</b> \u2014 screenplay format (name on its own line) works too. Stage directions in (parentheses) are skipped.</p>
      <div class="mt-2 flex flex-wrap items-center gap-3"><label class="btn-ghost btn-sm cursor-pointer">Upload a .txt<input type="file" id="script-file" accept=".txt,.fountain,.md,text/plain" class="hidden" /></label><span id="script-stats" class="text-xs text-slate-400"></span></div>
      <div id="role-sec" class="mt-5 hidden"><p class="label">Which character are you?</p><div class="flex flex-wrap gap-2" id="role-grid"></div></div>
    </section>`:""}

    <section class="setup-section space-y-5" id="field-list">${u.map(b=>`<div>${$m(b)}</div>`).join("")}</section>

    ${s.side?`<section class="setup-section"><h2 class="section-title">Your side</h2><div class="opt-grid grid-cols-1 sm:grid-cols-3">${vn("side",Gm,d.side)}</div></section>`:""}

    ${s.styles?`<section class="setup-section"><h2 class="section-title">Format</h2><div class="opt-grid grid-cols-2 sm:grid-cols-4">${vn("style",jh,d.style)}</div></section>`:""}

    ${r.id!=="acting"?`<section class="setup-section"><h2 class="section-title">Difficulty</h2><div class="opt-grid grid-cols-1 sm:grid-cols-3">${vn("difficulty",zm,"normal")}</div></section>`:""}

    <section class="setup-section" id="len-sec"><h2 class="section-title">Length</h2><p class="section-sub">Each ${s.unit==="bars"?"round":s.unit} is one round.<span data-balance></span></p><div class="opt-grid grid-cols-2 sm:grid-cols-4">${vn("rounds",p,d.rounds)}</div></section>

    ${s.first?`<section class="setup-section" id="first-sec"><h2 class="section-title">Who speaks first?</h2><div class="opt-grid ${s.first.length===3?"grid-cols-1 sm:grid-cols-3":"grid-cols-2"}">${vn("first",s.first,d.first)}</div></section>`:`<p class="setup-section flex items-center gap-2 text-sm text-slate-400"><span class="text-accent-400">\u25CF</span>${_t(s.fixedNote)}</p>`}

    <div class="mt-6 hidden" id="setup-error"></div>
    <button id="start-btn" type="button" class="btn-primary mt-7 w-full py-3.5 text-base">Start session</button>
    <p class="mt-3 text-center text-xs text-slate-500" id="start-note"></p>
    <div id="quota-slot"></div>`,h){let b=t.querySelector('[data-key="topic"]');b&&(b.value=h)}Zn(!0).then(b=>{let _=t.querySelector("[data-balance]");_&&typeof b?.remainingRounds=="number"&&b.remainingRounds<1e5&&(_.textContent=` You have ${b.remainingRounds} round${b.remainingRounds===1?"":"s"} left.`)}).catch(()=>{});let g=t.querySelector("#mode-disclaimer"),v=()=>{g&&(g.textContent=r.disclaimer.replace("[Name]",d.figure?c.get(d.figure)?.name:"this figure"))};v();let f=t.querySelector("#start-note"),m=()=>{if(r.id==="acting"&&d.actMode==="script"){f.textContent="Your partner reads every other part, word for word. You get a line-accuracy check after each line and coaching notes at the end.";return}let b=s.judge?" An impartial judge scores both sides at the end.":" You\u2019ll get a coaching scorecard at the end.",_=s.fixedFirst?"":d.first==="user"?"You speak first.":d.first==="opponent"?"They speak first.":"A coin toss decides who opens.";f.textContent=`${_}${b}`.trim()};m();let T=null;if(t.addEventListener("click",b=>{let _=b.target.closest("[data-opt]");if(!_)return;let x=_.getAttribute("data-opt");t.querySelectorAll(`[data-opt="${x}"]`).forEach(z=>z.setAttribute("aria-pressed",String(z===_)));let C=_.getAttribute("data-value");d[x]=x==="rounds"?Number(C):C,x==="actMode"&&T?.(),m()}),r.id==="acting"){d.actMode="script",d.role=null,d.scriptEntries=[];let b=t.querySelector("#setup-script"),_=t.querySelector("#script-stats"),x=t.querySelector("#role-sec"),C=t.querySelector("#role-grid"),z=(P,L)=>t.querySelector(P)?.classList.toggle("hidden",!L);T=()=>{let P=d.actMode==="script";z("#script-sec",P),z("#field-list",!P),z("#len-sec",!P),z("#first-sec",!P)};let W=()=>{let P=d.scriptEntries=wc(b.value),L=new Map;P.forEach(O=>L.set(O.name,(L.get(O.name)||0)+1));let I=[...L.keys()];if(I.includes(d.role)||(d.role=null),!b.value.trim())_.textContent="";else if(I.length<2)_.textContent="Couldn\u2019t find two characters yet \u2014 use NAME: line.";else{let O=d.role?qh(P,d.role).length:0;_.textContent=`${P.length} lines \xB7 ${I.length} characters${d.role?` \xB7 you have ${O} cue${O===1?"":"s"} (${O} credit${O===1?"":"s"})`:""}`}x.classList.toggle("hidden",I.length<2),C.innerHTML=I.slice(0,12).map(O=>`<button type="button" class="pill-chip" data-role="${_t(O)}" aria-pressed="${O===d.role}">${_t(Il(O))} <span class="text-slate-500">\xB7 ${L.get(O)}</span></button>`).join("")},N=0;b.addEventListener("input",()=>{clearTimeout(N),N=setTimeout(W,250)}),C.addEventListener("click",P=>{let L=P.target.closest("[data-role]");L&&(d.role=L.getAttribute("data-role"),W())}),t.querySelector("#script-file").addEventListener("change",async P=>{let L=P.target.files?.[0];if(L){if(L.size>2e5)return _.textContent="That file is too big \u2014 paste just the scene you\u2019re rehearsing.";b.value=(await L.text()).slice(0,3e4),W()}}),T()}if(a){let b=t.querySelector("#persona-grid");for(let _ of xu){let x=document.createElement("button");x.type="button",x.setAttribute("aria-pressed",_.id===d.persona.id?"true":"false"),x.className="persona-card flex items-start gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4 text-left hover:border-slate-500",x.innerHTML=`<span class="mt-0.5 shrink-0 text-accent-400 [&>svg]:h-6 [&>svg]:w-6">${_.icon}</span>
        <span class="min-w-0"><span class="block font-semibold leading-tight text-white">${_t(_.name)}</span>
        <span class="mt-0.5 block text-xs font-medium uppercase tracking-wide text-accent-400">${_t(_.tagline)}</span>
        <span class="mt-1.5 text-sm leading-snug text-slate-400 line-clamp-2">${_t(_.description)}</span></span>`,x.addEventListener("click",()=>{d.persona=_,b.querySelectorAll(".persona-card").forEach(C=>C.setAttribute("aria-pressed",String(C===x)))}),b.appendChild(x)}}let M=t.querySelector("#figure-grid");if(M){let b="";M.addEventListener("click",_=>{let x=_.target.closest(".figure-card");if(!x)return;d.figure=x.getAttribute("data-figure-id"),M.querySelectorAll(".figure-card").forEach(W=>W.setAttribute("aria-pressed",String(W===x)));let C=t.querySelector('[data-key="topic"]'),z=c.get(d.figure);C&&z&&(!C.value.trim()||C.value===b)&&(C.value=z.suggestedTopic||"",b=C.value),v()})}if(o){let b=t.querySelector("#rel-grid"),_=t.querySelector("#present-grid"),x=()=>t.querySelector("#setup-otherParty"),C=kn.find(W=>W.id===d.rel)?.otherParty||"",z=x();z&&!z.value.trim()&&(z.value=C),b.addEventListener("click",W=>{let N=W.target.closest("[data-rel]");if(!N)return;d.rel=N.getAttribute("data-rel"),b.querySelectorAll("[data-rel]").forEach(I=>I.setAttribute("aria-pressed",String(I===N)));let P=x(),L=kn.find(I=>I.id===d.rel);P&&L&&(!P.value.trim()||P.value===C)&&(P.value=L.otherParty,C=L.otherParty)}),_.addEventListener("click",W=>{let N=W.target.closest("[data-present]");N&&(d.present=N.getAttribute("data-present"),_.querySelectorAll("[data-present]").forEach(P=>P.setAttribute("aria-pressed",String(P===N))))})}let S=t.querySelector("#start-btn"),k=t.querySelector("#setup-error"),R=t.querySelector("#quota-slot"),E=b=>{Nr(k,b),k.classList.remove("hidden"),k.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"})};S.addEventListener("click",async()=>{Fe.unlock(),ca(),k.classList.add("hidden");let b={},_=null;l.length&&!d.figure&&(_="Pick a figure to spar with first.");let x=r.id==="acting"&&d.actMode==="script";for(let L of u){let I=(t.querySelector(`#setup-${CSS.escape(L.key)}`)?.value??"").trim();b[L.key]=I,L.required&&!I&&!_&&!x&&(_=`Please fill in \u201C${L.label}\u201D.`)}if(r.id==="acting"&&(b.actingMode=x?"script":"improv",x)){let L=t.querySelector("#setup-script").value.trim(),I=[...new Set(wc(L).map(O=>O.name))];L?I.length<2?_="We couldn\u2019t find two characters \u2014 put each line as NAME: line.":d.role||(_="Pick which character you\u2019re playing."):_="Paste your scene first.",b.script=L.slice(0,3e4),b.scriptRole=d.role||"",b.yourRole=Il(d.role||""),b.partnerRole=I.filter(O=>O!==d.role).slice(0,3).map(Il).join(" & "),b.sceneContext=""}if(_)return E(_);let C=d.figure?c.get(d.figure):null;C&&(b.figureId=C.id),o&&(b.relationship=kn.find(L=>L.id===d.rel)?.label||"",b.presentation=d.present||"");let z=C?Im(C.id):o?Dm(d.rel,d.present):a?Om(d.persona.id):Fm(r.id);b.personaVisual=z;let W=Wh(z),N;a?N=d.persona.name:C?N=C.name:o?N=`Your ${(kn.find(L=>L.id===d.rel)?.label||"partner").toLowerCase()}`:r.id==="rapbattle"?N=String(b.mcName||"").trim()||"Verse Vice":r.id==="witness"?N=String(b.who||"").trim()||r.name:r.id==="rights"?N="Officer":r.id==="auditor"?N="Auditor":r.id==="trafficstop"?N="Driver":r.id==="deescalate"?N="Person in crisis":r.id==="testify"?N="Defense counsel":r.id==="customer"?N="Customer":r.id==="speaking"?N="Audience member":r.id==="salary"?N=b.counterpart==="recruiter"?"Recruiter":b.kind==="offer"?"Hiring manager":"Your boss":r.id==="interview"?N="Hiring manager":r.id==="thesis"?N="Thesis committee":r.id==="negotiation"?N=String(b.counterpartRole||"").trim()||"Counterpart":r.id==="sales"?N="The buyer":r.id==="acting"?N=String(b.partnerRole||"").trim()||"Scene partner":N=r.name;let P=Ym(r,b,C);s.side&&(b.userSide=d.side),r.id!=="acting"&&(b.difficulty=d.difficulty),b.personaLabel=N,S.disabled=!0,S.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Setting up\u2026</span>';try{let L=Tt("/api/debate/start",{mode:r.id,persona:a?d.persona.id:b.persona||void 0,topic:P,setup:b,targetRounds:d.rounds,firstSpeaker:d.first,debateStyle:s.styles?d.style:void 0}),I=d.first==="cointoss"?await Km(L,N):await L,O=I.debateId;Ps("session_start",{mode:r.id}),jm(O,{modeId:r.id,modeName:r.name,topic:P,personaLabel:N,judgeEnabled:!!I.judge,personaVisual:W.model,targetRounds:I.targetRounds??d.rounds,firstSpeaker:d.first,resolvedFirstSpeaker:I.resolvedFirstSpeaker||d.first,debateStyle:I.debateStyle||null,userSide:b.userSide||null,figureId:C?C.id:void 0}),location.hash=`#/session/${encodeURIComponent(O)}`}catch(L){L instanceof Ct&&L.status===402?(R.replaceChildren(Sc()),S.classList.add("hidden"),f.classList.add("hidden")):(E(L instanceof Ct&&(L.body?.message||L.body?.error)||"Could not start the session. Please try again."),S.disabled=!1,S.textContent="Start session")}})}var hl="170",Xh=0,Mc=1,Yh=2,kd=1,Kh=2,Vi=3,qi=0,Zt=1,Ci=2,pr=0,nn=1,Tc=2,Ec=3,Ac=4,Zh=5,Or=100,Jh=101,Qh=102,ep=103,tp=104,ip=200,rp=201,np=202,sp=203,$a=204,Wa=205,ap=206,op=207,lp=208,cp=209,dp=210,up=211,hp=212,pp=213,mp=214,ja=0,qa=1,Xa=2,an=3,Ya=4,Ka=5,Za=6,Ja=7,Dd=0,fp=1,gp=2,mr=0,vp=1,xp=2,_p=3,Ud=4,yp=5,bp=6,Sp=7,Rc="attached",wp="detached",Nd=300,on=301,ln=302,Qa=303,eo=304,ta=306,cn=1e3,ur=1001,Is=1002,Jt=1003,Od=1004,Un=1005,si=1006,Ss=1007,Wi=1008,Xi=1009,Fd=1010,Bd=1011,Hn=1012,pl=1013,zr=1014,yi=1015,es=1016,ml=1017,fl=1018,dn=1020,Hd=35902,zd=1021,Vd=1022,di=1023,Gd=1024,$d=1025,sn=1026,un=1027,gl=1028,vl=1029,Wd=1030,xl=1031,_l=1033,ws=33776,Ms=33777,Ts=33778,Es=33779,to=35840,io=35841,ro=35842,no=35843,so=36196,ao=37492,oo=37496,lo=37808,co=37809,uo=37810,ho=37811,po=37812,mo=37813,fo=37814,go=37815,vo=37816,xo=37817,_o=37818,yo=37819,bo=37820,So=37821,As=36492,wo=36494,Mo=36495,jd=36283,To=36284,Eo=36285,Ao=36286,zn=2300,Vn=2301,Va=2302,Cc=2400,Lc=2401,Pc=2402,Mp=2500,Tp=0,qd=1,Ro=2,Ep=3200,Ap=3201,Xd=0,Rp=1,dr="",zt="srgb",Qt="srgb-linear",ia="linear",ut="srgb",en=7680,Ic=519,Cp=512,Lp=513,Pp=514,Yd=515,Ip=516,kp=517,Dp=518,Up=519,Co=35044,kc="300 es",ji=2e3,ks=2001,gr=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let i=this._listeners[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let i=t.slice(0);for(let r=0,s=i.length;r<s;r++)i[r].call(this,e);e.target=null}}},Xt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],yu=1234567,Rs=Math.PI/180,Gn=180/Math.PI;function ki(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Xt[n&255]+Xt[n>>8&255]+Xt[n>>16&255]+Xt[n>>24&255]+"-"+Xt[e&255]+Xt[e>>8&255]+"-"+Xt[e>>16&15|64]+Xt[e>>24&255]+"-"+Xt[t&63|128]+Xt[t>>8&255]+"-"+Xt[t>>16&255]+Xt[t>>24&255]+Xt[i&255]+Xt[i>>8&255]+Xt[i>>16&255]+Xt[i>>24&255]).toLowerCase()}function Kt(n,e,t){return Math.max(e,Math.min(t,n))}function Kd(n,e){return(n%e+e)%e}function Jm(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function Qm(n,e,t){return n!==e?(t-n)/(e-n):0}function Cs(n,e,t){return(1-t)*n+t*e}function ef(n,e,t,i){return Cs(n,e,1-Math.exp(-t*i))}function tf(n,e=1){return e-Math.abs(Kd(n,e*2)-e)}function rf(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function nf(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function sf(n,e){return n+Math.floor(Math.random()*(e-n+1))}function af(n,e){return n+Math.random()*(e-n)}function of(n){return n*(.5-Math.random())}function lf(n){n!==void 0&&(yu=n);let e=yu+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function cf(n){return n*Rs}function df(n){return n*Gn}function uf(n){return(n&n-1)===0&&n!==0}function hf(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function pf(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function mf(n,e,t,i,r){let s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+i)/2),d=a((e+i)/2),u=s((e-i)/2),h=a((e-i)/2),p=s((i-e)/2),g=a((i-e)/2);switch(r){case"XYX":n.set(o*d,l*u,l*h,o*c);break;case"YZY":n.set(l*h,o*d,l*u,o*c);break;case"ZXZ":n.set(l*u,l*h,o*d,o*c);break;case"XZX":n.set(o*d,l*g,l*p,o*c);break;case"YXY":n.set(l*p,o*d,l*g,o*c);break;case"ZYZ":n.set(l*g,l*p,o*d,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Li(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function ht(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var Np={DEG2RAD:Rs,RAD2DEG:Gn,generateUUID:ki,clamp:Kt,euclideanModulo:Kd,mapLinear:Jm,inverseLerp:Qm,lerp:Cs,damp:ef,pingpong:tf,smoothstep:rf,smootherstep:nf,randInt:sf,randFloat:af,randFloatSpread:of,seededRandom:lf,degToRad:cf,radToDeg:df,isPowerOfTwo:uf,ceilPowerOfTwo:hf,floorPowerOfTwo:pf,setQuaternionFromProperEuler:mf,normalize:ht,denormalize:Li},it=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Kt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ge=class n{constructor(e,t,i,r,s,a,o,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c)}set(e,t,i,r,s,a,o,l,c){let d=this.elements;return d[0]=e,d[1]=r,d[2]=o,d[3]=t,d[4]=s,d[5]=l,d[6]=i,d[7]=a,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],d=i[4],u=i[7],h=i[2],p=i[5],g=i[8],v=r[0],f=r[3],m=r[6],T=r[1],M=r[4],S=r[7],k=r[2],R=r[5],E=r[8];return s[0]=a*v+o*T+l*k,s[3]=a*f+o*M+l*R,s[6]=a*m+o*S+l*E,s[1]=c*v+d*T+u*k,s[4]=c*f+d*M+u*R,s[7]=c*m+d*S+u*E,s[2]=h*v+p*T+g*k,s[5]=h*f+p*M+g*R,s[8]=h*m+p*S+g*E,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8];return t*a*d-t*o*c-i*s*d+i*o*l+r*s*c-r*a*l}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],u=d*a-o*c,h=o*l-d*s,p=c*s-a*l,g=t*u+i*h+r*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return e[0]=u*v,e[1]=(r*c-d*i)*v,e[2]=(o*i-r*a)*v,e[3]=h*v,e[4]=(d*t-r*l)*v,e[5]=(r*s-o*t)*v,e[6]=p*v,e[7]=(i*l-c*t)*v,e[8]=(a*t-i*s)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){let l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(kl.makeScale(e,t)),this}rotate(e){return this.premultiply(kl.makeRotation(-e)),this}translate(e,t){return this.premultiply(kl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},kl=new Ge;function Op(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Ds(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Fp(){let n=Ds("canvas");return n.style.display="block",n}var bu={};function _s(n){n in bu||(bu[n]=!0,console.warn(n))}function ff(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}function gf(n){let e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function vf(n){let e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var tt={enabled:!0,workingColorSpace:Qt,spaces:{},convert:function(n,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===ut&&(n.r=fr(n.r),n.g=fr(n.g),n.b=fr(n.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(n.applyMatrix3(this.spaces[e].toXYZ),n.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===ut&&(n.r=On(n.r),n.g=On(n.g),n.b=On(n.b))),n},fromWorkingColorSpace:function(n,e){return this.convert(n,this.workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===dr?ia:this.spaces[n].transfer},getLuminanceCoefficients:function(n,e=this.workingColorSpace){return n.fromArray(this.spaces[e].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,e,t){return n.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace}};function fr(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function On(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Su=[.64,.33,.3,.6,.15,.06],wu=[.2126,.7152,.0722],Mu=[.3127,.329],Tu=new Ge().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Eu=new Ge().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);tt.define({[Qt]:{primaries:Su,whitePoint:Mu,transfer:ia,toXYZ:Tu,fromXYZ:Eu,luminanceCoefficients:wu,workingColorSpaceConfig:{unpackColorSpace:zt},outputColorSpaceConfig:{drawingBufferColorSpace:zt}},[zt]:{primaries:Su,whitePoint:Mu,transfer:ut,toXYZ:Tu,fromXYZ:Eu,luminanceCoefficients:wu,outputColorSpaceConfig:{drawingBufferColorSpace:zt}}});var xn,Lo=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{xn===void 0&&(xn=Ds("canvas")),xn.width=e.width,xn.height=e.height;let i=xn.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=xn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ds("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=fr(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(fr(t[i]/255)*255):t[i]=fr(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},xf=0,Us=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:xf++}),this.uuid=ki(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Dl(r[a].image)):s.push(Dl(r[a]))}else s=Dl(r);i.url=s}return t||(e.images[this.uuid]=i),i}};function Dl(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Lo.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var _f=0,qt=class n extends gr{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=ur,r=ur,s=si,a=Wi,o=di,l=Xi,c=n.DEFAULT_ANISOTROPY,d=dr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:_f++}),this.uuid=ki(),this.name="",this.source=new Us(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new it(0,0),this.repeat=new it(1,1),this.center=new it(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ge,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Nd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case cn:e.x=e.x-Math.floor(e.x);break;case ur:e.x=e.x<0?0:1;break;case Is:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case cn:e.y=e.y-Math.floor(e.y);break;case ur:e.y=e.y<0?0:1;break;case Is:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};qt.DEFAULT_IMAGE=null;qt.DEFAULT_MAPPING=Nd;qt.DEFAULT_ANISOTROPY=1;var ot=class n{constructor(e=0,t=0,i=0,r=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s,a=e.elements,o=a[0],l=a[4],c=a[8],d=a[1],u=a[5],h=a[9],p=a[2],g=a[6],v=a[10];if(Math.abs(l-d)<.01&&Math.abs(c-p)<.01&&Math.abs(h-g)<.01){if(Math.abs(l+d)<.1&&Math.abs(c+p)<.1&&Math.abs(h+g)<.1&&Math.abs(o+u+v-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let m=(o+1)/2,T=(u+1)/2,M=(v+1)/2,S=(l+d)/4,k=(c+p)/4,R=(h+g)/4;return m>T&&m>M?m<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(m),r=S/i,s=k/i):T>M?T<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(T),i=S/r,s=R/r):M<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(M),i=k/s,r=R/s),this.set(i,r,s,t),this}let f=Math.sqrt((g-h)*(g-h)+(c-p)*(c-p)+(d-l)*(d-l));return Math.abs(f)<.001&&(f=1),this.x=(g-h)/f,this.y=(c-p)/f,this.z=(d-l)/f,this.w=Math.acos((o+u+v-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Po=class extends gr{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new ot(0,0,e,t),this.scissorTest=!1,this.viewport=new ot(0,0,e,t);let r={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:si,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let s=new qt(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];let a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,r=e.textures.length;i<r;i++)this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Us(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Yi=class extends Po{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Ns=class extends qt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Jt,this.minFilter=Jt,this.wrapR=ur,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Io=class extends qt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Jt,this.minFilter=Jt,this.wrapR=ur,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ui=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],c=i[r+1],d=i[r+2],u=i[r+3],h=s[a+0],p=s[a+1],g=s[a+2],v=s[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u;return}if(o===1){e[t+0]=h,e[t+1]=p,e[t+2]=g,e[t+3]=v;return}if(u!==v||l!==h||c!==p||d!==g){let f=1-o,m=l*h+c*p+d*g+u*v,T=m>=0?1:-1,M=1-m*m;if(M>Number.EPSILON){let k=Math.sqrt(M),R=Math.atan2(k,m*T);f=Math.sin(f*R)/k,o=Math.sin(o*R)/k}let S=o*T;if(l=l*f+h*S,c=c*f+p*S,d=d*f+g*S,u=u*f+v*S,f===1-o){let k=1/Math.sqrt(l*l+c*c+d*d+u*u);l*=k,c*=k,d*=k,u*=k}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,r,s,a){let o=i[r],l=i[r+1],c=i[r+2],d=i[r+3],u=s[a],h=s[a+1],p=s[a+2],g=s[a+3];return e[t]=o*g+d*u+l*p-c*h,e[t+1]=l*g+d*h+c*u-o*p,e[t+2]=c*g+d*p+o*h-l*u,e[t+3]=d*g-o*u-l*h-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),d=o(r/2),u=o(s/2),h=l(i/2),p=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=h*d*u+c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u-h*p*g;break;case"YXZ":this._x=h*d*u+c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u+h*p*g;break;case"ZXY":this._x=h*d*u-c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u-h*p*g;break;case"ZYX":this._x=h*d*u-c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u+h*p*g;break;case"YZX":this._x=h*d*u+c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u-h*p*g;break;case"XZY":this._x=h*d*u-c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u+h*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],d=t[6],u=t[10],h=i+o+u;if(h>0){let p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(d-l)*p,this._y=(s-c)*p,this._z=(a-r)*p}else if(i>o&&i>u){let p=2*Math.sqrt(1+i-o-u);this._w=(d-l)/p,this._x=.25*p,this._y=(r+a)/p,this._z=(s+c)/p}else if(o>u){let p=2*Math.sqrt(1+o-i-u);this._w=(s-c)/p,this._x=(r+a)/p,this._y=.25*p,this._z=(l+d)/p}else{let p=2*Math.sqrt(1+u-i-o);this._w=(a-r)/p,this._x=(s+c)/p,this._y=(l+d)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Kt(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,d=t._w;return this._x=i*d+a*o+r*c-s*l,this._y=r*d+a*l+s*o-i*c,this._z=s*d+a*c+i*l-r*o,this._w=a*d-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,r=this._y,s=this._z,a=this._w,o=a*e._w+i*e._x+r*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=i,this._y=r,this._z=s,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*i+t*this._x,this._y=p*r+t*this._y,this._z=p*s+t*this._z,this.normalize(),this}let c=Math.sqrt(l),d=Math.atan2(c,o),u=Math.sin((1-t)*d)/c,h=Math.sin(t*d)/c;return this._w=a*u+this._w*h,this._x=i*u+this._x*h,this._y=r*u+this._y*h,this._z=s*u+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Au.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Au.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),d=2*(o*t-s*r),u=2*(s*i-a*t);return this.x=t+l*c+a*u-o*d,this.y=i+l*d+o*c-s*u,this.z=r+l*u+s*d-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Ul.copy(this).projectOnVector(e),this.sub(Ul)}reflect(e){return this.sub(Ul.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Kt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ul=new G,Au=new Ui,Si=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Ti.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Ti.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Ti.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Ti):Ti.fromBufferAttribute(s,a),Ti.applyMatrix4(e.matrixWorld),this.expandByPoint(Ti);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),pa.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),pa.copy(i.boundingBox)),pa.applyMatrix4(e.matrixWorld),this.union(pa)}let r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ti),Ti.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(cs),ma.subVectors(this.max,cs),_n.subVectors(e.a,cs),yn.subVectors(e.b,cs),bn.subVectors(e.c,cs),Cr.subVectors(yn,_n),Lr.subVectors(bn,yn),qr.subVectors(_n,bn);let t=[0,-Cr.z,Cr.y,0,-Lr.z,Lr.y,0,-qr.z,qr.y,Cr.z,0,-Cr.x,Lr.z,0,-Lr.x,qr.z,0,-qr.x,-Cr.y,Cr.x,0,-Lr.y,Lr.x,0,-qr.y,qr.x,0];return!Nl(t,_n,yn,bn,ma)||(t=[1,0,0,0,1,0,0,0,1],!Nl(t,_n,yn,bn,ma))?!1:(fa.crossVectors(Cr,Lr),t=[fa.x,fa.y,fa.z],Nl(t,_n,yn,bn,ma))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ti).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ti).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(rr[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),rr[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),rr[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),rr[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),rr[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),rr[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),rr[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),rr[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(rr),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},rr=[new G,new G,new G,new G,new G,new G,new G,new G],Ti=new G,pa=new Si,_n=new G,yn=new G,bn=new G,Cr=new G,Lr=new G,qr=new G,cs=new G,ma=new G,fa=new G,Xr=new G;function Nl(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){Xr.fromArray(n,s);let o=r.x*Math.abs(Xr.x)+r.y*Math.abs(Xr.y)+r.z*Math.abs(Xr.z),l=e.dot(Xr),c=t.dot(Xr),d=i.dot(Xr);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>o)return!1}return!0}var yf=new Si,ds=new G,Ol=new G,hi=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):yf.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ds.subVectors(e,this.center);let t=ds.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(ds,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ol.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ds.copy(e.center).add(Ol)),this.expandByPoint(ds.copy(e.center).sub(Ol))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},nr=new G,Fl=new G,ga=new G,Pr=new G,Bl=new G,va=new G,Hl=new G,hn=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,nr)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=nr.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(nr.copy(this.origin).addScaledVector(this.direction,t),nr.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Fl.copy(e).add(t).multiplyScalar(.5),ga.copy(t).sub(e).normalize(),Pr.copy(this.origin).sub(Fl);let s=e.distanceTo(t)*.5,a=-this.direction.dot(ga),o=Pr.dot(this.direction),l=-Pr.dot(ga),c=Pr.lengthSq(),d=Math.abs(1-a*a),u,h,p,g;if(d>0)if(u=a*l-o,h=a*o-l,g=s*d,u>=0)if(h>=-g)if(h<=g){let v=1/d;u*=v,h*=v,p=u*(u+a*h+2*o)+h*(a*u+h+2*l)+c}else h=s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;else h=-s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;else h<=-g?(u=Math.max(0,-(-a*s+o)),h=u>0?-s:Math.min(Math.max(-s,-l),s),p=-u*u+h*(h+2*l)+c):h<=g?(u=0,h=Math.min(Math.max(-s,-l),s),p=h*(h+2*l)+c):(u=Math.max(0,-(a*s+o)),h=u>0?s:Math.min(Math.max(-s,-l),s),p=-u*u+h*(h+2*l)+c);else h=a>0?-s:s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Fl).addScaledVector(ga,h),p}intersectSphere(e,t){nr.subVectors(e.center,this.origin);let i=nr.dot(this.direction),r=nr.dot(nr)-i*i,s=e.radius*e.radius;if(r>s)return null;let a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l,c=1/this.direction.x,d=1/this.direction.y,u=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,r=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,r=(e.min.x-h.x)*c),d>=0?(s=(e.min.y-h.y)*d,a=(e.max.y-h.y)*d):(s=(e.max.y-h.y)*d,a=(e.min.y-h.y)*d),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-h.z)*u,l=(e.max.z-h.z)*u):(o=(e.max.z-h.z)*u,l=(e.min.z-h.z)*u),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,nr)!==null}intersectTriangle(e,t,i,r,s){Bl.subVectors(t,e),va.subVectors(i,e),Hl.crossVectors(Bl,va);let a=this.direction.dot(Hl),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Pr.subVectors(this.origin,e);let l=o*this.direction.dot(va.crossVectors(Pr,va));if(l<0)return null;let c=o*this.direction.dot(Bl.cross(Pr));if(c<0||l+c>a)return null;let d=-o*Pr.dot(Hl);return d<0?null:this.at(d/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},We=class n{constructor(e,t,i,r,s,a,o,l,c,d,u,h,p,g,v,f){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c,d,u,h,p,g,v,f)}set(e,t,i,r,s,a,o,l,c,d,u,h,p,g,v,f){let m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=r,m[1]=s,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=d,m[10]=u,m[14]=h,m[3]=p,m[7]=g,m[11]=v,m[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,r=1/Sn.setFromMatrixColumn(e,0).length(),s=1/Sn.setFromMatrixColumn(e,1).length(),a=1/Sn.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),d=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){let h=a*d,p=a*u,g=o*d,v=o*u;t[0]=l*d,t[4]=-l*u,t[8]=c,t[1]=p+g*c,t[5]=h-v*c,t[9]=-o*l,t[2]=v-h*c,t[6]=g+p*c,t[10]=a*l}else if(e.order==="YXZ"){let h=l*d,p=l*u,g=c*d,v=c*u;t[0]=h+v*o,t[4]=g*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*d,t[9]=-o,t[2]=p*o-g,t[6]=v+h*o,t[10]=a*l}else if(e.order==="ZXY"){let h=l*d,p=l*u,g=c*d,v=c*u;t[0]=h-v*o,t[4]=-a*u,t[8]=g+p*o,t[1]=p+g*o,t[5]=a*d,t[9]=v-h*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let h=a*d,p=a*u,g=o*d,v=o*u;t[0]=l*d,t[4]=g*c-p,t[8]=h*c+v,t[1]=l*u,t[5]=v*c+h,t[9]=p*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let h=a*l,p=a*c,g=o*l,v=o*c;t[0]=l*d,t[4]=v-h*u,t[8]=g*u+p,t[1]=u,t[5]=a*d,t[9]=-o*d,t[2]=-c*d,t[6]=p*u+g,t[10]=h-v*u}else if(e.order==="XZY"){let h=a*l,p=a*c,g=o*l,v=o*c;t[0]=l*d,t[4]=-u,t[8]=c*d,t[1]=h*u+v,t[5]=a*d,t[9]=p*u-g,t[2]=g*u-p,t[6]=o*d,t[10]=v*u+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(bf,e,Sf)}lookAt(e,t,i){let r=this.elements;return li.subVectors(e,t),li.lengthSq()===0&&(li.z=1),li.normalize(),Ir.crossVectors(i,li),Ir.lengthSq()===0&&(Math.abs(i.z)===1?li.x+=1e-4:li.z+=1e-4,li.normalize(),Ir.crossVectors(i,li)),Ir.normalize(),xa.crossVectors(li,Ir),r[0]=Ir.x,r[4]=xa.x,r[8]=li.x,r[1]=Ir.y,r[5]=xa.y,r[9]=li.y,r[2]=Ir.z,r[6]=xa.z,r[10]=li.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],d=i[1],u=i[5],h=i[9],p=i[13],g=i[2],v=i[6],f=i[10],m=i[14],T=i[3],M=i[7],S=i[11],k=i[15],R=r[0],E=r[4],b=r[8],_=r[12],x=r[1],C=r[5],z=r[9],W=r[13],N=r[2],P=r[6],L=r[10],I=r[14],O=r[3],J=r[7],Z=r[11],re=r[15];return s[0]=a*R+o*x+l*N+c*O,s[4]=a*E+o*C+l*P+c*J,s[8]=a*b+o*z+l*L+c*Z,s[12]=a*_+o*W+l*I+c*re,s[1]=d*R+u*x+h*N+p*O,s[5]=d*E+u*C+h*P+p*J,s[9]=d*b+u*z+h*L+p*Z,s[13]=d*_+u*W+h*I+p*re,s[2]=g*R+v*x+f*N+m*O,s[6]=g*E+v*C+f*P+m*J,s[10]=g*b+v*z+f*L+m*Z,s[14]=g*_+v*W+f*I+m*re,s[3]=T*R+M*x+S*N+k*O,s[7]=T*E+M*C+S*P+k*J,s[11]=T*b+M*z+S*L+k*Z,s[15]=T*_+M*W+S*I+k*re,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],d=e[2],u=e[6],h=e[10],p=e[14],g=e[3],v=e[7],f=e[11],m=e[15];return g*(+s*l*u-r*c*u-s*o*h+i*c*h+r*o*p-i*l*p)+v*(+t*l*p-t*c*h+s*a*h-r*a*p+r*c*d-s*l*d)+f*(+t*c*u-t*o*p-s*a*u+i*a*p+s*o*d-i*c*d)+m*(-r*o*d-t*l*u+t*o*h+r*a*u-i*a*h+i*l*d)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],u=e[9],h=e[10],p=e[11],g=e[12],v=e[13],f=e[14],m=e[15],T=u*f*c-v*h*c+v*l*p-o*f*p-u*l*m+o*h*m,M=g*h*c-d*f*c-g*l*p+a*f*p+d*l*m-a*h*m,S=d*v*c-g*u*c+g*o*p-a*v*p-d*o*m+a*u*m,k=g*u*l-d*v*l-g*o*h+a*v*h+d*o*f-a*u*f,R=t*T+i*M+r*S+s*k;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let E=1/R;return e[0]=T*E,e[1]=(v*h*s-u*f*s-v*r*p+i*f*p+u*r*m-i*h*m)*E,e[2]=(o*f*s-v*l*s+v*r*c-i*f*c-o*r*m+i*l*m)*E,e[3]=(u*l*s-o*h*s-u*r*c+i*h*c+o*r*p-i*l*p)*E,e[4]=M*E,e[5]=(d*f*s-g*h*s+g*r*p-t*f*p-d*r*m+t*h*m)*E,e[6]=(g*l*s-a*f*s-g*r*c+t*f*c+a*r*m-t*l*m)*E,e[7]=(a*h*s-d*l*s+d*r*c-t*h*c-a*r*p+t*l*p)*E,e[8]=S*E,e[9]=(g*u*s-d*v*s-g*i*p+t*v*p+d*i*m-t*u*m)*E,e[10]=(a*v*s-g*o*s+g*i*c-t*v*c-a*i*m+t*o*m)*E,e[11]=(d*o*s-a*u*s-d*i*c+t*u*c+a*i*p-t*o*p)*E,e[12]=k*E,e[13]=(d*v*r-g*u*r+g*i*h-t*v*h-d*i*f+t*u*f)*E,e[14]=(g*o*r-a*v*r-g*i*l+t*v*l+a*i*f-t*o*f)*E,e[15]=(a*u*r-d*o*r+d*i*l-t*u*l-a*i*h+t*o*h)*E,this}scale(e){let t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,d=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,d*o+i,d*l-r*a,0,c*l-r*o,d*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,d=a+a,u=o+o,h=s*c,p=s*d,g=s*u,v=a*d,f=a*u,m=o*u,T=l*c,M=l*d,S=l*u,k=i.x,R=i.y,E=i.z;return r[0]=(1-(v+m))*k,r[1]=(p+S)*k,r[2]=(g-M)*k,r[3]=0,r[4]=(p-S)*R,r[5]=(1-(h+m))*R,r[6]=(f+T)*R,r[7]=0,r[8]=(g+M)*E,r[9]=(f-T)*E,r[10]=(1-(h+v))*E,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements,s=Sn.set(r[0],r[1],r[2]).length(),a=Sn.set(r[4],r[5],r[6]).length(),o=Sn.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],Ei.copy(this);let l=1/s,c=1/a,d=1/o;return Ei.elements[0]*=l,Ei.elements[1]*=l,Ei.elements[2]*=l,Ei.elements[4]*=c,Ei.elements[5]*=c,Ei.elements[6]*=c,Ei.elements[8]*=d,Ei.elements[9]*=d,Ei.elements[10]*=d,t.setFromRotationMatrix(Ei),i.x=s,i.y=a,i.z=o,this}makePerspective(e,t,i,r,s,a,o=ji){let l=this.elements,c=2*s/(t-e),d=2*s/(i-r),u=(t+e)/(t-e),h=(i+r)/(i-r),p,g;if(o===ji)p=-(a+s)/(a-s),g=-2*a*s/(a-s);else if(o===ks)p=-a/(a-s),g=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=ji){let l=this.elements,c=1/(t-e),d=1/(i-r),u=1/(a-s),h=(t+e)*c,p=(i+r)*d,g,v;if(o===ji)g=(a+s)*u,v=-2*u;else if(o===ks)g=s*u,v=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*d,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Sn=new G,Ei=new We,bf=new G(0,0,0),Sf=new G(1,1,1),Ir=new G,xa=new G,li=new G,Ru=new We,Cu=new Ui,Ni=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],d=r[9],u=r[2],h=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(Kt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,p),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Kt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(Kt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Kt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Kt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Kt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-d,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Ru.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ru,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Cu.setFromEuler(this),this.setFromQuaternion(Cu,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ni.DEFAULT_ORDER="XYZ";var Os=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},wf=0,Lu=new G,wn=new Ui,sr=new We,_a=new G,us=new G,Mf=new G,Tf=new Ui,Pu=new G(1,0,0),Iu=new G(0,1,0),ku=new G(0,0,1),Du={type:"added"},Ef={type:"removed"},Mn={type:"childadded",child:null},zl={type:"childremoved",child:null},Lt=class n extends gr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:wf++}),this.uuid=ki(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new G,t=new Ni,i=new Ui,r=new G(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new We},normalMatrix:{value:new Ge}}),this.matrix=new We,this.matrixWorld=new We,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Os,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return wn.setFromAxisAngle(e,t),this.quaternion.multiply(wn),this}rotateOnWorldAxis(e,t){return wn.setFromAxisAngle(e,t),this.quaternion.premultiply(wn),this}rotateX(e){return this.rotateOnAxis(Pu,e)}rotateY(e){return this.rotateOnAxis(Iu,e)}rotateZ(e){return this.rotateOnAxis(ku,e)}translateOnAxis(e,t){return Lu.copy(e).applyQuaternion(this.quaternion),this.position.add(Lu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Pu,e)}translateY(e){return this.translateOnAxis(Iu,e)}translateZ(e){return this.translateOnAxis(ku,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(sr.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?_a.copy(e):_a.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),us.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?sr.lookAt(us,_a,this.up):sr.lookAt(_a,us,this.up),this.quaternion.setFromRotationMatrix(sr),r&&(sr.extractRotation(r.matrixWorld),wn.setFromRotationMatrix(sr),this.quaternion.premultiply(wn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Du),Mn.child=e,this.dispatchEvent(Mn),Mn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Ef),zl.child=e,this.dispatchEvent(zl),zl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),sr.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),sr.multiply(e.parent.matrixWorld)),e.applyMatrix4(sr),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Du),Mn.child=e,this.dispatchEvent(Mn),Mn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(us,e,Mf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(us,Tf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){let u=l[c];s(e.shapes,u)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),d=a(e.images),u=a(e.shapes),h=a(e.skeletons),p=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),u.length>0&&(i.shapes=u),h.length>0&&(i.skeletons=h),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(o){let l=[];for(let c in o){let d=o[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}};Lt.DEFAULT_UP=new G(0,1,0);Lt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Lt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ai=new G,ar=new G,Vl=new G,or=new G,Tn=new G,En=new G,Uu=new G,Gl=new G,$l=new G,Wl=new G,jl=new ot,ql=new ot,Xl=new ot,Fr=class n{constructor(e=new G,t=new G,i=new G){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Ai.subVectors(e,t),r.cross(Ai);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){Ai.subVectors(r,t),ar.subVectors(i,t),Vl.subVectors(e,t);let a=Ai.dot(Ai),o=Ai.dot(ar),l=Ai.dot(Vl),c=ar.dot(ar),d=ar.dot(Vl),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;let h=1/u,p=(c*l-o*d)*h,g=(a*d-o*l)*h;return s.set(1-p-g,g,p)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,or)===null?!1:or.x>=0&&or.y>=0&&or.x+or.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,or)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,or.x),l.addScaledVector(a,or.y),l.addScaledVector(o,or.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return jl.setScalar(0),ql.setScalar(0),Xl.setScalar(0),jl.fromBufferAttribute(e,t),ql.fromBufferAttribute(e,i),Xl.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(jl,s.x),a.addScaledVector(ql,s.y),a.addScaledVector(Xl,s.z),a}static isFrontFacing(e,t,i,r){return Ai.subVectors(i,t),ar.subVectors(e,t),Ai.cross(ar).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ai.subVectors(this.c,this.b),ar.subVectors(this.a,this.b),Ai.cross(ar).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,s=this.c,a,o;Tn.subVectors(r,i),En.subVectors(s,i),Gl.subVectors(e,i);let l=Tn.dot(Gl),c=En.dot(Gl);if(l<=0&&c<=0)return t.copy(i);$l.subVectors(e,r);let d=Tn.dot($l),u=En.dot($l);if(d>=0&&u<=d)return t.copy(r);let h=l*u-d*c;if(h<=0&&l>=0&&d<=0)return a=l/(l-d),t.copy(i).addScaledVector(Tn,a);Wl.subVectors(e,s);let p=Tn.dot(Wl),g=En.dot(Wl);if(g>=0&&p<=g)return t.copy(s);let v=p*c-l*g;if(v<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(i).addScaledVector(En,o);let f=d*g-p*u;if(f<=0&&u-d>=0&&p-g>=0)return Uu.subVectors(s,r),o=(u-d)/(u-d+(p-g)),t.copy(r).addScaledVector(Uu,o);let m=1/(f+v+h);return a=v*m,o=h*m,t.copy(i).addScaledVector(Tn,a).addScaledVector(En,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Bp={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},kr={h:0,s:0,l:0},ya={h:0,s:0,l:0};function Yl(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var ze=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=zt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,tt.toWorkingColorSpace(this,t),this}setRGB(e,t,i,r=tt.workingColorSpace){return this.r=e,this.g=t,this.b=i,tt.toWorkingColorSpace(this,r),this}setHSL(e,t,i,r=tt.workingColorSpace){if(e=Kd(e,1),t=Kt(t,0,1),i=Kt(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=Yl(a,s,e+1/3),this.g=Yl(a,s,e),this.b=Yl(a,s,e-1/3)}return tt.toWorkingColorSpace(this,r),this}setStyle(e,t=zt){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=zt){let i=Bp[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=fr(e.r),this.g=fr(e.g),this.b=fr(e.b),this}copyLinearToSRGB(e){return this.r=On(e.r),this.g=On(e.g),this.b=On(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=zt){return tt.fromWorkingColorSpace(Yt.copy(this),e),Math.round(Kt(Yt.r*255,0,255))*65536+Math.round(Kt(Yt.g*255,0,255))*256+Math.round(Kt(Yt.b*255,0,255))}getHexString(e=zt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=tt.workingColorSpace){tt.fromWorkingColorSpace(Yt.copy(this),t);let i=Yt.r,r=Yt.g,s=Yt.b,a=Math.max(i,r,s),o=Math.min(i,r,s),l,c,d=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=d<=.5?u/(a+o):u/(2-a-o),a){case i:l=(r-s)/u+(r<s?6:0);break;case r:l=(s-i)/u+2;break;case s:l=(i-r)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=tt.workingColorSpace){return tt.fromWorkingColorSpace(Yt.copy(this),t),e.r=Yt.r,e.g=Yt.g,e.b=Yt.b,e}getStyle(e=zt){tt.fromWorkingColorSpace(Yt.copy(this),e);let t=Yt.r,i=Yt.g,r=Yt.b;return e!==zt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(kr),this.setHSL(kr.h+e,kr.s+t,kr.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(kr),e.getHSL(ya);let i=Cs(kr.h,ya.h,t),r=Cs(kr.s,ya.s,t),s=Cs(kr.l,ya.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Yt=new ze;ze.NAMES=Bp;var Af=0,ui=class extends gr{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Af++}),this.uuid=ki(),this.name="",this.blending=nn,this.side=qi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=$a,this.blendDst=Wa,this.blendEquation=Or,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ze(0,0,0),this.blendAlpha=0,this.depthFunc=an,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ic,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=en,this.stencilZFail=en,this.stencilZPass=en,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==nn&&(i.blending=this.blending),this.side!==qi&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==$a&&(i.blendSrc=this.blendSrc),this.blendDst!==Wa&&(i.blendDst=this.blendDst),this.blendEquation!==Or&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==an&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ic&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==en&&(i.stencilFail=this.stencilFail),this.stencilZFail!==en&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==en&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let a=[];for(let o in s){let l=s[o];delete l.metadata,a.push(l)}return a}if(t){let s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Pi=class extends ui{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ni,this.combine=Dd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Dt=new G,ba=new it,Gt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Co,this.updateRanges=[],this.gpuType=yi,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ba.fromBufferAttribute(this,t),ba.applyMatrix3(e),this.setXY(t,ba.x,ba.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Dt.fromBufferAttribute(this,t),Dt.applyMatrix3(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Dt.fromBufferAttribute(this,t),Dt.applyMatrix4(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Dt.fromBufferAttribute(this,t),Dt.applyNormalMatrix(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Dt.fromBufferAttribute(this,t),Dt.transformDirection(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Li(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=ht(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Li(t,this.array)),t}setX(e,t){return this.normalized&&(t=ht(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Li(t,this.array)),t}setY(e,t){return this.normalized&&(t=ht(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Li(t,this.array)),t}setZ(e,t){return this.normalized&&(t=ht(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Li(t,this.array)),t}setW(e,t){return this.normalized&&(t=ht(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=ht(t,this.array),i=ht(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=ht(t,this.array),i=ht(i,this.array),r=ht(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=ht(t,this.array),i=ht(i,this.array),r=ht(r,this.array),s=ht(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Co&&(e.usage=this.usage),e}},Fs=class extends Gt{constructor(e,t,i){super(new Uint16Array(e),t,i)}},Bs=class extends Gt{constructor(e,t,i){super(new Uint32Array(e),t,i)}},bi=class extends Gt{constructor(e,t,i){super(new Float32Array(e),t,i)}},Rf=0,xi=new We,Kl=new Lt,An=new G,ci=new Si,hs=new Si,Bt=new G,Oi=class n extends gr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Rf++}),this.uuid=ki(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Op(e)?Bs:Fs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Ge().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return xi.makeRotationFromQuaternion(e),this.applyMatrix4(xi),this}rotateX(e){return xi.makeRotationX(e),this.applyMatrix4(xi),this}rotateY(e){return xi.makeRotationY(e),this.applyMatrix4(xi),this}rotateZ(e){return xi.makeRotationZ(e),this.applyMatrix4(xi),this}translate(e,t,i){return xi.makeTranslation(e,t,i),this.applyMatrix4(xi),this}scale(e,t,i){return xi.makeScale(e,t,i),this.applyMatrix4(xi),this}lookAt(e){return Kl.lookAt(e),Kl.updateMatrix(),this.applyMatrix4(Kl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(An).negate(),this.translate(An.x,An.y,An.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,s=e.length;r<s;r++){let a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new bi(i,3))}else{for(let i=0,r=t.count;i<r;i++){let s=e[i];t.setXYZ(i,s.x,s.y,s.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Si);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let s=t[i];ci.setFromBufferAttribute(s),this.morphTargetsRelative?(Bt.addVectors(this.boundingBox.min,ci.min),this.boundingBox.expandByPoint(Bt),Bt.addVectors(this.boundingBox.max,ci.max),this.boundingBox.expandByPoint(Bt)):(this.boundingBox.expandByPoint(ci.min),this.boundingBox.expandByPoint(ci.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new hi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new G,1/0);return}if(e){let i=this.boundingSphere.center;if(ci.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];hs.setFromBufferAttribute(o),this.morphTargetsRelative?(Bt.addVectors(ci.min,hs.min),ci.expandByPoint(Bt),Bt.addVectors(ci.max,hs.max),ci.expandByPoint(Bt)):(ci.expandByPoint(hs.min),ci.expandByPoint(hs.max))}ci.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)Bt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Bt));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],l=this.morphTargetsRelative;for(let c=0,d=o.count;c<d;c++)Bt.fromBufferAttribute(o,c),l&&(An.fromBufferAttribute(e,c),Bt.add(An)),r=Math.max(r,i.distanceToSquared(Bt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Gt(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let b=0;b<i.count;b++)o[b]=new G,l[b]=new G;let c=new G,d=new G,u=new G,h=new it,p=new it,g=new it,v=new G,f=new G;function m(b,_,x){c.fromBufferAttribute(i,b),d.fromBufferAttribute(i,_),u.fromBufferAttribute(i,x),h.fromBufferAttribute(s,b),p.fromBufferAttribute(s,_),g.fromBufferAttribute(s,x),d.sub(c),u.sub(c),p.sub(h),g.sub(h);let C=1/(p.x*g.y-g.x*p.y);isFinite(C)&&(v.copy(d).multiplyScalar(g.y).addScaledVector(u,-p.y).multiplyScalar(C),f.copy(u).multiplyScalar(p.x).addScaledVector(d,-g.x).multiplyScalar(C),o[b].add(v),o[_].add(v),o[x].add(v),l[b].add(f),l[_].add(f),l[x].add(f))}let T=this.groups;T.length===0&&(T=[{start:0,count:e.count}]);for(let b=0,_=T.length;b<_;++b){let x=T[b],C=x.start,z=x.count;for(let W=C,N=C+z;W<N;W+=3)m(e.getX(W+0),e.getX(W+1),e.getX(W+2))}let M=new G,S=new G,k=new G,R=new G;function E(b){k.fromBufferAttribute(r,b),R.copy(k);let _=o[b];M.copy(_),M.sub(k.multiplyScalar(k.dot(_))).normalize(),S.crossVectors(R,_);let x=S.dot(l[b])<0?-1:1;a.setXYZW(b,M.x,M.y,M.z,x)}for(let b=0,_=T.length;b<_;++b){let x=T[b],C=x.start,z=x.count;for(let W=C,N=C+z;W<N;W+=3)E(e.getX(W+0)),E(e.getX(W+1)),E(e.getX(W+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Gt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,p=i.count;h<p;h++)i.setXYZ(h,0,0,0);let r=new G,s=new G,a=new G,o=new G,l=new G,c=new G,d=new G,u=new G;if(e)for(let h=0,p=e.count;h<p;h+=3){let g=e.getX(h+0),v=e.getX(h+1),f=e.getX(h+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,f),d.subVectors(a,s),u.subVectors(r,s),d.cross(u),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,v),c.fromBufferAttribute(i,f),o.add(d),l.add(d),c.add(d),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(v,l.x,l.y,l.z),i.setXYZ(f,c.x,c.y,c.z)}else for(let h=0,p=t.count;h<p;h+=3)r.fromBufferAttribute(t,h+0),s.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),d.subVectors(a,s),u.subVectors(r,s),d.cross(u),i.setXYZ(h+0,d.x,d.y,d.z),i.setXYZ(h+1,d.x,d.y,d.z),i.setXYZ(h+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Bt.fromBufferAttribute(e,t),Bt.normalize(),e.setXYZ(t,Bt.x,Bt.y,Bt.z)}toNonIndexed(){function e(o,l){let c=o.array,d=o.itemSize,u=o.normalized,h=new c.constructor(l.length*d),p=0,g=0;for(let v=0,f=l.length;v<f;v++){o.isInterleavedBufferAttribute?p=l[v]*o.data.stride+o.offset:p=l[v]*d;for(let m=0;m<d;m++)h[g++]=c[p++]}return new Gt(h,d,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let o in r){let l=r[o],c=e(l,i);t.setAttribute(o,c)}let s=this.morphAttributes;for(let o in s){let l=[],c=s[o];for(let d=0,u=c.length;d<u;d++){let h=c[d],p=e(h,i);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let r={},s=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],d=[];for(let u=0,h=c.length;u<h;u++){let p=c[u];d.push(p.toJSON(e.data))}d.length>0&&(r[l]=d,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone(t));let r=e.attributes;for(let c in r){let d=r[c];this.setAttribute(c,d.clone(t))}let s=e.morphAttributes;for(let c in s){let d=[],u=s[c];for(let h=0,p=u.length;h<p;h++)d.push(u[h].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,d=a.length;c<d;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Nu=new We,Yr=new hn,Sa=new hi,Ou=new G,wa=new G,Ma=new G,Ta=new G,Zl=new G,Ea=new G,Fu=new G,Aa=new G,pt=class extends Lt{constructor(e=new Oi,t=new Pi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(s&&o){Ea.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let d=o[l],u=s[l];d!==0&&(Zl.fromBufferAttribute(u,e),a?Ea.addScaledVector(Zl,d):Ea.addScaledVector(Zl.sub(t),d))}t.add(Ea)}return t}raycast(e,t){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Sa.copy(i.boundingSphere),Sa.applyMatrix4(s),Yr.copy(e.ray).recast(e.near),!(Sa.containsPoint(Yr.origin)===!1&&(Yr.intersectSphere(Sa,Ou)===null||Yr.origin.distanceToSquared(Ou)>(e.far-e.near)**2))&&(Nu.copy(s).invert(),Yr.copy(e.ray).applyMatrix4(Nu),!(i.boundingBox!==null&&Yr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Yr)))}_computeIntersections(e,t,i){let r,s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,d=s.attributes.uv1,u=s.attributes.normal,h=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=h.length;g<v;g++){let f=h[g],m=a[f.materialIndex],T=Math.max(f.start,p.start),M=Math.min(o.count,Math.min(f.start+f.count,p.start+p.count));for(let S=T,k=M;S<k;S+=3){let R=o.getX(S),E=o.getX(S+1),b=o.getX(S+2);r=Ra(this,m,e,i,c,d,u,R,E,b),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=f.materialIndex,t.push(r))}}else{let g=Math.max(0,p.start),v=Math.min(o.count,p.start+p.count);for(let f=g,m=v;f<m;f+=3){let T=o.getX(f),M=o.getX(f+1),S=o.getX(f+2);r=Ra(this,a,e,i,c,d,u,T,M,S),r&&(r.faceIndex=Math.floor(f/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,v=h.length;g<v;g++){let f=h[g],m=a[f.materialIndex],T=Math.max(f.start,p.start),M=Math.min(l.count,Math.min(f.start+f.count,p.start+p.count));for(let S=T,k=M;S<k;S+=3){let R=S,E=S+1,b=S+2;r=Ra(this,m,e,i,c,d,u,R,E,b),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=f.materialIndex,t.push(r))}}else{let g=Math.max(0,p.start),v=Math.min(l.count,p.start+p.count);for(let f=g,m=v;f<m;f+=3){let T=f,M=f+1,S=f+2;r=Ra(this,a,e,i,c,d,u,T,M,S),r&&(r.faceIndex=Math.floor(f/3),t.push(r))}}}};function Cf(n,e,t,i,r,s,a,o){let l;if(e.side===Zt?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===qi,o),l===null)return null;Aa.copy(o),Aa.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Aa);return c<t.near||c>t.far?null:{distance:c,point:Aa.clone(),object:n}}function Ra(n,e,t,i,r,s,a,o,l,c){n.getVertexPosition(o,wa),n.getVertexPosition(l,Ma),n.getVertexPosition(c,Ta);let d=Cf(n,e,t,i,wa,Ma,Ta,Fu);if(d){let u=new G;Fr.getBarycoord(Fu,wa,Ma,Ta,u),r&&(d.uv=Fr.getInterpolatedAttribute(r,o,l,c,u,new it)),s&&(d.uv1=Fr.getInterpolatedAttribute(s,o,l,c,u,new it)),a&&(d.normal=Fr.getInterpolatedAttribute(a,o,l,c,u,new G),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));let h={a:o,b:l,c,normal:new G,materialIndex:0};Fr.getNormal(wa,Ma,Ta,h.normal),d.face=h,d.barycoord=u}return d}var pn=class n extends Oi{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};let o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);let l=[],c=[],d=[],u=[],h=0,p=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new bi(c,3)),this.setAttribute("normal",new bi(d,3)),this.setAttribute("uv",new bi(u,2));function g(v,f,m,T,M,S,k,R,E,b,_){let x=S/E,C=k/b,z=S/2,W=k/2,N=R/2,P=E+1,L=b+1,I=0,O=0,J=new G;for(let Z=0;Z<L;Z++){let re=Z*C-W;for(let ae=0;ae<P;ae++){let K=ae*x-z;J[v]=K*T,J[f]=re*M,J[m]=N,c.push(J.x,J.y,J.z),J[v]=0,J[f]=0,J[m]=R>0?1:-1,d.push(J.x,J.y,J.z),u.push(ae/E),u.push(1-Z/b),I+=1}}for(let Z=0;Z<b;Z++)for(let re=0;re<E;re++){let ae=h+re+P*Z,K=h+re+P*(Z+1),D=h+(re+1)+P*(Z+1),X=h+(re+1)+P*Z;l.push(ae,K,X),l.push(K,D,X),O+=6}o.addGroup(p,O,_),p+=O,h+=I}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function $n(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function ii(n){let e={};for(let t=0;t<n.length;t++){let i=$n(n[t]);for(let r in i)e[r]=i[r]}return e}function Lf(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Hp(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:tt.workingColorSpace}var zp={clone:$n,merge:ii},Pf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,If=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Fi=class extends ui{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Pf,this.fragmentShader=If,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=$n(e.uniforms),this.uniformsGroups=Lf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Hs=class extends Lt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new We,this.projectionMatrix=new We,this.projectionMatrixInverse=new We,this.coordinateSystem=ji}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Dr=new G,Bu=new it,Hu=new it,Vt=class extends Hs{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Gn*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Rs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Gn*2*Math.atan(Math.tan(Rs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Dr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Dr.x,Dr.y).multiplyScalar(-e/Dr.z),Dr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Dr.x,Dr.y).multiplyScalar(-e/Dr.z)}getViewSize(e,t){return this.getViewBounds(e,Bu,Hu),t.subVectors(Hu,Bu)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Rs*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Rn=-90,Cn=1,ko=class extends Lt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Vt(Rn,Cn,e,t);r.layers=this.layers,this.add(r);let s=new Vt(Rn,Cn,e,t);s.layers=this.layers,this.add(s);let a=new Vt(Rn,Cn,e,t);a.layers=this.layers,this.add(a);let o=new Vt(Rn,Cn,e,t);o.layers=this.layers,this.add(o);let l=new Vt(Rn,Cn,e,t);l.layers=this.layers,this.add(l);let c=new Vt(Rn,Cn,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(let c of t)this.remove(c);if(e===ji)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===ks)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,l,c,d]=this.children,u=e.getRenderTarget(),h=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,s),e.setRenderTarget(i,1,r),e.render(t,a),e.setRenderTarget(i,2,r),e.render(t,o),e.setRenderTarget(i,3,r),e.render(t,l),e.setRenderTarget(i,4,r),e.render(t,c),i.texture.generateMipmaps=v,e.setRenderTarget(i,5,r),e.render(t,d),e.setRenderTarget(u,h,p),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},zs=class extends qt{constructor(e,t,i,r,s,a,o,l,c,d){e=e!==void 0?e:[],t=t!==void 0?t:on,super(e,t,i,r,s,a,o,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Do=class extends Yi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new zs(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:si}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new pn(5,5,5),s=new Fi({name:"CubemapFromEquirect",uniforms:$n(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Zt,blending:pr});s.uniforms.tEquirect.value=t;let a=new pt(r,s),o=t.minFilter;return t.minFilter===Wi&&(t.minFilter=si),new ko(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,i,r){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}},Jl=new G,kf=new G,Df=new Ge,Gi=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=Jl.subVectors(i,t).cross(kf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(Jl),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Df.getNormalMatrix(e),r=this.coplanarPoint(Jl).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Kr=new hi,Ca=new G,Wn=class{constructor(e=new Gi,t=new Gi,i=new Gi,r=new Gi,s=new Gi,a=new Gi){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=ji){let i=this.planes,r=e.elements,s=r[0],a=r[1],o=r[2],l=r[3],c=r[4],d=r[5],u=r[6],h=r[7],p=r[8],g=r[9],v=r[10],f=r[11],m=r[12],T=r[13],M=r[14],S=r[15];if(i[0].setComponents(l-s,h-c,f-p,S-m).normalize(),i[1].setComponents(l+s,h+c,f+p,S+m).normalize(),i[2].setComponents(l+a,h+d,f+g,S+T).normalize(),i[3].setComponents(l-a,h-d,f-g,S-T).normalize(),i[4].setComponents(l-o,h-u,f-v,S-M).normalize(),t===ji)i[5].setComponents(l+o,h+u,f+v,S+M).normalize();else if(t===ks)i[5].setComponents(o,u,v,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Kr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Kr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Kr)}intersectsSprite(e){return Kr.center.set(0,0,0),Kr.radius=.7071067811865476,Kr.applyMatrix4(e.matrixWorld),this.intersectsSphere(Kr)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(Ca.x=r.normal.x>0?e.max.x:e.min.x,Ca.y=r.normal.y>0?e.max.y:e.min.y,Ca.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ca)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Vp(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function Uf(n){let e=new WeakMap;function t(o,l){let c=o.array,d=o.usage,u=c.byteLength,h=n.createBuffer();n.bindBuffer(l,h),n.bufferData(l,c,d),o.onUploadCallback();let p;if(c instanceof Float32Array)p=n.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=n.SHORT;else if(c instanceof Uint32Array)p=n.UNSIGNED_INT;else if(c instanceof Int32Array)p=n.INT;else if(c instanceof Int8Array)p=n.BYTE;else if(c instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,l,c){let d=l.array,u=l.updateRanges;if(n.bindBuffer(c,o),u.length===0)n.bufferSubData(c,0,d);else{u.sort((p,g)=>p.start-g.start);let h=0;for(let p=1;p<u.length;p++){let g=u[h],v=u[p];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++h,u[h]=v)}u.length=h+1;for(let p=0,g=u.length;p<g;p++){let v=u[p];n.bufferSubData(c,v.start*d.BYTES_PER_ELEMENT,d,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let d=e.get(o);(!d||d.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var Vs=class n extends Oi{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,d=l+1,u=e/o,h=t/l,p=[],g=[],v=[],f=[];for(let m=0;m<d;m++){let T=m*h-a;for(let M=0;M<c;M++){let S=M*u-s;g.push(S,-T,0),v.push(0,0,1),f.push(M/o),f.push(1-m/l)}}for(let m=0;m<l;m++)for(let T=0;T<o;T++){let M=T+c*m,S=T+c*(m+1),k=T+1+c*(m+1),R=T+1+c*m;p.push(M,S,R),p.push(S,k,R)}this.setIndex(p),this.setAttribute("position",new bi(g,3)),this.setAttribute("normal",new bi(v,3)),this.setAttribute("uv",new bi(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},Nf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Of=`#ifdef USE_ALPHAHASH
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
#endif`,Ff=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Bf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Hf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,zf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Vf=`#ifdef USE_AOMAP
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
#endif`,Gf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,$f=`#ifdef USE_BATCHING
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
#endif`,Wf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,jf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,qf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Xf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Yf=`#ifdef USE_IRIDESCENCE
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
#endif`,Kf=`#ifdef USE_BUMPMAP
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
#endif`,Zf=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Jf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Qf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,eg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,tg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ig=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,rg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,ng=`#if defined( USE_COLOR_ALPHA )
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
#endif`,sg=`#define PI 3.141592653589793
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
} // validated`,ag=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,og=`vec3 transformedNormal = objectNormal;
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
#endif`,lg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,cg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,dg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ug=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,hg="gl_FragColor = linearToOutputTexel( gl_FragColor );",pg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,mg=`#ifdef USE_ENVMAP
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
#endif`,fg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,gg=`#ifdef USE_ENVMAP
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
#endif`,vg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,xg=`#ifdef USE_ENVMAP
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
#endif`,_g=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,yg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,bg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Sg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,wg=`#ifdef USE_GRADIENTMAP
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
}`,Mg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Tg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Eg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ag=`uniform bool receiveShadow;
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
#endif`,Rg=`#ifdef USE_ENVMAP
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
#endif`,Cg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Lg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Pg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Ig=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,kg=`PhysicalMaterial material;
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
#endif`,Dg=`struct PhysicalMaterial {
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
}`,Ug=`
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
#endif`,Ng=`#if defined( RE_IndirectDiffuse )
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
#endif`,Og=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Fg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Bg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Hg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,zg=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Vg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Gg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,$g=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Wg=`#if defined( USE_POINTS_UV )
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
#endif`,jg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,qg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Xg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Yg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Kg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Zg=`#ifdef USE_MORPHTARGETS
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
#endif`,Jg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Qg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,e0=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,t0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,i0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,r0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,n0=`#ifdef USE_NORMALMAP
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
#endif`,s0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,a0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,o0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,l0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,c0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,d0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,u0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,h0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,p0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,m0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,f0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,g0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,v0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,x0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,_0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,y0=`float getShadowMask() {
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
}`,b0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,S0=`#ifdef USE_SKINNING
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
#endif`,w0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,M0=`#ifdef USE_SKINNING
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
#endif`,T0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,E0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,A0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,R0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,C0=`#ifdef USE_TRANSMISSION
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
#endif`,L0=`#ifdef USE_TRANSMISSION
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
#endif`,P0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,I0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,k0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,D0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,U0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,N0=`uniform sampler2D t2D;
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
}`,O0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,F0=`#ifdef ENVMAP_TYPE_CUBE
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
}`,B0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,H0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,z0=`#include <common>
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
}`,V0=`#if DEPTH_PACKING == 3200
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
}`,G0=`#define DISTANCE
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
}`,$0=`#define DISTANCE
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
}`,W0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,j0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,q0=`uniform float scale;
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
}`,X0=`uniform vec3 diffuse;
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
}`,Y0=`#include <common>
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
}`,K0=`uniform vec3 diffuse;
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
}`,Z0=`#define LAMBERT
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
}`,J0=`#define LAMBERT
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
}`,Q0=`#define MATCAP
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
}`,ev=`#define MATCAP
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
}`,tv=`#define NORMAL
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
}`,iv=`#define NORMAL
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
}`,rv=`#define PHONG
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
}`,nv=`#define PHONG
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
}`,sv=`#define STANDARD
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
}`,av=`#define STANDARD
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
}`,ov=`#define TOON
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
}`,lv=`#define TOON
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
}`,cv=`uniform float size;
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
}`,dv=`uniform vec3 diffuse;
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
}`,uv=`#include <common>
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
}`,hv=`uniform vec3 color;
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
}`,pv=`uniform float rotation;
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
}`,mv=`uniform vec3 diffuse;
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
}`,$e={alphahash_fragment:Nf,alphahash_pars_fragment:Of,alphamap_fragment:Ff,alphamap_pars_fragment:Bf,alphatest_fragment:Hf,alphatest_pars_fragment:zf,aomap_fragment:Vf,aomap_pars_fragment:Gf,batching_pars_vertex:$f,batching_vertex:Wf,begin_vertex:jf,beginnormal_vertex:qf,bsdfs:Xf,iridescence_fragment:Yf,bumpmap_pars_fragment:Kf,clipping_planes_fragment:Zf,clipping_planes_pars_fragment:Jf,clipping_planes_pars_vertex:Qf,clipping_planes_vertex:eg,color_fragment:tg,color_pars_fragment:ig,color_pars_vertex:rg,color_vertex:ng,common:sg,cube_uv_reflection_fragment:ag,defaultnormal_vertex:og,displacementmap_pars_vertex:lg,displacementmap_vertex:cg,emissivemap_fragment:dg,emissivemap_pars_fragment:ug,colorspace_fragment:hg,colorspace_pars_fragment:pg,envmap_fragment:mg,envmap_common_pars_fragment:fg,envmap_pars_fragment:gg,envmap_pars_vertex:vg,envmap_physical_pars_fragment:Rg,envmap_vertex:xg,fog_vertex:_g,fog_pars_vertex:yg,fog_fragment:bg,fog_pars_fragment:Sg,gradientmap_pars_fragment:wg,lightmap_pars_fragment:Mg,lights_lambert_fragment:Tg,lights_lambert_pars_fragment:Eg,lights_pars_begin:Ag,lights_toon_fragment:Cg,lights_toon_pars_fragment:Lg,lights_phong_fragment:Pg,lights_phong_pars_fragment:Ig,lights_physical_fragment:kg,lights_physical_pars_fragment:Dg,lights_fragment_begin:Ug,lights_fragment_maps:Ng,lights_fragment_end:Og,logdepthbuf_fragment:Fg,logdepthbuf_pars_fragment:Bg,logdepthbuf_pars_vertex:Hg,logdepthbuf_vertex:zg,map_fragment:Vg,map_pars_fragment:Gg,map_particle_fragment:$g,map_particle_pars_fragment:Wg,metalnessmap_fragment:jg,metalnessmap_pars_fragment:qg,morphinstance_vertex:Xg,morphcolor_vertex:Yg,morphnormal_vertex:Kg,morphtarget_pars_vertex:Zg,morphtarget_vertex:Jg,normal_fragment_begin:Qg,normal_fragment_maps:e0,normal_pars_fragment:t0,normal_pars_vertex:i0,normal_vertex:r0,normalmap_pars_fragment:n0,clearcoat_normal_fragment_begin:s0,clearcoat_normal_fragment_maps:a0,clearcoat_pars_fragment:o0,iridescence_pars_fragment:l0,opaque_fragment:c0,packing:d0,premultiplied_alpha_fragment:u0,project_vertex:h0,dithering_fragment:p0,dithering_pars_fragment:m0,roughnessmap_fragment:f0,roughnessmap_pars_fragment:g0,shadowmap_pars_fragment:v0,shadowmap_pars_vertex:x0,shadowmap_vertex:_0,shadowmask_pars_fragment:y0,skinbase_vertex:b0,skinning_pars_vertex:S0,skinning_vertex:w0,skinnormal_vertex:M0,specularmap_fragment:T0,specularmap_pars_fragment:E0,tonemapping_fragment:A0,tonemapping_pars_fragment:R0,transmission_fragment:C0,transmission_pars_fragment:L0,uv_pars_fragment:P0,uv_pars_vertex:I0,uv_vertex:k0,worldpos_vertex:D0,background_vert:U0,background_frag:N0,backgroundCube_vert:O0,backgroundCube_frag:F0,cube_vert:B0,cube_frag:H0,depth_vert:z0,depth_frag:V0,distanceRGBA_vert:G0,distanceRGBA_frag:$0,equirect_vert:W0,equirect_frag:j0,linedashed_vert:q0,linedashed_frag:X0,meshbasic_vert:Y0,meshbasic_frag:K0,meshlambert_vert:Z0,meshlambert_frag:J0,meshmatcap_vert:Q0,meshmatcap_frag:ev,meshnormal_vert:tv,meshnormal_frag:iv,meshphong_vert:rv,meshphong_frag:nv,meshphysical_vert:sv,meshphysical_frag:av,meshtoon_vert:ov,meshtoon_frag:lv,points_vert:cv,points_frag:dv,shadow_vert:uv,shadow_frag:hv,sprite_vert:pv,sprite_frag:mv},pe={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ge},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ge}},envmap:{envMap:{value:null},envMapRotation:{value:new Ge},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ge}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ge}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ge},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ge},normalScale:{value:new it(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ge},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ge}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ge}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ge}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0},uvTransform:{value:new Ge}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new it(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ge},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0}}},Ri={basic:{uniforms:ii([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.fog]),vertexShader:$e.meshbasic_vert,fragmentShader:$e.meshbasic_frag},lambert:{uniforms:ii([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new ze(0)}}]),vertexShader:$e.meshlambert_vert,fragmentShader:$e.meshlambert_frag},phong:{uniforms:ii([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30}}]),vertexShader:$e.meshphong_vert,fragmentShader:$e.meshphong_frag},standard:{uniforms:ii([pe.common,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.roughnessmap,pe.metalnessmap,pe.fog,pe.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag},toon:{uniforms:ii([pe.common,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.gradientmap,pe.fog,pe.lights,{emissive:{value:new ze(0)}}]),vertexShader:$e.meshtoon_vert,fragmentShader:$e.meshtoon_frag},matcap:{uniforms:ii([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,{matcap:{value:null}}]),vertexShader:$e.meshmatcap_vert,fragmentShader:$e.meshmatcap_frag},points:{uniforms:ii([pe.points,pe.fog]),vertexShader:$e.points_vert,fragmentShader:$e.points_frag},dashed:{uniforms:ii([pe.common,pe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$e.linedashed_vert,fragmentShader:$e.linedashed_frag},depth:{uniforms:ii([pe.common,pe.displacementmap]),vertexShader:$e.depth_vert,fragmentShader:$e.depth_frag},normal:{uniforms:ii([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,{opacity:{value:1}}]),vertexShader:$e.meshnormal_vert,fragmentShader:$e.meshnormal_frag},sprite:{uniforms:ii([pe.sprite,pe.fog]),vertexShader:$e.sprite_vert,fragmentShader:$e.sprite_frag},background:{uniforms:{uvTransform:{value:new Ge},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$e.background_vert,fragmentShader:$e.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ge}},vertexShader:$e.backgroundCube_vert,fragmentShader:$e.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$e.cube_vert,fragmentShader:$e.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$e.equirect_vert,fragmentShader:$e.equirect_frag},distanceRGBA:{uniforms:ii([pe.common,pe.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$e.distanceRGBA_vert,fragmentShader:$e.distanceRGBA_frag},shadow:{uniforms:ii([pe.lights,pe.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:$e.shadow_vert,fragmentShader:$e.shadow_frag}};Ri.physical={uniforms:ii([Ri.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ge},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ge},clearcoatNormalScale:{value:new it(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ge},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ge},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ge},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ge},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ge},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ge},transmissionSamplerSize:{value:new it},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ge},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ge},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ge},anisotropyVector:{value:new it},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ge}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag};var La={r:0,b:0,g:0},Zr=new Ni,fv=new We;function gv(n,e,t,i,r,s,a){let o=new ze(0),l=s===!0?0:1,c,d,u=null,h=0,p=null;function g(T){let M=T.isScene===!0?T.background:null;return M&&M.isTexture&&(M=(T.backgroundBlurriness>0?t:e).get(M)),M}function v(T){let M=!1,S=g(T);S===null?m(o,l):S&&S.isColor&&(m(S,1),M=!0);let k=n.xr.getEnvironmentBlendMode();k==="additive"?i.buffers.color.setClear(0,0,0,1,a):k==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(n.autoClear||M)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function f(T,M){let S=g(M);S&&(S.isCubeTexture||S.mapping===ta)?(d===void 0&&(d=new pt(new pn(1,1,1),new Fi({name:"BackgroundCubeMaterial",uniforms:$n(Ri.backgroundCube.uniforms),vertexShader:Ri.backgroundCube.vertexShader,fragmentShader:Ri.backgroundCube.fragmentShader,side:Zt,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(k,R,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(d)),Zr.copy(M.backgroundRotation),Zr.x*=-1,Zr.y*=-1,Zr.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(Zr.y*=-1,Zr.z*=-1),d.material.uniforms.envMap.value=S,d.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(fv.makeRotationFromEuler(Zr)),d.material.toneMapped=tt.getTransfer(S.colorSpace)!==ut,(u!==S||h!==S.version||p!==n.toneMapping)&&(d.material.needsUpdate=!0,u=S,h=S.version,p=n.toneMapping),d.layers.enableAll(),T.unshift(d,d.geometry,d.material,0,0,null)):S&&S.isTexture&&(c===void 0&&(c=new pt(new Vs(2,2),new Fi({name:"BackgroundMaterial",uniforms:$n(Ri.background.uniforms),vertexShader:Ri.background.vertexShader,fragmentShader:Ri.background.fragmentShader,side:qi,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=tt.getTransfer(S.colorSpace)!==ut,S.matrixAutoUpdate===!0&&S.updateMatrix(),c.material.uniforms.uvTransform.value.copy(S.matrix),(u!==S||h!==S.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,u=S,h=S.version,p=n.toneMapping),c.layers.enableAll(),T.unshift(c,c.geometry,c.material,0,0,null))}function m(T,M){T.getRGB(La,Hp(n)),i.buffers.color.setClear(La.r,La.g,La.b,M,a)}return{getClearColor:function(){return o},setClearColor:function(T,M=1){o.set(T),l=M,m(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(T){l=T,m(o,l)},render:v,addToRenderList:f}}function vv(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=h(null),s=r,a=!1;function o(x,C,z,W,N){let P=!1,L=u(W,z,C);s!==L&&(s=L,c(s.object)),P=p(x,W,z,N),P&&g(x,W,z,N),N!==null&&e.update(N,n.ELEMENT_ARRAY_BUFFER),(P||a)&&(a=!1,S(x,C,z,W),N!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function l(){return n.createVertexArray()}function c(x){return n.bindVertexArray(x)}function d(x){return n.deleteVertexArray(x)}function u(x,C,z){let W=z.wireframe===!0,N=i[x.id];N===void 0&&(N={},i[x.id]=N);let P=N[C.id];P===void 0&&(P={},N[C.id]=P);let L=P[W];return L===void 0&&(L=h(l()),P[W]=L),L}function h(x){let C=[],z=[],W=[];for(let N=0;N<t;N++)C[N]=0,z[N]=0,W[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:C,enabledAttributes:z,attributeDivisors:W,object:x,attributes:{},index:null}}function p(x,C,z,W){let N=s.attributes,P=C.attributes,L=0,I=z.getAttributes();for(let O in I)if(I[O].location>=0){let J=N[O],Z=P[O];if(Z===void 0&&(O==="instanceMatrix"&&x.instanceMatrix&&(Z=x.instanceMatrix),O==="instanceColor"&&x.instanceColor&&(Z=x.instanceColor)),J===void 0||J.attribute!==Z||Z&&J.data!==Z.data)return!0;L++}return s.attributesNum!==L||s.index!==W}function g(x,C,z,W){let N={},P=C.attributes,L=0,I=z.getAttributes();for(let O in I)if(I[O].location>=0){let J=P[O];J===void 0&&(O==="instanceMatrix"&&x.instanceMatrix&&(J=x.instanceMatrix),O==="instanceColor"&&x.instanceColor&&(J=x.instanceColor));let Z={};Z.attribute=J,J&&J.data&&(Z.data=J.data),N[O]=Z,L++}s.attributes=N,s.attributesNum=L,s.index=W}function v(){let x=s.newAttributes;for(let C=0,z=x.length;C<z;C++)x[C]=0}function f(x){m(x,0)}function m(x,C){let z=s.newAttributes,W=s.enabledAttributes,N=s.attributeDivisors;z[x]=1,W[x]===0&&(n.enableVertexAttribArray(x),W[x]=1),N[x]!==C&&(n.vertexAttribDivisor(x,C),N[x]=C)}function T(){let x=s.newAttributes,C=s.enabledAttributes;for(let z=0,W=C.length;z<W;z++)C[z]!==x[z]&&(n.disableVertexAttribArray(z),C[z]=0)}function M(x,C,z,W,N,P,L){L===!0?n.vertexAttribIPointer(x,C,z,N,P):n.vertexAttribPointer(x,C,z,W,N,P)}function S(x,C,z,W){v();let N=W.attributes,P=z.getAttributes(),L=C.defaultAttributeValues;for(let I in P){let O=P[I];if(O.location>=0){let J=N[I];if(J===void 0&&(I==="instanceMatrix"&&x.instanceMatrix&&(J=x.instanceMatrix),I==="instanceColor"&&x.instanceColor&&(J=x.instanceColor)),J!==void 0){let Z=J.normalized,re=J.itemSize,ae=e.get(J);if(ae===void 0)continue;let K=ae.buffer,D=ae.type,X=ae.bytesPerElement,le=D===n.INT||D===n.UNSIGNED_INT||J.gpuType===pl;if(J.isInterleavedBufferAttribute){let oe=J.data,ke=oe.stride,xe=J.offset;if(oe.isInstancedInterleavedBuffer){for(let Re=0;Re<O.locationSize;Re++)m(O.location+Re,oe.meshPerAttribute);x.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=oe.meshPerAttribute*oe.count)}else for(let Re=0;Re<O.locationSize;Re++)f(O.location+Re);n.bindBuffer(n.ARRAY_BUFFER,K);for(let Re=0;Re<O.locationSize;Re++)M(O.location+Re,re/O.locationSize,D,Z,ke*X,(xe+re/O.locationSize*Re)*X,le)}else{if(J.isInstancedBufferAttribute){for(let oe=0;oe<O.locationSize;oe++)m(O.location+oe,J.meshPerAttribute);x.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let oe=0;oe<O.locationSize;oe++)f(O.location+oe);n.bindBuffer(n.ARRAY_BUFFER,K);for(let oe=0;oe<O.locationSize;oe++)M(O.location+oe,re/O.locationSize,D,Z,re*X,re/O.locationSize*oe*X,le)}}else if(L!==void 0){let Z=L[I];if(Z!==void 0)switch(Z.length){case 2:n.vertexAttrib2fv(O.location,Z);break;case 3:n.vertexAttrib3fv(O.location,Z);break;case 4:n.vertexAttrib4fv(O.location,Z);break;default:n.vertexAttrib1fv(O.location,Z)}}}}T()}function k(){b();for(let x in i){let C=i[x];for(let z in C){let W=C[z];for(let N in W)d(W[N].object),delete W[N];delete C[z]}delete i[x]}}function R(x){if(i[x.id]===void 0)return;let C=i[x.id];for(let z in C){let W=C[z];for(let N in W)d(W[N].object),delete W[N];delete C[z]}delete i[x.id]}function E(x){for(let C in i){let z=i[C];if(z[x.id]===void 0)continue;let W=z[x.id];for(let N in W)d(W[N].object),delete W[N];delete z[x.id]}}function b(){_(),a=!0,s!==r&&(s=r,c(s.object))}function _(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:b,resetDefaultState:_,dispose:k,releaseStatesOfGeometry:R,releaseStatesOfProgram:E,initAttributes:v,enableAttribute:f,disableUnusedAttributes:T}}function xv(n,e,t){let i;function r(c){i=c}function s(c,d){n.drawArrays(i,c,d),t.update(d,i,1)}function a(c,d,u){u!==0&&(n.drawArraysInstanced(i,c,d,u),t.update(d,i,u))}function o(c,d,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,d,0,u);let h=0;for(let p=0;p<u;p++)h+=d[p];t.update(h,i,1)}function l(c,d,u,h){if(u===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<c.length;g++)a(c[g],d[g],h[g]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,d,0,h,0,u);let g=0;for(let v=0;v<u;v++)g+=d[v]*h[v];t.update(g,i,1)}}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function _v(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let E=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(E){return!(E!==di&&i.convert(E)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(E){let b=E===es&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(E!==Xi&&i.convert(E)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==yi&&!b)}function l(E){if(E==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",d=l(c);d!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);let u=t.logarithmicDepthBuffer===!0,h=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=n.getParameter(n.MAX_TEXTURE_SIZE),f=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),T=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),M=n.getParameter(n.MAX_VARYING_VECTORS),S=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),k=g>0,R=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:h,maxTextures:p,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:f,maxAttributes:m,maxVertexUniforms:T,maxVaryings:M,maxFragmentUniforms:S,vertexTextures:k,maxSamples:R}}function yv(n){let e=this,t=null,i=0,r=!1,s=!1,a=new Gi,o=new Ge,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,h){let p=u.length!==0||h||i!==0||r;return r=h,i=u.length,p},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,h){t=d(u,h,0)},this.setState=function(u,h,p){let g=u.clippingPlanes,v=u.clipIntersection,f=u.clipShadows,m=n.get(u);if(!r||g===null||g.length===0||s&&!f)s?d(null):c();else{let T=s?0:i,M=T*4,S=m.clippingState||null;l.value=S,S=d(g,h,M,p);for(let k=0;k!==M;++k)S[k]=t[k];m.clippingState=S,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=T}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(u,h,p,g){let v=u!==null?u.length:0,f=null;if(v!==0){if(f=l.value,g!==!0||f===null){let m=p+v*4,T=h.matrixWorldInverse;o.getNormalMatrix(T),(f===null||f.length<m)&&(f=new Float32Array(m));for(let M=0,S=p;M!==v;++M,S+=4)a.copy(u[M]).applyMatrix4(T,o),a.normal.toArray(f,S),f[S+3]=a.constant}l.value=f,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,f}}function bv(n){let e=new WeakMap;function t(a,o){return o===Qa?a.mapping=on:o===eo&&(a.mapping=ln),a}function i(a){if(a&&a.isTexture){let o=a.mapping;if(o===Qa||o===eo)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new Do(l.height);return c.fromEquirectangularTexture(n,a),e.set(a,c),a.addEventListener("dispose",r),t(c.texture,a.mapping)}else return null}}return a}function r(a){let o=a.target;o.removeEventListener("dispose",r);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function s(){e=new WeakMap}return{get:i,dispose:s}}var jn=class extends Hs{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=d*this.view.offsetY,l=o-d*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Nn=4,zu=[.125,.215,.35,.446,.526,.582],rn=20,Ql=new jn,Vu=new ze,ec=null,tc=0,ic=0,rc=!1,tn=(1+Math.sqrt(5))/2,Ln=1/tn,Gu=[new G(-tn,Ln,0),new G(tn,Ln,0),new G(-Ln,0,tn),new G(Ln,0,tn),new G(0,tn,-Ln),new G(0,tn,Ln),new G(-1,1,-1),new G(1,1,-1),new G(-1,1,1),new G(1,1,1)],qn=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,r=100){ec=this._renderer.getRenderTarget(),tc=this._renderer.getActiveCubeFace(),ic=this._renderer.getActiveMipmapLevel(),rc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,i,r,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ju(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Wu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(ec,tc,ic),this._renderer.xr.enabled=rc,e.scissorTest=!1,Pa(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===on||e.mapping===ln?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ec=this._renderer.getRenderTarget(),tc=this._renderer.getActiveCubeFace(),ic=this._renderer.getActiveMipmapLevel(),rc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:si,minFilter:si,generateMipmaps:!1,type:es,format:di,colorSpace:Qt,depthBuffer:!1},r=$u(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=$u(e,t,i);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Sv(s)),this._blurMaterial=wv(s,e,t)}return r}_compileMaterial(e){let t=new pt(this._lodPlanes[0],e);this._renderer.compile(t,Ql)}_sceneToCubeUV(e,t,i,r){let s=new Vt(90,1,t,i),a=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],l=this._renderer,c=l.autoClear,d=l.toneMapping;l.getClearColor(Vu),l.toneMapping=mr,l.autoClear=!1;let u=new Pi({name:"PMREM.Background",side:Zt,depthWrite:!1,depthTest:!1}),h=new pt(new pn,u),p=!1,g=e.background;g?g.isColor&&(u.color.copy(g),e.background=null,p=!0):(u.color.copy(Vu),p=!0);for(let v=0;v<6;v++){let f=v%3;f===0?(s.up.set(0,a[v],0),s.lookAt(o[v],0,0)):f===1?(s.up.set(0,0,a[v]),s.lookAt(0,o[v],0)):(s.up.set(0,a[v],0),s.lookAt(0,0,o[v]));let m=this._cubeSize;Pa(r,f*m,v>2?m:0,m,m),l.setRenderTarget(r),p&&l.render(h,s),l.render(e,s)}h.geometry.dispose(),h.material.dispose(),l.toneMapping=d,l.autoClear=c,e.background=g}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===on||e.mapping===ln;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=ju()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Wu());let s=r?this._cubemapMaterial:this._equirectMaterial,a=new pt(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;let l=this._cubeSize;Pa(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,Ql)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodPlanes.length;for(let s=1;s<r;s++){let a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Gu[(r-s-1)%Gu.length];this._blur(e,s-1,s,a,o)}t.autoClear=i}_blur(e,t,i,r,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let d=3,u=new pt(this._lodPlanes[r],c),h=c.uniforms,p=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*rn-1),v=s/g,f=isFinite(s)?1+Math.floor(d*v):rn;f>rn&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${rn}`);let m=[],T=0;for(let E=0;E<rn;++E){let b=E/v,_=Math.exp(-b*b/2);m.push(_),E===0?T+=_:E<f&&(T+=2*_)}for(let E=0;E<m.length;E++)m[E]=m[E]/T;h.envMap.value=e.texture,h.samples.value=f,h.weights.value=m,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);let{_lodMax:M}=this;h.dTheta.value=g,h.mipInt.value=M-i;let S=this._sizeLods[r],k=3*S*(r>M-Nn?r-M+Nn:0),R=4*(this._cubeSize-S);Pa(t,k,R,3*S,2*S),l.setRenderTarget(t),l.render(u,Ql)}};function Sv(n){let e=[],t=[],i=[],r=n,s=n-Nn+1+zu.length;for(let a=0;a<s;a++){let o=Math.pow(2,r);t.push(o);let l=1/o;a>n-Nn?l=zu[a-n+Nn-1]:a===0&&(l=0),i.push(l);let c=1/(o-2),d=-c,u=1+c,h=[d,d,u,d,u,u,d,d,u,u,d,u],p=6,g=6,v=3,f=2,m=1,T=new Float32Array(v*g*p),M=new Float32Array(f*g*p),S=new Float32Array(m*g*p);for(let R=0;R<p;R++){let E=R%3*2/3-1,b=R>2?0:-1,_=[E,b,0,E+2/3,b,0,E+2/3,b+1,0,E,b,0,E+2/3,b+1,0,E,b+1,0];T.set(_,v*g*R),M.set(h,f*g*R);let x=[R,R,R,R,R,R];S.set(x,m*g*R)}let k=new Oi;k.setAttribute("position",new Gt(T,v)),k.setAttribute("uv",new Gt(M,f)),k.setAttribute("faceIndex",new Gt(S,m)),e.push(k),r>Nn&&r--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function $u(n,e,t){let i=new Yi(n,e,t);return i.texture.mapping=ta,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Pa(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function wv(n,e,t){let i=new Float32Array(rn),r=new G(0,1,0);return new Fi({name:"SphericalGaussianBlur",defines:{n:rn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Zd(),fragmentShader:`

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
		`,blending:pr,depthTest:!1,depthWrite:!1})}function Wu(){return new Fi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Zd(),fragmentShader:`

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
		`,blending:pr,depthTest:!1,depthWrite:!1})}function ju(){return new Fi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Zd(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:pr,depthTest:!1,depthWrite:!1})}function Zd(){return`

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
	`}function Mv(n){let e=new WeakMap,t=null;function i(o){if(o&&o.isTexture){let l=o.mapping,c=l===Qa||l===eo,d=l===on||l===ln;if(c||d){let u=e.get(o),h=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==h)return t===null&&(t=new qn(n)),u=c?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let p=o.image;return c&&p&&p.height>0||d&&p&&r(p)?(t===null&&(t=new qn(n)),u=c?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",s),u.texture):null}}}return o}function r(o){let l=0,c=6;for(let d=0;d<c;d++)o[d]!==void 0&&l++;return l===c}function s(o){let l=o.target;l.removeEventListener("dispose",s);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:a}}function Tv(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&_s("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function Ev(n,e,t,i){let r={},s=new WeakMap;function a(u){let h=u.target;h.index!==null&&e.remove(h.index);for(let g in h.attributes)e.remove(h.attributes[g]);for(let g in h.morphAttributes){let v=h.morphAttributes[g];for(let f=0,m=v.length;f<m;f++)e.remove(v[f])}h.removeEventListener("dispose",a),delete r[h.id];let p=s.get(h);p&&(e.remove(p),s.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function o(u,h){return r[h.id]===!0||(h.addEventListener("dispose",a),r[h.id]=!0,t.memory.geometries++),h}function l(u){let h=u.attributes;for(let g in h)e.update(h[g],n.ARRAY_BUFFER);let p=u.morphAttributes;for(let g in p){let v=p[g];for(let f=0,m=v.length;f<m;f++)e.update(v[f],n.ARRAY_BUFFER)}}function c(u){let h=[],p=u.index,g=u.attributes.position,v=0;if(p!==null){let T=p.array;v=p.version;for(let M=0,S=T.length;M<S;M+=3){let k=T[M+0],R=T[M+1],E=T[M+2];h.push(k,R,R,E,E,k)}}else if(g!==void 0){let T=g.array;v=g.version;for(let M=0,S=T.length/3-1;M<S;M+=3){let k=M+0,R=M+1,E=M+2;h.push(k,R,R,E,E,k)}}else return;let f=new(Op(h)?Bs:Fs)(h,1);f.version=v;let m=s.get(u);m&&e.remove(m),s.set(u,f)}function d(u){let h=s.get(u);if(h){let p=u.index;p!==null&&h.version<p.version&&c(u)}else c(u);return s.get(u)}return{get:o,update:l,getWireframeAttribute:d}}function Av(n,e,t){let i;function r(h){i=h}let s,a;function o(h){s=h.type,a=h.bytesPerElement}function l(h,p){n.drawElements(i,p,s,h*a),t.update(p,i,1)}function c(h,p,g){g!==0&&(n.drawElementsInstanced(i,p,s,h*a,g),t.update(p,i,g))}function d(h,p,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,s,h,0,g);let v=0;for(let f=0;f<g;f++)v+=p[f];t.update(v,i,1)}function u(h,p,g,v){if(g===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<h.length;m++)c(h[m]/a,p[m],v[m]);else{f.multiDrawElementsInstancedWEBGL(i,p,0,s,h,0,v,0,g);let m=0;for(let T=0;T<g;T++)m+=p[T]*v[T];t.update(m,i,1)}}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=d,this.renderMultiDrawInstances=u}function Rv(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Cv(n,e,t){let i=new WeakMap,r=new ot;function s(a,o,l){let c=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=d!==void 0?d.length:0,h=i.get(o);if(h===void 0||h.count!==u){let g=function(){_.dispose(),i.delete(o),o.removeEventListener("dispose",g)};var p=g;h!==void 0&&h.texture.dispose();let v=o.morphAttributes.position!==void 0,f=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,T=o.morphAttributes.position||[],M=o.morphAttributes.normal||[],S=o.morphAttributes.color||[],k=0;v===!0&&(k=1),f===!0&&(k=2),m===!0&&(k=3);let R=o.attributes.position.count*k,E=1;R>e.maxTextureSize&&(E=Math.ceil(R/e.maxTextureSize),R=e.maxTextureSize);let b=new Float32Array(R*E*4*u),_=new Ns(b,R,E,u);_.type=yi,_.needsUpdate=!0;let x=k*4;for(let C=0;C<u;C++){let z=T[C],W=M[C],N=S[C],P=R*E*4*C;for(let L=0;L<z.count;L++){let I=L*x;v===!0&&(r.fromBufferAttribute(z,L),b[P+I+0]=r.x,b[P+I+1]=r.y,b[P+I+2]=r.z,b[P+I+3]=0),f===!0&&(r.fromBufferAttribute(W,L),b[P+I+4]=r.x,b[P+I+5]=r.y,b[P+I+6]=r.z,b[P+I+7]=0),m===!0&&(r.fromBufferAttribute(N,L),b[P+I+8]=r.x,b[P+I+9]=r.y,b[P+I+10]=r.z,b[P+I+11]=N.itemSize===4?r.w:1)}}h={count:u,texture:_,size:new it(R,E)},i.set(o,h),o.addEventListener("dispose",g)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let g=0;for(let f=0;f<c.length;f++)g+=c[f];let v=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(n,"morphTargetBaseInfluence",v),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:s}}function Lv(n,e,t,i){let r=new WeakMap;function s(l){let c=i.render.frame,d=l.geometry,u=e.get(l,d);if(r.get(u)!==c&&(e.update(u),r.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){let h=l.skeleton;r.get(h)!==c&&(h.update(),r.set(h,c))}return u}function a(){r=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:a}}var Gs=class extends qt{constructor(e,t,i,r,s,a,o,l,c,d=sn){if(d!==sn&&d!==un)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&d===sn&&(i=zr),i===void 0&&d===un&&(i=dn),super(null,r,s,a,o,l,d,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Jt,this.minFilter=l!==void 0?l:Jt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Gp=new qt,qu=new Gs(1,1),$p=new Ns,Wp=new Io,jp=new zs,Xu=[],Yu=[],Ku=new Float32Array(16),Zu=new Float32Array(9),Ju=new Float32Array(4);function ts(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,s=Xu[r];if(s===void 0&&(s=new Float32Array(r),Xu[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function Nt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Ot(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function yl(n,e){let t=Yu[e];t===void 0&&(t=new Int32Array(e),Yu[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Pv(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Iv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Nt(t,e))return;n.uniform2fv(this.addr,e),Ot(t,e)}}function kv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Nt(t,e))return;n.uniform3fv(this.addr,e),Ot(t,e)}}function Dv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Nt(t,e))return;n.uniform4fv(this.addr,e),Ot(t,e)}}function Uv(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Nt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Ot(t,e)}else{if(Nt(t,i))return;Ju.set(i),n.uniformMatrix2fv(this.addr,!1,Ju),Ot(t,i)}}function Nv(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Nt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Ot(t,e)}else{if(Nt(t,i))return;Zu.set(i),n.uniformMatrix3fv(this.addr,!1,Zu),Ot(t,i)}}function Ov(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Nt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Ot(t,e)}else{if(Nt(t,i))return;Ku.set(i),n.uniformMatrix4fv(this.addr,!1,Ku),Ot(t,i)}}function Fv(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Bv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Nt(t,e))return;n.uniform2iv(this.addr,e),Ot(t,e)}}function Hv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Nt(t,e))return;n.uniform3iv(this.addr,e),Ot(t,e)}}function zv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Nt(t,e))return;n.uniform4iv(this.addr,e),Ot(t,e)}}function Vv(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Gv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Nt(t,e))return;n.uniform2uiv(this.addr,e),Ot(t,e)}}function $v(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Nt(t,e))return;n.uniform3uiv(this.addr,e),Ot(t,e)}}function Wv(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Nt(t,e))return;n.uniform4uiv(this.addr,e),Ot(t,e)}}function jv(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(qu.compareFunction=Yd,s=qu):s=Gp,t.setTexture2D(e||s,r)}function qv(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Wp,r)}function Xv(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||jp,r)}function Yv(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||$p,r)}function Kv(n){switch(n){case 5126:return Pv;case 35664:return Iv;case 35665:return kv;case 35666:return Dv;case 35674:return Uv;case 35675:return Nv;case 35676:return Ov;case 5124:case 35670:return Fv;case 35667:case 35671:return Bv;case 35668:case 35672:return Hv;case 35669:case 35673:return zv;case 5125:return Vv;case 36294:return Gv;case 36295:return $v;case 36296:return Wv;case 35678:case 36198:case 36298:case 36306:case 35682:return jv;case 35679:case 36299:case 36307:return qv;case 35680:case 36300:case 36308:case 36293:return Xv;case 36289:case 36303:case 36311:case 36292:return Yv}}function Zv(n,e){n.uniform1fv(this.addr,e)}function Jv(n,e){let t=ts(e,this.size,2);n.uniform2fv(this.addr,t)}function Qv(n,e){let t=ts(e,this.size,3);n.uniform3fv(this.addr,t)}function ex(n,e){let t=ts(e,this.size,4);n.uniform4fv(this.addr,t)}function tx(n,e){let t=ts(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function ix(n,e){let t=ts(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function rx(n,e){let t=ts(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function nx(n,e){n.uniform1iv(this.addr,e)}function sx(n,e){n.uniform2iv(this.addr,e)}function ax(n,e){n.uniform3iv(this.addr,e)}function ox(n,e){n.uniform4iv(this.addr,e)}function lx(n,e){n.uniform1uiv(this.addr,e)}function cx(n,e){n.uniform2uiv(this.addr,e)}function dx(n,e){n.uniform3uiv(this.addr,e)}function ux(n,e){n.uniform4uiv(this.addr,e)}function hx(n,e,t){let i=this.cache,r=e.length,s=yl(t,r);Nt(i,s)||(n.uniform1iv(this.addr,s),Ot(i,s));for(let a=0;a!==r;++a)t.setTexture2D(e[a]||Gp,s[a])}function px(n,e,t){let i=this.cache,r=e.length,s=yl(t,r);Nt(i,s)||(n.uniform1iv(this.addr,s),Ot(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Wp,s[a])}function mx(n,e,t){let i=this.cache,r=e.length,s=yl(t,r);Nt(i,s)||(n.uniform1iv(this.addr,s),Ot(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||jp,s[a])}function fx(n,e,t){let i=this.cache,r=e.length,s=yl(t,r);Nt(i,s)||(n.uniform1iv(this.addr,s),Ot(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||$p,s[a])}function gx(n){switch(n){case 5126:return Zv;case 35664:return Jv;case 35665:return Qv;case 35666:return ex;case 35674:return tx;case 35675:return ix;case 35676:return rx;case 5124:case 35670:return nx;case 35667:case 35671:return sx;case 35668:case 35672:return ax;case 35669:case 35673:return ox;case 5125:return lx;case 36294:return cx;case 36295:return dx;case 36296:return ux;case 35678:case 36198:case 36298:case 36306:case 35682:return hx;case 35679:case 36299:case 36307:return px;case 35680:case 36300:case 36308:case 36293:return mx;case 36289:case 36303:case 36311:case 36292:return fx}}var Dc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Kv(t.type)}},Uc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=gx(t.type)}},Nc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let s=0,a=r.length;s!==a;++s){let o=r[s];o.setValue(e,t[o.id],i)}}},nc=/(\w+)(\])?(\[|\.)?/g;function Qu(n,e){n.seq.push(e),n.map[e.id]=e}function vx(n,e,t){let i=n.name,r=i.length;for(nc.lastIndex=0;;){let s=nc.exec(i),a=nc.lastIndex,o=s[1],l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){Qu(t,c===void 0?new Dc(o,n,e):new Uc(o,n,e));break}else{let d=t.map[o];d===void 0&&(d=new Nc(o),Qu(t,d)),t=d}}}var Fn=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){let s=e.getActiveUniform(t,r),a=e.getUniformLocation(t,s.name);vx(s,a,this)}}setValue(e,t,i,r){let s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){let o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,s=e.length;r!==s;++r){let a=e[r];a.id in t&&i.push(a)}return i}};function eh(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var xx=37297,_x=0;function yx(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){let o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}var th=new Ge;function bx(n){tt._getMatrix(th,tt.workingColorSpace,n);let e=`mat3( ${th.elements.map(t=>t.toFixed(4))} )`;switch(tt.getTransfer(n)){case ia:return[e,"LinearTransferOETF"];case ut:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function ih(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),r=n.getShaderInfoLog(e).trim();if(i&&r==="")return"";let s=/ERROR: 0:(\d+)/.exec(r);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+yx(n.getShaderSource(e),a)}else return r}function Sx(n,e){let t=bx(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function wx(n,e){let t;switch(e){case vp:t="Linear";break;case xp:t="Reinhard";break;case _p:t="Cineon";break;case Ud:t="ACESFilmic";break;case bp:t="AgX";break;case Sp:t="Neutral";break;case yp:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Ia=new G;function Mx(){tt.getLuminanceCoefficients(Ia);let n=Ia.x.toFixed(4),e=Ia.y.toFixed(4),t=Ia.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Tx(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ys).join(`
`)}function Ex(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Ax(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=n.getActiveAttrib(e,r),a=s.name,o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function ys(n){return n!==""}function rh(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function nh(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Rx=/^[ \t]*#include +<([\w\d./]+)>/gm;function Oc(n){return n.replace(Rx,Lx)}var Cx=new Map;function Lx(n,e){let t=$e[e];if(t===void 0){let i=Cx.get(e);if(i!==void 0)t=$e[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Oc(t)}var Px=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function sh(n){return n.replace(Px,Ix)}function Ix(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function ah(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function kx(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===kd?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Kh?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Vi&&(e="SHADOWMAP_TYPE_VSM"),e}function Dx(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case on:case ln:e="ENVMAP_TYPE_CUBE";break;case ta:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Ux(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case ln:e="ENVMAP_MODE_REFRACTION";break}return e}function Nx(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Dd:e="ENVMAP_BLENDING_MULTIPLY";break;case fp:e="ENVMAP_BLENDING_MIX";break;case gp:e="ENVMAP_BLENDING_ADD";break}return e}function Ox(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Fx(n,e,t,i){let r=n.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,l=kx(t),c=Dx(t),d=Ux(t),u=Nx(t),h=Ox(t),p=Tx(t),g=Ex(s),v=r.createProgram(),f,m,T=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ys).join(`
`),f.length>0&&(f+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ys).join(`
`),m.length>0&&(m+=`
`)):(f=[ah(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ys).join(`
`),m=[ah(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+u:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==mr?"#define TONE_MAPPING":"",t.toneMapping!==mr?$e.tonemapping_pars_fragment:"",t.toneMapping!==mr?wx("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",$e.colorspace_pars_fragment,Sx("linearToOutputTexel",t.outputColorSpace),Mx(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ys).join(`
`)),a=Oc(a),a=rh(a,t),a=nh(a,t),o=Oc(o),o=rh(o,t),o=nh(o,t),a=sh(a),o=sh(o),t.isRawShaderMaterial!==!0&&(T=`#version 300 es
`,f=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,m=["#define varying in",t.glslVersion===kc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===kc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let M=T+f+a,S=T+m+o,k=eh(r,r.VERTEX_SHADER,M),R=eh(r,r.FRAGMENT_SHADER,S);r.attachShader(v,k),r.attachShader(v,R),t.index0AttributeName!==void 0?r.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(v,0,"position"),r.linkProgram(v);function E(C){if(n.debug.checkShaderErrors){let z=r.getProgramInfoLog(v).trim(),W=r.getShaderInfoLog(k).trim(),N=r.getShaderInfoLog(R).trim(),P=!0,L=!0;if(r.getProgramParameter(v,r.LINK_STATUS)===!1)if(P=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,v,k,R);else{let I=ih(r,k,"vertex"),O=ih(r,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(v,r.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+z+`
`+I+`
`+O)}else z!==""?console.warn("THREE.WebGLProgram: Program Info Log:",z):(W===""||N==="")&&(L=!1);L&&(C.diagnostics={runnable:P,programLog:z,vertexShader:{log:W,prefix:f},fragmentShader:{log:N,prefix:m}})}r.deleteShader(k),r.deleteShader(R),b=new Fn(r,v),_=Ax(r,v)}let b;this.getUniforms=function(){return b===void 0&&E(this),b};let _;this.getAttributes=function(){return _===void 0&&E(this),_};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=r.getProgramParameter(v,xx)),x},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=_x++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=k,this.fragmentShader=R,this}var Bx=0,Fc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Bc(e),t.set(e,i)),i}},Bc=class{constructor(e){this.id=Bx++,this.code=e,this.usedTimes=0}};function Hx(n,e,t,i,r,s,a){let o=new Os,l=new Fc,c=new Set,d=[],u=r.logarithmicDepthBuffer,h=r.vertexTextures,p=r.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(_){return c.add(_),_===0?"uv":`uv${_}`}function f(_,x,C,z,W){let N=z.fog,P=W.geometry,L=_.isMeshStandardMaterial?z.environment:null,I=(_.isMeshStandardMaterial?t:e).get(_.envMap||L),O=I&&I.mapping===ta?I.image.height:null,J=g[_.type];_.precision!==null&&(p=r.getMaxPrecision(_.precision),p!==_.precision&&console.warn("THREE.WebGLProgram.getParameters:",_.precision,"not supported, using",p,"instead."));let Z=P.morphAttributes.position||P.morphAttributes.normal||P.morphAttributes.color,re=Z!==void 0?Z.length:0,ae=0;P.morphAttributes.position!==void 0&&(ae=1),P.morphAttributes.normal!==void 0&&(ae=2),P.morphAttributes.color!==void 0&&(ae=3);let K,D,X,le;if(J){let nt=Ri[J];K=nt.vertexShader,D=nt.fragmentShader}else K=_.vertexShader,D=_.fragmentShader,l.update(_),X=l.getVertexShaderID(_),le=l.getFragmentShaderID(_);let oe=n.getRenderTarget(),ke=n.state.buffers.depth.getReversed(),xe=W.isInstancedMesh===!0,Re=W.isBatchedMesh===!0,Qe=!!_.map,Ne=!!_.matcap,bt=!!I,V=!!_.aoMap,Pt=!!_.lightMap,Oe=!!_.bumpMap,je=!!_.normalMap,we=!!_.displacementMap,rt=!!_.emissiveMap,Pe=!!_.metalnessMap,A=!!_.roughnessMap,y=_.anisotropy>0,$=_.clearcoat>0,te=_.dispersion>0,se=_.iridescence>0,ie=_.sheen>0,Ae=_.transmission>0,he=y&&!!_.anisotropyMap,_e=$&&!!_.clearcoatMap,Ye=$&&!!_.clearcoatNormalMap,de=$&&!!_.clearcoatRoughnessMap,ye=se&&!!_.iridescenceMap,De=se&&!!_.iridescenceThicknessMap,Ue=ie&&!!_.sheenColorMap,Se=ie&&!!_.sheenRoughnessMap,Ke=!!_.specularMap,Ve=!!_.specularColorMap,et=!!_.specularIntensityMap,B=Ae&&!!_.transmissionMap,me=Ae&&!!_.thicknessMap,Y=!!_.gradientMap,ne=!!_.alphaMap,fe=_.alphaTest>0,ue=!!_.alphaHash,qe=!!_.extensions,vt=mr;_.toneMapped&&(oe===null||oe.isXRRenderTarget===!0)&&(vt=n.toneMapping);let wt={shaderID:J,shaderType:_.type,shaderName:_.name,vertexShader:K,fragmentShader:D,defines:_.defines,customVertexShaderID:X,customFragmentShaderID:le,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:p,batching:Re,batchingColor:Re&&W._colorsTexture!==null,instancing:xe,instancingColor:xe&&W.instanceColor!==null,instancingMorph:xe&&W.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:oe===null?n.outputColorSpace:oe.isXRRenderTarget===!0?oe.texture.colorSpace:Qt,alphaToCoverage:!!_.alphaToCoverage,map:Qe,matcap:Ne,envMap:bt,envMapMode:bt&&I.mapping,envMapCubeUVHeight:O,aoMap:V,lightMap:Pt,bumpMap:Oe,normalMap:je,displacementMap:h&&we,emissiveMap:rt,normalMapObjectSpace:je&&_.normalMapType===Rp,normalMapTangentSpace:je&&_.normalMapType===Xd,metalnessMap:Pe,roughnessMap:A,anisotropy:y,anisotropyMap:he,clearcoat:$,clearcoatMap:_e,clearcoatNormalMap:Ye,clearcoatRoughnessMap:de,dispersion:te,iridescence:se,iridescenceMap:ye,iridescenceThicknessMap:De,sheen:ie,sheenColorMap:Ue,sheenRoughnessMap:Se,specularMap:Ke,specularColorMap:Ve,specularIntensityMap:et,transmission:Ae,transmissionMap:B,thicknessMap:me,gradientMap:Y,opaque:_.transparent===!1&&_.blending===nn&&_.alphaToCoverage===!1,alphaMap:ne,alphaTest:fe,alphaHash:ue,combine:_.combine,mapUv:Qe&&v(_.map.channel),aoMapUv:V&&v(_.aoMap.channel),lightMapUv:Pt&&v(_.lightMap.channel),bumpMapUv:Oe&&v(_.bumpMap.channel),normalMapUv:je&&v(_.normalMap.channel),displacementMapUv:we&&v(_.displacementMap.channel),emissiveMapUv:rt&&v(_.emissiveMap.channel),metalnessMapUv:Pe&&v(_.metalnessMap.channel),roughnessMapUv:A&&v(_.roughnessMap.channel),anisotropyMapUv:he&&v(_.anisotropyMap.channel),clearcoatMapUv:_e&&v(_.clearcoatMap.channel),clearcoatNormalMapUv:Ye&&v(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:de&&v(_.clearcoatRoughnessMap.channel),iridescenceMapUv:ye&&v(_.iridescenceMap.channel),iridescenceThicknessMapUv:De&&v(_.iridescenceThicknessMap.channel),sheenColorMapUv:Ue&&v(_.sheenColorMap.channel),sheenRoughnessMapUv:Se&&v(_.sheenRoughnessMap.channel),specularMapUv:Ke&&v(_.specularMap.channel),specularColorMapUv:Ve&&v(_.specularColorMap.channel),specularIntensityMapUv:et&&v(_.specularIntensityMap.channel),transmissionMapUv:B&&v(_.transmissionMap.channel),thicknessMapUv:me&&v(_.thicknessMap.channel),alphaMapUv:ne&&v(_.alphaMap.channel),vertexTangents:!!P.attributes.tangent&&(je||y),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!P.attributes.color&&P.attributes.color.itemSize===4,pointsUvs:W.isPoints===!0&&!!P.attributes.uv&&(Qe||ne),fog:!!N,useFog:_.fog===!0,fogExp2:!!N&&N.isFogExp2,flatShading:_.flatShading===!0,sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:ke,skinning:W.isSkinnedMesh===!0,morphTargets:P.morphAttributes.position!==void 0,morphNormals:P.morphAttributes.normal!==void 0,morphColors:P.morphAttributes.color!==void 0,morphTargetsCount:re,morphTextureStride:ae,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&C.length>0,shadowMapType:n.shadowMap.type,toneMapping:vt,decodeVideoTexture:Qe&&_.map.isVideoTexture===!0&&tt.getTransfer(_.map.colorSpace)===ut,decodeVideoTextureEmissive:rt&&_.emissiveMap.isVideoTexture===!0&&tt.getTransfer(_.emissiveMap.colorSpace)===ut,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Ci,flipSided:_.side===Zt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:qe&&_.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(qe&&_.extensions.multiDraw===!0||Re)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return wt.vertexUv1s=c.has(1),wt.vertexUv2s=c.has(2),wt.vertexUv3s=c.has(3),c.clear(),wt}function m(_){let x=[];if(_.shaderID?x.push(_.shaderID):(x.push(_.customVertexShaderID),x.push(_.customFragmentShaderID)),_.defines!==void 0)for(let C in _.defines)x.push(C),x.push(_.defines[C]);return _.isRawShaderMaterial===!1&&(T(x,_),M(x,_),x.push(n.outputColorSpace)),x.push(_.customProgramCacheKey),x.join()}function T(_,x){_.push(x.precision),_.push(x.outputColorSpace),_.push(x.envMapMode),_.push(x.envMapCubeUVHeight),_.push(x.mapUv),_.push(x.alphaMapUv),_.push(x.lightMapUv),_.push(x.aoMapUv),_.push(x.bumpMapUv),_.push(x.normalMapUv),_.push(x.displacementMapUv),_.push(x.emissiveMapUv),_.push(x.metalnessMapUv),_.push(x.roughnessMapUv),_.push(x.anisotropyMapUv),_.push(x.clearcoatMapUv),_.push(x.clearcoatNormalMapUv),_.push(x.clearcoatRoughnessMapUv),_.push(x.iridescenceMapUv),_.push(x.iridescenceThicknessMapUv),_.push(x.sheenColorMapUv),_.push(x.sheenRoughnessMapUv),_.push(x.specularMapUv),_.push(x.specularColorMapUv),_.push(x.specularIntensityMapUv),_.push(x.transmissionMapUv),_.push(x.thicknessMapUv),_.push(x.combine),_.push(x.fogExp2),_.push(x.sizeAttenuation),_.push(x.morphTargetsCount),_.push(x.morphAttributeCount),_.push(x.numDirLights),_.push(x.numPointLights),_.push(x.numSpotLights),_.push(x.numSpotLightMaps),_.push(x.numHemiLights),_.push(x.numRectAreaLights),_.push(x.numDirLightShadows),_.push(x.numPointLightShadows),_.push(x.numSpotLightShadows),_.push(x.numSpotLightShadowsWithMaps),_.push(x.numLightProbes),_.push(x.shadowMapType),_.push(x.toneMapping),_.push(x.numClippingPlanes),_.push(x.numClipIntersection),_.push(x.depthPacking)}function M(_,x){o.disableAll(),x.supportsVertexTextures&&o.enable(0),x.instancing&&o.enable(1),x.instancingColor&&o.enable(2),x.instancingMorph&&o.enable(3),x.matcap&&o.enable(4),x.envMap&&o.enable(5),x.normalMapObjectSpace&&o.enable(6),x.normalMapTangentSpace&&o.enable(7),x.clearcoat&&o.enable(8),x.iridescence&&o.enable(9),x.alphaTest&&o.enable(10),x.vertexColors&&o.enable(11),x.vertexAlphas&&o.enable(12),x.vertexUv1s&&o.enable(13),x.vertexUv2s&&o.enable(14),x.vertexUv3s&&o.enable(15),x.vertexTangents&&o.enable(16),x.anisotropy&&o.enable(17),x.alphaHash&&o.enable(18),x.batching&&o.enable(19),x.dispersion&&o.enable(20),x.batchingColor&&o.enable(21),_.push(o.mask),o.disableAll(),x.fog&&o.enable(0),x.useFog&&o.enable(1),x.flatShading&&o.enable(2),x.logarithmicDepthBuffer&&o.enable(3),x.reverseDepthBuffer&&o.enable(4),x.skinning&&o.enable(5),x.morphTargets&&o.enable(6),x.morphNormals&&o.enable(7),x.morphColors&&o.enable(8),x.premultipliedAlpha&&o.enable(9),x.shadowMapEnabled&&o.enable(10),x.doubleSided&&o.enable(11),x.flipSided&&o.enable(12),x.useDepthPacking&&o.enable(13),x.dithering&&o.enable(14),x.transmission&&o.enable(15),x.sheen&&o.enable(16),x.opaque&&o.enable(17),x.pointsUvs&&o.enable(18),x.decodeVideoTexture&&o.enable(19),x.decodeVideoTextureEmissive&&o.enable(20),x.alphaToCoverage&&o.enable(21),_.push(o.mask)}function S(_){let x=g[_.type],C;if(x){let z=Ri[x];C=zp.clone(z.uniforms)}else C=_.uniforms;return C}function k(_,x){let C;for(let z=0,W=d.length;z<W;z++){let N=d[z];if(N.cacheKey===x){C=N,++C.usedTimes;break}}return C===void 0&&(C=new Fx(n,x,_,s),d.push(C)),C}function R(_){if(--_.usedTimes===0){let x=d.indexOf(_);d[x]=d[d.length-1],d.pop(),_.destroy()}}function E(_){l.remove(_)}function b(){l.dispose()}return{getParameters:f,getProgramCacheKey:m,getUniforms:S,acquireProgram:k,releaseProgram:R,releaseShaderCache:E,programs:d,dispose:b}}function zx(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,l){n.get(a)[o]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function Vx(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function oh(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function lh(){let n=[],e=0,t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(u,h,p,g,v,f){let m=n[e];return m===void 0?(m={id:u.id,object:u,geometry:h,material:p,groupOrder:g,renderOrder:u.renderOrder,z:v,group:f},n[e]=m):(m.id=u.id,m.object=u,m.geometry=h,m.material=p,m.groupOrder=g,m.renderOrder=u.renderOrder,m.z=v,m.group=f),e++,m}function o(u,h,p,g,v,f){let m=a(u,h,p,g,v,f);p.transmission>0?i.push(m):p.transparent===!0?r.push(m):t.push(m)}function l(u,h,p,g,v,f){let m=a(u,h,p,g,v,f);p.transmission>0?i.unshift(m):p.transparent===!0?r.unshift(m):t.unshift(m)}function c(u,h){t.length>1&&t.sort(u||Vx),i.length>1&&i.sort(h||oh),r.length>1&&r.sort(h||oh)}function d(){for(let u=e,h=n.length;u<h;u++){let p=n[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:o,unshift:l,finish:d,sort:c}}function Gx(){let n=new WeakMap;function e(i,r){let s=n.get(i),a;return s===void 0?(a=new lh,n.set(i,[a])):r>=s.length?(a=new lh,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function $x(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new G,color:new ze};break;case"SpotLight":t={position:new G,direction:new G,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new G,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new G,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new G,halfWidth:new G,halfHeight:new G};break}return n[e.id]=t,t}}}function Wx(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var jx=0;function qx(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Xx(n){let e=new $x,t=Wx(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new G);let r=new G,s=new We,a=new We;function o(c){let d=0,u=0,h=0;for(let _=0;_<9;_++)i.probe[_].set(0,0,0);let p=0,g=0,v=0,f=0,m=0,T=0,M=0,S=0,k=0,R=0,E=0;c.sort(qx);for(let _=0,x=c.length;_<x;_++){let C=c[_],z=C.color,W=C.intensity,N=C.distance,P=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)d+=z.r*W,u+=z.g*W,h+=z.b*W;else if(C.isLightProbe){for(let L=0;L<9;L++)i.probe[L].addScaledVector(C.sh.coefficients[L],W);E++}else if(C.isDirectionalLight){let L=e.get(C);if(L.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let I=C.shadow,O=t.get(C);O.shadowIntensity=I.intensity,O.shadowBias=I.bias,O.shadowNormalBias=I.normalBias,O.shadowRadius=I.radius,O.shadowMapSize=I.mapSize,i.directionalShadow[p]=O,i.directionalShadowMap[p]=P,i.directionalShadowMatrix[p]=C.shadow.matrix,T++}i.directional[p]=L,p++}else if(C.isSpotLight){let L=e.get(C);L.position.setFromMatrixPosition(C.matrixWorld),L.color.copy(z).multiplyScalar(W),L.distance=N,L.coneCos=Math.cos(C.angle),L.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),L.decay=C.decay,i.spot[v]=L;let I=C.shadow;if(C.map&&(i.spotLightMap[k]=C.map,k++,I.updateMatrices(C),C.castShadow&&R++),i.spotLightMatrix[v]=I.matrix,C.castShadow){let O=t.get(C);O.shadowIntensity=I.intensity,O.shadowBias=I.bias,O.shadowNormalBias=I.normalBias,O.shadowRadius=I.radius,O.shadowMapSize=I.mapSize,i.spotShadow[v]=O,i.spotShadowMap[v]=P,S++}v++}else if(C.isRectAreaLight){let L=e.get(C);L.color.copy(z).multiplyScalar(W),L.halfWidth.set(C.width*.5,0,0),L.halfHeight.set(0,C.height*.5,0),i.rectArea[f]=L,f++}else if(C.isPointLight){let L=e.get(C);if(L.color.copy(C.color).multiplyScalar(C.intensity),L.distance=C.distance,L.decay=C.decay,C.castShadow){let I=C.shadow,O=t.get(C);O.shadowIntensity=I.intensity,O.shadowBias=I.bias,O.shadowNormalBias=I.normalBias,O.shadowRadius=I.radius,O.shadowMapSize=I.mapSize,O.shadowCameraNear=I.camera.near,O.shadowCameraFar=I.camera.far,i.pointShadow[g]=O,i.pointShadowMap[g]=P,i.pointShadowMatrix[g]=C.shadow.matrix,M++}i.point[g]=L,g++}else if(C.isHemisphereLight){let L=e.get(C);L.skyColor.copy(C.color).multiplyScalar(W),L.groundColor.copy(C.groundColor).multiplyScalar(W),i.hemi[m]=L,m++}}f>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=pe.LTC_FLOAT_1,i.rectAreaLTC2=pe.LTC_FLOAT_2):(i.rectAreaLTC1=pe.LTC_HALF_1,i.rectAreaLTC2=pe.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=u,i.ambient[2]=h;let b=i.hash;(b.directionalLength!==p||b.pointLength!==g||b.spotLength!==v||b.rectAreaLength!==f||b.hemiLength!==m||b.numDirectionalShadows!==T||b.numPointShadows!==M||b.numSpotShadows!==S||b.numSpotMaps!==k||b.numLightProbes!==E)&&(i.directional.length=p,i.spot.length=v,i.rectArea.length=f,i.point.length=g,i.hemi.length=m,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.pointShadow.length=M,i.pointShadowMap.length=M,i.spotShadow.length=S,i.spotShadowMap.length=S,i.directionalShadowMatrix.length=T,i.pointShadowMatrix.length=M,i.spotLightMatrix.length=S+k-R,i.spotLightMap.length=k,i.numSpotLightShadowsWithMaps=R,i.numLightProbes=E,b.directionalLength=p,b.pointLength=g,b.spotLength=v,b.rectAreaLength=f,b.hemiLength=m,b.numDirectionalShadows=T,b.numPointShadows=M,b.numSpotShadows=S,b.numSpotMaps=k,b.numLightProbes=E,i.version=jx++)}function l(c,d){let u=0,h=0,p=0,g=0,v=0,f=d.matrixWorldInverse;for(let m=0,T=c.length;m<T;m++){let M=c[m];if(M.isDirectionalLight){let S=i.directional[u];S.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(f),u++}else if(M.isSpotLight){let S=i.spot[p];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(f),S.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(f),p++}else if(M.isRectAreaLight){let S=i.rectArea[g];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(f),a.identity(),s.copy(M.matrixWorld),s.premultiply(f),a.extractRotation(s),S.halfWidth.set(M.width*.5,0,0),S.halfHeight.set(0,M.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),g++}else if(M.isPointLight){let S=i.point[h];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(f),h++}else if(M.isHemisphereLight){let S=i.hemi[v];S.direction.setFromMatrixPosition(M.matrixWorld),S.direction.transformDirection(f),v++}}}return{setup:o,setupView:l,state:i}}function ch(n){let e=new Xx(n),t=[],i=[];function r(d){c.camera=d,t.length=0,i.length=0}function s(d){t.push(d)}function a(d){i.push(d)}function o(){e.setup(t)}function l(d){e.setupView(t,d)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function Yx(n){let e=new WeakMap;function t(r,s=0){let a=e.get(r),o;return a===void 0?(o=new ch(n),e.set(r,[o])):s>=a.length?(o=new ch(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var Uo=class extends ui{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Ep,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},No=class extends ui{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},Kx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Zx=`uniform sampler2D shadow_pass;
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
}`;function Jx(n,e,t){let i=new Wn,r=new it,s=new it,a=new ot,o=new Uo({depthPacking:Ap}),l=new No,c={},d=t.maxTextureSize,u={[qi]:Zt,[Zt]:qi,[Ci]:Ci},h=new Fi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new it},radius:{value:4}},vertexShader:Kx,fragmentShader:Zx}),p=h.clone();p.defines.HORIZONTAL_PASS=1;let g=new Oi;g.setAttribute("position",new Gt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new pt(g,h),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=kd;let m=this.type;this.render=function(R,E,b){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||R.length===0)return;let _=n.getRenderTarget(),x=n.getActiveCubeFace(),C=n.getActiveMipmapLevel(),z=n.state;z.setBlending(pr),z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);let W=m!==Vi&&this.type===Vi,N=m===Vi&&this.type!==Vi;for(let P=0,L=R.length;P<L;P++){let I=R[P],O=I.shadow;if(O===void 0){console.warn("THREE.WebGLShadowMap:",I,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;r.copy(O.mapSize);let J=O.getFrameExtents();if(r.multiply(J),s.copy(O.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(s.x=Math.floor(d/J.x),r.x=s.x*J.x,O.mapSize.x=s.x),r.y>d&&(s.y=Math.floor(d/J.y),r.y=s.y*J.y,O.mapSize.y=s.y)),O.map===null||W===!0||N===!0){let re=this.type!==Vi?{minFilter:Jt,magFilter:Jt}:{};O.map!==null&&O.map.dispose(),O.map=new Yi(r.x,r.y,re),O.map.texture.name=I.name+".shadowMap",O.camera.updateProjectionMatrix()}n.setRenderTarget(O.map),n.clear();let Z=O.getViewportCount();for(let re=0;re<Z;re++){let ae=O.getViewport(re);a.set(s.x*ae.x,s.y*ae.y,s.x*ae.z,s.y*ae.w),z.viewport(a),O.updateMatrices(I,re),i=O.getFrustum(),S(E,b,O.camera,I,this.type)}O.isPointLightShadow!==!0&&this.type===Vi&&T(O,b),O.needsUpdate=!1}m=this.type,f.needsUpdate=!1,n.setRenderTarget(_,x,C)};function T(R,E){let b=e.update(v);h.defines.VSM_SAMPLES!==R.blurSamples&&(h.defines.VSM_SAMPLES=R.blurSamples,p.defines.VSM_SAMPLES=R.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new Yi(r.x,r.y)),h.uniforms.shadow_pass.value=R.map.texture,h.uniforms.resolution.value=R.mapSize,h.uniforms.radius.value=R.radius,n.setRenderTarget(R.mapPass),n.clear(),n.renderBufferDirect(E,null,b,h,v,null),p.uniforms.shadow_pass.value=R.mapPass.texture,p.uniforms.resolution.value=R.mapSize,p.uniforms.radius.value=R.radius,n.setRenderTarget(R.map),n.clear(),n.renderBufferDirect(E,null,b,p,v,null)}function M(R,E,b,_){let x=null,C=b.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(C!==void 0)x=C;else if(x=b.isPointLight===!0?l:o,n.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){let z=x.uuid,W=E.uuid,N=c[z];N===void 0&&(N={},c[z]=N);let P=N[W];P===void 0&&(P=x.clone(),N[W]=P,E.addEventListener("dispose",k)),x=P}if(x.visible=E.visible,x.wireframe=E.wireframe,_===Vi?x.side=E.shadowSide!==null?E.shadowSide:E.side:x.side=E.shadowSide!==null?E.shadowSide:u[E.side],x.alphaMap=E.alphaMap,x.alphaTest=E.alphaTest,x.map=E.map,x.clipShadows=E.clipShadows,x.clippingPlanes=E.clippingPlanes,x.clipIntersection=E.clipIntersection,x.displacementMap=E.displacementMap,x.displacementScale=E.displacementScale,x.displacementBias=E.displacementBias,x.wireframeLinewidth=E.wireframeLinewidth,x.linewidth=E.linewidth,b.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let z=n.properties.get(x);z.light=b}return x}function S(R,E,b,_,x){if(R.visible===!1)return;if(R.layers.test(E.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&x===Vi)&&(!R.frustumCulled||i.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(b.matrixWorldInverse,R.matrixWorld);let z=e.update(R),W=R.material;if(Array.isArray(W)){let N=z.groups;for(let P=0,L=N.length;P<L;P++){let I=N[P],O=W[I.materialIndex];if(O&&O.visible){let J=M(R,O,_,x);R.onBeforeShadow(n,R,E,b,z,J,I),n.renderBufferDirect(b,null,z,J,R,I),R.onAfterShadow(n,R,E,b,z,J,I)}}}else if(W.visible){let N=M(R,W,_,x);R.onBeforeShadow(n,R,E,b,z,N,null),n.renderBufferDirect(b,null,z,N,R,null),R.onAfterShadow(n,R,E,b,z,N,null)}}let C=R.children;for(let z=0,W=C.length;z<W;z++)S(C[z],E,b,_,x)}function k(R){R.target.removeEventListener("dispose",k);for(let E in c){let b=c[E],_=R.target.uuid;_ in b&&(b[_].dispose(),delete b[_])}}}var Qx={[ja]:qa,[Xa]:Za,[Ya]:Ja,[an]:Ka,[qa]:ja,[Za]:Xa,[Ja]:Ya,[Ka]:an};function e_(n,e){function t(){let B=!1,me=new ot,Y=null,ne=new ot(0,0,0,0);return{setMask:function(fe){Y!==fe&&!B&&(n.colorMask(fe,fe,fe,fe),Y=fe)},setLocked:function(fe){B=fe},setClear:function(fe,ue,qe,vt,wt){wt===!0&&(fe*=vt,ue*=vt,qe*=vt),me.set(fe,ue,qe,vt),ne.equals(me)===!1&&(n.clearColor(fe,ue,qe,vt),ne.copy(me))},reset:function(){B=!1,Y=null,ne.set(-1,0,0,0)}}}function i(){let B=!1,me=!1,Y=null,ne=null,fe=null;return{setReversed:function(ue){if(me!==ue){let qe=e.get("EXT_clip_control");me?qe.clipControlEXT(qe.LOWER_LEFT_EXT,qe.ZERO_TO_ONE_EXT):qe.clipControlEXT(qe.LOWER_LEFT_EXT,qe.NEGATIVE_ONE_TO_ONE_EXT);let vt=fe;fe=null,this.setClear(vt)}me=ue},getReversed:function(){return me},setTest:function(ue){ue?oe(n.DEPTH_TEST):ke(n.DEPTH_TEST)},setMask:function(ue){Y!==ue&&!B&&(n.depthMask(ue),Y=ue)},setFunc:function(ue){if(me&&(ue=Qx[ue]),ne!==ue){switch(ue){case ja:n.depthFunc(n.NEVER);break;case qa:n.depthFunc(n.ALWAYS);break;case Xa:n.depthFunc(n.LESS);break;case an:n.depthFunc(n.LEQUAL);break;case Ya:n.depthFunc(n.EQUAL);break;case Ka:n.depthFunc(n.GEQUAL);break;case Za:n.depthFunc(n.GREATER);break;case Ja:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ne=ue}},setLocked:function(ue){B=ue},setClear:function(ue){fe!==ue&&(me&&(ue=1-ue),n.clearDepth(ue),fe=ue)},reset:function(){B=!1,Y=null,ne=null,fe=null,me=!1}}}function r(){let B=!1,me=null,Y=null,ne=null,fe=null,ue=null,qe=null,vt=null,wt=null;return{setTest:function(nt){B||(nt?oe(n.STENCIL_TEST):ke(n.STENCIL_TEST))},setMask:function(nt){me!==nt&&!B&&(n.stencilMask(nt),me=nt)},setFunc:function(nt,ri,fi){(Y!==nt||ne!==ri||fe!==fi)&&(n.stencilFunc(nt,ri,fi),Y=nt,ne=ri,fe=fi)},setOp:function(nt,ri,fi){(ue!==nt||qe!==ri||vt!==fi)&&(n.stencilOp(nt,ri,fi),ue=nt,qe=ri,vt=fi)},setLocked:function(nt){B=nt},setClear:function(nt){wt!==nt&&(n.clearStencil(nt),wt=nt)},reset:function(){B=!1,me=null,Y=null,ne=null,fe=null,ue=null,qe=null,vt=null,wt=null}}}let s=new t,a=new i,o=new r,l=new WeakMap,c=new WeakMap,d={},u={},h=new WeakMap,p=[],g=null,v=!1,f=null,m=null,T=null,M=null,S=null,k=null,R=null,E=new ze(0,0,0),b=0,_=!1,x=null,C=null,z=null,W=null,N=null,P=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),L=!1,I=0,O=n.getParameter(n.VERSION);O.indexOf("WebGL")!==-1?(I=parseFloat(/^WebGL (\d)/.exec(O)[1]),L=I>=1):O.indexOf("OpenGL ES")!==-1&&(I=parseFloat(/^OpenGL ES (\d)/.exec(O)[1]),L=I>=2);let J=null,Z={},re=n.getParameter(n.SCISSOR_BOX),ae=n.getParameter(n.VIEWPORT),K=new ot().fromArray(re),D=new ot().fromArray(ae);function X(B,me,Y,ne){let fe=new Uint8Array(4),ue=n.createTexture();n.bindTexture(B,ue),n.texParameteri(B,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(B,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let qe=0;qe<Y;qe++)B===n.TEXTURE_3D||B===n.TEXTURE_2D_ARRAY?n.texImage3D(me,0,n.RGBA,1,1,ne,0,n.RGBA,n.UNSIGNED_BYTE,fe):n.texImage2D(me+qe,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,fe);return ue}let le={};le[n.TEXTURE_2D]=X(n.TEXTURE_2D,n.TEXTURE_2D,1),le[n.TEXTURE_CUBE_MAP]=X(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),le[n.TEXTURE_2D_ARRAY]=X(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),le[n.TEXTURE_3D]=X(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),oe(n.DEPTH_TEST),a.setFunc(an),Oe(!1),je(Mc),oe(n.CULL_FACE),V(pr);function oe(B){d[B]!==!0&&(n.enable(B),d[B]=!0)}function ke(B){d[B]!==!1&&(n.disable(B),d[B]=!1)}function xe(B,me){return u[B]!==me?(n.bindFramebuffer(B,me),u[B]=me,B===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=me),B===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=me),!0):!1}function Re(B,me){let Y=p,ne=!1;if(B){Y=h.get(me),Y===void 0&&(Y=[],h.set(me,Y));let fe=B.textures;if(Y.length!==fe.length||Y[0]!==n.COLOR_ATTACHMENT0){for(let ue=0,qe=fe.length;ue<qe;ue++)Y[ue]=n.COLOR_ATTACHMENT0+ue;Y.length=fe.length,ne=!0}}else Y[0]!==n.BACK&&(Y[0]=n.BACK,ne=!0);ne&&n.drawBuffers(Y)}function Qe(B){return g!==B?(n.useProgram(B),g=B,!0):!1}let Ne={[Or]:n.FUNC_ADD,[Jh]:n.FUNC_SUBTRACT,[Qh]:n.FUNC_REVERSE_SUBTRACT};Ne[ep]=n.MIN,Ne[tp]=n.MAX;let bt={[ip]:n.ZERO,[rp]:n.ONE,[np]:n.SRC_COLOR,[$a]:n.SRC_ALPHA,[dp]:n.SRC_ALPHA_SATURATE,[lp]:n.DST_COLOR,[ap]:n.DST_ALPHA,[sp]:n.ONE_MINUS_SRC_COLOR,[Wa]:n.ONE_MINUS_SRC_ALPHA,[cp]:n.ONE_MINUS_DST_COLOR,[op]:n.ONE_MINUS_DST_ALPHA,[up]:n.CONSTANT_COLOR,[hp]:n.ONE_MINUS_CONSTANT_COLOR,[pp]:n.CONSTANT_ALPHA,[mp]:n.ONE_MINUS_CONSTANT_ALPHA};function V(B,me,Y,ne,fe,ue,qe,vt,wt,nt){if(B===pr){v===!0&&(ke(n.BLEND),v=!1);return}if(v===!1&&(oe(n.BLEND),v=!0),B!==Zh){if(B!==f||nt!==_){if((m!==Or||S!==Or)&&(n.blendEquation(n.FUNC_ADD),m=Or,S=Or),nt)switch(B){case nn:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Tc:n.blendFunc(n.ONE,n.ONE);break;case Ec:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ac:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}else switch(B){case nn:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Tc:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Ec:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Ac:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}T=null,M=null,k=null,R=null,E.set(0,0,0),b=0,f=B,_=nt}return}fe=fe||me,ue=ue||Y,qe=qe||ne,(me!==m||fe!==S)&&(n.blendEquationSeparate(Ne[me],Ne[fe]),m=me,S=fe),(Y!==T||ne!==M||ue!==k||qe!==R)&&(n.blendFuncSeparate(bt[Y],bt[ne],bt[ue],bt[qe]),T=Y,M=ne,k=ue,R=qe),(vt.equals(E)===!1||wt!==b)&&(n.blendColor(vt.r,vt.g,vt.b,wt),E.copy(vt),b=wt),f=B,_=!1}function Pt(B,me){B.side===Ci?ke(n.CULL_FACE):oe(n.CULL_FACE);let Y=B.side===Zt;me&&(Y=!Y),Oe(Y),B.blending===nn&&B.transparent===!1?V(pr):V(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),a.setFunc(B.depthFunc),a.setTest(B.depthTest),a.setMask(B.depthWrite),s.setMask(B.colorWrite);let ne=B.stencilWrite;o.setTest(ne),ne&&(o.setMask(B.stencilWriteMask),o.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),o.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),rt(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?oe(n.SAMPLE_ALPHA_TO_COVERAGE):ke(n.SAMPLE_ALPHA_TO_COVERAGE)}function Oe(B){x!==B&&(B?n.frontFace(n.CW):n.frontFace(n.CCW),x=B)}function je(B){B!==Xh?(oe(n.CULL_FACE),B!==C&&(B===Mc?n.cullFace(n.BACK):B===Yh?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):ke(n.CULL_FACE),C=B}function we(B){B!==z&&(L&&n.lineWidth(B),z=B)}function rt(B,me,Y){B?(oe(n.POLYGON_OFFSET_FILL),(W!==me||N!==Y)&&(n.polygonOffset(me,Y),W=me,N=Y)):ke(n.POLYGON_OFFSET_FILL)}function Pe(B){B?oe(n.SCISSOR_TEST):ke(n.SCISSOR_TEST)}function A(B){B===void 0&&(B=n.TEXTURE0+P-1),J!==B&&(n.activeTexture(B),J=B)}function y(B,me,Y){Y===void 0&&(J===null?Y=n.TEXTURE0+P-1:Y=J);let ne=Z[Y];ne===void 0&&(ne={type:void 0,texture:void 0},Z[Y]=ne),(ne.type!==B||ne.texture!==me)&&(J!==Y&&(n.activeTexture(Y),J=Y),n.bindTexture(B,me||le[B]),ne.type=B,ne.texture=me)}function $(){let B=Z[J];B!==void 0&&B.type!==void 0&&(n.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function te(){try{n.compressedTexImage2D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function se(){try{n.compressedTexImage3D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function ie(){try{n.texSubImage2D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ae(){try{n.texSubImage3D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function he(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function _e(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ye(){try{n.texStorage2D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function de(){try{n.texStorage3D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function ye(){try{n.texImage2D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function De(){try{n.texImage3D.apply(n,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ue(B){K.equals(B)===!1&&(n.scissor(B.x,B.y,B.z,B.w),K.copy(B))}function Se(B){D.equals(B)===!1&&(n.viewport(B.x,B.y,B.z,B.w),D.copy(B))}function Ke(B,me){let Y=c.get(me);Y===void 0&&(Y=new WeakMap,c.set(me,Y));let ne=Y.get(B);ne===void 0&&(ne=n.getUniformBlockIndex(me,B.name),Y.set(B,ne))}function Ve(B,me){let Y=c.get(me).get(B);l.get(me)!==Y&&(n.uniformBlockBinding(me,Y,B.__bindingPointIndex),l.set(me,Y))}function et(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),d={},J=null,Z={},u={},h=new WeakMap,p=[],g=null,v=!1,f=null,m=null,T=null,M=null,S=null,k=null,R=null,E=new ze(0,0,0),b=0,_=!1,x=null,C=null,z=null,W=null,N=null,K.set(0,0,n.canvas.width,n.canvas.height),D.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:oe,disable:ke,bindFramebuffer:xe,drawBuffers:Re,useProgram:Qe,setBlending:V,setMaterial:Pt,setFlipSided:Oe,setCullFace:je,setLineWidth:we,setPolygonOffset:rt,setScissorTest:Pe,activeTexture:A,bindTexture:y,unbindTexture:$,compressedTexImage2D:te,compressedTexImage3D:se,texImage2D:ye,texImage3D:De,updateUBOMapping:Ke,uniformBlockBinding:Ve,texStorage2D:Ye,texStorage3D:de,texSubImage2D:ie,texSubImage3D:Ae,compressedTexSubImage2D:he,compressedTexSubImage3D:_e,scissor:Ue,viewport:Se,reset:et}}function dh(n,e,t,i){let r=t_(i);switch(t){case zd:return n*e;case Gd:return n*e;case $d:return n*e*2;case gl:return n*e/r.components*r.byteLength;case vl:return n*e/r.components*r.byteLength;case Wd:return n*e*2/r.components*r.byteLength;case xl:return n*e*2/r.components*r.byteLength;case Vd:return n*e*3/r.components*r.byteLength;case di:return n*e*4/r.components*r.byteLength;case _l:return n*e*4/r.components*r.byteLength;case ws:case Ms:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ts:case Es:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case io:case no:return Math.max(n,16)*Math.max(e,8)/4;case to:case ro:return Math.max(n,8)*Math.max(e,8)/2;case so:case ao:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case oo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case lo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case co:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case uo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case ho:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case po:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case mo:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case fo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case go:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case vo:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case xo:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case _o:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case yo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case bo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case So:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case As:case wo:case Mo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case jd:case To:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Eo:case Ao:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function t_(n){switch(n){case Xi:case Fd:return{byteLength:1,components:1};case Hn:case Bd:case es:return{byteLength:2,components:1};case ml:case fl:return{byteLength:2,components:4};case zr:case pl:case yi:return{byteLength:4,components:1};case Hd:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}function i_(n,e,t,i,r,s,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new it,d=new WeakMap,u,h=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(A,y){return p?new OffscreenCanvas(A,y):Ds("canvas")}function v(A,y,$){let te=1,se=Pe(A);if((se.width>$||se.height>$)&&(te=$/Math.max(se.width,se.height)),te<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let ie=Math.floor(te*se.width),Ae=Math.floor(te*se.height);u===void 0&&(u=g(ie,Ae));let he=y?g(ie,Ae):u;return he.width=ie,he.height=Ae,he.getContext("2d").drawImage(A,0,0,ie,Ae),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+se.width+"x"+se.height+") to ("+ie+"x"+Ae+")."),he}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+se.width+"x"+se.height+")."),A;return A}function f(A){return A.generateMipmaps}function m(A){n.generateMipmap(A)}function T(A){return A.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?n.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function M(A,y,$,te,se=!1){if(A!==null){if(n[A]!==void 0)return n[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ie=y;if(y===n.RED&&($===n.FLOAT&&(ie=n.R32F),$===n.HALF_FLOAT&&(ie=n.R16F),$===n.UNSIGNED_BYTE&&(ie=n.R8)),y===n.RED_INTEGER&&($===n.UNSIGNED_BYTE&&(ie=n.R8UI),$===n.UNSIGNED_SHORT&&(ie=n.R16UI),$===n.UNSIGNED_INT&&(ie=n.R32UI),$===n.BYTE&&(ie=n.R8I),$===n.SHORT&&(ie=n.R16I),$===n.INT&&(ie=n.R32I)),y===n.RG&&($===n.FLOAT&&(ie=n.RG32F),$===n.HALF_FLOAT&&(ie=n.RG16F),$===n.UNSIGNED_BYTE&&(ie=n.RG8)),y===n.RG_INTEGER&&($===n.UNSIGNED_BYTE&&(ie=n.RG8UI),$===n.UNSIGNED_SHORT&&(ie=n.RG16UI),$===n.UNSIGNED_INT&&(ie=n.RG32UI),$===n.BYTE&&(ie=n.RG8I),$===n.SHORT&&(ie=n.RG16I),$===n.INT&&(ie=n.RG32I)),y===n.RGB_INTEGER&&($===n.UNSIGNED_BYTE&&(ie=n.RGB8UI),$===n.UNSIGNED_SHORT&&(ie=n.RGB16UI),$===n.UNSIGNED_INT&&(ie=n.RGB32UI),$===n.BYTE&&(ie=n.RGB8I),$===n.SHORT&&(ie=n.RGB16I),$===n.INT&&(ie=n.RGB32I)),y===n.RGBA_INTEGER&&($===n.UNSIGNED_BYTE&&(ie=n.RGBA8UI),$===n.UNSIGNED_SHORT&&(ie=n.RGBA16UI),$===n.UNSIGNED_INT&&(ie=n.RGBA32UI),$===n.BYTE&&(ie=n.RGBA8I),$===n.SHORT&&(ie=n.RGBA16I),$===n.INT&&(ie=n.RGBA32I)),y===n.RGB&&$===n.UNSIGNED_INT_5_9_9_9_REV&&(ie=n.RGB9_E5),y===n.RGBA){let Ae=se?ia:tt.getTransfer(te);$===n.FLOAT&&(ie=n.RGBA32F),$===n.HALF_FLOAT&&(ie=n.RGBA16F),$===n.UNSIGNED_BYTE&&(ie=Ae===ut?n.SRGB8_ALPHA8:n.RGBA8),$===n.UNSIGNED_SHORT_4_4_4_4&&(ie=n.RGBA4),$===n.UNSIGNED_SHORT_5_5_5_1&&(ie=n.RGB5_A1)}return(ie===n.R16F||ie===n.R32F||ie===n.RG16F||ie===n.RG32F||ie===n.RGBA16F||ie===n.RGBA32F)&&e.get("EXT_color_buffer_float"),ie}function S(A,y){let $;return A?y===null||y===zr||y===dn?$=n.DEPTH24_STENCIL8:y===yi?$=n.DEPTH32F_STENCIL8:y===Hn&&($=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===zr||y===dn?$=n.DEPTH_COMPONENT24:y===yi?$=n.DEPTH_COMPONENT32F:y===Hn&&($=n.DEPTH_COMPONENT16),$}function k(A,y){return f(A)===!0||A.isFramebufferTexture&&A.minFilter!==Jt&&A.minFilter!==si?Math.log2(Math.max(y.width,y.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?y.mipmaps.length:1}function R(A){let y=A.target;y.removeEventListener("dispose",R),b(y),y.isVideoTexture&&d.delete(y)}function E(A){let y=A.target;y.removeEventListener("dispose",E),x(y)}function b(A){let y=i.get(A);if(y.__webglInit===void 0)return;let $=A.source,te=h.get($);if(te){let se=te[y.__cacheKey];se.usedTimes--,se.usedTimes===0&&_(A),Object.keys(te).length===0&&h.delete($)}i.remove(A)}function _(A){let y=i.get(A);n.deleteTexture(y.__webglTexture);let $=A.source,te=h.get($);delete te[y.__cacheKey],a.memory.textures--}function x(A){let y=i.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),i.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let te=0;te<6;te++){if(Array.isArray(y.__webglFramebuffer[te]))for(let se=0;se<y.__webglFramebuffer[te].length;se++)n.deleteFramebuffer(y.__webglFramebuffer[te][se]);else n.deleteFramebuffer(y.__webglFramebuffer[te]);y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer[te])}else{if(Array.isArray(y.__webglFramebuffer))for(let te=0;te<y.__webglFramebuffer.length;te++)n.deleteFramebuffer(y.__webglFramebuffer[te]);else n.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&n.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let te=0;te<y.__webglColorRenderbuffer.length;te++)y.__webglColorRenderbuffer[te]&&n.deleteRenderbuffer(y.__webglColorRenderbuffer[te]);y.__webglDepthRenderbuffer&&n.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let $=A.textures;for(let te=0,se=$.length;te<se;te++){let ie=i.get($[te]);ie.__webglTexture&&(n.deleteTexture(ie.__webglTexture),a.memory.textures--),i.remove($[te])}i.remove(A)}let C=0;function z(){C=0}function W(){let A=C;return A>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+r.maxTextures),C+=1,A}function N(A){let y=[];return y.push(A.wrapS),y.push(A.wrapT),y.push(A.wrapR||0),y.push(A.magFilter),y.push(A.minFilter),y.push(A.anisotropy),y.push(A.internalFormat),y.push(A.format),y.push(A.type),y.push(A.generateMipmaps),y.push(A.premultiplyAlpha),y.push(A.flipY),y.push(A.unpackAlignment),y.push(A.colorSpace),y.join()}function P(A,y){let $=i.get(A);if(A.isVideoTexture&&we(A),A.isRenderTargetTexture===!1&&A.version>0&&$.__version!==A.version){let te=A.image;if(te===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(te.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{D($,A,y);return}}t.bindTexture(n.TEXTURE_2D,$.__webglTexture,n.TEXTURE0+y)}function L(A,y){let $=i.get(A);if(A.version>0&&$.__version!==A.version){D($,A,y);return}t.bindTexture(n.TEXTURE_2D_ARRAY,$.__webglTexture,n.TEXTURE0+y)}function I(A,y){let $=i.get(A);if(A.version>0&&$.__version!==A.version){D($,A,y);return}t.bindTexture(n.TEXTURE_3D,$.__webglTexture,n.TEXTURE0+y)}function O(A,y){let $=i.get(A);if(A.version>0&&$.__version!==A.version){X($,A,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,$.__webglTexture,n.TEXTURE0+y)}let J={[cn]:n.REPEAT,[ur]:n.CLAMP_TO_EDGE,[Is]:n.MIRRORED_REPEAT},Z={[Jt]:n.NEAREST,[Od]:n.NEAREST_MIPMAP_NEAREST,[Un]:n.NEAREST_MIPMAP_LINEAR,[si]:n.LINEAR,[Ss]:n.LINEAR_MIPMAP_NEAREST,[Wi]:n.LINEAR_MIPMAP_LINEAR},re={[Cp]:n.NEVER,[Up]:n.ALWAYS,[Lp]:n.LESS,[Yd]:n.LEQUAL,[Pp]:n.EQUAL,[Dp]:n.GEQUAL,[Ip]:n.GREATER,[kp]:n.NOTEQUAL};function ae(A,y){if(y.type===yi&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===si||y.magFilter===Ss||y.magFilter===Un||y.magFilter===Wi||y.minFilter===si||y.minFilter===Ss||y.minFilter===Un||y.minFilter===Wi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(A,n.TEXTURE_WRAP_S,J[y.wrapS]),n.texParameteri(A,n.TEXTURE_WRAP_T,J[y.wrapT]),(A===n.TEXTURE_3D||A===n.TEXTURE_2D_ARRAY)&&n.texParameteri(A,n.TEXTURE_WRAP_R,J[y.wrapR]),n.texParameteri(A,n.TEXTURE_MAG_FILTER,Z[y.magFilter]),n.texParameteri(A,n.TEXTURE_MIN_FILTER,Z[y.minFilter]),y.compareFunction&&(n.texParameteri(A,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(A,n.TEXTURE_COMPARE_FUNC,re[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Jt||y.minFilter!==Un&&y.minFilter!==Wi||y.type===yi&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){let $=e.get("EXT_texture_filter_anisotropic");n.texParameterf(A,$.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function K(A,y){let $=!1;A.__webglInit===void 0&&(A.__webglInit=!0,y.addEventListener("dispose",R));let te=y.source,se=h.get(te);se===void 0&&(se={},h.set(te,se));let ie=N(y);if(ie!==A.__cacheKey){se[ie]===void 0&&(se[ie]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,$=!0),se[ie].usedTimes++;let Ae=se[A.__cacheKey];Ae!==void 0&&(se[A.__cacheKey].usedTimes--,Ae.usedTimes===0&&_(y)),A.__cacheKey=ie,A.__webglTexture=se[ie].texture}return $}function D(A,y,$){let te=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(te=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(te=n.TEXTURE_3D);let se=K(A,y),ie=y.source;t.bindTexture(te,A.__webglTexture,n.TEXTURE0+$);let Ae=i.get(ie);if(ie.version!==Ae.__version||se===!0){t.activeTexture(n.TEXTURE0+$);let he=tt.getPrimaries(tt.workingColorSpace),_e=y.colorSpace===dr?null:tt.getPrimaries(y.colorSpace),Ye=y.colorSpace===dr||he===_e?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ye);let de=v(y.image,!1,r.maxTextureSize);de=rt(y,de);let ye=s.convert(y.format,y.colorSpace),De=s.convert(y.type),Ue=M(y.internalFormat,ye,De,y.colorSpace,y.isVideoTexture);ae(te,y);let Se,Ke=y.mipmaps,Ve=y.isVideoTexture!==!0,et=Ae.__version===void 0||se===!0,B=ie.dataReady,me=k(y,de);if(y.isDepthTexture)Ue=S(y.format===un,y.type),et&&(Ve?t.texStorage2D(n.TEXTURE_2D,1,Ue,de.width,de.height):t.texImage2D(n.TEXTURE_2D,0,Ue,de.width,de.height,0,ye,De,null));else if(y.isDataTexture)if(Ke.length>0){Ve&&et&&t.texStorage2D(n.TEXTURE_2D,me,Ue,Ke[0].width,Ke[0].height);for(let Y=0,ne=Ke.length;Y<ne;Y++)Se=Ke[Y],Ve?B&&t.texSubImage2D(n.TEXTURE_2D,Y,0,0,Se.width,Se.height,ye,De,Se.data):t.texImage2D(n.TEXTURE_2D,Y,Ue,Se.width,Se.height,0,ye,De,Se.data);y.generateMipmaps=!1}else Ve?(et&&t.texStorage2D(n.TEXTURE_2D,me,Ue,de.width,de.height),B&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,de.width,de.height,ye,De,de.data)):t.texImage2D(n.TEXTURE_2D,0,Ue,de.width,de.height,0,ye,De,de.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ve&&et&&t.texStorage3D(n.TEXTURE_2D_ARRAY,me,Ue,Ke[0].width,Ke[0].height,de.depth);for(let Y=0,ne=Ke.length;Y<ne;Y++)if(Se=Ke[Y],y.format!==di)if(ye!==null)if(Ve){if(B)if(y.layerUpdates.size>0){let fe=dh(Se.width,Se.height,y.format,y.type);for(let ue of y.layerUpdates){let qe=Se.data.subarray(ue*fe/Se.data.BYTES_PER_ELEMENT,(ue+1)*fe/Se.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,ue,Se.width,Se.height,1,ye,qe)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,0,Se.width,Se.height,de.depth,ye,Se.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Y,Ue,Se.width,Se.height,de.depth,0,Se.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ve?B&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Y,0,0,0,Se.width,Se.height,de.depth,ye,De,Se.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Y,Ue,Se.width,Se.height,de.depth,0,ye,De,Se.data)}else{Ve&&et&&t.texStorage2D(n.TEXTURE_2D,me,Ue,Ke[0].width,Ke[0].height);for(let Y=0,ne=Ke.length;Y<ne;Y++)Se=Ke[Y],y.format!==di?ye!==null?Ve?B&&t.compressedTexSubImage2D(n.TEXTURE_2D,Y,0,0,Se.width,Se.height,ye,Se.data):t.compressedTexImage2D(n.TEXTURE_2D,Y,Ue,Se.width,Se.height,0,Se.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ve?B&&t.texSubImage2D(n.TEXTURE_2D,Y,0,0,Se.width,Se.height,ye,De,Se.data):t.texImage2D(n.TEXTURE_2D,Y,Ue,Se.width,Se.height,0,ye,De,Se.data)}else if(y.isDataArrayTexture)if(Ve){if(et&&t.texStorage3D(n.TEXTURE_2D_ARRAY,me,Ue,de.width,de.height,de.depth),B)if(y.layerUpdates.size>0){let Y=dh(de.width,de.height,y.format,y.type);for(let ne of y.layerUpdates){let fe=de.data.subarray(ne*Y/de.data.BYTES_PER_ELEMENT,(ne+1)*Y/de.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,ne,de.width,de.height,1,ye,De,fe)}y.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,de.width,de.height,de.depth,ye,De,de.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ue,de.width,de.height,de.depth,0,ye,De,de.data);else if(y.isData3DTexture)Ve?(et&&t.texStorage3D(n.TEXTURE_3D,me,Ue,de.width,de.height,de.depth),B&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,de.width,de.height,de.depth,ye,De,de.data)):t.texImage3D(n.TEXTURE_3D,0,Ue,de.width,de.height,de.depth,0,ye,De,de.data);else if(y.isFramebufferTexture){if(et)if(Ve)t.texStorage2D(n.TEXTURE_2D,me,Ue,de.width,de.height);else{let Y=de.width,ne=de.height;for(let fe=0;fe<me;fe++)t.texImage2D(n.TEXTURE_2D,fe,Ue,Y,ne,0,ye,De,null),Y>>=1,ne>>=1}}else if(Ke.length>0){if(Ve&&et){let Y=Pe(Ke[0]);t.texStorage2D(n.TEXTURE_2D,me,Ue,Y.width,Y.height)}for(let Y=0,ne=Ke.length;Y<ne;Y++)Se=Ke[Y],Ve?B&&t.texSubImage2D(n.TEXTURE_2D,Y,0,0,ye,De,Se):t.texImage2D(n.TEXTURE_2D,Y,Ue,ye,De,Se);y.generateMipmaps=!1}else if(Ve){if(et){let Y=Pe(de);t.texStorage2D(n.TEXTURE_2D,me,Ue,Y.width,Y.height)}B&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ye,De,de)}else t.texImage2D(n.TEXTURE_2D,0,Ue,ye,De,de);f(y)&&m(te),Ae.__version=ie.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function X(A,y,$){if(y.image.length!==6)return;let te=K(A,y),se=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,A.__webglTexture,n.TEXTURE0+$);let ie=i.get(se);if(se.version!==ie.__version||te===!0){t.activeTexture(n.TEXTURE0+$);let Ae=tt.getPrimaries(tt.workingColorSpace),he=y.colorSpace===dr?null:tt.getPrimaries(y.colorSpace),_e=y.colorSpace===dr||Ae===he?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,_e);let Ye=y.isCompressedTexture||y.image[0].isCompressedTexture,de=y.image[0]&&y.image[0].isDataTexture,ye=[];for(let ne=0;ne<6;ne++)!Ye&&!de?ye[ne]=v(y.image[ne],!0,r.maxCubemapSize):ye[ne]=de?y.image[ne].image:y.image[ne],ye[ne]=rt(y,ye[ne]);let De=ye[0],Ue=s.convert(y.format,y.colorSpace),Se=s.convert(y.type),Ke=M(y.internalFormat,Ue,Se,y.colorSpace),Ve=y.isVideoTexture!==!0,et=ie.__version===void 0||te===!0,B=se.dataReady,me=k(y,De);ae(n.TEXTURE_CUBE_MAP,y);let Y;if(Ye){Ve&&et&&t.texStorage2D(n.TEXTURE_CUBE_MAP,me,Ke,De.width,De.height);for(let ne=0;ne<6;ne++){Y=ye[ne].mipmaps;for(let fe=0;fe<Y.length;fe++){let ue=Y[fe];y.format!==di?Ue!==null?Ve?B&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,fe,0,0,ue.width,ue.height,Ue,ue.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,fe,Ke,ue.width,ue.height,0,ue.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ve?B&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,fe,0,0,ue.width,ue.height,Ue,Se,ue.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,fe,Ke,ue.width,ue.height,0,Ue,Se,ue.data)}}}else{if(Y=y.mipmaps,Ve&&et){Y.length>0&&me++;let ne=Pe(ye[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,me,Ke,ne.width,ne.height)}for(let ne=0;ne<6;ne++)if(de){Ve?B&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,ye[ne].width,ye[ne].height,Ue,Se,ye[ne].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Ke,ye[ne].width,ye[ne].height,0,Ue,Se,ye[ne].data);for(let fe=0;fe<Y.length;fe++){let ue=Y[fe].image[ne].image;Ve?B&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,fe+1,0,0,ue.width,ue.height,Ue,Se,ue.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,fe+1,Ke,ue.width,ue.height,0,Ue,Se,ue.data)}}else{Ve?B&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Ue,Se,ye[ne]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Ke,Ue,Se,ye[ne]);for(let fe=0;fe<Y.length;fe++){let ue=Y[fe];Ve?B&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,fe+1,0,0,Ue,Se,ue.image[ne]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,fe+1,Ke,Ue,Se,ue.image[ne])}}}f(y)&&m(n.TEXTURE_CUBE_MAP),ie.__version=se.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function le(A,y,$,te,se,ie){let Ae=s.convert($.format,$.colorSpace),he=s.convert($.type),_e=M($.internalFormat,Ae,he,$.colorSpace),Ye=i.get(y),de=i.get($);if(de.__renderTarget=y,!Ye.__hasExternalTextures){let ye=Math.max(1,y.width>>ie),De=Math.max(1,y.height>>ie);se===n.TEXTURE_3D||se===n.TEXTURE_2D_ARRAY?t.texImage3D(se,ie,_e,ye,De,y.depth,0,Ae,he,null):t.texImage2D(se,ie,_e,ye,De,0,Ae,he,null)}t.bindFramebuffer(n.FRAMEBUFFER,A),je(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,te,se,de.__webglTexture,0,Oe(y)):(se===n.TEXTURE_2D||se>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&se<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,te,se,de.__webglTexture,ie),t.bindFramebuffer(n.FRAMEBUFFER,null)}function oe(A,y,$){if(n.bindRenderbuffer(n.RENDERBUFFER,A),y.depthBuffer){let te=y.depthTexture,se=te&&te.isDepthTexture?te.type:null,ie=S(y.stencilBuffer,se),Ae=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,he=Oe(y);je(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,he,ie,y.width,y.height):$?n.renderbufferStorageMultisample(n.RENDERBUFFER,he,ie,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,ie,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ae,n.RENDERBUFFER,A)}else{let te=y.textures;for(let se=0;se<te.length;se++){let ie=te[se],Ae=s.convert(ie.format,ie.colorSpace),he=s.convert(ie.type),_e=M(ie.internalFormat,Ae,he,ie.colorSpace),Ye=Oe(y);$&&je(y)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ye,_e,y.width,y.height):je(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ye,_e,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,_e,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function ke(A,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,A),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let $=i.get(y.depthTexture);$.__renderTarget=y,(!$.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),P(y.depthTexture,0);let te=$.__webglTexture,se=Oe(y);if(y.depthTexture.format===sn)je(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,te,0,se):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,te,0);else if(y.depthTexture.format===un)je(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,te,0,se):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,te,0);else throw new Error("Unknown depthTexture format")}function xe(A){let y=i.get(A),$=A.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==A.depthTexture){let te=A.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),te){let se=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,te.removeEventListener("dispose",se)};te.addEventListener("dispose",se),y.__depthDisposeCallback=se}y.__boundDepthTexture=te}if(A.depthTexture&&!y.__autoAllocateDepthBuffer){if($)throw new Error("target.depthTexture not supported in Cube render targets");ke(y.__webglFramebuffer,A)}else if($){y.__webglDepthbuffer=[];for(let te=0;te<6;te++)if(t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[te]),y.__webglDepthbuffer[te]===void 0)y.__webglDepthbuffer[te]=n.createRenderbuffer(),oe(y.__webglDepthbuffer[te],A,!1);else{let se=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ie=y.__webglDepthbuffer[te];n.bindRenderbuffer(n.RENDERBUFFER,ie),n.framebufferRenderbuffer(n.FRAMEBUFFER,se,n.RENDERBUFFER,ie)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=n.createRenderbuffer(),oe(y.__webglDepthbuffer,A,!1);else{let te=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,se=y.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,se),n.framebufferRenderbuffer(n.FRAMEBUFFER,te,n.RENDERBUFFER,se)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function Re(A,y,$){let te=i.get(A);y!==void 0&&le(te.__webglFramebuffer,A,A.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),$!==void 0&&xe(A)}function Qe(A){let y=A.texture,$=i.get(A),te=i.get(y);A.addEventListener("dispose",E);let se=A.textures,ie=A.isWebGLCubeRenderTarget===!0,Ae=se.length>1;if(Ae||(te.__webglTexture===void 0&&(te.__webglTexture=n.createTexture()),te.__version=y.version,a.memory.textures++),ie){$.__webglFramebuffer=[];for(let he=0;he<6;he++)if(y.mipmaps&&y.mipmaps.length>0){$.__webglFramebuffer[he]=[];for(let _e=0;_e<y.mipmaps.length;_e++)$.__webglFramebuffer[he][_e]=n.createFramebuffer()}else $.__webglFramebuffer[he]=n.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){$.__webglFramebuffer=[];for(let he=0;he<y.mipmaps.length;he++)$.__webglFramebuffer[he]=n.createFramebuffer()}else $.__webglFramebuffer=n.createFramebuffer();if(Ae)for(let he=0,_e=se.length;he<_e;he++){let Ye=i.get(se[he]);Ye.__webglTexture===void 0&&(Ye.__webglTexture=n.createTexture(),a.memory.textures++)}if(A.samples>0&&je(A)===!1){$.__webglMultisampledFramebuffer=n.createFramebuffer(),$.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,$.__webglMultisampledFramebuffer);for(let he=0;he<se.length;he++){let _e=se[he];$.__webglColorRenderbuffer[he]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,$.__webglColorRenderbuffer[he]);let Ye=s.convert(_e.format,_e.colorSpace),de=s.convert(_e.type),ye=M(_e.internalFormat,Ye,de,_e.colorSpace,A.isXRRenderTarget===!0),De=Oe(A);n.renderbufferStorageMultisample(n.RENDERBUFFER,De,ye,A.width,A.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+he,n.RENDERBUFFER,$.__webglColorRenderbuffer[he])}n.bindRenderbuffer(n.RENDERBUFFER,null),A.depthBuffer&&($.__webglDepthRenderbuffer=n.createRenderbuffer(),oe($.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ie){t.bindTexture(n.TEXTURE_CUBE_MAP,te.__webglTexture),ae(n.TEXTURE_CUBE_MAP,y);for(let he=0;he<6;he++)if(y.mipmaps&&y.mipmaps.length>0)for(let _e=0;_e<y.mipmaps.length;_e++)le($.__webglFramebuffer[he][_e],A,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+he,_e);else le($.__webglFramebuffer[he],A,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+he,0);f(y)&&m(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ae){for(let he=0,_e=se.length;he<_e;he++){let Ye=se[he],de=i.get(Ye);t.bindTexture(n.TEXTURE_2D,de.__webglTexture),ae(n.TEXTURE_2D,Ye),le($.__webglFramebuffer,A,Ye,n.COLOR_ATTACHMENT0+he,n.TEXTURE_2D,0),f(Ye)&&m(n.TEXTURE_2D)}t.unbindTexture()}else{let he=n.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(he=A.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(he,te.__webglTexture),ae(he,y),y.mipmaps&&y.mipmaps.length>0)for(let _e=0;_e<y.mipmaps.length;_e++)le($.__webglFramebuffer[_e],A,y,n.COLOR_ATTACHMENT0,he,_e);else le($.__webglFramebuffer,A,y,n.COLOR_ATTACHMENT0,he,0);f(y)&&m(he),t.unbindTexture()}A.depthBuffer&&xe(A)}function Ne(A){let y=A.textures;for(let $=0,te=y.length;$<te;$++){let se=y[$];if(f(se)){let ie=T(A),Ae=i.get(se).__webglTexture;t.bindTexture(ie,Ae),m(ie),t.unbindTexture()}}}let bt=[],V=[];function Pt(A){if(A.samples>0){if(je(A)===!1){let y=A.textures,$=A.width,te=A.height,se=n.COLOR_BUFFER_BIT,ie=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ae=i.get(A),he=y.length>1;if(he)for(let _e=0;_e<y.length;_e++)t.bindFramebuffer(n.FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+_e,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+_e,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ae.__webglFramebuffer);for(let _e=0;_e<y.length;_e++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(se|=n.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(se|=n.STENCIL_BUFFER_BIT)),he){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Ae.__webglColorRenderbuffer[_e]);let Ye=i.get(y[_e]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Ye,0)}n.blitFramebuffer(0,0,$,te,0,0,$,te,se,n.NEAREST),l===!0&&(bt.length=0,V.length=0,bt.push(n.COLOR_ATTACHMENT0+_e),A.depthBuffer&&A.resolveDepthBuffer===!1&&(bt.push(ie),V.push(ie),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,V)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,bt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),he)for(let _e=0;_e<y.length;_e++){t.bindFramebuffer(n.FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+_e,n.RENDERBUFFER,Ae.__webglColorRenderbuffer[_e]);let Ye=i.get(y[_e]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+_e,n.TEXTURE_2D,Ye,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ae.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){let y=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[y])}}}function Oe(A){return Math.min(r.maxSamples,A.samples)}function je(A){let y=i.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function we(A){let y=a.render.frame;d.get(A)!==y&&(d.set(A,y),A.update())}function rt(A,y){let $=A.colorSpace,te=A.format,se=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||$!==Qt&&$!==dr&&(tt.getTransfer($)===ut?(te!==di||se!==Xi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",$)),y}function Pe(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=W,this.resetTextureUnits=z,this.setTexture2D=P,this.setTexture2DArray=L,this.setTexture3D=I,this.setTextureCube=O,this.rebindTextures=Re,this.setupRenderTarget=Qe,this.updateRenderTargetMipmap=Ne,this.updateMultisampleRenderTarget=Pt,this.setupDepthRenderbuffer=xe,this.setupFrameBufferTexture=le,this.useMultisampledRTT=je}function qp(n,e){function t(i,r=dr){let s,a=tt.getTransfer(r);if(i===Xi)return n.UNSIGNED_BYTE;if(i===ml)return n.UNSIGNED_SHORT_4_4_4_4;if(i===fl)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Hd)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Fd)return n.BYTE;if(i===Bd)return n.SHORT;if(i===Hn)return n.UNSIGNED_SHORT;if(i===pl)return n.INT;if(i===zr)return n.UNSIGNED_INT;if(i===yi)return n.FLOAT;if(i===es)return n.HALF_FLOAT;if(i===zd)return n.ALPHA;if(i===Vd)return n.RGB;if(i===di)return n.RGBA;if(i===Gd)return n.LUMINANCE;if(i===$d)return n.LUMINANCE_ALPHA;if(i===sn)return n.DEPTH_COMPONENT;if(i===un)return n.DEPTH_STENCIL;if(i===gl)return n.RED;if(i===vl)return n.RED_INTEGER;if(i===Wd)return n.RG;if(i===xl)return n.RG_INTEGER;if(i===_l)return n.RGBA_INTEGER;if(i===ws||i===Ms||i===Ts||i===Es)if(a===ut)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ws)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Ms)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ts)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Es)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ws)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Ms)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ts)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Es)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===to||i===io||i===ro||i===no)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===to)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===io)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===ro)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===no)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===so||i===ao||i===oo)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===so||i===ao)return a===ut?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===oo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===lo||i===co||i===uo||i===ho||i===po||i===mo||i===fo||i===go||i===vo||i===xo||i===_o||i===yo||i===bo||i===So)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===lo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===co)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===uo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ho)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===po)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===mo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===fo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===go)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===vo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===xo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===_o)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===yo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===bo)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===So)return a===ut?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===As||i===wo||i===Mo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===As)return a===ut?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===wo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Mo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===jd||i===To||i===Eo||i===Ao)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===As)return s.COMPRESSED_RED_RGTC1_EXT;if(i===To)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Eo)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Ao)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===dn?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var Oo=class extends Vt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Ii=class extends Lt{constructor(){super(),this.isGroup=!0,this.type="Group"}},r_={type:"move"},Ls=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ii,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ii,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ii,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let v of e.hand.values()){let f=t.getJointPose(v,i),m=this._getHandJoint(c,v);f!==null&&(m.matrix.fromArray(f.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=f.radius),m.visible=f!==null}let d=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],h=d.position.distanceTo(u.position),p=.02,g=.005;c.inputState.pinching&&h>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(r_)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Ii;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},n_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,s_=`
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

}`,Hc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let r=new qt,s=e.properties.get(r);s.__webglTexture=t.texture,(t.depthNear!=i.depthNear||t.depthFar!=i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new Fi({vertexShader:n_,fragmentShader:s_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new pt(new Vs(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},zc=class extends gr{constructor(e,t){super();let i=this,r=null,s=1,a=null,o="local-floor",l=1,c=null,d=null,u=null,h=null,p=null,g=null,v=new Hc,f=t.getContextAttributes(),m=null,T=null,M=[],S=[],k=new it,R=null,E=new Vt;E.viewport=new ot;let b=new Vt;b.viewport=new ot;let _=[E,b],x=new Oo,C=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(D){let X=M[D];return X===void 0&&(X=new Ls,M[D]=X),X.getTargetRaySpace()},this.getControllerGrip=function(D){let X=M[D];return X===void 0&&(X=new Ls,M[D]=X),X.getGripSpace()},this.getHand=function(D){let X=M[D];return X===void 0&&(X=new Ls,M[D]=X),X.getHandSpace()};function W(D){let X=S.indexOf(D.inputSource);if(X===-1)return;let le=M[X];le!==void 0&&(le.update(D.inputSource,D.frame,c||a),le.dispatchEvent({type:D.type,data:D.inputSource}))}function N(){r.removeEventListener("select",W),r.removeEventListener("selectstart",W),r.removeEventListener("selectend",W),r.removeEventListener("squeeze",W),r.removeEventListener("squeezestart",W),r.removeEventListener("squeezeend",W),r.removeEventListener("end",N),r.removeEventListener("inputsourceschange",P);for(let D=0;D<M.length;D++){let X=S[D];X!==null&&(S[D]=null,M[D].disconnect(X))}C=null,z=null,v.reset(),e.setRenderTarget(m),p=null,h=null,u=null,r=null,T=null,K.stop(),i.isPresenting=!1,e.setPixelRatio(R),e.setSize(k.width,k.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(D){s=D,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(D){o=D,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(D){c=D},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(D){if(r=D,r!==null){if(m=e.getRenderTarget(),r.addEventListener("select",W),r.addEventListener("selectstart",W),r.addEventListener("selectend",W),r.addEventListener("squeeze",W),r.addEventListener("squeezestart",W),r.addEventListener("squeezeend",W),r.addEventListener("end",N),r.addEventListener("inputsourceschange",P),f.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(k),r.renderState.layers===void 0){let X={antialias:f.antialias,alpha:!0,depth:f.depth,stencil:f.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,t,X),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),T=new Yi(p.framebufferWidth,p.framebufferHeight,{format:di,type:Xi,colorSpace:e.outputColorSpace,stencilBuffer:f.stencil})}else{let X=null,le=null,oe=null;f.depth&&(oe=f.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,X=f.stencil?un:sn,le=f.stencil?dn:zr);let ke={colorFormat:t.RGBA8,depthFormat:oe,scaleFactor:s};u=new XRWebGLBinding(r,t),h=u.createProjectionLayer(ke),r.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),T=new Yi(h.textureWidth,h.textureHeight,{format:di,type:Xi,depthTexture:new Gs(h.textureWidth,h.textureHeight,le,void 0,void 0,void 0,void 0,void 0,void 0,X),stencilBuffer:f.stencil,colorSpace:e.outputColorSpace,samples:f.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),K.setContext(r),K.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function P(D){for(let X=0;X<D.removed.length;X++){let le=D.removed[X],oe=S.indexOf(le);oe>=0&&(S[oe]=null,M[oe].disconnect(le))}for(let X=0;X<D.added.length;X++){let le=D.added[X],oe=S.indexOf(le);if(oe===-1){for(let xe=0;xe<M.length;xe++)if(xe>=S.length){S.push(le),oe=xe;break}else if(S[xe]===null){S[xe]=le,oe=xe;break}if(oe===-1)break}let ke=M[oe];ke&&ke.connect(le)}}let L=new G,I=new G;function O(D,X,le){L.setFromMatrixPosition(X.matrixWorld),I.setFromMatrixPosition(le.matrixWorld);let oe=L.distanceTo(I),ke=X.projectionMatrix.elements,xe=le.projectionMatrix.elements,Re=ke[14]/(ke[10]-1),Qe=ke[14]/(ke[10]+1),Ne=(ke[9]+1)/ke[5],bt=(ke[9]-1)/ke[5],V=(ke[8]-1)/ke[0],Pt=(xe[8]+1)/xe[0],Oe=Re*V,je=Re*Pt,we=oe/(-V+Pt),rt=we*-V;if(X.matrixWorld.decompose(D.position,D.quaternion,D.scale),D.translateX(rt),D.translateZ(we),D.matrixWorld.compose(D.position,D.quaternion,D.scale),D.matrixWorldInverse.copy(D.matrixWorld).invert(),ke[10]===-1)D.projectionMatrix.copy(X.projectionMatrix),D.projectionMatrixInverse.copy(X.projectionMatrixInverse);else{let Pe=Re+we,A=Qe+we,y=Oe-rt,$=je+(oe-rt),te=Ne*Qe/A*Pe,se=bt*Qe/A*Pe;D.projectionMatrix.makePerspective(y,$,te,se,Pe,A),D.projectionMatrixInverse.copy(D.projectionMatrix).invert()}}function J(D,X){X===null?D.matrixWorld.copy(D.matrix):D.matrixWorld.multiplyMatrices(X.matrixWorld,D.matrix),D.matrixWorldInverse.copy(D.matrixWorld).invert()}this.updateCamera=function(D){if(r===null)return;let X=D.near,le=D.far;v.texture!==null&&(v.depthNear>0&&(X=v.depthNear),v.depthFar>0&&(le=v.depthFar)),x.near=b.near=E.near=X,x.far=b.far=E.far=le,(C!==x.near||z!==x.far)&&(r.updateRenderState({depthNear:x.near,depthFar:x.far}),C=x.near,z=x.far),E.layers.mask=D.layers.mask|2,b.layers.mask=D.layers.mask|4,x.layers.mask=E.layers.mask|b.layers.mask;let oe=D.parent,ke=x.cameras;J(x,oe);for(let xe=0;xe<ke.length;xe++)J(ke[xe],oe);ke.length===2?O(x,E,b):x.projectionMatrix.copy(E.projectionMatrix),Z(D,x,oe)};function Z(D,X,le){le===null?D.matrix.copy(X.matrixWorld):(D.matrix.copy(le.matrixWorld),D.matrix.invert(),D.matrix.multiply(X.matrixWorld)),D.matrix.decompose(D.position,D.quaternion,D.scale),D.updateMatrixWorld(!0),D.projectionMatrix.copy(X.projectionMatrix),D.projectionMatrixInverse.copy(X.projectionMatrixInverse),D.isPerspectiveCamera&&(D.fov=Gn*2*Math.atan(1/D.projectionMatrix.elements[5]),D.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(h===null&&p===null))return l},this.setFoveation=function(D){l=D,h!==null&&(h.fixedFoveation=D),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=D)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(x)};let re=null;function ae(D,X){if(d=X.getViewerPose(c||a),g=X,d!==null){let le=d.views;p!==null&&(e.setRenderTargetFramebuffer(T,p.framebuffer),e.setRenderTarget(T));let oe=!1;le.length!==x.cameras.length&&(x.cameras.length=0,oe=!0);for(let xe=0;xe<le.length;xe++){let Re=le[xe],Qe=null;if(p!==null)Qe=p.getViewport(Re);else{let bt=u.getViewSubImage(h,Re);Qe=bt.viewport,xe===0&&(e.setRenderTargetTextures(T,bt.colorTexture,h.ignoreDepthValues?void 0:bt.depthStencilTexture),e.setRenderTarget(T))}let Ne=_[xe];Ne===void 0&&(Ne=new Vt,Ne.layers.enable(xe),Ne.viewport=new ot,_[xe]=Ne),Ne.matrix.fromArray(Re.transform.matrix),Ne.matrix.decompose(Ne.position,Ne.quaternion,Ne.scale),Ne.projectionMatrix.fromArray(Re.projectionMatrix),Ne.projectionMatrixInverse.copy(Ne.projectionMatrix).invert(),Ne.viewport.set(Qe.x,Qe.y,Qe.width,Qe.height),xe===0&&(x.matrix.copy(Ne.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),oe===!0&&x.cameras.push(Ne)}let ke=r.enabledFeatures;if(ke&&ke.includes("depth-sensing")){let xe=u.getDepthInformation(le[0]);xe&&xe.isValid&&xe.texture&&v.init(e,xe,r.renderState)}}for(let le=0;le<M.length;le++){let oe=S[le],ke=M[le];oe!==null&&ke!==void 0&&ke.update(oe,X,c||a)}re&&re(D,X),X.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:X}),g=null}let K=new Vp;K.setAnimationLoop(ae),this.setAnimationLoop=function(D){re=D},this.dispose=function(){}}},Jr=new Ni,a_=new We;function o_(n,e){function t(f,m){f.matrixAutoUpdate===!0&&f.updateMatrix(),m.value.copy(f.matrix)}function i(f,m){m.color.getRGB(f.fogColor.value,Hp(n)),m.isFog?(f.fogNear.value=m.near,f.fogFar.value=m.far):m.isFogExp2&&(f.fogDensity.value=m.density)}function r(f,m,T,M,S){m.isMeshBasicMaterial||m.isMeshLambertMaterial?s(f,m):m.isMeshToonMaterial?(s(f,m),u(f,m)):m.isMeshPhongMaterial?(s(f,m),d(f,m)):m.isMeshStandardMaterial?(s(f,m),h(f,m),m.isMeshPhysicalMaterial&&p(f,m,S)):m.isMeshMatcapMaterial?(s(f,m),g(f,m)):m.isMeshDepthMaterial?s(f,m):m.isMeshDistanceMaterial?(s(f,m),v(f,m)):m.isMeshNormalMaterial?s(f,m):m.isLineBasicMaterial?(a(f,m),m.isLineDashedMaterial&&o(f,m)):m.isPointsMaterial?l(f,m,T,M):m.isSpriteMaterial?c(f,m):m.isShadowMaterial?(f.color.value.copy(m.color),f.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(f,m){f.opacity.value=m.opacity,m.color&&f.diffuse.value.copy(m.color),m.emissive&&f.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(f.map.value=m.map,t(m.map,f.mapTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,t(m.alphaMap,f.alphaMapTransform)),m.bumpMap&&(f.bumpMap.value=m.bumpMap,t(m.bumpMap,f.bumpMapTransform),f.bumpScale.value=m.bumpScale,m.side===Zt&&(f.bumpScale.value*=-1)),m.normalMap&&(f.normalMap.value=m.normalMap,t(m.normalMap,f.normalMapTransform),f.normalScale.value.copy(m.normalScale),m.side===Zt&&f.normalScale.value.negate()),m.displacementMap&&(f.displacementMap.value=m.displacementMap,t(m.displacementMap,f.displacementMapTransform),f.displacementScale.value=m.displacementScale,f.displacementBias.value=m.displacementBias),m.emissiveMap&&(f.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,f.emissiveMapTransform)),m.specularMap&&(f.specularMap.value=m.specularMap,t(m.specularMap,f.specularMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest);let T=e.get(m),M=T.envMap,S=T.envMapRotation;M&&(f.envMap.value=M,Jr.copy(S),Jr.x*=-1,Jr.y*=-1,Jr.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(Jr.y*=-1,Jr.z*=-1),f.envMapRotation.value.setFromMatrix4(a_.makeRotationFromEuler(Jr)),f.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=m.reflectivity,f.ior.value=m.ior,f.refractionRatio.value=m.refractionRatio),m.lightMap&&(f.lightMap.value=m.lightMap,f.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,f.lightMapTransform)),m.aoMap&&(f.aoMap.value=m.aoMap,f.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,f.aoMapTransform))}function a(f,m){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,m.map&&(f.map.value=m.map,t(m.map,f.mapTransform))}function o(f,m){f.dashSize.value=m.dashSize,f.totalSize.value=m.dashSize+m.gapSize,f.scale.value=m.scale}function l(f,m,T,M){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,f.size.value=m.size*T,f.scale.value=M*.5,m.map&&(f.map.value=m.map,t(m.map,f.uvTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,t(m.alphaMap,f.alphaMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest)}function c(f,m){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,f.rotation.value=m.rotation,m.map&&(f.map.value=m.map,t(m.map,f.mapTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,t(m.alphaMap,f.alphaMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest)}function d(f,m){f.specular.value.copy(m.specular),f.shininess.value=Math.max(m.shininess,1e-4)}function u(f,m){m.gradientMap&&(f.gradientMap.value=m.gradientMap)}function h(f,m){f.metalness.value=m.metalness,m.metalnessMap&&(f.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,f.metalnessMapTransform)),f.roughness.value=m.roughness,m.roughnessMap&&(f.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,f.roughnessMapTransform)),m.envMap&&(f.envMapIntensity.value=m.envMapIntensity)}function p(f,m,T){f.ior.value=m.ior,m.sheen>0&&(f.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),f.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(f.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,f.sheenColorMapTransform)),m.sheenRoughnessMap&&(f.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,f.sheenRoughnessMapTransform))),m.clearcoat>0&&(f.clearcoat.value=m.clearcoat,f.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(f.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,f.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(f.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Zt&&f.clearcoatNormalScale.value.negate())),m.dispersion>0&&(f.dispersion.value=m.dispersion),m.iridescence>0&&(f.iridescence.value=m.iridescence,f.iridescenceIOR.value=m.iridescenceIOR,f.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(f.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,f.iridescenceMapTransform)),m.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),m.transmission>0&&(f.transmission.value=m.transmission,f.transmissionSamplerMap.value=T.texture,f.transmissionSamplerSize.value.set(T.width,T.height),m.transmissionMap&&(f.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,f.transmissionMapTransform)),f.thickness.value=m.thickness,m.thicknessMap&&(f.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=m.attenuationDistance,f.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(f.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(f.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=m.specularIntensity,f.specularColor.value.copy(m.specularColor),m.specularColorMap&&(f.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,f.specularColorMapTransform)),m.specularIntensityMap&&(f.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,m){m.matcap&&(f.matcap.value=m.matcap)}function v(f,m){let T=e.get(m).light;f.referencePosition.value.setFromMatrixPosition(T.matrixWorld),f.nearDistance.value=T.shadow.camera.near,f.farDistance.value=T.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function l_(n,e,t,i){let r={},s={},a=[],o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(T,M){let S=M.program;i.uniformBlockBinding(T,S)}function c(T,M){let S=r[T.id];S===void 0&&(g(T),S=d(T),r[T.id]=S,T.addEventListener("dispose",f));let k=M.program;i.updateUBOMapping(T,k);let R=e.render.frame;s[T.id]!==R&&(h(T),s[T.id]=R)}function d(T){let M=u();T.__bindingPointIndex=M;let S=n.createBuffer(),k=T.__size,R=T.usage;return n.bindBuffer(n.UNIFORM_BUFFER,S),n.bufferData(n.UNIFORM_BUFFER,k,R),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,M,S),S}function u(){for(let T=0;T<o;T++)if(a.indexOf(T)===-1)return a.push(T),T;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(T){let M=r[T.id],S=T.uniforms,k=T.__cache;n.bindBuffer(n.UNIFORM_BUFFER,M);for(let R=0,E=S.length;R<E;R++){let b=Array.isArray(S[R])?S[R]:[S[R]];for(let _=0,x=b.length;_<x;_++){let C=b[_];if(p(C,R,_,k)===!0){let z=C.__offset,W=Array.isArray(C.value)?C.value:[C.value],N=0;for(let P=0;P<W.length;P++){let L=W[P],I=v(L);typeof L=="number"||typeof L=="boolean"?(C.__data[0]=L,n.bufferSubData(n.UNIFORM_BUFFER,z+N,C.__data)):L.isMatrix3?(C.__data[0]=L.elements[0],C.__data[1]=L.elements[1],C.__data[2]=L.elements[2],C.__data[3]=0,C.__data[4]=L.elements[3],C.__data[5]=L.elements[4],C.__data[6]=L.elements[5],C.__data[7]=0,C.__data[8]=L.elements[6],C.__data[9]=L.elements[7],C.__data[10]=L.elements[8],C.__data[11]=0):(L.toArray(C.__data,N),N+=I.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,z,C.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(T,M,S,k){let R=T.value,E=M+"_"+S;if(k[E]===void 0)return typeof R=="number"||typeof R=="boolean"?k[E]=R:k[E]=R.clone(),!0;{let b=k[E];if(typeof R=="number"||typeof R=="boolean"){if(b!==R)return k[E]=R,!0}else if(b.equals(R)===!1)return b.copy(R),!0}return!1}function g(T){let M=T.uniforms,S=0,k=16;for(let E=0,b=M.length;E<b;E++){let _=Array.isArray(M[E])?M[E]:[M[E]];for(let x=0,C=_.length;x<C;x++){let z=_[x],W=Array.isArray(z.value)?z.value:[z.value];for(let N=0,P=W.length;N<P;N++){let L=W[N],I=v(L),O=S%k,J=O%I.boundary,Z=O+J;S+=J,Z!==0&&k-Z<I.storage&&(S+=k-Z),z.__data=new Float32Array(I.storage/Float32Array.BYTES_PER_ELEMENT),z.__offset=S,S+=I.storage}}}let R=S%k;return R>0&&(S+=k-R),T.__size=S,T.__cache={},this}function v(T){let M={boundary:0,storage:0};return typeof T=="number"||typeof T=="boolean"?(M.boundary=4,M.storage=4):T.isVector2?(M.boundary=8,M.storage=8):T.isVector3||T.isColor?(M.boundary=16,M.storage=12):T.isVector4?(M.boundary=16,M.storage=16):T.isMatrix3?(M.boundary=48,M.storage=48):T.isMatrix4?(M.boundary=64,M.storage=64):T.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",T),M}function f(T){let M=T.target;M.removeEventListener("dispose",f);let S=a.indexOf(M.__bindingPointIndex);a.splice(S,1),n.deleteBuffer(r[M.id]),delete r[M.id],delete s[M.id]}function m(){for(let T in r)n.deleteBuffer(r[T]);a=[],r={},s={}}return{bind:l,update:c,dispose:m}}var Fo=class{constructor(e={}){let{canvas:t=Fp(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=a;let g=new Uint32Array(4),v=new Int32Array(4),f=null,m=null,T=[],M=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=zt,this.toneMapping=mr,this.toneMappingExposure=1;let S=this,k=!1,R=0,E=0,b=null,_=-1,x=null,C=new ot,z=new ot,W=null,N=new ze(0),P=0,L=t.width,I=t.height,O=1,J=null,Z=null,re=new ot(0,0,L,I),ae=new ot(0,0,L,I),K=!1,D=new Wn,X=!1,le=!1,oe=new We,ke=new We,xe=new G,Re=new ot,Qe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ne=!1;function bt(){return b===null?O:1}let V=i;function Pt(w,H){return t.getContext(w,H)}try{let w={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${hl}`),t.addEventListener("webglcontextlost",ne,!1),t.addEventListener("webglcontextrestored",fe,!1),t.addEventListener("webglcontextcreationerror",ue,!1),V===null){let H="webgl2";if(V=Pt(H,w),V===null)throw Pt(H)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let Oe,je,we,rt,Pe,A,y,$,te,se,ie,Ae,he,_e,Ye,de,ye,De,Ue,Se,Ke,Ve,et,B;function me(){Oe=new Tv(V),Oe.init(),Ve=new qp(V,Oe),je=new _v(V,Oe,e,Ve),we=new e_(V,Oe),je.reverseDepthBuffer&&h&&we.buffers.depth.setReversed(!0),rt=new Rv(V),Pe=new zx,A=new i_(V,Oe,we,Pe,je,Ve,rt),y=new bv(S),$=new Mv(S),te=new Uf(V),et=new vv(V,te),se=new Ev(V,te,rt,et),ie=new Lv(V,se,te,rt),Ue=new Cv(V,je,A),de=new yv(Pe),Ae=new Hx(S,y,$,Oe,je,et,de),he=new o_(S,Pe),_e=new Gx,Ye=new Yx(Oe),De=new gv(S,y,$,we,ie,p,l),ye=new Jx(S,ie,je),B=new l_(V,rt,je,we),Se=new xv(V,Oe,rt),Ke=new Av(V,Oe,rt),rt.programs=Ae.programs,S.capabilities=je,S.extensions=Oe,S.properties=Pe,S.renderLists=_e,S.shadowMap=ye,S.state=we,S.info=rt}me();let Y=new zc(S,V);this.xr=Y,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){let w=Oe.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){let w=Oe.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return O},this.setPixelRatio=function(w){w!==void 0&&(O=w,this.setSize(L,I,!1))},this.getSize=function(w){return w.set(L,I)},this.setSize=function(w,H,j=!0){if(Y.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}L=w,I=H,t.width=Math.floor(w*O),t.height=Math.floor(H*O),j===!0&&(t.style.width=w+"px",t.style.height=H+"px"),this.setViewport(0,0,w,H)},this.getDrawingBufferSize=function(w){return w.set(L*O,I*O).floor()},this.setDrawingBufferSize=function(w,H,j){L=w,I=H,O=j,t.width=Math.floor(w*j),t.height=Math.floor(H*j),this.setViewport(0,0,w,H)},this.getCurrentViewport=function(w){return w.copy(C)},this.getViewport=function(w){return w.copy(re)},this.setViewport=function(w,H,j,q){w.isVector4?re.set(w.x,w.y,w.z,w.w):re.set(w,H,j,q),we.viewport(C.copy(re).multiplyScalar(O).round())},this.getScissor=function(w){return w.copy(ae)},this.setScissor=function(w,H,j,q){w.isVector4?ae.set(w.x,w.y,w.z,w.w):ae.set(w,H,j,q),we.scissor(z.copy(ae).multiplyScalar(O).round())},this.getScissorTest=function(){return K},this.setScissorTest=function(w){we.setScissorTest(K=w)},this.setOpaqueSort=function(w){J=w},this.setTransparentSort=function(w){Z=w},this.getClearColor=function(w){return w.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor.apply(De,arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha.apply(De,arguments)},this.clear=function(w=!0,H=!0,j=!0){let q=0;if(w){let F=!1;if(b!==null){let ce=b.texture.format;F=ce===_l||ce===xl||ce===vl}if(F){let ce=b.texture.type,ve=ce===Xi||ce===zr||ce===Hn||ce===dn||ce===ml||ce===fl,Me=De.getClearColor(),Te=De.getClearAlpha(),Be=Me.r,He=Me.g,Ce=Me.b;ve?(g[0]=Be,g[1]=He,g[2]=Ce,g[3]=Te,V.clearBufferuiv(V.COLOR,0,g)):(v[0]=Be,v[1]=He,v[2]=Ce,v[3]=Te,V.clearBufferiv(V.COLOR,0,v))}else q|=V.COLOR_BUFFER_BIT}H&&(q|=V.DEPTH_BUFFER_BIT),j&&(q|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),V.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ne,!1),t.removeEventListener("webglcontextrestored",fe,!1),t.removeEventListener("webglcontextcreationerror",ue,!1),_e.dispose(),Ye.dispose(),Pe.dispose(),y.dispose(),$.dispose(),ie.dispose(),et.dispose(),B.dispose(),Ae.dispose(),Y.dispose(),Y.removeEventListener("sessionstart",wr),Y.removeEventListener("sessionend",is),gi.stop()};function ne(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),k=!0}function fe(){console.log("THREE.WebGLRenderer: Context Restored."),k=!1;let w=rt.autoReset,H=ye.enabled,j=ye.autoUpdate,q=ye.needsUpdate,F=ye.type;me(),rt.autoReset=w,ye.enabled=H,ye.autoUpdate=j,ye.needsUpdate=q,ye.type=F}function ue(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function qe(w){let H=w.target;H.removeEventListener("dispose",qe),vt(H)}function vt(w){wt(w),Pe.remove(w)}function wt(w){let H=Pe.get(w).programs;H!==void 0&&(H.forEach(function(j){Ae.releaseProgram(j)}),w.isShaderMaterial&&Ae.releaseShaderCache(w))}this.renderBufferDirect=function(w,H,j,q,F,ce){H===null&&(H=Qe);let ve=F.isMesh&&F.matrixWorld.determinant()<0,Me=$t(w,H,j,q,F);we.setMaterial(q,ve);let Te=j.index,Be=1;if(q.wireframe===!0){if(Te=se.getWireframeAttribute(j),Te===void 0)return;Be=2}let He=j.drawRange,Ce=j.attributes.position,st=He.start*Be,mt=(He.start+He.count)*Be;ce!==null&&(st=Math.max(st,ce.start*Be),mt=Math.min(mt,(ce.start+ce.count)*Be)),Te!==null?(st=Math.max(st,0),mt=Math.min(mt,Te.count)):Ce!=null&&(st=Math.max(st,0),mt=Math.min(mt,Ce.count));let ft=mt-st;if(ft<0||ft===1/0)return;et.setup(F,q,Me,j,Te);let Et,lt=Se;if(Te!==null&&(Et=te.get(Te),lt=Ke,lt.setIndex(Et)),F.isMesh)q.wireframe===!0?(we.setLineWidth(q.wireframeLinewidth*bt()),lt.setMode(V.LINES)):lt.setMode(V.TRIANGLES);else if(F.isLine){let Ee=q.linewidth;Ee===void 0&&(Ee=1),we.setLineWidth(Ee*bt()),F.isLineSegments?lt.setMode(V.LINES):F.isLineLoop?lt.setMode(V.LINE_LOOP):lt.setMode(V.LINE_STRIP)}else F.isPoints?lt.setMode(V.POINTS):F.isSprite&&lt.setMode(V.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)lt.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(Oe.get("WEBGL_multi_draw"))lt.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{let Ee=F._multiDrawStarts,Zi=F._multiDrawCounts,wi=F._multiDrawCount,Ut=Te?te.get(Te).bytesPerElement:1,Ji=Pe.get(q).currentProgram.getUniforms();for(let ei=0;ei<wi;ei++)Ji.setValue(V,"_gl_DrawID",ei),lt.render(Ee[ei]/Ut,Zi[ei])}else if(F.isInstancedMesh)lt.renderInstances(st,ft,F.count);else if(j.isInstancedBufferGeometry){let Ee=j._maxInstanceCount!==void 0?j._maxInstanceCount:1/0,Zi=Math.min(j.instanceCount,Ee);lt.renderInstances(st,ft,Zi)}else lt.render(st,ft)};function nt(w,H,j){w.transparent===!0&&w.side===Ci&&w.forceSinglePass===!1?(w.side=Zt,w.needsUpdate=!0,Wr(w,H,j),w.side=qi,w.needsUpdate=!0,Wr(w,H,j),w.side=Ci):Wr(w,H,j)}this.compile=function(w,H,j=null){j===null&&(j=w),m=Ye.get(j),m.init(H),M.push(m),j.traverseVisible(function(F){F.isLight&&F.layers.test(H.layers)&&(m.pushLight(F),F.castShadow&&m.pushShadow(F))}),w!==j&&w.traverseVisible(function(F){F.isLight&&F.layers.test(H.layers)&&(m.pushLight(F),F.castShadow&&m.pushShadow(F))}),m.setupLights();let q=new Set;return w.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;let ce=F.material;if(ce)if(Array.isArray(ce))for(let ve=0;ve<ce.length;ve++){let Me=ce[ve];nt(Me,j,F),q.add(Me)}else nt(ce,j,F),q.add(ce)}),M.pop(),m=null,q},this.compileAsync=function(w,H,j=null){let q=this.compile(w,H,j);return new Promise(F=>{function ce(){if(q.forEach(function(ve){Pe.get(ve).currentProgram.isReady()&&q.delete(ve)}),q.size===0){F(w);return}setTimeout(ce,10)}Oe.get("KHR_parallel_shader_compile")!==null?ce():setTimeout(ce,10)})};let ri=null;function fi(w){ri&&ri(w)}function wr(){gi.stop()}function is(){gi.start()}let gi=new Vp;gi.setAnimationLoop(fi),typeof self<"u"&&gi.setContext(self),this.setAnimationLoop=function(w){ri=w,Y.setAnimationLoop(w),w===null?gi.stop():gi.start()},Y.addEventListener("sessionstart",wr),Y.addEventListener("sessionend",is),this.render=function(w,H){if(H!==void 0&&H.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(k===!0)return;if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),H.parent===null&&H.matrixWorldAutoUpdate===!0&&H.updateMatrixWorld(),Y.enabled===!0&&Y.isPresenting===!0&&(Y.cameraAutoUpdate===!0&&Y.updateCamera(H),H=Y.getCamera()),w.isScene===!0&&w.onBeforeRender(S,w,H,b),m=Ye.get(w,M.length),m.init(H),M.push(m),ke.multiplyMatrices(H.projectionMatrix,H.matrixWorldInverse),D.setFromProjectionMatrix(ke),le=this.localClippingEnabled,X=de.init(this.clippingPlanes,le),f=_e.get(w,T.length),f.init(),T.push(f),Y.enabled===!0&&Y.isPresenting===!0){let ce=S.xr.getDepthSensingMesh();ce!==null&&Mr(ce,H,-1/0,S.sortObjects)}Mr(w,H,0,S.sortObjects),f.finish(),S.sortObjects===!0&&f.sort(J,Z),Ne=Y.enabled===!1||Y.isPresenting===!1||Y.hasDepthSensing()===!1,Ne&&De.addToRenderList(f,w),this.info.render.frame++,X===!0&&de.beginShadows();let j=m.state.shadowsArray;ye.render(j,w,H),X===!0&&de.endShadows(),this.info.autoReset===!0&&this.info.reset();let q=f.opaque,F=f.transmissive;if(m.setupLights(),H.isArrayCamera){let ce=H.cameras;if(F.length>0)for(let ve=0,Me=ce.length;ve<Me;ve++){let Te=ce[ve];ra(q,F,w,Te)}Ne&&De.render(w);for(let ve=0,Me=ce.length;ve<Me;ve++){let Te=ce[ve];Bi(f,w,Te,Te.viewport)}}else F.length>0&&ra(q,F,w,H),Ne&&De.render(w),Bi(f,w,H);b!==null&&(A.updateMultisampleRenderTarget(b),A.updateRenderTargetMipmap(b)),w.isScene===!0&&w.onAfterRender(S,w,H),et.resetDefaultState(),_=-1,x=null,M.pop(),M.length>0?(m=M[M.length-1],X===!0&&de.setGlobalState(S.clippingPlanes,m.state.camera)):m=null,T.pop(),T.length>0?f=T[T.length-1]:f=null};function Mr(w,H,j,q){if(w.visible===!1)return;if(w.layers.test(H.layers)){if(w.isGroup)j=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(H);else if(w.isLight)m.pushLight(w),w.castShadow&&m.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||D.intersectsSprite(w)){q&&Re.setFromMatrixPosition(w.matrixWorld).applyMatrix4(ke);let ce=ie.update(w),ve=w.material;ve.visible&&f.push(w,ce,ve,j,Re.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||D.intersectsObject(w))){let ce=ie.update(w),ve=w.material;if(q&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),Re.copy(w.boundingSphere.center)):(ce.boundingSphere===null&&ce.computeBoundingSphere(),Re.copy(ce.boundingSphere.center)),Re.applyMatrix4(w.matrixWorld).applyMatrix4(ke)),Array.isArray(ve)){let Me=ce.groups;for(let Te=0,Be=Me.length;Te<Be;Te++){let He=Me[Te],Ce=ve[He.materialIndex];Ce&&Ce.visible&&f.push(w,ce,Ce,j,Re.z,He)}}else ve.visible&&f.push(w,ce,ve,j,Re.z,null)}}let F=w.children;for(let ce=0,ve=F.length;ce<ve;ce++)Mr(F[ce],H,j,q)}function Bi(w,H,j,q){let F=w.opaque,ce=w.transmissive,ve=w.transparent;m.setupLightsView(j),X===!0&&de.setGlobalState(S.clippingPlanes,j),q&&we.viewport(C.copy(q)),F.length>0&&$r(F,H,j),ce.length>0&&$r(ce,H,j),ve.length>0&&$r(ve,H,j),we.buffers.depth.setTest(!0),we.buffers.depth.setMask(!0),we.buffers.color.setMask(!0),we.setPolygonOffset(!1)}function ra(w,H,j,q){if((j.isScene===!0?j.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[q.id]===void 0&&(m.state.transmissionRenderTarget[q.id]=new Yi(1,1,{generateMipmaps:!0,type:Oe.has("EXT_color_buffer_half_float")||Oe.has("EXT_color_buffer_float")?es:Xi,minFilter:Wi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:tt.workingColorSpace}));let F=m.state.transmissionRenderTarget[q.id],ce=q.viewport||C;F.setSize(ce.z,ce.w);let ve=S.getRenderTarget();S.setRenderTarget(F),S.getClearColor(N),P=S.getClearAlpha(),P<1&&S.setClearColor(16777215,.5),S.clear(),Ne&&De.render(j);let Me=S.toneMapping;S.toneMapping=mr;let Te=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),m.setupLightsView(q),X===!0&&de.setGlobalState(S.clippingPlanes,q),$r(w,j,q),A.updateMultisampleRenderTarget(F),A.updateRenderTargetMipmap(F),Oe.has("WEBGL_multisampled_render_to_texture")===!1){let Be=!1;for(let He=0,Ce=H.length;He<Ce;He++){let st=H[He],mt=st.object,ft=st.geometry,Et=st.material,lt=st.group;if(Et.side===Ci&&mt.layers.test(q.layers)){let Ee=Et.side;Et.side=Zt,Et.needsUpdate=!0,ai(mt,j,q,ft,Et,lt),Et.side=Ee,Et.needsUpdate=!0,Be=!0}}Be===!0&&(A.updateMultisampleRenderTarget(F),A.updateRenderTargetMipmap(F))}S.setRenderTarget(ve),S.setClearColor(N,P),Te!==void 0&&(q.viewport=Te),S.toneMapping=Me}function $r(w,H,j){let q=H.isScene===!0?H.overrideMaterial:null;for(let F=0,ce=w.length;F<ce;F++){let ve=w[F],Me=ve.object,Te=ve.geometry,Be=q===null?ve.material:q,He=ve.group;Me.layers.test(j.layers)&&ai(Me,H,j,Te,Be,He)}}function ai(w,H,j,q,F,ce){w.onBeforeRender(S,H,j,q,F,ce),w.modelViewMatrix.multiplyMatrices(j.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),F.onBeforeRender(S,H,j,q,w,ce),F.transparent===!0&&F.side===Ci&&F.forceSinglePass===!1?(F.side=Zt,F.needsUpdate=!0,S.renderBufferDirect(j,H,q,F,w,ce),F.side=qi,F.needsUpdate=!0,S.renderBufferDirect(j,H,q,F,w,ce),F.side=Ci):S.renderBufferDirect(j,H,q,F,w,ce),w.onAfterRender(S,H,j,q,F,ce)}function Wr(w,H,j){H.isScene!==!0&&(H=Qe);let q=Pe.get(w),F=m.state.lights,ce=m.state.shadowsArray,ve=F.state.version,Me=Ae.getParameters(w,F.state,ce,H,j),Te=Ae.getProgramCacheKey(Me),Be=q.programs;q.environment=w.isMeshStandardMaterial?H.environment:null,q.fog=H.fog,q.envMap=(w.isMeshStandardMaterial?$:y).get(w.envMap||q.environment),q.envMapRotation=q.environment!==null&&w.envMap===null?H.environmentRotation:w.envMapRotation,Be===void 0&&(w.addEventListener("dispose",qe),Be=new Map,q.programs=Be);let He=Be.get(Te);if(He!==void 0){if(q.currentProgram===He&&q.lightsStateVersion===ve)return Ki(w,Me),He}else Me.uniforms=Ae.getUniforms(w),w.onBeforeCompile(Me,S),He=Ae.acquireProgram(Me,Te),Be.set(Te,He),q.uniforms=Me.uniforms;let Ce=q.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(Ce.clippingPlanes=de.uniform),Ki(w,Me),q.needsLights=Tr(w),q.lightsStateVersion=ve,q.needsLights&&(Ce.ambientLightColor.value=F.state.ambient,Ce.lightProbe.value=F.state.probe,Ce.directionalLights.value=F.state.directional,Ce.directionalLightShadows.value=F.state.directionalShadow,Ce.spotLights.value=F.state.spot,Ce.spotLightShadows.value=F.state.spotShadow,Ce.rectAreaLights.value=F.state.rectArea,Ce.ltc_1.value=F.state.rectAreaLTC1,Ce.ltc_2.value=F.state.rectAreaLTC2,Ce.pointLights.value=F.state.point,Ce.pointLightShadows.value=F.state.pointShadow,Ce.hemisphereLights.value=F.state.hemi,Ce.directionalShadowMap.value=F.state.directionalShadowMap,Ce.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Ce.spotShadowMap.value=F.state.spotShadowMap,Ce.spotLightMatrix.value=F.state.spotLightMatrix,Ce.spotLightMap.value=F.state.spotLightMap,Ce.pointShadowMap.value=F.state.pointShadowMap,Ce.pointShadowMatrix.value=F.state.pointShadowMatrix),q.currentProgram=He,q.uniformsList=null,He}function rs(w){if(w.uniformsList===null){let H=w.currentProgram.getUniforms();w.uniformsList=Fn.seqWithValue(H.seq,w.uniforms)}return w.uniformsList}function Ki(w,H){let j=Pe.get(w);j.outputColorSpace=H.outputColorSpace,j.batching=H.batching,j.batchingColor=H.batchingColor,j.instancing=H.instancing,j.instancingColor=H.instancingColor,j.instancingMorph=H.instancingMorph,j.skinning=H.skinning,j.morphTargets=H.morphTargets,j.morphNormals=H.morphNormals,j.morphColors=H.morphColors,j.morphTargetsCount=H.morphTargetsCount,j.numClippingPlanes=H.numClippingPlanes,j.numIntersection=H.numClipIntersection,j.vertexAlphas=H.vertexAlphas,j.vertexTangents=H.vertexTangents,j.toneMapping=H.toneMapping}function $t(w,H,j,q,F){H.isScene!==!0&&(H=Qe),A.resetTextureUnits();let ce=H.fog,ve=q.isMeshStandardMaterial?H.environment:null,Me=b===null?S.outputColorSpace:b.isXRRenderTarget===!0?b.texture.colorSpace:Qt,Te=(q.isMeshStandardMaterial?$:y).get(q.envMap||ve),Be=q.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,He=!!j.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),Ce=!!j.morphAttributes.position,st=!!j.morphAttributes.normal,mt=!!j.morphAttributes.color,ft=mr;q.toneMapped&&(b===null||b.isXRRenderTarget===!0)&&(ft=S.toneMapping);let Et=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,lt=Et!==void 0?Et.length:0,Ee=Pe.get(q),Zi=m.state.lights;if(X===!0&&(le===!0||w!==x)){let Wt=w===x&&q.id===_;de.setState(q,w,Wt)}let wi=!1;q.version===Ee.__version?(Ee.needsLights&&Ee.lightsStateVersion!==Zi.state.version||Ee.outputColorSpace!==Me||F.isBatchedMesh&&Ee.batching===!1||!F.isBatchedMesh&&Ee.batching===!0||F.isBatchedMesh&&Ee.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&Ee.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&Ee.instancing===!1||!F.isInstancedMesh&&Ee.instancing===!0||F.isSkinnedMesh&&Ee.skinning===!1||!F.isSkinnedMesh&&Ee.skinning===!0||F.isInstancedMesh&&Ee.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Ee.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&Ee.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&Ee.instancingMorph===!1&&F.morphTexture!==null||Ee.envMap!==Te||q.fog===!0&&Ee.fog!==ce||Ee.numClippingPlanes!==void 0&&(Ee.numClippingPlanes!==de.numPlanes||Ee.numIntersection!==de.numIntersection)||Ee.vertexAlphas!==Be||Ee.vertexTangents!==He||Ee.morphTargets!==Ce||Ee.morphNormals!==st||Ee.morphColors!==mt||Ee.toneMapping!==ft||Ee.morphTargetsCount!==lt)&&(wi=!0):(wi=!0,Ee.__version=q.version);let Ut=Ee.currentProgram;wi===!0&&(Ut=Wr(q,H,F));let Ji=!1,ei=!1,jr=!1,ct=Ut.getUniforms(),At=Ee.uniforms;if(we.useProgram(Ut.program)&&(Ji=!0,ei=!0,jr=!0),q.id!==_&&(_=q.id,ei=!0),Ji||x!==w){we.buffers.depth.getReversed()?(oe.copy(w.projectionMatrix),gf(oe),vf(oe),ct.setValue(V,"projectionMatrix",oe)):ct.setValue(V,"projectionMatrix",w.projectionMatrix),ct.setValue(V,"viewMatrix",w.matrixWorldInverse);let Wt=ct.map.cameraPosition;Wt!==void 0&&Wt.setValue(V,xe.setFromMatrixPosition(w.matrixWorld)),je.logarithmicDepthBuffer&&ct.setValue(V,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&ct.setValue(V,"isOrthographic",w.isOrthographicCamera===!0),x!==w&&(x=w,ei=!0,jr=!0)}if(F.isSkinnedMesh){ct.setOptional(V,F,"bindMatrix"),ct.setOptional(V,F,"bindMatrixInverse");let Wt=F.skeleton;Wt&&(Wt.boneTexture===null&&Wt.computeBoneTexture(),ct.setValue(V,"boneTexture",Wt.boneTexture,A))}F.isBatchedMesh&&(ct.setOptional(V,F,"batchingTexture"),ct.setValue(V,"batchingTexture",F._matricesTexture,A),ct.setOptional(V,F,"batchingIdTexture"),ct.setValue(V,"batchingIdTexture",F._indirectTexture,A),ct.setOptional(V,F,"batchingColorTexture"),F._colorsTexture!==null&&ct.setValue(V,"batchingColorTexture",F._colorsTexture,A));let Mi=j.morphAttributes;if((Mi.position!==void 0||Mi.normal!==void 0||Mi.color!==void 0)&&Ue.update(F,j,Ut),(ei||Ee.receiveShadow!==F.receiveShadow)&&(Ee.receiveShadow=F.receiveShadow,ct.setValue(V,"receiveShadow",F.receiveShadow)),q.isMeshGouraudMaterial&&q.envMap!==null&&(At.envMap.value=Te,At.flipEnvMap.value=Te.isCubeTexture&&Te.isRenderTargetTexture===!1?-1:1),q.isMeshStandardMaterial&&q.envMap===null&&H.environment!==null&&(At.envMapIntensity.value=H.environmentIntensity),ei&&(ct.setValue(V,"toneMappingExposure",S.toneMappingExposure),Ee.needsLights&&na(At,jr),ce&&q.fog===!0&&he.refreshFogUniforms(At,ce),he.refreshMaterialUniforms(At,q,O,I,m.state.transmissionRenderTarget[w.id]),Fn.upload(V,rs(Ee),At,A)),q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(Fn.upload(V,rs(Ee),At,A),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&ct.setValue(V,"center",F.center),ct.setValue(V,"modelViewMatrix",F.modelViewMatrix),ct.setValue(V,"normalMatrix",F.normalMatrix),ct.setValue(V,"modelMatrix",F.matrixWorld),q.isShaderMaterial||q.isRawShaderMaterial){let Wt=q.uniformsGroups;for(let Er=0,ni=Wt.length;Er<ni;Er++){let ns=Wt[Er];B.update(ns,Ut),B.bind(ns,Ut)}}return Ut}function na(w,H){w.ambientLightColor.needsUpdate=H,w.lightProbe.needsUpdate=H,w.directionalLights.needsUpdate=H,w.directionalLightShadows.needsUpdate=H,w.pointLights.needsUpdate=H,w.pointLightShadows.needsUpdate=H,w.spotLights.needsUpdate=H,w.spotLightShadows.needsUpdate=H,w.rectAreaLights.needsUpdate=H,w.hemisphereLights.needsUpdate=H}function Tr(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return E},this.getRenderTarget=function(){return b},this.setRenderTargetTextures=function(w,H,j){Pe.get(w.texture).__webglTexture=H,Pe.get(w.depthTexture).__webglTexture=j;let q=Pe.get(w);q.__hasExternalTextures=!0,q.__autoAllocateDepthBuffer=j===void 0,q.__autoAllocateDepthBuffer||Oe.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),q.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(w,H){let j=Pe.get(w);j.__webglFramebuffer=H,j.__useDefaultFramebuffer=H===void 0},this.setRenderTarget=function(w,H=0,j=0){b=w,R=H,E=j;let q=!0,F=null,ce=!1,ve=!1;if(w){let Me=Pe.get(w);if(Me.__useDefaultFramebuffer!==void 0)we.bindFramebuffer(V.FRAMEBUFFER,null),q=!1;else if(Me.__webglFramebuffer===void 0)A.setupRenderTarget(w);else if(Me.__hasExternalTextures)A.rebindTextures(w,Pe.get(w.texture).__webglTexture,Pe.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){let He=w.depthTexture;if(Me.__boundDepthTexture!==He){if(He!==null&&Pe.has(He)&&(w.width!==He.image.width||w.height!==He.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");A.setupDepthRenderbuffer(w)}}let Te=w.texture;(Te.isData3DTexture||Te.isDataArrayTexture||Te.isCompressedArrayTexture)&&(ve=!0);let Be=Pe.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(Be[H])?F=Be[H][j]:F=Be[H],ce=!0):w.samples>0&&A.useMultisampledRTT(w)===!1?F=Pe.get(w).__webglMultisampledFramebuffer:Array.isArray(Be)?F=Be[j]:F=Be,C.copy(w.viewport),z.copy(w.scissor),W=w.scissorTest}else C.copy(re).multiplyScalar(O).floor(),z.copy(ae).multiplyScalar(O).floor(),W=K;if(we.bindFramebuffer(V.FRAMEBUFFER,F)&&q&&we.drawBuffers(w,F),we.viewport(C),we.scissor(z),we.setScissorTest(W),ce){let Me=Pe.get(w.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+H,Me.__webglTexture,j)}else if(ve){let Me=Pe.get(w.texture),Te=H||0;V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,Me.__webglTexture,j||0,Te)}_=-1},this.readRenderTargetPixels=function(w,H,j,q,F,ce,ve){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Me=Pe.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&ve!==void 0&&(Me=Me[ve]),Me){we.bindFramebuffer(V.FRAMEBUFFER,Me);try{let Te=w.texture,Be=Te.format,He=Te.type;if(!je.textureFormatReadable(Be)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!je.textureTypeReadable(He)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}H>=0&&H<=w.width-q&&j>=0&&j<=w.height-F&&V.readPixels(H,j,q,F,Ve.convert(Be),Ve.convert(He),ce)}finally{let Te=b!==null?Pe.get(b).__webglFramebuffer:null;we.bindFramebuffer(V.FRAMEBUFFER,Te)}}},this.readRenderTargetPixelsAsync=async function(w,H,j,q,F,ce,ve){if(!(w&&w.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=Pe.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&ve!==void 0&&(Me=Me[ve]),Me){let Te=w.texture,Be=Te.format,He=Te.type;if(!je.textureFormatReadable(Be))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!je.textureTypeReadable(He))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(H>=0&&H<=w.width-q&&j>=0&&j<=w.height-F){we.bindFramebuffer(V.FRAMEBUFFER,Me);let Ce=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,Ce),V.bufferData(V.PIXEL_PACK_BUFFER,ce.byteLength,V.STREAM_READ),V.readPixels(H,j,q,F,Ve.convert(Be),Ve.convert(He),0);let st=b!==null?Pe.get(b).__webglFramebuffer:null;we.bindFramebuffer(V.FRAMEBUFFER,st);let mt=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await ff(V,mt,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,Ce),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,ce),V.deleteBuffer(Ce),V.deleteSync(mt),ce}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(w,H=null,j=0){w.isTexture!==!0&&(_s("WebGLRenderer: copyFramebufferToTexture function signature has changed."),H=arguments[0]||null,w=arguments[1]);let q=Math.pow(2,-j),F=Math.floor(w.image.width*q),ce=Math.floor(w.image.height*q),ve=H!==null?H.x:0,Me=H!==null?H.y:0;A.setTexture2D(w,0),V.copyTexSubImage2D(V.TEXTURE_2D,j,0,0,ve,Me,F,ce),we.unbindTexture()},this.copyTextureToTexture=function(w,H,j=null,q=null,F=0){w.isTexture!==!0&&(_s("WebGLRenderer: copyTextureToTexture function signature has changed."),q=arguments[0]||null,w=arguments[1],H=arguments[2],F=arguments[3]||0,j=null);let ce,ve,Me,Te,Be,He,Ce,st,mt,ft=w.isCompressedTexture?w.mipmaps[F]:w.image;j!==null?(ce=j.max.x-j.min.x,ve=j.max.y-j.min.y,Me=j.isBox3?j.max.z-j.min.z:1,Te=j.min.x,Be=j.min.y,He=j.isBox3?j.min.z:0):(ce=ft.width,ve=ft.height,Me=ft.depth||1,Te=0,Be=0,He=0),q!==null?(Ce=q.x,st=q.y,mt=q.z):(Ce=0,st=0,mt=0);let Et=Ve.convert(H.format),lt=Ve.convert(H.type),Ee;H.isData3DTexture?(A.setTexture3D(H,0),Ee=V.TEXTURE_3D):H.isDataArrayTexture||H.isCompressedArrayTexture?(A.setTexture2DArray(H,0),Ee=V.TEXTURE_2D_ARRAY):(A.setTexture2D(H,0),Ee=V.TEXTURE_2D),V.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,H.flipY),V.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),V.pixelStorei(V.UNPACK_ALIGNMENT,H.unpackAlignment);let Zi=V.getParameter(V.UNPACK_ROW_LENGTH),wi=V.getParameter(V.UNPACK_IMAGE_HEIGHT),Ut=V.getParameter(V.UNPACK_SKIP_PIXELS),Ji=V.getParameter(V.UNPACK_SKIP_ROWS),ei=V.getParameter(V.UNPACK_SKIP_IMAGES);V.pixelStorei(V.UNPACK_ROW_LENGTH,ft.width),V.pixelStorei(V.UNPACK_IMAGE_HEIGHT,ft.height),V.pixelStorei(V.UNPACK_SKIP_PIXELS,Te),V.pixelStorei(V.UNPACK_SKIP_ROWS,Be),V.pixelStorei(V.UNPACK_SKIP_IMAGES,He);let jr=w.isDataArrayTexture||w.isData3DTexture,ct=H.isDataArrayTexture||H.isData3DTexture;if(w.isRenderTargetTexture||w.isDepthTexture){let At=Pe.get(w),Mi=Pe.get(H),Wt=Pe.get(At.__renderTarget),Er=Pe.get(Mi.__renderTarget);we.bindFramebuffer(V.READ_FRAMEBUFFER,Wt.__webglFramebuffer),we.bindFramebuffer(V.DRAW_FRAMEBUFFER,Er.__webglFramebuffer);for(let ni=0;ni<Me;ni++)jr&&V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Pe.get(w).__webglTexture,F,He+ni),w.isDepthTexture?(ct&&V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Pe.get(H).__webglTexture,F,mt+ni),V.blitFramebuffer(Te,Be,ce,ve,Ce,st,ce,ve,V.DEPTH_BUFFER_BIT,V.NEAREST)):ct?V.copyTexSubImage3D(Ee,F,Ce,st,mt+ni,Te,Be,ce,ve):V.copyTexSubImage2D(Ee,F,Ce,st,mt+ni,Te,Be,ce,ve);we.bindFramebuffer(V.READ_FRAMEBUFFER,null),we.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else ct?w.isDataTexture||w.isData3DTexture?V.texSubImage3D(Ee,F,Ce,st,mt,ce,ve,Me,Et,lt,ft.data):H.isCompressedArrayTexture?V.compressedTexSubImage3D(Ee,F,Ce,st,mt,ce,ve,Me,Et,ft.data):V.texSubImage3D(Ee,F,Ce,st,mt,ce,ve,Me,Et,lt,ft):w.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,F,Ce,st,ce,ve,Et,lt,ft.data):w.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,F,Ce,st,ft.width,ft.height,Et,ft.data):V.texSubImage2D(V.TEXTURE_2D,F,Ce,st,ce,ve,Et,lt,ft);V.pixelStorei(V.UNPACK_ROW_LENGTH,Zi),V.pixelStorei(V.UNPACK_IMAGE_HEIGHT,wi),V.pixelStorei(V.UNPACK_SKIP_PIXELS,Ut),V.pixelStorei(V.UNPACK_SKIP_ROWS,Ji),V.pixelStorei(V.UNPACK_SKIP_IMAGES,ei),F===0&&H.generateMipmaps&&V.generateMipmap(Ee),we.unbindTexture()},this.copyTextureToTexture3D=function(w,H,j=null,q=null,F=0){return w.isTexture!==!0&&(_s("WebGLRenderer: copyTextureToTexture3D function signature has changed."),j=arguments[0]||null,q=arguments[1]||null,w=arguments[2],H=arguments[3],F=arguments[4]||0),_s('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(w,H,j,q,F)},this.initRenderTarget=function(w){Pe.get(w).__webglFramebuffer===void 0&&A.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?A.setTextureCube(w,0):w.isData3DTexture?A.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?A.setTexture2DArray(w,0):A.setTexture2D(w,0),we.unbindTexture()},this.resetState=function(){R=0,E=0,b=null,we.reset(),et.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ji}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=tt._getDrawingBufferColorSpace(e),t.unpackColorSpace=tt._getUnpackColorSpace()}},$s=class extends Lt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ni,this.environmentIntensity=1,this.environmentRotation=new Ni,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Bo=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Co,this.updateRanges=[],this.version=0,this.uuid=ki()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ki()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ki()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},ti=new G,Ho=class n{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)ti.fromBufferAttribute(this,t),ti.applyMatrix4(e),this.setXYZ(t,ti.x,ti.y,ti.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)ti.fromBufferAttribute(this,t),ti.applyNormalMatrix(e),this.setXYZ(t,ti.x,ti.y,ti.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)ti.fromBufferAttribute(this,t),ti.transformDirection(e),this.setXYZ(t,ti.x,ti.y,ti.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Li(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=ht(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=ht(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=ht(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=ht(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=ht(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Li(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Li(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Li(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Li(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=ht(t,this.array),i=ht(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=ht(t,this.array),i=ht(i,this.array),r=ht(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=ht(t,this.array),i=ht(i,this.array),r=ht(r,this.array),s=ht(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new Gt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},uh=new G,hh=new ot,ph=new ot,c_=new G,mh=new We,ka=new G,sc=new hi,fh=new We,ac=new hn,zo=class extends pt{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Rc,this.bindMatrix=new We,this.bindMatrixInverse=new We,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Si),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,ka),this.boundingBox.expandByPoint(ka)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new hi),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,ka),this.boundingSphere.expandByPoint(ka)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let i=this.material,r=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),sc.copy(this.boundingSphere),sc.applyMatrix4(r),e.ray.intersectsSphere(sc)!==!1&&(fh.copy(r).invert(),ac.copy(e.ray).applyMatrix4(fh),!(this.boundingBox!==null&&ac.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,ac)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new ot,t=this.geometry.attributes.skinWeight;for(let i=0,r=t.count;i<r;i++){e.fromBufferAttribute(t,i);let s=1/e.manhattanLength();s!==1/0?e.multiplyScalar(s):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Rc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===wp?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let i=this.skeleton,r=this.geometry;hh.fromBufferAttribute(r.attributes.skinIndex,e),ph.fromBufferAttribute(r.attributes.skinWeight,e),uh.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let s=0;s<4;s++){let a=ph.getComponent(s);if(a!==0){let o=hh.getComponent(s);mh.multiplyMatrices(i.bones[o].matrixWorld,i.boneInverses[o]),t.addScaledVector(c_.copy(uh).applyMatrix4(mh),a)}}return t.applyMatrix4(this.bindMatrixInverse)}},Ws=class extends Lt{constructor(){super(),this.isBone=!0,this.type="Bone"}},js=class extends qt{constructor(e=null,t=1,i=1,r,s,a,o,l,c=Jt,d=Jt,u,h){super(null,a,o,l,c,d,r,s,u,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},gh=new We,d_=new We,Vo=class n{constructor(e=[],t=[]){this.uuid=ki(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,r=this.bones.length;i<r;i++)this.boneInverses.push(new We)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let i=new We;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){let e=this.bones,t=this.boneInverses,i=this.boneMatrices,r=this.boneTexture;for(let s=0,a=e.length;s<a;s++){let o=e[s]?e[s].matrixWorld:d_;gh.multiplyMatrices(o,t[s]),gh.toArray(i,s*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new n(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let i=new js(t,e,e,di,yi);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){let r=this.bones[t];if(r.name===e)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,r=e.bones.length;i<r;i++){let s=e.bones[i],a=t[s];a===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",s),a=new Ws),this.bones.push(a),this.boneInverses.push(new We().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){let e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,i=this.boneInverses;for(let r=0,s=t.length;r<s;r++){let a=t[r];e.bones.push(a.uuid);let o=i[r];e.boneInverses.push(o.toArray())}return e}},Xn=class extends Gt{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Pn=new We,vh=new We,Da=[],xh=new Si,u_=new We,ps=new pt,ms=new hi,Go=class extends pt{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Xn(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,u_)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Si),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Pn),xh.copy(e.boundingBox).applyMatrix4(Pn),this.boundingBox.union(xh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new hi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Pn),ms.copy(e.boundingSphere).applyMatrix4(Pn),this.boundingSphere.union(ms)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=i.length+1,a=e*s+1;for(let o=0;o<i.length;o++)i[o]=r[a+o]}raycast(e,t){let i=this.matrixWorld,r=this.count;if(ps.geometry=this.geometry,ps.material=this.material,ps.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ms.copy(this.boundingSphere),ms.applyMatrix4(i),e.ray.intersectsSphere(ms)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,Pn),vh.multiplyMatrices(i,Pn),ps.matrixWorld=vh,ps.raycast(e,Da);for(let a=0,o=Da.length;a<o;a++){let l=Da[a];l.instanceId=s,l.object=this,t.push(l)}Da.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Xn(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new js(new Float32Array(r*this.count),r,this.count,gl,yi));let s=this.morphTexture.source.data.data,a=0;for(let c=0;c<i.length;c++)a+=i[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;s[l]=o,s.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}},qs=class extends ui{static get type(){return"LineBasicMaterial"}constructor(e){super(),this.isLineBasicMaterial=!0,this.color=new ze(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},$o=new G,Wo=new G,_h=new We,fs=new hn,Ua=new hi,oc=new G,yh=new G,Yn=class extends Lt{constructor(e=new Oi,t=new qs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)$o.fromBufferAttribute(t,r-1),Wo.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=$o.distanceTo(Wo);e.setAttribute("lineDistance",new bi(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ua.copy(i.boundingSphere),Ua.applyMatrix4(r),Ua.radius+=s,e.ray.intersectsSphere(Ua)===!1)return;_h.copy(r).invert(),fs.copy(e.ray).applyMatrix4(_h);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,d=i.index,u=i.attributes.position;if(d!==null){let h=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let g=h,v=p-1;g<v;g+=c){let f=d.getX(g),m=d.getX(g+1),T=Na(this,e,fs,l,f,m);T&&t.push(T)}if(this.isLineLoop){let g=d.getX(p-1),v=d.getX(h),f=Na(this,e,fs,l,g,v);f&&t.push(f)}}else{let h=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let g=h,v=p-1;g<v;g+=c){let f=Na(this,e,fs,l,g,g+1);f&&t.push(f)}if(this.isLineLoop){let g=Na(this,e,fs,l,p-1,h);g&&t.push(g)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Na(n,e,t,i,r,s){let a=n.geometry.attributes.position;if($o.fromBufferAttribute(a,r),Wo.fromBufferAttribute(a,s),t.distanceSqToSegment($o,Wo,oc,yh)>i)return;oc.applyMatrix4(n.matrixWorld);let o=e.ray.origin.distanceTo(oc);if(!(o<e.near||o>e.far))return{distance:o,point:yh.clone().applyMatrix4(n.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:n}}var bh=new G,Sh=new G,jo=class extends Yn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)bh.fromBufferAttribute(t,r),Sh.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+bh.distanceTo(Sh);e.setAttribute("lineDistance",new bi(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},qo=class extends Yn{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},Xs=class extends ui{static get type(){return"PointsMaterial"}constructor(e){super(),this.isPointsMaterial=!0,this.color=new ze(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},wh=new We,Vc=new hn,Oa=new hi,Fa=new G,Xo=class extends Lt{constructor(e=new Oi,t=new Xs){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Oa.copy(i.boundingSphere),Oa.applyMatrix4(r),Oa.radius+=s,e.ray.intersectsSphere(Oa)===!1)return;wh.copy(r).invert(),Vc.copy(e.ray).applyMatrix4(wh);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,d=i.attributes.position;if(c!==null){let u=Math.max(0,a.start),h=Math.min(c.count,a.start+a.count);for(let p=u,g=h;p<g;p++){let v=c.getX(p);Fa.fromBufferAttribute(d,v),Mh(Fa,v,l,r,e,t,this)}}else{let u=Math.max(0,a.start),h=Math.min(d.count,a.start+a.count);for(let p=u,g=h;p<g;p++)Fa.fromBufferAttribute(d,p),Mh(Fa,p,l,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,s=i.length;r<s;r++){let a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Mh(n,e,t,i,r,s,a){let o=Vc.distanceSqToPoint(n);if(o<t){let l=new G;Vc.closestPointToPoint(n,l),l.applyMatrix4(i);let c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var Vr=class extends ui{static get type(){return"MeshStandardMaterial"}constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new ze(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ze(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xd,this.normalScale=new it(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ni,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},pi=class extends Vr{static get type(){return"MeshPhysicalMaterial"}constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new it(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Kt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ze(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ze(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ze(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};function Ba(n,e,t){return!n||!t&&n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function h_(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function p_(n){function e(r,s){return n[r]-n[s]}let t=n.length,i=new Array(t);for(let r=0;r!==t;++r)i[r]=r;return i.sort(e),i}function Th(n,e,t){let i=n.length,r=new n.constructor(i);for(let s=0,a=0;a!==i;++s){let o=t[s]*e;for(let l=0;l!==e;++l)r[a++]=n[o+l]}return r}function Xp(n,e,t,i){let r=1,s=n[0];for(;s!==void 0&&s[i]===void 0;)s=n[r++];if(s===void 0)return;let a=s[i];if(a!==void 0)if(Array.isArray(a))do a=s[i],a!==void 0&&(e.push(s.time),t.push.apply(t,a)),s=n[r++];while(s!==void 0);else if(a.toArray!==void 0)do a=s[i],a!==void 0&&(e.push(s.time),a.toArray(t,t.length)),s=n[r++];while(s!==void 0);else do a=s[i],a!==void 0&&(e.push(s.time),t.push(a)),s=n[r++];while(s!==void 0)}var Gr=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],s=t[i-1];i:{e:{let a;t:{r:if(!(e<r)){for(let o=i+2;;){if(r===void 0){if(e<s)break r;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=r,r=t[++i],e<r)break e}a=t.length;break t}if(!(e>=s)){let o=t[1];e<o&&(i=2,s=o);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(r=s,s=t[--i-1],e>=s)break e}a=i,i=0;break t}break i}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let a=0;a!==r;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Yo=class extends Gr{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Cc,endingEnd:Cc}}intervalChanged_(e,t,i){let r=this.parameterPositions,s=e-2,a=e+1,o=r[s],l=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Lc:s=e,o=2*t-i;break;case Pc:s=r.length-2,o=t+r[s]-r[s+1];break;default:s=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Lc:a=e,l=2*i-t;break;case Pc:a=1,l=i+r[1]-r[0];break;default:a=e-1,l=t}let c=(i-t)*.5,d=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=s*d,this._offsetNext=a*d}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=this._offsetPrev,u=this._offsetNext,h=this._weightPrev,p=this._weightNext,g=(i-t)/(r-t),v=g*g,f=v*g,m=-h*f+2*h*v-h*g,T=(1+h)*f+(-1.5-2*h)*v+(-.5+h)*g+1,M=(-1-p)*f+(1.5+p)*v+.5*g,S=p*f-p*v;for(let k=0;k!==o;++k)s[k]=m*a[d+k]+T*a[c+k]+M*a[l+k]+S*a[u+k];return s}},Ko=class extends Gr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=(i-t)/(r-t),u=1-d;for(let h=0;h!==o;++h)s[h]=a[c+h]*u+a[l+h]*d;return s}},Zo=class extends Gr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},mi=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Ba(t,this.TimeBufferType),this.values=Ba(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Ba(e.times,Array),values:Ba(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Zo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ko(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Yo(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case zn:t=this.InterpolantFactoryMethodDiscrete;break;case Vn:t=this.InterpolantFactoryMethodLinear;break;case Va:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return zn;case this.InterpolantFactoryMethodLinear:return Vn;case this.InterpolantFactoryMethodSmooth:return Va}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e}return this}trim(e,t){let i=this.times,r=i.length,s=0,a=r-1;for(;s!==r&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(r!==void 0&&h_(r))for(let o=0,l=r.length;o!==l;++o){let c=r[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===Va,s=e.length-1,a=1;for(let o=1;o<s;++o){let l=!1,c=e[o],d=e[o+1];if(c!==d&&(o!==1||c!==e[0]))if(r)l=!0;else{let u=o*i,h=u-i,p=u+i;for(let g=0;g!==i;++g){let v=t[u+g];if(v!==t[h+g]||v!==t[p+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*i,h=a*i;for(let p=0;p!==i;++p)t[h+p]=t[u+p]}++a}}if(s>0){e[a]=e[s];for(let o=s*i,l=a*i,c=0;c!==i;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};mi.prototype.TimeBufferType=Float32Array;mi.prototype.ValueBufferType=Float32Array;mi.prototype.DefaultInterpolation=Vn;var vr=class extends mi{constructor(e,t,i){super(e,t,i)}};vr.prototype.ValueTypeName="bool";vr.prototype.ValueBufferType=Array;vr.prototype.DefaultInterpolation=zn;vr.prototype.InterpolantFactoryMethodLinear=void 0;vr.prototype.InterpolantFactoryMethodSmooth=void 0;var Ys=class extends mi{};Ys.prototype.ValueTypeName="color";var xr=class extends mi{};xr.prototype.ValueTypeName="number";var Jo=class extends Gr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-t)/(r-t),c=e*o;for(let d=c+o;c!==d;c+=4)Ui.slerpFlat(s,0,a,c-o,a,c,l);return s}},_r=class extends mi{InterpolantFactoryMethodLinear(e){return new Jo(this.times,this.values,this.getValueSize(),e)}};_r.prototype.ValueTypeName="quaternion";_r.prototype.InterpolantFactoryMethodSmooth=void 0;var yr=class extends mi{constructor(e,t,i){super(e,t,i)}};yr.prototype.ValueTypeName="string";yr.prototype.ValueBufferType=Array;yr.prototype.DefaultInterpolation=zn;yr.prototype.InterpolantFactoryMethodLinear=void 0;yr.prototype.InterpolantFactoryMethodSmooth=void 0;var br=class extends mi{};br.prototype.ValueTypeName="vector";var Qo=class{constructor(e="",t=-1,i=[],r=Mp){this.name=e,this.tracks=i,this.duration=t,this.blendMode=r,this.uuid=ki(),this.duration<0&&this.resetDuration()}static parse(e){let t=[],i=e.tracks,r=1/(e.fps||1);for(let a=0,o=i.length;a!==o;++a)t.push(f_(i[a]).scale(r));let s=new this(e.name,e.duration,t,e.blendMode);return s.uuid=e.uuid,s}static toJSON(e){let t=[],i=e.tracks,r={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let s=0,a=i.length;s!==a;++s)t.push(mi.toJSON(i[s]));return r}static CreateFromMorphTargetSequence(e,t,i,r){let s=t.length,a=[];for(let o=0;o<s;o++){let l=[],c=[];l.push((o+s-1)%s,o,(o+1)%s),c.push(0,1,0);let d=p_(l);l=Th(l,1,d),c=Th(c,1,d),!r&&l[0]===0&&(l.push(s),c.push(c[0])),a.push(new xr(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/i))}return new this(e,-1,a)}static findByName(e,t){let i=e;if(!Array.isArray(e)){let r=e;i=r.geometry&&r.geometry.animations||r.animations}for(let r=0;r<i.length;r++)if(i[r].name===t)return i[r];return null}static CreateClipsFromMorphTargetSequences(e,t,i){let r={},s=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){let c=e[o],d=c.name.match(s);if(d&&d.length>1){let u=d[1],h=r[u];h||(r[u]=h=[]),h.push(c)}}let a=[];for(let o in r)a.push(this.CreateFromMorphTargetSequence(o,r[o],t,i));return a}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let i=function(d,u,h,p,g){if(h.length!==0){let v=[],f=[];Xp(h,v,f,p),v.length!==0&&g.push(new d(u,v,f))}},r=[],s=e.name||"default",a=e.fps||30,o=e.blendMode,l=e.length||-1,c=e.hierarchy||[];for(let d=0;d<c.length;d++){let u=c[d].keys;if(!(!u||u.length===0))if(u[0].morphTargets){let h={},p;for(p=0;p<u.length;p++)if(u[p].morphTargets)for(let g=0;g<u[p].morphTargets.length;g++)h[u[p].morphTargets[g]]=-1;for(let g in h){let v=[],f=[];for(let m=0;m!==u[p].morphTargets.length;++m){let T=u[p];v.push(T.time),f.push(T.morphTarget===g?1:0)}r.push(new xr(".morphTargetInfluence["+g+"]",v,f))}l=h.length*a}else{let h=".bones["+t[d].name+"]";i(br,h+".position",u,"pos",r),i(_r,h+".quaternion",u,"rot",r),i(br,h+".scale",u,"scl",r)}}return r.length===0?null:new this(s,l,r,o)}resetDuration(){let e=this.tracks,t=0;for(let i=0,r=e.length;i!==r;++i){let s=this.tracks[i];t=Math.max(t,s.times[s.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}};function m_(n){switch(n.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return xr;case"vector":case"vector2":case"vector3":case"vector4":return br;case"color":return Ys;case"quaternion":return _r;case"bool":case"boolean":return vr;case"string":return yr}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+n)}function f_(n){if(n.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=m_(n.type);if(n.times===void 0){let t=[],i=[];Xp(n.keys,t,i,"value"),n.times=t,n.values=i}return e.parse!==void 0?e.parse(n):new e(n.name,n.times,n.values,n.interpolation)}var hr={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(this.files[n]=e)},get:function(n){if(this.enabled!==!1)return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}},el=class{constructor(e,t,i){let r=this,s=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(d){o++,s===!1&&r.onStart!==void 0&&r.onStart(d,a,o),s=!0},this.itemEnd=function(d){a++,r.onProgress!==void 0&&r.onProgress(d,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(d){r.onError!==void 0&&r.onError(d)},this.resolveURL=function(d){return l?l(d):d},this.setURLModifier=function(d){return l=d,this},this.addHandler=function(d,u){return c.push(d,u),this},this.removeHandler=function(d){let u=c.indexOf(d);return u!==-1&&c.splice(u,2),this},this.getHandler=function(d){for(let u=0,h=c.length;u<h;u+=2){let p=c[u],g=c[u+1];if(p.global&&(p.lastIndex=0),p.test(d))return g}return null}}},Yp=new el,Sr=class{constructor(e){this.manager=e!==void 0?e:Yp,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};Sr.DEFAULT_MATERIAL_NAME="__DEFAULT";var lr={},Gc=class extends Error{constructor(e,t){super(e),this.response=t}},Ks=class extends Sr{constructor(e){super(e)}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=hr.get(e);if(s!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0),s;if(lr[e]!==void 0){lr[e].push({onLoad:t,onProgress:i,onError:r});return}lr[e]=[],lr[e].push({onLoad:t,onProgress:i,onError:r});let a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let d=lr[e],u=c.body.getReader(),h=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),p=h?parseInt(h):0,g=p!==0,v=0,f=new ReadableStream({start(m){T();function T(){u.read().then(({done:M,value:S})=>{if(M)m.close();else{v+=S.byteLength;let k=new ProgressEvent("progress",{lengthComputable:g,loaded:v,total:p});for(let R=0,E=d.length;R<E;R++){let b=d[R];b.onProgress&&b.onProgress(k)}m.enqueue(S),T()}},M=>{m.error(M)})}}});return new Response(f)}else throw new Gc(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(d=>new DOMParser().parseFromString(d,o));case"json":return c.json();default:if(o===void 0)return c.text();{let d=/charset="?([^;"\s]*)"?/i.exec(o),u=d&&d[1]?d[1].toLowerCase():void 0,h=new TextDecoder(u);return c.arrayBuffer().then(p=>h.decode(p))}}}).then(c=>{hr.add(e,c);let d=lr[e];delete lr[e];for(let u=0,h=d.length;u<h;u++){let p=d[u];p.onLoad&&p.onLoad(c)}}).catch(c=>{let d=lr[e];if(d===void 0)throw this.manager.itemError(e),c;delete lr[e];for(let u=0,h=d.length;u<h;u++){let p=d[u];p.onError&&p.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}},tl=class extends Sr{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=hr.get(e);if(a!==void 0)return s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a;let o=Ds("img");function l(){d(),hr.add(e,this),t&&t(this),s.manager.itemEnd(e)}function c(u){d(),r&&r(u),s.manager.itemError(e),s.manager.itemEnd(e)}function d(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),s.manager.itemStart(e),o.src=e,o}},il=class extends Sr{constructor(e){super(e)}load(e,t,i,r){let s=new qt,a=new tl(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},i,r),s}},mn=class extends Lt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ze(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},lc=new We,Eh=new G,Ah=new G,Zs=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new it(512,512),this.map=null,this.mapPass=null,this.matrix=new We,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Wn,this._frameExtents=new it(1,1),this._viewportCount=1,this._viewports=[new ot(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;Eh.setFromMatrixPosition(e.matrixWorld),t.position.copy(Eh),Ah.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ah),t.updateMatrixWorld(),lc.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(lc),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(lc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},$c=class extends Zs{constructor(){super(new Vt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,i=Gn*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height,s=e.distance||t.far;(i!==t.fov||r!==t.aspect||s!==t.far)&&(t.fov=i,t.aspect=r,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},rl=class extends mn{constructor(e,t,i=0,r=Math.PI/3,s=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Lt.DEFAULT_UP),this.updateMatrix(),this.target=new Lt,this.distance=i,this.angle=r,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new $c}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Rh=new We,gs=new G,cc=new G,Wc=class extends Zs{constructor(){super(new Vt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new it(4,2),this._viewportCount=6,this._viewports=[new ot(2,1,1,1),new ot(0,1,1,1),new ot(3,1,1,1),new ot(1,1,1,1),new ot(3,0,1,1),new ot(1,0,1,1)],this._cubeDirections=[new G(1,0,0),new G(-1,0,0),new G(0,0,1),new G(0,0,-1),new G(0,1,0),new G(0,-1,0)],this._cubeUps=[new G(0,1,0),new G(0,1,0),new G(0,1,0),new G(0,1,0),new G(0,0,1),new G(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,r=this.matrix,s=e.distance||i.far;s!==i.far&&(i.far=s,i.updateProjectionMatrix()),gs.setFromMatrixPosition(e.matrixWorld),i.position.copy(gs),cc.copy(i.position),cc.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(cc),i.updateMatrixWorld(),r.makeTranslation(-gs.x,-gs.y,-gs.z),Rh.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Rh)}},fn=class extends mn{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new Wc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},jc=class extends Zs{constructor(){super(new jn(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Js=class extends mn{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Lt.DEFAULT_UP),this.updateMatrix(),this.target=new Lt,this.shadow=new jc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},nl=class extends mn{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}},Br=class{static decodeText(e){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let i=0,r=e.length;i<r;i++)t+=String.fromCharCode(e[i]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}},sl=class extends Sr{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=hr.get(e);if(a!==void 0){if(s.manager.itemStart(e),a.then){a.then(c=>{t&&t(c),s.manager.itemEnd(e)}).catch(c=>{r&&r(c)});return}return setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader;let l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(c){return hr.add(e,c),t&&t(c),s.manager.itemEnd(e),c}).catch(function(c){r&&r(c),hr.remove(e),s.manager.itemError(e),s.manager.itemEnd(e)});hr.add(e,l),s.manager.itemStart(e)}},al=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Ch(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=Ch();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};function Ch(){return performance.now()}var Jd="\\[\\]\\.:\\/",g_=new RegExp("["+Jd+"]","g"),Qd="[^"+Jd+"]",v_="[^"+Jd.replace("\\.","")+"]",x_=/((?:WC+[\/:])*)/.source.replace("WC",Qd),__=/(WCOD+)?/.source.replace("WCOD",v_),y_=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Qd),b_=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Qd),S_=new RegExp("^"+x_+__+y_+b_+"$"),w_=["material","materials","bones","map"],qc=class{constructor(e,t,i){let r=i||yt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},yt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(g_,"")}static parseTrackName(e){let t=S_.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);w_.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let d=0;d<e.length;d++)if(e[d].name===c){c=d;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[r];if(a===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};yt.Composite=qc;yt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};yt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};yt.prototype.GetterByBindingType=[yt.prototype._getValue_direct,yt.prototype._getValue_array,yt.prototype._getValue_arrayElement,yt.prototype._getValue_toArray];yt.prototype.SetterByBindingTypeAndVersioning=[[yt.prototype._setValue_direct,yt.prototype._setValue_direct_setNeedsUpdate,yt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_array,yt.prototype._setValue_array_setNeedsUpdate,yt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_arrayElement,yt.prototype._setValue_arrayElement_setNeedsUpdate,yt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_fromArray,yt.prototype._setValue_fromArray_setNeedsUpdate,yt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:hl}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=hl);var M_=Object.freeze(Object.defineProperty({__proto__:null,ACESFilmicToneMapping:Ud,AddEquation:Or,AddOperation:gp,AdditiveBlending:Tc,AgXToneMapping:bp,AlphaFormat:zd,AlwaysCompare:Up,AlwaysDepth:qa,AlwaysStencilFunc:Ic,AmbientLight:nl,AnimationClip:Qo,ArrayCamera:Oo,AttachedBindMode:Rc,BackSide:Zt,BasicDepthPacking:Ep,Bone:Ws,BooleanKeyframeTrack:vr,Box3:Si,BoxGeometry:pn,BufferAttribute:Gt,BufferGeometry:Oi,ByteType:Fd,Cache:hr,Camera:Hs,CineonToneMapping:_p,ClampToEdgeWrapping:ur,Clock:al,Color:ze,ColorKeyframeTrack:Ys,ColorManagement:tt,ConstantAlphaFactor:pp,ConstantColorFactor:up,CubeCamera:ko,CubeReflectionMapping:on,CubeRefractionMapping:ln,CubeTexture:zs,CubeUVReflectionMapping:ta,CubicInterpolant:Yo,CullFaceBack:Mc,CullFaceFront:Yh,CullFaceNone:Xh,CustomBlending:Zh,CustomToneMapping:yp,Data3DTexture:Io,DataArrayTexture:Ns,DataTexture:js,DefaultLoadingManager:Yp,DepthFormat:sn,DepthStencilFormat:un,DepthTexture:Gs,DetachedBindMode:wp,DirectionalLight:Js,DiscreteInterpolant:Zo,DoubleSide:Ci,DstAlphaFactor:ap,DstColorFactor:lp,EqualCompare:Pp,EqualDepth:Ya,EquirectangularReflectionMapping:Qa,EquirectangularRefractionMapping:eo,Euler:Ni,EventDispatcher:gr,FileLoader:Ks,Float32BufferAttribute:bi,FloatType:yi,FrontSide:qi,Frustum:Wn,GLSL3:kc,GreaterCompare:Ip,GreaterDepth:Za,GreaterEqualCompare:Dp,GreaterEqualDepth:Ka,Group:Ii,HalfFloatType:es,ImageBitmapLoader:sl,ImageLoader:tl,ImageUtils:Lo,InstancedBufferAttribute:Xn,InstancedMesh:Go,IntType:pl,InterleavedBuffer:Bo,InterleavedBufferAttribute:Ho,Interpolant:Gr,InterpolateDiscrete:zn,InterpolateLinear:Vn,InterpolateSmooth:Va,KeepStencilOp:en,KeyframeTrack:mi,Layers:Os,LessCompare:Lp,LessDepth:Xa,LessEqualCompare:Yd,LessEqualDepth:an,Light:mn,Line:Yn,LineBasicMaterial:qs,LineLoop:qo,LineSegments:jo,LinearFilter:si,LinearInterpolant:Ko,LinearMipmapLinearFilter:Wi,LinearMipmapNearestFilter:Ss,LinearSRGBColorSpace:Qt,LinearToneMapping:vp,LinearTransfer:ia,Loader:Sr,LoaderUtils:Br,LoadingManager:el,LuminanceAlphaFormat:$d,LuminanceFormat:Gd,Material:ui,MathUtils:Np,Matrix3:Ge,Matrix4:We,MaxEquation:tp,Mesh:pt,MeshBasicMaterial:Pi,MeshDepthMaterial:Uo,MeshDistanceMaterial:No,MeshPhysicalMaterial:pi,MeshStandardMaterial:Vr,MinEquation:ep,MirroredRepeatWrapping:Is,MixOperation:fp,MultiplyBlending:Ac,MultiplyOperation:Dd,NearestFilter:Jt,NearestMipmapLinearFilter:Un,NearestMipmapNearestFilter:Od,NeutralToneMapping:Sp,NeverCompare:Cp,NeverDepth:ja,NoBlending:pr,NoColorSpace:dr,NoToneMapping:mr,NormalAnimationBlendMode:Mp,NormalBlending:nn,NotEqualCompare:kp,NotEqualDepth:Ja,NumberKeyframeTrack:xr,Object3D:Lt,ObjectSpaceNormalMap:Rp,OneFactor:rp,OneMinusConstantAlphaFactor:mp,OneMinusConstantColorFactor:hp,OneMinusDstAlphaFactor:op,OneMinusDstColorFactor:cp,OneMinusSrcAlphaFactor:Wa,OneMinusSrcColorFactor:sp,OrthographicCamera:jn,PCFShadowMap:kd,PCFSoftShadowMap:Kh,PMREMGenerator:qn,PerspectiveCamera:Vt,Plane:Gi,PlaneGeometry:Vs,PointLight:fn,Points:Xo,PointsMaterial:Xs,PropertyBinding:yt,Quaternion:Ui,QuaternionKeyframeTrack:_r,QuaternionLinearInterpolant:Jo,RED_GREEN_RGTC2_Format:Eo,RED_RGTC1_Format:jd,REVISION:hl,RGBADepthPacking:Ap,RGBAFormat:di,RGBAIntegerFormat:_l,RGBA_ASTC_10x10_Format:yo,RGBA_ASTC_10x5_Format:vo,RGBA_ASTC_10x6_Format:xo,RGBA_ASTC_10x8_Format:_o,RGBA_ASTC_12x10_Format:bo,RGBA_ASTC_12x12_Format:So,RGBA_ASTC_4x4_Format:lo,RGBA_ASTC_5x4_Format:co,RGBA_ASTC_5x5_Format:uo,RGBA_ASTC_6x5_Format:ho,RGBA_ASTC_6x6_Format:po,RGBA_ASTC_8x5_Format:mo,RGBA_ASTC_8x6_Format:fo,RGBA_ASTC_8x8_Format:go,RGBA_BPTC_Format:As,RGBA_ETC2_EAC_Format:oo,RGBA_PVRTC_2BPPV1_Format:no,RGBA_PVRTC_4BPPV1_Format:ro,RGBA_S3TC_DXT1_Format:Ms,RGBA_S3TC_DXT3_Format:Ts,RGBA_S3TC_DXT5_Format:Es,RGBFormat:Vd,RGB_BPTC_SIGNED_Format:wo,RGB_BPTC_UNSIGNED_Format:Mo,RGB_ETC1_Format:so,RGB_ETC2_Format:ao,RGB_PVRTC_2BPPV1_Format:io,RGB_PVRTC_4BPPV1_Format:to,RGB_S3TC_DXT1_Format:ws,RGFormat:Wd,RGIntegerFormat:xl,Ray:hn,RedFormat:gl,RedIntegerFormat:vl,ReinhardToneMapping:xp,RenderTarget:Po,RepeatWrapping:cn,ReverseSubtractEquation:Qh,SIGNED_RED_GREEN_RGTC2_Format:Ao,SIGNED_RED_RGTC1_Format:To,SRGBColorSpace:zt,SRGBTransfer:ut,Scene:$s,ShaderChunk:$e,ShaderLib:Ri,ShaderMaterial:Fi,ShortType:Bd,Skeleton:Vo,SkinnedMesh:zo,Source:Us,Sphere:hi,SpotLight:rl,SrcAlphaFactor:$a,SrcAlphaSaturateFactor:dp,SrcColorFactor:np,StaticDrawUsage:Co,StringKeyframeTrack:yr,SubtractEquation:Jh,SubtractiveBlending:Ec,TangentSpaceNormalMap:Xd,Texture:qt,TextureLoader:il,Triangle:Fr,TriangleFanDrawMode:Ro,TriangleStripDrawMode:qd,TrianglesDrawMode:Tp,UVMapping:Nd,Uint16BufferAttribute:Fs,Uint32BufferAttribute:Bs,UniformsLib:pe,UniformsUtils:zp,UnsignedByteType:Xi,UnsignedInt248Type:dn,UnsignedInt5999Type:Hd,UnsignedIntType:zr,UnsignedShort4444Type:ml,UnsignedShort5551Type:fl,UnsignedShortType:Hn,VSMShadowMap:Vi,Vector2:it,Vector3:G,Vector4:ot,VectorKeyframeTrack:br,WebGLCoordinateSystem:ji,WebGLCubeRenderTarget:Do,WebGLRenderTarget:Yi,WebGLRenderer:Fo,WebGLUtils:qp,WebGPUCoordinateSystem:ks,WrapAroundEnding:Pc,ZeroCurvatureEnding:Cc,ZeroFactor:ip,ZeroSlopeEnding:Lc,createCanvasElement:Fp},Symbol.toStringTag,{value:"Module"})),dc=["viseme_sil","viseme_PP","viseme_FF","viseme_TH","viseme_DD","viseme_kk","viseme_CH","viseme_SS","viseme_nn","viseme_RR","viseme_aa","viseme_E","viseme_I","viseme_O","viseme_U"];async function T_(n,e,t,i={}){let r=(await new e().loadAsync(t)).scene,s=[];r.traverse(N=>{if(N.isMesh&&N.morphTargetDictionary&&s.push(N),N.isMesh)for(let P of[].concat(N.material))P&&P.alphaTest>0&&(P.alphaToCoverage=!0)});let a=null,o=0,l=0;r.traverse(N=>{!a&&N.isBone&&/head/i.test(N.name)&&(a=N,o=N.rotation.x,l=N.rotation.y)});let c=new n.Group,d=new n.Group;d.add(r),c.add(d),r.updateMatrixWorld(!0);let u=new n.Box3().setFromObject(r),h=Math.max(u.getSize(new n.Vector3).y,.001)/7.5,p=new n.Vector3;a?(a.getWorldPosition(p),p.y+=h*.35):u.getCenter(p);let g=1/h;d.scale.setScalar(g),d.position.set(-p.x*g,-p.y*g,-p.z*g);let v=(i.faceYawDeg??0)*(Math.PI/180),f={};for(let N of dc)f[N]=0;let m=-1,T=1.5,M=0,S=-1,k={x:0,y:0},R=2,E=0,b=0,_={},x={mouthFunnel:1,mouthPucker:1,mouthClose:1,mouthPressLeft:1,mouthPressRight:1,mouthRollLower:1,browInnerUp:1,browOuterUpLeft:1,browOuterUpRight:1,cheekSquintLeft:1,cheekSquintRight:1};function C(){for(let Z of dc)f[Z]=0;for(let Z in _)_[Z]=0;E=0;let N=Fe.frame();if(b=N.speaking?N.level:0,!N.speaking||!N.viseme)return;let P=Math.min(1,.6+N.level*.8),L=(Z,re)=>{if(!Z||Z==="viseme_sil"||re<=0)return;let ae=cu[Z]??.6;f[Z]=Math.max(f[Z]||0,ae*re*P),E=Math.max(E,(du[Z]||0)*re*P)};L(N.viseme.name,N.viseme.weight),N.prev&&L(N.prev.name,N.prev.weight*.85),N.next&&L(N.next.name,N.next.weight*.5);let I=(Z,re)=>_[Z]=Math.max(_[Z]||0,re),O=N.viseme.name;O==="viseme_O"&&I("mouthFunnel",.55*N.viseme.weight),O==="viseme_U"&&I("mouthPucker",.6*N.viseme.weight),O==="viseme_PP"&&(I("mouthClose",.5*N.viseme.weight),I("mouthPressLeft",.35),I("mouthPressRight",.35)),O==="viseme_FF"&&I("mouthRollLower",.35*N.viseme.weight);let J=Math.max(0,N.level-.45)*.7;I("browInnerUp",J),I("browOuterUpLeft",J*.8),I("browOuterUpRight",J*.8),I("cheekSquintLeft",E*.25),I("cheekSquintRight",E*.25)}function z(N,P){C();let L=1-Math.exp(-N*32),I=1-Math.exp(-N*16);for(let J of s){let Z=J.morphTargetDictionary,re=J.morphTargetInfluences;for(let K of dc){let D=Z[K];if(D===void 0)continue;let X=K==="viseme_sil"?0:f[K]||0;re[D]+=(X-re[D])*(X>re[D]?L:I)}let ae=Z.jawOpen;ae!==void 0&&(re[ae]+=(E-re[ae])*(E>re[ae]?L:I));for(let K in x){let D=Z[K];if(D===void 0)continue;let X=_[K]||0;re[D]+=(X-re[D])*(X>re[D]?L*.7:I*.7)}}if(m<0&&P>T&&(m=0),m>=0){m+=N;let J=m/.16;M=J<1?Math.sin(J*Math.PI):0,J>=1&&(m=-1,M=0,T=P+1.8+Math.random()*3.4)}for(let J of s){let Z=J.morphTargetDictionary,re=J.morphTargetInfluences;for(let ae of["eyeBlinkLeft","eyeBlinkRight","eyesClosed"]){let K=Z[ae];K!==void 0&&(re[K]+=(M-re[K])*Math.min(1,N*30))}}c.position.y=Math.sin(P*1.25)*.008,c.rotation.y=v+Math.sin(P*.22)*.035,P>R&&(k.x=(Math.random()-.5)*.22,k.y=(Math.random()-.5)*.12,R=P+2.5+Math.random()*4);let O=k.y+b*.035;S>=0&&(S+=N,S>=.85?S=-1:O+=Math.sin(S/.85*Math.PI*2)*.2),a&&(a.rotation.y+=(l+k.x-a.rotation.y)*Math.min(1,N*3),a.rotation.x+=(o+O-a.rotation.x)*Math.min(1,N*6))}function W(){r.traverse(N=>{if(N.isMesh){N.geometry&&N.geometry.dispose();let P=Array.isArray(N.material)?N.material:[N.material];for(let L of P)if(L){for(let I of Object.keys(L)){let O=L[I];O&&O.isTexture&&O.dispose()}L.dispose()}}}),c.removeFromParent()}return{group:c,nod(){S<0&&(S=0)},update:z,dispose:W}}function Lh(n,e){if(e===Tp)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),n;if(e===Ro||e===qd){let t=n.getIndex();if(t===null){let a=[],o=n.getAttribute("position");if(o!==void 0){for(let l=0;l<o.count;l++)a.push(l);n.setIndex(a),t=n.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),n}let i=t.count-2,r=[];if(e===Ro)for(let a=1;a<=i;a++)r.push(t.getX(0)),r.push(t.getX(a)),r.push(t.getX(a+1));else for(let a=0;a<i;a++)a%2===0?(r.push(t.getX(a)),r.push(t.getX(a+1)),r.push(t.getX(a+2))):(r.push(t.getX(a+2)),r.push(t.getX(a+1)),r.push(t.getX(a)));r.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let s=n.clone();return s.setIndex(r),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),n}var Xc=class extends Sr{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Jc(t)}),this.register(function(t){return new Qc(t)}),this.register(function(t){return new ld(t)}),this.register(function(t){return new cd(t)}),this.register(function(t){return new dd(t)}),this.register(function(t){return new td(t)}),this.register(function(t){return new id(t)}),this.register(function(t){return new rd(t)}),this.register(function(t){return new nd(t)}),this.register(function(t){return new Zc(t)}),this.register(function(t){return new sd(t)}),this.register(function(t){return new ed(t)}),this.register(function(t){return new od(t)}),this.register(function(t){return new ad(t)}),this.register(function(t){return new Yc(t)}),this.register(function(t){return new ud(t)}),this.register(function(t){return new hd(t)})}load(e,t,i,r){let s=this,a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){let c=Br.extractUrlBase(e);a=Br.resolveURL(c,this.path)}else a=Br.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){r?r(c):console.error(c),s.manager.itemError(e),s.manager.itemEnd(e)},l=new Ks(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{s.parse(c,a,function(d){t(d),s.manager.itemEnd(e)},o)}catch(d){o(d)}},i,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,r){let s,a={},o={},l=new TextDecoder;if(typeof e=="string")s=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===Kp){try{a[Je.KHR_BINARY_GLTF]=new pd(e)}catch(d){r&&r(d);return}s=JSON.parse(a[Je.KHR_BINARY_GLTF].content)}else s=JSON.parse(l.decode(e));else s=e;if(s.asset===void 0||s.asset.version[0]<2){r&&r(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new yd(s,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let d=0;d<this.pluginCallbacks.length;d++){let u=this.pluginCallbacks[d](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,a[u.name]=!0}if(s.extensionsUsed)for(let d=0;d<s.extensionsUsed.length;++d){let u=s.extensionsUsed[d],h=s.extensionsRequired||[];switch(u){case Je.KHR_MATERIALS_UNLIT:a[u]=new Kc;break;case Je.KHR_DRACO_MESH_COMPRESSION:a[u]=new md(s,this.dracoLoader);break;case Je.KHR_TEXTURE_TRANSFORM:a[u]=new fd;break;case Je.KHR_MESH_QUANTIZATION:a[u]=new gd;break;default:h.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(a),c.setPlugins(o),c.parse(i,r)}parseAsync(e,t){let i=this;return new Promise(function(r,s){i.parse(e,t,r,s)})}};function E_(){let n={};return{get:function(e){return n[e]},add:function(e,t){n[e]=t},remove:function(e){delete n[e]},removeAll:function(){n={}}}}var Je={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Yc=class{constructor(e){this.parser=e,this.name=Je.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let i=0,r=t.length;i<r;i++){let s=t[i];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(e){let t=this.parser,i="light:"+e,r=t.cache.get(i);if(r)return r;let s=t.json,a=((s.extensions&&s.extensions[this.name]||{}).lights||[])[e],o,l=new ze(16777215);a.color!==void 0&&l.setRGB(a.color[0],a.color[1],a.color[2],Qt);let c=a.range!==void 0?a.range:0;switch(a.type){case"directional":o=new Js(l),o.target.position.set(0,0,-1),o.add(o.target);break;case"point":o=new fn(l),o.distance=c;break;case"spot":o=new rl(l),o.distance=c,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,o.angle=a.spot.outerConeAngle,o.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,o.target.position.set(0,0,-1),o.add(o.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return o.position.set(0,0,0),o.decay=2,cr(o,a),a.intensity!==void 0&&(o.intensity=a.intensity),o.name=t.createUniqueName(a.name||"light_"+e),r=Promise.resolve(o),t.cache.add(i,r),r}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,i=this.parser,r=i.json.nodes[e],s=(r.extensions&&r.extensions[this.name]||{}).light;return s===void 0?null:this._loadLight(s).then(function(a){return i._getNodeRef(t.cache,s,a)})}},Kc=class{constructor(){this.name=Je.KHR_MATERIALS_UNLIT}getMaterialType(){return Pi}extendParams(e,t,i){let r=[];e.color=new ze(1,1,1),e.opacity=1;let s=t.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){let a=s.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],Qt),e.opacity=a[3]}s.baseColorTexture!==void 0&&r.push(i.assignTexture(e,"map",s.baseColorTexture,zt))}return Promise.all(r)}},Zc=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}},Jc=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,r=i.json.materials[e];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();let s=[],a=r.extensions[this.name];if(a.clearcoatFactor!==void 0&&(t.clearcoat=a.clearcoatFactor),a.clearcoatTexture!==void 0&&s.push(i.assignTexture(t,"clearcoatMap",a.clearcoatTexture)),a.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=a.clearcoatRoughnessFactor),a.clearcoatRoughnessTexture!==void 0&&s.push(i.assignTexture(t,"clearcoatRoughnessMap",a.clearcoatRoughnessTexture)),a.clearcoatNormalTexture!==void 0&&(s.push(i.assignTexture(t,"clearcoatNormalMap",a.clearcoatNormalTexture)),a.clearcoatNormalTexture.scale!==void 0)){let o=a.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new it(o,o)}return Promise.all(s)}},Qc=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_DISPERSION}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}},ed=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,r=i.json.materials[e];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();let s=[],a=r.extensions[this.name];return a.iridescenceFactor!==void 0&&(t.iridescence=a.iridescenceFactor),a.iridescenceTexture!==void 0&&s.push(i.assignTexture(t,"iridescenceMap",a.iridescenceTexture)),a.iridescenceIor!==void 0&&(t.iridescenceIOR=a.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),a.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=a.iridescenceThicknessMinimum),a.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=a.iridescenceThicknessMaximum),a.iridescenceThicknessTexture!==void 0&&s.push(i.assignTexture(t,"iridescenceThicknessMap",a.iridescenceThicknessTexture)),Promise.all(s)}},td=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_SHEEN}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,r=i.json.materials[e];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();let s=[];t.sheenColor=new ze(0,0,0),t.sheenRoughness=0,t.sheen=1;let a=r.extensions[this.name];if(a.sheenColorFactor!==void 0){let o=a.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],Qt)}return a.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=a.sheenRoughnessFactor),a.sheenColorTexture!==void 0&&s.push(i.assignTexture(t,"sheenColorMap",a.sheenColorTexture,zt)),a.sheenRoughnessTexture!==void 0&&s.push(i.assignTexture(t,"sheenRoughnessMap",a.sheenRoughnessTexture)),Promise.all(s)}},id=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,r=i.json.materials[e];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();let s=[],a=r.extensions[this.name];return a.transmissionFactor!==void 0&&(t.transmission=a.transmissionFactor),a.transmissionTexture!==void 0&&s.push(i.assignTexture(t,"transmissionMap",a.transmissionTexture)),Promise.all(s)}},rd=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_VOLUME}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,r=i.json.materials[e];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();let s=[],a=r.extensions[this.name];t.thickness=a.thicknessFactor!==void 0?a.thicknessFactor:0,a.thicknessTexture!==void 0&&s.push(i.assignTexture(t,"thicknessMap",a.thicknessTexture)),t.attenuationDistance=a.attenuationDistance||1/0;let o=a.attenuationColor||[1,1,1];return t.attenuationColor=new ze().setRGB(o[0],o[1],o[2],Qt),Promise.all(s)}},nd=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_IOR}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let r=i.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}},sd=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_SPECULAR}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,r=i.json.materials[e];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();let s=[],a=r.extensions[this.name];t.specularIntensity=a.specularFactor!==void 0?a.specularFactor:1,a.specularTexture!==void 0&&s.push(i.assignTexture(t,"specularIntensityMap",a.specularTexture));let o=a.specularColorFactor||[1,1,1];return t.specularColor=new ze().setRGB(o[0],o[1],o[2],Qt),a.specularColorTexture!==void 0&&s.push(i.assignTexture(t,"specularColorMap",a.specularColorTexture,zt)),Promise.all(s)}},ad=class{constructor(e){this.parser=e,this.name=Je.EXT_MATERIALS_BUMP}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,r=i.json.materials[e];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();let s=[],a=r.extensions[this.name];return t.bumpScale=a.bumpFactor!==void 0?a.bumpFactor:1,a.bumpTexture!==void 0&&s.push(i.assignTexture(t,"bumpMap",a.bumpTexture)),Promise.all(s)}},od=class{constructor(e){this.parser=e,this.name=Je.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,r=i.json.materials[e];if(!r.extensions||!r.extensions[this.name])return Promise.resolve();let s=[],a=r.extensions[this.name];return a.anisotropyStrength!==void 0&&(t.anisotropy=a.anisotropyStrength),a.anisotropyRotation!==void 0&&(t.anisotropyRotation=a.anisotropyRotation),a.anisotropyTexture!==void 0&&s.push(i.assignTexture(t,"anisotropyMap",a.anisotropyTexture)),Promise.all(s)}},ld=class{constructor(e){this.parser=e,this.name=Je.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,i=t.json,r=i.textures[e];if(!r.extensions||!r.extensions[this.name])return null;let s=r.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,s.source,a)}},cd=class{constructor(e){this.parser=e,this.name=Je.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){let t=this.name,i=this.parser,r=i.json,s=r.textures[e];if(!s.extensions||!s.extensions[t])return null;let a=s.extensions[t],o=r.images[a.source],l=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return i.loadTextureImage(e,a.source,l);if(r.extensionsRequired&&r.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return i.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},dd=class{constructor(e){this.parser=e,this.name=Je.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){let t=this.name,i=this.parser,r=i.json,s=r.textures[e];if(!s.extensions||!s.extensions[t])return null;let a=s.extensions[t],o=r.images[a.source],l=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return i.loadTextureImage(e,a.source,l);if(r.extensionsRequired&&r.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return i.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},ud=class{constructor(e){this.name=Je.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){let r=i.extensions[this.name],s=this.parser.getDependency("buffer",r.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(o){let l=r.byteOffset||0,c=r.byteLength||0,d=r.count,u=r.byteStride,h=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(d,u,h,r.mode,r.filter).then(function(p){return p.buffer}):a.ready.then(function(){let p=new ArrayBuffer(d*u);return a.decodeGltfBuffer(new Uint8Array(p),d,u,h,r.mode,r.filter),p})})}else return null}},hd=class{constructor(e){this.name=Je.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;let r=t.meshes[i.mesh];for(let l of r.primitives)if(l.mode!==_i.TRIANGLES&&l.mode!==_i.TRIANGLE_STRIP&&l.mode!==_i.TRIANGLE_FAN&&l.mode!==void 0)return null;let s=i.extensions[this.name].attributes,a=[],o={};for(let l in s)a.push(this.parser.getDependency("accessor",s[l]).then(c=>(o[l]=c,o[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{let c=l.pop(),d=c.isGroup?c.children:[c],u=l[0].count,h=[];for(let p of d){let g=new We,v=new G,f=new Ui,m=new G(1,1,1),T=new Go(p.geometry,p.material,u);for(let M=0;M<u;M++)o.TRANSLATION&&v.fromBufferAttribute(o.TRANSLATION,M),o.ROTATION&&f.fromBufferAttribute(o.ROTATION,M),o.SCALE&&m.fromBufferAttribute(o.SCALE,M),T.setMatrixAt(M,g.compose(v,f,m));for(let M in o)if(M==="_COLOR_0"){let S=o[M];T.instanceColor=new Xn(S.array,S.itemSize,S.normalized)}else M!=="TRANSLATION"&&M!=="ROTATION"&&M!=="SCALE"&&p.geometry.setAttribute(M,o[M]);Lt.prototype.copy.call(T,p),this.parser.assignFinalMaterial(T),h.push(T)}return c.isGroup?(c.clear(),c.add(...h),c):h[0]}))}},Kp="glTF",vs=12,Ph={JSON:1313821514,BIN:5130562},pd=class{constructor(e){this.name=Je.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,vs),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Kp)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let r=this.header.length-vs,s=new DataView(e,vs),a=0;for(;a<r;){let o=s.getUint32(a,!0);a+=4;let l=s.getUint32(a,!0);if(a+=4,l===Ph.JSON){let c=new Uint8Array(e,vs+a,o);this.content=i.decode(c)}else if(l===Ph.BIN){let c=vs+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},md=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Je.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let i=this.json,r=this.dracoLoader,s=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(let d in a){let u=xd[d]||d.toLowerCase();o[u]=a[d]}for(let d in e.attributes){let u=xd[d]||d.toLowerCase();if(a[d]!==void 0){let h=i.accessors[e.attributes[d]],p=Bn[h.componentType];c[u]=p.name,l[u]=h.normalized===!0}}return t.getDependency("bufferView",s).then(function(d){return new Promise(function(u,h){r.decodeDracoFile(d,function(p){for(let g in p.attributes){let v=p.attributes[g],f=l[g];f!==void 0&&(v.normalized=f)}u(p)},o,c,Qt,h)})})}},fd=class{constructor(){this.name=Je.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},gd=class{constructor(){this.name=Je.KHR_MESH_QUANTIZATION}},ol=class extends Gr{constructor(e,t,i,r){super(e,t,i,r)}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r*3+r;for(let a=0;a!==r;a++)t[a]=i[s+a];return t}interpolate_(e,t,i,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,d=r-t,u=(i-t)/d,h=u*u,p=h*u,g=e*c,v=g-c,f=-2*p+3*h,m=p-h,T=1-f,M=m-h+u;for(let S=0;S!==o;S++){let k=a[v+S+o],R=a[v+S+l]*d,E=a[g+S+o],b=a[g+S]*d;s[S]=T*k+M*R+f*E+m*b}return s}},A_=new Ui,vd=class extends ol{interpolate_(e,t,i,r){let s=super.interpolate_(e,t,i,r);return A_.fromArray(s).normalize().toArray(s),s}},_i={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Bn={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Ih={9728:Jt,9729:si,9984:Od,9985:Ss,9986:Un,9987:Wi},kh={33071:ur,33648:Is,10497:cn},uc={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},xd={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Ur={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},R_={CUBICSPLINE:void 0,LINEAR:Vn,STEP:zn},hc={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function C_(n){return n.DefaultMaterial===void 0&&(n.DefaultMaterial=new Vr({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:qi})),n.DefaultMaterial}function Qr(n,e,t){for(let i in t.extensions)n[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function cr(n,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(n.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function L_(n,e,t){let i=!1,r=!1,s=!1;for(let c=0,d=e.length;c<d;c++){let u=e[c];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(r=!0),u.COLOR_0!==void 0&&(s=!0),i&&r&&s)break}if(!i&&!r&&!s)return Promise.resolve(n);let a=[],o=[],l=[];for(let c=0,d=e.length;c<d;c++){let u=e[c];if(i){let h=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):n.attributes.position;a.push(h)}if(r){let h=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):n.attributes.normal;o.push(h)}if(s){let h=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):n.attributes.color;l.push(h)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l)]).then(function(c){let d=c[0],u=c[1],h=c[2];return i&&(n.morphAttributes.position=d),r&&(n.morphAttributes.normal=u),s&&(n.morphAttributes.color=h),n.morphTargetsRelative=!0,n})}function P_(n,e){if(n.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)n.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(n.morphTargetInfluences.length===t.length){n.morphTargetDictionary={};for(let i=0,r=t.length;i<r;i++)n.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function I_(n){let e,t=n.extensions&&n.extensions[Je.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+pc(t.attributes):e=n.indices+":"+pc(n.attributes)+":"+n.mode,n.targets!==void 0)for(let i=0,r=n.targets.length;i<r;i++)e+=":"+pc(n.targets[i]);return e}function pc(n){let e="",t=Object.keys(n).sort();for(let i=0,r=t.length;i<r;i++)e+=t[i]+":"+n[t[i]]+";";return e}function _d(n){switch(n){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function k_(n){return n.search(/\.jpe?g($|\?)/i)>0||n.search(/^data\:image\/jpeg/)===0?"image/jpeg":n.search(/\.webp($|\?)/i)>0||n.search(/^data\:image\/webp/)===0?"image/webp":n.search(/\.ktx2($|\?)/i)>0||n.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var D_=new We,yd=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new E_,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,r=-1,s=!1,a=-1;if(typeof navigator<"u"){let o=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(o)===!0;let l=o.match(/Version\/(\d+)/);r=i&&l?parseInt(l[1],10):-1,s=o.indexOf("Firefox")>-1,a=s?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&r<17||s&&a<98?this.textureLoader=new il(this.options.manager):this.textureLoader=new sl(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Ks(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let i=this,r=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(a){let o={scene:a[0][r.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:r.asset,parser:i,userData:{}};return Qr(s,o,r),cr(o,r),Promise.all(i._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(let l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let r=0,s=t.length;r<s;r++){let a=t[r].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let r=0,s=e.length;r<s;r++){let a=e[r];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(i[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;let r=i.clone(),s=(a,o)=>{let l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(let[c,d]of a.children.entries())s(d,o.children[c])};return s(i,r),r.name+="_instance_"+e.uses[t]++,r}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){let r=e(t[i]);if(r)return r}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let i=[];for(let r=0;r<t.length;r++){let s=e(t[r]);s&&i.push(s)}return i}getDependency(e,t){let i=e+":"+t,r=this.cache.get(i);if(!r){switch(e){case"scene":r=this.loadScene(t);break;case"node":r=this._invokeOne(function(s){return s.loadNode&&s.loadNode(t)});break;case"mesh":r=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(t)});break;case"accessor":r=this.loadAccessor(t);break;case"bufferView":r=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(t)});break;case"buffer":r=this.loadBuffer(t);break;case"material":r=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(t)});break;case"texture":r=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(t)});break;case"skin":r=this.loadSkin(t);break;case"animation":r=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(t)});break;case"camera":r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(e,t)}),!r)throw new Error("Unknown type: "+e);break}this.cache.add(i,r)}return r}getDependencies(e){let t=this.cache.get(e);if(!t){let i=this,r=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(r.map(function(s,a){return i.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Je.KHR_BINARY_GLTF].body);let r=this.options;return new Promise(function(s,a){i.load(Br.resolveURL(t.uri,r.path),s,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){let r=t.byteLength||0,s=t.byteOffset||0;return i.slice(s,s+r)})}loadAccessor(e){let t=this,i=this.json,r=this.json.accessors[e];if(r.bufferView===void 0&&r.sparse===void 0){let a=uc[r.type],o=Bn[r.componentType],l=r.normalized===!0,c=new o(r.count*a);return Promise.resolve(new Gt(c,a,l))}let s=[];return r.bufferView!==void 0?s.push(this.getDependency("bufferView",r.bufferView)):s.push(null),r.sparse!==void 0&&(s.push(this.getDependency("bufferView",r.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",r.sparse.values.bufferView))),Promise.all(s).then(function(a){let o=a[0],l=uc[r.type],c=Bn[r.componentType],d=c.BYTES_PER_ELEMENT,u=d*l,h=r.byteOffset||0,p=r.bufferView!==void 0?i.bufferViews[r.bufferView].byteStride:void 0,g=r.normalized===!0,v,f;if(p&&p!==u){let m=Math.floor(h/p),T="InterleavedBuffer:"+r.bufferView+":"+r.componentType+":"+m+":"+r.count,M=t.cache.get(T);M||(v=new c(o,m*p,r.count*p/d),M=new Bo(v,p/d),t.cache.add(T,M)),f=new Ho(M,l,h%p/d,g)}else o===null?v=new c(r.count*l):v=new c(o,h,r.count*l),f=new Gt(v,l,g);if(r.sparse!==void 0){let m=uc.SCALAR,T=Bn[r.sparse.indices.componentType],M=r.sparse.indices.byteOffset||0,S=r.sparse.values.byteOffset||0,k=new T(a[1],M,r.sparse.count*m),R=new c(a[2],S,r.sparse.count*l);o!==null&&(f=new Gt(f.array.slice(),f.itemSize,f.normalized)),f.normalized=!1;for(let E=0,b=k.length;E<b;E++){let _=k[E];if(f.setX(_,R[E*l]),l>=2&&f.setY(_,R[E*l+1]),l>=3&&f.setZ(_,R[E*l+2]),l>=4&&f.setW(_,R[E*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}f.normalized=g}return f})}loadTexture(e){let t=this.json,i=this.options,r=t.textures[e].source,s=t.images[r],a=this.textureLoader;if(s.uri){let o=i.manager.getHandler(s.uri);o!==null&&(a=o)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,i){let r=this,s=this.json,a=s.textures[e],o=s.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];let c=this.loadImageSource(t,i).then(function(d){d.flipY=!1,d.name=a.name||o.name||"",d.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(d.name=o.uri);let u=(s.samplers||{})[a.sampler]||{};return d.magFilter=Ih[u.magFilter]||si,d.minFilter=Ih[u.minFilter]||Wi,d.wrapS=kh[u.wrapS]||cn,d.wrapT=kh[u.wrapT]||cn,d.generateMipmaps=!d.isCompressedTexture&&d.minFilter!==Jt&&d.minFilter!==si,r.associations.set(d,{textures:e}),d}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){let i=this,r=this.json,s=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let a=r.images[e],o=self.URL||self.webkitURL,l=a.uri||"",c=!1;if(a.bufferView!==void 0)l=i.getDependency("bufferView",a.bufferView).then(function(u){c=!0;let h=new Blob([u],{type:a.mimeType});return l=o.createObjectURL(h),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let d=Promise.resolve(l).then(function(u){return new Promise(function(h,p){let g=h;t.isImageBitmapLoader===!0&&(g=function(v){let f=new qt(v);f.needsUpdate=!0,h(f)}),t.load(Br.resolveURL(u,s.path),g,void 0,p)})}).then(function(u){return c===!0&&o.revokeObjectURL(l),cr(u,a),u.userData.mimeType=a.mimeType||k_(a.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[e]=d,d}assignTexture(e,t,i,r){let s=this;return this.getDependency("texture",i.index).then(function(a){if(!a)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(a=a.clone(),a.channel=i.texCoord),s.extensions[Je.KHR_TEXTURE_TRANSFORM]){let o=i.extensions!==void 0?i.extensions[Je.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let l=s.associations.get(a);a=s.extensions[Je.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),s.associations.set(a,l)}}return r!==void 0&&(a.colorSpace=r),e[t]=a,a})}assignFinalMaterial(e){let t=e.geometry,i=e.material,r=t.attributes.tangent===void 0,s=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+i.uuid,l=this.cache.get(o);l||(l=new Xs,ui.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,l.sizeAttenuation=!1,this.cache.add(o,l)),i=l}else if(e.isLine){let o="LineBasicMaterial:"+i.uuid,l=this.cache.get(o);l||(l=new qs,ui.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,this.cache.add(o,l)),i=l}if(r||s||a){let o="ClonedMaterial:"+i.uuid+":";r&&(o+="derivative-tangents:"),s&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=i.clone(),s&&(l.vertexColors=!0),a&&(l.flatShading=!0),r&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(i))),i=l}e.material=i}getMaterialType(){return Vr}loadMaterial(e){let t=this,i=this.json,r=this.extensions,s=i.materials[e],a,o={},l=s.extensions||{},c=[];if(l[Je.KHR_MATERIALS_UNLIT]){let u=r[Je.KHR_MATERIALS_UNLIT];a=u.getMaterialType(),c.push(u.extendParams(o,s,t))}else{let u=s.pbrMetallicRoughness||{};if(o.color=new ze(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let h=u.baseColorFactor;o.color.setRGB(h[0],h[1],h[2],Qt),o.opacity=h[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",u.baseColorTexture,zt)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),a=this._invokeOne(function(h){return h.getMaterialType&&h.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(h){return h.extendMaterialParams&&h.extendMaterialParams(e,o)})))}s.doubleSided===!0&&(o.side=Ci);let d=s.alphaMode||hc.OPAQUE;if(d===hc.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,d===hc.MASK&&(o.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&a!==Pi&&(c.push(t.assignTexture(o,"normalMap",s.normalTexture)),o.normalScale=new it(1,1),s.normalTexture.scale!==void 0)){let u=s.normalTexture.scale;o.normalScale.set(u,u)}if(s.occlusionTexture!==void 0&&a!==Pi&&(c.push(t.assignTexture(o,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&a!==Pi){let u=s.emissiveFactor;o.emissive=new ze().setRGB(u[0],u[1],u[2],Qt)}return s.emissiveTexture!==void 0&&a!==Pi&&c.push(t.assignTexture(o,"emissiveMap",s.emissiveTexture,zt)),Promise.all(c).then(function(){let u=new a(o);return s.name&&(u.name=s.name),cr(u,s),t.associations.set(u,{materials:e}),s.extensions&&Qr(r,u,s),u})}createUniqueName(e){let t=yt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,i=this.extensions,r=this.primitiveCache;function s(o){return i[Je.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return Dh(l,o,t)})}let a=[];for(let o=0,l=e.length;o<l;o++){let c=e[o],d=I_(c),u=r[d];if(u)a.push(u.promise);else{let h;c.extensions&&c.extensions[Je.KHR_DRACO_MESH_COMPRESSION]?h=s(c):h=Dh(new Oi,c,t),r[d]={primitive:c,promise:h},a.push(h)}}return Promise.all(a)}loadMesh(e){let t=this,i=this.json,r=this.extensions,s=i.meshes[e],a=s.primitives,o=[];for(let l=0,c=a.length;l<c;l++){let d=a[l].material===void 0?C_(this.cache):this.getDependency("material",a[l].material);o.push(d)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(l){let c=l.slice(0,l.length-1),d=l[l.length-1],u=[];for(let p=0,g=d.length;p<g;p++){let v=d[p],f=a[p],m,T=c[p];if(f.mode===_i.TRIANGLES||f.mode===_i.TRIANGLE_STRIP||f.mode===_i.TRIANGLE_FAN||f.mode===void 0)m=s.isSkinnedMesh===!0?new zo(v,T):new pt(v,T),m.isSkinnedMesh===!0&&m.normalizeSkinWeights(),f.mode===_i.TRIANGLE_STRIP?m.geometry=Lh(m.geometry,qd):f.mode===_i.TRIANGLE_FAN&&(m.geometry=Lh(m.geometry,Ro));else if(f.mode===_i.LINES)m=new jo(v,T);else if(f.mode===_i.LINE_STRIP)m=new Yn(v,T);else if(f.mode===_i.LINE_LOOP)m=new qo(v,T);else if(f.mode===_i.POINTS)m=new Xo(v,T);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+f.mode);Object.keys(m.geometry.morphAttributes).length>0&&P_(m,s),m.name=t.createUniqueName(s.name||"mesh_"+e),cr(m,s),f.extensions&&Qr(r,m,f),t.assignFinalMaterial(m),u.push(m)}for(let p=0,g=u.length;p<g;p++)t.associations.set(u[p],{meshes:e,primitives:p});if(u.length===1)return s.extensions&&Qr(r,u[0],s),u[0];let h=new Ii;s.extensions&&Qr(r,h,s),t.associations.set(h,{meshes:e});for(let p=0,g=u.length;p<g;p++)h.add(u[p]);return h})}loadCamera(e){let t,i=this.json.cameras[e],r=i[i.type];if(!r){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new Vt(Np.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):i.type==="orthographic"&&(t=new jn(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),cr(t,i),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],i=[];for(let r=0,s=t.joints.length;r<s;r++)i.push(this._loadNodeShallow(t.joints[r]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(r){let s=r.pop(),a=r,o=[],l=[];for(let c=0,d=a.length;c<d;c++){let u=a[c];if(u){o.push(u);let h=new We;s!==null&&h.fromArray(s.array,c*16),l.push(h)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new Vo(o,l)})}loadAnimation(e){let t=this.json,i=this,r=t.animations[e],s=r.name?r.name:"animation_"+e,a=[],o=[],l=[],c=[],d=[];for(let u=0,h=r.channels.length;u<h;u++){let p=r.channels[u],g=r.samplers[p.sampler],v=p.target,f=v.node,m=r.parameters!==void 0?r.parameters[g.input]:g.input,T=r.parameters!==void 0?r.parameters[g.output]:g.output;v.node!==void 0&&(a.push(this.getDependency("node",f)),o.push(this.getDependency("accessor",m)),l.push(this.getDependency("accessor",T)),c.push(g),d.push(v))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(d)]).then(function(u){let h=u[0],p=u[1],g=u[2],v=u[3],f=u[4],m=[];for(let T=0,M=h.length;T<M;T++){let S=h[T],k=p[T],R=g[T],E=v[T],b=f[T];if(S===void 0)continue;S.updateMatrix&&S.updateMatrix();let _=i._createAnimationTracks(S,k,R,E,b);if(_)for(let x=0;x<_.length;x++)m.push(_[x])}return new Qo(s,void 0,m)})}createNodeMesh(e){let t=this.json,i=this,r=t.nodes[e];return r.mesh===void 0?null:i.getDependency("mesh",r.mesh).then(function(s){let a=i._getNodeRef(i.meshCache,r.mesh,s);return r.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=r.weights.length;l<c;l++)o.morphTargetInfluences[l]=r.weights[l]}),a})}loadNode(e){let t=this.json,i=this,r=t.nodes[e],s=i._loadNodeShallow(e),a=[],o=r.children||[];for(let c=0,d=o.length;c<d;c++)a.push(i.getDependency("node",o[c]));let l=r.skin===void 0?Promise.resolve(null):i.getDependency("skin",r.skin);return Promise.all([s,Promise.all(a),l]).then(function(c){let d=c[0],u=c[1],h=c[2];h!==null&&d.traverse(function(p){p.isSkinnedMesh&&p.bind(h,D_)});for(let p=0,g=u.length;p<g;p++)d.add(u[p]);return d})}_loadNodeShallow(e){let t=this.json,i=this.extensions,r=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let s=t.nodes[e],a=s.name?r.createUniqueName(s.name):"",o=[],l=r._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),s.camera!==void 0&&o.push(r.getDependency("camera",s.camera).then(function(c){return r._getNodeRef(r.cameraCache,s.camera,c)})),r._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let d;if(s.isBone===!0?d=new Ws:c.length>1?d=new Ii:c.length===1?d=c[0]:d=new Lt,d!==c[0])for(let u=0,h=c.length;u<h;u++)d.add(c[u]);if(s.name&&(d.userData.name=s.name,d.name=a),cr(d,s),s.extensions&&Qr(i,d,s),s.matrix!==void 0){let u=new We;u.fromArray(s.matrix),d.applyMatrix4(u)}else s.translation!==void 0&&d.position.fromArray(s.translation),s.rotation!==void 0&&d.quaternion.fromArray(s.rotation),s.scale!==void 0&&d.scale.fromArray(s.scale);return r.associations.has(d)||r.associations.set(d,{}),r.associations.get(d).nodes=e,d}),this.nodeCache[e]}loadScene(e){let t=this.extensions,i=this.json.scenes[e],r=this,s=new Ii;i.name&&(s.name=r.createUniqueName(i.name)),cr(s,i),i.extensions&&Qr(t,s,i);let a=i.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(r.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let d=0,u=l.length;d<u;d++)s.add(l[d]);let c=d=>{let u=new Map;for(let[h,p]of r.associations)(h instanceof ui||h instanceof qt)&&u.set(h,p);return d.traverse(h=>{let p=r.associations.get(h);p!=null&&u.set(h,p)}),u};return r.associations=c(s),s})}_createAnimationTracks(e,t,i,r,s){let a=[],o=e.name?e.name:e.uuid,l=[];Ur[s.path]===Ur.weights?e.traverse(function(h){h.morphTargetInfluences&&l.push(h.name?h.name:h.uuid)}):l.push(o);let c;switch(Ur[s.path]){case Ur.weights:c=xr;break;case Ur.rotation:c=_r;break;case Ur.position:case Ur.scale:c=br;break;default:switch(i.itemSize){case 1:c=xr;break;case 2:case 3:default:c=br;break}break}let d=r.interpolation!==void 0?R_[r.interpolation]:Vn,u=this._getArrayFromAccessor(i);for(let h=0,p=l.length;h<p;h++){let g=new c(l[h]+"."+Ur[s.path],t.array,u,d);r.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),a.push(g)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let i=_d(t.constructor),r=new Float32Array(t.length);for(let s=0,a=t.length;s<a;s++)r[s]=t[s]*i;t=r}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(t){let i=this instanceof _r?vd:ol;return new i(this.times,this.values,this.getValueSize()/3,t)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function U_(n,e,t){let i=e.attributes,r=new Si;if(i.POSITION!==void 0){let o=t.json.accessors[i.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(r.set(new G(l[0],l[1],l[2]),new G(c[0],c[1],c[2])),o.normalized){let d=_d(Bn[o.componentType]);r.min.multiplyScalar(d),r.max.multiplyScalar(d)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let s=e.targets;if(s!==void 0){let o=new G,l=new G;for(let c=0,d=s.length;c<d;c++){let u=s[c];if(u.POSITION!==void 0){let h=t.json.accessors[u.POSITION],p=h.min,g=h.max;if(p!==void 0&&g!==void 0){if(l.setX(Math.max(Math.abs(p[0]),Math.abs(g[0]))),l.setY(Math.max(Math.abs(p[1]),Math.abs(g[1]))),l.setZ(Math.max(Math.abs(p[2]),Math.abs(g[2]))),h.normalized){let v=_d(Bn[h.componentType]);l.multiplyScalar(v)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(o)}n.boundingBox=r;let a=new hi;r.getCenter(a.center),a.radius=r.min.distanceTo(r.max)/2,n.boundingSphere=a}function Dh(n,e,t){let i=e.attributes,r=[];function s(a,o){return t.getDependency("accessor",a).then(function(l){n.setAttribute(o,l)})}for(let a in i){let o=xd[a]||a.toLowerCase();o in n.attributes||r.push(s(i[a],o))}if(e.indices!==void 0&&!n.index){let a=t.getDependency("accessor",e.indices).then(function(o){n.setIndex(o)});r.push(a)}return tt.workingColorSpace!==Qt&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${tt.workingColorSpace}" not supported.`),cr(n,e),U_(n,e,t),Promise.all(r).then(function(){return e.targets!==void 0?L_(n,e.targets,t):n})}var bd=class extends $s{constructor(){super();let e=new pn;e.deleteAttribute("uv");let t=new Vr({side:Zt}),i=new Vr,r=new fn(16777215,900,28,2);r.position.set(.418,16.199,.3),this.add(r);let s=new pt(e,t);s.position.set(-.757,13.219,.717),s.scale.set(31.713,28.305,28.591),this.add(s);let a=new pt(e,i);a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),this.add(a);let o=new pt(e,i);o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),this.add(o);let l=new pt(e,i);l.position.set(6.167,.857,7.803),l.rotation.set(0,.561,0),l.scale.set(3.927,6.285,3.687),this.add(l);let c=new pt(e,i);c.position.set(-2.017,.018,6.124),c.rotation.set(0,.333,0),c.scale.set(2.002,4.566,2.064),this.add(c);let d=new pt(e,i);d.position.set(2.291,-.756,-2.621),d.rotation.set(0,-.286,0),d.scale.set(1.546,1.552,1.496),this.add(d);let u=new pt(e,i);u.position.set(-2.193,-.369,-5.547),u.rotation.set(0,.516,0),u.scale.set(3.875,3.487,2.986),this.add(u);let h=new pt(e,In(50));h.position.set(-16.116,14.37,8.208),h.scale.set(.1,2.428,2.739),this.add(h);let p=new pt(e,In(50));p.position.set(-16.109,18.021,-8.207),p.scale.set(.1,2.425,2.751),this.add(p);let g=new pt(e,In(17));g.position.set(14.904,12.198,-1.832),g.scale.set(.15,4.265,6.331),this.add(g);let v=new pt(e,In(43));v.position.set(-.462,8.89,14.52),v.scale.set(4.38,5.441,.088),this.add(v);let f=new pt(e,In(20));f.position.set(3.235,11.486,-12.541),f.scale.set(2.5,2,.1),this.add(f);let m=new pt(e,In(100));m.position.set(0,20,0),m.scale.set(1,.1,1),this.add(m)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function In(n){let e=new Pi;return e.color.setScalar(n),e}var N_="/models/adversary-masc.glb",Sd=class{constructor(e,t){this.canvas=e,this.ctx=e.getContext("2d"),this.disposed=!1,this.img=new Image,this.loaded=!1,this.level=0,this.speaking=!1,this.nodUntil=0,this.bars=Array(24).fill(0),this.startTime=performance.now(),this.img.src=`/img/figures/${t}.jpg`,this.img.onload=()=>{this.loaded=!0,this.resize()},this.resize=()=>{if(this.disposed)return;let i=Math.min(window.devicePixelRatio||1,2),r=this.canvas.clientWidth||340,s=this.canvas.clientHeight||260;(this.canvas.width!==Math.round(r*i)||this.canvas.height!==Math.round(s*i))&&(this.canvas.width=Math.round(r*i),this.canvas.height=Math.round(s*i))},this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(e),this.loop=()=>{this.disposed||(this.raf=requestAnimationFrame(this.loop),this.update(),this.render())},this.loop()}nod(){this.nodUntil=performance.now()+420}stop(){}dispose(){this.disposed=!0,cancelAnimationFrame(this.raf),this.ro?.disconnect()}update(){let e=Fe.frame();this.speaking=e.speaking,this.level+=((e.speaking?e.level:0)-this.level)*.25;let t=(performance.now()-this.startTime)/1e3,i=this.bars.length;for(let r=0;r<i;r++){let s;if(e.speaking&&e.freq){let a=2+Math.floor(Math.pow(r/i,1.6)*90);s=Math.min(1,e.freq[a]/255*1.25)}else s=.06+Math.sin(t*2+r*.45)*.04;this.bars[r]+=(s-this.bars[r])*.35}}render(){let{ctx:e,canvas:t}=this;if(!e||!this.loaded)return;let i=t.width,r=t.height;e.clearRect(0,0,i,r);let s=this.img.width/this.img.height,a=r*.14,o=r-a*.4,l=o*s;l>i&&(l=i,o=i/s);let c=(i-l)/2,d=Math.max(0,(r-a*.4-o)/2);e.save(),e.filter="blur(22px) brightness(0.32)",e.drawImage(this.img,-i*.1,-r*.1,i*1.2,r*1.2),e.restore();let u=performance.now(),h=1+Math.sin(u*.0016)*.003+this.level*.004,p=u<this.nodUntil?Math.sin((this.nodUntil-u)/420*Math.PI)*.012:0;if(e.save(),e.translate(i/2,r/2),e.scale(h,h),e.rotate(p),e.translate(-i/2,-r/2),e.drawImage(this.img,c,d,l,o),e.restore(),c>4){let R=Math.min(40,c+10),E=e.createLinearGradient(c,0,c+R,0);E.addColorStop(0,"rgba(7,8,11,0.9)"),E.addColorStop(1,"rgba(7,8,11,0)"),e.fillStyle=E,e.fillRect(c-1,0,R,r),E=e.createLinearGradient(c+l-R,0,c+l,0),E.addColorStop(0,"rgba(7,8,11,0)"),E.addColorStop(1,"rgba(7,8,11,0.9)"),e.fillStyle=E,e.fillRect(c+l-R+1,0,R,r)}let g=e.createLinearGradient(0,r*.62,0,r);g.addColorStop(0,"rgba(7,8,11,0)"),g.addColorStop(1,"rgba(7,8,11,0.92)"),e.fillStyle=g,e.fillRect(0,r*.62,i,r*.38);let v=this.bars.length,f=Math.min(i*.6,320*(window.devicePixelRatio||1)),m=f/v,T=Math.max(2,m*.55),M=(i-f)/2,S=r-r*.05,k=a;for(let R=0;R<v;R++){let E=Math.max(.05,this.bars[R])*k;e.fillStyle=this.speaking?`rgba(255,${120+Math.round(this.bars[R]*90)},90,0.95)`:"rgba(148,163,184,0.45)",e.beginPath(),e.roundRect?e.roundRect(M+R*m,S-E,T,E,T/2):e.rect(M+R*m,S-E,T,E),e.fill()}}};function O_(n,e={}){return e.figureId?new Sd(n,e.figureId):new wd(n,e.personaVisual||void 0,e)}var wd=class{constructor(e,t=N_,i={}){this.disposed=!1,this.human=null,this.clock=new al,this.onError=i.onError,this.loop=()=>{if(this.disposed)return;this.raf=requestAnimationFrame(this.loop);let r=Math.min(this.clock.getDelta(),.05);this.human?.update(r,this.clock.elapsedTime),this.renderer.render(this.scene,this.camera)},this.renderer=new Fo({canvas:e,antialias:!0,alpha:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.setClearColor(0,0),this.renderer.toneMapping=Ud,this.renderer.toneMappingExposure=1.15,this.scene=new $s,this.camera=new Vt(30,1,.1,100),this.root=new Ii,this.root.position.y=-.05,this.scene.add(this.root),this.buildLights(),this.ready=T_(M_,Xc,t).then(r=>{if(this.disposed)return r.dispose();this.human=r,this.root.add(r.group),e.dispatchEvent(new CustomEvent("avatar-ready"))}).catch(r=>{console.error("[avatar] failed to load model",t,r),this.onError?.(r)}),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(e),this.resize(),this.loop()}buildLights(){this.scene.add(new nl(2303803,.75));let e=new Js(16774634,2.8);e.position.set(2.2,3,3.6),this.scene.add(e);let t=new fn(9353445,40,25,1.4);t.position.set(-2.8,1.8,2.2),this.scene.add(t);let i=new fn(16316668,30,22,3.2);i.position.set(0,3.5,-2.8),this.scene.add(i);try{let r=new qn(this.renderer);this.scene.environment=r.fromScene(new bd,.04).texture,r.dispose()}catch{}}nod(){this.human?.nod()}stop(){}dispose(){this.disposed=!0,cancelAnimationFrame(this.raf),this.ro?.disconnect(),this.human?.dispose(),this.human=null,this.renderer.dispose(),this.renderer.forceContextLoss?.()}resize(){let e=this.renderer.domElement,t=e.clientWidth||1,i=e.clientHeight||1;this.renderer.setSize(t,i,!1),this.camera.aspect=t/i;let r=t/i<1,s=t/i>1.8,a=r?3.4:s?3.5:2.9,o=r?-.14:s?.02:-.04;this.camera.position.set(0,o+.06,a),this.camera.lookAt(0,o,0),this.camera.updateProjectionMatrix()}};function Le(n){return String(n??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Kn(n){return n==null?"\u2014":Number(n).toFixed(1).replace(/\.0$/,"")}function Hr({title:n,body:e="",actions:t=[]}){return new Promise(i=>{let r=document.activeElement,s=document.createElement("div");s.className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 pb-[calc(1rem+var(--safe-bottom))] backdrop-blur-sm animate-fade-in sm:items-center",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.setAttribute("aria-labelledby","ui-modal-title"),s.innerHTML=`<div class="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-ink-700 bg-ink-900 p-5 shadow-2xl animate-pop-in sm:p-6">
      <h3 id="ui-modal-title" class="text-display-sm text-white">${Le(n)}</h3>
      ${e?`<p class="mt-2 text-sm leading-relaxed text-slate-400">${e}</p>`:""}
      <div class="mt-5 flex flex-col gap-2.5 sm:mt-6">${t.map((c,d)=>`<button type="button" data-idx="${d}" class="${c.kind==="primary"?"btn-primary":c.kind==="danger"?"btn-danger":"btn-ghost"} w-full ${c.hint?"flex-col items-start gap-0.5 px-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5":"justify-center"} py-3"><span>${Le(c.label)}</span>${c.hint?`<span class="shrink-0 whitespace-nowrap text-xs font-medium opacity-70">${Le(c.hint)}</span>`:""}</button>`).join("")}</div></div>`;let a=c=>{document.removeEventListener("keydown",o),s.remove(),r?.isConnected&&r!==document.body&&!r.matches("textarea,input,[contenteditable]")&&r.focus({preventScroll:!0}),i(c)},o=c=>{if(c.key==="Escape")return a(null);if(c.key!=="Tab")return;let d=[...s.querySelectorAll("button")],u=d.indexOf(document.activeElement);(u<0||(c.shiftKey?u===0:u===d.length-1))&&(c.preventDefault(),d[c.shiftKey?d.length-1:0]?.focus())};document.addEventListener("keydown",o),s.addEventListener("click",c=>{if(c.target===s)return a(null);let d=c.target.closest("[data-idx]");d&&a(t[Number(d.dataset.idx)].value)}),document.body.appendChild(s);let l=[...s.querySelectorAll("button")];(l.find(c=>c.classList.contains("btn-primary"))||l.find(c=>!c.classList.contains("btn-danger"))||l[0])?.focus()})}var F_=new Set(["debate","historical"]),Zp={round:"Round",question:"Question",exchange:"Exchange",bars:"Round"};async function Jp(n,e){n.innerHTML='<div class="mx-auto max-w-6xl px-4 py-6" id="session-root"><div class="py-16 text-center text-slate-500"><span class="spinner mr-2 align-[-3px]"></span>Loading your session\u2026</div></div>';let t=n.querySelector("#session-root"),i=await B_(e);if(t.isConnected){if(!i||i.error){let r=i?.error instanceof Ct?i.error.status:0;!i||r===404?t.innerHTML='<div class="py-16 text-center text-slate-400"><h1 class="mb-3 text-display-md text-white">Session not found</h1><p class="mb-6 text-sm">That session doesn\u2019t exist or was deleted.</p><a href="#/" class="btn-primary">Back to practice</a></div>':r===401?(ea(null),location.hash=`#/login?next=${encodeURIComponent("/session/"+e)}`):t.replaceChildren(Jn("Couldn\u2019t load your session. Check your connection and try again.",()=>Jp(n,e)));return}H_(t,e,i.meta,i.data)}}async function B_(n){let e=null;try{let c=sessionStorage.getItem(`adversaryai:session:${n}`);c&&(e=JSON.parse(c))}catch{}let t;try{t=await St(`/api/debates/${encodeURIComponent(n)}`)}catch(c){return console.error("Failed to load session",c),{error:c}}let i=t.debate;if(!i)return null;let r=i.setup&&typeof i.setup=="object"?i.setup:(()=>{try{return JSON.parse(i.setup_json||"{}")}catch{return{}}})(),s=null;try{s=(await Qn()).find(c=>c.id===i.mode)||null}catch{}let a=r.figureId||(i.mode==="historical"?i.personality:void 0),o=e?.personaVisual||Wh(r.personaVisual).model;return{meta:{modeId:i.mode||"debate",modeName:s?.name||e?.modeName||"Session",topic:i.topic,personaLabel:e?.personaLabel||i.personaLabel||s?.name||"Opponent",judgeEnabled:r.judge==="1",personaVisual:o,targetRounds:parseInt(r.targetRounds||"0",10)||0,resolvedFirstSpeaker:r.resolvedFirstSpeaker||"user",debateStyle:r.debateStyle||null,userSide:r.userSide||null,figureId:a||void 0,ended:!!i.ended_at,difficulty:r.difficulty||null,actingScript:i.mode==="acting"&&r.actingMode==="script"&&r.script?{script:r.script,role:r.scriptRole}:null},data:t}}function H_(n,e,t,i){let r=Id(t.modeId),s=Zp[r.unit]||"Round",a=F_.has(t.modeId),o=t.targetRounds||0;t.topic&&(document.title=`${t.topic} \xB7 AdversaryAI`),n.className="mx-auto w-full max-w-6xl px-4",n.innerHTML=`
    <div class="session-shell" id="session-shell">
      <aside class="session-aside shrink-0 pt-2 lg:pt-6">
        <div class="mb-2.5 hidden items-center justify-between gap-3 lg:flex">
          <div class="min-w-0">
            <p class="eyebrow truncate !tracking-[0.14em]">${Le(t.modeName)}</p>
            <h2 class="truncate text-lg font-bold leading-tight text-white">${Le(t.personaLabel)}</h2>
          </div>
          <span id="round-badge" class="badge border-accent-500/30 bg-accent-500/10 text-accent-300"></span>
        </div>
        <div class="avatar-stage-wrap session-stage border border-ink-700 shadow-card">
          <canvas id="avatar-canvas" class="avatar-canvas" aria-label="${Le(t.personaLabel)}"></canvas>
          <div id="avatar-loading" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500 ${t.figureId?"hidden":""}"><span class="spinner mr-2"></span>Loading ${Le(t.personaLabel)}\u2026</div>
          <div class="stage-tl">
            ${a?'<span id="phase-badge" class="badge absolute left-3 top-3 border-white/10 bg-black/60 text-slate-200 backdrop-blur"></span>':""}
            <span id="round-badge-m" class="badge border-white/10 bg-black/60 text-slate-200 backdrop-blur lg:hidden"></span>
            <span id="status-pill" class="badge absolute bottom-3 left-3 border-white/10 bg-black/60 text-slate-200 backdrop-blur"><span id="status-dot" class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span><span id="status-text">Ready</span></span>
            <span id="photo-badge" class="absolute right-3 top-3 hidden"></span>
          </div>
        </div>
        <div class="session-controls mt-2.5 flex items-center gap-2">
          <span class="stage-name flex min-w-0 flex-1 lg:hidden" aria-hidden="true"><span class="badge min-w-0 shrink"><span class="truncate">${Le(t.personaLabel)}</span></span></span>
          <button id="replay-btn" type="button" class="btn-ghost btn-sm h-11 w-11 px-0 sm:w-auto sm:px-3 lg:h-auto" disabled aria-label="Replay last reply">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg><span class="hidden sm:inline">Replay</span></button>
          <button id="stop-btn" type="button" class="btn-ghost btn-sm h-11 w-11 px-0 sm:w-auto sm:px-3 lg:h-auto" disabled aria-label="Stop audio">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg><span class="hidden sm:inline">Stop</span></button>
          <button id="size-btn" type="button" class="btn-ghost btn-sm h-11 w-11 px-0 lg:hidden" aria-pressed="false" aria-label="Show more of ${Le(t.personaLabel)}" title="Bigger / smaller"></button>
          ${t.actingScript?'<button id="cue-btn" type="button" class="btn-ghost btn-sm h-11 whitespace-nowrap lg:h-auto" title="Show your next line" aria-label="Show your next line">Line?</button>':""}
          <button id="view-btn" type="button" class="btn-ghost btn-sm hidden h-11 whitespace-nowrap lg:h-auto" title="Owner: switch between video and 3D"></button>
          <button id="end-btn" type="button" class="btn-primary btn-sm ml-auto h-11 shrink-0 whitespace-nowrap lg:h-auto">Get my scorecard</button>
        </div>
        <div id="upsell-slot" class="hidden"></div>
        <div id="photo-debug" class="mt-2.5 hidden items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs leading-relaxed text-amber-200 break-words"><span class="min-w-0 flex-1"></span><button type="button" class="-my-1 -mr-1 shrink-0 rounded px-1.5 py-1 text-amber-200/80 hover:text-amber-100" aria-label="Hide this message">\u2715</button></div>
      </aside>

      <section class="flex min-h-0 min-w-0 flex-1 flex-col pt-2 lg:pt-6">
        <div class="session-topic mb-1.5 shrink-0 sm:mb-2">
          <h1 id="session-topic" class="text-[15px] font-bold leading-snug text-white line-clamp-1 max-sm:cursor-pointer sm:text-lg sm:line-clamp-2 lg:text-xl" title="${Le(t.topic||"")}">${Le(t.topic||"Live session")}</h1>
          <div class="mt-1 flex flex-nowrap items-center gap-1.5 overflow-hidden sm:mt-1.5 sm:flex-wrap" id="meta-badges">
            ${t.debateStyle&&a?`<span class="meta-extra badge hidden border-ink-700 bg-ink-900 text-slate-400 sm:inline-flex">${Le((jh.find(U=>U.v===t.debateStyle)||{}).t||t.debateStyle)}</span>`:""}
            ${t.userSide&&t.userSide!=="open"?`<span class="badge border-ink-700 bg-ink-900 text-slate-400">You argue ${t.userSide==="for"?"FOR":"AGAINST"}</span>`:""}
            ${t.difficulty?`<span class="meta-extra badge hidden border-ink-700 bg-ink-900 text-slate-400 sm:inline-flex">${Vm[t.difficulty]||""}</span>`:""}
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
            <textarea id="msg-input" aria-label="Your reply" rows="1" maxlength="4000" class="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-snug text-white placeholder:text-slate-500 focus:outline-none" placeholder=""></textarea>
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
    </div>`;let l=U=>n.querySelector(U),c=l("#transcript"),d=l("#msg-input"),u=l("#send-btn"),h=l("#mic-btn"),p=l("#mic-hint"),g=l("#replay-btn"),v=l("#stop-btn"),f=l("#end-btn"),m=l("#quota-slot"),T=l("#banner-slot"),M=l("#sr-live"),S=l("#jump-btn");l("#session-topic").addEventListener("click",U=>U.currentTarget.classList.toggle("line-clamp-1"));let k;try{k=O_(l("#avatar-canvas"),{figureId:t.figureId,personaVisual:t.personaVisual,onError:()=>{let U=l("#avatar-loading");U&&(U.innerHTML="Avatar unavailable \u2014 voice and text still work.")}})}catch(U){console.warn("[avatar] unavailable:",U?.message||U),k={dispose(){}};let ee=l("#avatar-loading");ee&&(ee.innerHTML="Avatar unavailable on this device \u2014 voice and text still work.")}l("#avatar-canvas").addEventListener("avatar-ready",()=>l("#avatar-loading")?.classList.add("hidden"),{once:!0}),ca();let R=null,E,b=Promise.race([new Promise(U=>E=U),new Promise(U=>setTimeout(U,25e3))]),_=l("#photo-badge"),x=l("#photo-debug"),C=(U,ee="")=>{_.className=`absolute right-3 top-3 max-w-[calc(100%-24px)] ${U?"":"hidden"}`,_.innerHTML=U?`<span class="badge inline-block max-w-full truncate whitespace-nowrap border-white/10 bg-black/60 backdrop-blur ${ee}">${U}</span>`:""},z="";x?.querySelector("button").addEventListener("click",()=>{z=x.dataset.msg||"",x.classList.add("hidden"),x.classList.remove("flex")});let W=U=>{if(!x)return;let ee=!!U&&U!==z;x.dataset.msg=U||"",x.firstElementChild.textContent=U?`Photoreal error (owner only): ${U}`:"",x.classList.toggle("hidden",!ee),x.classList.toggle("flex",ee)},N=U=>`${Math.max(0,Math.floor((U||0)/60))} min left`,P=l("#avatar-canvas").parentElement,L="aai_photoreal_hint",I=U=>{try{if(U===void 0)return localStorage.getItem(L)==="1";U?localStorage.setItem(L,"1"):localStorage.removeItem(L)}catch{return!1}};!t.figureId&&I()&&P.classList.add("photoreal-probe");let O=U=>{P.classList.remove("photoreal-probe"),P.classList.add("photoreal-mode");let ee=P.querySelector(".photoreal-poster");ee||(ee=document.createElement("div"),ee.className="photoreal-poster",P.prepend(ee)),ee.innerHTML=`${U?`<img src="${Le(U)}" alt="" />`:""}<span class="photoreal-poster-msg"><span data-spin class="spinner !h-3.5 !w-3.5"></span><span data-msg>Connecting to your opponent\u2026</span></span>`},J=(U,ee=!1)=>{let Q=P.querySelector(".photoreal-poster-msg");Q&&(Q.style.display=U?"":"none",Q.querySelector("[data-msg]").textContent=U||"",Q.querySelector("[data-spin]").style.display=ee?"":"none")},Z=()=>{P.classList.remove("photoreal-probe","photoreal-mode"),P.querySelector(".photoreal-poster")?.remove()};(async()=>{let U=await Zn().catch(()=>null);if(!D||!U?.photoreal||t.figureId||X)return Z(),E();if(U.isOwner){let Q="aai_owner_view",ge="video";try{ge=localStorage.getItem(Q)||"video"}catch{}let be=l("#view-btn");if(be.textContent=ge==="3d"?"Show video":"Show 3D",be.classList.remove("hidden"),be.onclick=()=>{try{localStorage.setItem(Q,ge==="3d"?"video":"3d")}catch{}location.reload()},ge==="3d")return Z(),C("3D view (owner)","text-slate-300"),E()}if(!U.champion){Z(),I(!1),E();let Q=l("#upsell-slot");Q.className="mt-2.5 hidden lg:block",Q.innerHTML='<a href="#/account?plans=1" class="flex items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-3.5 py-2.5 text-xs text-amber-100 transition-colors hover:border-amber-400/50"><span><span class="font-semibold text-amber-300">\u2726 Champion</span> \u2014 face a photoreal opponent on video</span><span aria-hidden="true">\u2192</span></a>';return}let ee=await fu(e);if(!D||!ee?.enabled||!ee.eligible)return Z(),ee?.owner&&ee.outOfCredits&&W("LiveAvatar is out of credits \u2014 video is paused for everyone (3D) until you add credits at liveavatar.com. Rechecks every 15 min."),ee&&!ee.eligible&&I(!1),E();if(!ee.mapped){Z(),E(),ee.owner&&C("Photoreal: no avatar for this opponent","text-slate-300");return}if(ee.remainingSeconds<60)return Z(),E(),C("Video minutes used this month","text-slate-300");I(!0),O(ee.avatarImage),R=new ua({stage:P,debateId:e,onStatus:Q=>{D&&(Q.state!=="connecting"&&E(),Q.state!=="error"&&W(null),Q.state==="connecting"?(C(""),J("Connecting to your opponent\u2026",!0)):Q.state==="live"?(J(""),C(`<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>Photoreal \xB7 ${N(Q.remainingSeconds)}`,"text-amber-200")):Q.state==="needs_tap"?(J("Tap to start the video"),C("")):Q.state==="sleeping"||Q.state==="off"?(J("Video resumes when you reply"),C("")):Q.state==="error"?(Z(),Q.error==="video_minutes_exhausted"?C("Video minutes used this month","text-slate-300"):(C("Photoreal unavailable \u2014 using 3D","text-slate-300"),W(ee.owner&&(Q.detail||Q.error)||null))):C(""))}}),X||R.start()})();let re=[],ae=0,K=!1,D=!0,X=!!t.ended,le=!1,oe=!1,ke=null,xe=null,Re=0,Qe=null,Ne=!1,bt=!1,V=null,Pt=0,Oe=!1,je=!1,we=!1,rt=!1,Pe=!1,A=!1,y=0,$=null,te=()=>Oe||we||Pe||A,se=()=>{$?.remove(),$=null},ie=()=>{$||!D||($=document.createElement("button"),$.type="button",$.className="absolute inset-0 z-[3] flex items-center justify-center bg-black/55 text-white",$.innerHTML='<span class="rounded-full border border-white/20 bg-black/60 px-5 py-3 text-sm font-semibold backdrop-blur">\u25B6 Tap to keep listening</span>',$.addEventListener("click",()=>{Fe.unlock(),se()}),P.appendChild($))},Ae=Fe.onBlocked(U=>U?ie():se()),he=null,_e=!1,Ye=0,de=async()=>{if(clearTimeout(Ye),Ye=setTimeout(()=>{he?.release().catch(()=>{}),he=null},5*6e4),!(!("wakeLock"in navigator)||he||_e||!D||X||document.visibilityState!=="visible")){_e=!0;try{let U=await navigator.wakeLock.request("screen");if(!D||X)return void U.release().catch(()=>{});he=U,U.addEventListener("release",()=>he===U&&(he=null))}catch{}finally{_e=!1}}},ye=()=>{if(D){if(document.visibilityState!=="visible"){clearTimeout(Hi),Ne&&window.matchMedia("(pointer: coarse)").matches&&Ut();return}y=performance.now(),de(),Fe.state==="idle"&&Ar()}};document.addEventListener("visibilitychange",ye);let De=Fe.on(U=>{U==="idle"&&se(),$t()}),Ue=()=>{if(D){D=!1;try{ke?.abort()}catch{}xe?.cancel(),Fe.stop();try{Qe?.abort()}catch{}De(),Ae(),im?.(),clearTimeout(Hi),document.removeEventListener("visibilitychange",ye),se(),clearTimeout(Ye),he?.release().catch(()=>{}),he=null,R?.dispose(),Fe.reset(),k.dispose(),window.removeEventListener("hashchange",Ue),window.__sessionCleanup===Ue&&(window.__sessionCleanup=null)}};window.__sessionCleanup?.(),window.__sessionCleanup=Ue,window.addEventListener("hashchange",Ue),Fe.reset();let Se=/\b(?:\w*(?:f+u+c+k+|s+h+i+t+)\w*|(?:b+i+t+c+h+|d+a+m+n+|d+i+c+k+|p+u+s+s+y+|c+u+n+t+|w+h+o+r+e+|s+l+u+t+|b+o+o+b+|p+e+n+i+s+|c+l+i+t+)(?:e+s|s|y|ed|ing|er|ers)?|t+i+t+s+|a+s+s+(?:h+o+l+e+s?|e+s)?|n+i+g+g+\w*|f+a+g+(?:g+o+t+s?)?|v+a+g+i+n+a+|o+r+g+a+s+m+|m+a+s+t+u+r+b+a+t+\w*|p+o+r+n+\w*|h+e+n+t+a+i+|r+a+p+i+s+t+s?|m+o+l+e+s+t+\w*)\b/gi,Ke=U=>U.replace(/\*[^*\n]{0,120}\*/g,"").replace(/\([^()\n]{0,120}\)/g,"").replace(/\[[^\]\n]{0,120}\]/g,""),Ve=U=>t.modeId==="rapbattle"?Ke(U).replace(Se,"****"):U,et=t.actingScript?qh(wc(t.actingScript.script),t.actingScript.role):null,B=()=>n.querySelector("#cue-box"),me=()=>B()?.classList.add("hidden");n.querySelector("#cue-btn")?.addEventListener("click",()=>{let U=B();if(!U)return;if(!U.classList.contains("hidden"))return me();let ee=et?.[ae];U.innerHTML=ee?`<span class="text-[11px] font-semibold uppercase tracking-wide text-accent-400">Your line</span><br>${Le(ee)}`:"That\u2019s the end of your lines \u2014 tap End &amp; grade for your notes.",U.classList.remove("hidden")});function Y(U,ee,Q){if(!et||!U||!et[Q])return;let ge=Xm(et[Q],ee),be=ge>=90,gt=document.createElement("div");gt.className=`mt-2 border-t border-white/10 pt-2 text-xs ${be?"text-emerald-300":"text-amber-300"}`,gt.textContent=be?`\u2713 ${ge}% on script`:`${ge}% on script \u2014 the line was: \u201C${et[Q]}\u201D`,U.row.firstElementChild.appendChild(gt)}let ne=window.matchMedia("(max-width: 1023px)"),fe=!0,ue=null,qe=-1,vt=null;function wt(U){if(U&&(fe=!0),!fe)return void(S.hidden=!1);let ee=c.scrollHeight-c.clientHeight,Q=ue?.isConnected?Math.min(ee,ue.offsetTop-8):ee;c.scrollTop=Q,qe=c.scrollTop,S.hidden=Q>=ee-1}c.addEventListener("scroll",()=>{Math.abs(c.scrollTop-qe)<2||(qe=-1,fe=c.scrollHeight-c.scrollTop-c.clientHeight<40,fe&&(S.hidden=!0,ue&&c.scrollTop>ue.offsetTop+32&&(ue=null)))},{passive:!0}),S.addEventListener("click",()=>{ue=null,wt(!0)}),new ResizeObserver(()=>fe&&wt(!1)).observe(c);let nt={msg:"",at:0};function ri(U){U=String(U||"").trim(),!(!U||U===nt.msg&&Date.now()-nt.at<4e3)&&(nt={msg:U,at:Date.now()},M.textContent="",requestAnimationFrame(()=>M.textContent=U))}function fi(U){let ee=U?.row;!ee?.isConnected||ee.dataset.said||(ee.dataset.said="1",ee.firstElementChild?.removeAttribute("aria-busy"),ri(`${t.personaLabel}: ${U.textEl.textContent}`))}let wr=l("#session-shell");d.addEventListener("focus",()=>wr.classList.add("kb")),d.addEventListener("blur",()=>wr.classList.remove("kb"));let is="aai_stage_big",gi=l("#size-btn"),Mr=U=>{wr.classList.toggle("stage-big",U),gi.setAttribute("aria-pressed",String(U)),gi.innerHTML=U?Xe.shrink:Xe.grow,gi.setAttribute("aria-label",U?`Show less of ${t.personaLabel}`:`Show more of ${t.personaLabel}`);try{localStorage.setItem(is,U?"1":"0")}catch{}};try{Mr(localStorage.getItem(is)==="1")}catch{Mr(!1)}gi.addEventListener("click",()=>Mr(!wr.classList.contains("stage-big"))),l("#avatar-canvas").addEventListener("click",()=>{window.matchMedia("(min-width: 1024px)").matches||P.querySelector(".photoreal-poster")||Mr(!wr.classList.contains("stage-big"))});function Bi(U,ee){re.push({role:U,text:ee});let Q=document.createElement("div"),ge=U==="you",be=!ge&&!ee;Q.className=`flex ${ge?"justify-end":"justify-start"} animate-fade-up`,Q.innerHTML=`<div class="t-bubble max-w-[92%] rounded-2xl px-3.5 py-2.5 text-base leading-relaxed sm:max-w-[80%] sm:px-4 sm:py-3 sm:text-[15px] ${ge?"rounded-br-md border border-accent-500/30 bg-accent-500/10 text-slate-100":"rounded-bl-md border border-ink-700 bg-ink-800 text-slate-100"}"${be?' aria-busy="true"':""}>
      <div class="mb-1 text-xs font-semibold uppercase tracking-wide ${ge?"bubble-you text-accent-400":"text-slate-400"}">${ge?"You":Le(t.personaLabel)}</div>
      <div class="whitespace-pre-wrap break-words" data-text>${Le(ee)}</div></div>`,c.appendChild(Q),vt?.remove(),vt=null,ue=be&&ne.matches?Q:null,wt(!0);let gt=Q.querySelector("[data-text]");return be&&ra(Q,gt),{row:Q,textEl:gt,entry:re[re.length-1]}}function ra(U,ee){let Q=0,ge=new MutationObserver(()=>{clearTimeout(Q),Q=setTimeout(be,800)}),be=()=>{if(!D||!U.isConnected||U.dataset.said)return ge.disconnect();if(K)return void(Q=setTimeout(be,400));ge.disconnect(),fi({row:U,textEl:ee})};ge.observe(ee,{childList:!0,characterData:!0,subtree:!0})}function $r(){let U=document.createElement("div");return U.className="flex justify-start",U.innerHTML=`<div class="flex gap-1.5 rounded-2xl rounded-bl-md border border-ink-700 bg-ink-800 px-4 py-3.5" aria-label="${Le(t.personaLabel)} is thinking"><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span></div>`,c.appendChild(U),ue=null,wt(!0),U}function ai(U,ee="muted"){let Q=document.createElement("p");Q.className=`text-center text-sm ${ee==="error"?"text-red-300":"text-slate-500"}`,Q.textContent=U;let ge=c.lastElementChild;if(ge?.tagName==="P"&&ge.textContent===U&&ge.remove(),ee==="error"){vt?.remove(),vt=Q,ue=null;for(let be of c.querySelectorAll("[aria-busy]"))be.removeAttribute("aria-busy"),be.parentElement.dataset.said="1"}return c.appendChild(Q),ri(U),wt(!0),Q}function Wr(){return K?Math.max(1,ae):ae+1}function rs(U){return le||o&&U>=o?{label:"Closing",cls:"text-purple-200"}:U<=1?{label:"Opening",cls:"text-sky-200"}:{label:"Rebuttal",cls:"text-rose-200"}}function Ki(){let U=Math.min(Wr(),o||1/0);l("#round-badge").textContent=l("#round-badge-m").textContent=o?`${s} ${U} of ${o}`:`${s} ${U}`;let ee=l("#phase-badge");if(ee){let ge=rs(U);ee.className=`badge absolute left-3 top-3 border-white/10 bg-black/60 backdrop-blur ${ge.cls}`,ee.textContent=ge.label}let Q;if(X)Q="This session is finished.";else if(Oe)Q="Your opponent opens first\u2026";else if(a){let ge=rs(Wr()).label;Q=ge==="Opening"?"Your opening statement\u2026":ge==="Closing"?"Your closing argument\u2026":"Your rebuttal\u2026"}else t.modeId==="interview"||t.modeId==="thesis"||t.modeId==="expert"?Q="Your answer\u2026":t.modeId==="rapbattle"?Q="Drop your bars\u2026":t.actingScript?Q=et&&ae>=et.length?"End of scene \u2014 tap Get my scorecard":"Your line\u2026":Q=re.length?"Your reply\u2026":"Say something to begin\u2026";d.placeholder=Q}function $t(){if(!D)return;let U=Fe.state==="speaking",ee=l("#status-dot"),Q=l("#status-text");Ne?(ee.className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse",Q.textContent="Listening to you"):U?(ee.className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse",Q.textContent="Speaking"):K?(ee.className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse",Q.textContent="Thinking"):X?(ee.className="h-1.5 w-1.5 rounded-full bg-slate-500",Q.textContent="Finished"):we||Oe?(ee.className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse",Q.textContent=we?"Waiting for reply":je?"Tap to hear your opponent":"Opponent is about to open\u2026"):(ee.className="h-1.5 w-1.5 rounded-full bg-emerald-400",Q.textContent="Your turn"),v.disabled=!U,g.disabled=U||K||!Fe.hasReplay(),u.disabled=K||X||oe||Oe||we||A,f.disabled=K&&!X||A}let na=window.CSS?.supports?.("field-sizing","content");na&&(d.style.fieldSizing="content");function Tr(){if(na)return;let U=window.scrollY,ee=c.scrollTop;d.style.height="auto",d.style.height=Math.min(160,d.scrollHeight)+"px",window.scrollY!==U&&window.scrollTo(0,U),c.scrollTop!==ee&&(c.scrollTop=ee)}d.addEventListener("input",()=>{if(Tr(),clearTimeout(V),R?.touch(),d.value.length>=4e3&&!Ne){let U="That\u2019s the 4,000-character limit \u2014 anything past it was left out.";p.textContent=U,p.className="mt-2 text-xs text-amber-300",setTimeout(()=>p.textContent===U&&p.classList.add("hidden"),6e3)}});function w(){!o||ae<o||X||T.firstChild||(T.innerHTML=`<div class="target-banner mb-2 flex items-center justify-between gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-3 py-1.5 sm:mb-3 sm:gap-3 sm:rounded-2xl sm:p-4">
      <p class="min-w-0 text-xs leading-snug text-slate-200 sm:text-sm"><span class="tb-short sm:hidden"><span class="font-semibold text-white">Final ${s.toLowerCase()} done.</span> Extra ${s.toLowerCase()}s use a credit.</span><span class="tb-long hidden sm:inline"><span class="font-semibold text-white">That was the final ${s.toLowerCase()}.</span> Get your scorecard now \u2014 or keep going (each extra ${s.toLowerCase()} uses a credit).</span></p>
      <button type="button" class="btn-primary btn-xs shrink-0 sm:btn-sm" id="banner-score">Get my scorecard</button></div>`,l("#banner-score").onclick=()=>mt(!0))}function H(U){let ee=l("#wallet-badge");if(typeof U=="number"&&U>=0&&U<=25){ee.classList.remove("hidden"),ee.textContent=`${U} round${U===1?"":"s"} left`;let Q=U<=3;ee.classList.toggle("border-red-500/40",Q),ee.classList.toggle("bg-red-500/10",Q),ee.classList.toggle("text-red-300",Q),ee.classList.toggle("border-amber-500/30",!Q),ee.classList.toggle("bg-amber-500/10",!Q),ee.classList.toggle("text-amber-300",!Q)}else ee.classList.add("hidden")}let j=!1;async function q(U,ee=0,Q=""){if(!U.active||!D)return U.end();j=!0;try{let ge=await fetch("/api/speech/turn-audio",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:e,offset:ee,anchor:Q})});if(!ge.ok)throw new Error("http "+ge.status);let be=await ge.arrayBuffer();if(!U.active||!D||!be.byteLength)return;await U.enqueue(be,null)}catch(ge){console.warn("[voice] server audio unavailable",ge),D&&U.active&&ai("Voice unavailable for this reply \u2014 text only.")}finally{j=!1,U.end()}}let F=U=>new Promise(ee=>setTimeout(ee,U)),ce=[],ve=U=>{let ee=ai(U,"error");return ce.push(ee),ee},Me=()=>ce.splice(0).forEach(U=>U.remove());function Te(U,ee,Q){let ge=ve(U),be=document.createElement("button");return be.type="button",be.className="btn-ghost btn-xs ml-2 align-middle",be.textContent=ee,be.addEventListener("click",()=>{K||we||A||!D||X||(ge.remove(),Q())}),ge.append(" ",be),ge}let Be=U=>Te(U,"Retry opening",()=>Ce({open:!0}));async function He(U,ee,Q=[1500,2500,4e3,6e3,8e3,1e4,1e4]){let ge=!1;for(let be of Q){if(await F(be),!D||X||A)return null;let gt;try{gt=await St(`/api/debates/${encodeURIComponent(e)}`)}catch{continue}if(ge=!0,!D||X||A)return null;let oi=gt.turns??[],at=dt=>oi.slice(dt).find(Mt=>Mt.role!=="user"),kt;if(U==null)kt=at(0);else{let dt=oi.filter(Qi=>Qi.role==="user"),Mt=dt.at(-1);if(!Mt||dt.length<ee||String(Mt.text??"").trim()!==U)return{state:"gone"};kt=at(oi.indexOf(Mt)+1)}if(kt)return{state:"reply",text:String(kt.text??""),remaining:gt.remainingRounds}}return{state:ge?"pending":"offline"}}async function Ce({open:U=!1,closing:ee=!1}={}){let Q=d.value.trim();if(K||X||oe||A||we||!U&&(!Q||Oe))return;let ge=t.modeId==="speaking"?12e3:4e3;if(!U&&Q.length>ge)return void ve(`That\u2019s ${Q.length.toLocaleString()} characters \u2014 keep it under ${ge.toLocaleString()} and send again.`);Fe.unlock(),Ut(),R?.touch(),de(),xe?.cancel(),xe=null,Fe.stop(),K=!0,rt=!1;let be=++Re;Pt=0;let gt=null;U||(d.value="",Tr(),gt=Bi("you",Q),Y(gt,Q,ae),me(),ae++,T.querySelector(".target-banner")&&T.replaceChildren());let oi=ae,at=()=>{if(!gt)return;gt.row.remove();let Ie=re.indexOf(gt.entry);Ie>=0&&re.splice(Ie,1),ae=Math.max(0,ae-1),gt=null,d.value||(d.value=Q,Tr())};Ki(),$t();let kt=$r(),dt=null,Mt="",Qi=0,jt=null,Rr=!1,er=null,wl=!1,sa="",aa=!1,oa=!1,iu=!1,ru=!uu(),Ml=new AbortController;ke=Ml,y=performance.now();let nm=setInterval(()=>{be!==Re||!D||document.hidden||performance.now()-y>(iu?3e4:45e3)&&(oa=!0,Ml.abort())},2e3),Tl=Ie=>{let Rt=performance.now();if(dt||(kt.remove(),dt=Bi("opp","")),Ie||Rt-Qi>50){let Ft=t.modeId==="rapbattle"?Ke(Mt):Mt;dt.textEl.textContent=Ft,dt.entry.text=Ft,Qi=Rt,wt(!1)}},nu=()=>{if(!dt)return;dt.row.remove();let Ie=re.indexOf(dt.entry);Ie>=0&&re.splice(Ie,1),dt=null},sm=Ie=>{if(!(be!==Re||!D))if(Ie.t==="hello")ru&&Ie.ttsVoice&&Pt!==be&&(xe=pu({voiceCfg:{voice:Ie.ttsVoice,hd:!!Ie.ttsHd,style:Ie.ttsStyle,styleDegree:Ie.ttsStyleDegree,rap:t.modeId==="rapbattle"},transform:t.actingScript?Rt=>Ve(Rt).replace(/(^|\n)\s*[\p{Lu}][\p{Lu} .'\-]{0,30}:\s*/gu,"$1"):Ve,onFallback:(Rt,Ft,tr)=>{jt={offset:Rt,utter:Ft,anchor:tr},er?q(Ft,Rt,tr):Rr&&Ft.end()}}));else if(Ie.t==="tok")Mt+=Ie.c??"",Tl(!1),xe?.push(Ie.c??"");else if(Ie.t==="done")if(er=Ie,Tl(!0),typeof Ie.text=="string"&&Ie.text.trim()&&(Mt=Ie.text,dt.textEl.textContent=Mt,dt.entry.text=Mt),fi(dt),H(Ie.remainingRounds),Me(),Pt===be)xe?.cancel();else if(xe)xe.finish({dropTail:!!Ie.truncated}),jt&&(Ie.truncated&&jt.offset>=Mt.length?jt.utter.end():q(jt.utter,jt.offset,jt.anchor));else if(Ie.audioBase64){let Rt=Fe.begin(),Ft=Uint8Array.from(atob(Ie.audioBase64),tr=>tr.charCodeAt(0));Rt.enqueue(Ft.buffer,null).finally(()=>Rt.end())}else Ie.audioFailed?ai("Voice unavailable for this reply \u2014 text only."):q(Fe.begin(),0,"");else Ie.t==="err"&&(wl=aa=!0,sa=Ie.message||"",kt.remove(),nu())},vi=null,El="",am=()=>{if(!dt||dt.row.querySelector("[data-cut]"))return;let Ie=document.createElement("div");Ie.dataset.cut="",Ie.className="mt-2 border-t border-white/10 pt-2 text-xs text-amber-300",Ie.textContent="Reply cut off",dt.row.firstElementChild.appendChild(Ie)},om=async()=>{if(Pt===be||!D)return void jt?.utter.end();j=!0;let Ie=Date.now();for(;vi&&D&&vi.utter.active&&(vi.pending()||Fe.state==="speaking"&&!vi.failed)&&Date.now()-Ie<9e4;)await F(200);if(j=!1,Pt===be||!D||be!==Re)return void jt?.utter.end();if(jt)return q(jt.utter,jt.offset,jt.anchor);let Rt=vi?Math.max(0,vi.offset-(El.length-El.trimStart().length)):0;Rt<Mt.trimEnd().length&&q(Fe.begin(),Rt,Rt?Mt.slice(Rt,Rt+40):"")},su=async Ie=>{we=!0,$t();let Rt=ai(oa?`${t.personaLabel} went quiet \u2014 checking with the server\u2026`:dt?"The connection dropped mid-reply \u2014 getting the rest\u2026":U?"The connection dropped \u2014 checking on your opponent\u2026":"The connection dropped \u2014 checking whether your message went through\u2026"),Ft=await He(U?null:Q,oi,Ie);if(Rt.remove(),we=!1,!Ft||be!==Re||!D)return Rr=!0,vi?.failed&&jt?.utter.end(),!1;if(Ft.state==="reply")return Rr=!1,dt||(dt=Bi("opp","")),dt.row.querySelector("[data-cut]")?.remove(),Mt=Ft.text,dt.textEl.textContent=Mt,dt.entry.text=Mt,wt(!1),H(Ft.remaining),Me(),rt=!1,U&&(Oe=!1),om(),!0;if(rt=!0,Ft.state==="gone"||U)return vi?.cancel(),xe===vi&&(xe=null),Fe.stop(),nu(),U?Be("Your opponent couldn\u2019t start \u2014 the connection dropped."):(at(),ve(`The connection dropped before ${t.personaLabel} could answer \u2014 your message is back in the box. Tap Send to try again.`)),!1;Rr=!0,vi?.failed&&jt?.utter.end(),am();let tr=async()=>{if(be!==Re)return;let ir=await su([0,2e3,4e3]);D&&be===Re&&au(ir)},gn=Ft.state==="offline",zi=Te(gn?"Couldn\u2019t reach the server \u2014 check your connection, then try again.":`${t.personaLabel}\u2019s reply didn\u2019t come through.`,"Check again",tr);return gn&&window.addEventListener("online",()=>zi.isConnected&&!K&&!we&&(zi.remove(),tr()),{once:!0}),!1},au=async Ie=>{Ki(),$t(),w(),Ar?.(),le&&Ie&&(await st(9e4),D&&be===Re&&mt(!0))};try{let Ie=await fetch("/api/debate/turn-stream",{method:"POST",credentials:"include",signal:Ml.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:e,text:U?"":Q,action:U?"open":void 0,phase:(ee||le)&&!U?"closing":void 0,clientTts:ru,photoreal:!!R?.ready})});iu=!0,y=performance.now();let Rt=Ie.headers.get("content-type")||"";if(!Ie.ok||!Rt.includes("text/event-stream")){let zi={};try{zi=await Ie.json()}catch(ir){if(oa)throw ir}if(aa=!0,kt.remove(),at(),Ie.status===402)oe=!0,Oe=!1,m.replaceChildren(Sc(!0)),m.querySelector("[data-get-score]")?.addEventListener("click",()=>f.click()),d.disabled=!0,h.disabled=!0,clearTimeout(Hi),ai("You\u2019re out of rounds \u2014 tap Get my scorecard to see how you did.");else if(zi.error==="debate_ended")X=!0,ai("This session has already been scored.");else if(zi.error==="opening_already_delivered"){Oe=!1;let ir=await He(null,0,[0]);ir?.state==="reply"&&be===Re&&D&&!re.some(la=>la.role==="opp")?Bi("opp",ir.text):ir?.state!=="reply"&&ve("Couldn\u2019t load your opponent\u2019s opening \u2014 reload the page to see it.")}else wl=!0,sa=zi.error==="text_too_long"?"That message is over 4,000 characters \u2014 trim it and send again.":Ie.status===401?"You\u2019ve been signed out \u2014 log in again, then come back to this session.":zi.message||"";return}let Ft=Ie.body.getReader(),tr=new TextDecoder,gn="";for(;;){let{done:zi,value:ir}=await Ft.read();if(zi)break;y=performance.now(),gn+=tr.decode(ir,{stream:!0});let la=gn.split(`

`);gn=la.pop()??"";for(let lm of la){let ou=lm.trim();if(ou.startsWith("data:"))try{sm(JSON.parse(ou.slice(5).trim()))}catch{}}if(be!==Re||!D){Ft.cancel().catch(()=>{});break}}}catch(Ie){Ie?.name==="AbortError"&&!oa&&(aa=!0)}finally{if(clearInterval(nm),be===Re&&D){kt.remove(),K=!1,ke=null;let Ie=!er&&!aa;er||(Ie&&dt&&Tl(!0),Ie&&xe&&Pt!==be?(vi=xe,vi.finish({dropTail:!0})):(xe?.cancel(),xe=null,Fe.stop())),El=Mt,wl&&(rt=!0,at(),U?Be(`Your opponent couldn\u2019t start.${sa.includes("wasn\u2019t charged")?" That round wasn\u2019t charged.":""}`):ve(sa||"Your message didn\u2019t go through. Try sending again.")),er&&U&&(Oe=!1),Ki(),$t();let Rt=er?!0:Ie?await su():!1;D&&be===Re&&await au(Rt)}}}async function st(U){let ee=ge=>new Promise(be=>setTimeout(be,ge)),Q=Date.now();for(;Fe.state==="idle"&&Date.now()-Q<1500;)await ee(150);for(;(Fe.state!=="idle"||j)&&Date.now()-Q<U;)await ee(200);await ee(300)}async function mt(U=!1){if(X)return ft();if(A||Pe)return;if(!U){Pe=!0,clearTimeout(Hi),Ut();let Q;try{if(ae===0)Q=await Hr({title:"Nothing to grade yet",body:"Say at least one thing before asking for a scorecard.",actions:[{label:"Keep going",value:"stay",kind:"primary"},{label:"Leave session",value:"leave"}]});else{let ge=!o,be=[];a&&ge&&ae>=2&&!le&&be.push({label:"Deliver a closing statement first",hint:"1 more round",value:"closing"}),be.push({label:"Grade my session now",value:"score",kind:"primary"},{label:"Keep going",value:"stay"}),Q=await Hr({title:"End this session?",body:r.judge?"You\u2019ll get your coaching scorecard, and an impartial judge will score both sides.":"You\u2019ll get your coaching scorecard.",actions:be})}}finally{Pe=!1}if(Q==="leave")return void(location.hash="#/");if(Q==="closing"){le=!0,Ki(),d.placeholder="Your closing argument \u2014 why you won\u2026",d.focus();return}if(Q!=="score")return void Ar()}A=!0,clearTimeout(Hi),Ut();let ee=l("#banner-score");if(ee&&(ee.disabled=!0),f.disabled=!0,f.innerHTML='<span class="spinner"></span><span>Scoring\u2026</span>',K){let Q=ai("Finishing their reply, then scoring\u2026");for(;K&&D&&!X;)await F(200);Q.remove()}if(D){xe?.cancel(),Fe.stop();try{let{scores:Q}=await Tt("/api/debate/end",{debateId:e});if(!D)return;X=!0,Uh(n,k,t,e,re,Q)}catch(Q){if(A=!1,!D)return;ee&&(ee.disabled=!1),f.disabled=!1,f.textContent="Get my scorecard",ve(Q?.body?.message||"Couldn\u2019t fetch your scores. Try again in a moment."),$t()}}}async function ft(){try{let U=await St(`/api/debates/${encodeURIComponent(e)}`);Uh(n,k,t,e,re,U.scorecard||{dimensions:[],overall:null,notes:""})}catch{ai("Couldn\u2019t load the scorecard.","error")}}u.addEventListener("click",()=>Ce({closing:le})),d.addEventListener("keydown",U=>{U.key==="Enter"&&!U.shiftKey&&!U.isComposing&&window.matchMedia("(pointer: fine)").matches&&(U.preventDefault(),Ce({closing:le}))}),g.addEventListener("click",()=>{Fe.unlock(),Fe.replay(),$t()}),v.addEventListener("click",()=>{Pt=Re,xe?.cancel(),Fe.stop()}),f.addEventListener("click",()=>X?ft():mt(!1)),n.addEventListener("click",de);let Et=!!navigator.brave,lt=Et?null:window.SpeechRecognition||window.webkitSpeechRecognition,Ee="Voice input isn\u2019t available in this browser (Brave and some privacy browsers block it). Use Chrome or Edge to talk, or just type.";function Zi(){if(Ne)try{Qe?.stop()}catch{}}let wi=null;function Ut(){if(clearTimeout(ni),!Qe)return;let U=Qe;U.onresult=U.onend=U.onerror=null;try{U.abort()}catch{}Ne&&wi?.()}let Ji=U=>{let ee="";for(let Q of U){let ge=Q.trim();if(!ge)continue;let be=ee.toLowerCase(),gt=ge.toLowerCase();!ee||gt.startsWith(be)?ee=ge:be.endsWith(gt)||(ee+=" "+ge)}return ee},ei=U=>{let ee=[...re].reverse().find(at=>at.role==="opp")?.text||"",Q=at=>at.toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu," ").split(/\s+/).filter(Boolean),ge=Q(U);if(ge.length<4||!ee)return!1;let be=new Set,gt=Q(ee);for(let at=0;at+2<gt.length;at++)be.add(gt[at]+" "+gt[at+1]+" "+gt[at+2]);let oi=0;for(let at=0;at+2<ge.length;at++)be.has(ge[at]+" "+ge[at+1]+" "+ge[at+2])&&oi++;return oi/(ge.length-2)>=.5},jr=/Android/i.test(navigator.userAgent),ct="aai_handsfree",At=!1;try{At=localStorage.getItem(ct)==="1"}catch{}let Mi=l("#hf-btn"),Wt=()=>{!Mi||!lt||(Mi.classList.remove("hidden"),Mi.innerHTML=`Hands-free mic: <b class="${At?"text-emerald-300":"text-slate-300"}">${At?"On":"Off"}</b>`,Mi.setAttribute("aria-pressed",String(At)))},Er=U=>{At=U;try{localStorage.setItem(ct,U?"1":"0")}catch{}Wt()},ni=0;function ns(U=!1){if(Ne||!lt)return;Fe.unlock(),U||(Pt=Re,xe?.cancel(),Fe.stop()),Ut(),Qe=new lt,Qe.lang=navigator.language||"en-US",Qe.interimResults=!0,Qe.continuous=!jr;let ee=d.value?d.value.replace(/\s+$/,"")+" ":"",Q=()=>d.value.slice(ee.length).trim(),ge=()=>{if(!(!At||K||!D||X||oe||te()||!Q()||document.hidden)){if(ei(Q())){d.value=ee.trim(),Tr(),p.textContent="That sounded like your opponent\u2019s voice \u2014 try headphones, or turn the volume down.",p.className="mt-2 text-xs text-amber-300";return}Ce({closing:le})}};Qe.onresult=at=>{R?.touch();let kt=[],dt=[];for(let Rr=0;Rr<at.results.length;Rr++){let er=at.results[Rr];(er.isFinal?kt:dt).push(er[0].transcript)}let Mt=Ji(kt),Qi=Ji(dt),jt=Qi?!Mt||Qi.toLowerCase().startsWith(Mt.toLowerCase())?Qi:`${Mt} ${Qi}`:Mt;d.value=(ee+jt).replace(/\s+/g," ").trimStart(),Tr(),At&&(clearTimeout(ni),d.value.trim()&&(ni=setTimeout(()=>Ne&&ge(),t.modeId==="speaking"?12e3:3500)))};let be=!1,gt="",oi=at=>{be||(be=!0,clearTimeout(ni),wi=null,Ne=!1,h.classList.remove("mic-live"),h.innerHTML=Xe.mic,h.setAttribute("aria-label","Speak your reply"),at?(p.textContent=at,p.className="mt-2 text-xs text-red-300",setTimeout(()=>p.textContent===at&&p.classList.add("hidden"),5e3)):p.className.includes("amber")||p.classList.add("hidden"),$t())};wi=oi,Qe.onend=()=>{oi();let at=bt;bt=!1,!gt&&!at&&(V=setTimeout(()=>!Ne&&ge(),1500))},Qe.onerror=at=>{let kt=at?.error||"";gt=kt||"error",oi(kt==="not-allowed"||kt==="service-not-allowed"?U?"Tap the mic to talk \u2014 your browser needs a tap before it can listen.":"Mic is blocked. Tap the lock icon in the address bar, set Microphone to Allow, then tap the mic again.":kt==="audio-capture"?"No microphone found on this device.":kt==="no-speech"?U?"Didn\u2019t hear anything \u2014 tap the mic when you\u2019re ready.":"Didn\u2019t hear anything \u2014 tap the mic and try again.":kt==="aborted"?"":kt==="network"?Ee:"Voice input failed \u2014 try again or type instead.")};try{Qe.start(),Ne=!0,h.classList.add("mic-live"),h.innerHTML=Xe.stop,h.setAttribute("aria-label","Stop listening"),p.textContent=At?"Listening\u2026 I\u2019ll send when you pause.":"Listening\u2026 tap the mic again when you\u2019re done, then send.",p.className="mt-2 text-xs text-slate-400",$t()}catch{oi(U?"":"Voice input failed \u2014 try again or type instead.")}}var Hi=0;function Ar(){if(clearTimeout(Hi),!lt||!At||!D||X||oe||K||Ne||rt||te())return;let U=P?.classList.contains("photoreal-live")?900:450;Hi=setTimeout(()=>{if(!(!At||!D||X||oe||K||Ne||le||rt||te()||document.hidden)&&!(Fe.state==="speaking"||xe&&xe.pending?.())){if(j||R?.talking)return void(Hi=setTimeout(Ar,400));et&&ae>=et.length||ns(!0)}},U)}var im=Fe.on(U=>{U==="speaking"?(clearTimeout(Hi),Ne&&Ut()):U==="idle"&&Ar()});lt?(h.classList.remove("hidden"),Wt(),Mi?.addEventListener("click",()=>{Er(!At),At?Ar():(clearTimeout(Hi),Ut())}),h.addEventListener("click",()=>{if(Ne)return clearTimeout(ni),bt=!0,Zi();try{localStorage.getItem(ct)===null&&Er(!0)}catch{}ns(!1)})):(p.textContent=Et?Ee:"Voice input isn\u2019t supported in this browser. Chrome, Edge or Safari let you speak your replies \u2014 or just type.",p.className="mt-2 text-xs text-slate-400");let tu=null;for(let U of i.turns??[])U.role==="user"?(tu=Bi("you",U.text),ae++):Bi("opp",U.text);if(X){d.disabled=!0;let U=document.createElement("div");U.className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-200",U.innerHTML='<span>\u2713 This session is finished and scored.</span><button type="button" class="btn-ghost btn-xs">View scorecard</button>',U.querySelector("button").onclick=ft,T.appendChild(U),f.textContent="Scorecard"}else H(i?.remainingRounds),i?.remainingRounds===0&&(oe=!0,m.replaceChildren(Sc(!0)),m.querySelector("[data-get-score]")?.addEventListener("click",()=>f.click()),d.disabled=!0,h.disabled=!0);let Sl=(i.turns??[]).at(-1);Oe=!X&&!oe&&!Sl&&t.resolvedFirstSpeaker==="opponent",Ki(),$t(),w();async function rm(U,ee){let Q=String(ee.text??"").trim(),ge={state:"pending"};if(!(Date.now()-Date.parse(ee.created_at||"")>18e4)){we=!0,$t();let be=$r();if(ge=await He(Q,ae,[1500,2500,4e3,6e3,8e3,1e4]),be.remove(),we=!1,!ge||!D)return void $t()}if(ge.state==="reply")Bi("opp",ge.text),H(ge.remaining);else if(ge.state==="gone"){U.row.remove();let be=re.indexOf(U.entry);be>=0&&re.splice(be,1),ae=Math.max(0,ae-1),d.value||(d.value=Q,Tr()),rt=!0,ve("Your last message didn\u2019t get a reply \u2014 it\u2019s back in the box. Tap Send to try again.")}else ge.state==="offline"?ai("Couldn\u2019t check on the reply to your last message \u2014 reload to see it."):ai(`${t.personaLabel} never answered your last message. Send your next point to carry on.`);Ki(),$t(),w(),Ar()}if(Oe){let U=(()=>{try{return Fe.ensureContext().state}catch{return"running"}})(),ee=!1,Q=null,ge=be=>{ee||!D||!Oe||be?.target?.closest?.("#end-btn")||(ee=!0,n.removeEventListener("click",ge,!0),Q?.remove(),Fe.unlock(),je=!1,$t(),b.then(()=>D&&Ce({open:!0})))};U!=="running"?(je=!0,$t(),Q=document.createElement("button"),Q.type="button",Q.className="absolute inset-0 z-[3] flex items-center justify-center bg-black/55 text-white",Q.innerHTML='<span class="rounded-full border border-white/20 bg-black/60 px-5 py-3 text-sm font-semibold backdrop-blur">\u25B6 Tap to hear your opponent</span>',P.appendChild(Q),n.addEventListener("click",ge,!0)):ge()}else!X&&Sl?.role==="user"?rm(tu,Sl):X||(Ar(),window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches&&d.focus({preventScroll:!0}));X||de()}function ll(n,e,t=10){let i=e==null?0:Math.max(0,Math.min(100,e/t*100));return`
    <div>
      <div class="mb-1.5 flex justify-between gap-3 text-sm">
        <span class="font-medium text-slate-300">${Le(n)}</span>
        <span class="shrink-0 font-semibold text-white">${Kn(e)}<span class="text-slate-500">/${t}</span></span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-ink-800">
        <div class="score-fill h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400" style="width:0%" data-w="${i}"></div>
      </div>
    </div>`}async function z_(n,e){let t=n.querySelector("#progress-slot");if(!t)return;let i;try{i=await St(`/api/debates/progress?mode=${encodeURIComponent(e?.modeId||"")}`)}catch{return}if(!i||!i.sessions)return;let r=[];i.sessions===1?r.push("Your first session in this mode"):r.push(`Session ${i.sessions} in this mode`),i.isBest?r.push("New personal best"):i.best!=null&&r.push(`Best: ${i.best}/10`),i.deltaOverall!=null&&i.deltaOverall!==0&&r.push(`${i.deltaOverall>0?"+":""}${i.deltaOverall} vs your last sessions`),i.streakDays>=2&&r.push(`${i.streakDays}-day streak`);let s=i.overall||[],a="";if(s.length>=2){let d=220/(s.length-1),u=Math.min(...s)-.5,h=Math.max(u+3,Math.max(...s)+.5),p=f=>40-(f-u)/(h-u)*36,g=s.map((f,m)=>`${m?"L":"M"}${(m*d).toFixed(1)} ${p(f).toFixed(1)}`).join(" "),v=s.length-1;a=`<svg viewBox="0 0 220 44" width="220" height="44" class="shrink-0 text-accent-400" role="img" aria-label="Your last ${s.length} scores"><path d="${g}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${(v*d).toFixed(1)}" cy="${p(s[v]).toFixed(1)}" r="3.5" fill="currentColor"/></svg>`}let o=(i.dims||[]).filter(l=>l.delta!=null&&l.delta!==0);t.innerHTML=`<div class="card mb-4 p-5 sm:p-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div class="eyebrow mb-2 !text-accent-400">Your progress</div><div class="flex flex-wrap gap-2">${r.map(l=>`<span class="badge border-ink-700 bg-ink-800 text-slate-200">${Le(l)}</span>`).join("")}</div></div>${a}</div>${o.length?`<div class="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-ink-700 pt-3 text-sm text-slate-300">${o.map(l=>`<span>${Le(l.label)} <b class="${l.delta>0?"text-emerald-300":"text-amber-300"}">${l.delta>0?"+":""}${l.delta}</b></span>`).join("")}</div>`:""}</div>`}async function V_(n,e,t){let s=document.createElement("canvas");s.width=1080,s.height=1350;let a=s.getContext("2d"),o=a.createLinearGradient(0,0,1080,1350);o.addColorStop(0,"#0d0f14"),o.addColorStop(1,"#1a0c10"),a.fillStyle=o,a.fillRect(0,0,1080,1350),a.fillStyle="rgba(232,57,46,0.10)",a.beginPath(),a.arc(960,140,420,0,Math.PI*2),a.fill();let l=(m,T=700)=>`${T} ${m}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`,c=(m,T,M,S,k=3)=>{let R=String(m||"").split(/\s+/),E="",b=S,_=0;for(let x of R){let C=E?`${E} ${x}`:x;if(a.measureText(C).width>T&&E){if(a.fillText(_===k-1?`${E}\u2026`:E,90,b),E=x,b+=M,++_>=k)return b}else E=C}return E&&_<k&&(a.fillText(E,90,b),b+=M),b};a.strokeStyle="#e8392e",a.lineWidth=12,a.lineJoin="round",a.beginPath(),a.moveTo(126,96),a.lineTo(190,224),a.lineTo(62,224),a.closePath(),a.stroke(),a.fillStyle="#ffffff",a.font=l(46),a.fillText("AdversaryAI",220,190),a.fillStyle="#94a3b8",a.font=l(40,600),a.fillText(`${e?.modeName||"Practice session"}`.slice(0,40),90,360),a.fillStyle="#e8392e",a.font=l(400,800),a.fillText(String(n?.overall??"\u2013"),90,760);let d=a.measureText(String(n?.overall??"\u2013")).width;a.fillStyle="#64748b",a.font=l(120,700),a.fillText("/ 10",90+d+20,760),a.fillStyle="#ffffff",a.font=l(64,800);let u=c(n?.headline||"Scored by an AI coach",900,78,880,3),h=(t||[]).filter(m=>m.score!=null).sort((m,T)=>T.score-m.score);h.length&&(a.fillStyle="#94a3b8",a.font=l(40,600),a.fillText(`Strongest: ${h[0].label} ${h[0].score}/10`,90,Math.max(u+30,1050))),a.fillStyle="#cbd5e1",a.font=l(44,600),a.fillText("Think you can beat it?",90,1200),a.fillStyle="#e8392e",a.font=l(52,800),a.fillText("getadversaryai.com",90,1270);let p=await new Promise(m=>s.toBlob(m,"image/png"));if(!p)return;let g=new File([p],"my-adversaryai-score.png",{type:"image/png"}),v=`I scored ${n?.overall??"?"}/10 in ${e?.modeName||"an AI practice session"} on AdversaryAI. Think you can beat it? https://getadversaryai.com`;try{if(navigator.canShare?.({files:[g]}))return void await navigator.share({files:[g],text:v})}catch(m){if(m?.name==="AbortError")return}let f=document.createElement("a");f.href=URL.createObjectURL(p),f.download=g.name,f.click(),setTimeout(()=>URL.revokeObjectURL(f.href),4e3)}function G_(n,e){let t=[];if(n?.topPriority&&t.push(`<div class="card mb-4 border-accent-500/30 p-5 sm:p-6"><div class="eyebrow mb-1 !text-accent-400">Your #1 priority</div><div class="text-lg font-bold text-white">${Le(n.topPriority.skill)}</div><p class="mt-1 text-sm leading-relaxed text-slate-300">${Le(n.topPriority.why)}</p></div>`),n?.moments?.length){let i=[...n.moments].sort((r,s)=>(r.type==="miss"?0:1)-(s.type==="miss"?0:1));t.push(`<div class="card mb-4 p-5 sm:p-6"><div class="mb-3 text-sm font-semibold text-white">Moments from your session</div><div class="space-y-4">${i.map(r=>{let s=r.type==="strength";return`<div class="rounded-xl border ${s?"border-emerald-500/30 bg-emerald-500/5":"border-amber-500/30 bg-amber-500/5"} p-4"><div class="mb-1 text-xs font-bold uppercase tracking-wide ${s?"text-emerald-300":"text-amber-300"}">${s?"Keep doing this":"Missed moment"}</div><blockquote class="border-l-2 ${s?"border-emerald-500/60":"border-amber-500/60"} pl-3 text-sm italic text-slate-200">\u201C${Le(r.quote)}\u201D</blockquote><p class="mt-2 text-sm leading-relaxed text-slate-300">${Le(r.what)}</p>${r.insteadSay?`<p class="mt-2 text-sm leading-relaxed text-white"><span class="font-semibold text-accent-400">Try instead:</span> \u201C${Le(r.insteadSay)}\u201D</p>`:""}</div>`}).join("")}</div></div>`)}if(n?.locked){let i=n.locked.moments||0;t.push(`<div class="card mb-4 border-accent-500/30 p-5 sm:p-6"><div class="eyebrow mb-1 !text-accent-400">Your full coaching plan</div><p class="text-sm leading-relaxed text-slate-200">${i?`${i} more moment${i===1?"":"s"} from your session`:"More from your session"}${n.locked.drill?" and your personal next drill":""} ${i||n.locked.drill?"are":"is"} ready.</p><div class="mt-3 space-y-2 select-none" aria-hidden="true" style="filter:blur(5px)"><div class="h-3 w-11/12 rounded bg-ink-600"></div><div class="h-3 w-9/12 rounded bg-ink-600"></div><div class="h-3 w-10/12 rounded bg-ink-600"></div></div><a href="#/account?plans=1${xs()}" class="btn-primary mt-4 inline-flex px-5 py-2.5 text-sm">Unlock with any plan or pack</a><p class="mt-2 text-xs text-slate-500">Unlocks instantly, including this session.</p></div>`)}return n?.nextDrill&&t.push(`<div class="card mb-4 p-5 sm:p-6"><div class="eyebrow mb-1 !text-accent-400">Your next drill</div><p class="text-sm leading-relaxed text-slate-200">${Le(n.nextDrill)}</p>${e?.modeId?`<a href="#/setup/${encodeURIComponent(e.modeId)}" class="btn-primary mt-4 inline-flex px-5 py-2.5 text-sm">Start this drill</a>`:""}</div>`),t.join("")}function Uh(n,e,t,i,r,s){try{localStorage.setItem("aai_sessions_done","1")}catch{}Ps("session_complete",{mode:t?.modeId});let a=s?.dimensions??[],o=a.filter(c=>c.score!=null);e?.dispose?.(),window.__sessionCleanup?.(),window.scrollTo({top:0});let l=r.filter(c=>c.role==="you").length;n.className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10",n.innerHTML=`
      <div class="mb-6 text-center">
        <p class="eyebrow mb-2 !text-accent-400">Session complete</p>
        <h1 class="text-display-lg text-white">Your scorecard</h1>
        <p class="mx-auto mt-2 max-w-xl text-sm text-slate-400 line-clamp-2">${Le(t.modeName)}${t.topic?` \xB7 ${Le(t.topic)}`:""}</p>
      </div>
      <div class="card mb-4 p-5 sm:p-7">
        <div class="flex items-center gap-5">
          <div class="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-accent-500/40 bg-accent-500/10">
            <span class="text-4xl font-extrabold leading-none tracking-tight text-accent-400">${Kn(s?.overall)}</span>
            <span class="mt-1 text-[11px] font-semibold text-slate-500">/ 10</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-lg font-bold text-white">Your score</div>
            ${s?.headline?`<p class="text-base font-semibold leading-snug text-white">${Le(s.headline)}</p>`:""}
            <p class="text-sm text-slate-400">${l} turn${l===1?"":"s"} vs ${Le(t.personaLabel)}${l<3?" \xB7 limited sample":""}</p>
            ${t.judgeEnabled?'<div id="verdict-pill" class="mt-2"><span class="badge border-ink-700 bg-ink-800 text-slate-400"><span class="spinner !h-3 !w-3"></span>Judge deliberating\u2026</span></div>':""}
          </div>
        </div>
        ${o.length?`<div class="mt-6 grid gap-x-8 gap-y-4 border-t border-ink-700 pt-6 sm:grid-cols-2">${a.map(c=>ll(c.label,c.score)).join("")}</div>`:""}
      </div>
      <div id="progress-slot"></div>
      ${t.judgeEnabled?`<div class="card mb-4 p-5 sm:p-7" id="verdict-card"><div class="mb-4 flex items-center gap-3"><span class="text-accent-400 [&>svg]:h-5 [&>svg]:w-5">${Xe.scale}</span><div><div class="font-semibold text-white">Head-to-head</div><p class="text-xs text-slate-500">An impartial judge scored both sides on the same rubric.</p></div></div><div id="verdict-body"><div class="flex items-center justify-center gap-2 py-6 text-sm text-slate-400"><span class="spinner"></span>The judge is deliberating\u2026</div></div></div>`:""}
      ${G_(s,t)}
      <div class="card mb-4 p-5 sm:p-7">
        <div class="mb-2 text-sm font-semibold text-white">Coach\u2019s notes</div>
        <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">${Le(s?.notes||"No notes this time.")}</p>
        <div id="judge-notes"></div>
      </div>
      ${t.judgeEnabled?`<div class="card mb-6 p-5 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><div class="font-semibold text-white">Share to the Community Arena</div><p class="text-sm text-slate-400">Let others read the transcript and vote on who won.</p></div>
          <button type="button" id="arena-toggle-btn" class="btn-ghost btn-sm shrink-0">Publish to Arena</button>
        </div>
        <div id="arena-share-tray" class="mt-4 hidden">
          <div class="flex gap-2"><input id="arena-share-link" class="field text-sm" readonly aria-label="Share link" /><button type="button" id="arena-copy-btn" class="btn-ghost btn-sm shrink-0">Copy</button></div>
          <div class="mt-3 flex flex-wrap gap-2"><a id="arena-share-x" target="_blank" rel="noopener" class="btn-ghost btn-sm min-h-[44px]">Share on X</a><a id="arena-share-reddit" target="_blank" rel="noopener" class="btn-ghost btn-sm min-h-[44px]">Share on Reddit</a></div>
        </div>
      </div>`:""}
      <div class="flex flex-col gap-3 sm:flex-row">
        <a href="#/setup/${encodeURIComponent(t.modeId)}" class="btn-primary flex-1 py-3">Practice again</a>
        <button type="button" id="share-score-btn" class="btn-ghost flex-1 py-3">Share my score</button>
        <a href="#/history" class="btn-ghost flex-1 py-3">All sessions</a>
      </div>`,$_(n,i,t),z_(n,t),n.querySelector("#share-score-btn")?.addEventListener("click",()=>V_(s,t,a)),requestAnimationFrame(()=>requestAnimationFrame(()=>{n.querySelectorAll("[data-w]").forEach(c=>c.style.width=`${c.dataset.w}%`)}))}var Md=[["argumentation","Argumentation"],["evidence","Evidence & reasoning"],["rebuttal","Rebuttal"],["composure","Composure & clarity"]];function $_(n,e,t){let i=n.querySelector("#arena-toggle-btn"),r=n.querySelector("#arena-share-tray"),s=n.querySelector("#arena-share-link"),a=n.querySelector("#arena-copy-btn"),o=n.querySelector("#arena-share-x"),l=n.querySelector("#arena-share-reddit");if(i){let d=`${location.origin}/debate/${e}`;s.value=d;let u=!1,h=p=>{u=p,i.textContent=p?"\u2713 Published \u2014 unpublish":"Publish to Arena",r.classList.toggle("hidden",!p);let g=t.topic?`\u201C${t.topic}\u201D`:"this debate";o.href="https://twitter.com/intent/tweet?text="+encodeURIComponent(`Who won? I sparred ${t.personaLabel||"an AI"} on ${g}. Vote on AdversaryAI: ${d}`),l.href="https://reddit.com/submit?url="+encodeURIComponent(d)+"&title="+encodeURIComponent(`Who won this debate? Me vs ${t.personaLabel||"AI"} on ${g}`)};St("/api/debates/"+encodeURIComponent(e)).then(p=>p?.debate&&h(!!(p.debate.is_public||p.debate.isPublic))).catch(()=>{}),i.addEventListener("click",async()=>{i.disabled=!0;try{await Tt("/api/debate/toggle-public",{debateId:e,isPublic:!u}),h(!u)}catch{i.textContent="Couldn\u2019t update \u2014 try again"}finally{i.disabled=!1}}),a.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(d),a.textContent="Copied!",setTimeout(()=>a.textContent="Copy",2e3)}catch{s.select()}})}let c=n.querySelector("#verdict-body");if(c){let d=n.querySelector("#verdict-pill"),u=()=>{c.innerHTML='<div class="flex items-center justify-center gap-2 py-6 text-sm text-slate-400"><span class="spinner"></span>The judge is deliberating\u2026</div>',d&&(d.innerHTML='<span class="badge border-ink-700 bg-ink-800 text-slate-400"><span class="spinner !h-3 !w-3"></span>Judge deliberating\u2026</span>'),Tt("/api/debate/judge",{debateId:e}).then(({verdict:h})=>W_(n,t,h)).catch(h=>{let p=h instanceof Ct?h.body?.error:null;if(d&&(d.innerHTML=""),p==="insufficient_transcript"){c.innerHTML='<p class="py-4 text-center text-sm text-slate-400">Not enough of a session to judge \u2014 the verdict needs at least one exchange from each side.</p>';return}let g=!(h instanceof Ct)||h.status>=500||h.status===429||p==="judge_unavailable";c.innerHTML=`<div class="flex flex-col items-center gap-3 py-4 text-center"><p class="text-sm text-slate-400">The judge couldn\u2019t reach a verdict just now. Your scorecard above is unaffected.</p>${g?'<button type="button" class="btn-ghost btn-sm" data-judge-retry>Try again</button>':""}</div>`,c.querySelector("[data-judge-retry]")?.addEventListener("click",v=>(v.currentTarget.disabled=!0,u()),{once:!0})})};u()}}function bs(n){return n.winner==="you"?{icon:Xe.trophy,title:"You win",sub:"The judge scored it for you.",tone:"tone-win"}:n.winner==="opponent"?{icon:Xe.target,title:"Your opponent takes this one",sub:"The judge scored it for them. Review the notes and run it back.",tone:"tone-lose"}:n.winner==="draw"?{icon:Xe.scale,title:"Dead even \u2014 a draw",sub:"The judge could not separate you.",tone:"text-slate-200 border border-ink-600 bg-ink-800/60"}:n.assessment==="strong"?{icon:Xe.trending,title:"Strong performance",sub:"The judge rates this session highly.",tone:"tone-win"}:n.assessment==="developing"?{icon:Xe.target,title:"Developing",sub:"Solid foundation \u2014 keep pushing on the notes below.",tone:"tone-lose"}:{icon:Xe.compass,title:"Needs work",sub:"The judge sees clear room to improve.",tone:"tone-bad"}}function W_(n,e,t){let i=n.querySelector("#verdict-body");if(!i)return;let r=bs(t),s=n.querySelector("#verdict-pill");s&&(s.innerHTML=`<span class="badge ${r.tone}">${Le(r.title)}</span>`);let a=(l,c)=>{let d=t.you?.[l],u=t.opponent?.[l],h=p=>p==null?0:Math.max(0,Math.min(100,p*10));return`<div class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-2.5">
      <span class="text-sm font-medium text-slate-300">${Le(c)}</span>
      <span class="text-sm tabular-nums"><span class="font-bold ${d>=u?"text-white":"text-slate-400"}">${Kn(d)}</span><span class="px-1.5 text-slate-600">vs</span><span class="font-bold ${u>d?"text-white":"text-slate-400"}">${Kn(u)}</span></span>
      <div class="col-span-2 grid grid-cols-2 gap-1.5">
        <div class="h-1.5 overflow-hidden rounded-full bg-ink-800"><div class="score-fill ml-auto h-full rounded-full bg-accent-500" style="width:0%" data-w="${h(d)}"></div></div>
        <div class="h-1.5 overflow-hidden rounded-full bg-ink-800"><div class="score-fill h-full rounded-full bg-slate-500" style="width:0%" data-w="${h(u)}"></div></div>
      </div></div>`};i.innerHTML=`
    <div class="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider"><span class="text-accent-400">You</span><span class="text-slate-400">${Le(e.personaLabel)}</span></div>
    <div class="divide-y divide-ink-700/60">${Md.map(([l,c])=>a(l,c)).join("")}</div>`;let o=n.querySelector("#judge-notes");o&&(o.innerHTML=`${t.reasoning?`<div class="mt-5 border-t border-ink-700 pt-5"><div class="mb-2 text-sm font-semibold text-white">Why the judge decided</div><p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">${Le(t.reasoning)}</p></div>`:""}
      ${t.turningPoint?`<div class="mt-4 rounded-xl border border-accent-500/30 bg-accent-500/5 p-4"><div class="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-300">Turning point</div><p class="text-sm leading-relaxed text-slate-300">${Le(t.turningPoint)}</p></div>`:""}`),requestAnimationFrame(()=>requestAnimationFrame(()=>i.querySelectorAll("[data-w]").forEach(l=>l.style.width=`${l.dataset.w}%`)))}function It(n){return Le(n)}var Qp=n=>`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed sm:text-[15px] ${n?"rounded-br-md border border-accent-500/30 bg-accent-500/10 text-slate-100":"rounded-bl-md border border-ink-700 bg-ink-800 text-slate-200"}`;function eu(n){let e=new Date(n);return Number.isNaN(e.getTime())?n:e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}async function Td(n){n.innerHTML=`<div class="mx-auto max-w-4xl px-4 py-6 sm:py-10" id="history-root">${ul("list").outerHTML}</div>`;let e=n.querySelector("#history-root"),t,i=new Map;try{let p=await St("/api/debates");t=Array.isArray(p)?p:p.debates;try{i=new Map((await Qn()).map(g=>[g.id,g]))}catch{}}catch(p){e.replaceChildren(Jn(`Couldn\u2019t load your history. ${p instanceof Ct?`Error ${p.status}`:"Check your connection."}`,()=>Td(n)));return}let r=p=>`
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 class="text-display-lg text-white">History</h1>
        <p class="mt-1 text-sm text-slate-400" id="history-counter">${p} session${p===1?"":"s"}</p>
      </div>
      <a href="#/" class="btn-primary btn-sm shrink-0">+ New session</a>
    </div>`;if(t.length===0){e.innerHTML=`${r(0)}
      <div class="card px-6 py-16 text-center">
        <div class="mb-4 flex justify-center text-slate-500 [&>svg]:h-10 [&>svg]:w-10">${Xe.mic}</div>
        <p class="mb-1 font-semibold text-white">No sessions yet</p>
        <p class="mb-6 text-sm text-slate-400">Your sessions, transcripts and scorecards will live here.</p>
        <a href="#/" class="btn-primary">Start your first session</a>
      </div>`;return}e.innerHTML=`${r(t.length)}<div class="space-y-3" id="debate-list"></div>`;let s=e.querySelector("#debate-list"),a=p=>i.get(p)?.name||(p?p[0].toUpperCase()+p.slice(1):"Session"),o=p=>(Zp[Id(p).unit]||"Round").toLowerCase();async function l(p,g){if(await Hr({title:"Close & grade this session?",body:"The session ends here and you get your scorecard. You won\u2019t be able to continue it.",actions:[{label:"Close & grade",value:"y",kind:"primary"},{label:"Cancel",value:null}]})){g.disabled=!0,g.innerHTML='<span class="spinner"></span><span>Scoring\u2026</span>';try{await Tt("/api/debate/end",{debateId:p.id}),p.ended_at=new Date().toISOString(),u(),h(p.id)}catch{g.disabled=!1,g.textContent="Close & grade"}}}async function c(p,g){if(await Hr({title:"Delete this session?",body:`\u201C${Le(p.topic||"Untitled")}\u201D and its transcript and scores will be permanently removed.`,actions:[{label:"Delete permanently",value:"y",kind:"danger"},{label:"Cancel",value:null}]}))try{await yc(`/api/debates/${encodeURIComponent(p.id)}`),t=t.filter(f=>f.id!==p.id),g.style.transition="opacity .2s, transform .2s",g.style.opacity="0",g.style.transform="scale(0.98)",setTimeout(()=>t.length?u():Td(n),200)}catch{await Hr({title:"Couldn\u2019t delete",body:"Please try again.",actions:[{label:"OK",value:1,kind:"primary"}]})}}let d=new Map;function u(){d.clear(),e.querySelector("#history-counter").textContent=`${t.length} session${t.length===1?"":"s"}`,s.innerHTML="";for(let p of t){let g=!!p.ended_at,v=document.createElement("article");v.className="card p-4 sm:p-5",v.innerHTML=`
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-accent-400 [&>svg]:h-5 [&>svg]:w-5">${Pd[p.mode]??Xe.chat}</div>
          <button type="button" data-a="open" class="min-w-0 flex-1 text-left">
            <span class="block font-semibold leading-snug text-white line-clamp-2 hover:text-accent-300">${Le(p.topic||"Untitled session")}</span>
            <span class="mt-1 block text-xs leading-relaxed text-slate-400">${[a(p.mode),eu(p.created_at),p.personaLabel?`vs ${p.personaLabel}`:"",p.targetRounds?`${p.targetRounds} ${o(p.mode)}s`:"open-ended"].filter(Boolean).map(Le).join(" \xB7 ")}</span>
          </button>
          <span class="badge ${g?"border-emerald-700/60 bg-emerald-500/10 text-emerald-300":"border-amber-500/40 bg-amber-500/10 text-amber-300"}">${g?p.overall!=null?`Your score ${Kn(p.overall)}/10`:"Finished":"In progress"}</span>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-700/60 pt-3">
          ${g?'<button type="button" data-a="open" class="btn-ghost btn-xs max-sm:min-h-[44px]">Transcript &amp; scores</button>':'<button type="button" data-a="resume" class="btn-primary btn-xs max-sm:min-h-[44px]">Resume</button><button type="button" data-a="close" class="btn-ghost btn-xs max-sm:min-h-[44px]">Close &amp; grade</button><button type="button" data-a="open" class="btn-ghost btn-xs max-sm:min-h-[44px]">Transcript</button>'}
          <button type="button" data-a="delete" class="ml-auto inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-950/50 hover:text-red-300" aria-label="Delete session" title="Delete session"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </div>
        <div data-detail class="hidden"></div>`,v.addEventListener("click",f=>{let m=f.target.closest("[data-a]");if(!m)return;let T=m.dataset.a;T==="resume"?location.hash=`#/session/${encodeURIComponent(p.id)}`:T==="open"?h(p.id):T==="close"?l(p,m):T==="delete"&&c(p,v)}),d.set(p.id,v),s.appendChild(v)}}async function h(p){let g=d.get(p);if(!g)return;let v=g.querySelector("[data-detail]");if(!v.classList.contains("hidden")&&v.dataset.loaded){v.classList.add("hidden");return}v.className="mt-4 border-t border-ink-700/60 pt-4",v.innerHTML='<p class="text-sm text-slate-500"><span class="spinner mr-2"></span>Loading\u2026</p>';try{let f=await St(`/api/debates/${encodeURIComponent(p)}`),m=f.debate.personaLabel||a(f.debate.mode),T=f.scorecard;v.dataset.loaded="1",v.innerHTML=`
        ${T?`<div class="mb-4 rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="mb-3 flex items-center justify-between"><span class="text-sm font-semibold text-white">Your score</span><span class="text-lg font-extrabold text-accent-400">${Kn(T.overall)}<span class="text-sm text-slate-500">/10</span></span></div>
          ${(T.dimensions||[]).length?`<div class="grid gap-x-6 gap-y-3 sm:grid-cols-2">${T.dimensions.map(M=>ll(M.label,M.score)).join("")}</div>`:""}
          ${T.notes?`<p class="mt-3 text-sm leading-relaxed text-slate-400">${Le(T.notes)}</p>`:""}</div>`:""}
        ${f.verdict&&f.verdict.winner?`<p class="mb-4 text-sm text-slate-300"><span class="font-semibold text-white">Judge:</span> ${f.verdict.winner==="you"?"you won":f.verdict.winner==="draw"?"a draw":`${Le(m)} won`}${f.verdict.reasoning?` \u2014 ${Le(f.verdict.reasoning)}`:""}</p>`:""}
        <div class="transcript-scroll max-h-[55vh] space-y-3 overflow-y-auto pr-1">${(f.turns||[]).map(M=>{let S=M.role==="user";return`<div class="flex ${S?"justify-end":"justify-start"}"><div class="${Qp(S)}"><div class="mb-1 text-[11px] font-semibold uppercase tracking-wide ${S?"text-accent-400":"text-slate-500"}">${S?"You":Le(m)}</div><div class="whitespace-pre-wrap break-words">${Le(M.text)}</div></div></div>`}).join("")||'<p class="text-sm text-slate-500">No turns recorded.</p>'}</div>`,requestAnimationFrame(()=>requestAnimationFrame(()=>v.querySelectorAll("[data-w]").forEach(M=>M.style.width=`${M.dataset.w}%`)))}catch{v.innerHTML='<p class="text-sm text-red-300">Couldn\u2019t load that transcript. Try again.</p>'}}u()}function Ze(n){return Le(n)}function mc(n){return n.replace(/\bdebates\b/gi,e=>e[0]===e[0].toUpperCase()?"Sessions":"sessions")}function Ha(n,e){try{return new Intl.NumberFormat(void 0,{style:"currency",currency:e.toUpperCase()}).format(n/100)}catch{return`${(n/100).toFixed(2)} ${e.toUpperCase()}`}}function j_(n){if(!n)return"\u2014";(typeof n=="number"||/^\d{9,11}$/.test(String(n)))&&(n=Number(n)*1e3);let e=new Date(n);return Number.isNaN(e.getTime())?n:e.toLocaleDateString(void 0,{month:"long",day:"numeric",year:"numeric"})}function Qs({title:n,body:e="",label:t="",type:i="text",value:r="",placeholder:s="",autocomplete:a="off",username:o="",readOnly:l=!1,confirm:c="OK",kind:d="primary",cancel:u="Cancel",validate:h=null}){return new Promise(p=>{let g=document.activeElement,v=`uip-${Date.now().toString(36)}`,f=document.createElement("div");f.className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in",f.setAttribute("role","dialog"),f.setAttribute("aria-modal","true"),f.setAttribute("aria-labelledby",`${v}-t`),f.innerHTML=`<form novalidate class="w-full max-w-md rounded-3xl border border-ink-700 bg-ink-900 p-6 shadow-2xl animate-pop-in">
      <h3 id="${v}-t" class="text-display-sm text-white">${Le(n)}</h3>
      ${e?`<p class="mt-2 text-sm leading-relaxed text-slate-400">${e}</p>`:""}
      ${o?`<input type="text" name="username" autocomplete="username" value="${Le(o)}" readonly tabindex="-1" aria-hidden="true" class="sr-only" />`:""}
      ${t?`<label for="${v}-i" class="mt-5 mb-1.5 block text-body-sm font-medium text-slate-300">${Le(t)}</label>`:""}
      <input id="${v}-i" type="${i}" class="field ${t?"":"mt-5"}" ${t?"":`aria-label="${Le(n)}"`} autocomplete="${a}" placeholder="${Le(s)}" ${l?"readonly":""} />
      <div class="hidden" data-err></div>
      <div class="mt-6 flex flex-col gap-2.5">
        <button type="submit" class="${d==="danger"?"btn-danger":"btn-primary"} w-full justify-center py-3">${Le(c)}</button>
        ${u?`<button type="button" data-cancel class="btn-ghost w-full justify-center py-3">${Le(u)}</button>`:""}
      </div>
    </form>`;let m=f.querySelector("form"),T=f.querySelector("input:not([name=username])"),M=f.querySelector("[data-err]"),S=f.querySelector('button[type="submit"]');T.value=r;let k=!1,R=b=>{document.removeEventListener("keydown",E),f.remove(),g&&g.isConnected&&typeof g.focus=="function"&&g.focus({preventScroll:!0}),p(b)},E=b=>{if(b.key==="Escape"&&!k)return R(null);if(b.key!=="Tab")return;let _=[...f.querySelectorAll("input:not([tabindex='-1']), button")].filter(z=>!z.disabled);if(!_.length)return;let x=_[0],C=_[_.length-1];b.shiftKey&&document.activeElement===x?(b.preventDefault(),C.focus()):!b.shiftKey&&document.activeElement===C&&(b.preventDefault(),x.focus())};document.addEventListener("keydown",E),f.addEventListener("click",b=>{k||(b.target===f||b.target.closest("[data-cancel]"))&&R(null)}),m.addEventListener("submit",async b=>{if(b.preventDefault(),k)return;let _=T.value;if(h){k=!0,Ga(S,!0,c);let x=null;try{x=await h(_)}catch{x="Something went wrong. Please try again."}if(k=!1,Ga(S,!1,c),x){Nr(M,x),M.classList.replace("mb-5","mt-4"),T.focus();return}}R(_)}),document.body.appendChild(f),T.focus(),l&&T.select()})}var $i=(n,e="")=>Hr({title:n,body:e&&Le(e),actions:[{label:"OK",value:1,kind:"primary"}]});async function Ed(n){n.innerHTML='<div class="max-w-4xl mx-auto px-4 py-6 sm:py-10" id="account-root"></div>';let e=n.querySelector("#account-root");e.appendChild(ul("page"));let t,i;try{[t,i]=await Promise.all([St("/api/account"),St("/api/billing/prices")])}catch(P){e.innerHTML="";let L=P instanceof Ct?`Error ${P.status}`:"Check your connection and try again.";e.appendChild(Jn(`Couldn't load your account. ${L}`,()=>void Ed(n)));return}let r=await Zn(),s=t.usage.quota>0?Math.min(100,t.usage.debates_used/t.usage.quota*100):0,a=t.subscription&&t.subscription.tier!=="none"&&t.subscription.status!=="canceled"?t.subscription:null,o=!!(t.isLifetime||a?.isLifetime),l={active:"Active",trialing:"Trial",past_due:"Payment issue \u2014 update your card in Manage billing",incomplete:"Payment pending",unpaid:"Payment issue \u2014 update your card in Manage billing"},c=a?l[a.status]||(a.status?a.status[0].toUpperCase()+a.status.slice(1).replace(/_/g," "):""):"",d=a?.current_period_end?j_(a.current_period_end):"";e.innerHTML="";let u=new URLSearchParams(location.hash.split("?")[1]??"");if(u.get("checkout")==="success"){let P=document.createElement("div");P.className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200",P.textContent="\u2713 Payment received \u2014 your account is updated. Thank you!",e.appendChild(P);try{let L=sessionStorage.getItem("aai_return");if(L&&/^\/(session|setup)\//.test(L)){sessionStorage.removeItem("aai_return");let I=document.createElement("a");I.href=`#${L}`,I.className="btn-primary mb-6 inline-flex",I.textContent=L.startsWith("/session/")?"Continue your session \u2192":"Back to your setup \u2192",e.appendChild(I)}}catch{}try{let L="aai_purchase_"+(a?.stripe_subscription_id||a?.tier||"pack")+"_"+new Date().toISOString().slice(0,10);if(!sessionStorage.getItem(L)){sessionStorage.setItem(L,"1");let I=null;try{I=JSON.parse(sessionStorage.getItem("aai_checkout")||"null"),sessionStorage.removeItem("aai_checkout")}catch{}Ps("purchase",{plan:a?.tier||"pack",value:I?.value||0,currency:"USD",transaction_id:`${I?.item||"pack"}-${Date.now()}`,attribution:window.adversaryAttribution?.()||null})}}catch{}}else if(u.get("checkout")==="cancelled"){let P=document.createElement("div");P.className="mb-6 rounded-2xl border border-ink-700 bg-ink-800/60 p-4 text-sm text-slate-300",P.textContent="Checkout cancelled \u2014 nothing was charged.",e.appendChild(P);try{let L=sessionStorage.getItem("aai_return");if(L&&/^\/(session|setup)\//.test(L)){let I=document.createElement("a");I.href=`#${L}`,I.className="btn-ghost mb-6 inline-flex",I.textContent=L.startsWith("/session/")?"Back to your session":"Back to your setup",e.appendChild(I)}}catch{}}let h=document.createElement("div");h.className="mb-8",h.innerHTML=`
    <p class="eyebrow mb-2">Settings</p>
    <h1 class="font-display text-display-lg text-white">Account</h1>
    <p class="text-slate-400 text-body-sm mt-1">${Ze(r?.email??t.email)}</p>`,e.appendChild(h);let p=document.createElement("div");p.className="grid sm:grid-cols-2 gap-4 mb-10",p.innerHTML=`
    <div class="card card-lift p-6">
      <div class="eyebrow mb-2">Plan</div>
      <div class="text-white font-semibold text-display-sm capitalize">${Ze(t.plan)}</div>
      ${o?'<p class="text-body-sm text-slate-400 mt-2">Lifetime access \u2014 no renewal, nothing to manage.</p>':a?`<div class="text-body-sm text-slate-400 mt-2">
               <span class="capitalize">${Ze(a.tier)}</span>${c?` \xB7 <span class="${/^Payment/.test(c)?"text-amber-300":""}">${Ze(c)}</span>`:""}
               ${d?`<div class="mt-1">${a.cancel_at_period_end?"Ends":"Renews"} ${Ze(d)}</div>`:""}
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
      <div id="promo-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>`,e.appendChild(g),setTimeout(()=>{let P=g.querySelector("#promo-redeem-form"),L=g.querySelector("#promo-code-input"),I=g.querySelector("#promo-redeem-btn"),O=g.querySelector("#promo-feedback");P&&P.addEventListener("submit",async J=>{J.preventDefault();let Z=(L.value||"").trim().toUpperCase();if(Z){I.disabled=!0,I.textContent="Checking\u2026",O.className="hidden mt-3 text-sm p-3 rounded-xl";try{let re=await fetch("/api/account/promo/redeem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:Z})}),ae=await re.json();re.ok&&ae.ok?(O.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block",O.textContent=ae.message,L.value="",setTimeout(()=>Ed(n),2e3)):(O.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",O.textContent=ae.error||"Invalid code.")}catch{O.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",O.textContent="Network error. Try again."}finally{I.disabled=!1,I.textContent="Redeem"}}})},0),t.isOwner){let P=document.createElement("div");P.className="card card-lift p-6 mb-10 border border-amber-500/30 bg-amber-500/5",P.innerHTML=`
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">\u{1F451}</span>
          <h2 class="font-display text-lg text-amber-300 font-semibold">Admin: Grant Lifetime VIP</h2>
        </div>
        <p class="text-slate-300 text-body-sm mb-4">Instantly upgrade any registered email to Lifetime Champion VIP with 100,000 rounds and 10 photoreal video minutes a month. They need to sign up first.</p>
        <form id="admin-grant-form" class="flex flex-wrap gap-2 max-w-md">
          <input type="email" id="admin-grant-email" placeholder="family@gmail.com" class="field flex-1 text-sm px-4 py-2.5 rounded-xl bg-ink-900 border border-ink-700 text-white focus:outline-none focus:border-accent-400" />
          <button type="submit" id="admin-grant-btn" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">Grant VIP</button>
        </form>
        <div id="admin-grant-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>`,e.appendChild(P);let L=document.createElement("div");L.className="card card-lift p-6 mb-10 border border-amber-500/30 bg-amber-500/5",L.innerHTML=`
        <h2 class="font-display text-lg text-amber-300 font-semibold mb-2">Admin: Reset a password</h2>
        <p class="text-slate-300 text-body-sm mb-4">For someone who emailed support. Sets a temporary password and signs them out everywhere. Email it to them and ask them to change it after logging in.</p>
        <form id="admin-pw-form" class="flex flex-wrap gap-2 max-w-md">
          <input type="email" id="admin-pw-email" placeholder="their@email.com" class="field flex-1 text-sm px-4 py-2.5 rounded-xl" required />
          <button type="submit" id="admin-pw-btn" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">Reset</button>
        </form>
        <div id="admin-pw-out" class="hidden mt-3 text-sm p-3 rounded-xl"></div>`,e.appendChild(L);let I=document.createElement("div");I.className="card card-lift p-6 mb-10 border border-amber-500/30 bg-amber-500/5",I.innerHTML=`
        <h2 class="font-display text-lg text-amber-300 font-semibold mb-2">Admin: Test a live payment</h2>
        <p class="text-slate-300 text-body-sm mb-4">Charges your card $0.50 (Stripe's minimum) and adds 1 round, using the same path as a real pack. Refund it in the Stripe dashboard afterwards to check refunds too.</p>
        <button type="button" id="admin-pay-btn" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">Pay $0.50</button>
        <div id="admin-pay-out" class="hidden mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200"></div>`,e.appendChild(I);let O=document.createElement("div");O.className="card card-lift p-6 mb-10 border border-amber-500/30 bg-amber-500/5",O.innerHTML=`<h2 class="font-display text-lg text-amber-300 font-semibold mb-2">Admin: Self-test the modes</h2>
      <p class="text-slate-300 text-body-sm mb-4">The AI plays a believable user against each mode's real prompts for 5 exchanges, then the real scorer grades it. Nothing is stored and no rounds are charged. Takes a few minutes.</p>
      <div class="flex flex-wrap gap-2 mb-3">
        <button type="button" data-run="all" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">Run all new modes</button>
        <button type="button" data-run="old" class="btn-ghost px-4 py-2.5 text-sm">Run the original modes</button>
        ${["rights","auditor","trafficstop","deescalate","testify","customer","salary","speaking","interview","debate","historical","acting","negotiation","sales","difficult","thesis","expert","rapbattle","witness"].map(Z=>`<button type="button" data-run="${Z}" class="btn-ghost px-3 py-2 text-xs">${Z}</button>`).join("")}
      </div>
      <div data-out class="space-y-4 text-sm"></div>`,e.appendChild(O),O.addEventListener("click",async Z=>{let re=Z.target.closest("[data-run]");if(!re)return;let ae=O.querySelector("[data-out]"),K=re.dataset.run==="all"?["rights","auditor","trafficstop","deescalate","testify","customer","salary","speaking"]:re.dataset.run==="old"?["interview","debate","historical","acting","negotiation","sales","difficult","thesis","expert","rapbattle","witness"]:[re.dataset.run];O.querySelectorAll("[data-run]").forEach(D=>D.disabled=!0);for(let D of K){let X=document.createElement("div");X.className="rounded-xl border border-ink-700 bg-ink-900 p-4",X.innerHTML=`<div class="font-semibold text-white">${D} <span class="text-slate-500 font-normal">running\u2026</span></div>`,ae.prepend(X);try{let le=await Tt("/api/account/admin/selftest",{mode:D,exchanges:5}),oe=le.scores||{},ke=Array.isArray(oe.dimensions)?oe.dimensions.map(xe=>`${Ze(xe.label||xe.name||"")} ${xe.score??""}`).join(" \xB7 "):oe.dimensions?Object.entries(oe.dimensions).map(([xe,Re])=>`${Ze(xe)} ${typeof Re=="object"?Re?.score??"":Re}`).join(" \xB7 "):"";X.innerHTML=`<div class="font-semibold text-white">${Ze(le.name)} <span class="text-slate-500 font-normal">${Math.round(le.ms/1e3)}s \xB7 AI = ${Ze(le.roles.ai)} \xB7 user = ${Ze(le.roles.human)}</span></div>
            <div class="mt-2 space-y-2">${le.turns.map(xe=>`<div class="${xe.role==="user"?"text-accent-200":"text-slate-200"}"><b>${xe.role==="user"?"USER":"AI"}:</b> ${Ze(xe.text)}</div>`).join("")}</div>
            <div class="mt-3 pt-3 border-t border-ink-700 text-slate-300"><b>Scorecard:</b> ${oe.overall!=null?`${oe.overall}/10 \xB7 `:""}${ke}<div class="mt-1 text-slate-400">${Ze(oe.notes||oe.headline||"")}</div></div>`}catch(le){X.innerHTML=`<div class="font-semibold text-white">${D}</div><div class="text-red-300 mt-1">${Ze(le?.body?.error||le?.message||"failed")}</div>${le?.body?.turns?`<div class="mt-2 space-y-2">${le.body.turns.map(oe=>`<div><b>${oe.role==="user"?"USER":"AI"}:</b> ${Ze(oe.text)}</div>`).join("")}</div>`:""}`}}O.querySelectorAll("[data-run]").forEach(D=>D.disabled=!1)});let J=document.createElement("div");J.className="card card-lift p-6 mb-10 border border-amber-500/30 bg-amber-500/5",J.innerHTML='<h2 class="font-display text-lg text-amber-300 font-semibold mb-2">Admin: Feedback</h2><div data-list class="text-sm text-slate-400">Loading\u2026</div>',e.appendChild(J),St("/api/account/admin/feedback").then(Z=>{let re=J.querySelector("[data-list]"),ae=Z?.feedback||[];if(!ae.length)return re.textContent="Nothing yet. The Feedback link in the menu and on the landing page lands here.";re.innerHTML=ae.map(K=>{let D=new Date(K.created_at).toLocaleString(),X=K.email?`<a class="link" href="mailto:${Ze(K.email)}">${Ze(K.email)}</a>`:"anonymous",le=/iPhone|iPad/.test(K.ua||"")?"iPhone":/Android/.test(K.ua||"")?"Android":/Brave/.test(K.ua||"")?"Brave":/Edg\//.test(K.ua||"")?"Edge":/Chrome/.test(K.ua||"")?"Chrome":/Safari/.test(K.ua||"")?"Safari":/Firefox/.test(K.ua||"")?"Firefox":"";return`<div class="py-3 border-b border-ink-700 last:border-0"><div class="text-xs text-slate-500 mb-1">${D} \xB7 ${X}${K.page?` \xB7 <code>${Ze(K.page)}</code>`:""}${le?` \xB7 ${le}`:""}</div><div class="text-slate-200 whitespace-pre-wrap">${Ze(K.message)}</div></div>`}).join("")}).catch(()=>J.querySelector("[data-list]").textContent="Couldn\u2019t load feedback."),I.querySelector("#admin-pay-btn").addEventListener("click",async Z=>{let re=Z.currentTarget,ae=I.querySelector("#admin-pay-out");re.disabled=!0;try{let{url:K}=await Tt("/api/billing/checkout",{kind:"test_payment"});location.href=K}catch(K){ae.classList.remove("hidden"),ae.textContent=K?.body?.error||"Could not start checkout.",re.disabled=!1}}),L.querySelector("#admin-pw-form").addEventListener("submit",async Z=>{Z.preventDefault();let re=L.querySelector("#admin-pw-email").value.trim(),ae=L.querySelector("#admin-pw-out"),K=L.querySelector("#admin-pw-btn");if(re){K.disabled=!0;try{let D=await Tt("/api/account/admin/reset-password",{email:re});ae.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 block",ae.innerHTML=`Temporary password for <b>${Ze(D.email)}</b>: <code class="select-all font-mono text-white">${Ze(D.tempPassword)}</code> <button type="button" class="ml-2 underline" data-copy>Copy</button><br><span class="text-emerald-200/80">Shown once. They\u2019ve been signed out everywhere.</span>`,ae.querySelector("[data-copy]").addEventListener("click",()=>navigator.clipboard?.writeText(D.tempPassword))}catch(D){ae.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",ae.textContent=D?.body?.error||"Could not reset the password."}finally{K.disabled=!1}}}),setTimeout(()=>{let Z=P.querySelector("#admin-grant-form"),re=P.querySelector("#admin-grant-email"),ae=P.querySelector("#admin-grant-btn"),K=P.querySelector("#admin-grant-feedback");Z&&Z.addEventListener("submit",async D=>{D.preventDefault();let X=(re.value||"").trim();if(X){ae.disabled=!0,ae.textContent="Granting\u2026",K.className="hidden mt-3 text-sm p-3 rounded-xl";try{let le=await fetch("/api/account/admin/grant-vip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:X})}),oe=await le.json();le.ok&&oe.ok?(K.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block",K.textContent=oe.message,re.value=""):(K.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",K.textContent=oe.error||"Could not grant VIP.")}catch{K.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",K.textContent="Network error. Try again."}finally{ae.disabled=!1,ae.textContent="Grant VIP"}}})},0)}if(t.isOwner){let P=document.createElement("section");P.className="card mb-10 p-6",P.innerHTML=`<h2 class="text-lg font-semibold text-white">Admin: photoreal avatars (Champion)</h2>
      <p class="mt-1 text-sm text-slate-400">Every persona look is cast automatically with a matching LiveAvatar actor \u2014 nothing to set up. Override any of them here if you like. Historical figures always use their own portraits.</p>
      <div data-body class="mt-4"><button type="button" class="btn-ghost btn-sm" data-load>Load avatar catalog</button></div>`,e.appendChild(P);let L=P.querySelector("[data-body]");P.querySelector("[data-load]").addEventListener("click",async()=>{L.innerHTML='<p class="text-sm text-slate-400"><span class="spinner mr-2"></span>Loading\u2026</p>';try{let[I,O]=await Promise.all([St("/api/avatar/catalog"),St("/api/avatar/map")]),J=K=>`<option value="none" ${!K||K==="none"?"selected":""}>\u2014 3D (no video) \u2014</option>`+I.avatars.map(D=>`<option value="${Ze(D.id)}" ${D.id===K?"selected":""}>${Ze(D.name||D.id)}${D.own?" (yours)":""}${D.gender?` \xB7 ${Ze(D.gender)}`:""}</option>`).join(""),Z={"man-pro":"Man \xB7 professional","woman-pro":"Woman \xB7 professional","older-man":"Older man","older-woman":"Older woman","man-casual":"Man \xB7 casual","woman-casual":"Woman \xB7 casual","teen-boy":"Young man","teen-girl":"Young woman","default-masc":"Man \xB7 default","default-fem":"Woman \xB7 default"},re=new Map(I.avatars.map(K=>[K.id,K])),ae=K=>{let D=re.get(K);return D?.image?`<img src="${Ze(D.image)}" alt="" class="h-full w-full object-cover object-top" loading="lazy" />`:'<span class="text-[10px] text-slate-500">3D</span>'};L.innerHTML=`<div class="grid gap-3 sm:grid-cols-2">${O.keys.map(K=>`<div class="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-800/50 p-2.5"><div data-thumb="${Ze(K.key)}" class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-900">${ae(O.map[K.key])}</div><label class="block min-w-0 flex-1"><span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">${Ze(Z[K.key]||K.label)}</span><select class="field text-sm" data-key="${Ze(K.key)}">${J(O.map[K.key])}</select></label></div>`).join("")}</div>
          <div class="mt-4 flex flex-wrap items-center gap-3"><button type="button" class="btn-primary btn-sm" data-save>Save avatars</button><button type="button" class="btn-ghost btn-sm" data-auto>Auto-cast all persona looks</button><span data-msg class="text-sm text-slate-400"></span></div>`,L.querySelectorAll("select[data-key]").forEach(K=>K.addEventListener("change",()=>{let D=L.querySelector(`[data-thumb="${K.dataset.key}"]`);D&&(D.innerHTML=ae(K.value))})),L.querySelector("[data-auto]").addEventListener("click",async K=>{K.target.disabled=!0;try{let D=await Tt("/api/avatar/map/auto",{});L.querySelectorAll("select[data-key]").forEach(X=>{if(!D.map[X.dataset.key])return;X.value=D.map[X.dataset.key];let le=L.querySelector(`[data-thumb="${X.dataset.key}"]`);le&&(le.innerHTML=ae(X.value))}),L.querySelector("[data-msg]").textContent="Re-cast and saved."}catch{L.querySelector("[data-msg]").textContent="Couldn\u2019t auto-cast \u2014 try again."}finally{K.target.disabled=!1}}),L.querySelector("[data-save]").addEventListener("click",async K=>{let D={};L.querySelectorAll("select[data-key]").forEach(X=>D[X.dataset.key]=X.value||"none"),K.target.disabled=!0;try{await Tt("/api/avatar/map",{map:D}),L.querySelector("[data-msg]").textContent="Saved."}catch{L.querySelector("[data-msg]").textContent="Couldn\u2019t save \u2014 try again."}finally{K.target.disabled=!1}})}catch(I){L.innerHTML=`<p class="text-sm text-amber-300">${I instanceof Ct&&I.status===503?"Add the LIVEAVATAR_API_KEY secret in Cloudflare first (see README).":"Couldn\u2019t load the LiveAvatar catalog."}</p>`}})}let v=document.createElement("section");v.className="mb-10",v.innerHTML=`
    <h2 class="font-display text-display-md text-white mb-1">Schools &amp; teams</h2>
    <p class="text-slate-400 text-body-sm mb-5">Invite people with a link and pay centrally. Business teams and police departments (sales, support, patrol, leadership) are $15 per seat per month with 300 rounds each and a manager dashboard; schools are $6 per seat.</p>
    <div class="card card-lift p-6">
      <div data-orgs class="space-y-2 mb-4"><p class="text-body-sm text-slate-500">Loading\u2026</p></div>
      <div class="flex flex-wrap gap-2">
        <button class="btn-ghost px-4 py-2 text-sm" data-create-team>+ Create a team or department</button>
        <button class="btn-ghost px-4 py-2 text-sm" data-create-school>+ Create a school</button>
      </div>
    </div>`,e.appendChild(v);let f=v.querySelector("[data-orgs]");async function m(){try{let{orgs:P}=await St("/api/orgs/mine");if(P.length===0){f.innerHTML=`<p class="text-body-sm text-slate-500">You're not part of a school or team yet.</p>`;return}f.innerHTML="";for(let L of P){let I=document.createElement("a");I.href=`#/org/${L.id}`,I.className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-800/60 border border-ink-700/60 px-4 py-3 hover:border-accent-600/60 transition-colors",I.innerHTML=`
          <span class="text-2xl" aria-hidden="true">${L.kind==="business"?"\u{1F4BC}":"\u{1F3EB}"}</span>
          <span>
            <span class="block text-white font-medium">${Ze(L.name)}</span>
            <span class="block text-body-sm text-slate-400 capitalize">${Ze(bl(L.role,L.kind))} \xB7 ${L.memberCount} members \xB7 ${L.sessionsUsed}/${L.sessionsPool} sessions${L.subscriptionActive?"":' \xB7 <span class="text-amber-300">no subscription</span>'}</span>
          </span>
          <span class="ml-auto text-accent-400 text-body-sm">Open \u2192</span>`,f.appendChild(I)}}catch{f.innerHTML=`<p class="text-body-sm text-slate-500">Couldn't load your schools and teams.</p>`}}m();let T=async P=>{let L=P==="business",I=null;await Qs({title:L?"Create a team or department":"Create a school",label:L?"Team, company or department name":"School name",autocomplete:"organization",placeholder:L?"e.g. Acme Sales Team, Mesa PD Patrol":"e.g. Lincoln High Debate Team",confirm:L?"Create team":"Create school",validate:async J=>{if(!J.trim())return L?"Enter a name for your team.":"Enter a name for your school.";try{I=(await Tt("/api/orgs",{name:J.trim(),kind:P})).org}catch{return L?"Could not create the team. Please try again.":"Could not create the school. Please try again."}}})!=null&&I&&(location.hash=`#/org/${I.id}`)};v.querySelector("[data-create-school]").addEventListener("click",()=>T("school")),v.querySelector("[data-create-team]").addEventListener("click",()=>T("business"));let M=!!r?.photoreal,S=!!r?.champion,k=a&&/active|trialing/.test(a.status||"")?a.tier:null,E={debater:["300 rounds / month","All 19 practice modes","Voiced 3D opponents with real lip-sync","Scorecards + impartial judge verdicts","Unused rounds roll over"],coach:["750 rounds / month \u2014 2.5\xD7 Debater","Everything in Debater","Best for daily practice, interview season & debate teams","Unused rounds roll over"],champion:["500 premium rounds / month",M?"Photoreal video opponents \u2014 60 min/month":"Photoreal video opponents (rolling out)","Strongest reasoning model \u2014 sharper opponents, deeper judge feedback","Everything in Debater, plus the Pro coach"],elite:["1,000 premium rounds / month",M?"Photoreal video opponents \u2014 2 hours/month":"Photoreal video opponents (rolling out)","Strongest reasoning model on every round","Everything in Champion, for daily practice"]},b=document.createElement("section");b.id="plans",b.innerHTML=`
    ${S?"":`<div class="card relative mb-6 overflow-hidden border-amber-500/30 p-6 sm:p-8">
      <div class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" aria-hidden="true"></div>
      <p class="eyebrow mb-2 !text-amber-300">Champion</p>
      <h2 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Practice against someone who looks you in the eye.</h2>
      <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">Pressure is what you're training for. Champion puts a photoreal human opponent on screen \u2014 real eye contact, real facial reactions, lips that match every word \u2014 driven by our sharpest reasoning model.</p>
      <ul class="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <li class="rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="font-semibold text-white">Photoreal video</div><div class="mt-1 text-slate-400">${M?"60 minutes a month of lifelike video opponents, or 2 hours on Elite.":"Lifelike video opponents \u2014 rolling out to Champions first."}</div></li>
        <li class="rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="font-semibold text-white">Sharper opponent</div><div class="mt-1 text-slate-400">DeepSeek-V4-Pro finds the hole in your argument faster and pushes harder.</div></li>
        <li class="rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="font-semibold text-white">Deeper feedback</div><div class="mt-1 text-slate-400">The judge and coach run on the Pro model too \u2014 more specific notes, better turning points.</div></li>
      </ul>
    </div>`}
    <h2 class="text-display-md text-white mb-1">${k?"Your plan":"Choose a plan"}</h2>
    <p class="text-slate-400 text-body-sm mb-5">Monthly, cancel anytime. Unused rounds roll over.</p>
    <div class="grid gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4" id="tier-grid"></div>
    <details class="card mb-10 p-5 text-sm">
      <summary class="cursor-pointer font-semibold text-white">Compare plans</summary>
      <div class="mt-4 overflow-x-auto"><table class="w-full min-w-[620px] text-left">
        <thead class="text-xs uppercase tracking-wider text-slate-500"><tr><th class="py-2 pr-4 font-semibold"></th><th class="py-2 pr-4">Debater</th><th class="py-2 pr-4">Coach</th><th class="py-2 pr-4 text-amber-300">Champion</th><th class="py-2 text-amber-300">Elite</th></tr></thead>
        <tbody class="divide-y divide-ink-700/70 text-slate-300">
          <tr><td class="py-2.5 pr-4 text-slate-400">Rounds / month</td><td>300</td><td>750</td><td>500 premium</td><td>1,000 premium</td></tr>
          <tr><td class="py-2.5 pr-4 text-slate-400">Opponent on screen</td><td>3D, lip-synced</td><td>3D, lip-synced</td><td class="font-semibold text-white">Photoreal video${M?" (60 min)":" (rolling out)"}</td><td class="font-semibold text-white">Photoreal video${M?" (2 hours)":" (rolling out)"}</td></tr>
          <tr><td class="py-2.5 pr-4 text-slate-400">Reasoning model</td><td>Standard</td><td>Standard</td><td class="font-semibold text-white">Pro</td><td class="font-semibold text-white">Pro</td></tr>
          <tr><td class="py-2.5 pr-4 text-slate-400">Judge & coach feedback</td><td>\u2713</td><td>\u2713</td><td class="font-semibold text-white">\u2713 Pro-level detail</td><td class="font-semibold text-white">\u2713 Pro-level detail</td></tr>
          <tr><td class="py-2.5 pr-4 text-slate-400">All 19 modes \xB7 unused rounds roll over</td><td>\u2713</td><td>\u2713</td><td>\u2713</td><td>\u2713</td></tr>
        </tbody></table></div>
    </details>`,e.appendChild(b);let _=document.createElement("section");_.innerHTML=`
    <h2 class="text-display-md text-white mb-1">Round packs</h2>
    <p class="text-slate-400 text-body-sm mb-5">One-time top-ups. Credits roll over and never expire \u2014 spent automatically when your plan quota runs out.</p>
    <div class="grid sm:grid-cols-3 gap-4" id="pack-grid"></div>`,e.appendChild(_);let x=e.querySelector("#tier-grid"),C=e.querySelector("#pack-grid");async function z(P,L,I,O={}){I.disabled=!0;let J=I.textContent;I.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Redirecting\u2026</span>';try{let Z=0;try{let ae=(i?.tiers||[]).find(le=>le.id===L),K=(i?.packs||[]).find(le=>le.id===L),D=(i?.videoPacks||[]).find(le=>le.id===L);Z=(P==="subscription"?O.interval==="year"?ae?.annualPrice:ae?.price:P==="video"?D?.price:K?.price)||0,sessionStorage.setItem("aai_checkout",JSON.stringify({kind:P,item:L,value:Z/100,at:Date.now()}));let X=new URLSearchParams(location.hash.split("?")[1]??"").get("next");X&&sessionStorage.setItem("aai_return",X)}catch{}Ps("begin_checkout",{kind:P,item:L,value:Z/100,currency:"USD",...O});let{url:re}=await Tt("/api/billing/checkout",{kind:P,item:L,...O});window.location.href=re}catch(Z){if(I.disabled=!1,I.textContent=J??"",Z instanceof Ct&&Z.status===409)try{let{url:re}=await Tt("/api/billing/portal");window.location.href=re;return}catch{}$i("Couldn\u2019t start checkout","Please try again.")}}for(let P of i.tiers){let L=P.id==="champion"||P.id==="elite",I=P.id==="coach",O=k===P.id,J=E[P.id]||[`${(P.rounds||P.debates).toLocaleString()} rounds / month`],Z=document.createElement("div");Z.className=`card relative flex flex-col p-6 ${L?"border-amber-400/50 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_18px_50px_-20px_rgba(251,191,36,0.35)]":I?"border-accent-600/50":""}`,Z.innerHTML=`
      ${L?`<span class="badge mb-3 self-start border-amber-400/40 bg-amber-400/15 text-amber-200">${P.id==="elite"?"Most video":"Best experience"}</span>`:I?'<span class="badge mb-3 self-start border-accent-500/40 bg-accent-500/10 text-accent-300">Most popular</span>':'<span class="mb-3 h-[22px]"></span>'}
      <div class="text-lg font-bold text-white">${Ze(mc(P.name))}</div>
      <div class="mb-4 mt-1"><span class="text-3xl font-extrabold tracking-tight ${L?"text-amber-300":"text-white"}">${Ze(Ha(P.price,P.currency))}</span><span class="text-sm text-slate-500"> /${Ze(P.interval)}</span></div>
      <ul class="mb-6 space-y-2 text-sm text-slate-300">${J.map(ae=>`<li class="flex gap-2"><span class="${L?"text-amber-300":"text-accent-400"}" aria-hidden="true">\u2713</span><span>${Ze(ae)}</span></li>`).join("")}</ul>
      <button class="${O?"btn-ghost":L?"btn-primary !bg-amber-400 !text-black hover:!bg-amber-300":I?"btn-primary":"btn-ghost"} mt-auto py-2.5 text-sm" ${O?"disabled":""}>${O?"Current plan":`Choose ${Ze(mc(P.name))}`}</button>`;let re=Z.querySelector("button");if(O||re.addEventListener("click",()=>void z("subscription",P.id,re)),!O&&P.annualPrice){let ae=Math.round((P.price*12-P.annualPrice)/100),K=document.createElement("button");K.type="button",K.className="mt-2 text-xs text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-white",K.textContent=`or pay yearly: ${Ha(P.annualPrice,P.currency)}/year${ae>0?` (save $${ae})`:""}`,K.addEventListener("click",()=>void z("subscription",P.id,K,{interval:"year"})),Z.appendChild(K)}x.appendChild(Z)}{let P=/packs=1/.test(location.hash)?_:/plans=1/.test(location.hash)?b:null;P&&setTimeout(()=>P.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),150)}i.tiers.length===0&&(x.innerHTML='<p class="text-body-sm text-slate-500 col-span-full">No subscription tiers are available right now.</p>');for(let P of i.packs){let L=document.createElement("div");L.className="card p-6 flex flex-col transition-all duration-200 ease-out-expo hover:-translate-y-1 hover:shadow-lift",L.innerHTML=`
      <div class="font-semibold text-white text-lg">${Ze(mc(P.name))}</div>
      <div class="mt-2 mb-1"><span class="font-display text-display-md text-white">${Ze(Ha(P.price,P.currency))}</span></div>
      <p class="text-body-sm text-slate-300 mb-3">${(P.rounds||P.credits).toLocaleString()} sparring rounds \xB7 Credits roll over & never expire</p>
      <button class="btn-ghost mt-auto px-4 py-2.5 text-sm">Buy pack</button>`;let I=L.querySelector("button");I.addEventListener("click",()=>void z("pack",P.id,I)),C.appendChild(L)}if(i.packs.length===0&&(C.innerHTML='<p class="text-body-sm text-slate-500 col-span-full">No round packs are available right now.</p>'),S&&i.videoPacks?.length){let P=document.createElement("section");P.className="mt-10",P.innerHTML=`<h2 class="text-display-md text-white mb-1">Extra video minutes</h2>
      <p class="text-slate-400 text-body-sm mb-5">More time with photoreal opponents. Used only after your monthly video minutes run out, and they never expire.</p>
      <div class="grid sm:grid-cols-2 gap-4" id="video-pack-grid"></div>`,_.appendChild(P);let L=P.querySelector("#video-pack-grid");for(let I of i.videoPacks){let O=document.createElement("div");O.className="card p-6 flex flex-col border-amber-400/30",O.innerHTML=`<div class="font-semibold text-white text-lg">${I.minutes} video minutes</div>
        <div class="mt-2 mb-1"><span class="font-display text-display-md text-amber-300">${Ze(Ha(I.price,I.currency))}</span></div>
        <p class="text-body-sm text-slate-300 mb-3">One-time \xB7 never expires</p>
        <button class="btn-ghost mt-auto px-4 py-2.5 text-sm">Buy minutes</button>`;let J=O.querySelector("button");J.addEventListener("click",()=>void z("video",I.id,J)),L.appendChild(O)}}e.appendChild(v);let W=document.createElement("section");W.className="mb-10",W.innerHTML=`<h2 class="font-display text-display-md text-white mb-1">Delete account</h2>
    <p class="text-slate-400 text-body-sm mb-4">Permanently deletes your account, sessions and scores. Any subscription is cancelled at the end of its billing period. This can\u2019t be undone.</p>
    <button type="button" class="btn-danger btn-sm" data-delete-account>Delete my account\u2026</button>`,e.appendChild(W),W.querySelector("[data-delete-account]").addEventListener("click",async()=>{if(await Qs({title:"Delete your account?",body:"All your sessions, scores and history will be erased. This cannot be undone.",label:"Enter your password to confirm",type:"password",autocomplete:"current-password",username:r?.email??t.email??"",confirm:"Delete everything",kind:"danger",cancel:"Keep my account",validate:async L=>{if(!L)return"Enter your password to confirm.";try{await Tt("/api/auth/delete-account",{password:L})}catch(I){return I instanceof Ct&&I.status===401?"That password didn\u2019t match.":I instanceof Ct&&I.body?.message?I.body.message:"Couldn\u2019t delete the account \u2014 please email support@getadversaryai.com."}}})!=null){try{localStorage.clear()}catch{}location.hash="#/signup",location.reload()}});let N=e.querySelector("#portal-btn");N&&N.addEventListener("click",async()=>{N.disabled=!0,N.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Opening\u2026</span>';try{let{url:P}=await Tt("/api/billing/portal");window.location.href=P}catch{N.disabled=!1,N.textContent="Manage billing",$i("Couldn\u2019t open the billing portal","Please try again.")}})}function za(n,e){n.className="error-box mb-5 animate-fade-in",n.setAttribute("role","alert"),n.innerHTML=`<span aria-hidden="true" class="shrink-0 mt-0.5 text-danger">${dl}</span><span></span>`,n.querySelector("span:last-child").textContent=e}function fc(n,e){let t=e?.error;return t==="code_exhausted"||n===410?"This invite link has reached its maximum number of uses. Ask your teacher for a new one.":t==="code_expired"?"This invite link has expired. Ask your teacher for a new one.":t==="already_member"?"You are already a member of this school.":t==="seats_exhausted"||t==="subscription_inactive"?"This school has filled all of its seats. Ask your teacher or school admin to purchase more seats, then try again.":t==="email_taken"||n===409?"An account with that email already exists. Log in first, then open the invite link again to join.":n===404?"We couldn't find that invite. Check the link and try again.":n===429?e?.message||"Too many attempts from this network \u2014 try again in an hour.":"Something went wrong. Please try again."}async function q_(n,e){let t=document.createElement("div");t.className="w-full max-w-md animate-fade-up",n.appendChild(Ld()),n.appendChild(t),t.innerHTML=`
    <div class="text-center mb-8">
      <div class="text-5xl mb-4" aria-hidden="true">\u{1F3EB}</div>
      <h1 class="font-display text-display-lg text-white">Joining\u2026</h1>
      <p class="text-slate-400 mt-2 text-body-md">Checking your invite.</p>
    </div>`;let i;try{i=await St(`/api/orgs/join/${encodeURIComponent(e)}`)}catch(d){let u=d instanceof Ct?d.status:0;t.innerHTML=`
      <div class="text-center mb-8">
        <div class="text-5xl mb-4" aria-hidden="true">\u{1F3EB}</div>
        <h1 class="font-display text-display-lg text-white">Invite not valid</h1>
        <p class="text-slate-400 mt-2 text-body-md">${fc(u,d instanceof Ct?d.body:null)}</p>
        <a href="#/" class="link font-medium mt-6 inline-block">Back to AdversaryAI</a>
      </div>`;return}let r=i.kind==="business",s=bl(i.role==="teacher"?"teacher":"student",i.kind).toLowerCase(),a=await Zn();t.innerHTML=`
    <div class="text-center mb-8">
      <div class="text-5xl mb-4" aria-hidden="true">${r?"\u{1F4BC}":"\u{1F3EB}"}</div>
      <h1 class="font-display text-display-lg text-white">Join ${gc(i.orgName)}</h1>
      <p class="text-slate-400 mt-2 text-body-md">You've been invited as a <span class="text-white font-medium">${s}</span>. Your ${r?"company":"school"} covers the cost \u2014 this is free for you.</p>
      <p class="text-slate-500 mt-2 text-body-sm">Your ${r?"managers":"teachers"} can see your practice scores and session counts, never your transcripts.</p>
    </div>
    <div class="card p-6 sm:p-8 relative overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/60 to-transparent" aria-hidden="true"></div>
      <div class="hidden mb-5" data-error></div>
      <div data-body></div>
    </div>`;let o=t.querySelector("[data-error]"),l=t.querySelector("[data-body]");if(a){l.innerHTML=`
      <p class="text-body-sm text-slate-400 mb-5">Signed in as <span class="text-white">${gc(a.email)}</span></p>
      <button class="btn-primary w-full py-3" data-join>Join ${gc(i.orgName)}</button>`;let d=l.querySelector("[data-join]");d.addEventListener("click",async()=>{d.disabled=!0,d.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Joining\u2026</span>',o.classList.add("hidden");try{await Tt("/api/orgs/join",{code:i.code}),ea(null),await Zn(!0),location.hash="#/"}catch(u){d.disabled=!1,d.textContent=`Join ${i.orgName}`,za(o,fc(u instanceof Ct?u.status:0,u instanceof Ct?u.body:null))}});return}l.innerHTML=`
    <form novalidate>
      <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="join-email">Email</label>
      <input id="join-email" type="email" required autocomplete="email" placeholder="you@example.com" class="field mb-4" />
      <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="join-password">Password</label>
      <input id="join-password" type="password" required autocomplete="new-password" minlength="8" placeholder="Minimum 8 characters" class="field mb-6" />
      <button type="submit" class="btn-primary w-full py-3">Create account &amp; join</button>
    </form>
    <p class="text-center text-body-sm text-slate-500 mt-6">Already have an account? <a href="#/login" class="link font-medium">Log in</a>, then open this link again.</p>`;let c=l.querySelector("form");c.addEventListener("submit",async d=>{d.preventDefault();let u=c.querySelector("#join-email").value.trim(),h=c.querySelector("#join-password").value,p=c.querySelector('button[type="submit"]');if(o.classList.add("hidden"),!u||!h){za(o,"Enter your email and password.");return}if(h.length<8){za(o,"Password must be at least 8 characters.");return}p.disabled=!0,p.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Creating your account\u2026</span>';try{await Tt("/api/auth/signup",{email:u,password:h,inviteCode:i.code});let g=await St("/api/auth/me");ea(g),location.hash="#/"}catch(g){p.disabled=!1,p.textContent="Create account & join",za(o,fc(g instanceof Ct?g.status:0,g instanceof Ct?g.body:null))}})}function gc(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Ht(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function vc(n){if(!n)return"Never";let e=new Date(n);return Number.isNaN(e.getTime())?n:e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function bl(n,e){return e==="business"&&{owner:"Owner",teacher:"Manager",student:"Member"}[n]||n}var em="school";function xc(n){let e={owner:"bg-amber-500/15 text-amber-300 border-amber-500/30",teacher:"bg-sky-500/15 text-sky-300 border-sky-500/30",student:"bg-slate-500/15 text-slate-300 border-slate-500/30"};return`<span class="inline-block text-caption font-semibold uppercase tracking-wider border rounded-full px-2.5 py-0.5 ${e[n]??e.student}">${Ht(bl(n,em))}</span>`}async function tm(n,e){n.innerHTML='<div class="max-w-4xl mx-auto px-4 py-6 sm:py-10" id="org-root"></div>';let t=n.querySelector("#org-root");t.appendChild(ul("page"));let i=new URLSearchParams(location.hash.split("?")[1]??"").get("checkout"),r;try{r=(await St(`/api/orgs/${encodeURIComponent(e)}`)).org}catch(E){t.innerHTML="";let b=E instanceof Ct&&E.status===403?"You are not a member of this school.":"Check your connection and try again.";t.appendChild(Jn(`Couldn't load this school. ${b}`,()=>void tm(n,e)));return}let s=r.role==="owner",a=s||r.role==="teacher",o=r.sessionsPool>0?Math.min(100,r.sessionsUsed/r.sessionsPool*100):0,l=r.kind==="business",c=Number(r.seatPrice)||(l?15:6),d=Number(r.minSeats)||1;em=r.kind||"school",t.innerHTML="",i==="success"?t.innerHTML+='<div class="card p-4 mb-6 border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-body-sm" role="status">Payment successful \u2014 your seats are active. It can take a minute for the new quota to appear.</div>':i==="cancelled"&&(t.innerHTML+='<div class="card p-4 mb-6 border-ink-600 text-slate-300 text-body-sm" role="status">Checkout was cancelled. No payment was taken.</div>');let u=document.createElement("div");u.className="mb-8 flex flex-wrap items-start justify-between gap-4",u.innerHTML=`
    <div>
      <p class="eyebrow mb-2">${l?"Business team":"School"}</p>
      <h1 class="font-display text-display-lg text-white flex items-center gap-3">${Ht(r.name)} ${xc(r.role)}</h1>
      <p class="text-slate-400 text-body-sm mt-2">
        ${r.subscriptionActive?'<span class="text-emerald-300">\u25CF Active subscription</span>':`<span class="text-amber-300">\u25CF No active subscription</span> \u2014 ${s?"buy seats below to activate the shared session pool.":"ask your school admin to activate billing."}`}
      </p>
    </div>
    <a href="#/account" class="btn-ghost px-4 py-2 text-sm">\u2190 Account</a>`,t.appendChild(u);let h=document.createElement("div");if(h.className="card card-lift p-6 mb-6",h.innerHTML=`
    <div class="eyebrow mb-2">Shared sessions this month</div>
    <div class="text-white font-semibold text-display-sm">${r.sessionsUsed}<span class="text-slate-500 text-body-md font-normal"> / ${r.sessionsPool} sessions</span></div>
    <div class="h-2.5 rounded-full bg-ink-800 overflow-hidden mt-3" role="progressbar" aria-valuenow="${Math.round(o)}" aria-valuemin="0" aria-valuemax="100" aria-label="School session usage">
      <div class="score-fill h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400" style="width:${o}%"></div>
    </div>
    <div class="grid grid-cols-3 gap-3 mt-5 text-sm">
      <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
        <div class="eyebrow !text-[0.65rem]">Seats</div>
        <div class="text-white font-semibold mt-1">${r.seatCount}</div>
      </div>
      <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
        <div class="eyebrow !text-[0.65rem]">Members</div>
        <div class="text-white font-semibold mt-1">${r.memberCount}</div>
      </div>
      <div class="rounded-xl bg-ink-800/60 border border-ink-700/60 p-3">
        <div class="eyebrow !text-[0.65rem]">Per seat</div>
        <div class="text-white font-semibold mt-1">${r.roundsPerSeat||150} rds/mo</div>
      </div>
    </div>`,t.appendChild(h),s){let E=document.createElement("div");E.className="card card-lift p-6 mb-6",E.innerHTML=`
      <h2 class="font-display text-display-md text-white mb-1">Billing</h2>
      <p class="text-slate-400 text-body-sm mb-5">$${c} per seat per month. Each seat adds ${r.roundsPerSeat||150} shared sparring rounds per month.${l?` Minimum ${d} seats. Team members never pay.`:" Students never pay."}</p>
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="seats-input">Seats</label>
          <input id="seats-input" type="number" min="${d}" max="5000" value="${Math.max(r.seatCount,l?5:10,d)}" class="field w-32" />
        </div>
        <div class="text-body-sm text-slate-400 pb-2.5">= <span class="text-white font-semibold" data-total>$60</span>/month</div>
        <button class="btn-primary px-5 py-2.5 text-sm" data-buy>Buy seats</button>
        ${r.subscriptionActive?'<button class="btn-ghost px-5 py-2.5 text-sm" data-portal>Manage billing</button>':""}
      </div>
      <p class="text-body-sm text-slate-500 mt-3">Need more seats later? Use \u201CManage billing\u201D to change the quantity any time.</p>`,t.appendChild(E);let b=E.querySelector("#seats-input"),_=E.querySelector("[data-total]"),x=()=>{_.textContent=`$${(Math.max(d,Number(b.value)||0)*c).toLocaleString()}`};b.addEventListener("input",x),x();let C=E.querySelector("[data-buy]");C.addEventListener("click",async()=>{let W=Math.max(d,Math.floor(Number(b.value)||0));C.disabled=!0,C.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Redirecting\u2026</span>';try{let{url:N}=await Tt(`/api/orgs/${encodeURIComponent(r.id)}/checkout`,{seats:W});window.location.href=N}catch(N){C.disabled=!1,C.textContent="Buy seats",$i("Couldn\u2019t start checkout",N?.body?.message||"Please try again.")}});let z=E.querySelector("[data-portal]");z&&z.addEventListener("click",async()=>{z.disabled=!0,z.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Opening\u2026</span>';try{let{url:W}=await Tt(`/api/orgs/${encodeURIComponent(r.id)}/portal`);window.location.href=W}catch{z.disabled=!1,z.textContent="Manage billing",$i("Couldn\u2019t open the billing portal","Please try again.")}})}if(!a)return;let p=document.createElement("div");p.className="card card-lift p-6 mb-6",p.innerHTML=`<h2 class="font-display text-display-md text-white mb-1">${l?"Team progress":"Class progress"}</h2><p class="text-slate-400 text-body-sm mb-4">Practice in the last 30 days. You see scores and session counts, never transcripts.</p><div data-report><p class="text-body-sm text-slate-500">Loading\u2026</p></div>`,t.appendChild(p),(async()=>{let E=p.querySelector("[data-report]");try{let b=await St(`/api/orgs/${encodeURIComponent(r.id)}/report`),_=l?"member":"student",x=(b.members||[]).map(z=>`<tr class="border-t border-ink-700/70"><td class="py-2 pr-3 text-slate-200">${Ht(z.email)} ${z.role!=="student"?`<span class="text-xs text-slate-500">(${Ht(bl(z.role,r.kind))})</span>`:""}</td><td class="py-2 pr-3 text-right">${z.sessions||0}</td><td class="py-2 pr-3 text-right">${z.avgScore!=null?z.avgScore:"\u2014"}</td><td class="py-2 pr-3 text-right">${z.best!=null?z.best:"\u2014"}</td><td class="py-2 text-right text-slate-400">${z.lastActive?Ht(vc(z.lastActive)):"never"}</td></tr>`).join(""),C=(b.skills||[]).length?`<div class="mt-5"><div class="eyebrow mb-2">Where your ${l?"team":"class"} needs work</div><div class="flex flex-wrap gap-2">${b.skills.map(z=>`<span class="badge border-amber-500/30 bg-amber-500/10 text-amber-200">${Ht(z.label)} \xB7 ${z.avg}/10</span>`).join("")}</div></div>`:"";E.innerHTML=x?`<div class="overflow-x-auto"><table class="w-full min-w-[520px] text-left text-sm"><thead class="text-xs uppercase tracking-wider text-slate-500"><tr><th class="py-2 pr-3">${l?"Member":"Student"}</th><th class="py-2 pr-3 text-right">Sessions</th><th class="py-2 pr-3 text-right">Avg score</th><th class="py-2 pr-3 text-right">Best</th><th class="py-2 text-right">Last active</th></tr></thead><tbody class="text-slate-300">${x}</tbody></table></div>${C}`:`<p class="text-body-sm text-slate-500">No ${_}s yet. Create an invite link below.</p>`}catch{E.innerHTML='<p class="text-body-sm text-slate-500">Couldn\u2019t load progress right now.</p>'}})();let g=document.createElement("div");g.className="card card-lift p-6 mb-6";let v=r.memberCount>=r.seatCount;g.innerHTML=`
    <h2 class="font-display text-display-md text-white mb-1">Invite links</h2>
    <p class="text-slate-400 text-body-sm mb-5">${l?"Share a link \u2014 your team signs up free and joins automatically. Every practice mode is available.":"Share a link \u2014 students sign up free and join automatically. Rap battle is not available to school members."}</p>
    ${r.subscriptionActive?v?`<div class="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-body-sm px-4 py-3 mb-5" role="status">All ${Ht(String(r.seatCount))} seats are filled \u2014 new members are blocked until you purchase more seats.</div>`:`<p class="text-body-sm text-slate-500 mb-5">${Ht(String(r.seatCount-r.memberCount))} of ${Ht(String(r.seatCount))} seats still open.</p>`:'<div class="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-body-sm px-4 py-3 mb-5" role="status">No active subscription \u2014 new members are blocked from joining until you purchase seats.</div>'}
    <form data-create class="flex flex-wrap items-end gap-3 mb-6">
      <div>
        <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="inv-role">Role</label>
        <select id="inv-role" class="field w-36">
          <option value="student">${l?"Member":"Student"}</option>
          ${s?`<option value="teacher">${l?"Manager":"Teacher"}</option>`:""}
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
    <div data-list class="space-y-2"></div>`,t.appendChild(g);let f=g.querySelector("[data-list]"),m=E=>{if(E.length===0){f.innerHTML='<p class="text-body-sm text-slate-500">No invite links yet. Create one above.</p>';return}f.innerHTML="";for(let b of E){let _=document.createElement("div");_.className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-800/60 border border-ink-700/60 px-4 py-3";let x=Math.max(0,b.max_uses-b.uses);_.innerHTML=`
        <code class="text-accent-300 font-mono text-sm">${Ht(b.code)}</code>
        ${xc(b.role)}
        <span class="text-body-sm text-slate-400">${b.uses}/${b.max_uses} used${x===0?' \xB7 <span class="text-amber-300">exhausted</span>':""}</span>
        <span class="text-body-sm text-slate-500">expires ${Ht(vc(b.expires_at))}</span>
        <div class="ml-auto flex gap-2">
          <button class="btn-ghost px-3 py-1.5 text-sm" data-copy>Copy link</button>
          <button class="btn-ghost px-3 py-1.5 text-sm text-danger" data-revoke>Revoke</button>
        </div>`,_.querySelector("[data-copy]").addEventListener("click",async C=>{let z=C.currentTarget;try{await navigator.clipboard.writeText(b.url),z.textContent="Copied!",setTimeout(()=>{z.textContent="Copy link"},1500)}catch{Qs({title:"Copy this invite link",value:b.url,readOnly:!0,confirm:"Done",cancel:""})}}),_.querySelector("[data-revoke]").addEventListener("click",async()=>{if(await Hr({title:"Revoke this invite?",body:`Nobody new can join with <b>${Ht(b.code)}</b> after this.`,actions:[{label:"Revoke invite",value:1,kind:"danger"},{label:"Cancel",value:null}]}))try{await yc(`/api/orgs/${encodeURIComponent(r.id)}/invites/${encodeURIComponent(b.code)}`),await R()}catch{$i("Couldn\u2019t revoke the invite","Please try again.")}}),f.appendChild(_)}},T=g.querySelector("[data-create]");T.addEventListener("submit",async E=>{E.preventDefault();let b=T.querySelector('button[type="submit"]');b.disabled=!0;try{let _=await Tt(`/api/orgs/${encodeURIComponent(r.id)}/invites`,{role:T.querySelector("#inv-role").value,maxUses:Number(T.querySelector("#inv-uses").value)||50,expiresInDays:Number(T.querySelector("#inv-days").value)||30}),x=!1;try{await navigator.clipboard.writeText(_.url),x=!0}catch{}Qs({title:x?"Invite link created and copied":"Invite link created",body:x?"It\u2019s on your clipboard \u2014 share it with your students.":"Copy it and share it with your students.",value:_.url,readOnly:!0,confirm:"Done",cancel:""}),await R()}catch{$i("Couldn\u2019t create the invite","Please try again.")}finally{b.disabled=!1}});let M=document.createElement("div");M.className="card card-lift p-6 mb-6",M.innerHTML=`
    <h2 class="font-display text-display-md text-white mb-1">Members</h2>
    <p class="text-slate-400 text-body-sm mb-5">${Ht(String(r.memberCount))} people in ${Ht(r.name)}.</p>
    <div data-list class="space-y-2"></div>`,t.appendChild(M);let S=M.querySelector("[data-list]"),k=E=>{S.innerHTML="";for(let b of E){let _=document.createElement("div");_.className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-800/60 border border-ink-700/60 px-4 py-3",_.innerHTML=`
        <span class="text-white text-body-md">${Ht(b.email)}</span>
        ${xc(b.role)}
        <span class="text-body-sm text-slate-500">joined ${Ht(vc(b.joined_at))}</span>
        ${s&&b.role!=="owner"?'<button class="btn-ghost px-3 py-1.5 text-sm text-danger ml-auto" data-remove>Remove</button>':""}`;let x=_.querySelector("[data-remove]");x&&x.addEventListener("click",async()=>{if(await Hr({title:"Remove this member?",body:`<b>${Ht(b.email)}</b> will lose access to ${Ht(r.name)}.`,actions:[{label:"Remove member",value:1,kind:"danger"},{label:"Cancel",value:null}]}))try{await yc(`/api/orgs/${encodeURIComponent(r.id)}/members/${encodeURIComponent(b.id)}`),await R()}catch{$i("Couldn\u2019t remove that member","Please try again.")}}),S.appendChild(_)}};async function R(){try{let E=await St(`/api/orgs/${encodeURIComponent(e)}`);m(E.org.invites??[]),k(E.org.members??[])}catch{}}m(r.invites??[]),k(r.members??[])}var Dn;async function Zn(n=!1){if(Dn!==void 0&&!n)return Dn;try{Dn=await St("/api/auth/me")}catch(e){if(e instanceof Ct&&e.status===401)Dn=null;else throw e}return Dn}function ea(n){Dn=n}var Di=document.getElementById("app");Sm();function _c(n){let e=document.createElement("header");e.className="app-header border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20",e.innerHTML=`
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
        <a href="#" data-feedback class="px-3 py-1.5 rounded-lg hover:bg-ink-800 text-slate-300 hover:text-white">Feedback</a>
        ${typeof n?.remainingRounds=="number"&&n.remainingRounds<1e5?`<a href="#/account?plans=1" title="Rounds left" class="ml-1 badge ${n.remainingRounds<=3?"border-accent-500/50 bg-accent-500/15 text-accent-200":"border-ink-700 bg-ink-800 text-slate-300"}">${n.remainingRounds} round${n.remainingRounds===1?"":"s"}</a>`:""}
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
      <a href="#" data-feedback class="block px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-ink-800">Feedback \xB7 report a problem</a>
      <div id="admin-mode-slot-mobile" class="mt-1"></div><button id="logout-btn-mobile" class="mt-1 w-full text-left px-3 py-2.5 rounded-lg border border-ink-700 text-slate-400 hover:text-white hover:border-slate-500">Log out</button>
    </div>`,e.querySelector("#theme-toggle-slot").appendChild(bc()),e.querySelector("#theme-toggle-slot-mobile").appendChild(bc()),(function(){if(!(n&&(n.isOwner||n.plan==="owner")))return;function l(u){let h=document.createElement("button");h.type="button",h.className=u?"w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between mb-1.5":"px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all";function p(){(document.cookie.match(/adversaryai_admin_mode=([^;]+)/)?.[1]||localStorage.getItem("adversaryai_admin_mode")||"premium").toLowerCase()==="regular"?(h.style.cssText="border-color:rgba(56,189,248,0.5);background:rgba(56,189,248,0.12);color:#7dd3fc;cursor:pointer;",h.innerHTML=u?'<span>\u{1F451} Admin Mode:</span><span class="font-bold text-cyan-300">\u26A1 Regular (Flash)</span>':'<span style="color:#fbbf24">\u{1F451}</span><span>\u26A1 Regular (Flash)</span>'):(h.style.cssText="border-color:rgba(251,191,36,0.5);background:rgba(251,191,36,0.12);color:#fde68a;cursor:pointer;",h.innerHTML=u?'<span>\u{1F451} Admin Mode:</span><span class="font-bold text-amber-300">\u2726 Premium (Pro)</span>':'<span style="color:#fbbf24">\u{1F451}</span><span>\u2726 Premium (Pro)</span>')}return p(),h.addEventListener("click",async()=>{let v=(document.cookie.match(/adversaryai_admin_mode=([^;]+)/)?.[1]||localStorage.getItem("adversaryai_admin_mode")||"premium").toLowerCase()==="regular"?"premium":"regular";document.cookie="adversaryai_admin_mode="+v+";path=/;max-age=31536000;SameSite=Lax;Secure",localStorage.setItem("adversaryai_admin_mode",v);try{await fetch("/api/account/admin-mode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:v})})}catch{}document.querySelectorAll("[data-adm-btn]").forEach(f=>f.__sc&&f.__sc()),$i("Switched to "+(v==="regular"?"Regular Mode (DeepSeek-V4-Flash)":"Premium Mode (DeepSeek-V4-Pro)"))}),h.setAttribute("data-adm-btn","1"),h.__sc=p,h}let c=e.querySelector("#admin-mode-slot"),d=e.querySelector("#admin-mode-slot-mobile");c&&c.appendChild(l(!1)),d&&d.appendChild(l(!0))})();let t=async()=>{try{await Tt("/api/auth/logout")}finally{ea(null),location.hash="#/login"}};e.querySelector("#logout-btn").addEventListener("click",t),e.querySelector("#logout-btn-mobile").addEventListener("click",t);let i=e.querySelector("#menu-btn"),r=e.querySelector("#mobile-menu"),s=o=>{r.classList.toggle("hidden",!o),i.setAttribute("aria-expanded",String(o)),i.setAttribute("aria-label",o?"Close menu":"Open menu")};i.addEventListener("click",()=>s(r.classList.contains("hidden"))),r.querySelectorAll("a").forEach(o=>o.addEventListener("click",()=>s(!1))),Di.innerHTML="",Di.appendChild(e);let a=document.createElement("main");a.className="flex-1 w-full",a.appendChild(n),Di.appendChild(a)}function Nh(n){Di.innerHTML="";let e=document.createElement("main");e.className="flex-1 w-full flex items-center justify-center px-4 py-10",e.appendChild(n),Di.appendChild(e)}function Oh(n){let e=document.createElement("header");e.className="app-header border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20",e.innerHTML=`<div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
    <a href="#/" class="flex shrink-0 items-center gap-2" aria-label="AdversaryAI home">
      <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true" class="shrink-0"><rect width="512" height="512" rx="112" fill="#0d0f14"/><polygon points="256,104 400,392 112,392" fill="none" stroke="#e8392e" stroke-width="34" stroke-linejoin="round"/><g fill="#e8392e"><rect x="165" y="264" width="22" height="44" rx="11"/><rect x="193" y="244" width="22" height="84" rx="11"/><rect x="221" y="226" width="22" height="120" rx="11"/><rect x="249" y="212" width="22" height="148" rx="11"/><rect x="277" y="230" width="22" height="112" rx="11"/><rect x="305" y="248" width="22" height="76" rx="11"/><rect x="333" y="266" width="22" height="40" rx="11"/></g></svg>
      <span class="font-display text-lg tracking-tight">Adversary<span class="text-accent-500">AI</span></span>
    </a>
    <nav class="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
      <a href="#/arena" class="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-accent-400 hover:text-accent-300 sm:flex"><span class="text-base" aria-hidden="true">\u{1F525}</span> Community Arena</a>
      <a href="#/login" class="whitespace-nowrap rounded-lg px-2 py-2.5 text-slate-300 hover:bg-ink-800 hover:text-white sm:px-3">Log in</a>
      <a href="#/signup" class="btn-primary btn-sm whitespace-nowrap px-3 text-xs sm:text-sm"><span class="min-[360px]:hidden">Try free</span><span class="max-[359px]:hidden">Start Free Trial</span></a>
    </nav>
  </div>`,Di.innerHTML="",Di.appendChild(e);let t=document.createElement("main");t.className="flex-1 w-full",t.appendChild(n),Di.appendChild(t)}async function X_(n,e){n.innerHTML=`<div class="max-w-4xl mx-auto px-4 py-8 text-center text-slate-400">
    <div class="inline-block animate-spin text-2xl mb-3">\u26A1</div>
    <p>Loading spectator match\u2026</p>
  </div>`;let t;try{t=await St("/api/public/debate/"+encodeURIComponent(e))}catch{n.innerHTML=`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <div class="text-4xl mb-3">\u{1F512}</div>
      <h1 class="text-2xl font-bold text-white mb-2">Debate Not Available</h1>
      <p class="text-sm text-slate-400 mb-6">This debate may be private or has been removed by the author.</p>
      <a href="#/arena" class="btn-primary text-sm">Browse Public Arena</a>
    </div>`;return}let i=new Map;try{i=new Map((await Qn()).map(R=>[R.id,R]))}catch{}let r=R=>i.get(R)?.name||(R?R[0].toUpperCase()+R.slice(1):"Debate"),{debate:s,turns:a,verdict:o,votes:l,userVote:c,reactions:d,userReactions:u}=t,h=l||{you:0,opponent:0,draw:0,total:0},p=c,g=d||{},v=new Set(u||[]),f=s.personaLabel||s.personality||"AI Sparring Partner",m=`${location.origin}/debate/${s.id}`;n.isConnected&&(document.title=`Who won? ${s.topic||"Arena match"} \xB7 AdversaryAI`);function T(){let R=h.total||0,E=R>0?Math.round(h.you/R*100):50,b=R>0?100-E:50,_=[{key:"fire",emoji:"\u{1F525}",label:"Brilliant"},{key:"skull",emoji:"\u{1F480}",label:"Savage"},{key:"brain",emoji:"\u{1F9E0}",label:"High IQ"},{key:"flag",emoji:"\u{1F6A9}",label:"Fallacy"},{key:"clap",emoji:"\u{1F44F}",label:"Respect"}];return`
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
            ${It(r(s.mode))}
          </span>
          <span class="text-xs text-slate-500">Match held on ${It(eu(s.createdAt))}</span>
        </div>
        <h1 class="font-display text-2xl sm:text-3xl text-white font-bold mb-4 leading-tight">${It(s.topic)}</h1>
        <div class="flex items-center gap-3 text-sm text-slate-300">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center border border-accent-500/40">${xt('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',16)}</span>
            <span class="font-semibold text-white">Human Debater</span>
          </div>
          <span class="text-slate-500 font-bold">VS</span>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-ink-700 text-slate-200 font-bold flex items-center justify-center text-xs border border-ink-600">AI</span>
            <span class="font-semibold text-accent-300">${It(f)}</span>
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
            <span id="vote-count-label" class="font-bold text-white">${R}</span> spectator vote${R===1?"":"s"} cast
          </div>
        </div>

        <div class="mb-4">
          <div class="flex justify-between text-xs font-bold mb-1.5">
            <span class="text-emerald-400 flex items-center gap-1">Human Debater (${E}%)</span>
            <span class="text-rose-400 flex items-center gap-1">(${b}%) ${It(f)}</span>
          </div>
          <div class="w-full h-3 rounded-full bg-ink-950 overflow-hidden flex border border-ink-700">
            <div id="user-vote-bar" class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style="width:${E}%"></div>
            <div id="opp-vote-bar" class="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500" style="width:${b}%"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5" id="vote-buttons-grid">
          <button type="button" data-vote="you" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${p==="you"?"border-emerald-500 bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-500/50":"border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-emerald-400 font-bold mb-0.5">Vote For</span>
            <span>\u{1F3C6} Human Debater</span>
          </button>
          <button type="button" data-vote="opponent" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${p==="opponent"?"border-rose-500 bg-rose-500/20 text-rose-200 ring-2 ring-rose-500/50":"border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-rose-400 font-bold mb-0.5">Vote For</span>
            <span>\u{1F916} ${It(f)}</span>
          </button>
          <button type="button" data-vote="draw" class="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${p==="draw"?"border-amber-500 bg-amber-500/20 text-amber-200 ring-2 ring-amber-500/50":"border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"}">
            <span class="block text-xs uppercase tracking-wider text-amber-400 font-bold mb-0.5">Vote For</span>
            <span>\u2696\uFE0F Dead Even Draw</span>
          </button>
        </div>

        <div class="pt-4 border-t border-ink-800 flex flex-wrap items-center justify-between gap-3">
          <div class="text-xs text-slate-400 font-medium">React to match quality:</div>
          <div class="flex flex-wrap items-center gap-1.5" id="reactions-tray">
            ${_.map(x=>`
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
        
        <div class="rounded-xl border ${bs(o).tone} px-5 py-4 mb-6 text-center">
          <div class="mb-2 flex justify-center opacity-90">${bs(o).icon}</div>
          <div class="font-display text-2xl font-semibold">${It(bs(o).title)}</div>
          <p class="text-sm opacity-80 mt-1">${It(bs(o).sub)}</p>
        </div>

        <div class="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Human Debater</div>
            <div class="space-y-4">
              ${Md.map(([x,C])=>ll(C,o.you?.[x]??null)).join("")}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">${It(f)}</div>
            <div class="space-y-4">
              ${Md.map(([x,C])=>ll(C,o.opponent?.[x]??null)).join("")}
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-ink-800/60 border border-ink-700 p-5 mb-4">
          <div class="text-sm font-semibold text-slate-300 mb-2">The judge's reasoning</div>
          <p class="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">${It(o.reasoning||"Scoring rendered.")}</p>
        </div>

        ${o.turningPoint?`
        <div class="rounded-xl border border-accent-500/30 bg-accent-500/5 p-5">
          <div class="text-sm font-semibold text-accent-300 mb-2">Decisive turning point</div>
          <p class="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">${It(o.turningPoint)}</p>
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
              <div class="${Qp(C)}">
                <div class="flex items-center justify-between gap-3 mb-1.5">
                  <span class="text-[11px] font-semibold uppercase tracking-wide ${C?"text-accent-400":"text-slate-400"}">
                    ${C?"Human Debater":It(f)}
                  </span>
                  ${C?"":`<button type="button" data-play-text="${encodeURIComponent(x.text)}" class="speak-turn-btn text-[11px] text-accent-400 hover:text-accent-300 font-semibold flex items-center gap-1 cursor-pointer">\u{1F50A} Listen</button>`}
                </div>
                <div class="whitespace-pre-wrap break-words">${It(x.text)}</div>
              </div>
            </div>`}).join("")}
        </div>
      </div>

      <div class="rounded-3xl border border-accent-500/40 bg-gradient-to-r from-accent-500/20 via-ink-900 to-ink-900 p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-accent-400">Step Into The Arena</span>
          <h2 class="text-xl sm:text-2xl font-bold text-white mt-1">Think you have better arguments?</h2>
          <p class="text-sm text-slate-300 mt-1 max-w-lg">Spar directly against ${It(f)} or any of our 19 practice modes. Real-time 3D voice lip-sync and instant coaching scores.</p>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          <a href="#/setup/${encodeURIComponent(s.mode||"debate")}" class="btn-primary w-full py-3 text-sm sm:w-auto">
            Spar ${It(f)} Free
          </a>
          <a href="#/signup" class="btn-ghost w-full py-3 text-sm sm:w-auto">
            Claim 15 Free Rounds
          </a>
        </div>
      </div>
    </div>`}n.innerHTML=T();let M=n.querySelector("#copy-watch-btn");M&&M.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(m),M.textContent="Copied!",setTimeout(()=>{M.textContent="Copy Link"},2e3)}catch{Qs({title:"Share this match",value:m,readOnly:!0,confirm:"Done",cancel:""})}}),n.querySelectorAll(".speak-turn-btn").forEach(R=>{R.addEventListener("click",()=>{let E=decodeURIComponent(R.getAttribute("data-play-text")||"");if(E)if("speechSynthesis"in window){window.speechSynthesis.cancel();let b=new SpeechSynthesisUtterance(E);b.rate=1.05,b.pitch=.95,R.textContent="\u{1F50A} Speaking\u2026",b.onend=()=>{R.textContent="\u{1F50A} Listen"},b.onerror=()=>{R.textContent="\u{1F50A} Listen"},window.speechSynthesis.speak(b)}else $i("Can\u2019t read this aloud","Speech isn\u2019t supported in this browser.")})});let S=n.querySelector("#vote-buttons-grid");S&&S.querySelectorAll(".vote-action-btn").forEach(R=>{R.addEventListener("click",async()=>{let E=R.getAttribute("data-vote");if(E){S.querySelectorAll(".vote-action-btn").forEach(b=>{b.disabled=!0});try{let b=await Tt("/api/public/debate/"+encodeURIComponent(s.id)+"/vote",{vote:E});if(b.ok&&b.votes){h=b.votes,p=b.vote;let _=h.total||0,x=_>0?Math.round(h.you/_*100):50,C=_>0?100-x:50,z=n.querySelector("#user-vote-bar"),W=n.querySelector("#opp-vote-bar"),N=n.querySelector("#vote-count-label");z&&(z.style.width=x+"%"),W&&(W.style.width=C+"%"),N&&(N.textContent=String(_)),S.querySelectorAll(".vote-action-btn").forEach(P=>{P.getAttribute("data-vote")===p?P.className="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all border-accent-500 bg-accent-500/20 text-white ring-2 ring-accent-500/50":P.className="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"})}}catch{$i("Couldn\u2019t record your vote","Please try again.")}finally{S.querySelectorAll(".vote-action-btn").forEach(b=>{b.disabled=!1})}}})});let k=n.querySelector("#reactions-tray");k&&k.querySelectorAll(".react-pill-btn").forEach(R=>{R.addEventListener("click",async()=>{let E=R.getAttribute("data-react");if(E)try{let b=await Tt("/api/public/debate/"+encodeURIComponent(s.id)+"/react",{reaction:E});b.ok&&b.reactions&&(g=b.reactions,b.active?v.add(E):v.delete(E),k.querySelectorAll("[data-react-count]").forEach(_=>{let x=_.getAttribute("data-react-count");x&&g[x]!==void 0&&(_.textContent=String(g[x]))}),b.active?R.className="react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all border-accent-500 bg-accent-500/25 text-white ring-1 ring-accent-500":R.className="react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all border-ink-700 bg-ink-800/80 text-slate-300 hover:border-slate-500")}catch{}})})}async function Ad(n){n.innerHTML=`<div class="max-w-6xl mx-auto px-4 py-8 text-center text-slate-400">
    <div class="inline-block animate-spin text-2xl mb-3">\u26A1</div>
    <p>Loading Community Arena\u2026</p>
  </div>`;let e=[];try{let o=await St("/api/public/debates");e=Array.isArray(o)?o:o.debates||[]}catch{n.innerHTML=`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 class="text-2xl font-bold text-white mb-2">Couldn't Load Arena</h1>
      <p class="text-sm text-slate-400 mb-6">Check your internet connection and try again.</p>
      <button type="button" id="arena-retry" class="btn-primary text-sm">Try again</button>
    </div>`,n.querySelector("#arena-retry").addEventListener("click",()=>Ad(n));return}let t=new Map;try{t=new Map((await Qn()).map(o=>[o.id,o]))}catch{}let i=o=>t.get(o)?.name||(o?o[0].toUpperCase()+o.slice(1):"Debate");function r(o,l="all"){if(o.length===0){let c=l==="all";return`
      <div class="card px-6 py-14 text-center sm:py-16">
        <div class="mb-3 text-4xl" aria-hidden="true">\u{1F3DB}\uFE0F</div>
        <h2 class="mb-2 text-xl font-bold text-white">${c?"The Arena just opened":"No public matches in this category yet"}</h2>
        <p class="mx-auto mb-6 max-w-md text-sm leading-relaxed text-slate-400">${c?'No public matches yet. Finish a practice session, then tap <b class="text-slate-200">Publish to Arena</b> on your scorecard \u2014 yours will be the first one the community watches and votes on.':'Try \u201CAll matches\u201D, or publish one of your own from your scorecard with <b class="text-slate-200">Publish to Arena</b>.'}</p>
        <a href="#/" class="btn-primary">${c?"Start a practice session":"Start your match"}</a>
      </div>`}return`
    <div class="grid md:grid-cols-2 gap-5">
      ${o.map(c=>{let d=c.votes?.total||0,u=d>0?Math.round((c.votes.you||0)/d*100):50,h=d>0?100-u:50,p=c.personaLabel||c.personality||"AI Partner",g='<span class="text-xs px-2.5 py-0.5 rounded-full border border-ink-700 text-slate-400 bg-ink-800">Scored</span>';return c.winner==="you"?g='<span class="text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 font-semibold">\u{1F3C6} Human Won</span>':c.winner==="opponent"?g='<span class="text-xs px-2.5 py-0.5 rounded-full border border-rose-500/40 text-rose-300 bg-rose-500/10 font-semibold">\u{1F916} '+It(p)+" Won</span>":c.winner==="draw"&&(g='<span class="text-xs px-2.5 py-0.5 rounded-full border border-amber-500/40 text-amber-300 bg-amber-500/10 font-semibold">\u2696\uFE0F Draw</span>'),`
        <div class="rounded-2xl border border-ink-700 bg-ink-900 p-6 flex flex-col justify-between hover:border-slate-500 transition-all shadow-md">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-[11px] font-bold uppercase tracking-wider text-accent-400">${It(i(c.mode))}</span>
              ${g}
            </div>
            <a href="#/watch/${encodeURIComponent(c.id)}" class="block group">
              <h3 class="text-lg font-bold text-white group-hover:text-accent-300 transition-colors line-clamp-2 mb-2 leading-snug">${It(c.topic)}</h3>
            </a>
            <div class="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <span>Human</span>
              <span class="text-slate-600 font-bold">VS</span>
              <span class="font-semibold text-slate-200">${It(p)}</span>
              <span class="text-slate-600">\xB7</span>
              <span>${It(eu(c.createdAt))}</span>
            </div>
          </div>

          <div>
            <div class="rounded-xl bg-ink-800/80 border border-ink-700/60 p-3 mb-4">
              <div class="flex justify-between text-[11px] font-semibold mb-1 text-slate-300">
                <span class="text-emerald-400">Human (${u}%)</span>
                <span class="text-xs text-slate-400 font-mono">${d} vote${d===1?"":"s"}</span>
                <span class="text-rose-400">${It(p)} (${h}%)</span>
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
    </div>`}n.innerHTML=`
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
      ${r(e)}
    </div>
  </div>`;let s=n.querySelector("#arena-filter-bar"),a=n.querySelector("#arena-feed-grid");s&&a&&s.querySelectorAll("button").forEach(o=>{o.addEventListener("click",()=>{s.querySelectorAll("button").forEach(u=>u.setAttribute("aria-pressed",String(u===o)));let l=o.getAttribute("data-filter"),c={debate:["debate","rapbattle"],historical:["historical"],sales:["sales","negotiation"]},d=l==="all"?e:e.filter(u=>(c[l]||[l]).includes(u.mode));a.innerHTML=r(d,l)})})}async function cl(){window.__sessionCleanup?.();let n=location.hash.replace(/^#/,"")||"/",e=n.startsWith("/")?n:"/"+n,t=e.split("?")[0].replace(/\/+$/,"")||"/",i=await Zn()!==null,r=t.match(/^\/join\/([A-Za-z0-9]+)$/),s={"/login":"Log in","/signup":"Sign up","/history":"History","/account":"Account","/arena":"Community Arena"}[t]||[[/^\/setup\//,"Set up a session"],[/^\/session\//,"Session"],[/^\/watch\//,"Arena match"],[/^\/org\//,"School"],[/^\/join\//,"Join a school"]].find(([p])=>p.test(t))?.[1];if(document.title=s?`${s} \xB7 AdversaryAI`:"AdversaryAI \u2014 Practice against anyone",r){let p=document.createElement("div");Nh(p),await q_(p,r[1].toUpperCase());return}let a=t.match(/^\/watch\/([A-Za-z0-9_-]+)$/),o=t==="/arena";if(a){let p=document.createElement("div");i?_c(p):Oh(p),await X_(p,a[1]);return}if(o){let p=document.createElement("div");i?_c(p):Oh(p),await Ad(p);return}if(t==="/login"||t==="/signup"){if(i){let g=new URLSearchParams(e.split("?")[1]||"").get("next");location.hash=g&&/^\/[\w\-\/?=&%.]*$/.test(g)?"#"+g:"#/";return}let p=document.createElement("div");Nh(p),t==="/login"?Am(p):Rm(p);return}if(!i){let p=e!=="/"?e:"";location.hash=p?`#/signup?next=${encodeURIComponent(p)}`:"#/signup";return}if(t==="/debate"){location.hash="#/";return}let l=document.createElement("div");_c(l);let c={"/":()=>Cm(l),"/history":()=>Td(l),"/account":()=>Ed(l),"/arena":()=>Ad(l)},d=t.match(/^\/session\/([^/?]+)(?:\?(.+))?$/),u=t.match(/^\/setup\/([^/]+)$/),h=t.match(/^\/org\/([^/?]+)(?:\?(.+))?$/);try{if(u)await Zm(l,decodeURIComponent(u[1]));else if(h)await tm(l,decodeURIComponent(h[1]));else if(d)await Jp(l,decodeURIComponent(d[1]));else{let p=c[t];p?await p():(document.title="Page not found \xB7 AdversaryAI",l.innerHTML=`<div class="max-w-2xl mx-auto px-4 py-16 text-center text-slate-400">
          <h1 class="text-3xl font-display text-white mb-3">Page not found</h1>
          <p class="mb-6">That corner of the arena doesn't exist.</p>
          <a href="#/" class="btn-primary">Back to practice</a>
        </div>`)}}catch(p){console.error("route render failed",p),document.title="Something went wrong \xB7 AdversaryAI";let g=document.createElement("a");g.href="#/",g.className="link -mt-8 block pb-10 text-center text-sm",g.textContent="Back to practice",l.replaceChildren(Jn("This page hit an unexpected error. Try again, or head back to practice.",()=>cl().catch(()=>{})),g)}}window.addEventListener("hashchange",()=>{cl().catch(n=>{console.error("route failed",n),Di.innerHTML="",Di.appendChild(Jn("Couldn\u2019t load that page. Check your connection and try again.",()=>cl().catch(()=>{})))})});cl().catch(n=>{console.error("initial route failed",n),Di.innerHTML=`<div class="max-w-xl mx-auto px-4 py-20 text-center text-slate-400">
    <h1 class="text-2xl text-white mb-3">AdversaryAI couldn't start</h1>
    <p>Check your connection and reload.</p>
  </div>`});"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})});
