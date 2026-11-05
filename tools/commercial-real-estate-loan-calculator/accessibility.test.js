"use strict";
const {chromium}=require("playwright");
const path=require("node:path");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}});
  await page.goto("file://"+path.resolve(__dirname,process.env.LEVA_PREVIEW_FILE||"index.html"));
  await page.waitForFunction(()=>document.querySelector("#loan-payment").textContent!=="—");
  for(const mode of ["loan","refi"]){
   await page.locator(mode==="loan"?"#tab-loan":"#tab-refi").click();
   if(mode==="refi")await page.waitForFunction(()=>document.querySelector("#capital-stack-table tbody tr").length===4);
   await page.addScriptTag({path:require.resolve("axe-core/axe.min.js")});
   const report=await page.evaluate(async()=>await window.axe.run(document,{
     runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]},
     rules:{"region":{enabled:false}}
   }));
   const issues=report.violations.map(v=>({
    id:v.id,impact:v.impact,description:v.help,
    nodes:v.nodes.slice(0,5).map(n=>({target:n.target,summary:n.failureSummary}))
   }));
   console.log("Accessibility automated scan "+mode+": "+JSON.stringify(issues,null,2));
   const violations=issues.filter(v=>["critical","serious"].includes(v.impact));
   if(violations.length)throw Error("Serious accessibility issues in "+mode+": "+JSON.stringify(violations));
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
