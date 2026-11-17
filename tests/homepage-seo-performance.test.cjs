"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
const hero=fs.readFileSync(path.join(root,"assets/leva-hero-background.png"));
const about=fs.readFileSync(path.join(root,"assets/leva-about-background.png"));
assert.ok(home.length<60000,"homepage HTML should stay lean and easily parseable");
assert.doesNotMatch(home,/data:image\/png;base64,/,"background images should not embed inline");
for(const asset of ["leva-hero-background.png","leva-about-background.png"]){
 assert.ok(home.includes('url("/assets/'+asset+'")'),"homepage references "+asset);
}
for(const [name,buffer] of [["hero",hero],["about",about]]){
 assert.deepEqual(buffer.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]),name+" is valid PNG signature");
 assert.ok(buffer.length>200000 && buffer.length<500000,name+" original background size retained");
}
assert.match(home,/<link rel="canonical" href="https:\/\/levaventures\.com\/"/);
assert.match(sitemap,/<loc>https:\/\/levaventures\.com\/<\/loc><lastmod>2026-11-17<\/lastmod>/);
for (const pathPart of [
 "insights/commercial-real-estate-refinance-gap-analysis/",
 "insights/private-capital-real-estate-development-financing/"
]){
 assert.ok(sitemap.includes("<loc>https://levaventures.com/"+pathPart+"</loc><lastmod>2026-11-16</lastmod>"));
}
assert.equal((sitemap.match(/<url>/g)||[]).length,13,"preserve existing sitemap URLs");
assert.doesNotMatch(home,/href="[^"]*(?:utm_source=|source=chatgpt|lv_origin=)/i);
console.log("PASS homepage media assets are valid, large HTML data URIs removed, URLs and sitemap preserved");
