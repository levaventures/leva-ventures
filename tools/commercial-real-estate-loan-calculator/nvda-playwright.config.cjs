"use strict";
const {withGuidepup}=require("@guidepup/playwright");
const {devices}=require("@playwright/test");
module.exports=withGuidepup({
  testDir:".",
  testMatch:"nvda-screenreader.spec.js",
  reporter:"line",
  timeout:180000,
  retries:0,
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}]
});
