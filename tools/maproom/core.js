/* ===== The Map Room core (rules, graded solver, daily picker): shared by the page and the tools =====
   An n x n chart of the sea, with a brass pin at every grid corner. Draw ONE closed coastline along the lines between
   the pins: no branches, no crossings, no loose ends. A number tells how many of its square's four sides the coast
   runs along. Every daily chart is worked out step by step with no guessing by a careful-cartographer solver that
   scores each kind of reasoning it needs (so every chart has exactly one answer). The score sets the day; the same
   solver drives the hints. The daily charts come from a graded pool grown offline (tools/maproom/grow.js) and are
   "dressed" for the date by turning or flipping the chart, which never changes the reasoning needed. */
(function(root){
"use strict";
function rng(seed){ var h=1779033703^seed.length; for(var i=0;i<seed.length;i++){ h=Math.imul(h^seed.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
  return function(){ h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); h^=h>>>16; return (h>>>0)/4294967296; }; }
function shuffle(a,r){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(r()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

/* ---------- geometry: edges, the pins (vertices) they join, the squares beside them ---------- */
var GEO={};
function geom(n){
  if(GEO[n]) return GEO[n];
  var HN=(n+1)*n, E=2*HN, V=(n+1)*(n+1), i, r, c;
  function H(r,c){ return r*n+c; } function Vt(r,c){ return HN+r*(n+1)+c; } function P(r,c){ return r*(n+1)+c; }
  var cellE=[], vertE=[], edgeV=[], edgeC=[], corner=[];
  for(i=0;i<V;i++) vertE.push([]);
  for(i=0;i<E;i++) edgeC.push([]);
  for(r=0;r<=n;r++) for(c=0;c<n;c++){ var e=H(r,c); edgeV[e]=[P(r,c),P(r,c+1)]; vertE[P(r,c)].push(e); vertE[P(r,c+1)].push(e); }
  for(r=0;r<n;r++) for(c=0;c<=n;c++){ var e2=Vt(r,c); edgeV[e2]=[P(r,c),P(r+1,c)]; vertE[P(r,c)].push(e2); vertE[P(r+1,c)].push(e2); }
  for(r=0;r<n;r++) for(c=0;c<n;c++){ var ci=r*n+c, L=[H(r,c),H(r+1,c),Vt(r,c),Vt(r,c+1)]; cellE.push(L); L.forEach(function(x){ edgeC[x].push(ci); });
    /* its four corners: the pin, the square's two sides at that pin, and the pin's other paths (outward) */
    var cs=[[P(r,c),H(r,c),Vt(r,c)],[P(r,c+1),H(r,c),Vt(r,c+1)],[P(r+1,c),H(r+1,c),Vt(r,c)],[P(r+1,c+1),H(r+1,c),Vt(r,c+1)]];
    corner.push(cs.map(function(k){ return {v:k[0],a:k[1],b:k[2],out:vertE[k[0]].filter(function(x){ return x!==k[1]&&x!==k[2]; })}; })); }
  return (GEO[n]={n:n,HN:HN,E:E,V:V,cellE:cellE,vertE:vertE,edgeV:edgeV,edgeC:edgeC,corner:corner,H:H,Vt:Vt,P:P});
}

/* ---------- the careful cartographer ----------
   Edge states: 0 not yet known, 1 coast, -1 sea (a cross). Each rule finds one step; LVL is the hardest rule allowed.
   1 count:  a number with all its coast, or needing every side it has left; a pin with the coast through it, or one way on
   2 loop:   a line that would close a small loop while other coast is left out
   3 corner: a 1 or 3 tucked into a corner the coast can't leave by
   4 ahead:  try a line (or a cross) and follow the simple steps until the coast breaks */
var COST={count:1,loop:3,corner:4,ahead:14};
function solver(G,clue){
  var n=G.n, E=G.E;
  function bad(){ return {k:"bad"}; }
  function cellStep(s,i){
    var q=clue[i]; if(q<0) return null; var L=G.cellE[i], on=0, un=[];
    for(var j=0;j<4;j++){ var x=s[L[j]]; if(x===1) on++; else if(x===0) un.push(L[j]); }
    if(on>q||on+un.length<q) return bad();
    if(!un.length) return null;
    if(on===q) return {k:"full",lvl:1,cell:i,set:un.map(function(e){ return [e,-1]; })};
    if(on+un.length===q) return {k:"need",lvl:1,cell:i,set:un.map(function(e){ return [e,1]; })};
    return null;
  }
  function vertStep(s,v){
    var L=G.vertE[v], on=0, un=[];
    for(var j=0;j<L.length;j++){ var x=s[L[j]]; if(x===1) on++; else if(x===0) un.push(L[j]); }
    if(on>2||(on===1&&!un.length)) return bad();
    if(!un.length) return null;
    if(on===2) return {k:"vfull",lvl:1,v:v,set:un.map(function(e){ return [e,-1]; })};
    if(on===1&&un.length===1) return {k:"vgo",lvl:1,v:v,set:[[un[0],1]]};
    if(on===0&&un.length===1) return {k:"vdead",lvl:1,v:v,set:[[un[0],-1]]};
    return null;
  }
  /* path pieces: which pins the coast lines join (union-find), and how many lines in each piece */
  function pieces(s){
    var par=new Int32Array(G.V), cnt=new Int32Array(G.V), i;
    for(i=0;i<G.V;i++) par[i]=i;
    function f(x){ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; }
    var cyc=0;
    for(i=0;i<E;i++) if(s[i]===1){ var a=f(G.edgeV[i][0]), b=f(G.edgeV[i][1]); if(a===b){ cyc++; cnt[a]++; } else { par[a]=b; cnt[b]+=cnt[a]+1; } }
    return {f:f,cnt:cnt,cyc:cyc};
  }
  function total(s){ var t=0; for(var i=0;i<E;i++) if(s[i]===1) t++; return t; }
  function cluesMetIf(s,e){ /* would every number be satisfied with e drawn too? */
    s[e]=1; var ok=true; for(var i=0;i<n*n&&ok;i++){ if(clue[i]<0) continue; var L=G.cellE[i], on=0; for(var j=0;j<4;j++) if(s[L[j]]===1) on++; if(on!==clue[i]) ok=false; } s[e]=0; return ok; }
  function loopStep(s){
    var p=pieces(s), t=total(s);
    if(p.cyc){ /* a closed loop: only fine if it is the whole coast and every number is met */
      if(p.cyc>1) return bad();
      for(var i=0;i<E;i++) if(s[i]===1){ var root=p.f(G.edgeV[i][0]); if(p.cnt[root]!==t) return bad(); break; }
      var un=[]; for(var k=0;k<E;k++) if(s[k]===0) un.push(k);
      for(var c=0;c<n*n;c++){ if(clue[c]<0) continue; var on=0; G.cellE[c].forEach(function(x){ if(s[x]===1) on++; }); if(on!==clue[c]) return bad(); }
      return un.length?{k:"done",lvl:2,set:un.map(function(e){ return [e,-1]; })}:null;
    }
    for(var e=0;e<E;e++){ if(s[e]!==0) continue; var a=p.f(G.edgeV[e][0]), b=p.f(G.edgeV[e][1]);
      if(a!==b) continue;
      /* same piece: drawing it closes a loop */
      if(p.cnt[a]===t&&cluesMetIf(s,e)) return {k:"close",lvl:2,e:e,set:[[e,1]]};
      return {k:"loop",lvl:2,e:e,set:[[e,-1]]};
    }
    return null;
  }
  function cornerStep(s){
    for(var i=0;i<n*n;i++){ var q=clue[i]; if(q!==1&&q!==3) continue;
      var C=G.corner[i];
      for(var j=0;j<4;j++){ var k=C[j]; if(s[k.a]!==0||s[k.b]!==0) continue;
        var shut=k.out.every(function(x){ return s[x]===-1; }); if(!shut) continue;
        return {k:q===1?"c1":"c3",lvl:3,cell:i,v:k.v,set:[[k.a,q===1?-1:1],[k.b,q===1?-1:1]]}; }
    }
    return null;
  }
  function apply(s,st){ for(var j=0;j<st.set.length;j++) s[st.set[j][0]]=st.set[j][1]; }
  /* the simple steps, in batches, until nothing more follows; false if the coast breaks */
  function prop(s,lvl){
    for(var guard=0;guard<4000;guard++){
      var any=false, i, st;
      for(i=0;i<n*n;i++){ st=cellStep(s,i); if(st){ if(st.k==="bad") return false; apply(s,st); any=true; } }
      for(i=0;i<G.V;i++){ st=vertStep(s,i); if(st){ if(st.k==="bad") return false; apply(s,st); any=true; } }
      if(any) continue;
      if(lvl>=2){ st=loopStep(s); if(st){ if(st.k==="bad") return false; apply(s,st); continue; } }
      if(lvl>=3){ st=cornerStep(s); if(st){ apply(s,st); continue; } }
      return true;
    }
    return true;
  }
  function aheadStep(s,lvl){
    for(var e=0;e<E;e++){ if(s[e]!==0) continue;
      for(var t=0;t<2;t++){ var v=t?-1:1, c=Int8Array.from(s); c[e]=v;
        if(!prop(c,Math.min(lvl,3))) return {k:"ahead",lvl:4,e:e,tried:v,set:[[e,-v]]}; }
    }
    return null;
  }
  /* one step: the easiest the chart allows */
  function step(s,lvl){
    var i, st;
    for(i=0;i<n*n;i++){ st=cellStep(s,i); if(st) return st; }
    for(i=0;i<G.V;i++){ st=vertStep(s,i); if(st) return st; }
    if(lvl>=2){ st=loopStep(s); if(st) return st; }
    if(lvl>=3){ st=cornerStep(s); if(st) return st; }
    if(lvl>=4){ st=aheadStep(s,lvl); if(st) return st; }
    return null;
  }
  /* solve and score: every rule use costs its price */
  function run(lvl,start){
    var s=start?Int8Array.from(start):new Int8Array(E), score=0, used={}, steps=0, top=0;
    for(var g=0;g<5000;g++){
      var st=step(s,lvl); if(!st) break; if(st.k==="bad") return {ok:false,score:score,bad:true};
      var key=st.lvl===1?"count":st.lvl===2?"loop":st.lvl===3?"corner":"ahead";
      score+=COST[key]; used[key]=(used[key]||0)+1; steps++; if(st.lvl>top) top=st.lvl; apply(s,st);
    }
    for(var e=0;e<E;e++) if(s[e]===0) return {ok:false,score:score,used:used,s:s};
    var p=pieces(s); if(p.cyc!==1) return {ok:false,score:score,used:used,s:s};
    return {ok:true,score:Math.round(score),used:used,steps:steps,top:top,s:s};
  }
  return {step:step,run:run,prop:prop,apply:apply,pieces:pieces};
}
function grade(p,lvl){ return solver(geom(p.n),p.clue).run(lvl==null?4:lvl); }

/* ---------- making a chart (used offline by the grower, and for practice) ----------
   Grow one island square by square (it stays in one piece, the sea stays open to the edge, and no two squares meet only
   at a corner), number every square by its coast, then take numbers away while the chart can still be worked out. */
function island(n,r,frac){
  var N=n*n, inn=new Uint8Array(N), size=0;
  function at(R,C){ return R<0||C<0||R>=n||C>=n?0:inn[R*n+C]; }
  function pinchFree(i){ var R=(i/n)|0, C=i%n;
    for(var dr=0;dr<=1;dr++) for(var dc=0;dc<=1;dc++){ var r0=R-1+dr, c0=C-1+dc;
      var a=at(r0,c0), b=at(r0,c0+1), c=at(r0+1,c0), d=at(r0+1,c0+1);
      if(a===d&&b===c&&a!==b) return false; }
    return true; }
  function seaOpen(){ var seen=new Uint8Array(N), q=[], i, k=0, out=0;
    for(i=0;i<N;i++){ var R=(i/n)|0, C=i%n; if(!inn[i]){ out++; if(R===0||C===0||R===n-1||C===n-1){ seen[i]=1; q.push(i); } } }
    while(q.length){ var x=q.pop(); k++; var R2=(x/n)|0, C2=x%n; [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){ var y=R2+d[0], z=C2+d[1]; if(y<0||z<0||y>=n||z>=n) return; var j=y*n+z; if(!inn[j]&&!seen[j]){ seen[j]=1; q.push(j); } }); }
    return k===out; }
  var s0=Math.floor(r()*N); inn[s0]=1; size=1;
  var goal=Math.round(N*frac), tries=0;
  while(size<goal&&tries<N*40){ tries++;
    var fr=[]; for(var i=0;i<N;i++){ if(inn[i]) continue; var R=(i/n)|0, C=i%n; if(at(R-1,C)||at(R+1,C)||at(R,C-1)||at(R,C+1)) fr.push(i); }
    if(!fr.length) break; var c=fr[Math.floor(r()*fr.length)];
    inn[c]=1; if(!pinchFree(c)||!seaOpen()){ inn[c]=0; continue; } size++;
  }
  return inn;
}
function numbers(n,inn){ var cl=[]; for(var R=0;R<n;R++) for(var C=0;C<n;C++){ var me=inn[R*n+C], k=0;
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){ var y=R+d[0], z=C+d[1], o=y<0||z<0||y>=n||z>=n?0:inn[y*n+z]; if(o!==me) k++; }); cl.push(k); } return cl; }
function make(seed,spec){
  var r=rng(seed), n=spec.n;
  var inn=island(n,r,spec.frac||(.42+r()*.16)), clue=numbers(n,inn), G=geom(n), S=solver(G,clue);
  var order=shuffle(Array.from({length:n*n},function(_,i){ return i; }),r);
  var keep=spec.keep||0;   /* a floor on how many numbers stay: more numbers, gentler chart */
  for(var k=0;k<order.length;k++){ var i=order[k], was=clue[i];
    var left=clue.filter(function(x){ return x>=0; }).length; if(left<=keep) break;
    clue[i]=-1; if(!solver(G,clue).run(spec.lvl).ok) clue[i]=was; }
  var g=grade({n:n,clue:clue},spec.lvl);
  return {n:n,clue:clue,score:g.score,used:g.used,top:g.top,inn:Array.from(inn)};
}

/* ---------- dressing a pool chart for the day: one of eight turns and flips ---------- */
function dress(n,clue,k){
  var out=new Array(n*n);
  for(var R=0;R<n;R++) for(var C=0;C<n;C++){ var y=R, x=C, t;
    if(k&1){ x=n-1-x; } if(k&2){ y=n-1-y; } if(k&4){ t=x; x=y; y=t; }
    out[y*n+x]=clue[R*n+C]; }
  return out;
}
function decode(str){ return str.split("").map(function(ch){ return ch==="."?-1:+ch; }); }
function encode(cl){ return cl.map(function(x){ return x<0?".":String(x); }).join(""); }
/* the week: Monday's chart is small and needs only counting; each day asks a little more, Sunday needs looking ahead */
var WEEK=[
  {label:"Sunday",n:8,lvl:4},
  {label:"Monday",n:5,lvl:2},
  {label:"Tuesday",n:6,lvl:2},
  {label:"Wednesday",n:6,lvl:3},
  {label:"Thursday",n:7,lvl:3},
  {label:"Friday",n:7,lvl:4},
  {label:"Saturday",n:8,lvl:4}
];
var EPOCH=Date.UTC(2026,9,1);
function forDay(key,wd,POOL){
  var pool=POOL[wd], parts=key.split("-"), day=Math.round((Date.UTC(+parts[0],+parts[1]-1,+parts[2])-EPOCH)/864e5);
  var wk=Math.floor((day+700)/7), m=pool.length;
  var pick=wk%m, k=Math.floor(wk/m)%8;   /* a new pool chart each week; a new turn once the pool comes round again */
  var n=WEEK[wd].n, p={n:n,clue:dress(n,decode(pool[pick]),k),pick:pick,dress:k};
  return p;
}
root.MR={rng:rng,shuffle:shuffle,geom:geom,solver:solver,grade:grade,island:island,numbers:numbers,make:make,dress:dress,decode:decode,encode:encode,WEEK:WEEK,COST:COST,forDay:forDay};
})(typeof window!=="undefined"?window:globalThis);
