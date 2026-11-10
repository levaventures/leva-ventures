"use strict";
/* Real NVDA + Guidepup against all eight NEW V2 workspaces, not the legacy calculator. */
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {nvdaTest:test}=require("@guidepup/playwright");
const {expect}=require("@playwright/test");
const localPage=pathToFileURL(path.resolve(process.cwd(),"previews","leva-financing-desk-v2","index.html")).href;
const modules=[
 ["debt","Debt Capacity"],
 ["loan","Loan & Balloon"],
 ["refinance","Refinance Intelligence"],
 ["capital","Capital Structure"],
 ["scenarios","Scenario Lab"],
 ["investment","Investment Returns"],
 ["waterfall","Equity Waterfall"],
 ["report","Analysis Report"]
];
test("V2 NVDA speaks accessible names across all eight navigation buttons",async({page,nvda})=>{
 await page.goto(localPage,{waitUntil:"domcontentloaded"});
 await expect(page.locator("#debt-proceeds")).toHaveText(/^\$/);
 await nvda.navigateToWebContent();
 for(const [id,name] of modules){
   const button=page.locator('[data-panel="'+id+'"]');
   await button.focus();
   await nvda.perform(nvda.keyboardCommands.reportCurrentFocus);
   const speech=await nvda.lastSpokenPhrase();
   console.log("NVDA V2 module",id,JSON.stringify(speech));
   // NVDA normally speaks an ampersand as the word "and"; both are correct accessible names.
   const normalized=text=>text.toLowerCase().replace(/&/g,"and").replace(/\s+/g," ").trim();
   expect(normalized(speech)).toContain(normalized(name));
   await button.press("Enter");
   await expect(button).toHaveAttribute("aria-pressed","true");
   await expect(page.locator("#panel-"+id)).toBeVisible();
 }
});
test("V2 NVDA announces deal inputs and meaningful error recovery",async({page,nvda})=>{
 await page.goto(localPage,{waitUntil:"domcontentloaded"});
 await expect(page.locator("#debt-proceeds")).toHaveText(/^\$/);
 await nvda.navigateToWebContent();
 const input=page.locator("#noi");
 await input.focus();
 await nvda.perform(nvda.keyboardCommands.reportCurrentFocus);
 const labelSpeech=await nvda.lastSpokenPhrase();
 console.log("NVDA V2 NOI field",JSON.stringify(labelSpeech));
 expect(labelSpeech).toMatch(/NOI|operating income/i);
 await input.fill("-1");
 await expect(page.locator("#error")).toBeVisible();
 await expect(page.locator("#report-csv")).toBeDisabled();
 await input.fill("520000");
 await expect(page.locator("#error")).toBeHidden();
 await expect(page.locator("#report-csv")).toBeEnabled();
});
