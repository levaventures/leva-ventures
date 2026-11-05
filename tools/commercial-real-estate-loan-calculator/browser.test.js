"use strict";
const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900},acceptDownloads:true});
  page.on("pageerror",error=>{console.error("Browser exception:",error);process.exitCode=1;});
  const url="file://"+path.resolve(__dirname,process.env.LEVA_PREVIEW_FILE || "index.html");
  await page.goto(url,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#loan-payment").textContent!=="—");
  assert.match(await page.locator("#loan-payment").innerText(),/^\$/);
  assert.equal(await page.locator("#advanced-workspace").isVisible(),false);
  await page.getByRole("tab",{name:"Refinance Intelligence"}).click();
  await page.waitForFunction(()=>document.querySelector("#st-uncovered").textContent!=="—");
  assert.equal(await page.locator("#advanced-workspace").isVisible(),true);
  assert.match(await page.locator("#ref-gap").innerText(),/^\$/);
  assert.equal(await page.locator("#st-heatmap tbody tr").count(),5);
  assert.equal(await page.locator("#st-compare tbody tr").count(),6);
  const voiceOptions=await page.locator("#voice-choice option").allTextContents();
  assert.ok(!voiceOptions.some(x=>/automatic voice/i.test(x)),"Automatic voice option must be removed.");
  await page.locator("#voice-panel summary").first().click();
  await page.locator("#voice-results").click();
  await page.waitForFunction(()=>document.querySelector("#voice-transcript").textContent.includes("supportable senior loan"));
  assert.equal(await page.locator("#voice-transcript-wrap").isVisible(),true);
  assert.match(await page.locator("#ref-graphic-total").innerText(),/required/);
  assert.ok((await page.locator("#ref-graphic-gap").innerText()).startsWith("$"));
  await page.locator("#voice-dscr").click();
  assert.match(await page.locator("#voice-transcript").textContent(),/coverage ratio/i);
  await page.locator("#voice-stop").click();
  const original=await page.locator("#st-uncovered").innerText();
  await page.locator("#st-cash").fill("400000");
  await page.waitForFunction(previous=>document.querySelector("#st-uncovered").textContent!==previous,original);
  const reduced=await page.locator("#st-uncovered").innerText();
  assert.notEqual(original,reduced,"Changing sponsor cash should update the funding gap.");
  await page.locator("#ref-noi").fill("-5");
  await page.waitForFunction(()=>document.querySelector("#st-error").textContent.length>0);
  assert.match(await page.locator("#st-error").innerText(),/at least 0/);
  await page.locator("#ref-noi").fill("350000");
  await page.waitForFunction(()=>document.querySelector("#st-error").textContent==="");
  await page.getByRole("tab",{name:"Commercial Loan Calculator"}).click();
  assert.equal(await page.locator("#advanced-workspace").isVisible(),false);
  // Narration must spell the exact whole-dollar figures shown in all five loan results.
  const narratedCases=[
    {principal:"2500000",rate:"7.5",term:"10",amort:"25",io:false},
    {principal:"1000000",rate:"6",term:"5",amort:"25",io:true},
    {principal:"120000",rate:"0",term:"10",amort:"10",io:false},
    {principal:"1234567",rate:"8.125",term:"7",amort:"30",io:false},
    {principal:"550000",rate:"4.375",term:"20",amort:"20",io:false}
  ];
  for(const scenario of narratedCases){
    await page.locator("#loan-principal").fill(scenario.principal);
    await page.locator("#loan-rate").fill(scenario.rate);
    await page.locator("#loan-term").fill(scenario.term);
    await page.locator("#loan-amort").fill(scenario.amort);
    if(scenario.io)await page.locator("#loan-io").check();
    else await page.locator("#loan-io").uncheck();
    await page.locator("#loan-voice").click();
    const proof=await page.evaluate(()=>{
      const ids=["loan-payment","loan-annual","loan-balloon","loan-interest","loan-repaid"];
      const transcript=document.querySelector("#loan-voice-transcript").textContent;
      const screen=ids.map(id=>document.getElementById(id).textContent);
      const words=screen.map(d=>LVSpokenAmounts.speakMoney(Number(d.replace(/[^0-9]/g,""))));
      return {transcript,screen,words};
    });
    for(let i=0;i<proof.words.length;i++){
      assert.ok(proof.transcript.includes(proof.words[i]),"Narration mismatch in "+scenario.principal+", "+proof.screen[i]+" expected "+proof.words[i]);
    }
  }
  // Check that a known historically problematic case uses every digit.
  await page.locator("#loan-principal").fill("2500000");
  await page.locator("#loan-rate").fill("7.5");
  await page.locator("#loan-term").fill("10");
  await page.locator("#loan-amort").fill("25");
  await page.locator("#loan-io").uncheck();
  await page.locator("#loan-voice").click();
  const exactNarration=await page.locator("#loan-voice-transcript").textContent();
  assert.ok(exactNarration.includes("eighteen thousand four hundred"),"Must not round payment to 18 thousand dollars");
  await page.locator("#loan-io").check();
  await page.waitForFunction(()=>document.querySelector("#loan-insight").textContent.includes("Interest-only"));
  assert.match(await page.locator("#loan-balloon").innerText(),/2,500,000/);
  const downloadPromise=page.waitForEvent("download");
  await page.locator("#loan-csv").click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/payment-schedule.csv/);
  console.log("Desktop browser smoke tests passed.");
  await page.setViewportSize({width:390,height:844});
  await page.getByRole("tab",{name:"Refinance Intelligence"}).click();
  await page.waitForFunction(()=>document.querySelector("#advanced-workspace").hidden===false);
  assert.equal(await page.locator("#st-compare tbody tr").count(),6);
  const bodyOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+3);
  assert.equal(bodyOverflow,false,"Mobile layout should not create body-level horizontal overflow.");
  console.log("Mobile browser smoke tests passed.");
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
