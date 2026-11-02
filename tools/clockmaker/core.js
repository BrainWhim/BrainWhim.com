/* ===== The Clockmaker's Bench core (rules, graded solver, daily pick): shared by the page and the tests =====
   An n x n grid of watch dials (6 x 6 or 9 x 9) is split into n gears (2 x 3 or 3 x 3 dials each).
   Fill every dial so each number 1..n appears once in every row, every column and every gear.
   Every puzzle has exactly one answer, and can be worked out step by step with no guessing: a careful-clockmaker
   solver does it, scoring each kind of reasoning it needs. The score sets the day's difficulty, and the same solver
   drives the hints. The daily puzzles come from a graded pool (made offline, tools/clockmaker), each one dressed
   differently every time it comes round: its numbers renamed and its rows and columns shuffled (keeping the
   pattern's symmetry), which never changes the reasoning it needs. */
(function(root){
"use strict";
function rng(seed){ var h=1779033703^seed.length; for(var i=0;i<seed.length;i++){ h=Math.imul(h^seed.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
  return function(){ h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); h^=h>>>16; return (h>>>0)/4294967296; }; }
function shuffle(a,r){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(r()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function bits(m){ var c=0; while(m){ m&=m-1; c++; } return c; }
function digs(m){ var o=[]; for(var d=1;m;d++,m>>=1) if(m&1) o.push(d); return o; }

/* ---------- geometry: units 0..n-1 rows, n..2n-1 columns, 2n..3n-1 gears ---------- */
var GEO={};
function geom(n){
  if(GEO[n]) return GEO[n];
  var br=n===6?2:3, bc=3, N=n*n, U=[], CU=[], PE=[], i, u;
  for(u=0;u<3*n;u++) U.push([]);
  for(i=0;i<N;i++){ var r=(i/n)|0, c=i%n, b=((r/br)|0)*(n/bc)+((c/bc)|0); U[r].push(i); U[n+c].push(i); U[2*n+b].push(i); CU.push([r,n+c,2*n+b]); }
  for(i=0;i<N;i++){ var seen={}, p=[]; for(var q=0;q<3;q++) U[CU[i][q]].forEach(function(x){ if(x!==i&&!seen[x]){ seen[x]=1; p.push(x); } }); PE.push(p); }
  return GEO[n]={n:n,N:N,br:br,bc:bc,U:U,CU:CU,PE:PE,ALL:(1<<n)-1};
}
function sees(G,a,b){ return a!==b&&(G.CU[a][0]===G.CU[b][0]||G.CU[a][1]===G.CU[b][1]||G.CU[a][2]===G.CU[b][2]); }

/* ---------- counting answers (stops at lim) ---------- */
function count(n,g,lim){
  var G=geom(n), N=G.N, a=g.slice(), rm=new Int32Array(n), cm=new Int32Array(n), bm=new Int32Array(n), found=0, first=null, i;
  for(i=0;i<N;i++) if(a[i]){ var m=1<<(a[i]-1), cu=G.CU[i]; if(rm[cu[0]]&m||cm[cu[1]-n]&m||bm[cu[2]-2*n]&m) return {n:0,sol:null}; rm[cu[0]]|=m; cm[cu[1]-n]|=m; bm[cu[2]-2*n]|=m; }
  lim=lim||2;
  (function go(){
    if(found>=lim) return;
    var best=-1, bm2=0, bc=99;
    for(var i=0;i<N;i++) if(!a[i]){ var cu=G.CU[i], f=G.ALL&~(rm[cu[0]]|cm[cu[1]-n]|bm[cu[2]-2*n]), c=bits(f); if(c<bc){ bc=c; best=i; bm2=f; if(c<2) break; } }
    if(best<0){ found++; if(!first) first=a.slice(); return; }
    if(!bc) return;
    var cu=G.CU[best];
    for(var d=1;d<=n;d++){ var m=1<<(d-1); if(!(bm2&m)) continue;
      a[best]=d; rm[cu[0]]|=m; cm[cu[1]-n]|=m; bm[cu[2]-2*n]|=m;
      go();
      a[best]=0; rm[cu[0]]&=~m; cm[cu[1]-n]&=~m; bm[cu[2]-2*n]&=~m;
      if(found>=lim) return; }
  })();
  return {n:found,sol:first};
}

/* ---------- the week ----------
   n: the grid · lvl: the hardest kind of step allowed · need: how many steps it must use of [level 2, level 3+, level 4+, level 6] ·
   score: the band its total must land in. Saturday also needs a triple or quad, or three pair-level steps.
   Set Nov 2 from the graded pool (tools/clockmaker/build-pool.js; check with tools/clockmaker/check-year.js). */
var WEEK={
  1:{n:6,lvl:2,need:[1,0,0,0],score:[25,31],label:"Monday"},
  2:{n:6,lvl:4,need:[0,1,0,0],score:[28,60],label:"Tuesday"},
  3:{n:9,lvl:2,need:[1,0,0,0],score:[55,64],label:"Wednesday"},
  4:{n:9,lvl:3,need:[0,2,0,0],score:[65,92],label:"Thursday"},
  5:{n:9,lvl:4,need:[0,1,1,0],score:[78,110],label:"Friday"},
  6:{n:9,lvl:5,need:[0,1,1,0],score:[98,140],label:"Saturday"},
  0:{n:9,lvl:6,need:[0,1,1,1],score:[115,220],label:"Sunday"}
};
/* the kinds of step a careful clockmaker uses, simplest first; level and cost:
   hidden (1): in a row, column or gear, a number fits in only one dial (1 in a gear, 1.5 in a row or column)
   naked (2, 2.5): a dial with only one number left that it can be
   pointing / claiming (3, 5): a number that, inside a gear, fits only along one row or column (so the rest of that
     line can't have it); or that, inside a row or column, fits only in one gear (so the rest of the gear can't)
   npair / hpair (4, 8 / 10): two dials in a unit that can only be the same two numbers; two numbers that fit only in
     the same two dials of a unit
   ntriple / htriple / nquad / hquad (5, 14 / 16 / 20 / 22): the same with three or four
   xwing (6, 20), xywing (6, 22), xyzwing (6, 26), swordfish (6, 30) */
var COST={hiddenG:1,hiddenL:1.5,naked:2.5,pointing:5,claiming:5,npair:8,hpair:10,ntriple:14,htriple:16,nquad:20,hquad:22,xwing:20,xywing:22,xyzwing:26,swordfish:30};
var LVL={hiddenG:1,hiddenL:1,naked:2,pointing:3,claiming:3,npair:4,hpair:4,ntriple:5,htriple:5,nquad:5,hquad:5,xwing:6,xywing:6,xyzwing:6,swordfish:6};

/* ---------- the careful clockmaker ----------
   state: v[i] (the number in a dial, 0 if empty), c[i] (a bitmask of the numbers it could still be).
   step(state,lvl) returns the simplest step that makes progress, or null:
     a placement {k, at, d, u} or an elimination {k, out:[[cell,mask]], ...details}. */
function solver(n){
  var G=geom(n), N=G.N, U=G.U;
  function init(g){ var st={v:g.slice(),c:new Array(N).fill(0)}, i;
    for(i=0;i<N;i++) if(!st.v[i]) st.c[i]=G.ALL;
    for(i=0;i<N;i++) if(st.v[i]){ var m=1<<(st.v[i]-1); G.PE[i].forEach(function(p){ st.c[p]&=~m; }); }
    return st; }
  function place(st,i,d){ st.v[i]=d; st.c[i]=0; var m=1<<(d-1); G.PE[i].forEach(function(p){ st.c[p]&=~m; }); }
  function empties(st,u){ return U[u].filter(function(x){ return !st.v[x]; }); }
  function where(st,u,d){ var m=1<<(d-1); return U[u].filter(function(x){ return !st.v[x]&&(st.c[x]&m); }); }
  function has(st,u,d){ for(var j=0;j<U[u].length;j++) if(st.v[U[u][j]]===d) return true; return false; }
  function dead(st){ for(var i=0;i<N;i++) if(!st.v[i]&&!st.c[i]) return true;
    for(var u=0;u<3*n;u++) for(var d=1;d<=n;d++) if(!has(st,u,d)&&!where(st,u,d).length) return true; return false; }
  function done(st){ for(var i=0;i<N;i++) if(!st.v[i]) return false; return true; }
  function combos(A,k,fn){ var idx=[]; return (function go(s){ if(idx.length===k) return fn(idx.map(function(i){ return A[i]; }));
      for(var i=s;i<A.length;i++){ idx.push(i); if(go(i+1)) return true; idx.pop(); } return false; })(0); }
  var GU=[]; for(var u0=2*n;u0<3*n;u0++) GU.push(u0); for(u0=0;u0<2*n;u0++) GU.push(u0);   /* gears first, then rows and columns */
  function step(st,lvl){
    var u, d, i, j, q, res=null;
    /* hidden single: gears first (easiest to spot), then rows and columns */
    for(q=0;q<GU.length;q++){ u=GU[q]; for(d=1;d<=n;d++){ if(has(st,u,d)) continue; var w=where(st,u,d); if(w.length===1) return {k:u>=2*n?"hiddenG":"hiddenL",u:u,at:w[0],d:d}; } }
    if(lvl<2) return null;
    for(i=0;i<N;i++) if(!st.v[i]&&bits(st.c[i])===1) return {k:"naked",at:i,d:digs(st.c[i])[0]};
    if(lvl<3) return null;
    /* pointing: in a gear, a number fits only along one row (column) */
    for(u=2*n;u<3*n;u++) for(d=1;d<=n;d++){ if(has(st,u,d)) continue; var w2=where(st,u,d); if(w2.length<2) continue;
      for(q=0;q<2;q++){ var L=G.CU[w2[0]][q]; if(!w2.every(function(x){ return G.CU[x][q]===L; })) continue;
        var m=1<<(d-1), out=U[L].filter(function(x){ return G.CU[x][2]!==u&&!st.v[x]&&(st.c[x]&m); });
        if(out.length) return {k:"pointing",u:u,u2:L,d:d,cells:w2,out:out.map(function(x){ return [x,m]; })}; } }
    /* claiming: in a row (column), a number fits only in one gear */
    for(u=0;u<2*n;u++) for(d=1;d<=n;d++){ if(has(st,u,d)) continue; var w3=where(st,u,d); if(w3.length<2) continue;
      var B=G.CU[w3[0]][2]; if(!w3.every(function(x){ return G.CU[x][2]===B; })) continue;
      var m2=1<<(d-1), out2=U[B].filter(function(x){ return G.CU[x][u<n?0:1]!==u&&!st.v[x]&&(st.c[x]&m2); });
      if(out2.length) return {k:"claiming",u:u,u2:B,d:d,cells:w3,out:out2.map(function(x){ return [x,m2]; })}; }
    if(lvl<4) return null;
    var sizes=lvl>=5?[2,3,4]:[2];
    for(var si=0;si<sizes.length;si++){ var k=sizes[si], nk=k===2?"npair":k===3?"ntriple":"nquad", hk=k===2?"hpair":k===3?"htriple":"hquad";
      /* naked: k dials in a unit that between them can only be k numbers */
      for(q=0;q<GU.length&&!res;q++){ u=GU[q]; var E=empties(st,u).filter(function(x){ return bits(st.c[x])<=k; }); if(E.length<k) continue;
        combos(E,k,function(set){ var M=0; set.forEach(function(x){ M|=st.c[x]; }); if(bits(M)!==k) return false;
          var out=[]; empties(st,u).forEach(function(x){ if(set.indexOf(x)<0&&(st.c[x]&M)) out.push([x,st.c[x]&M]); });
          if(out.length){ res={k:nk,u:u,cells:set,ds:M,out:out}; return true; } return false; }); }
      if(res) return res;
      /* hidden: k numbers in a unit that fit only in the same k dials */
      for(q=0;q<GU.length&&!res;q++){ u=GU[q]; var D=[]; for(d=1;d<=n;d++){ if(has(st,u,d)) continue; var wd=where(st,u,d); if(wd.length>=1&&wd.length<=k) D.push(d); }
        if(D.length<k) continue;
        combos(D,k,function(set){ var cells={}; set.forEach(function(d){ where(st,u,d).forEach(function(x){ cells[x]=1; }); }); var C=Object.keys(cells).map(Number); if(C.length!==k) return false;
          var M=0; set.forEach(function(d){ M|=1<<(d-1); }); var out=[]; C.forEach(function(x){ if(st.c[x]&~M) out.push([x,st.c[x]&~M]); });
          if(out.length){ res={k:hk,u:u,cells:C,ds:M,out:out}; return true; } return false; }); }
      if(res) return res;
    }
    if(lvl<6) return null;
    /* x-wing (2) and swordfish (3): a number that, in k rows, fits only in the same k columns (or the reverse) */
    function fish(k){
      for(d=1;d<=n;d++){ var m=1<<(d-1);
        for(var dir=0;dir<2;dir++){ var base=[], off=dir?n:0, cov=dir?0:1;
          for(u=off;u<off+n;u++){ if(has(st,u,d)) continue; var w=where(st,u,d); if(w.length>=2&&w.length<=k) base.push(u); }
          if(base.length<k) continue; var r2=null;
          combos(base,k,function(set){ var C={}; set.forEach(function(u){ where(st,u,d).forEach(function(x){ C[G.CU[x][cov]]=1; }); }); var CL=Object.keys(C).map(Number); if(CL.length!==k) return false;
            var out=[]; CL.forEach(function(L){ U[L].forEach(function(x){ if(!st.v[x]&&(st.c[x]&m)&&set.indexOf(G.CU[x][dir])<0) out.push([x,m]); }); });
            if(out.length){ r2={k:k===2?"xwing":"swordfish",d:d,us:set,us2:CL,out:out}; return true; } return false; });
          if(r2) return r2; } }
      return null; }
    res=fish(2); if(res) return res;
    /* xy-wing: a pivot that can be a or b, a wing it sees that can be a or c, another that can be b or c: c goes from anything seeing both wings */
    var bi=[]; for(i=0;i<N;i++) if(!st.v[i]&&bits(st.c[i])===2) bi.push(i);
    for(var p=0;p<bi.length;p++){ var P=bi[p], pc=st.c[P], W=bi.filter(function(x){ return sees(G,P,x)&&bits(st.c[x]&pc)===1; });
      for(i=0;i<W.length;i++) for(j=i+1;j<W.length;j++){ var A=W[i], Bw=W[j], ca=st.c[A], cb=st.c[Bw];
        if((ca&pc)===(cb&pc)) continue; var z=ca&cb&~pc; if(bits(z)!==1||((ca|cb)&~(pc|z))) continue;
        var out=[]; for(var x=0;x<N;x++) if(!st.v[x]&&x!==A&&x!==Bw&&x!==P&&(st.c[x]&z)&&sees(G,x,A)&&sees(G,x,Bw)) out.push([x,z]);
        if(out.length) return {k:"xywing",piv:P,w1:A,w2:Bw,d:digs(z)[0],out:out}; } }
    /* xyz-wing: a pivot that can be a, b or c; wings a/c and b/c it sees: c goes from anything seeing all three */
    for(i=0;i<N;i++){ if(st.v[i]||bits(st.c[i])!==3) continue; var pc3=st.c[i], W3=bi.filter(function(x){ return sees(G,i,x)&&(st.c[x]&~pc3)===0; });
      for(var a=0;a<W3.length;a++) for(var b=a+1;b<W3.length;b++){ var A3=W3[a], B3=W3[b]; if(st.c[A3]===st.c[B3]) continue; var z3=st.c[A3]&st.c[B3]; if(bits(z3)!==1) continue;
        var out3=[]; for(var x3=0;x3<N;x3++) if(!st.v[x3]&&x3!==i&&x3!==A3&&x3!==B3&&(st.c[x3]&z3)&&sees(G,x3,i)&&sees(G,x3,A3)&&sees(G,x3,B3)) out3.push([x3,z3]);
        if(out3.length) return {k:"xyzwing",piv:i,w1:A3,w2:B3,d:digs(z3)[0],out:out3}; } }
    res=fish(3); if(res) return res;
    return null;
  }
  function apply(st,s){ if(s.at!=null&&s.d) place(st,s.at,s.d); else s.out.forEach(function(o){ st.c[o[0]]&=~o[1]; }); }
  function run(g,lvl){
    var st=init(g), steps=[], score=0, deep=[0,0,0,0], max=0;
    for(var t=0;t<4*N*n&&!done(st);t++){
      if(dead(st)) return {ok:false,dead:true,steps:steps,score:score,deep:deep,max:max,st:st};
      var s=step(st,lvl); if(!s) return {ok:false,steps:steps,score:score,deep:deep,max:max,st:st};
      apply(st,s); steps.push(s); score+=COST[s.k]; var L=LVL[s.k]; if(L===2) deep[0]++; if(L>=3) deep[1]++; if(L>=4) deep[2]++; if(L>=6) deep[3]++; if(L>max) max=L;
    }
    return {ok:done(st),steps:steps,score:Math.round(score*10)/10,deep:deep,max:max,st:st};
  }
  return {G:G,init:init,place:place,step:step,apply:apply,run:run,dead:dead,where:where,has:has};
}
function grade(n,g,lvl){ return solver(n).run(g,lvl==null?6:lvl); }

/* ---------- dressing a pool puzzle for its day: rename the numbers, shuffle rows and columns within their bands
   (keeping the clue pattern's half-turn symmetry), and maybe flip it ---------- */
function symPerm(n,size,r){
  /* a permutation of 0..n-1 that keeps groups of `size` together and commutes with i -> n-1-i */
  for(var t=0;t<500;t++){
    var groups=n/size, gp=shuffle(Array.from({length:groups},function(_,i){ return i; }),r), p=[];
    for(var g=0;g<groups;g++){ var inner=shuffle(Array.from({length:size},function(_,i){ return i; }),r); for(var k=0;k<size;k++) p[g*size+k]=gp[g]*size+inner[k]; }
    var ok=true; for(var i=0;i<n&&ok;i++) if(p[n-1-i]!==n-1-p[i]) ok=false;
    if(ok) return p;
  }
  return Array.from({length:n},function(_,i){ return i; });
}
function dress(n,g,seed){
  var G=geom(n), r=rng("dress:"+seed), rel=shuffle(Array.from({length:n},function(_,i){ return i+1; }),r);
  var rp=symPerm(n,G.br,r), cp=symPerm(n,G.bc,r), tr=n===9&&r()<.5, out=new Array(G.N).fill(0);
  for(var i=0;i<G.N;i++){ if(!g[i]) continue; var R=rp[(i/n)|0], C=cp[i%n]; if(tr){ var t=R; R=C; C=t; } out[R*n+C]=rel[g[i]-1]; }
  return out;
}

/* ---------- the pool (made offline; see tools/clockmaker) and the day's pick ---------- */
var POOL=/*POOL*/{};
function parse(s){ return s.split("").map(function(ch){ return ch==="."?0:+ch; }); }
var EPOCH=Date.UTC(2026,9,1);
function dayIndex(key){ var p=key.split("-"); return Math.round((Date.UTC(+p[0],+p[1]-1,+p[2])-EPOCH)/864e5); }
function fits(g,spec){ return g.ok&&g.score>=spec.score[0]&&g.score<=spec.score[1]&&g.max<=spec.lvl&&g.deep.every(function(x,i){ return x>=spec.need[i]; }); }
function forDay(key,wd){
  /* the week's pool in a fixed shuffled order, one a week; dressed for the date. A different dressing can change the
     order the clockmaker meets his steps (and so the score a little), so each dressing is graded, and the first that
     lands in the day's band is used */
  var spec=WEEK[wd], list=POOL[wd]||[], idx=dayIndex(key), week=Math.floor((idx+70000)/7);
  var order=shuffle(Array.from({length:list.length},function(_,i){ return i; }),rng("order:"+wd));
  var base=parse(list[order[week%list.length]].g), best=null;
  for(var t=0;t<16;t++){
    var g=dress(spec.n,base,key+(t?":"+t:"")), gr=grade(spec.n,g,spec.lvl);
    var d=fits(gr,spec)?0:1+Math.abs(gr.score-(spec.score[0]+spec.score[1])/2);
    if(!best||d<best.d) best={g:g,gr:gr,d:d};
    if(!d) break;
  }
  var s=count(spec.n,best.g,2);
  return {n:spec.n,g:best.g,sol:s.sol,score:best.gr.score,max:best.gr.max,deep:best.gr.deep,unique:s.n===1,off:best.d>0,wd:wd};
}

root.CB={rng:rng,shuffle:shuffle,bits:bits,digs:digs,geom:geom,sees:sees,count:count,WEEK:WEEK,COST:COST,LVL:LVL,solver:solver,grade:grade,dress:dress,symPerm:symPerm,parse:parse,POOL:POOL,forDay:forDay,fits:fits,dayIndex:dayIndex};
})(typeof window!=="undefined"?window:globalThis);
