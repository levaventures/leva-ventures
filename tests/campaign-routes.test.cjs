"use strict";
/* Static campaign routing contract. No HTTP requests, personal data or forms. */
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const destination="https://levaventures.com/tools/financing-intelligence/";
const campaigns=["linkedin","sior","cre-news","crej","partners"];
test("five clean campaign URLs redirect immediately to the canonical calculator",()=>{
 for(const campaign of campaigns){
  const route=path.join(root,"go",campaign,"index.html");
  assert.ok(fs.existsSync(route),route);
  const html=fs.readFileSync(route,"utf8");
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(html,/<meta http-equiv="refresh" content="0; url=https:\/\/levaventures\.com\/tools\/financing-intelligence\/"/);
  assert.match(html,/<link rel="canonical" href="https:\/\/levaventures\.com\/tools\/financing-intelligence\/"/);
  assert.ok(html.includes('href="'+destination+'"'));
  assert.doesNotMatch(html,/<script\b|<form\b|<iframe\b/i);
  assert.doesNotMatch(html,/utm_source=|utm_campaign=|lv_origin=|lv_channel=|source=chatgpt/i);
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/script-src 'none'/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
 }
});
test("campaign redirects never enter the sitemap or alter the canonical calculator",()=>{
 const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
 for(const campaign of campaigns)assert.ok(!sitemap.includes("/go/"+campaign+"/"));
 const tool=fs.readFileSync(path.join(root,"tools/financing-intelligence/index.html"),"utf8");
 assert.match(tool,/<link rel="canonical" href="https:\/\/levaventures\.com\/tools\/financing-intelligence\/"/);
 assert.doesNotMatch(tool,/utm_source=|campaign-links\.js|source=chatgpt/);
});
