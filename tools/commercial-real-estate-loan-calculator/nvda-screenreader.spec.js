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

test("NVDA announces the selected refinance tab and capital-stack table region",async({page,nvda})=>{
 await page.goto(localPage,{waitUntil:"domcontentloaded"});
 await expect(page.locator("#loan-payment")).toHaveText(/^\$/);
 await nvda.navigateToWebContent();
 const tab=page.locator("#tab-refi");
 await tab.focus();
 await nvda.perform(nvda.keyboardCommands.reportCurrentFocus);
 const tabSpeech=await nvda.lastSpokenPhrase();
 console.log("NVDA refinance tab focus speech:",JSON.stringify(tabSpeech));
 expect(tabSpeech).toMatch(/refinance intelligence/i);
 await tab.press("Enter");
 await expect(tab).toHaveAttribute("aria-selected","true");
 await expect(page.locator("#refi-panel")).toBeVisible();
 await expect(page.locator("#loan-panel")).toBeHidden();
 const region=page.locator(".capital-tablewrap");
 await region.focus();
 await nvda.perform(nvda.keyboardCommands.reportCurrentFocus);
 const tableSpeech=await nvda.lastSpokenPhrase();
 console.log("NVDA capital table focus speech:",JSON.stringify(tableSpeech));
 expect(tableSpeech).toMatch(/capital stack|sources table|scroll to review/i);
 await expect(page.locator("#capital-stack-table tbody tr")).toHaveCount(4);
});
