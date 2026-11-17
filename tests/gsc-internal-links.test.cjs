"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const targets=[
 "index.html",
 "insights/index.html",
 "insights/private-capital-real-estate-development-financing/index.html",
 "insights/commercial-real-estate-acquisition-financing-debt-equity-hybrid/index.html",
 "insights/value-add-commercial-real-estate-acquisition-financing/index.html"
];
for (const file of targets){
 const html=fs.readFileSync(path.join(root,file),"utf8");
 assert.match(html,/href="\/tools\/financing-intelligence\/"/,file+" must have a contextual V2 link");
 assert.match(html,/href="\/tools\/commercial-real-estate-loan-calculator\/"/,file+" must retain the original calculator");
 assert.doesNotMatch(html,/href="[^"]*(?:utm_source=|source=chatgpt|lv_origin=)/i,file+" must not use tracking links");
}
const v2=fs.readFileSync(path.join(root,"tools/financing-intelligence/index.html"),"utf8");
assert.match(v2,/<link rel="canonical" href="https:\/\/levaventures\.com\/tools\/financing-intelligence\/"/);
assert.ok(fs.existsSync(path.join(root,"tools/commercial-real-estate-loan-calculator/index.html")));
console.log("PASS: five high-relevance pages link to V2, original calculator retained, links clean");
