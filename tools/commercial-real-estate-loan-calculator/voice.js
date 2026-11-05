/* Leva Guided Insights — optional, user-initiated explanatory narration.
   Calculations come exclusively from Leva's deterministic finance/strategy modules.
   Browser speech engines and installed voices may have their own data practices. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const ids=["ref-value","ref-noi","ref-payoff","ref-costs","ref-reserves","ref-rate","ref-amort","ref-dscr","ref-ltv","ref-yield","st-cash","st-capital","st-type","st-return","st-fee"];
const speechAvailable=typeof window.speechSynthesis!=="undefined"&&typeof window.SpeechSynthesisUtterance!=="undefined";
let voices=[],current=null,spokenText="",voiceChangedByUser=false;
const money=n=>LVSpokenAmounts.speakMoney(n);
const raw=id=>$(id).value.trim()===""?NaN:Number($(id).value);
function inputs(){
 return {value:raw("ref-value"),noi:raw("ref-noi"),payoff:raw("ref-payoff"),costs:raw("ref-costs"),reserves:raw("ref-reserves"),
 rate:raw("ref-rate"),amortYears:raw("ref-amort"),dscrMin:raw("ref-dscr"),ltvMax:raw("ref-ltv"),debtYieldMin:raw("ref-yield")};
}
function config(){
 return {sponsorCash:raw("st-cash"),additionalCapital:raw("st-capital"),type:$("st-type").value,
  annualReturn:raw("st-return"),feePercent:raw("st-fee")};
}
function status(msg){$("voice-status").textContent=msg;$("loan-voice-status").textContent=msg;}
function stop(){
 if(!speechAvailable)return;
 window.speechSynthesis.cancel();
 current=null;
 status("Narration stopped. Your calculations have not changed.");
}
function isUKVoice(voice){
 return /^en[-_]GB$/i.test(voice.lang||"") || /\b(uk|british|united kingdom)\b/i.test(voice.name||"");
}
function isFemaleVoiceName(name){
 // SpeechSynthesisVoice has no gender property. Recognise common UK female voice names.
 return /\b(female|sonia|libby|hazel|kate|serena|maisie|martha|susan|amy|emma|olivia|sophie|elizabeth|abigail|catherine|hollie)\b/i.test(name||"");
}
function preferredVoice(english){
 return english.find(v=>isUKVoice(v)&&isFemaleVoiceName(v.name)) ||
        english.find(isUKVoice) ||
        english.find(v=>isFemaleVoiceName(v.name)) ||
        english[0] || null;
}
function regenerateVoices(){
 if(!speechAvailable)return;
 const choices=$("voice-choice");
 const previouslySelected=choices.value;
 voices=(window.speechSynthesis.getVoices()||[]).filter(v=>v.lang&&/^en(?:\b|-|_)/i.test(v.lang));
 const picked=preferredVoice(voices);
 choices.replaceChildren();
 for(const v of voices){
   const option=document.createElement("option");
   option.value=v.voiceURI;
   option.textContent=v.name+(v.localService?" (device)":" (service)");
   choices.append(option);
 }
 if(!voices.length){
   const option=document.createElement("option");
   option.value="";
   option.textContent="No English voices available";
   option.disabled=true;
   choices.append(option);
   choices.value="";
   choices.disabled=true;
   status("No English voices are available yet. The written explanation remains available.");
   return;
 }
 choices.disabled=false;
 const keepUserSelection=voiceChangedByUser&&voices.some(v=>v.voiceURI===previouslySelected);
 const selection=keepUserSelection?previouslySelected:picked.voiceURI;
 choices.value=selection;
 if(!keepUserSelection && !current){
   if(isUKVoice(picked)&&isFemaleVoiceName(picked.name)){
     status("Default voice: "+picked.name+". Choose another voice if preferred.");
   }else if(isUKVoice(picked)){
     status("A UK voice is selected. This browser does not identify it as one of the known UK female voices.");
   }else{
     status("A UK female voice is not installed in this browser. Using "+picked.name+" instead.");
   }
 }
}
function loanNarration(){
 const a=LVFinance.loan({principal:raw("loan-principal"),rate:raw("loan-rate"),
 termYears:raw("loan-term"),amortYears:raw("loan-amort"),interestOnly:$("loan-io").checked});
 return "Loan summary. The estimated monthly payment shown on screen is "+money(a.monthlyPayment)+". "+
 "Annual scheduled debt service is "+money(a.annualDebtService)+". "+
 "The estimated balloon balance at maturity is "+money(a.balloon)+". "+
 "Total interest paid during the loan term is "+money(a.interestPaid)+". "+
 "Principal repaid during the loan term is "+money(a.principalRepaid)+". "+
 "All spoken amounts are rounded to the nearest dollar, exactly as displayed on screen. "+
 "The payment schedule download retains cents. These estimates exclude property taxes, insurance, lender fees and reserve requirements. They do not constitute an offer of financing.";
}
function refinanceNarration(){
 const data=inputs(),r=LVFinance.refinance(data);
 const limiting=r.binding||"the calculated loan constraints";
 const gap=LVSpokenAmounts.roundDisplayedDollars(r.gap)>0?
   "That leaves an estimated refinancing funding shortfall of "+money(r.gap)+". ":
   "These assumptions show no financing gap, although cash-out proceeds and actual eligibility are not confirmed. ";
 return "Leva Refinance Intelligence. Based on your entered property value of "+money(r.value)+
 ", and annual net operating income of "+money(r.noi)+
 ", your estimated supportable senior loan is "+money(r.proceeds)+
 ". The current loan payoff, fees and reserves require "+money(r.required)+". "+
 gap+"The binding financing constraint is "+limiting+
 ". In this model the lender tests debt service coverage, loan to value and debt yield, and the lowest resulting maximum loan controls the estimate. "+
 "Actual lender underwriting, property conditions and available financing terms could change these results. This is educational analysis, not an approval or financing offer.";
}
function capitalNarration(){
 const data=inputs(),p=LVStrategy.capitalPlan(data,config());
 const type=p.type==="preferred-equity"?"current-pay preferred equity":"interest-only junior debt";
 const covered=LVSpokenAmounts.roundDisplayedDollars(p.uncovered)>0?"After accounting for new fees and selected sources, "+money(p.uncovered)+" remains uncovered. ":
 "Under these assumptions the modeled funding uses are fully covered, but no additional capital source has been confirmed. ";
 return "Your hypothetical capital plan uses senior loan proceeds of "+money(p.seniorLoan)+
 ", sponsor cash of "+money(p.sponsorCash)+", and "+money(p.additionalCapital)+
 " of "+type+". Additional capital fees total "+money(p.additionalFees)+". "+
 covered+"Modeled annual cash obligations are "+money(p.annualCashObligations)+
 ". Additional capital can be restricted by senior loan documents, financial covenants, lien priority and legal requirements. "+
 "This is an educational structure comparison, not a recommendation or an available financing solution.";
}
const explanations={
 dscr:"Debt service coverage ratio, or D S C R, compares a property's annual net operating income with annual scheduled loan debt service. A ratio of one point two five means there is one dollar and twenty-five cents of modeled net operating income for each dollar of scheduled senior loan debt service. Lenders may adjust the income and expenses they use.",
 ltv:"Loan to value ratio, or L T V, measures loan principal compared with the property's assessed value. For example, a seventy percent maximum L T V limits modeled loan proceeds to seventy cents per dollar of property value before other lender constraints are applied.",
 yield:"Debt yield is annual net operating income divided by loan principal. A nine percent minimum debt yield means that, under that test alone, a property's annual net operating income must be at least nine cents for every dollar of loan principal. This test does not depend on the amortization schedule."
};
function chosenVoice(){
 const voiceURI=$("voice-choice").value;
 return voices.find(v=>v.voiceURI===voiceURI)||null;
}
function narrate(text){
 spokenText=text;
 $("voice-transcript").textContent=text;
 $("loan-voice-transcript").textContent=text;
 $("voice-transcript-wrap").hidden=false;
 $("loan-voice-transcript-wrap").hidden=false;
 if(!speechAvailable){status("Voice playback is not available in this browser. The narration transcript is shown below.");return;}
 const synth=window.speechSynthesis;
 synth.cancel();
 const utterance=new SpeechSynthesisUtterance(text);
 const voice=chosenVoice();
 if(!voice){status("No English voice is available. Read the transcript below.");return;}
 utterance.lang=voice.lang||"en-GB";utterance.voice=voice;
 utterance.rate=Number($("voice-rate").value)||1;
 current=utterance;
 utterance.onend=()=>{if(current===utterance){current=null;status("Finished speaking. Choose another explanation at any time.");}};
 utterance.onerror=()=>{if(current===utterance){current=null;status("Voice playback was interrupted. You can still read the transcript below.");}};
 status("Narrating now. Press Stop at any time.");
 synth.speak(utterance);
}
function handle(makeText){
 try{narrate(makeText());}
 catch(err){stop();$("voice-transcript-wrap").hidden=true;$("loan-voice-transcript-wrap").hidden=true;status("Please correct any invalid financial inputs before using narration.");}
}
function init(){
 const controlMap={"voice-results":refinanceNarration,"voice-options":capitalNarration,
 "voice-dscr":()=>explanations.dscr,"voice-ltv":()=>explanations.ltv,"voice-yield":()=>explanations.yield};
 Object.entries(controlMap).forEach(([id,makeText])=>$(id).addEventListener("click",()=>handle(makeText)));
 $("voice-stop").addEventListener("click",stop);
 $("loan-voice").addEventListener("click",()=>handle(loanNarration));
 $("loan-voice-stop").addEventListener("click",stop);
 $("tab-loan").addEventListener("click",()=>{if(speechAvailable)window.speechSynthesis.cancel();});
 $("tab-refi").addEventListener("click",()=>{if(speechAvailable)window.speechSynthesis.cancel();});
 [...ids,"loan-principal","loan-rate","loan-term","loan-amort","loan-io"].forEach(id=>$(id).addEventListener("input",()=>{
  if(speechAvailable&&window.speechSynthesis.speaking)stop();
  if(spokenText)status("Inputs changed. Select an explanation to hear the updated numbers.");
 }));
 if(!speechAvailable)status("Audio narration is unavailable here. Explanations can still be viewed as text.");
 else{
   $("voice-choice").addEventListener("change",()=>{voiceChangedByUser=true;});
   regenerateVoices();
   window.speechSynthesis.addEventListener?.("voiceschanged",regenerateVoices);
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();