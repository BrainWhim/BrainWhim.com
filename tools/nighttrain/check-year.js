/* The Night Train: check a year of daily mysteries (run from the site folder: node tools/nighttrain/check-year.js)
   Reads the puzzle core straight out of nighttrain.html, makes every day for 365 days, and checks each one has
   exactly one answer and can be worked out from the clues with no guessing. Prints the week's clue counts. */
const fs=require('fs'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','..','nighttrain.html'),'utf8');
const core=html.match(/<script id="ntCore">([\s\S]*?)<\/script>/)[1];
const NT=(new Function('module',core+';return module.exports;'))({exports:{}});
const stats={}; let bad=0, maxMs=0; const d0=new Date();
for(let k=0;k<365;k++){ const d=new Date(d0); d.setDate(d.getDate()+k);
  const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'), t=Date.now();
  const P=NT.forDay(key,d.getDay()); maxMs=Math.max(maxMs,Date.now()-t);
  if(!P||NT.count(P,P.clues,3).n!==1||!NT.solve(P,P.clues).ok){ bad++; console.log('PROBLEM',key); continue; }
  (stats[d.getDay()]=stats[d.getDay()]||[]).push(P.clues.length); }
[1,2,3,4,5,6,0].forEach(w=>{ const a=stats[w]||[]; console.log(NT.WEEK[w].label.padEnd(10),'clues',Math.min(...a)+'-'+Math.max(...a)); });
console.log(bad?bad+' problem days':'All 365 days: one answer each, no guessing needed.','Slowest day: '+maxMs+' ms');
