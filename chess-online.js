
(function(){
  var CODE=(location.search.match(/code=([A-Za-z0-9]+)/)||[])[1];
  var seat=(location.search.match(/seat=([wb])/)||[])[1];
  if(!CODE) return;
  CODE=CODE.toUpperCase();
  window.bwOnline=true;
  if(seat) window.bwMyColor=seat;
  function boot(){
    if(typeof sitDown==="function") sitDown();
    var msg=document.getElementById("chmsg");
    if(msg) msg.textContent = seat==="b" ? "Opponent goes first." : "Your turn. You go first.";
    if(!window.supabase || typeof BW_PLAY==="undefined") return;
    var sb=supabase.createClient(BW_PLAY.url, BW_PLAY.anonKey);
    var room=null, sending=false;
    function snap(){
      return {board:ch, turn:chTurn, last:chLast, over:chOver, rights:chRights, ep:chEp};
    }
    function apply(s){
      if(!s||!s.board) return;
      ch=s.board; chTurn=s.turn||"w"; chLast=s.last||null; chOver=!!s.over;
      if(s.rights) chRights=s.rights; chEp=s.ep||null;
      if(typeof chPaint==="function") chPaint();
      var m=document.getElementById("chmsg");
      if(m) m.textContent = chTurn===window.bwMyColor ? "Your turn" : "Opponent to move";
    }
    async function publish(){
      if(!room||sending) return;
      sending=true;
      await sb.from("rooms").update({state:snap(), status:chOver?"done":"live", updated_at:new Date().toISOString()}).eq("id", room.id);
      sending=false;
    }
    window.bwPublish=publish;
    sb.from("rooms").select("*").eq("code", CODE).single().then(function(q){
      room=q.data; if(!room) return;
      if(room.state&&room.state.board) apply(room.state);
      else publish();
      setInterval(function(){
        sb.from("rooms").select("state").eq("code", CODE).single().then(function(r){
          if(r.data&&r.data.state&&r.data.state.turn && r.data.state.turn!==chTurn) apply(r.data.state);
        });
      }, 1500);
    });
  }
  if(document.readyState==="complete") boot();
  else window.addEventListener("load", boot);
})();
