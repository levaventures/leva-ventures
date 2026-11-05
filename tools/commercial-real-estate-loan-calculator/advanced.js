(function(){
"use strict";
const $=id=>document.getElementById(id);
const money=n=>n==null||!Number.isFinite(n)?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const pct=n=>n==null||!Number.isFinite(n)?"—":n.toFixed(1)+"%";
const cover=n=>n==null||!Number.isFinite(n)?"N/A":n.toFixed(2)+"x";
const num=id=>$(id).value.trim()===""?NaN:Number($(id).value);
const refIds=["ref-value","ref-noi","ref-payoff","ref-costs","ref-reserves","ref-rate","ref-amort","ref-dscr","ref-ltv","ref-yield"];
const editIds=["st-cash","st-capital","st-type","st-return","st-fee","alt-rate","alt-amort","alt-dscr","alt-ltv","alt-yield","alt-fees"];
const ref=()=>({value:num("ref-value"),noi:num("ref-noi"),payoff:num("ref-payoff"),costs:num("ref-costs"),reserves:num("ref-reserves"),rate:num("ref-rate"),amortYears:num("ref-amort"),dscrMin:num("ref-dscr"),ltvMax:num("ref-ltv"),debtYieldMin:num("ref-yield")});
const plan=()=>({sponsorCash:num("st-cash"),additionalCapital:num("st-capital"),type:$("st-type").value,annualReturn:num("st-return"),feePercent:num("st-fee")});
const alt=()=>({rate:num("alt-rate"),amortYears:num("alt-amort"),dscrMin:num("alt-dscr"),ltvMax:num("alt-ltv"),debtYieldMin:num("alt-yield"),extraCosts:num("alt-fees")});
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function set(id,text){$(id).textContent=text;}
function writeTable(tableId,rows){
 const body=$(tableId).querySelector("tbody");body.replaceChildren();
 for(const row of rows){const tr=node("tr");for(const cell of row){tr.append(node("td",cell));}body.append(tr);}
}
function heatmap(data){
 const table=$("st-heatmap"),thead=table.querySelector("thead"),body=table.querySelector("tbody");
 thead.replaceChildren();body.replaceChildren();
 const tr=node("tr");tr.append(node("th","NOI / Rate"));
 data.rateChanges.forEach(ch=>tr.append(node("th",(ch>=0?"+":"")+ch.toFixed(1)+" pp")));
 thead.append(tr);
 const all=data.matrix.flat().map(cell=>cell.gap),lo=Math.min(...all),hi=Math.max(...all);
 for(let i=0;i<data.matrix.length;i++){
  const row=node("tr"),noiChange=data.noiChanges[i];
  row.append(node("th",(noiChange>=0?"+":"")+noiChange+"%"));
  for(let j=0;j<data.matrix[i].length;j++){
   const cell=data.matrix[i][j],pos=(cell.gap-lo)/Math.max(1,hi-lo);
   const td=node("td",money(cell.gap),pos<.33?"heat-low":pos<.67?"heat-mid":"heat-high");
   if(i===2&&j===2)td.classList.add("heat-current");
   td.title="NOI "+(noiChange>=0?"+":"")+noiChange+"%; rate "+(data.rateChanges[j]>=0?"+":"")+data.rateChanges[j]+" percentage points. Binding: "+cell.binding;
   row.append(td);
  }
  body.append(row);
 }
}
function drivers(sensitivity,target,input){
 const container=$("st-drivers");container.replaceChildren();
 for(const d of sensitivity.drivers){
   const row=node("div",undefined,"driver");
   row.append(node("span",d.name),node("strong",(d.increaseInGap>1?"+":"")+money(d.increaseInGap)+" gap"));
   container.append(row);
 }
 const value=target.minimumPropertyValue===null?"Not available at 0% LTV":money(target.minimumPropertyValue);
 set("st-target","To fund the existing payoff, fees and reserves using modeled senior financing alone, indicative requirements include property value of at least "+value+" and NOI of at least "+money(target.minimumNOI)+" under these assumed loan terms. These conditions must both hold; they do not guarantee lender approval. Current NOI: "+money(input.noi)+".");
}
function compareTable(results){
 const labels=[
  ["Estimated financing sources",r=>money(r.proceeds)],
  ["Remaining funding gap",r=>money(r.uncovered)],
  ["Modeled annual cash obligation",r=>money(r.annualCash)],
  ["Cash obligation coverage",r=>cover(r.cashCoverage)],
  ["Debt / capital to property value",r=>pct(r.leverage)],
  ["Modeled fees and reserves",r=>money(r.fees)]
 ];
 const table=$("st-compare");const header=table.querySelector("thead tr");header.replaceChildren();
 ["Metric",...results.map(x=>x.name)].forEach(t=>header.append(node("th",t)));
 writeTable("st-compare",labels.map(([label,fn])=>[label,...results.map(fn)]));
}
function preview(input,capital,sensitivity,comparison,target){
 const base=sensitivity.basis;
 const lines=[
 "LEVA VENTURES | COMMERCIAL FINANCING BLUEPRINT — FREE SAMPLE",
 "Educational model based only on user-supplied assumptions; not a lender quote or investment recommendation.",
 "",
 "TRANSACTION BASELINE",
 "Property value: "+money(input.value)+" | NOI: "+money(input.noi),
 "Existing payoff: "+money(input.payoff)+" | Closing costs: "+money(input.costs)+" | Reserves: "+money(input.reserves),
 "Assumed senior rate: "+pct(input.rate)+" | Amortization: "+input.amortYears+" years",
 "Minimum DSCR: "+input.dscrMin.toFixed(2)+"x | LTV cap: "+pct(input.ltvMax)+" | Debt yield floor: "+pct(input.debtYieldMin),
 "",
 "SENIOR UNDERWRITING ESTIMATE",
 "Max by DSCR: "+money(base.limits.DSCR),
 "Max by LTV: "+money(base.limits.LTV),
 "Max by debt yield: "+money(base.limits["Debt yield"]),
 "Binding constraint: "+base.binding+" | Modeled proceeds: "+money(base.proceeds),
 "Payoff + fees + reserves: "+money(base.required)+" | Funding shortfall: "+money(base.gap),
 "",
 "HYPOTHETICAL CAPITAL PLAN",
 "Sponsor cash: "+money(capital.sponsorCash)+" | Additional "+capital.type+": "+money(capital.additionalCapital),
 "Extra upfront fee: "+money(capital.additionalFees)+" | Unfunded after modeled sources: "+money(capital.uncovered),
 "Senior debt service plus junior interest / preferred current pay: "+money(capital.annualCashObligations)+"/year",
 "Illustrative cash obligation coverage: "+cover(capital.combinedCashCoverage),
 "",
 "COMPARATIVE SCENARIOS",
 ...comparison.map(s=>s.name+": sources "+money(s.proceeds)+", gap "+money(s.uncovered)+", cash obligations "+money(s.annualCash)+"/year"),
 "",
 "POTENTIAL TARGET METRICS (SENIOR ONLY)",
 "To fully meet total payoff, fees and reserves with modeled senior debt alone:",
 "Minimum value at assumed LTV: "+(target.minimumPropertyValue==null?"Not available":money(target.minimumPropertyValue)),
 "Minimum NOI for DSCR and debt yield: "+money(target.minimumNOI),
 "",
 "QUESTIONS AND DOCUMENTS TO VERIFY",
 "1. Recent trailing 12-month operating statement, rent roll and defensible NOI adjustments",
 "2. Current lender payoff, maturity date, prepayment and extension provisions",
 "3. Property valuation and appraisal basis",
 "4. Loan fees, reserves, occupancy, rollover and capital expenditure requirements",
 ...(base.gap>0?["5. Evidence of sponsor liquidity or a credible approach to the modeled funding gap"]:[]),
 ...(capital.additionalCapital>0?["6. Senior loan documents: restrictions on subordinate debt, preferred equity, liens and distributions"]:[]),
 ...(capital.combinedCashCoverage!=null&&capital.combinedCashCoverage<1?["7. Additional support for cash requirements that exceed modeled NOI"]:[]),
 "8. Sponsor authority and entity documentation for the contemplated transaction",
 "",
 "IMPORTANT LIMITATIONS",
 ...capital.flags.map(f=>"- "+f),
 "No lender availability, interest rate, eligibility, underwriting approval or capital placement is represented.",
 "This sample is not a completed paid report and does not include independent professional review."
 ];
 return lines.join("\n");
}
let lastPreview="";
function render(){
 try {
  const input=ref(),strategy=LVStrategy.sensitivities(input);
  const capital=LVStrategy.capitalPlan(input,plan());
  const comparison=LVStrategy.compare(input,alt(),plan());
  const target=LVStrategy.breakEvenRequirements(input);
  set("st-error","");set("st-compare-error","");
  set("st-uncovered",money(capital.uncovered));
  set("st-coverage-label",capital.uncovered>0?"Scenario still has a funding gap":"Modeled sources cover modeled uses; no capital availability is confirmed.");
  set("st-senior",money(capital.seniorLoan));set("st-sources",money(capital.totalSources));
  set("st-obligations",money(capital.annualCashObligations));set("st-coverage",cover(capital.combinedCashCoverage));
  set("st-fees",money(capital.additionalFees));set("st-exit",money(capital.capitalDueAtExit));
  set("st-flags",capital.flags.length?capital.flags.join("\n"):"No additional-capital restrictions modeled. Actual underwriting and availability are not confirmed.");
  heatmap(strategy);drivers(strategy,target,input);compareTable(comparison);
  LVStackUI.render(capital);
  lastPreview=preview(input,capital,strategy,comparison,target);
  set("st-brief",lastPreview);
 }catch(e){
  lastPreview="";
  set("st-error",e.message);set("st-compare-error","Fix invalid inputs to recalculate.");
  ["st-uncovered","st-senior","st-sources","st-obligations","st-coverage","st-fees","st-exit"].forEach(id=>set(id,"—"));
  set("st-coverage-label","No current estimate");set("st-flags","Calculations unavailable until inputs are corrected.");
  set("st-brief","Correct invalid inputs to generate this sample.");$("st-heatmap").querySelector("tbody").replaceChildren();
  $("st-drivers").replaceChildren();$("st-compare").querySelector("tbody").replaceChildren();
  LVStackUI.reset();
 }
}
function init(){
  LVStackUI.init();
  const showAdvanced=()=>{$("advanced-workspace").hidden=$("refi-panel").hidden;};
  $("tab-loan").addEventListener("click",showAdvanced);
  $("tab-refi").addEventListener("click",showAdvanced);
  showAdvanced();
  [...refIds,...editIds].forEach(id=>$(id).addEventListener("input",render));
 $("st-type").addEventListener("change",render);
 $("st-copy").addEventListener("click",()=>{
  if(!lastPreview)return;
  if(navigator.clipboard&&navigator.clipboard.writeText){
   navigator.clipboard.writeText(lastPreview).then(()=>{$("st-copy").textContent="Copied";}).catch(()=>{$("st-copy").textContent="Copy unavailable";});
  }else $("st-copy").textContent="Copy unavailable";
 });
 $("st-print").addEventListener("click",()=>{if(!lastPreview)return;$("tab-refi").click();window.print();});
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
