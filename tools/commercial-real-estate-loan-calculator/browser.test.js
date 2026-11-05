"use strict";
const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900},acceptDownloads:true});
  // Deterministic UK-voice mock: captures the exact text submitted to speechSynthesis.
  await page.addInitScript(()=>{
    window.__spokenUtterances=[];window.__voiceCancelCount=0;
    const installed=[{name:"Sonia",lang:"en-GB",voiceURI:"uk-female-sonia",localService:true}];
    class MockUtterance{constructor(text){this.text=text;this.lang="";this.rate=1;this.voice=null;}}
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:MockUtterance});
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
      speaking:false, getVoices:()=>installed, addEventListener:()=>{},
      cancel:()=>{window.__voiceCancelCount++;},
      speak:(utterance)=>{window.__spokenUtterances.push({text:utterance.text,lang:utterance.lang,voice:utterance.voice?.voiceURI,rate:utterance.rate});}
    }});
  });
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
  // Interactive capital-stack amounts must follow the same financing model.
  assert.equal(await page.locator("#capital-stack-table tbody tr").count(),4);
  const initialStack=await page.evaluate(()=>{
    const model=LVCapitalStack.build(LVStrategy.capitalPlan({
      value:Number(document.querySelector("#ref-value").value),
      noi:Number(document.querySelector("#ref-noi").value),
      payoff:Number(document.querySelector("#ref-payoff").value),
      costs:Number(document.querySelector("#ref-costs").value),
      reserves:Number(document.querySelector("#ref-reserves").value),
      rate:Number(document.querySelector("#ref-rate").value),
      amortYears:Number(document.querySelector("#ref-amort").value),
      dscrMin:Number(document.querySelector("#ref-dscr").value),
      ltvMax:Number(document.querySelector("#ref-ltv").value),
      debtYieldMin:Number(document.querySelector("#ref-yield").value)
    },{
      sponsorCash:Number(document.querySelector("#st-cash").value),
      additionalCapital:Number(document.querySelector("#st-capital").value),
      type:document.querySelector("#st-type").value,
      annualReturn:Number(document.querySelector("#st-return").value),
      feePercent:Number(document.querySelector("#st-fee").value)
    }));
    return {
      modeled:model,
      gap:document.querySelector("#capital-stack-gap").textContent,
      rows:[...document.querySelectorAll("#capital-stack-table tbody tr")].map(r=>r.innerText)
    };
  });
  assert.equal(initialStack.gap,new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(initialStack.modeled.shortage));
  assert.ok(initialStack.rows.some(r=>r.includes("Junior debt")));
  await page.locator("#st-type").selectOption("preferred-equity");
  assert.ok((await page.locator("#capital-stack-table tbody").innerText()).includes("Preferred equity"));
  await page.locator("#st-type").selectOption("junior-debt");
  await page.locator("#stack-slider-cash").fill("200000");
  await page.waitForFunction(()=>document.querySelector("#st-cash").value==="200000");
  assert.equal(await page.locator("#stack-slider-cash-value").innerText(),"$200,000");
  assert.ok((await page.locator("#capital-stack-table tbody").innerText()).includes("200,000"));
  // Clicking "Listen" must actually invoke the speech engine, show a matching
  // transcript, and offer stop feedback — not merely update hidden ARIA text.
  const initialVoiceCount=await page.evaluate(()=>window.__spokenUtterances.length);
  await page.locator("#capital-stack-announce").click();
  const voiceCapture=await page.evaluate(()=>({
    utterances:window.__spokenUtterances,
    transcript:document.querySelector("#capital-stack-transcript").textContent,
    visible:!document.querySelector("#capital-stack-transcript-wrap").hidden,
    status:document.querySelector("#capital-stack-audio-status").textContent
  }));
  assert.equal(voiceCapture.utterances.length,initialVoiceCount+1);
  assert.equal(voiceCapture.utterances.at(-1).voice,"uk-female-sonia");
  assert.equal(voiceCapture.utterances.at(-1).lang,"en-GB");
  assert.equal(voiceCapture.utterances.at(-1).text,voiceCapture.transcript);
  assert.ok(voiceCapture.visible,"Capital stack transcript must be available");
  assert.match(voiceCapture.transcript,/total modeled funding uses/i);
  assert.match(voiceCapture.status,/narrating/i);
  const uiValues=await page.evaluate(()=>({
    uses:document.querySelector("#capital-stack-uses").textContent,
    sources:document.querySelector("#capital-stack-sources").textContent,
    gap:document.querySelector("#capital-stack-gap").textContent
  }));
  // Narration words must equal *the values visible on screen*.
  const words=await page.evaluate(numbers=>Object.fromEntries(
    Object.entries(numbers).map(([k,v])=>[k,LVSpokenAmounts.speakMoney(Number(v.replace(/[^0-9]/g,"")))])),uiValues);
  for(const word of Object.values(words))assert.ok(voiceCapture.transcript.includes(word),"Unmatched visible capital stack value: "+word);
  await page.locator("#capital-stack-stop").click();
  assert.match(await page.locator("#capital-stack-audio-status").innerText(),/stopped/i);
  // WAI-ARIA tab keyboard arrow navigation must switch panels and update tab order.
  await page.locator("#tab-refi").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator("#tab-loan").getAttribute("aria-selected"),"true");
  assert.equal(await page.locator("#tab-refi").getAttribute("tabindex"),"-1");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#tab-refi").getAttribute("aria-selected"),"true");
  await page.locator("#accessible-announce").click();
  assert.ok((await page.locator("#accessible-status").textContent()).includes("Refinance results"));
  assert.equal(await page.locator("#accessible-status").isVisible(),true,"The general summary should also be visible to non-screen-reader users");
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
  // Restore an underfunded plan before testing sponsor cash improvements.
  await page.locator("#st-cash").fill("0");
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
