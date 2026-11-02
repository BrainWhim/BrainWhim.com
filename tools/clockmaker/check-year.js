// node tools/clockmaker/check-year.js  (from the site folder): checks the next 365 days of The Clockmaker's Bench
const fs=require("fs"), path=require("path");
const html=fs.readFileSync(fs.existsSync("clockmaker.html")?"clockmaker.html":path.join(__dirname,"../../clockmaker.html"),"utf8");
const src=html.slice(html.indexOf('<script id="cbCore">')+20,html.indexOf("</script>",html.indexOf('<script id="cbCore">')));
eval(src); const CB=globalThis.CB;
const start=new Date(); let bad=0, seen={}, by={}, slow=0;
for(let k=0;k<365;k++){ const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+k), key=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"), wd=d.getDay();
  const t=Date.now(), p=CB.forDay(key,wd); slow=Math.max(slow,Date.now()-t);
  const g=CB.grade(p.n,p.g,CB.WEEK[wd].lvl), sp=CB.WEEK[wd];
  const okSol=p.unique&&p.sol.every((x,i)=>!p.g[i]||p.g[i]===x);
  const inBand=g.ok&&g.score>=sp.score[0]&&g.score<=sp.score[1]&&g.max<=sp.lvl&&g.deep.every((x,i)=>x>=sp.need[i]);
  const id=p.g.join(""); const dup=seen[id]; seen[id]=key;
  if(!okSol||!inBand||dup||g.score!==p.score||p.off){ bad++; console.log("FAIL",key,wd,{okSol,inBand,dup,score:g.score,want:p.score,max:g.max,deep:g.deep}); }
  (by[wd]=by[wd]||[]).push(g.score); }
for(const wd of [1,2,3,4,5,6,0]){ const s=by[wd]; console.log(CB.WEEK[wd].label.padEnd(10),CB.WEEK[wd].n+"x"+CB.WEEK[wd].n,"min",Math.min(...s),"avg",(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1),"max",Math.max(...s)); }
console.log(bad?bad+" days FAILED":"All 365 days pass: one answer each, no guessing, in band, no repeats. Slowest day "+slow+" ms.");
