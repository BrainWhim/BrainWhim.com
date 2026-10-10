
(function(){
  var q=new URLSearchParams(location.search);
  var isMulti=q.get("mode")==="multiplayer"||!!q.get("match_id")||!!q.get("code");
  if(!isMulti) return;
  var CODE=(q.get("match_id")||q.get("code")||"").toUpperCase();
  var seat=q.get("seat")==="b"?"b":"w";
  window.bwOnline=true;
  window.bwMyColor=seat;
  function line(text){
    var m=document.getElementById("chmsg");
    if(m) m.textContent=text+(CODE?" · "+CODE:"");
  }
  function boot(){
    if(typeof sitDown==="function") sitDown();
    line(seat==="b"?"Opponent goes first.":"Your turn. You go first.");
    if(!CODE||!window.supabase||typeof BW_PLAY==="undefined"){ line("Not linked"); return; }
    var sb=supabase.createClient(BW_PLAY.url, BW_PLAY.anonKey);
    var room=null, pending=false;
    function snap(){ return {board:ch, turn:chTurn, last:chLast, over:chOver, rights:chRights, ep:chEp}; }
    function apply(s){
      if(!s||!s.board) return;
      ch=s.board; chTurn=s.turn||"w"; chLast=s.last||null; chOver=!!s.over;
      if(s.rights) chRights=s.rights; chEp=s.ep||null;
      if(typeof chPaint==="function") chPaint();
      line(chTurn===seat?"Your turn":"Opponent to move");
    }
    async function publish(){
      if(!room){ pending=true; return; }
      pending=false;
      var up=await sb.from("rooms").update({state:snap(), status:"live", updated_at:new Date().toISOString()}).eq("id", room.id);
      if(up.error) line("Save failed");
      else line("Sent");
    }
    window.bwPublish=publish;
    sb.auth.getSession().then(function(){
      return sb.from("rooms").select("*").eq("code", CODE).single();
    }).then(function(res){
      if(res.error||!res.data){ line("Table not found"); return; }
      room=res.data;
      line("Linked");
      if(pending) publish();
      else if(room.state&&room.state.board) apply(room.state);
      setInterval(function(){
        sb.from("rooms").select("state").eq("code", CODE).single().then(function(r){
          if(r.error){ line("Read failed"); return; }
          var s=r.data&&r.data.state;
          if(!s||!s.board) return;
          if(JSON.stringify(s.last||[])!==JSON.stringify(chLast||[]) || s.turn!==chTurn) apply(s);
        });
      }, 1000);
    });
  }
  if(document.readyState==="complete") boot(); else window.addEventListener("load", boot);
})();
