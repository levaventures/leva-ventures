(function(){
"use strict";
const $=id=>document.getElementById(id);
const money=n=>Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"—";
const pct=n=>Number.isFinite(n)?n.toFixed(1)+"%":"—";
const multiplier=n=>Number.isFinite(n)?n.toFixed(2)+"x":"—";
const numeric=id=>{const raw=$(id).value;if(raw.trim()==="")return NaN;return Number(raw);};
const loanInputs=["loan-principal","loan-rate","loan-term","loan-amort","loan-io"];
const refInputs=["ref-value","ref-noi","ref-payoff","ref-costs","ref-reserves","ref-rate","ref-amort","ref-dscr","ref-ltv","ref-yield"];
function validateFinancialFields(ids){
 for(const id of ids){
   const field=$(id);
   if(!field||field.type==="checkbox")continue;
   if(field.value.trim()===""||!field.checkValidity()){
     throw new Error("Please enter a valid value for "+(document.querySelector('label[for="'+id+'"]')?.textContent||id)+".");
   }
 }
}

let lastLoan=null,lastRef=null;
function loanParams(){return {principal:numeric("loan-principal"),rate:numeric("loan-rate"),termYears:numeric("loan-term"),amortYears:numeric("loan-amort"),interestOnly:$("loan-io").checked};}
function refParams(){return {value:numeric("ref-value"),noi:numeric("ref-noi"),payoff:numeric("ref-payoff"),costs:numeric("ref-costs"),reserves:numeric("ref-reserves"),rate:numeric("ref-rate"),amortYears:numeric("ref-amort"),dscrMin:numeric("ref-dscr"),ltvMax:numeric("ref-ltv"),debtYieldMin:numeric("ref-yield")};}
function setText(id,value){$(id).textContent=value;}
function updateLoan(){
  try {
    validateFinancialFields(loanInputs);const a=LVFinance.loan(loanParams());lastLoan=a;
    setText("loan-error","");setText("loan-payment",money(a.monthlyPayment));setText("loan-annual",money(a.annualDebtService));
    setText("loan-balloon",money(a.balloon));setText("loan-interest",money(a.interestPaid));setText("loan-repaid",money(a.principalRepaid));
    setText("loan-insight",a.interestOnly?"Interest-only payments do not reduce principal; the full loan amount remains due at maturity.":a.balloon>1?"With a term shorter than the amortization period, a balloon balance remains due at maturity.":"Based on these assumptions the loan is fully amortized by maturity.");
  }catch(e){lastLoan=null;setText("loan-error",e.message);["loan-payment","loan-annual","loan-balloon","loan-interest","loan-repaid"].forEach(id=>setText(id,"—"));setText("loan-insight","Correct the input above to calculate your loan.");}
}
function create(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function renderLimits(result){
  const target=$("constraint-bars");target.replaceChildren();
  const highest=Math.max(1,...Object.values(result.limits));
  Object.keys(result.limits).forEach(key=>{
    const row=create("div","chartrow");
    row.append(create("span","",key));
    const track=create("div","track");track.setAttribute("aria-hidden","true");
    const bar=create("div","fill");bar.style.width=Math.max(0,100*result.limits[key]/highest)+"%";
    track.append(bar);row.append(track);row.append(create("strong","",money(result.limits[key])));target.append(row);
  });
}
function renderScenarios(params,baseline){
  const scenarios=[
    {name:"Rate -0.50%",change:{rate:Math.max(0,params.rate-.5)},note:"Assumes a lower rate; not a quote"},
    {name:"NOI +10%",change:{noi:params.noi*1.1},note:"Assumes improved net income"},
    {name:"Sponsor cash +$100K",cash:100000,note:"Additional equity reduces shortfall"}
  ];
  const target=$("scenario-cards");target.replaceChildren();
  scenarios.forEach(s=>{
    const result=s.cash?baseline:LVFinance.refinance(Object.assign({},params,s.change));
    const gap=Math.max(0,result.gap-(s.cash||0));
    const card=create("div","scenario");card.append(create("small","",s.name),create("strong","",money(gap)),create("small","",""));
    card.lastElementChild.textContent=s.note;
    target.append(card);
  });
}
function updateRef(){
  try{
    validateFinancialFields(refInputs);const params=refParams(),r=LVFinance.refinance(params);lastRef={params,result:r};
    setText("ref-error","");setText("ref-gap",money(r.gap));setText("ref-gap-label",r.gap>0?"Estimated additional cash required beyond modeled proceeds":"No modeled shortfall; potential surplus: "+money(r.surplus));
    setText("ref-proceeds",money(r.proceeds));setText("ref-required",money(r.required));setText("ref-actual-dscr",multiplier(r.dscr));setText("ref-actual-ltv",pct(r.ltv));
    setText("ref-insight",r.proceeds===0?"Based on these inputs, the model supports no loan proceeds.":r.binding+" is the limiting constraint under your assumptions. Actual financing may be constrained by additional lender criteria.");
    renderLimits(r);renderScenarios(params,r);
    const total=Math.max(0,r.required),senior=Math.min(total,r.proceeds),shortfall=Math.max(0,total-senior);
    const seniorShare=total>0?100*senior/total:0;
    const gapShare=total>0?100*shortfall/total:0;
    $("ref-bar-senior").style.width=seniorShare.toFixed(3)+"%";
    $("ref-bar-gap").style.width=gapShare.toFixed(3)+"%";
    setText("ref-graphic-total",money(total)+" required");
    setText("ref-graphic-senior",money(senior));
    setText("ref-graphic-gap",money(shortfall));
    setText("ref-graphic-explanation",r.proceeds>total?"The modeled senior loan exceeds the stated funding requirement; excess potential proceeds are not shown in the bar.":"The bar compares modeled senior proceeds with payoff, costs and reserves.");
  }catch(e){lastRef=null;setText("ref-error",e.message);["ref-gap","ref-proceeds","ref-required","ref-actual-dscr","ref-actual-ltv"].forEach(id=>setText(id,"—"));$("constraint-bars").replaceChildren();$("scenario-cards").replaceChildren();$("ref-bar-senior").style.width="0%";$("ref-bar-gap").style.width="0%";["ref-graphic-total","ref-graphic-senior","ref-graphic-gap"].forEach(id=>setText(id,"—"));setText("ref-insight","Correct the input above to see the modeled financing constraints.");}
}
function setTab(tab){
  const ref=tab==="refi";
  $("loan-panel").hidden=ref;$("refi-panel").hidden=!ref;
  $("tab-loan").setAttribute("aria-selected",String(!ref));$("tab-refi").setAttribute("aria-selected",String(ref));
  if(ref)updateRef();else updateLoan();
}
function csvCell(value){return '"'+String(value).replace(/"/g,'""')+'"';}
function download(name,text){
  const blob=new Blob([text],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function loanCsv(){
  if(!lastLoan)return;
  const rows=[["Month","Monthly payment","Interest","Principal","Remaining principal"],...lastLoan.schedule.map(r=>[r.month,r.payment.toFixed(2),r.interest.toFixed(2),r.principal.toFixed(2),r.remaining.toFixed(2)])];
  download("leva-commercial-loan-payment-schedule.csv",rows.map(r=>r.map(csvCell).join(",")).join("\r\n"));
}
function summaryForRef(){
  if(!lastRef)return "";
  const p=lastRef.params,r=lastRef.result;
  return ["LEVA VENTURES — REFINANCE INTELLIGENCE ESTIMATE","Assumptions are user-supplied; these are not lender-approved terms.","",
    "Property value: "+money(p.value),"Annual NOI: "+money(p.noi),"Payoff: "+money(p.payoff),
    "Closing costs: "+money(p.costs),"Reserves: "+money(p.reserves),
    "Rate: "+pct(p.rate),"Amortization: "+p.amortYears+" years","Minimum DSCR: "+multiplier(p.dscrMin),"Maximum LTV: "+pct(p.ltvMax),"Minimum debt yield: "+pct(p.debtYieldMin),"",
    "Loan limit by DSCR: "+money(r.limits.DSCR),"Loan limit by LTV: "+money(r.limits.LTV),
    "Loan limit by debt yield: "+money(r.limits["Debt yield"]),
    "Estimated proceeds: "+money(r.proceeds),"Binding constraint: "+r.binding,
    "Payoff + costs + reserves: "+money(r.required),"Estimated funding gap: "+money(r.gap),
    "Actual DSCR on modeled loan: "+multiplier(r.dscr),"LTV on modeled loan: "+pct(r.ltv),"",
    "Illustrative educational estimates only; not an offer, commitment, financing quote, or investment advice."].join("\n");
}
function printMode(mode){setTab(mode);window.print();}
function initialize(){
  $("tab-loan").addEventListener("click",()=>setTab("loan"));
  $("tab-refi").addEventListener("click",()=>setTab("refi"));
  for(const id of loanInputs)$(id).addEventListener(id==="loan-io"?"change":"input",updateLoan);
  for(const id of refInputs)$(id).addEventListener("input",updateRef);
  $("loan-csv").addEventListener("click",loanCsv);
  $("loan-print").addEventListener("click",()=>printMode("loan"));
  $("ref-print").addEventListener("click",()=>printMode("refi"));
  $("ref-copy").addEventListener("click",()=>{
    if(!lastRef)return;
    const content=summaryForRef();
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(content).then(()=>setText("ref-insight","Results copied. Verify inputs and assumptions before sharing.")).catch(()=>setText("ref-insight","Clipboard unavailable. Use Print / Save PDF instead."));
    else setText("ref-insight","Clipboard unavailable. Use Print / Save PDF instead.");
  });
  updateLoan();updateRef();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize);else initialize();
})();
