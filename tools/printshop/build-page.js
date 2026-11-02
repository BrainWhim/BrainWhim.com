// The Print Shop: rebuild printshop.html from the parts in this folder (node tools/printshop/build-page.js, from the site folder).
// page.html is the page with a /*CORE*/ slot; core.js is the core with a JOBS slot; themes.txt is the list of jobs.
// After a rebuild, run check-year.js, and bump printshop.html's ?v= tags only if shared files changed.
const fs=require("fs"), path=require("path"), here=__dirname, root=path.resolve(here,"..","..");
const jobs=fs.readFileSync(path.join(here,"themes.txt"),"utf8");
const core=fs.readFileSync(path.join(here,"core.js"),"utf8").replace('var JOBS_TXT=/*JOBS*/"";',()=>"var JOBS_TXT="+JSON.stringify(jobs)+";");
const page=fs.readFileSync(path.join(here,"page.html"),"utf8");
if(!page.includes("/*CORE*/")) throw new Error("no core slot in page.html");
fs.writeFileSync(path.join(root,"printshop.html"),page.replace("/*CORE*/",()=>core.trim()));
console.log("printshop.html rebuilt");
