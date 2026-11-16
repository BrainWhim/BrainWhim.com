/* Zayden's Challenge (Brick Towers): a year of warm-ups and weekly Challenges (Nov 16). Run: node tools/zchallenge/check-year.js [gen] [days] */
const M=require(process.argv[2]||'../../towers-gen.js'); const d0=Math.floor(Date.UTC(2026,10,16)/864e5), days=+process.argv[3]||364;
const acc=[...Array(8)].map(()=>({s:0,n:0,mn:1e9,mx:0,out:0}));let t0=Date.now();
for(let d=0;d<days;d++){const n=d0+d,wd=new Date(n*864e5).getUTCDay(),lv=(wd+6)%7; const p=M.make(lv,n); const a=acc[lv];a.s+=p.score;a.n++;a.mn=Math.min(a.mn,p.score);a.mx=Math.max(a.mx,p.score);if(p.score<M.LV[lv].sc[0]||p.score>M.LV[lv].sc[1])a.out++;
 if(wd===1){const c=M.make(7,M.weekOf(n)*7+5);const b=acc[7];b.s+=c.score;b.n++;b.mn=Math.min(b.mn,c.score);b.mx=Math.max(b.mx,c.score);if(c.score<M.LV[7].sc[0])b.out++;}}
console.log(acc.map((a,i)=>`${['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Challenge'][i]} N${M.LV[i].N} avg ${(a.s/a.n).toFixed(1)} [${a.mn}-${a.mx}] out-of-band ${a.out}/${a.n}`).join('\n'),'\nms',Date.now()-t0);
