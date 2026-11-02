const fs=require("fs");
function load(p){ return fs.readdirSync(".").filter(f=>f.startsWith(p)&&f.endsWith(".jsonl")).flatMap(f=>fs.readFileSync(f,"utf8").trim().split("\n").filter(Boolean).map(JSON.parse)); }
const six=load("p6-"), nine=load("p9-");
const seen={}; function uniq(a){ return a.filter(x=>!seen[x.g]&&(seen[x.g]=1)); }
const SPEC={
 1:{src:six,f:x=>x.m===2&&x.d[0]>=1&&x.s>=25&&x.s<=31},
 2:{src:six,f:x=>x.m>=3&&x.d[1]>=1},
 3:{src:nine,f:x=>x.m<=2&&x.d[0]>=1&&x.s>=55&&x.s<=64},
 4:{src:nine,f:x=>x.m===3&&x.d[1]>=2&&x.s>=65&&x.s<=92},
 5:{src:nine,f:x=>x.m===4&&x.d[2]>=1&&x.s>=78&&x.s<=110},
 6:{src:nine,f:x=>(x.m===5||(x.m===4&&x.d[2]>=3))&&x.s>=98&&x.s<=140},
 0:{src:nine,f:x=>x.m===6&&x.d[3]>=1&&x.s>=118&&x.s<=220}};
const POOL={}, CAP=+process.argv[2]||90;
const R=require("./core.js")&&globalThis.CB.rng("pool");
const CB=globalThis.CB;
function sturdy(x,wd){ const sp=CB.WEEK[wd], g=CB.parse(x.g); let ok=0; for(let t=0;t<10;t++) if(CB.fits(CB.grade(sp.n,CB.dress(sp.n,g,"probe"+t),sp.lvl),sp)) ok++; return ok>=7; }
for(const wd of [0,6,5,4,3,2,1]){ let c=uniq(SPEC[wd].src.filter(SPEC[wd].f)); CB.shuffle(c,R); const keep=[]; for(const x of c){ if(keep.length>=CAP) break; if(sturdy(x,wd)) keep.push(x); } c=keep;
  POOL[wd]=c.map(x=>({g:x.g,s:x.s,m:x.m}));
  const s=c.map(x=>x.s).sort((a,b)=>a-b); console.log(wd,"count",c.length,"score",s[0],s[s.length>>1],s[s.length-1],"avg",(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1)); }
fs.writeFileSync("pool.json",JSON.stringify(POOL));
console.log("bytes",fs.statSync("pool.json").size);
