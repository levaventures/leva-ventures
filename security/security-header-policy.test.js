"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const {test}=require("node:test");
const policy=JSON.parse(fs.readFileSync("security/cloudflare-response-header-rules.json","utf8"));
const repoFiles=["index.html","tools/commercial-real-estate-loan-calculator/index.html","tools/commercial-real-estate-loan-calculator/share/index.html"];
const html=Object.fromEntries(repoFiles.map(path=>[path,fs.readFileSync(path,"utf8")]));
test("Cloudflare-compatible header-rule structures target correct hostnames",()=>{
 assert.equal(policy.phase,"http_response_headers_transform");
 assert.equal(policy.rules.length,2);
 for(const rule of policy.rules){
  assert.equal(rule.action,"rewrite");
  assert.ok(rule.expression.includes("levaventures.com"));
  assert.ok(rule.expression.includes("www.levaventures.com"));
  assert.ok(rule.action_parameters?.headers);
 }
});
test("public noncalculator paths receive all required response protections",()=>{
 const normal=policy.rules.find(x=>x.ref==="leva_secure_non_embeddable_production");
 assert.ok(normal);
 const h=normal.action_parameters.headers;
 for(const key of ["X-Content-Type-Options","Referrer-Policy","Permissions-Policy","X-Frame-Options","Content-Security-Policy"]){
  assert.equal(h[key].operation,"set",key+" must be set");
  assert.ok(h[key].value,key+" needs value");
 }
 assert.equal(h["X-Content-Type-Options"].value,"nosniff");
 assert.equal(h["X-Frame-Options"].value,"DENY");
 assert.match(h["Content-Security-Policy"].value,/frame-ancestors 'none'/);
 assert.match(h["Content-Security-Policy"].value,/https:\/\/formspree\.io/);
 assert.match(h["Content-Security-Policy"].value,/https:\/\/challenges\.cloudflare\.com/);
 assert.match(h["Content-Security-Policy"].value,/https:\/\/fonts\.googleapis\.com/);
 assert.ok(!h["Content-Security-Policy"].value.includes("*"));
});
test("explicit calculator exceptions preserve advertised iframe embedding",()=>{
 const general=policy.rules.find(x=>x.ref==="leva_secure_non_embeddable_production");
 const calc=policy.rules.find(x=>x.ref==="leva_secure_embeddable_original_calculator");
 assert.ok(calc);
 assert.match(general.expression,/not \(http\.request\.uri\.path eq/);
 assert.match(general.expression,/commercial-real-estate-loan-calculator/);
 assert.match(calc.expression,/commercial-real-estate-loan-calculator/);
 assert.equal(calc.action_parameters.headers["X-Frame-Options"],undefined);
 assert.doesNotMatch(calc.action_parameters.headers["Content-Security-Policy"].value,/frame-ancestors/);
 assert.match(html["tools/commercial-real-estate-loan-calculator/share/index.html"],/&lt;iframe src=/);
});
test("site requirements are preserved in both existing meta and proposed edge CSP",()=>{
 const csp=policy.rules.find(x=>x.ref==="leva_secure_non_embeddable_production").action_parameters.headers["Content-Security-Policy"].value;
 assert.match(html["index.html"],/https:\/\/formspree\.io/);
 assert.match(html["index.html"],/https:\/\/challenges\.cloudflare\.com/);
 assert.match(csp,/form-action 'self' https:\/\/formspree\.io/);
 assert.match(csp,/frame-src https:\/\/challenges\.cloudflare\.com/);
 assert.match(csp,/script-src 'self' https:\/\/challenges\.cloudflare\.com/);
 for(const p of repoFiles)assert.ok(html[p].length>0);
});
test("HSTS is not assumed ready to enable with preloading or all subdomains",()=>{
 const raw=JSON.stringify(policy);
 assert.ok(!raw.includes("includeSubDomains"));
 assert.ok(!raw.includes("preload"));
 assert.ok(!raw.includes("max-age=31536000"));
});
