
(function(){
  var q=new URLSearchParams(location.search);
  var isMulti=q.get("mode")==="multiplayer"||!!q.get("match_id")||!!q.get("code");
  if(!isMulti) return;
  var CODE=(q.get("match_id")||q.get("code")||"").toUpperCase();
  var seat=q.get("seat")==="b"?"b":"w";
  window.bwOnline=true;
  window.bwMyColor=seat;
  function say(){
    var m=document.getElementById("chmsg");
    if(!m) return;
    if(typeof chTurn==="undefined") m.textContent=seat==="b"?"Opponent goes first.":"Your turn. You go first.";
    else m.textContent=chTurn===seat?"Your turn":"Opponent to move";
  }
  function boot(){
    if(typeof sitDown==="function") sitDown();
    say();
    if(!CODE||!window.supabase||typeof BW_PLAY==="undefined") return;
    var sb=supabase.createClient(BW_PLAY.url, BW_PLAY.anonKey);
    var room=null, sending=false;
    function snap(){ return {board:ch, turn:chTurn, last:chLast, over:chOver, rights:chRights, ep:chEp}; }
    function apply(s){
      if(!s||!s.board) return;
      ch=s.board; chTurn=s.turn||"w"; chLast=s.last||null; chOver=!!s.over;
      if(s.rights) chRights=s.rights; chEp=s.ep||null;
      if(typeof chPaint==="function") chPaint();
      say();
    }
    async function publish(){
      if(!room) return;
      sending=true;
      var up=await sb.from("rooms").update({state:snap(), status:"live", updated_at:new Date().toISOString()}).eq("id", room.id);
      sending=false;
      if(up.error && document.getElementById("chmsg")) document.getElementById("chmsg").textContent="Move did not save";
    }
    window.bwPublish=publish;
    sb.from("rooms").select("*").eq("code", CODE).single().then(function(res){
      room=res.data;
      if(!room){ var m=document.getElementById("chmsg"); if(m) m.textContent="Table not found"; return; }
      if(room.state&&room.state.board) apply(room.state); else publish();
      setInterval(function(){
        sb.from("rooms").select("state").eq("code", CODE).single().then(function(r){
          var s=r.data&&r.data.state;
          if(!s||!s.board) return;
          var changed=!chLast||!s.last||s.last.join()!==(chLast||[]).join()||s.turn!==chTurn;
          if(changed) apply(s);
        });
      }, 1000);
    });
  }
  if(document.readyState==="complete") boot(); else window.addEventListener("load", boot);
})();
