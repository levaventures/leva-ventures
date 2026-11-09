"use strict";
const path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require("playwright"),axe=require("axe-core");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.goto("file://"+path.resolve(__dirname,"index.html"));
   await page.waitForFunction(()=>document.querySelector("#debt-proceeds").textContent.startsWith("$"));
   await page.addScriptTag({content:axe.source});
   for(const panel of ["debt","loan","refinance","capital","scenarios","report"]){
    await page.locator('[data-panel="'+panel+'"]').click();
    if(panel==="loan")await page.waitForFunction(()=>document.querySelector("#amort-chart .uplot"));
    const results=await page.evaluate(async()=>axe.run(document,{
      runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]},
      rules:{"region":{enabled:false}}
    }));
    const severe=results.violations.filter(x=>x.impact==="critical"||x.impact==="serious");
    assert.deepEqual(severe.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})),[],panel+" "+width+" serious or critical axe violations");
    console.log("Axe screen",panel,"width",width,"all violations",results.violations.map(x=>x.id));
   }
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});