/* BrainWhim avatars (Oct 26): everything drawn in code on the Lobby's galaxy (galaxy-home.jpg), plus the logo brain
   (avatar-brain.png) for the Brain Orbs. Free families: Whim Sparks, Planets & Moons, Brain Orbs. Club: Constellations,
   Nebulae. Earned by everyone: a rank ring from Board Games points (7 ranks) and a charm per room (beat The House at
   level 10). Saved on the account in profiles.avatar / avatar_charm / charms (sql/supabase-avatars.sql).

   BWAvatar.html(profile | "house" | null, {size, ring:false, charm:false})  -> SVG markup (null = guest)
   BWAvatar.svg(id, {size, ring:0..6, charm:"chess"})                      -> SVG markup for a catalogue avatar
   BWAvatar.rank(points) -> {i, name, min, next, nextName}    BWAvatar.RANKS, .CHARMS, .FAMILIES
   BWAvatar.studio()          opens the Identity window (choose avatar and charm; guests are invited to sign up)
   BWAvatar.earn(game)        a room calls this when The House is beaten at level 10; returns the charm if it's new
   BWAvatar.fetch(sb, ids)    profiles with avatar columns (falls back if the database update hasn't been run)
   After a save the page gets a "bw-avatar" event on window.                                                     */
(function(){
"use strict";
var uid=0;
function f(n){return Math.round(n*100)/100}
function rng(seed){var s=seed>>>0||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function hash(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function starPts(cx,cy,R,r,n,rot){n=n||5;rot=rot==null?-90:rot;var a=[];for(var i=0;i<n*2;i++){var rr=i%2?r:R,t=(rot+i*180/n)*Math.PI/180;a.push(f(cx+rr*Math.cos(t))+","+f(cy+rr*Math.sin(t)))}return a.join(" ")}
function sparkle(x,y,s,fill,op){return '<path d="M'+x+' '+(y-s)+'Q'+x+' '+y+' '+(x+s)+' '+y+'Q'+x+' '+y+' '+x+' '+(y+s)+'Q'+x+' '+y+' '+(x-s)+' '+y+'Q'+x+' '+y+' '+x+' '+(y-s)+'Z" fill="'+(fill||"#fff")+'" opacity="'+(op==null?1:op)+'"/>'}
function twinkle(dur,begin){return '<animate attributeName="opacity" values="1;.25;1" dur="'+dur+'s" begin="'+(begin||0)+'s" repeatCount="indefinite"/>'}
function spin(dur,dir){return '<animateTransform attributeName="transform" type="rotate" from="0 50 50" to="'+(dir<0?-360:360)+' 50 50" dur="'+dur+'s" repeatCount="indefinite"/>'}
function polar(r,deg){var t=deg*Math.PI/180;return [f(50+r*Math.cos(t)),f(50+r*Math.sin(t))]}

/* ---------- backgrounds and settings ---------- */
function galaxy(p,seed,club){
  var r=rng(seed*7+3),z=1.55+r()*1.25,W=100*z,H=W*784/1168,rx=(W-96)/2,ry=(H-96)/2;
  var x=50-W/2+(r()*2-1)*rx,y=50-H/2+(r()*2-1)*ry;
  var d='<radialGradient id="'+p+'vg" cx="50%" cy="46%" r="52%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#020617" stop-opacity="'+(club?.62:.5)+'"/></radialGradient>';
  var g='<circle cx="50" cy="50" r="47" fill="#0a1630"/><g clip-path="url(#'+p+'c)"><image href="galaxy-home.jpg" x="'+f(x)+'" y="'+f(y)+'" width="'+f(W)+'" height="'+f(H)+'" preserveAspectRatio="none"/>'+
        (club?'<rect x="0" y="0" width="100" height="100" fill="#0b0a2a" opacity=".18"/>':'')+
        '<circle cx="50" cy="50" r="47" fill="url(#'+p+'vg)"/></g>'+dots(seed,club?10:6,.7);
  return {d:d,g:g};
}
function bgFree(p,seed){return galaxy(p,seed,false)}
function bgClub(p,seed){return galaxy(p,seed,true)}
function dots(seed,n,op){var r=rng(seed),s="";for(var i=0;i<n;i++){var a=r()*Math.PI*2,d=Math.sqrt(r())*44,x=50+d*Math.cos(a),y=50+d*Math.sin(a),rad=.35+r()*.75;s+='<circle cx="'+f(x)+'" cy="'+f(y)+'" r="'+f(rad)+'" fill="#fff" opacity="'+f(op*(.35+r()*.65))+'"/>'}return s}
function rimFree(p){
  return {d:'<linearGradient id="'+p+'rm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f4f8"/><stop offset=".45" stop-color="#9aa3b2"/><stop offset=".7" stop-color="#6c7484"/><stop offset="1" stop-color="#d7dde6"/></linearGradient>',
    g:'<circle cx="50" cy="50" r="49.4" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1"/><circle cx="50" cy="50" r="48" fill="none" stroke="url(#'+p+'rm)" stroke-width="2.8"/><circle cx="50" cy="50" r="46.4" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".6"/>'};
}
function rimClub(p){
  var b="";for(var i=0;i<36;i++){var q=polar(48,i*10);b+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r=".85" fill="#fff4cc" opacity=".85"/>'}
  return {d:'<linearGradient id="'+p+'rm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".35" stop-color="#d4a537"/><stop offset=".62" stop-color="#8a6418"/><stop offset="1" stop-color="#f3d27a"/></linearGradient>',
    g:'<circle cx="50" cy="50" r="50.2" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1"/><circle cx="50" cy="50" r="48" fill="none" stroke="url(#'+p+'rm)" stroke-width="4.4"/>'+b+
      '<circle cx="50" cy="50" r="45.6" fill="none" stroke="rgba(255,236,170,.35)" stroke-width=".6"/>'+
      '<path d="M50 -1.6L53.6 2.4L50 6.4L46.4 2.4Z" fill="#a3163f" stroke="url(#'+p+'rm)" stroke-width="1.1"/><circle cx="49" cy="1.4" r=".7" fill="#fff" opacity=".7"/>'};
}

/* ---------- families ---------- */
var FACE="#3b2410";
function face(kind){
  var s="",e1=43.5,e2=56.5,ey=51;
  function eye(x,r){return '<circle cx="'+x+'" cy="'+ey+'" r="'+r+'" fill="'+FACE+'"/><circle cx="'+(x+.9)+'" cy="'+(ey-.9)+'" r="'+(r*.33)+'" fill="#fff"/>'}
  function shut(x,down){return '<path d="M'+(x-2.6)+' '+ey+'Q'+x+' '+(ey+(down?2.6:-2.6))+' '+(x+2.6)+' '+ey+'" stroke="'+FACE+'" stroke-width="1.5" fill="none" stroke-linecap="round"/>'}
  if(kind==="wink"){s+=shut(e1,false)+eye(e2,2.6)}
  else if(kind==="sleepy"){s+=shut(e1,true)+shut(e2,true)}
  else if(kind==="awe"){s+=eye(e1,3.2)+eye(e2,3.2)}
  else s+=eye(e1,2.6)+eye(e2,2.6);
  if(kind==="awe")s+='<ellipse cx="50" cy="58.4" rx="2" ry="2.4" fill="'+FACE+'"/>';
  else if(kind==="sleepy")s+='<path d="M47.5 57.6Q50 59.4 52.5 57.6" stroke="'+FACE+'" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
  else s+='<path d="M45 57Q50 61.6 55 57" stroke="'+FACE+'" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
  s+='<ellipse cx="38.6" cy="56" rx="3" ry="1.8" fill="#ff6f93" opacity=".45"/><ellipse cx="61.4" cy="56" rx="3" ry="1.8" fill="#ff6f93" opacity=".45"/>';
  return s;
}
function drawSpark(p,a){
  var c=a.col;
  var d='<radialGradient id="'+p+'sg" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="'+c[0]+'"/><stop offset=".55" stop-color="'+c[1]+'"/><stop offset="1" stop-color="'+c[2]+'"/></radialGradient>'+
        '<filter id="'+p+'gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>';
  var pts=starPts(50,53,29,14.5);
  var g='<circle cx="50" cy="52" r="24" fill="'+c[1]+'" opacity=".35" filter="url(#'+p+'gl)"/>'+
        '<polygon points="'+pts+'" fill="url(#'+p+'sg)" stroke="'+c[1]+'" stroke-width="6" stroke-linejoin="round"/>'+
        '<polygon points="'+pts+'" fill="url(#'+p+'sg)"/>'+
        '<ellipse cx="44" cy="40" rx="5" ry="2.6" fill="#fff" opacity=".45" transform="rotate(-25 44 40)"/>'+face(a.face)+
        '<g>'+sparkle(23,27,4,"#fff",.9)+twinkle(2.6,0)+'</g><g>'+sparkle(79,75,3,"#fff",.85)+twinkle(3.1,1.2)+'</g>';
  if(a.face==="sleepy")g+='<text x="66" y="35" font-family="Montserrat" font-weight="700" font-size="7" fill="#fff" opacity=".75">z</text><text x="71" y="29" font-family="Montserrat" font-weight="700" font-size="5" fill="#fff" opacity=".55">z</text>';
  return {d:d,g:g};
}
function drawPlanet(p,a){
  var d="",g="";
  if(a.kind==="ringed"){
    d='<radialGradient id="'+p+'pl" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe6c2"/><stop offset=".55" stop-color="#e39a5e"/><stop offset="1" stop-color="#7d3f22"/></radialGradient>'+
      '<linearGradient id="'+p+'rg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6e2b3" stop-opacity=".4"/><stop offset=".5" stop-color="#fff3d1"/><stop offset="1" stop-color="#f6e2b3" stop-opacity=".4"/></linearGradient>'+
      '<clipPath id="'+p+'pc"><circle cx="50" cy="52" r="21"/></clipPath>'+
      '<clipPath id="'+p+'fr"><rect x="-20" y="52" width="140" height="60" transform="rotate(-18 50 52)"/></clipPath>';
    var ring='<ellipse cx="50" cy="52" rx="37" ry="9.5" fill="none" stroke="url(#'+p+'rg)" stroke-width="3.6"/><ellipse cx="50" cy="52" rx="31" ry="7.6" fill="none" stroke="#f9e9c4" stroke-opacity=".55" stroke-width="1.1"/>';
    g='<g transform="rotate(-18 50 52)">'+ring+'</g>'+
      '<circle cx="50" cy="52" r="21" fill="url(#'+p+'pl)"/>'+
      '<g clip-path="url(#'+p+'pc)" transform="rotate(-18 50 52)"><rect x="20" y="43" width="60" height="3" fill="#8a4a26" opacity=".35"/><rect x="20" y="51" width="60" height="4" fill="#fff0d6" opacity=".25"/><rect x="20" y="59" width="60" height="2.6" fill="#8a4a26" opacity=".4"/></g>'+
      '<g clip-path="url(#'+p+'fr)"><g transform="rotate(-18 50 52)">'+ring+'</g></g>'+sparkle(78,26,3,"#fff",.85);
  }else if(a.kind==="moon"){
    d='<radialGradient id="'+p+'mn" cx="35%" cy="55%" r="70%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".6" stop-color="#f4dc90"/><stop offset="1" stop-color="#c9a24c"/></radialGradient>'+
      '<mask id="'+p+'mk"><rect x="0" y="0" width="100" height="100" fill="#000"/><circle cx="48" cy="52" r="25" fill="#fff"/><circle cx="60" cy="43" r="22" fill="#000"/></mask>'+
      '<filter id="'+p+'gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>';
    g='<circle cx="48" cy="52" r="25" fill="#f4dc90" opacity=".25" mask="url(#'+p+'mk)" filter="url(#'+p+'gl)"/>'+
      '<circle cx="48" cy="52" r="25" fill="url(#'+p+'mn)" mask="url(#'+p+'mk)"/>'+
      '<g mask="url(#'+p+'mk)"><circle cx="33" cy="64" r="2.4" fill="#c9a24c" opacity=".45"/><circle cx="44" cy="71" r="1.6" fill="#c9a24c" opacity=".45"/></g>'+
      '<path d="M32.5 52Q35 54.4 37.5 52" stroke="'+FACE+'" stroke-width="1.4" fill="none" stroke-linecap="round"/>'+
      '<path d="M36.5 59.5Q39 61.4 41.5 59.6" stroke="'+FACE+'" stroke-width="1.3" fill="none" stroke-linecap="round"/>'+
      '<ellipse cx="31" cy="57" rx="2.4" ry="1.4" fill="#ff6f93" opacity=".4"/>'+
      '<g>'+sparkle(70,36,3.6,"#fff",.9)+twinkle(2.8)+'</g>'+sparkle(78,52,2,"#fff",.7)+sparkle(66,66,2.4,"#fff",.75);
  }else if(a.kind==="marble"){
    d='<radialGradient id="'+p+'oc" cx="36%" cy="34%" r="72%"><stop offset="0" stop-color="#8fdcff"/><stop offset=".55" stop-color="#2172d4"/><stop offset="1" stop-color="#0b2b6b"/></radialGradient>'+
      '<radialGradient id="'+p+'sh" cx="30%" cy="28%" r="80%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000418" stop-opacity=".6"/></radialGradient>'+
      '<clipPath id="'+p+'ec"><circle cx="50" cy="51" r="23"/></clipPath>';
    g='<circle cx="50" cy="51" r="25.5" fill="#7fd8ff" opacity=".18"/>'+
      '<circle cx="50" cy="51" r="23" fill="url(#'+p+'oc)"/>'+
      '<g clip-path="url(#'+p+'ec)"><path d="M33 40C37 31 48 33 50 40C52 46 44 50 46 56C42 61 33 55 33 48Z" fill="#5fcf8a"/><path d="M56 55C62 50 73 54 70 63C66 71 58 69 56 63Z" fill="#53c07c"/><path d="M58 31C62 29 67 33 63 37C60 38 56 35 58 31Z" fill="#6fd894"/>'+
      '<path d="M28 46C38 42 46 50 58 46M40 64C48 60 56 66 70 60M52 36C58 34 64 38 72 36" stroke="#fff" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>'+
      '<circle cx="50" cy="51" r="23" fill="url(#'+p+'sh)"/></g>'+
      '<circle cx="50" cy="51" r="23.6" fill="none" stroke="#a6ecff" stroke-opacity=".5" stroke-width="1.2"/>'+sparkle(22,26,3,"#fff",.85);
  }else{ /* coral planet with moon */
    d='<radialGradient id="'+p+'mr" cx="36%" cy="34%" r="72%"><stop offset="0" stop-color="#ffd0b6"/><stop offset=".55" stop-color="#e8664a"/><stop offset="1" stop-color="#6e2016"/></radialGradient>'+
      '<radialGradient id="'+p+'mo" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9aa3b5"/></radialGradient>';
    g='<circle cx="46" cy="55" r="22" fill="url(#'+p+'mr)"/>'+
      '<circle cx="38" cy="50" r="3.4" fill="#7a2a1a" opacity=".35"/><circle cx="52" cy="63" r="4.2" fill="#7a2a1a" opacity=".3"/><circle cx="55" cy="47" r="2" fill="#7a2a1a" opacity=".35"/><circle cx="40" cy="64" r="1.6" fill="#7a2a1a" opacity=".3"/>'+
      '<path d="M28 54C36 52 50 58 66 52" stroke="#ffd9c4" stroke-width="1.6" fill="none" opacity=".35"/>'+
      '<circle cx="74" cy="28" r="6" fill="url(#'+p+'mo)"/><circle cx="72.5" cy="27" r="1.2" fill="#8790a3" opacity=".6"/>'+sparkle(24,26,2.6,"#fff",.8);
  }
  return {d:d,g:g};
}
var BRAIN='M30 55C26 40 38 30 48 33C50 28 62 28 66 34C76 32 80 46 74 52C78 60 70 70 62 66C58 72 44 72 40 66C30 68 26 60 30 55Z';
var GYRI='M50.5 33C48 45 53 55 50 69M38 45C42 42 44 47 40 50M61 39C65 41 63 46 67 48M41 58C45 55 47 60 45 63M58 58C62 55 64 61 60 63M54 36C56 40 54 43 58 46M44 37C42 40 46 43 43 46M33 54C36 52 37 56 35 59M68 54C66 52 65 56 67 59';
function drawBrain(p,a){
  var c=a.col,hue=a.hue||0;
  var d='<radialGradient id="'+p+'or" cx="40%" cy="36%" r="70%"><stop offset="0" stop-color="'+c[0]+'" stop-opacity=".55"/><stop offset=".6" stop-color="'+c[1]+'" stop-opacity=".32"/><stop offset="1" stop-color="'+c[2]+'" stop-opacity=".6"/></radialGradient>'+
        '<filter id="'+p+'gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>'+
        (hue?'<filter id="'+p+'hu" color-interpolation-filters="sRGB"><feColorMatrix type="hueRotate" values="'+hue+'"/>'+(a.sat?'<feColorMatrix type="saturate" values="'+a.sat+'"/>':'')+'</filter>':'');
  var g='<circle cx="50" cy="51" r="31" fill="'+c[1]+'" opacity=".45" filter="url(#'+p+'gl)"/>'+
        '<circle cx="50" cy="51" r="29" fill="url(#'+p+'or)"/>'+
        '<image href="avatar-brain.png" x="27" y="28" width="46" height="46"'+(hue?' filter="url(#'+p+'hu)"':'')+'/>'+
        '<ellipse cx="38" cy="35" rx="10" ry="4.4" fill="#fff" opacity=".28" transform="rotate(-34 38 35)"/>'+
        '<circle cx="50" cy="51" r="29" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".9"/>'+
        '<g>'+sparkle(79,24,3,"#fff",.9)+twinkle(2.4)+'</g>';
  return {d:d,g:g};
}
var CONST={
  queen:{pts:[[28,62],[32,40],[41,53],[50,32],[59,53],[68,40],[72,62],[70,71],[30,71],[50,24]],lines:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[6,7],[7,8],[8,0],[3,9]],big:[3,9]},
  archer:{pts:[[38,26],[31,38],[29,50],[31,62],[38,74],[25,50],[74,50],[67,45],[67,55]],lines:[[0,1],[1,2],[2,3],[3,4],[0,4],[5,2],[2,6],[6,7],[6,8]],big:[6,2]},
  owl:{pts:[[36,30],[40,40],[50,37],[60,40],[64,30],[42,48],[58,48],[50,55],[38,62],[50,75],[62,62]],lines:[[0,1],[1,2],[2,3],[3,4],[1,8],[8,9],[9,10],[10,3],[5,7],[6,7]],big:[5,6]},
  knight:{pts:[[44,27],[48,36],[62,43],[71,53],[65,58],[55,54],[57,71],[36,71],[35,53],[40,40],[53,42]],lines:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0]],big:[10]}
};
function drawConst(p,a){
  var k=CONST[a.fig],L="",S="";
  k.lines.forEach(function(l){var A=k.pts[l[0]],B=k.pts[l[1]];L+='<line x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'"/>'});
  k.pts.forEach(function(q,i){var big=k.big.indexOf(i)>=0,r=big?2.6:1.8;
    S+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+(r*2.2)+'" fill="#ffe7a6" opacity=".25"/><circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+r+'" fill="#fff6d8"/>';
    if(big)S+='<g>'+sparkle(q[0],q[1],6,"#fff2c4",.9)+twinkle(3+i*.3,i*.4)+'</g>'});
  return {d:'',g:'<g stroke="#f0d38a" stroke-opacity=".6" stroke-width="1" stroke-linecap="round">'+L+'</g>'+S};
}
function drawNebula(p,a){
  var c=a.col;
  var d='<filter id="'+p+'bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5.5"/></filter>'+
        '<radialGradient id="'+p+'core"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
  var g='<g clip-path="url(#'+p+'c)"><g filter="url(#'+p+'bl)">'+
        '<ellipse cx="40" cy="42" rx="24" ry="13" fill="'+c[0]+'" opacity=".85" transform="rotate(30 40 42)"/>'+
        '<ellipse cx="61" cy="59" rx="25" ry="12" fill="'+c[1]+'" opacity=".8" transform="rotate(-22 61 59)"/>'+
        '<ellipse cx="53" cy="46" rx="14" ry="10" fill="'+c[2]+'" opacity=".75"/>'+
        '<ellipse cx="33" cy="65" rx="12" ry="8" fill="'+c[1]+'" opacity=".5"/>'+
        '<ellipse cx="68" cy="32" rx="10" ry="6" fill="'+c[0]+'" opacity=".45"/>'+spin(80,1)+'</g></g>'+
        '<circle cx="51" cy="50" r="10" fill="url(#'+p+'core)"/>'+
        '<g>'+sparkle(51,50,10,"#fff",.95)+twinkle(3.4)+'</g>'+sparkle(30,30,2.4,"#fff",.8)+sparkle(72,70,2,"#fff",.7);
  return {d:d,g:g};
}
function drawHouse(p){
  return {d:'',g:'<text x="50" y="64" text-anchor="middle" fill="url(#'+p+'rm)" style="font-family:Montserrat;font-weight:600;font-size:40px">B<tspan style="font-family:Pacifico;font-weight:400;font-size:30.4px" dx="-1">W</tspan></text>'};
}


/* ---------- rank rings (n = 0..6) ---------- */
function ring(p,n){
  var d="",g="";
  if(n===0){
    g='<circle cx="50" cy="50" r="55" fill="none" stroke="#cfd6e2" stroke-opacity=".65" stroke-width="1.2"/>'+
      '<circle cx="50" cy="105" r="8" fill="#101830" stroke="#cfd6e2" stroke-width="1.2"/>'+
      '<circle cx="50" cy="101.4" r="1.9" fill="#f4dc90"/><path d="M48.6 103.2L51.4 103.2L52.4 107.6L53.6 108.6L46.4 108.6L47.6 107.6Z" fill="#f4dc90"/>'+
      sparkle(38,104.5,2.4,"#f4dc90",.9)+sparkle(62,104.5,2.4,"#f4dc90",.9);
  }else if(n===1){
    var s="";[[90,0],[124,.7],[56,1.4],[-58,2.1]].forEach(function(o,i){var q=polar(55.5,o[0]);
      s+='<g><polygon points="'+starPts(q[0],q[1],i<3?5:3.6,i<3?2.2:1.6)+'" fill="#f6d77a" stroke="#fff3c4" stroke-width=".5"/>'+twinkle(2.4+i*.4,o[1])+'</g>'});
    g='<circle cx="50" cy="50" r="55.5" fill="none" stroke="#e7d7a6" stroke-opacity=".75" stroke-width="1.3"/>'+s;
  }else if(n===2){
    var t="";for(var i=1;i<=12;i++){var q=polar(58,-90-i*5.5);t+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="'+f(3.4-i*.25)+'" fill="#bfe9ff" opacity="'+f(.85-i*.065)+'"/>'}
    d='<filter id="'+p+'cg" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2"/></filter>';
    g='<circle cx="50" cy="50" r="58" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".9" stroke-dasharray="1 4"/>'+
      '<g>'+t+'<circle cx="50" cy="-8" r="5.5" fill="#bfe9ff" filter="url(#'+p+'cg)"/><circle cx="50" cy="-8" r="3.4" fill="#fff"/>'+spin(16,1)+'</g>';
  }else if(n===3){
    var m=polar(57,-42);
    d='<linearGradient id="'+p+'mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9fbff"/><stop offset=".5" stop-color="#7fd3e6"/><stop offset="1" stop-color="#c9d6ff"/></linearGradient>'+
      '<mask id="'+p+'cm"><rect x="-30" y="-30" width="160" height="160" fill="#000"/><circle cx="'+m[0]+'" cy="'+m[1]+'" r="8.5" fill="#fff"/><circle cx="'+f(m[0]+4.4)+'" cy="'+f(m[1]-3)+'" r="7.4" fill="#000"/></mask>';
    g='<circle cx="50" cy="50" r="57" fill="none" stroke="url(#'+p+'mg)" stroke-width="2"/>'+
      '<circle cx="'+m[0]+'" cy="'+m[1]+'" r="11" fill="#0b1226"/>'+
      '<circle cx="'+m[0]+'" cy="'+m[1]+'" r="8.5" fill="#fff1bf" mask="url(#'+p+'cm)"/>';
    [-70,-20,200].forEach(function(a2){var q=polar(57,a2);g+='<circle cx="'+q[0]+'" cy="'+q[1]+'" r="1.6" fill="#e9fbff"/>'});
  }else if(n===4){
    d='<linearGradient id="'+p+'eh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7a2e" stop-opacity="0"/><stop offset=".35" stop-color="#ff9b3d"/><stop offset=".6" stop-color="#ffe08a"/><stop offset=".8" stop-color="#ffb347"/><stop offset="1" stop-color="#ff7a2e" stop-opacity=".1"/></linearGradient>'+
      '<filter id="'+p+'eg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>';
    g='<g><circle cx="50" cy="50" r="58" fill="none" stroke="url(#'+p+'eh)" stroke-width="9" filter="url(#'+p+'eg)" opacity=".8"/>'+
      '<circle cx="50" cy="50" r="58" fill="none" stroke="url(#'+p+'eh)" stroke-width="4.5"/>'+spin(18,1)+'</g>'+
      '<circle cx="50" cy="50" r="53.5" fill="none" stroke="#000" stroke-opacity=".75" stroke-width="3"/>'+
      '<g><circle cx="50" cy="50" r="64" fill="none" stroke="#ffcf7a" stroke-opacity=".45" stroke-width=".8" stroke-dasharray="14 6 3 6"/>'+spin(40,-1)+'</g>';
  }else if(n===5){
    function wave(ph){var s="";for(var a=0;a<=360;a+=3){var t=a*Math.PI/180,r=59+3.4*Math.sin(9*t+ph);s+=(a?"L":"M")+f(50+r*Math.cos(t))+" "+f(50+r*Math.sin(t))}return s+"Z"}
    d='<filter id="'+p+'qg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>';
    g='<g><path d="'+wave(0)+'" fill="none" stroke="#5ff5ff" stroke-width="3" opacity=".5" filter="url(#'+p+'qg)"/><path d="'+wave(0)+'" fill="none" stroke="#a8fbff" stroke-width="1.2"/>'+spin(30,1)+'</g>'+
      '<g><path d="'+wave(Math.PI)+'" fill="none" stroke="#c58bff" stroke-width="3" opacity=".5" filter="url(#'+p+'qg)"/><path d="'+wave(Math.PI)+'" fill="none" stroke="#dcbcff" stroke-width="1.2"/>'+spin(30,-1)+'</g>';
  }else{
    d='<linearGradient id="'+p+'kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".35" stop-color="#d4a537"/><stop offset=".62" stop-color="#8a6418"/><stop offset="1" stop-color="#f3d27a"/></linearGradient>';
    var rays="";for(var j=0;j<24;j++){var A=polar(63.5,j*15-90),B=polar(j%2?67.5:71,j*15-90);rays+='<line x1="'+A[0]+'" y1="'+A[1]+'" x2="'+B[0]+'" y2="'+B[1]+'"/>'}
    g='<g stroke="#f0d38a" stroke-opacity=".7" stroke-width="1" stroke-linecap="round">'+rays+'</g>'+
      '<circle cx="50" cy="50" r="56" fill="none" stroke="url(#'+p+'kg)" stroke-width="2.4"/><circle cx="50" cy="50" r="60.5" fill="none" stroke="url(#'+p+'kg)" stroke-width=".9"/>'+
      '<g><circle cx="'+polar(60.5,30)[0]+'" cy="'+polar(60.5,30)[1]+'" r="2.6" fill="#7fe6ff"/><circle cx="'+polar(60.5,150)[0]+'" cy="'+polar(60.5,150)[1]+'" r="2.2" fill="#ff9cc4"/><circle cx="'+polar(60.5,270)[0]+'" cy="'+polar(60.5,270)[1]+'" r="2" fill="#fff"/>'+spin(48,1)+'</g>'+
      '<polygon points="'+starPts(50,-16,7,2.9)+'" fill="url(#'+p+'kg)" stroke="#fff3c4" stroke-width=".5"/>';
  }
  return {d:d,g:g};
}


/* ---------- ranks (Board Games ladder, from skill points) ---------- */
var RANKS=[
  {name:"Baby Pawn Star",min:0},
  {name:"Whimsical Star",min:25},
  {name:"Wandering Comet",min:75},
  {name:"Rising Moon",min:150},
  {name:"Event Horizon",min:300},
  {name:"Quantum Brainwave",min:600},
  {name:"Keeper of the Cosmos",min:1000}
];
function rankOf(pts){pts=Math.max(0,Number(pts)||0);var i=0;while(i<RANKS.length-1&&pts>=RANKS[i+1].min)i++;var n=RANKS[i+1];return {i:i,name:RANKS[i].name,min:RANKS[i].min,next:n?n.min:null,nextName:n?n.name:null,pts:pts}}

/* ---------- charms: one per room, earned by beating The House at level 10 ---------- */
var CHARMS=[
  {id:"chess",name:"Event Horizon Queen",room:"Chess"},
  {id:"checkers",name:"Garden Ring",room:"Checkers"},
  {id:"backgammon",name:"Library Spectacles",room:"Backgammon"},
  {id:"yahtzee",name:"Lucky Five",room:"Yahtzee"},
  {id:"dominoes",name:"Pearl Double",room:"Dominoes"},
  {id:"othello",name:"Terrace Disc",room:"Othello"},
  {id:"mancala",name:"Sea-Glass Marble",room:"Mancala"},
  {id:"cribbage",name:"Golden Peg",room:"Cribbage"},
  {id:"shutbox",name:"Tavern Nine",room:"Shut the Box"},
  {id:"morris",name:"Cloister Mill",room:"Morris"}
];
var CH={};CHARMS.forEach(function(c){CH[c.id]=c});
var GOLD="#f4d27a";
function charmIcon(id,p){
  if(id==="chess")return '<circle r="9" fill="none" stroke="#ff9b3d" stroke-opacity=".5" stroke-width=".8"/><path d="M-6.5 2.8L-6.5 -3.6L-3.2 -.4L0 -5.6L3.2 -.4L6.5 -3.6L6.5 2.8Z" fill="'+GOLD+'"/><rect x="-6.5" y="3.4" width="13" height="2" rx=".6" fill="'+GOLD+'"/><circle cy="-6.4" r="1.2" fill="#ff5c8a"/>';
  if(id==="backgammon")return '<circle cx="-4" r="3.6" fill="#cfe8ff" fill-opacity=".25" stroke="'+GOLD+'" stroke-width="1.3"/><circle cx="4" r="3.6" fill="#cfe8ff" fill-opacity=".25" stroke="'+GOLD+'" stroke-width="1.3"/><path d="M-.7 -.6Q0 -2.2 .7 -.6M-7.6 -.6L-9.2 -2.6M7.6 -.6L9.2 -2.6" stroke="'+GOLD+'" stroke-width="1.1" fill="none" stroke-linecap="round"/><circle cx="-5" cy="-1.2" r=".8" fill="#fff" opacity=".7"/>';
  if(id==="checkers")return '<circle r="7" fill="#7fd0c8" stroke="#f5efe0" stroke-width="1.5"/><circle r="4" fill="none" stroke="#f5efe0" stroke-opacity=".7" stroke-width=".8"/>';
  if(id==="othello")return '<circle r="7" fill="#f4efe2"/><path d="M0 -7A7 7 0 0 1 0 7Z" fill="#2f56c9"/><circle r="7" fill="none" stroke="'+GOLD+'" stroke-width=".9"/>';
  if(id==="yahtzee"){var pp=[[-3.2,-3.2],[3.2,-3.2],[0,0],[-3.2,3.2],[3.2,3.2]].map(function(q){return '<circle cx="'+q[0]+'" cy="'+q[1]+'" r="1.15" fill="#1b2340"/>'}).join("");
    return '<rect x="-6.6" y="-6.6" width="13.2" height="13.2" rx="2.4" fill="#fbf6e8" transform="rotate(-10)"/><g transform="rotate(-10)">'+pp+'</g>';}
  if(id==="dominoes"){var six=function(y){return [-2,2].map(function(x){return [-2.4,0,2.4].map(function(dy){return '<circle cx="'+x+'" cy="'+(y+dy*.75)+'" r=".75" fill="#1b2340"/>'}).join("")}).join("")};
    return '<g transform="rotate(-18)"><rect x="-4.6" y="-8.4" width="9.2" height="16.8" rx="1.8" fill="#f6f1e6" stroke="'+GOLD+'" stroke-width=".7"/><line x1="-3.4" y1="0" x2="3.4" y2="0" stroke="#b9ad93" stroke-width=".7"/>'+six(-4.2)+six(4.2)+'</g>';}
  if(id==="mancala")return '<circle r="6.6" fill="url(#'+p+'sgm)"/><ellipse cx="-2.2" cy="-2.6" rx="2.2" ry="1.3" fill="#fff" opacity=".7" transform="rotate(-30 -2.2 -2.6)"/>';
  if(id==="cribbage")return '<g transform="rotate(20)"><ellipse cx="0" cy="-5" rx="3" ry="2.6" fill="'+GOLD+'"/><path d="M-1.8 -3L1.8 -3L1 7.4Q0 8.6 -1 7.4Z" fill="'+GOLD+'"/><ellipse cx="-.9" cy="-5.8" rx="1" ry=".7" fill="#fff" opacity=".6"/></g>';
  if(id==="shutbox")return '<rect x="-5.6" y="-7.4" width="11.2" height="14.8" rx="1.4" fill="#f3ead6" stroke="'+GOLD+'" stroke-width=".8"/><text x="0" y="4" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="11" fill="#2a1d10">9</text>';
  if(id==="morris")return '<g fill="none" stroke="'+GOLD+'" stroke-width=".9"><rect x="-7" y="-7" width="14" height="14"/><rect x="-4.4" y="-4.4" width="8.8" height="8.8"/><rect x="-1.8" y="-1.8" width="3.6" height="3.6"/><path d="M0 -7V-1.8M0 1.8V7M-7 0H-1.8M1.8 0H7"/></g><circle cx="-7" cy="-7" r="1.4" fill="#f4efe2"/><circle cx="0" cy="-7" r="1.4" fill="#f4efe2"/><circle cx="7" cy="-7" r="1.4" fill="#f4efe2"/>';
  return "";
}
function charmDefs(p){return '<linearGradient id="'+p+'cmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".5" stop-color="#c99a32"/><stop offset="1" stop-color="#f3d27a"/></linearGradient>'+
  '<radialGradient id="'+p+'sgm" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#e2fff8"/><stop offset=".6" stop-color="#6fcfc0"/><stop offset="1" stop-color="#2b8a80"/></radialGradient>'}
function coin(p,id){return '<circle r="12.5" fill="#0d1430" stroke="url(#'+p+'cmg)" stroke-width="1.8"/><circle r="10.6" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width=".6"/>'+charmIcon(id,p)}
function charm(p,id,ringed){var c=ringed?[91,91]:[86,86];return {d:charmDefs(p),g:'<g transform="translate('+c[0]+' '+c[1]+')">'+coin(p,id)+'</g>'}}

/* ---------- catalogue ---------- */
var FAMS=[
  {key:"spark",title:"Whim Sparks",tier:"free",blurb:"Little star creatures: the BrainWhim mascots.",items:[
    {id:"sunny",name:"Sunny Spark",col:["#fff6c4","#f5c542","#d38a14"],face:"smile"},
    {id:"rosy",name:"Rosy Spark",col:["#ffe6ef","#ff8fb8","#d94f86"],face:"wink"},
    {id:"mint",name:"Mint Spark",col:["#e8fff7","#6fe0c0","#25977f"],face:"awe"},
    {id:"lilac",name:"Lilac Spark",col:["#f3e9ff","#b993ff","#7445d0"],face:"sleepy"}]},
  {key:"planet",title:"Planets & Moons",tier:"free",blurb:"Bright worlds with a bit of personality.",items:[
    {id:"ringed",name:"Saturnine",kind:"ringed"},
    {id:"moon",name:"Moonbeam",kind:"moon"},
    {id:"marble",name:"Blue Marble",kind:"marble"},
    {id:"coral",name:"Coral World",kind:"coral"}]},
  {key:"brain",title:"Brain Orbs",tier:"free",blurb:"The BrainWhim brain in a glass orb.",items:[
    {id:"cobalt",name:"Cobalt Mind",col:["#d8e6ff","#4f7dff","#1b2f9e"],hue:0},
    {id:"magenta",name:"Magenta Mind",col:["#ffdcf4","#e04fb5","#7a1866"],hue:95},
    {id:"teal",name:"Teal Mind",col:["#d8fff8","#30c8b4","#0b6b66"],hue:-50},
    {id:"goldm",name:"Golden Mind",col:["#fff3cc","#f0b53a","#8a5a10"],hue:190,sat:1.3}]},
  {key:"const",title:"Constellations",tier:"club",blurb:"The cosmic court in gold stars.",items:[
    {id:"queen",name:"The Queen",fig:"queen"},
    {id:"archer",name:"The Archer",fig:"archer"},
    {id:"owl",name:"The Owl",fig:"owl"},
    {id:"knight",name:"The Knight",fig:"knight"}]},
  {key:"nebula",title:"Nebulae",tier:"club",blurb:"Swirling clouds of colour.",items:[
    {id:"rose",name:"Rose Nebula",col:["#ff6fb1","#7a5cff","#ffb3d9"]},
    {id:"aurora",name:"Aurora Nebula",col:["#3ef0c0","#6a5cff","#b8fff0"]},
    {id:"ember",name:"Ember Nebula",col:["#ff8a3d","#c4243f","#ffd27a"]}]}
];
var BY={};FAMS.forEach(function(F){F.items.forEach(function(it){it.fam=F.key;it.tier=F.tier;BY[it.id]=it})});
BY.house={id:"house",fam:"house",tier:"club",name:"The House"};
BY.guest={id:"guest",fam:"guest",tier:"free",name:"Guest"};
var DEFAULT="sunny";
function drawGuest(p){
  return {d:'<linearGradient id="'+p+'gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6ecf6" stop-opacity=".75"/><stop offset="1" stop-color="#9fb0cc" stop-opacity=".45"/></linearGradient>',
    g:'<circle cx="50" cy="41" r="13" fill="url(#'+p+'gs)"/><path d="M24 84C26 66 37 58 50 58C63 58 74 66 76 84Z" fill="url(#'+p+'gs)"/>'};
}

function avatar(id,o){
  o=o||{};var a=BY[id]||BY[DEFAULT],p="bwa"+(++uid)+"_",seed=hash(a.id);
  var club=a.tier==="club",bg=club?bgClub(p,seed):bgFree(p,seed),rim=club?rimClub(p):rimFree(p);
  var body=a.fam==="spark"?drawSpark(p,a):a.fam==="planet"?drawPlanet(p,a):a.fam==="brain"?drawBrain(p,a):a.fam==="const"?drawConst(p,a):a.fam==="nebula"?drawNebula(p,a):a.fam==="guest"?drawGuest(p):drawHouse(p);
  var ringed=o.ring!=null&&o.ring>=0,rg=ringed?ring(p,o.ring):{d:"",g:""};
  var ch=o.charm&&CH[o.charm]?charm(p,o.charm,ringed):{d:"",g:""};
  var vb=ringed?"-27 -27 154 154":(ch.g?"-4 -4 112 112":"-4 -4 108 108");
  var sz=o.size||110,title=o.title||a.name;
  return '<svg class="bwa-svg" viewBox="'+vb+'" width="'+sz+'" height="'+sz+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc(title)+'"><defs><clipPath id="'+p+'c"><circle cx="50" cy="50" r="47"/></clipPath>'+bg.d+rim.d+body.d+rg.d+ch.d+'</defs>'+
    rg.g+bg.g+'<g clip-path="url(#'+p+'c)">'+body.g+'</g>'+rim.g+ch.g+'</svg>';
}
function charmSvg(id,size,dim){var p="bwc"+(++uid)+"_";return '<svg class="bwa-svg" viewBox="-15 -15 30 30" width="'+size+'" height="'+size+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+esc((CH[id]||{}).name||"")+'"'+(dim?' opacity=".32"':'')+'><defs>'+charmDefs(p)+'</defs>'+coin(p,id)+'</svg>'}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}

/* ---------- people: what to show for a profile ----------
   A profile is a row from profiles (avatar, avatar_charm, charms, skill_points, member) or null for a guest.
   A Club avatar shows only while the player is a member; otherwise the default Sunny Spark. */
function resolve(prof){
  if(prof==="house")return {id:"house",ring:-1,charm:null,rank:null};
  if(!prof)return {id:"guest",ring:-1,charm:null,rank:null};
  var id=BY[prof.avatar]&&prof.avatar!=="house"&&prof.avatar!=="guest"?prof.avatar:DEFAULT;
  if(BY[id].tier==="club"&&!prof.member)id=DEFAULT;
  var r=rankOf(prof.skill_points),ch=prof.avatar_charm&&CH[prof.avatar_charm]?prof.avatar_charm:null;
  return {id:id,ring:r.i,charm:ch,rank:r};
}
/* html(profile|"house"|null, {size, ring:true, charm:true}) */
function html(prof,o){
  o=o||{};var R=resolve(prof),ringed=o.ring!==false&&R.ring>=0,size=o.size||40;
  /* even:true draws an avatar without a ring at the same face size as one with a ring (centred in the same box) */
  if(o.even&&!ringed)return '<span style="display:flex;align-items:center;justify-content:center;width:'+size+'px;height:'+size+'px">'+avatar(R.id,{size:Math.round(size*108/154),charm:o.charm===false?null:R.charm,title:o.title})+'</span>';
  return avatar(R.id,{size:size,ring:ringed?R.ring:-1,charm:o.charm===false?null:R.charm,title:o.title});
}

/* ---------- charms earned (this device + the account) ---------- */
function localCharms(){try{return JSON.parse(localStorage.getItem("bwCharms")||"[]")||[]}catch(e){return []}}
function myProfile(){try{return (window.BW&&BW.profile&&BW.profile())||null}catch(e){return null}}
function myUser(){try{return (window.BW&&BW.user&&BW.user())||null}catch(e){return null}}
function client(){try{return window.BW&&BW.client&&BW.client()}catch(e){return null}}
function earned(){
  var set={},p=myProfile();localCharms().forEach(function(c){set[c]=1});
  if(p&&p.charms)[].concat(p.charms).forEach(function(c){set[c]=1});
  return CHARMS.filter(function(c){return set[c.id]}).map(function(c){return c.id});
}
/* called by the room when The House is beaten at its top level; returns the charm if it's new */
function earn(game){
  if(!CH[game])return null;
  var have=earned().indexOf(game)>=0,loc=localCharms();
  if(loc.indexOf(game)<0){loc.push(game);try{localStorage.setItem("bwCharms",JSON.stringify(loc))}catch(e){}}
  syncCharms();
  return have?null:CH[game];
}
/* copy charms earned on this device onto the account, so they show on every device */
function syncCharms(){
  var c=client(),u=myUser(),p=myProfile();if(!c||!u||!p||!("charms" in p))return;
  var all=earned();if(all.length===[].concat(p.charms||[]).length)return;
  p.charms=all;c.from("profiles").update({charms:all}).eq("id",u.id).then(function(){},function(){});
}
/* look up profiles (with avatars if the database has them yet) */
var COLS="avatar,avatar_charm,charms,";
function fetchProfiles(sb,ids,base){
  base=base||"id,username,display_name,skill_points,member";
  var q=function(cols){return sb.from("profiles").select(cols).in("id",ids)};
  return Promise.resolve(q(COLS+base)).then(function(r){if(r&&r.error)return q(base);return r}).then(function(r){return (r&&r.data)||[]},function(){return []});
}

/* ---------- the Identity studio ---------- */
var CSS='.bwa-veil{position:fixed;inset:0;z-index:2147480000;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:12px}'+
'.bwa-veil.on{display:flex}'+
'.bwa-box{width:min(600px,96vw);max-height:90dvh;overflow:auto;background:rgba(15,23,42,.88);border:1px solid rgba(255,255,255,.18);border-radius:18px;box-shadow:0 24px 50px rgba(0,0,0,.45);color:#fff;font-family:Montserrat,system-ui,sans-serif;padding:20px 18px 18px;-webkit-overflow-scrolling:touch}'+
'.bwa-kick{margin:0 0 12px;text-align:center;color:#e6c25a;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}'+
'.bwa-top{display:flex;align-items:center;gap:16px;margin:0 0 6px}'+
'.bwa-top .bwa-big{flex:none;display:flex}'+
'.bwa-top h3{margin:0 0 4px;font-size:19px;font-weight:700}'+
'.bwa-top p{margin:0;font-size:13px;line-height:1.5;color:rgba(255,255,255,.8)}'+
'.bwa-top .bwa-rank{color:#e6c25a;font-weight:700}'+
'.bwa-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.12);margin:8px 0 2px;overflow:hidden;max-width:240px}.bwa-bar i{display:block;height:100%;background:linear-gradient(90deg,#c99a32,#f6dc8a)}'+
'.bwa-h{display:flex;align-items:baseline;gap:8px;margin:16px 0 6px;font-size:13px;font-weight:700}.bwa-h span{font-weight:500;font-size:12px;color:rgba(255,255,255,.6)}'+
'.bwa-h em{font-style:normal;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;padding:2px 6px;border-radius:5px;color:#1d1606;background:linear-gradient(135deg,#f6dc8a,#d3a43a)}'+
'.bwa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px}'+
'.bwa-pick{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px 5px;border-radius:10px;border:1px solid transparent;background:transparent;color:rgba(255,255,255,.85);font:600 10.5px Montserrat,system-ui,sans-serif;cursor:pointer;line-height:1.2;text-align:center}'+
'.bwa-pick:hover{background:rgba(255,255,255,.06)}'+
'.bwa-pick.on{border-color:rgba(230,194,90,.8);background:rgba(230,194,90,.1)}'+
'.bwa-pick.lock .bwa-svg{opacity:.45;filter:grayscale(.35)}'+
'.bwa-pick.lock::after{content:"\\1F512";position:absolute;top:6px;right:8px;font-size:11px}'+
'.bwa-none{width:52px;height:52px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:11px;color:rgba(255,255,255,.6)}'+
'.bwa-note{min-height:18px;margin:10px 0 0;text-align:center;font-size:12.5px;color:#e6c25a}'+
'.bwa-row{display:flex;gap:10px;margin-top:12px}'+
'.bwa-btn{flex:1;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:700 14px Montserrat,system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none}'+
'.bwa-btn.go{color:#e6c25a;border-color:rgba(230,194,90,.55)}'+
'.bwa-btn.quiet{background:transparent;color:rgba(255,255,255,.75)}'+
'.bwa-btn[disabled]{opacity:.5;cursor:default}'+
'.bwa-av{display:inline-flex;flex:none;line-height:0}.bwa-av svg{width:100%;height:100%}'+
'@media (max-width:480px){.bwa-h{display:block}.bwa-h span{display:block;margin-top:2px}.bwa-h em{margin-left:6px}.bwa-top{gap:10px}.bwa-top .bwa-big svg{width:104px;height:104px}.bwa-grid{grid-template-columns:repeat(4,1fr)}}';
var veil=null,box=null;
function ensureUI(){
  if(veil)return;
  var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
  veil=document.createElement("div");veil.className="bwa-veil";veil.setAttribute("role","dialog");veil.setAttribute("aria-label","Your Avatar");
  box=document.createElement("div");box.className="bwa-box";veil.appendChild(box);document.body.appendChild(veil);
  veil.addEventListener("click",function(e){if(e.target===veil)close()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&veil.classList.contains("on"))close()});
}
function close(){if(veil)veil.classList.remove("on")}
function studio(){
  ensureUI();
  var u=myUser(),p=myProfile();
  var guest=!u||u.is_anonymous||(p&&p.is_guest);
  if(guest){
    box.innerHTML='<p class="bwa-kick">Your Avatar</p><div class="bwa-top"><div class="bwa-big">'+avatar("guest",{size:120})+'</div><div><h3>Choose Your Avatar</h3><p>Create a free account to pick an avatar, earn rank rings as you play, and win a charm in every room.</p></div></div>'+
      '<div class="bwa-row"><button class="bwa-btn go" type="button" data-a="join">Create Free Account</button><button class="bwa-btn quiet" type="button" data-a="close">Close</button></div>';
    box.querySelector('[data-a="join"]').onclick=function(){close();if(window.BW&&BW.openAuth)BW.openAuth({reason:"Choose an avatar and earn rank rings."})};
    box.querySelector('[data-a="close"]').onclick=close;
    veil.classList.add("on");return;
  }
  p=p||{};
  var noCols=!("avatar" in p);
  var member=!!p.member,cur=resolve(p),pick=cur.id,charmPick=cur.charm,have=earned(),rk=rankOf(p.skill_points);
  function render(){
    var a=BY[pick];
    var nextTxt=rk.next!=null?(rk.pts+" points · "+(rk.next-rk.pts)+" more for "+rk.nextName):(rk.pts+" points · the top rank");
    var pct=rk.next!=null?Math.round((rk.pts-rk.min)/(rk.next-rk.min)*100):100;
    var h='<p class="bwa-kick">Your Avatar</p><div class="bwa-top"><div class="bwa-big">'+avatar(pick,{size:136,ring:rk.i,charm:charmPick})+'</div><div><h3>'+esc(a.name)+'</h3><p><span class="bwa-rank">'+esc(rk.name)+'</span><br>'+esc(nextTxt)+'</p><div class="bwa-bar"><i style="width:'+pct+'%"></i></div><p style="font-size:11.5px;color:rgba(255,255,255,.6)">Your ring grows with your Board Games points.</p></div></div>';
    FAMS.forEach(function(F){
      h+='<div class="bwa-h">'+esc(F.title)+(F.tier==="club"?' <em>Club</em>':'')+'<span>'+esc(F.blurb)+'</span></div><div class="bwa-grid">';
      F.items.forEach(function(it){var lock=F.tier==="club"&&!member;
        h+='<button type="button" class="bwa-pick'+(it.id===pick?' on':'')+(lock?' lock':'')+'" data-av="'+it.id+'">'+avatar(it.id,{size:54})+'<span>'+esc(it.name)+'</span></button>'});
      h+='</div>';
    });
    h+='<div class="bwa-h">Charms<span>Beat The House at level 10 in a room to earn its charm.</span></div><div class="bwa-grid">';
    h+='<button type="button" class="bwa-pick'+(!charmPick?' on':'')+'" data-ch=""><span class="bwa-none">None</span><span>No Charm</span></button>';
    CHARMS.forEach(function(c){var got=have.indexOf(c.id)>=0;
      h+='<button type="button" class="bwa-pick'+(c.id===charmPick?' on':'')+(got?'':' lock')+'" data-ch="'+c.id+'">'+charmSvg(c.id,48,false)+'<span>'+esc(c.name)+'</span></button>'});
    h+='</div><p class="bwa-note" id="bwaNote">'+(noCols?'Saving avatars switches on once the database update is run.':'')+'</p>';
    h+='<div class="bwa-row"><button class="bwa-btn go" type="button" data-a="save"'+(noCols?' disabled':'')+'>Save</button><button class="bwa-btn quiet" type="button" data-a="close">Cancel</button></div>';
    box.innerHTML=h;
    var note=box.querySelector("#bwaNote");
    [].forEach.call(box.querySelectorAll("[data-av]"),function(b){b.onclick=function(){var id=b.getAttribute("data-av");
      if(BY[id].tier==="club"&&!member){note.innerHTML='Club avatars come with the Club. <a href="member.html" style="color:#e6c25a">See the Club</a>';return}
      pick=id;render()}});
    [].forEach.call(box.querySelectorAll("[data-ch]"),function(b){b.onclick=function(){var id=b.getAttribute("data-ch");
      if(id&&have.indexOf(id)<0){note.textContent="Beat The House at level 10 in "+CH[id].room+" to earn the "+CH[id].name+".";return}
      charmPick=id||null;render()}});
    box.querySelector('[data-a="close"]').onclick=close;
    box.querySelector('[data-a="save"]').onclick=function(){save(this,note)};
  }
  function save(btnEl,note){
    var c=client();if(!c||!u){note.textContent="Please sign in again.";return}
    btnEl.disabled=true;note.textContent="Saving…";
    var row={avatar:pick,avatar_charm:charmPick};
    Promise.resolve(c.from("profiles").update(row).eq("id",u.id)).then(function(r){
      if(r&&r.error){btnEl.disabled=false;note.textContent=/club/i.test(r.error.message||"")?"That avatar is for Club members.":"Couldn't save just now. Please try again.";return}
      var prof=myProfile();if(prof){prof.avatar=pick;prof.avatar_charm=charmPick}
      close();try{window.dispatchEvent(new CustomEvent("bw-avatar",{detail:row}))}catch(e){}
    },function(){btnEl.disabled=false;note.textContent="Couldn't save just now. Please try again."});
  }
  render();veil.classList.add("on");
  syncCharms();
}

window.BWAvatar={svg:avatar,html:html,resolve:resolve,rank:rankOf,RANKS:RANKS,CHARMS:CHARMS,FAMILIES:FAMS,charm:charmSvg,
  studio:studio,close:close,earn:earn,earned:earned,fetch:fetchProfiles,cols:COLS};
})();
