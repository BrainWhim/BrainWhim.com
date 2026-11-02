/* The Locked Study: rebuild study.html from page.html + core.js (node tools/study/build-page.js) */
var fs=require("fs"), path=require("path"), dir=__dirname;
var page=fs.readFileSync(path.join(dir,"page.html"),"utf8"), core=fs.readFileSync(path.join(dir,"core.js"),"utf8");
var KITV="1102c";
var out=page.replace("/*CORE*/",function(){ return core; }).replace("parlor-kit.js?v=KITV","parlor-kit.js?v="+KITV);
var dest=process.argv[2]||path.join(dir,"../../study.html");
fs.writeFileSync(dest,out); console.log("wrote",dest,out.length,"bytes");
