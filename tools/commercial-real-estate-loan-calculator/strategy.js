/* Leva Ventures — scenario intelligence built on a deterministic refinance model.
   Scenario assumptions are not offers or recommendations.
   No information is transmitted by this module. */
(function(root,factory){
  const engine=factory(typeof module==="object"&&module.exports?require("./finance.js"):root.LVFinance);
  if(typeof module==="object"&&module.exports)module.exports=engine;
  if(root)root.LVStrategy=engine;
})(typeof globalThis!=="undefined"?globalThis:this,function(F){
"use strict";
if(!F||typeof F.refinance!=="function")throw new Error("Load Leva finance engine first.");
const EPS=.000001;
function amount(value,label){const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error(label+" must be a nonnegative number.");return n;}
function positive(value,label){const n=amount(value,label);if(n<=0)throw new Error(label+" must be positive.");return n;}
function percentage(value,label){const n=amount(value,label);if(n>100)throw new Error(label+" cannot exceed 100%.");return n;}
function scenario(input,changes){return F.refinance(Object.assign({},input,changes||{}));}
function sensitivities(input){
  const basis=scenario(input);
  const shifts=[-20,-10,0,10,20];
  const rateShifts=[-1,-.5,0,.5,1];
  const matrix=shifts.map(noiChange=>rateShifts.map(rateChange=>{
    const rate=Math.max(0,Number(input.rate)+rateChange);
    const noi=Number(input.noi)*(1+noiChange/100);
    const result=scenario(input,{rate,noi});
    return {noiChange,rateChange,rate,noi,gap:result.gap,proceeds:result.proceeds,binding:result.binding};
  }));
  const drivers=[
    {name:"Rate +1.0 pp",changes:{rate:Number(input.rate)+1}},
    {name:"NOI -10%",changes:{noi:Number(input.noi)*.9}},
    {name:"Value -10%",changes:{value:Number(input.value)*.9}},
    {name:"Max LTV -5 pp",changes:{ltvMax:Math.max(0,Number(input.ltvMax)-5)}},
    {name:"Minimum DSCR +0.10x",changes:{dscrMin:Number(input.dscrMin)+.10}}
  ].map(x=>{
    const result=scenario(input,x.changes);
    return {name:x.name,gap:result.gap,increaseInGap:result.gap-basis.gap,binding:result.binding};
  }).sort((a,b)=>b.increaseInGap-a.increaseInGap);
  return {basis,matrix,noiChanges:shifts,rateChanges:rateShifts,drivers};
}
function breakEvenRequirements(input){
  const total=amount(input.payoff,"Payoff")+amount(input.costs,"Costs")+amount(input.reserves,"Reserves");
  const ltv=percentage(input.ltvMax,"LTV")/100;
  const dscr=positive(input.dscrMin,"DSCR");
  const yieldRate=positive(input.debtYieldMin,"Debt yield")/100;
  const months=Math.round(positive(input.amortYears,"Amortization")*12);
  const factor=F.monthlyFactor(input.rate,months);
  const noiForDSCR=total*factor*12*dscr;
  const noiForDebtYield=total*yieldRate;
  return {targetLoan:total,minimumPropertyValue:ltv>0?total/ltv:null,
     minimumNOI:Math.max(noiForDSCR,noiForDebtYield),
     noiForDSCR,noiForDebtYield, additionalSponsorCash:Math.max(0,total-F.refinance(input).proceeds)};
}
function capitalPlan(input,config){
  const result=scenario(input);
  const sponsorCash=amount(config.sponsorCash,"Sponsor cash");
  const additionalCapital=amount(config.additionalCapital,"Additional capital");
  const annualReturn=percentage(config.annualReturn,"Annual financing cost");
  const feePercent=percentage(config.feePercent,"Upfront capital fee");
  const type=config.type||"junior-debt";
  if(!["junior-debt","preferred-equity"].includes(type))throw new Error("Choose junior debt or preferred equity.");
  const additionalFees=additionalCapital*feePercent/100;
  // Junior debt is modeled as interest-only; preferred equity as a hypothetical
  // current-pay preferred distribution. Both require independent term verification.
  const annualCashPay=additionalCapital*annualReturn/100;
  const totalUses=result.required+additionalFees;
  const totalSources=result.proceeds+additionalCapital+sponsorCash;
  const uncovered=Math.max(0,totalUses-totalSources);
  const surplus=Math.max(0,totalSources-totalUses);
  const annualCashObligations=result.annualDebtService+annualCashPay;
  const combinedCashCoverage=annualCashObligations>EPS?result.noi/annualCashObligations:null;
  const totalDebt=result.proceeds+(type==="junior-debt"?additionalCapital:0);
  const combinedLTV=totalDebt/result.value*100;
  const capitalToValue=(result.proceeds+additionalCapital)/result.value*100;
  const flags=[];
  if(uncovered>EPS)flags.push("The scenario remains underfunded after the selected contributions.");
  if(annualCashObligations>result.noi+EPS)flags.push("Modeled annual cash obligations exceed NOI; other cash sources would be necessary.");
  if(type==="junior-debt"&&additionalCapital>0)flags.push("Additional debt can be prohibited by the senior lender or subject to lien and intercreditor restrictions.");
  if(type==="preferred-equity"&&additionalCapital>0)flags.push("Preferred equity rights, distributions and exit priority require legal and transaction-specific review.");
  if(additionalCapital>0)flags.push("No source of additional capital has been identified or confirmed.");
  return {type,sponsorCash,additionalCapital,annualReturn,feePercent,additionalFees,
    totalUses,totalSources,uncovered,surplus,seniorLoan:result.proceeds,
    seniorAnnualDebtService:result.annualDebtService,annualCashPay,annualCashObligations,
    combinedCashCoverage,combinedLTV,capitalToValue,totalDebt,
    capitalDueAtExit:additionalCapital,flags};
}
function compare(input,alternative,planConfig){
  const baseline=scenario(input);
  const altInputs=Object.assign({},input,{
    rate:amount(alternative.rate,"Alternative interest rate"),
    dscrMin:positive(alternative.dscrMin,"Alternative DSCR"),
    ltvMax:percentage(alternative.ltvMax,"Alternative LTV"),
    debtYieldMin:positive(alternative.debtYieldMin,"Alternative debt yield"),
    costs:amount(input.costs,"Costs")+amount(alternative.extraCosts,"Alternative fees"),
    amortYears:positive(alternative.amortYears,"Alternative amortization")
  });
  const alt=scenario(altInputs);
  const layered=capitalPlan(input,planConfig);
  return [
    {name:"Baseline senior loan",proceeds:baseline.proceeds,uncovered:baseline.gap,
      annualCash:baseline.annualDebtService,leverage:baseline.ltv,
      cashCoverage:baseline.dscr,fees:baseline.costs+baseline.reserves,kind:"senior"},
    {name:"Alternative senior assumptions",proceeds:alt.proceeds,uncovered:alt.gap,
      annualCash:alt.annualDebtService,leverage:alt.ltv,
      cashCoverage:alt.dscr,fees:alt.costs+alt.reserves,kind:"senior"},
    {name:"Senior + additional capital",proceeds:layered.seniorLoan+layered.additionalCapital,
      uncovered:layered.uncovered,annualCash:layered.annualCashObligations,
      leverage:layered.capitalToValue,cashCoverage:layered.combinedCashCoverage,
      fees:baseline.costs+baseline.reserves+layered.additionalFees,kind:"layered"}
  ];
}
return {sensitivities,breakEvenRequirements,capitalPlan,compare};
});
