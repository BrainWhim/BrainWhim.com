// Print Shop Jr.: rebuild printshop-jr.html from page.html + core.js + themes.txt (node tools/printshopjr/build-page.js from the site folder).
const fs=require("fs"), path=require("path"), d=__dirname, root=path.resolve(d,"..","..");
const core="var PSJ_JOBS="+JSON.stringify(fs.readFileSync(path.join(d,"themes.txt"),"utf8"))+";\n"+fs.readFileSync(path.join(d,"core.js"),"utf8");
const page=fs.readFileSync(path.join(d,"page.html"),"utf8").replace("/*CORE*/",()=>core);
fs.writeFileSync(path.join(root,"printshop-jr.html"),page); console.log("printshop-jr.html",page.length,"bytes");
