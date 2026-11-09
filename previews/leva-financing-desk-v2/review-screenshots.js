"use strict";
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
(async()=>{
 const out=path.resolve(__dirname,"../../preview-artifacts/desk-v2");
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
   await page.goto("file://"+path.join(__dirname,"hub/index.html"));
   await page.screenshot({path:path.join(out,"hub-"+width+".png"),fullPage:true});
   await page.goto("file://"+path.join(__dirname,"index.html"));
   await page.waitForFunction(()=>document.querySelector("#report-csv")?.disabled===false);
   for(const module of ["debt","loan","refinance","capital","scenarios","investment","waterfall","report"]){
    await page.locator('[data-panel="'+module+'"]').click();
    if(module==="loan")await page.waitForFunction(()=>document.querySelector("#amort-chart .uplot"));
    await page.screenshot({path:path.join(out,module+"-"+width+".png"),fullPage:true});
   }
   console.log("Captured nine visual review screens at",width,"px");
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
