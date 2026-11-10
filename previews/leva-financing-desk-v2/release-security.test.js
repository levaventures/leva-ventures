"use strict";
/* Focused release security regression: no input-bearing requests, no mixed
   third-party JS/asset dependencies, no crawler leakage and safe report exports. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {test}=require("node:test");
const dir=path.resolve(__dirname);
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
const hub=fs.readFileSync(path.join(dir,"hub/index.html"),"utf8");
const modules=["app.js","desk-panels.js","investment-ui.js","report-ui.js",
  "finance.js","desk-core.js","desk-bridge.js","investment.js","waterfall.js",
  "strategy.js","capital-stack.js","desk-report.js"];
const scripts={
 "app.js":path.join(dir,"app.js"),
 "desk-panels.js":path.join(dir,"desk-panels.js"),
 "investment-ui.js":path.join(dir,"investment-ui.js"),
 "report-ui.js":path.join(dir,"report-ui.js")
};
const engineDir=path.resolve(dir,"../../tools/commercial-real-estate-loan-calculator");
for(const name of modules.slice(4))scripts[name]=path.join(engineDir,name);
test("prototype and hub preserve noindex and strict restrictive CSP",()=>{
 for(const [title,document] of [["desk",html],["hub",hub]]){
  assert.match(document,/<meta name="robots" content="noindex,nofollow">/,title);
  assert.match(document,/connect-src 'none'/,title);
  assert.match(document,/form-action 'none'/,title);
  assert.match(document,/script-src '(?:self|none)'/,title);
  assert.match(document,/base-uri 'self'/,title);
  assert.match(document,/object-src 'none'/,title);
 }
 assert.match(html,/referrer" content="strict-origin"/);
 assert.match(hub,/referrer" content="strict-origin"/);
});
test("all browser imports remain local and no executable remote JS or iframe",()=>{
 for(const document of [html,hub]){
  for(const m of document.matchAll(/<script\b[^>]*src="([^"]+)"/g)){
   assert.ok(!/^https?:|^\/\//i.test(m[1]),"Remote JS: "+m[1]);
  }
  assert.doesNotMatch(document,/<iframe\b/i);
  assert.doesNotMatch(document,/<form\b/i);
 }
});
test("no financial data persistence or programmatic network request sinks in own scripts",()=>{
 const re=/\b(?:fetch\s*\(|sendBeacon\s*\(|XMLHttpRequest\b|WebSocket\b|EventSource\b|localStorage\b|sessionStorage\b|indexedDB\b|navigator\.sendBeacon\b)/;
 for(const [name,p] of Object.entries(scripts)){
  const code=fs.readFileSync(p,"utf8");
  assert.doesNotMatch(code,re,"Potential network or persistence sink in "+name);
 }
});
test("no use of innerHTML, eval or Function constructor in Leva-authored modules",()=>{
 const re=/\b(?:innerHTML|outerHTML|insertAdjacentHTML|eval\s*\(|new\s+Function\s*\()/;
 for(const [name,p] of Object.entries(scripts)){
  const code=fs.readFileSync(p,"utf8");
  assert.doesNotMatch(code,re,"Unsafe DOM or eval sink in "+name);
 }
});
test("only explicit allowlisted modules may be deep-linked; no financial details encoded",()=>{
 const js=fs.readFileSync(path.join(dir,"app.js"),"utf8");
 assert.match(js,/URLSearchParams\(location\.search\)\.get\("module"\)/);
 assert.ok(js.includes('["debt","loan","refinance","capital","scenarios","investment","waterfall","report"]'));
 const links=[...hub.matchAll(/href="\.\.\/index\.html\?module=([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links,["debt","loan","refinance","capital","scenarios","investment","waterfall","report"]);
});
