"use strict";
/* Local HTTP browser test for candidate; not a live URL security audit. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const publicPath="tools/financing-intelligence/";
const html=fs.readFileSync(path.join(root,publicPath,"index.html"),"utf8");
const legacy=fs.readFileSync(path.join(root,"tools/commercial-real-estate-loan-calculator/index.html"),"utf8");
const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
const preview=fs.readFileSync(path.join(root,"previews/leva-financing-desk-v2/index.html"),"utf8");
assert.match(html,/<link rel="canonical" href="https:\/\/levaventures.com\/tools\/financing-intelligence\/"/);
assert.match(html,/<meta name="description" content="/);
assert.match(html,/<title>CRE Loan Sizing &amp; Refinance Gap Calculator \| Leva Ventures<\/title>/);
const schemaContent=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
assert.ok(schemaContent,"public app structured data must exist");
const appSchema=JSON.parse(schemaContent);
assert.equal(appSchema["@type"],"WebApplication");
assert.equal(appSchema.url,"https://levaventures.com/tools/financing-intelligence/");
assert.equal(appSchema.isAccessibleForFree,true);
assert.equal(appSchema.offers.price,"0");
assert.match(html,/A worked example: why a commercial refinance can leave a cash gap/);
assert.match(html,/\$1,088,920/);
assert.equal((html.match(/href="\/#contact"/g)||[]).length,2,"clean direct inquiry links without query parameters");
assert.doesNotMatch(html,/<form\b/i,"calculator must not submit financial assumptions");
assert.doesNotMatch(html,/campaign-links\.js|utm_source=|lv_origin=/,"no public-facing tracking or attribution query links");
assert.doesNotMatch(html,/<meta name="robots"[^>]*noindex/i);
assert.match(preview,/noindex,nofollow/);
assert.match(html,/connect-src 'none'/);
assert.match(legacy,/<link rel="canonical" href="https:\/\/levaventures.com\/tools\/commercial-real-estate-loan-calculator\/"/);
assert.match(legacy,/href="\/tools\/financing-intelligence\/"/);
assert.match(sitemap,/<loc>https:\/\/levaventures.com\/tools\/financing-intelligence\/<\/loc>/);
assert.match(sitemap,/<loc>https:\/\/levaventures.com\/tools\/commercial-real-estate-loan-calculator\/<\/loc>/);
assert.equal((html.match(/data-panel="/g)||[]).length,8);
for(const name of ["index.html","style.css","app.js","desk-panels.js","investment-ui.js","report-ui.js","vendor/uplot/uPlot.iife.min.js","vendor/lucide/landmark.svg"])
 assert.ok(fs.existsSync(path.join(root,publicPath,name)),"missing asset: "+name);
const types={".html":"text/html; charset=utf-8",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{try{
 let file=path.resolve(root,"."+decodeURIComponent(new URL(req.url,"http://localhost").pathname));
 if(!file.startsWith(root+path.sep))throw Error("outside root");
 if(fs.statSync(file).isDirectory())file=path.join(file,"index.html");
 const bytes=fs.readFileSync(file);
 res.writeHead(200,{"Content-Type":types[path.extname(file)]||"text/plain"});res.end(bytes);
}catch(e){res.writeHead(404);res.end("Not found")}});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  await new Promise(done=>server.listen(0,"127.0.0.1",done));
  const origin="http://127.0.0.1:"+server.address().port;
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:840},acceptDownloads:true});
   const errors=[],external=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("request",r=>{if(!r.url().startsWith(origin+"/"))external.push(r.url())});
   const response=await page.goto(origin+"/tools/financing-intelligence/");
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>document.querySelector("#debt-proceeds")?.textContent==="$4,691,080");
   await page.locator("#noi").fill("650000");
   await page.waitForFunction(()=>document.querySelector("#debt-proceeds")?.textContent==="$5,200,000");
   for(const id of ["debt","loan","refinance","capital","scenarios","report","investment","waterfall"]){
     await page.locator('[data-panel="'+id+'"]').click();
     assert.equal(await page.locator("#panel-"+id).isVisible(),true);
   }
   await page.locator('[data-panel="report"]').click();
   assert.equal(await page.locator("#report-csv").isEnabled(),true);
   const csv=page.waitForEvent("download");await page.locator("#report-csv").click();
   assert.match((await csv).suggestedFilename(),/leva-financing-intelligence-desk-review\.csv/);
   assert.equal(await page.locator("#guide-title").count(),1);
   assert.equal(await page.locator(".inquiry-button").isVisible(),true);
   assert.equal(await page.locator(".inquiry-button").getAttribute("href"),"/#contact");
   assert.deepEqual(errors,[],"JS errors");
   assert.deepEqual(external,[],"No third-party requests");
   await page.close();
   console.log("Public desk passed at viewport",width);
  }
  const page=await browser.newPage();
  assert.equal((await page.goto(origin+"/tools/commercial-real-estate-loan-calculator/")).status(),200);
  assert.equal(await page.locator('a[href="/tools/financing-intelligence/"]').count(),1);
  await page.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1});