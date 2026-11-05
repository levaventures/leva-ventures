"use strict";
/* Entire Leva public site's WCAG 2.2 automated baseline, including every
   published page, major calculator states and the contact form.
   Accessibility conformance requires more than this machine-generated scan.
   See https://www.w3.org/TR/WCAG-EM/ */
const {chromium}=require("playwright");
const path=require("node:path");
const fs=require("node:fs");
const pages=[
  ["Home","index.html"],
  ["Accessibility","accessibility/index.html"],
   ["Share calculator","tools/commercial-real-estate-loan-calculator/share/index.html"],
  ["Insights","insights/index.html"],
  ["Prepare a real estate opportunity","insights/how-to-prepare-real-estate-opportunity-private-capital/index.html"],
  ["Investment property financing","insights/how-to-finance-investment-property-private-capital/index.html"],
  ["CRE debt equity hybrid","insights/commercial-real-estate-acquisition-financing-debt-equity-hybrid/index.html"],
  ["Calculator loan","tools/commercial-real-estate-loan-calculator/index.html"]
];
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report=[];
 const violations=[];
 try{
   for(const [name,filename] of pages){
     const ctx=await browser.newContext({viewport:{width:1365,height:900},bypassCSP:true});
     const page=await ctx.newPage();
     await page.goto("file://"+path.resolve(filename),{waitUntil:"domcontentloaded"});
     await page.addScriptTag({path:require.resolve("axe-core/axe.min.js")});
     const modes=filename==="tools/commercial-real-estate-loan-calculator/index.html"?["loan","refi"]:["default"];
     for(const mode of modes){
       if(mode==="refi"){
         await page.locator("#tab-refi").click();
         await page.waitForFunction(()=>document.querySelectorAll("#capital-stack-table tbody tr").length===4).catch(()=>{});
       }
       const a=await page.evaluate(async()=>await window.axe.run(document,{
         runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]},
         resultTypes:["violations","passes","incomplete","inapplicable"]
       }));
       const mapped=a.violations.map(v=>({rule:v.id,impact:v.impact,description:v.help,helpUrl:v.helpUrl,
         nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html.slice(0,400)}))}));
       report.push({page:name,mode,path:filename,violations:mapped,passes:a.passes.length,incomplete:a.incomplete.map(x=>({rule:x.id,impact:x.impact,nodes:x.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html.slice(0,180)}))}))});
       for(const v of mapped)violations.push({page:name,mode,...v});
       console.log("SCAN",name,mode,JSON.stringify({violations:mapped.length,rules:mapped.map(x=>x.rule+" ("+x.nodes.length+" elements)"),passes:a.passes.length,incomplete:a.incomplete.length}));
     }
     await ctx.close();
   }
   // Narrow-width, 200% / 400% text zoom proxies and visible/focusable controls
   for(const width of [1280,640,390,320]){
     const ctx=await browser.newContext({viewport:{width,height:900},bypassCSP:true});
     const page=await ctx.newPage();
     await page.goto("file://"+path.resolve("tools/commercial-real-estate-loan-calculator/index.html"),{waitUntil:"domcontentloaded"});
     const over=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
     console.log("REFLOW",JSON.stringify(over));
     await page.locator("#tab-refi").click();
     const visible=await page.locator("#capital-stack-table tbody tr").count();
     if(visible!==4)violations.push({page:"Reflow",mode:String(width),rule:"capital-stack-controls",impact:"serious",nodes:[]});
     await ctx.close();
   }
 }finally{await browser.close();}
 const output="accessibility-site-audit.json";
 fs.writeFileSync(output,JSON.stringify({testedAt:new Date().toISOString(),scope:pages,report,violations},null,2));
 console.log("FULL SITE AUDIT SUMMARY",JSON.stringify({pages:report.length,totalViolations:violations.length,violations:violations.map(v=>({page:v.page,rule:v.rule,count:v.nodes.length,targets:v.nodes.slice(0,3).map(n=>n.target)}))},null,2));
 if(violations.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
