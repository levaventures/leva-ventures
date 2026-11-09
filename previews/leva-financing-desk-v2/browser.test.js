"use strict";
const assert=require("node:assert/strict"),path=require("node:path"),{chromium}=require("playwright");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto("file://"+path.resolve(__dirname,"index.html"));
   await page.waitForFunction(()=>document.querySelector("#debt-proceeds").textContent.startsWith("$"));
   assert.equal(errors.length,0,errors.join("; "));
   assert.equal(await page.locator("#debt-proceeds").innerText(),"$4,691,080");
   assert.equal(await page.locator("#binding-note").innerText(),"Binding test: DSCR");
   assert.equal(await page.locator("#sensitivity-table tr").count(),5);
   assert.equal(await page.locator("#sensitivity-chart .uplot").count(),1);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(overflow,false,"Horizontal overflow at "+width);
   await page.getByRole("button",{name:/Refinance Intelligence/}).click();
   assert.equal(await page.locator("#ref-gap").innerText(),"$1,088,920");
   assert.equal(await page.locator("#ref-uses").innerText(),"$5,780,000");
   await page.locator("#noi").fill("572000");
   assert.equal(await page.locator("#debt-proceeds").innerText(),"$5,160,188");
   assert.equal(await page.locator("#binding-note").innerText(),"Binding test: DSCR");
   assert.equal(await page.locator("#sensitivity-table tr").count(),5);
   await page.getByRole("button",{name:/Scenario Lab/}).click();
   assert.equal(await page.locator("#scenario-table tr").count(),3);
   await page.getByRole("button",{name:/Analysis Report/}).click();
   assert.equal(await page.locator("#report-inputs tr").count(),10);
   await page.locator("#value").fill("-1");
   assert.equal(await page.locator("#error").isVisible(),true);
   await page.getByRole("button",{name:"Reset example"}).click();
   assert.equal(await page.locator("#error").isVisible(),false);
   assert.equal(await page.locator("#report-loan").innerText(),"$4,691,080");
   console.log("Desk browser smoke passed at",width);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});