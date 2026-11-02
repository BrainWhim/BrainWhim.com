/* ===== The Harbor core (the boats, the harbormaster's search, the graded daily maker) =====
   A 6 × 6 marina. Each boat lies along a row (sideways) or a column (up and down) and can only slide along it.
   Your sailboat lies in the third row; slide boats out of the way until it can sail out through the harbor mouth on the right.
   One move = one boat slid any distance. The harbormaster's search explores every position the boats can reach and
   counts, from each, the fewest moves to free the sailboat; the day's puzzle is the hardest start of a cluster. */
(function(root){
"use strict";
function rng(seed){ var h=1779033703^seed.length; for(var i=0;i<seed.length;i++){ h=Math.imul(h^seed.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
  return function(){ h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); h^=h>>>16; return (h>>>0)/4294967296; }; }
var N=6, EXIT=2;
/* a boat: {r, c, len, h (true = lies along a row)}; boat 0 is your sailboat (row EXIT, length 2, along the row) */
function cells(b,pos){ var o=[]; for(var k=0;k<b.len;k++) o.push(b.h?(b.r*N+pos+k):((pos+k)*N+b.c)); return o; }
/* a position = the list of each boat's place along its line (column for sideways boats, row for up-and-down) */
function occ(B,P){ var g=new Int8Array(N*N).fill(-1); for(var i=0;i<B.length;i++){ var cs=cells(B[i],P[i]); for(var k=0;k<cs.length;k++){ if(g[cs[k]]>=0) return null; g[cs[k]]=i; } } return g; }
function key(P){ return String.fromCharCode.apply(null,P.map(function(p){ return p+48; })); }
function solvedP(B,P){ return P[0]===N-2; }
/* every single move from P: [boat, newPos] */
function moves(B,P,g){
  g=g||occ(B,P); var out=[];
  for(var i=0;i<B.length;i++){ var b=B[i], p=P[i];
    for(var q=p-1;q>=0;q--){ var c=b.h?b.r*N+q:q*N+b.c; if(g[c]>=0) break; out.push([i,q]); }
    for(var q2=p+1;q2+b.len<=N;q2++){ var e=q2+b.len-1, c2=b.h?b.r*N+e:e*N+b.c; if(g[c2]>=0) break; out.push([i,q2]); } }
  return out;
}
/* the whole cluster reachable from P: a map key -> {P, d (fewest moves to free the sailboat)} */
function cluster(B,P0,cap){
  cap=cap||60000;
  var seen=new Map(), list=[], adj=[]; seen.set(key(P0),0); list.push(P0);
  for(var h=0;h<list.length;h++){ var P=list[h], g=occ(B,P), ms=moves(B,P,g), nb=[];
    for(var m=0;m<ms.length;m++){ var Q=P.slice(); Q[ms[m][0]]=ms[m][1]; var k=key(Q), id=seen.get(k);
      if(id===undefined){ if(list.length>=cap) return null; id=list.length; seen.set(k,id); list.push(Q); } nb.push(id); }
    adj.push(nb); }
  var d=new Int32Array(list.length).fill(-1), qu=[];
  for(var i=0;i<list.length;i++) if(solvedP(B,list[i])){ d[i]=0; qu.push(i); }
  for(var j=0;j<qu.length;j++){ var u=qu[j]; for(var a=0;a<adj[u].length;a++){ var v=adj[u][a]; if(d[v]<0){ d[v]=d[u]+1; qu.push(v); } } }
  return {list:list,adj:adj,d:d,seen:seen};
}
/* the fewest moves from P, and the best next move (for the hints): a plain search outward from P */
function solve(B,P0){
  var seen=new Map(), list=[P0], from=[-1], mv=[null]; seen.set(key(P0),0);
  for(var h=0;h<list.length;h++){ var P=list[h]; if(solvedP(B,P)){ var path=[]; for(var x=h;from[x]>=0;x=from[x]) path.unshift(mv[x]); return path; }
    var ms=moves(B,P); for(var m=0;m<ms.length;m++){ var Q=P.slice(); Q[ms[m][0]]=ms[m][1]; var k=key(Q); if(seen.has(k)) continue; seen.set(k,list.length); list.push(Q); from.push(h); mv.push(ms[m]); } }
  return null;
}
/* the week: n = how many boats besides your sailboat; long = chance a boat is a three-cell launch; d = fewest moves band
   Bands set Nov 1 from a year of days (tools/harbor/check-year.js). */
var WEEK={
  1:{n:[6,8],  d:[6,9],   label:"Monday"},
  2:{n:[7,9],  d:[10,13], label:"Tuesday"},
  3:{n:[8,10], d:[14,17], label:"Wednesday"},
  4:{n:[9,11], d:[18,22], label:"Thursday"},
  5:{n:[9,12], d:[23,27], label:"Friday"},
  6:{n:[10,12],d:[28,33], label:"Saturday"},
  0:{n:[10,13],d:[34,60], label:"Sunday"}
};
function layout(r,n){
  var B=[{r:EXIT,c:0,len:2,h:true}], P=[Math.floor(r()*3)], g=new Int8Array(N*N).fill(-1);
  cells(B[0],P[0]).forEach(function(c){ g[c]=0; });
  var tries=0;
  while(B.length<n+1&&tries<400){ tries++;
    var len=r()<.3?3:2, h=r()<.5, line=Math.floor(r()*N), pos=Math.floor(r()*(N-len+1));
    if(h&&line===EXIT) continue;                       /* a boat lying across the sailboat's row would block it for good */
    var b=h?{r:line,c:0,len:len,h:true}:{r:0,c:line,len:len,h:false}, cs=cells(b,pos), ok=true;
    for(var k=0;k<cs.length;k++) if(g[cs[k]]>=0){ ok=false; break; }
    if(!ok) continue;
    cs.forEach(function(c){ g[c]=B.length; }); B.push(b); P.push(pos); }
  return {B:B,P:P};
}
/* how much each boat must move in the best solution, and whether any boat never needs to (those are dropped) */
function make(seed,spec,budget){
  var r=rng(seed), best=null, t0=Date.now(); budget=budget||4000;
  for(var t=0;t<6000;t++){
    var n=spec.n[0]+Math.floor(r()*(spec.n[1]-spec.n[0]+1)), L=layout(r,n), C=cluster(L.B,L.P);
    if(!C) continue;
    var mx=-1, at=[]; for(var i=0;i<C.d.length;i++){ if(C.d[i]>mx){ mx=C.d[i]; at=[i]; } else if(C.d[i]===mx) at.push(i); }
    if(mx<0) continue;
    var pick=null;
    if(mx>=spec.d[0]&&mx<=spec.d[1]) pick=at[Math.floor(r()*at.length)];
    else if(mx>spec.d[1]){ /* a cluster harder than the day: take a start at the day's top that no neighbor beats */
      var cand=[]; for(var j=0;j<C.d.length;j++){ if(C.d[j]<spec.d[0]||C.d[j]>spec.d[1]) continue; var top=true; for(var a=0;a<C.adj[j].length;a++) if(C.d[C.adj[j][a]]>C.d[j]){ top=false; break; } if(top) cand.push(j); }
      if(cand.length) pick=cand[Math.floor(r()*cand.length)]; }
    if(pick!=null){ var P=C.list[pick];
      var pz=trim({B:L.B,P:P.slice()}); pz.d=C.d[pick]; pz.states=C.list.length; pz.tries=t+1; pz.ms=Date.now()-t0; return pz; }
    var off=mx<spec.d[0]?spec.d[0]-mx:mx-spec.d[1]; if(!best||off<best.off) best={off:off,L:L,C:C,at:at[0]};
    if(Date.now()-t0>budget) break;
  }
  var pz2=trim({B:best.L.B,P:best.C.list[best.at].slice()}); pz2.d=best.C.d[best.at]; pz2.off=true; pz2.ms=Date.now()-t0; return pz2;
}
/* drop boats that never move in any best solution and never block (keeps the marina honest; the fewest moves stay the same) */
function trim(pz){
  /* a boat that never moves may still be a wall that matters: drop it only if the fewest moves stay the same without it */
  var B=pz.B.slice(), P=pz.P.slice(), path=solve(B,P), d=path.length;
  for(var j=B.length-1;j>=1;j--){
    var used=false; for(var m=0;m<path.length;m++) if(path[m][0]===j){ used=true; break; }
    if(used) continue;
    var B2=B.slice(0,j).concat(B.slice(j+1)), P2=P.slice(0,j).concat(P.slice(j+1)), s=solve(B2,P2);
    if(s&&s.length===d){ B=B2; P=P2; path=s; } }
  return {B:B,P:P};
}
function forDay(key,wd){ return make("hb:"+key,WEEK[wd]); }
root.HB={rng:rng,N:N,EXIT:EXIT,WEEK:WEEK,cells:cells,occ:occ,moves:moves,cluster:cluster,solve:solve,make:make,forDay:forDay,key:key,solvedP:solvedP};
})(typeof window!=="undefined"?window:globalThis);
