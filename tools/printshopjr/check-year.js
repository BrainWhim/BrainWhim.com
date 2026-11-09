// Print Shop Jr.: check the next 365 days (node tools/printshopjr/check-year.js). Add "jobs" as a 2nd argument to check every job at both its sizes.
// Reads the core out of printshop.html and the word list from printshop-words.js. For each day: every block is used
// exactly once, every word's path steps between touching blocks, no two steps cross, the headline runs from one side to
// the other, the letters spell the words, and the grade is in the day's band. Prints each weekday's spread.
const fs=require("fs"), vm=require("vm"), path=require("path");
const root=path.resolve(__dirname,"..",".."), pg=path.join(root,"printshop-jr.html");
const core=fs.existsSync(pg)?fs.readFileSync(pg,"utf8").match(/<script id="psjCore">([\s\S]*?)<\/script>/)[1]
  :"var PSJ_JOBS="+JSON.stringify(fs.readFileSync(path.join(__dirname,"themes.txt"),"utf8"))+";\n"+fs.readFileSync(path.join(__dirname,"core.js"),"utf8");
const ctx={console}; ctx.globalThis=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,"printshop-words.js"),"utf8"),ctx);
vm.runInContext(core,ctx);
const PS=ctx.PSJ, by={}, bad=[]; let slow=0, slowKey="", off=0, seen={}, again=0;
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
if(process.argv[3]==="jobs"){ let n=0; PS.JOBS.forEach(j=>{ const days=j.tier===1?[1,2]:j.tier===2?[3,4]:[5,6,0]; days.forEach(wd=>{ const P=PS.make("t"+j.id+wd,j,PS.WEEK[wd]); if(!P){ console.log("NO TRAY",j.title,PS.WEEK[wd].label); n++; } }); }); console.log(PS.JOBS.length+" jobs,",n,"misses"); process.exit(0); }
const start=process.argv[2]?new Date(process.argv[2]+"T12:00:00"):new Date();
for(let i=0;i<365;i++){
  const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i), key=ymd(d), wd=d.getDay(), spec=PS.WEEK[wd];
  const t=Date.now(), P=PS.forDay(key,wd), ms=Date.now()-t; if(ms>slow){ slow=ms; slowKey=key; }
  if(!P){ bad.push(key+": no tray"); continue; }
  const R=P.R, C=P.C, use=new Array(R*C).fill(0), link={};
  P.paths.forEach((p,k)=>{ const w=P.words[k]; if(p.length!==w.length) bad.push(key+": "+w+" length");
    p.forEach((x,j)=>{ use[x]++; if(P.letters[x]!==w[j]) bad.push(key+": "+w+" letters"); if(j&&!PS.adj(p[j-1],x,C)) bad.push(key+": "+w+" jumps"); });
    for(let j=1;j<p.length;j++){ link[p[j-1]+","+p[j]]=1; link[p[j]+","+p[j-1]]=1; } });
  if(use.some(u=>u!==1)) bad.push(key+": blocks not used once");
  P.paths.forEach((p,k)=>{ for(let j=1;j<p.length;j++){ const a=p[j-1], b=p[j], ra=(a/C)|0, rb=(b/C)|0, ca=a%C, cb=b%C;
    if(ra!==rb&&ca!==cb&&link[(ra*C+cb)+","+(rb*C+ca)]) bad.push(key+": "+P.words[k]+" crosses"); } });
  const h=P.paths[0], cols=h.map(x=>x%C), rows=h.map(x=>(x/C)|0);
  if(!(P.vert?(rows.includes(0)&&rows.includes(R-1)):(cols.includes(0)&&cols.includes(C-1)))) bad.push(key+": headline doesn't span");
  if(P.off) off++;
  const sig=P.words.slice().sort().join(); if(seen[sig]!=null){ if(i-seen[sig]<60) bad.push(key+": same words as "+(i-seen[sig])+" days before"); else again++; } seen[sig]=i;
  (by[wd]=by[wd]||[]).push(P.score);
}
for(const wd of [1,2,3,4,5,6,0]){ const s=(by[wd]||[]).sort((a,b)=>a-b); if(!s.length) continue;
  console.log(PS.WEEK[wd].label.padEnd(10),"band",JSON.stringify(PS.WEEK[wd].score).padEnd(9),"min",s[0].toFixed(1),"avg",(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1),"max",s[s.length-1].toFixed(1)); }
console.log(bad.length?"PROBLEMS:\n"+bad.slice(0,40).join("\n"):"All 365 days pass.","Just outside the band (closest used):",off,"· same words back after 140+ days:",again,"· slowest day",slow+"ms",slowKey);
process.exit(bad.length?1:0);
