/* The Night Train: check a year of daily mysteries (run from the site folder: node tools/nighttrain/check-year.js)
   Reads the puzzle core straight out of nighttrain.html, makes every day for 365 days, and checks each one has
   exactly one answer and can be worked out from the clues with no guessing. Prints each weekday's clue counts and
   difficulty scores (Nov 1 rework: the scores should climb from Monday to Sunday). */
const fs=require('fs'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','..','nighttrain.html'),'utf8');
const core=html.match(/<script id="ntCore">([\s\S]*?)<\/script>/)[1];
const NT=(new Function('module',core+';return module.exports;'))({exports:{}});
const stats={}; let bad=0, off=0, maxMs=0; const d0=new Date();
for(let k=0;k<365;k++){ const d=new Date(d0); d.setDate(d.getDate()+k);
  const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'), t=Date.now();
  const P=NT.forDay(key,d.getDay()); maxMs=Math.max(maxMs,Date.now()-t);
  if(!P||NT.count(P,P.clues,3).n!==1||!NT.solve(P,P.clues,null,NT.WEEK[d.getDay()].lvl).ok){ bad++; console.log('PROBLEM',key); continue; }
  if(P.miss) off++;
  const s=stats[d.getDay()]=stats[d.getDay()]||{c:[],s:[]}; s.c.push(P.clues.length); s.s.push(P.score); }
const avg=a=>(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
[1,2,3,4,5,6,0].forEach(w=>{ const a=stats[w]; console.log(NT.WEEK[w].label.padEnd(10),'clues',Math.min(...a.c)+'-'+Math.max(...a.c),' score',Math.min(...a.s)+'-'+Math.max(...a.s),'(avg '+avg(a.s)+')'); });
console.log(bad?bad+' problem days':'All 365 days: one answer each, no guessing needed.', off?off+' days just outside their score band.':'Every day in its score band.', 'Slowest day: '+maxMs+' ms');
