/* Leva Desk v2: audit-ready reporting UI. Every displayed number is derived
   from a fresh independently reconciled LVDeskReport snapshot. No network or storage. */
(function(root){
"use strict";
const $=id=>document.getElementById(id);
const Core=root.LVDeskCore,Report=root.LVDeskReport;
if(!Core||!Report)throw new Error("Leva report financial modules must load first.");
const currency=n=>Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"—";
const percent=n=>Number.isFinite(n)?n.toFixed(2)+"%":"Not uniquely defined";
const elem=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
function validNumber(id,label){
 const field=$(id);
 if(!field||field.value.trim()===""||!field.checkValidity())throw new Error(label+" must be a valid number.");
 const value=Number(field.value);
 if(!Number.isFinite(value))throw new Error(label+" must be finite.");
 return value;
}
function settings(){
 const a=Object.fromEntries(Core.INPUTS.map(k=>[k,validNumber(k,Core.LABELS[k])]));
 const changes=prefix=>{
  const p=validNumber(prefix+"-noi","Scenario NOI change");
  const rateChange=validNumber(prefix+"-rate","Scenario rate change");
  const noi=a.noi*(1+p/100),rate=a.rate+rateChange;
  if(noi<0||rate<0)throw new Error("Scenario changes cannot imply negative NOI or interest rates.");
  return{noi,rate};
 };
 return{shared:a,options:{
  loan:{mode:$("loan-mode").value,customPrincipal:$("loan-amount").value,
   termYears:validNumber("loan-term","Loan maturity"),interestOnly:$("loan-io").checked},
  capital:{type:$("capital-type").value,
   additionalCapital:validNumber("capital-amount","Supplemental capital"),
   sponsorCash:validNumber("capital-sponsor","Sponsor cash"),
   annualReturn:validNumber("capital-rate","Cash-pay rate"),
   feePercent:validNumber("capital-fee","Capital fee")},
  investment:{purchasePrice:validNumber("investment-price","Purchase price"),
   acquisitionCosts:validNumber("investment-costs","Acquisition costs"),
   holdYears:validNumber("investment-hold","Hold period"),
   noiGrowthPct:validNumber("investment-growth","NOI growth"),
   exitCapRatePct:validNumber("investment-exitcap","Exit cap rate"),
   saleCostPct:validNumber("investment-selling","Exit selling costs"),
   discountRatePct:validNumber("investment-discount","NPV discount"),
   debtMode:$("investment-debtmode").value,customPrincipal:$("investment-debt").value},
  waterfall:{lpContributionPct:validNumber("waterfall-lpshare","LP equity contribution"),
   preferredReturnPct:validNumber("waterfall-pref","LP preferred return"),
   lpResidualPct:validNumber("waterfall-residual","LP residual share"),
   cumulative:$("waterfall-cumulative").checked,
   compound:$("waterfall-compound").checked},
  scenarios:[
   {name:"Downside",changes:changes("down")},
   {name:"Upside",changes:changes("up")}
  ]
 }};
}
let snapshot=null;
function reportRows(id,columns){
 const target=$(id);target.replaceChildren();
 for(const record of columns){
  const tr=elem("tr","");
  for(const field of record)tr.append(elem("td",field));
  target.append(tr);
 }
}
function render(r){
 const date=new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
 $("report-meta").textContent="Model "+r.modelVersion+" · Generated "+date+" · Illustrative only";
 const limit=r.debt.rankedLimits;
 reportRows("report-limits",limit.map(a=>[a.name,currency(a.amount),r.debt.binding.includes(a.name)?"Binding":"Not binding"]));
 reportRows("report-scenarios",r.scenarios.map(a=>[
  a.name,currency(a.proceeds),currency(a.gap),a.binding.join(" + ")||"Not defined"
 ]));
 const i=r.investment;
 reportRows("report-cashflow",[[ "0","—","—",currency(i.cashflows[0]) ],
  ...i.rows.map(a=>[String(a.year),currency(a.noi),currency(a.annualDebtService),currency(a.netCash)])]);
 reportRows("report-distributions",r.waterfall.rows.map(a=>[
  String(a.year),currency(a.lpDistribution),currency(a.gpDistribution),
  currency(a.lpCall+a.gpCall),currency(a.unpaidPreferredReturn)
 ]));
 reportRows("report-capital",r.capital.allocation.segments.map(a=>[
  a.label,currency(a.amount),currency(a.applied),a.share.toFixed(2)+"%"
 ]));
 const audit=$("report-audit");audit.replaceChildren();
 for(const check of r.checks)audit.append(elem("li",check));
 const cautions=$("report-disclosures");cautions.replaceChildren();
 for(const item of r.warnings)cautions.append(elem("li",item));
 $("report-investment-irr").textContent=i.irr.status==="unique"?percent(i.irr.ratePct):
  i.irr.status==="multiple"?"Multiple possible IRRs":"Not defined";
 $("report-investment-multiple").textContent=i.equityMultiple.toFixed(2)+"x";
 $("report-waterfall-lp").textContent=currency(r.waterfall.totals.distributedLP);
 $("report-waterfall-gp").textContent=currency(r.waterfall.totals.distributedGP);
 $("report-validity").textContent="Eight modules reconciled for the current valid assumptions.";
 $("report-error").hidden=true;$("report-error").textContent="";
 $("report-csv").disabled=false;$("print").disabled=false;
}
function clear(message){
 snapshot=null;
 for(const id of ["report-limits","report-scenarios","report-cashflow","report-distributions","report-capital","report-audit","report-disclosures"])$(id).replaceChildren();
 $("report-validity").textContent="Consolidated report unavailable until all inputs are valid.";
 $("report-error").textContent=message||"Correct the financial assumptions in the affected module.";
 $("report-error").hidden=false;$("report-csv").disabled=true;$("print").disabled=true;
}
function update(){
 try{
  const {shared,options}=settings();
  const current=Report.build(shared,options);
  render(current);
  snapshot=current;
 }catch(error){clear(error.message);}
}
function downloadCSV(){
 if(!snapshot)throw new Error("No valid report is available for export.");
 const csv=Report.asCSV(snapshot);
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 try{
  const link=document.createElement("a");
  link.href=url;link.download="leva-financing-intelligence-desk-review.csv";
  document.body.append(link);link.click();link.remove();
 }finally{setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
function setup(){
 $("report-csv").addEventListener("click",()=>{
  if(!snapshot)return;
  try{downloadCSV();}catch(error){clear(error.message);}
 });
}
root.LVDeskReportUI={setup,update,clear,ready:()=>snapshot!==null};
})(typeof globalThis!=="undefined"?globalThis:this);
