"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const target="/insights/commercial-real-estate-refinance-gap-analysis/";
const article=fs.readFileSync(path.join(root,target,"index.html"),"utf8");
const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
const insights=fs.readFileSync(path.join(root,"insights/index.html"),"utf8");
const acquisition=fs.readFileSync(path.join(root,"insights/commercial-real-estate-acquisition-financing-debt-equity-hybrid/index.html"),"utf8");
const calc=fs.readFileSync(path.join(root,"tools/financing-intelligence/index.html"),"utf8");
const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
for (const phrase of [
  "Reconcile the actual cash needed at refinance closing",
  "How much improvement would actually eliminate the gap?",
  "A practical maturity-readiness sequence",
  "Compare solutions by what they solve",
  "payoff statement",
  "senior-lender restrictions"
]) assert.ok(article.includes(phrase), "missing substantive explanation: "+phrase);
const paymentFactor=(.075/12)/(1-Math.pow(1+.075/12,-300));
const debtCapacity=noi=>(noi/1.25)/(paymentFactor*12);
const dscrCapacity=debtCapacity(520000);
const acceptedValue=8000000;
const uses=5600000+55000+75000+50000;
assert.equal(uses,5780000);
assert.ok(Math.abs(dscrCapacity-4691080)<1);
assert.ok(Math.abs(uses-dscrCapacity-1088920)<1);
assert.ok(Math.abs(debtCapacity(572000)-5160188)<2);
assert.ok(Math.abs(uses-debtCapacity(572000)-619812)<2);
assert.ok(Math.abs(debtCapacity(624000)-5629296)<2);
assert.equal(uses-.65*acceptedValue,580000);
assert.ok(Math.abs(uses/.65-8892308)<1);
assert.ok(Math.abs(uses*1.25*paymentFactor*12-640705)<1);
for(const [name,html] of [["home",home],["Insights",insights],["acquisition",acquisition],["V2",calc]]) {
  assert.ok(html.includes('href="'+target+'"'),name+" must link to refinance analysis");
  assert.doesNotMatch(html,/href="[^"]*(?:utm_source=|source=chatgpt|lv_origin=)/i);
}
assert.ok(article.includes('href="/tools/financing-intelligence/"'));
assert.ok(sitemap.includes("https://levaventures.com"+target));
assert.match(article,/<link rel="canonical" href="https:\/\/levaventures\.com\/insights\/commercial-real-estate-refinance-gap-analysis\/"/);
assert.match(article,/Illustrative Sources &amp; Uses · Not a Commitment/);
console.log("PASS refinance article cash ledger, underwriting sensitivity math, disclosures and internal links");
