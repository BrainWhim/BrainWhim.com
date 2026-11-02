// node gen.js <n> <lvl> <seconds> <out.jsonl> <seed>
require("./core.js"); const CB=globalThis.CB;
const [n,lvl,secs,out,seed]=[+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5],process.argv[6]||"s"];
const fs=require("fs"); const r=CB.rng(seed+":"+n+":"+lvl); const G=CB.geom(n);
function full(){ const a=new Array(G.N).fill(0);
  (function go(i){ if(i===G.N) return true; const cu=G.CU[i]; const ds=CB.shuffle(Array.from({length:n},(_,k)=>k+1),r);
    for(const d of ds){ let ok=true; for(const p of G.PE[i]) if(a[p]===d){ok=false;break;} if(!ok) continue; a[i]=d; if(go(i+1)) return true; a[i]=0; } return false; })(0);
  return a; }
const S=CB.solver(n); const t0=Date.now(); let made=0; const f=fs.openSync(out,"a");
while(Date.now()-t0<secs*1000){
  const sol=full(), g=sol.slice();
  const pairs=[]; for(let i=0;i<G.N;i++){ const j=G.N-1-i; if(i<=j) pairs.push([i,j]); }
  CB.shuffle(pairs,r);
  for(const [i,j] of pairs){ const a=g[i], b=g[j]; g[i]=0; g[j]=0;
    if(CB.count(n,g,2).n!==1){ g[i]=a; g[j]=b; continue; }
    const R=S.run(g,lvl); if(!R.ok){ g[i]=a; g[j]=b; } }
  const R=S.run(g,lvl); if(!R.ok) continue;
  fs.writeSync(f,JSON.stringify({g:g.map(x=>x||".").join(""),s:R.score,m:R.max,d:R.deep,c:g.filter(x=>x).length,st:R.steps.length})+"\n"); made++;
}
console.log(n,lvl,"made",made);
