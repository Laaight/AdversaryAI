var Xd=["viseme_sil","viseme_aa","viseme_aa","viseme_O","viseme_E","viseme_RR","viseme_I","viseme_U","viseme_O","viseme_aa","viseme_O","viseme_aa","viseme_kk","viseme_RR","viseme_nn","viseme_SS","viseme_CH","viseme_TH","viseme_FF","viseme_DD","viseme_kk","viseme_PP"],Kd={viseme_sil:0,viseme_aa:.85,viseme_O:.8,viseme_U:.75,viseme_E:.7,viseme_I:.6,viseme_RR:.6,viseme_nn:.6,viseme_SS:.65,viseme_CH:.75,viseme_TH:.6,viseme_FF:.85,viseme_DD:.6,viseme_kk:.55,viseme_PP:1},Zd={viseme_aa:.55,viseme_O:.4,viseme_U:.25,viseme_E:.3,viseme_I:.18,viseme_CH:.2,viseme_RR:.2,viseme_TH:.12,viseme_DD:.15,viseme_kk:.18,viseme_nn:.12,viseme_SS:.08},fl=class{constructor(){this.ctx=null,this.gain=null,this.analyser=null,this.freq=null,this.time=null,this.gen=0,this.sources=new Set,this.track=[],this.nextStart=0,this.speakingUntil=0,this.segs=[],this.sink=null,this.pendingSink=void 0,this.remote=!1,this.utterId="",this.sinkChain=Promise.resolve(),this.listeners=new Set,this.blockedListeners=new Set,this.lastUtterance=null,this._state="idle",this._cls={lowAvg:0,last:0,lastAt:0,lastPlosiveAt:-1e9}}get state(){return this._state}on(e){return this.listeners.add(e),()=>this.listeners.delete(e)}_emit(e){if(e!==this._state){this._state=e;for(let t of this.listeners)try{t(e)}catch{}}}onBlocked(e){return this.blockedListeners.add(e),()=>this.blockedListeners.delete(e)}_blocked(e=!0){for(let t of this.blockedListeners)try{t(e)}catch{}}_checkBlocked(){let e=this.ctx;e&&e.state!=="running"&&e.state!=="closed"&&this._state==="speaking"&&this._blocked(!0)}ensureContext(){if(!this.ctx){let e=window.AudioContext||window.webkitAudioContext;if(!e)throw new Error("Web Audio unsupported");this.ctx=new e({latencyHint:"interactive"}),this.gain=this.ctx.createGain(),this.analyser=this.ctx.createAnalyser(),this.analyser.fftSize=1024,this.analyser.smoothingTimeConstant=.45,this.gain.connect(this.analyser),this.analyser.connect(this.ctx.destination),this.freq=new Uint8Array(this.analyser.frequencyBinCount),this.time=new Uint8Array(this.analyser.fftSize),this.ctx.onstatechange=()=>this.ctx?.state==="running"&&this._blocked(!1)}return this.ctx.state!=="running"&&this.ctx.state!=="closed"&&this.ctx.resume().catch(()=>{}),this.ctx}unlock(){try{navigator.audioSession&&navigator.audioSession.type!=="playback"&&(navigator.audioSession.type="playback")}catch{}try{let e=this.ensureContext(),t=e.createBuffer(1,1,e.sampleRate),i=e.createBufferSource();i.buffer=t,i.connect(e.destination),i.start()}catch{}}heardTime(){let e=this.ctx;if(!e)return 0;let t=(typeof e.outputLatency=="number"?e.outputLatency:0)||e.baseLatency||0;return e.currentTime-t}stop(){if(this.gen++,this.remote)try{this.sink?.interrupt()}catch{}this.remote=!1;for(let e of this.sources)try{e.onended=null,e.stop()}catch{}this.sources.clear(),this.track=[],this.segs=[],this.nextStart=0,this.speakingUntil=0,this._emit("idle")}reset(){this.stop(),this.lastUtterance=null}begin(){this.stop(),this.ensureContext(),this.pendingSink!==void 0&&(this.sink=this.pendingSink,this.pendingSink=void 0),this.remote=!!(this.sink&&this.sink.ready),this.utterId=Xp(),this.sinkChain=Promise.resolve(),this.gain.gain.value=this.remote?0:1;let e=this.gen,t=[];this.lastUtterance={segments:t,complete:!1};let i=0,n=!1,s,a=new Promise(d=>s=d),o=()=>{if(n&&i===0&&this.sources.size===0&&e===this.gen){let d=()=>{e===this.gen&&(this._emit("idle"),s(!0))};this.remote&&this.sink?this._whenRemoteQuiet(e,d):d()}},l=this,c=Promise.resolve();return{get active(){return e===l.gen},enqueue(d,u=null){if(e!==l.gen)return Promise.resolve(!1);i++;let h=l.ctx.decodeAudioData(d.slice(0)).catch(g=>(console.warn("[voice] decode failed",g),null)),p=c.then(async()=>{try{let g=await h;return!g||e!==l.gen?!1:(t.push({buffer:g,visemes:u}),l._schedule(g,u,e,o),!0)}finally{i--,o()}});return c=p.catch(()=>{}),p},enqueueDecoded(d,u=null){return e!==l.gen?!1:(t.push({buffer:d,visemes:u}),l._schedule(d,u,e,o),!0)},end(){if(!n&&l.remote&&e===l.gen){let d=l.utterId;l.sinkChain=l.sinkChain.then(()=>l.sink?.speakEnd(d)).catch(()=>{})}n=!0,l.lastUtterance.complete=!0,o()},done:a}}_schedule(e,t,i,n){let s=this.ctx,a=Math.max(s.currentTime+.05,this.nextStart),o=s.createBufferSource();if(o.buffer=e,o.connect(this.gain),o.onended=()=>{this.sources.delete(o),i===this.gen&&n()},this.sources.add(o),o.start(a),this.remote&&this.sink){let d=this.utterId;this.sinkChain=this.sinkChain.then(()=>Yp(e)).then(u=>i===this.gen&&this.remote&&this.sink?.speak(d,u)).catch(u=>console.warn("[voice] photoreal send failed",u))}this.nextStart=a+e.duration,this.speakingUntil=this.nextStart;let l=!!(t&&t.length);if(this.segs.push({start:a,end:a+e.duration,hasVis:l}),this.segs.length>60&&this.segs.splice(0,this.segs.length-60),l){for(let d of t)this.track.push({t:a+d.ms/1e3,name:Xd[d.id]||"viseme_sil"});this.track.push({t:a+e.duration,name:"viseme_sil"})}let c=s.currentTime-2;this.track.length>400&&(this.track=this.track.filter(d=>d.t>c)),s.state!=="running"&&(s.resume().catch(()=>{}),clearTimeout(this._blockT),this._blockT=setTimeout(()=>this._checkBlocked(),600)),this._emit("speaking")}replay(){let e=this.lastUtterance;if(!e||!e.segments.length)return null;let t=e.segments.slice(),i=this.begin();for(let n of t)i.enqueueDecoded(n.buffer,n.visemes);return i.end(),i}setSink(e){if(!e&&this.sink){this.gain&&(this.gain.gain.value=1),this.remote=!1,this.sink=null,this.pendingSink=void 0;return}this.pendingSink=e}_whenRemoteQuiet(e,t){let i=performance.now(),n=()=>{if(e!==this.gen)return;(!this.sink||!this.sink.talking)&&performance.now()-i>300||performance.now()-i>8e3?t():setTimeout(n,120)};setTimeout(n,120)}hasReplay(){return!!(this.lastUtterance&&this.lastUtterance.segments.length)}frame(){let e={speaking:!1,level:0,viseme:null,prev:null,freq:null};if(!this.ctx||!this.speakingUntil)return e;let i=this.heardTime();e.speaking=i<this.speakingUntil+.03,this.analyser.getByteTimeDomainData(this.time);let n=0;for(let a=0;a<this.time.length;a++){let o=(this.time[a]-128)/128;n+=o*o}if(e.level=Math.min(1,Math.sqrt(n/this.time.length)*4.5),this.analyser.getByteFrequencyData(this.freq),e.freq=this.freq,!e.speaking)return e;let s=this.segs.find(a=>i>=a.start-.02&&i<a.end+.02);if(s&&s.hasVis&&this.track.length){let a=i+.035,o=this._findIdx(a);if(o<0)return e;let l=this.track[o],c=this.track[o+1],d=this.track[o-1],u=c?Math.max(.02,c.t-l.t):.12,h=Math.min(1,(a-l.t)/Math.min(.07,u));return e.viseme={name:l.name,weight:h},e.prev=d&&i-l.t<.07?{name:d.name,weight:1-h}:null,e}return e.viseme={name:this._classify(),weight:1},e}_findIdx(e){let t=this.track,i=0,n=t.length-1,s=-1;for(;i<=n;){let a=i+n>>1;t[a].t<=e?(s=a,i=a+1):n=a-1}return s}_classify(){let e=this.freq,t=this.ctx.sampleRate/this.analyser.fftSize,i=(l,c)=>{let d=Math.max(1,Math.floor(l/t)),u=Math.min(e.length-1,Math.ceil(c/t)),h=0;for(let p=d;p<=u;p++)h+=e[p];return h/Math.max(1,u-d+1)},n=this._cls,s=performance.now(),a=i(90,8e3),o;if(a<14)n.lowAvg*=.9,o=0;else{let l=i(150,1100),c=i(5500,8e3),d=i(2600,5200),u=i(90,320);if(n.lowAvg>4&&u>3*n.lowAvg&&u>20&&s-n.lastPlosiveAt>160)o=21,n.lastPlosiveAt=s,n.lowAvg=u;else if(n.lowAvg+=(u-n.lowAvg)*.12,c>14&&c>=l)o=15;else if(d>12&&d>=l*1.2)o=16;else{let h=0,p=0,g=Math.max(1,Math.floor(200/t)),v=Math.min(e.length-1,Math.ceil(2500/t));for(let f=g;f<=v;f++)h+=e[f]*f*t,p+=e[f];let m=p>40?h/p:800;o=m<620?8:m<900?2:m<1200?4:6}}return o!==n.last&&(o===0||s-n.lastAt>=80)&&(n.last=o,n.lastAt=s),Xd[n.last]||"viseme_sil"}};function Xp(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)}async function Yp(r){let t=Math.max(1,Math.ceil(r.duration*24e3)),i=window.OfflineAudioContext||window.webkitOfflineAudioContext,n=new i(1,t,24e3),s=n.createBufferSource();s.buffer=r,s.connect(n.destination),s.start();let o=(await n.startRendering()).getChannelData(0),l=[];for(let c=0;c<o.length;){let d=c===0?Math.round(9600):24e3,u=Math.min(d,o.length-c),h=new Uint8Array(u*2),p=new DataView(h.buffer);for(let v=0;v<u;v++){let m=Math.max(-1,Math.min(1,o[c+v]));p.setInt16(v*2,m<0?m*32768:m*32767,!0)}let g="";for(let v=0;v<h.length;v+=32768)g+=String.fromCharCode.apply(null,h.subarray(v,v+32768));l.push(btoa(g)),c+=u}return l}var Oe=new fl;if(typeof window<"u"){window.__voice=Oe,window.addEventListener("pagehide",()=>Oe.stop());let r=()=>{let t=Oe.ctx;document.visibilityState!=="visible"||!t||t.state==="running"||t.state==="closed"||(t.resume().catch(()=>{}),setTimeout(()=>Oe._checkBlocked(),400))};document.addEventListener("visibilitychange",r),window.addEventListener("pageshow",r),window.addEventListener("focus",r);let e=()=>{let t=Oe.ctx;t&&t.state!=="running"&&t.state!=="closed"&&t.resume().catch(()=>{})};document.addEventListener("touchend",e,{capture:!0,passive:!0}),document.addEventListener("click",e,{capture:!0,passive:!0})}var Kp="/app/vendor/speech-sdk.min.js",Zn=null,gl=0;function Jd(){return!window.SpeechSDK&&Date.now()-gl<300*1e3}function ea(){return window.SpeechSDK?Promise.resolve(window.SpeechSDK):Zn||(Date.now()-gl<300*1e3?Promise.resolve(null):(Zn=new Promise(r=>{let e=document.createElement("script");e.src=Kp,e.async=!0;let t=setTimeout(()=>r(null),1e4);e.onload=()=>{clearTimeout(t),r(window.SpeechSDK||null)},e.onerror=()=>{clearTimeout(t),r(null)},document.head.appendChild(e)}).then(r=>(r||(Zn=null,gl=Date.now()),r)),Zn))}var ml={},Jn={};async function Qd(r=!1){let e=r?"hd":"std",t=ml[e];return t&&Date.now()-t.at<480*1e3?t:(Jn[e]||(Jn[e]=(async()=>{let i=await fetch(`/api/speech/token${r?"?hd=1":""}`,{method:"POST",credentials:"include"});if(!i.ok)throw new Error(`token http ${i.status}`);let n=await i.json();if(!n.token||!n.region)throw new Error("token malformed");return ml[e]={token:n.token,region:n.region,at:Date.now()},ml[e]})().finally(()=>delete Jn[e])),Jn[e])}function Yd(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}function Zp(r,e){let t=e.style&&!e.hd?`<mstts:express-as style="${e.style}"${e.styleDegree?` styledegree="${e.styleDegree}"`:""}>${Yd(r)}</mstts:express-as>`:Yd(r);return`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${e.voice}">${t}</voice></speak>`}async function Jp(r,e,t,i=1e4){let{token:n,region:s}=await Qd(!!t.hd),a=r.SpeechConfig.fromAuthorizationToken(n,s);a.speechSynthesisVoiceName=t.voice,a.speechSynthesisOutputFormat=r.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;let o=r.AudioOutputStream.createPullStream(),l=new r.SpeechSynthesizer(a,r.AudioConfig.fromStreamOutput(o)),c=[];l.visemeReceived=(d,u)=>c.push({id:u.visemeId,ms:u.audioOffset/1e4});try{let d=await new Promise((u,h)=>{let p=setTimeout(()=>h(new Error("synthesis timeout")),i);l.speakSsmlAsync(Zp(e,t),g=>{clearTimeout(p),u(g)},g=>{clearTimeout(p),h(new Error(String(g||"synthesis error")))})});if(d.reason!==r.ResultReason.SynthesizingAudioCompleted||!d.audioData?.byteLength)throw new Error("synthesis failed: "+(d.errorDetails||d.reason));return{audio:d.audioData,visemes:c}}finally{try{l.close()}catch{}}}function eu({voiceCfg:r,onFallback:e,transform:t=i=>i}){let i=Oe.begin();Qd(!!r.hd).catch(()=>{});let n=[],s="",a=0,o=!1,l=!1,c=!1,d=!1,u=!0,h=v=>{let m=/[.!?…]+["'”’)\]]*\s+/g,f,M=0;for(;(f=m.exec(s))!==null;)if(f.index+f[0].length-M>=25){let w=s.slice(M,f.index+f[0].length);n.push({text:w.trim(),offset:a+M}),M=f.index+f[0].length}if(s.length-M>420){let w=s.lastIndexOf(" ",M+360),_=w>M+150?w:M+360;n.push({text:s.slice(M,_).trim(),offset:a+M}),M=_}v&&s.slice(M).trim()&&(n.push({text:s.slice(M).trim(),offset:a+M}),M=s.length),s=s.slice(M),a+=M},p=(v,m="")=>{l||d||(l=!0,n.length=0,e?.(v,i,m))},g=async()=>{if(!(c||l||d||!i.active)){c=!0;try{let v=await ea();if(!v)return p(n[0]?.offset??a,n[0]?t(n[0].text):"");let m=null,f=M=>{let w=t(M.text),_=Math.max(1e4,4e3+40*w.length)+(u?5e3:0);return u=!1,{item:M,promise:Jp(v,w,r,_).catch(D=>({err:D||new Error("synthesis error")}))}};for(;!d&&i.active;){if(!m){let A=n.shift();if(!A)break;m=f(A)}let M=m;m=null;let w=n.shift();w&&(m=f(w));let _=await M.promise;if(_.err&&!/timeout/.test(String(_.err.message||_.err))&&!d&&i.active&&(console.warn("[voice] SDK synthesis failed, retrying once",_.err),_=await f(M.item).promise),_.err)return console.warn("[voice] SDK synthesis failed, falling back",_.err),p(M.item.offset,t(M.item.text));if(d||!i.active)return;if(!await i.enqueue(_.audio,_.visemes)&&i.active&&!d)return p(M.item.offset,t(M.item.text))}}finally{c=!1,i.active?!l&&!d&&n.length?g():!l&&!d&&o&&!n.length&&i.end():(d=!0,n.length=0)}}};return{utter:i,push(v){d||l||!i.active||(s+=v,h(!1),n.length&&g())},finish({dropTail:v=!1}={}){if(!d){if(!i.active)return void(d=!0);o=!0,v&&(s=s.match(/^[\s\S]*[.!?…]+["'”’)\]]*(?=\s|$)/)?.[0]??""),h(!0),!l&&(n.length?g():c||i.end())}},cancel(){d=!0,n.length=0},get failed(){return l},get offset(){return a},pending(){return!d&&!l&&(c||n.length>0||!o&&s.trim().length>0)}}}var Qp="/app/vendor/livekit-client.umd.js",em="https://cdn.jsdelivr.net/npm/livekit-client@2.15.7/dist/livekit-client.umd.js",tm=12e4,im=3e4,ta=null;function tu(r){return new Promise(e=>{let t=document.createElement("script");t.src=r,t.async=!0,t.onload=()=>e(!0),t.onerror=()=>e(!1),document.head.appendChild(t)})}function rm(){return window.LivekitClient?Promise.resolve(window.LivekitClient):(ta||(ta=(async()=>await tu(Qp)&&window.LivekitClient||await tu(em)&&window.LivekitClient?window.LivekitClient:(ta=null,null))()),ta)}async function iu(r){try{let e=await fetch(`/api/avatar/status?debateId=${encodeURIComponent(r)}`,{credentials:"include"});return e.ok?await e.json():null}catch{return null}}var ia=class{constructor({stage:e,debateId:t,onStatus:i}){this.stage=e,this.debateId=t,this.onStatus=i||(()=>{}),this.ready=!1,this.talking=!1,this.disposed=!1,this.starting=null,this.lastActivity=Date.now(),this.video=document.createElement("video"),this.video.playsInline=!0,this.video.autoplay=!0,this.video.setAttribute("playsinline",""),this.video.className="photoreal-video",e.appendChild(this.video),this.idleTimer=setInterval(()=>{!this.ready||this.talking||Oe.state!=="idle"||(Date.now()-this.lastActivity>tm||this._expiring(9e4))&&this.sleep()},1e4),this.onVis=()=>{if(clearTimeout(this.hiddenT),document.visibilityState!=="hidden")return;let n=()=>{document.visibilityState!=="hidden"||!this.ready||(!this.talking&&Oe.state==="idle"?this.sleep():this.hiddenT=setTimeout(n,1e4))};this.hiddenT=setTimeout(n,6e4)},document.addEventListener("visibilitychange",this.onVis)}_expiring(e){return!!this.expiresAt&&this.expiresAt-Date.now()<e&&(this.remaining??0)>120}touch(){this.lastActivity=Date.now(),this.ready&&this._expiring(6e4)&&!this.talking&&Oe.state==="idle"&&this.sleep(),!this.ready&&!this.starting&&!this.disposed&&!this.exhausted&&this.start().catch(()=>{})}start(){if(this.starting)return this.starting;let e=new Set(["photoreal_out_of_credits","champion_required","video_minutes_exhausted","photoreal_not_configured","no_avatar_for_persona","debate_ended","debate_not_found","unauthorized"]);return this.starting=(async()=>{let t=null;for(let n=0;n<3&&!this.disposed;n++){if(n&&(this.onStatus({state:"connecting"}),await new Promise(s=>setTimeout(s,n===1?2500:6e3)),this.disposed))return;try{await this._start();return}catch(s){if(t=s,console.warn(`[photoreal] attempt ${n+1} failed:`,s?.message||s),this._teardown(!0),e.has(s?.code))break}}if(this.disposed||!t)return;let i=t;this.onStatus({state:"error",error:i?.code||"photoreal_unavailable",detail:i?.detail||i?.message||String(i)}),(i?.code==="video_minutes_exhausted"||i?.code==="champion_required")&&(this.exhausted=!0)})().finally(()=>{this.starting=null}),this.starting}async _start(){this.onStatus({state:"connecting"}),this.stopping&&(await Promise.race([this.stopping,new Promise(l=>setTimeout(l,3e3))]),this.stopping=null);let e=Date.now(),t=await fetch("/api/avatar/session",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:this.debateId})}),i=await t.json().catch(()=>({}));if(!t.ok)throw Object.assign(new Error(i.error||"session"),{code:i.error,detail:i.detail});if(this.disposed)return;this.token=i.sessionToken,this.sessionId=i.sessionId,this.api=i.apiUrl,this.remaining=i.remainingSeconds,this.expiresAt=i.maxSeconds?e+i.maxSeconds*1e3-5e3:0;let n=i.start?.livekit_url?i.start:await this._api("/v1/sessions/start");this.remoteStarted=!0;let s=await rm();if(!s)throw new Error("livekit_unavailable");if(this.disposed)return this._teardown(!0);this.room=new s.Room({adaptiveStream:!1,dynacast:!1});let a=new Promise(l=>{this.room.on(s.RoomEvent.TrackSubscribed,(c,d,u)=>{u.identity==="heygen"&&(c.attach(this.video),c.kind==="video"&&(this.vTrack=c),c.kind==="audio"&&(this.aTrack=c),c.kind==="video"&&l(!0))})});if(this.room.on(s.RoomEvent.Disconnected,()=>this._lost("room_disconnected")),await this.room.connect(n.livekit_url,n.livekit_client_token),!n.ws_url)throw new Error("no_ws_url");this.ws=new WebSocket(n.ws_url);let o=new Promise((l,c)=>{let d=setTimeout(()=>c(new Error("ws_timeout")),15e3);this.ws.onmessage=u=>{let h=null;try{h=JSON.parse(u.data)}catch{return}this._onEvent(h),h.type==="session.state_updated"&&h.state==="connected"&&(clearTimeout(d),l())},this.ws.onerror=()=>{},this.ws.onclose=()=>{clearTimeout(d),this._lost("ws_closed"),c(new Error("ws_closed"))},this.ws.onopen=()=>setTimeout(()=>(clearTimeout(d),l()),2500)});if(await Promise.all([o,Promise.race([a,new Promise((l,c)=>setTimeout(()=>c(new Error("video_timeout")),2e4))])]),this.disposed)return this._teardown(!0);try{this.video.muted=!1,await this.video.play()}catch{this.onStatus({state:"needs_tap"}),await new Promise(l=>{let c=()=>{this.video.play().then(l,l),this.stage.removeEventListener("click",c)};this.stage.addEventListener("click",c)})}this.ready=!0,this.stage.classList.add("photoreal-live"),Oe.setSink(this),this.beat=setInterval(()=>this._heartbeat(),im),this.keep=setInterval(()=>this._send({type:"session.keep_alive"}),6e4),this._startAvSync(),this.onStatus({state:"live",remainingSeconds:this.remaining})}_onEvent(e){switch(e.type){case"agent.speak_started":this.talking=!0,this.lastActivity=Date.now();break;case"agent.speak_ended":case"agent.speak_interrupted":this.talking=!1,this.lastActivity=Date.now();break;case"agent.state_updated":this.talking=e.new_state==="talking";break;case"session.state_updated":e.state==="disconnected"&&this._lost("server_disconnected");break;case"error":console.warn("[photoreal] server error",e.error);break}}_send(e){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}speak(e,t){this.lastActivity=Date.now();for(let i of t)this._send({type:"agent.speak",event_id:e,audio:i})}speakEnd(e){this._send({type:"agent.speak_end",event_id:e})}interrupt(){this.talking=!1,this._send({type:"agent.interrupt"})}_startAvSync(){clearInterval(this.avSync);let e={v:null,a:null},t=async(a,o)=>{let l=a?.receiver;if(!l?.getStats)return null;let c=null;if((await l.getStats()).forEach(p=>{p.type==="inbound-rtp"&&(c={jb:p.jitterBufferDelay||0,n:p.jitterBufferEmittedCount||0,dec:p.totalDecodeTime||0,fr:p.framesDecoded||0})}),!c)return null;let d=e[o];if(e[o]=c,!d||c.n<=d.n)return null;let u=(c.jb-d.jb)/(c.n-d.n),h=c.fr>d.fr?(c.dec-d.dec)/(c.fr-d.fr):0;return u+h},i=0,n=0,s=[];this.avSync=setInterval(async()=>{try{let[a,o]=await Promise.all([t(this.vTrack,"v"),t(this.aTrack,"a")]),l=this.aTrack?.receiver;if(a==null||o==null||!l||(s.push(Math.max(0,Math.min(400,Math.round((a+.02)*1e3)))),s.length>5&&s.shift(),s.length<3))return;let c=s.slice().sort((u,h)=>u-h)[Math.floor(s.length/2)],d=Date.now();if(i&&(Math.abs(c-i)<60||d-n<2e4))return;i=c,n=d,"jitterBufferTarget"in l?l.jitterBufferTarget=i:"playoutDelayHint"in l&&(l.playoutDelayHint=i/1e3)}catch{}},2e3)}async _api(e){let t=await fetch(`${this.api}${e}`,{method:"POST",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"}}),i=await t.json().catch(()=>({}));if(!t.ok||i.code!==void 0&&i.code!==1e3)throw new Error(i.message||`liveavatar ${e} ${t.status}`);return i.data??i}async _heartbeat(){try{let t=await(await fetch("/api/avatar/heartbeat",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:this.sessionId})})).json();this.remaining=t.remainingSeconds,this.onStatus({state:"live",remainingSeconds:t.remainingSeconds}),t.stop&&!(this.expiresAt&&Date.now()<this.expiresAt)&&(this.exhausted=!0,this.sleep(),this.onStatus({state:"error",error:"video_minutes_exhausted"}))}catch{}}_lost(e){!this.ready&&!this.room||(console.warn("[photoreal] stream lost:",e),this._teardown(!0),this.disposed||this.onStatus({state:"off"}))}sleep(){this._teardown(!0),!this.disposed&&!this.exhausted&&this.onStatus({state:"sleeping"})}_teardown(e){let t=this.ready||this.room||this.ws||this.remoteStarted;this.remoteStarted=!1,this.ready=!1,this.talking=!1,(Oe.sink===this||Oe.pendingSink===this)&&Oe.setSink(null),this.stage.classList.remove("photoreal-live"),clearInterval(this.beat),clearInterval(this.keep),clearInterval(this.avSync),this.vTrack=this.aTrack=null;try{this.ws&&(this.ws.onclose=null,this.ws.onmessage=null,this.ws.close())}catch{}this.ws=null;try{this.room?.removeAllListeners?.(),this.room?.disconnect()}catch{}this.room=null;try{this.video.srcObject=null}catch{}e&&t&&this.token&&(this.stopping=Promise.allSettled([fetch(`${this.api}/v1/sessions/stop`,{method:"POST",keepalive:!0,headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"}}),fetch("/api/avatar/end",{method:"POST",keepalive:!0,credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:this.sessionId})})])),this.token=null,this.expiresAt=0}dispose(){this.disposed||(this.disposed=!0,clearInterval(this.idleTimer),clearTimeout(this.hiddenT),document.removeEventListener("visibilitychange",this.onVis),this._teardown(!0),this.video.remove())}};var nm=Object.defineProperty,sm=(r,e,t)=>e in r?nm(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ru=(r,e,t)=>sm(r,typeof e!="symbol"?e+"":e,t);(function(){let r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(let i of document.querySelectorAll('link[rel="modulepreload"]'))t(i);new MutationObserver(i=>{for(let n of i)if(n.type==="childList")for(let s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&t(s)}).observe(document,{childList:!0,subtree:!0});function e(i){let n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function t(i){if(i.ep)return;i.ep=!0;let n=e(i);fetch(i.href,n)}})();var Lt=class extends Error{constructor(e,t,i){super(i??`Request failed with status ${e}`),ru(this,"status"),ru(this,"body"),this.name="ApiError",this.status=e,this.body=t}};async function fd(r,e={}){let t=await fetch(r,{credentials:"include",...e,headers:{"Content-Type":"application/json",...e.headers??{}}});if(!t.ok){let i=null;try{i=await t.json()}catch{}throw new Lt(t.status,i)}if(t.status!==204)return await t.json()}var It=r=>fd(r),Ct=(r,e)=>fd(r,{method:"POST",body:e===void 0?void 0:JSON.stringify(e)}),oc=r=>fd(r,{method:"DELETE"}),Eh="adversaryai-theme";function gd(){try{let r=localStorage.getItem(Eh);if(r==="light"||r==="dark")return r}catch{}return"dark"}function Ah(r){document.documentElement.dataset.theme=r;try{localStorage.setItem(Eh,r)}catch{}let e=document.querySelector('meta[name="theme-color"]');e&&e.setAttribute("content",r==="light"?"#f6f7f9":"#07080b")}function am(){Ah(gd())}function om(){let r=gd()==="dark"?"light":"dark";return Ah(r),r}function lm(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var cm='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',dm='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';function lc(r=""){let e=document.createElement("button");e.type="button",e.className=`inline-flex h-11 w-11 items-center justify-center md:h-auto md:w-auto md:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition-colors ${r}`.trim();let t=()=>{let i=gd()==="dark";e.innerHTML=i?cm:dm,e.setAttribute("aria-label",i?"Switch to light theme":"Switch to dark theme"),e.title=i?"Switch to light theme":"Switch to dark theme",e.setAttribute("aria-pressed",String(!i))};return e.addEventListener("click",()=>{om(),t()}),t(),e}var el='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',Rh='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';function Vt(r,e=24){return`<svg width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${r}</svg>`}var Qe={mic:Vt('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',20),stop:Vt('<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/>',18),warning:el,bolt:Rh,scale:Vt('<line x1="12" y1="4" x2="12" y2="20"/><line x1="5" y1="6" x2="19" y2="6"/><path d="M5 6l-2.5 6a2.9 2.9 0 0 0 5 0L5 6z"/><path d="M19 6l-2.5 6a2.9 2.9 0 0 0 5 0L19 6z"/><line x1="8" y1="20" x2="16" y2="20"/>',22),cap:Vt('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><line x1="22" y1="10" x2="22" y2="16"/>',22),swap:Vt('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',22),clipboard:Vt('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>',22),trophy:Vt('<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 2 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.5-2 4-4 4"/>',26),target:Vt('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',26),trending:Vt('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',26),compass:Vt('<circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',26),megaphone:Vt('<path d="M3 11l18-7v16L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',28),landmark:Vt('<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',28),briefcase:Vt('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',28),chat:Vt('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',28)};function tl(r="card"){let e=document.createElement("div");e.setAttribute("aria-hidden","true");let t=(i,n="0.875rem")=>`<div class="skeleton" style="width:${i};height:${n}"></div>`;return r==="list"?e.innerHTML=[0,1,2].map(()=>`
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
      </div>`):(e.className="card p-6 space-y-3",e.innerHTML=`${t("35%","0.75rem")}${t("60%","1.75rem")}${t("100%")}${t("85%")}`),e}function jn(r,e){let t=document.createElement("div");return t.className="text-center py-14 px-6 animate-fade-up",t.setAttribute("role","alert"),t.innerHTML=`
    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-danger-dim bg-danger-dim/15 text-danger" aria-hidden="true">${el}</div>
    <h2 class="text-display-sm text-white mb-2">Something went wrong</h2>
    <p class="text-body-sm text-slate-400 max-w-sm mx-auto mb-6">${lm(r)}</p>
    ${e?'<button type="button" class="btn-ghost">Try again</button>':""}`,e&&t.querySelector("button").addEventListener("click",e),t}function cc(){let r=document.createElement("div");return r.className="quota-card card max-w-md mx-auto my-12 p-8 text-center animate-pop-in shadow-glow border-accent-600/50",r.setAttribute("role","alert"),r.innerHTML=`
    <div class="quota-icon mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 border border-accent-600/40 text-accent-400" aria-hidden="true">${Rh}</div>
    <h2 class="quota-title text-display-md text-white mb-2">You're out of rounds</h2>
    <p class="quota-body text-body-sm text-slate-400 mb-7">
      You've used all the rounds in your wallet for now. Pick a plan or grab a one-time pack
      to keep practicing \u2014 pack credits never expire, and unused plan rounds roll over.
    </p>
    <div class="quota-actions flex flex-col sm:flex-row gap-3 justify-center">
      <a href="#/account?plans=1" class="btn-primary">View plans</a>
      <a href="#/account?plans=1&packs=1" class="btn-ghost">Buy a pack</a>
    </div>`,r}function Ch(r,e,t,i){let n=t==="/login",s=document.createElement("div");s.className="w-full max-w-md animate-fade-up",s.innerHTML=`
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
    </p>`;let a=s.querySelector("form"),o=s.querySelector("[data-error]");return{el:s,form:a,errorBox:o}}function Xr(r,e){r.className="error-box mb-5 animate-fade-in",r.setAttribute("role","alert"),r.innerHTML=`<span aria-hidden="true" class="shrink-0 mt-0.5 text-danger">${el}</span><span></span>`,r.querySelector("span:last-child").textContent=e}function Da(r,e,t){r.disabled=e,r.classList.toggle("opacity-60",e),e?r.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Please wait\u2026</span>':r.textContent=t}function vd(){return lc("fixed top-[calc(1rem+var(--safe-top))] right-4 z-30 border border-ink-700 bg-ink-900/80 backdrop-blur")}function bs(r,e){try{window.adversaryTrack?.(r,e||{})}catch{}}async function Lh(r,e,t){let i=r.querySelector("#auth-email").value.trim(),n=r.querySelector("#auth-password").value,s=r.querySelector('button[type="submit"]'),a=t==="/api/auth/signup"?"Sign up":"Log in";if(e.classList.add("hidden"),e.removeAttribute("role"),!i||!n){Xr(e,"Enter your email and password.");return}if(n.length<8){Xr(e,"Password must be at least 8 characters.");return}Da(s,!0,a);try{await Ct(t,{email:i,password:n,attribution:window.adversaryAttribution?.()||null});let o=await It("/api/auth/me");t==="/api/auth/signup"&&bs("sign_up",{method:"email"}),Ws(o);let l=new URLSearchParams(location.hash.split("?")[1]||"").get("next");location.hash=l&&/^#?\/[\w\-\/?=&%.]*$/.test(l)?l.startsWith("#")?l:"#"+l:"#/"}catch(o){let l=o.status;l===409?Xr(e,"An account with that email already exists. Try logging in instead."):l===401?Xr(e,"Wrong email or password. Try again \u2014 or, if you forgot it, email support@getadversaryai.com."):Xr(e,"Something went wrong. Please try again.")}finally{Da(s,!1,a)}}function um(r){let{el:e,form:t,errorBox:i}=Ch("Log in","Your sparring partner is waiting.","/signup","New to AdversaryAI?");r.appendChild(vd()),t.addEventListener("submit",n=>{n.preventDefault(),Lh(t,i,"/api/auth/login")}),r.appendChild(e)}function hm(r){let{el:e,form:t,errorBox:i}=Ch("Sign up","Create your account and start practicing in minutes.","/login","Already have an account?");r.appendChild(vd()),t.addEventListener("submit",n=>{n.preventDefault(),Lh(t,i,"/api/auth/signup")}),r.appendChild(e)}var xd={debate:Qe.megaphone,historical:Qe.landmark,acting:Qe.mic,interview:Qe.briefcase,negotiation:Qe.swap,sales:Qe.trending,difficult:Qe.chat,thesis:Qe.cap,expert:Qe.target,rapbattle:Vt('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',28),witness:Vt('<path d="M12 2v20M5 8h14"/>',28)},ra=null;async function qn(r=!1){if(ra&&!r)return ra;let{modes:e}=await It("/api/modes");return ra=e??[],ra}function vl(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Ph(r){return Array.from({length:r},()=>`
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
    </div>`).join("")}async function pm(r){r.innerHTML=`<div class="max-w-6xl mx-auto px-4 py-6 sm:py-10" id="modes-root">
    <div class="text-center mb-8 sm:mb-10">
      <h1 class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">What do you want to practice?</h1>
      <p class="text-slate-400 mt-2 max-w-xl mx-auto text-sm sm:text-base">Pick an arena. A live AI opponent meets you there \u2014 with voice, pushback, and a scorecard when you\u2019re done.</p>
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" id="mode-grid">
      ${Ph(11)}
    </div>
  </div>`;let e=r.querySelector("#mode-grid");await Ih(e)}async function Ih(r){try{let e=await qn(!0);if(e.length===0){r.innerHTML=`
        <div class="col-span-full text-center py-16 rounded-2xl border border-ink-700 bg-ink-900">
          <p class="text-white font-semibold mb-1">No practice modes available</p>
          <p class="text-sm text-slate-400">Check back in a moment.</p>
        </div>`;return}r.innerHTML="";let t=["interview","debate","historical","sales","negotiation","difficult","thesis","expert","acting","rapbattle","witness"],i=n=>t.indexOf(n)<0?99:t.indexOf(n);for(let n of[...e].sort((s,a)=>i(s.id)-i(a.id))){let s=document.createElement("a");s.href=`#/setup/${encodeURIComponent(n.id)}`,s.className="group card flex flex-row items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/60 sm:flex-col sm:items-stretch sm:gap-0 sm:p-6",s.innerHTML=`
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-accent-500 transition-colors group-hover:border-accent-500/50 sm:mb-4 [&>svg]:h-6 [&>svg]:w-6">${xd[n.id]??Qe.chat}</div>
        <div class="min-w-0 flex-1 sm:flex sm:flex-col">
          <div class="text-base font-bold leading-tight text-white sm:text-lg">${vl(n.name)}</div>
          <div class="mt-1 text-xs font-semibold uppercase tracking-wide text-accent-400 line-clamp-1 sm:mb-2 sm:line-clamp-none">${vl(n.tagline)}</div>
          <p class="text-sm leading-relaxed text-slate-400 line-clamp-3 max-sm:hidden">${vl(n.description)}</p>
        </div>
        <span aria-hidden="true" class="shrink-0 text-xl leading-none text-accent-400 sm:hidden">\u203A</span>
        <div class="mt-auto hidden pt-4 text-sm font-semibold text-accent-400 sm:block">Set up <span aria-hidden="true" class="inline-block transition-transform group-hover:translate-x-0.5">\u2192</span></div>`,r.appendChild(s)}}catch{r.innerHTML=`
      <div class="col-span-full text-center py-16 rounded-2xl border border-ink-700 bg-ink-900">
        <div class="mb-4 flex justify-center text-danger [&>svg]:w-10 [&>svg]:h-10">${Qe.warning}</div>
        <p class="text-white font-semibold mb-1">Couldn\u2019t load practice modes</p>
        <p class="text-sm text-slate-400 mb-6">Check your connection and try again.</p>
        <button id="modes-retry" class="btn-primary text-sm">Retry</button>
      </div>`,r.querySelector("#modes-retry").addEventListener("click",()=>{r.innerHTML=Ph(11),Ih(r)})}}var nu={"teen-boy":{id:"teen-boy",model:"/models/personas/teen-boy.glb",label:"Teenage boy"},"teen-girl":{id:"teen-girl",model:"/models/personas/teen-girl.glb",label:"Teenage girl"},"man-pro":{id:"man-pro",model:"/models/personas/man-pro.glb",label:"Professional man"},"woman-pro":{id:"woman-pro",model:"/models/personas/woman-pro.glb",label:"Professional woman"},"older-man":{id:"older-man",model:"/models/personas/older-man.glb",label:"Older gentleman"},"older-woman":{id:"older-woman",model:"/models/personas/older-woman.glb",label:"Older woman"},"man-casual":{id:"man-casual",model:"/models/adversary-masc.glb",label:"Man"},"woman-casual":{id:"woman-casual",model:"/models/personas/woman-casual.glb",label:"Woman"},"default-masc":{id:"default-masc",model:"/models/adversary-masc.glb",label:"Opponent"},"default-fem":{id:"default-fem",model:"/models/adversary-fem.glb",label:"Opponent"}};function Dh(r){return r&&nu[r]||nu["default-masc"]}var mm={lincoln:"older-man",churchill:"older-man",socrates:"older-man",douglass:"man-pro",mlk:"man-pro",einstein:"older-man",aurelius:"older-man",voltaire:"man-pro",eleanor:"older-woman",smith:"older-man",god_reformed:"older-man",the_devil:"man-pro",cs_lewis:"older-man",aquinas:"older-man",nietzsche:"older-man",hitchens:"man-pro"};function fm(r){return r&&mm[r]||"default-masc"}var ls=[{id:"son",label:"Son",otherParty:"my teenage son"},{id:"daughter",label:"Daughter",otherParty:"my teenage daughter"},{id:"partner",label:"Partner",otherParty:"my partner"},{id:"parent",label:"Parent",otherParty:"my parent"},{id:"boss",label:"Boss",otherParty:"my boss"},{id:"coworker",label:"Coworker",otherParty:"my coworker"},{id:"friend",label:"Friend",otherParty:"my friend"}],gm={son:"teen",daughter:"teen",partner:"adult",parent:"older",boss:"pro",coworker:"adult",friend:"adult"};function vm(r,e){let t=ls.find(s=>s.id===r)?.id??"coworker",i=e==="fem",n=gm[t];return n==="teen"?i?"teen-girl":"teen-boy":n==="older"?i?"older-woman":"older-man":n==="pro"?i?"woman-pro":"man-pro":i?"woman-casual":"man-casual"}var xm={debate:"default-masc",acting:"man-casual",interview:"man-pro",negotiation:"man-pro",sales:"woman-pro",thesis:"older-man",rapbattle:"man-casual",witness:"man-casual",expert:"man-pro"},_m={prosecutor:"man-pro",professor:"older-man",contrarian:"woman-pro",coach:"woman-casual",theist_mathematician:"older-man",secular_rationalist:"man-pro",evolutionary_biologist:"older-man",islamic_theologian:"man-pro",biblical_creationist:"older-man",moral_humanist:"woman-pro",archetypal_psychologist:"man-pro",jordan_peterson:"man-pro"};function ym(r){return r&&_m[r]||"default-masc"}function bm(r){return r&&xm[r]||"default-masc"}var su=[{id:"prosecutor",name:"The Prosecutor",tagline:"Relentless cross-examiner",description:"Treats every claim like testimony. Expect rapid-fire questions, demands for evidence, and zero mercy for hand-waving.",icon:Qe.scale},{id:"professor",name:"The Professor",tagline:"Socratic questioner",description:"Never tells you the answer \u2014 asks the question that unravels your argument. Patient, precise, and quietly devastating.",icon:Qe.cap},{id:"contrarian",name:"The Contrarian",tagline:"Steelmans the other side",description:"Takes the strongest version of the opposing view and defends it brilliantly, forcing you to earn every inch of ground.",icon:Qe.swap},{id:"coach",name:"The Coach",tagline:"Supportive sparring partner",description:"Pushes hard during the round, then breaks down exactly what worked and what didn\u2019t \u2014 with detailed, actionable scores.",icon:Qe.clipboard},{id:"theist_mathematician",name:"The Cambridge Theist",tagline:"Fine-tuning & teleology",description:"Defends classical theism via universal fine-tuning, the unreasonable effectiveness of math, and DNA digital code.",icon:Qe.landmark},{id:"secular_rationalist",name:"The Secular Rationalist",tagline:"Analytic skepticism & reason",description:"Attacks supernatural claims with Ockham's razor, the problem of animal suffering, divine hiddenness, and Euthyphro.",icon:Qe.compass},{id:"evolutionary_biologist",name:"The Evolutionary Biologist",tagline:"Common descent & deep time",description:"Defends neo-Darwinian evolution with endogenous retroviruses, comparative anatomy, transitional fossils, and deep time.",icon:Qe.trending},{id:"islamic_theologian",name:"The Islamic Theologian",tagline:"Kalam cosmology & Tawhid",description:"Argues cosmic contingency necessitates an uncaused Creator; defends strict Monotheism against naturalism and Trinity.",icon:Qe.target},{id:"biblical_creationist",name:"The Biblical Creationist",tagline:"Special creation & scripture",description:"Challenges naturalist epistemology, uniformitarian age dating, the impossibility of abiogenesis, and information loss.",icon:Qe.trophy},{id:"moral_humanist",name:"The Moral Humanist",tagline:"Secular ethics & well-being",description:"Grounds objective morality in conscious suffering and flourishing; critiques ancient dogma while defending human dignity.",icon:Qe.chat},{id:"archetypal_psychologist",name:"The Archetypal Psychologist",tagline:"Meaning, responsibility & archetypes",description:"Analyzes reality through evolutionary psychology, biblical narratives as deep psychological truth, and voluntary confrontation with chaos.",icon:Qe.compass}];function gt(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var Sm={round:[{v:3,t:"3 rounds",s:"Quick spar"},{v:6,t:"6 rounds",s:"Standard bout"},{v:10,t:"10 rounds",s:"Full debate"},{v:0,t:"Open-ended",s:"End when you want"}],question:[{v:3,t:"3 questions",s:"Quick screen"},{v:6,t:"6 questions",s:"Standard"},{v:10,t:"10 questions",s:"Full loop"},{v:0,t:"Open-ended",s:"End when you want"}],exchange:[{v:4,t:"4 exchanges",s:"Short"},{v:8,t:"8 exchanges",s:"Standard"},{v:12,t:"12 exchanges",s:"Deep dive"},{v:0,t:"Open-ended",s:"End when you want"}],bars:[{v:2,t:"2 rounds",s:"Quick cypher"},{v:3,t:"3 rounds",s:"Classic battle"},{v:5,t:"5 rounds",s:"Main event"},{v:0,t:"Open-ended",s:"Until someone taps"}]},xl={v:"cointoss",t:"\u{1FA99} Coin toss",s:"50/50 flip"},wm={debate:{unit:"round",def:6,first:[xl,{v:"user",t:"You open",s:"Opening statement"},{v:"opponent",t:"Opponent opens",s:"They take the floor"}],defFirst:"cointoss",styles:!0,side:!0,judge:!0},historical:{unit:"round",def:6,first:[xl,{v:"user",t:"You open",s:"Opening statement"},{v:"opponent",t:"They open",s:"History speaks first"}],defFirst:"cointoss",styles:!0,side:!0,judge:!0},thesis:{unit:"question",def:6,fixedFirst:"opponent",fixedNote:"The committee opens with the first question."},interview:{unit:"question",def:6,fixedFirst:"opponent",fixedNote:"The interviewer greets you and asks the first question."},expert:{unit:"question",def:6,fixedFirst:"opponent",fixedNote:"They open with the first question for you, the expert."},negotiation:{unit:"exchange",def:8,first:[{v:"user",t:"You open",s:"Make the first move"},{v:"opponent",t:"They open",s:"Counterpart anchors first"}],defFirst:"opponent",judge:!0},sales:{unit:"exchange",def:8,first:[{v:"user",t:"You open the call",s:"Lead the pitch"},{v:"opponent",t:"Buyer speaks first",s:"Cold, skeptical start"}],defFirst:"user",judge:!0},difficult:{unit:"exchange",def:8,first:[{v:"user",t:"You bring it up",s:"Start the talk"},{v:"opponent",t:"They bring it up",s:"Caught off guard"}],defFirst:"user"},acting:{unit:"exchange",def:8,first:[{v:"user",t:"You have the first line",s:""},{v:"opponent",t:"Partner starts",s:""}],defFirst:"user"},witness:{unit:"exchange",def:8,first:[{v:"user",t:"You start",s:"Open the conversation"},{v:"opponent",t:"They start",s:"They ask you first"}],defFirst:"user"},rapbattle:{unit:"bars",def:3,first:[xl,{v:"user",t:"You drop first",s:"Set the tone"},{v:"opponent",t:"MC drops first",s:"Answer back"}],defFirst:"cointoss",judge:!0}},Mm={unit:"exchange",def:8,first:[{v:"user",t:"You start",s:""},{v:"opponent",t:"They start",s:""}],defFirst:"user"};function _d(r){return wm[r]||Mm}var Tm=[{v:"easy",t:"Easy",s:"Gives ground \u2014 good for learning"},{v:"normal",t:"Normal",s:"Fair fight \u2014 admits good points"},{v:"hard",t:"Hard",s:"Relentless \u2014 no easy wins"}],Em={easy:"Easy",normal:"Normal",hard:"Hard"},Uh=[{v:"oxford",t:"Oxford",s:"Classic structure"},{v:"lincoln_douglas",t:"L\u2013D",s:"Lincoln\u2013Douglas values"},{v:"rapid",t:"Rapid fire",s:"Short, punchy turns"},{v:"freeform",t:"Freeform",s:"Open sparring"}],Am=[{v:"for",t:"I argue FOR",s:"Defend the motion"},{v:"against",t:"I argue AGAINST",s:"Oppose the motion"},{v:"open",t:"No fixed sides",s:"Free-flowing clash"}];function pn(r,e,t){return e.map(i=>`<button type="button" class="opt-chip" data-opt="${r}" data-value="${gt(String(i.v))}" aria-pressed="${String(i.v)===String(t)}">
        <span class="opt-title">${gt(i.t)}</span>${i.s?`<span class="opt-sub">${gt(i.s)}</span>`:""}
      </button>`).join("")}function Rm(r){let e=`setup-${gt(r.key)}`,t=r.required?'<span class="text-accent-400 ml-0.5" aria-hidden="true">*</span>':"",i=r.help?`<p class="help">${gt(r.help)}</p>`:"",n=`<label class="label" for="${e}">${gt(r.label)}${t}</label>`;if(r.type==="textarea")return`${n}<textarea id="${e}" data-key="${gt(r.key)}" rows="3" placeholder="${gt(r.placeholder??"")}" class="field resize-none"></textarea>${i}`;if(r.type==="select"){let s=(r.options??[]).map(a=>`<option value="${gt(a.value)}">${gt(a.label)}</option>`).join("");return`${n}<select id="${e}" data-key="${gt(r.key)}" class="field">${r.required?"":'<option value="">\u2014</option>'}${s}</select>${i}`}return`${n}<input id="${e}" data-key="${gt(r.key)}" type="text" placeholder="${gt(r.placeholder??"")}" class="field" />${i}`}function Cm(r){return`
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
    </button>`}function Lm(r,e){try{sessionStorage.setItem(`adversaryai:session:${r}`,JSON.stringify(e))}catch{}}var _l=r=>String(r||"").replace(/\([^)]*\)/g,"").replace(/[^\p{L}\p{N} .'\-]/gu,"").replace(/\.+$/,"").trim().toUpperCase().replace(/\s+/g," "),Pm=r=>String(r||"").replace(/\([^)]*\)/g," ").replace(/\[[^\]]*\]/g," ").replace(/\s+/g," ").trim();function dc(r){let e=[],t=null,i=null,n=(s,a)=>{let o=Pm(a);!s||!o||(t&&t.name===s?t.text+=" "+o:e.push(t={name:s,text:o}))};for(let s of String(r||"").replace(/\r\n?/g,`
`).split(`
`)){let a=s.trim();if(!a){i=null;continue}if(/^(INT|EXT|INT\/EXT|I\/E)[.\s]/.test(a)||/^(FADE|CUT TO|DISSOLVE|SMASH CUT|THE END)/.test(a)){i=null;continue}let o=a.match(/^([\p{L}][\p{L}\p{N} .'\-]{0,30}?)\s*(\([^)]*\))?\s*:\s*(.+)$/u);if(o&&o[1].split(" ").length<=4){n(_l(o[1]),o[3]),i=null;continue}let l=a.match(/^([A-Z][A-Z .'\-]{1,30}?)\.\s+(.+)$/);if(l&&l[1]===l[1].toUpperCase()&&l[1].split(" ").length<=4){n(_l(l[1]),l[2]),i=null;continue}let c=a.match(/^([A-Z][A-Z0-9 .'\-]{0,30})(\s*\([^)]*\))?$/);if(c&&/[A-Z]{2}/.test(c[1])&&c[1].trim().split(/\s+/).length<=4){i=_l(c[1]);continue}i&&n(i,a)}return e}function Nh(r,e){let t=[],i=!1;for(let n of r){let s=n.name===e;s&&i?t[t.length-1]+=" "+n.text:s&&t.push(n.text),i=s}return t}function Im(r,e){let t=a=>String(a||"").toLowerCase().replace(/[’']/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(Boolean),i=t(r).slice(0,600),n=t(e).slice(0,600);if(!i.length)return 100;if(!n.length)return 0;let s=new Array(n.length+1).fill(0);for(let a=1;a<=i.length;a++){let o=0;for(let l=1;l<=n.length;l++){let c=s[l];s[l]=i[a-1]===n[l-1]?o+1:Math.max(s[l],s[l-1]),o=c}}return Math.round(200*s[n.length]/(i.length+n.length))}var yl=r=>String(r||"").toLowerCase().replace(new RegExp("(^|[\\s'-])\\p{L}","gu"),e=>e.toUpperCase());function Dm(r,e,t){if(e.topic)return e.topic;let i=n=>String(n).slice(0,300);switch(r.id){case"thesis":return i(e.thesisStatement?`Thesis: ${e.thesisStatement}${e.field?` (${e.field})`:""}`:"Thesis defense");case"acting":return i(e.yourRole?`Acting: ${e.yourRole}${e.sceneContext?` \u2014 ${e.sceneContext}`:""}`:"Acting rehearsal");case"interview":return i(e.jobTitle?`Interview: ${e.jobTitle}${e.company?` at ${e.company}`:""}`:"Job interview");case"negotiation":return i(e.scenario||e.yourGoal?`Negotiation: ${e.scenario||e.yourGoal}`:"Negotiation practice");case"sales":return i(e.product?`Pitch: ${e.product}${e.buyerPersona?` to ${e.buyerPersona}`:""}`:"Sales roleplay");case"difficult":return i(e.situation||"Difficult conversation");case"historical":return i(t?.suggestedTopic||(t?`Debate with ${t.name}`:"Historical debate"));case"rapbattle":return i(e.theme?`Rap battle: ${e.theme}`:"Open rap battle");case"witness":return i(e.who?`Sharing the gospel with ${e.who}`:"Sharing the gospel");case"expert":return i(e.profession?`Expert: ${e.profession}`:"Domain expert");default:return i((r.name||"Sparring")+" session")}}function Um(r,e){return new Promise((t,i)=>{let n=document.createElement("div");n.className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in",n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true"),n.innerHTML=`<div class="relative w-full max-w-sm overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 p-7 text-center shadow-2xl">
      <p class="eyebrow mb-5 !text-amber-400">Coin toss</p>
      <div class="coin-container my-6"><div class="coin-3d coin-flipping" id="toss-coin">
        <div class="coin-side coin-side-front"><span class="text-[11px] font-black uppercase tracking-wider">You</span></div>
        <div class="coin-side coin-side-back"><span class="text-[11px] font-black uppercase tracking-wider">Them</span></div>
      </div></div>
      <div id="toss-status" class="mb-1.5 text-base font-semibold text-white">Flipping\u2026</div>
      <p id="toss-sub" class="text-sm text-slate-400">Heads you open \xB7 Tails they open</p>
      <button type="button" id="toss-go" class="btn-primary mt-6 hidden w-full py-3">Enter the floor \u2192</button>
    </div>`,document.body.appendChild(n);let s=n.querySelector("#toss-coin"),a=n.querySelector("#toss-status"),o=n.querySelector("#toss-sub"),l=n.querySelector("#toss-go");r.then(c=>{setTimeout(()=>{s.classList.remove("coin-flipping");let d=c.resolvedFirstSpeaker==="user";s.classList.add(d?"coin-land-heads":"coin-land-tails"),a.innerHTML=d?'<span class="text-emerald-400">Heads \u2014 you open.</span>':`<span class="text-amber-400">Tails \u2014 ${Be(e)} opens.</span>`,o.textContent=d?"Deliver your opening statement.":`${e} takes the floor first.`,l.classList.remove("hidden"),l.focus();let u=setTimeout(()=>{n.remove(),t(c)},2200);l.onclick=()=>{clearTimeout(u),n.remove(),t(c)}},1200)}).catch(c=>{n.remove(),i(c)})})}async function Nm(r,e){r.innerHTML=`<div class="mx-auto max-w-2xl px-4 py-6 sm:py-10" id="setup-root">${tl("page").outerHTML}</div>`;let t=r.querySelector("#setup-root"),i;try{i=await qn()}catch{t.innerHTML='<div class="py-16 text-center text-slate-400"><p class="mb-2 font-semibold text-white">Couldn\u2019t load this mode</p><p class="mb-6 text-sm">Check your connection and try again.</p><a href="#/" class="btn-primary">Back to practice</a></div>';return}let n=i.find(T=>T.id===e);if(n&&t.isConnected&&(document.title=`${n.name} setup \xB7 AdversaryAI`),!n){t.innerHTML='<div class="py-16 text-center text-slate-400"><h1 class="mb-3 text-display-md text-white">Mode not found</h1><p class="mb-6 text-sm">That practice mode doesn\u2019t exist.</p><a href="#/" class="btn-primary">Back to practice</a></div>';return}let s=_d(n.id),a=n.id==="debate",o=n.id==="difficult",l=n.figures??[],c=new Map(l.map(T=>[T.id,T])),d={persona:su[0],figure:null,rel:"coworker",present:"masc",rounds:s.def,first:s.fixedFirst||s.defFirst,style:"oxford",side:"for",difficulty:"normal"},u=(n.setupFields||[]).filter(T=>T.key!=="figureId");(a||n.id==="historical")&&!u.some(T=>T.key==="topic")&&u.push({key:"topic",label:(n.id==="historical","Debate motion"),type:"textarea",placeholder:n.id==="historical"?"Pick a figure to get a suggested motion \u2014 or write your own":"e.g. Social media platforms should be regulated as public utilities",required:!0});let h=new URLSearchParams(location.hash.split("?")[1]||"").get("topic"),p=Sm[s.unit];if(t.innerHTML=`
    <a href="#/" class="-my-2 inline-flex items-center gap-1 py-3 text-sm text-slate-500 hover:text-slate-300">\u2190 All modes</a>
    <div class="mb-2 mt-4 flex items-center gap-4">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900 text-accent-500 [&>svg]:h-7 [&>svg]:w-7">${xd[n.id]??Qe.chat}</div>
      <div class="min-w-0">
        <h1 class="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-display-md">${gt(n.name)}</h1>
        <p class="text-sm font-medium text-accent-400">${gt(n.tagline)}</p>
      </div>
    </div>
    <p class="mb-2 text-sm leading-relaxed text-slate-400 sm:text-base">${gt(n.introCopy??n.description)}</p>
    ${n.disclaimer?`<div class="mt-5 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"><span class="shrink-0 text-amber-400 [&>svg]:h-5 [&>svg]:w-5">${Qe.warning}</span><p class="text-sm leading-relaxed text-slate-300" id="mode-disclaimer"></p></div>`:""}

    ${l.length?`<section class="setup-section"><h2 class="section-title">Choose your figure</h2><p class="section-sub">Each argues from their documented views and writings, in their own voice.</p><div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2" id="figure-grid">${l.map(Cm).join("")}</div></section>`:""}

    ${a?'<section class="setup-section"><h2 class="section-title">Choose your opponent</h2><p class="section-sub">Each has a different style of attack.</p><div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2" id="persona-grid"></div></section>':""}

    ${o?`<section class="setup-section"><h2 class="section-title">Who is this conversation with?</h2><p class="section-sub">They\u2019ll look and sound the part.</p>
      <div class="mb-4 flex flex-wrap gap-2" id="rel-grid">${ls.map(T=>`<button type="button" class="pill-chip" data-rel="${T.id}" aria-pressed="${T.id===d.rel}">${T.label}</button>`).join("")}</div>
      <p class="mb-2 text-xs font-medium text-slate-400">Their voice &amp; look</p>
      <div class="flex flex-wrap gap-2" id="present-grid"><button type="button" class="pill-chip" data-present="masc" aria-pressed="true">Masculine</button><button type="button" class="pill-chip" data-present="fem" aria-pressed="false">Feminine</button></div></section>`:""}

    ${n.id==="acting"?`<section class="setup-section"><h2 class="section-title">How do you want to rehearse?</h2><div class="opt-grid grid-cols-1 sm:grid-cols-2">${pn("actMode",[{v:"script",t:"Run my script",s:"Paste your scene \u2014 your partner reads every other part, word for word"},{v:"improv",t:"Improvise",s:"Describe a scene \u2014 your partner improvises in character"}],"script")}</div></section>
    <section class="setup-section" id="script-sec">
      <label class="label" for="setup-script">Your scene</label>
      <textarea id="setup-script" rows="9" class="field text-sm leading-relaxed" placeholder="ROMEO: But soft, what light through yonder window breaks?&#10;JULIET: Ay me.&#10;ROMEO: She speaks!"></textarea>
      <p class="help">One line per speech as <b>NAME: line</b> \u2014 screenplay format (name on its own line) works too. Stage directions in (parentheses) are skipped.</p>
      <div class="mt-2 flex flex-wrap items-center gap-3"><label class="btn-ghost btn-sm cursor-pointer">Upload a .txt<input type="file" id="script-file" accept=".txt,.fountain,.md,text/plain" class="hidden" /></label><span id="script-stats" class="text-xs text-slate-400"></span></div>
      <div id="role-sec" class="mt-5 hidden"><p class="label">Which character are you?</p><div class="flex flex-wrap gap-2" id="role-grid"></div></div>
    </section>`:""}

    <section class="setup-section space-y-5" id="field-list">${u.map(T=>`<div>${Rm(T)}</div>`).join("")}</section>

    ${s.side?`<section class="setup-section"><h2 class="section-title">Your side</h2><div class="opt-grid grid-cols-1 sm:grid-cols-3">${pn("side",Am,d.side)}</div></section>`:""}

    ${s.styles?`<section class="setup-section"><h2 class="section-title">Format</h2><div class="opt-grid grid-cols-2 sm:grid-cols-4">${pn("style",Uh,d.style)}</div></section>`:""}

    ${n.id!=="acting"?`<section class="setup-section"><h2 class="section-title">Difficulty</h2><div class="opt-grid grid-cols-1 sm:grid-cols-3">${pn("difficulty",Tm,"normal")}</div></section>`:""}

    <section class="setup-section" id="len-sec"><h2 class="section-title">Length</h2><p class="section-sub">Each ${s.unit==="bars"?"round":s.unit} uses one credit.</p><div class="opt-grid grid-cols-2 sm:grid-cols-4">${pn("rounds",p,d.rounds)}</div></section>

    ${s.first?`<section class="setup-section" id="first-sec"><h2 class="section-title">Who speaks first?</h2><div class="opt-grid ${s.first.length===3?"grid-cols-1 sm:grid-cols-3":"grid-cols-2"}">${pn("first",s.first,d.first)}</div></section>`:`<p class="setup-section flex items-center gap-2 text-sm text-slate-400"><span class="text-accent-400">\u25CF</span>${gt(s.fixedNote)}</p>`}

    <div class="mt-6 hidden" id="setup-error"></div>
    <button id="start-btn" type="button" class="btn-primary mt-7 w-full py-3.5 text-base">Start session</button>
    <p class="mt-3 text-center text-xs text-slate-500" id="start-note"></p>
    <div id="quota-slot"></div>`,h){let T=t.querySelector('[data-key="topic"]');T&&(T.value=h)}let g=t.querySelector("#mode-disclaimer"),v=()=>{g&&(g.textContent=n.disclaimer.replace("[Name]",d.figure?c.get(d.figure)?.name:"this figure"))};v();let m=t.querySelector("#start-note"),f=()=>{if(n.id==="acting"&&d.actMode==="script"){m.textContent="Your partner reads every other part, word for word. You get a line-accuracy check after each line and coaching notes at the end.";return}let T=s.judge?" An impartial judge scores both sides at the end.":" You\u2019ll get a coaching scorecard at the end.",b=s.fixedFirst?"":d.first==="user"?"You speak first.":d.first==="opponent"?"They speak first.":"A coin toss decides who opens.";m.textContent=`${b}${T}`.trim()};f();let M=null;if(t.addEventListener("click",T=>{let b=T.target.closest("[data-opt]");if(!b)return;let x=b.getAttribute("data-opt");t.querySelectorAll(`[data-opt="${x}"]`).forEach(U=>U.setAttribute("aria-pressed",String(U===b)));let C=b.getAttribute("data-value");d[x]=x==="rounds"?Number(C):C,x==="actMode"&&M?.(),f()}),n.id==="acting"){d.actMode="script",d.role=null,d.scriptEntries=[];let T=t.querySelector("#setup-script"),b=t.querySelector("#script-stats"),x=t.querySelector("#role-sec"),C=t.querySelector("#role-grid"),U=(P,L)=>t.querySelector(P)?.classList.toggle("hidden",!L);M=()=>{let P=d.actMode==="script";U("#script-sec",P),U("#field-list",!P),U("#len-sec",!P),U("#first-sec",!P)};let V=()=>{let P=d.scriptEntries=dc(T.value),L=new Map;P.forEach(F=>L.set(F.name,(L.get(F.name)||0)+1));let H=[...L.keys()];if(H.includes(d.role)||(d.role=null),!T.value.trim())b.textContent="";else if(H.length<2)b.textContent="Couldn\u2019t find two characters yet \u2014 use NAME: line.";else{let F=d.role?Nh(P,d.role).length:0;b.textContent=`${P.length} lines \xB7 ${H.length} characters${d.role?` \xB7 you have ${F} cue${F===1?"":"s"} (${F} credit${F===1?"":"s"})`:""}`}x.classList.toggle("hidden",H.length<2),C.innerHTML=H.slice(0,12).map(F=>`<button type="button" class="pill-chip" data-role="${gt(F)}" aria-pressed="${F===d.role}">${gt(yl(F))} <span class="text-slate-500">\xB7 ${L.get(F)}</span></button>`).join("")},G=0;T.addEventListener("input",()=>{clearTimeout(G),G=setTimeout(V,250)}),C.addEventListener("click",P=>{let L=P.target.closest("[data-role]");L&&(d.role=L.getAttribute("data-role"),V())}),t.querySelector("#script-file").addEventListener("change",async P=>{let L=P.target.files?.[0];if(L){if(L.size>2e5)return b.textContent="That file is too big \u2014 paste just the scene you\u2019re rehearsing.";T.value=(await L.text()).slice(0,3e4),V()}}),M()}if(a){let T=t.querySelector("#persona-grid");for(let b of su){let x=document.createElement("button");x.type="button",x.setAttribute("aria-pressed",b.id===d.persona.id?"true":"false"),x.className="persona-card flex items-start gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4 text-left hover:border-slate-500",x.innerHTML=`<span class="mt-0.5 shrink-0 text-accent-400 [&>svg]:h-6 [&>svg]:w-6">${b.icon}</span>
        <span class="min-w-0"><span class="block font-semibold leading-tight text-white">${gt(b.name)}</span>
        <span class="mt-0.5 block text-xs font-medium uppercase tracking-wide text-accent-400">${gt(b.tagline)}</span>
        <span class="mt-1.5 text-sm leading-snug text-slate-400 line-clamp-2">${gt(b.description)}</span></span>`,x.addEventListener("click",()=>{d.persona=b,T.querySelectorAll(".persona-card").forEach(C=>C.setAttribute("aria-pressed",String(C===x)))}),T.appendChild(x)}}let w=t.querySelector("#figure-grid");if(w){let T="";w.addEventListener("click",b=>{let x=b.target.closest(".figure-card");if(!x)return;d.figure=x.getAttribute("data-figure-id"),w.querySelectorAll(".figure-card").forEach(V=>V.setAttribute("aria-pressed",String(V===x)));let C=t.querySelector('[data-key="topic"]'),U=c.get(d.figure);C&&U&&(!C.value.trim()||C.value===T)&&(C.value=U.suggestedTopic||"",T=C.value),v()})}if(o){let T=t.querySelector("#rel-grid"),b=t.querySelector("#present-grid"),x=()=>t.querySelector("#setup-otherParty"),C=ls.find(V=>V.id===d.rel)?.otherParty||"",U=x();U&&!U.value.trim()&&(U.value=C),T.addEventListener("click",V=>{let G=V.target.closest("[data-rel]");if(!G)return;d.rel=G.getAttribute("data-rel"),T.querySelectorAll("[data-rel]").forEach(H=>H.setAttribute("aria-pressed",String(H===G)));let P=x(),L=ls.find(H=>H.id===d.rel);P&&L&&(!P.value.trim()||P.value===C)&&(P.value=L.otherParty,C=L.otherParty)}),b.addEventListener("click",V=>{let G=V.target.closest("[data-present]");G&&(d.present=G.getAttribute("data-present"),b.querySelectorAll("[data-present]").forEach(P=>P.setAttribute("aria-pressed",String(P===G))))})}let _=t.querySelector("#start-btn"),D=t.querySelector("#setup-error"),A=t.querySelector("#quota-slot"),R=T=>{Xr(D,T),D.classList.remove("hidden"),D.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"})};_.addEventListener("click",async()=>{Oe.unlock(),ea(),D.classList.add("hidden");let T={},b=null;l.length&&!d.figure&&(b="Pick a figure to spar with first.");let x=n.id==="acting"&&d.actMode==="script";for(let L of u){let H=(t.querySelector(`#setup-${CSS.escape(L.key)}`)?.value??"").trim();T[L.key]=H,L.required&&!H&&!b&&!x&&(b=`Please fill in \u201C${L.label}\u201D.`)}if(n.id==="acting"&&(T.actingMode=x?"script":"improv",x)){let L=t.querySelector("#setup-script").value.trim(),H=[...new Set(dc(L).map(F=>F.name))];L?H.length<2?b="We couldn\u2019t find two characters \u2014 put each line as NAME: line.":d.role||(b="Pick which character you\u2019re playing."):b="Paste your scene first.",T.script=L.slice(0,3e4),T.scriptRole=d.role||"",T.yourRole=yl(d.role||""),T.partnerRole=H.filter(F=>F!==d.role).slice(0,3).map(yl).join(" & "),T.sceneContext=""}if(b)return R(b);let C=d.figure?c.get(d.figure):null;C&&(T.figureId=C.id);let U=C?fm(C.id):o?vm(d.rel,d.present):a?ym(d.persona.id):bm(n.id);T.personaVisual=U;let V=Dh(U),G;a?G=d.persona.name:C?G=C.name:o?G=`Your ${(ls.find(L=>L.id===d.rel)?.label||"partner").toLowerCase()}`:n.id==="rapbattle"?G=String(T.mcName||"").trim()||"Verse Vice":n.id==="witness"?G=String(T.who||"").trim()||n.name:n.id==="interview"?G="Hiring manager":n.id==="thesis"?G="Thesis committee":n.id==="negotiation"?G=String(T.counterpartRole||"").trim()||"Counterpart":n.id==="sales"?G="The buyer":n.id==="acting"?G=String(T.partnerRole||"").trim()||"Scene partner":G=n.name;let P=Dm(n,T,C);s.side&&(T.userSide=d.side),n.id!=="acting"&&(T.difficulty=d.difficulty),T.personaLabel=G,_.disabled=!0,_.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Setting up\u2026</span>';try{let L=Ct("/api/debate/start",{mode:n.id,persona:a?d.persona.id:T.persona||void 0,topic:P,setup:T,targetRounds:d.rounds,firstSpeaker:d.first,debateStyle:s.styles?d.style:void 0}),H=d.first==="cointoss"?await Um(L,G):await L,F=H.debateId;bs("session_start",{mode:n.id}),Lm(F,{modeId:n.id,modeName:n.name,topic:P,personaLabel:G,judgeEnabled:!!H.judge,personaVisual:V.model,targetRounds:H.targetRounds??d.rounds,firstSpeaker:d.first,resolvedFirstSpeaker:H.resolvedFirstSpeaker||d.first,debateStyle:H.debateStyle||null,userSide:T.userSide||null,figureId:C?C.id:void 0}),location.hash=`#/session/${encodeURIComponent(F)}`}catch(L){L instanceof Lt&&L.status===402?(A.replaceChildren(cc()),_.classList.add("hidden"),m.classList.add("hidden")):(R(L instanceof Lt&&(L.body?.message||L.body?.error)||"Could not start the session. Please try again."),_.disabled=!1,_.textContent="Start session")}})}var il="170",kh=0,uc=1,Oh=2,yd=1,Fh=2,Vi=3,qi=0,qt=1,Ai=2,dr=0,Kr=1,hc=2,pc=3,mc=4,Bh=5,Cr=100,Hh=101,zh=102,Vh=103,Gh=104,$h=200,Wh=201,jh=202,qh=203,Ua=204,Na=205,Xh=206,Yh=207,Kh=208,Zh=209,Jh=210,Qh=211,ep=212,tp=213,ip=214,ka=0,Oa=1,Fa=2,Jr=3,Ba=4,Ha=5,za=6,Va=7,bd=0,rp=1,np=2,ur=0,sp=1,ap=2,op=3,Sd=4,lp=5,cp=6,dp=7,fc="attached",up="detached",wd=300,Qr=301,en=302,Ga=303,$a=304,js=306,tn=1e3,lr=1001,Ss=1002,Xt=1003,Md=1004,Ln=1005,ri=1006,hs=1007,Wi=1008,Xi=1009,Td=1010,Ed=1011,Nn=1012,rl=1013,Dr=1014,_i=1015,Xn=1016,nl=1017,sl=1018,rn=1020,Ad=35902,Rd=1021,Cd=1022,di=1023,Ld=1024,Pd=1025,Zr=1026,nn=1027,al=1028,ol=1029,Id=1030,ll=1031,cl=1033,ps=33776,ms=33777,fs=33778,gs=33779,Wa=35840,ja=35841,qa=35842,Xa=35843,Ya=36196,Ka=37492,Za=37496,Ja=37808,Qa=37809,eo=37810,to=37811,io=37812,ro=37813,no=37814,so=37815,ao=37816,oo=37817,lo=37818,co=37819,uo=37820,ho=37821,vs=36492,po=36494,mo=36495,Dd=36283,fo=36284,go=36285,vo=36286,kn=2300,On=2301,Ia=2302,gc=2400,vc=2401,xc=2402,hp=2500,pp=0,Ud=1,xo=2,mp=3200,fp=3201,Nd=0,gp=1,or="",Ft="srgb",Yt="srgb-linear",qs="linear",dt="srgb",jr=7680,_c=519,vp=512,xp=513,_p=514,kd=515,yp=516,bp=517,Sp=518,wp=519,_o=35044,yc="300 es",ji=2e3,ws=2001,pr=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let i=this._listeners[e];if(i!==void 0){let n=i.indexOf(t);n!==-1&&i.splice(n,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let i=t.slice(0);for(let n=0,s=i.length;n<s;n++)i[n].call(this,e);e.target=null}}},$t=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],au=1234567,xs=Math.PI/180,Fn=180/Math.PI;function Pi(){let r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return($t[r&255]+$t[r>>8&255]+$t[r>>16&255]+$t[r>>24&255]+"-"+$t[e&255]+$t[e>>8&255]+"-"+$t[e>>16&15|64]+$t[e>>24&255]+"-"+$t[t&63|128]+$t[t>>8&255]+"-"+$t[t>>16&255]+$t[t>>24&255]+$t[i&255]+$t[i>>8&255]+$t[i>>16&255]+$t[i>>24&255]).toLowerCase()}function jt(r,e,t){return Math.max(e,Math.min(t,r))}function Od(r,e){return(r%e+e)%e}function km(r,e,t,i,n){return i+(r-e)*(n-i)/(t-e)}function Om(r,e,t){return r!==e?(t-r)/(e-r):0}function _s(r,e,t){return(1-t)*r+t*e}function Fm(r,e,t,i){return _s(r,e,1-Math.exp(-t*i))}function Bm(r,e=1){return e-Math.abs(Od(r,e*2)-e)}function Hm(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e),r*r*(3-2*r))}function zm(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e),r*r*r*(r*(r*6-15)+10))}function Vm(r,e){return r+Math.floor(Math.random()*(e-r+1))}function Gm(r,e){return r+Math.random()*(e-r)}function $m(r){return r*(.5-Math.random())}function Wm(r){r!==void 0&&(au=r);let e=au+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function jm(r){return r*xs}function qm(r){return r*Fn}function Xm(r){return(r&r-1)===0&&r!==0}function Ym(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function Km(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function Zm(r,e,t,i,n){let s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+i)/2),d=a((e+i)/2),u=s((e-i)/2),h=a((e-i)/2),p=s((i-e)/2),g=a((i-e)/2);switch(n){case"XYX":r.set(o*d,l*u,l*h,o*c);break;case"YZY":r.set(l*h,o*d,l*u,o*c);break;case"ZXZ":r.set(l*u,l*h,o*d,o*c);break;case"XZX":r.set(o*d,l*g,l*p,o*c);break;case"YXY":r.set(l*p,o*d,l*g,o*c);break;case"ZYZ":r.set(l*g,l*p,o*d,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function Ri(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function ut(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}var Mp={DEG2RAD:xs,RAD2DEG:Fn,generateUUID:Pi,clamp:jt,euclideanModulo:Od,mapLinear:km,inverseLerp:Om,lerp:_s,damp:Fm,pingpong:Bm,smoothstep:Hm,smootherstep:zm,randInt:Vm,randFloat:Gm,randFloatSpread:$m,seededRandom:Wm,degToRad:jm,radToDeg:qm,isPowerOfTwo:Xm,ceilPowerOfTwo:Ym,floorPowerOfTwo:Km,setQuaternionFromProperEuler:Zm,normalize:ut,denormalize:Ri},it=class r{constructor(e=0,t=0){r.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,n=e.elements;return this.x=n[0]*t+n[3]*i+n[6],this.y=n[1]*t+n[4]*i+n[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(jt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),n=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*n+e.x,this.y=s*n+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ge=class r{constructor(e,t,i,n,s,a,o,l,c){r.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,n,s,a,o,l,c)}set(e,t,i,n,s,a,o,l,c){let d=this.elements;return d[0]=e,d[1]=n,d[2]=o,d[3]=t,d[4]=s,d[5]=l,d[6]=i,d[7]=a,d[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,n=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],d=i[4],u=i[7],h=i[2],p=i[5],g=i[8],v=n[0],m=n[3],f=n[6],M=n[1],w=n[4],_=n[7],D=n[2],A=n[5],R=n[8];return s[0]=a*v+o*M+l*D,s[3]=a*m+o*w+l*A,s[6]=a*f+o*_+l*R,s[1]=c*v+d*M+u*D,s[4]=c*m+d*w+u*A,s[7]=c*f+d*_+u*R,s[2]=h*v+p*M+g*D,s[5]=h*m+p*w+g*A,s[8]=h*f+p*_+g*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8];return t*a*d-t*o*c-i*s*d+i*o*l+n*s*c-n*a*l}invert(){let e=this.elements,t=e[0],i=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],u=d*a-o*c,h=o*l-d*s,p=c*s-a*l,g=t*u+i*h+n*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return e[0]=u*v,e[1]=(n*c-d*i)*v,e[2]=(o*i-n*a)*v,e[3]=h*v,e[4]=(d*t-n*l)*v,e[5]=(n*s-o*t)*v,e[6]=p*v,e[7]=(i*l-c*t)*v,e[8]=(a*t-i*s)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,n,s,a,o){let l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-n*c,n*l,-n*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(bl.makeScale(e,t)),this}rotate(e){return this.premultiply(bl.makeRotation(-e)),this}translate(e,t){return this.premultiply(bl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let n=0;n<9;n++)if(t[n]!==i[n])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},bl=new Ge;function Tp(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function Ms(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Ep(){let r=Ms("canvas");return r.style.display="block",r}var ou={};function cs(r){r in ou||(ou[r]=!0,console.warn(r))}function Jm(r,e,t){return new Promise(function(i,n){function s(){switch(r.clientWaitSync(e,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:n();break;case r.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}function Qm(r){let e=r.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function ef(r){let e=r.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var et={enabled:!0,workingColorSpace:Yt,spaces:{},convert:function(r,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===dt&&(r.r=hr(r.r),r.g=hr(r.g),r.b=hr(r.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(r.applyMatrix3(this.spaces[e].toXYZ),r.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===dt&&(r.r=In(r.r),r.g=In(r.g),r.b=In(r.b))),r},fromWorkingColorSpace:function(r,e){return this.convert(r,this.workingColorSpace,e)},toWorkingColorSpace:function(r,e){return this.convert(r,e,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===or?qs:this.spaces[r].transfer},getLuminanceCoefficients:function(r,e=this.workingColorSpace){return r.fromArray(this.spaces[e].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,e,t){return r.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}};function hr(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function In(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}var lu=[.64,.33,.3,.6,.15,.06],cu=[.2126,.7152,.0722],du=[.3127,.329],uu=new Ge().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),hu=new Ge().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);et.define({[Yt]:{primaries:lu,whitePoint:du,transfer:qs,toXYZ:uu,fromXYZ:hu,luminanceCoefficients:cu,workingColorSpaceConfig:{unpackColorSpace:Ft},outputColorSpaceConfig:{drawingBufferColorSpace:Ft}},[Ft]:{primaries:lu,whitePoint:du,transfer:dt,toXYZ:uu,fromXYZ:hu,luminanceCoefficients:cu,outputColorSpaceConfig:{drawingBufferColorSpace:Ft}}});var mn,yo=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{mn===void 0&&(mn=Ms("canvas")),mn.width=e.width,mn.height=e.height;let i=mn.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=mn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ms("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let n=i.getImageData(0,0,e.width,e.height),s=n.data;for(let a=0;a<s.length;a++)s[a]=hr(s[a]/255)*255;return i.putImageData(n,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(hr(t[i]/255)*255):t[i]=hr(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},tf=0,Ts=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:tf++}),this.uuid=Pi(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},n=this.data;if(n!==null){let s;if(Array.isArray(n)){s=[];for(let a=0,o=n.length;a<o;a++)n[a].isDataTexture?s.push(Sl(n[a].image)):s.push(Sl(n[a]))}else s=Sl(n);i.url=s}return t||(e.images[this.uuid]=i),i}};function Sl(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?yo.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var rf=0,Gt=class r extends pr{constructor(e=r.DEFAULT_IMAGE,t=r.DEFAULT_MAPPING,i=lr,n=lr,s=ri,a=Wi,o=di,l=Xi,c=r.DEFAULT_ANISOTROPY,d=or){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:rf++}),this.uuid=Pi(),this.name="",this.source=new Ts(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=n,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new it(0,0),this.repeat=new it(1,1),this.center=new it(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ge,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==wd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case tn:e.x=e.x-Math.floor(e.x);break;case lr:e.x=e.x<0?0:1;break;case Ss:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case tn:e.y=e.y-Math.floor(e.y);break;case lr:e.y=e.y<0?0:1;break;case Ss:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Gt.DEFAULT_IMAGE=null;Gt.DEFAULT_MAPPING=wd;Gt.DEFAULT_ANISOTROPY=1;var ot=class r{constructor(e=0,t=0,i=0,n=1){r.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=n}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,n){return this.x=e,this.y=t,this.z=i,this.w=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,n=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*n+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*n+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*n+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*n+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,n,s,a=e.elements,o=a[0],l=a[4],c=a[8],d=a[1],u=a[5],h=a[9],p=a[2],g=a[6],v=a[10];if(Math.abs(l-d)<.01&&Math.abs(c-p)<.01&&Math.abs(h-g)<.01){if(Math.abs(l+d)<.1&&Math.abs(c+p)<.1&&Math.abs(h+g)<.1&&Math.abs(o+u+v-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let f=(o+1)/2,M=(u+1)/2,w=(v+1)/2,_=(l+d)/4,D=(c+p)/4,A=(h+g)/4;return f>M&&f>w?f<.01?(i=0,n=.707106781,s=.707106781):(i=Math.sqrt(f),n=_/i,s=D/i):M>w?M<.01?(i=.707106781,n=0,s=.707106781):(n=Math.sqrt(M),i=_/n,s=A/n):w<.01?(i=.707106781,n=.707106781,s=0):(s=Math.sqrt(w),i=D/s,n=A/s),this.set(i,n,s,t),this}let m=Math.sqrt((g-h)*(g-h)+(c-p)*(c-p)+(d-l)*(d-l));return Math.abs(m)<.001&&(m=1),this.x=(g-h)/m,this.y=(c-p)/m,this.z=(d-l)/m,this.w=Math.acos((o+u+v-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},bo=class extends pr{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new ot(0,0,e,t),this.scissorTest=!1,this.viewport=new ot(0,0,e,t);let n={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ri,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let s=new Gt(n,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];let a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let n=0,s=this.textures.length;n<s;n++)this.textures[n].image.width=e,this.textures[n].image.height=t,this.textures[n].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,n=e.textures.length;i<n;i++)this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Ts(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Yi=class extends bo{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Es=class extends Gt{constructor(e=null,t=1,i=1,n=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:n},this.magFilter=Xt,this.minFilter=Xt,this.wrapR=lr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},So=class extends Gt{constructor(e=null,t=1,i=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:n},this.magFilter=Xt,this.minFilter=Xt,this.wrapR=lr,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Di=class{constructor(e=0,t=0,i=0,n=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=n}static slerpFlat(e,t,i,n,s,a,o){let l=i[n+0],c=i[n+1],d=i[n+2],u=i[n+3],h=s[a+0],p=s[a+1],g=s[a+2],v=s[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u;return}if(o===1){e[t+0]=h,e[t+1]=p,e[t+2]=g,e[t+3]=v;return}if(u!==v||l!==h||c!==p||d!==g){let m=1-o,f=l*h+c*p+d*g+u*v,M=f>=0?1:-1,w=1-f*f;if(w>Number.EPSILON){let D=Math.sqrt(w),A=Math.atan2(D,f*M);m=Math.sin(m*A)/D,o=Math.sin(o*A)/D}let _=o*M;if(l=l*m+h*_,c=c*m+p*_,d=d*m+g*_,u=u*m+v*_,m===1-o){let D=1/Math.sqrt(l*l+c*c+d*d+u*u);l*=D,c*=D,d*=D,u*=D}}e[t]=l,e[t+1]=c,e[t+2]=d,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,n,s,a){let o=i[n],l=i[n+1],c=i[n+2],d=i[n+3],u=s[a],h=s[a+1],p=s[a+2],g=s[a+3];return e[t]=o*g+d*u+l*p-c*h,e[t+1]=l*g+d*h+c*u-o*p,e[t+2]=c*g+d*p+o*h-l*u,e[t+3]=d*g-o*u-l*h-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,n){return this._x=e,this._y=t,this._z=i,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,n=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),d=o(n/2),u=o(s/2),h=l(i/2),p=l(n/2),g=l(s/2);switch(a){case"XYZ":this._x=h*d*u+c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u-h*p*g;break;case"YXZ":this._x=h*d*u+c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u+h*p*g;break;case"ZXY":this._x=h*d*u-c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u-h*p*g;break;case"ZYX":this._x=h*d*u-c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u+h*p*g;break;case"YZX":this._x=h*d*u+c*p*g,this._y=c*p*u+h*d*g,this._z=c*d*g-h*p*u,this._w=c*d*u-h*p*g;break;case"XZY":this._x=h*d*u-c*p*g,this._y=c*p*u-h*d*g,this._z=c*d*g+h*p*u,this._w=c*d*u+h*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,n=Math.sin(i);return this._x=e.x*n,this._y=e.y*n,this._z=e.z*n,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],n=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],d=t[6],u=t[10],h=i+o+u;if(h>0){let p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(d-l)*p,this._y=(s-c)*p,this._z=(a-n)*p}else if(i>o&&i>u){let p=2*Math.sqrt(1+i-o-u);this._w=(d-l)/p,this._x=.25*p,this._y=(n+a)/p,this._z=(s+c)/p}else if(o>u){let p=2*Math.sqrt(1+o-i-u);this._w=(s-c)/p,this._x=(n+a)/p,this._y=.25*p,this._z=(l+d)/p}else{let p=2*Math.sqrt(1+u-i-o);this._w=(a-n)/p,this._x=(s+c)/p,this._y=(l+d)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(jt(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let n=Math.min(1,t/i);return this.slerp(e,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,n=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,d=t._w;return this._x=i*d+a*o+n*c-s*l,this._y=n*d+a*l+s*o-i*c,this._z=s*d+a*c+i*l-n*o,this._w=a*d-i*o-n*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,n=this._y,s=this._z,a=this._w,o=a*e._w+i*e._x+n*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=i,this._y=n,this._z=s,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*i+t*this._x,this._y=p*n+t*this._y,this._z=p*s+t*this._z,this.normalize(),this}let c=Math.sqrt(l),d=Math.atan2(c,o),u=Math.sin((1-t)*d)/c,h=Math.sin(t*d)/c;return this._w=a*u+this._w*h,this._x=i*u+this._x*h,this._y=n*u+this._y*h,this._z=s*u+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),n=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(n*Math.sin(e),n*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},z=class r{constructor(e=0,t=0,i=0){r.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(pu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(pu.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,n=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*n,this.y=s[1]*t+s[4]*i+s[7]*n,this.z=s[2]*t+s[5]*i+s[8]*n,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,n=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*n+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*n+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*n+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*n+s[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,n=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*n-o*i),d=2*(o*t-s*n),u=2*(s*i-a*t);return this.x=t+l*c+a*u-o*d,this.y=i+l*d+o*c-s*u,this.z=n+l*u+s*d-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,n=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*n,this.y=s[1]*t+s[5]*i+s[9]*n,this.z=s[2]*t+s[6]*i+s[10]*n,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,n=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=n*l-s*o,this.y=s*a-i*l,this.z=i*o-n*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return wl.copy(this).projectOnVector(e),this.sub(wl)}reflect(e){return this.sub(wl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(jt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,n=this.z-e.z;return t*t+i*i+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let n=Math.sin(t)*e;return this.x=n*Math.sin(i),this.y=Math.cos(t)*e,this.z=n*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),n=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=n,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},wl=new z,pu=new Di,bi=class{constructor(e=new z(1/0,1/0,1/0),t=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(wi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(wi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=wi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,wi):wi.fromBufferAttribute(s,a),wi.applyMatrix4(e.matrixWorld),this.expandByPoint(wi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),na.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),na.copy(i.boundingBox)),na.applyMatrix4(e.matrixWorld),this.union(na)}let n=e.children;for(let s=0,a=n.length;s<a;s++)this.expandByObject(n[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,wi),wi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Qn),sa.subVectors(this.max,Qn),fn.subVectors(e.a,Qn),gn.subVectors(e.b,Qn),vn.subVectors(e.c,Qn),Sr.subVectors(gn,fn),wr.subVectors(vn,gn),Br.subVectors(fn,vn);let t=[0,-Sr.z,Sr.y,0,-wr.z,wr.y,0,-Br.z,Br.y,Sr.z,0,-Sr.x,wr.z,0,-wr.x,Br.z,0,-Br.x,-Sr.y,Sr.x,0,-wr.y,wr.x,0,-Br.y,Br.x,0];return!Ml(t,fn,gn,vn,sa)||(t=[1,0,0,0,1,0,0,0,1],!Ml(t,fn,gn,vn,sa))?!1:(aa.crossVectors(Sr,wr),t=[aa.x,aa.y,aa.z],Ml(t,fn,gn,vn,sa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,wi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(wi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(er[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),er[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),er[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),er[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),er[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),er[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),er[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),er[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(er),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},er=[new z,new z,new z,new z,new z,new z,new z,new z],wi=new z,na=new bi,fn=new z,gn=new z,vn=new z,Sr=new z,wr=new z,Br=new z,Qn=new z,sa=new z,aa=new z,Hr=new z;function Ml(r,e,t,i,n){for(let s=0,a=r.length-3;s<=a;s+=3){Hr.fromArray(r,s);let o=n.x*Math.abs(Hr.x)+n.y*Math.abs(Hr.y)+n.z*Math.abs(Hr.z),l=e.dot(Hr),c=t.dot(Hr),d=i.dot(Hr);if(Math.max(-Math.max(l,c,d),Math.min(l,c,d))>o)return!1}return!0}var nf=new bi,es=new z,Tl=new z,hi=class{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):nf.setFromPoints(e).getCenter(i);let n=0;for(let s=0,a=e.length;s<a;s++)n=Math.max(n,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(n),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;es.subVectors(e,this.center);let t=es.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),n=(i-this.radius)*.5;this.center.addScaledVector(es,n/i),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Tl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(es.copy(e.center).add(Tl)),this.expandByPoint(es.copy(e.center).sub(Tl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},tr=new z,El=new z,oa=new z,Mr=new z,Al=new z,la=new z,Rl=new z,sn=class{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,tr)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=tr.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(tr.copy(this.origin).addScaledVector(this.direction,t),tr.distanceToSquared(e))}distanceSqToSegment(e,t,i,n){El.copy(e).add(t).multiplyScalar(.5),oa.copy(t).sub(e).normalize(),Mr.copy(this.origin).sub(El);let s=e.distanceTo(t)*.5,a=-this.direction.dot(oa),o=Mr.dot(this.direction),l=-Mr.dot(oa),c=Mr.lengthSq(),d=Math.abs(1-a*a),u,h,p,g;if(d>0)if(u=a*l-o,h=a*o-l,g=s*d,u>=0)if(h>=-g)if(h<=g){let v=1/d;u*=v,h*=v,p=u*(u+a*h+2*o)+h*(a*u+h+2*l)+c}else h=s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;else h=-s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;else h<=-g?(u=Math.max(0,-(-a*s+o)),h=u>0?-s:Math.min(Math.max(-s,-l),s),p=-u*u+h*(h+2*l)+c):h<=g?(u=0,h=Math.min(Math.max(-s,-l),s),p=h*(h+2*l)+c):(u=Math.max(0,-(a*s+o)),h=u>0?s:Math.min(Math.max(-s,-l),s),p=-u*u+h*(h+2*l)+c);else h=a>0?-s:s,u=Math.max(0,-(a*h+o)),p=-u*u+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),n&&n.copy(El).addScaledVector(oa,h),p}intersectSphere(e,t){tr.subVectors(e.center,this.origin);let i=tr.dot(this.direction),n=tr.dot(tr)-i*i,s=e.radius*e.radius;if(n>s)return null;let a=Math.sqrt(s-n),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,n,s,a,o,l,c=1/this.direction.x,d=1/this.direction.y,u=1/this.direction.z,h=this.origin;return c>=0?(i=(e.min.x-h.x)*c,n=(e.max.x-h.x)*c):(i=(e.max.x-h.x)*c,n=(e.min.x-h.x)*c),d>=0?(s=(e.min.y-h.y)*d,a=(e.max.y-h.y)*d):(s=(e.max.y-h.y)*d,a=(e.min.y-h.y)*d),i>a||s>n||((s>i||isNaN(i))&&(i=s),(a<n||isNaN(n))&&(n=a),u>=0?(o=(e.min.z-h.z)*u,l=(e.max.z-h.z)*u):(o=(e.max.z-h.z)*u,l=(e.min.z-h.z)*u),i>l||o>n)||((o>i||i!==i)&&(i=o),(l<n||n!==n)&&(n=l),n<0)?null:this.at(i>=0?i:n,t)}intersectsBox(e){return this.intersectBox(e,tr)!==null}intersectTriangle(e,t,i,n,s){Al.subVectors(t,e),la.subVectors(i,e),Rl.crossVectors(Al,la);let a=this.direction.dot(Rl),o;if(a>0){if(n)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Mr.subVectors(this.origin,e);let l=o*this.direction.dot(la.crossVectors(Mr,la));if(l<0)return null;let c=o*this.direction.dot(Al.cross(Mr));if(c<0||l+c>a)return null;let d=-o*Mr.dot(Rl);return d<0?null:this.at(d/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},We=class r{constructor(e,t,i,n,s,a,o,l,c,d,u,h,p,g,v,m){r.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,n,s,a,o,l,c,d,u,h,p,g,v,m)}set(e,t,i,n,s,a,o,l,c,d,u,h,p,g,v,m){let f=this.elements;return f[0]=e,f[4]=t,f[8]=i,f[12]=n,f[1]=s,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=d,f[10]=u,f[14]=h,f[3]=p,f[7]=g,f[11]=v,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new r().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,n=1/xn.setFromMatrixColumn(e,0).length(),s=1/xn.setFromMatrixColumn(e,1).length(),a=1/xn.setFromMatrixColumn(e,2).length();return t[0]=i[0]*n,t[1]=i[1]*n,t[2]=i[2]*n,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,n=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(n),c=Math.sin(n),d=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){let h=a*d,p=a*u,g=o*d,v=o*u;t[0]=l*d,t[4]=-l*u,t[8]=c,t[1]=p+g*c,t[5]=h-v*c,t[9]=-o*l,t[2]=v-h*c,t[6]=g+p*c,t[10]=a*l}else if(e.order==="YXZ"){let h=l*d,p=l*u,g=c*d,v=c*u;t[0]=h+v*o,t[4]=g*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*d,t[9]=-o,t[2]=p*o-g,t[6]=v+h*o,t[10]=a*l}else if(e.order==="ZXY"){let h=l*d,p=l*u,g=c*d,v=c*u;t[0]=h-v*o,t[4]=-a*u,t[8]=g+p*o,t[1]=p+g*o,t[5]=a*d,t[9]=v-h*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let h=a*d,p=a*u,g=o*d,v=o*u;t[0]=l*d,t[4]=g*c-p,t[8]=h*c+v,t[1]=l*u,t[5]=v*c+h,t[9]=p*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let h=a*l,p=a*c,g=o*l,v=o*c;t[0]=l*d,t[4]=v-h*u,t[8]=g*u+p,t[1]=u,t[5]=a*d,t[9]=-o*d,t[2]=-c*d,t[6]=p*u+g,t[10]=h-v*u}else if(e.order==="XZY"){let h=a*l,p=a*c,g=o*l,v=o*c;t[0]=l*d,t[4]=-u,t[8]=c*d,t[1]=h*u+v,t[5]=a*d,t[9]=p*u-g,t[2]=g*u-p,t[6]=o*d,t[10]=v*u+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(sf,e,af)}lookAt(e,t,i){let n=this.elements;return li.subVectors(e,t),li.lengthSq()===0&&(li.z=1),li.normalize(),Tr.crossVectors(i,li),Tr.lengthSq()===0&&(Math.abs(i.z)===1?li.x+=1e-4:li.z+=1e-4,li.normalize(),Tr.crossVectors(i,li)),Tr.normalize(),ca.crossVectors(li,Tr),n[0]=Tr.x,n[4]=ca.x,n[8]=li.x,n[1]=Tr.y,n[5]=ca.y,n[9]=li.y,n[2]=Tr.z,n[6]=ca.z,n[10]=li.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,n=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],d=i[1],u=i[5],h=i[9],p=i[13],g=i[2],v=i[6],m=i[10],f=i[14],M=i[3],w=i[7],_=i[11],D=i[15],A=n[0],R=n[4],T=n[8],b=n[12],x=n[1],C=n[5],U=n[9],V=n[13],G=n[2],P=n[6],L=n[10],H=n[14],F=n[3],K=n[7],ne=n[11],ce=n[15];return s[0]=a*A+o*x+l*G+c*F,s[4]=a*R+o*C+l*P+c*K,s[8]=a*T+o*U+l*L+c*ne,s[12]=a*b+o*V+l*H+c*ce,s[1]=d*A+u*x+h*G+p*F,s[5]=d*R+u*C+h*P+p*K,s[9]=d*T+u*U+h*L+p*ne,s[13]=d*b+u*V+h*H+p*ce,s[2]=g*A+v*x+m*G+f*F,s[6]=g*R+v*C+m*P+f*K,s[10]=g*T+v*U+m*L+f*ne,s[14]=g*b+v*V+m*H+f*ce,s[3]=M*A+w*x+_*G+D*F,s[7]=M*R+w*C+_*P+D*K,s[11]=M*T+w*U+_*L+D*ne,s[15]=M*b+w*V+_*H+D*ce,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],n=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],d=e[2],u=e[6],h=e[10],p=e[14],g=e[3],v=e[7],m=e[11],f=e[15];return g*(+s*l*u-n*c*u-s*o*h+i*c*h+n*o*p-i*l*p)+v*(+t*l*p-t*c*h+s*a*h-n*a*p+n*c*d-s*l*d)+m*(+t*c*u-t*o*p-s*a*u+i*a*p+s*o*d-i*c*d)+f*(-n*o*d-t*l*u+t*o*h+n*a*u-i*a*h+i*l*d)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let n=this.elements;return e.isVector3?(n[12]=e.x,n[13]=e.y,n[14]=e.z):(n[12]=e,n[13]=t,n[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],n=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],d=e[8],u=e[9],h=e[10],p=e[11],g=e[12],v=e[13],m=e[14],f=e[15],M=u*m*c-v*h*c+v*l*p-o*m*p-u*l*f+o*h*f,w=g*h*c-d*m*c-g*l*p+a*m*p+d*l*f-a*h*f,_=d*v*c-g*u*c+g*o*p-a*v*p-d*o*f+a*u*f,D=g*u*l-d*v*l-g*o*h+a*v*h+d*o*m-a*u*m,A=t*M+i*w+n*_+s*D;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let R=1/A;return e[0]=M*R,e[1]=(v*h*s-u*m*s-v*n*p+i*m*p+u*n*f-i*h*f)*R,e[2]=(o*m*s-v*l*s+v*n*c-i*m*c-o*n*f+i*l*f)*R,e[3]=(u*l*s-o*h*s-u*n*c+i*h*c+o*n*p-i*l*p)*R,e[4]=w*R,e[5]=(d*m*s-g*h*s+g*n*p-t*m*p-d*n*f+t*h*f)*R,e[6]=(g*l*s-a*m*s-g*n*c+t*m*c+a*n*f-t*l*f)*R,e[7]=(a*h*s-d*l*s+d*n*c-t*h*c-a*n*p+t*l*p)*R,e[8]=_*R,e[9]=(g*u*s-d*v*s-g*i*p+t*v*p+d*i*f-t*u*f)*R,e[10]=(a*v*s-g*o*s+g*i*c-t*v*c-a*i*f+t*o*f)*R,e[11]=(d*o*s-a*u*s-d*i*c+t*u*c+a*i*p-t*o*p)*R,e[12]=D*R,e[13]=(d*v*n-g*u*n+g*i*h-t*v*h-d*i*m+t*u*m)*R,e[14]=(g*o*n-a*v*n-g*i*l+t*v*l+a*i*m-t*o*m)*R,e[15]=(a*u*n-d*o*n+d*i*l-t*u*l-a*i*h+t*o*h)*R,this}scale(e){let t=this.elements,i=e.x,n=e.y,s=e.z;return t[0]*=i,t[4]*=n,t[8]*=s,t[1]*=i,t[5]*=n,t[9]*=s,t[2]*=i,t[6]*=n,t[10]*=s,t[3]*=i,t[7]*=n,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],n=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,n))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),n=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,d=s*o;return this.set(c*a+i,c*o-n*l,c*l+n*o,0,c*o+n*l,d*o+i,d*l-n*a,0,c*l-n*o,d*l+n*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,n,s,a){return this.set(1,i,s,0,e,1,a,0,t,n,1,0,0,0,0,1),this}compose(e,t,i){let n=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,d=a+a,u=o+o,h=s*c,p=s*d,g=s*u,v=a*d,m=a*u,f=o*u,M=l*c,w=l*d,_=l*u,D=i.x,A=i.y,R=i.z;return n[0]=(1-(v+f))*D,n[1]=(p+_)*D,n[2]=(g-w)*D,n[3]=0,n[4]=(p-_)*A,n[5]=(1-(h+f))*A,n[6]=(m+M)*A,n[7]=0,n[8]=(g+w)*R,n[9]=(m-M)*R,n[10]=(1-(h+v))*R,n[11]=0,n[12]=e.x,n[13]=e.y,n[14]=e.z,n[15]=1,this}decompose(e,t,i){let n=this.elements,s=xn.set(n[0],n[1],n[2]).length(),a=xn.set(n[4],n[5],n[6]).length(),o=xn.set(n[8],n[9],n[10]).length();this.determinant()<0&&(s=-s),e.x=n[12],e.y=n[13],e.z=n[14],Mi.copy(this);let l=1/s,c=1/a,d=1/o;return Mi.elements[0]*=l,Mi.elements[1]*=l,Mi.elements[2]*=l,Mi.elements[4]*=c,Mi.elements[5]*=c,Mi.elements[6]*=c,Mi.elements[8]*=d,Mi.elements[9]*=d,Mi.elements[10]*=d,t.setFromRotationMatrix(Mi),i.x=s,i.y=a,i.z=o,this}makePerspective(e,t,i,n,s,a,o=ji){let l=this.elements,c=2*s/(t-e),d=2*s/(i-n),u=(t+e)/(t-e),h=(i+n)/(i-n),p,g;if(o===ji)p=-(a+s)/(a-s),g=-2*a*s/(a-s);else if(o===ws)p=-a/(a-s),g=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,n,s,a,o=ji){let l=this.elements,c=1/(t-e),d=1/(i-n),u=1/(a-s),h=(t+e)*c,p=(i+n)*d,g,v;if(o===ji)g=(a+s)*u,v=-2*u;else if(o===ws)g=s*u,v=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*d,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let n=0;n<16;n++)if(t[n]!==i[n])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},xn=new z,Mi=new We,sf=new z(0,0,0),af=new z(1,1,1),Tr=new z,ca=new z,li=new z,mu=new We,fu=new Di,Ui=class r{constructor(e=0,t=0,i=0,n=r.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=n}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,n=this._order){return this._x=e,this._y=t,this._z=i,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let n=e.elements,s=n[0],a=n[4],o=n[8],l=n[1],c=n[5],d=n[9],u=n[2],h=n[6],p=n[10];switch(t){case"XYZ":this._y=Math.asin(jt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-d,p),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-jt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(jt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-jt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(jt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-jt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-d,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return mu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(mu,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return fu.setFromEuler(this),this.setFromQuaternion(fu,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ui.DEFAULT_ORDER="XYZ";var As=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},of=0,gu=new z,_n=new Di,ir=new We,da=new z,ts=new z,lf=new z,cf=new Di,vu=new z(1,0,0),xu=new z(0,1,0),_u=new z(0,0,1),yu={type:"added"},df={type:"removed"},yn={type:"childadded",child:null},Cl={type:"childremoved",child:null},Tt=class r extends pr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:of++}),this.uuid=Pi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=r.DEFAULT_UP.clone();let e=new z,t=new Ui,i=new Di,n=new z(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new We},normalMatrix:{value:new Ge}}),this.matrix=new We,this.matrixWorld=new We,this.matrixAutoUpdate=r.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=r.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new As,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return _n.setFromAxisAngle(e,t),this.quaternion.multiply(_n),this}rotateOnWorldAxis(e,t){return _n.setFromAxisAngle(e,t),this.quaternion.premultiply(_n),this}rotateX(e){return this.rotateOnAxis(vu,e)}rotateY(e){return this.rotateOnAxis(xu,e)}rotateZ(e){return this.rotateOnAxis(_u,e)}translateOnAxis(e,t){return gu.copy(e).applyQuaternion(this.quaternion),this.position.add(gu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(vu,e)}translateY(e){return this.translateOnAxis(xu,e)}translateZ(e){return this.translateOnAxis(_u,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ir.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?da.copy(e):da.set(e,t,i);let n=this.parent;this.updateWorldMatrix(!0,!1),ts.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ir.lookAt(ts,da,this.up):ir.lookAt(da,ts,this.up),this.quaternion.setFromRotationMatrix(ir),n&&(ir.extractRotation(n.matrixWorld),_n.setFromRotationMatrix(ir),this.quaternion.premultiply(_n.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(yu),yn.child=e,this.dispatchEvent(yn),yn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(df),Cl.child=e,this.dispatchEvent(Cl),Cl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ir.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ir.multiply(e.parent.matrixWorld)),e.applyMatrix4(ir),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(yu),yn.child=e,this.dispatchEvent(yn),yn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,n=this.children.length;i<n;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let n=this.children;for(let s=0,a=n.length;s<a;s++)n[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ts,e,lf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ts,cf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let n=this.children;for(let s=0,a=n.length;s<a;s++)n[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.visibility=this._visibility,n.active=this._active,n.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),n.maxInstanceCount=this._maxInstanceCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.geometryCount=this._geometryCount,n.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(n.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(n.boundingSphere={center:n.boundingSphere.center.toArray(),radius:n.boundingSphere.radius}),this.boundingBox!==null&&(n.boundingBox={min:n.boundingBox.min.toArray(),max:n.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,d=l.length;c<d;c++){let u=l[c];s(e.shapes,u)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));n.material=o}else n.material=s(e.materials,this.material);if(this.children.length>0){n.children=[];for(let o=0;o<this.children.length;o++)n.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){n.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];n.animations.push(s(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),d=a(e.images),u=a(e.shapes),h=a(e.skeletons),p=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),d.length>0&&(i.images=d),u.length>0&&(i.shapes=u),h.length>0&&(i.skeletons=h),p.length>0&&(i.animations=p),g.length>0&&(i.nodes=g)}return i.object=n,i;function a(o){let l=[];for(let c in o){let d=o[c];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let n=e.children[i];this.add(n.clone())}return this}};Tt.DEFAULT_UP=new z(0,1,0);Tt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ti=new z,rr=new z,Ll=new z,nr=new z,bn=new z,Sn=new z,bu=new z,Pl=new z,Il=new z,Dl=new z,Ul=new ot,Nl=new ot,kl=new ot,Lr=class r{constructor(e=new z,t=new z,i=new z){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,n){n.subVectors(i,t),Ti.subVectors(e,t),n.cross(Ti);let s=n.lengthSq();return s>0?n.multiplyScalar(1/Math.sqrt(s)):n.set(0,0,0)}static getBarycoord(e,t,i,n,s){Ti.subVectors(n,t),rr.subVectors(i,t),Ll.subVectors(e,t);let a=Ti.dot(Ti),o=Ti.dot(rr),l=Ti.dot(Ll),c=rr.dot(rr),d=rr.dot(Ll),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;let h=1/u,p=(c*l-o*d)*h,g=(a*d-o*l)*h;return s.set(1-p-g,g,p)}static containsPoint(e,t,i,n){return this.getBarycoord(e,t,i,n,nr)===null?!1:nr.x>=0&&nr.y>=0&&nr.x+nr.y<=1}static getInterpolation(e,t,i,n,s,a,o,l){return this.getBarycoord(e,t,i,n,nr)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,nr.x),l.addScaledVector(a,nr.y),l.addScaledVector(o,nr.z),l)}static getInterpolatedAttribute(e,t,i,n,s,a){return Ul.setScalar(0),Nl.setScalar(0),kl.setScalar(0),Ul.fromBufferAttribute(e,t),Nl.fromBufferAttribute(e,i),kl.fromBufferAttribute(e,n),a.setScalar(0),a.addScaledVector(Ul,s.x),a.addScaledVector(Nl,s.y),a.addScaledVector(kl,s.z),a}static isFrontFacing(e,t,i,n){return Ti.subVectors(i,t),rr.subVectors(e,t),Ti.cross(rr).dot(n)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,n){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[n]),this}setFromAttributeAndIndices(e,t,i,n){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ti.subVectors(this.c,this.b),rr.subVectors(this.a,this.b),Ti.cross(rr).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return r.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return r.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,n,s){return r.getInterpolation(e,this.a,this.b,this.c,t,i,n,s)}containsPoint(e){return r.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return r.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,n=this.b,s=this.c,a,o;bn.subVectors(n,i),Sn.subVectors(s,i),Pl.subVectors(e,i);let l=bn.dot(Pl),c=Sn.dot(Pl);if(l<=0&&c<=0)return t.copy(i);Il.subVectors(e,n);let d=bn.dot(Il),u=Sn.dot(Il);if(d>=0&&u<=d)return t.copy(n);let h=l*u-d*c;if(h<=0&&l>=0&&d<=0)return a=l/(l-d),t.copy(i).addScaledVector(bn,a);Dl.subVectors(e,s);let p=bn.dot(Dl),g=Sn.dot(Dl);if(g>=0&&p<=g)return t.copy(s);let v=p*c-l*g;if(v<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(i).addScaledVector(Sn,o);let m=d*g-p*u;if(m<=0&&u-d>=0&&p-g>=0)return bu.subVectors(s,n),o=(u-d)/(u-d+(p-g)),t.copy(n).addScaledVector(bu,o);let f=1/(m+v+h);return a=v*f,o=h*f,t.copy(i).addScaledVector(bn,a).addScaledVector(Sn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Ap={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Er={h:0,s:0,l:0},ua={h:0,s:0,l:0};function Ol(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+(e-r)*6*t:t<1/2?e:t<2/3?r+(e-r)*6*(2/3-t):r}var Fe=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let n=e;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ft){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,et.toWorkingColorSpace(this,t),this}setRGB(e,t,i,n=et.workingColorSpace){return this.r=e,this.g=t,this.b=i,et.toWorkingColorSpace(this,n),this}setHSL(e,t,i,n=et.workingColorSpace){if(e=Od(e,1),t=jt(t,0,1),i=jt(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=Ol(a,s,e+1/3),this.g=Ol(a,s,e),this.b=Ol(a,s,e-1/3)}return et.toWorkingColorSpace(this,n),this}setStyle(e,t=Ft){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=n[1],o=n[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=n[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ft){let i=Ap[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=hr(e.r),this.g=hr(e.g),this.b=hr(e.b),this}copyLinearToSRGB(e){return this.r=In(e.r),this.g=In(e.g),this.b=In(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ft){return et.fromWorkingColorSpace(Wt.copy(this),e),Math.round(jt(Wt.r*255,0,255))*65536+Math.round(jt(Wt.g*255,0,255))*256+Math.round(jt(Wt.b*255,0,255))}getHexString(e=Ft){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=et.workingColorSpace){et.fromWorkingColorSpace(Wt.copy(this),t);let i=Wt.r,n=Wt.g,s=Wt.b,a=Math.max(i,n,s),o=Math.min(i,n,s),l,c,d=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=d<=.5?u/(a+o):u/(2-a-o),a){case i:l=(n-s)/u+(n<s?6:0);break;case n:l=(s-i)/u+2;break;case s:l=(i-n)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=d,e}getRGB(e,t=et.workingColorSpace){return et.fromWorkingColorSpace(Wt.copy(this),t),e.r=Wt.r,e.g=Wt.g,e.b=Wt.b,e}getStyle(e=Ft){et.fromWorkingColorSpace(Wt.copy(this),e);let t=Wt.r,i=Wt.g,n=Wt.b;return e!==Ft?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(n*255)})`}offsetHSL(e,t,i){return this.getHSL(Er),this.setHSL(Er.h+e,Er.s+t,Er.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Er),e.getHSL(ua);let i=_s(Er.h,ua.h,t),n=_s(Er.s,ua.s,t),s=_s(Er.l,ua.l,t);return this.setHSL(i,n,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,n=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*n,this.g=s[1]*t+s[4]*i+s[7]*n,this.b=s[2]*t+s[5]*i+s[8]*n,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Wt=new Fe;Fe.NAMES=Ap;var uf=0,ui=class extends pr{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:uf++}),this.uuid=Pi(),this.name="",this.blending=Kr,this.side=qi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ua,this.blendDst=Na,this.blendEquation=Cr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Fe(0,0,0),this.blendAlpha=0,this.depthFunc=Jr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=_c,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=jr,this.stencilZFail=jr,this.stencilZPass=jr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let n=this[t];if(n===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(i):n&&n.isVector3&&i&&i.isVector3?n.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Kr&&(i.blending=this.blending),this.side!==qi&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Ua&&(i.blendSrc=this.blendSrc),this.blendDst!==Na&&(i.blendDst=this.blendDst),this.blendEquation!==Cr&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Jr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==_c&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==jr&&(i.stencilFail=this.stencilFail),this.stencilZFail!==jr&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==jr&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function n(s){let a=[];for(let o in s){let l=s[o];delete l.metadata,a.push(l)}return a}if(t){let s=n(e.textures),a=n(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let n=t.length;i=new Array(n);for(let s=0;s!==n;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Ci=class extends ui{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new Fe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ui,this.combine=bd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Pt=new z,ha=new it,Ht=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=_o,this.updateRanges=[],this.gpuType=_i,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let n=0,s=this.itemSize;n<s;n++)this.array[e+n]=t.array[i+n];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ha.fromBufferAttribute(this,t),ha.applyMatrix3(e),this.setXY(t,ha.x,ha.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Pt.fromBufferAttribute(this,t),Pt.applyMatrix3(e),this.setXYZ(t,Pt.x,Pt.y,Pt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Pt.fromBufferAttribute(this,t),Pt.applyMatrix4(e),this.setXYZ(t,Pt.x,Pt.y,Pt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Pt.fromBufferAttribute(this,t),Pt.applyNormalMatrix(e),this.setXYZ(t,Pt.x,Pt.y,Pt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Pt.fromBufferAttribute(this,t),Pt.transformDirection(e),this.setXYZ(t,Pt.x,Pt.y,Pt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Ri(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=ut(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ri(t,this.array)),t}setX(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ri(t,this.array)),t}setY(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ri(t,this.array)),t}setZ(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ri(t,this.array)),t}setW(e,t){return this.normalized&&(t=ut(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),i=ut(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,n){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),i=ut(i,this.array),n=ut(n,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=n,this}setXYZW(e,t,i,n,s){return e*=this.itemSize,this.normalized&&(t=ut(t,this.array),i=ut(i,this.array),n=ut(n,this.array),s=ut(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=n,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==_o&&(e.usage=this.usage),e}},Rs=class extends Ht{constructor(e,t,i){super(new Uint16Array(e),t,i)}},Cs=class extends Ht{constructor(e,t,i){super(new Uint32Array(e),t,i)}},yi=class extends Ht{constructor(e,t,i){super(new Float32Array(e),t,i)}},hf=0,vi=new We,Fl=new Tt,wn=new z,ci=new bi,is=new bi,Ot=new z,Ni=class r extends pr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:hf++}),this.uuid=Pi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Tp(e)?Cs:Rs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Ge().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return vi.makeRotationFromQuaternion(e),this.applyMatrix4(vi),this}rotateX(e){return vi.makeRotationX(e),this.applyMatrix4(vi),this}rotateY(e){return vi.makeRotationY(e),this.applyMatrix4(vi),this}rotateZ(e){return vi.makeRotationZ(e),this.applyMatrix4(vi),this}translate(e,t,i){return vi.makeTranslation(e,t,i),this.applyMatrix4(vi),this}scale(e,t,i){return vi.makeScale(e,t,i),this.applyMatrix4(vi),this}lookAt(e){return Fl.lookAt(e),Fl.updateMatrix(),this.applyMatrix4(Fl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(wn).negate(),this.translate(wn.x,wn.y,wn.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let n=0,s=e.length;n<s;n++){let a=e[n];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new yi(i,3))}else{for(let i=0,n=t.count;i<n;i++){let s=e[i];t.setXYZ(i,s.x,s.y,s.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new bi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,n=t.length;i<n;i++){let s=t[i];ci.setFromBufferAttribute(s),this.morphTargetsRelative?(Ot.addVectors(this.boundingBox.min,ci.min),this.boundingBox.expandByPoint(Ot),Ot.addVectors(this.boundingBox.max,ci.max),this.boundingBox.expandByPoint(Ot)):(this.boundingBox.expandByPoint(ci.min),this.boundingBox.expandByPoint(ci.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new hi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(e){let i=this.boundingSphere.center;if(ci.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];is.setFromBufferAttribute(o),this.morphTargetsRelative?(Ot.addVectors(ci.min,is.min),ci.expandByPoint(Ot),Ot.addVectors(ci.max,is.max),ci.expandByPoint(Ot)):(ci.expandByPoint(is.min),ci.expandByPoint(is.max))}ci.getCenter(i);let n=0;for(let s=0,a=e.count;s<a;s++)Ot.fromBufferAttribute(e,s),n=Math.max(n,i.distanceToSquared(Ot));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],l=this.morphTargetsRelative;for(let c=0,d=o.count;c<d;c++)Ot.fromBufferAttribute(o,c),l&&(wn.fromBufferAttribute(e,c),Ot.add(wn)),n=Math.max(n,i.distanceToSquared(Ot))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,n=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ht(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let T=0;T<i.count;T++)o[T]=new z,l[T]=new z;let c=new z,d=new z,u=new z,h=new it,p=new it,g=new it,v=new z,m=new z;function f(T,b,x){c.fromBufferAttribute(i,T),d.fromBufferAttribute(i,b),u.fromBufferAttribute(i,x),h.fromBufferAttribute(s,T),p.fromBufferAttribute(s,b),g.fromBufferAttribute(s,x),d.sub(c),u.sub(c),p.sub(h),g.sub(h);let C=1/(p.x*g.y-g.x*p.y);isFinite(C)&&(v.copy(d).multiplyScalar(g.y).addScaledVector(u,-p.y).multiplyScalar(C),m.copy(u).multiplyScalar(p.x).addScaledVector(d,-g.x).multiplyScalar(C),o[T].add(v),o[b].add(v),o[x].add(v),l[T].add(m),l[b].add(m),l[x].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let T=0,b=M.length;T<b;++T){let x=M[T],C=x.start,U=x.count;for(let V=C,G=C+U;V<G;V+=3)f(e.getX(V+0),e.getX(V+1),e.getX(V+2))}let w=new z,_=new z,D=new z,A=new z;function R(T){D.fromBufferAttribute(n,T),A.copy(D);let b=o[T];w.copy(b),w.sub(D.multiplyScalar(D.dot(b))).normalize(),_.crossVectors(A,b);let x=_.dot(l[T])<0?-1:1;a.setXYZW(T,w.x,w.y,w.z,x)}for(let T=0,b=M.length;T<b;++T){let x=M[T],C=x.start,U=x.count;for(let V=C,G=C+U;V<G;V+=3)R(e.getX(V+0)),R(e.getX(V+1)),R(e.getX(V+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Ht(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,p=i.count;h<p;h++)i.setXYZ(h,0,0,0);let n=new z,s=new z,a=new z,o=new z,l=new z,c=new z,d=new z,u=new z;if(e)for(let h=0,p=e.count;h<p;h+=3){let g=e.getX(h+0),v=e.getX(h+1),m=e.getX(h+2);n.fromBufferAttribute(t,g),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,m),d.subVectors(a,s),u.subVectors(n,s),d.cross(u),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,v),c.fromBufferAttribute(i,m),o.add(d),l.add(d),c.add(d),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(v,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,p=t.count;h<p;h+=3)n.fromBufferAttribute(t,h+0),s.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),d.subVectors(a,s),u.subVectors(n,s),d.cross(u),i.setXYZ(h+0,d.x,d.y,d.z),i.setXYZ(h+1,d.x,d.y,d.z),i.setXYZ(h+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Ot.fromBufferAttribute(e,t),Ot.normalize(),e.setXYZ(t,Ot.x,Ot.y,Ot.z)}toNonIndexed(){function e(o,l){let c=o.array,d=o.itemSize,u=o.normalized,h=new c.constructor(l.length*d),p=0,g=0;for(let v=0,m=l.length;v<m;v++){o.isInterleavedBufferAttribute?p=l[v]*o.data.stride+o.offset:p=l[v]*d;for(let f=0;f<d;f++)h[g++]=c[p++]}return new Ht(h,d,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new r,i=this.index.array,n=this.attributes;for(let o in n){let l=n[o],c=e(l,i);t.setAttribute(o,c)}let s=this.morphAttributes;for(let o in s){let l=[],c=s[o];for(let d=0,u=c.length;d<u;d++){let h=c[d],p=e(h,i);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let n={},s=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],d=[];for(let u=0,h=c.length;u<h;u++){let p=c[u];d.push(p.toJSON(e.data))}d.length>0&&(n[l]=d,s=!0)}s&&(e.data.morphAttributes=n,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone(t));let n=e.attributes;for(let c in n){let d=n[c];this.setAttribute(c,d.clone(t))}let s=e.morphAttributes;for(let c in s){let d=[],u=s[c];for(let h=0,p=u.length;h<p;h++)d.push(u[h].clone(t));this.morphAttributes[c]=d}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,d=a.length;c<d;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Su=new We,zr=new sn,pa=new hi,wu=new z,ma=new z,fa=new z,ga=new z,Bl=new z,va=new z,Mu=new z,xa=new z,ht=class extends Tt{constructor(e=new Ni,t=new Ci){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=i.length;n<s;n++){let a=i[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}getVertexPosition(e,t){let i=this.geometry,n=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(n,e);let o=this.morphTargetInfluences;if(s&&o){va.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let d=o[l],u=s[l];d!==0&&(Bl.fromBufferAttribute(u,e),a?va.addScaledVector(Bl,d):va.addScaledVector(Bl.sub(t),d))}t.add(va)}return t}raycast(e,t){let i=this.geometry,n=this.material,s=this.matrixWorld;n!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),pa.copy(i.boundingSphere),pa.applyMatrix4(s),zr.copy(e.ray).recast(e.near),!(pa.containsPoint(zr.origin)===!1&&(zr.intersectSphere(pa,wu)===null||zr.origin.distanceToSquared(wu)>(e.far-e.near)**2))&&(Su.copy(s).invert(),zr.copy(e.ray).applyMatrix4(Su),!(i.boundingBox!==null&&zr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,zr)))}_computeIntersections(e,t,i){let n,s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,d=s.attributes.uv1,u=s.attributes.normal,h=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=h.length;g<v;g++){let m=h[g],f=a[m.materialIndex],M=Math.max(m.start,p.start),w=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let _=M,D=w;_<D;_+=3){let A=o.getX(_),R=o.getX(_+1),T=o.getX(_+2);n=_a(this,f,e,i,c,d,u,A,R,T),n&&(n.faceIndex=Math.floor(_/3),n.face.materialIndex=m.materialIndex,t.push(n))}}else{let g=Math.max(0,p.start),v=Math.min(o.count,p.start+p.count);for(let m=g,f=v;m<f;m+=3){let M=o.getX(m),w=o.getX(m+1),_=o.getX(m+2);n=_a(this,a,e,i,c,d,u,M,w,_),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,v=h.length;g<v;g++){let m=h[g],f=a[m.materialIndex],M=Math.max(m.start,p.start),w=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let _=M,D=w;_<D;_+=3){let A=_,R=_+1,T=_+2;n=_a(this,f,e,i,c,d,u,A,R,T),n&&(n.faceIndex=Math.floor(_/3),n.face.materialIndex=m.materialIndex,t.push(n))}}else{let g=Math.max(0,p.start),v=Math.min(l.count,p.start+p.count);for(let m=g,f=v;m<f;m+=3){let M=m,w=m+1,_=m+2;n=_a(this,a,e,i,c,d,u,M,w,_),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}}}};function pf(r,e,t,i,n,s,a,o){let l;if(e.side===qt?l=i.intersectTriangle(a,s,n,!0,o):l=i.intersectTriangle(n,s,a,e.side===qi,o),l===null)return null;xa.copy(o),xa.applyMatrix4(r.matrixWorld);let c=t.ray.origin.distanceTo(xa);return c<t.near||c>t.far?null:{distance:c,point:xa.clone(),object:r}}function _a(r,e,t,i,n,s,a,o,l,c){r.getVertexPosition(o,ma),r.getVertexPosition(l,fa),r.getVertexPosition(c,ga);let d=pf(r,e,t,i,ma,fa,ga,Mu);if(d){let u=new z;Lr.getBarycoord(Mu,ma,fa,ga,u),n&&(d.uv=Lr.getInterpolatedAttribute(n,o,l,c,u,new it)),s&&(d.uv1=Lr.getInterpolatedAttribute(s,o,l,c,u,new it)),a&&(d.normal=Lr.getInterpolatedAttribute(a,o,l,c,u,new z),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));let h={a:o,b:l,c,normal:new z,materialIndex:0};Lr.getNormal(ma,fa,ga,h.normal),d.face=h,d.barycoord=u}return d}var an=class r extends Ni{constructor(e=1,t=1,i=1,n=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:n,heightSegments:s,depthSegments:a};let o=this;n=Math.floor(n),s=Math.floor(s),a=Math.floor(a);let l=[],c=[],d=[],u=[],h=0,p=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,n,a,2),g("x","z","y",1,-1,e,i,-t,n,a,3),g("x","y","z",1,-1,e,t,i,n,s,4),g("x","y","z",-1,-1,e,t,-i,n,s,5),this.setIndex(l),this.setAttribute("position",new yi(c,3)),this.setAttribute("normal",new yi(d,3)),this.setAttribute("uv",new yi(u,2));function g(v,m,f,M,w,_,D,A,R,T,b){let x=_/R,C=D/T,U=_/2,V=D/2,G=A/2,P=R+1,L=T+1,H=0,F=0,K=new z;for(let ne=0;ne<L;ne++){let ce=ne*C-V;for(let fe=0;fe<P;fe++){let re=fe*x-U;K[v]=re*M,K[m]=ce*w,K[f]=G,c.push(K.x,K.y,K.z),K[v]=0,K[m]=0,K[f]=A>0?1:-1,d.push(K.x,K.y,K.z),u.push(fe/R),u.push(1-ne/T),H+=1}}for(let ne=0;ne<T;ne++)for(let ce=0;ce<R;ce++){let fe=h+ce+P*ne,re=h+ce+P*(ne+1),$=h+(ce+1)+P*(ne+1),ie=h+(ce+1)+P*ne;l.push(fe,re,ie),l.push(re,$,ie),F+=6}o.addGroup(p,F,b),p+=F,h+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Bn(r){let e={};for(let t in r){e[t]={};for(let i in r[t]){let n=r[t][i];n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)?n.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=n.clone():Array.isArray(n)?e[t][i]=n.slice():e[t][i]=n}}return e}function Qt(r){let e={};for(let t=0;t<r.length;t++){let i=Bn(r[t]);for(let n in i)e[n]=i[n]}return e}function mf(r){let e=[];for(let t=0;t<r.length;t++)e.push(r[t].clone());return e}function Rp(r){let e=r.getRenderTarget();return e===null?r.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:et.workingColorSpace}var Cp={clone:Bn,merge:Qt},ff=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,gf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,ki=class extends ui{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ff,this.fragmentShader=gf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Bn(e.uniforms),this.uniformsGroups=mf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let s=this.uniforms[n].value;s&&s.isTexture?t.uniforms[n]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[n]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[n]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[n]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[n]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[n]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[n]={type:"m4",value:s.toArray()}:t.uniforms[n]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let n in this.extensions)this.extensions[n]===!0&&(i[n]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Ls=class extends Tt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new We,this.projectionMatrix=new We,this.projectionMatrixInverse=new We,this.coordinateSystem=ji}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Ar=new z,Tu=new it,Eu=new it,Bt=class extends Ls{constructor(e=50,t=1,i=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=n,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Fn*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(xs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Fn*2*Math.atan(Math.tan(xs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Ar.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ar.x,Ar.y).multiplyScalar(-e/Ar.z),Ar.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Ar.x,Ar.y).multiplyScalar(-e/Ar.z)}getViewSize(e,t){return this.getViewBounds(e,Tu,Eu),t.subVectors(Eu,Tu)}setViewOffset(e,t,i,n,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=n,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(xs*.5*this.fov)/this.zoom,i=2*t,n=this.aspect*i,s=-.5*n,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*n/l,t-=a.offsetY*i/c,n*=a.width/l,i*=a.height/c}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+n,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Mn=-90,Tn=1,wo=class extends Tt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let n=new Bt(Mn,Tn,e,t);n.layers=this.layers,this.add(n);let s=new Bt(Mn,Tn,e,t);s.layers=this.layers,this.add(s);let a=new Bt(Mn,Tn,e,t);a.layers=this.layers,this.add(a);let o=new Bt(Mn,Tn,e,t);o.layers=this.layers,this.add(o);let l=new Bt(Mn,Tn,e,t);l.layers=this.layers,this.add(l);let c=new Bt(Mn,Tn,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,n,s,a,o,l]=t;for(let c of t)this.remove(c);if(e===ji)i.up.set(0,1,0),i.lookAt(1,0,0),n.up.set(0,1,0),n.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===ws)i.up.set(0,-1,0),i.lookAt(-1,0,0),n.up.set(0,-1,0),n.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:n}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,l,c,d]=this.children,u=e.getRenderTarget(),h=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,n),e.render(t,s),e.setRenderTarget(i,1,n),e.render(t,a),e.setRenderTarget(i,2,n),e.render(t,o),e.setRenderTarget(i,3,n),e.render(t,l),e.setRenderTarget(i,4,n),e.render(t,c),i.texture.generateMipmaps=v,e.setRenderTarget(i,5,n),e.render(t,d),e.setRenderTarget(u,h,p),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Ps=class extends Gt{constructor(e,t,i,n,s,a,o,l,c,d){e=e!==void 0?e:[],t=t!==void 0?t:Qr,super(e,t,i,n,s,a,o,l,c,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Mo=class extends Yi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},n=[i,i,i,i,i,i];this.texture=new Ps(n,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:ri}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},n=new an(5,5,5),s=new ki({name:"CubemapFromEquirect",uniforms:Bn(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:qt,blending:dr});s.uniforms.tEquirect.value=t;let a=new ht(n,s),o=t.minFilter;return t.minFilter===Wi&&(t.minFilter=ri),new wo(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,i,n){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,n);e.setRenderTarget(s)}},Hl=new z,vf=new z,xf=new Ge,Gi=class{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,n){return this.normal.set(e,t,i),this.constant=n,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let n=Hl.subVectors(i,t).cross(vf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(n,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(Hl),n=this.normal.dot(i);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/n;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||xf.getNormalMatrix(e),n=this.coplanarPoint(Hl).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-n.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Vr=new hi,ya=new z,Hn=class{constructor(e=new Gi,t=new Gi,i=new Gi,n=new Gi,s=new Gi,a=new Gi){this.planes=[e,t,i,n,s,a]}set(e,t,i,n,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(n),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=ji){let i=this.planes,n=e.elements,s=n[0],a=n[1],o=n[2],l=n[3],c=n[4],d=n[5],u=n[6],h=n[7],p=n[8],g=n[9],v=n[10],m=n[11],f=n[12],M=n[13],w=n[14],_=n[15];if(i[0].setComponents(l-s,h-c,m-p,_-f).normalize(),i[1].setComponents(l+s,h+c,m+p,_+f).normalize(),i[2].setComponents(l+a,h+d,m+g,_+M).normalize(),i[3].setComponents(l-a,h-d,m-g,_-M).normalize(),i[4].setComponents(l-o,h-u,m-v,_-w).normalize(),t===ji)i[5].setComponents(l+o,h+u,m+v,_+w).normalize();else if(t===ws)i[5].setComponents(o,u,v,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Vr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Vr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Vr)}intersectsSprite(e){return Vr.center.set(0,0,0),Vr.radius=.7071067811865476,Vr.applyMatrix4(e.matrixWorld),this.intersectsSphere(Vr)}intersectsSphere(e){let t=this.planes,i=e.center,n=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<n)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let n=t[i];if(ya.x=n.normal.x>0?e.max.x:e.min.x,ya.y=n.normal.y>0?e.max.y:e.min.y,ya.z=n.normal.z>0?e.max.z:e.min.z,n.distanceToPoint(ya)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Lp(){let r=null,e=!1,t=null,i=null;function n(s,a){t(s,a),i=r.requestAnimationFrame(n)}return{start:function(){e!==!0&&t!==null&&(i=r.requestAnimationFrame(n),e=!0)},stop:function(){r.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){r=s}}}function _f(r){let e=new WeakMap;function t(o,l){let c=o.array,d=o.usage,u=c.byteLength,h=r.createBuffer();r.bindBuffer(l,h),r.bufferData(l,c,d),o.onUploadCallback();let p;if(c instanceof Float32Array)p=r.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=r.HALF_FLOAT:p=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=r.SHORT;else if(c instanceof Uint32Array)p=r.UNSIGNED_INT;else if(c instanceof Int32Array)p=r.INT;else if(c instanceof Int8Array)p=r.BYTE;else if(c instanceof Uint8Array)p=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,l,c){let d=l.array,u=l.updateRanges;if(r.bindBuffer(c,o),u.length===0)r.bufferSubData(c,0,d);else{u.sort((p,g)=>p.start-g.start);let h=0;for(let p=1;p<u.length;p++){let g=u[h],v=u[p];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++h,u[h]=v)}u.length=h+1;for(let p=0,g=u.length;p<g;p++){let v=u[p];r.bufferSubData(c,v.start*d.BYTES_PER_ELEMENT,d,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function n(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(r.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let d=e.get(o);(!d||d.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:n,remove:s,update:a}}var Is=class r extends Ni{constructor(e=1,t=1,i=1,n=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:n};let s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(n),c=o+1,d=l+1,u=e/o,h=t/l,p=[],g=[],v=[],m=[];for(let f=0;f<d;f++){let M=f*h-a;for(let w=0;w<c;w++){let _=w*u-s;g.push(_,-M,0),v.push(0,0,1),m.push(w/o),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let M=0;M<o;M++){let w=M+c*f,_=M+c*(f+1),D=M+1+c*(f+1),A=M+1+c*f;p.push(w,_,A),p.push(_,D,A)}this.setIndex(p),this.setAttribute("position",new yi(g,3)),this.setAttribute("normal",new yi(v,3)),this.setAttribute("uv",new yi(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.widthSegments,e.heightSegments)}},yf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,bf=`#ifdef USE_ALPHAHASH
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
#endif`,Sf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,wf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Mf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Tf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ef=`#ifdef USE_AOMAP
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
#endif`,Af=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Rf=`#ifdef USE_BATCHING
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
#endif`,Cf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Lf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Pf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,If=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Df=`#ifdef USE_IRIDESCENCE
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
#endif`,Uf=`#ifdef USE_BUMPMAP
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
#endif`,Nf=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,kf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Of=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ff=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Bf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Hf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,zf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Vf=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Gf=`#define PI 3.141592653589793
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
} // validated`,$f=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Wf=`vec3 transformedNormal = objectNormal;
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
#endif`,jf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,qf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Xf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Yf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Kf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Zf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Jf=`#ifdef USE_ENVMAP
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
#endif`,Qf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,eg=`#ifdef USE_ENVMAP
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
#endif`,tg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ig=`#ifdef USE_ENVMAP
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
#endif`,rg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ng=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,sg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ag=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,og=`#ifdef USE_GRADIENTMAP
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
}`,lg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,cg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,dg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ug=`uniform bool receiveShadow;
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
#endif`,hg=`#ifdef USE_ENVMAP
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
#endif`,pg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,mg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,fg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,gg=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,vg=`PhysicalMaterial material;
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
#endif`,xg=`struct PhysicalMaterial {
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
}`,_g=`
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
#endif`,yg=`#if defined( RE_IndirectDiffuse )
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
#endif`,bg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Sg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,wg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Mg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Tg=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Eg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Ag=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Rg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Cg=`#if defined( USE_POINTS_UV )
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
#endif`,Lg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Pg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ig=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Dg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ug=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ng=`#ifdef USE_MORPHTARGETS
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
#endif`,kg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Og=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Fg=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Bg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Hg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,zg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Vg=`#ifdef USE_NORMALMAP
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
#endif`,Gg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,$g=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Wg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,jg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,qg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Xg=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Yg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Kg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Zg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Jg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Qg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,e0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,t0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,i0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,r0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,n0=`float getShadowMask() {
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
}`,s0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,a0=`#ifdef USE_SKINNING
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
#endif`,o0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,l0=`#ifdef USE_SKINNING
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
#endif`,c0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,d0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,u0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,h0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,p0=`#ifdef USE_TRANSMISSION
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
#endif`,m0=`#ifdef USE_TRANSMISSION
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
#endif`,f0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,g0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,v0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,x0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,_0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,y0=`uniform sampler2D t2D;
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
}`,b0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,S0=`#ifdef ENVMAP_TYPE_CUBE
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
}`,w0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,M0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,T0=`#include <common>
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
}`,E0=`#if DEPTH_PACKING == 3200
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
}`,A0=`#define DISTANCE
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
}`,R0=`#define DISTANCE
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
}`,C0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,L0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,P0=`uniform float scale;
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
}`,I0=`uniform vec3 diffuse;
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
}`,D0=`#include <common>
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
}`,U0=`uniform vec3 diffuse;
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
}`,N0=`#define LAMBERT
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
}`,k0=`#define LAMBERT
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
}`,O0=`#define MATCAP
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
}`,F0=`#define MATCAP
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
}`,B0=`#define NORMAL
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
}`,H0=`#define NORMAL
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
}`,z0=`#define PHONG
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
}`,V0=`#define PHONG
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
}`,G0=`#define STANDARD
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
}`,$0=`#define STANDARD
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
}`,W0=`#define TOON
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
}`,j0=`#define TOON
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
}`,q0=`uniform float size;
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
}`,X0=`uniform vec3 diffuse;
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
}`,Y0=`#include <common>
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
}`,K0=`uniform vec3 color;
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
}`,Z0=`uniform float rotation;
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
}`,J0=`uniform vec3 diffuse;
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
}`,$e={alphahash_fragment:yf,alphahash_pars_fragment:bf,alphamap_fragment:Sf,alphamap_pars_fragment:wf,alphatest_fragment:Mf,alphatest_pars_fragment:Tf,aomap_fragment:Ef,aomap_pars_fragment:Af,batching_pars_vertex:Rf,batching_vertex:Cf,begin_vertex:Lf,beginnormal_vertex:Pf,bsdfs:If,iridescence_fragment:Df,bumpmap_pars_fragment:Uf,clipping_planes_fragment:Nf,clipping_planes_pars_fragment:kf,clipping_planes_pars_vertex:Of,clipping_planes_vertex:Ff,color_fragment:Bf,color_pars_fragment:Hf,color_pars_vertex:zf,color_vertex:Vf,common:Gf,cube_uv_reflection_fragment:$f,defaultnormal_vertex:Wf,displacementmap_pars_vertex:jf,displacementmap_vertex:qf,emissivemap_fragment:Xf,emissivemap_pars_fragment:Yf,colorspace_fragment:Kf,colorspace_pars_fragment:Zf,envmap_fragment:Jf,envmap_common_pars_fragment:Qf,envmap_pars_fragment:eg,envmap_pars_vertex:tg,envmap_physical_pars_fragment:hg,envmap_vertex:ig,fog_vertex:rg,fog_pars_vertex:ng,fog_fragment:sg,fog_pars_fragment:ag,gradientmap_pars_fragment:og,lightmap_pars_fragment:lg,lights_lambert_fragment:cg,lights_lambert_pars_fragment:dg,lights_pars_begin:ug,lights_toon_fragment:pg,lights_toon_pars_fragment:mg,lights_phong_fragment:fg,lights_phong_pars_fragment:gg,lights_physical_fragment:vg,lights_physical_pars_fragment:xg,lights_fragment_begin:_g,lights_fragment_maps:yg,lights_fragment_end:bg,logdepthbuf_fragment:Sg,logdepthbuf_pars_fragment:wg,logdepthbuf_pars_vertex:Mg,logdepthbuf_vertex:Tg,map_fragment:Eg,map_pars_fragment:Ag,map_particle_fragment:Rg,map_particle_pars_fragment:Cg,metalnessmap_fragment:Lg,metalnessmap_pars_fragment:Pg,morphinstance_vertex:Ig,morphcolor_vertex:Dg,morphnormal_vertex:Ug,morphtarget_pars_vertex:Ng,morphtarget_vertex:kg,normal_fragment_begin:Og,normal_fragment_maps:Fg,normal_pars_fragment:Bg,normal_pars_vertex:Hg,normal_vertex:zg,normalmap_pars_fragment:Vg,clearcoat_normal_fragment_begin:Gg,clearcoat_normal_fragment_maps:$g,clearcoat_pars_fragment:Wg,iridescence_pars_fragment:jg,opaque_fragment:qg,packing:Xg,premultiplied_alpha_fragment:Yg,project_vertex:Kg,dithering_fragment:Zg,dithering_pars_fragment:Jg,roughnessmap_fragment:Qg,roughnessmap_pars_fragment:e0,shadowmap_pars_fragment:t0,shadowmap_pars_vertex:i0,shadowmap_vertex:r0,shadowmask_pars_fragment:n0,skinbase_vertex:s0,skinning_pars_vertex:a0,skinning_vertex:o0,skinnormal_vertex:l0,specularmap_fragment:c0,specularmap_pars_fragment:d0,tonemapping_fragment:u0,tonemapping_pars_fragment:h0,transmission_fragment:p0,transmission_pars_fragment:m0,uv_pars_fragment:f0,uv_pars_vertex:g0,uv_vertex:v0,worldpos_vertex:x0,background_vert:_0,background_frag:y0,backgroundCube_vert:b0,backgroundCube_frag:S0,cube_vert:w0,cube_frag:M0,depth_vert:T0,depth_frag:E0,distanceRGBA_vert:A0,distanceRGBA_frag:R0,equirect_vert:C0,equirect_frag:L0,linedashed_vert:P0,linedashed_frag:I0,meshbasic_vert:D0,meshbasic_frag:U0,meshlambert_vert:N0,meshlambert_frag:k0,meshmatcap_vert:O0,meshmatcap_frag:F0,meshnormal_vert:B0,meshnormal_frag:H0,meshphong_vert:z0,meshphong_frag:V0,meshphysical_vert:G0,meshphysical_frag:$0,meshtoon_vert:W0,meshtoon_frag:j0,points_vert:q0,points_frag:X0,shadow_vert:Y0,shadow_frag:K0,sprite_vert:Z0,sprite_frag:J0},pe={common:{diffuse:{value:new Fe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ge},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ge}},envmap:{envMap:{value:null},envMapRotation:{value:new Ge},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ge}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ge}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ge},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ge},normalScale:{value:new it(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ge},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ge}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ge}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ge}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Fe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Fe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0},uvTransform:{value:new Ge}},sprite:{diffuse:{value:new Fe(16777215)},opacity:{value:1},center:{value:new it(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ge},alphaMap:{value:null},alphaMapTransform:{value:new Ge},alphaTest:{value:0}}},Ei={basic:{uniforms:Qt([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.fog]),vertexShader:$e.meshbasic_vert,fragmentShader:$e.meshbasic_frag},lambert:{uniforms:Qt([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new Fe(0)}}]),vertexShader:$e.meshlambert_vert,fragmentShader:$e.meshlambert_frag},phong:{uniforms:Qt([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new Fe(0)},specular:{value:new Fe(1118481)},shininess:{value:30}}]),vertexShader:$e.meshphong_vert,fragmentShader:$e.meshphong_frag},standard:{uniforms:Qt([pe.common,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.roughnessmap,pe.metalnessmap,pe.fog,pe.lights,{emissive:{value:new Fe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag},toon:{uniforms:Qt([pe.common,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.gradientmap,pe.fog,pe.lights,{emissive:{value:new Fe(0)}}]),vertexShader:$e.meshtoon_vert,fragmentShader:$e.meshtoon_frag},matcap:{uniforms:Qt([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,{matcap:{value:null}}]),vertexShader:$e.meshmatcap_vert,fragmentShader:$e.meshmatcap_frag},points:{uniforms:Qt([pe.points,pe.fog]),vertexShader:$e.points_vert,fragmentShader:$e.points_frag},dashed:{uniforms:Qt([pe.common,pe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$e.linedashed_vert,fragmentShader:$e.linedashed_frag},depth:{uniforms:Qt([pe.common,pe.displacementmap]),vertexShader:$e.depth_vert,fragmentShader:$e.depth_frag},normal:{uniforms:Qt([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,{opacity:{value:1}}]),vertexShader:$e.meshnormal_vert,fragmentShader:$e.meshnormal_frag},sprite:{uniforms:Qt([pe.sprite,pe.fog]),vertexShader:$e.sprite_vert,fragmentShader:$e.sprite_frag},background:{uniforms:{uvTransform:{value:new Ge},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$e.background_vert,fragmentShader:$e.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ge}},vertexShader:$e.backgroundCube_vert,fragmentShader:$e.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$e.cube_vert,fragmentShader:$e.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$e.equirect_vert,fragmentShader:$e.equirect_frag},distanceRGBA:{uniforms:Qt([pe.common,pe.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$e.distanceRGBA_vert,fragmentShader:$e.distanceRGBA_frag},shadow:{uniforms:Qt([pe.lights,pe.fog,{color:{value:new Fe(0)},opacity:{value:1}}]),vertexShader:$e.shadow_vert,fragmentShader:$e.shadow_frag}};Ei.physical={uniforms:Qt([Ei.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ge},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ge},clearcoatNormalScale:{value:new it(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ge},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ge},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ge},sheen:{value:0},sheenColor:{value:new Fe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ge},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ge},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ge},transmissionSamplerSize:{value:new it},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ge},attenuationDistance:{value:0},attenuationColor:{value:new Fe(0)},specularColor:{value:new Fe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ge},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ge},anisotropyVector:{value:new it},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ge}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag};var ba={r:0,b:0,g:0},Gr=new Ui,Q0=new We;function ev(r,e,t,i,n,s,a){let o=new Fe(0),l=s===!0?0:1,c,d,u=null,h=0,p=null;function g(M){let w=M.isScene===!0?M.background:null;return w&&w.isTexture&&(w=(M.backgroundBlurriness>0?t:e).get(w)),w}function v(M){let w=!1,_=g(M);_===null?f(o,l):_&&_.isColor&&(f(_,1),w=!0);let D=r.xr.getEnvironmentBlendMode();D==="additive"?i.buffers.color.setClear(0,0,0,1,a):D==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(r.autoClear||w)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function m(M,w){let _=g(w);_&&(_.isCubeTexture||_.mapping===js)?(d===void 0&&(d=new ht(new an(1,1,1),new ki({name:"BackgroundCubeMaterial",uniforms:Bn(Ei.backgroundCube.uniforms),vertexShader:Ei.backgroundCube.vertexShader,fragmentShader:Ei.backgroundCube.fragmentShader,side:qt,depthTest:!1,depthWrite:!1,fog:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(D,A,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(d)),Gr.copy(w.backgroundRotation),Gr.x*=-1,Gr.y*=-1,Gr.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(Gr.y*=-1,Gr.z*=-1),d.material.uniforms.envMap.value=_,d.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(Q0.makeRotationFromEuler(Gr)),d.material.toneMapped=et.getTransfer(_.colorSpace)!==dt,(u!==_||h!==_.version||p!==r.toneMapping)&&(d.material.needsUpdate=!0,u=_,h=_.version,p=r.toneMapping),d.layers.enableAll(),M.unshift(d,d.geometry,d.material,0,0,null)):_&&_.isTexture&&(c===void 0&&(c=new ht(new Is(2,2),new ki({name:"BackgroundMaterial",uniforms:Bn(Ei.background.uniforms),vertexShader:Ei.background.vertexShader,fragmentShader:Ei.background.fragmentShader,side:qi,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=_,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.toneMapped=et.getTransfer(_.colorSpace)!==dt,_.matrixAutoUpdate===!0&&_.updateMatrix(),c.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||h!==_.version||p!==r.toneMapping)&&(c.material.needsUpdate=!0,u=_,h=_.version,p=r.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function f(M,w){M.getRGB(ba,Rp(r)),i.buffers.color.setClear(ba.r,ba.g,ba.b,w,a)}return{getClearColor:function(){return o},setClearColor:function(M,w=1){o.set(M),l=w,f(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,f(o,l)},render:v,addToRenderList:m}}function tv(r,e){let t=r.getParameter(r.MAX_VERTEX_ATTRIBS),i={},n=h(null),s=n,a=!1;function o(x,C,U,V,G){let P=!1,L=u(V,U,C);s!==L&&(s=L,c(s.object)),P=p(x,V,U,G),P&&g(x,V,U,G),G!==null&&e.update(G,r.ELEMENT_ARRAY_BUFFER),(P||a)&&(a=!1,_(x,C,U,V),G!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e.get(G).buffer))}function l(){return r.createVertexArray()}function c(x){return r.bindVertexArray(x)}function d(x){return r.deleteVertexArray(x)}function u(x,C,U){let V=U.wireframe===!0,G=i[x.id];G===void 0&&(G={},i[x.id]=G);let P=G[C.id];P===void 0&&(P={},G[C.id]=P);let L=P[V];return L===void 0&&(L=h(l()),P[V]=L),L}function h(x){let C=[],U=[],V=[];for(let G=0;G<t;G++)C[G]=0,U[G]=0,V[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:C,enabledAttributes:U,attributeDivisors:V,object:x,attributes:{},index:null}}function p(x,C,U,V){let G=s.attributes,P=C.attributes,L=0,H=U.getAttributes();for(let F in H)if(H[F].location>=0){let K=G[F],ne=P[F];if(ne===void 0&&(F==="instanceMatrix"&&x.instanceMatrix&&(ne=x.instanceMatrix),F==="instanceColor"&&x.instanceColor&&(ne=x.instanceColor)),K===void 0||K.attribute!==ne||ne&&K.data!==ne.data)return!0;L++}return s.attributesNum!==L||s.index!==V}function g(x,C,U,V){let G={},P=C.attributes,L=0,H=U.getAttributes();for(let F in H)if(H[F].location>=0){let K=P[F];K===void 0&&(F==="instanceMatrix"&&x.instanceMatrix&&(K=x.instanceMatrix),F==="instanceColor"&&x.instanceColor&&(K=x.instanceColor));let ne={};ne.attribute=K,K&&K.data&&(ne.data=K.data),G[F]=ne,L++}s.attributes=G,s.attributesNum=L,s.index=V}function v(){let x=s.newAttributes;for(let C=0,U=x.length;C<U;C++)x[C]=0}function m(x){f(x,0)}function f(x,C){let U=s.newAttributes,V=s.enabledAttributes,G=s.attributeDivisors;U[x]=1,V[x]===0&&(r.enableVertexAttribArray(x),V[x]=1),G[x]!==C&&(r.vertexAttribDivisor(x,C),G[x]=C)}function M(){let x=s.newAttributes,C=s.enabledAttributes;for(let U=0,V=C.length;U<V;U++)C[U]!==x[U]&&(r.disableVertexAttribArray(U),C[U]=0)}function w(x,C,U,V,G,P,L){L===!0?r.vertexAttribIPointer(x,C,U,G,P):r.vertexAttribPointer(x,C,U,V,G,P)}function _(x,C,U,V){v();let G=V.attributes,P=U.getAttributes(),L=C.defaultAttributeValues;for(let H in P){let F=P[H];if(F.location>=0){let K=G[H];if(K===void 0&&(H==="instanceMatrix"&&x.instanceMatrix&&(K=x.instanceMatrix),H==="instanceColor"&&x.instanceColor&&(K=x.instanceColor)),K!==void 0){let ne=K.normalized,ce=K.itemSize,fe=e.get(K);if(fe===void 0)continue;let re=fe.buffer,$=fe.type,ie=fe.bytesPerElement,ve=$===r.INT||$===r.UNSIGNED_INT||K.gpuType===rl;if(K.isInterleavedBufferAttribute){let me=K.data,xe=me.stride,Re=K.offset;if(me.isInstancedInterleavedBuffer){for(let Ue=0;Ue<F.locationSize;Ue++)f(F.location+Ue,me.meshPerAttribute);x.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=me.meshPerAttribute*me.count)}else for(let Ue=0;Ue<F.locationSize;Ue++)m(F.location+Ue);r.bindBuffer(r.ARRAY_BUFFER,re);for(let Ue=0;Ue<F.locationSize;Ue++)w(F.location+Ue,ce/F.locationSize,$,ne,xe*ie,(Re+ce/F.locationSize*Ue)*ie,ve)}else{if(K.isInstancedBufferAttribute){for(let me=0;me<F.locationSize;me++)f(F.location+me,K.meshPerAttribute);x.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=K.meshPerAttribute*K.count)}else for(let me=0;me<F.locationSize;me++)m(F.location+me);r.bindBuffer(r.ARRAY_BUFFER,re);for(let me=0;me<F.locationSize;me++)w(F.location+me,ce/F.locationSize,$,ne,ce*ie,ce/F.locationSize*me*ie,ve)}}else if(L!==void 0){let ne=L[H];if(ne!==void 0)switch(ne.length){case 2:r.vertexAttrib2fv(F.location,ne);break;case 3:r.vertexAttrib3fv(F.location,ne);break;case 4:r.vertexAttrib4fv(F.location,ne);break;default:r.vertexAttrib1fv(F.location,ne)}}}}M()}function D(){T();for(let x in i){let C=i[x];for(let U in C){let V=C[U];for(let G in V)d(V[G].object),delete V[G];delete C[U]}delete i[x]}}function A(x){if(i[x.id]===void 0)return;let C=i[x.id];for(let U in C){let V=C[U];for(let G in V)d(V[G].object),delete V[G];delete C[U]}delete i[x.id]}function R(x){for(let C in i){let U=i[C];if(U[x.id]===void 0)continue;let V=U[x.id];for(let G in V)d(V[G].object),delete V[G];delete U[x.id]}}function T(){b(),a=!0,s!==n&&(s=n,c(s.object))}function b(){n.geometry=null,n.program=null,n.wireframe=!1}return{setup:o,reset:T,resetDefaultState:b,dispose:D,releaseStatesOfGeometry:A,releaseStatesOfProgram:R,initAttributes:v,enableAttribute:m,disableUnusedAttributes:M}}function iv(r,e,t){let i;function n(c){i=c}function s(c,d){r.drawArrays(i,c,d),t.update(d,i,1)}function a(c,d,u){u!==0&&(r.drawArraysInstanced(i,c,d,u),t.update(d,i,u))}function o(c,d,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,d,0,u);let h=0;for(let p=0;p<u;p++)h+=d[p];t.update(h,i,1)}function l(c,d,u,h){if(u===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<c.length;g++)a(c[g],d[g],h[g]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,d,0,h,0,u);let g=0;for(let v=0;v<u;v++)g+=d[v]*h[v];t.update(g,i,1)}}this.setMode=n,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function rv(r,e,t,i){let n;function s(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){let R=e.get("EXT_texture_filter_anisotropic");n=r.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function a(R){return!(R!==di&&i.convert(R)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){let T=R===Xn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Xi&&i.convert(R)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==_i&&!T)}function l(R){if(R==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",d=l(c);d!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",d,"instead."),c=d);let u=t.logarithmicDepthBuffer===!0,h=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),p=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),g=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=r.getParameter(r.MAX_TEXTURE_SIZE),m=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),f=r.getParameter(r.MAX_VERTEX_ATTRIBS),M=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),w=r.getParameter(r.MAX_VARYING_VECTORS),_=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),D=g>0,A=r.getParameter(r.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:h,maxTextures:p,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:f,maxVertexUniforms:M,maxVaryings:w,maxFragmentUniforms:_,vertexTextures:D,maxSamples:A}}function nv(r){let e=this,t=null,i=0,n=!1,s=!1,a=new Gi,o=new Ge,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,h){let p=u.length!==0||h||i!==0||n;return n=h,i=u.length,p},this.beginShadows=function(){s=!0,d(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,h){t=d(u,h,0)},this.setState=function(u,h,p){let g=u.clippingPlanes,v=u.clipIntersection,m=u.clipShadows,f=r.get(u);if(!n||g===null||g.length===0||s&&!m)s?d(null):c();else{let M=s?0:i,w=M*4,_=f.clippingState||null;l.value=_,_=d(g,h,w,p);for(let D=0;D!==w;++D)_[D]=t[D];f.clippingState=_,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(u,h,p,g){let v=u!==null?u.length:0,m=null;if(v!==0){if(m=l.value,g!==!0||m===null){let f=p+v*4,M=h.matrixWorldInverse;o.getNormalMatrix(M),(m===null||m.length<f)&&(m=new Float32Array(f));for(let w=0,_=p;w!==v;++w,_+=4)a.copy(u[w]).applyMatrix4(M,o),a.normal.toArray(m,_),m[_+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,m}}function sv(r){let e=new WeakMap;function t(a,o){return o===Ga?a.mapping=Qr:o===$a&&(a.mapping=en),a}function i(a){if(a&&a.isTexture){let o=a.mapping;if(o===Ga||o===$a)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new Mo(l.height);return c.fromEquirectangularTexture(r,a),e.set(a,c),a.addEventListener("dispose",n),t(c.texture,a.mapping)}else return null}}return a}function n(a){let o=a.target;o.removeEventListener("dispose",n);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function s(){e=new WeakMap}return{get:i,dispose:s}}var zn=class extends Ls{constructor(e=-1,t=1,i=1,n=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=n,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,n,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=n,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,n=(this.top+this.bottom)/2,s=i-e,a=i+e,o=n+t,l=n-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=d*this.view.offsetY,l=o-d*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Pn=4,Au=[.125,.215,.35,.446,.526,.582],Yr=20,zl=new zn,Ru=new Fe,Vl=null,Gl=0,$l=0,Wl=!1,qr=(1+Math.sqrt(5))/2,En=1/qr,Cu=[new z(-qr,En,0),new z(qr,En,0),new z(-En,0,qr),new z(En,0,qr),new z(0,qr,-En),new z(0,qr,En),new z(-1,1,-1),new z(1,1,-1),new z(-1,1,1),new z(1,1,1)],Vn=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,n=100){Vl=this._renderer.getRenderTarget(),Gl=this._renderer.getActiveCubeFace(),$l=this._renderer.getActiveMipmapLevel(),Wl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,i,n,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Iu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Pu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Vl,Gl,$l),this._renderer.xr.enabled=Wl,e.scissorTest=!1,Sa(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Qr||e.mapping===en?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Vl=this._renderer.getRenderTarget(),Gl=this._renderer.getActiveCubeFace(),$l=this._renderer.getActiveMipmapLevel(),Wl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:ri,minFilter:ri,generateMipmaps:!1,type:Xn,format:di,colorSpace:Yt,depthBuffer:!1},n=Lu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Lu(e,t,i);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=av(s)),this._blurMaterial=ov(s,e,t)}return n}_compileMaterial(e){let t=new ht(this._lodPlanes[0],e);this._renderer.compile(t,zl)}_sceneToCubeUV(e,t,i,n){let s=new Bt(90,1,t,i),a=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],l=this._renderer,c=l.autoClear,d=l.toneMapping;l.getClearColor(Ru),l.toneMapping=ur,l.autoClear=!1;let u=new Ci({name:"PMREM.Background",side:qt,depthWrite:!1,depthTest:!1}),h=new ht(new an,u),p=!1,g=e.background;g?g.isColor&&(u.color.copy(g),e.background=null,p=!0):(u.color.copy(Ru),p=!0);for(let v=0;v<6;v++){let m=v%3;m===0?(s.up.set(0,a[v],0),s.lookAt(o[v],0,0)):m===1?(s.up.set(0,0,a[v]),s.lookAt(0,o[v],0)):(s.up.set(0,a[v],0),s.lookAt(0,0,o[v]));let f=this._cubeSize;Sa(n,m*f,v>2?f:0,f,f),l.setRenderTarget(n),p&&l.render(h,s),l.render(e,s)}h.geometry.dispose(),h.material.dispose(),l.toneMapping=d,l.autoClear=c,e.background=g}_textureToCubeUV(e,t){let i=this._renderer,n=e.mapping===Qr||e.mapping===en;n?(this._cubemapMaterial===null&&(this._cubemapMaterial=Iu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Pu());let s=n?this._cubemapMaterial:this._equirectMaterial,a=new ht(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;let l=this._cubeSize;Sa(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,zl)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let n=this._lodPlanes.length;for(let s=1;s<n;s++){let a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Cu[(n-s-1)%Cu.length];this._blur(e,s-1,s,a,o)}t.autoClear=i}_blur(e,t,i,n,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,n,"latitudinal",s),this._halfBlur(a,e,i,i,n,"longitudinal",s)}_halfBlur(e,t,i,n,s,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let d=3,u=new ht(this._lodPlanes[n],c),h=c.uniforms,p=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*Yr-1),v=s/g,m=isFinite(s)?1+Math.floor(d*v):Yr;m>Yr&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Yr}`);let f=[],M=0;for(let R=0;R<Yr;++R){let T=R/v,b=Math.exp(-T*T/2);f.push(b),R===0?M+=b:R<m&&(M+=2*b)}for(let R=0;R<f.length;R++)f[R]=f[R]/M;h.envMap.value=e.texture,h.samples.value=m,h.weights.value=f,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);let{_lodMax:w}=this;h.dTheta.value=g,h.mipInt.value=w-i;let _=this._sizeLods[n],D=3*_*(n>w-Pn?n-w+Pn:0),A=4*(this._cubeSize-_);Sa(t,D,A,3*_,2*_),l.setRenderTarget(t),l.render(u,zl)}};function av(r){let e=[],t=[],i=[],n=r,s=r-Pn+1+Au.length;for(let a=0;a<s;a++){let o=Math.pow(2,n);t.push(o);let l=1/o;a>r-Pn?l=Au[a-r+Pn-1]:a===0&&(l=0),i.push(l);let c=1/(o-2),d=-c,u=1+c,h=[d,d,u,d,u,u,d,d,u,u,d,u],p=6,g=6,v=3,m=2,f=1,M=new Float32Array(v*g*p),w=new Float32Array(m*g*p),_=new Float32Array(f*g*p);for(let A=0;A<p;A++){let R=A%3*2/3-1,T=A>2?0:-1,b=[R,T,0,R+2/3,T,0,R+2/3,T+1,0,R,T,0,R+2/3,T+1,0,R,T+1,0];M.set(b,v*g*A),w.set(h,m*g*A);let x=[A,A,A,A,A,A];_.set(x,f*g*A)}let D=new Ni;D.setAttribute("position",new Ht(M,v)),D.setAttribute("uv",new Ht(w,m)),D.setAttribute("faceIndex",new Ht(_,f)),e.push(D),n>Pn&&n--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Lu(r,e,t){let i=new Yi(r,e,t);return i.texture.mapping=js,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Sa(r,e,t,i,n){r.viewport.set(e,t,i,n),r.scissor.set(e,t,i,n)}function ov(r,e,t){let i=new Float32Array(Yr),n=new z(0,1,0);return new ki({name:"SphericalGaussianBlur",defines:{n:Yr,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:n}},vertexShader:Fd(),fragmentShader:`

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
		`,blending:dr,depthTest:!1,depthWrite:!1})}function Pu(){return new ki({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Fd(),fragmentShader:`

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
		`,blending:dr,depthTest:!1,depthWrite:!1})}function Iu(){return new ki({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Fd(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:dr,depthTest:!1,depthWrite:!1})}function Fd(){return`

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
	`}function lv(r){let e=new WeakMap,t=null;function i(o){if(o&&o.isTexture){let l=o.mapping,c=l===Ga||l===$a,d=l===Qr||l===en;if(c||d){let u=e.get(o),h=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==h)return t===null&&(t=new Vn(r)),u=c?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let p=o.image;return c&&p&&p.height>0||d&&p&&n(p)?(t===null&&(t=new Vn(r)),u=c?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",s),u.texture):null}}}return o}function n(o){let l=0,c=6;for(let d=0;d<c;d++)o[d]!==void 0&&l++;return l===c}function s(o){let l=o.target;l.removeEventListener("dispose",s);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:a}}function cv(r){let e={};function t(i){if(e[i]!==void 0)return e[i];let n;switch(i){case"WEBGL_depth_texture":n=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":n=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":n=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":n=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:n=r.getExtension(i)}return e[i]=n,n}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let n=t(i);return n===null&&cs("THREE.WebGLRenderer: "+i+" extension not supported."),n}}}function dv(r,e,t,i){let n={},s=new WeakMap;function a(u){let h=u.target;h.index!==null&&e.remove(h.index);for(let g in h.attributes)e.remove(h.attributes[g]);for(let g in h.morphAttributes){let v=h.morphAttributes[g];for(let m=0,f=v.length;m<f;m++)e.remove(v[m])}h.removeEventListener("dispose",a),delete n[h.id];let p=s.get(h);p&&(e.remove(p),s.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function o(u,h){return n[h.id]===!0||(h.addEventListener("dispose",a),n[h.id]=!0,t.memory.geometries++),h}function l(u){let h=u.attributes;for(let g in h)e.update(h[g],r.ARRAY_BUFFER);let p=u.morphAttributes;for(let g in p){let v=p[g];for(let m=0,f=v.length;m<f;m++)e.update(v[m],r.ARRAY_BUFFER)}}function c(u){let h=[],p=u.index,g=u.attributes.position,v=0;if(p!==null){let M=p.array;v=p.version;for(let w=0,_=M.length;w<_;w+=3){let D=M[w+0],A=M[w+1],R=M[w+2];h.push(D,A,A,R,R,D)}}else if(g!==void 0){let M=g.array;v=g.version;for(let w=0,_=M.length/3-1;w<_;w+=3){let D=w+0,A=w+1,R=w+2;h.push(D,A,A,R,R,D)}}else return;let m=new(Tp(h)?Cs:Rs)(h,1);m.version=v;let f=s.get(u);f&&e.remove(f),s.set(u,m)}function d(u){let h=s.get(u);if(h){let p=u.index;p!==null&&h.version<p.version&&c(u)}else c(u);return s.get(u)}return{get:o,update:l,getWireframeAttribute:d}}function uv(r,e,t){let i;function n(h){i=h}let s,a;function o(h){s=h.type,a=h.bytesPerElement}function l(h,p){r.drawElements(i,p,s,h*a),t.update(p,i,1)}function c(h,p,g){g!==0&&(r.drawElementsInstanced(i,p,s,h*a,g),t.update(p,i,g))}function d(h,p,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,s,h,0,g);let v=0;for(let m=0;m<g;m++)v+=p[m];t.update(v,i,1)}function u(h,p,g,v){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<h.length;f++)c(h[f]/a,p[f],v[f]);else{m.multiDrawElementsInstancedWEBGL(i,p,0,s,h,0,v,0,g);let f=0;for(let M=0;M<g;M++)f+=p[M]*v[M];t.update(f,i,1)}}this.setMode=n,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=d,this.renderMultiDrawInstances=u}function hv(r){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case r.TRIANGLES:t.triangles+=o*(s/3);break;case r.LINES:t.lines+=o*(s/2);break;case r.LINE_STRIP:t.lines+=o*(s-1);break;case r.LINE_LOOP:t.lines+=o*s;break;case r.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function n(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:n,update:i}}function pv(r,e,t){let i=new WeakMap,n=new ot;function s(a,o,l){let c=a.morphTargetInfluences,d=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=d!==void 0?d.length:0,h=i.get(o);if(h===void 0||h.count!==u){let g=function(){b.dispose(),i.delete(o),o.removeEventListener("dispose",g)};var p=g;h!==void 0&&h.texture.dispose();let v=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,f=o.morphAttributes.color!==void 0,M=o.morphAttributes.position||[],w=o.morphAttributes.normal||[],_=o.morphAttributes.color||[],D=0;v===!0&&(D=1),m===!0&&(D=2),f===!0&&(D=3);let A=o.attributes.position.count*D,R=1;A>e.maxTextureSize&&(R=Math.ceil(A/e.maxTextureSize),A=e.maxTextureSize);let T=new Float32Array(A*R*4*u),b=new Es(T,A,R,u);b.type=_i,b.needsUpdate=!0;let x=D*4;for(let C=0;C<u;C++){let U=M[C],V=w[C],G=_[C],P=A*R*4*C;for(let L=0;L<U.count;L++){let H=L*x;v===!0&&(n.fromBufferAttribute(U,L),T[P+H+0]=n.x,T[P+H+1]=n.y,T[P+H+2]=n.z,T[P+H+3]=0),m===!0&&(n.fromBufferAttribute(V,L),T[P+H+4]=n.x,T[P+H+5]=n.y,T[P+H+6]=n.z,T[P+H+7]=0),f===!0&&(n.fromBufferAttribute(G,L),T[P+H+8]=n.x,T[P+H+9]=n.y,T[P+H+10]=n.z,T[P+H+11]=G.itemSize===4?n.w:1)}}h={count:u,texture:b,size:new it(A,R)},i.set(o,h),o.addEventListener("dispose",g)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",a.morphTexture,t);else{let g=0;for(let m=0;m<c.length;m++)g+=c[m];let v=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(r,"morphTargetBaseInfluence",v),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(r,"morphTargetsTextureSize",h.size)}return{update:s}}function mv(r,e,t,i){let n=new WeakMap;function s(l){let c=i.render.frame,d=l.geometry,u=e.get(l,d);if(n.get(u)!==c&&(e.update(u),n.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),n.get(l)!==c&&(t.update(l.instanceMatrix,r.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,r.ARRAY_BUFFER),n.set(l,c))),l.isSkinnedMesh){let h=l.skeleton;n.get(h)!==c&&(h.update(),n.set(h,c))}return u}function a(){n=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:a}}var Ds=class extends Gt{constructor(e,t,i,n,s,a,o,l,c,d=Zr){if(d!==Zr&&d!==nn)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&d===Zr&&(i=Dr),i===void 0&&d===nn&&(i=rn),super(null,n,s,a,o,l,d,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Xt,this.minFilter=l!==void 0?l:Xt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Pp=new Gt,Du=new Ds(1,1),Ip=new Es,Dp=new So,Up=new Ps,Uu=[],Nu=[],ku=new Float32Array(16),Ou=new Float32Array(9),Fu=new Float32Array(4);function Yn(r,e,t){let i=r[0];if(i<=0||i>0)return r;let n=e*t,s=Uu[n];if(s===void 0&&(s=new Float32Array(n),Uu[n]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,r[a].toArray(s,o)}return s}function Ut(r,e){if(r.length!==e.length)return!1;for(let t=0,i=r.length;t<i;t++)if(r[t]!==e[t])return!1;return!0}function Nt(r,e){for(let t=0,i=e.length;t<i;t++)r[t]=e[t]}function dl(r,e){let t=Nu[e];t===void 0&&(t=new Int32Array(e),Nu[e]=t);for(let i=0;i!==e;++i)t[i]=r.allocateTextureUnit();return t}function fv(r,e){let t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function gv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;r.uniform2fv(this.addr,e),Nt(t,e)}}function vv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ut(t,e))return;r.uniform3fv(this.addr,e),Nt(t,e)}}function xv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;r.uniform4fv(this.addr,e),Nt(t,e)}}function _v(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),Nt(t,e)}else{if(Ut(t,i))return;Fu.set(i),r.uniformMatrix2fv(this.addr,!1,Fu),Nt(t,i)}}function yv(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),Nt(t,e)}else{if(Ut(t,i))return;Ou.set(i),r.uniformMatrix3fv(this.addr,!1,Ou),Nt(t,i)}}function bv(r,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),Nt(t,e)}else{if(Ut(t,i))return;ku.set(i),r.uniformMatrix4fv(this.addr,!1,ku),Nt(t,i)}}function Sv(r,e){let t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function wv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;r.uniform2iv(this.addr,e),Nt(t,e)}}function Mv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ut(t,e))return;r.uniform3iv(this.addr,e),Nt(t,e)}}function Tv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;r.uniform4iv(this.addr,e),Nt(t,e)}}function Ev(r,e){let t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function Av(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;r.uniform2uiv(this.addr,e),Nt(t,e)}}function Rv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ut(t,e))return;r.uniform3uiv(this.addr,e),Nt(t,e)}}function Cv(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;r.uniform4uiv(this.addr,e),Nt(t,e)}}function Lv(r,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(r.uniform1i(this.addr,n),i[0]=n);let s;this.type===r.SAMPLER_2D_SHADOW?(Du.compareFunction=kd,s=Du):s=Pp,t.setTexture2D(e||s,n)}function Pv(r,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(r.uniform1i(this.addr,n),i[0]=n),t.setTexture3D(e||Dp,n)}function Iv(r,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(r.uniform1i(this.addr,n),i[0]=n),t.setTextureCube(e||Up,n)}function Dv(r,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(r.uniform1i(this.addr,n),i[0]=n),t.setTexture2DArray(e||Ip,n)}function Uv(r){switch(r){case 5126:return fv;case 35664:return gv;case 35665:return vv;case 35666:return xv;case 35674:return _v;case 35675:return yv;case 35676:return bv;case 5124:case 35670:return Sv;case 35667:case 35671:return wv;case 35668:case 35672:return Mv;case 35669:case 35673:return Tv;case 5125:return Ev;case 36294:return Av;case 36295:return Rv;case 36296:return Cv;case 35678:case 36198:case 36298:case 36306:case 35682:return Lv;case 35679:case 36299:case 36307:return Pv;case 35680:case 36300:case 36308:case 36293:return Iv;case 36289:case 36303:case 36311:case 36292:return Dv}}function Nv(r,e){r.uniform1fv(this.addr,e)}function kv(r,e){let t=Yn(e,this.size,2);r.uniform2fv(this.addr,t)}function Ov(r,e){let t=Yn(e,this.size,3);r.uniform3fv(this.addr,t)}function Fv(r,e){let t=Yn(e,this.size,4);r.uniform4fv(this.addr,t)}function Bv(r,e){let t=Yn(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function Hv(r,e){let t=Yn(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function zv(r,e){let t=Yn(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function Vv(r,e){r.uniform1iv(this.addr,e)}function Gv(r,e){r.uniform2iv(this.addr,e)}function $v(r,e){r.uniform3iv(this.addr,e)}function Wv(r,e){r.uniform4iv(this.addr,e)}function jv(r,e){r.uniform1uiv(this.addr,e)}function qv(r,e){r.uniform2uiv(this.addr,e)}function Xv(r,e){r.uniform3uiv(this.addr,e)}function Yv(r,e){r.uniform4uiv(this.addr,e)}function Kv(r,e,t){let i=this.cache,n=e.length,s=dl(t,n);Ut(i,s)||(r.uniform1iv(this.addr,s),Nt(i,s));for(let a=0;a!==n;++a)t.setTexture2D(e[a]||Pp,s[a])}function Zv(r,e,t){let i=this.cache,n=e.length,s=dl(t,n);Ut(i,s)||(r.uniform1iv(this.addr,s),Nt(i,s));for(let a=0;a!==n;++a)t.setTexture3D(e[a]||Dp,s[a])}function Jv(r,e,t){let i=this.cache,n=e.length,s=dl(t,n);Ut(i,s)||(r.uniform1iv(this.addr,s),Nt(i,s));for(let a=0;a!==n;++a)t.setTextureCube(e[a]||Up,s[a])}function Qv(r,e,t){let i=this.cache,n=e.length,s=dl(t,n);Ut(i,s)||(r.uniform1iv(this.addr,s),Nt(i,s));for(let a=0;a!==n;++a)t.setTexture2DArray(e[a]||Ip,s[a])}function ex(r){switch(r){case 5126:return Nv;case 35664:return kv;case 35665:return Ov;case 35666:return Fv;case 35674:return Bv;case 35675:return Hv;case 35676:return zv;case 5124:case 35670:return Vv;case 35667:case 35671:return Gv;case 35668:case 35672:return $v;case 35669:case 35673:return Wv;case 5125:return jv;case 36294:return qv;case 36295:return Xv;case 36296:return Yv;case 35678:case 36198:case 36298:case 36306:case 35682:return Kv;case 35679:case 36299:case 36307:return Zv;case 35680:case 36300:case 36308:case 36293:return Jv;case 36289:case 36303:case 36311:case 36292:return Qv}}var bc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Uv(t.type)}},Sc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=ex(t.type)}},wc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let n=this.seq;for(let s=0,a=n.length;s!==a;++s){let o=n[s];o.setValue(e,t[o.id],i)}}},jl=/(\w+)(\])?(\[|\.)?/g;function Bu(r,e){r.seq.push(e),r.map[e.id]=e}function tx(r,e,t){let i=r.name,n=i.length;for(jl.lastIndex=0;;){let s=jl.exec(i),a=jl.lastIndex,o=s[1],l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===n){Bu(t,c===void 0?new bc(o,r,e):new Sc(o,r,e));break}else{let d=t.map[o];d===void 0&&(d=new wc(o),Bu(t,d)),t=d}}}var Dn=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let n=0;n<i;++n){let s=e.getActiveUniform(t,n),a=e.getUniformLocation(t,s.name);tx(s,a,this)}}setValue(e,t,i,n){let s=this.map[t];s!==void 0&&s.setValue(e,i,n)}setOptional(e,t,i){let n=t[i];n!==void 0&&this.setValue(e,i,n)}static upload(e,t,i,n){for(let s=0,a=t.length;s!==a;++s){let o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,n)}}static seqWithValue(e,t){let i=[];for(let n=0,s=e.length;n!==s;++n){let a=e[n];a.id in t&&i.push(a)}return i}};function Hu(r,e,t){let i=r.createShader(e);return r.shaderSource(i,t),r.compileShader(i),i}var ix=37297,rx=0;function nx(r,e){let t=r.split(`
`),i=[],n=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=n;a<s;a++){let o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}var zu=new Ge;function sx(r){et._getMatrix(zu,et.workingColorSpace,r);let e=`mat3( ${zu.elements.map(t=>t.toFixed(4))} )`;switch(et.getTransfer(r)){case qs:return[e,"LinearTransferOETF"];case dt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",r),[e,"LinearTransferOETF"]}}function Vu(r,e,t){let i=r.getShaderParameter(e,r.COMPILE_STATUS),n=r.getShaderInfoLog(e).trim();if(i&&n==="")return"";let s=/ERROR: 0:(\d+)/.exec(n);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+n+`

`+nx(r.getShaderSource(e),a)}else return n}function ax(r,e){let t=sx(e);return[`vec4 ${r}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function ox(r,e){let t;switch(e){case sp:t="Linear";break;case ap:t="Reinhard";break;case op:t="Cineon";break;case Sd:t="ACESFilmic";break;case cp:t="AgX";break;case dp:t="Neutral";break;case lp:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var wa=new z;function lx(){et.getLuminanceCoefficients(wa);let r=wa.x.toFixed(4),e=wa.y.toFixed(4),t=wa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function cx(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ds).join(`
`)}function dx(r){let e=[];for(let t in r){let i=r[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function ux(r,e){let t={},i=r.getProgramParameter(e,r.ACTIVE_ATTRIBUTES);for(let n=0;n<i;n++){let s=r.getActiveAttrib(e,n),a=s.name,o=1;s.type===r.FLOAT_MAT2&&(o=2),s.type===r.FLOAT_MAT3&&(o=3),s.type===r.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:r.getAttribLocation(e,a),locationSize:o}}return t}function ds(r){return r!==""}function Gu(r,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function $u(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var hx=/^[ \t]*#include +<([\w\d./]+)>/gm;function Mc(r){return r.replace(hx,mx)}var px=new Map;function mx(r,e){let t=$e[e];if(t===void 0){let i=px.get(e);if(i!==void 0)t=$e[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Mc(t)}var fx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Wu(r){return r.replace(fx,gx)}function gx(r,e,t,i){let n="";for(let s=parseInt(e);s<parseInt(t);s++)n+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return n}function ju(r){let e=`precision ${r.precision} float;
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
#define LOW_PRECISION`),e}function vx(r){let e="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===yd?e="SHADOWMAP_TYPE_PCF":r.shadowMapType===Fh?e="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===Vi&&(e="SHADOWMAP_TYPE_VSM"),e}function xx(r){let e="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case Qr:case en:e="ENVMAP_TYPE_CUBE";break;case js:e="ENVMAP_TYPE_CUBE_UV";break}return e}function _x(r){let e="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case en:e="ENVMAP_MODE_REFRACTION";break}return e}function yx(r){let e="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case bd:e="ENVMAP_BLENDING_MULTIPLY";break;case rp:e="ENVMAP_BLENDING_MIX";break;case np:e="ENVMAP_BLENDING_ADD";break}return e}function bx(r){let e=r.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Sx(r,e,t,i){let n=r.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,l=vx(t),c=xx(t),d=_x(t),u=yx(t),h=bx(t),p=cx(t),g=dx(s),v=n.createProgram(),m,f,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ds).join(`
`),m.length>0&&(m+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ds).join(`
`),f.length>0&&(f+=`
`)):(m=[ju(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ds).join(`
`),f=[ju(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+d:"",t.envMap?"#define "+u:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ur?"#define TONE_MAPPING":"",t.toneMapping!==ur?$e.tonemapping_pars_fragment:"",t.toneMapping!==ur?ox("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",$e.colorspace_pars_fragment,ax("linearToOutputTexel",t.outputColorSpace),lx(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ds).join(`
`)),a=Mc(a),a=Gu(a,t),a=$u(a,t),o=Mc(o),o=Gu(o,t),o=$u(o,t),a=Wu(a),o=Wu(o),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,f=["#define varying in",t.glslVersion===yc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===yc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let w=M+m+a,_=M+f+o,D=Hu(n,n.VERTEX_SHADER,w),A=Hu(n,n.FRAGMENT_SHADER,_);n.attachShader(v,D),n.attachShader(v,A),t.index0AttributeName!==void 0?n.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&n.bindAttribLocation(v,0,"position"),n.linkProgram(v);function R(C){if(r.debug.checkShaderErrors){let U=n.getProgramInfoLog(v).trim(),V=n.getShaderInfoLog(D).trim(),G=n.getShaderInfoLog(A).trim(),P=!0,L=!0;if(n.getProgramParameter(v,n.LINK_STATUS)===!1)if(P=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(n,v,D,A);else{let H=Vu(n,D,"vertex"),F=Vu(n,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+n.getError()+" - VALIDATE_STATUS "+n.getProgramParameter(v,n.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+U+`
`+H+`
`+F)}else U!==""?console.warn("THREE.WebGLProgram: Program Info Log:",U):(V===""||G==="")&&(L=!1);L&&(C.diagnostics={runnable:P,programLog:U,vertexShader:{log:V,prefix:m},fragmentShader:{log:G,prefix:f}})}n.deleteShader(D),n.deleteShader(A),T=new Dn(n,v),b=ux(n,v)}let T;this.getUniforms=function(){return T===void 0&&R(this),T};let b;this.getAttributes=function(){return b===void 0&&R(this),b};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=n.getProgramParameter(v,ix)),x},this.destroy=function(){i.releaseStatesOfProgram(this),n.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=rx++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=D,this.fragmentShader=A,this}var wx=0,Tc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,n=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(n)===!1&&(a.add(n),n.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ec(e),t.set(e,i)),i}},Ec=class{constructor(e){this.id=wx++,this.code=e,this.usedTimes=0}};function Mx(r,e,t,i,n,s,a){let o=new As,l=new Tc,c=new Set,d=[],u=n.logarithmicDepthBuffer,h=n.vertexTextures,p=n.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(b){return c.add(b),b===0?"uv":`uv${b}`}function m(b,x,C,U,V){let G=U.fog,P=V.geometry,L=b.isMeshStandardMaterial?U.environment:null,H=(b.isMeshStandardMaterial?t:e).get(b.envMap||L),F=H&&H.mapping===js?H.image.height:null,K=g[b.type];b.precision!==null&&(p=n.getMaxPrecision(b.precision),p!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",p,"instead."));let ne=P.morphAttributes.position||P.morphAttributes.normal||P.morphAttributes.color,ce=ne!==void 0?ne.length:0,fe=0;P.morphAttributes.position!==void 0&&(fe=1),P.morphAttributes.normal!==void 0&&(fe=2),P.morphAttributes.color!==void 0&&(fe=3);let re,$,ie,ve;if(K){let Ke=Ei[K];re=Ke.vertexShader,$=Ke.fragmentShader}else re=b.vertexShader,$=b.fragmentShader,l.update(b),ie=l.getVertexShaderID(b),ve=l.getFragmentShaderID(b);let me=r.getRenderTarget(),xe=r.state.buffers.depth.getReversed(),Re=V.isInstancedMesh===!0,Ue=V.isBatchedMesh===!0,qe=!!b.map,He=!!b.matcap,rt=!!H,B=!!b.aoMap,yt=!!b.lightMap,ze=!!b.bumpMap,je=!!b.normalMap,we=!!b.displacementMap,lt=!!b.emissiveMap,Me=!!b.metalnessMap,E=!!b.roughnessMap,y=b.anisotropy>0,W=b.clearcoat>0,Q=b.dispersion>0,te=b.iridescence>0,Z=b.sheen>0,Te=b.transmission>0,he=y&&!!b.anisotropyMap,ye=W&&!!b.clearcoatMap,tt=W&&!!b.clearcoatNormalMap,oe=W&&!!b.clearcoatRoughnessMap,be=te&&!!b.iridescenceMap,De=te&&!!b.iridescenceThicknessMap,Le=Z&&!!b.sheenColorMap,_e=Z&&!!b.sheenRoughnessMap,Xe=!!b.specularMap,Ve=!!b.specularColorMap,pt=!!b.specularIntensityMap,N=Te&&!!b.transmissionMap,le=Te&&!!b.thicknessMap,X=!!b.gradientMap,ee=!!b.alphaMap,ue=b.alphaTest>0,de=!!b.alphaHash,Ye=!!b.extensions,_t=ur;b.toneMapped&&(me===null||me.isXRRenderTarget===!0)&&(_t=r.toneMapping);let Dt={shaderID:K,shaderType:b.type,shaderName:b.name,vertexShader:re,fragmentShader:$,defines:b.defines,customVertexShaderID:ie,customFragmentShaderID:ve,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:p,batching:Ue,batchingColor:Ue&&V._colorsTexture!==null,instancing:Re,instancingColor:Re&&V.instanceColor!==null,instancingMorph:Re&&V.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:me===null?r.outputColorSpace:me.isXRRenderTarget===!0?me.texture.colorSpace:Yt,alphaToCoverage:!!b.alphaToCoverage,map:qe,matcap:He,envMap:rt,envMapMode:rt&&H.mapping,envMapCubeUVHeight:F,aoMap:B,lightMap:yt,bumpMap:ze,normalMap:je,displacementMap:h&&we,emissiveMap:lt,normalMapObjectSpace:je&&b.normalMapType===gp,normalMapTangentSpace:je&&b.normalMapType===Nd,metalnessMap:Me,roughnessMap:E,anisotropy:y,anisotropyMap:he,clearcoat:W,clearcoatMap:ye,clearcoatNormalMap:tt,clearcoatRoughnessMap:oe,dispersion:Q,iridescence:te,iridescenceMap:be,iridescenceThicknessMap:De,sheen:Z,sheenColorMap:Le,sheenRoughnessMap:_e,specularMap:Xe,specularColorMap:Ve,specularIntensityMap:pt,transmission:Te,transmissionMap:N,thicknessMap:le,gradientMap:X,opaque:b.transparent===!1&&b.blending===Kr&&b.alphaToCoverage===!1,alphaMap:ee,alphaTest:ue,alphaHash:de,combine:b.combine,mapUv:qe&&v(b.map.channel),aoMapUv:B&&v(b.aoMap.channel),lightMapUv:yt&&v(b.lightMap.channel),bumpMapUv:ze&&v(b.bumpMap.channel),normalMapUv:je&&v(b.normalMap.channel),displacementMapUv:we&&v(b.displacementMap.channel),emissiveMapUv:lt&&v(b.emissiveMap.channel),metalnessMapUv:Me&&v(b.metalnessMap.channel),roughnessMapUv:E&&v(b.roughnessMap.channel),anisotropyMapUv:he&&v(b.anisotropyMap.channel),clearcoatMapUv:ye&&v(b.clearcoatMap.channel),clearcoatNormalMapUv:tt&&v(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:oe&&v(b.clearcoatRoughnessMap.channel),iridescenceMapUv:be&&v(b.iridescenceMap.channel),iridescenceThicknessMapUv:De&&v(b.iridescenceThicknessMap.channel),sheenColorMapUv:Le&&v(b.sheenColorMap.channel),sheenRoughnessMapUv:_e&&v(b.sheenRoughnessMap.channel),specularMapUv:Xe&&v(b.specularMap.channel),specularColorMapUv:Ve&&v(b.specularColorMap.channel),specularIntensityMapUv:pt&&v(b.specularIntensityMap.channel),transmissionMapUv:N&&v(b.transmissionMap.channel),thicknessMapUv:le&&v(b.thicknessMap.channel),alphaMapUv:ee&&v(b.alphaMap.channel),vertexTangents:!!P.attributes.tangent&&(je||y),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!P.attributes.color&&P.attributes.color.itemSize===4,pointsUvs:V.isPoints===!0&&!!P.attributes.uv&&(qe||ee),fog:!!G,useFog:b.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:b.flatShading===!0,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:xe,skinning:V.isSkinnedMesh===!0,morphTargets:P.morphAttributes.position!==void 0,morphNormals:P.morphAttributes.normal!==void 0,morphColors:P.morphAttributes.color!==void 0,morphTargetsCount:ce,morphTextureStride:fe,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:b.dithering,shadowMapEnabled:r.shadowMap.enabled&&C.length>0,shadowMapType:r.shadowMap.type,toneMapping:_t,decodeVideoTexture:qe&&b.map.isVideoTexture===!0&&et.getTransfer(b.map.colorSpace)===dt,decodeVideoTextureEmissive:lt&&b.emissiveMap.isVideoTexture===!0&&et.getTransfer(b.emissiveMap.colorSpace)===dt,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===Ai,flipSided:b.side===qt,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Ye&&b.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ye&&b.extensions.multiDraw===!0||Ue)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return Dt.vertexUv1s=c.has(1),Dt.vertexUv2s=c.has(2),Dt.vertexUv3s=c.has(3),c.clear(),Dt}function f(b){let x=[];if(b.shaderID?x.push(b.shaderID):(x.push(b.customVertexShaderID),x.push(b.customFragmentShaderID)),b.defines!==void 0)for(let C in b.defines)x.push(C),x.push(b.defines[C]);return b.isRawShaderMaterial===!1&&(M(x,b),w(x,b),x.push(r.outputColorSpace)),x.push(b.customProgramCacheKey),x.join()}function M(b,x){b.push(x.precision),b.push(x.outputColorSpace),b.push(x.envMapMode),b.push(x.envMapCubeUVHeight),b.push(x.mapUv),b.push(x.alphaMapUv),b.push(x.lightMapUv),b.push(x.aoMapUv),b.push(x.bumpMapUv),b.push(x.normalMapUv),b.push(x.displacementMapUv),b.push(x.emissiveMapUv),b.push(x.metalnessMapUv),b.push(x.roughnessMapUv),b.push(x.anisotropyMapUv),b.push(x.clearcoatMapUv),b.push(x.clearcoatNormalMapUv),b.push(x.clearcoatRoughnessMapUv),b.push(x.iridescenceMapUv),b.push(x.iridescenceThicknessMapUv),b.push(x.sheenColorMapUv),b.push(x.sheenRoughnessMapUv),b.push(x.specularMapUv),b.push(x.specularColorMapUv),b.push(x.specularIntensityMapUv),b.push(x.transmissionMapUv),b.push(x.thicknessMapUv),b.push(x.combine),b.push(x.fogExp2),b.push(x.sizeAttenuation),b.push(x.morphTargetsCount),b.push(x.morphAttributeCount),b.push(x.numDirLights),b.push(x.numPointLights),b.push(x.numSpotLights),b.push(x.numSpotLightMaps),b.push(x.numHemiLights),b.push(x.numRectAreaLights),b.push(x.numDirLightShadows),b.push(x.numPointLightShadows),b.push(x.numSpotLightShadows),b.push(x.numSpotLightShadowsWithMaps),b.push(x.numLightProbes),b.push(x.shadowMapType),b.push(x.toneMapping),b.push(x.numClippingPlanes),b.push(x.numClipIntersection),b.push(x.depthPacking)}function w(b,x){o.disableAll(),x.supportsVertexTextures&&o.enable(0),x.instancing&&o.enable(1),x.instancingColor&&o.enable(2),x.instancingMorph&&o.enable(3),x.matcap&&o.enable(4),x.envMap&&o.enable(5),x.normalMapObjectSpace&&o.enable(6),x.normalMapTangentSpace&&o.enable(7),x.clearcoat&&o.enable(8),x.iridescence&&o.enable(9),x.alphaTest&&o.enable(10),x.vertexColors&&o.enable(11),x.vertexAlphas&&o.enable(12),x.vertexUv1s&&o.enable(13),x.vertexUv2s&&o.enable(14),x.vertexUv3s&&o.enable(15),x.vertexTangents&&o.enable(16),x.anisotropy&&o.enable(17),x.alphaHash&&o.enable(18),x.batching&&o.enable(19),x.dispersion&&o.enable(20),x.batchingColor&&o.enable(21),b.push(o.mask),o.disableAll(),x.fog&&o.enable(0),x.useFog&&o.enable(1),x.flatShading&&o.enable(2),x.logarithmicDepthBuffer&&o.enable(3),x.reverseDepthBuffer&&o.enable(4),x.skinning&&o.enable(5),x.morphTargets&&o.enable(6),x.morphNormals&&o.enable(7),x.morphColors&&o.enable(8),x.premultipliedAlpha&&o.enable(9),x.shadowMapEnabled&&o.enable(10),x.doubleSided&&o.enable(11),x.flipSided&&o.enable(12),x.useDepthPacking&&o.enable(13),x.dithering&&o.enable(14),x.transmission&&o.enable(15),x.sheen&&o.enable(16),x.opaque&&o.enable(17),x.pointsUvs&&o.enable(18),x.decodeVideoTexture&&o.enable(19),x.decodeVideoTextureEmissive&&o.enable(20),x.alphaToCoverage&&o.enable(21),b.push(o.mask)}function _(b){let x=g[b.type],C;if(x){let U=Ei[x];C=Cp.clone(U.uniforms)}else C=b.uniforms;return C}function D(b,x){let C;for(let U=0,V=d.length;U<V;U++){let G=d[U];if(G.cacheKey===x){C=G,++C.usedTimes;break}}return C===void 0&&(C=new Sx(r,x,b,s),d.push(C)),C}function A(b){if(--b.usedTimes===0){let x=d.indexOf(b);d[x]=d[d.length-1],d.pop(),b.destroy()}}function R(b){l.remove(b)}function T(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:_,acquireProgram:D,releaseProgram:A,releaseShaderCache:R,programs:d,dispose:T}}function Tx(){let r=new WeakMap;function e(a){return r.has(a)}function t(a){let o=r.get(a);return o===void 0&&(o={},r.set(a,o)),o}function i(a){r.delete(a)}function n(a,o,l){r.get(a)[o]=l}function s(){r=new WeakMap}return{has:e,get:t,remove:i,update:n,dispose:s}}function Ex(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.z!==e.z?r.z-e.z:r.id-e.id}function qu(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function Xu(){let r=[],e=0,t=[],i=[],n=[];function s(){e=0,t.length=0,i.length=0,n.length=0}function a(u,h,p,g,v,m){let f=r[e];return f===void 0?(f={id:u.id,object:u,geometry:h,material:p,groupOrder:g,renderOrder:u.renderOrder,z:v,group:m},r[e]=f):(f.id=u.id,f.object=u,f.geometry=h,f.material=p,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=v,f.group=m),e++,f}function o(u,h,p,g,v,m){let f=a(u,h,p,g,v,m);p.transmission>0?i.push(f):p.transparent===!0?n.push(f):t.push(f)}function l(u,h,p,g,v,m){let f=a(u,h,p,g,v,m);p.transmission>0?i.unshift(f):p.transparent===!0?n.unshift(f):t.unshift(f)}function c(u,h){t.length>1&&t.sort(u||Ex),i.length>1&&i.sort(h||qu),n.length>1&&n.sort(h||qu)}function d(){for(let u=e,h=r.length;u<h;u++){let p=r[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:n,init:s,push:o,unshift:l,finish:d,sort:c}}function Ax(){let r=new WeakMap;function e(i,n){let s=r.get(i),a;return s===void 0?(a=new Xu,r.set(i,[a])):n>=s.length?(a=new Xu,s.push(a)):a=s[n],a}function t(){r=new WeakMap}return{get:e,dispose:t}}function Rx(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new z,color:new Fe};break;case"SpotLight":t={position:new z,direction:new z,color:new Fe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new z,color:new Fe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new z,skyColor:new Fe,groundColor:new Fe};break;case"RectAreaLight":t={color:new Fe,position:new z,halfWidth:new z,halfHeight:new z};break}return r[e.id]=t,t}}}function Cx(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[e.id]=t,t}}}var Lx=0;function Px(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function Ix(r){let e=new Rx,t=Cx(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new z);let n=new z,s=new We,a=new We;function o(c){let d=0,u=0,h=0;for(let b=0;b<9;b++)i.probe[b].set(0,0,0);let p=0,g=0,v=0,m=0,f=0,M=0,w=0,_=0,D=0,A=0,R=0;c.sort(Px);for(let b=0,x=c.length;b<x;b++){let C=c[b],U=C.color,V=C.intensity,G=C.distance,P=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)d+=U.r*V,u+=U.g*V,h+=U.b*V;else if(C.isLightProbe){for(let L=0;L<9;L++)i.probe[L].addScaledVector(C.sh.coefficients[L],V);R++}else if(C.isDirectionalLight){let L=e.get(C);if(L.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let H=C.shadow,F=t.get(C);F.shadowIntensity=H.intensity,F.shadowBias=H.bias,F.shadowNormalBias=H.normalBias,F.shadowRadius=H.radius,F.shadowMapSize=H.mapSize,i.directionalShadow[p]=F,i.directionalShadowMap[p]=P,i.directionalShadowMatrix[p]=C.shadow.matrix,M++}i.directional[p]=L,p++}else if(C.isSpotLight){let L=e.get(C);L.position.setFromMatrixPosition(C.matrixWorld),L.color.copy(U).multiplyScalar(V),L.distance=G,L.coneCos=Math.cos(C.angle),L.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),L.decay=C.decay,i.spot[v]=L;let H=C.shadow;if(C.map&&(i.spotLightMap[D]=C.map,D++,H.updateMatrices(C),C.castShadow&&A++),i.spotLightMatrix[v]=H.matrix,C.castShadow){let F=t.get(C);F.shadowIntensity=H.intensity,F.shadowBias=H.bias,F.shadowNormalBias=H.normalBias,F.shadowRadius=H.radius,F.shadowMapSize=H.mapSize,i.spotShadow[v]=F,i.spotShadowMap[v]=P,_++}v++}else if(C.isRectAreaLight){let L=e.get(C);L.color.copy(U).multiplyScalar(V),L.halfWidth.set(C.width*.5,0,0),L.halfHeight.set(0,C.height*.5,0),i.rectArea[m]=L,m++}else if(C.isPointLight){let L=e.get(C);if(L.color.copy(C.color).multiplyScalar(C.intensity),L.distance=C.distance,L.decay=C.decay,C.castShadow){let H=C.shadow,F=t.get(C);F.shadowIntensity=H.intensity,F.shadowBias=H.bias,F.shadowNormalBias=H.normalBias,F.shadowRadius=H.radius,F.shadowMapSize=H.mapSize,F.shadowCameraNear=H.camera.near,F.shadowCameraFar=H.camera.far,i.pointShadow[g]=F,i.pointShadowMap[g]=P,i.pointShadowMatrix[g]=C.shadow.matrix,w++}i.point[g]=L,g++}else if(C.isHemisphereLight){let L=e.get(C);L.skyColor.copy(C.color).multiplyScalar(V),L.groundColor.copy(C.groundColor).multiplyScalar(V),i.hemi[f]=L,f++}}m>0&&(r.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=pe.LTC_FLOAT_1,i.rectAreaLTC2=pe.LTC_FLOAT_2):(i.rectAreaLTC1=pe.LTC_HALF_1,i.rectAreaLTC2=pe.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=u,i.ambient[2]=h;let T=i.hash;(T.directionalLength!==p||T.pointLength!==g||T.spotLength!==v||T.rectAreaLength!==m||T.hemiLength!==f||T.numDirectionalShadows!==M||T.numPointShadows!==w||T.numSpotShadows!==_||T.numSpotMaps!==D||T.numLightProbes!==R)&&(i.directional.length=p,i.spot.length=v,i.rectArea.length=m,i.point.length=g,i.hemi.length=f,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=w,i.pointShadowMap.length=w,i.spotShadow.length=_,i.spotShadowMap.length=_,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=w,i.spotLightMatrix.length=_+D-A,i.spotLightMap.length=D,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=R,T.directionalLength=p,T.pointLength=g,T.spotLength=v,T.rectAreaLength=m,T.hemiLength=f,T.numDirectionalShadows=M,T.numPointShadows=w,T.numSpotShadows=_,T.numSpotMaps=D,T.numLightProbes=R,i.version=Lx++)}function l(c,d){let u=0,h=0,p=0,g=0,v=0,m=d.matrixWorldInverse;for(let f=0,M=c.length;f<M;f++){let w=c[f];if(w.isDirectionalLight){let _=i.directional[u];_.direction.setFromMatrixPosition(w.matrixWorld),n.setFromMatrixPosition(w.target.matrixWorld),_.direction.sub(n),_.direction.transformDirection(m),u++}else if(w.isSpotLight){let _=i.spot[p];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),_.direction.setFromMatrixPosition(w.matrixWorld),n.setFromMatrixPosition(w.target.matrixWorld),_.direction.sub(n),_.direction.transformDirection(m),p++}else if(w.isRectAreaLight){let _=i.rectArea[g];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),a.identity(),s.copy(w.matrixWorld),s.premultiply(m),a.extractRotation(s),_.halfWidth.set(w.width*.5,0,0),_.halfHeight.set(0,w.height*.5,0),_.halfWidth.applyMatrix4(a),_.halfHeight.applyMatrix4(a),g++}else if(w.isPointLight){let _=i.point[h];_.position.setFromMatrixPosition(w.matrixWorld),_.position.applyMatrix4(m),h++}else if(w.isHemisphereLight){let _=i.hemi[v];_.direction.setFromMatrixPosition(w.matrixWorld),_.direction.transformDirection(m),v++}}}return{setup:o,setupView:l,state:i}}function Yu(r){let e=new Ix(r),t=[],i=[];function n(d){c.camera=d,t.length=0,i.length=0}function s(d){t.push(d)}function a(d){i.push(d)}function o(){e.setup(t)}function l(d){e.setupView(t,d)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:n,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function Dx(r){let e=new WeakMap;function t(n,s=0){let a=e.get(n),o;return a===void 0?(o=new Yu(r),e.set(n,[o])):s>=a.length?(o=new Yu(r),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var To=class extends ui{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=mp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Eo=class extends ui{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},Ux=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Nx=`uniform sampler2D shadow_pass;
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
}`;function kx(r,e,t){let i=new Hn,n=new it,s=new it,a=new ot,o=new To({depthPacking:fp}),l=new Eo,c={},d=t.maxTextureSize,u={[qi]:qt,[qt]:qi,[Ai]:Ai},h=new ki({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new it},radius:{value:4}},vertexShader:Ux,fragmentShader:Nx}),p=h.clone();p.defines.HORIZONTAL_PASS=1;let g=new Ni;g.setAttribute("position",new Ht(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new ht(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=yd;let f=this.type;this.render=function(A,R,T){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;let b=r.getRenderTarget(),x=r.getActiveCubeFace(),C=r.getActiveMipmapLevel(),U=r.state;U.setBlending(dr),U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let V=f!==Vi&&this.type===Vi,G=f===Vi&&this.type!==Vi;for(let P=0,L=A.length;P<L;P++){let H=A[P],F=H.shadow;if(F===void 0){console.warn("THREE.WebGLShadowMap:",H,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;n.copy(F.mapSize);let K=F.getFrameExtents();if(n.multiply(K),s.copy(F.mapSize),(n.x>d||n.y>d)&&(n.x>d&&(s.x=Math.floor(d/K.x),n.x=s.x*K.x,F.mapSize.x=s.x),n.y>d&&(s.y=Math.floor(d/K.y),n.y=s.y*K.y,F.mapSize.y=s.y)),F.map===null||V===!0||G===!0){let ce=this.type!==Vi?{minFilter:Xt,magFilter:Xt}:{};F.map!==null&&F.map.dispose(),F.map=new Yi(n.x,n.y,ce),F.map.texture.name=H.name+".shadowMap",F.camera.updateProjectionMatrix()}r.setRenderTarget(F.map),r.clear();let ne=F.getViewportCount();for(let ce=0;ce<ne;ce++){let fe=F.getViewport(ce);a.set(s.x*fe.x,s.y*fe.y,s.x*fe.z,s.y*fe.w),U.viewport(a),F.updateMatrices(H,ce),i=F.getFrustum(),_(R,T,F.camera,H,this.type)}F.isPointLightShadow!==!0&&this.type===Vi&&M(F,T),F.needsUpdate=!1}f=this.type,m.needsUpdate=!1,r.setRenderTarget(b,x,C)};function M(A,R){let T=e.update(v);h.defines.VSM_SAMPLES!==A.blurSamples&&(h.defines.VSM_SAMPLES=A.blurSamples,p.defines.VSM_SAMPLES=A.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Yi(n.x,n.y)),h.uniforms.shadow_pass.value=A.map.texture,h.uniforms.resolution.value=A.mapSize,h.uniforms.radius.value=A.radius,r.setRenderTarget(A.mapPass),r.clear(),r.renderBufferDirect(R,null,T,h,v,null),p.uniforms.shadow_pass.value=A.mapPass.texture,p.uniforms.resolution.value=A.mapSize,p.uniforms.radius.value=A.radius,r.setRenderTarget(A.map),r.clear(),r.renderBufferDirect(R,null,T,p,v,null)}function w(A,R,T,b){let x=null,C=T.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(C!==void 0)x=C;else if(x=T.isPointLight===!0?l:o,r.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){let U=x.uuid,V=R.uuid,G=c[U];G===void 0&&(G={},c[U]=G);let P=G[V];P===void 0&&(P=x.clone(),G[V]=P,R.addEventListener("dispose",D)),x=P}if(x.visible=R.visible,x.wireframe=R.wireframe,b===Vi?x.side=R.shadowSide!==null?R.shadowSide:R.side:x.side=R.shadowSide!==null?R.shadowSide:u[R.side],x.alphaMap=R.alphaMap,x.alphaTest=R.alphaTest,x.map=R.map,x.clipShadows=R.clipShadows,x.clippingPlanes=R.clippingPlanes,x.clipIntersection=R.clipIntersection,x.displacementMap=R.displacementMap,x.displacementScale=R.displacementScale,x.displacementBias=R.displacementBias,x.wireframeLinewidth=R.wireframeLinewidth,x.linewidth=R.linewidth,T.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let U=r.properties.get(x);U.light=T}return x}function _(A,R,T,b,x){if(A.visible===!1)return;if(A.layers.test(R.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&x===Vi)&&(!A.frustumCulled||i.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,A.matrixWorld);let U=e.update(A),V=A.material;if(Array.isArray(V)){let G=U.groups;for(let P=0,L=G.length;P<L;P++){let H=G[P],F=V[H.materialIndex];if(F&&F.visible){let K=w(A,F,b,x);A.onBeforeShadow(r,A,R,T,U,K,H),r.renderBufferDirect(T,null,U,K,A,H),A.onAfterShadow(r,A,R,T,U,K,H)}}}else if(V.visible){let G=w(A,V,b,x);A.onBeforeShadow(r,A,R,T,U,G,null),r.renderBufferDirect(T,null,U,G,A,null),A.onAfterShadow(r,A,R,T,U,G,null)}}let C=A.children;for(let U=0,V=C.length;U<V;U++)_(C[U],R,T,b,x)}function D(A){A.target.removeEventListener("dispose",D);for(let R in c){let T=c[R],b=A.target.uuid;b in T&&(T[b].dispose(),delete T[b])}}}var Ox={[ka]:Oa,[Fa]:za,[Ba]:Va,[Jr]:Ha,[Oa]:ka,[za]:Fa,[Va]:Ba,[Ha]:Jr};function Fx(r,e){function t(){let N=!1,le=new ot,X=null,ee=new ot(0,0,0,0);return{setMask:function(ue){X!==ue&&!N&&(r.colorMask(ue,ue,ue,ue),X=ue)},setLocked:function(ue){N=ue},setClear:function(ue,de,Ye,_t,Dt){Dt===!0&&(ue*=_t,de*=_t,Ye*=_t),le.set(ue,de,Ye,_t),ee.equals(le)===!1&&(r.clearColor(ue,de,Ye,_t),ee.copy(le))},reset:function(){N=!1,X=null,ee.set(-1,0,0,0)}}}function i(){let N=!1,le=!1,X=null,ee=null,ue=null;return{setReversed:function(de){if(le!==de){let Ye=e.get("EXT_clip_control");le?Ye.clipControlEXT(Ye.LOWER_LEFT_EXT,Ye.ZERO_TO_ONE_EXT):Ye.clipControlEXT(Ye.LOWER_LEFT_EXT,Ye.NEGATIVE_ONE_TO_ONE_EXT);let _t=ue;ue=null,this.setClear(_t)}le=de},getReversed:function(){return le},setTest:function(de){de?me(r.DEPTH_TEST):xe(r.DEPTH_TEST)},setMask:function(de){X!==de&&!N&&(r.depthMask(de),X=de)},setFunc:function(de){if(le&&(de=Ox[de]),ee!==de){switch(de){case ka:r.depthFunc(r.NEVER);break;case Oa:r.depthFunc(r.ALWAYS);break;case Fa:r.depthFunc(r.LESS);break;case Jr:r.depthFunc(r.LEQUAL);break;case Ba:r.depthFunc(r.EQUAL);break;case Ha:r.depthFunc(r.GEQUAL);break;case za:r.depthFunc(r.GREATER);break;case Va:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}ee=de}},setLocked:function(de){N=de},setClear:function(de){ue!==de&&(le&&(de=1-de),r.clearDepth(de),ue=de)},reset:function(){N=!1,X=null,ee=null,ue=null,le=!1}}}function n(){let N=!1,le=null,X=null,ee=null,ue=null,de=null,Ye=null,_t=null,Dt=null;return{setTest:function(Ke){N||(Ke?me(r.STENCIL_TEST):xe(r.STENCIL_TEST))},setMask:function(Ke){le!==Ke&&!N&&(r.stencilMask(Ke),le=Ke)},setFunc:function(Ke,ni,fi){(X!==Ke||ee!==ni||ue!==fi)&&(r.stencilFunc(Ke,ni,fi),X=Ke,ee=ni,ue=fi)},setOp:function(Ke,ni,fi){(de!==Ke||Ye!==ni||_t!==fi)&&(r.stencilOp(Ke,ni,fi),de=Ke,Ye=ni,_t=fi)},setLocked:function(Ke){N=Ke},setClear:function(Ke){Dt!==Ke&&(r.clearStencil(Ke),Dt=Ke)},reset:function(){N=!1,le=null,X=null,ee=null,ue=null,de=null,Ye=null,_t=null,Dt=null}}}let s=new t,a=new i,o=new n,l=new WeakMap,c=new WeakMap,d={},u={},h=new WeakMap,p=[],g=null,v=!1,m=null,f=null,M=null,w=null,_=null,D=null,A=null,R=new Fe(0,0,0),T=0,b=!1,x=null,C=null,U=null,V=null,G=null,P=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS),L=!1,H=0,F=r.getParameter(r.VERSION);F.indexOf("WebGL")!==-1?(H=parseFloat(/^WebGL (\d)/.exec(F)[1]),L=H>=1):F.indexOf("OpenGL ES")!==-1&&(H=parseFloat(/^OpenGL ES (\d)/.exec(F)[1]),L=H>=2);let K=null,ne={},ce=r.getParameter(r.SCISSOR_BOX),fe=r.getParameter(r.VIEWPORT),re=new ot().fromArray(ce),$=new ot().fromArray(fe);function ie(N,le,X,ee){let ue=new Uint8Array(4),de=r.createTexture();r.bindTexture(N,de),r.texParameteri(N,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(N,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let Ye=0;Ye<X;Ye++)N===r.TEXTURE_3D||N===r.TEXTURE_2D_ARRAY?r.texImage3D(le,0,r.RGBA,1,1,ee,0,r.RGBA,r.UNSIGNED_BYTE,ue):r.texImage2D(le+Ye,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,ue);return de}let ve={};ve[r.TEXTURE_2D]=ie(r.TEXTURE_2D,r.TEXTURE_2D,1),ve[r.TEXTURE_CUBE_MAP]=ie(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),ve[r.TEXTURE_2D_ARRAY]=ie(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),ve[r.TEXTURE_3D]=ie(r.TEXTURE_3D,r.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),me(r.DEPTH_TEST),a.setFunc(Jr),ze(!1),je(uc),me(r.CULL_FACE),B(dr);function me(N){d[N]!==!0&&(r.enable(N),d[N]=!0)}function xe(N){d[N]!==!1&&(r.disable(N),d[N]=!1)}function Re(N,le){return u[N]!==le?(r.bindFramebuffer(N,le),u[N]=le,N===r.DRAW_FRAMEBUFFER&&(u[r.FRAMEBUFFER]=le),N===r.FRAMEBUFFER&&(u[r.DRAW_FRAMEBUFFER]=le),!0):!1}function Ue(N,le){let X=p,ee=!1;if(N){X=h.get(le),X===void 0&&(X=[],h.set(le,X));let ue=N.textures;if(X.length!==ue.length||X[0]!==r.COLOR_ATTACHMENT0){for(let de=0,Ye=ue.length;de<Ye;de++)X[de]=r.COLOR_ATTACHMENT0+de;X.length=ue.length,ee=!0}}else X[0]!==r.BACK&&(X[0]=r.BACK,ee=!0);ee&&r.drawBuffers(X)}function qe(N){return g!==N?(r.useProgram(N),g=N,!0):!1}let He={[Cr]:r.FUNC_ADD,[Hh]:r.FUNC_SUBTRACT,[zh]:r.FUNC_REVERSE_SUBTRACT};He[Vh]=r.MIN,He[Gh]=r.MAX;let rt={[$h]:r.ZERO,[Wh]:r.ONE,[jh]:r.SRC_COLOR,[Ua]:r.SRC_ALPHA,[Jh]:r.SRC_ALPHA_SATURATE,[Kh]:r.DST_COLOR,[Xh]:r.DST_ALPHA,[qh]:r.ONE_MINUS_SRC_COLOR,[Na]:r.ONE_MINUS_SRC_ALPHA,[Zh]:r.ONE_MINUS_DST_COLOR,[Yh]:r.ONE_MINUS_DST_ALPHA,[Qh]:r.CONSTANT_COLOR,[ep]:r.ONE_MINUS_CONSTANT_COLOR,[tp]:r.CONSTANT_ALPHA,[ip]:r.ONE_MINUS_CONSTANT_ALPHA};function B(N,le,X,ee,ue,de,Ye,_t,Dt,Ke){if(N===dr){v===!0&&(xe(r.BLEND),v=!1);return}if(v===!1&&(me(r.BLEND),v=!0),N!==Bh){if(N!==m||Ke!==b){if((f!==Cr||_!==Cr)&&(r.blendEquation(r.FUNC_ADD),f=Cr,_=Cr),Ke)switch(N){case Kr:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case hc:r.blendFunc(r.ONE,r.ONE);break;case pc:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case mc:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}else switch(N){case Kr:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case hc:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case pc:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case mc:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}M=null,w=null,D=null,A=null,R.set(0,0,0),T=0,m=N,b=Ke}return}ue=ue||le,de=de||X,Ye=Ye||ee,(le!==f||ue!==_)&&(r.blendEquationSeparate(He[le],He[ue]),f=le,_=ue),(X!==M||ee!==w||de!==D||Ye!==A)&&(r.blendFuncSeparate(rt[X],rt[ee],rt[de],rt[Ye]),M=X,w=ee,D=de,A=Ye),(_t.equals(R)===!1||Dt!==T)&&(r.blendColor(_t.r,_t.g,_t.b,Dt),R.copy(_t),T=Dt),m=N,b=!1}function yt(N,le){N.side===Ai?xe(r.CULL_FACE):me(r.CULL_FACE);let X=N.side===qt;le&&(X=!X),ze(X),N.blending===Kr&&N.transparent===!1?B(dr):B(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),s.setMask(N.colorWrite);let ee=N.stencilWrite;o.setTest(ee),ee&&(o.setMask(N.stencilWriteMask),o.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),o.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),lt(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?me(r.SAMPLE_ALPHA_TO_COVERAGE):xe(r.SAMPLE_ALPHA_TO_COVERAGE)}function ze(N){x!==N&&(N?r.frontFace(r.CW):r.frontFace(r.CCW),x=N)}function je(N){N!==kh?(me(r.CULL_FACE),N!==C&&(N===uc?r.cullFace(r.BACK):N===Oh?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):xe(r.CULL_FACE),C=N}function we(N){N!==U&&(L&&r.lineWidth(N),U=N)}function lt(N,le,X){N?(me(r.POLYGON_OFFSET_FILL),(V!==le||G!==X)&&(r.polygonOffset(le,X),V=le,G=X)):xe(r.POLYGON_OFFSET_FILL)}function Me(N){N?me(r.SCISSOR_TEST):xe(r.SCISSOR_TEST)}function E(N){N===void 0&&(N=r.TEXTURE0+P-1),K!==N&&(r.activeTexture(N),K=N)}function y(N,le,X){X===void 0&&(K===null?X=r.TEXTURE0+P-1:X=K);let ee=ne[X];ee===void 0&&(ee={type:void 0,texture:void 0},ne[X]=ee),(ee.type!==N||ee.texture!==le)&&(K!==X&&(r.activeTexture(X),K=X),r.bindTexture(N,le||ve[N]),ee.type=N,ee.texture=le)}function W(){let N=ne[K];N!==void 0&&N.type!==void 0&&(r.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function Q(){try{r.compressedTexImage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function te(){try{r.compressedTexImage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Z(){try{r.texSubImage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Te(){try{r.texSubImage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function he(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ye(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function tt(){try{r.texStorage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function oe(){try{r.texStorage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function be(){try{r.texImage2D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function De(){try{r.texImage3D.apply(r,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Le(N){re.equals(N)===!1&&(r.scissor(N.x,N.y,N.z,N.w),re.copy(N))}function _e(N){$.equals(N)===!1&&(r.viewport(N.x,N.y,N.z,N.w),$.copy(N))}function Xe(N,le){let X=c.get(le);X===void 0&&(X=new WeakMap,c.set(le,X));let ee=X.get(N);ee===void 0&&(ee=r.getUniformBlockIndex(le,N.name),X.set(N,ee))}function Ve(N,le){let X=c.get(le).get(N);l.get(le)!==X&&(r.uniformBlockBinding(le,X,N.__bindingPointIndex),l.set(le,X))}function pt(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),a.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),d={},K=null,ne={},u={},h=new WeakMap,p=[],g=null,v=!1,m=null,f=null,M=null,w=null,_=null,D=null,A=null,R=new Fe(0,0,0),T=0,b=!1,x=null,C=null,U=null,V=null,G=null,re.set(0,0,r.canvas.width,r.canvas.height),$.set(0,0,r.canvas.width,r.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:me,disable:xe,bindFramebuffer:Re,drawBuffers:Ue,useProgram:qe,setBlending:B,setMaterial:yt,setFlipSided:ze,setCullFace:je,setLineWidth:we,setPolygonOffset:lt,setScissorTest:Me,activeTexture:E,bindTexture:y,unbindTexture:W,compressedTexImage2D:Q,compressedTexImage3D:te,texImage2D:be,texImage3D:De,updateUBOMapping:Xe,uniformBlockBinding:Ve,texStorage2D:tt,texStorage3D:oe,texSubImage2D:Z,texSubImage3D:Te,compressedTexSubImage2D:he,compressedTexSubImage3D:ye,scissor:Le,viewport:_e,reset:pt}}function Ku(r,e,t,i){let n=Bx(i);switch(t){case Rd:return r*e;case Ld:return r*e;case Pd:return r*e*2;case al:return r*e/n.components*n.byteLength;case ol:return r*e/n.components*n.byteLength;case Id:return r*e*2/n.components*n.byteLength;case ll:return r*e*2/n.components*n.byteLength;case Cd:return r*e*3/n.components*n.byteLength;case di:return r*e*4/n.components*n.byteLength;case cl:return r*e*4/n.components*n.byteLength;case ps:case ms:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case fs:case gs:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case ja:case Xa:return Math.max(r,16)*Math.max(e,8)/4;case Wa:case qa:return Math.max(r,8)*Math.max(e,8)/2;case Ya:case Ka:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case Za:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Ja:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Qa:return Math.floor((r+4)/5)*Math.floor((e+3)/4)*16;case eo:return Math.floor((r+4)/5)*Math.floor((e+4)/5)*16;case to:return Math.floor((r+5)/6)*Math.floor((e+4)/5)*16;case io:return Math.floor((r+5)/6)*Math.floor((e+5)/6)*16;case ro:return Math.floor((r+7)/8)*Math.floor((e+4)/5)*16;case no:return Math.floor((r+7)/8)*Math.floor((e+5)/6)*16;case so:return Math.floor((r+7)/8)*Math.floor((e+7)/8)*16;case ao:return Math.floor((r+9)/10)*Math.floor((e+4)/5)*16;case oo:return Math.floor((r+9)/10)*Math.floor((e+5)/6)*16;case lo:return Math.floor((r+9)/10)*Math.floor((e+7)/8)*16;case co:return Math.floor((r+9)/10)*Math.floor((e+9)/10)*16;case uo:return Math.floor((r+11)/12)*Math.floor((e+9)/10)*16;case ho:return Math.floor((r+11)/12)*Math.floor((e+11)/12)*16;case vs:case po:case mo:return Math.ceil(r/4)*Math.ceil(e/4)*16;case Dd:case fo:return Math.ceil(r/4)*Math.ceil(e/4)*8;case go:case vo:return Math.ceil(r/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Bx(r){switch(r){case Xi:case Td:return{byteLength:1,components:1};case Nn:case Ed:case Xn:return{byteLength:2,components:1};case nl:case sl:return{byteLength:2,components:4};case Dr:case rl:case _i:return{byteLength:4,components:1};case Ad:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}function Hx(r,e,t,i,n,s,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new it,d=new WeakMap,u,h=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,y){return p?new OffscreenCanvas(E,y):Ms("canvas")}function v(E,y,W){let Q=1,te=Me(E);if((te.width>W||te.height>W)&&(Q=W/Math.max(te.width,te.height)),Q<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){let Z=Math.floor(Q*te.width),Te=Math.floor(Q*te.height);u===void 0&&(u=g(Z,Te));let he=y?g(Z,Te):u;return he.width=Z,he.height=Te,he.getContext("2d").drawImage(E,0,0,Z,Te),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+te.width+"x"+te.height+") to ("+Z+"x"+Te+")."),he}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+te.width+"x"+te.height+")."),E;return E}function m(E){return E.generateMipmaps}function f(E){r.generateMipmap(E)}function M(E){return E.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?r.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function w(E,y,W,Q,te=!1){if(E!==null){if(r[E]!==void 0)return r[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let Z=y;if(y===r.RED&&(W===r.FLOAT&&(Z=r.R32F),W===r.HALF_FLOAT&&(Z=r.R16F),W===r.UNSIGNED_BYTE&&(Z=r.R8)),y===r.RED_INTEGER&&(W===r.UNSIGNED_BYTE&&(Z=r.R8UI),W===r.UNSIGNED_SHORT&&(Z=r.R16UI),W===r.UNSIGNED_INT&&(Z=r.R32UI),W===r.BYTE&&(Z=r.R8I),W===r.SHORT&&(Z=r.R16I),W===r.INT&&(Z=r.R32I)),y===r.RG&&(W===r.FLOAT&&(Z=r.RG32F),W===r.HALF_FLOAT&&(Z=r.RG16F),W===r.UNSIGNED_BYTE&&(Z=r.RG8)),y===r.RG_INTEGER&&(W===r.UNSIGNED_BYTE&&(Z=r.RG8UI),W===r.UNSIGNED_SHORT&&(Z=r.RG16UI),W===r.UNSIGNED_INT&&(Z=r.RG32UI),W===r.BYTE&&(Z=r.RG8I),W===r.SHORT&&(Z=r.RG16I),W===r.INT&&(Z=r.RG32I)),y===r.RGB_INTEGER&&(W===r.UNSIGNED_BYTE&&(Z=r.RGB8UI),W===r.UNSIGNED_SHORT&&(Z=r.RGB16UI),W===r.UNSIGNED_INT&&(Z=r.RGB32UI),W===r.BYTE&&(Z=r.RGB8I),W===r.SHORT&&(Z=r.RGB16I),W===r.INT&&(Z=r.RGB32I)),y===r.RGBA_INTEGER&&(W===r.UNSIGNED_BYTE&&(Z=r.RGBA8UI),W===r.UNSIGNED_SHORT&&(Z=r.RGBA16UI),W===r.UNSIGNED_INT&&(Z=r.RGBA32UI),W===r.BYTE&&(Z=r.RGBA8I),W===r.SHORT&&(Z=r.RGBA16I),W===r.INT&&(Z=r.RGBA32I)),y===r.RGB&&W===r.UNSIGNED_INT_5_9_9_9_REV&&(Z=r.RGB9_E5),y===r.RGBA){let Te=te?qs:et.getTransfer(Q);W===r.FLOAT&&(Z=r.RGBA32F),W===r.HALF_FLOAT&&(Z=r.RGBA16F),W===r.UNSIGNED_BYTE&&(Z=Te===dt?r.SRGB8_ALPHA8:r.RGBA8),W===r.UNSIGNED_SHORT_4_4_4_4&&(Z=r.RGBA4),W===r.UNSIGNED_SHORT_5_5_5_1&&(Z=r.RGB5_A1)}return(Z===r.R16F||Z===r.R32F||Z===r.RG16F||Z===r.RG32F||Z===r.RGBA16F||Z===r.RGBA32F)&&e.get("EXT_color_buffer_float"),Z}function _(E,y){let W;return E?y===null||y===Dr||y===rn?W=r.DEPTH24_STENCIL8:y===_i?W=r.DEPTH32F_STENCIL8:y===Nn&&(W=r.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Dr||y===rn?W=r.DEPTH_COMPONENT24:y===_i?W=r.DEPTH_COMPONENT32F:y===Nn&&(W=r.DEPTH_COMPONENT16),W}function D(E,y){return m(E)===!0||E.isFramebufferTexture&&E.minFilter!==Xt&&E.minFilter!==ri?Math.log2(Math.max(y.width,y.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?y.mipmaps.length:1}function A(E){let y=E.target;y.removeEventListener("dispose",A),T(y),y.isVideoTexture&&d.delete(y)}function R(E){let y=E.target;y.removeEventListener("dispose",R),x(y)}function T(E){let y=i.get(E);if(y.__webglInit===void 0)return;let W=E.source,Q=h.get(W);if(Q){let te=Q[y.__cacheKey];te.usedTimes--,te.usedTimes===0&&b(E),Object.keys(Q).length===0&&h.delete(W)}i.remove(E)}function b(E){let y=i.get(E);r.deleteTexture(y.__webglTexture);let W=E.source,Q=h.get(W);delete Q[y.__cacheKey],a.memory.textures--}function x(E){let y=i.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),i.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(y.__webglFramebuffer[Q]))for(let te=0;te<y.__webglFramebuffer[Q].length;te++)r.deleteFramebuffer(y.__webglFramebuffer[Q][te]);else r.deleteFramebuffer(y.__webglFramebuffer[Q]);y.__webglDepthbuffer&&r.deleteRenderbuffer(y.__webglDepthbuffer[Q])}else{if(Array.isArray(y.__webglFramebuffer))for(let Q=0;Q<y.__webglFramebuffer.length;Q++)r.deleteFramebuffer(y.__webglFramebuffer[Q]);else r.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&r.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&r.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let Q=0;Q<y.__webglColorRenderbuffer.length;Q++)y.__webglColorRenderbuffer[Q]&&r.deleteRenderbuffer(y.__webglColorRenderbuffer[Q]);y.__webglDepthRenderbuffer&&r.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let W=E.textures;for(let Q=0,te=W.length;Q<te;Q++){let Z=i.get(W[Q]);Z.__webglTexture&&(r.deleteTexture(Z.__webglTexture),a.memory.textures--),i.remove(W[Q])}i.remove(E)}let C=0;function U(){C=0}function V(){let E=C;return E>=n.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+n.maxTextures),C+=1,E}function G(E){let y=[];return y.push(E.wrapS),y.push(E.wrapT),y.push(E.wrapR||0),y.push(E.magFilter),y.push(E.minFilter),y.push(E.anisotropy),y.push(E.internalFormat),y.push(E.format),y.push(E.type),y.push(E.generateMipmaps),y.push(E.premultiplyAlpha),y.push(E.flipY),y.push(E.unpackAlignment),y.push(E.colorSpace),y.join()}function P(E,y){let W=i.get(E);if(E.isVideoTexture&&we(E),E.isRenderTargetTexture===!1&&E.version>0&&W.__version!==E.version){let Q=E.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(W,E,y);return}}t.bindTexture(r.TEXTURE_2D,W.__webglTexture,r.TEXTURE0+y)}function L(E,y){let W=i.get(E);if(E.version>0&&W.__version!==E.version){$(W,E,y);return}t.bindTexture(r.TEXTURE_2D_ARRAY,W.__webglTexture,r.TEXTURE0+y)}function H(E,y){let W=i.get(E);if(E.version>0&&W.__version!==E.version){$(W,E,y);return}t.bindTexture(r.TEXTURE_3D,W.__webglTexture,r.TEXTURE0+y)}function F(E,y){let W=i.get(E);if(E.version>0&&W.__version!==E.version){ie(W,E,y);return}t.bindTexture(r.TEXTURE_CUBE_MAP,W.__webglTexture,r.TEXTURE0+y)}let K={[tn]:r.REPEAT,[lr]:r.CLAMP_TO_EDGE,[Ss]:r.MIRRORED_REPEAT},ne={[Xt]:r.NEAREST,[Md]:r.NEAREST_MIPMAP_NEAREST,[Ln]:r.NEAREST_MIPMAP_LINEAR,[ri]:r.LINEAR,[hs]:r.LINEAR_MIPMAP_NEAREST,[Wi]:r.LINEAR_MIPMAP_LINEAR},ce={[vp]:r.NEVER,[wp]:r.ALWAYS,[xp]:r.LESS,[kd]:r.LEQUAL,[_p]:r.EQUAL,[Sp]:r.GEQUAL,[yp]:r.GREATER,[bp]:r.NOTEQUAL};function fe(E,y){if(y.type===_i&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===ri||y.magFilter===hs||y.magFilter===Ln||y.magFilter===Wi||y.minFilter===ri||y.minFilter===hs||y.minFilter===Ln||y.minFilter===Wi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(E,r.TEXTURE_WRAP_S,K[y.wrapS]),r.texParameteri(E,r.TEXTURE_WRAP_T,K[y.wrapT]),(E===r.TEXTURE_3D||E===r.TEXTURE_2D_ARRAY)&&r.texParameteri(E,r.TEXTURE_WRAP_R,K[y.wrapR]),r.texParameteri(E,r.TEXTURE_MAG_FILTER,ne[y.magFilter]),r.texParameteri(E,r.TEXTURE_MIN_FILTER,ne[y.minFilter]),y.compareFunction&&(r.texParameteri(E,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(E,r.TEXTURE_COMPARE_FUNC,ce[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Xt||y.minFilter!==Ln&&y.minFilter!==Wi||y.type===_i&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){let W=e.get("EXT_texture_filter_anisotropic");r.texParameterf(E,W.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,n.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function re(E,y){let W=!1;E.__webglInit===void 0&&(E.__webglInit=!0,y.addEventListener("dispose",A));let Q=y.source,te=h.get(Q);te===void 0&&(te={},h.set(Q,te));let Z=G(y);if(Z!==E.__cacheKey){te[Z]===void 0&&(te[Z]={texture:r.createTexture(),usedTimes:0},a.memory.textures++,W=!0),te[Z].usedTimes++;let Te=te[E.__cacheKey];Te!==void 0&&(te[E.__cacheKey].usedTimes--,Te.usedTimes===0&&b(y)),E.__cacheKey=Z,E.__webglTexture=te[Z].texture}return W}function $(E,y,W){let Q=r.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(Q=r.TEXTURE_2D_ARRAY),y.isData3DTexture&&(Q=r.TEXTURE_3D);let te=re(E,y),Z=y.source;t.bindTexture(Q,E.__webglTexture,r.TEXTURE0+W);let Te=i.get(Z);if(Z.version!==Te.__version||te===!0){t.activeTexture(r.TEXTURE0+W);let he=et.getPrimaries(et.workingColorSpace),ye=y.colorSpace===or?null:et.getPrimaries(y.colorSpace),tt=y.colorSpace===or||he===ye?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,y.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,y.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,tt);let oe=v(y.image,!1,n.maxTextureSize);oe=lt(y,oe);let be=s.convert(y.format,y.colorSpace),De=s.convert(y.type),Le=w(y.internalFormat,be,De,y.colorSpace,y.isVideoTexture);fe(Q,y);let _e,Xe=y.mipmaps,Ve=y.isVideoTexture!==!0,pt=Te.__version===void 0||te===!0,N=Z.dataReady,le=D(y,oe);if(y.isDepthTexture)Le=_(y.format===nn,y.type),pt&&(Ve?t.texStorage2D(r.TEXTURE_2D,1,Le,oe.width,oe.height):t.texImage2D(r.TEXTURE_2D,0,Le,oe.width,oe.height,0,be,De,null));else if(y.isDataTexture)if(Xe.length>0){Ve&&pt&&t.texStorage2D(r.TEXTURE_2D,le,Le,Xe[0].width,Xe[0].height);for(let X=0,ee=Xe.length;X<ee;X++)_e=Xe[X],Ve?N&&t.texSubImage2D(r.TEXTURE_2D,X,0,0,_e.width,_e.height,be,De,_e.data):t.texImage2D(r.TEXTURE_2D,X,Le,_e.width,_e.height,0,be,De,_e.data);y.generateMipmaps=!1}else Ve?(pt&&t.texStorage2D(r.TEXTURE_2D,le,Le,oe.width,oe.height),N&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,oe.width,oe.height,be,De,oe.data)):t.texImage2D(r.TEXTURE_2D,0,Le,oe.width,oe.height,0,be,De,oe.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ve&&pt&&t.texStorage3D(r.TEXTURE_2D_ARRAY,le,Le,Xe[0].width,Xe[0].height,oe.depth);for(let X=0,ee=Xe.length;X<ee;X++)if(_e=Xe[X],y.format!==di)if(be!==null)if(Ve){if(N)if(y.layerUpdates.size>0){let ue=Ku(_e.width,_e.height,y.format,y.type);for(let de of y.layerUpdates){let Ye=_e.data.subarray(de*ue/_e.data.BYTES_PER_ELEMENT,(de+1)*ue/_e.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,X,0,0,de,_e.width,_e.height,1,be,Ye)}y.clearLayerUpdates()}else t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,X,0,0,0,_e.width,_e.height,oe.depth,be,_e.data)}else t.compressedTexImage3D(r.TEXTURE_2D_ARRAY,X,Le,_e.width,_e.height,oe.depth,0,_e.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ve?N&&t.texSubImage3D(r.TEXTURE_2D_ARRAY,X,0,0,0,_e.width,_e.height,oe.depth,be,De,_e.data):t.texImage3D(r.TEXTURE_2D_ARRAY,X,Le,_e.width,_e.height,oe.depth,0,be,De,_e.data)}else{Ve&&pt&&t.texStorage2D(r.TEXTURE_2D,le,Le,Xe[0].width,Xe[0].height);for(let X=0,ee=Xe.length;X<ee;X++)_e=Xe[X],y.format!==di?be!==null?Ve?N&&t.compressedTexSubImage2D(r.TEXTURE_2D,X,0,0,_e.width,_e.height,be,_e.data):t.compressedTexImage2D(r.TEXTURE_2D,X,Le,_e.width,_e.height,0,_e.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ve?N&&t.texSubImage2D(r.TEXTURE_2D,X,0,0,_e.width,_e.height,be,De,_e.data):t.texImage2D(r.TEXTURE_2D,X,Le,_e.width,_e.height,0,be,De,_e.data)}else if(y.isDataArrayTexture)if(Ve){if(pt&&t.texStorage3D(r.TEXTURE_2D_ARRAY,le,Le,oe.width,oe.height,oe.depth),N)if(y.layerUpdates.size>0){let X=Ku(oe.width,oe.height,y.format,y.type);for(let ee of y.layerUpdates){let ue=oe.data.subarray(ee*X/oe.data.BYTES_PER_ELEMENT,(ee+1)*X/oe.data.BYTES_PER_ELEMENT);t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,ee,oe.width,oe.height,1,be,De,ue)}y.clearLayerUpdates()}else t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,oe.width,oe.height,oe.depth,be,De,oe.data)}else t.texImage3D(r.TEXTURE_2D_ARRAY,0,Le,oe.width,oe.height,oe.depth,0,be,De,oe.data);else if(y.isData3DTexture)Ve?(pt&&t.texStorage3D(r.TEXTURE_3D,le,Le,oe.width,oe.height,oe.depth),N&&t.texSubImage3D(r.TEXTURE_3D,0,0,0,0,oe.width,oe.height,oe.depth,be,De,oe.data)):t.texImage3D(r.TEXTURE_3D,0,Le,oe.width,oe.height,oe.depth,0,be,De,oe.data);else if(y.isFramebufferTexture){if(pt)if(Ve)t.texStorage2D(r.TEXTURE_2D,le,Le,oe.width,oe.height);else{let X=oe.width,ee=oe.height;for(let ue=0;ue<le;ue++)t.texImage2D(r.TEXTURE_2D,ue,Le,X,ee,0,be,De,null),X>>=1,ee>>=1}}else if(Xe.length>0){if(Ve&&pt){let X=Me(Xe[0]);t.texStorage2D(r.TEXTURE_2D,le,Le,X.width,X.height)}for(let X=0,ee=Xe.length;X<ee;X++)_e=Xe[X],Ve?N&&t.texSubImage2D(r.TEXTURE_2D,X,0,0,be,De,_e):t.texImage2D(r.TEXTURE_2D,X,Le,be,De,_e);y.generateMipmaps=!1}else if(Ve){if(pt){let X=Me(oe);t.texStorage2D(r.TEXTURE_2D,le,Le,X.width,X.height)}N&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,be,De,oe)}else t.texImage2D(r.TEXTURE_2D,0,Le,be,De,oe);m(y)&&f(Q),Te.__version=Z.version,y.onUpdate&&y.onUpdate(y)}E.__version=y.version}function ie(E,y,W){if(y.image.length!==6)return;let Q=re(E,y),te=y.source;t.bindTexture(r.TEXTURE_CUBE_MAP,E.__webglTexture,r.TEXTURE0+W);let Z=i.get(te);if(te.version!==Z.__version||Q===!0){t.activeTexture(r.TEXTURE0+W);let Te=et.getPrimaries(et.workingColorSpace),he=y.colorSpace===or?null:et.getPrimaries(y.colorSpace),ye=y.colorSpace===or||Te===he?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,y.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,y.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,ye);let tt=y.isCompressedTexture||y.image[0].isCompressedTexture,oe=y.image[0]&&y.image[0].isDataTexture,be=[];for(let ee=0;ee<6;ee++)!tt&&!oe?be[ee]=v(y.image[ee],!0,n.maxCubemapSize):be[ee]=oe?y.image[ee].image:y.image[ee],be[ee]=lt(y,be[ee]);let De=be[0],Le=s.convert(y.format,y.colorSpace),_e=s.convert(y.type),Xe=w(y.internalFormat,Le,_e,y.colorSpace),Ve=y.isVideoTexture!==!0,pt=Z.__version===void 0||Q===!0,N=te.dataReady,le=D(y,De);fe(r.TEXTURE_CUBE_MAP,y);let X;if(tt){Ve&&pt&&t.texStorage2D(r.TEXTURE_CUBE_MAP,le,Xe,De.width,De.height);for(let ee=0;ee<6;ee++){X=be[ee].mipmaps;for(let ue=0;ue<X.length;ue++){let de=X[ue];y.format!==di?Le!==null?Ve?N&&t.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ue,0,0,de.width,de.height,Le,de.data):t.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ue,Xe,de.width,de.height,0,de.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ve?N&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ue,0,0,de.width,de.height,Le,_e,de.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ue,Xe,de.width,de.height,0,Le,_e,de.data)}}}else{if(X=y.mipmaps,Ve&&pt){X.length>0&&le++;let ee=Me(be[0]);t.texStorage2D(r.TEXTURE_CUBE_MAP,le,Xe,ee.width,ee.height)}for(let ee=0;ee<6;ee++)if(oe){Ve?N&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,be[ee].width,be[ee].height,Le,_e,be[ee].data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,Xe,be[ee].width,be[ee].height,0,Le,_e,be[ee].data);for(let ue=0;ue<X.length;ue++){let de=X[ue].image[ee].image;Ve?N&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ue+1,0,0,de.width,de.height,Le,_e,de.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ue+1,Xe,de.width,de.height,0,Le,_e,de.data)}}else{Ve?N&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,Le,_e,be[ee]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,Xe,Le,_e,be[ee]);for(let ue=0;ue<X.length;ue++){let de=X[ue];Ve?N&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ue+1,0,0,Le,_e,de.image[ee]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ee,ue+1,Xe,Le,_e,de.image[ee])}}}m(y)&&f(r.TEXTURE_CUBE_MAP),Z.__version=te.version,y.onUpdate&&y.onUpdate(y)}E.__version=y.version}function ve(E,y,W,Q,te,Z){let Te=s.convert(W.format,W.colorSpace),he=s.convert(W.type),ye=w(W.internalFormat,Te,he,W.colorSpace),tt=i.get(y),oe=i.get(W);if(oe.__renderTarget=y,!tt.__hasExternalTextures){let be=Math.max(1,y.width>>Z),De=Math.max(1,y.height>>Z);te===r.TEXTURE_3D||te===r.TEXTURE_2D_ARRAY?t.texImage3D(te,Z,ye,be,De,y.depth,0,Te,he,null):t.texImage2D(te,Z,ye,be,De,0,Te,he,null)}t.bindFramebuffer(r.FRAMEBUFFER,E),je(y)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,Q,te,oe.__webglTexture,0,ze(y)):(te===r.TEXTURE_2D||te>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&te<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,Q,te,oe.__webglTexture,Z),t.bindFramebuffer(r.FRAMEBUFFER,null)}function me(E,y,W){if(r.bindRenderbuffer(r.RENDERBUFFER,E),y.depthBuffer){let Q=y.depthTexture,te=Q&&Q.isDepthTexture?Q.type:null,Z=_(y.stencilBuffer,te),Te=y.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,he=ze(y);je(y)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,he,Z,y.width,y.height):W?r.renderbufferStorageMultisample(r.RENDERBUFFER,he,Z,y.width,y.height):r.renderbufferStorage(r.RENDERBUFFER,Z,y.width,y.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,Te,r.RENDERBUFFER,E)}else{let Q=y.textures;for(let te=0;te<Q.length;te++){let Z=Q[te],Te=s.convert(Z.format,Z.colorSpace),he=s.convert(Z.type),ye=w(Z.internalFormat,Te,he,Z.colorSpace),tt=ze(y);W&&je(y)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,tt,ye,y.width,y.height):je(y)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,tt,ye,y.width,y.height):r.renderbufferStorage(r.RENDERBUFFER,ye,y.width,y.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function xe(E,y){if(y&&y.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(r.FRAMEBUFFER,E),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let W=i.get(y.depthTexture);W.__renderTarget=y,(!W.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),P(y.depthTexture,0);let Q=W.__webglTexture,te=ze(y);if(y.depthTexture.format===Zr)je(y)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,Q,0,te):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,Q,0);else if(y.depthTexture.format===nn)je(y)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,Q,0,te):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,Q,0);else throw new Error("Unknown depthTexture format")}function Re(E){let y=i.get(E),W=E.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==E.depthTexture){let Q=E.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),Q){let te=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,Q.removeEventListener("dispose",te)};Q.addEventListener("dispose",te),y.__depthDisposeCallback=te}y.__boundDepthTexture=Q}if(E.depthTexture&&!y.__autoAllocateDepthBuffer){if(W)throw new Error("target.depthTexture not supported in Cube render targets");xe(y.__webglFramebuffer,E)}else if(W){y.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)if(t.bindFramebuffer(r.FRAMEBUFFER,y.__webglFramebuffer[Q]),y.__webglDepthbuffer[Q]===void 0)y.__webglDepthbuffer[Q]=r.createRenderbuffer(),me(y.__webglDepthbuffer[Q],E,!1);else{let te=E.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Z=y.__webglDepthbuffer[Q];r.bindRenderbuffer(r.RENDERBUFFER,Z),r.framebufferRenderbuffer(r.FRAMEBUFFER,te,r.RENDERBUFFER,Z)}}else if(t.bindFramebuffer(r.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=r.createRenderbuffer(),me(y.__webglDepthbuffer,E,!1);else{let Q=E.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,te=y.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,te),r.framebufferRenderbuffer(r.FRAMEBUFFER,Q,r.RENDERBUFFER,te)}t.bindFramebuffer(r.FRAMEBUFFER,null)}function Ue(E,y,W){let Q=i.get(E);y!==void 0&&ve(Q.__webglFramebuffer,E,E.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),W!==void 0&&Re(E)}function qe(E){let y=E.texture,W=i.get(E),Q=i.get(y);E.addEventListener("dispose",R);let te=E.textures,Z=E.isWebGLCubeRenderTarget===!0,Te=te.length>1;if(Te||(Q.__webglTexture===void 0&&(Q.__webglTexture=r.createTexture()),Q.__version=y.version,a.memory.textures++),Z){W.__webglFramebuffer=[];for(let he=0;he<6;he++)if(y.mipmaps&&y.mipmaps.length>0){W.__webglFramebuffer[he]=[];for(let ye=0;ye<y.mipmaps.length;ye++)W.__webglFramebuffer[he][ye]=r.createFramebuffer()}else W.__webglFramebuffer[he]=r.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){W.__webglFramebuffer=[];for(let he=0;he<y.mipmaps.length;he++)W.__webglFramebuffer[he]=r.createFramebuffer()}else W.__webglFramebuffer=r.createFramebuffer();if(Te)for(let he=0,ye=te.length;he<ye;he++){let tt=i.get(te[he]);tt.__webglTexture===void 0&&(tt.__webglTexture=r.createTexture(),a.memory.textures++)}if(E.samples>0&&je(E)===!1){W.__webglMultisampledFramebuffer=r.createFramebuffer(),W.__webglColorRenderbuffer=[],t.bindFramebuffer(r.FRAMEBUFFER,W.__webglMultisampledFramebuffer);for(let he=0;he<te.length;he++){let ye=te[he];W.__webglColorRenderbuffer[he]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,W.__webglColorRenderbuffer[he]);let tt=s.convert(ye.format,ye.colorSpace),oe=s.convert(ye.type),be=w(ye.internalFormat,tt,oe,ye.colorSpace,E.isXRRenderTarget===!0),De=ze(E);r.renderbufferStorageMultisample(r.RENDERBUFFER,De,be,E.width,E.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+he,r.RENDERBUFFER,W.__webglColorRenderbuffer[he])}r.bindRenderbuffer(r.RENDERBUFFER,null),E.depthBuffer&&(W.__webglDepthRenderbuffer=r.createRenderbuffer(),me(W.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(r.FRAMEBUFFER,null)}}if(Z){t.bindTexture(r.TEXTURE_CUBE_MAP,Q.__webglTexture),fe(r.TEXTURE_CUBE_MAP,y);for(let he=0;he<6;he++)if(y.mipmaps&&y.mipmaps.length>0)for(let ye=0;ye<y.mipmaps.length;ye++)ve(W.__webglFramebuffer[he][ye],E,y,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+he,ye);else ve(W.__webglFramebuffer[he],E,y,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+he,0);m(y)&&f(r.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Te){for(let he=0,ye=te.length;he<ye;he++){let tt=te[he],oe=i.get(tt);t.bindTexture(r.TEXTURE_2D,oe.__webglTexture),fe(r.TEXTURE_2D,tt),ve(W.__webglFramebuffer,E,tt,r.COLOR_ATTACHMENT0+he,r.TEXTURE_2D,0),m(tt)&&f(r.TEXTURE_2D)}t.unbindTexture()}else{let he=r.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(he=E.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(he,Q.__webglTexture),fe(he,y),y.mipmaps&&y.mipmaps.length>0)for(let ye=0;ye<y.mipmaps.length;ye++)ve(W.__webglFramebuffer[ye],E,y,r.COLOR_ATTACHMENT0,he,ye);else ve(W.__webglFramebuffer,E,y,r.COLOR_ATTACHMENT0,he,0);m(y)&&f(he),t.unbindTexture()}E.depthBuffer&&Re(E)}function He(E){let y=E.textures;for(let W=0,Q=y.length;W<Q;W++){let te=y[W];if(m(te)){let Z=M(E),Te=i.get(te).__webglTexture;t.bindTexture(Z,Te),f(Z),t.unbindTexture()}}}let rt=[],B=[];function yt(E){if(E.samples>0){if(je(E)===!1){let y=E.textures,W=E.width,Q=E.height,te=r.COLOR_BUFFER_BIT,Z=E.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Te=i.get(E),he=y.length>1;if(he)for(let ye=0;ye<y.length;ye++)t.bindFramebuffer(r.FRAMEBUFFER,Te.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ye,r.RENDERBUFFER,null),t.bindFramebuffer(r.FRAMEBUFFER,Te.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+ye,r.TEXTURE_2D,null,0);t.bindFramebuffer(r.READ_FRAMEBUFFER,Te.__webglMultisampledFramebuffer),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Te.__webglFramebuffer);for(let ye=0;ye<y.length;ye++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(te|=r.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(te|=r.STENCIL_BUFFER_BIT)),he){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,Te.__webglColorRenderbuffer[ye]);let tt=i.get(y[ye]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,tt,0)}r.blitFramebuffer(0,0,W,Q,0,0,W,Q,te,r.NEAREST),l===!0&&(rt.length=0,B.length=0,rt.push(r.COLOR_ATTACHMENT0+ye),E.depthBuffer&&E.resolveDepthBuffer===!1&&(rt.push(Z),B.push(Z),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,B)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,rt))}if(t.bindFramebuffer(r.READ_FRAMEBUFFER,null),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),he)for(let ye=0;ye<y.length;ye++){t.bindFramebuffer(r.FRAMEBUFFER,Te.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ye,r.RENDERBUFFER,Te.__webglColorRenderbuffer[ye]);let tt=i.get(y[ye]).__webglTexture;t.bindFramebuffer(r.FRAMEBUFFER,Te.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+ye,r.TEXTURE_2D,tt,0)}t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Te.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){let y=E.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[y])}}}function ze(E){return Math.min(n.maxSamples,E.samples)}function je(E){let y=i.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function we(E){let y=a.render.frame;d.get(E)!==y&&(d.set(E,y),E.update())}function lt(E,y){let W=E.colorSpace,Q=E.format,te=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||W!==Yt&&W!==or&&(et.getTransfer(W)===dt?(Q!==di||te!==Xi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",W)),y}function Me(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(c.width=E.naturalWidth||E.width,c.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(c.width=E.displayWidth,c.height=E.displayHeight):(c.width=E.width,c.height=E.height),c}this.allocateTextureUnit=V,this.resetTextureUnits=U,this.setTexture2D=P,this.setTexture2DArray=L,this.setTexture3D=H,this.setTextureCube=F,this.rebindTextures=Ue,this.setupRenderTarget=qe,this.updateRenderTargetMipmap=He,this.updateMultisampleRenderTarget=yt,this.setupDepthRenderbuffer=Re,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=je}function Np(r,e){function t(i,n=or){let s,a=et.getTransfer(n);if(i===Xi)return r.UNSIGNED_BYTE;if(i===nl)return r.UNSIGNED_SHORT_4_4_4_4;if(i===sl)return r.UNSIGNED_SHORT_5_5_5_1;if(i===Ad)return r.UNSIGNED_INT_5_9_9_9_REV;if(i===Td)return r.BYTE;if(i===Ed)return r.SHORT;if(i===Nn)return r.UNSIGNED_SHORT;if(i===rl)return r.INT;if(i===Dr)return r.UNSIGNED_INT;if(i===_i)return r.FLOAT;if(i===Xn)return r.HALF_FLOAT;if(i===Rd)return r.ALPHA;if(i===Cd)return r.RGB;if(i===di)return r.RGBA;if(i===Ld)return r.LUMINANCE;if(i===Pd)return r.LUMINANCE_ALPHA;if(i===Zr)return r.DEPTH_COMPONENT;if(i===nn)return r.DEPTH_STENCIL;if(i===al)return r.RED;if(i===ol)return r.RED_INTEGER;if(i===Id)return r.RG;if(i===ll)return r.RG_INTEGER;if(i===cl)return r.RGBA_INTEGER;if(i===ps||i===ms||i===fs||i===gs)if(a===dt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===ps)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ms)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===fs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===gs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===ps)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ms)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===fs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===gs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Wa||i===ja||i===qa||i===Xa)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Wa)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ja)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===qa)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Xa)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Ya||i===Ka||i===Za)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Ya||i===Ka)return a===dt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Za)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Ja||i===Qa||i===eo||i===to||i===io||i===ro||i===no||i===so||i===ao||i===oo||i===lo||i===co||i===uo||i===ho)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Ja)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Qa)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===eo)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===to)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===io)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ro)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===no)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===so)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ao)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===oo)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===lo)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===co)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===uo)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===ho)return a===dt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===vs||i===po||i===mo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===vs)return a===dt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===po)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===mo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Dd||i===fo||i===go||i===vo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===vs)return s.COMPRESSED_RED_RGTC1_EXT;if(i===fo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===go)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===vo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===rn?r.UNSIGNED_INT_24_8:r[i]!==void 0?r[i]:null}return{convert:t}}var Ao=class extends Bt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Li=class extends Tt{constructor(){super(),this.isGroup=!0,this.type="Group"}},zx={type:"move"},ys=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Li,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Li,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Li,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let n=null,s=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let v of e.hand.values()){let m=t.getJointPose(v,i),f=this._getHandJoint(c,v);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}let d=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],h=d.position.distanceTo(u.position),p=.02,g=.005;c.inputState.pinching&&h>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(n=t.getPose(e.targetRaySpace,i),n===null&&s!==null&&(n=s),n!==null&&(o.matrix.fromArray(n.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,n.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(n.linearVelocity)):o.hasLinearVelocity=!1,n.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(n.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(zx)))}return o!==null&&(o.visible=n!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Li;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Vx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Gx=`
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

}`,Ac=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let n=new Gt,s=e.properties.get(n);s.__webglTexture=t.texture,(t.depthNear!=i.depthNear||t.depthFar!=i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new ki({vertexShader:Vx,fragmentShader:Gx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ht(new Is(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Rc=class extends pr{constructor(e,t){super();let i=this,n=null,s=1,a=null,o="local-floor",l=1,c=null,d=null,u=null,h=null,p=null,g=null,v=new Ac,m=t.getContextAttributes(),f=null,M=null,w=[],_=[],D=new it,A=null,R=new Bt;R.viewport=new ot;let T=new Bt;T.viewport=new ot;let b=[R,T],x=new Ao,C=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ie=w[$];return ie===void 0&&(ie=new ys,w[$]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function($){let ie=w[$];return ie===void 0&&(ie=new ys,w[$]=ie),ie.getGripSpace()},this.getHand=function($){let ie=w[$];return ie===void 0&&(ie=new ys,w[$]=ie),ie.getHandSpace()};function V($){let ie=_.indexOf($.inputSource);if(ie===-1)return;let ve=w[ie];ve!==void 0&&(ve.update($.inputSource,$.frame,c||a),ve.dispatchEvent({type:$.type,data:$.inputSource}))}function G(){n.removeEventListener("select",V),n.removeEventListener("selectstart",V),n.removeEventListener("selectend",V),n.removeEventListener("squeeze",V),n.removeEventListener("squeezestart",V),n.removeEventListener("squeezeend",V),n.removeEventListener("end",G),n.removeEventListener("inputsourceschange",P);for(let $=0;$<w.length;$++){let ie=_[$];ie!==null&&(_[$]=null,w[$].disconnect(ie))}C=null,U=null,v.reset(),e.setRenderTarget(f),p=null,h=null,u=null,n=null,M=null,re.stop(),i.isPresenting=!1,e.setPixelRatio(A),e.setSize(D.width,D.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){s=$,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return n},this.setSession=async function($){if(n=$,n!==null){if(f=e.getRenderTarget(),n.addEventListener("select",V),n.addEventListener("selectstart",V),n.addEventListener("selectend",V),n.addEventListener("squeeze",V),n.addEventListener("squeezestart",V),n.addEventListener("squeezeend",V),n.addEventListener("end",G),n.addEventListener("inputsourceschange",P),m.xrCompatible!==!0&&await t.makeXRCompatible(),A=e.getPixelRatio(),e.getSize(D),n.renderState.layers===void 0){let ie={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(n,t,ie),n.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),M=new Yi(p.framebufferWidth,p.framebufferHeight,{format:di,type:Xi,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil})}else{let ie=null,ve=null,me=null;m.depth&&(me=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ie=m.stencil?nn:Zr,ve=m.stencil?rn:Dr);let xe={colorFormat:t.RGBA8,depthFormat:me,scaleFactor:s};u=new XRWebGLBinding(n,t),h=u.createProjectionLayer(xe),n.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),M=new Yi(h.textureWidth,h.textureHeight,{format:di,type:Xi,depthTexture:new Ds(h.textureWidth,h.textureHeight,ve,void 0,void 0,void 0,void 0,void 0,void 0,ie),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await n.requestReferenceSpace(o),re.setContext(n),re.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(n!==null)return n.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function P($){for(let ie=0;ie<$.removed.length;ie++){let ve=$.removed[ie],me=_.indexOf(ve);me>=0&&(_[me]=null,w[me].disconnect(ve))}for(let ie=0;ie<$.added.length;ie++){let ve=$.added[ie],me=_.indexOf(ve);if(me===-1){for(let Re=0;Re<w.length;Re++)if(Re>=_.length){_.push(ve),me=Re;break}else if(_[Re]===null){_[Re]=ve,me=Re;break}if(me===-1)break}let xe=w[me];xe&&xe.connect(ve)}}let L=new z,H=new z;function F($,ie,ve){L.setFromMatrixPosition(ie.matrixWorld),H.setFromMatrixPosition(ve.matrixWorld);let me=L.distanceTo(H),xe=ie.projectionMatrix.elements,Re=ve.projectionMatrix.elements,Ue=xe[14]/(xe[10]-1),qe=xe[14]/(xe[10]+1),He=(xe[9]+1)/xe[5],rt=(xe[9]-1)/xe[5],B=(xe[8]-1)/xe[0],yt=(Re[8]+1)/Re[0],ze=Ue*B,je=Ue*yt,we=me/(-B+yt),lt=we*-B;if(ie.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(lt),$.translateZ(we),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),xe[10]===-1)$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{let Me=Ue+we,E=qe+we,y=ze-lt,W=je+(me-lt),Q=He*qe/E*Me,te=rt*qe/E*Me;$.projectionMatrix.makePerspective(y,W,Q,te,Me,E),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function K($,ie){ie===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ie.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(n===null)return;let ie=$.near,ve=$.far;v.texture!==null&&(v.depthNear>0&&(ie=v.depthNear),v.depthFar>0&&(ve=v.depthFar)),x.near=T.near=R.near=ie,x.far=T.far=R.far=ve,(C!==x.near||U!==x.far)&&(n.updateRenderState({depthNear:x.near,depthFar:x.far}),C=x.near,U=x.far),R.layers.mask=$.layers.mask|2,T.layers.mask=$.layers.mask|4,x.layers.mask=R.layers.mask|T.layers.mask;let me=$.parent,xe=x.cameras;K(x,me);for(let Re=0;Re<xe.length;Re++)K(xe[Re],me);xe.length===2?F(x,R,T):x.projectionMatrix.copy(R.projectionMatrix),ne($,x,me)};function ne($,ie,ve){ve===null?$.matrix.copy(ie.matrixWorld):($.matrix.copy(ve.matrixWorld),$.matrix.invert(),$.matrix.multiply(ie.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ie.projectionMatrix),$.projectionMatrixInverse.copy(ie.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Fn*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(h===null&&p===null))return l},this.setFoveation=function($){l=$,h!==null&&(h.fixedFoveation=$),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=$)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(x)};let ce=null;function fe($,ie){if(d=ie.getViewerPose(c||a),g=ie,d!==null){let ve=d.views;p!==null&&(e.setRenderTargetFramebuffer(M,p.framebuffer),e.setRenderTarget(M));let me=!1;ve.length!==x.cameras.length&&(x.cameras.length=0,me=!0);for(let Re=0;Re<ve.length;Re++){let Ue=ve[Re],qe=null;if(p!==null)qe=p.getViewport(Ue);else{let rt=u.getViewSubImage(h,Ue);qe=rt.viewport,Re===0&&(e.setRenderTargetTextures(M,rt.colorTexture,h.ignoreDepthValues?void 0:rt.depthStencilTexture),e.setRenderTarget(M))}let He=b[Re];He===void 0&&(He=new Bt,He.layers.enable(Re),He.viewport=new ot,b[Re]=He),He.matrix.fromArray(Ue.transform.matrix),He.matrix.decompose(He.position,He.quaternion,He.scale),He.projectionMatrix.fromArray(Ue.projectionMatrix),He.projectionMatrixInverse.copy(He.projectionMatrix).invert(),He.viewport.set(qe.x,qe.y,qe.width,qe.height),Re===0&&(x.matrix.copy(He.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),me===!0&&x.cameras.push(He)}let xe=n.enabledFeatures;if(xe&&xe.includes("depth-sensing")){let Re=u.getDepthInformation(ve[0]);Re&&Re.isValid&&Re.texture&&v.init(e,Re,n.renderState)}}for(let ve=0;ve<w.length;ve++){let me=_[ve],xe=w[ve];me!==null&&xe!==void 0&&xe.update(me,ie,c||a)}ce&&ce($,ie),ie.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ie}),g=null}let re=new Lp;re.setAnimationLoop(fe),this.setAnimationLoop=function($){ce=$},this.dispose=function(){}}},$r=new Ui,$x=new We;function Wx(r,e){function t(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function i(m,f){f.color.getRGB(m.fogColor.value,Rp(r)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function n(m,f,M,w,_){f.isMeshBasicMaterial||f.isMeshLambertMaterial?s(m,f):f.isMeshToonMaterial?(s(m,f),u(m,f)):f.isMeshPhongMaterial?(s(m,f),d(m,f)):f.isMeshStandardMaterial?(s(m,f),h(m,f),f.isMeshPhysicalMaterial&&p(m,f,_)):f.isMeshMatcapMaterial?(s(m,f),g(m,f)):f.isMeshDepthMaterial?s(m,f):f.isMeshDistanceMaterial?(s(m,f),v(m,f)):f.isMeshNormalMaterial?s(m,f):f.isLineBasicMaterial?(a(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?l(m,f,M,w):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function s(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,t(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===qt&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,t(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===qt&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,t(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,t(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);let M=e.get(f),w=M.envMap,_=M.envMapRotation;w&&(m.envMap.value=w,$r.copy(_),$r.x*=-1,$r.y*=-1,$r.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&($r.y*=-1,$r.z*=-1),m.envMapRotation.value.setFromMatrix4($x.makeRotationFromEuler($r)),m.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap&&(m.lightMap.value=f.lightMap,m.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,m.lightMapTransform)),f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,m.aoMapTransform))}function a(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform))}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,M,w){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*M,m.scale.value=w*.5,f.map&&(m.map.value=f.map,t(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function d(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function u(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function h(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,m.roughnessMapTransform)),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,M){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===qt&&m.clearcoatNormalScale.value.negate())),f.dispersion>0&&(m.dispersion.value=f.dispersion),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function v(m,f){let M=e.get(f).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:n}}function jx(r,e,t,i){let n={},s={},a=[],o=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,w){let _=w.program;i.uniformBlockBinding(M,_)}function c(M,w){let _=n[M.id];_===void 0&&(g(M),_=d(M),n[M.id]=_,M.addEventListener("dispose",m));let D=w.program;i.updateUBOMapping(M,D);let A=e.render.frame;s[M.id]!==A&&(h(M),s[M.id]=A)}function d(M){let w=u();M.__bindingPointIndex=w;let _=r.createBuffer(),D=M.__size,A=M.usage;return r.bindBuffer(r.UNIFORM_BUFFER,_),r.bufferData(r.UNIFORM_BUFFER,D,A),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,w,_),_}function u(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(M){let w=n[M.id],_=M.uniforms,D=M.__cache;r.bindBuffer(r.UNIFORM_BUFFER,w);for(let A=0,R=_.length;A<R;A++){let T=Array.isArray(_[A])?_[A]:[_[A]];for(let b=0,x=T.length;b<x;b++){let C=T[b];if(p(C,A,b,D)===!0){let U=C.__offset,V=Array.isArray(C.value)?C.value:[C.value],G=0;for(let P=0;P<V.length;P++){let L=V[P],H=v(L);typeof L=="number"||typeof L=="boolean"?(C.__data[0]=L,r.bufferSubData(r.UNIFORM_BUFFER,U+G,C.__data)):L.isMatrix3?(C.__data[0]=L.elements[0],C.__data[1]=L.elements[1],C.__data[2]=L.elements[2],C.__data[3]=0,C.__data[4]=L.elements[3],C.__data[5]=L.elements[4],C.__data[6]=L.elements[5],C.__data[7]=0,C.__data[8]=L.elements[6],C.__data[9]=L.elements[7],C.__data[10]=L.elements[8],C.__data[11]=0):(L.toArray(C.__data,G),G+=H.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,U,C.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function p(M,w,_,D){let A=M.value,R=w+"_"+_;if(D[R]===void 0)return typeof A=="number"||typeof A=="boolean"?D[R]=A:D[R]=A.clone(),!0;{let T=D[R];if(typeof A=="number"||typeof A=="boolean"){if(T!==A)return D[R]=A,!0}else if(T.equals(A)===!1)return T.copy(A),!0}return!1}function g(M){let w=M.uniforms,_=0,D=16;for(let R=0,T=w.length;R<T;R++){let b=Array.isArray(w[R])?w[R]:[w[R]];for(let x=0,C=b.length;x<C;x++){let U=b[x],V=Array.isArray(U.value)?U.value:[U.value];for(let G=0,P=V.length;G<P;G++){let L=V[G],H=v(L),F=_%D,K=F%H.boundary,ne=F+K;_+=K,ne!==0&&D-ne<H.storage&&(_+=D-ne),U.__data=new Float32Array(H.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=_,_+=H.storage}}}let A=_%D;return A>0&&(_+=D-A),M.__size=_,M.__cache={},this}function v(M){let w={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(w.boundary=4,w.storage=4):M.isVector2?(w.boundary=8,w.storage=8):M.isVector3||M.isColor?(w.boundary=16,w.storage=12):M.isVector4?(w.boundary=16,w.storage=16):M.isMatrix3?(w.boundary=48,w.storage=48):M.isMatrix4?(w.boundary=64,w.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),w}function m(M){let w=M.target;w.removeEventListener("dispose",m);let _=a.indexOf(w.__bindingPointIndex);a.splice(_,1),r.deleteBuffer(n[w.id]),delete n[w.id],delete s[w.id]}function f(){for(let M in n)r.deleteBuffer(n[M]);a=[],n={},s={}}return{bind:l,update:c,dispose:f}}var Ro=class{constructor(e={}){let{canvas:t=Ep(),context:i=null,depth:n=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=a;let g=new Uint32Array(4),v=new Int32Array(4),m=null,f=null,M=[],w=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ft,this.toneMapping=ur,this.toneMappingExposure=1;let _=this,D=!1,A=0,R=0,T=null,b=-1,x=null,C=new ot,U=new ot,V=null,G=new Fe(0),P=0,L=t.width,H=t.height,F=1,K=null,ne=null,ce=new ot(0,0,L,H),fe=new ot(0,0,L,H),re=!1,$=new Hn,ie=!1,ve=!1,me=new We,xe=new We,Re=new z,Ue=new ot,qe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},He=!1;function rt(){return T===null?F:1}let B=i;function yt(S,O){return t.getContext(S,O)}try{let S={alpha:!0,depth:n,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:d,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${il}`),t.addEventListener("webglcontextlost",ee,!1),t.addEventListener("webglcontextrestored",ue,!1),t.addEventListener("webglcontextcreationerror",de,!1),B===null){let O="webgl2";if(B=yt(O,S),B===null)throw yt(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let ze,je,we,lt,Me,E,y,W,Q,te,Z,Te,he,ye,tt,oe,be,De,Le,_e,Xe,Ve,pt,N;function le(){ze=new cv(B),ze.init(),Ve=new Np(B,ze),je=new rv(B,ze,e,Ve),we=new Fx(B,ze),je.reverseDepthBuffer&&h&&we.buffers.depth.setReversed(!0),lt=new hv(B),Me=new Tx,E=new Hx(B,ze,we,Me,je,Ve,lt),y=new sv(_),W=new lv(_),Q=new _f(B),pt=new tv(B,Q),te=new dv(B,Q,lt,pt),Z=new mv(B,te,Q,lt),Le=new pv(B,je,E),oe=new nv(Me),Te=new Mx(_,y,W,ze,je,pt,oe),he=new Wx(_,Me),ye=new Ax,tt=new Dx(ze),De=new ev(_,y,W,we,Z,p,l),be=new kx(_,Z,je),N=new jx(B,lt,je,we),_e=new iv(B,ze,lt),Xe=new uv(B,ze,lt),lt.programs=Te.programs,_.capabilities=je,_.extensions=ze,_.properties=Me,_.renderLists=ye,_.shadowMap=be,_.state=we,_.info=lt}le();let X=new Rc(_,B);this.xr=X,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let S=ze.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=ze.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return F},this.setPixelRatio=function(S){S!==void 0&&(F=S,this.setSize(L,H,!1))},this.getSize=function(S){return S.set(L,H)},this.setSize=function(S,O,q=!0){if(X.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}L=S,H=O,t.width=Math.floor(S*F),t.height=Math.floor(O*F),q===!0&&(t.style.width=S+"px",t.style.height=O+"px"),this.setViewport(0,0,S,O)},this.getDrawingBufferSize=function(S){return S.set(L*F,H*F).floor()},this.setDrawingBufferSize=function(S,O,q){L=S,H=O,F=q,t.width=Math.floor(S*q),t.height=Math.floor(O*q),this.setViewport(0,0,S,O)},this.getCurrentViewport=function(S){return S.copy(C)},this.getViewport=function(S){return S.copy(ce)},this.setViewport=function(S,O,q,j){S.isVector4?ce.set(S.x,S.y,S.z,S.w):ce.set(S,O,q,j),we.viewport(C.copy(ce).multiplyScalar(F).round())},this.getScissor=function(S){return S.copy(fe)},this.setScissor=function(S,O,q,j){S.isVector4?fe.set(S.x,S.y,S.z,S.w):fe.set(S,O,q,j),we.scissor(U.copy(fe).multiplyScalar(F).round())},this.getScissorTest=function(){return re},this.setScissorTest=function(S){we.setScissorTest(re=S)},this.setOpaqueSort=function(S){K=S},this.setTransparentSort=function(S){ne=S},this.getClearColor=function(S){return S.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor.apply(De,arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha.apply(De,arguments)},this.clear=function(S=!0,O=!0,q=!0){let j=0;if(S){let k=!1;if(T!==null){let se=T.texture.format;k=se===cl||se===ll||se===ol}if(k){let se=T.texture.type,ge=se===Xi||se===Dr||se===Nn||se===rn||se===nl||se===sl,Se=De.getClearColor(),Ae=De.getClearAlpha(),ke=Se.r,Ne=Se.g,Ie=Se.b;ge?(g[0]=ke,g[1]=Ne,g[2]=Ie,g[3]=Ae,B.clearBufferuiv(B.COLOR,0,g)):(v[0]=ke,v[1]=Ne,v[2]=Ie,v[3]=Ae,B.clearBufferiv(B.COLOR,0,v))}else j|=B.COLOR_BUFFER_BIT}O&&(j|=B.DEPTH_BUFFER_BIT),q&&(j|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B.clear(j)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ee,!1),t.removeEventListener("webglcontextrestored",ue,!1),t.removeEventListener("webglcontextcreationerror",de,!1),ye.dispose(),tt.dispose(),Me.dispose(),y.dispose(),W.dispose(),Z.dispose(),pt.dispose(),N.dispose(),Te.dispose(),X.dispose(),X.removeEventListener("sessionstart",si),X.removeEventListener("sessionend",Kn),Oi.stop()};function ee(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),D=!0}function ue(){console.log("THREE.WebGLRenderer: Context Restored."),D=!1;let S=lt.autoReset,O=be.enabled,q=be.autoUpdate,j=be.needsUpdate,k=be.type;le(),lt.autoReset=S,be.enabled=O,be.autoUpdate=q,be.needsUpdate=j,be.type=k}function de(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Ye(S){let O=S.target;O.removeEventListener("dispose",Ye),_t(O)}function _t(S){Dt(S),Me.remove(S)}function Dt(S){let O=Me.get(S).programs;O!==void 0&&(O.forEach(function(q){Te.releaseProgram(q)}),S.isShaderMaterial&&Te.releaseShaderCache(S))}this.renderBufferDirect=function(S,O,q,j,k,se){O===null&&(O=qe);let ge=k.isMesh&&k.matrixWorld.determinant()<0,Se=Xs(S,O,q,j,k);we.setMaterial(j,ge);let Ae=q.index,ke=1;if(j.wireframe===!0){if(Ae=te.getWireframeAttribute(q),Ae===void 0)return;ke=2}let Ne=q.drawRange,Ie=q.attributes.position,nt=Ne.start*ke,vt=(Ne.start+Ne.count)*ke;se!==null&&(nt=Math.max(nt,se.start*ke),vt=Math.min(vt,(se.start+se.count)*ke)),Ae!==null?(nt=Math.max(nt,0),vt=Math.min(vt,Ae.count)):Ie!=null&&(nt=Math.max(nt,0),vt=Math.min(vt,Ie.count));let mt=vt-nt;if(mt<0||mt===1/0)return;pt.setup(k,j,Se,q,Ae);let st,ct=_e;if(Ae!==null&&(st=Q.get(Ae),ct=Xe,ct.setIndex(st)),k.isMesh)j.wireframe===!0?(we.setLineWidth(j.wireframeLinewidth*rt()),ct.setMode(B.LINES)):ct.setMode(B.TRIANGLES);else if(k.isLine){let Ee=j.linewidth;Ee===void 0&&(Ee=1),we.setLineWidth(Ee*rt()),k.isLineSegments?ct.setMode(B.LINES):k.isLineLoop?ct.setMode(B.LINE_LOOP):ct.setMode(B.LINE_STRIP)}else k.isPoints?ct.setMode(B.POINTS):k.isSprite&&ct.setMode(B.TRIANGLES);if(k.isBatchedMesh)if(k._multiDrawInstances!==null)ct.renderMultiDrawInstances(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount,k._multiDrawInstances);else if(ze.get("WEBGL_multi_draw"))ct.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let Ee=k._multiDrawStarts,Bi=k._multiDrawCounts,ai=k._multiDrawCount,ei=Ae?Q.get(Ae).bytesPerElement:1,zt=Me.get(j).currentProgram.getUniforms();for(let St=0;St<ai;St++)zt.setValue(B,"_gl_DrawID",St),ct.render(Ee[St]/ei,Bi[St])}else if(k.isInstancedMesh)ct.renderInstances(nt,mt,k.count);else if(q.isInstancedBufferGeometry){let Ee=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,Bi=Math.min(q.instanceCount,Ee);ct.renderInstances(nt,mt,Bi)}else ct.render(nt,mt)};function Ke(S,O,q){S.transparent===!0&&S.side===Ai&&S.forceSinglePass===!1?(S.side=qt,S.needsUpdate=!0,Si(S,O,q),S.side=qi,S.needsUpdate=!0,Si(S,O,q),S.side=Ai):Si(S,O,q)}this.compile=function(S,O,q=null){q===null&&(q=S),f=tt.get(q),f.init(O),w.push(f),q.traverseVisible(function(k){k.isLight&&k.layers.test(O.layers)&&(f.pushLight(k),k.castShadow&&f.pushShadow(k))}),S!==q&&S.traverseVisible(function(k){k.isLight&&k.layers.test(O.layers)&&(f.pushLight(k),k.castShadow&&f.pushShadow(k))}),f.setupLights();let j=new Set;return S.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let se=k.material;if(se)if(Array.isArray(se))for(let ge=0;ge<se.length;ge++){let Se=se[ge];Ke(Se,q,k),j.add(Se)}else Ke(se,q,k),j.add(se)}),w.pop(),f=null,j},this.compileAsync=function(S,O,q=null){let j=this.compile(S,O,q);return new Promise(k=>{function se(){if(j.forEach(function(ge){Me.get(ge).currentProgram.isReady()&&j.delete(ge)}),j.size===0){k(S);return}setTimeout(se,10)}ze.get("KHR_parallel_shader_compile")!==null?se():setTimeout(se,10)})};let ni=null;function fi(S){ni&&ni(S)}function si(){Oi.stop()}function Kn(){Oi.start()}let Oi=new Lp;Oi.setAnimationLoop(fi),typeof self<"u"&&Oi.setContext(self),this.setAnimationLoop=function(S){ni=S,X.setAnimationLoop(S),S===null?Oi.stop():Oi.start()},X.addEventListener("sessionstart",si),X.addEventListener("sessionend",Kn),this.render=function(S,O){if(O!==void 0&&O.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),X.enabled===!0&&X.isPresenting===!0&&(X.cameraAutoUpdate===!0&&X.updateCamera(O),O=X.getCamera()),S.isScene===!0&&S.onBeforeRender(_,S,O,T),f=tt.get(S,w.length),f.init(O),w.push(f),xe.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),$.setFromProjectionMatrix(xe),ve=this.localClippingEnabled,ie=oe.init(this.clippingPlanes,ve),m=ye.get(S,M.length),m.init(),M.push(m),X.enabled===!0&&X.isPresenting===!0){let se=_.xr.getDepthSensingMesh();se!==null&&Fi(se,O,-1/0,_.sortObjects)}Fi(S,O,0,_.sortObjects),m.finish(),_.sortObjects===!0&&m.sort(K,ne),He=X.enabled===!1||X.isPresenting===!1||X.hasDepthSensing()===!1,He&&De.addToRenderList(m,S),this.info.render.frame++,ie===!0&&oe.beginShadows();let q=f.state.shadowsArray;be.render(q,S,O),ie===!0&&oe.endShadows(),this.info.autoReset===!0&&this.info.reset();let j=m.opaque,k=m.transmissive;if(f.setupLights(),O.isArrayCamera){let se=O.cameras;if(k.length>0)for(let ge=0,Se=se.length;ge<Se;ge++){let Ae=se[ge];Ki(j,k,S,Ae)}He&&De.render(S);for(let ge=0,Se=se.length;ge<Se;ge++){let Ae=se[ge];kt(m,S,Ae,Ae.viewport)}}else k.length>0&&Ki(j,k,S,O),He&&De.render(S),kt(m,S,O);T!==null&&(E.updateMultisampleRenderTarget(T),E.updateRenderTargetMipmap(T)),S.isScene===!0&&S.onAfterRender(_,S,O),pt.resetDefaultState(),b=-1,x=null,w.pop(),w.length>0?(f=w[w.length-1],ie===!0&&oe.setGlobalState(_.clippingPlanes,f.state.camera)):f=null,M.pop(),M.length>0?m=M[M.length-1]:m=null};function Fi(S,O,q,j){if(S.visible===!1)return;if(S.layers.test(O.layers)){if(S.isGroup)q=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(O);else if(S.isLight)f.pushLight(S),S.castShadow&&f.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||$.intersectsSprite(S)){j&&Ue.setFromMatrixPosition(S.matrixWorld).applyMatrix4(xe);let se=Z.update(S),ge=S.material;ge.visible&&m.push(S,se,ge,q,Ue.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||$.intersectsObject(S))){let se=Z.update(S),ge=S.material;if(j&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),Ue.copy(S.boundingSphere.center)):(se.boundingSphere===null&&se.computeBoundingSphere(),Ue.copy(se.boundingSphere.center)),Ue.applyMatrix4(S.matrixWorld).applyMatrix4(xe)),Array.isArray(ge)){let Se=se.groups;for(let Ae=0,ke=Se.length;Ae<ke;Ae++){let Ne=Se[Ae],Ie=ge[Ne.materialIndex];Ie&&Ie.visible&&m.push(S,se,Ie,q,Ue.z,Ne)}}else ge.visible&&m.push(S,se,ge,q,Ue.z,null)}}let k=S.children;for(let se=0,ge=k.length;se<ge;se++)Fi(k[se],O,q,j)}function kt(S,O,q,j){let k=S.opaque,se=S.transmissive,ge=S.transparent;f.setupLightsView(q),ie===!0&&oe.setGlobalState(_.clippingPlanes,q),j&&we.viewport(C.copy(j)),k.length>0&&yr(k,O,q),se.length>0&&yr(se,O,q),ge.length>0&&yr(ge,O,q),we.buffers.depth.setTest(!0),we.buffers.depth.setMask(!0),we.buffers.color.setMask(!0),we.setPolygonOffset(!1)}function Ki(S,O,q,j){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[j.id]===void 0&&(f.state.transmissionRenderTarget[j.id]=new Yi(1,1,{generateMipmaps:!0,type:ze.has("EXT_color_buffer_half_float")||ze.has("EXT_color_buffer_float")?Xn:Xi,minFilter:Wi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:et.workingColorSpace}));let k=f.state.transmissionRenderTarget[j.id],se=j.viewport||C;k.setSize(se.z,se.w);let ge=_.getRenderTarget();_.setRenderTarget(k),_.getClearColor(G),P=_.getClearAlpha(),P<1&&_.setClearColor(16777215,.5),_.clear(),He&&De.render(q);let Se=_.toneMapping;_.toneMapping=ur;let Ae=j.viewport;if(j.viewport!==void 0&&(j.viewport=void 0),f.setupLightsView(j),ie===!0&&oe.setGlobalState(_.clippingPlanes,j),yr(S,q,j),E.updateMultisampleRenderTarget(k),E.updateRenderTargetMipmap(k),ze.has("WEBGL_multisampled_render_to_texture")===!1){let ke=!1;for(let Ne=0,Ie=O.length;Ne<Ie;Ne++){let nt=O[Ne],vt=nt.object,mt=nt.geometry,st=nt.material,ct=nt.group;if(st.side===Ai&&vt.layers.test(j.layers)){let Ee=st.side;st.side=qt,st.needsUpdate=!0,kr(vt,q,j,mt,st,ct),st.side=Ee,st.needsUpdate=!0,ke=!0}}ke===!0&&(E.updateMultisampleRenderTarget(k),E.updateRenderTargetMipmap(k))}_.setRenderTarget(ge),_.setClearColor(G,P),Ae!==void 0&&(j.viewport=Ae),_.toneMapping=Se}function yr(S,O,q){let j=O.isScene===!0?O.overrideMaterial:null;for(let k=0,se=S.length;k<se;k++){let ge=S[k],Se=ge.object,Ae=ge.geometry,ke=j===null?ge.material:j,Ne=ge.group;Se.layers.test(q.layers)&&kr(Se,O,q,Ae,ke,Ne)}}function kr(S,O,q,j,k,se){S.onBeforeRender(_,O,q,j,k,se),S.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),k.onBeforeRender(_,O,q,j,S,se),k.transparent===!0&&k.side===Ai&&k.forceSinglePass===!1?(k.side=qt,k.needsUpdate=!0,_.renderBufferDirect(q,O,j,k,S,se),k.side=qi,k.needsUpdate=!0,_.renderBufferDirect(q,O,j,k,S,se),k.side=Ai):_.renderBufferDirect(q,O,j,k,S,se),S.onAfterRender(_,O,q,j,k,se)}function Si(S,O,q){O.isScene!==!0&&(O=qe);let j=Me.get(S),k=f.state.lights,se=f.state.shadowsArray,ge=k.state.version,Se=Te.getParameters(S,k.state,se,O,q),Ae=Te.getProgramCacheKey(Se),ke=j.programs;j.environment=S.isMeshStandardMaterial?O.environment:null,j.fog=O.fog,j.envMap=(S.isMeshStandardMaterial?W:y).get(S.envMap||j.environment),j.envMapRotation=j.environment!==null&&S.envMap===null?O.environmentRotation:S.envMapRotation,ke===void 0&&(S.addEventListener("dispose",Ye),ke=new Map,j.programs=ke);let Ne=ke.get(Ae);if(Ne!==void 0){if(j.currentProgram===Ne&&j.lightsStateVersion===ge)return cn(S,Se),Ne}else Se.uniforms=Te.getUniforms(S),S.onBeforeCompile(Se,_),Ne=Te.acquireProgram(Se,Ae),ke.set(Ae,Ne),j.uniforms=Se.uniforms;let Ie=j.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Ie.clippingPlanes=oe.uniform),cn(S,Se),j.needsLights=Ys(S),j.lightsStateVersion=ge,j.needsLights&&(Ie.ambientLightColor.value=k.state.ambient,Ie.lightProbe.value=k.state.probe,Ie.directionalLights.value=k.state.directional,Ie.directionalLightShadows.value=k.state.directionalShadow,Ie.spotLights.value=k.state.spot,Ie.spotLightShadows.value=k.state.spotShadow,Ie.rectAreaLights.value=k.state.rectArea,Ie.ltc_1.value=k.state.rectAreaLTC1,Ie.ltc_2.value=k.state.rectAreaLTC2,Ie.pointLights.value=k.state.point,Ie.pointLightShadows.value=k.state.pointShadow,Ie.hemisphereLights.value=k.state.hemi,Ie.directionalShadowMap.value=k.state.directionalShadowMap,Ie.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Ie.spotShadowMap.value=k.state.spotShadowMap,Ie.spotLightMatrix.value=k.state.spotLightMatrix,Ie.spotLightMap.value=k.state.spotLightMap,Ie.pointShadowMap.value=k.state.pointShadowMap,Ie.pointShadowMatrix.value=k.state.pointShadowMatrix),j.currentProgram=Ne,j.uniformsList=null,Ne}function br(S){if(S.uniformsList===null){let O=S.currentProgram.getUniforms();S.uniformsList=Dn.seqWithValue(O.seq,S.uniforms)}return S.uniformsList}function cn(S,O){let q=Me.get(S);q.outputColorSpace=O.outputColorSpace,q.batching=O.batching,q.batchingColor=O.batchingColor,q.instancing=O.instancing,q.instancingColor=O.instancingColor,q.instancingMorph=O.instancingMorph,q.skinning=O.skinning,q.morphTargets=O.morphTargets,q.morphNormals=O.morphNormals,q.morphColors=O.morphColors,q.morphTargetsCount=O.morphTargetsCount,q.numClippingPlanes=O.numClippingPlanes,q.numIntersection=O.numClipIntersection,q.vertexAlphas=O.vertexAlphas,q.vertexTangents=O.vertexTangents,q.toneMapping=O.toneMapping}function Xs(S,O,q,j,k){O.isScene!==!0&&(O=qe),E.resetTextureUnits();let se=O.fog,ge=j.isMeshStandardMaterial?O.environment:null,Se=T===null?_.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:Yt,Ae=(j.isMeshStandardMaterial?W:y).get(j.envMap||ge),ke=j.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,Ne=!!q.attributes.tangent&&(!!j.normalMap||j.anisotropy>0),Ie=!!q.morphAttributes.position,nt=!!q.morphAttributes.normal,vt=!!q.morphAttributes.color,mt=ur;j.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(mt=_.toneMapping);let st=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ct=st!==void 0?st.length:0,Ee=Me.get(j),Bi=f.state.lights;if(ie===!0&&(ve===!0||S!==x)){let I=S===x&&j.id===b;oe.setState(j,S,I)}let ai=!1;j.version===Ee.__version?(Ee.needsLights&&Ee.lightsStateVersion!==Bi.state.version||Ee.outputColorSpace!==Se||k.isBatchedMesh&&Ee.batching===!1||!k.isBatchedMesh&&Ee.batching===!0||k.isBatchedMesh&&Ee.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&Ee.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&Ee.instancing===!1||!k.isInstancedMesh&&Ee.instancing===!0||k.isSkinnedMesh&&Ee.skinning===!1||!k.isSkinnedMesh&&Ee.skinning===!0||k.isInstancedMesh&&Ee.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&Ee.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&Ee.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&Ee.instancingMorph===!1&&k.morphTexture!==null||Ee.envMap!==Ae||j.fog===!0&&Ee.fog!==se||Ee.numClippingPlanes!==void 0&&(Ee.numClippingPlanes!==oe.numPlanes||Ee.numIntersection!==oe.numIntersection)||Ee.vertexAlphas!==ke||Ee.vertexTangents!==Ne||Ee.morphTargets!==Ie||Ee.morphNormals!==nt||Ee.morphColors!==vt||Ee.toneMapping!==mt||Ee.morphTargetsCount!==ct)&&(ai=!0):(ai=!0,Ee.__version=j.version);let ei=Ee.currentProgram;ai===!0&&(ei=Si(j,O,k));let zt=!1,St=!1,Or=!1,ft=ei.getUniforms(),ti=Ee.uniforms;if(we.useProgram(ei.program)&&(zt=!0,St=!0,Or=!0),j.id!==b&&(b=j.id,St=!0),zt||x!==S){we.buffers.depth.getReversed()?(me.copy(S.projectionMatrix),Qm(me),ef(me),ft.setValue(B,"projectionMatrix",me)):ft.setValue(B,"projectionMatrix",S.projectionMatrix),ft.setValue(B,"viewMatrix",S.matrixWorldInverse);let I=ft.map.cameraPosition;I!==void 0&&I.setValue(B,Re.setFromMatrixPosition(S.matrixWorld)),je.logarithmicDepthBuffer&&ft.setValue(B,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(j.isMeshPhongMaterial||j.isMeshToonMaterial||j.isMeshLambertMaterial||j.isMeshBasicMaterial||j.isMeshStandardMaterial||j.isShaderMaterial)&&ft.setValue(B,"isOrthographic",S.isOrthographicCamera===!0),x!==S&&(x=S,St=!0,Or=!0)}if(k.isSkinnedMesh){ft.setOptional(B,k,"bindMatrix"),ft.setOptional(B,k,"bindMatrixInverse");let I=k.skeleton;I&&(I.boneTexture===null&&I.computeBoneTexture(),ft.setValue(B,"boneTexture",I.boneTexture,E))}k.isBatchedMesh&&(ft.setOptional(B,k,"batchingTexture"),ft.setValue(B,"batchingTexture",k._matricesTexture,E),ft.setOptional(B,k,"batchingIdTexture"),ft.setValue(B,"batchingIdTexture",k._indirectTexture,E),ft.setOptional(B,k,"batchingColorTexture"),k._colorsTexture!==null&&ft.setValue(B,"batchingColorTexture",k._colorsTexture,E));let Fr=q.morphAttributes;if((Fr.position!==void 0||Fr.normal!==void 0||Fr.color!==void 0)&&Le.update(k,q,ei),(St||Ee.receiveShadow!==k.receiveShadow)&&(Ee.receiveShadow=k.receiveShadow,ft.setValue(B,"receiveShadow",k.receiveShadow)),j.isMeshGouraudMaterial&&j.envMap!==null&&(ti.envMap.value=Ae,ti.flipEnvMap.value=Ae.isCubeTexture&&Ae.isRenderTargetTexture===!1?-1:1),j.isMeshStandardMaterial&&j.envMap===null&&O.environment!==null&&(ti.envMapIntensity.value=O.environmentIntensity),St&&(ft.setValue(B,"toneMappingExposure",_.toneMappingExposure),Ee.needsLights&&Zi(ti,Or),se&&j.fog===!0&&he.refreshFogUniforms(ti,se),he.refreshMaterialUniforms(ti,j,F,H,f.state.transmissionRenderTarget[S.id]),Dn.upload(B,br(Ee),ti,E)),j.isShaderMaterial&&j.uniformsNeedUpdate===!0&&(Dn.upload(B,br(Ee),ti,E),j.uniformsNeedUpdate=!1),j.isSpriteMaterial&&ft.setValue(B,"center",k.center),ft.setValue(B,"modelViewMatrix",k.modelViewMatrix),ft.setValue(B,"normalMatrix",k.normalMatrix),ft.setValue(B,"modelMatrix",k.matrixWorld),j.isShaderMaterial||j.isRawShaderMaterial){let I=j.uniformsGroups;for(let J=0,Y=I.length;J<Y;J++){let ae=I[J];N.update(ae,ei),N.bind(ae,ei)}}return ei}function Zi(S,O){S.ambientLightColor.needsUpdate=O,S.lightProbe.needsUpdate=O,S.directionalLights.needsUpdate=O,S.directionalLightShadows.needsUpdate=O,S.pointLights.needsUpdate=O,S.pointLightShadows.needsUpdate=O,S.spotLights.needsUpdate=O,S.spotLightShadows.needsUpdate=O,S.rectAreaLights.needsUpdate=O,S.hemisphereLights.needsUpdate=O}function Ys(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(S,O,q){Me.get(S.texture).__webglTexture=O,Me.get(S.depthTexture).__webglTexture=q;let j=Me.get(S);j.__hasExternalTextures=!0,j.__autoAllocateDepthBuffer=q===void 0,j.__autoAllocateDepthBuffer||ze.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),j.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(S,O){let q=Me.get(S);q.__webglFramebuffer=O,q.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(S,O=0,q=0){T=S,A=O,R=q;let j=!0,k=null,se=!1,ge=!1;if(S){let Se=Me.get(S);if(Se.__useDefaultFramebuffer!==void 0)we.bindFramebuffer(B.FRAMEBUFFER,null),j=!1;else if(Se.__webglFramebuffer===void 0)E.setupRenderTarget(S);else if(Se.__hasExternalTextures)E.rebindTextures(S,Me.get(S.texture).__webglTexture,Me.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Ne=S.depthTexture;if(Se.__boundDepthTexture!==Ne){if(Ne!==null&&Me.has(Ne)&&(S.width!==Ne.image.width||S.height!==Ne.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(S)}}let Ae=S.texture;(Ae.isData3DTexture||Ae.isDataArrayTexture||Ae.isCompressedArrayTexture)&&(ge=!0);let ke=Me.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(ke[O])?k=ke[O][q]:k=ke[O],se=!0):S.samples>0&&E.useMultisampledRTT(S)===!1?k=Me.get(S).__webglMultisampledFramebuffer:Array.isArray(ke)?k=ke[q]:k=ke,C.copy(S.viewport),U.copy(S.scissor),V=S.scissorTest}else C.copy(ce).multiplyScalar(F).floor(),U.copy(fe).multiplyScalar(F).floor(),V=re;if(we.bindFramebuffer(B.FRAMEBUFFER,k)&&j&&we.drawBuffers(S,k),we.viewport(C),we.scissor(U),we.setScissorTest(V),se){let Se=Me.get(S.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+O,Se.__webglTexture,q)}else if(ge){let Se=Me.get(S.texture),Ae=O||0;B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,Se.__webglTexture,q||0,Ae)}b=-1},this.readRenderTargetPixels=function(S,O,q,j,k,se,ge){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=Me.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ge!==void 0&&(Se=Se[ge]),Se){we.bindFramebuffer(B.FRAMEBUFFER,Se);try{let Ae=S.texture,ke=Ae.format,Ne=Ae.type;if(!je.textureFormatReadable(ke)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!je.textureTypeReadable(Ne)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=S.width-j&&q>=0&&q<=S.height-k&&B.readPixels(O,q,j,k,Ve.convert(ke),Ve.convert(Ne),se)}finally{let Ae=T!==null?Me.get(T).__webglFramebuffer:null;we.bindFramebuffer(B.FRAMEBUFFER,Ae)}}},this.readRenderTargetPixelsAsync=async function(S,O,q,j,k,se,ge){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=Me.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ge!==void 0&&(Se=Se[ge]),Se){let Ae=S.texture,ke=Ae.format,Ne=Ae.type;if(!je.textureFormatReadable(ke))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!je.textureTypeReadable(Ne))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(O>=0&&O<=S.width-j&&q>=0&&q<=S.height-k){we.bindFramebuffer(B.FRAMEBUFFER,Se);let Ie=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,Ie),B.bufferData(B.PIXEL_PACK_BUFFER,se.byteLength,B.STREAM_READ),B.readPixels(O,q,j,k,Ve.convert(ke),Ve.convert(Ne),0);let nt=T!==null?Me.get(T).__webglFramebuffer:null;we.bindFramebuffer(B.FRAMEBUFFER,nt);let vt=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await Jm(B,vt,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,Ie),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,se),B.deleteBuffer(Ie),B.deleteSync(vt),se}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(S,O=null,q=0){S.isTexture!==!0&&(cs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),O=arguments[0]||null,S=arguments[1]);let j=Math.pow(2,-q),k=Math.floor(S.image.width*j),se=Math.floor(S.image.height*j),ge=O!==null?O.x:0,Se=O!==null?O.y:0;E.setTexture2D(S,0),B.copyTexSubImage2D(B.TEXTURE_2D,q,0,0,ge,Se,k,se),we.unbindTexture()},this.copyTextureToTexture=function(S,O,q=null,j=null,k=0){S.isTexture!==!0&&(cs("WebGLRenderer: copyTextureToTexture function signature has changed."),j=arguments[0]||null,S=arguments[1],O=arguments[2],k=arguments[3]||0,q=null);let se,ge,Se,Ae,ke,Ne,Ie,nt,vt,mt=S.isCompressedTexture?S.mipmaps[k]:S.image;q!==null?(se=q.max.x-q.min.x,ge=q.max.y-q.min.y,Se=q.isBox3?q.max.z-q.min.z:1,Ae=q.min.x,ke=q.min.y,Ne=q.isBox3?q.min.z:0):(se=mt.width,ge=mt.height,Se=mt.depth||1,Ae=0,ke=0,Ne=0),j!==null?(Ie=j.x,nt=j.y,vt=j.z):(Ie=0,nt=0,vt=0);let st=Ve.convert(O.format),ct=Ve.convert(O.type),Ee;O.isData3DTexture?(E.setTexture3D(O,0),Ee=B.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?(E.setTexture2DArray(O,0),Ee=B.TEXTURE_2D_ARRAY):(E.setTexture2D(O,0),Ee=B.TEXTURE_2D),B.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,O.flipY),B.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),B.pixelStorei(B.UNPACK_ALIGNMENT,O.unpackAlignment);let Bi=B.getParameter(B.UNPACK_ROW_LENGTH),ai=B.getParameter(B.UNPACK_IMAGE_HEIGHT),ei=B.getParameter(B.UNPACK_SKIP_PIXELS),zt=B.getParameter(B.UNPACK_SKIP_ROWS),St=B.getParameter(B.UNPACK_SKIP_IMAGES);B.pixelStorei(B.UNPACK_ROW_LENGTH,mt.width),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,mt.height),B.pixelStorei(B.UNPACK_SKIP_PIXELS,Ae),B.pixelStorei(B.UNPACK_SKIP_ROWS,ke),B.pixelStorei(B.UNPACK_SKIP_IMAGES,Ne);let Or=S.isDataArrayTexture||S.isData3DTexture,ft=O.isDataArrayTexture||O.isData3DTexture;if(S.isRenderTargetTexture||S.isDepthTexture){let ti=Me.get(S),Fr=Me.get(O),I=Me.get(ti.__renderTarget),J=Me.get(Fr.__renderTarget);we.bindFramebuffer(B.READ_FRAMEBUFFER,I.__webglFramebuffer),we.bindFramebuffer(B.DRAW_FRAMEBUFFER,J.__webglFramebuffer);for(let Y=0;Y<Se;Y++)Or&&B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,Me.get(S).__webglTexture,k,Ne+Y),S.isDepthTexture?(ft&&B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,Me.get(O).__webglTexture,k,vt+Y),B.blitFramebuffer(Ae,ke,se,ge,Ie,nt,se,ge,B.DEPTH_BUFFER_BIT,B.NEAREST)):ft?B.copyTexSubImage3D(Ee,k,Ie,nt,vt+Y,Ae,ke,se,ge):B.copyTexSubImage2D(Ee,k,Ie,nt,vt+Y,Ae,ke,se,ge);we.bindFramebuffer(B.READ_FRAMEBUFFER,null),we.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else ft?S.isDataTexture||S.isData3DTexture?B.texSubImage3D(Ee,k,Ie,nt,vt,se,ge,Se,st,ct,mt.data):O.isCompressedArrayTexture?B.compressedTexSubImage3D(Ee,k,Ie,nt,vt,se,ge,Se,st,mt.data):B.texSubImage3D(Ee,k,Ie,nt,vt,se,ge,Se,st,ct,mt):S.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,k,Ie,nt,se,ge,st,ct,mt.data):S.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,k,Ie,nt,mt.width,mt.height,st,mt.data):B.texSubImage2D(B.TEXTURE_2D,k,Ie,nt,se,ge,st,ct,mt);B.pixelStorei(B.UNPACK_ROW_LENGTH,Bi),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,ai),B.pixelStorei(B.UNPACK_SKIP_PIXELS,ei),B.pixelStorei(B.UNPACK_SKIP_ROWS,zt),B.pixelStorei(B.UNPACK_SKIP_IMAGES,St),k===0&&O.generateMipmaps&&B.generateMipmap(Ee),we.unbindTexture()},this.copyTextureToTexture3D=function(S,O,q=null,j=null,k=0){return S.isTexture!==!0&&(cs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),q=arguments[0]||null,j=arguments[1]||null,S=arguments[2],O=arguments[3],k=arguments[4]||0),cs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(S,O,q,j,k)},this.initRenderTarget=function(S){Me.get(S).__webglFramebuffer===void 0&&E.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?E.setTextureCube(S,0):S.isData3DTexture?E.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?E.setTexture2DArray(S,0):E.setTexture2D(S,0),we.unbindTexture()},this.resetState=function(){A=0,R=0,T=null,we.reset(),pt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ji}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=et._getDrawingBufferColorSpace(e),t.unpackColorSpace=et._getUnpackColorSpace()}},Us=class extends Tt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ui,this.environmentIntensity=1,this.environmentRotation=new Ui,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Co=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=_o,this.updateRanges=[],this.version=0,this.uuid=Pi()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let n=0,s=this.stride;n<s;n++)this.array[e+n]=t.array[i+n];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Pi()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Pi()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Jt=new z,Lo=class r{constructor(e,t,i,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)Jt.fromBufferAttribute(this,t),Jt.applyMatrix4(e),this.setXYZ(t,Jt.x,Jt.y,Jt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Jt.fromBufferAttribute(this,t),Jt.applyNormalMatrix(e),this.setXYZ(t,Jt.x,Jt.y,Jt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Jt.fromBufferAttribute(this,t),Jt.transformDirection(e),this.setXYZ(t,Jt.x,Jt.y,Jt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Ri(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=ut(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=ut(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Ri(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Ri(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Ri(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Ri(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),i=ut(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),i=ut(i,this.array),n=ut(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=n,this}setXYZW(e,t,i,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=ut(t,this.array),i=ut(i,this.array),n=ut(n,this.array),s=ut(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=n,this.data.array[e+3]=s,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let n=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[n+s])}return new Ht(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new r(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let n=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[n+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Zu=new z,Ju=new ot,Qu=new ot,qx=new z,eh=new We,Ma=new z,ql=new hi,th=new We,Xl=new sn,Po=class extends ht{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=fc,this.bindMatrix=new We,this.bindMatrixInverse=new We,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new bi),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,Ma),this.boundingBox.expandByPoint(Ma)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new hi),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,Ma),this.boundingSphere.expandByPoint(Ma)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let i=this.material,n=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ql.copy(this.boundingSphere),ql.applyMatrix4(n),e.ray.intersectsSphere(ql)!==!1&&(th.copy(n).invert(),Xl.copy(e.ray).applyMatrix4(th),!(this.boundingBox!==null&&Xl.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Xl)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new ot,t=this.geometry.attributes.skinWeight;for(let i=0,n=t.count;i<n;i++){e.fromBufferAttribute(t,i);let s=1/e.manhattanLength();s!==1/0?e.multiplyScalar(s):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===fc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===up?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let i=this.skeleton,n=this.geometry;Ju.fromBufferAttribute(n.attributes.skinIndex,e),Qu.fromBufferAttribute(n.attributes.skinWeight,e),Zu.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let s=0;s<4;s++){let a=Qu.getComponent(s);if(a!==0){let o=Ju.getComponent(s);eh.multiplyMatrices(i.bones[o].matrixWorld,i.boneInverses[o]),t.addScaledVector(qx.copy(Zu).applyMatrix4(eh),a)}}return t.applyMatrix4(this.bindMatrixInverse)}},Ns=class extends Tt{constructor(){super(),this.isBone=!0,this.type="Bone"}},ks=class extends Gt{constructor(e=null,t=1,i=1,n,s,a,o,l,c=Xt,d=Xt,u,h){super(null,a,o,l,c,d,n,s,u,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},ih=new We,Xx=new We,Io=class r{constructor(e=[],t=[]){this.uuid=Pi(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,n=this.bones.length;i<n;i++)this.boneInverses.push(new We)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let i=new We;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){let e=this.bones,t=this.boneInverses,i=this.boneMatrices,n=this.boneTexture;for(let s=0,a=e.length;s<a;s++){let o=e[s]?e[s].matrixWorld:Xx;ih.multiplyMatrices(o,t[s]),ih.toArray(i,s*16)}n!==null&&(n.needsUpdate=!0)}clone(){return new r(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let i=new ks(t,e,e,di,_i);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){let n=this.bones[t];if(n.name===e)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,n=e.bones.length;i<n;i++){let s=e.bones[i],a=t[s];a===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",s),a=new Ns),this.bones.push(a),this.boneInverses.push(new We().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){let e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,i=this.boneInverses;for(let n=0,s=t.length;n<s;n++){let a=t[n];e.bones.push(a.uuid);let o=i[n];e.boneInverses.push(o.toArray())}return e}},Gn=class extends Ht{constructor(e,t,i,n=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},An=new We,rh=new We,Ta=[],nh=new bi,Yx=new We,rs=new ht,ns=new hi,Do=class extends ht{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Gn(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<i;n++)this.setMatrixAt(n,Yx)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new bi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,An),nh.copy(e.boundingBox).applyMatrix4(An),this.boundingBox.union(nh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new hi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,An),ns.copy(e.boundingSphere).applyMatrix4(An),this.boundingSphere.union(ns)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,n=this.morphTexture.source.data.data,s=i.length+1,a=e*s+1;for(let o=0;o<i.length;o++)i[o]=n[a+o]}raycast(e,t){let i=this.matrixWorld,n=this.count;if(rs.geometry=this.geometry,rs.material=this.material,rs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ns.copy(this.boundingSphere),ns.applyMatrix4(i),e.ray.intersectsSphere(ns)!==!1))for(let s=0;s<n;s++){this.getMatrixAt(s,An),rh.multiplyMatrices(i,An),rs.matrixWorld=rh,rs.raycast(e,Ta);for(let a=0,o=Ta.length;a<o;a++){let l=Ta[a];l.instanceId=s,l.object=this,t.push(l)}Ta.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Gn(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let i=t.morphTargetInfluences,n=i.length+1;this.morphTexture===null&&(this.morphTexture=new ks(new Float32Array(n*this.count),n,this.count,al,_i));let s=this.morphTexture.source.data.data,a=0;for(let c=0;c<i.length;c++)a+=i[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=n*e;s[l]=o,s.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}},Os=class extends ui{static get type(){return"LineBasicMaterial"}constructor(e){super(),this.isLineBasicMaterial=!0,this.color=new Fe(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Uo=new z,No=new z,sh=new We,ss=new sn,Ea=new hi,Yl=new z,ah=new z,$n=class extends Tt{constructor(e=new Ni,t=new Os){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let n=1,s=t.count;n<s;n++)Uo.fromBufferAttribute(t,n-1),No.fromBufferAttribute(t,n),i[n]=i[n-1],i[n]+=Uo.distanceTo(No);e.setAttribute("lineDistance",new yi(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,n=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ea.copy(i.boundingSphere),Ea.applyMatrix4(n),Ea.radius+=s,e.ray.intersectsSphere(Ea)===!1)return;sh.copy(n).invert(),ss.copy(e.ray).applyMatrix4(sh);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,d=i.index,u=i.attributes.position;if(d!==null){let h=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let g=h,v=p-1;g<v;g+=c){let m=d.getX(g),f=d.getX(g+1),M=Aa(this,e,ss,l,m,f);M&&t.push(M)}if(this.isLineLoop){let g=d.getX(p-1),v=d.getX(h),m=Aa(this,e,ss,l,g,v);m&&t.push(m)}}else{let h=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let g=h,v=p-1;g<v;g+=c){let m=Aa(this,e,ss,l,g,g+1);m&&t.push(m)}if(this.isLineLoop){let g=Aa(this,e,ss,l,p-1,h);g&&t.push(g)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=i.length;n<s;n++){let a=i[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}};function Aa(r,e,t,i,n,s){let a=r.geometry.attributes.position;if(Uo.fromBufferAttribute(a,n),No.fromBufferAttribute(a,s),t.distanceSqToSegment(Uo,No,Yl,ah)>i)return;Yl.applyMatrix4(r.matrixWorld);let o=e.ray.origin.distanceTo(Yl);if(!(o<e.near||o>e.far))return{distance:o,point:ah.clone().applyMatrix4(r.matrixWorld),index:n,face:null,faceIndex:null,barycoord:null,object:r}}var oh=new z,lh=new z,ko=class extends $n{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let n=0,s=t.count;n<s;n+=2)oh.fromBufferAttribute(t,n),lh.fromBufferAttribute(t,n+1),i[n]=n===0?0:i[n-1],i[n+1]=i[n]+oh.distanceTo(lh);e.setAttribute("lineDistance",new yi(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Oo=class extends $n{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},Fs=class extends ui{static get type(){return"PointsMaterial"}constructor(e){super(),this.isPointsMaterial=!0,this.color=new Fe(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ch=new We,Cc=new sn,Ra=new hi,Ca=new z,Fo=class extends Tt{constructor(e=new Ni,t=new Fs){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,n=this.matrixWorld,s=e.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ra.copy(i.boundingSphere),Ra.applyMatrix4(n),Ra.radius+=s,e.ray.intersectsSphere(Ra)===!1)return;ch.copy(n).invert(),Cc.copy(e.ray).applyMatrix4(ch);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,d=i.attributes.position;if(c!==null){let u=Math.max(0,a.start),h=Math.min(c.count,a.start+a.count);for(let p=u,g=h;p<g;p++){let v=c.getX(p);Ca.fromBufferAttribute(d,v),dh(Ca,v,l,n,e,t,this)}}else{let u=Math.max(0,a.start),h=Math.min(d.count,a.start+a.count);for(let p=u,g=h;p<g;p++)Ca.fromBufferAttribute(d,p),dh(Ca,p,l,n,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=i.length;n<s;n++){let a=i[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}};function dh(r,e,t,i,n,s,a){let o=Cc.distanceSqToPoint(r);if(o<t){let l=new z;Cc.closestPointToPoint(r,l),l.applyMatrix4(i);let c=n.ray.origin.distanceTo(l);if(c<n.near||c>n.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var Ur=class extends ui{static get type(){return"MeshStandardMaterial"}constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Fe(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Fe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Nd,this.normalScale=new it(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ui,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},pi=class extends Ur{static get type(){return"MeshPhysicalMaterial"}constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new it(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return jt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Fe(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Fe(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Fe(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};function La(r,e,t){return!r||!t&&r.constructor===e?r:typeof e.BYTES_PER_ELEMENT=="number"?new e(r):Array.prototype.slice.call(r)}function Kx(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function Zx(r){function e(n,s){return r[n]-r[s]}let t=r.length,i=new Array(t);for(let n=0;n!==t;++n)i[n]=n;return i.sort(e),i}function uh(r,e,t){let i=r.length,n=new r.constructor(i);for(let s=0,a=0;a!==i;++s){let o=t[s]*e;for(let l=0;l!==e;++l)n[a++]=r[o+l]}return n}function kp(r,e,t,i){let n=1,s=r[0];for(;s!==void 0&&s[i]===void 0;)s=r[n++];if(s===void 0)return;let a=s[i];if(a!==void 0)if(Array.isArray(a))do a=s[i],a!==void 0&&(e.push(s.time),t.push.apply(t,a)),s=r[n++];while(s!==void 0);else if(a.toArray!==void 0)do a=s[i],a!==void 0&&(e.push(s.time),a.toArray(t,t.length)),s=r[n++];while(s!==void 0);else do a=s[i],a!==void 0&&(e.push(s.time),t.push(a)),s=r[n++];while(s!==void 0)}var Nr=class{constructor(e,t,i,n){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=n!==void 0?n:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,n=t[i],s=t[i-1];i:{e:{let a;t:{r:if(!(e<n)){for(let o=i+2;;){if(n===void 0){if(e<s)break r;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(s=n,n=t[++i],e<n)break e}a=t.length;break t}if(!(e>=s)){let o=t[1];e<o&&(i=2,s=o);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(n=s,s=t[--i-1],e>=s)break e}a=i,i=0;break t}break i}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(n=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,n)}return this.interpolate_(i,s,e,n)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,n=this.valueSize,s=e*n;for(let a=0;a!==n;++a)t[a]=i[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Bo=class extends Nr{constructor(e,t,i,n){super(e,t,i,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:gc,endingEnd:gc}}intervalChanged_(e,t,i){let n=this.parameterPositions,s=e-2,a=e+1,o=n[s],l=n[a];if(o===void 0)switch(this.getSettings_().endingStart){case vc:s=e,o=2*t-i;break;case xc:s=n.length-2,o=t+n[s]-n[s+1];break;default:s=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case vc:a=e,l=2*i-t;break;case xc:a=1,l=i+n[1]-n[0];break;default:a=e-1,l=t}let c=(i-t)*.5,d=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=s*d,this._offsetNext=a*d}interpolate_(e,t,i,n){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=this._offsetPrev,u=this._offsetNext,h=this._weightPrev,p=this._weightNext,g=(i-t)/(n-t),v=g*g,m=v*g,f=-h*m+2*h*v-h*g,M=(1+h)*m+(-1.5-2*h)*v+(-.5+h)*g+1,w=(-1-p)*m+(1.5+p)*v+.5*g,_=p*m-p*v;for(let D=0;D!==o;++D)s[D]=f*a[d+D]+M*a[c+D]+w*a[l+D]+_*a[u+D];return s}},Ho=class extends Nr{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e,t,i,n){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,d=(i-t)/(n-t),u=1-d;for(let h=0;h!==o;++h)s[h]=a[c+h]*u+a[l+h]*d;return s}},zo=class extends Nr{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e){return this.copySampleValue_(e-1)}},mi=class{constructor(e,t,i,n){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=La(t,this.TimeBufferType),this.values=La(i,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:La(e.times,Array),values:La(e.values,Array)};let n=e.getInterpolation();n!==e.DefaultInterpolation&&(i.interpolation=n)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new zo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ho(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Bo(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case kn:t=this.InterpolantFactoryMethodDiscrete;break;case On:t=this.InterpolantFactoryMethodLinear;break;case Ia:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return kn;case this.InterpolantFactoryMethodLinear:return On;case this.InterpolantFactoryMethodSmooth:return Ia}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,n=t.length;i!==n;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,n=t.length;i!==n;++i)t[i]*=e}return this}trim(e,t){let i=this.times,n=i.length,s=0,a=n-1;for(;s!==n&&i[s]<e;)++s;for(;a!==-1&&i[a]>t;)--a;if(++a,s!==0||a!==n){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=i.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,n=this.values,s=i.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(n!==void 0&&Kx(n))for(let o=0,l=n.length;o!==l;++o){let c=n[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),n=this.getInterpolation()===Ia,s=e.length-1,a=1;for(let o=1;o<s;++o){let l=!1,c=e[o],d=e[o+1];if(c!==d&&(o!==1||c!==e[0]))if(n)l=!0;else{let u=o*i,h=u-i,p=u+i;for(let g=0;g!==i;++g){let v=t[u+g];if(v!==t[h+g]||v!==t[p+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*i,h=a*i;for(let p=0;p!==i;++p)t[h+p]=t[u+p]}++a}}if(s>0){e[a]=e[s];for(let o=s*i,l=a*i,c=0;c!==i;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,n=new i(this.name,e,t);return n.createInterpolant=this.createInterpolant,n}};mi.prototype.TimeBufferType=Float32Array;mi.prototype.ValueBufferType=Float32Array;mi.prototype.DefaultInterpolation=On;var mr=class extends mi{constructor(e,t,i){super(e,t,i)}};mr.prototype.ValueTypeName="bool";mr.prototype.ValueBufferType=Array;mr.prototype.DefaultInterpolation=kn;mr.prototype.InterpolantFactoryMethodLinear=void 0;mr.prototype.InterpolantFactoryMethodSmooth=void 0;var Bs=class extends mi{};Bs.prototype.ValueTypeName="color";var fr=class extends mi{};fr.prototype.ValueTypeName="number";var Vo=class extends Nr{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e,t,i,n){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-t)/(n-t),c=e*o;for(let d=c+o;c!==d;c+=4)Di.slerpFlat(s,0,a,c-o,a,c,l);return s}},gr=class extends mi{InterpolantFactoryMethodLinear(e){return new Vo(this.times,this.values,this.getValueSize(),e)}};gr.prototype.ValueTypeName="quaternion";gr.prototype.InterpolantFactoryMethodSmooth=void 0;var vr=class extends mi{constructor(e,t,i){super(e,t,i)}};vr.prototype.ValueTypeName="string";vr.prototype.ValueBufferType=Array;vr.prototype.DefaultInterpolation=kn;vr.prototype.InterpolantFactoryMethodLinear=void 0;vr.prototype.InterpolantFactoryMethodSmooth=void 0;var xr=class extends mi{};xr.prototype.ValueTypeName="vector";var Go=class{constructor(e="",t=-1,i=[],n=hp){this.name=e,this.tracks=i,this.duration=t,this.blendMode=n,this.uuid=Pi(),this.duration<0&&this.resetDuration()}static parse(e){let t=[],i=e.tracks,n=1/(e.fps||1);for(let a=0,o=i.length;a!==o;++a)t.push(Qx(i[a]).scale(n));let s=new this(e.name,e.duration,t,e.blendMode);return s.uuid=e.uuid,s}static toJSON(e){let t=[],i=e.tracks,n={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let s=0,a=i.length;s!==a;++s)t.push(mi.toJSON(i[s]));return n}static CreateFromMorphTargetSequence(e,t,i,n){let s=t.length,a=[];for(let o=0;o<s;o++){let l=[],c=[];l.push((o+s-1)%s,o,(o+1)%s),c.push(0,1,0);let d=Zx(l);l=uh(l,1,d),c=uh(c,1,d),!n&&l[0]===0&&(l.push(s),c.push(c[0])),a.push(new fr(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/i))}return new this(e,-1,a)}static findByName(e,t){let i=e;if(!Array.isArray(e)){let n=e;i=n.geometry&&n.geometry.animations||n.animations}for(let n=0;n<i.length;n++)if(i[n].name===t)return i[n];return null}static CreateClipsFromMorphTargetSequences(e,t,i){let n={},s=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){let c=e[o],d=c.name.match(s);if(d&&d.length>1){let u=d[1],h=n[u];h||(n[u]=h=[]),h.push(c)}}let a=[];for(let o in n)a.push(this.CreateFromMorphTargetSequence(o,n[o],t,i));return a}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let i=function(d,u,h,p,g){if(h.length!==0){let v=[],m=[];kp(h,v,m,p),v.length!==0&&g.push(new d(u,v,m))}},n=[],s=e.name||"default",a=e.fps||30,o=e.blendMode,l=e.length||-1,c=e.hierarchy||[];for(let d=0;d<c.length;d++){let u=c[d].keys;if(!(!u||u.length===0))if(u[0].morphTargets){let h={},p;for(p=0;p<u.length;p++)if(u[p].morphTargets)for(let g=0;g<u[p].morphTargets.length;g++)h[u[p].morphTargets[g]]=-1;for(let g in h){let v=[],m=[];for(let f=0;f!==u[p].morphTargets.length;++f){let M=u[p];v.push(M.time),m.push(M.morphTarget===g?1:0)}n.push(new fr(".morphTargetInfluence["+g+"]",v,m))}l=h.length*a}else{let h=".bones["+t[d].name+"]";i(xr,h+".position",u,"pos",n),i(gr,h+".quaternion",u,"rot",n),i(xr,h+".scale",u,"scl",n)}}return n.length===0?null:new this(s,l,n,o)}resetDuration(){let e=this.tracks,t=0;for(let i=0,n=e.length;i!==n;++i){let s=this.tracks[i];t=Math.max(t,s.times[s.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}};function Jx(r){switch(r.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return fr;case"vector":case"vector2":case"vector3":case"vector4":return xr;case"color":return Bs;case"quaternion":return gr;case"bool":case"boolean":return mr;case"string":return vr}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+r)}function Qx(r){if(r.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=Jx(r.type);if(r.times===void 0){let t=[],i=[];kp(r.keys,t,i,"value"),r.times=t,r.values=i}return e.parse!==void 0?e.parse(r):new e(r.name,r.times,r.values,r.interpolation)}var cr={enabled:!1,files:{},add:function(r,e){this.enabled!==!1&&(this.files[r]=e)},get:function(r){if(this.enabled!==!1)return this.files[r]},remove:function(r){delete this.files[r]},clear:function(){this.files={}}},$o=class{constructor(e,t,i){let n=this,s=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(d){o++,s===!1&&n.onStart!==void 0&&n.onStart(d,a,o),s=!0},this.itemEnd=function(d){a++,n.onProgress!==void 0&&n.onProgress(d,a,o),a===o&&(s=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(d){n.onError!==void 0&&n.onError(d)},this.resolveURL=function(d){return l?l(d):d},this.setURLModifier=function(d){return l=d,this},this.addHandler=function(d,u){return c.push(d,u),this},this.removeHandler=function(d){let u=c.indexOf(d);return u!==-1&&c.splice(u,2),this},this.getHandler=function(d){for(let u=0,h=c.length;u<h;u+=2){let p=c[u],g=c[u+1];if(p.global&&(p.lastIndex=0),p.test(d))return g}return null}}},Op=new $o,_r=class{constructor(e){this.manager=e!==void 0?e:Op,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(n,s){i.load(e,n,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};_r.DEFAULT_MATERIAL_NAME="__DEFAULT";var sr={},Lc=class extends Error{constructor(e,t){super(e),this.response=t}},Hs=class extends _r{constructor(e){super(e)}load(e,t,i,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=cr.get(e);if(s!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0),s;if(sr[e]!==void 0){sr[e].push({onLoad:t,onProgress:i,onError:n});return}sr[e]=[],sr[e].push({onLoad:t,onProgress:i,onError:n});let a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let d=sr[e],u=c.body.getReader(),h=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),p=h?parseInt(h):0,g=p!==0,v=0,m=new ReadableStream({start(f){M();function M(){u.read().then(({done:w,value:_})=>{if(w)f.close();else{v+=_.byteLength;let D=new ProgressEvent("progress",{lengthComputable:g,loaded:v,total:p});for(let A=0,R=d.length;A<R;A++){let T=d[A];T.onProgress&&T.onProgress(D)}f.enqueue(_),M()}},w=>{f.error(w)})}}});return new Response(m)}else throw new Lc(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(d=>new DOMParser().parseFromString(d,o));case"json":return c.json();default:if(o===void 0)return c.text();{let d=/charset="?([^;"\s]*)"?/i.exec(o),u=d&&d[1]?d[1].toLowerCase():void 0,h=new TextDecoder(u);return c.arrayBuffer().then(p=>h.decode(p))}}}).then(c=>{cr.add(e,c);let d=sr[e];delete sr[e];for(let u=0,h=d.length;u<h;u++){let p=d[u];p.onLoad&&p.onLoad(c)}}).catch(c=>{let d=sr[e];if(d===void 0)throw this.manager.itemError(e),c;delete sr[e];for(let u=0,h=d.length;u<h;u++){let p=d[u];p.onError&&p.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}},Wo=class extends _r{constructor(e){super(e)}load(e,t,i,n){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=cr.get(e);if(a!==void 0)return s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a;let o=Ms("img");function l(){d(),cr.add(e,this),t&&t(this),s.manager.itemEnd(e)}function c(u){d(),n&&n(u),s.manager.itemError(e),s.manager.itemEnd(e)}function d(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),s.manager.itemStart(e),o.src=e,o}},jo=class extends _r{constructor(e){super(e)}load(e,t,i,n){let s=new Gt,a=new Wo(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},i,n),s}},on=class extends Tt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Fe(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Kl=new We,hh=new z,ph=new z,zs=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new it(512,512),this.map=null,this.mapPass=null,this.matrix=new We,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Hn,this._frameExtents=new it(1,1),this._viewportCount=1,this._viewports=[new ot(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;hh.setFromMatrixPosition(e.matrixWorld),t.position.copy(hh),ph.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(ph),t.updateMatrixWorld(),Kl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Kl),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Kl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Pc=class extends zs{constructor(){super(new Bt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,i=Fn*2*e.angle*this.focus,n=this.mapSize.width/this.mapSize.height,s=e.distance||t.far;(i!==t.fov||n!==t.aspect||s!==t.far)&&(t.fov=i,t.aspect=n,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},qo=class extends on{constructor(e,t,i=0,n=Math.PI/3,s=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.distance=i,this.angle=n,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new Pc}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},mh=new We,as=new z,Zl=new z,Ic=class extends zs{constructor(){super(new Bt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new it(4,2),this._viewportCount=6,this._viewports=[new ot(2,1,1,1),new ot(0,1,1,1),new ot(3,1,1,1),new ot(1,1,1,1),new ot(3,0,1,1),new ot(1,0,1,1)],this._cubeDirections=[new z(1,0,0),new z(-1,0,0),new z(0,0,1),new z(0,0,-1),new z(0,1,0),new z(0,-1,0)],this._cubeUps=[new z(0,1,0),new z(0,1,0),new z(0,1,0),new z(0,1,0),new z(0,0,1),new z(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,n=this.matrix,s=e.distance||i.far;s!==i.far&&(i.far=s,i.updateProjectionMatrix()),as.setFromMatrixPosition(e.matrixWorld),i.position.copy(as),Zl.copy(i.position),Zl.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(Zl),i.updateMatrixWorld(),n.makeTranslation(-as.x,-as.y,-as.z),mh.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(mh)}},ln=class extends on{constructor(e,t,i=0,n=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=n,this.shadow=new Ic}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Dc=class extends zs{constructor(){super(new zn(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Vs=class extends on{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.shadow=new Dc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Xo=class extends on{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}},Pr=class{static decodeText(e){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let i=0,n=e.length;i<n;i++)t+=String.fromCharCode(e[i]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}},Yo=class extends _r{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,i,n){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=cr.get(e);if(a!==void 0){if(s.manager.itemStart(e),a.then){a.then(c=>{t&&t(c),s.manager.itemEnd(e)}).catch(c=>{n&&n(c)});return}return setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader;let l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(c){return cr.add(e,c),t&&t(c),s.manager.itemEnd(e),c}).catch(function(c){n&&n(c),cr.remove(e),s.manager.itemError(e),s.manager.itemEnd(e)});cr.add(e,l),s.manager.itemStart(e)}},Ko=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=fh(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=fh();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};function fh(){return performance.now()}var Bd="\\[\\]\\.:\\/",e_=new RegExp("["+Bd+"]","g"),Hd="[^"+Bd+"]",t_="[^"+Bd.replace("\\.","")+"]",i_=/((?:WC+[\/:])*)/.source.replace("WC",Hd),r_=/(WCOD+)?/.source.replace("WCOD",t_),n_=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Hd),s_=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Hd),a_=new RegExp("^"+i_+r_+n_+s_+"$"),o_=["material","materials","bones","map"],Uc=class{constructor(e,t,i){let n=i||xt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,n)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,n=this._bindings[i];n!==void 0&&n.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let n=this._targetGroup.nCachedObjects_,s=i.length;n!==s;++n)i[n].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},xt=class r{constructor(e,t,i){this.path=t,this.parsedPath=i||r.parseTrackName(t),this.node=r.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new r.Composite(e,t,i):new r(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(e_,"")}static parseTrackName(e){let t=a_.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},n=i.nodeName&&i.nodeName.lastIndexOf(".");if(n!==void 0&&n!==-1){let s=i.nodeName.substring(n+1);o_.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,n),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},n=i(e.children);if(n)return n}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)e[t++]=i[n]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let n=0,s=i.length;n!==s;++n)i[n]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,n=t.propertyName,s=t.propertyIndex;if(e||(e=r.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let d=0;d<e.length;d++)if(e[d].name===c){c=d;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[n];if(a===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+n+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(n==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=n;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};xt.Composite=Uc;xt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};xt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};xt.prototype.GetterByBindingType=[xt.prototype._getValue_direct,xt.prototype._getValue_array,xt.prototype._getValue_arrayElement,xt.prototype._getValue_toArray];xt.prototype.SetterByBindingTypeAndVersioning=[[xt.prototype._setValue_direct,xt.prototype._setValue_direct_setNeedsUpdate,xt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_array,xt.prototype._setValue_array_setNeedsUpdate,xt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_arrayElement,xt.prototype._setValue_arrayElement_setNeedsUpdate,xt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[xt.prototype._setValue_fromArray,xt.prototype._setValue_fromArray_setNeedsUpdate,xt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:il}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=il);var l_=Object.freeze(Object.defineProperty({__proto__:null,ACESFilmicToneMapping:Sd,AddEquation:Cr,AddOperation:np,AdditiveBlending:hc,AgXToneMapping:cp,AlphaFormat:Rd,AlwaysCompare:wp,AlwaysDepth:Oa,AlwaysStencilFunc:_c,AmbientLight:Xo,AnimationClip:Go,ArrayCamera:Ao,AttachedBindMode:fc,BackSide:qt,BasicDepthPacking:mp,Bone:Ns,BooleanKeyframeTrack:mr,Box3:bi,BoxGeometry:an,BufferAttribute:Ht,BufferGeometry:Ni,ByteType:Td,Cache:cr,Camera:Ls,CineonToneMapping:op,ClampToEdgeWrapping:lr,Clock:Ko,Color:Fe,ColorKeyframeTrack:Bs,ColorManagement:et,ConstantAlphaFactor:tp,ConstantColorFactor:Qh,CubeCamera:wo,CubeReflectionMapping:Qr,CubeRefractionMapping:en,CubeTexture:Ps,CubeUVReflectionMapping:js,CubicInterpolant:Bo,CullFaceBack:uc,CullFaceFront:Oh,CullFaceNone:kh,CustomBlending:Bh,CustomToneMapping:lp,Data3DTexture:So,DataArrayTexture:Es,DataTexture:ks,DefaultLoadingManager:Op,DepthFormat:Zr,DepthStencilFormat:nn,DepthTexture:Ds,DetachedBindMode:up,DirectionalLight:Vs,DiscreteInterpolant:zo,DoubleSide:Ai,DstAlphaFactor:Xh,DstColorFactor:Kh,EqualCompare:_p,EqualDepth:Ba,EquirectangularReflectionMapping:Ga,EquirectangularRefractionMapping:$a,Euler:Ui,EventDispatcher:pr,FileLoader:Hs,Float32BufferAttribute:yi,FloatType:_i,FrontSide:qi,Frustum:Hn,GLSL3:yc,GreaterCompare:yp,GreaterDepth:za,GreaterEqualCompare:Sp,GreaterEqualDepth:Ha,Group:Li,HalfFloatType:Xn,ImageBitmapLoader:Yo,ImageLoader:Wo,ImageUtils:yo,InstancedBufferAttribute:Gn,InstancedMesh:Do,IntType:rl,InterleavedBuffer:Co,InterleavedBufferAttribute:Lo,Interpolant:Nr,InterpolateDiscrete:kn,InterpolateLinear:On,InterpolateSmooth:Ia,KeepStencilOp:jr,KeyframeTrack:mi,Layers:As,LessCompare:xp,LessDepth:Fa,LessEqualCompare:kd,LessEqualDepth:Jr,Light:on,Line:$n,LineBasicMaterial:Os,LineLoop:Oo,LineSegments:ko,LinearFilter:ri,LinearInterpolant:Ho,LinearMipmapLinearFilter:Wi,LinearMipmapNearestFilter:hs,LinearSRGBColorSpace:Yt,LinearToneMapping:sp,LinearTransfer:qs,Loader:_r,LoaderUtils:Pr,LoadingManager:$o,LuminanceAlphaFormat:Pd,LuminanceFormat:Ld,Material:ui,MathUtils:Mp,Matrix3:Ge,Matrix4:We,MaxEquation:Gh,Mesh:ht,MeshBasicMaterial:Ci,MeshDepthMaterial:To,MeshDistanceMaterial:Eo,MeshPhysicalMaterial:pi,MeshStandardMaterial:Ur,MinEquation:Vh,MirroredRepeatWrapping:Ss,MixOperation:rp,MultiplyBlending:mc,MultiplyOperation:bd,NearestFilter:Xt,NearestMipmapLinearFilter:Ln,NearestMipmapNearestFilter:Md,NeutralToneMapping:dp,NeverCompare:vp,NeverDepth:ka,NoBlending:dr,NoColorSpace:or,NoToneMapping:ur,NormalAnimationBlendMode:hp,NormalBlending:Kr,NotEqualCompare:bp,NotEqualDepth:Va,NumberKeyframeTrack:fr,Object3D:Tt,ObjectSpaceNormalMap:gp,OneFactor:Wh,OneMinusConstantAlphaFactor:ip,OneMinusConstantColorFactor:ep,OneMinusDstAlphaFactor:Yh,OneMinusDstColorFactor:Zh,OneMinusSrcAlphaFactor:Na,OneMinusSrcColorFactor:qh,OrthographicCamera:zn,PCFShadowMap:yd,PCFSoftShadowMap:Fh,PMREMGenerator:Vn,PerspectiveCamera:Bt,Plane:Gi,PlaneGeometry:Is,PointLight:ln,Points:Fo,PointsMaterial:Fs,PropertyBinding:xt,Quaternion:Di,QuaternionKeyframeTrack:gr,QuaternionLinearInterpolant:Vo,RED_GREEN_RGTC2_Format:go,RED_RGTC1_Format:Dd,REVISION:il,RGBADepthPacking:fp,RGBAFormat:di,RGBAIntegerFormat:cl,RGBA_ASTC_10x10_Format:co,RGBA_ASTC_10x5_Format:ao,RGBA_ASTC_10x6_Format:oo,RGBA_ASTC_10x8_Format:lo,RGBA_ASTC_12x10_Format:uo,RGBA_ASTC_12x12_Format:ho,RGBA_ASTC_4x4_Format:Ja,RGBA_ASTC_5x4_Format:Qa,RGBA_ASTC_5x5_Format:eo,RGBA_ASTC_6x5_Format:to,RGBA_ASTC_6x6_Format:io,RGBA_ASTC_8x5_Format:ro,RGBA_ASTC_8x6_Format:no,RGBA_ASTC_8x8_Format:so,RGBA_BPTC_Format:vs,RGBA_ETC2_EAC_Format:Za,RGBA_PVRTC_2BPPV1_Format:Xa,RGBA_PVRTC_4BPPV1_Format:qa,RGBA_S3TC_DXT1_Format:ms,RGBA_S3TC_DXT3_Format:fs,RGBA_S3TC_DXT5_Format:gs,RGBFormat:Cd,RGB_BPTC_SIGNED_Format:po,RGB_BPTC_UNSIGNED_Format:mo,RGB_ETC1_Format:Ya,RGB_ETC2_Format:Ka,RGB_PVRTC_2BPPV1_Format:ja,RGB_PVRTC_4BPPV1_Format:Wa,RGB_S3TC_DXT1_Format:ps,RGFormat:Id,RGIntegerFormat:ll,Ray:sn,RedFormat:al,RedIntegerFormat:ol,ReinhardToneMapping:ap,RenderTarget:bo,RepeatWrapping:tn,ReverseSubtractEquation:zh,SIGNED_RED_GREEN_RGTC2_Format:vo,SIGNED_RED_RGTC1_Format:fo,SRGBColorSpace:Ft,SRGBTransfer:dt,Scene:Us,ShaderChunk:$e,ShaderLib:Ei,ShaderMaterial:ki,ShortType:Ed,Skeleton:Io,SkinnedMesh:Po,Source:Ts,Sphere:hi,SpotLight:qo,SrcAlphaFactor:Ua,SrcAlphaSaturateFactor:Jh,SrcColorFactor:jh,StaticDrawUsage:_o,StringKeyframeTrack:vr,SubtractEquation:Hh,SubtractiveBlending:pc,TangentSpaceNormalMap:Nd,Texture:Gt,TextureLoader:jo,Triangle:Lr,TriangleFanDrawMode:xo,TriangleStripDrawMode:Ud,TrianglesDrawMode:pp,UVMapping:wd,Uint16BufferAttribute:Rs,Uint32BufferAttribute:Cs,UniformsLib:pe,UniformsUtils:Cp,UnsignedByteType:Xi,UnsignedInt248Type:rn,UnsignedInt5999Type:Ad,UnsignedIntType:Dr,UnsignedShort4444Type:nl,UnsignedShort5551Type:sl,UnsignedShortType:Nn,VSMShadowMap:Vi,Vector2:it,Vector3:z,Vector4:ot,VectorKeyframeTrack:xr,WebGLCoordinateSystem:ji,WebGLCubeRenderTarget:Mo,WebGLRenderTarget:Yi,WebGLRenderer:Ro,WebGLUtils:Np,WebGPUCoordinateSystem:ws,WrapAroundEnding:xc,ZeroCurvatureEnding:gc,ZeroFactor:$h,ZeroSlopeEnding:vc,createCanvasElement:Ep},Symbol.toStringTag,{value:"Module"})),Jl=["viseme_sil","viseme_PP","viseme_FF","viseme_TH","viseme_DD","viseme_kk","viseme_CH","viseme_SS","viseme_nn","viseme_RR","viseme_aa","viseme_E","viseme_I","viseme_O","viseme_U"];async function c_(r,e,t,i={}){let n=(await new e().loadAsync(t)).scene,s=[];n.traverse(U=>{U.isMesh&&U.morphTargetDictionary&&s.push(U)});let a=null,o=0,l=0;n.traverse(U=>{!a&&U.isBone&&/head/i.test(U.name)&&(a=U,o=U.rotation.x,l=U.rotation.y)});let c=new r.Group,d=new r.Group;d.add(n),c.add(d),n.updateMatrixWorld(!0);let u=new r.Box3().setFromObject(n),h=Math.max(u.getSize(new r.Vector3).y,.001)/7.5,p=new r.Vector3;a?(a.getWorldPosition(p),p.y+=h*.35):u.getCenter(p);let g=1/h;d.scale.setScalar(g),d.position.set(-p.x*g,-p.y*g,-p.z*g);let v=(i.faceYawDeg??0)*(Math.PI/180),m={};for(let U of Jl)m[U]=0;let f=-1,M=1.5,w=0,_=-1,D={x:0,y:0},A=2,R=0,T=0;function b(){for(let P of Jl)m[P]=0;R=0;let U=Oe.frame();if(T=U.speaking?U.level:0,!U.speaking||!U.viseme)return;let V=Math.min(1,.6+U.level*.8),G=(P,L)=>{if(!P||P==="viseme_sil"||L<=0)return;let H=Kd[P]??.6;m[P]=Math.max(m[P]||0,H*L*V),R=Math.max(R,(Zd[P]||0)*L*V)};G(U.viseme.name,U.viseme.weight),U.prev&&G(U.prev.name,U.prev.weight*.85)}function x(U,V){b();let G=1-Math.exp(-U*32),P=1-Math.exp(-U*16);for(let H of s){let F=H.morphTargetDictionary,K=H.morphTargetInfluences;for(let ce of Jl){let fe=F[ce];if(fe===void 0)continue;let re=ce==="viseme_sil"?0:m[ce]||0;K[fe]+=(re-K[fe])*(re>K[fe]?G:P)}let ne=F.jawOpen;ne!==void 0&&(K[ne]+=(R-K[ne])*(R>K[ne]?G:P))}if(f<0&&V>M&&(f=0),f>=0){f+=U;let H=f/.16;w=H<1?Math.sin(H*Math.PI):0,H>=1&&(f=-1,w=0,M=V+1.8+Math.random()*3.4)}for(let H of s){let F=H.morphTargetDictionary,K=H.morphTargetInfluences;for(let ne of["eyeBlinkLeft","eyeBlinkRight","eyesClosed"]){let ce=F[ne];ce!==void 0&&(K[ce]+=(w-K[ce])*Math.min(1,U*30))}}c.position.y=Math.sin(V*1.25)*.008,c.rotation.y=v+Math.sin(V*.22)*.035,V>A&&(D.x=(Math.random()-.5)*.22,D.y=(Math.random()-.5)*.12,A=V+2.5+Math.random()*4);let L=D.y+T*.035;_>=0&&(_+=U,_>=.85?_=-1:L+=Math.sin(_/.85*Math.PI*2)*.2),a&&(a.rotation.y+=(l+D.x-a.rotation.y)*Math.min(1,U*3),a.rotation.x+=(o+L-a.rotation.x)*Math.min(1,U*6))}function C(){n.traverse(U=>{if(U.isMesh){U.geometry&&U.geometry.dispose();let V=Array.isArray(U.material)?U.material:[U.material];for(let G of V)if(G){for(let P of Object.keys(G)){let L=G[P];L&&L.isTexture&&L.dispose()}G.dispose()}}}),c.removeFromParent()}return{group:c,nod(){_<0&&(_=0)},update:x,dispose:C}}function gh(r,e){if(e===pp)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),r;if(e===xo||e===Ud){let t=r.getIndex();if(t===null){let a=[],o=r.getAttribute("position");if(o!==void 0){for(let l=0;l<o.count;l++)a.push(l);r.setIndex(a),t=r.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),r}let i=t.count-2,n=[];if(e===xo)for(let a=1;a<=i;a++)n.push(t.getX(0)),n.push(t.getX(a)),n.push(t.getX(a+1));else for(let a=0;a<i;a++)a%2===0?(n.push(t.getX(a)),n.push(t.getX(a+1)),n.push(t.getX(a+2))):(n.push(t.getX(a+2)),n.push(t.getX(a+1)),n.push(t.getX(a)));n.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let s=r.clone();return s.setIndex(n),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),r}var Nc=class extends _r{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Bc(t)}),this.register(function(t){return new Hc(t)}),this.register(function(t){return new Yc(t)}),this.register(function(t){return new Kc(t)}),this.register(function(t){return new Zc(t)}),this.register(function(t){return new Vc(t)}),this.register(function(t){return new Gc(t)}),this.register(function(t){return new $c(t)}),this.register(function(t){return new Wc(t)}),this.register(function(t){return new Fc(t)}),this.register(function(t){return new jc(t)}),this.register(function(t){return new zc(t)}),this.register(function(t){return new Xc(t)}),this.register(function(t){return new qc(t)}),this.register(function(t){return new kc(t)}),this.register(function(t){return new Jc(t)}),this.register(function(t){return new Qc(t)})}load(e,t,i,n){let s=this,a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){let c=Pr.extractUrlBase(e);a=Pr.resolveURL(c,this.path)}else a=Pr.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){n?n(c):console.error(c),s.manager.itemError(e),s.manager.itemEnd(e)},l=new Hs(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{s.parse(c,a,function(d){t(d),s.manager.itemEnd(e)},o)}catch(d){o(d)}},i,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,n){let s,a={},o={},l=new TextDecoder;if(typeof e=="string")s=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===Fp){try{a[Ze.KHR_BINARY_GLTF]=new ed(e)}catch(d){n&&n(d);return}s=JSON.parse(a[Ze.KHR_BINARY_GLTF].content)}else s=JSON.parse(l.decode(e));else s=e;if(s.asset===void 0||s.asset.version[0]<2){n&&n(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new od(s,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let d=0;d<this.pluginCallbacks.length;d++){let u=this.pluginCallbacks[d](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,a[u.name]=!0}if(s.extensionsUsed)for(let d=0;d<s.extensionsUsed.length;++d){let u=s.extensionsUsed[d],h=s.extensionsRequired||[];switch(u){case Ze.KHR_MATERIALS_UNLIT:a[u]=new Oc;break;case Ze.KHR_DRACO_MESH_COMPRESSION:a[u]=new td(s,this.dracoLoader);break;case Ze.KHR_TEXTURE_TRANSFORM:a[u]=new id;break;case Ze.KHR_MESH_QUANTIZATION:a[u]=new rd;break;default:h.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(a),c.setPlugins(o),c.parse(i,n)}parseAsync(e,t){let i=this;return new Promise(function(n,s){i.parse(e,t,n,s)})}};function d_(){let r={};return{get:function(e){return r[e]},add:function(e,t){r[e]=t},remove:function(e){delete r[e]},removeAll:function(){r={}}}}var Ze={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},kc=class{constructor(e){this.parser=e,this.name=Ze.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let i=0,n=t.length;i<n;i++){let s=t[i];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(e){let t=this.parser,i="light:"+e,n=t.cache.get(i);if(n)return n;let s=t.json,a=((s.extensions&&s.extensions[this.name]||{}).lights||[])[e],o,l=new Fe(16777215);a.color!==void 0&&l.setRGB(a.color[0],a.color[1],a.color[2],Yt);let c=a.range!==void 0?a.range:0;switch(a.type){case"directional":o=new Vs(l),o.target.position.set(0,0,-1),o.add(o.target);break;case"point":o=new ln(l),o.distance=c;break;case"spot":o=new qo(l),o.distance=c,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,o.angle=a.spot.outerConeAngle,o.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,o.target.position.set(0,0,-1),o.add(o.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return o.position.set(0,0,0),o.decay=2,ar(o,a),a.intensity!==void 0&&(o.intensity=a.intensity),o.name=t.createUniqueName(a.name||"light_"+e),n=Promise.resolve(o),t.cache.add(i,n),n}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,i=this.parser,n=i.json.nodes[e],s=(n.extensions&&n.extensions[this.name]||{}).light;return s===void 0?null:this._loadLight(s).then(function(a){return i._getNodeRef(t.cache,s,a)})}},Oc=class{constructor(){this.name=Ze.KHR_MATERIALS_UNLIT}getMaterialType(){return Ci}extendParams(e,t,i){let n=[];e.color=new Fe(1,1,1),e.opacity=1;let s=t.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){let a=s.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],Yt),e.opacity=a[3]}s.baseColorTexture!==void 0&&n.push(i.assignTexture(e,"map",s.baseColorTexture,Ft))}return Promise.all(n)}},Fc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let n=i.extensions[this.name].emissiveStrength;return n!==void 0&&(t.emissiveIntensity=n),Promise.resolve()}},Bc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];if(a.clearcoatFactor!==void 0&&(t.clearcoat=a.clearcoatFactor),a.clearcoatTexture!==void 0&&s.push(i.assignTexture(t,"clearcoatMap",a.clearcoatTexture)),a.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=a.clearcoatRoughnessFactor),a.clearcoatRoughnessTexture!==void 0&&s.push(i.assignTexture(t,"clearcoatRoughnessMap",a.clearcoatRoughnessTexture)),a.clearcoatNormalTexture!==void 0&&(s.push(i.assignTexture(t,"clearcoatNormalMap",a.clearcoatNormalTexture)),a.clearcoatNormalTexture.scale!==void 0)){let o=a.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new it(o,o)}return Promise.all(s)}},Hc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_DISPERSION}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let n=i.extensions[this.name];return t.dispersion=n.dispersion!==void 0?n.dispersion:0,Promise.resolve()}},zc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];return a.iridescenceFactor!==void 0&&(t.iridescence=a.iridescenceFactor),a.iridescenceTexture!==void 0&&s.push(i.assignTexture(t,"iridescenceMap",a.iridescenceTexture)),a.iridescenceIor!==void 0&&(t.iridescenceIOR=a.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),a.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=a.iridescenceThicknessMinimum),a.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=a.iridescenceThicknessMaximum),a.iridescenceThicknessTexture!==void 0&&s.push(i.assignTexture(t,"iridescenceThicknessMap",a.iridescenceThicknessTexture)),Promise.all(s)}},Vc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_SHEEN}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[];t.sheenColor=new Fe(0,0,0),t.sheenRoughness=0,t.sheen=1;let a=n.extensions[this.name];if(a.sheenColorFactor!==void 0){let o=a.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],Yt)}return a.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=a.sheenRoughnessFactor),a.sheenColorTexture!==void 0&&s.push(i.assignTexture(t,"sheenColorMap",a.sheenColorTexture,Ft)),a.sheenRoughnessTexture!==void 0&&s.push(i.assignTexture(t,"sheenRoughnessMap",a.sheenRoughnessTexture)),Promise.all(s)}},Gc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];return a.transmissionFactor!==void 0&&(t.transmission=a.transmissionFactor),a.transmissionTexture!==void 0&&s.push(i.assignTexture(t,"transmissionMap",a.transmissionTexture)),Promise.all(s)}},$c=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_VOLUME}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];t.thickness=a.thicknessFactor!==void 0?a.thicknessFactor:0,a.thicknessTexture!==void 0&&s.push(i.assignTexture(t,"thicknessMap",a.thicknessTexture)),t.attenuationDistance=a.attenuationDistance||1/0;let o=a.attenuationColor||[1,1,1];return t.attenuationColor=new Fe().setRGB(o[0],o[1],o[2],Yt),Promise.all(s)}},Wc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_IOR}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let n=i.extensions[this.name];return t.ior=n.ior!==void 0?n.ior:1.5,Promise.resolve()}},jc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_SPECULAR}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];t.specularIntensity=a.specularFactor!==void 0?a.specularFactor:1,a.specularTexture!==void 0&&s.push(i.assignTexture(t,"specularIntensityMap",a.specularTexture));let o=a.specularColorFactor||[1,1,1];return t.specularColor=new Fe().setRGB(o[0],o[1],o[2],Yt),a.specularColorTexture!==void 0&&s.push(i.assignTexture(t,"specularColorMap",a.specularColorTexture,Ft)),Promise.all(s)}},qc=class{constructor(e){this.parser=e,this.name=Ze.EXT_MATERIALS_BUMP}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];return t.bumpScale=a.bumpFactor!==void 0?a.bumpFactor:1,a.bumpTexture!==void 0&&s.push(i.assignTexture(t,"bumpMap",a.bumpTexture)),Promise.all(s)}},Xc=class{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let t=this.parser.json.materials[e];return!t.extensions||!t.extensions[this.name]?null:pi}extendMaterialParams(e,t){let i=this.parser,n=i.json.materials[e];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();let s=[],a=n.extensions[this.name];return a.anisotropyStrength!==void 0&&(t.anisotropy=a.anisotropyStrength),a.anisotropyRotation!==void 0&&(t.anisotropyRotation=a.anisotropyRotation),a.anisotropyTexture!==void 0&&s.push(i.assignTexture(t,"anisotropyMap",a.anisotropyTexture)),Promise.all(s)}},Yc=class{constructor(e){this.parser=e,this.name=Ze.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,i=t.json,n=i.textures[e];if(!n.extensions||!n.extensions[this.name])return null;let s=n.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,s.source,a)}},Kc=class{constructor(e){this.parser=e,this.name=Ze.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){let t=this.name,i=this.parser,n=i.json,s=n.textures[e];if(!s.extensions||!s.extensions[t])return null;let a=s.extensions[t],o=n.images[a.source],l=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return i.loadTextureImage(e,a.source,l);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return i.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},Zc=class{constructor(e){this.parser=e,this.name=Ze.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){let t=this.name,i=this.parser,n=i.json,s=n.textures[e];if(!s.extensions||!s.extensions[t])return null;let a=s.extensions[t],o=n.images[a.source],l=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return i.loadTextureImage(e,a.source,l);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return i.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},Jc=class{constructor(e){this.name=Ze.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){let n=i.extensions[this.name],s=this.parser.getDependency("buffer",n.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(o){let l=n.byteOffset||0,c=n.byteLength||0,d=n.count,u=n.byteStride,h=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(d,u,h,n.mode,n.filter).then(function(p){return p.buffer}):a.ready.then(function(){let p=new ArrayBuffer(d*u);return a.decodeGltfBuffer(new Uint8Array(p),d,u,h,n.mode,n.filter),p})})}else return null}},Qc=class{constructor(e){this.name=Ze.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;let n=t.meshes[i.mesh];for(let l of n.primitives)if(l.mode!==xi.TRIANGLES&&l.mode!==xi.TRIANGLE_STRIP&&l.mode!==xi.TRIANGLE_FAN&&l.mode!==void 0)return null;let s=i.extensions[this.name].attributes,a=[],o={};for(let l in s)a.push(this.parser.getDependency("accessor",s[l]).then(c=>(o[l]=c,o[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{let c=l.pop(),d=c.isGroup?c.children:[c],u=l[0].count,h=[];for(let p of d){let g=new We,v=new z,m=new Di,f=new z(1,1,1),M=new Do(p.geometry,p.material,u);for(let w=0;w<u;w++)o.TRANSLATION&&v.fromBufferAttribute(o.TRANSLATION,w),o.ROTATION&&m.fromBufferAttribute(o.ROTATION,w),o.SCALE&&f.fromBufferAttribute(o.SCALE,w),M.setMatrixAt(w,g.compose(v,m,f));for(let w in o)if(w==="_COLOR_0"){let _=o[w];M.instanceColor=new Gn(_.array,_.itemSize,_.normalized)}else w!=="TRANSLATION"&&w!=="ROTATION"&&w!=="SCALE"&&p.geometry.setAttribute(w,o[w]);Tt.prototype.copy.call(M,p),this.parser.assignFinalMaterial(M),h.push(M)}return c.isGroup?(c.clear(),c.add(...h),c):h[0]}))}},Fp="glTF",os=12,vh={JSON:1313821514,BIN:5130562},ed=class{constructor(e){this.name=Ze.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,os),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Fp)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let n=this.header.length-os,s=new DataView(e,os),a=0;for(;a<n;){let o=s.getUint32(a,!0);a+=4;let l=s.getUint32(a,!0);if(a+=4,l===vh.JSON){let c=new Uint8Array(e,os+a,o);this.content=i.decode(c)}else if(l===vh.BIN){let c=os+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},td=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Ze.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let i=this.json,n=this.dracoLoader,s=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(let d in a){let u=sd[d]||d.toLowerCase();o[u]=a[d]}for(let d in e.attributes){let u=sd[d]||d.toLowerCase();if(a[d]!==void 0){let h=i.accessors[e.attributes[d]],p=Un[h.componentType];c[u]=p.name,l[u]=h.normalized===!0}}return t.getDependency("bufferView",s).then(function(d){return new Promise(function(u,h){n.decodeDracoFile(d,function(p){for(let g in p.attributes){let v=p.attributes[g],m=l[g];m!==void 0&&(v.normalized=m)}u(p)},o,c,Yt,h)})})}},id=class{constructor(){this.name=Ze.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},rd=class{constructor(){this.name=Ze.KHR_MESH_QUANTIZATION}},Zo=class extends Nr{constructor(e,t,i,n){super(e,t,i,n)}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,n=this.valueSize,s=e*n*3+n;for(let a=0;a!==n;a++)t[a]=i[s+a];return t}interpolate_(e,t,i,n){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,d=n-t,u=(i-t)/d,h=u*u,p=h*u,g=e*c,v=g-c,m=-2*p+3*h,f=p-h,M=1-m,w=f-h+u;for(let _=0;_!==o;_++){let D=a[v+_+o],A=a[v+_+l]*d,R=a[g+_+o],T=a[g+_]*d;s[_]=M*D+w*A+m*R+f*T}return s}},u_=new Di,nd=class extends Zo{interpolate_(e,t,i,n){let s=super.interpolate_(e,t,i,n);return u_.fromArray(s).normalize().toArray(s),s}},xi={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Un={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},xh={9728:Xt,9729:ri,9984:Md,9985:hs,9986:Ln,9987:Wi},_h={33071:lr,33648:Ss,10497:tn},Ql={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},sd={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Rr={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},h_={CUBICSPLINE:void 0,LINEAR:On,STEP:kn},ec={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function p_(r){return r.DefaultMaterial===void 0&&(r.DefaultMaterial=new Ur({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:qi})),r.DefaultMaterial}function Wr(r,e,t){for(let i in t.extensions)r[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function ar(r,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(r.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function m_(r,e,t){let i=!1,n=!1,s=!1;for(let c=0,d=e.length;c<d;c++){let u=e[c];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(n=!0),u.COLOR_0!==void 0&&(s=!0),i&&n&&s)break}if(!i&&!n&&!s)return Promise.resolve(r);let a=[],o=[],l=[];for(let c=0,d=e.length;c<d;c++){let u=e[c];if(i){let h=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):r.attributes.position;a.push(h)}if(n){let h=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):r.attributes.normal;o.push(h)}if(s){let h=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):r.attributes.color;l.push(h)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l)]).then(function(c){let d=c[0],u=c[1],h=c[2];return i&&(r.morphAttributes.position=d),n&&(r.morphAttributes.normal=u),s&&(r.morphAttributes.color=h),r.morphTargetsRelative=!0,r})}function f_(r,e){if(r.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)r.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(r.morphTargetInfluences.length===t.length){r.morphTargetDictionary={};for(let i=0,n=t.length;i<n;i++)r.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function g_(r){let e,t=r.extensions&&r.extensions[Ze.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+tc(t.attributes):e=r.indices+":"+tc(r.attributes)+":"+r.mode,r.targets!==void 0)for(let i=0,n=r.targets.length;i<n;i++)e+=":"+tc(r.targets[i]);return e}function tc(r){let e="",t=Object.keys(r).sort();for(let i=0,n=t.length;i<n;i++)e+=t[i]+":"+r[t[i]]+";";return e}function ad(r){switch(r){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function v_(r){return r.search(/\.jpe?g($|\?)/i)>0||r.search(/^data\:image\/jpeg/)===0?"image/jpeg":r.search(/\.webp($|\?)/i)>0||r.search(/^data\:image\/webp/)===0?"image/webp":r.search(/\.ktx2($|\?)/i)>0||r.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var x_=new We,od=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new d_,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,n=-1,s=!1,a=-1;if(typeof navigator<"u"){let o=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(o)===!0;let l=o.match(/Version\/(\d+)/);n=i&&l?parseInt(l[1],10):-1,s=o.indexOf("Firefox")>-1,a=s?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&n<17||s&&a<98?this.textureLoader=new jo(this.options.manager):this.textureLoader=new Yo(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Hs(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let i=this,n=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(a){let o={scene:a[0][n.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:n.asset,parser:i,userData:{}};return Wr(s,o,n),ar(o,n),Promise.all(i._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(let l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let n=0,s=t.length;n<s;n++){let a=t[n].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let n=0,s=e.length;n<s;n++){let a=e[n];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(i[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;let n=i.clone(),s=(a,o)=>{let l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(let[c,d]of a.children.entries())s(d,o.children[c])};return s(i,n),n.name+="_instance_"+e.uses[t]++,n}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){let n=e(t[i]);if(n)return n}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let i=[];for(let n=0;n<t.length;n++){let s=e(t[n]);s&&i.push(s)}return i}getDependency(e,t){let i=e+":"+t,n=this.cache.get(i);if(!n){switch(e){case"scene":n=this.loadScene(t);break;case"node":n=this._invokeOne(function(s){return s.loadNode&&s.loadNode(t)});break;case"mesh":n=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(t)});break;case"accessor":n=this.loadAccessor(t);break;case"bufferView":n=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(t)});break;case"buffer":n=this.loadBuffer(t);break;case"material":n=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(t)});break;case"texture":n=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(t)});break;case"skin":n=this.loadSkin(t);break;case"animation":n=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(t)});break;case"camera":n=this.loadCamera(t);break;default:if(n=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(e,t)}),!n)throw new Error("Unknown type: "+e);break}this.cache.add(i,n)}return n}getDependencies(e){let t=this.cache.get(e);if(!t){let i=this,n=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(n.map(function(s,a){return i.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Ze.KHR_BINARY_GLTF].body);let n=this.options;return new Promise(function(s,a){i.load(Pr.resolveURL(t.uri,n.path),s,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){let n=t.byteLength||0,s=t.byteOffset||0;return i.slice(s,s+n)})}loadAccessor(e){let t=this,i=this.json,n=this.json.accessors[e];if(n.bufferView===void 0&&n.sparse===void 0){let a=Ql[n.type],o=Un[n.componentType],l=n.normalized===!0,c=new o(n.count*a);return Promise.resolve(new Ht(c,a,l))}let s=[];return n.bufferView!==void 0?s.push(this.getDependency("bufferView",n.bufferView)):s.push(null),n.sparse!==void 0&&(s.push(this.getDependency("bufferView",n.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",n.sparse.values.bufferView))),Promise.all(s).then(function(a){let o=a[0],l=Ql[n.type],c=Un[n.componentType],d=c.BYTES_PER_ELEMENT,u=d*l,h=n.byteOffset||0,p=n.bufferView!==void 0?i.bufferViews[n.bufferView].byteStride:void 0,g=n.normalized===!0,v,m;if(p&&p!==u){let f=Math.floor(h/p),M="InterleavedBuffer:"+n.bufferView+":"+n.componentType+":"+f+":"+n.count,w=t.cache.get(M);w||(v=new c(o,f*p,n.count*p/d),w=new Co(v,p/d),t.cache.add(M,w)),m=new Lo(w,l,h%p/d,g)}else o===null?v=new c(n.count*l):v=new c(o,h,n.count*l),m=new Ht(v,l,g);if(n.sparse!==void 0){let f=Ql.SCALAR,M=Un[n.sparse.indices.componentType],w=n.sparse.indices.byteOffset||0,_=n.sparse.values.byteOffset||0,D=new M(a[1],w,n.sparse.count*f),A=new c(a[2],_,n.sparse.count*l);o!==null&&(m=new Ht(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let R=0,T=D.length;R<T;R++){let b=D[R];if(m.setX(b,A[R*l]),l>=2&&m.setY(b,A[R*l+1]),l>=3&&m.setZ(b,A[R*l+2]),l>=4&&m.setW(b,A[R*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=g}return m})}loadTexture(e){let t=this.json,i=this.options,n=t.textures[e].source,s=t.images[n],a=this.textureLoader;if(s.uri){let o=i.manager.getHandler(s.uri);o!==null&&(a=o)}return this.loadTextureImage(e,n,a)}loadTextureImage(e,t,i){let n=this,s=this.json,a=s.textures[e],o=s.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];let c=this.loadImageSource(t,i).then(function(d){d.flipY=!1,d.name=a.name||o.name||"",d.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(d.name=o.uri);let u=(s.samplers||{})[a.sampler]||{};return d.magFilter=xh[u.magFilter]||ri,d.minFilter=xh[u.minFilter]||Wi,d.wrapS=_h[u.wrapS]||tn,d.wrapT=_h[u.wrapT]||tn,d.generateMipmaps=!d.isCompressedTexture&&d.minFilter!==Xt&&d.minFilter!==ri,n.associations.set(d,{textures:e}),d}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){let i=this,n=this.json,s=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let a=n.images[e],o=self.URL||self.webkitURL,l=a.uri||"",c=!1;if(a.bufferView!==void 0)l=i.getDependency("bufferView",a.bufferView).then(function(u){c=!0;let h=new Blob([u],{type:a.mimeType});return l=o.createObjectURL(h),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let d=Promise.resolve(l).then(function(u){return new Promise(function(h,p){let g=h;t.isImageBitmapLoader===!0&&(g=function(v){let m=new Gt(v);m.needsUpdate=!0,h(m)}),t.load(Pr.resolveURL(u,s.path),g,void 0,p)})}).then(function(u){return c===!0&&o.revokeObjectURL(l),ar(u,a),u.userData.mimeType=a.mimeType||v_(a.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[e]=d,d}assignTexture(e,t,i,n){let s=this;return this.getDependency("texture",i.index).then(function(a){if(!a)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(a=a.clone(),a.channel=i.texCoord),s.extensions[Ze.KHR_TEXTURE_TRANSFORM]){let o=i.extensions!==void 0?i.extensions[Ze.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let l=s.associations.get(a);a=s.extensions[Ze.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),s.associations.set(a,l)}}return n!==void 0&&(a.colorSpace=n),e[t]=a,a})}assignFinalMaterial(e){let t=e.geometry,i=e.material,n=t.attributes.tangent===void 0,s=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+i.uuid,l=this.cache.get(o);l||(l=new Fs,ui.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,l.sizeAttenuation=!1,this.cache.add(o,l)),i=l}else if(e.isLine){let o="LineBasicMaterial:"+i.uuid,l=this.cache.get(o);l||(l=new Os,ui.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,this.cache.add(o,l)),i=l}if(n||s||a){let o="ClonedMaterial:"+i.uuid+":";n&&(o+="derivative-tangents:"),s&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=i.clone(),s&&(l.vertexColors=!0),a&&(l.flatShading=!0),n&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(i))),i=l}e.material=i}getMaterialType(){return Ur}loadMaterial(e){let t=this,i=this.json,n=this.extensions,s=i.materials[e],a,o={},l=s.extensions||{},c=[];if(l[Ze.KHR_MATERIALS_UNLIT]){let u=n[Ze.KHR_MATERIALS_UNLIT];a=u.getMaterialType(),c.push(u.extendParams(o,s,t))}else{let u=s.pbrMetallicRoughness||{};if(o.color=new Fe(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let h=u.baseColorFactor;o.color.setRGB(h[0],h[1],h[2],Yt),o.opacity=h[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",u.baseColorTexture,Ft)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),a=this._invokeOne(function(h){return h.getMaterialType&&h.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(h){return h.extendMaterialParams&&h.extendMaterialParams(e,o)})))}s.doubleSided===!0&&(o.side=Ai);let d=s.alphaMode||ec.OPAQUE;if(d===ec.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,d===ec.MASK&&(o.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&a!==Ci&&(c.push(t.assignTexture(o,"normalMap",s.normalTexture)),o.normalScale=new it(1,1),s.normalTexture.scale!==void 0)){let u=s.normalTexture.scale;o.normalScale.set(u,u)}if(s.occlusionTexture!==void 0&&a!==Ci&&(c.push(t.assignTexture(o,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&a!==Ci){let u=s.emissiveFactor;o.emissive=new Fe().setRGB(u[0],u[1],u[2],Yt)}return s.emissiveTexture!==void 0&&a!==Ci&&c.push(t.assignTexture(o,"emissiveMap",s.emissiveTexture,Ft)),Promise.all(c).then(function(){let u=new a(o);return s.name&&(u.name=s.name),ar(u,s),t.associations.set(u,{materials:e}),s.extensions&&Wr(n,u,s),u})}createUniqueName(e){let t=xt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,i=this.extensions,n=this.primitiveCache;function s(o){return i[Ze.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return yh(l,o,t)})}let a=[];for(let o=0,l=e.length;o<l;o++){let c=e[o],d=g_(c),u=n[d];if(u)a.push(u.promise);else{let h;c.extensions&&c.extensions[Ze.KHR_DRACO_MESH_COMPRESSION]?h=s(c):h=yh(new Ni,c,t),n[d]={primitive:c,promise:h},a.push(h)}}return Promise.all(a)}loadMesh(e){let t=this,i=this.json,n=this.extensions,s=i.meshes[e],a=s.primitives,o=[];for(let l=0,c=a.length;l<c;l++){let d=a[l].material===void 0?p_(this.cache):this.getDependency("material",a[l].material);o.push(d)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(l){let c=l.slice(0,l.length-1),d=l[l.length-1],u=[];for(let p=0,g=d.length;p<g;p++){let v=d[p],m=a[p],f,M=c[p];if(m.mode===xi.TRIANGLES||m.mode===xi.TRIANGLE_STRIP||m.mode===xi.TRIANGLE_FAN||m.mode===void 0)f=s.isSkinnedMesh===!0?new Po(v,M):new ht(v,M),f.isSkinnedMesh===!0&&f.normalizeSkinWeights(),m.mode===xi.TRIANGLE_STRIP?f.geometry=gh(f.geometry,Ud):m.mode===xi.TRIANGLE_FAN&&(f.geometry=gh(f.geometry,xo));else if(m.mode===xi.LINES)f=new ko(v,M);else if(m.mode===xi.LINE_STRIP)f=new $n(v,M);else if(m.mode===xi.LINE_LOOP)f=new Oo(v,M);else if(m.mode===xi.POINTS)f=new Fo(v,M);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(f.geometry.morphAttributes).length>0&&f_(f,s),f.name=t.createUniqueName(s.name||"mesh_"+e),ar(f,s),m.extensions&&Wr(n,f,m),t.assignFinalMaterial(f),u.push(f)}for(let p=0,g=u.length;p<g;p++)t.associations.set(u[p],{meshes:e,primitives:p});if(u.length===1)return s.extensions&&Wr(n,u[0],s),u[0];let h=new Li;s.extensions&&Wr(n,h,s),t.associations.set(h,{meshes:e});for(let p=0,g=u.length;p<g;p++)h.add(u[p]);return h})}loadCamera(e){let t,i=this.json.cameras[e],n=i[i.type];if(!n){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new Bt(Mp.radToDeg(n.yfov),n.aspectRatio||1,n.znear||1,n.zfar||2e6):i.type==="orthographic"&&(t=new zn(-n.xmag,n.xmag,n.ymag,-n.ymag,n.znear,n.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),ar(t,i),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],i=[];for(let n=0,s=t.joints.length;n<s;n++)i.push(this._loadNodeShallow(t.joints[n]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(n){let s=n.pop(),a=n,o=[],l=[];for(let c=0,d=a.length;c<d;c++){let u=a[c];if(u){o.push(u);let h=new We;s!==null&&h.fromArray(s.array,c*16),l.push(h)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new Io(o,l)})}loadAnimation(e){let t=this.json,i=this,n=t.animations[e],s=n.name?n.name:"animation_"+e,a=[],o=[],l=[],c=[],d=[];for(let u=0,h=n.channels.length;u<h;u++){let p=n.channels[u],g=n.samplers[p.sampler],v=p.target,m=v.node,f=n.parameters!==void 0?n.parameters[g.input]:g.input,M=n.parameters!==void 0?n.parameters[g.output]:g.output;v.node!==void 0&&(a.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",f)),l.push(this.getDependency("accessor",M)),c.push(g),d.push(v))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(d)]).then(function(u){let h=u[0],p=u[1],g=u[2],v=u[3],m=u[4],f=[];for(let M=0,w=h.length;M<w;M++){let _=h[M],D=p[M],A=g[M],R=v[M],T=m[M];if(_===void 0)continue;_.updateMatrix&&_.updateMatrix();let b=i._createAnimationTracks(_,D,A,R,T);if(b)for(let x=0;x<b.length;x++)f.push(b[x])}return new Go(s,void 0,f)})}createNodeMesh(e){let t=this.json,i=this,n=t.nodes[e];return n.mesh===void 0?null:i.getDependency("mesh",n.mesh).then(function(s){let a=i._getNodeRef(i.meshCache,n.mesh,s);return n.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=n.weights.length;l<c;l++)o.morphTargetInfluences[l]=n.weights[l]}),a})}loadNode(e){let t=this.json,i=this,n=t.nodes[e],s=i._loadNodeShallow(e),a=[],o=n.children||[];for(let c=0,d=o.length;c<d;c++)a.push(i.getDependency("node",o[c]));let l=n.skin===void 0?Promise.resolve(null):i.getDependency("skin",n.skin);return Promise.all([s,Promise.all(a),l]).then(function(c){let d=c[0],u=c[1],h=c[2];h!==null&&d.traverse(function(p){p.isSkinnedMesh&&p.bind(h,x_)});for(let p=0,g=u.length;p<g;p++)d.add(u[p]);return d})}_loadNodeShallow(e){let t=this.json,i=this.extensions,n=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let s=t.nodes[e],a=s.name?n.createUniqueName(s.name):"",o=[],l=n._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),s.camera!==void 0&&o.push(n.getDependency("camera",s.camera).then(function(c){return n._getNodeRef(n.cameraCache,s.camera,c)})),n._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let d;if(s.isBone===!0?d=new Ns:c.length>1?d=new Li:c.length===1?d=c[0]:d=new Tt,d!==c[0])for(let u=0,h=c.length;u<h;u++)d.add(c[u]);if(s.name&&(d.userData.name=s.name,d.name=a),ar(d,s),s.extensions&&Wr(i,d,s),s.matrix!==void 0){let u=new We;u.fromArray(s.matrix),d.applyMatrix4(u)}else s.translation!==void 0&&d.position.fromArray(s.translation),s.rotation!==void 0&&d.quaternion.fromArray(s.rotation),s.scale!==void 0&&d.scale.fromArray(s.scale);return n.associations.has(d)||n.associations.set(d,{}),n.associations.get(d).nodes=e,d}),this.nodeCache[e]}loadScene(e){let t=this.extensions,i=this.json.scenes[e],n=this,s=new Li;i.name&&(s.name=n.createUniqueName(i.name)),ar(s,i),i.extensions&&Wr(t,s,i);let a=i.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(n.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let d=0,u=l.length;d<u;d++)s.add(l[d]);let c=d=>{let u=new Map;for(let[h,p]of n.associations)(h instanceof ui||h instanceof Gt)&&u.set(h,p);return d.traverse(h=>{let p=n.associations.get(h);p!=null&&u.set(h,p)}),u};return n.associations=c(s),s})}_createAnimationTracks(e,t,i,n,s){let a=[],o=e.name?e.name:e.uuid,l=[];Rr[s.path]===Rr.weights?e.traverse(function(h){h.morphTargetInfluences&&l.push(h.name?h.name:h.uuid)}):l.push(o);let c;switch(Rr[s.path]){case Rr.weights:c=fr;break;case Rr.rotation:c=gr;break;case Rr.position:case Rr.scale:c=xr;break;default:switch(i.itemSize){case 1:c=fr;break;case 2:case 3:default:c=xr;break}break}let d=n.interpolation!==void 0?h_[n.interpolation]:On,u=this._getArrayFromAccessor(i);for(let h=0,p=l.length;h<p;h++){let g=new c(l[h]+"."+Rr[s.path],t.array,u,d);n.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),a.push(g)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let i=ad(t.constructor),n=new Float32Array(t.length);for(let s=0,a=t.length;s<a;s++)n[s]=t[s]*i;t=n}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(t){let i=this instanceof gr?nd:Zo;return new i(this.times,this.values,this.getValueSize()/3,t)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function __(r,e,t){let i=e.attributes,n=new bi;if(i.POSITION!==void 0){let o=t.json.accessors[i.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(n.set(new z(l[0],l[1],l[2]),new z(c[0],c[1],c[2])),o.normalized){let d=ad(Un[o.componentType]);n.min.multiplyScalar(d),n.max.multiplyScalar(d)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let s=e.targets;if(s!==void 0){let o=new z,l=new z;for(let c=0,d=s.length;c<d;c++){let u=s[c];if(u.POSITION!==void 0){let h=t.json.accessors[u.POSITION],p=h.min,g=h.max;if(p!==void 0&&g!==void 0){if(l.setX(Math.max(Math.abs(p[0]),Math.abs(g[0]))),l.setY(Math.max(Math.abs(p[1]),Math.abs(g[1]))),l.setZ(Math.max(Math.abs(p[2]),Math.abs(g[2]))),h.normalized){let v=ad(Un[h.componentType]);l.multiplyScalar(v)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}n.expandByVector(o)}r.boundingBox=n;let a=new hi;n.getCenter(a.center),a.radius=n.min.distanceTo(n.max)/2,r.boundingSphere=a}function yh(r,e,t){let i=e.attributes,n=[];function s(a,o){return t.getDependency("accessor",a).then(function(l){r.setAttribute(o,l)})}for(let a in i){let o=sd[a]||a.toLowerCase();o in r.attributes||n.push(s(i[a],o))}if(e.indices!==void 0&&!r.index){let a=t.getDependency("accessor",e.indices).then(function(o){r.setIndex(o)});n.push(a)}return et.workingColorSpace!==Yt&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${et.workingColorSpace}" not supported.`),ar(r,e),__(r,e,t),Promise.all(n).then(function(){return e.targets!==void 0?m_(r,e.targets,t):r})}var ld=class extends Us{constructor(){super();let e=new an;e.deleteAttribute("uv");let t=new Ur({side:qt}),i=new Ur,n=new ln(16777215,900,28,2);n.position.set(.418,16.199,.3),this.add(n);let s=new ht(e,t);s.position.set(-.757,13.219,.717),s.scale.set(31.713,28.305,28.591),this.add(s);let a=new ht(e,i);a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),this.add(a);let o=new ht(e,i);o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),this.add(o);let l=new ht(e,i);l.position.set(6.167,.857,7.803),l.rotation.set(0,.561,0),l.scale.set(3.927,6.285,3.687),this.add(l);let c=new ht(e,i);c.position.set(-2.017,.018,6.124),c.rotation.set(0,.333,0),c.scale.set(2.002,4.566,2.064),this.add(c);let d=new ht(e,i);d.position.set(2.291,-.756,-2.621),d.rotation.set(0,-.286,0),d.scale.set(1.546,1.552,1.496),this.add(d);let u=new ht(e,i);u.position.set(-2.193,-.369,-5.547),u.rotation.set(0,.516,0),u.scale.set(3.875,3.487,2.986),this.add(u);let h=new ht(e,Rn(50));h.position.set(-16.116,14.37,8.208),h.scale.set(.1,2.428,2.739),this.add(h);let p=new ht(e,Rn(50));p.position.set(-16.109,18.021,-8.207),p.scale.set(.1,2.425,2.751),this.add(p);let g=new ht(e,Rn(17));g.position.set(14.904,12.198,-1.832),g.scale.set(.15,4.265,6.331),this.add(g);let v=new ht(e,Rn(43));v.position.set(-.462,8.89,14.52),v.scale.set(4.38,5.441,.088),this.add(v);let m=new ht(e,Rn(20));m.position.set(3.235,11.486,-12.541),m.scale.set(2.5,2,.1),this.add(m);let f=new ht(e,Rn(100));f.position.set(0,20,0),f.scale.set(1,.1,1),this.add(f)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function Rn(r){let e=new Ci;return e.color.setScalar(r),e}var y_="/models/adversary-masc.glb",cd=class{constructor(e,t){this.canvas=e,this.ctx=e.getContext("2d"),this.disposed=!1,this.img=new Image,this.loaded=!1,this.level=0,this.speaking=!1,this.nodUntil=0,this.bars=Array(24).fill(0),this.startTime=performance.now(),this.img.src=`/img/figures/${t}.jpg`,this.img.onload=()=>{this.loaded=!0,this.resize()},this.resize=()=>{if(this.disposed)return;let i=Math.min(window.devicePixelRatio||1,2),n=this.canvas.clientWidth||340,s=this.canvas.clientHeight||260;(this.canvas.width!==Math.round(n*i)||this.canvas.height!==Math.round(s*i))&&(this.canvas.width=Math.round(n*i),this.canvas.height=Math.round(s*i))},this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(e),this.loop=()=>{this.disposed||(this.raf=requestAnimationFrame(this.loop),this.update(),this.render())},this.loop()}nod(){this.nodUntil=performance.now()+420}stop(){}dispose(){this.disposed=!0,cancelAnimationFrame(this.raf),this.ro?.disconnect()}update(){let e=Oe.frame();this.speaking=e.speaking,this.level+=((e.speaking?e.level:0)-this.level)*.25;let t=(performance.now()-this.startTime)/1e3,i=this.bars.length;for(let n=0;n<i;n++){let s;if(e.speaking&&e.freq){let a=2+Math.floor(Math.pow(n/i,1.6)*90);s=Math.min(1,e.freq[a]/255*1.25)}else s=.06+Math.sin(t*2+n*.45)*.04;this.bars[n]+=(s-this.bars[n])*.35}}render(){let{ctx:e,canvas:t}=this;if(!e||!this.loaded)return;let i=t.width,n=t.height;e.clearRect(0,0,i,n);let s=this.img.width/this.img.height,a=n*.14,o=n-a*.4,l=o*s;l>i&&(l=i,o=i/s);let c=(i-l)/2,d=Math.max(0,(n-a*.4-o)/2);e.save(),e.filter="blur(22px) brightness(0.32)",e.drawImage(this.img,-i*.1,-n*.1,i*1.2,n*1.2),e.restore();let u=performance.now(),h=1+Math.sin(u*.0016)*.003+this.level*.004,p=u<this.nodUntil?Math.sin((this.nodUntil-u)/420*Math.PI)*.012:0;if(e.save(),e.translate(i/2,n/2),e.scale(h,h),e.rotate(p),e.translate(-i/2,-n/2),e.drawImage(this.img,c,d,l,o),e.restore(),c>4){let A=Math.min(40,c+10),R=e.createLinearGradient(c,0,c+A,0);R.addColorStop(0,"rgba(7,8,11,0.9)"),R.addColorStop(1,"rgba(7,8,11,0)"),e.fillStyle=R,e.fillRect(c-1,0,A,n),R=e.createLinearGradient(c+l-A,0,c+l,0),R.addColorStop(0,"rgba(7,8,11,0)"),R.addColorStop(1,"rgba(7,8,11,0.9)"),e.fillStyle=R,e.fillRect(c+l-A+1,0,A,n)}let g=e.createLinearGradient(0,n*.62,0,n);g.addColorStop(0,"rgba(7,8,11,0)"),g.addColorStop(1,"rgba(7,8,11,0.92)"),e.fillStyle=g,e.fillRect(0,n*.62,i,n*.38);let v=this.bars.length,m=Math.min(i*.6,320*(window.devicePixelRatio||1)),f=m/v,M=Math.max(2,f*.55),w=(i-m)/2,_=n-n*.05,D=a;for(let A=0;A<v;A++){let R=Math.max(.05,this.bars[A])*D;e.fillStyle=this.speaking?`rgba(255,${120+Math.round(this.bars[A]*90)},90,0.95)`:"rgba(148,163,184,0.45)",e.beginPath(),e.roundRect?e.roundRect(w+A*f,_-R,M,R,M/2):e.rect(w+A*f,_-R,M,R),e.fill()}}};function b_(r,e={}){return e.figureId?new cd(r,e.figureId):new dd(r,e.personaVisual||void 0,e)}var dd=class{constructor(e,t=y_,i={}){this.disposed=!1,this.human=null,this.clock=new Ko,this.onError=i.onError,this.loop=()=>{if(this.disposed)return;this.raf=requestAnimationFrame(this.loop);let n=Math.min(this.clock.getDelta(),.05);this.human?.update(n,this.clock.elapsedTime),this.renderer.render(this.scene,this.camera)},this.renderer=new Ro({canvas:e,antialias:!0,alpha:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.setClearColor(0,0),this.renderer.toneMapping=Sd,this.renderer.toneMappingExposure=1.15,this.scene=new Us,this.camera=new Bt(30,1,.1,100),this.root=new Li,this.root.position.y=-.05,this.scene.add(this.root),this.buildLights(),this.ready=c_(l_,Nc,t).then(n=>{if(this.disposed)return n.dispose();this.human=n,this.root.add(n.group),e.dispatchEvent(new CustomEvent("avatar-ready"))}).catch(n=>{console.error("[avatar] failed to load model",t,n),this.onError?.(n)}),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(e),this.resize(),this.loop()}buildLights(){this.scene.add(new Xo(2303803,.75));let e=new Vs(16774634,2.8);e.position.set(2.2,3,3.6),this.scene.add(e);let t=new ln(9353445,40,25,1.4);t.position.set(-2.8,1.8,2.2),this.scene.add(t);let i=new ln(16316668,30,22,3.2);i.position.set(0,3.5,-2.8),this.scene.add(i);try{let n=new Vn(this.renderer);this.scene.environment=n.fromScene(new ld,.04).texture,n.dispose()}catch{}}nod(){this.human?.nod()}stop(){}dispose(){this.disposed=!0,cancelAnimationFrame(this.raf),this.ro?.disconnect(),this.human?.dispose(),this.human=null,this.renderer.dispose(),this.renderer.forceContextLoss?.()}resize(){let e=this.renderer.domElement,t=e.clientWidth||1,i=e.clientHeight||1;this.renderer.setSize(t,i,!1),this.camera.aspect=t/i;let n=t/i<1,s=n?3.4:2.9,a=n?-.14:-.04;this.camera.position.set(0,a+.06,s),this.camera.lookAt(0,a,0),this.camera.updateProjectionMatrix()}};function Be(r){return String(r??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Wn(r){return r==null?"\u2014":Number(r).toFixed(1).replace(/\.0$/,"")}function Ir({title:r,body:e="",actions:t=[]}){return new Promise(i=>{let n=document.activeElement,s=document.createElement("div");s.className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 pb-[calc(1rem+var(--safe-bottom))] backdrop-blur-sm animate-fade-in sm:items-center",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.setAttribute("aria-labelledby","ui-modal-title"),s.innerHTML=`<div class="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-ink-700 bg-ink-900 p-5 shadow-2xl animate-pop-in sm:p-6">
      <h3 id="ui-modal-title" class="text-display-sm text-white">${Be(r)}</h3>
      ${e?`<p class="mt-2 text-sm leading-relaxed text-slate-400">${e}</p>`:""}
      <div class="mt-5 flex flex-col gap-2.5 sm:mt-6">${t.map((c,d)=>`<button type="button" data-idx="${d}" class="${c.kind==="primary"?"btn-primary":c.kind==="danger"?"btn-danger":"btn-ghost"} w-full ${c.hint?"flex-col items-start gap-0.5 px-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5":"justify-center"} py-3"><span>${Be(c.label)}</span>${c.hint?`<span class="shrink-0 whitespace-nowrap text-xs font-medium opacity-70">${Be(c.hint)}</span>`:""}</button>`).join("")}</div></div>`;let a=c=>{document.removeEventListener("keydown",o),s.remove(),n?.isConnected&&n!==document.body&&!n.matches("textarea,input,[contenteditable]")&&n.focus({preventScroll:!0}),i(c)},o=c=>{if(c.key==="Escape")return a(null);if(c.key!=="Tab")return;let d=[...s.querySelectorAll("button")],u=d.indexOf(document.activeElement);(u<0||(c.shiftKey?u===0:u===d.length-1))&&(c.preventDefault(),d[c.shiftKey?d.length-1:0]?.focus())};document.addEventListener("keydown",o),s.addEventListener("click",c=>{if(c.target===s)return a(null);let d=c.target.closest("[data-idx]");d&&a(t[Number(d.dataset.idx)].value)}),document.body.appendChild(s);let l=[...s.querySelectorAll("button")];(l.find(c=>c.classList.contains("btn-primary"))||l.find(c=>!c.classList.contains("btn-danger"))||l[0])?.focus()})}var S_=new Set(["debate","historical"]),Bp={round:"Round",question:"Question",exchange:"Exchange",bars:"Round"};async function Hp(r,e){r.innerHTML='<div class="mx-auto max-w-6xl px-4 py-6" id="session-root"><div class="py-16 text-center text-slate-500"><span class="spinner mr-2 align-[-3px]"></span>Loading your session\u2026</div></div>';let t=r.querySelector("#session-root"),i=await w_(e);if(t.isConnected){if(!i||i.error){let n=i?.error instanceof Lt?i.error.status:0;!i||n===404?t.innerHTML='<div class="py-16 text-center text-slate-400"><h1 class="mb-3 text-display-md text-white">Session not found</h1><p class="mb-6 text-sm">That session doesn\u2019t exist or was deleted.</p><a href="#/" class="btn-primary">Back to practice</a></div>':n===401?(Ws(null),location.hash=`#/login?next=${encodeURIComponent("/session/"+e)}`):t.replaceChildren(jn("Couldn\u2019t load your session. Check your connection and try again.",()=>Hp(r,e)));return}M_(t,e,i.meta,i.data)}}async function w_(r){let e=null;try{let c=sessionStorage.getItem(`adversaryai:session:${r}`);c&&(e=JSON.parse(c))}catch{}let t;try{t=await It(`/api/debates/${encodeURIComponent(r)}`)}catch(c){return console.error("Failed to load session",c),{error:c}}let i=t.debate;if(!i)return null;let n=i.setup&&typeof i.setup=="object"?i.setup:(()=>{try{return JSON.parse(i.setup_json||"{}")}catch{return{}}})(),s=null;try{s=(await qn()).find(c=>c.id===i.mode)||null}catch{}let a=n.figureId||(i.mode==="historical"?i.personality:void 0),o=e?.personaVisual||Dh(n.personaVisual).model;return{meta:{modeId:i.mode||"debate",modeName:s?.name||e?.modeName||"Session",topic:i.topic,personaLabel:e?.personaLabel||i.personaLabel||s?.name||"Opponent",judgeEnabled:n.judge==="1",personaVisual:o,targetRounds:parseInt(n.targetRounds||"0",10)||0,resolvedFirstSpeaker:n.resolvedFirstSpeaker||"user",debateStyle:n.debateStyle||null,userSide:n.userSide||null,figureId:a||void 0,ended:!!i.ended_at,difficulty:n.difficulty||null,actingScript:i.mode==="acting"&&n.actingMode==="script"&&n.script?{script:n.script,role:n.scriptRole}:null},data:t}}function M_(r,e,t,i){let n=_d(t.modeId),s=Bp[n.unit]||"Round",a=S_.has(t.modeId),o=t.targetRounds||0;t.topic&&(document.title=`${t.topic} \xB7 AdversaryAI`),r.className="mx-auto w-full max-w-6xl px-4",r.innerHTML=`
    <div class="session-shell" id="session-shell">
      <aside class="session-aside shrink-0 pt-2 lg:pt-6">
        <div class="mb-2.5 hidden items-center justify-between gap-3 lg:flex">
          <div class="min-w-0">
            <p class="eyebrow truncate !tracking-[0.14em]">${Be(t.modeName)}</p>
            <h2 class="truncate text-lg font-bold leading-tight text-white">${Be(t.personaLabel)}</h2>
          </div>
          <span id="round-badge" class="badge border-accent-500/30 bg-accent-500/10 text-accent-300"></span>
        </div>
        <div class="avatar-stage-wrap session-stage border border-ink-700 shadow-card">
          <canvas id="avatar-canvas" class="avatar-canvas" aria-label="${Be(t.personaLabel)}"></canvas>
          <div id="avatar-loading" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500 ${t.figureId?"hidden":""}"><span class="spinner mr-2"></span>Loading ${Be(t.personaLabel)}\u2026</div>
          <div class="stage-tl">
            ${a?'<span id="phase-badge" class="badge absolute left-3 top-3 border-white/10 bg-black/60 text-slate-200 backdrop-blur"></span>':""}
            <span id="round-badge-m" class="badge border-white/10 bg-black/60 text-slate-200 backdrop-blur lg:hidden"></span>
            <span id="status-pill" class="badge absolute bottom-3 left-3 border-white/10 bg-black/60 text-slate-200 backdrop-blur"><span id="status-dot" class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span><span id="status-text">Ready</span></span>
            <span id="photo-badge" class="absolute right-3 top-3 hidden"></span>
          </div>
        </div>
        <div class="session-controls mt-2.5 flex items-center gap-2">
          <span class="stage-name flex min-w-0 flex-1 lg:hidden" aria-hidden="true"><span class="badge min-w-0 shrink"><span class="truncate">${Be(t.personaLabel)}</span></span></span>
          <button id="replay-btn" type="button" class="btn-ghost btn-sm h-11 w-11 px-0 sm:w-auto sm:px-3 lg:h-auto" disabled aria-label="Replay last reply">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg><span class="hidden sm:inline">Replay</span></button>
          <button id="stop-btn" type="button" class="btn-ghost btn-sm h-11 w-11 px-0 sm:w-auto sm:px-3 lg:h-auto" disabled aria-label="Stop audio">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg><span class="hidden sm:inline">Stop</span></button>
          ${t.actingScript?'<button id="cue-btn" type="button" class="btn-ghost btn-sm h-11 whitespace-nowrap lg:h-auto" title="Show your next line" aria-label="Show your next line">Line?</button>':""}
          <button id="view-btn" type="button" class="btn-ghost btn-sm hidden h-11 whitespace-nowrap lg:h-auto" title="Owner: switch between video and 3D"></button>
          <button id="end-btn" type="button" class="btn-danger btn-sm ml-auto h-11 shrink-0 whitespace-nowrap lg:h-auto">End &amp; grade</button>
        </div>
        <div id="upsell-slot" class="hidden"></div>
        <div id="photo-debug" class="mt-2.5 hidden rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs leading-relaxed text-amber-200 break-words"></div>
      </aside>

      <section class="flex min-h-0 min-w-0 flex-1 flex-col pt-2 lg:pt-6">
        <div class="session-topic mb-1.5 shrink-0 sm:mb-2">
          <h1 id="session-topic" class="text-[15px] font-bold leading-snug text-white line-clamp-1 max-sm:cursor-pointer sm:text-lg sm:line-clamp-2 lg:text-xl" title="${Be(t.topic||"")}">${Be(t.topic||"Live session")}</h1>
          <div class="mt-1 flex flex-nowrap items-center gap-1.5 overflow-hidden sm:mt-1.5 sm:flex-wrap" id="meta-badges">
            ${t.debateStyle&&a?`<span class="meta-extra badge hidden border-ink-700 bg-ink-900 text-slate-400 sm:inline-flex">${Be((Uh.find(I=>I.v===t.debateStyle)||{}).t||t.debateStyle)}</span>`:""}
            ${t.userSide&&t.userSide!=="open"?`<span class="badge border-ink-700 bg-ink-900 text-slate-400">You argue ${t.userSide==="for"?"FOR":"AGAINST"}</span>`:""}
            ${t.difficulty?`<span class="meta-extra badge hidden border-ink-700 bg-ink-900 text-slate-400 sm:inline-flex">${Em[t.difficulty]||""}</span>`:""}
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
            <button id="mic-btn" type="button" class="icon-btn hidden h-11 w-11 [&>svg]:h-5 [&>svg]:w-5" aria-label="Speak your reply" title="Speak your reply">${Qe.mic}</button>
            <button id="send-btn" type="button" class="btn-primary h-11 shrink-0 px-4" aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg><span class="hidden sm:inline">Send</span></button>
          </div>
          <div class="composer-foot">
            <p id="mic-hint" class="mt-2 hidden text-xs text-slate-400"></p>
            <button id="hf-btn" type="button" class="mt-1.5 hidden text-xs text-slate-400 hover:text-slate-200" title="Mic turns on when it's your turn and sends when you pause"></button>
          </div>
        </div>
      </section>
    </div>`;let l=I=>r.querySelector(I),c=l("#transcript"),d=l("#msg-input"),u=l("#send-btn"),h=l("#mic-btn"),p=l("#mic-hint"),g=l("#replay-btn"),v=l("#stop-btn"),m=l("#end-btn"),f=l("#quota-slot"),M=l("#banner-slot"),w=l("#sr-live"),_=l("#jump-btn");l("#session-topic").addEventListener("click",I=>I.currentTarget.classList.toggle("line-clamp-1"));let D;try{D=b_(l("#avatar-canvas"),{figureId:t.figureId,personaVisual:t.personaVisual,onError:()=>{let I=l("#avatar-loading");I&&(I.innerHTML="Avatar unavailable \u2014 voice and text still work.")}})}catch(I){console.warn("[avatar] unavailable:",I?.message||I),D={dispose(){}};let J=l("#avatar-loading");J&&(J.innerHTML="Avatar unavailable on this device \u2014 voice and text still work.")}l("#avatar-canvas").addEventListener("avatar-ready",()=>l("#avatar-loading")?.classList.add("hidden"),{once:!0}),ea();let A=null,R,T=Promise.race([new Promise(I=>R=I),new Promise(I=>setTimeout(I,8e3))]),b=l("#photo-badge"),x=l("#photo-debug"),C=(I,J="")=>{b.className=`absolute right-3 top-3 max-w-[calc(100%-24px)] ${I?"":"hidden"}`,b.innerHTML=I?`<span class="badge inline-block max-w-full truncate whitespace-nowrap border-white/10 bg-black/60 backdrop-blur ${J}">${I}</span>`:""},U=I=>{if(x){if(!I){x.classList.add("hidden"),x.textContent="";return}x.textContent=`Photoreal error (owner only): ${I}`,x.classList.remove("hidden")}},V=I=>`${Math.max(0,Math.floor((I||0)/60))} min left`,G=l("#avatar-canvas").parentElement,P="aai_photoreal_hint",L=I=>{try{if(I===void 0)return localStorage.getItem(P)==="1";I?localStorage.setItem(P,"1"):localStorage.removeItem(P)}catch{return!1}};!t.figureId&&L()&&G.classList.add("photoreal-probe");let H=I=>{G.classList.remove("photoreal-probe"),G.classList.add("photoreal-mode");let J=G.querySelector(".photoreal-poster");J||(J=document.createElement("div"),J.className="photoreal-poster",G.prepend(J)),J.innerHTML=`${I?`<img src="${Be(I)}" alt="" />`:""}<span class="photoreal-poster-msg"><span data-spin class="spinner !h-3.5 !w-3.5"></span><span data-msg>Connecting to your opponent\u2026</span></span>`},F=(I,J=!1)=>{let Y=G.querySelector(".photoreal-poster-msg");Y&&(Y.style.display=I?"":"none",Y.querySelector("[data-msg]").textContent=I||"",Y.querySelector("[data-spin]").style.display=J?"":"none")},K=()=>{G.classList.remove("photoreal-probe","photoreal-mode"),G.querySelector(".photoreal-poster")?.remove()};(async()=>{let I=await $s().catch(()=>null);if(!re||!I?.photoreal||t.figureId||$)return K(),R();if(I.isOwner){let Y="aai_owner_view",ae="video";try{ae=localStorage.getItem(Y)||"video"}catch{}let Ce=l("#view-btn");if(Ce.textContent=ae==="3d"?"Show video":"Show 3D",Ce.classList.remove("hidden"),Ce.onclick=()=>{try{localStorage.setItem(Y,ae==="3d"?"video":"3d")}catch{}location.reload()},ae==="3d")return K(),C("3D view (owner)","text-slate-300"),R()}if(!I.champion){K(),L(!1),R();let Y=l("#upsell-slot");Y.className="mt-2.5 hidden lg:block",Y.innerHTML='<a href="#/account?plans=1" class="flex items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-3.5 py-2.5 text-xs text-amber-100 transition-colors hover:border-amber-400/50"><span><span class="font-semibold text-amber-300">\u2726 Champion</span> \u2014 face a photoreal opponent on video</span><span aria-hidden="true">\u2192</span></a>';return}let J=await iu(e);if(!re||!J?.enabled||!J.eligible)return K(),J?.owner&&J.outOfCredits&&U("LiveAvatar is out of credits \u2014 video is paused for everyone (3D) until you add credits at liveavatar.com. Rechecks every 15 min."),J&&!J.eligible&&L(!1),R();if(!J.mapped){K(),R(),J.owner&&C("Photoreal: no avatar for this opponent","text-slate-300");return}if(J.remainingSeconds<60)return K(),R(),C("Video minutes used this month","text-slate-300");L(!0),H(J.avatarImage),A=new ia({stage:G,debateId:e,onStatus:Y=>{re&&(Y.state!=="connecting"&&R(),Y.state!=="error"&&U(null),Y.state==="connecting"?(C(""),F("Connecting to your opponent\u2026",!0)):Y.state==="live"?(F(""),C(`<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>Photoreal \xB7 ${V(Y.remainingSeconds)}`,"text-amber-200")):Y.state==="needs_tap"?(F("Tap to start the video"),C("")):Y.state==="sleeping"||Y.state==="off"?(F("Video resumes when you reply"),C("")):Y.state==="error"?(K(),Y.error==="video_minutes_exhausted"?C("Video minutes used this month","text-slate-300"):(C("Photoreal unavailable \u2014 using 3D","text-slate-300"),U(J.owner&&(Y.detail||Y.error)||null))):C(""))}}),$||A.start()})();let ne=[],ce=0,fe=!1,re=!0,$=!!t.ended,ie=!1,ve=!1,me=null,xe=null,Re=0,Ue=null,qe=!1,He=0,rt=!1,B=!1,yt=!1,ze=!1,je=!1,we=!1,lt=0,Me=null,E=()=>rt||yt||je||we,y=()=>{Me?.remove(),Me=null},W=()=>{Me||!re||(Me=document.createElement("button"),Me.type="button",Me.className="absolute inset-0 z-[3] flex items-center justify-center bg-black/55 text-white",Me.innerHTML='<span class="rounded-full border border-white/20 bg-black/60 px-5 py-3 text-sm font-semibold backdrop-blur">\u25B6 Tap to keep listening</span>',Me.addEventListener("click",()=>{Oe.unlock(),y()}),G.appendChild(Me))},Q=Oe.onBlocked(I=>I?W():y()),te=null,Z=!1,Te=0,he=async()=>{if(clearTimeout(Te),Te=setTimeout(()=>{te?.release().catch(()=>{}),te=null},5*6e4),!(!("wakeLock"in navigator)||te||Z||!re||$||document.visibilityState!=="visible")){Z=!0;try{let I=await navigator.wakeLock.request("screen");if(!re||$)return void I.release().catch(()=>{});te=I,I.addEventListener("release",()=>te===I&&(te=null))}catch{}finally{Z=!1}}},ye=()=>{if(re){if(document.visibilityState!=="visible"){clearTimeout(zt),qe&&window.matchMedia("(pointer: coarse)").matches&&Ne();return}lt=performance.now(),he(),Oe.state==="idle"&&St()}};document.addEventListener("visibilitychange",ye);let tt=Oe.on(I=>{I==="idle"&&y(),kt()}),oe=()=>{if(re){re=!1;try{me?.abort()}catch{}xe?.cancel(),Oe.stop();try{Ue?.abort()}catch{}tt(),Q(),Or?.(),clearTimeout(zt),document.removeEventListener("visibilitychange",ye),y(),clearTimeout(Te),te?.release().catch(()=>{}),te=null,A?.dispose(),Oe.reset(),D.dispose(),window.removeEventListener("hashchange",oe),window.__sessionCleanup===oe&&(window.__sessionCleanup=null)}};window.__sessionCleanup?.(),window.__sessionCleanup=oe,window.addEventListener("hashchange",oe),Oe.reset();let be=/\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|a+s+s+(h+o+l+e+)?|d+a+m+n+|d+i+c+k+|p+u+s+s+y+|c+u+n+t+|w+h+o+r+e+|s+l+u+t+|n+i+g+g+[aeiou]+|f+a+g+(g+o+t+)?|t+i+t+s+|b+o+o+b+s?|p+e+n+i+s+|v+a+g+i+n+a+|c+l+i+t+|o+r+g+a+s+m+|m+a+s+t+u+r+b+a+t+e+|p+o+r+n+|h+e+n+t+a+i+|r+a+p+i+s+t+|m+o+l+e+s+t+)\b/gi,De=I=>t.modeId==="rapbattle"?I.replace(be,"****"):I,Le=t.actingScript?Nh(dc(t.actingScript.script),t.actingScript.role):null,_e=()=>r.querySelector("#cue-box"),Xe=()=>_e()?.classList.add("hidden");r.querySelector("#cue-btn")?.addEventListener("click",()=>{let I=_e();if(!I)return;if(!I.classList.contains("hidden"))return Xe();let J=Le?.[ce];I.innerHTML=J?`<span class="text-[11px] font-semibold uppercase tracking-wide text-accent-400">Your line</span><br>${Be(J)}`:"That\u2019s the end of your lines \u2014 tap End &amp; grade for your notes.",I.classList.remove("hidden")});function Ve(I,J,Y){if(!Le||!I||!Le[Y])return;let ae=Im(Le[Y],J),Ce=ae>=90,bt=document.createElement("div");bt.className=`mt-2 border-t border-white/10 pt-2 text-xs ${Ce?"text-emerald-300":"text-amber-300"}`,bt.textContent=Ce?`\u2713 ${ae}% on script`:`${ae}% on script \u2014 the line was: \u201C${Le[Y]}\u201D`,I.row.firstElementChild.appendChild(bt)}let pt=window.matchMedia("(max-width: 1023px)"),N=!0,le=null,X=-1,ee=null;function ue(I){if(I&&(N=!0),!N)return void(_.hidden=!1);let J=c.scrollHeight-c.clientHeight,Y=le?.isConnected?Math.min(J,le.offsetTop-8):J;c.scrollTop=Y,X=c.scrollTop,_.hidden=Y>=J-1}c.addEventListener("scroll",()=>{Math.abs(c.scrollTop-X)<2||(X=-1,N=c.scrollHeight-c.scrollTop-c.clientHeight<40,N&&(_.hidden=!0,le&&c.scrollTop>le.offsetTop+32&&(le=null)))},{passive:!0}),_.addEventListener("click",()=>{le=null,ue(!0)}),new ResizeObserver(()=>N&&ue(!1)).observe(c);let de={msg:"",at:0};function Ye(I){I=String(I||"").trim(),!(!I||I===de.msg&&Date.now()-de.at<4e3)&&(de={msg:I,at:Date.now()},w.textContent="",requestAnimationFrame(()=>w.textContent=I))}function _t(I){let J=I?.row;!J?.isConnected||J.dataset.said||(J.dataset.said="1",J.firstElementChild?.removeAttribute("aria-busy"),Ye(`${t.personaLabel}: ${I.textEl.textContent}`))}let Dt=l("#session-shell");d.addEventListener("focus",()=>Dt.classList.add("kb")),d.addEventListener("blur",()=>Dt.classList.remove("kb"));function Ke(I,J){ne.push({role:I,text:J});let Y=document.createElement("div"),ae=I==="you",Ce=!ae&&!J;Y.className=`flex ${ae?"justify-end":"justify-start"} animate-fade-up`,Y.innerHTML=`<div class="t-bubble max-w-[92%] rounded-2xl px-3.5 py-2.5 text-base leading-relaxed sm:max-w-[80%] sm:px-4 sm:py-3 sm:text-[15px] ${ae?"rounded-br-md border border-accent-500/30 bg-accent-500/10 text-slate-100":"rounded-bl-md border border-ink-700 bg-ink-800 text-slate-100"}"${Ce?' aria-busy="true"':""}>
      <div class="mb-1 text-xs font-semibold uppercase tracking-wide ${ae?"bubble-you text-accent-400":"text-slate-400"}">${ae?"You":Be(t.personaLabel)}</div>
      <div class="whitespace-pre-wrap break-words" data-text>${Be(J)}</div></div>`,c.appendChild(Y),ee?.remove(),ee=null,le=Ce&&pt.matches?Y:null,ue(!0);let bt=Y.querySelector("[data-text]");return Ce&&ni(Y,bt),{row:Y,textEl:bt,entry:ne[ne.length-1]}}function ni(I,J){let Y=0,ae=new MutationObserver(()=>{clearTimeout(Y),Y=setTimeout(Ce,800)}),Ce=()=>{if(!re||!I.isConnected||I.dataset.said)return ae.disconnect();if(fe)return void(Y=setTimeout(Ce,400));ae.disconnect(),_t({row:I,textEl:J})};ae.observe(J,{childList:!0,characterData:!0,subtree:!0})}function fi(){let I=document.createElement("div");return I.className="flex justify-start",I.innerHTML=`<div class="flex gap-1.5 rounded-2xl rounded-bl-md border border-ink-700 bg-ink-800 px-4 py-3.5" aria-label="${Be(t.personaLabel)} is thinking"><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span><span class="typing-dot h-2 w-2 rounded-full bg-slate-400"></span></div>`,c.appendChild(I),le=null,ue(!0),I}function si(I,J="muted"){let Y=document.createElement("p");Y.className=`text-center text-sm ${J==="error"?"text-red-300":"text-slate-500"}`,Y.textContent=I;let ae=c.lastElementChild;if(ae?.tagName==="P"&&ae.textContent===I&&ae.remove(),J==="error"){ee?.remove(),ee=Y,le=null;for(let Ce of c.querySelectorAll("[aria-busy]"))Ce.removeAttribute("aria-busy"),Ce.parentElement.dataset.said="1"}return c.appendChild(Y),Ye(I),ue(!0),Y}function Kn(){return fe?Math.max(1,ce):ce+1}function Oi(I){return ie||o&&I>=o?{label:"Closing",cls:"text-purple-200"}:I<=1?{label:"Opening",cls:"text-sky-200"}:{label:"Rebuttal",cls:"text-rose-200"}}function Fi(){let I=Math.min(Kn(),o||1/0);l("#round-badge").textContent=l("#round-badge-m").textContent=o?`${s} ${I} of ${o}`:`${s} ${I}`;let J=l("#phase-badge");if(J){let ae=Oi(I);J.className=`badge absolute left-3 top-3 border-white/10 bg-black/60 backdrop-blur ${ae.cls}`,J.textContent=ae.label}let Y;if($)Y="This session is finished.";else if(rt)Y="Your opponent opens first\u2026";else if(a){let ae=Oi(Kn()).label;Y=ae==="Opening"?"Your opening statement\u2026":ae==="Closing"?"Your closing argument\u2026":"Your rebuttal\u2026"}else t.modeId==="interview"||t.modeId==="thesis"||t.modeId==="expert"?Y="Your answer\u2026":t.modeId==="rapbattle"?Y="Drop your bars\u2026":t.actingScript?Y=Le&&ce>=Le.length?"End of scene \u2014 tap End & grade":"Your line\u2026":Y=ne.length?"Your reply\u2026":"Say something to begin\u2026";d.placeholder=Y}function kt(){if(!re)return;let I=Oe.state==="speaking",J=l("#status-dot"),Y=l("#status-text");qe?(J.className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse",Y.textContent="Listening to you"):I?(J.className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse",Y.textContent="Speaking"):fe?(J.className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse",Y.textContent="Thinking"):$?(J.className="h-1.5 w-1.5 rounded-full bg-slate-500",Y.textContent="Finished"):yt||rt?(J.className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse",Y.textContent=yt?"Waiting for reply":B?"Tap to hear your opponent":"Opponent is about to open\u2026"):(J.className="h-1.5 w-1.5 rounded-full bg-emerald-400",Y.textContent="Your turn"),v.disabled=!I,g.disabled=I||fe||!Oe.hasReplay(),u.disabled=fe||$||ve||rt||yt||we,m.disabled=fe&&!$||we}function Ki(){d.style.height="auto",d.style.height=Math.min(160,d.scrollHeight)+"px"}d.addEventListener("input",()=>{if(Ki(),A?.touch(),d.value.length>=4e3&&!qe){let I="That\u2019s the 4,000-character limit \u2014 anything past it was left out.";p.textContent=I,p.className="mt-2 text-xs text-amber-300",setTimeout(()=>p.textContent===I&&p.classList.add("hidden"),6e3)}});function yr(){!o||ce<o||$||M.firstChild||(M.innerHTML=`<div class="target-banner mb-2 flex items-center justify-between gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-3 py-1.5 sm:mb-3 sm:gap-3 sm:rounded-2xl sm:p-4">
      <p class="min-w-0 text-xs leading-snug text-slate-200 sm:text-sm"><span class="tb-short sm:hidden"><span class="font-semibold text-white">Final ${s.toLowerCase()} done.</span> Extra ${s.toLowerCase()}s use a credit.</span><span class="tb-long hidden sm:inline"><span class="font-semibold text-white">That was the final ${s.toLowerCase()}.</span> Get your scorecard now \u2014 or keep going (each extra ${s.toLowerCase()} uses a credit).</span></p>
      <button type="button" class="btn-primary btn-xs shrink-0 sm:btn-sm" id="banner-score">Get my scorecard</button></div>`,l("#banner-score").onclick=()=>se(!0))}function kr(I){let J=l("#wallet-badge");typeof I=="number"&&I>=0&&I<=25?(J.classList.remove("hidden"),J.textContent=`${I} credit${I===1?"":"s"} left`):J.classList.add("hidden")}let Si=!1;async function br(I,J=0,Y=""){if(!I.active||!re)return I.end();Si=!0;try{let ae=await fetch("/api/speech/turn-audio",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:e,offset:J,anchor:Y})});if(!ae.ok)throw new Error("http "+ae.status);let Ce=await ae.arrayBuffer();if(!I.active||!re||!Ce.byteLength)return;await I.enqueue(Ce,null)}catch(ae){console.warn("[voice] server audio unavailable",ae),re&&I.active&&si("Voice unavailable for this reply \u2014 text only.")}finally{Si=!1,I.end()}}let cn=I=>new Promise(J=>setTimeout(J,I)),Xs=[],Zi=I=>{let J=si(I,"error");return Xs.push(J),J},Ys=()=>Xs.splice(0).forEach(I=>I.remove());function S(I,J,Y){let ae=Zi(I),Ce=document.createElement("button");return Ce.type="button",Ce.className="btn-ghost btn-xs ml-2 align-middle",Ce.textContent=J,Ce.addEventListener("click",()=>{fe||yt||we||!re||$||(ae.remove(),Y())}),ae.append(" ",Ce),ae}let O=I=>S(I,"Retry opening",()=>j({open:!0}));async function q(I,J,Y=[1500,2500,4e3,6e3,8e3,1e4,1e4]){let ae=!1;for(let Ce of Y){if(await cn(Ce),!re||$||we)return null;let bt;try{bt=await It(`/api/debates/${encodeURIComponent(e)}`)}catch{continue}if(ae=!0,!re||$||we)return null;let Kt=bt.turns??[],at=Et=>Kt.slice(Et).find(oi=>oi.role!=="user"),Je;if(I==null)Je=at(0);else{let Et=Kt.filter(wt=>wt.role==="user"),oi=Et.at(-1);if(!oi||Et.length<J||String(oi.text??"").trim()!==I)return{state:"gone"};Je=at(Kt.indexOf(oi)+1)}if(Je)return{state:"reply",text:String(Je.text??""),remaining:bt.remainingRounds}}return{state:ae?"pending":"offline"}}async function j({open:I=!1,closing:J=!1}={}){let Y=d.value.trim();if(fe||$||ve||we||yt||!I&&(!Y||rt))return;if(!I&&Y.length>4e3)return void Zi(`That\u2019s ${Y.length.toLocaleString()} characters \u2014 keep it under 4,000 and send again.`);Oe.unlock(),Ne(),A?.touch(),he(),xe?.cancel(),xe=null,Oe.stop(),fe=!0,ze=!1;let ae=++Re;He=0;let Ce=null;I||(d.value="",Ki(),Ce=Ke("you",Y),Ve(Ce,Y,ce),Xe(),ce++,M.querySelector(".target-banner")&&M.replaceChildren());let bt=ce,Kt=()=>{if(!Ce)return;Ce.row.remove();let Pe=ne.indexOf(Ce.entry);Pe>=0&&ne.splice(Pe,1),ce=Math.max(0,ce-1),Ce=null,d.value||(d.value=Y,Ki())};Fi(),kt();let at=fi(),Je=null,Et="",oi=0,wt=null,dn=!1,Hi=null,un=!1,Ks="",Zs=!1,Js=!1,Vd=!1,Gd=!Jd(),ul=new AbortController;me=ul,lt=performance.now();let Gp=setInterval(()=>{ae!==Re||!re||document.hidden||performance.now()-lt>(Vd?3e4:45e3)&&(Js=!0,ul.abort())},2e3),hl=Pe=>{let Mt=performance.now();Je||(at.remove(),Je=Ke("opp","")),(Pe||Mt-oi>50)&&(Je.textEl.textContent=Et,Je.entry.text=Et,oi=Mt,ue(!1))},$d=()=>{if(!Je)return;Je.row.remove();let Pe=ne.indexOf(Je.entry);Pe>=0&&ne.splice(Pe,1),Je=null},$p=Pe=>{if(!(ae!==Re||!re))if(Pe.t==="hello")Gd&&Pe.ttsVoice&&He!==ae&&(xe=eu({voiceCfg:{voice:Pe.ttsVoice,hd:!!Pe.ttsHd,style:Pe.ttsStyle,styleDegree:Pe.ttsStyleDegree},transform:t.actingScript?Mt=>De(Mt).replace(/(^|\n)\s*[\p{Lu}][\p{Lu} .'\-]{0,30}:\s*/gu,"$1"):De,onFallback:(Mt,Zt,Ji)=>{wt={offset:Mt,utter:Zt,anchor:Ji},Hi?br(Zt,Mt,Ji):dn&&Zt.end()}}));else if(Pe.t==="tok")Et+=Pe.c??"",hl(!1),xe?.push(Pe.c??"");else if(Pe.t==="done")if(Hi=Pe,hl(!0),typeof Pe.text=="string"&&Pe.text.trim()&&(Et=Pe.text,Je.textEl.textContent=Et,Je.entry.text=Et),_t(Je),kr(Pe.remainingRounds),Ys(),He===ae)xe?.cancel();else if(xe)xe.finish({dropTail:!!Pe.truncated}),wt&&(Pe.truncated&&wt.offset>=Et.length?wt.utter.end():br(wt.utter,wt.offset,wt.anchor));else if(Pe.audioBase64){let Mt=Oe.begin(),Zt=Uint8Array.from(atob(Pe.audioBase64),Ji=>Ji.charCodeAt(0));Mt.enqueue(Zt.buffer,null).finally(()=>Mt.end())}else Pe.audioFailed?si("Voice unavailable for this reply \u2014 text only."):br(Oe.begin(),0,"");else Pe.t==="err"&&(un=Zs=!0,Ks=Pe.message||"",at.remove(),$d())},gi=null,pl="",Wp=()=>{if(!Je||Je.row.querySelector("[data-cut]"))return;let Pe=document.createElement("div");Pe.dataset.cut="",Pe.className="mt-2 border-t border-white/10 pt-2 text-xs text-amber-300",Pe.textContent="Reply cut off",Je.row.firstElementChild.appendChild(Pe)},jp=async()=>{if(He===ae||!re)return void wt?.utter.end();Si=!0;let Pe=Date.now();for(;gi&&re&&gi.utter.active&&(gi.pending()||Oe.state==="speaking"&&!gi.failed)&&Date.now()-Pe<9e4;)await cn(200);if(Si=!1,He===ae||!re||ae!==Re)return void wt?.utter.end();if(wt)return br(wt.utter,wt.offset,wt.anchor);let Mt=gi?Math.max(0,gi.offset-(pl.length-pl.trimStart().length)):0;Mt<Et.trimEnd().length&&br(Oe.begin(),Mt,Mt?Et.slice(Mt,Mt+40):"")},Wd=async Pe=>{yt=!0,kt();let Mt=si(Js?`${t.personaLabel} went quiet \u2014 checking with the server\u2026`:Je?"The connection dropped mid-reply \u2014 getting the rest\u2026":I?"The connection dropped \u2014 checking on your opponent\u2026":"The connection dropped \u2014 checking whether your message went through\u2026"),Zt=await q(I?null:Y,bt,Pe);if(Mt.remove(),yt=!1,!Zt||ae!==Re||!re)return dn=!0,gi?.failed&&wt?.utter.end(),!1;if(Zt.state==="reply")return dn=!1,Je||(Je=Ke("opp","")),Je.row.querySelector("[data-cut]")?.remove(),Et=Zt.text,Je.textEl.textContent=Et,Je.entry.text=Et,ue(!1),kr(Zt.remaining),Ys(),ze=!1,I&&(rt=!1),jp(),!0;if(ze=!0,Zt.state==="gone"||I)return gi?.cancel(),xe===gi&&(xe=null),Oe.stop(),$d(),I?O("Your opponent couldn\u2019t start \u2014 the connection dropped."):(Kt(),Zi(`The connection dropped before ${t.personaLabel} could answer \u2014 your message is back in the box. Tap Send to try again.`)),!1;dn=!0,gi?.failed&&wt?.utter.end(),Wp();let Ji=async()=>{if(ae!==Re)return;let Qi=await Wd([0,2e3,4e3]);re&&ae===Re&&jd(Qi)},hn=Zt.state==="offline",zi=S(hn?"Couldn\u2019t reach the server \u2014 check your connection, then try again.":`${t.personaLabel}\u2019s reply didn\u2019t come through.`,"Check again",Ji);return hn&&window.addEventListener("online",()=>zi.isConnected&&!fe&&!yt&&(zi.remove(),Ji()),{once:!0}),!1},jd=async Pe=>{Fi(),kt(),yr(),St?.(),ie&&Pe&&(await k(9e4),re&&ae===Re&&se(!0))};try{let Pe=await fetch("/api/debate/turn-stream",{method:"POST",credentials:"include",signal:ul.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({debateId:e,text:I?"":Y,action:I?"open":void 0,phase:(J||ie)&&!I?"closing":void 0,clientTts:Gd})});Vd=!0,lt=performance.now();let Mt=Pe.headers.get("content-type")||"";if(!Pe.ok||!Mt.includes("text/event-stream")){let zi={};try{zi=await Pe.json()}catch(Qi){if(Js)throw Qi}if(Zs=!0,at.remove(),Kt(),Pe.status===402)ve=!0,rt=!1,f.replaceChildren(cc()),d.disabled=!0,h.disabled=!0,clearTimeout(zt),si("You\u2019re out of rounds \u2014 tap End & grade to get your scorecard for this session.");else if(zi.error==="debate_ended")$=!0,si("This session has already been scored.");else if(zi.error==="opening_already_delivered"){rt=!1;let Qi=await q(null,0,[0]);Qi?.state==="reply"&&ae===Re&&re&&!ne.some(Qs=>Qs.role==="opp")?Ke("opp",Qi.text):Qi?.state!=="reply"&&Zi("Couldn\u2019t load your opponent\u2019s opening \u2014 reload the page to see it.")}else un=!0,Ks=zi.error==="text_too_long"?"That message is over 4,000 characters \u2014 trim it and send again.":Pe.status===401?"You\u2019ve been signed out \u2014 log in again, then come back to this session.":zi.message||"";return}let Zt=Pe.body.getReader(),Ji=new TextDecoder,hn="";for(;;){let{done:zi,value:Qi}=await Zt.read();if(zi)break;lt=performance.now(),hn+=Ji.decode(Qi,{stream:!0});let Qs=hn.split(`

`);hn=Qs.pop()??"";for(let qp of Qs){let qd=qp.trim();if(qd.startsWith("data:"))try{$p(JSON.parse(qd.slice(5).trim()))}catch{}}if(ae!==Re||!re){Zt.cancel().catch(()=>{});break}}}catch(Pe){Pe?.name==="AbortError"&&!Js&&(Zs=!0)}finally{if(clearInterval(Gp),ae===Re&&re){at.remove(),fe=!1,me=null;let Pe=!Hi&&!Zs;Hi||(Pe&&Je&&hl(!0),Pe&&xe&&He!==ae?(gi=xe,gi.finish({dropTail:!0})):(xe?.cancel(),xe=null,Oe.stop())),pl=Et,un&&(ze=!0,Kt(),I?O(`Your opponent couldn\u2019t start.${Ks.includes("wasn\u2019t charged")?" That round wasn\u2019t charged.":""}`):Zi(Ks||"Your message didn\u2019t go through. Try sending again.")),Hi&&I&&(rt=!1),Fi(),kt();let Mt=Hi?!0:Pe?await Wd():!1;re&&ae===Re&&await jd(Mt)}}}async function k(I){let J=ae=>new Promise(Ce=>setTimeout(Ce,ae)),Y=Date.now();for(;Oe.state==="idle"&&Date.now()-Y<1500;)await J(150);for(;(Oe.state!=="idle"||Si)&&Date.now()-Y<I;)await J(200);await J(300)}async function se(I=!1){if($)return ge();if(we||je)return;if(!I){je=!0,clearTimeout(zt),Ne();let Y;try{if(ce===0)Y=await Ir({title:"Nothing to grade yet",body:"Say at least one thing before asking for a scorecard.",actions:[{label:"Keep going",value:"stay",kind:"primary"},{label:"Leave session",value:"leave"}]});else{let ae=!o,Ce=[];a&&ae&&ce>=2&&!ie&&Ce.push({label:"Deliver a closing statement first",hint:"1 more round",value:"closing"}),Ce.push({label:"Grade my session now",value:"score",kind:"primary"},{label:"Keep going",value:"stay"}),Y=await Ir({title:"End this session?",body:n.judge?"You\u2019ll get your coaching scorecard, and an impartial judge will score both sides.":"You\u2019ll get your coaching scorecard.",actions:Ce})}}finally{je=!1}if(Y==="leave")return void(location.hash="#/");if(Y==="closing"){ie=!0,Fi(),d.placeholder="Your closing argument \u2014 why you won\u2026",d.focus();return}if(Y!=="score")return void St()}we=!0,clearTimeout(zt),Ne();let J=l("#banner-score");if(J&&(J.disabled=!0),m.disabled=!0,m.innerHTML='<span class="spinner"></span><span>Scoring\u2026</span>',fe){let Y=si("Finishing their reply, then scoring\u2026");for(;fe&&re&&!$;)await cn(200);Y.remove()}if(re){xe?.cancel(),Oe.stop();try{let{scores:Y}=await Ct("/api/debate/end",{debateId:e});if(!re)return;$=!0,bh(r,D,t,e,ne,Y)}catch(Y){if(we=!1,!re)return;J&&(J.disabled=!1),m.disabled=!1,m.textContent="End & grade",Zi(Y?.body?.message||"Couldn\u2019t fetch your scores. Try again in a moment."),kt()}}}async function ge(){try{let I=await It(`/api/debates/${encodeURIComponent(e)}`);bh(r,D,t,e,ne,I.scorecard||{dimensions:[],overall:null,notes:""})}catch{si("Couldn\u2019t load the scorecard.","error")}}u.addEventListener("click",()=>j({closing:ie})),d.addEventListener("keydown",I=>{I.key==="Enter"&&!I.shiftKey&&!I.isComposing&&window.matchMedia("(pointer: fine)").matches&&(I.preventDefault(),j({closing:ie}))}),g.addEventListener("click",()=>{Oe.unlock(),Oe.replay(),kt()}),v.addEventListener("click",()=>{He=Re,xe?.cancel(),Oe.stop()}),m.addEventListener("click",()=>$?ge():se(!1)),r.addEventListener("click",he);let Se=window.SpeechRecognition||window.webkitSpeechRecognition;function Ae(){if(qe)try{Ue?.stop()}catch{}}let ke=null;function Ne(){if(clearTimeout(ai),!Ue)return;let I=Ue;I.onresult=I.onend=I.onerror=null;try{I.abort()}catch{}qe&&ke?.()}let Ie=I=>{let J="";for(let Y of I){let ae=Y.trim();if(!ae)continue;let Ce=J.toLowerCase(),bt=ae.toLowerCase();!J||bt.startsWith(Ce)?J=ae:Ce.endsWith(bt)||(J+=" "+ae)}return J},nt=I=>{let J=[...ne].reverse().find(at=>at.role==="opp")?.text||"",Y=at=>at.toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu," ").split(/\s+/).filter(Boolean),ae=Y(I);if(ae.length<4||!J)return!1;let Ce=new Set,bt=Y(J);for(let at=0;at+2<bt.length;at++)Ce.add(bt[at]+" "+bt[at+1]+" "+bt[at+2]);let Kt=0;for(let at=0;at+2<ae.length;at++)Ce.has(ae[at]+" "+ae[at+1]+" "+ae[at+2])&&Kt++;return Kt/(ae.length-2)>=.5},vt=/Android/i.test(navigator.userAgent),mt="aai_handsfree",st=!1;try{st=localStorage.getItem(mt)==="1"}catch{}let ct=l("#hf-btn"),Ee=()=>{!ct||!Se||(ct.classList.remove("hidden"),ct.innerHTML=`Hands-free mic: <b class="${st?"text-emerald-300":"text-slate-300"}">${st?"On":"Off"}</b>`,ct.setAttribute("aria-pressed",String(st)))},Bi=I=>{st=I;try{localStorage.setItem(mt,I?"1":"0")}catch{}Ee()},ai=0;function ei(I=!1){if(qe||!Se)return;Oe.unlock(),I||(He=Re,xe?.cancel(),Oe.stop()),Ne(),Ue=new Se,Ue.lang=navigator.language||"en-US",Ue.interimResults=!0,Ue.continuous=!vt;let J=d.value?d.value.replace(/\s+$/,"")+" ":"",Y=()=>d.value.slice(J.length).trim(),ae=()=>{if(!(!st||fe||!re||$||ve||E()||!Y())){if(nt(Y())){d.value=J.trim(),Ki(),p.textContent="That sounded like your opponent\u2019s voice \u2014 try headphones, or turn the volume down.",p.className="mt-2 text-xs text-amber-300";return}j({closing:ie})}};Ue.onresult=at=>{let Je=[],Et=[];for(let Hi=0;Hi<at.results.length;Hi++){let un=at.results[Hi];(un.isFinal?Je:Et).push(un[0].transcript)}let oi=Ie(Je),wt=Ie(Et),dn=wt?!oi||wt.toLowerCase().startsWith(oi.toLowerCase())?wt:`${oi} ${wt}`:oi;d.value=(J+dn).replace(/\s+/g," ").trimStart(),Ki(),st&&(clearTimeout(ai),d.value.trim()&&(ai=setTimeout(()=>qe&&ae(),1700)))};let Ce=!1,bt="",Kt=at=>{Ce||(Ce=!0,clearTimeout(ai),ke=null,qe=!1,h.classList.remove("mic-live"),h.innerHTML=Qe.mic,h.setAttribute("aria-label","Speak your reply"),at?(p.textContent=at,p.className="mt-2 text-xs text-red-300",setTimeout(()=>p.textContent===at&&p.classList.add("hidden"),5e3)):p.className.includes("amber")||p.classList.add("hidden"),kt())};ke=Kt,Ue.onend=()=>{Kt(),bt||ae()},Ue.onerror=at=>{let Je=at?.error||"";bt=Je||"error",Kt(Je==="not-allowed"||Je==="service-not-allowed"?I?"Tap the mic to talk \u2014 your browser needs a tap before it can listen.":"Microphone blocked \u2014 allow mic access for this site, then try again.":Je==="audio-capture"?"No microphone found on this device.":Je==="no-speech"?I?"Didn\u2019t hear anything \u2014 tap the mic when you\u2019re ready.":"Didn\u2019t hear anything \u2014 tap the mic and try again.":Je==="aborted"?"":"Voice input failed \u2014 try again or type instead.")};try{Ue.start(),qe=!0,h.classList.add("mic-live"),h.innerHTML=Qe.stop,h.setAttribute("aria-label","Stop listening"),p.textContent=st?"Listening\u2026 I\u2019ll send when you pause.":"Listening\u2026 tap the mic again when you\u2019re done, then send.",p.className="mt-2 text-xs text-slate-400",kt()}catch{Kt(I?"":"Voice input failed \u2014 try again or type instead.")}}var zt=0;function St(){if(clearTimeout(zt),!Se||!st||!re||$||ve||fe||qe||ze||E())return;let I=G?.classList.contains("photoreal-live")?900:450;zt=setTimeout(()=>{if(!(!st||!re||$||ve||fe||qe||ie||ze||E()||document.hidden)&&!(Oe.state==="speaking"||xe&&xe.pending?.())){if(Si||A?.talking)return void(zt=setTimeout(St,400));Le&&ce>=Le.length||ei(!0)}},I)}var Or=Oe.on(I=>{I==="speaking"?(clearTimeout(zt),qe&&Ne()):I==="idle"&&St()});Se&&(h.classList.remove("hidden"),Ee(),ct?.addEventListener("click",()=>{Bi(!st),st?St():(clearTimeout(zt),Ne())}),h.addEventListener("click",()=>{if(qe)return clearTimeout(ai),Ae();try{localStorage.getItem(mt)===null&&Bi(!0)}catch{}ei(!1)}));let ft=null;for(let I of i.turns??[])I.role==="user"?(ft=Ke("you",I.text),ce++):Ke("opp",I.text);if($){d.disabled=!0;let I=document.createElement("div");I.className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-200",I.innerHTML='<span>\u2713 This session is finished and scored.</span><button type="button" class="btn-ghost btn-xs">View scorecard</button>',I.querySelector("button").onclick=ge,M.appendChild(I),m.textContent="Scorecard"}else kr(i?.remainingRounds),i?.remainingRounds===0&&(ve=!0,f.replaceChildren(cc()),d.disabled=!0,h.disabled=!0);let ti=(i.turns??[]).at(-1);rt=!$&&!ve&&!ti&&t.resolvedFirstSpeaker==="opponent",Fi(),kt(),yr();async function Fr(I,J){let Y=String(J.text??"").trim(),ae={state:"pending"};if(!(Date.now()-Date.parse(J.created_at||"")>18e4)){yt=!0,kt();let Ce=fi();if(ae=await q(Y,ce,[1500,2500,4e3,6e3,8e3,1e4]),Ce.remove(),yt=!1,!ae||!re)return void kt()}if(ae.state==="reply")Ke("opp",ae.text),kr(ae.remaining);else if(ae.state==="gone"){I.row.remove();let Ce=ne.indexOf(I.entry);Ce>=0&&ne.splice(Ce,1),ce=Math.max(0,ce-1),d.value||(d.value=Y,Ki()),ze=!0,Zi("Your last message didn\u2019t get a reply \u2014 it\u2019s back in the box. Tap Send to try again.")}else ae.state==="offline"?si("Couldn\u2019t check on the reply to your last message \u2014 reload to see it."):si(`${t.personaLabel} never answered your last message. Send your next point to carry on.`);Fi(),kt(),yr(),St()}if(rt){let I=(()=>{try{return Oe.ensureContext().state}catch{return"running"}})(),J=!1,Y=null,ae=Ce=>{J||!re||!rt||Ce?.target?.closest?.("#end-btn")||(J=!0,r.removeEventListener("click",ae,!0),Y?.remove(),Oe.unlock(),B=!1,kt(),T.then(()=>re&&j({open:!0})))};I!=="running"?(B=!0,kt(),Y=document.createElement("button"),Y.type="button",Y.className="absolute inset-0 z-[3] flex items-center justify-center bg-black/55 text-white",Y.innerHTML='<span class="rounded-full border border-white/20 bg-black/60 px-5 py-3 text-sm font-semibold backdrop-blur">\u25B6 Tap to hear your opponent</span>',G.appendChild(Y),r.addEventListener("click",ae,!0)):ae()}else!$&&ti?.role==="user"?Fr(ft,ti):$||(St(),window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches&&d.focus({preventScroll:!0}));$||he()}function Jo(r,e,t=10){let i=e==null?0:Math.max(0,Math.min(100,e/t*100));return`
    <div>
      <div class="mb-1.5 flex justify-between gap-3 text-sm">
        <span class="font-medium text-slate-300">${Be(r)}</span>
        <span class="shrink-0 font-semibold text-white">${Wn(e)}<span class="text-slate-500">/${t}</span></span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-ink-800">
        <div class="score-fill h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400" style="width:0%" data-w="${i}"></div>
      </div>
    </div>`}function bh(r,e,t,i,n,s){try{localStorage.setItem("aai_sessions_done","1")}catch{}bs("session_complete",{mode:t?.modeId});let a=s?.dimensions??[],o=a.filter(c=>c.score!=null);e?.dispose?.(),window.__sessionCleanup?.(),window.scrollTo({top:0});let l=n.filter(c=>c.role==="you").length;r.className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10",r.innerHTML=`
      <div class="mb-6 text-center">
        <p class="eyebrow mb-2 !text-accent-400">Session complete</p>
        <h1 class="text-display-lg text-white">Your scorecard</h1>
        <p class="mx-auto mt-2 max-w-xl text-sm text-slate-400 line-clamp-2">${Be(t.modeName)}${t.topic?` \xB7 ${Be(t.topic)}`:""}</p>
      </div>
      <div class="card mb-4 p-5 sm:p-7">
        <div class="flex items-center gap-5">
          <div class="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-accent-500/40 bg-accent-500/10">
            <span class="text-4xl font-extrabold leading-none tracking-tight text-accent-400">${Wn(s?.overall)}</span>
            <span class="mt-1 text-[11px] font-semibold text-slate-500">/ 10</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-lg font-bold text-white">Your score</div>
            <p class="text-sm text-slate-400">${l} turn${l===1?"":"s"} vs ${Be(t.personaLabel)}</p>
            ${t.judgeEnabled?'<div id="verdict-pill" class="mt-2"><span class="badge border-ink-700 bg-ink-800 text-slate-400"><span class="spinner !h-3 !w-3"></span>Judge deliberating\u2026</span></div>':""}
          </div>
        </div>
        ${o.length?`<div class="mt-6 grid gap-x-8 gap-y-4 border-t border-ink-700 pt-6 sm:grid-cols-2">${a.map(c=>Jo(c.label,c.score)).join("")}</div>`:""}
      </div>
      ${t.judgeEnabled?`<div class="card mb-4 p-5 sm:p-7" id="verdict-card"><div class="mb-4 flex items-center gap-3"><span class="text-accent-400 [&>svg]:h-5 [&>svg]:w-5">${Qe.scale}</span><div><div class="font-semibold text-white">Head-to-head</div><p class="text-xs text-slate-500">An impartial judge scored both sides on the same rubric.</p></div></div><div id="verdict-body"><div class="flex items-center justify-center gap-2 py-6 text-sm text-slate-400"><span class="spinner"></span>The judge is deliberating\u2026</div></div></div>`:""}
      <div class="card mb-4 p-5 sm:p-7">
        <div class="mb-2 text-sm font-semibold text-white">Coach\u2019s notes</div>
        <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">${Be(s?.notes||"No notes this time.")}</p>
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
      </div>`,T_(r,i,t),requestAnimationFrame(()=>requestAnimationFrame(()=>{r.querySelectorAll("[data-w]").forEach(c=>c.style.width=`${c.dataset.w}%`)}))}var ud=[["argumentation","Argumentation"],["evidence","Evidence & reasoning"],["rebuttal","Rebuttal"],["composure","Composure & clarity"]];function T_(r,e,t){let i=r.querySelector("#arena-toggle-btn"),n=r.querySelector("#arena-share-tray"),s=r.querySelector("#arena-share-link"),a=r.querySelector("#arena-copy-btn"),o=r.querySelector("#arena-share-x"),l=r.querySelector("#arena-share-reddit");if(i){let d=`${location.origin}/debate/${e}`;s.value=d;let u=!1,h=p=>{u=p,i.textContent=p?"\u2713 Published \u2014 unpublish":"Publish to Arena",n.classList.toggle("hidden",!p);let g=t.topic?`\u201C${t.topic}\u201D`:"this debate";o.href="https://twitter.com/intent/tweet?text="+encodeURIComponent(`Who won? I sparred ${t.personaLabel||"an AI"} on ${g}. Vote on AdversaryAI: ${d}`),l.href="https://reddit.com/submit?url="+encodeURIComponent(d)+"&title="+encodeURIComponent(`Who won this debate? Me vs ${t.personaLabel||"AI"} on ${g}`)};It("/api/debates/"+encodeURIComponent(e)).then(p=>p?.debate&&h(!!(p.debate.is_public||p.debate.isPublic))).catch(()=>{}),i.addEventListener("click",async()=>{i.disabled=!0;try{await Ct("/api/debate/toggle-public",{debateId:e,isPublic:!u}),h(!u)}catch{i.textContent="Couldn\u2019t update \u2014 try again"}finally{i.disabled=!1}}),a.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(d),a.textContent="Copied!",setTimeout(()=>a.textContent="Copy",2e3)}catch{s.select()}})}let c=r.querySelector("#verdict-body");if(c){let d=r.querySelector("#verdict-pill"),u=()=>{c.innerHTML='<div class="flex items-center justify-center gap-2 py-6 text-sm text-slate-400"><span class="spinner"></span>The judge is deliberating\u2026</div>',d&&(d.innerHTML='<span class="badge border-ink-700 bg-ink-800 text-slate-400"><span class="spinner !h-3 !w-3"></span>Judge deliberating\u2026</span>'),Ct("/api/debate/judge",{debateId:e}).then(({verdict:h})=>E_(r,t,h)).catch(h=>{let p=h instanceof Lt?h.body?.error:null;if(d&&(d.innerHTML=""),p==="insufficient_transcript"){c.innerHTML='<p class="py-4 text-center text-sm text-slate-400">Not enough of a session to judge \u2014 the verdict needs at least one exchange from each side.</p>';return}let g=!(h instanceof Lt)||h.status>=500||h.status===429||p==="judge_unavailable";c.innerHTML=`<div class="flex flex-col items-center gap-3 py-4 text-center"><p class="text-sm text-slate-400">The judge couldn\u2019t reach a verdict just now. Your scorecard above is unaffected.</p>${g?'<button type="button" class="btn-ghost btn-sm" data-judge-retry>Try again</button>':""}</div>`,c.querySelector("[data-judge-retry]")?.addEventListener("click",v=>(v.currentTarget.disabled=!0,u()),{once:!0})})};u()}}function us(r){return r.winner==="you"?{icon:Qe.trophy,title:"You win",sub:"The judge scored it for you.",tone:"tone-win"}:r.winner==="opponent"?{icon:Qe.target,title:"Your opponent takes this one",sub:"The judge scored it for them. Review the notes and run it back.",tone:"tone-lose"}:r.winner==="draw"?{icon:Qe.scale,title:"Dead even \u2014 a draw",sub:"The judge could not separate you.",tone:"text-slate-200 border border-ink-600 bg-ink-800/60"}:r.assessment==="strong"?{icon:Qe.trending,title:"Strong performance",sub:"The judge rates this session highly.",tone:"tone-win"}:r.assessment==="developing"?{icon:Qe.target,title:"Developing",sub:"Solid foundation \u2014 keep pushing on the notes below.",tone:"tone-lose"}:{icon:Qe.compass,title:"Needs work",sub:"The judge sees clear room to improve.",tone:"tone-bad"}}function E_(r,e,t){let i=r.querySelector("#verdict-body");if(!i)return;let n=us(t),s=r.querySelector("#verdict-pill");s&&(s.innerHTML=`<span class="badge ${n.tone}">${Be(n.title)}</span>`);let a=(l,c)=>{let d=t.you?.[l],u=t.opponent?.[l],h=p=>p==null?0:Math.max(0,Math.min(100,p*10));return`<div class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-2.5">
      <span class="text-sm font-medium text-slate-300">${Be(c)}</span>
      <span class="text-sm tabular-nums"><span class="font-bold ${d>=u?"text-white":"text-slate-400"}">${Wn(d)}</span><span class="px-1.5 text-slate-600">vs</span><span class="font-bold ${u>d?"text-white":"text-slate-400"}">${Wn(u)}</span></span>
      <div class="col-span-2 grid grid-cols-2 gap-1.5">
        <div class="h-1.5 overflow-hidden rounded-full bg-ink-800"><div class="score-fill ml-auto h-full rounded-full bg-accent-500" style="width:0%" data-w="${h(d)}"></div></div>
        <div class="h-1.5 overflow-hidden rounded-full bg-ink-800"><div class="score-fill h-full rounded-full bg-slate-500" style="width:0%" data-w="${h(u)}"></div></div>
      </div></div>`};i.innerHTML=`
    <div class="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider"><span class="text-accent-400">You</span><span class="text-slate-400">${Be(e.personaLabel)}</span></div>
    <div class="divide-y divide-ink-700/60">${ud.map(([l,c])=>a(l,c)).join("")}</div>`;let o=r.querySelector("#judge-notes");o&&(o.innerHTML=`${t.reasoning?`<div class="mt-5 border-t border-ink-700 pt-5"><div class="mb-2 text-sm font-semibold text-white">Why the judge decided</div><p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">${Be(t.reasoning)}</p></div>`:""}
      ${t.turningPoint?`<div class="mt-4 rounded-xl border border-accent-500/30 bg-accent-500/5 p-4"><div class="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-300">Turning point</div><p class="text-sm leading-relaxed text-slate-300">${Be(t.turningPoint)}</p></div>`:""}`),requestAnimationFrame(()=>requestAnimationFrame(()=>i.querySelectorAll("[data-w]").forEach(l=>l.style.width=`${l.dataset.w}%`)))}function Rt(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var zp=r=>`max-w-[92%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed sm:text-[15px] ${r?"rounded-br-md border border-accent-500/30 bg-accent-500/10 text-slate-100":"rounded-bl-md border border-ink-700 bg-ink-800 text-slate-200"}`;function zd(r){let e=new Date(r);return Number.isNaN(e.getTime())?r:e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}async function hd(r){r.innerHTML=`<div class="mx-auto max-w-4xl px-4 py-6 sm:py-10" id="history-root">${tl("list").outerHTML}</div>`;let e=r.querySelector("#history-root"),t,i=new Map;try{let p=await It("/api/debates");t=Array.isArray(p)?p:p.debates;try{i=new Map((await qn()).map(g=>[g.id,g]))}catch{}}catch(p){e.replaceChildren(jn(`Couldn\u2019t load your history. ${p instanceof Lt?`Error ${p.status}`:"Check your connection."}`,()=>hd(r)));return}let n=p=>`
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 class="text-display-lg text-white">History</h1>
        <p class="mt-1 text-sm text-slate-400" id="history-counter">${p} session${p===1?"":"s"}</p>
      </div>
      <a href="#/" class="btn-primary btn-sm shrink-0">+ New session</a>
    </div>`;if(t.length===0){e.innerHTML=`${n(0)}
      <div class="card px-6 py-16 text-center">
        <div class="mb-4 flex justify-center text-slate-500 [&>svg]:h-10 [&>svg]:w-10">${Qe.mic}</div>
        <p class="mb-1 font-semibold text-white">No sessions yet</p>
        <p class="mb-6 text-sm text-slate-400">Your sessions, transcripts and scorecards will live here.</p>
        <a href="#/" class="btn-primary">Start your first session</a>
      </div>`;return}e.innerHTML=`${n(t.length)}<div class="space-y-3" id="debate-list"></div>`;let s=e.querySelector("#debate-list"),a=p=>i.get(p)?.name||(p?p[0].toUpperCase()+p.slice(1):"Session"),o=p=>(Bp[_d(p).unit]||"Round").toLowerCase();async function l(p,g){if(await Ir({title:"Close & grade this session?",body:"The session ends here and you get your scorecard. You won\u2019t be able to continue it.",actions:[{label:"Close & grade",value:"y",kind:"primary"},{label:"Cancel",value:null}]})){g.disabled=!0,g.innerHTML='<span class="spinner"></span><span>Scoring\u2026</span>';try{await Ct("/api/debate/end",{debateId:p.id}),p.ended_at=new Date().toISOString(),u(),h(p.id)}catch{g.disabled=!1,g.textContent="Close & grade"}}}async function c(p,g){if(await Ir({title:"Delete this session?",body:`\u201C${Be(p.topic||"Untitled")}\u201D and its transcript and scores will be permanently removed.`,actions:[{label:"Delete permanently",value:"y",kind:"danger"},{label:"Cancel",value:null}]}))try{await oc(`/api/debates/${encodeURIComponent(p.id)}`),t=t.filter(m=>m.id!==p.id),g.style.transition="opacity .2s, transform .2s",g.style.opacity="0",g.style.transform="scale(0.98)",setTimeout(()=>t.length?u():hd(r),200)}catch{await Ir({title:"Couldn\u2019t delete",body:"Please try again.",actions:[{label:"OK",value:1,kind:"primary"}]})}}let d=new Map;function u(){d.clear(),e.querySelector("#history-counter").textContent=`${t.length} session${t.length===1?"":"s"}`,s.innerHTML="";for(let p of t){let g=!!p.ended_at,v=document.createElement("article");v.className="card p-4 sm:p-5",v.innerHTML=`
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-accent-400 [&>svg]:h-5 [&>svg]:w-5">${xd[p.mode]??Qe.chat}</div>
          <button type="button" data-a="open" class="min-w-0 flex-1 text-left">
            <span class="block font-semibold leading-snug text-white line-clamp-2 hover:text-accent-300">${Be(p.topic||"Untitled session")}</span>
            <span class="mt-1 block text-xs leading-relaxed text-slate-400">${[a(p.mode),zd(p.created_at),p.personaLabel?`vs ${p.personaLabel}`:"",p.targetRounds?`${p.targetRounds} ${o(p.mode)}s`:"open-ended"].filter(Boolean).map(Be).join(" \xB7 ")}</span>
          </button>
          <span class="badge ${g?"border-emerald-700/60 bg-emerald-500/10 text-emerald-300":"border-amber-500/40 bg-amber-500/10 text-amber-300"}">${g?p.overall!=null?`Your score ${Wn(p.overall)}/10`:"Finished":"In progress"}</span>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-700/60 pt-3">
          ${g?'<button type="button" data-a="open" class="btn-ghost btn-xs max-sm:min-h-[44px]">Transcript &amp; scores</button>':'<button type="button" data-a="resume" class="btn-primary btn-xs max-sm:min-h-[44px]">Resume</button><button type="button" data-a="close" class="btn-ghost btn-xs max-sm:min-h-[44px]">Close &amp; grade</button><button type="button" data-a="open" class="btn-ghost btn-xs max-sm:min-h-[44px]">Transcript</button>'}
          <button type="button" data-a="delete" class="ml-auto inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-950/50 hover:text-red-300" aria-label="Delete session" title="Delete session"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
        </div>
        <div data-detail class="hidden"></div>`,v.addEventListener("click",m=>{let f=m.target.closest("[data-a]");if(!f)return;let M=f.dataset.a;M==="resume"?location.hash=`#/session/${encodeURIComponent(p.id)}`:M==="open"?h(p.id):M==="close"?l(p,f):M==="delete"&&c(p,v)}),d.set(p.id,v),s.appendChild(v)}}async function h(p){let g=d.get(p);if(!g)return;let v=g.querySelector("[data-detail]");if(!v.classList.contains("hidden")&&v.dataset.loaded){v.classList.add("hidden");return}v.className="mt-4 border-t border-ink-700/60 pt-4",v.innerHTML='<p class="text-sm text-slate-500"><span class="spinner mr-2"></span>Loading\u2026</p>';try{let m=await It(`/api/debates/${encodeURIComponent(p)}`),f=m.debate.personaLabel||a(m.debate.mode),M=m.scorecard;v.dataset.loaded="1",v.innerHTML=`
        ${M?`<div class="mb-4 rounded-xl border border-ink-700 bg-ink-800/60 p-4"><div class="mb-3 flex items-center justify-between"><span class="text-sm font-semibold text-white">Your score</span><span class="text-lg font-extrabold text-accent-400">${Wn(M.overall)}<span class="text-sm text-slate-500">/10</span></span></div>
          ${(M.dimensions||[]).length?`<div class="grid gap-x-6 gap-y-3 sm:grid-cols-2">${M.dimensions.map(w=>Jo(w.label,w.score)).join("")}</div>`:""}
          ${M.notes?`<p class="mt-3 text-sm leading-relaxed text-slate-400">${Be(M.notes)}</p>`:""}</div>`:""}
        ${m.verdict&&m.verdict.winner?`<p class="mb-4 text-sm text-slate-300"><span class="font-semibold text-white">Judge:</span> ${m.verdict.winner==="you"?"you won":m.verdict.winner==="draw"?"a draw":`${Be(f)} won`}${m.verdict.reasoning?` \u2014 ${Be(m.verdict.reasoning)}`:""}</p>`:""}
        <div class="transcript-scroll max-h-[55vh] space-y-3 overflow-y-auto pr-1">${(m.turns||[]).map(w=>{let _=w.role==="user";return`<div class="flex ${_?"justify-end":"justify-start"}"><div class="${zp(_)}"><div class="mb-1 text-[11px] font-semibold uppercase tracking-wide ${_?"text-accent-400":"text-slate-500"}">${_?"You":Be(f)}</div><div class="whitespace-pre-wrap break-words">${Be(w.text)}</div></div></div>`}).join("")||'<p class="text-sm text-slate-500">No turns recorded.</p>'}</div>`,requestAnimationFrame(()=>requestAnimationFrame(()=>v.querySelectorAll("[data-w]").forEach(w=>w.style.width=`${w.dataset.w}%`)))}catch{v.innerHTML='<p class="text-sm text-red-300">Couldn\u2019t load that transcript. Try again.</p>'}}u()}function At(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ic(r){return r.replace(/\bdebates\b/gi,e=>e[0]===e[0].toUpperCase()?"Sessions":"sessions")}function Sh(r,e){try{return new Intl.NumberFormat(void 0,{style:"currency",currency:e.toUpperCase()}).format(r/100)}catch{return`${(r/100).toFixed(2)} ${e.toUpperCase()}`}}function A_(r){if(!r)return"\u2014";(typeof r=="number"||/^\d{9,11}$/.test(String(r)))&&(r=Number(r)*1e3);let e=new Date(r);return Number.isNaN(e.getTime())?r:e.toLocaleDateString(void 0,{month:"long",day:"numeric",year:"numeric"})}function Gs({title:r,body:e="",label:t="",type:i="text",value:n="",placeholder:s="",autocomplete:a="off",username:o="",readOnly:l=!1,confirm:c="OK",kind:d="primary",cancel:u="Cancel",validate:h=null}){return new Promise(p=>{let g=document.activeElement,v=`uip-${Date.now().toString(36)}`,m=document.createElement("div");m.className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in",m.setAttribute("role","dialog"),m.setAttribute("aria-modal","true"),m.setAttribute("aria-labelledby",`${v}-t`),m.innerHTML=`<form novalidate class="w-full max-w-md rounded-3xl border border-ink-700 bg-ink-900 p-6 shadow-2xl animate-pop-in">
      <h3 id="${v}-t" class="text-display-sm text-white">${Be(r)}</h3>
      ${e?`<p class="mt-2 text-sm leading-relaxed text-slate-400">${e}</p>`:""}
      ${o?`<input type="text" name="username" autocomplete="username" value="${Be(o)}" readonly tabindex="-1" aria-hidden="true" class="sr-only" />`:""}
      ${t?`<label for="${v}-i" class="mt-5 mb-1.5 block text-body-sm font-medium text-slate-300">${Be(t)}</label>`:""}
      <input id="${v}-i" type="${i}" class="field ${t?"":"mt-5"}" ${t?"":`aria-label="${Be(r)}"`} autocomplete="${a}" placeholder="${Be(s)}" ${l?"readonly":""} />
      <div class="hidden" data-err></div>
      <div class="mt-6 flex flex-col gap-2.5">
        <button type="submit" class="${d==="danger"?"btn-danger":"btn-primary"} w-full justify-center py-3">${Be(c)}</button>
        ${u?`<button type="button" data-cancel class="btn-ghost w-full justify-center py-3">${Be(u)}</button>`:""}
      </div>
    </form>`;let f=m.querySelector("form"),M=m.querySelector("input:not([name=username])"),w=m.querySelector("[data-err]"),_=m.querySelector('button[type="submit"]');M.value=n;let D=!1,A=T=>{document.removeEventListener("keydown",R),m.remove(),g&&g.isConnected&&typeof g.focus=="function"&&g.focus({preventScroll:!0}),p(T)},R=T=>{if(T.key==="Escape"&&!D)return A(null);if(T.key!=="Tab")return;let b=[...m.querySelectorAll("input:not([tabindex='-1']), button")].filter(U=>!U.disabled);if(!b.length)return;let x=b[0],C=b[b.length-1];T.shiftKey&&document.activeElement===x?(T.preventDefault(),C.focus()):!T.shiftKey&&document.activeElement===C&&(T.preventDefault(),x.focus())};document.addEventListener("keydown",R),m.addEventListener("click",T=>{D||(T.target===m||T.target.closest("[data-cancel]"))&&A(null)}),f.addEventListener("submit",async T=>{if(T.preventDefault(),D)return;let b=M.value;if(h){D=!0,Da(_,!0,c);let x=null;try{x=await h(b)}catch{x="Something went wrong. Please try again."}if(D=!1,Da(_,!1,c),x){Xr(w,x),w.classList.replace("mb-5","mt-4"),M.focus();return}}A(b)}),document.body.appendChild(m),M.focus(),l&&M.select()})}var $i=(r,e="")=>Ir({title:r,body:e&&Be(e),actions:[{label:"OK",value:1,kind:"primary"}]});async function pd(r){r.innerHTML='<div class="max-w-4xl mx-auto px-4 py-6 sm:py-10" id="account-root"></div>';let e=r.querySelector("#account-root");e.appendChild(tl("page"));let t,i;try{[t,i]=await Promise.all([It("/api/account"),It("/api/billing/prices")])}catch(P){e.innerHTML="";let L=P instanceof Lt?`Error ${P.status}`:"Check your connection and try again.";e.appendChild(jn(`Couldn't load your account. ${L}`,()=>void pd(r)));return}let n=await $s(),s=t.usage.quota>0?Math.min(100,t.usage.debates_used/t.usage.quota*100):0,a=t.subscription&&t.subscription.tier!=="none"&&t.subscription.status!=="canceled"?t.subscription:null,o=!!(t.isLifetime||a?.isLifetime),l={active:"Active",trialing:"Trial",past_due:"Payment issue \u2014 update your card in Manage billing",incomplete:"Payment pending",unpaid:"Payment issue \u2014 update your card in Manage billing"},c=a?l[a.status]||(a.status?a.status[0].toUpperCase()+a.status.slice(1).replace(/_/g," "):""):"",d=a?.current_period_end?A_(a.current_period_end):"";e.innerHTML="";let u=new URLSearchParams(location.hash.split("?")[1]??"");if(u.get("checkout")==="success"){let P=document.createElement("div");P.className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200",P.textContent="\u2713 Payment received \u2014 your account is updated. Thank you!",e.appendChild(P);try{let L="aai_purchase_"+(a?.stripe_subscription_id||a?.tier||"pack")+"_"+new Date().toISOString().slice(0,10);sessionStorage.getItem(L)||(sessionStorage.setItem(L,"1"),bs("purchase",{plan:a?.tier||"pack",attribution:window.adversaryAttribution?.()||null}))}catch{}}else if(u.get("checkout")==="cancelled"){let P=document.createElement("div");P.className="mb-6 rounded-2xl border border-ink-700 bg-ink-800/60 p-4 text-sm text-slate-300",P.textContent="Checkout cancelled \u2014 nothing was charged.",e.appendChild(P)}let h=document.createElement("div");h.className="mb-8",h.innerHTML=`
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
      <div id="promo-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>`,e.appendChild(g),setTimeout(()=>{let P=g.querySelector("#promo-redeem-form"),L=g.querySelector("#promo-code-input"),H=g.querySelector("#promo-redeem-btn"),F=g.querySelector("#promo-feedback");P&&P.addEventListener("submit",async K=>{K.preventDefault();let ne=(L.value||"").trim().toUpperCase();if(ne){H.disabled=!0,H.textContent="Checking\u2026",F.className="hidden mt-3 text-sm p-3 rounded-xl";try{let ce=await fetch("/api/account/promo/redeem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:ne})}),fe=await ce.json();ce.ok&&fe.ok?(F.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block",F.textContent=fe.message,L.value="",setTimeout(()=>pd(r),2e3)):(F.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",F.textContent=fe.error||"Invalid code.")}catch{F.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",F.textContent="Network error. Try again."}finally{H.disabled=!1,H.textContent="Redeem"}}})},0),t.isOwner){let P=document.createElement("div");P.className="card card-lift p-6 mb-10 border border-amber-500/30 bg-amber-500/5",P.innerHTML=`
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">\u{1F451}</span>
          <h2 class="font-display text-lg text-amber-300 font-semibold">Admin: Grant Lifetime VIP</h2>
        </div>
        <p class="text-slate-300 text-body-sm mb-4">Instantly upgrade any registered email to Lifetime Champion VIP with 100,000 rounds.</p>
        <form id="admin-grant-form" class="flex flex-wrap gap-2 max-w-md">
          <input type="email" id="admin-grant-email" placeholder="family@gmail.com" class="field flex-1 text-sm px-4 py-2.5 rounded-xl bg-ink-900 border border-ink-700 text-white focus:outline-none focus:border-accent-400" />
          <button type="submit" id="admin-grant-btn" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">Grant VIP</button>
        </form>
        <div id="admin-grant-feedback" class="hidden mt-3 text-sm p-3 rounded-xl"></div>`,e.appendChild(P),setTimeout(()=>{let L=P.querySelector("#admin-grant-form"),H=P.querySelector("#admin-grant-email"),F=P.querySelector("#admin-grant-btn"),K=P.querySelector("#admin-grant-feedback");L&&L.addEventListener("submit",async ne=>{ne.preventDefault();let ce=(H.value||"").trim();if(ce){F.disabled=!0,F.textContent="Granting\u2026",K.className="hidden mt-3 text-sm p-3 rounded-xl";try{let fe=await fetch("/api/account/admin/grant-vip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:ce})}),re=await fe.json();fe.ok&&re.ok?(K.className="mt-3 text-sm p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 block",K.textContent=re.message,H.value=""):(K.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",K.textContent=re.error||"Could not grant VIP.")}catch{K.className="mt-3 text-sm p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 block",K.textContent="Network error. Try again."}finally{F.disabled=!1,F.textContent="Grant VIP"}}})},0)}if(t.isOwner){let P=document.createElement("section");P.className="card mb-10 p-6",P.innerHTML=`<h2 class="text-lg font-semibold text-white">Admin: photoreal avatars (Champion)</h2>
      <p class="mt-1 text-sm text-slate-400">Every persona look is cast automatically with a matching LiveAvatar actor \u2014 nothing to set up. Override any of them here if you like. Historical figures always use their own portraits.</p>
      <div data-body class="mt-4"><button type="button" class="btn-ghost btn-sm" data-load>Load avatar catalog</button></div>`,e.appendChild(P);let L=P.querySelector("[data-body]");P.querySelector("[data-load]").addEventListener("click",async()=>{L.innerHTML='<p class="text-sm text-slate-400"><span class="spinner mr-2"></span>Loading\u2026</p>';try{let[H,F]=await Promise.all([It("/api/avatar/catalog"),It("/api/avatar/map")]),K=re=>`<option value="none" ${!re||re==="none"?"selected":""}>\u2014 3D (no video) \u2014</option>`+H.avatars.map($=>`<option value="${At($.id)}" ${$.id===re?"selected":""}>${At($.name||$.id)}${$.own?" (yours)":""}${$.gender?` \xB7 ${At($.gender)}`:""}</option>`).join(""),ne={"man-pro":"Man \xB7 professional","woman-pro":"Woman \xB7 professional","older-man":"Older man","older-woman":"Older woman","man-casual":"Man \xB7 casual","woman-casual":"Woman \xB7 casual","teen-boy":"Young man","teen-girl":"Young woman","default-masc":"Man \xB7 default","default-fem":"Woman \xB7 default"},ce=new Map(H.avatars.map(re=>[re.id,re])),fe=re=>{let $=ce.get(re);return $?.image?`<img src="${At($.image)}" alt="" class="h-full w-full object-cover object-top" loading="lazy" />`:'<span class="text-[10px] text-slate-500">3D</span>'};L.innerHTML=`<div class="grid gap-3 sm:grid-cols-2">${F.keys.map(re=>`<div class="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-800/50 p-2.5"><div data-thumb="${At(re.key)}" class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-900">${fe(F.map[re.key])}</div><label class="block min-w-0 flex-1"><span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">${At(ne[re.key]||re.label)}</span><select class="field text-sm" data-key="${At(re.key)}">${K(F.map[re.key])}</select></label></div>`).join("")}</div>
          <div class="mt-4 flex flex-wrap items-center gap-3"><button type="button" class="btn-primary btn-sm" data-save>Save avatars</button><button type="button" class="btn-ghost btn-sm" data-auto>Auto-cast all persona looks</button><span data-msg class="text-sm text-slate-400"></span></div>`,L.querySelectorAll("select[data-key]").forEach(re=>re.addEventListener("change",()=>{let $=L.querySelector(`[data-thumb="${re.dataset.key}"]`);$&&($.innerHTML=fe(re.value))})),L.querySelector("[data-auto]").addEventListener("click",async re=>{re.target.disabled=!0;try{let $=await Ct("/api/avatar/map/auto",{});L.querySelectorAll("select[data-key]").forEach(ie=>{if(!$.map[ie.dataset.key])return;ie.value=$.map[ie.dataset.key];let ve=L.querySelector(`[data-thumb="${ie.dataset.key}"]`);ve&&(ve.innerHTML=fe(ie.value))}),L.querySelector("[data-msg]").textContent="Re-cast and saved."}catch{L.querySelector("[data-msg]").textContent="Couldn\u2019t auto-cast \u2014 try again."}finally{re.target.disabled=!1}}),L.querySelector("[data-save]").addEventListener("click",async re=>{let $={};L.querySelectorAll("select[data-key]").forEach(ie=>$[ie.dataset.key]=ie.value||"none"),re.target.disabled=!0;try{await Ct("/api/avatar/map",{map:$}),L.querySelector("[data-msg]").textContent="Saved."}catch{L.querySelector("[data-msg]").textContent="Couldn\u2019t save \u2014 try again."}finally{re.target.disabled=!1}})}catch(H){L.innerHTML=`<p class="text-sm text-amber-300">${H instanceof Lt&&H.status===503?"Add the LIVEAVATAR_API_KEY secret in Cloudflare first (see README).":"Couldn\u2019t load the LiveAvatar catalog."}</p>`}})}let v=document.createElement("section");v.className="mb-10",v.innerHTML=`
    <h2 class="font-display text-display-md text-white mb-1">Schools &amp; education</h2>
    <p class="text-slate-400 text-body-sm mb-5">Create a school, invite students with a link, and pay centrally \u2014 $6 per seat per month.</p>
    <div class="card card-lift p-6">
      <div data-orgs class="space-y-2 mb-4"><p class="text-body-sm text-slate-500">Loading\u2026</p></div>
      <button class="btn-ghost px-4 py-2 text-sm" data-create-school>+ Create a school</button>
    </div>`,e.appendChild(v);let m=v.querySelector("[data-orgs]");async function f(){try{let{orgs:P}=await It("/api/orgs/mine");if(P.length===0){m.innerHTML=`<p class="text-body-sm text-slate-500">You're not part of any school yet.</p>`;return}m.innerHTML="";for(let L of P){let H=document.createElement("a");H.href=`#/org/${L.id}`,H.className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-800/60 border border-ink-700/60 px-4 py-3 hover:border-accent-600/60 transition-colors",H.innerHTML=`
          <span class="text-2xl" aria-hidden="true">\u{1F3EB}</span>
          <span>
            <span class="block text-white font-medium">${At(L.name)}</span>
            <span class="block text-body-sm text-slate-400 capitalize">${At(L.role)} \xB7 ${L.memberCount} members \xB7 ${L.sessionsUsed}/${L.sessionsPool} sessions${L.subscriptionActive?"":' \xB7 <span class="text-amber-300">no subscription</span>'}</span>
          </span>
          <span class="ml-auto text-accent-400 text-body-sm">Open \u2192</span>`,m.appendChild(H)}}catch{m.innerHTML=`<p class="text-body-sm text-slate-500">Couldn't load your schools.</p>`}}f(),v.querySelector("[data-create-school]").addEventListener("click",async()=>{let P=null;await Gs({title:"Create a school",label:"School name",autocomplete:"organization",placeholder:"e.g. Lincoln High Debate Team",confirm:"Create school",validate:async H=>{if(!H.trim())return"Enter a name for your school.";try{P=(await Ct("/api/orgs",{name:H.trim()})).org}catch{return"Could not create the school. Please try again."}}})!=null&&P&&(location.hash=`#/org/${P.id}`)});let w=!!n?.photoreal,_=!!n?.champion,D=a&&/active|trialing/.test(a.status||"")?a.tier:null,R={debater:["300 rounds / month","All 11 practice modes","Voiced 3D opponents with real lip-sync","Scorecards + impartial judge verdicts","Unused rounds roll over"],coach:["1,000 rounds / month \u2014 3\xD7 Debater","Everything in Debater","Best for daily practice, interview season & debate teams","Unused rounds roll over"],champion:["1,000 rounds / month",w?"Photoreal video opponents \u2014 150 min/month":"Photoreal video opponents (rolling out)","Strongest reasoning model \u2014 sharper opponents, deeper judge feedback","Everything in Coach"]},T=document.createElement("section");T.id="plans",T.innerHTML=`
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
    <div class="grid sm:grid-cols-3 gap-4" id="pack-grid"></div>`,e.appendChild(b);let x=e.querySelector("#tier-grid"),C=e.querySelector("#pack-grid");async function U(P,L,H){H.disabled=!0;let F=H.textContent;H.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Redirecting\u2026</span>';try{bs("begin_checkout",{kind:P,item:L});let{url:K}=await Ct("/api/billing/checkout",{kind:P,item:L});window.location.href=K}catch(K){if(H.disabled=!1,H.textContent=F??"",K instanceof Lt&&K.status===409)try{let{url:ne}=await Ct("/api/billing/portal");window.location.href=ne;return}catch{}$i("Couldn\u2019t start checkout","Please try again.")}}for(let P of i.tiers){let L=P.id==="champion",H=P.id==="coach",F=D===P.id,K=R[P.id]||[`${(P.rounds||P.debates).toLocaleString()} rounds / month`],ne=document.createElement("div");ne.className=`card relative flex flex-col p-6 ${L?"border-amber-400/50 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_18px_50px_-20px_rgba(251,191,36,0.35)]":H?"border-accent-600/50":""}`,ne.innerHTML=`
      ${L?'<span class="badge mb-3 self-start border-amber-400/40 bg-amber-400/15 text-amber-200">Best experience</span>':H?'<span class="badge mb-3 self-start border-accent-500/40 bg-accent-500/10 text-accent-300">Most popular</span>':'<span class="mb-3 h-[22px]"></span>'}
      <div class="text-lg font-bold text-white">${At(ic(P.name))}</div>
      <div class="mb-4 mt-1"><span class="text-3xl font-extrabold tracking-tight ${L?"text-amber-300":"text-white"}">${At(Sh(P.price,P.currency))}</span><span class="text-sm text-slate-500"> /${At(P.interval)}</span></div>
      <ul class="mb-6 space-y-2 text-sm text-slate-300">${K.map(fe=>`<li class="flex gap-2"><span class="${L?"text-amber-300":"text-accent-400"}" aria-hidden="true">\u2713</span><span>${At(fe)}</span></li>`).join("")}</ul>
      <button class="${F?"btn-ghost":L?"btn-primary !bg-amber-400 !text-black hover:!bg-amber-300":H?"btn-primary":"btn-ghost"} mt-auto py-2.5 text-sm" ${F?"disabled":""}>${F?"Current plan":`Choose ${At(ic(P.name))}`}</button>`;let ce=ne.querySelector("button");F||ce.addEventListener("click",()=>void U("subscription",P.id,ce)),x.appendChild(ne)}/plans=1/.test(location.hash)&&setTimeout(()=>T.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),150),i.tiers.length===0&&(x.innerHTML='<p class="text-body-sm text-slate-500 col-span-full">No subscription tiers are available right now.</p>');for(let P of i.packs){let L=document.createElement("div");L.className="card p-6 flex flex-col transition-all duration-200 ease-out-expo hover:-translate-y-1 hover:shadow-lift",L.innerHTML=`
      <div class="font-semibold text-white text-lg">${At(ic(P.name))}</div>
      <div class="mt-2 mb-1"><span class="font-display text-display-md text-white">${At(Sh(P.price,P.currency))}</span></div>
      <p class="text-body-sm text-slate-300 mb-3">${(P.rounds||P.credits).toLocaleString()} sparring rounds \xB7 Credits roll over & never expire</p>
      <button class="btn-ghost mt-auto px-4 py-2.5 text-sm">Buy pack</button>`;let H=L.querySelector("button");H.addEventListener("click",()=>void U("pack",P.id,H)),C.appendChild(L)}i.packs.length===0&&(C.innerHTML='<p class="text-body-sm text-slate-500 col-span-full">No round packs are available right now.</p>'),e.appendChild(v);let V=document.createElement("section");V.className="mb-10",V.innerHTML=`<h2 class="font-display text-display-md text-white mb-1">Delete account</h2>
    <p class="text-slate-400 text-body-sm mb-4">Permanently deletes your account, sessions and scores. Any subscription is cancelled at the end of its billing period. This can\u2019t be undone.</p>
    <button type="button" class="btn-danger btn-sm" data-delete-account>Delete my account\u2026</button>`,e.appendChild(V),V.querySelector("[data-delete-account]").addEventListener("click",async()=>{if(await Gs({title:"Delete your account?",body:"All your sessions, scores and history will be erased. This cannot be undone.",label:"Enter your password to confirm",type:"password",autocomplete:"current-password",username:n?.email??t.email??"",confirm:"Delete everything",kind:"danger",cancel:"Keep my account",validate:async L=>{if(!L)return"Enter your password to confirm.";try{await Ct("/api/auth/delete-account",{password:L})}catch(H){return H instanceof Lt&&H.status===401?"That password didn\u2019t match.":"Couldn\u2019t delete the account \u2014 please email support@getadversaryai.com."}}})!=null){try{localStorage.clear()}catch{}location.hash="#/signup",location.reload()}});let G=e.querySelector("#portal-btn");G&&G.addEventListener("click",async()=>{G.disabled=!0,G.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Opening\u2026</span>';try{let{url:P}=await Ct("/api/billing/portal");window.location.href=P}catch{G.disabled=!1,G.textContent="Manage billing",$i("Couldn\u2019t open the billing portal","Please try again.")}})}function Pa(r,e){r.className="error-box mb-5 animate-fade-in",r.setAttribute("role","alert"),r.innerHTML=`<span aria-hidden="true" class="shrink-0 mt-0.5 text-danger">${el}</span><span></span>`,r.querySelector("span:last-child").textContent=e}function rc(r,e){let t=e?.error;return t==="code_exhausted"||r===410?"This invite link has reached its maximum number of uses. Ask your teacher for a new one.":t==="code_expired"?"This invite link has expired. Ask your teacher for a new one.":t==="already_member"?"You are already a member of this school.":t==="seats_exhausted"||t==="subscription_inactive"?"This school has filled all of its seats. Ask your teacher or school admin to purchase more seats, then try again.":t==="email_taken"||r===409?"An account with that email already exists. Log in first, then open the invite link again to join.":r===404?"We couldn't find that invite. Check the link and try again.":"Something went wrong. Please try again."}async function R_(r,e){let t=document.createElement("div");t.className="w-full max-w-md animate-fade-up",r.appendChild(vd()),r.appendChild(t),t.innerHTML=`
    <div class="text-center mb-8">
      <div class="text-5xl mb-4" aria-hidden="true">\u{1F3EB}</div>
      <h1 class="font-display text-display-lg text-white">Joining\u2026</h1>
      <p class="text-slate-400 mt-2 text-body-md">Checking your invite.</p>
    </div>`;let i;try{i=await It(`/api/orgs/join/${encodeURIComponent(e)}`)}catch(c){let d=c instanceof Lt?c.status:0;t.innerHTML=`
      <div class="text-center mb-8">
        <div class="text-5xl mb-4" aria-hidden="true">\u{1F3EB}</div>
        <h1 class="font-display text-display-lg text-white">Invite not valid</h1>
        <p class="text-slate-400 mt-2 text-body-md">${rc(d,c instanceof Lt?c.body:null)}</p>
        <a href="#/" class="link font-medium mt-6 inline-block">Back to AdversaryAI</a>
      </div>`;return}let n=i.role==="teacher"?"teacher":"student",s=await $s();t.innerHTML=`
    <div class="text-center mb-8">
      <div class="text-5xl mb-4" aria-hidden="true">\u{1F3EB}</div>
      <h1 class="font-display text-display-lg text-white">Join ${nc(i.orgName)}</h1>
      <p class="text-slate-400 mt-2 text-body-md">You've been invited as a <span class="text-white font-medium">${n}</span>. Your school covers the cost \u2014 this is free for you.</p>
    </div>
    <div class="card p-6 sm:p-8 relative overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/60 to-transparent" aria-hidden="true"></div>
      <div class="hidden mb-5" data-error></div>
      <div data-body></div>
    </div>`;let a=t.querySelector("[data-error]"),o=t.querySelector("[data-body]");if(s){o.innerHTML=`
      <p class="text-body-sm text-slate-400 mb-5">Signed in as <span class="text-white">${nc(s.email)}</span></p>
      <button class="btn-primary w-full py-3" data-join>Join ${nc(i.orgName)}</button>`;let c=o.querySelector("[data-join]");c.addEventListener("click",async()=>{c.disabled=!0,c.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Joining\u2026</span>',a.classList.add("hidden");try{await Ct("/api/orgs/join",{code:i.code}),Ws(null),await $s(!0),location.hash="#/"}catch(d){c.disabled=!1,c.textContent=`Join ${i.orgName}`,Pa(a,rc(d instanceof Lt?d.status:0,d instanceof Lt?d.body:null))}});return}o.innerHTML=`
    <form novalidate>
      <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="join-email">Email</label>
      <input id="join-email" type="email" required autocomplete="email" placeholder="you@example.com" class="field mb-4" />
      <label class="block text-body-sm font-medium text-slate-300 mb-1.5" for="join-password">Password</label>
      <input id="join-password" type="password" required autocomplete="new-password" minlength="8" placeholder="Minimum 8 characters" class="field mb-6" />
      <button type="submit" class="btn-primary w-full py-3">Create account &amp; join</button>
    </form>
    <p class="text-center text-body-sm text-slate-500 mt-6">Already have an account? <a href="#/login" class="link font-medium">Log in</a>, then open this link again.</p>`;let l=o.querySelector("form");l.addEventListener("submit",async c=>{c.preventDefault();let d=l.querySelector("#join-email").value.trim(),u=l.querySelector("#join-password").value,h=l.querySelector('button[type="submit"]');if(a.classList.add("hidden"),!d||!u){Pa(a,"Enter your email and password.");return}if(u.length<8){Pa(a,"Password must be at least 8 characters.");return}h.disabled=!0,h.innerHTML='<span class="spinner" aria-hidden="true"></span><span>Creating your account\u2026</span>';try{await Ct("/api/auth/signup",{email:d,password:u,inviteCode:i.code});let p=await It("/api/auth/me");Ws(p),location.hash="#/"}catch(p){h.disabled=!1,h.textContent="Create account & join",Pa(a,rc(p instanceof Lt?p.status:0,p instanceof Lt?p.body:null))}})}function nc(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ii(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function wh(r){if(!r)return"Never";let e=new Date(r);return Number.isNaN(e.getTime())?r:e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function sc(r){let e={owner:"bg-amber-500/15 text-amber-300 border-amber-500/30",teacher:"bg-sky-500/15 text-sky-300 border-sky-500/30",student:"bg-slate-500/15 text-slate-300 border-slate-500/30"};return`<span class="inline-block text-caption font-semibold uppercase tracking-wider border rounded-full px-2.5 py-0.5 ${e[r]??e.student}">${ii(r)}</span>`}async function Vp(r,e){r.innerHTML='<div class="max-w-4xl mx-auto px-4 py-6 sm:py-10" id="org-root"></div>';let t=r.querySelector("#org-root");t.appendChild(tl("page"));let i=new URLSearchParams(location.hash.split("?")[1]??"").get("checkout"),n;try{n=(await It(`/api/orgs/${encodeURIComponent(e)}`)).org}catch(w){t.innerHTML="";let _=w instanceof Lt&&w.status===403?"You are not a member of this school.":"Check your connection and try again.";t.appendChild(jn(`Couldn't load this school. ${_}`,()=>void Vp(r,e)));return}let s=n.role==="owner",a=s||n.role==="teacher",o=n.sessionsPool>0?Math.min(100,n.sessionsUsed/n.sessionsPool*100):0;t.innerHTML="",i==="success"?t.innerHTML+='<div class="card p-4 mb-6 border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-body-sm" role="status">Payment successful \u2014 your seats are active. It can take a minute for the new quota to appear.</div>':i==="cancelled"&&(t.innerHTML+='<div class="card p-4 mb-6 border-ink-600 text-slate-300 text-body-sm" role="status">Checkout was cancelled. No payment was taken.</div>');let l=document.createElement("div");l.className="mb-8 flex flex-wrap items-start justify-between gap-4",l.innerHTML=`
    <div>
      <p class="eyebrow mb-2">School</p>
      <h1 class="font-display text-display-lg text-white flex items-center gap-3">${ii(n.name)} ${sc(n.role)}</h1>
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
    ${n.subscriptionActive?u?`<div class="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-body-sm px-4 py-3 mb-5" role="status">All ${ii(String(n.seatCount))} seats are filled \u2014 new members are blocked until you purchase more seats.</div>`:`<p class="text-body-sm text-slate-500 mb-5">${ii(String(n.seatCount-n.memberCount))} of ${ii(String(n.seatCount))} seats still open.</p>`:'<div class="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-body-sm px-4 py-3 mb-5" role="status">No active subscription \u2014 new members are blocked from joining until you purchase seats.</div>'}
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
        <code class="text-accent-300 font-mono text-sm">${ii(_.code)}</code>
        ${sc(_.role)}
        <span class="text-body-sm text-slate-400">${_.uses}/${_.max_uses} used${A===0?' \xB7 <span class="text-amber-300">exhausted</span>':""}</span>
        <span class="text-body-sm text-slate-500">expires ${ii(wh(_.expires_at))}</span>
        <div class="ml-auto flex gap-2">
          <button class="btn-ghost px-3 py-1.5 text-sm" data-copy>Copy link</button>
          <button class="btn-ghost px-3 py-1.5 text-sm text-danger" data-revoke>Revoke</button>
        </div>`,D.querySelector("[data-copy]").addEventListener("click",async R=>{let T=R.currentTarget;try{await navigator.clipboard.writeText(_.url),T.textContent="Copied!",setTimeout(()=>{T.textContent="Copy link"},1500)}catch{Gs({title:"Copy this invite link",value:_.url,readOnly:!0,confirm:"Done",cancel:""})}}),D.querySelector("[data-revoke]").addEventListener("click",async()=>{if(await Ir({title:"Revoke this invite?",body:`Nobody new can join with <b>${ii(_.code)}</b> after this.`,actions:[{label:"Revoke invite",value:1,kind:"danger"},{label:"Cancel",value:null}]}))try{await oc(`/api/orgs/${encodeURIComponent(n.id)}/invites/${encodeURIComponent(_.code)}`),await M()}catch{$i("Couldn\u2019t revoke the invite","Please try again.")}}),h.appendChild(D)}},g=d.querySelector("[data-create]");g.addEventListener("submit",async w=>{w.preventDefault();let _=g.querySelector('button[type="submit"]');_.disabled=!0;try{let D=await Ct(`/api/orgs/${encodeURIComponent(n.id)}/invites`,{role:g.querySelector("#inv-role").value,maxUses:Number(g.querySelector("#inv-uses").value)||50,expiresInDays:Number(g.querySelector("#inv-days").value)||30}),A=!1;try{await navigator.clipboard.writeText(D.url),A=!0}catch{}Gs({title:A?"Invite link created and copied":"Invite link created",body:A?"It\u2019s on your clipboard \u2014 share it with your students.":"Copy it and share it with your students.",value:D.url,readOnly:!0,confirm:"Done",cancel:""}),await M()}catch{$i("Couldn\u2019t create the invite","Please try again.")}finally{_.disabled=!1}});let v=document.createElement("div");v.className="card card-lift p-6 mb-6",v.innerHTML=`
    <h2 class="font-display text-display-md text-white mb-1">Members</h2>
    <p class="text-slate-400 text-body-sm mb-5">${ii(String(n.memberCount))} people in ${ii(n.name)}.</p>
    <div data-list class="space-y-2"></div>`,t.appendChild(v);let m=v.querySelector("[data-list]"),f=w=>{m.innerHTML="";for(let _ of w){let D=document.createElement("div");D.className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-800/60 border border-ink-700/60 px-4 py-3",D.innerHTML=`
        <span class="text-white text-body-md">${ii(_.email)}</span>
        ${sc(_.role)}
        <span class="text-body-sm text-slate-500">joined ${ii(wh(_.joined_at))}</span>
        ${s&&_.role!=="owner"?'<button class="btn-ghost px-3 py-1.5 text-sm text-danger ml-auto" data-remove>Remove</button>':""}`;let A=D.querySelector("[data-remove]");A&&A.addEventListener("click",async()=>{if(await Ir({title:"Remove this member?",body:`<b>${ii(_.email)}</b> will lose access to ${ii(n.name)}.`,actions:[{label:"Remove member",value:1,kind:"danger"},{label:"Cancel",value:null}]}))try{await oc(`/api/orgs/${encodeURIComponent(n.id)}/members/${encodeURIComponent(_.id)}`),await M()}catch{$i("Couldn\u2019t remove that member","Please try again.")}}),m.appendChild(D)}};async function M(){try{let w=await It(`/api/orgs/${encodeURIComponent(e)}`);p(w.org.invites??[]),f(w.org.members??[])}catch{}}p(n.invites??[]),f(n.members??[])}var Cn;async function $s(r=!1){if(Cn!==void 0&&!r)return Cn;try{Cn=await It("/api/auth/me")}catch(e){if(e instanceof Lt&&e.status===401)Cn=null;else throw e}return Cn}function Ws(r){Cn=r}var Ii=document.getElementById("app");am();function ac(r){let e=document.createElement("header");e.className="app-header border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20",e.innerHTML=`
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
    </div>`,e.querySelector("#theme-toggle-slot").appendChild(lc()),e.querySelector("#theme-toggle-slot-mobile").appendChild(lc()),(function(){if(!(r&&(r.isOwner||r.plan==="owner")))return;function l(u){let h=document.createElement("button");h.type="button",h.className=u?"w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between mb-1.5":"px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all";function p(){(document.cookie.match(/adversaryai_admin_mode=([^;]+)/)?.[1]||localStorage.getItem("adversaryai_admin_mode")||"premium").toLowerCase()==="regular"?(h.style.cssText="border-color:rgba(56,189,248,0.5);background:rgba(56,189,248,0.12);color:#7dd3fc;cursor:pointer;",h.innerHTML=u?'<span>\u{1F451} Admin Mode:</span><span class="font-bold text-cyan-300">\u26A1 Regular (Flash)</span>':'<span style="color:#fbbf24">\u{1F451}</span><span>\u26A1 Regular (Flash)</span>'):(h.style.cssText="border-color:rgba(251,191,36,0.5);background:rgba(251,191,36,0.12);color:#fde68a;cursor:pointer;",h.innerHTML=u?'<span>\u{1F451} Admin Mode:</span><span class="font-bold text-amber-300">\u2726 Premium (Pro)</span>':'<span style="color:#fbbf24">\u{1F451}</span><span>\u2726 Premium (Pro)</span>')}return p(),h.addEventListener("click",async()=>{let v=(document.cookie.match(/adversaryai_admin_mode=([^;]+)/)?.[1]||localStorage.getItem("adversaryai_admin_mode")||"premium").toLowerCase()==="regular"?"premium":"regular";document.cookie="adversaryai_admin_mode="+v+";path=/;max-age=31536000;SameSite=Lax;Secure",localStorage.setItem("adversaryai_admin_mode",v);try{await fetch("/api/account/admin-mode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:v})})}catch{}document.querySelectorAll("[data-adm-btn]").forEach(m=>m.__sc&&m.__sc()),$i("Switched to "+(v==="regular"?"Regular Mode (DeepSeek-V4-Flash)":"Premium Mode (DeepSeek-V4-Pro)"))}),h.setAttribute("data-adm-btn","1"),h.__sc=p,h}let c=e.querySelector("#admin-mode-slot"),d=e.querySelector("#admin-mode-slot-mobile");c&&c.appendChild(l(!1)),d&&d.appendChild(l(!0))})();let t=async()=>{try{await Ct("/api/auth/logout")}finally{Ws(null),location.hash="#/login"}};e.querySelector("#logout-btn").addEventListener("click",t),e.querySelector("#logout-btn-mobile").addEventListener("click",t);let i=e.querySelector("#menu-btn"),n=e.querySelector("#mobile-menu"),s=o=>{n.classList.toggle("hidden",!o),i.setAttribute("aria-expanded",String(o)),i.setAttribute("aria-label",o?"Close menu":"Open menu")};i.addEventListener("click",()=>s(n.classList.contains("hidden"))),n.querySelectorAll("a").forEach(o=>o.addEventListener("click",()=>s(!1))),Ii.innerHTML="",Ii.appendChild(e);let a=document.createElement("main");a.className="flex-1 w-full",a.appendChild(r),Ii.appendChild(a)}function Mh(r){Ii.innerHTML="";let e=document.createElement("main");e.className="flex-1 w-full flex items-center justify-center px-4 py-10",e.appendChild(r),Ii.appendChild(e)}function Th(r){let e=document.createElement("header");e.className="app-header border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20",e.innerHTML=`<div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
    <a href="#/" class="flex shrink-0 items-center gap-2" aria-label="AdversaryAI home">
      <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true" class="shrink-0"><rect width="512" height="512" rx="112" fill="#0d0f14"/><polygon points="256,104 400,392 112,392" fill="none" stroke="#e8392e" stroke-width="34" stroke-linejoin="round"/><g fill="#e8392e"><rect x="165" y="264" width="22" height="44" rx="11"/><rect x="193" y="244" width="22" height="84" rx="11"/><rect x="221" y="226" width="22" height="120" rx="11"/><rect x="249" y="212" width="22" height="148" rx="11"/><rect x="277" y="230" width="22" height="112" rx="11"/><rect x="305" y="248" width="22" height="76" rx="11"/><rect x="333" y="266" width="22" height="40" rx="11"/></g></svg>
      <span class="font-display text-lg tracking-tight">Adversary<span class="text-accent-500">AI</span></span>
    </a>
    <nav class="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
      <a href="#/arena" class="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-accent-400 hover:text-accent-300 sm:flex"><span class="text-base" aria-hidden="true">\u{1F525}</span> Community Arena</a>
      <a href="#/login" class="whitespace-nowrap rounded-lg px-2 py-2.5 text-slate-300 hover:bg-ink-800 hover:text-white sm:px-3">Log in</a>
      <a href="#/signup" class="btn-primary btn-sm whitespace-nowrap px-3 text-xs sm:text-sm"><span class="min-[360px]:hidden">Try free</span><span class="max-[359px]:hidden">Start Free Trial</span></a>
    </nav>
  </div>`,Ii.innerHTML="",Ii.appendChild(e);let t=document.createElement("main");t.className="flex-1 w-full",t.appendChild(r),Ii.appendChild(t)}async function C_(r,e){r.innerHTML=`<div class="max-w-4xl mx-auto px-4 py-8 text-center text-slate-400">
    <div class="inline-block animate-spin text-2xl mb-3">\u26A1</div>
    <p>Loading spectator match\u2026</p>
  </div>`;let t;try{t=await It("/api/public/debate/"+encodeURIComponent(e))}catch{r.innerHTML=`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <div class="text-4xl mb-3">\u{1F512}</div>
      <h1 class="text-2xl font-bold text-white mb-2">Debate Not Available</h1>
      <p class="text-sm text-slate-400 mb-6">This debate may be private or has been removed by the author.</p>
      <a href="#/arena" class="btn-primary text-sm">Browse Public Arena</a>
    </div>`;return}let i=new Map;try{i=new Map((await qn()).map(A=>[A.id,A]))}catch{}let n=A=>i.get(A)?.name||(A?A[0].toUpperCase()+A.slice(1):"Debate"),{debate:s,turns:a,verdict:o,votes:l,userVote:c,reactions:d,userReactions:u}=t,h=l||{you:0,opponent:0,draw:0,total:0},p=c,g=d||{},v=new Set(u||[]),m=s.personaLabel||s.personality||"AI Sparring Partner",f=`${location.origin}/debate/${s.id}`;r.isConnected&&(document.title=`Who won? ${s.topic||"Arena match"} \xB7 AdversaryAI`);function M(){let A=h.total||0,R=A>0?Math.round(h.you/A*100):50,T=A>0?100-R:50,b=[{key:"fire",emoji:"\u{1F525}",label:"Brilliant"},{key:"skull",emoji:"\u{1F480}",label:"Savage"},{key:"brain",emoji:"\u{1F9E0}",label:"High IQ"},{key:"flag",emoji:"\u{1F6A9}",label:"Fallacy"},{key:"clap",emoji:"\u{1F44F}",label:"Respect"}];return`
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
          <span class="text-xs text-slate-500">Match held on ${Rt(zd(s.createdAt))}</span>
        </div>
        <h1 class="font-display text-2xl sm:text-3xl text-white font-bold mb-4 leading-tight">${Rt(s.topic)}</h1>
        <div class="flex items-center gap-3 text-sm text-slate-300">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center border border-accent-500/40">${Vt('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',16)}</span>
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
        
        <div class="rounded-xl border ${us(o).tone} px-5 py-4 mb-6 text-center">
          <div class="mb-2 flex justify-center opacity-90">${us(o).icon}</div>
          <div class="font-display text-2xl font-semibold">${Rt(us(o).title)}</div>
          <p class="text-sm opacity-80 mt-1">${Rt(us(o).sub)}</p>
        </div>

        <div class="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Human Debater</div>
            <div class="space-y-4">
              ${ud.map(([x,C])=>Jo(C,o.you?.[x]??null)).join("")}
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">${Rt(m)}</div>
            <div class="space-y-4">
              ${ud.map(([x,C])=>Jo(C,o.opponent?.[x]??null)).join("")}
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
              <div class="${zp(C)}">
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
    </div>`}r.innerHTML=M();let w=r.querySelector("#copy-watch-btn");w&&w.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(f),w.textContent="Copied!",setTimeout(()=>{w.textContent="Copy Link"},2e3)}catch{Gs({title:"Share this match",value:f,readOnly:!0,confirm:"Done",cancel:""})}}),r.querySelectorAll(".speak-turn-btn").forEach(A=>{A.addEventListener("click",()=>{let R=decodeURIComponent(A.getAttribute("data-play-text")||"");if(R)if("speechSynthesis"in window){window.speechSynthesis.cancel();let T=new SpeechSynthesisUtterance(R);T.rate=1.05,T.pitch=.95,A.textContent="\u{1F50A} Speaking\u2026",T.onend=()=>{A.textContent="\u{1F50A} Listen"},T.onerror=()=>{A.textContent="\u{1F50A} Listen"},window.speechSynthesis.speak(T)}else $i("Can\u2019t read this aloud","Speech isn\u2019t supported in this browser.")})});let _=r.querySelector("#vote-buttons-grid");_&&_.querySelectorAll(".vote-action-btn").forEach(A=>{A.addEventListener("click",async()=>{let R=A.getAttribute("data-vote");if(R){_.querySelectorAll(".vote-action-btn").forEach(T=>{T.disabled=!0});try{let T=await Ct("/api/public/debate/"+encodeURIComponent(s.id)+"/vote",{vote:R});if(T.ok&&T.votes){h=T.votes,p=T.vote;let b=h.total||0,x=b>0?Math.round(h.you/b*100):50,C=b>0?100-x:50,U=r.querySelector("#user-vote-bar"),V=r.querySelector("#opp-vote-bar"),G=r.querySelector("#vote-count-label");U&&(U.style.width=x+"%"),V&&(V.style.width=C+"%"),G&&(G.textContent=String(b)),_.querySelectorAll(".vote-action-btn").forEach(P=>{P.getAttribute("data-vote")===p?P.className="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all border-accent-500 bg-accent-500/20 text-white ring-2 ring-accent-500/50":P.className="vote-action-btn px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all border-ink-700 bg-ink-800 text-slate-200 hover:border-slate-500"})}}catch{$i("Couldn\u2019t record your vote","Please try again.")}finally{_.querySelectorAll(".vote-action-btn").forEach(T=>{T.disabled=!1})}}})});let D=r.querySelector("#reactions-tray");D&&D.querySelectorAll(".react-pill-btn").forEach(A=>{A.addEventListener("click",async()=>{let R=A.getAttribute("data-react");if(R)try{let T=await Ct("/api/public/debate/"+encodeURIComponent(s.id)+"/react",{reaction:R});T.ok&&T.reactions&&(g=T.reactions,T.active?v.add(R):v.delete(R),D.querySelectorAll("[data-react-count]").forEach(b=>{let x=b.getAttribute("data-react-count");x&&g[x]!==void 0&&(b.textContent=String(g[x]))}),T.active?A.className="react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all border-accent-500 bg-accent-500/25 text-white ring-1 ring-accent-500":A.className="react-pill-btn px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all border-ink-700 bg-ink-800/80 text-slate-300 hover:border-slate-500")}catch{}})})}async function md(r){r.innerHTML=`<div class="max-w-6xl mx-auto px-4 py-8 text-center text-slate-400">
    <div class="inline-block animate-spin text-2xl mb-3">\u26A1</div>
    <p>Loading Community Arena\u2026</p>
  </div>`;let e=[];try{let o=await It("/api/public/debates");e=Array.isArray(o)?o:o.debates||[]}catch{r.innerHTML=`<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 class="text-2xl font-bold text-white mb-2">Couldn't Load Arena</h1>
      <p class="text-sm text-slate-400 mb-6">Check your internet connection and try again.</p>
      <button type="button" id="arena-retry" class="btn-primary text-sm">Try again</button>
    </div>`,r.querySelector("#arena-retry").addEventListener("click",()=>md(r));return}let t=new Map;try{t=new Map((await qn()).map(o=>[o.id,o]))}catch{}let i=o=>t.get(o)?.name||(o?o[0].toUpperCase()+o.slice(1):"Debate");function n(o,l="all"){if(o.length===0){let c=l==="all";return`
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
              <span>${Rt(zd(c.createdAt))}</span>
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
  </div>`;let s=r.querySelector("#arena-filter-bar"),a=r.querySelector("#arena-feed-grid");s&&a&&s.querySelectorAll("button").forEach(o=>{o.addEventListener("click",()=>{s.querySelectorAll("button").forEach(u=>u.setAttribute("aria-pressed",String(u===o)));let l=o.getAttribute("data-filter"),c={debate:["debate","rapbattle"],historical:["historical"],sales:["sales","negotiation"]},d=l==="all"?e:e.filter(u=>(c[l]||[l]).includes(u.mode));a.innerHTML=n(d,l)})})}async function Qo(){window.__sessionCleanup?.();let r=location.hash.replace(/^#/,"")||"/",e=r.startsWith("/")?r:"/"+r,t=e.split("?")[0].replace(/\/+$/,"")||"/",i=await $s()!==null,n=t.match(/^\/join\/([A-Za-z0-9]+)$/),s={"/login":"Log in","/signup":"Sign up","/history":"History","/account":"Account","/arena":"Community Arena"}[t]||[[/^\/setup\//,"Set up a session"],[/^\/session\//,"Session"],[/^\/watch\//,"Arena match"],[/^\/org\//,"School"],[/^\/join\//,"Join a school"]].find(([p])=>p.test(t))?.[1];if(document.title=s?`${s} \xB7 AdversaryAI`:"AdversaryAI \u2014 Practice against anyone",n){let p=document.createElement("div");Mh(p),await R_(p,n[1].toUpperCase());return}let a=t.match(/^\/watch\/([A-Za-z0-9_-]+)$/),o=t==="/arena";if(a){let p=document.createElement("div");i?ac(p):Th(p),await C_(p,a[1]);return}if(o){let p=document.createElement("div");i?ac(p):Th(p),await md(p);return}if(t==="/login"||t==="/signup"){if(i){let g=new URLSearchParams(e.split("?")[1]||"").get("next");location.hash=g&&/^\/[\w\-\/?=&%.]*$/.test(g)?"#"+g:"#/";return}let p=document.createElement("div");Mh(p),t==="/login"?um(p):hm(p);return}if(!i){let p=e!=="/"?e:"";location.hash=p?`#/signup?next=${encodeURIComponent(p)}`:"#/signup";return}if(t==="/debate"){location.hash="#/";return}let l=document.createElement("div");ac(l);let c={"/":()=>pm(l),"/history":()=>hd(l),"/account":()=>pd(l),"/arena":()=>md(l)},d=t.match(/^\/session\/([^/?]+)(?:\?(.+))?$/),u=t.match(/^\/setup\/([^/]+)$/),h=t.match(/^\/org\/([^/?]+)(?:\?(.+))?$/);try{if(u)await Nm(l,decodeURIComponent(u[1]));else if(h)await Vp(l,decodeURIComponent(h[1]));else if(d)await Hp(l,decodeURIComponent(d[1]));else{let p=c[t];p?await p():(document.title="Page not found \xB7 AdversaryAI",l.innerHTML=`<div class="max-w-2xl mx-auto px-4 py-16 text-center text-slate-400">
          <h1 class="text-3xl font-display text-white mb-3">Page not found</h1>
          <p class="mb-6">That corner of the arena doesn't exist.</p>
          <a href="#/" class="btn-primary">Back to practice</a>
        </div>`)}}catch(p){console.error("route render failed",p),document.title="Something went wrong \xB7 AdversaryAI";let g=document.createElement("a");g.href="#/",g.className="link -mt-8 block pb-10 text-center text-sm",g.textContent="Back to practice",l.replaceChildren(jn("This page hit an unexpected error. Try again, or head back to practice.",()=>Qo().catch(()=>{})),g)}}window.addEventListener("hashchange",()=>{Qo().catch(r=>{console.error("route failed",r),Ii.innerHTML="",Ii.appendChild(jn("Couldn\u2019t load that page. Check your connection and try again.",()=>Qo().catch(()=>{})))})});Qo().catch(r=>{console.error("initial route failed",r),Ii.innerHTML=`<div class="max-w-xl mx-auto px-4 py-20 text-center text-slate-400">
    <h1 class="text-2xl text-white mb-3">AdversaryAI couldn't start</h1>
    <p>Check your connection and reload.</p>
  </div>`});"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})});
