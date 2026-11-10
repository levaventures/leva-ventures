"use strict";
/* HTTP-served, loopback-only V2 release check: not public staging or production. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const http=require("node:http");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"../..");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".txt":"text/plain; charset=utf-8"};
const server=http.createServer((req,res)=>{
  let target;
  try{
    const uri=new URL(req.url,"http://localhost");
    target=path.resolve(root,"."+decodeURIComponent(uri.pathname));
    if(!target.startsWith(root+path.sep))throw Error("outside staging root");
    if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,"index.html");
    const data=fs.readFileSync(target);
    res.writeHead(200,{"Content-Type":mime[path.extname(target)]||"application/octet-stream",
      "Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow",
      "X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin"});
    res.end(data);
  }catch(_){res.writeHead(404);res.end("Not found");}
});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  const port=server.address().port;
  const base="http://127.0.0.1:"+port+"/previews/leva-financing-desk-v2/";
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:860}});
   const errors=[],outbound=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("request",request=>{
    if(!request.url().startsWith("http://127.0.0.1:"+port+"/"))outbound.push(request.url());
   });
   const res=await page.goto(base+"index.html");
   assert.equal(res.status(),200);
   assert.match(res.headers()["x-robots-tag"],/noindex/);
   assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
   await page.waitForFunction(()=>document.querySelector("#debt-proceeds")?.textContent.startsWith("$"));
   assert.equal(await page.locator("#debt-proceeds").innerText(),"$4,691,080");
   for(const module of ["debt","loan","refinance","capital","scenarios","investment","waterfall","report"]){
    await page.locator('[data-panel="'+module+'"]').click();
    assert.equal(await page.locator("#panel-"+module).isVisible(),true);
   }
   assert.equal(await page.locator("#report-csv").isEnabled(),true);
   const hub=await page.goto(base+"hub/index.html");
   assert.equal(hub.status(),200);
   assert.match(hub.headers()["x-robots-tag"],/noindex/);
   assert.equal(await page.locator(".card").count(),8);
   assert.deepEqual(outbound,[],"Browser must not transmit inputs/assets to third-party URLs");
   assert.deepEqual(errors,[],"No JS errors over HTTP");
   await page.close();
   console.log("HTTP-served noindex preview passed at",width);
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
