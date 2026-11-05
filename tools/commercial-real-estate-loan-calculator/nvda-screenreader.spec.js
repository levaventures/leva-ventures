"use strict";
// Real NVDA speech tests run on a Windows GitHub Actions desktop using Guidepup.
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {nvdaTest:test}=require("@guidepup/playwright");
const {expect}=require("@playwright/test");
const localPage=pathToFileURL(path.resolve(process.cwd(),"previews","leva-financing-intelligence-full-qa-offline-review.html")).href;

test("NVDA announces the commercial-loan calculator heading",async({page,nvda})=>{
 await page.goto(localPage,{waitUntil:"domcontentloaded"});
 await expect(page.locator("#loan-payment")).toHaveText(/^\$/);
 await nvda.navigateToWebContent();
 const spoken=[];
 for(let n=0;n<10;n++){
   await nvda.nextHeading();
   const phrase=await nvda.lastSpokenPhrase();
   spoken.push(phrase);
   if(/calculate your loan/i.test(phrase))break;
 }
 console.log("NVDA actual loan-heading speech:",JSON.stringify(spoken));
 expect(spoken.some(p=>/calculate your loan/i.test(p))).toBeTruthy();
});

test("NVDA can identify Refinance Intelligence and capital-stack content",async({page,nvda})=>{
 await page.goto(localPage,{waitUntil:"domcontentloaded"});
 await expect(page.locator("#loan-payment")).toHaveText(/^\$/);
 await page.locator("#tab-refi").click();
 await expect(page.locator("#capital-stack-table tbody tr")).toHaveCount(4);
 // A screen-reader navigation test should start from document browse mode, not
 // the active ARIA tab, which triggers automatic forms/focus mode in NVDA.
 await page.locator("#main-content").focus();
 await nvda.navigateToWebContent();
 // NVDA enters focus mode automatically on ARIA tabs and interactive controls.
 // Explicitly return to document browse mode and refresh its virtual buffer
 // before heading navigation.
 await nvda.perform(nvda.keyboardCommands.exitFocusMode);
 await nvda.perform(nvda.keyboardCommands.refreshBrowseDocument);
 const spoken=[];
 for(let n=0;n<24;n++){
   await nvda.nextHeading();
   const phrase=await nvda.lastSpokenPhrase();
   spoken.push(phrase);
   if(/capital stack|refinance intelligence/i.test(phrase))break;
 }
 console.log("NVDA actual refinance-heading speech:",JSON.stringify(spoken));
 expect(spoken.some(p=>/capital stack|refinance intelligence/i.test(p))).toBeTruthy();
});
