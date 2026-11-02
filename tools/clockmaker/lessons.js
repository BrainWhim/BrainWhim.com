require("./core.js"); const CB=globalThis.CB; const G=CB.geom(6); const r=CB.rng("lessons7");
function full(){ const a=new Array(36).fill(0);(function go(i){ if(i===36) return true; for(const d of CB.shuffle([1,2,3,4,5,6],r)){ if(G.PE[i].some(p=>a[p]===d)) continue; a[i]=d; if(go(i+1)) return true; a[i]=0;} return false;})(0); return a; }
const sol=full(); const S=CB.solver(6);
const out={sol};
// L3: hidden single in a gear (box 0) not naked single; ~14 blanks; puzzle unique; first step hidden in gear 0.
for(let t=0;t<200000&&!out.L3;t++){ const g=sol.slice(); const bl=CB.shuffle([...Array(36).keys()],r).slice(0,16); bl.forEach(i=>g[i]=0);
  if(CB.count(6,g,2).n!==1) continue; const st=S.init(g); 
  // find hidden single in gear 0 where target has >=3 candidates
  for(let d=1;d<=6;d++){ if(S.has(st,12,d)) continue; const w=S.where(st,12,d); if(w.length===1&&CB.bits(st.c[w[0]])>=3&&G.U[12].filter(x=>!g[x]).length>=3){
     // ensure no other hidden single for gear 0 so it's the clear one, and full solvable singles
     if(S.run(g,1).ok){ out.L3={g,at:w[0],d}; break; } } } }
// L4: naked single target with candidates 1, not a hidden single anywhere for that cell; others more
for(let t=0;t<200000&&!out.L4;t++){ const g=sol.slice(); const bl=CB.shuffle([...Array(36).keys()],r).slice(0,18); bl.forEach(i=>g[i]=0);
  if(CB.count(6,g,2).n!==1) continue; const st=S.init(g);
  for(const i of bl){ if(CB.bits(st.c[i])!==1) continue; const d=CB.digs(st.c[i])[0];
    if(G.CU[i].some(u=>S.where(st,u,d).length===1)) continue; if(S.run(g,2).ok){ out.L4={g,at:i,d}; break; } } }
// L2: one blank in gear 0 (cell 7), plus 6 blanks elsewhere, unique
{ const g=sol.slice(); g[7]=0; [14,22,27,33,17,30].forEach(i=>g[i]=0); out.L2={g,at:7,d:sol[7],u:CB.count(6,g,2).n}; }
// L5: easy 14 blanks unique, singles only
for(let t=0;t<1000&&!out.L5;t++){ const g=sol.slice(); CB.shuffle([...Array(36).keys()],r).slice(0,14).forEach(i=>g[i]=0); if(CB.count(6,g,2).n===1&&S.run(g,1).ok) out.L5={g}; }
console.log(JSON.stringify(out));
