/* Zayden's Marble Run: a year of daily boards (Nov 16). Run: node tools/marble/check-year.js [gen path] [days]. Prints each weekday's average score; bands in marble-gen.js LV. */
const M=require(process.argv[2]||'../../marble-gen.js'); const d0=Math.floor(Date.UTC(2026,10,16)/864e5);
const acc=[...Array(7)].map(()=>({s:0,n:0,mn:1e9,mx:0,k:0,t:0}));let t0=Date.now();
for(let d=0;d<(+process.argv[3]||364);d++){const n=d0+d,wd=new Date(n*864e5).getUTCDay(),lv=(wd+6)%7;
 const bs=M.day(lv,n); for(const b of bs){const a=acc[lv];a.s+=b.score;a.n++;a.mn=Math.min(a.mn,b.score);a.mx=Math.max(a.mx,b.score);a.k+=b.inv.R+b.inv.L; if(b.W!==M.LV[lv].W)a.t++;}}
console.log(acc.map((a,i)=>`${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]} avg ${(a.s/a.n).toFixed(2)} [${a.mn}-${a.mx}] pieces ${(a.k/a.n).toFixed(1)} fallback ${a.t}`).join('\n'),'\nms',Date.now()-t0);
