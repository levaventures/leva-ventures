"use strict";
const assert=require("node:assert/strict"),path=require("node:path");
const {chromium}=require("playwright");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:850},reducedMotion:"reduce"});
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto("file://"+path.resolve(__dirname,"index.html"));
   await page.waitForFunction(()=>document.querySelector("#report-csv")?.disabled===false);
   await page.keyboard.press("Tab");
   assert.equal(await page.locator(":focus").getAttribute("class"),"skip","Skip navigation should be first keyboard target");
   await page.keyboard.press("Enter");
   assert.equal(new URL(page.url()).hash,"#workspace");
   for(const module of ["debt","loan","refinance","capital","scenarios","investment","waterfall","report"]){
    const button=page.locator('[data-panel="'+module+'"]');
    await button.focus();
    await page.keyboard.press("Enter");
    assert.equal(await button.getAttribute("aria-pressed"),"true");
    assert.equal(await page.locator("#panel-"+module).isVisible(),true);
    const buttons=await page.locator(".module[aria-pressed=true]").count();
    assert.equal(buttons,1,"Exactly one active module must be announced");
   }
   // Horizontal data tables must be reachable without a mouse.
   const scrollable=page.locator("#panel-report .table-scroll").first();
   await scrollable.focus();
   assert.equal(await scrollable.getAttribute("tabindex"),"0");
   const label=await scrollable.getAttribute("aria-label");
   assert.ok(label&&label.length>15);
   const focus=await scrollable.evaluate(e=>e===document.activeElement);
   assert.equal(focus,true);
   const invalid=page.locator("#waterfall-pref");
   await page.locator('[data-panel="waterfall"]').click();
   await invalid.focus();
   await page.keyboard.press("ControlOrMeta+A");
   await page.keyboard.type("101");
   assert.equal(await page.locator("#report-csv").isDisabled(),true);
   await invalid.focus();
   await page.keyboard.press("ControlOrMeta+A");
   await page.keyboard.type("8");
   assert.equal(await page.locator("#report-csv").isEnabled(),true);
   assert.deepEqual(errors,[]);
   console.log("Keyboard, active-tab, table-focus and invalid-input recovery verified at",width);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
