
(function(){
  var q=new URLSearchParams(location.search);
  var isMulti=q.get("mode")==="multiplayer"||!!q.get("match_id")||!!q.get("code");
  if(!isMulti) return;
  var CODE=(q.get("match_id")||q.get("code")||"").toUpperCase();
  var seat=q.get("seat")==="b"?"b":"w";
  window.bwOnline=true;
  window.bwMyColor=seat;
  function boot(){
    if(typeof sitDown==="function") sitDown();
    var msg=document.getElementById("chmsg");
    if(msg) msg.textContent = seat==="b" ? "Opponent goes first." : "Your turn. You go first.";
    if(!CODE || !window.supabase || typeof BW_PLAY==="undefined") return;
    var sb=supabase.createClient(BW_PLAY.url, BW_PLAY.anonKey);
    var room=null, sending=false;
    function snap(){ return {board:ch, turn:chTurn, last:chLast, over:chOver, rights:chRights, ep:chEp}; }
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
    sb.from("rooms").select("*").eq("code", CODE).single().then(function(res){
      room=res.data; if(!room) return;
      if(room.state&&room.state.board) apply(room.state); else publish();
      sb.channel("match-"+CODE).on("postgres_changes",{event:"UPDATE", schema:"public", table:"rooms", filter:"code=eq."+CODE}, function(payload){
        if(payload.new&&payload.new.state) apply(payload.new.state);
      }).subscribe();
      setInterval(function(){
        sb.from("rooms").select("state").eq("code", CODE).single().then(function(r){
          if(r.data&&r.data.state&&r.data.state.turn&&r.data.state.turn!==chTurn) apply(r.data.state);
        });
      }, 1500);
    });
  }
  if(document.readyState==="complete") boot(); else window.addEventListener("load", boot);
})();
