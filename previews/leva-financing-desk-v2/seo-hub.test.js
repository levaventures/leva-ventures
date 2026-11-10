"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require("playwright");
(async()=>{
 const root=path.resolve(__dirname,"../../");
 const html=fs.readFileSync(path.join(__dirname,"hub/index.html"),"utf8");
 const page=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
 const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 assert.match(page,/<meta name="robots" content="noindex,nofollow">/);
 assert.match(html,/<meta http-equiv="Content-Security-Policy"/);
 assert.match(html,/<link rel="stylesheet" href=".\/hub.css">/);
 assert.ok(!html.includes("<style>"),"Hub must not contain inline CSS under restrictive CSP");
 assert.ok(!html.includes("<script"),"Hub review page must remain passive");
 assert.ok(!sitemap.includes("/previews/"),"Do not index previews in sitemap");
 assert.ok(sitemap.includes("/tools/commercial-real-estate-loan-calculator/"),"Preserve original public calculator index entry");
 assert.ok(!sitemap.includes("/hub/"),"Hub staging page cannot be indexed");
 const urls=[...html.matchAll(/href="\.\.\/index\.html\?module=([a-z-]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls,["debt","loan","refinance","capital","scenarios","investment","waterfall","report"]);
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,390,320]){
   const pg=await browser.newPage({viewport:{width,height:900}});
   const errors=[];pg.on("pageerror",e=>errors.push(e.message));
   await pg.goto("file://"+path.join(__dirname,"hub/index.html"));
   assert.equal(await pg.locator(".card").count(),8);
   assert.equal(await pg.locator("h1").count(),1);
   assert.equal(await pg.locator("meta[name=robots]").getAttribute("content"),"noindex,nofollow");
   const overflow=await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(overflow,false,"Hub horizontal overflow at "+width);
   for(const mod of urls){
    const target="file://"+path.join(__dirname,"index.html")+"?module="+mod;
    await pg.goto(target);
    await pg.waitForFunction(()=>document.querySelector("#debt-proceeds").textContent.startsWith("$"));
    assert.equal(await pg.locator('[data-panel="'+mod+'"]').getAttribute("aria-pressed"),"true");
    assert.equal(await pg.locator("#panel-"+mod).isVisible(),true);
    assert.equal(await pg.locator("#report-csv").isEnabled(),true);
   }
   assert.deepEqual(errors,[],"Console errors in hub navigation");
   console.log("Hub and all deep links passed at "+width);
   await pg.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
