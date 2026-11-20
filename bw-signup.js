/* BrainWhim email list (Nov 20). Fills any <div class="box" data-bw-signup="home|puzzles|…"> with a small sign-up form.
   The address goes to Supabase through join_email_list() (sql/supabase-email-list.sql): the browser can add an address,
   never read the list. Grown-up pages only (never Kids' Corner). Needs bw-auth.js (BW.client()). */
(function(){
  var CSS=".bwsu-f{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}"+
    ".bwsu-f input[type=email]{flex:1 1 220px;min-width:0;font:600 15px Montserrat,sans-serif;padding:12px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;outline:none}"+
    ".bwsu-f input[type=email]::placeholder{color:rgba(255,255,255,.55)}"+
    ".bwsu-f input[type=email]:focus{border-color:rgba(242,190,69,.85);box-shadow:0 0 0 3px rgba(242,190,69,.18)}"+
    ".bwsu-f button{flex:none;font:700 14px Montserrat,sans-serif;padding:12px 20px;border-radius:999px;border:1px solid #F2BE45;background:linear-gradient(180deg,#F6CF6A,#E0A82E);color:#1a1205;cursor:pointer}"+
    ".bwsu-f button:disabled{opacity:.6;cursor:default}"+
    ".bwsu-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}"+
    ".bwsu-msg{margin:10px 0 0;font-size:13px;min-height:1.2em;color:rgba(255,255,255,.78)}"+
    ".bwsu-msg.ok{color:#9be7b4;font-weight:700}.bwsu-msg.no{color:#ffb4a8}"+
    ".bwsu-fine{margin:8px 0 0!important;font-size:11.5px!important;color:rgba(255,255,255,.6)!important}"+
    ".bwsu-fine a{color:inherit}";
  var DONE="bwEmailList";
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function fill(box){
    var src=box.getAttribute("data-bw-signup")||"home", joined=false;
    try{ joined=!!localStorage.getItem(DONE); }catch(e){}
    box.innerHTML='<p class="kick">Letters from the Studio</p><h2>Be First Through the Door</h2>'+
      '<p>A short note when a new room, or a whole new wing, opens its doors. Only a few letters a year. We never share or sell your address, and you can stop the letters anytime.</p>'+
      (joined?'<p class="bwsu-msg ok">You\'re in. Thank you!</p>':
      '<form class="bwsu-f" novalidate><label class="bwsu-hp" aria-hidden="true">Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label>'+
      '<input type="email" name="email" required autocomplete="email" inputmode="email" placeholder="you@example.com" aria-label="Your email address">'+
      '<button type="submit">Keep Me Posted</button></form><p class="bwsu-msg" role="status" aria-live="polite"></p>')+
      '<p class="bwsu-fine">For grown-ups. See our <a href="privacy.html">Privacy Notice</a>.</p>';
    var f=box.querySelector("form"); if(!f) return;
    var inp=f.querySelector("input[type=email]"), btn=f.querySelector("button"), msg=box.querySelector(".bwsu-msg");
    function say(t,k){ msg.textContent=t; msg.className="bwsu-msg"+(k?" "+k:""); }
    f.addEventListener("submit",function(e){
      e.preventDefault();
      var v=inp.value.trim();
      if(f.website.value){ say("You're in. Thank you!","ok"); f.remove(); return; }   /* a robot filled the hidden box */
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){ say("That email address doesn't look quite right.","no"); inp.focus(); return; }
      var sb=window.BW&&BW.client&&BW.client();
      if(!sb){ say("We couldn't send that just now. Please try again in a moment.","no"); return; }
      btn.disabled=true; say("Adding you…");
      sb.rpc("join_email_list",{p_email:v,p_source:src}).then(function(r){
        btn.disabled=false;
        var a=r&&r.data;
        if(r&&r.error){ say("We couldn't send that just now. Please try again in a moment.","no"); return; }
        if(a==="bad"){ say("That email address doesn't look quite right.","no"); inp.focus(); return; }
        if(a==="busy"){ say("Lots of sign-ups right now! Please try again in a minute.","no"); return; }
        try{ localStorage.setItem(DONE,"1"); }catch(e){}
        f.remove(); say("You're in. Thank you! Watch for a letter from the studio.","ok");
      },function(){ btn.disabled=false; say("We couldn't send that just now. Please try again in a moment.","no"); });
    });
  }
  function boot(){
    if(!document.getElementById("bwsu-css")){ var s=document.createElement("style"); s.id="bwsu-css"; s.textContent=CSS; document.head.appendChild(s); }
    [].forEach.call(document.querySelectorAll("[data-bw-signup]"),fill);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
