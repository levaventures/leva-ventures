"use strict";
// Real NVDA screen-reader automation using open-source Guidepup.
// This test runs on Windows; unlike ARIA snapshots it captures actual NVDA output.
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {nvdaTest:test}=require("@guidepup/playwright");
const {expect}=require("@playwright/test");

test.use({nvdaStartOptions:{capture:true}});
test("NVDA reads loan calculator headings and accessible finance field names",async({page,nvda})=>{
  const file=pathToFileURL(path.resolve(process.cwd(),"previews","leva-financing-intelligence-full-qa-offline-review.html")).href;
  await page.goto(file,{waitUntil:"domcontentloaded"});
  await expect(page.locator("#loan-payment")).toHaveText(/^\$/);
  await nvda.navigateToWebContent();
  const phrases=[];
  for(let n=0;n<15;n++){
    await nvda.nextHeading();
    phrases.push(await nvda.lastSpokenPhrase());
    if(phrases.some(p=>/calculate your loan/i.test(p)))break;
  }
  console.log("NVDA heading speech:",JSON.stringify(phrases));
  expect(phrases.some(p=>/calculate your loan|payment.*maturity|commercial real estate loan calculator/i.test(p))).toBeTruthy();
  await page.locator("#tab-refi").click();
  await expect(page.locator("#capital-stack-table tbody tr")).toHaveCount(4);
  await nvda.navigateToWebContent();
  const refinanceHeadings=[];
  for(let i=0;i<32;i++){
    await nvda.nextHeading();
    const phrase=await nvda.lastSpokenPhrase();
    refinanceHeadings.push(phrase);
    if(/your capital stack/i.test(phrase))break;
  }
  console.log("NVDA refinance speech:",JSON.stringify(refinanceHeadings));
  expect(refinanceHeadings.some(p=>/capital stack|refinance intelligence/i.test(p))).toBeTruthy();
});
