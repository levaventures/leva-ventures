"use strict";
const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");
const currency=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900},acceptDownloads:true});
  const pageErrors=[];
  page.on("pageerror",e=>pageErrors.push(String(e)));
  await page.addInitScript(()=>{
   window.__qaUtterances=[];window.__qaCancels=0;window.__qaPrints=0;
   Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{constructor(text){this.text=text;}}});
   Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
    getVoices:()=>[{name:"Sonia",lang:"en-GB",voiceURI:"qa-uk-female",localService:true}],
    speaking:false,cancel:()=>{window.__qaCancels++},speak:u=>window.__qaUtterances.push({text:u.text,lang:u.lang,voice:u.voice?.voiceURI}),
    addEventListener:()=>{}
   }});
   window.print=()=>{window.__qaPrints++;};
  });
  const filename=process.env.LEVA_PREVIEW_FILE||"index.html";
  await page.goto("file://"+path.resolve(__dirname,filename),{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#loan-payment").textContent!=="—");
  assert.match(await page.locator("#loan-payment").innerText(),/^\$/);
  // Recalculate interest-only terms by an independently known arithmetic identity.
  await page.locator("#loan-principal").fill("1000000");
  await page.locator("#loan-rate").fill("6");
  await page.locator("#loan-term").fill("5");
  await page.locator("#loan-amort").fill("25");
  await page.locator("#loan-io").check();
  assert.equal(await page.locator("#loan-payment").innerText(),"$5,000");
  assert.equal(await page.locator("#loan-annual").innerText(),"$60,000");
  assert.equal(await page.locator("#loan-balloon").innerText(),"$1,000,000");
  assert.equal(await page.locator("#loan-interest").innerText(),"$300,000");
  assert.equal(await page.locator("#loan-repaid").innerText(),"$0");
  // Clear and out-of-range values must invalidate results and spoken statements.
  await page.locator("#loan-rate").fill("150");
  assert.equal(await page.locator("#loan-payment").innerText(),"—");
  assert.match(await page.locator("#loan-error").innerText(),/valid value/i);
  await page.locator("#loan-voice").click();
  assert.equal(await page.locator("#loan-voice-transcript-wrap").isVisible(),false);
  await page.locator("#loan-rate").fill("0");
  await page.locator("#loan-io").uncheck();
  assert.equal(await page.locator("#loan-payment").innerText(),"$3,333");
  await page.locator("#loan-term").fill("25");
  assert.equal(await page.locator("#loan-payment").innerText(),"$3,333");
  assert.equal(await page.locator("#loan-balloon").innerText(),"$0");
  await page.locator("#loan-print").click();
  assert.equal(await page.evaluate(()=>window.__qaPrints),1);
  const downloadPromise=page.waitForEvent("download");
  await page.locator("#loan-csv").click();
  const dl=await downloadPromise;
  assert.match(dl.suggestedFilename(),/leva-commercial-loan-payment-schedule.csv/);
  await page.locator("#tab-refi").click();
  await page.waitForFunction(()=>document.querySelector("#st-uncovered").textContent!=="—");
  // Independent checks: payoff + costs + reserves = required, fees = capital * fee rate.
  assert.equal(await page.locator("#ref-required").innerText(),"$3,475,000");
  assert.equal(await page.locator("#capital-stack-uses").innerText(),"$3,481,000");
  assert.equal(await page.locator("#st-fees").innerText(),"$6,000");
  assert.equal(await page.locator("#capital-stack-table tbody tr").count(),4);
  assert.equal(await page.locator("#st-heatmap tbody tr").count(),5);
  assert.equal(await page.locator("#st-compare tbody tr").count(),6);
  assert.equal(await page.locator("#voice-choice").inputValue(),"qa-uk-female");
  const before=await page.evaluate(()=>window.__qaUtterances.length);
  await page.locator("#capital-stack-announce").click();
  const voice=await page.evaluate(()=>({utterances:window.__qaUtterances.slice(),status:document.querySelector("#capital-stack-audio-status").textContent,transcript:document.querySelector("#capital-stack-transcript").textContent}));
  assert.equal(voice.utterances.length,before+1);
  assert.equal(voice.utterances.at(-1).text,voice.transcript);
  assert.equal(voice.utterances.at(-1).lang,"en-GB");
  assert.match(voice.transcript,/senior loan|junior debt|sponsor cash/i);
  assert.match(voice.status,/narrating/i);
  await page.locator("#capital-stack-stop").click();
  assert.match(await page.locator("#capital-stack-audio-status").innerText(),/stopped/i);
  const beforeChange=await page.locator("#capital-stack-gap").innerText();
  await page.locator("#stack-slider-cash").fill("200000");
  assert.equal(await page.locator("#st-cash").inputValue(),"200000");
  assert.notEqual(await page.locator("#capital-stack-gap").innerText(),beforeChange);
  await page.locator("#capital-stack-announce").click();
  assert.match(await page.locator("#capital-stack-transcript").textContent(),/two hundred thousand dollars/);
  await page.locator("#st-type").selectOption("preferred-equity");
  assert.match(await page.locator("#capital-stack-table tbody").innerText(),/Preferred equity/);
  await page.locator("#capital-stack-announce").click();
  assert.match(await page.locator("#capital-stack-transcript").textContent(),/preferred equity/);
  // Source excess is displayed separately; the bar always allocates 100% of uses.
  await page.locator("#st-cash").fill("1000000");
  assert.equal(await page.locator("#capital-stack-gap").innerText(),"$0");
  const barPercent=await page.evaluate(()=>[...document.querySelectorAll("#capital-stack-visual .capital-segment")].reduce((a,b)=>a+parseFloat(b.style.width),0));
  assert.ok(Math.abs(barPercent-100)<.001);
  assert.notEqual(await page.locator("#capital-stack-surplus").innerText(),"$0");
  await page.locator("#st-cash").fill("0");
  await page.locator("#st-capital").fill("0");
  assert.equal(await page.locator("#capital-stack-gap").innerText(),await page.locator("#ref-gap").innerText());
  // Loss of NOI eliminates modeled senior lending proceeds.
  await page.locator("#ref-noi").fill("0");
  assert.equal(await page.locator("#ref-proceeds").innerText(),"$0");
  assert.equal(await page.locator("#capital-stack-gap").innerText(),"$3,475,000");
  // Invalid refi terms must be rejected throughout the UI and voice.
  await page.locator("#ref-rate").fill("125");
  assert.equal(await page.locator("#ref-proceeds").innerText(),"—");
  assert.equal(await page.locator("#capital-stack-gap").innerText(),"—");
  const utterancesBeforeBad=await page.evaluate(()=>window.__qaUtterances.length);
  await page.locator("#capital-stack-announce").click();
  assert.equal(await page.evaluate(()=>window.__qaUtterances.length),utterancesBeforeBad);
  assert.match(await page.locator("#capital-stack-audio-status").innerText(),/correct any invalid/i);
  await page.locator("#ref-rate").fill("8");
  await page.locator("#ref-noi").fill("350000");
  await page.locator("#st-capital").fill("300000");
  await page.locator("#st-cash").fill("150000");
  await page.locator("#st-type").selectOption("junior-debt");
  assert.notEqual(await page.locator("#capital-stack-gap").innerText(),"—");
  await page.locator("#accessible-announce").click();
  assert.equal(await page.locator("#accessible-status").isVisible(),true);
  assert.match(await page.locator("#accessible-status").innerText(),/refinance results/i);
  await page.locator("#st-print").click();
  assert.equal(await page.evaluate(()=>window.__qaPrints),2);
  // Keyboard/zoom/small-screen functionality remains intact.
  await page.locator("#tab-refi").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator("#tab-loan").getAttribute("aria-selected"),"true");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#tab-refi").getAttribute("aria-selected"),"true");
  for(const width of [390,320]){
    await page.setViewportSize({width,height:810});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+3),false,"Horizontal overflow at "+width);
  }
  assert.deepEqual(pageErrors,[],"JavaScript page errors must not occur");
  console.log("FULL QA PASS: known loan values, limits, speech synthesis, transcripts, stop, cash/capital sliders, overfunding, zero NOI, tables, CSV, print, keyboard and mobile");
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
