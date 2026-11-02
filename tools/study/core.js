/* ===== The Locked Study core (the five kinds of lock, their makers and graders, the week, the day's chain): shared by the page and the tests =====
   Professor Hartwell has locked you in his study. Each lock you open holds a brass token and the clue to the next lock; the last lock is the door.
   The kinds of lock:
     seq   the mantel clock: a number pattern; the missing number opens it (dial lock)
     sum   the globe: picture sums of things on the desk; the asked-for total opens it (dial lock)
     code  the desk drawer (and the writing box): a combination padlock with "one number is correct…" clue lines (dial lock)
     light the wall safe behind the painting: jeweled buttons; a press flips it and the ones beside it; light them all
     shelf the bookcase: put the books in order from clue lines
     door  the door: set the tokens in the order the clues give (on Monday and Tuesday the plate shows the order)
   Every lock has exactly one answer (the safe has one fewest-press answer on its 3 x 3 panels), and each is graded by a step-by-step solver
   (see the grade notes on each maker). The day's chain is remade until its total grade lands in the day's band. */
(function(root){
"use strict";
function rng(seed){ var h=1779033703^seed.length; for(var i=0;i<seed.length;i++){ h=Math.imul(h^seed.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
  return function(){ h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); h^=h>>>16; return (h>>>0)/4294967296; }; }
function ri(r,a,b){ return a+Math.floor(r()*(b-a+1)); }
function pick(r,a){ return a[Math.floor(r()*a.length)]; }
function shuffle(a,r){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(r()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
var ORD=["first","second","third","fourth","fifth","sixth"];
var WORDN=["no","one","two","three","four"];

/* ---------- seq: the mantel clock's number pattern ----------
   Each family makes six numbers (t0..t5) and the next (t6); its rule is the hint. Grade: the family's own weight, +1.5 when the gap is in the middle. */
var SEQF=[
  {id:"add",lv:1,w:2,mk:function(r){ var a=ri(r,1,20), d=ri(r,2,9), t=[]; for(var i=0;i<7;i++) t.push(a+i*d); return {t:t,rule:"Each number is "+d+" more than the one before."}; }},
  {id:"sub",lv:1,w:2.6,mk:function(r){ var d=ri(r,3,9), a=ri(r,7*d+5,99), t=[]; for(var i=0;i<7;i++) t.push(a-i*d); return {t:t,rule:"Each number is "+d+" less than the one before."}; }},
  {id:"dbl",lv:1,w:3,mk:function(r){ var a=ri(r,1,6), t=[]; for(var i=0;i<7;i++) t.push(a*Math.pow(2,i)); return {t:t,rule:"Each number is double the one before."}; }},
  {id:"inc",lv:2,w:5,mk:function(r){ var a=ri(r,1,10), d=ri(r,1,3), s=ri(r,1,2), t=[a]; for(var i=1;i<7;i++) t.push(t[i-1]+d+(i-1)*s); return {t:t,rule:"The gaps between the numbers grow by "+s+" each time."}; }},
  {id:"sq",lv:2,w:5,mk:function(r){ var k=ri(r,1,4), t=[]; for(var i=0;i<7;i++) t.push((k+i)*(k+i)); return {t:t,rule:"They're square numbers: "+k+" × "+k+", "+(k+1)+" × "+(k+1)+", and so on."}; }},
  {id:"tri",lv:2,w:4.6,mk:function(r){ var a=ri(r,1,3), t=[]; for(var i=0;i<7;i++) t.push(a*Math.pow(3,i)); return {t:t,rule:"Each number is three times the one before."}; }},
  {id:"alt",lv:2,w:5.6,mk:function(r){ var p=ri(r,4,9), q=ri(r,1,p-1), a=ri(r,10,30), t=[a]; for(var i=1;i<7;i++) t.push(t[i-1]+(i%2?p:-q)); return {t:t,rule:"The numbers go up "+p+", then down "+q+", in turn."}; }},
  {id:"fib",lv:3,w:7,mk:function(r){ var a=ri(r,1,5), b=ri(r,a+1,a+6), t=[a,b]; for(var i=2;i<7;i++) t.push(t[i-1]+t[i-2]); return {t:t,rule:"Each number is the two before it added together."}; }},
  {id:"dp",lv:3,w:7.5,mk:function(r){ var a=ri(r,1,5), c=ri(r,1,3), t=[a]; for(var i=1;i<7;i++) t.push(t[i-1]*2+c); return {t:t,rule:"Double each number, then add "+c+"."}; }},
  {id:"two",lv:3,w:8,mk:function(r){ var a=ri(r,1,9), p=ri(r,2,6), b=ri(r,20,40), q=ri(r,2,5), t=[]; for(var i=0;i<7;i++) t.push(i%2?b-((i-1)/2)*q:a+(i/2)*p); return {t:t,rule:"Two patterns take turns: every other number goes up "+p+", and the ones between go down "+q+"."}; }},
  {id:"sqp",lv:3,w:8,mk:function(r){ var k=ri(r,1,4), c=pick(r,[1,2,3,-1]), t=[]; for(var i=0;i<7;i++) t.push((k+i)*(k+i)+c); return {t:t,rule:"Each is a square number "+(c>0?"plus "+c:"minus "+(-c))+": "+k+" × "+k+(c>0?" + ":" − ")+Math.abs(c)+", and so on."}; }},
  {id:"cube",lv:4,w:9.5,mk:function(r){ var k=ri(r,1,2), t=[]; for(var i=0;i<7;i++) t.push(Math.pow(k+i,3)); return {t:t,rule:"They're cube numbers: "+k+" × "+k+" × "+k+", and so on."}; }},
  {id:"dd",lv:4,w:9,mk:function(r){ var a=ri(r,1,9), d=ri(r,1,3), t=[a]; for(var i=1;i<7;i++) t.push(t[i-1]+d*Math.pow(2,i-1)); return {t:t,rule:"The gaps between the numbers double each time."}; }},
  {id:"fact",lv:4,w:10.5,mk:function(r){ var t=[1]; for(var i=1;i<7;i++) t.push(t[i-1]*(i+1)); return {t:t,rule:"Multiply by 2, then 3, then 4, and so on."}; }},
  {id:"trib",lv:4,w:10,mk:function(r){ var t=[ri(r,1,3),ri(r,1,4),ri(r,2,6)]; for(var i=3;i<7;i++) t.push(t[i-1]+t[i-2]+t[i-3]); return {t:t,rule:"Each number is the three before it added together."}; }},
  {id:"am",lv:4,w:10,mk:function(r){ var a=ri(r,1,4), k=ri(r,1,5), t=[a]; for(var i=1;i<7;i++) t.push(i%2?t[i-1]*2:t[i-1]+k); return {t:t,rule:"Double, then add "+k+", in turn."}; }}
];
function makeSeq(r,lv){
  for(var tries=0;tries<200;tries++){
    var fams=SEQF.filter(function(f){ return f.lv===lv||(lv>=3&&f.lv===lv-1&&r()<.25); }), f=pick(r,fams), s=f.mk(r);
    var mid=lv>=3&&r()<.4, gap=mid?ri(r,2,4):6, shown=s.t.slice(0,mid?6:6);
    var ans=mid?s.t[gap]:s.t[6];
    if(ans<=0||ans>9999||shown.some(function(x){ return x<0; })) continue;
    var terms=mid?s.t.slice(0,7):s.t.slice(0,6).concat([null]); if(mid){ terms[gap]=null; }
    return {kind:"seq",fam:f.id,terms:terms,ans:ans,digits:String(ans).length,rule:s.rule,grade:f.w+(mid?1.5:0)};
  }
  return null;
}

/* ---------- sum: the globe's picture sums ----------
   Things on the desk stand for whole numbers. Lines like "key + key + candle = 14" (later "globe − quill = 3" and "key × cup = 24").
   The step solver: solve any line with one unknown left; if none, take one + line away from another that holds all of its things
   (that's a harder step). Grade: each easy step 1 + .4 a term, each take-away step 4.5, plus 1.5 a thing. */
var SYMS=["key","candle","quill","cup","book","globe"];
function eqKnown(e,v){ var u=[]; e.t.forEach(function(s){ if(v[s]==null&&u.indexOf(s)<0) u.push(s); }); return u; }
function solveSums(eqs,k){
  var v={}, E=eqs.map(function(e){ return {t:e.t.slice(),op:e.op,val:e.val}; }), steps=[], grade=0, guard=0;
  while(Object.keys(v).length<k&&guard++<20){
    var did=false;
    for(var q=0;q<E.length&&!did;q++){ var e=E[q], u=eqKnown(e,v); if(u.length!==1) continue; var s=u[0], val=null;
      if(e.op==="+"){ var c=0, rest=0; e.t.forEach(function(x){ if(x===s) c++; else rest+=v[x]; }); if((e.val-rest)%c===0) val=(e.val-rest)/c; }
      else if(e.op==="-"){ val=e.t[0]===s?e.val+v[e.t[1]]:v[e.t[0]]-e.val; }
      else if(e.op==="x"){ var o=e.t[0]===s?v[e.t[1]]:v[e.t[0]]; if(o&&e.val%o===0) val=e.val/o; }
      if(val==null||val<=0) continue;
      v[s]=val; steps.push({s:s,v:val,from:q,how:"one"}); grade+=1+.4*e.t.length; did=true; }
    if(did) continue;
    /* a take-away step: line B holds everything line A holds (still unknown), plus more */
    for(var a=0;a<E.length&&!did;a++) for(var b=0;b<E.length&&!did;b++){ if(a===b||E[a].op!=="+"||E[b].op!=="+") continue;
      var A=E[a].t.filter(function(x){ return v[x]==null; }), B=E[b].t.filter(function(x){ return v[x]==null; }); if(!A.length||B.length<=A.length) continue;
      var Bl=B.slice(), ok=A.every(function(x){ var i=Bl.indexOf(x); if(i<0) return false; Bl.splice(i,1); return true; }); if(!ok) continue;
      var kA=E[a].t.reduce(function(sum,x){ return sum+(v[x]!=null?v[x]:0); },0), kB=E[b].t.reduce(function(sum,x){ return sum+(v[x]!=null?v[x]:0); },0);
      var ne={t:Bl,op:"+",val:(E[b].val-kB)-(E[a].val-kA)}; if(ne.val<=0) continue;
      if(E.some(function(x){ return x.op==="+"&&x.val===ne.val&&x.t.slice().sort().join()===ne.t.slice().sort().join(); })) continue;
      E.push(ne); steps.push({how:"take",a:a,b:b,eq:ne}); grade+=4.5; did=true; }
    if(!did) return null;
  }
  return Object.keys(v).length===k?{v:v,steps:steps,grade:grade}:null;
}
function makeSum(r,lv){
  var k=lv===1?2:lv<=3?3:4, ne=k, maxV=lv>=4?15:12;
  for(var tries=0;tries<600;tries++){
    var syms=shuffle(SYMS.slice(),r).slice(0,k), v={}, used={};
    syms.forEach(function(s){ var x; do{ x=ri(r,lv===1?1:2,maxV); }while(used[x]); used[x]=1; v[s]=x; });
    var eqs=[];
    for(var q=0;q<ne;q++){
      var op="+", roll=r();
      if(lv>=3&&roll<.28) op="-"; else if(lv>=4&&roll<.5) op="x";
      var t;
      if(op==="+"){ var n=lv===1?ri(r,2,3):ri(r,2,4); t=[]; for(var j=0;j<n;j++) t.push(pick(r,syms)); }
      else { var x1=pick(r,syms), x2; do{ x2=pick(r,syms); }while(x2===x1); t=[x1,x2]; if(op==="-"&&v[x1]<=v[x2]){ var tt=x1; x1=x2; x2=tt; t=[x1,x2]; } }
      var val=op==="+"?t.reduce(function(s,x){ return s+v[x]; },0):op==="-"?v[t[0]]-v[t[1]]:v[t[0]]*v[t[1]];
      if(op==="x"&&val>99) { q--; continue; }
      if(op!=="-") t.sort(function(a,b){ return syms.indexOf(a)-syms.indexOf(b); });
      eqs.push({t:t,op:op,val:val});
    }
    /* no line may be a copy of another, and no line may be one thing alone (too easy) except on Monday */
    var keys=eqs.map(function(e){ return e.op+e.t.join(); }); if(keys.some(function(x,i){ return keys.indexOf(x)!==i; })) continue;
    if(lv>1&&eqs.some(function(e){ return e.op==="+"&&e.t.every(function(x){ return x===e.t[0]; }); })) continue;
    var S=solveSums(eqs,k); if(!S) continue;
    var takes=S.steps.filter(function(s){ return s.how==="take"; }).length;
    if(lv===1&&takes) continue; if(lv>=3&&!takes) continue;
    if(lv>=3&&!eqs.some(function(e){ return e.op!=="+"; })&&r()<.6) continue;
    /* the question: a total of two or three of the things */
    var qn=lv===1?2:ri(r,2,3), qt=[]; for(var j2=0;j2<qn;j2++) qt.push(pick(r,syms)); qt.sort(function(a,b){ return syms.indexOf(a)-syms.indexOf(b); });
    if(qt.every(function(x){ return x===qt[0]; })) continue;
    var ans=qt.reduce(function(s,x){ return s+v[x]; },0);
    if(keys.indexOf("+"+qt.join())>=0) continue;
    return {kind:"sum",syms:syms,eqs:eqs,q:qt,ans:ans,digits:String(ans).length,v:v,steps:S.steps,grade:S.grade+1.5*k+.5*qn};
  }
  return null;
}

/* ---------- code: the padlock's clue lines ----------
   The code's numbers are all different. Each line is a guess and what's right about it. The solver keeps every code that fits the lines
   read so far, reading the most telling line first; the grade counts the lines and how little each tells on its own. */
function fb(g,c){ var well=0, wrong=0; for(var i=0;i<g.length;i++){ if(g[i]===c[i]) well++; else if(c.indexOf(g[i])>=0) wrong++; } return [well,wrong]; }
var ALLC={};
function allCodes(n){ if(ALLC[n]) return ALLC[n]; var out=[]; (function go(p){ if(p.length===n){ out.push(p.slice()); return; } for(var d=0;d<10;d++){ if(p.indexOf(d)>=0) continue; p.push(d); go(p); p.pop(); } })([]); return ALLC[n]=out; }
function fits(c,clues){ for(var i=0;i<clues.length;i++){ var f=fb(clues[i].g,c); if(f[0]!==clues[i].f[0]||f[1]!==clues[i].f[1]) return false; } return true; }
function clueText(f,n){
  if(!f[0]&&!f[1]) return "Nothing is correct.";
  var a=[], b=f[0], w=f[1];
  if(b) a.push((b===1?"One number is":cap(WORDN[b])+" numbers are")+" correct and well placed");
  if(w) a.push((b?(w===1?"one is":WORDN[w]+" are"):(w===1?"One number is":cap(WORDN[w])+" numbers are"))+" correct but wrongly placed");
  return a.join("; ")+".";
}
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function makeCode(r,lv){
  var n=lv>=4?4:3, all=allCodes(n), maxC=[0,4,5,6,7][lv], minC=[0,3,4,5,6][lv];
  for(var tries=0;tries<300;tries++){
    var code=pick(r,all).slice(), clues=[], left=all, guard=0;
    while(left.length>1&&guard++<60){
      var g=pick(r,all), f=fb(g,code);
      if(g.join()===code.join()) continue;
      if(f[0]+f[1]===0&&(lv>=3||clues.some(function(c){ return c.f[0]+c.f[1]===0; }))) continue;
      if(f[0]===n-1&&lv>=2) continue;
      var nl=left.filter(function(c){ var x=fb(g,c); return x[0]===f[0]&&x[1]===f[1]; });
      if(nl.length===left.length) continue;
      if(nl.length<1) continue;
      clues.push({g:g,f:f}); left=nl;
    }
    if(left.length!==1) continue;
    /* drop lines that aren't needed */
    var order=shuffle(clues.map(function(c,i){ return i; }),r);
    order.forEach(function(i){ var t=clues.filter(function(c,j){ return j!==i&&c; }); if(t.length&&all.filter(function(c){ return fits(c,t); }).length===1) clues[i]=null; });
    clues=clues.filter(Boolean);
    if(clues.length<minC||clues.length>maxC) continue;
    if(lv===1&&!clues.some(function(c){ return c.f[0]+c.f[1]===0; })) continue;
    var info=0; clues.forEach(function(c){ var k=all.filter(function(x){ return fits(x,[c]); }).length; info+=Math.log(k)/Math.log(all.length)*3; });
    clues.forEach(function(c){ c.text=clueText(c.f,n); });
    return {kind:"code",n:n,clues:clues,ans:code.join(""),code:code,digits:n,
      grade:3*n+2.2*clues.length+info-(clues.some(function(c){ return c.f[0]+c.f[1]===0; })?2:0)};
  }
  return null;
}

/* ---------- light: the safe's jeweled buttons ----------
   Pressing a button flips it and the buttons beside it (above, below, left and right). Light every jewel.
   The day's panel is made by pressing some buttons on a lit panel; on a 3 x 3 panel that set is the only fewest-press answer.
   Grade: 2.2 a press needed, +3 on the 4 x 4 panel. */
function flipMask(N,i){ var r=(i/N)|0, c=i%N, m=1<<i; if(r>0) m|=1<<(i-N); if(r<N-1) m|=1<<(i+N); if(c>0) m|=1<<(i-1); if(c<N-1) m|=1<<(i+1); return m; }
var BFS={};
function lightTable(N){
  if(BFS[N]) return BFS[N];
  var S=1<<(N*N), full=S-1, dist=new Int8Array(S).fill(-1), from=new Int8Array(S), q=new Int32Array(S), h=0, t=0, F=[];
  for(var i=0;i<N*N;i++) F.push(flipMask(N,i));
  dist[full]=0; q[t++]=full;
  while(h<t){ var s=q[h++]; for(var j=0;j<N*N;j++){ var x=s^F[j]; if(dist[x]<0){ dist[x]=dist[s]+1; from[x]=j; q[t++]=x; } } }
  return BFS[N]={dist:dist,from:from,F:F};
}
/* the next press on a fewest-press way to light everything from state s (bits set = lit) */
function lightNext(N,s){ var T=lightTable(N); return T.dist[s]>0?T.from[s]:-1; }
function makeLight(r,lv){
  var N=lv>=4?4:3, want=[0,[2,3],[3,4],[4,5],[5,7]][lv], T=lightTable(N), full=(1<<(N*N))-1;
  for(var tries=0;tries<300;tries++){
    var k=ri(r,want[0],want[1]), cells=shuffle(Array.from({length:N*N},function(_,i){ return i; }),r).slice(0,k), s=full;
    cells.forEach(function(i){ s^=T.F[i]; });
    var d=T.dist[s]; if(d<want[0]||d>want[1]) continue;
    if(s===full||s===0) continue;
    return {kind:"light",N:N,start:s,min:d,grade:2.2*d+(N===4?3:0)};
  }
  return null;
}

/* ---------- shelf and door: putting things in order from clue lines ----------
   The solver tries every order (at most 720), and the clue lines are added until only one order fits, then thinned.
   Grade: 1.6 an item, plus each line's weight (a fixed place 1, directly left 1.5, at an end, next to, left of or a place it isn't 2, not next to or between 3). */
var CT={
  pos:{w:1,t:function(L,a,p){ return cap(L[a])+" is "+ORD[p]+" from the left."; },ok:function(o,a,p){ return o.indexOf(a)===p; }},
  notpos:{w:2,t:function(L,a,p){ return cap(L[a])+" isn't "+ORD[p]+" from the left."; },ok:function(o,a,p){ return o.indexOf(a)!==p; }},
  end:{w:2,t:function(L,a){ return cap(L[a])+" is at one end."; },ok:function(o,a){ var i=o.indexOf(a); return i===0||i===o.length-1; }},
  notend:{w:2,t:function(L,a){ return cap(L[a])+" isn't at either end."; },ok:function(o,a){ var i=o.indexOf(a); return i>0&&i<o.length-1; }},
  imm:{w:1.5,t:function(L,a,b){ return cap(L[a])+" is directly left of "+L[b]+"."; },ok:function(o,a,b){ return o.indexOf(b)===o.indexOf(a)+1; }},
  adj:{w:2,t:function(L,a,b){ return cap(L[a])+" is next to "+L[b]+"."; },ok:function(o,a,b){ return Math.abs(o.indexOf(a)-o.indexOf(b))===1; }},
  left:{w:2,t:function(L,a,b){ return cap(L[a])+" is somewhere left of "+L[b]+"."; },ok:function(o,a,b){ return o.indexOf(a)<o.indexOf(b); }},
  notadj:{w:3,t:function(L,a,b){ return cap(L[a])+" isn't next to "+L[b]+"."; },ok:function(o,a,b){ return Math.abs(o.indexOf(a)-o.indexOf(b))>1; }},
  btw:{w:3,t:function(L,a,b,c){ return cap(L[a])+" is somewhere between "+L[b]+" and "+L[c]+"."; },ok:function(o,a,b,c){ var x=o.indexOf(a), y=o.indexOf(b), z=o.indexOf(c); return (y<x&&x<z)||(z<x&&x<y); }}
};
var PERMS={};
function perms(n){ if(PERMS[n]) return PERMS[n]; var out=[]; (function go(p){ if(p.length===n){ out.push(p.slice()); return; } for(var i=0;i<n;i++){ if(p.indexOf(i)>=0) continue; p.push(i); go(p); p.pop(); } })([]); return PERMS[n]=out; }
function okAll(o,cl){ for(var i=0;i<cl.length;i++){ var c=cl[i]; if(!CT[c.k].ok(o,c.a,c.b,c.c)) return false; } return true; }
var TYPES={1:["pos","imm","end","left"],2:["pos","imm","end","left","adj","notpos","notend"],3:["imm","end","left","adj","notpos","notend","notadj","btw","pos"],4:["imm","left","adj","notpos","notend","notadj","btw","end"]};
function randClue(r,o,types){
  var n=o.length;
  for(var g=0;g<40;g++){
    var k=pick(r,types), a=ri(r,0,n-1), b, c, p;
    if(k==="pos"||k==="notpos"){ p=k==="pos"?o.indexOf(a):(function(){ var x; do{ x=ri(r,0,n-1); }while(x===o.indexOf(a)); return x; })(); return {k:k,a:a,b:p}; }
    if(k==="end"){ var i=o.indexOf(a); if(i!==0&&i!==n-1) continue; return {k:k,a:a}; }
    if(k==="notend"){ var i2=o.indexOf(a); if(i2===0||i2===n-1) continue; return {k:k,a:a}; }
    do{ b=ri(r,0,n-1); }while(b===a);
    if(k==="imm"){ var ia=o.indexOf(a); if(ia>=n-1) continue; return {k:k,a:a,b:o[ia+1]}; }
    if(k==="adj"){ var j=o.indexOf(a), nb=[j-1,j+1].filter(function(x){ return x>=0&&x<n; }); return {k:k,a:a,b:o[pick(r,nb)]}; }
    if(k==="left"){ if(o.indexOf(a)>o.indexOf(b)){ var t=a; a=b; b=t; } return {k:k,a:a,b:b}; }
    if(k==="notadj"){ if(Math.abs(o.indexOf(a)-o.indexOf(b))<=1) continue; return {k:k,a:a,b:b}; }
    if(k==="btw"){ do{ c=ri(r,0,n-1); }while(c===a||c===b); if(!CT.btw.ok(o,a,b,c)) continue; return {k:k,a:a,b:b,c:c}; }
  }
  return null;
}
function makeOrder(r,lv,n,labels,kind){
  var types=TYPES[lv], P=perms(n);
  for(var tries=0;tries<400;tries++){
    var o=shuffle(Array.from({length:n},function(_,i){ return i; }),r), cl=[], left=P, guard=0;
    if(o.every(function(x,i){ return x===i; })) continue;
    while(left.length>1&&guard++<80){ var c=randClue(r,o,types); if(!c) continue;
      if(cl.some(function(x){ return x.k===c.k&&x.a===c.a&&x.b===c.b&&x.c===c.c; })) continue;
      if(c.k==="pos"&&cl.filter(function(x){ return x.k==="pos"; }).length>=(lv>=3?1:2)) continue;
      var nl=left.filter(function(p){ return okAll(p,[c]); }); if(nl.length===left.length) continue; cl.push(c); left=nl; }
    if(left.length!==1) continue;
    shuffle(cl.map(function(c,i){ return i; }),r).forEach(function(i){ var t=cl.filter(function(c,j){ return j!==i&&c; }); if(t.length&&P.filter(function(p){ return okAll(p,t); }).length===1) cl[i]=null; });
    cl=cl.filter(Boolean);
    var w=cl.reduce(function(s,c){ return s+CT[c.k].w; },0);
    cl.forEach(function(c){ c.text=CT[c.k].t(labels,c.a,c.b,c.c); });
    return {kind:kind,n:n,order:o,clues:cl,labels:labels,grade:1.6*n+w};
  }
  return null;
}
var BOOKS=[["red","#9e2a22","#5c140f"],["green","#2f5d3a","#173520"],["blue","#2a4a7c","#14264a"],["gold","#c9a03a","#7a5c14"],["black","#2a2724","#0e0c0b"],["brown","#7a4a28","#432611"],["plum","#6a2c58","#3a1530"]];
function makeShelf(r,lv){
  var n=[0,4,4,5,6][lv]+(lv===2&&r()<.5?1:0), b=shuffle(BOOKS.slice(),r).slice(0,n);
  var p=makeOrder(r,lv,n,b.map(function(x){ return "the "+x[0]+" book"; }),"shelf"); if(!p) return null;
  p.books=b; return p;
}

/* ---------- the objects in the study (each kind of lock has its place) ---------- */
var OBJ={
  clock:{tag:"Clock",name:"the mantel clock",short:"Clock",Name:"The Mantel Clock",held:"behind the clock's little brass door"},
  globe:{tag:"Globe",name:"the globe",short:"Globe",Name:"The Globe",held:"inside the globe"},
  desk:{tag:"Drawer",name:"the desk drawer",short:"Drawer",Name:"The Desk Drawer",held:"in the desk drawer"},
  box:{tag:"Box",name:"the writing box",short:"Box",Name:"The Writing Box",held:"in the writing box"},
  safe:{tag:"Safe",name:"the wall safe",short:"Safe",Name:"The Wall Safe",held:"in the safe behind the painting"},
  books:{tag:"Books",name:"the bookcase",short:"Bookcase",Name:"The Bookcase",held:"behind a hidden panel in the bookcase"},
  door:{tag:"Door",name:"the door",short:"Door",Name:"The Door",held:""}
};
var HOME={seq:"clock",sum:"globe",code:"desk",light:"safe",shelf:"books"};

/* ---------- the week ----------
   locks: the kinds and levels of the locks before the door (the second of a kind lives in the writing box) · door: 0 = the plate shows the order,
   else the level of its clue lines · score: the band the day's total grade must land in (set Nov 2 from a year of days: check-year.js). */
var WEEK={
  1:{locks:[["seq",1],["code",1]],door:0,score:[25,30],label:"Monday"},
  2:{locks:[["seq",2],["sum",2],["code",1]],door:0,score:[45,52],label:"Tuesday"},
  3:{locks:[["code",2],["sum",2],["light",1]],door:1,score:[55,62],label:"Wednesday"},
  4:{locks:[["seq",3],["code",3],["shelf",1],["light",2]],door:1,score:[67,72],label:"Thursday"},
  5:{locks:[["seq",3],["sum",3],["code",3],["shelf",2],["light",2]],door:1,score:[88,95],label:"Friday"},
  6:{locks:[["seq",3],["sum",3],["code",4],["shelf",3],["light",3]],door:2,score:[102,109],label:"Saturday"},
  0:{locks:[["seq",4],["sum",4],["code",4],["shelf",3],["light",4],["code",3]],door:3,score:[148,158],label:"Sunday"}
};
function makeLock(r,kind,lv){ return kind==="seq"?makeSeq(r,lv):kind==="sum"?makeSum(r,lv):kind==="code"?makeCode(r,lv):kind==="light"?makeLight(r,lv):makeShelf(r,lv); }
function make(seed,spec){
  var r=rng(seed), locks=[], seen={};
  for(var i=0;i<spec.locks.length;i++){ var L=makeLock(r,spec.locks[i][0],spec.locks[i][1]); if(!L) return null;
    L.obj=seen[HOME[L.kind]]?"box":HOME[L.kind]; seen[L.obj]=1; L.lv=spec.locks[i][1]; locks.push(L); }
  /* the chain's order: shuffled, but a Sunday's 4 x 4 safe never comes first */
  shuffle(locks,r);
  /* each lock leaves a brass token stamped with a number */
  locks.forEach(function(L){ L.token=ri(r,1,9); });
  /* the door: the tokens in order */
  var labels=locks.map(function(L){ return OBJ[L.obj].name.replace(/^the /,"the ")+"'s token"; }), D;
  labels=locks.map(function(L){ return "the "+OBJ[L.obj].short.toLowerCase()+" token"; });
  if(spec.door){ D=makeOrder(r,spec.door,locks.length,labels,"door"); if(!D) return null; }
  else { var o=shuffle(Array.from({length:locks.length},function(_,i){ return i; }),r); if(o.every(function(x,i){ return x===i; })) o.reverse(); D={kind:"door",n:locks.length,order:o,clues:[],labels:labels,shown:true,grade:locks.length}; }
  D.obj="door"; D.lv=spec.door; locks.push(D);
  var total=locks.reduce(function(s,L){ return s+L.grade; },0);
  return {locks:locks,grade:Math.round(total*10)/10,code:D.order.map(function(i){ return locks[i].token; }).join("")};
}
function forDay(key,wd){
  var spec=WEEK[wd], best=null, bd=1e9;
  for(var a=0;a<120;a++){ var p=make("study:"+key+":"+a,spec); if(!p) continue;
    if(p.grade>=spec.score[0]&&p.grade<=spec.score[1]) return p;
    var d=p.grade<spec.score[0]?spec.score[0]-p.grade:p.grade-spec.score[1]; if(d<bd){ bd=d; best=p; } }
  return best;
}
var api={rng:rng,shuffle:shuffle,SEQF:SEQF,SYMS:SYMS,solveSums:solveSums,fb:fb,allCodes:allCodes,fits:fits,clueText:clueText,lightTable:lightTable,lightNext:lightNext,flipMask:flipMask,
  CT:CT,perms:perms,okAll:okAll,BOOKS:BOOKS,OBJ:OBJ,HOME:HOME,WEEK:WEEK,makeSeq:makeSeq,makeSum:makeSum,makeCode:makeCode,makeLight:makeLight,makeShelf:makeShelf,makeOrder:makeOrder,make:make,forDay:forDay};
root.ST=api;
if(typeof module!=="undefined") module.exports=api;
})(typeof window!=="undefined"?window:typeof self!=="undefined"?self:globalThis);
