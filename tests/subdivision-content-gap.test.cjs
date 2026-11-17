"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const slug="insights/private-capital-real-estate-development-financing/";
const url="/"+slug;
const html=fs.readFileSync(path.join(root,slug,"index.html"),"utf8");
const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
const hub=fs.readFileSync(path.join(root,"insights/index.html"),"utf8");
const preparation=fs.readFileSync(path.join(root,"insights/how-to-prepare-real-estate-opportunity-private-capital/index.html"),"utf8");
const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
assert.match(html,/<h2 id="subdivision-financing">Private capital for subdivision development:/);
for(const word of ["horizontal development","lot delivery","lot sale","release price","drainage","contingency","presales","lot-level timing"])
 assert.ok(html.toLowerCase().includes(word.toLowerCase()),"Missing practical content: "+word);
for(const number of ["40 finished lots","$130,000","$5.20 million","$4.45 million","$750,000","$4.68 million","$230,000","$180,000","$50,000"])
 assert.ok(html.includes(number),"Missing numeric example: "+number);
const gross=40*130000,uses=1100000+2150000+420000+250000+280000+250000;
assert.equal(gross,5200000);
assert.equal(uses,4450000);
assert.equal(gross-uses,750000);
assert.equal(gross*.9-uses,230000);
assert.equal(gross*.9-uses-180000,50000);
assert.ok(home.includes('href="'+url+'"'),"Homepage must link to development page");
assert.ok(hub.includes('href="'+url+'"'),"Insights hub must link to development page");
assert.ok(preparation.includes('href="'+url+'"'),"Preparation article must link to development page");
assert.match(html,/href="\/tools\/financing-intelligence\/"/);
assert.match(html,/not a subdivision absorption, release-price, construction-draw or entitlement feasibility model/i);
assert.ok(sitemap.includes("https://levaventures.com/"+slug));
for(const s of [home,hub,preparation,html])
 assert.doesNotMatch(s,/href="[^"]*(?:utm_source=|source=chatgpt|lv_origin=)/i);
console.log("PASS subdivision detail, original 40-lot financial example, disclosure and contextual internal links");
