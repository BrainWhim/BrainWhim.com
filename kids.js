/* ==========================================================================
   BrainWhim · Kids' Corner kit (Nov 6, 2026)  ·  window.BWK
   The kids' header (Home · Sound · Read to me · My stuff · Grown-ups), the grown-ups gate,
   device-only name, read-aloud with on-device voices only, little sounds, the break reminder.
   Safety: nothing here talks to a server. Everything is kept in this browser (localStorage).
   Nov 7: Finn's voice and speech bubble (BWK.finn); voices ranked best-first (Premium/Enhanced).
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
  function say(text, force){
    if(!(readOn||force) || !voice || !text) return false;
    try{ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(text);
      u.voice=voice; u.lang=voice.lang; u.rate=LS.get("rate",0.95); u.pitch=1.05; speechSynthesis.speak(u); }catch(e){return false;}
    return true;
  }

  /* ---------------- Finn, the Moonlets guide moon (Nov 7) ----------------
     BWK.finn(text, {into:el}) : a sparkle, then Finn talks in a speech bubble while a ball of stardust
     hops along the words (karaoke style). {name} in the text becomes the child's name (or "friend").
     Finn is unisex: a gentle voice, a little higher and quicker than Read to me. Finn talks out loud
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
  function finnText(t){ var s=seat(); return String(t||"").replace(/\{name\}/g, s&&s.name?s.name:"friend"); }
  function finnStop(){ var r=finnRun; finnRun=null; if(!r) return; r.dead=true; clearTimeout(r.t); clearTimeout(r.t2);
    if(r.audio){ try{ r.audio.pause(); }catch(e){} }
    if(r.box){ r.box.classList.remove("talk"); r.home(); }
    if(r.box && r.float){ var b=r.box; b.classList.add("bye"); setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); },400); } }
  function finn(text, o){
    o=o||{}; text=finnText(text);
    finnStop(); if("speechSynthesis" in window) speechSynthesis.cancel();
    var box=document.createElement("div"), host=o.into||null;
    box.className="k-finn "+(host?"k-finn-in":"k-finn-float");
    box.setAttribute("role","status");
    box.innerHTML=finnSvg()+'<p class="k-fb"></p><i class="k-dust" aria-hidden="true"></i>';
    var p=box.querySelector(".k-fb"), dust=box.querySelector(".k-dust"), words=[], pos=0;
    text.split(/(\s+)/).forEach(function(w){
      if(!w) return;
      if(/^\s+$/.test(w)){ p.appendChild(document.createTextNode(w)); pos+=w.length; return; }
      var sp=document.createElement("span"); sp.textContent=w; sp._i=pos; pos+=w.length; p.appendChild(sp); words.push(sp);
    });
    if(host){ host.innerHTML=""; host.appendChild(box); } else { document.body.appendChild(box); }
    var run={box:box, float:!host, dead:false, cur:-1, hop:0};
    finnRun=run;
    function rel(el){ var a=el.getBoundingClientRect(), b=box.getBoundingClientRect(); return {x:a.left-b.left, y:a.top-b.top, w:a.width, h:a.height}; }
    run.home=function(){ var m=rel(box.querySelector(".k-fm")); dust.style.transform="translate("+(m.x+m.w*.72)+"px,"+(m.y+m.h*.5)+"px)";
      words.forEach(function(w){w.classList.remove("on");}); run.cur=-1; };
    function lite(i){
      if(run.dead || i===run.cur || !words[i]) return;
      if(run.cur>=0 && words[run.cur]) words[run.cur].classList.remove("on");
      run.cur=i; var w=words[i], r=rel(w); w.classList.add("on");
      dust.style.transform="translate("+(r.x+r.w/2)+"px,"+(r.y-5)+"px)";
      run.hop=1-run.hop; dust.className="k-dust "+(run.hop?"hopA":"hopB");
    }
    run.home();
    // timing when the voice gives no word marks (or there is no voice): a rough pace per word
    function paced(i, slow){
      if(run.dead) return; if(i>=words.length){ done(); return; }
      lite(i); var len=words[i].textContent.length, end=/[.!?,]$/.test(words[i].textContent);
      run.t=setTimeout(function(){ paced(i+1, slow); }, ((150+52*len)+(end?260:0))*(slow?1.35:1)/finnRate());
    }
    function done(){ if(run.dead) return; box.classList.remove("talk");
      run.t2=setTimeout(function(){ if(run.dead) return; run.home(); if(run.float) finnStop(); }, run.float?2600:700); }
    var fv = pickVoice(), useVoice = soundOn && fv && ("speechSynthesis" in window);
    sfx("sparkle");
    run.t=setTimeout(function(){
      if(run.dead) return; box.classList.add("talk");
      if(o.clip && soundOn){ playClip(); return; }
      speak();
    }, 420);
    // a recorded clip (finn/<name>.mp3): the stardust is spread over the clip by word length and pauses;
    // if the file is missing or won't play, Finn falls back to the device voice.
    function playClip(){
      var a=new Audio("finn/"+o.clip+".mp3"), raf=0, starts=null, fell=false;
      run.audio=a; a.preload="auto"; try{ a.playbackRate=finnRate()/0.95; }catch(e){}
      function fall(){ if(fell||run.dead||run!==finnRun) return; fell=true; cancelAnimationFrame(raf); speak(); }
      a.onloadedmetadata=function(){
        var wts=words.map(function(w){ var t=w.textContent; return t.length+2+(/[.!?]$/.test(t)?5:(/[,;:]$/.test(t)?3:0)); }), tot=0, acc=0;
        wts.forEach(function(x){tot+=x;}); var d=a.duration*0.9;
        starts=wts.map(function(x){ var st=acc/tot*d; acc+=x; return st; }); };
      function tick(){ if(run.dead||fell) return;
        if(starts){ var t=a.currentTime, k=0; for(var j=0;j<starts.length;j++){ if(starts[j]<=t) k=j; } lite(k); }
        raf=requestAnimationFrame(tick); }
      a.onplay=function(){ cancelAnimationFrame(raf); raf=requestAnimationFrame(tick); };
      a.onended=function(){ cancelAnimationFrame(raf); if(run===finnRun && !fell){ lite(words.length-1); done(); } };
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
    box.querySelector(".k-fm").addEventListener("click",function(){ finn(o.raw||text, o); });
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
    if(finnRun && !finnRun.float) finnStop();
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
      b.onclick=function(){ inp.value=c; [].forEach.call(chips.children,function(x){x.classList.toggle("on",x===b);}); sfx("tap"); say(c); };
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
      '<p class="k-small">Our promise: no accounts for children, no chat, no ads, no trackers, no links out, no uploads, no camera or microphone. A child\'s name and progress stay in this browser only. Read to me uses this device\'s own voices.</p>'+
      '<p style="margin:14px 0 6px;font-weight:700">Break reminder</p><div class="k-chips" id="kBrk"></div>'+
      '<p style="margin:16px 0 6px;font-weight:700">Finn\'s voice <span class="k-small" style="font-weight:400">(the Moonlets guide moon)</span></p><div class="k-chips" id="kFr"></div>'+
      '<p style="margin:14px 0 6px;font-weight:700">What should Finn call you?</p><div class="k-chips" id="kMon"></div>'+
      '<p class="k-small" style="margin-top:8px">Finn and Read to me use the best voice already on this device. For a more natural voice, download an enhanced English voice: on iPhone, iPad or Mac, Settings, then Accessibility, then Spoken Content, then Voices.</p>'+
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
    var MON=[["mom","Mom"],["dad","Dad"],["grandma","Grandma"],["grandpa","Grandpa"],["nana","Nana"],["papa","Papa"],["grownup","Grown-up"]];
    function guHi(){ var m=LS.get("gu","grownup"), nm=(MON.filter(function(x){return x[0]===m;})[0]||MON[6])[1];
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
    el.textContent=(fresh?"Hi, ":(cfg.helloWord||"Welcome back, "))+s.name+"!";
    el.classList.add("on"); clearTimeout(el._t); el._t=setTimeout(function(){el.classList.remove("on");},5200);
    if(fresh) say("Hi, "+s.name+"!");
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
        if(!voice){ sheet('<h2>Read to me</h2><p>This device doesn\'t have a voice we can use yet. Ask a grown-up to try a different browser or device.</p>'); return; }
        readOn=!readOn; LS.set("read",readOn); b.setAttribute("aria-pressed",readOn); sfx("tap");
        if(readOn) say(cfg.intro); else speechSynthesis.cancel();
      }
      else if(k==="stuff") openStuff();
      else if(k==="gu") openGate();
    });
    // anything marked data-say is read aloud when tapped (only while Read to me is on)
    document.addEventListener("click",function(e){ var t=e.target.closest("[data-say]"); if(t) say(t.getAttribute("data-say")); });
  }

  window.BWK = {
    init:function(o){ cfg=o||{}; head(); breakClock(); setTimeout(function(){hello(false);},700); },
    sfx:sfx, say:say, finn:finn, finnStop:finnStop, sheet:sheet, closeSheet:closeSheet, seat:seat, store:LS,
    reading:function(){return readOn;}
  };
})();
