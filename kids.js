/* ==========================================================================
   BrainWhim · Kids' Corner kit (Nov 6, 2026)  ·  window.BWK
   The kids' header (Home · Sound · Read to me · My stuff · Grown-ups), the grown-ups gate,
   device-only name, read-aloud with on-device voices only, little sounds, the break reminder.
   Safety: nothing here talks to a server. Everything is kept in this browser (localStorage).
   Nov 7: Finn's voice and speech bubble (BWK.finn); voices ranked best-first (Premium/Enhanced).
   Nov 8: word timing measured from each clip; name clips; Read to me plays recorded lines (BWK.lines);
   multicolor stardust.
   ========================================================================== */
(function(){
  "use strict";
  var LS = {
    get:function(k,d){try{var v=localStorage.getItem("bwk."+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
    set:function(k,v){try{localStorage.setItem("bwk."+k,JSON.stringify(v));}catch(e){}}
  };
  var cfg = {}, $ = function(s,r){return (r||document).querySelector(s);};

  /* ---------------- icons ---------------- */
  var I = {
    back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>',
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/></svg>',
    sound:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="k-w" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    mute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
    read:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1V19c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6.5V20"/></svg>',
    stuff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/></svg>',
    gu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>'
  };

  /* ---------------- sound (Web Audio; wakes on the first tap) ---------------- */
  var ac = null, soundOn = LS.get("sound", true);
  function wake(){
    if(!ac){var C=window.AudioContext||window.webkitAudioContext; if(!C) return null; ac=new C();}
    if(ac.state==="suspended") ac.resume();
    return ac;
  }
  document.addEventListener("pointerdown", wake, {capture:true, passive:true});
  function tone(f, t0, dur, vol, type){
    var o=ac.createOscillator(), g=ac.createGain();
    o.type=type||"sine"; o.frequency.setValueAtTime(f,t0);
    g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0+dur+0.05);
  }
  function noise(t0, dur, vol, f0, f1){
    var n=Math.floor(ac.sampleRate*dur), b=ac.createBuffer(1,n,ac.sampleRate), d=b.getChannelData(0);
    for(var i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    var s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain();
    s.buffer=b; f.type="bandpass"; f.Q.value=1.2; f.frequency.setValueAtTime(f0,t0); f.frequency.exponentialRampToValueAtTime(f1,t0+dur);
    g.gain.setValueAtTime(vol,t0); s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t0);
  }
  var SFX = {
    tap:function(t){tone(880,t,.12,.05);tone(1320,t+.02,.1,.025);},
    open:function(t){tone(523,t,.18,.05,"triangle");tone(784,t+.06,.22,.04,"triangle");},
    close:function(t){tone(660,t,.12,.04,"triangle");tone(440,t+.05,.16,.035,"triangle");},
    chime:function(t){[784,988,1175,1568].forEach(function(f,i){tone(f,t+i*.08,.5,.045);tone(f*2,t+i*.08,.25,.012);});},
    whoosh:function(t){noise(t,.55,.18,400,2400);tone(392,t+.2,.4,.03,"triangle");tone(587,t+.32,.45,.03,"triangle");},
    sleepy:function(t){tone(523,t,.5,.04,"triangle");tone(440,t+.28,.55,.035,"triangle");tone(392,t+.6,.8,.03,"triangle");},
    nope:function(t){tone(330,t,.18,.05,"triangle");tone(262,t+.12,.25,.045,"triangle");},
    yay:function(t){[523,659,784,1047].forEach(function(f,i){tone(f,t+i*.07,.3,.05,"triangle");});},
    tick:function(t){tone(1500,t,.04,.025,"square");},
    sparkle:function(t){ noise(t,.32,.05,3000,9000); [1568,2093,2637,3136,2637].forEach(function(f,i){tone(f,t+i*.045,.32,.022);tone(f*1.5,t+i*.045+.02,.18,.008);}); }
  };
  function sfx(name){
    if(!soundOn || !SFX[name]) return;
    var c=wake(); if(!c || c.state!=="running") return;
    SFX[name](c.currentTime+0.01);
  }

  /* ---------------- read to me (on-device voices only) ---------------- */
  var readOn = LS.get("read", false), voice = null;
  // On-device English voices only, best first: downloaded Premium/Enhanced voices, then the gentle standard ones.
  // Novelty voices (Bubbles, Zarvox, Whisper...) are never used.
  var ODD = /bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|kathy|princess|deranged|hysterical|pipe organ|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;
  var PREF = ["Ava","Zoe","Samantha","Allison","Nicky","Susan","Evan","Microsoft Aria","Microsoft Jenny","Microsoft Ana","Google US English","Karen","Tessa","Moira","Serena","Daniel","Microsoft Zira"];
  function rankVoices(){
    if(!("speechSynthesis" in window)) return [];
    return speechSynthesis.getVoices().filter(function(v){return v.localService && /^en(-|_|$)/i.test(v.lang) && !ODD.test(v.name);})
      .map(function(v){ var s=0, n=v.name;
        if(/premium/i.test(n)) s+=60; else if(/enhanced|neural|natural/i.test(n)) s+=45;
        for(var i=0;i<PREF.length;i++){ if(n.indexOf(PREF[i])===0){ s+=30-i; break; } }
        if(/en[-_]US/i.test(v.lang)) s+=4;
        return {v:v,s:s}; })
      .sort(function(a,b){return b.s-a.s;}).map(function(o){return o.v;});
  }
  function pickVoice(){ return rankVoices()[0] || null; }
  if("speechSynthesis" in window){ voice=pickVoice(); speechSynthesis.onvoiceschanged=function(){voice=pickVoice();}; }
  /* Read to me plays recorded lines in the page's guide voice (Nov 8): Jo on kids.html and shared Kids' Corner pages
     (jo-voice/; BWK.init({voice:"jo"}), Judy's ElevenLabs "Jo - Read to Me"), Finn in Moonlets (finn/), the Outpost voice in The Outpost and its activities (outpost-voice/; BWK.init({voice:"outpost"})).
     A line with no recording yet falls back to Finn's clip, then to the device voice. Pages add their lines
     with BWK.lines({clipName:"exact words", ...}); matching ignores capitals, tags and punctuation. */
  var VDIR = {finn:"finn/", outpost:"outpost-voice/", jo:"jo-voice/"}, LINES = {}, sayA = null, sayN = 0;
  function norm(t){ return String(t||"").replace(/<[^>]+>/g," ").toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9' ]+/g," ").replace(/\s+/g," ").trim(); }
  function lines(m){ for(var k in m){ if(m.hasOwnProperty(k)) LINES[norm(m[k])]=k; } }
  function stopSay(){ sayN++; if(sayA){ try{ sayA.pause(); }catch(e){} sayA=null; } }
  function sayDevice(text){
    if(!voice) return false;
    try{ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(text);
      u.voice=voice; u.lang=voice.lang; u.rate=LS.get("rate",0.95); u.pitch=1.05; speechSynthesis.speak(u); }catch(e){return false;}
    return true;
  }
  function say(text, force, clip, blocked){
    if(!(readOn||force) || !text) return false;
    if(finnRun && !finnRun.float) finnStop();
    stopSay(); if("speechSynthesis" in window) speechSynthesis.cancel();
    clip = clip || LINES[norm(text)];
    if(!clip){ return sayDevice(text); }
    var my=sayN, v=cfg.voice||"finn", dirs=[VDIR[v]||VDIR.finn]; if(v!=="finn") dirs.push(VDIR.finn);
    (function tryDir(i){
      if(my!==sayN) return;
      if(i>=dirs.length){ sayDevice(text); return; }
      loadClip(dirs[i]+clip+".mp3", function(c){
        if(my!==sayN) return;
        if(!c){ tryDir(i+1); return; }
        var a=playOn(c.url, finnRate()/0.95); sayA=a;
        a.onerror=function(){ if(sayA===a){ sayA=null; tryDir(i+1); } };
        var pr=a.play(); if(pr&&pr.catch) pr.catch(function(err){ if(sayA===a){ sayA=null;
          if(blocked && err && err.name==="NotAllowedError") blocked(); else sayDevice(text); } });
      });
    })(0);
    return true;
  }
  // the kit's own lines (recorded in each guide voice; same file names in finn/ and outpost-voice/)
  lines({"stuff-ask":"What should we call you? Type your name, or pick a call sign.",
    "stretch":"Time for a stretch! Stand up, reach for the stars, and wiggle your fingers and toes.",
    "hi-friend":"Hi, friend!"});

  /* ---------------- Finn, the Moonlets guide moon (Nov 7) ----------------
     BWK.finn(text, {into:el}) : a sparkle, then Finn talks in a speech bubble while a ball of stardust
     hops along the words (karaoke style). {name} in the text becomes the child's name (or "friend").
     Finn is a girl (Judy's ElevenLabs voice "Finn - Adventurous Moon Fairy. v2", clips in finn/). Finn talks out loud
     whenever Sound is on (always after a tap); the bubble shows either way. Tap Finn to hear it again.
     Without {into}, the bubble floats at the bottom of the screen and fades after Finn is done. */
  var FINN_PITCH = 1.0, finnN = 0, finnRun = null;
  function finnSvg(){
    var id="kFinn"+(++finnN);
    return '<svg class="k-fm" viewBox="0 0 100 100" aria-hidden="true"><defs>'+
      '<radialGradient id="'+id+'g" cx="30%" cy="35%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#f6e6bd"/><stop offset="1" stop-color="#dcc188"/></radialGradient>'+
      '<mask id="'+id+'m"><rect width="100" height="100" fill="#fff"/><circle cx="71" cy="37" r="31" fill="#000"/></mask></defs>'+
      '<circle cx="48" cy="54" r="38" fill="url(#'+id+'g)" mask="url(#'+id+'m)"/>'+
      '<ellipse cx="25" cy="58" rx="3.2" ry="4.2" fill="#3b2a12"/><ellipse cx="40" cy="67" rx="3.2" ry="4.2" fill="#3b2a12"/>'+
      '<circle cx="24.2" cy="56.6" r="1.1" fill="#fff"/><circle cx="39.2" cy="65.6" r="1.1" fill="#fff"/>'+
      '<ellipse cx="20" cy="68" rx="4.5" ry="2.6" fill="#f2a98f" opacity=".55"/><ellipse cx="44" cy="78" rx="4.5" ry="2.6" fill="#f2a98f" opacity=".55"/>'+
      '<path class="k-fmouth" d="M27 72 q5 7 11 3" stroke="#3b2a12" stroke-width="2.6" fill="#a5523a" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<g class="k-fdust"><path d="M68 50l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#fff3c4"/>'+
      '<path d="M80 40l1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-1.1z" fill="#ffe7a0"/>'+
      '<circle cx="75" cy="58" r="1.6" fill="#fff"/><circle cx="62" cy="44" r="1.2" fill="#ffeab0"/><circle cx="84" cy="52" r="1.1" fill="#fff"/></g></svg>';
  }
  // Names Finn can say out loud (each needs its own recorded clips, e.g. finn/door-waking-comet.mp3 and finn/hi-comet.mp3).
  // Any other name: Finn says "friend", and the bubble says "friend" too, so the words always match the voice.
  var SAYNAMES = ["Comet","Rocket","Nova","Pixel","Captain Sprout","Star Scout","Moonbeam","Rover","Astro","Sparky","Orbit","Captain Cosmo",
    "Brody","Zayden","Sophie","Sophia","Finley","Skylar"];
  function nameKey(n){ return String(n||"").toLowerCase().replace(/[^a-z]/g,""); }
  function sayable(n){ var k=nameKey(n); for(var i=0;i<SAYNAMES.length;i++){ if(nameKey(SAYNAMES[i])===k) return k; } return ""; }
  function finnText(t, nm){ return String(t||"").replace(/\{name\}/g, nm||"friend"); }
  function finnStop(){ var r=finnRun; finnRun=null; if(!r) return; r.dead=true; clearTimeout(r.t); clearTimeout(r.t2); cancelAnimationFrame(r.raf||0);
    if(r.audio){ try{ r.audio.pause(); }catch(e){} }
    if(r.box){ r.box.classList.remove("talk"); r.home(); }
    if(r.box && r.float){ var b=r.box; b.classList.add("bye"); setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); },400); } }

  /* Word timing for recorded clips (Nov 8): the clip is fetched and decoded on the device, its loudness is
     measured every 10 ms, and the pauses are matched to the commas and periods. Inside each phrase the words
     share the talking time by syllables, and a word that starts next to a short pause snaps to it. */
  var CLIPC = {};
  // One shared audio player for every clip, unlocked by the first tap (iPhones and iPads only let a player
  // start later, after a fetch, if it was started once inside a tap).
  var AUD = null;
  function aud(){ if(!AUD){ AUD=new Audio(); AUD.preload="auto"; } return AUD; }
  function silentWav(){ var n=400, h="RIFF"+le(36+n,4)+"WAVEfmt "+le(16,4)+le(1,2)+le(1,2)+le(8000,4)+le(8000,4)+le(1,2)+le(8,2)+"data"+le(n,4);
    for(var i=0;i<n;i++) h+=String.fromCharCode(128); return "data:audio/wav;base64,"+btoa(h);
    function le(v,b){ var o=""; for(var i=0;i<b;i++){ o+=String.fromCharCode(v&255); v>>>=8; } return o; } }
  document.addEventListener("pointerdown",function unA(){ document.removeEventListener("pointerdown",unA,true);
    try{ var a=aud(); if(a.src) return; a.src=silentWav(); var pr=a.play(); if(pr&&pr.catch) pr.catch(function(){}); }catch(e){} }, true);
  function playOn(url, rate){ var a=aud(); a.onplay=a.onended=a.onerror=a.onloadedmetadata=null; try{ a.pause(); }catch(e){}
    a.src=url; try{ a.defaultPlaybackRate=rate; a.playbackRate=rate; }catch(e){} return a; }
  function syl(w){ w=w.toLowerCase().replace(/[^a-z]/g,""); if(!w) return 1; if(w.length<=3) return 1;
    w=w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,"").replace(/^y/,""); var m=w.match(/[aeiouy]{1,2}/g); return Math.max(1,m?m.length:1); }
  // hand-set word starts (seconds) for a clip the measuring can't read, e.g. one with a sound before the first word.
  // door-waking: a yawn, then "Oh," (0.98 s, not in the bubble); "Hi" starts at 2.04. Times from ElevenLabs Scribe (Nov 8).
  var MARKS = {"door-waking":[2.04,2.36,3.18,3.44,4.02,4.16,4.50,5.32,5.52,5.80,5.96,6.30,6.62,6.88,7.50,7.70,7.98]};
  function alignWords(x, sr, words, lead){
    var hop=Math.round(sr*0.01), n=Math.floor(x.length/hop), e=new Float32Array(n), pk=0, i, j, k, g;
    for(i=0;i<n;i++){ var s=0; for(j=i*hop;j<(i+1)*hop;j++) s+=x[j]*x[j]; e[i]=Math.sqrt(s/hop); if(e[i]>pk) pk=e[i]; }
    if(!pk) return null;
    var th=pk*0.05, a=0, b=n-1; while(a<n&&e[a]<th) a++; while(b>a&&e[b]<th) b--;
    if(lead){ a=Math.max(a,Math.min(b,Math.round(lead*100))); while(a<b&&e[a]<th) a++; }
    var gaps=[], run=0; for(i=a;i<=b;i++){ if(e[i]<th) run++; else { if(run>=7) gaps.push({s:(i-run)/100, e:i/100}); run=0; } }
    var W=words.map(function(w){ return syl(w)+0.5; }), br=[];
    words.forEach(function(w,k){ if(k<words.length-1 && /[,.!?;:]["”’)]*$/.test(w)) br.push(k); });
    var t0=a/100, t1=(b+1)/100, cum=[0]; W.forEach(function(v){ cum.push(cum[cum.length-1]+v); });
    var speech=t1-t0; gaps.forEach(function(q){ speech-=(q.e-q.s); }); var r=speech/cum[words.length];
    var P=br.length, G=gaps.length, memo={};
    function segCost(sA,eB,kA,kB){ var ex=(cum[kB+1]-cum[kA+1])*r, act=eB-sA; return (act-ex)*(act-ex)/Math.max(ex,.2); }
    function best(p,h,kp,te){ var key=p+"|"+h+"|"+kp; if(memo[key]) return memo[key]; var res;
      if(p===P){ res={c:segCost(te,t1,kp,words.length-1), a:[]}; }
      else { var sk=best(p+1,h,kp,te); res={c:sk.c+0.3, a:sk.a};
        for(var g2=h+1; g2<G; g2++){ if(gaps[g2].s<=te) continue; var nx=best(p+1,g2,br[p],gaps[g2].e);
          var c=segCost(te,gaps[g2].s,kp,br[p])-1.2*(gaps[g2].e-gaps[g2].s)+nx.c;
          if(c<res.c) res={c:c, a:[{k:br[p], s:gaps[g2].s, e:gaps[g2].e}].concat(nx.a)}; } }
      memo[key]=res; return res; }
    var an=[{k:-1,e:t0}].concat(best(0,-1,-1,t0).a); an.push({k:words.length-1, s:t1});
    var st=new Array(words.length);
    for(var q=0;q<an.length-1;q++){ var A=an[q], B=an[q+1], fr=A.e, to=B.s, sum=cum[B.k+1]-cum[A.k+1];
      var ig=gaps.filter(function(z){ return z.s>fr && z.e<to; }), sp=to-fr; ig.forEach(function(z){ sp-=z.e-z.s; });
      for(k=A.k+1;k<=B.k;k++){ var left=sp*(cum[k]-cum[A.k+1])/sum, t=fr;
        for(g=0;g<ig.length;g++){ var before=ig[g].s-t; if(left<=before+0.001) break; left-=before; t=ig[g].e; }
        t+=left;
        for(g=0;g<ig.length;g++){ if(k>A.k+1 && t>ig[g].s-0.13 && t<ig[g].e+0.08){ t=ig[g].e; break; } }
        st[k]=t; } }
    for(k=1;k<st.length;k++) if(st[k]<st[k-1]) st[k]=st[k-1];
    return st;
  }
  // fetch a clip once; cb(null) when it's missing. Gives {url, x, sr} (x = samples, for the word timing).
  function loadClip(path, cb){
    var c=CLIPC[path]; if(c){ if(c.wait) c.wait.push(cb); else cb(c.ok?c:null); return; }
    c=CLIPC[path]={wait:[cb]};
    function fin(ok){ c.ok=ok; var w=c.wait; c.wait=null; w.forEach(function(f){ f(ok?c:null); }); }
    if(!window.fetch){ fin(false); return; }
    fetch(path).then(function(r){ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(function(buf){
      c.url=URL.createObjectURL(new Blob([buf],{type:"audio/mpeg"}));
      var ctx=wake(); if(!ctx){ fin(true); return; }
      try{ ctx.decodeAudioData(buf.slice(0), function(ab){ c.x=ab.getChannelData(0); c.sr=ab.sampleRate; fin(true); }, function(){ fin(true); }); }
      catch(e){ fin(true); }
    }).catch(function(){ fin(false); });
  }
  function finn(text, o){
    o=o||{};
    finnStop(); stopSay(); if("speechSynthesis" in window) speechSynthesis.cancel();
    var s=seat(), nm=s&&s.name||"", nk=sayable(nm), raw=String(text||"");
    // with a recorded clip, the bubble shows exactly what the clip says
    var tries=[];
    if(o.clip){ if(raw.indexOf("{name}")>=0){ if(nk) tries.push({clip:o.clip+"-"+nk, text:finnText(raw,nm)}); tries.push({clip:o.clip, text:finnText(raw,"friend")}); }
      else tries.push({clip:o.clip, text:raw}); }
    text = tries.length ? tries[0].text : finnText(raw, nm);
    var box=document.createElement("div"), host=o.into||null;
    box.className="k-finn "+(host?"k-finn-in":"k-finn-float");
    box.setAttribute("role","status");
    box.innerHTML=finnSvg()+'<p class="k-fb"></p><i class="k-dust" aria-hidden="true"><i class="k-dc"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i></i>';
    var p=box.querySelector(".k-fb"), dust=box.querySelector(".k-dust"), words=[];
    function setText(t){ text=t; p.innerHTML=""; words=[]; var pos=0;
      t.split(/(\s+)/).forEach(function(w){
        if(!w) return;
        if(/^\s+$/.test(w)){ p.appendChild(document.createTextNode(w)); pos+=w.length; return; }
        var sp=document.createElement("span"); sp.textContent=w; sp._i=pos; pos+=w.length; p.appendChild(sp); words.push(sp);
      }); }
    setText(text);
    if(host){ host.innerHTML=""; host.appendChild(box); } else { document.body.appendChild(box); }
    var run={box:box, float:!host, dead:false, cur:-1, hop:0};
    finnRun=run;
    function rel(el){ var a=el.getBoundingClientRect(), b=box.getBoundingClientRect(); return {x:a.left-b.left, y:a.top-b.top, w:a.width, h:a.height}; }
    // the trail: glitter shed wherever the dust flies, fading as it drifts down
    var calm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches, tl={on:false,until:0,last:null,lt:0,n:0};
    function shed(x,y){ if(tl.n>46) return; var g=document.createElement("i"), z=Math.random();
      g.className="k-spk "+(z<.3?"s0":z<.65?"s1":"s2")+" c"+((Math.random()*7)|0);
      g.style.left=(x+(Math.random()-.5)*9)+"px"; g.style.top=(y+(Math.random()-.5)*9)+"px";
      g.style.setProperty("--dx",((Math.random()-.5)*16)+"px"); g.style.setProperty("--dy",(4+Math.random()*9)+"px");
      g.style.animationDuration=(0.55+Math.random()*0.45)+"s";
      tl.n++; g.addEventListener("animationend",function(){ tl.n--; if(g.parentNode) g.parentNode.removeChild(g); });
      box.appendChild(g); }
    function trail(){ if(calm) return; tl.until=performance.now()+1400; if(tl.on) return; tl.on=true;
      (function step(now){ if(run.dead||!box.isConnected||now>tl.until){ tl.on=false; tl.last=null; return; }
        var r=rel(dust), x=r.x+r.w/2, y=r.y+r.h/2, L=tl.last;
        if(L){ var d=Math.hypot(x-L.x,y-L.y); if(d>2.5){ var k=Math.min(3,Math.ceil(d/9)); for(var q=1;q<=k;q++) shed(L.x+(x-L.x)*q/k, L.y+(y-L.y)*q/k); tl.lt=now; }
          else if(now-tl.lt>170){ shed(x,y); tl.lt=now; } }
        tl.last={x:x,y:y}; requestAnimationFrame(step); })(performance.now()); }
    run.home=function(){ var m=rel(box.querySelector(".k-fm")); dust.style.transform="translate("+(m.x+m.w*.72)+"px,"+(m.y+m.h*.5)+"px)"; trail();
      words.forEach(function(w){w.classList.remove("on");}); run.cur=-1; };
    function lite(i){
      if(run.dead || i===run.cur || !words[i]) return;
      if(run.cur>=0 && words[run.cur]) words[run.cur].classList.remove("on");
      run.cur=i; var w=words[i], r=rel(w); w.classList.add("on");
      dust.style.transform="translate("+(r.x+r.w/2)+"px,"+(r.y-5)+"px)";
      run.hop=1-run.hop; dust.className="k-dust "+(run.hop?"hopA":"hopB")+" c"+(i%6); trail();
    }
    run.home();
    // timing when the voice gives no word marks (or there is no voice): a rough pace per word
    function paced(i, slow){
      if(run.dead) return; if(i>=words.length){ done(); return; }
      lite(i); var len=words[i].textContent.length, end=/[.!?,]$/.test(words[i].textContent);
      run.t=setTimeout(function(){ paced(i+1, slow); }, ((150+52*len)+(end?260:0))*(slow?1.35:1)/finnRate());
    }
    function done(){ if(run.dead) return; box.classList.remove("talk");
      if(o.onend){ var f=o.onend; o.onend=null; setTimeout(f,0); }
      run.t2=setTimeout(function(){ if(run.dead) return; run.home(); if(run.float) finnStop(); }, run.float?2600:700); }
    var fv = pickVoice(), useVoice = soundOn && fv && ("speechSynthesis" in window);
    sfx("sparkle");
    // start fetching the clip during the sparkle
    var got=null, ready=false, waiting=false, ti=0;
    function nextTry(){ if(ti>=tries.length){ got=null; ready=true; if(waiting) go(); return; }
      var T=tries[ti]; loadClip("finn/"+T.clip+".mp3", function(c){ if(run.dead) return;
        if(c){ got=c; got.T=T; ready=true; if(waiting) go(); } else { ti++; nextTry(); } }); }
    if(o.clip && soundOn) nextTry();
    function go(){ if(run.dead) return;
      if(got){ if(got.T.text!==text){ setText(got.T.text); run.home(); } playClip(got); }
      else { if(tries.length && text!==tries[tries.length-1].text){ setText(tries[tries.length-1].text); run.home(); } speak(); } }
    run.t=setTimeout(function(){
      if(run.dead) return; box.classList.add("talk");
      if(o.clip && soundOn){ if(ready) go(); else waiting=true; return; }
      speak();
    }, 420);
    function playClip(c){
      var a=playOn(c.url, finnRate()/0.95), starts=null, fell=false;
      run.audio=a;
      function fall(){ if(fell||run.dead||run!==finnRun) return; fell=true; cancelAnimationFrame(run.raf); speak(); }
      var key=c.T.text; c.st=c.st||{};
      var mk=MARKS[c.T.clip]; if(mk && mk.length===words.length) starts=mk;
      else if(c.x){ if(!c.st[key]){ try{ c.st[key]=alignWords(c.x, c.sr, words.map(function(w){return w.textContent;})); }catch(e){} } starts=c.st[key]||null; }
      function est(){ // no samples to measure: spread by word length and pauses
        var wts=words.map(function(w){ var t=w.textContent; return t.length+2+(/[.!?]$/.test(t)?5:(/[,;:]$/.test(t)?3:0)); }), tot=0, acc=0;
        wts.forEach(function(x){tot+=x;}); var d=a.duration*0.9;
        starts=wts.map(function(x){ var st=acc/tot*d; acc+=x; return st; }); }
      if(!starts) a.onloadedmetadata=est;
      function tick(){ if(run.dead||fell) return;
        if(starts){ var t=a.currentTime+0.06, k=-1; for(var j=0;j<starts.length;j++){ if(starts[j]<=t) k=j; } if(a.currentTime>0 && k>=0) lite(k); }
        run.raf=requestAnimationFrame(tick); }
      a.onplay=function(){ cancelAnimationFrame(run.raf); run.raf=requestAnimationFrame(tick); };
      a.onended=function(){ cancelAnimationFrame(run.raf); if(run===finnRun && !fell){ lite(words.length-1); done(); } };
      a.onerror=fall;
      var pr=a.play(); if(pr&&pr.catch) pr.catch(fall);
    }
    function speak(){
      if(run.dead) return;
      if(!useVoice){ paced(0,true); return; }
      var u=new SpeechSynthesisUtterance(text), marks=false;
      u.voice=fv; u.lang=fv.lang; u.rate=finnRate(); u.pitch=FINN_PITCH;
      u.onboundary=function(e){ if(e.name && e.name!=="word") return; marks=true; clearTimeout(run.t);
        var ci=e.charIndex, k=0; for(var j=0;j<words.length;j++){ if(words[j]._i<=ci) k=j; else break; } lite(k); };
      u.onstart=function(){ lite(0); run.t=setTimeout(function(){ if(!marks) paced(1,false); }, 700); };
      u.onend=function(){ if(run===finnRun){ clearTimeout(run.t); if(run.cur<words.length-1) lite(words.length-1); done(); } };
      u.onerror=function(){ if(run===finnRun && !marks){ clearTimeout(run.t); paced(Math.max(0,run.cur),true); } };
      try{ speechSynthesis.speak(u); }catch(e){ paced(0,true); }
    }
    box.querySelector(".k-fm").addEventListener("click",function(){ finn(raw, o); });
    return {stop:finnStop};
  }
  function finnRate(){ return LS.get("finnRate2",0.95); }
  // iPhones and iPads only let a page talk after a tap: say nothing, quietly, on the first tap.
  document.addEventListener("pointerdown",function un(){ document.removeEventListener("pointerdown",un,true);
    try{ if("speechSynthesis" in window){ var u=new SpeechSynthesisUtterance(" "); u.volume=0; speechSynthesis.speak(u); } }catch(e){} }, true);

  /* ---------------- the seat (name kept on this device only) ---------------- */
  var CALLSIGNS = ["Comet","Rocket","Nova","Pixel","Captain Sprout","Star Scout","Moonbeam","Rover","Astro","Sparky","Orbit","Captain Cosmo"];
  var NOPE = ["poop","butt","fart","stupid","dumb","idiot","hate","kill","sex","damn","hell","crap","shit","fuck","bitch","ass","dick","piss"];
  function cleanName(s){
    s = String(s||"").replace(/[^A-Za-zÀ-ÿ' \-]/g,"").replace(/\s+/g," ").trim().slice(0,14);
    var low = s.toLowerCase().replace(/[^a-z]/g,"");
    for(var i=0;i<NOPE.length;i++){ if(low.indexOf(NOPE[i])>=0) return ""; }
    return s ? s.charAt(0).toUpperCase()+s.slice(1) : "";
  }
  function seat(){ return LS.get("seat", null); }

  /* ---------------- sheets ---------------- */
  var veil;
  function sheet(html, onClose){
    if(!veil){ veil=document.createElement("div"); veil.className="k-veil"; document.body.appendChild(veil);
      veil.addEventListener("pointerdown",function(e){ if(e.target===veil) closeSheet(); }); }
    veil.innerHTML='<div class="k-sheet" role="dialog" aria-modal="true"><button class="k-x" aria-label="Close">&times;</button>'+html+'</div>';
    veil._onClose = onClose||null;
    veil.classList.add("on"); sfx("open");
    $(".k-x",veil).onclick=closeSheet;
    return $(".k-sheet",veil);
  }
  function closeSheet(silent){
    if(!veil || !veil.classList.contains("on")) return;
    veil.classList.remove("on"); if(silent!==true) sfx("close");
    if("speechSynthesis" in window) speechSynthesis.cancel();
    stopSay(); if(finnRun && !finnRun.float) finnStop();
    var f=veil._onClose; veil._onClose=null; if(f) f();
  }
  document.addEventListener("keydown",function(e){ if(e.key==="Escape") closeSheet(); });

  function openStuff(){
    var s=seat(), nm=s&&s.name||"";
    var box=sheet('<h2>My stuff</h2><p>What should we call you?</p>'+
      '<input class="k-in" id="kName" maxlength="14" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Your name" value="'+nm.replace(/"/g,"")+'">'+
      '<p class="k-small" style="margin-top:8px">Use your first name or a fun nickname.</p>'+
      '<p class="k-small" style="margin:6px 0 0">Or pick a call sign:</p><div class="k-chips" id="kCalls"></div>'+
      '<div class="k-row"><button class="k-btn" id="kSave">Save</button></div>'+
      '<p class="k-small" style="margin-top:16px">Your name stays on this device. Nobody else can see it.</p>'+
      '<p class="k-small" style="margin:0">Badges and stickers you earn will live here too.</p>');
    var chips=$("#kCalls",box), inp=$("#kName",box);
    CALLSIGNS.forEach(function(c){ var b=document.createElement("button"); b.className="k-chip"+(c===nm?" on":""); b.textContent=c;
      b.onclick=function(){ inp.value=c; [].forEach.call(chips.children,function(x){x.classList.toggle("on",x===b);}); sfx("tap"); say("Hi, "+c+"!", false, "hi-"+nameKey(c)); };
      chips.appendChild(b); });
    say("What should we call you? Type your name, or pick a call sign.");
    $("#kSave",box).onclick=function(){
      var n=cleanName(inp.value);
      if(!n){ inp.value=""; inp.placeholder="Try another name"; sfx("nope"); inp.focus(); return; }
      LS.set("seat",{name:n}); closeSheet(true); sfx("yay"); hello(true);
    };
  }

  /* ---------------- grown-ups gate: hold 3 s, then a sum in words ---------------- */
  var W = ["zero","one","two","three","four","five","six","seven","eight","nine"];
  function openGate(){
    var box=sheet('<h2>For Grown-ups</h2><p>Grown-ups: press and hold the button for three seconds.</p>'+
      '<button class="k-hold" id="kHold" aria-label="Press and hold for three seconds"><svg viewBox="0 0 132 132"><circle class="k-ring0" cx="66" cy="66" r="58"/><circle class="k-ring1" cx="66" cy="66" r="58"/></svg><span>Hold</span></button>');
    var hb=$("#kHold",box), ring=$(".k-ring1",box), t0=0, raf=0, done=false, lastTick=0;
    function step(){
      var p=Math.min(1,(performance.now()-t0)/3000); ring.style.strokeDashoffset=String(364*(1-p));
      var sec=Math.floor(p*3); if(sec>lastTick){lastTick=sec; sfx("tick");}
      if(p>=1){ done=true; askSum(box); return; } raf=requestAnimationFrame(step);
    }
    function down(e){ e.preventDefault(); if(done) return; t0=performance.now(); lastTick=0; try{hb.setPointerCapture(e.pointerId);}catch(_){} raf=requestAnimationFrame(step); }
    function up(){ cancelAnimationFrame(raf); if(!done){ ring.style.transition="stroke-dashoffset .3s"; ring.style.strokeDashoffset="364"; setTimeout(function(){ring.style.transition="";},320);} }
    hb.addEventListener("pointerdown",down); hb.addEventListener("pointerup",up); hb.addEventListener("pointercancel",up); hb.addEventListener("pointerleave",up);
    hb.addEventListener("contextmenu",function(e){e.preventDefault();});
  }
  function askSum(box){
    var a=2+Math.floor(Math.random()*8), b=2+Math.floor(Math.random()*8), c=1+Math.floor(Math.random()*9);
    box.innerHTML='<button class="k-x" aria-label="Close">&times;</button><h2>For Grown-ups</h2>'+
      '<p>What is '+W[a]+' times '+W[b]+', plus '+W[c]+'?</p>'+
      '<input class="k-in" id="kSum" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" placeholder="Answer">'+
      '<div class="k-row"><button class="k-btn k-cool" id="kGo">Continue</button></div>';
    $(".k-x",box).onclick=closeSheet;
    var inp=$("#kSum",box); setTimeout(function(){inp.focus();},50);
    function check(){ if(parseInt(inp.value,10)===a*b+c){ grownups(); } else { closeSheet(true); sfx("nope"); } }
    $("#kGo",box).onclick=check; inp.addEventListener("keydown",function(e){ if(e.key==="Enter") check(); });
  }
  function grownups(){
    closeSheet(true);
    var mins=LS.get("break",30);
    var box=sheet('<h2>For Grown-ups</h2><div id="kFinnGu"></div>'+
      '<p>The Kids\' Corner is BrainWhim\'s wing for children: <b>Moonlets</b> (about 3 to 7) and <b>The Outpost</b> (about 8 to 12).</p>'+
      '<p class="k-small">Our promise: no accounts for children, no chat, no ads, no trackers, no links out, no uploads, no camera or microphone. A child\'s name and progress stay in this browser only. Read to me plays recorded voices (Jo in the Kids\' Corner, Finn in Moonlets, the Outpost guide in The Outpost) that come with this site; nothing is recorded or sent.</p>'+
      '<p style="margin:14px 0 6px;font-weight:700">Break reminder</p><div class="k-chips" id="kBrk"></div>'+
      '<p style="margin:16px 0 6px;font-weight:700">Voice speed <span class="k-small" style="font-weight:400">(Finn and Read to me)</span></p><div class="k-chips" id="kFr"></div>'+
      '<p style="margin:14px 0 6px;font-weight:700">What should Finn call you?</p><div class="k-chips" id="kMon"></div>'+
      '<p class="k-small" style="margin-top:8px">A few lines that change every day aren\'t recorded; those use this device\'s own voice. For a more natural one, download an enhanced English voice: on iPhone, iPad or Mac, Settings, then Accessibility, then Spoken Content, then Voices.</p>'+
      '<p class="k-small" style="margin-top:12px">Coming soon here: settings, progress at a glance, printables and play-together ideas.</p>'+
      '<div class="k-row"><a class="k-btn k-ghost" href="index.html">Leave for BrainWhim home</a></div>');
    var row=$("#kBrk",box);
    [[20,"20 min"],[30,"30 min"],[45,"45 min"],[0,"Off"]].forEach(function(o){
      var b=document.createElement("button"); b.className="k-chip"+(o[0]===mins?" on":""); b.textContent=o[1];
      b.onclick=function(){ LS.set("break",o[0]); [].forEach.call(row.children,function(x){x.classList.toggle("on",x===b);}); sfx("tap"); };
      row.appendChild(b); });
    var fr=$("#kFr",box), cur=finnRate();
    [[0.85,"Slower"],[0.95,"Just right"],[1.05,"Faster"]].forEach(function(o){
      var b=document.createElement("button"); b.className="k-chip"+(Math.abs(o[0]-cur)<.01?" on":""); b.textContent=o[1];
      b.onclick=function(){ LS.set("finnRate2",o[0]); [].forEach.call(fr.children,function(x){x.classList.toggle("on",x===b);}); finn("Hi! I'm Finn. Is this a good speed?", {into:$("#kFinnGu",box), clip:"speed-check"}); };
      fr.appendChild(b); });
    var hear=document.createElement("button"); hear.className="k-chip"; hear.textContent="▶ Hear Finn";
    hear.onclick=function(){ finn("Hi! I'm Finn, the guide moon. Let's play!", {into:$("#kFinnGu",box), clip:"hear-finn"}); }; fr.appendChild(hear);
    // Finn greets the grown-up by the name they pick (each has its own recorded clip: finn/gu-hi-<key>.mp3)
    var MON=[["mom","Mom"],["dad","Dad"],["grandma","Grandma"],["grandpa","Grandpa"],["nana","Nana"],["papa","Papa"],["mimi","Mimi"],["gigi","Gigi"],["mommom","Mom-Mom"],["poppop","Pop-Pop"],["poppy","Poppy"],["juju","JuJu"],["auntie","Auntie"],["uncle","Uncle"],["bigsister","Big Sister"],["bigbrother","Big Brother"],["grownup","Grown-up"]];
    function guHi(){ var m=LS.get("gu","grownup"), o=MON.filter(function(x){return x[0]===m;})[0]; if(!o){ m="grownup"; o=MON[MON.length-1]; } var nm=o[1];
      finn((m==="grownup"?"Hi there, grown-up!":"Hi, "+nm+"!")+" Thanks for stopping by. Here's where you can set things up.", {into:$("#kFinnGu",box), clip:"gu-hi-"+m}); }
    var mr=$("#kMon",box), mc=LS.get("gu","grownup");
    MON.forEach(function(o){ var b=document.createElement("button"); b.className="k-chip"+(o[0]===mc?" on":""); b.textContent=o[1];
      b.onclick=function(){ LS.set("gu",o[0]); [].forEach.call(mr.children,function(x){x.classList.toggle("on",x===b);}); guHi(); };
      mr.appendChild(b); });
    guHi();
  }

  /* ---------------- break reminder (active, visible time on kids' pages) ---------------- */
  function breakClock(){
    var last=Date.now();
    setInterval(function(){
      var now=Date.now(), dt=Math.min(now-last,20000); last=now;
      if(document.hidden) return;
      var lim=LS.get("break",30); if(!lim) return;
      var used=(LS.get("playms",0)||0)+dt;
      var day=new Date().toDateString(); if(LS.get("playday","")!==day){ used=dt; LS.set("playday",day); }
      if(used>=lim*60000){ used=0;
        sheet('<h2>Time for a stretch!</h2><p>You have been exploring for a while. Stand up, reach for the stars, and wiggle your fingers and toes.</p>'+
          '<p class="k-small">Maybe get a drink of water too.</p><div class="k-row"><button class="k-btn" id="kOk">I stretched!</button></div>');
        $("#kOk").onclick=function(){ closeSheet(true); sfx("yay"); };
        say("Time for a stretch! Stand up, reach for the stars, and wiggle your fingers and toes.", true);
      }
      LS.set("playms",used);
    },15000);
  }

  /* ---------------- greeting ---------------- */
  function hello(fresh){
    var el=$(".k-hello"), s=seat(); if(!el) return;
    if(!s||!s.name){ el.classList.remove("on"); return; }
    // noHello (Nov 10): play areas inside a room (moonlets-piano.html and future moon activities) skip the arrival
    // "Welcome back" banner, since the room already greeted the child; the "Hi, <name>!" after joining still shows.
    if(!fresh && cfg.noHello){ el.classList.remove("on"); return; }
    el.textContent=(fresh?"Hi, ":(cfg.helloWord||"Welcome back, "))+s.name+"!";
    el.classList.add("on"); clearTimeout(el._t); el._t=setTimeout(function(){el.classList.remove("on");},5200);
    if(fresh){ var k=sayable(s.name); say("Hi, "+s.name+"!", false, k?"hi-"+k:"hi-friend"); }
    else if(soundOn){ var hc=cfg.helloClip||(!cfg.helloWord && cfg.voice==="jo"?"back":""); if(hc) welcomeBack(el, s.name, hc, cfg.helloWord||"Welcome back, "); }
  }
  // The arrival greeting out loud (Nov 9): kids.html "Welcome back, <name>!" in Jo's voice (jo-voice/back-<key>.mp3);
  // a page with helloClip (outpost.html: "welcome") plays <voice folder>/<helloClip>-<key>.mp3. Pages without one stay text-only.
  // Phones block sound until the first tap, so if it can't play on arrival it plays on the first tap (within 30 s).
  // A tap that starts something else (Finn at the moon door, Read to me) wins: that stops the greeting.
  function welcomeBack(el, nm, pre, word){
    var k=sayable(nm), clip=pre+"-"+(k||"friend"), txt=word+(k?nm:"friend")+"!", t0=Date.now();
    say(txt, true, clip, function(){
      document.addEventListener("pointerdown",function wb(){ document.removeEventListener("pointerdown",wb,true);
        if(Date.now()-t0>30000 || !soundOn) return;
        el.classList.add("on"); clearTimeout(el._t); el._t=setTimeout(function(){el.classList.remove("on");},4000);
        say(txt, true, clip); }, true);
    });
  }

  /* ---------------- header ---------------- */
  function head(){
    var h=document.createElement("nav"); h.className="k-head"; h.setAttribute("aria-label","Kids' Corner");
    h.innerHTML=
      (cfg.here==="home"?'<a class="k-hb k-leave" href="index.html" data-k="leave" aria-label="Back to the BrainWhim home page">'+I.back+'<span>BrainWhim</span></a>':
      '<button class="k-hb" data-k="home">'+I.home+'<span>Home</span></button>')+
      '<button class="k-hb" data-k="sound" aria-pressed="'+soundOn+'">'+(soundOn?I.sound:I.mute)+'<span>Sound</span></button>'+
      '<button class="k-hb" data-k="read" aria-pressed="'+readOn+'">'+I.read+'<span>Read to me</span></button>'+
      '<button class="k-hb" data-k="stuff">'+I.stuff+'<span>My stuff</span></button>'+
      '<button class="k-hb k-gu" data-k="gu">'+I.gu+'<span>Grown-ups</span></button>';
    document.body.insertBefore(h,document.body.firstChild);
    var hi=document.createElement("div"); hi.className="k-hello"; hi.setAttribute("aria-live","polite"); document.body.appendChild(hi);
    h.addEventListener("click",function(e){
      var b=e.target.closest(".k-hb"); if(!b) return; var k=b.getAttribute("data-k");
      if(k==="leave"){ e.preventDefault(); sfx("whoosh"); setTimeout(function(){location.href="index.html";},180); }
      else if(k==="home"){ sfx("whoosh"); setTimeout(function(){location.href="kids.html";},180); }
      else if(k==="sound"){ soundOn=!soundOn; LS.set("sound",soundOn); b.setAttribute("aria-pressed",soundOn); b.innerHTML=(soundOn?I.sound:I.mute)+'<span>Sound</span>'; wake(); sfx("tap"); }
      else if(k==="read"){
        if(!voice){ voice=pickVoice(); }
        if(!voice && !(cfg.intro && LINES[norm(cfg.intro)])){ sheet('<h2>Read to me</h2><p>This device doesn\'t have a voice we can use yet. Ask a grown-up to try a different browser or device.</p>'); return; }
        readOn=!readOn; LS.set("read",readOn); b.setAttribute("aria-pressed",readOn); sfx("tap");
        if(readOn) say(cfg.intro); else { stopSay(); if("speechSynthesis" in window) speechSynthesis.cancel(); }
      }
      else if(k==="stuff") openStuff();
      else if(k==="gu") openGate();
    });
    // anything marked data-say is read aloud when tapped (only while Read to me is on)
    document.addEventListener("click",function(e){ var t=e.target.closest("[data-say]"); if(t) say(t.getAttribute("data-say")); });
  }

  /* ---- The Outpost's patches (Judy, Nov 10): a corner's patch is earned once every game in that corner
     has been played (finished once). Keep this list in step with outpost.html's C table (each act's id). ---- */
  var CORNERS={lab:["psj","colorsort","challenge"], tele:["tmap","snake","stickers"], joke:["ttt","war","jokeaday","eights"],
    work:["slime","sophie"], mission:["timer","chores"]};
  function obj(k){ var o=LS.get(k,{}); return (o&&typeof o==="object")?o:{}; }
  function cornerOf(id){ for(var k in CORNERS){ if(CORNERS[k].indexOf(id)>=0) return k; } return ""; }
  function cornerProgress(k){ var p=obj("played"), l=CORNERS[k]||[], n=0; l.forEach(function(id){ if(p[id]) n++; }); return {n:n, of:l.length}; }
  /* marks a game played; returns the corner key the first time that corner's patch is earned, else "" */
  function played(id){ var p=obj("played"); p[id]=1; LS.set("played",p);
    var k=cornerOf(id); if(!k) return ""; var g=cornerProgress(k), b=obj("badges");
    if(g.n===g.of && !b[k]){ b[k]=true; LS.set("badges",b); return k; } return ""; }
  /* once: move from the old rule (one game earned the patch) to the new one */
  (function(){ if(LS.get("badgeRule",1)===2) return; var b=obj("badges"), p=obj("played");
    if(b.tele) p.tmap=1; if(b.lab) p.psj=1; LS.set("played",p);
    var nb={}; for(var k in CORNERS){ var g=cornerProgress(k); if(g.n===g.of) nb[k]=true; } LS.set("badges",nb); LS.set("badgeRule",2); })();

  /* ---- Big Moonlet (Nov 10 night, Judy: ages about 5-7, a switch): one setting for the harder layer in every
     Moonlets moon, kept on this device (bwk.big). Pages build their own button and listen for "bwk-big". ---- */
  var BIGL={on:"Big Moonlet! Let's try something trickier.", off:"Okay! Back to the easy way."};
  function big(){ return LS.get("big",false)===true; }
  function setBig(on, into){ on=!!on; LS.set("big",on); document.documentElement.classList.toggle("k-bigm",on);
    if(into) finn(BIGL[on?"on":"off"],{into:into, clip:on?"bg-on":"bg-off"});
    try{ window.dispatchEvent(new CustomEvent("bwk-big",{detail:on})); }catch(e){} return on; }
  document.documentElement.classList.toggle("k-bigm",big());

  window.BWK = {
    big:big, setBig:setBig, BIG_LINES:BIGL,
    init:function(o){ cfg=o||{}; head(); breakClock(); setTimeout(function(){hello(false);},700); },
    sfx:sfx, say:say, lines:lines, finn:finn, finnStop:finnStop, preload:function(c){ loadClip("finn/"+c+".mp3",function(){}); }, sheet:sheet, closeSheet:closeSheet, seat:seat, store:LS, played:played, cornerProgress:cornerProgress, CORNERS:CORNERS,
    reading:function(){return readOn;}
  };
})();
