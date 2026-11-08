/* Nov 8: new weekend pools (Judy: Sat/Sun too long and crowded). Sat 25-28 moves, Sun 29-33, at most 10 boats.
   Reads pool10-*.jsonl (gen.js with MAXB=11), trims idle boats, re-checks with a plain search, drops near copies. */
require("./core.js");
var HB=globalThis.HB, fs=require("fs");
var BANDS={6:[25,28],0:[29,33]}, WANT=80, MAXBOATS=10;
function decode(s){ var B=[],P=[],seen={}; for(var c=0;c<36;c++){ var ch=s[c]; if(ch==="."||seen[ch]) continue; seen[ch]=1;
  var r=Math.floor(c/6), col=c%6, h=col<5&&s[c+1]===ch, len=1; if(h){ while(col+len<6&&s[c+len]===ch) len++; } else { while(r+len<6&&s[c+len*6]===ch) len++; }
  var b=h?{r:r,c:0,len:len,h:true}:{r:0,c:col,len:len,h:false}; if(ch==="A"){ B.unshift(b); P.unshift(h?col:r); } else { B.push(b); P.push(h?col:r); } }
  return {B:B,P:P}; }
function encode(B,P){ var g=HB.occ(B,P), L="ABCDEFGHIJKLMNOPQRSTUVWXYZ", o=""; for(var c=0;c<36;c++) o+=g[c]<0?".":L[g[c]]; return o; }
function sig(B,P){ return B.map(function(b,i){ return (b.h?"h":"v")+(b.h?b.r:b.c)+":"+P[i]+":"+b.len; }); }
function trim(B,P){ var path=HB.solve(B,P), d=path.length;
  for(var j=B.length-1;j>=1;j--){ if(path.some(function(m){ return m[0]===j; })) continue;
    var B2=B.slice(0,j).concat(B.slice(j+1)), P2=P.slice(0,j).concat(P.slice(j+1)), s=HB.solve(B2,P2);
    if(s&&s.length===d){ B=B2; P=P2; path=s; } }
  return {B:B,P:P,d:d}; }
function band(d){ for(var k in BANDS) if(d>=BANDS[k][0]&&d<=BANDS[k][1]) return k; return null; }
var cand={6:[],0:[]}, seen={};
fs.readdirSync(".").filter(function(f){ return /^pool10-.*\.jsonl$/.test(f); }).forEach(function(f){
  fs.readFileSync(f,"utf8").trim().split("\n").forEach(function(l){ if(!l) return; var o=JSON.parse(l), k=band(o.d); if(k==null||seen[o.s]) return; seen[o.s]=1; cand[k].push(decode(o.s)); }); });
var OUT={}, rep={};
Object.keys(BANDS).forEach(function(k){
  var list=cand[k], rr=HB.rng("wk:"+k), keep=[], sigs=[];
  for(var i=list.length-1;i>0;i--){ var j=Math.floor(rr()*(i+1)), t=list[i]; list[i]=list[j]; list[j]=t; }
  for(var q=0;q<list.length&&keep.length<WANT;q++){
    var T=trim(list[q].B,list[q].P); if(band(T.d)!==k||T.B.length-1>MAXBOATS) continue;
    var sg=sig(T.B,T.P), near=sigs.some(function(o){ var same=sg.filter(function(x){ return o.indexOf(x)>=0; }).length; return same>=Math.max(sg.length,o.length)*.6; });
    if(near) continue; sigs.push(sg); keep.push({s:encode(T.B,T.P),d:T.d,b:T.B.length-1}); }
  OUT[k]=keep; var ds=keep.map(function(x){ return x.d; });
  rep[k]={cands:list.length,kept:keep.length,avgD:(ds.reduce(function(a,b){return a+b;},0)/Math.max(1,ds.length)).toFixed(1),avgBoats:(keep.reduce(function(a,x){return a+x.b;},0)/Math.max(1,keep.length)).toFixed(1),maxB:Math.max.apply(0,keep.map(function(x){return x.b;}))};
});
fs.writeFileSync("pool-wk.json",JSON.stringify(OUT)); console.log(JSON.stringify(rep));
