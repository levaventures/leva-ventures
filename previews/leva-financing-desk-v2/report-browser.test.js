"use strict";
/* Controlled browser checks: report readiness, numeric reconciliation, locally generated
   CSV export and print-only report rendering. No financial assumptions leave the browser. */
const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:850},acceptDownloads:true});
   const errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   const pageUrl="file://"+path.resolve(__dirname,"index.html");
   await page.goto(pageUrl);
   await page.waitForFunction(()=>document.querySelector("#report-csv")?.disabled===false);
   await page.getByRole("button",{name:/Analysis Report/}).click();
   assert.equal(await page.locator("#report-error").isVisible(),false);
   assert.equal(await page.locator("#report-limits tr").count(),3);
   assert.equal(await page.locator("#report-scenarios tr").count(),3);
   assert.equal(await page.locator("#report-capital tr").count(),4);
   assert.equal(await page.locator("#report-cashflow tr").count(),6);
   assert.equal(await page.locator("#report-distributions tr").count(),5);
   assert.equal(await page.locator("#report-disclosures li").count(),6);
   assert.equal(await page.locator("#report-audit li").count(),5);
   assert.equal(await page.locator("#print").isEnabled(),true);
   assert.equal(await page.locator("#report-csv").isEnabled(),true);
   const downloadPromise=page.waitForEvent("download");
   await page.locator("#report-csv").click();
   const download=await downloadPromise;
   assert.equal(download.suggestedFilename(),"leva-financing-intelligence-desk-review.csv");
   const stream=await download.createReadStream();
   const buffer=[];
   for await(const chunk of stream)buffer.push(chunk);
   const csv=Buffer.concat(buffer).toString("utf8");
   assert.match(csv,/"Refinance","Senior proceeds","4691079.908/);
   assert.match(csv,/"Investment year 5","Net equity cash"/);
   assert.match(csv,/"Waterfall year 5","LP preferred paid"/);
   assert.match(csv,/"Audit","Passed"/);
   assert.match(csv,/"Limitation","Disclosure"/);
   assert.ok(!csv.includes("undefined")&&!csv.includes("NaN"));
   const result=await page.evaluate(()=>({
    reports:document.querySelectorAll("#panel-report .table-scroll").length,
    sections:document.querySelectorAll("#report-inputs tr").length
   }));
   assert.ok(result.reports>=5);
   assert.equal(result.sections,10);
   const pdf=await page.pdf({format:"Letter",printBackground:true});
   assert.ok(pdf.length>14000,"Print output should have substantive content");
   assert.equal(Buffer.from(pdf.subarray(0,4)).toString(),"%PDF");
   await page.locator("#value").fill("-1");
   assert.equal(await page.locator("#report-csv").isDisabled(),true);
   assert.equal(await page.locator("#print").isDisabled(),true);
   assert.equal(await page.locator("#report-error").isVisible(),true);
   assert.equal(await page.locator("#report-distributions tr").count(),0);
   await page.locator("#value").fill("8000000");
   assert.equal(await page.locator("#report-csv").isEnabled(),true);
   await page.getByRole("button",{name:/Investment Returns/}).click();
   await page.locator("#investment-exitcap").fill("0");
   assert.equal(await page.locator("#report-csv").isDisabled(),true);
   await page.locator("#investment-exitcap").fill("6.5");
   assert.equal(await page.locator("#report-csv").isEnabled(),true);
   await page.getByRole("button",{name:/Equity Waterfall/}).click();
   await page.locator("#waterfall-pref").fill("101");
   assert.equal(await page.locator("#report-csv").isDisabled(),true);
   await page.locator("#waterfall-pref").fill("8");
   assert.equal(await page.locator("#report-csv").isEnabled(),true);
   assert.deepEqual(errors,[]);
   console.log("Report browser, CSV and printable PDF passed at",width,"width",pdf.length,"bytes");
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
