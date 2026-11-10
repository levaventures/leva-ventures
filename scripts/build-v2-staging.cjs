"use strict";
/**
 * Build a standalone Cloudflare Pages preview, without touching public Pages
 * or the indexed legacy calculator. This artifact is NOT access control:
 * gate preview deployment using Cloudflare Access BEFORE uploading.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"..");
const out=path.join(root,"dist/v2-staging");
const placeholder=path.join(root,"dist/v2-public-placeholder");
const desk="tools/financing-intelligence";
const files=[
  ["previews/leva-financing-desk-v2/index.html",desk+"/index.html"],
  ["previews/leva-financing-desk-v2/style.css",desk+"/style.css"],
  ["previews/leva-financing-desk-v2/app.js",desk+"/app.js"],
  ["previews/leva-financing-desk-v2/desk-panels.js",desk+"/desk-panels.js"],
  ["previews/leva-financing-desk-v2/investment-ui.js",desk+"/investment-ui.js"],
  ["previews/leva-financing-desk-v2/report-ui.js",desk+"/report-ui.js"],
  ["previews/leva-financing-desk-v2/hub/index.html",desk+"/hub/index.html"],
  ["previews/leva-financing-desk-v2/hub/hub.css",desk+"/hub/hub.css"],
  ...["finance.js","desk-core.js","strategy.js","capital-stack.js","desk-bridge.js",
       "investment.js","waterfall.js","desk-report.js"].map(name=>
      ["tools/commercial-real-estate-loan-calculator/"+name,
       "tools/commercial-real-estate-loan-calculator/"+name]),
  ...["chart-column-increasing.svg","chart-no-axes-combined.svg","file-text.svg",
       "landmark.svg","layers.svg","refresh-cw.svg","LICENSE"].map(name=>
      ["previews/leva-financing-desk-v2/vendor/lucide/"+name,
       desk+"/vendor/lucide/"+name]),
  ...["uPlot.iife.min.js","uPlot.min.css","LICENSE"].map(name=>
      ["previews/leva-financing-desk-v2/vendor/uplot/"+name,
       desk+"/vendor/uplot/"+name])
];
const csp="default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; " +
 "style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; " +
 "form-action 'none'; frame-src 'none'; frame-ancestors 'none'; worker-src 'none'";
const headers=[
"/*",
"  X-Robots-Tag: noindex, nofollow, noarchive",
"  Cache-Control: private, no-store",
"  Content-Security-Policy: "+csp,
"  X-Frame-Options: DENY",
"  X-Content-Type-Options: nosniff",
"  Referrer-Policy: strict-origin-when-cross-origin",
"  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()",
"",
].join("\n");
const index=[
'<!doctype html><html lang="en"><head><meta charset="utf-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1">',
'<meta name="robots" content="noindex,nofollow"><meta name="referrer" content="strict-origin-when-cross-origin">',
'<title>Financing Intelligence Desk V2 — Internal Preview</title></head><body>',
'<main><h1>Leva Financing Intelligence Desk V2</h1><p>Internal staging build. No public launch or financing offer.</p>',
'<p><a href="/tools/financing-intelligence/hub/">Review all eight analysis modules</a></p>',
'<p><a href="/tools/financing-intelligence/">Open the financial workstation</a></p></main></body></html>'
].join("\n");
const publicPlaceholder=[
'<!doctype html><html lang="en"><head><meta charset="utf-8">',
'<meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1">',
'<title>Internal test environment — no public release</title></head><body>',
'<main><h1>Internal test environment</h1><p>No application is published at this address.</p></main>',
'</body></html>'
].join("\n");
function copyFile(from,to){
 const input=path.resolve(root,from),output=path.resolve(out,to);
 if(!input.startsWith(root+path.sep)||!output.startsWith(out+path.sep))throw Error("Unsafe relative path");
 if(!fs.statSync(input).isFile())throw Error("Missing staging asset: "+from);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.copyFileSync(input,output);
}
fs.rmSync(out,{force:true,recursive:true});
fs.rmSync(placeholder,{force:true,recursive:true});
for(const [src,dst] of files)copyFile(src,dst);
const dest=path.join(out,desk,"index.html");
let html=fs.readFileSync(dest,"utf8");
const old='href="/tools/commercial-real-estate-loan-calculator/"';
if(!html.includes(old))throw Error("Legacy link changed unexpectedly; abort build");
html=html.replace(old,'href="https://levaventures.com/tools/commercial-real-estate-loan-calculator/"');
fs.writeFileSync(dest,html);
fs.writeFileSync(path.join(out,"index.html"),index);
fs.writeFileSync(path.join(out,"_headers"),headers);
fs.writeFileSync(path.join(out,"robots.txt"),"User-agent: *\nDisallow: /\n");
fs.mkdirSync(placeholder,{recursive:true});
fs.writeFileSync(path.join(placeholder,"index.html"),publicPlaceholder);
fs.writeFileSync(path.join(placeholder,"_headers"),headers);
fs.writeFileSync(path.join(placeholder,"robots.txt"),"User-agent: *\nDisallow: /\n");
const manifest=[];
function visit(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const at=path.join(dir,entry.name);
  if(entry.isSymbolicLink())throw Error("Refusing staging symlinks");
  if(entry.isDirectory())visit(at);
  else if(entry.isFile()){
   const rel=path.relative(out,at).replace(/\\/g,"/");
   const data=fs.readFileSync(at),sha256=crypto.createHash("sha256").update(data).digest("hex");
   manifest.push({path:rel,size:data.length,sha256});
  }else throw Error("Unsupported asset in staging build");
 }
}
visit(out);
manifest.sort((a,b)=>a.path.localeCompare(b.path));
const output={release:"unpublished-v2-staging",gitSha:process.env.GITHUB_SHA||"local",
 generatedAt:new Date().toISOString(),assetCount:manifest.length,assetBytes:manifest.reduce((s,x)=>s+x.size,0),
 files:manifest};
fs.writeFileSync(path.join(root,"dist/v2-staging-manifest.json"),JSON.stringify(output,null,2)+"\n");
console.log("Staging package built:",output.assetCount,"assets",output.assetBytes,"bytes.");
console.log("Public placeholder is separate; never deploy staging bundle as main Pages production.");
