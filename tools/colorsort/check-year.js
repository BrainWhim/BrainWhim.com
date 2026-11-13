/* Color Sort: build every day of a year and report each weekday's shortest-solution average, range and generator time.
   Run from the site folder: node tools/colorsort/check-year.js [startDayNumber] */
const G=require('../../colorsort-gen.js');
const start=+(process.argv[2]||Math.floor(Date.UTC(2026,10,16)/864e5)); // a Monday
const D=[[],[],[],[],[],[],[]], T=[[],[],[],[],[],[],[]], miss=[0,0,0,0,0,0,0];
for(let n=start;n<start+364;n++){ const wd=new Date(n*864e5).getUTCDay(), lv=G.lvOf(wd), t0=Date.now(), P=G.make(lv,G.daySeed(n));
  T[lv].push(Date.now()-t0); D[lv].push(P.min); const W=G.WEEK[lv]; if(P.min<W.lo||P.min>W.hi) miss[lv]++; }
const N=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; let prev=0;
D.forEach((d,i)=>{ const avg=d.reduce((a,b)=>a+b,0)/d.length, t=T[i].reduce((a,b)=>a+b,0)/T[i].length;
  console.log(N[i],G.WEEK[i].c+" colors","pours avg "+avg.toFixed(1),"range "+Math.min(...d)+"-"+Math.max(...d),"step "+(prev?(avg/prev).toFixed(2)+"x":"-"),"out of band "+miss[i],"make "+t.toFixed(0)+" ms (max "+Math.max(...T[i])+")"); prev=avg; });
