/* Grows hard harbors by hill climbing: change one boat at a time, keep the change if the cluster's hardest start
   gets no easier. Writes every distinct graded start (the hardest start of each cluster seen) to a JSON lines file. */
var fs=require("fs");
var N=6, EXIT=2;
var seed=+(process.argv[2]||1), secs=+(process.argv[3]||60), out=process.argv[4]||("pool-"+seed+".jsonl");
var s=seed>>>0||1; function R(){ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }
/* a boat: [line, len, h]; positions separate */
function clusterMax(B,P0){
  var nb=B.length, pow=[]; for(var i=0,m=1;i<nb;i++,m*=5) pow.push(m);
  function enc(P){ var k=0; for(var i=0;i<nb;i++) k+=P[i]*pow[i]; return k; }
  var seen=new Map(), list=[P0.slice()], adj=[]; seen.set(enc(P0),0);
  var g=new Int8Array(36);
  for(var h=0;h<list.length;h++){
    var P=list[h]; g.fill(-1);
    for(var i=0;i<nb;i++){ var b=B[i]; for(var k=0;k<b[1];k++){ var c=b[2]?b[0]*6+P[i]+k:(P[i]+k)*6+b[0]; g[c]=i; } }
    var a=[];
    for(var i2=0;i2<nb;i2++){ var b2=B[i2], p=P[i2], base=enc(P)-p*pow[i2];
      for(var q=p-1;q>=0;q--){ var c2=b2[2]?b2[0]*6+q:q*6+b2[0]; if(g[c2]>=0) break; var kk=base+q*pow[i2], id=seen.get(kk); if(id===undefined){ id=list.length; seen.set(kk,id); var Q=P.slice(); Q[i2]=q; list.push(Q); if(list.length>80000) return null; } a.push(id); }
      for(var q2=p+1;q2+b2[1]<=6;q2++){ var e=q2+b2[1]-1, c3=b2[2]?b2[0]*6+e:e*6+b2[0]; if(g[c3]>=0) break; var kk2=base+q2*pow[i2], id2=seen.get(kk2); if(id2===undefined){ id2=list.length; seen.set(kk2,id2); var Q2=P.slice(); Q2[i2]=q2; list.push(Q2); if(list.length>80000) return null; } a.push(id2); } }
    adj.push(a); }
  var d=new Int16Array(list.length).fill(-1), qu=[];
  for(var j=0;j<list.length;j++) if(list[j][0]===4){ d[j]=0; qu.push(j); }
  if(!qu.length) return {max:-1};
  for(var x=0;x<qu.length;x++){ var u=qu[x], au=adj[u]; for(var y=0;y<au.length;y++){ var v=au[y]; if(d[v]<0){ d[v]=d[u]+1; qu.push(v); } } }
  var mx=0, at=0; for(var z=0;z<d.length;z++) if(d[z]>mx){ mx=d[z]; at=z; }
  return {max:mx,P:list[at],n:list.length};
}
function grid(B,P){ var g=new Int8Array(36).fill(-1); for(var i=0;i<B.length;i++){ var b=B[i]; for(var k=0;k<b[1];k++){ var c=b[2]?b[0]*6+P[i]+k:(P[i]+k)*6+b[0]; if(g[c]>=0) return null; g[c]=i; } } return g; }
function str(B,P){ var g=grid(B,P), L="ABCDEFGHIJKLMNOPQRSTUVWXYZ", o=""; for(var c=0;c<36;c++) o+=g[c]<0?".":L[g[c]]; return o; }
function tryAdd(B,P){
  for(var t=0;t<30;t++){ var len=R()<.28?3:2, h=R()<.5, line=Math.floor(R()*6), pos=Math.floor(R()*(7-len));
    if(h&&line===EXIT) continue; var B2=B.concat([[line,len,h]]), P2=P.concat([pos]); if(grid(B2,P2)) return [B2,P2]; }
  return null;
}
function mutate(B,P){
  var r=R();
  if((r<.35&&B.length<15)||B.length<5){ return tryAdd(B,P); }
  if(r<.55&&B.length>4){ var i=1+Math.floor(R()*(B.length-1)); return [B.slice(0,i).concat(B.slice(i+1)),P.slice(0,i).concat(P.slice(i+1))]; }
  /* move one boat somewhere else */
  var j=1+Math.floor(R()*(B.length-1)), Bm=B.slice(0,j).concat(B.slice(j+1)), Pm=P.slice(0,j).concat(P.slice(j+1));
  return tryAdd(Bm,Pm);
}
var seenOut=new Set(), t0=Date.now(), fd=fs.openSync(out,"a"), count=0, hist={};
while(Date.now()-t0<secs*1000){
  var B=[[EXIT,2,true]], P=[Math.floor(R()*4)];
  for(var k=0;k<8;k++){ var a=tryAdd(B,P); if(a){ B=a[0]; P=a[1]; } }
  var cur=clusterMax(B,P); if(!cur||cur.max<0) continue;
  var stale=0;
  while(stale<250&&Date.now()-t0<secs*1000){
    var m=mutate(B,P); if(!m){ stale++; continue; }
    var c=clusterMax(m[0],m[1]); if(!c||c.max<0){ stale++; continue; }
    if(c.max>=cur.max){ if(c.max>cur.max) stale=0; else stale++; B=m[0]; P=m[1]; cur=c;
      if(c.max>=6){ var sk=str(B,c.P); if(!seenOut.has(sk)){ seenOut.add(sk); fs.writeSync(fd,JSON.stringify({s:sk,d:c.max,b:B.length-1,n:c.n})+"\n"); count++; hist[c.max]=(hist[c.max]||0)+1; } } }
    else stale++;
  }
}
console.log("seed",seed,"wrote",count,JSON.stringify(hist));
