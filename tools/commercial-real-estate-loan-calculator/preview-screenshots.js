"use strict";
const {chromium}=require("playwright");
const path=require("node:path");
const fs=require("node:fs");
(async()=>{
 const output=path.resolve("preview-artifacts");
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on("pageerror",err=>{throw err;});
  const url="file://"+path.resolve("previews/leva-financing-intelligence-voice-review.html");
  await page.goto(url,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#loan-payment").textContent!=="—");
  await page.screenshot({path:path.join(output,"01-desktop-commercial-loan.png"),fullPage:true});
  await page.getByRole("tab",{name:"Refinance Intelligence"}).click();
  await page.waitForFunction(()=>document.querySelector("#st-uncovered").textContent!=="—");
  await page.screenshot({path:path.join(output,"02-desktop-refinance-intelligence.png"),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(output,"03-mobile-refinance-intelligence.png"),fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+3);
  if(overflow)throw new Error("Preview mobile page overflows viewport");
  console.log("Generated desktop and mobile screenshots from self-contained preview.");
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
