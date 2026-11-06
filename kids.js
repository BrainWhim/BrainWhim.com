/* ==========================================================================
   BrainWhim · Kids' Corner kit (Nov 6, 2026)  ·  window.BWK
   The kids' header (Home · Sound · Read to me · My stuff · Grown-ups), the grown-ups gate,
   device-only name, read-aloud with on-device voices only, little sounds, the break reminder.
   Safety: nothing here talks to a server. Everything is kept in this browser (localStorage).
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
    tick:function(t){tone(1500,t,.04,.025,"square");}
  };
  function sfx(name){
    if(!soundOn || !SFX[name]) return;
    var c=wake(); if(!c || c.state!=="running") return;
    SFX[name](c.currentTime+0.01);
  }

  /* ---------------- read to me (on-device voices only) ---------------- */
  var readOn = LS.get("read", false), voice = null;
  function pickVoice(){
    if(!("speechSynthesis" in window)) return null;
    var vs = speechSynthesis.getVoices().filter(function(v){return v.localService && /^en(-|_|$)/i.test(v.lang);});
    var pref = ["Samantha","Karen","Moira","Tessa","Daniel","Serena","Microsoft Aria","Microsoft Jenny","Microsoft Zira"];
    for(var i=0;i<pref.length;i++){ for(var j=0;j<vs.length;j++){ if(vs[j].name.indexOf(pref[i])===0) return vs[j]; } }
    return vs.filter(function(v){return /en-US/i.test(v.lang);})[0] || vs[0] || null;
  }
  if("speechSynthesis" in window){ voice=pickVoice(); speechSynthesis.onvoiceschanged=function(){voice=pickVoice();}; }
  function say(text, force){
    if(!(readOn||force) || !voice || !text) return false;
    try{ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(text);
      u.voice=voice; u.lang=voice.lang; u.rate=LS.get("rate",0.95); u.pitch=1.05; speechSynthesis.speak(u); }catch(e){return false;}
    return true;
  }

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
    var box=sheet('<h2>For Grown-ups</h2>'+
      '<p>The Kids\' Corner is BrainWhim\'s wing for children: <b>Moonlets</b> (about 3 to 7) and <b>The Outpost</b> (about 8 to 12).</p>'+
      '<p class="k-small">Our promise: no accounts for children, no chat, no ads, no trackers, no links out, no uploads, no camera or microphone. A child\'s name and progress stay in this browser only. Read to me uses this device\'s own voices.</p>'+
      '<p style="margin:14px 0 6px;font-weight:700">Break reminder</p><div class="k-chips" id="kBrk"></div>'+
      '<p class="k-small" style="margin-top:12px">Coming soon here: settings, progress at a glance, printables and play-together ideas.</p>'+
      '<div class="k-row"><a class="k-btn k-ghost" href="index.html">Leave for BrainWhim home</a></div>');
    var row=$("#kBrk",box);
    [[20,"20 min"],[30,"30 min"],[45,"45 min"],[0,"Off"]].forEach(function(o){
      var b=document.createElement("button"); b.className="k-chip"+(o[0]===mins?" on":""); b.textContent=o[1];
      b.onclick=function(){ LS.set("break",o[0]); [].forEach.call(row.children,function(x){x.classList.toggle("on",x===b);}); sfx("tap"); };
      row.appendChild(b); });
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
      '<button class="k-hb'+(cfg.here==="home"?" k-here":"")+'" data-k="home">'+I.home+'<span>Home</span></button>'+
      '<button class="k-hb" data-k="sound" aria-pressed="'+soundOn+'">'+(soundOn?I.sound:I.mute)+'<span>Sound</span></button>'+
      '<button class="k-hb" data-k="read" aria-pressed="'+readOn+'">'+I.read+'<span>Read to me</span></button>'+
      '<button class="k-hb" data-k="stuff">'+I.stuff+'<span>My stuff</span></button>'+
      '<button class="k-hb k-gu" data-k="gu">'+I.gu+'<span>Grown-ups</span></button>';
    document.body.insertBefore(h,document.body.firstChild);
    var hi=document.createElement("div"); hi.className="k-hello"; hi.setAttribute("aria-live","polite"); document.body.appendChild(hi);
    h.addEventListener("click",function(e){
      var b=e.target.closest(".k-hb"); if(!b) return; var k=b.getAttribute("data-k");
      if(k==="home"){ if(cfg.here==="home"){ sfx("tap"); say(cfg.intro); } else { sfx("whoosh"); setTimeout(function(){location.href="kids.html";},180); } }
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
    sfx:sfx, say:say, sheet:sheet, closeSheet:closeSheet, seat:seat, store:LS,
    reading:function(){return readOn;}
  };
})();
