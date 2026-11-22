/* BrainWhim share cards (Nov 20). Every daily puzzle room's "Share Result" calls BWShare.go(txt).
   txt is the room's own spoiler-free result:
     "BrainWhim · The Orrery No. 30\n★★☆ 12 turns (par 12) · 0:05 · 4-day streak\nbrainwhim.com/orrery.html"
   We paint a 1080×1350 picture card from the room's own photo (puzzles-<page>.jpg), show it in a small window,
   and offer Share (picture + text, where the phone allows), Save Picture and Copy Text.
   The card is painted before the Share button is live, so the phone's share sheet opens straight from the tap (iPhone needs that). */
(function(){
  var W=1080, H=1350, GOLD="#F2BE45", IVORY="#f4ecd8", NAVY="#0a1630";
  var DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  /* rooms that aren't puzzles name their day their own way (Nov 21) */
  var KIND={reading:["Lesson","Read today's lesson."],writing:["Prompt","Write today's page."],habits:["Garden","Tend your own garden."]};
  var LEVEL={Monday:"Gentle",Tuesday:"Easy",Wednesday:"Steady",Thursday:"Tricky",Friday:"Hard",Saturday:"Harder",Sunday:"The Hardest"};

  function parse(txt){
    var L=String(txt).split("\n"), m=/^BrainWhim \u00b7 (.+?) No\. (\d+)/.exec(L[0]||"")||[];
    var s=(L[1]||""), st=(s.match(/\u2605/g)||[]).length, rest=s.replace(/^[\u2605\u2606]+\s*/,"");
    var bits=rest.split(" \u00b7 ").map(function(x){ return x.trim(); }).filter(Boolean);
    var streak=null; bits=bits.filter(function(b){ var k=/^(\d+)-day streak$/.exec(b); if(k){ streak=+k[1]; return false; } return true; });
    var url=(L[2]||"brainwhim.com").trim();
    var page=(/\/([a-z0-9-]+)\.html/.exec(url)||[])[1]||"";
    return {room:m[1]||"Today's Puzzle", no:m[2]||"", stars:st, bits:bits, streak:streak, url:url, page:page};
  }
  function img(src){ return new Promise(function(ok){ var i=new Image(); i.onload=function(){ ok(i); }; i.onerror=function(){ ok(null); }; i.src=src; }); }
  function fonts(){
    if(!document.fonts||!document.fonts.load) return Promise.resolve();
    return Promise.all(["700 80px Fraunces","60px Pacifico","700 40px Montserrat","600 40px Montserrat","700 60px 'Cormorant Garamond'"].map(function(f){ return document.fonts.load(f).catch(function(){}); }))
      .then(function(){}, function(){});
  }
  function star(c,x,y,r,fill){
    c.beginPath();
    for(var i=0;i<10;i++){ var a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; c[i?"lineTo":"moveTo"](x+rr*Math.cos(a),y+rr*Math.sin(a)); }
    c.closePath();
    if(fill){ var g=c.createLinearGradient(x,y-r,x,y+r); g.addColorStop(0,"#ffe08a"); g.addColorStop(1,"#d99a1e"); c.fillStyle=g; c.shadowColor="rgba(242,190,69,.55)"; c.shadowBlur=24; c.fill(); c.shadowBlur=0; }
    else { c.fillStyle="rgba(255,255,255,.08)"; c.fill(); c.lineWidth=3; c.strokeStyle="rgba(242,190,69,.55)"; c.stroke(); }
  }
  function fit(c,text,font,max,size){ do{ c.font=font.replace("$",size); size-=2; }while(c.measureText(text).width>max&&size>20); return size+2; }
  function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

  function paint(r){
    return Promise.all([img("puzzles-"+r.page+".jpg"), img("bw-emblem.png?v=1111a"), fonts()]).then(function(a){
      var ph=a[0], em=a[1], cv=document.createElement("canvas"); cv.width=W; cv.height=H;
      var c=cv.getContext("2d");
      c.fillStyle=NAVY; c.fillRect(0,0,W,H);
      /* the room's photo across the top 57%, melting into the night */
      var PH=Math.round(H*.57);
      if(ph){ var s=Math.max(W/ph.width,PH/ph.height), w=ph.width*s, h=ph.height*s; c.drawImage(ph,(W-w)/2,(PH-h)/2,w,h); }
      var g=c.createLinearGradient(0,PH*.38,0,PH+2); g.addColorStop(0,"rgba(10,22,48,0)"); g.addColorStop(.7,"rgba(10,22,48,.78)"); g.addColorStop(1,NAVY);
      c.fillStyle=g; c.fillRect(0,0,W,PH+4);
      var t=c.createLinearGradient(0,0,0,220); t.addColorStop(0,"rgba(6,12,28,.62)"); t.addColorStop(1,"rgba(6,12,28,0)"); c.fillStyle=t; c.fillRect(0,0,W,220);
      /* a fine gold frame */
      c.strokeStyle="rgba(242,190,69,.7)"; c.lineWidth=3; rr(c,26,26,W-52,H-52,26); c.stroke();
      c.strokeStyle="rgba(242,190,69,.3)"; c.lineWidth=1.5; rr(c,38,38,W-76,H-76,18); c.stroke();
      /* the brand: emblem + wordmark */
      var bx=74, by=80;
      if(em){ c.drawImage(em,bx,by,84,84*em.height/em.width); bx+=104; }
      c.textBaseline="middle"; c.shadowColor="rgba(0,0,0,.6)"; c.shadowBlur=10;
      c.font="700 54px Fraunces, Georgia, serif"; var bg=c.createLinearGradient(0,by,0,by+84); bg.addColorStop(0,"#ffffff"); bg.addColorStop(.5,"#e8e4da"); bg.addColorStop(1,"#a19c92");
      c.fillStyle=bg; c.textAlign="left"; c.fillText("Brain",bx,by+44); var bw=c.measureText("Brain").width;
      c.font="46px Pacifico, cursive"; c.fillStyle=GOLD; c.fillText("Whim",bx+bw+2,by+40);
      c.shadowBlur=0;
      /* the day */
      var d=new Date(), day=DAYS[d.getDay()];
      var y=PH-24; c.textAlign="center";
      c.font="700 30px Montserrat, sans-serif"; c.fillStyle=GOLD;
      var K=KIND[r.page]||["Puzzle","Can you solve today's?"];
      var kick=(day+"'s "+K[0]+(r.no?" \u00b7 No. "+r.no:"")).toUpperCase().split("").join(String.fromCharCode(8202));
      c.fillText(kick,W/2,y);
      /* the room */
      y+=86; c.fillStyle=IVORY; fit(c,r.room,"700 $px Fraunces, Georgia, serif",W-180,96); c.fillText(r.room,W/2,y);
      /* the stars */
      if(r.page==="writing"||r.page==="habits"){ y+=64;   /* a gold rule with a diamond instead of stars */
        c.strokeStyle="rgba(242,190,69,.75)"; c.lineWidth=3; c.beginPath(); c.moveTo(W/2-200,y); c.lineTo(W/2-34,y); c.moveTo(W/2+34,y); c.lineTo(W/2+200,y); c.stroke();
        c.beginPath(); c.moveTo(W/2,y-20); c.lineTo(W/2+20,y); c.lineTo(W/2,y+20); c.lineTo(W/2-20,y); c.closePath(); c.fillStyle=GOLD; c.fill(); y+=24; }
      else { y+=112; for(var i=0;i<3;i++) star(c,W/2+(i-1)*128,y,52,i<r.stars); }
      /* the numbers: one glass chip each */
      y+=106; c.font="600 34px Montserrat, sans-serif";
      var chips=r.bits.slice(0,4); if(r.streak) chips.push("\ud83d\udd25 "+r.streak+"-day streak"); var pad=30, gap=18, ws=chips.map(function(b){ return c.measureText(b).width+pad*2; });
      var rows=[[]], rw=[0]; ws.forEach(function(w,k){ var n=rows.length-1; if(rw[n]+w+(rows[n].length?gap:0)>W-160){ rows.push([]); rw.push(0); n++; } rows[n].push(k); rw[n]+=w+(rows[n].length>1?gap:0); });
      rows.forEach(function(row,ri){
        var x=(W-rw[ri])/2, yy=y+ri*80;
        row.forEach(function(k){ rr(c,x,yy-32,ws[k],64,32); c.fillStyle="rgba(255,255,255,.07)"; c.fill(); c.strokeStyle="rgba(242,190,69,.45)"; c.lineWidth=2; c.stroke();
          c.fillStyle=/day streak$/.test(chips[k])?GOLD:IVORY; c.fillText(chips[k],x+ws[k]/2,yy+1); x+=ws[k]+gap; });
      });
      /* the invitation */
      c.font="italic 700 46px 'Cormorant Garamond', Georgia, serif"; c.fillStyle="rgba(244,236,216,.85)"; c.fillText(K[1],W/2,H-142);
      c.font="600 32px Montserrat, sans-serif"; c.fillStyle=GOLD; c.fillText(r.url.replace(/^https?:\/\//,""),W/2,H-90);
      return cv;
    });
  }

  function css(){
    if(document.getElementById("bws-css")) return;
    var s=document.createElement("style"); s.id="bws-css";
    s.textContent=".bws{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(4,8,20,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:Montserrat,sans-serif}"+
      ".bws-box{display:flex;flex-direction:column;align-items:center;gap:12px;width:min(440px,100%);box-sizing:border-box;max-height:100%;padding:16px;border-radius:16px;background:rgba(10,22,48,.94);border:1px solid rgba(242,190,69,.45);box-shadow:0 20px 60px rgba(0,0,0,.6)}"+
      ".bws-box h3{margin:0;font:700 17px Montserrat,sans-serif;color:#fff;letter-spacing:.02em}"+
      ".bws-img{display:block;width:min(100%,calc((100dvh - 200px)*.8));height:auto;aspect-ratio:1080/1350;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.5);background:#0a1630}"+
      ".bws-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}"+
      ".bws-row button,.bws-row a{font:700 14px Montserrat,sans-serif;padding:11px 16px;border-radius:999px;border:1px solid rgba(242,190,69,.6);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;text-decoration:none}"+
      ".bws-row .go{background:linear-gradient(180deg,#F6CF6A,#E0A82E);color:#1a1205;border-color:#F2BE45}"+
      ".bws-row button:disabled{opacity:.5;cursor:default}"+
      ".bws-note{font-size:12px;color:rgba(255,255,255,.7);min-height:1em;text-align:center}";
    document.head.appendChild(s);
  }
  function copyText(txt,note){
    function done(){ note.textContent="Result copied: paste it to a friend."; }
    try{ navigator.clipboard.writeText(txt).then(done,function(){ note.textContent=txt; }); }catch(e){ note.textContent=txt; }
  }

  function go(txt){
    css();
    var r=parse(txt), file=null, url=null;
    var o=document.createElement("div"); o.className="bws"; o.setAttribute("role","dialog"); o.setAttribute("aria-label","Share your result");
    o.innerHTML='<div class="bws-box"><h3>Share Your Result</h3><img class="bws-img" alt="Your result card"><div class="bws-row">'+
      '<button class="go" type="button" disabled>Share</button><a class="sv" download="brainwhim-'+(r.page||"puzzle")+'-'+(r.no||"today")+'.png">Save Picture</a>'+
      '<button class="cp" type="button">Copy Text</button><button class="x" type="button">Done</button></div><div class="bws-note"></div></div>';
    document.body.appendChild(o);
    var q=function(s){ return o.querySelector(s); }, note=q(".bws-note"), bShare=q(".go"), aSave=q(".sv");
    aSave.style.display="none";
    function close(){ if(url) URL.revokeObjectURL(url); o.remove(); document.removeEventListener("keydown",esc); }
    function esc(e){ if(e.key==="Escape") close(); }
    document.addEventListener("keydown",esc);
    o.addEventListener("click",function(e){ if(e.target===o) close(); });
    q(".x").onclick=close;
    q(".cp").onclick=function(){ copyText(txt,note); };
    paint(r).then(function(cv){
      cv.toBlob(function(b){
        if(!b){ bShare.disabled=false; return; }
        url=URL.createObjectURL(b); q(".bws-img").src=url; aSave.href=url; aSave.style.display="";
        try{ file=new File([b],aSave.getAttribute("download"),{type:"image/png"}); }catch(e){ file=null; }
        bShare.disabled=false;
        if(!navigator.share) bShare.style.display="none";
      },"image/png");
    }).catch(function(){ bShare.disabled=false; });
    bShare.onclick=function(){
      var data={text:txt};
      if(file&&navigator.canShare&&navigator.canShare({files:[file]})) data={files:[file],text:txt};
      if(navigator.share) navigator.share(data).catch(function(){});
      else copyText(txt,note);
    };
  }
  window.BWShare={go:go, paint:function(txt){ return paint(parse(txt)); }, parse:parse};
})();
