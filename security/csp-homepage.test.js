"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const homepage=fs.readFileSync("index.html","utf8");
const config=JSON.parse(fs.readFileSync("security/cloudflare-response-header-rules.json","utf8"));
const matched=homepage.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
assert.ok(matched,"Homepage CSP meta exists");
const meta=matched[1];
const edge=config.rules.find(x=>x.ref==="leva_secure_non_embeddable_production").action_parameters.headers["Content-Security-Policy"].value;
const normalized=c=>c.split(";").map(x=>x.trim()).filter(Boolean).join("; ");
test("homepage existing enforced CSP and proposed edge allow the exact Cloudflare analytics beacon",()=>{
 for(const policy of [meta,edge]){
  assert.match(policy,/\bscript-src 'self' https:\/\/challenges\.cloudflare\.com https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js(?:;|$)/);
  assert.match(policy,/\bconnect-src 'self' https:\/\/formspree\.io https:\/\/challenges\.cloudflare\.com(?:;|$)/);
  assert.doesNotMatch(policy,/script-src[^;]*'unsafe-inline'/);
  assert.doesNotMatch(policy,/script-src[^;]*https:\s/);
  assert.doesNotMatch(policy,/connect-src[^;]*data:/);
 }
});
test("meta and candidate response header preserve their common resource allowances",()=>{
 const directives=c=>Object.fromEntries(c.split(";").map(s=>s.trim()).filter(Boolean).map(s=>{const [k,...rest]=s.split(/\s+/);return[k,rest.join(" ")];}));
 const a=directives(meta),b=directives(edge);
 for(const key of ["default-src","base-uri","object-src","script-src","style-src","font-src","img-src","connect-src","frame-src","worker-src","upgrade-insecure-requests"]){
  assert.equal(a[key],b[key],"Policy mismatch in "+key);
 }
 assert.equal(b["frame-ancestors"],"'none'");
});
test("Turnstile and the Formspree action remain present, no change to data collection or contact workflow",()=>{
 assert.match(homepage,/https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
 assert.match(homepage,/data-appearance="interaction-only"/);
 assert.match(homepage,/<form id="contact-form"[^>]*action="https:\/\/formspree\.io\/f\/mkjwlrlp"/);
 assert.doesNotMatch(meta,/\b(?:report-uri|report-to)\b/);
});
test("release candidate does not supersede current deployed Cloudflare monitor",()=>{
 assert.ok(!homepage.includes("Content-Security-Policy-Report-Only"));
 assert.ok(!config.rules.some(x=>x.ref==="leva_active_csp_monitoring"));
});
