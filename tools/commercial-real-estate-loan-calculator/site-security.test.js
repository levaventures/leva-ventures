"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");
const pages = [
  "index.html",
  "insights/index.html",
  "insights/how-to-prepare-real-estate-opportunity-private-capital/index.html",
  "insights/how-to-finance-investment-property-private-capital/index.html",
  "insights/commercial-real-estate-acquisition-financing-debt-equity-hybrid/index.html",
  "tools/commercial-real-estate-loan-calculator/index.html",
  "accessibility/index.html"
];
for (const path of pages) {
  const html = fs.readFileSync(path,"utf8");
  assert.match(html,/<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]+"/i, path+" requires CSP");
  assert.match(html,/<meta\s+name="referrer"\s+content="strict-origin-when-cross-origin"/i,path+" requires referrer policy");
  assert.match(html,/script-src 'self'/,path+" requires first-party script allowlist");
  assert.match(html,/object-src 'none'/,path+" must disable plugin objects");
  assert.match(html,/base-uri 'self'/,path+" must restrict base URI");
  assert.match(html,/upgrade-insecure-requests/,path+" must upgrade mixed content");
  for (const match of html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)) {
    const attrs = match[1], body = match[2].trim();
    if (body && !/type=["']application\\/ld\\+json["']/i.test(attrs)) {
      assert.fail(path+" has executable inline script");
    }
  }
  assert.doesNotMatch(html,/\son(?:click|load|error|submit|change|mouseover)\s*=/i,path+" has inline event handler");
  assert.doesNotMatch(html,/\bjavascript\s*:/i,path+" contains a javascript: URL");
  console.log("Security policy verified:",path);
}
for (const path of [
  "assets/leva-site.js","assets/leva-insights-filters.js",
  "tools/commercial-real-estate-loan-calculator/app.js",
  "tools/commercial-real-estate-loan-calculator/advanced.js",
  "tools/commercial-real-estate-loan-calculator/voice.js",
  "tools/commercial-real-estate-loan-calculator/capital-stack-ui.js"
]) {
  const js=fs.readFileSync(path,"utf8");
  assert.doesNotMatch(js,/\b(?:eval\s*\(|new\s+Function\s*\(|\.innerHTML\s*=|\.outerHTML\s*=|document\.write\s*\()/i,path+" contains potentially dangerous dynamic HTML/code");
  console.log("Unsafe DOM/code sink scan passed:",path);
}
const home=fs.readFileSync("index.html","utf8");
assert.match(home,/form-action https:\/\/formspree\.io/, "Formspree form submission is explicitly allowed");
assert.match(home,/frame-src https:\/\/challenges\.cloudflare\.com/, "Cloudflare challenge frame allowed");
assert.match(home,/script-src 'self' https:\/\/challenges\.cloudflare\.com/, "Only first-party and Cloudflare scripts allowed on home");
const tool=fs.readFileSync("tools/commercial-real-estate-loan-calculator/index.html","utf8");
assert.doesNotMatch(tool,/formspree\.io|challenges\.cloudflare\.com/,"Calculator must not need external submission vendors");
console.log("Security smoke checks passed (static policy and sink review only, not a penetration test).");
