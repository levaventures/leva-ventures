"use strict";
/* Test the exact deployable Cloudflare Pages artifact with a simulated
   _headers policy and loopback HTTP; online Cloudflare Access remains separate. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,".."),dist=path.join(root,"dist/v2-staging");
const placeholder=path.join(root,"dist/v2-public-placeholder");
const cspLine=fs.readFileSync(path.join(dist,"_headers"),"utf8").split("\n")
 .find(line=>line.trim().startsWith("Content-Security-Policy:"));
assert.ok(cspLine&&cspLine.includes("frame-ancestors 'none'"),"No enforced CSP in Pages _headers");
const csp=cspLine.split("Content-Security-Policy:")[1].trim();
assert.match(csp, /connect-src 'none'/);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
 ".js":"text/javascript; charset=utf-8",".svg":"image/svg+xml",".txt":"text/plain; charset=utf-8"};
assert.ok(fs.existsSync(path.join(placeholder,"index.html")));
assert.ok(!fs.existsSync(path.join(placeholder,"tools")), "Public placeholder must contain no desk");
const deskHtml=fs.readFileSync(path.join(dist,"tools/financing-intelligence/index.html"),"utf8");
assert.match(deskHtml,/noindex,nofollow/);
assert.match(deskHtml,/href="https:\/\/levaventures.com\/tools\/commercial-real-estate-loan-calculator\/"/);
assert.doesNotMatch(deskHtml, /href="\/tools\/commercial-real-estate-loan-calculator\/"/);
assert.equal(fs.readFileSync(path.join(dist,"robots.txt"),"utf8"),"User-agent: *\nDisallow: /\n");
const server=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,"http://127.0.0.1");
  const decoded=decodeURIComponent(url.pathname);
  let file=path.resolve(dist,"."+decoded);
  if(!file.startsWith(dist+path.sep))throw Error("outside");
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,"index.html");
  const data=fs.readFileSync(file);
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream",
   "Content-Security-Policy":csp,
   "X-Robots-Tag":"noindex, nofollow, noarchive",
   "X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY",
   "Cache-Control":"private, no-store"});
  res.end(data);
 }catch(e){res.writeHead(404);res.end("Missing staging asset");}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const origin="http://127.0.0.1:"+server.address().port;
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:850},acceptDownloads:true});
   const errors=[],foreignRequests=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("request",req=>{if(!req.url().startsWith(origin+"/"))foreignRequests.push(req.url());});
   const hub=await page.goto(origin+"/tools/financing-intelligence/hub/");
   assert.equal(hub.status(),200);
   assert.match(hub.headers()["content-security-policy"],/connect-src 'none'/);
   assert.match(hub.headers()["x-robots-tag"],/noindex/);
   assert.equal(await page.locator(".card").count(),8);
   const root=await page.goto(origin+"/");
   assert.equal(root.status(),200);
   assert.equal(await page.locator("h1").innerText(),"Leva Financing Intelligence Desk V2");
   const response=await page.goto(origin+"/tools/financing-intelligence/");
   assert.equal(response.status(),200);
   assert.match(response.headers()["x-robots-tag"],/noindex/);
   assert.match(response.headers()["content-security-policy"],/frame-ancestors 'none'/);
   await page.waitForFunction(()=>document.querySelector("#debt-proceeds")?.textContent.startsWith("$"));
   assert.equal(await page.locator("#debt-proceeds").innerText(),"$4,691,080");
   for(const module of ["debt","loan","refinance","capital","scenarios","investment","waterfall","report"]){
    await page.locator('[data-panel="'+module+'"]').click();
    assert.equal(await page.locator("#panel-"+module).isVisible(),true,"Module "+module);
   }
   assert.equal(await page.locator("#report-csv").isEnabled(),true);
   const downloadPromise=page.waitForEvent("download");
   await page.locator("#report-csv").click();
   assert.equal((await downloadPromise).suggestedFilename(),"leva-financing-intelligence-desk-review.csv");
   const resources=await page.evaluate(()=>performance.getEntriesByType("resource").map(r=>r.name));
   assert.ok(resources.every(x=>x.startsWith(origin+"/")), "Unexpected third-party resource in preview");
   assert.deepEqual(foreignRequests,[],"Preview must not transmit data");
   assert.deepEqual(errors,[],"Preview must have no JavaScript page errors");
   await page.close();
   console.log("Pages staging 200/CSP/noindex/8 modules/CSV/no outbound PASS at",width);
  }
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
