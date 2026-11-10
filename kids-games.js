/* Shared by The Outpost's quick games (Nov 10). window.BWG: little sounds of their own, the seat name, patches. */
(function(){
  "use strict";
  var AC=null, LS=BWK.store;
  function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } }
    if(AC.state==="suspended") AC.resume(); return AC; }
  document.addEventListener("pointerdown",ac,true); document.addEventListener("keydown",ac,true);
  function on(){ return LS.get("sound",true)!==false; }
  function tone(f,at,d,v,type,f2){ var a=ac(); if(!a||!on()) return; var t=a.currentTime+(at||0), o=a.createOscillator(), g=a.createGain();
    o.type=type||"sine"; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+d);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v||.06,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+d+.05); }
  var NB=null;
  function noise(at,d,v,lo,hi){ var a=ac(); if(!a||!on()) return; if(!NB){ NB=a.createBuffer(1,a.sampleRate,a.sampleRate); var c=NB.getChannelData(0); for(var i=0;i<c.length;i++) c[i]=Math.random()*2-1; }
    var t=a.currentTime+(at||0), s=a.createBufferSource(), f=a.createBiquadFilter(), g=a.createGain(); s.buffer=NB;
    f.type="bandpass"; f.frequency.value=Math.sqrt(lo*hi); f.Q.value=Math.max(.3,Math.sqrt(lo*hi)/(hi-lo));
    g.gain.setValueAtTime(v||.1,t); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(f); f.connect(g); g.connect(a.destination); s.start(t); s.stop(t+d+.02); }
  function who(def){ var s=BWK.seat(); return (s&&s.name?s.name:def).replace(/[<>&"]/g,""); }
  /* marks this game played (a finished game); returns its corner's key the first time that corner's patch is earned
     (every game in the corner played, Judy Nov 10), else "" */
  function patch(id){ return BWK.played(id); }
  var CN={lab:"The Lab",tele:"The Telescope",joke:"The Joke Shack",work:"The Workshop",mission:"Mission Control"};
  function patchLine(k){ return k?'<p style="color:var(--k-warm);font-weight:700">New patch! You played every game in '+CN[k]+'. Its patch is on your badge wall.</p>':""; }
  function toOutpost(){ BWK.closeSheet(true); BWK.sfx("whoosh"); setTimeout(function(){ location.href="outpost.html"; },200); }
  window.BWG={tone:tone,noise:noise,who:who,patch:patch,patchLine:patchLine,toOutpost:toOutpost,store:LS};
})();
