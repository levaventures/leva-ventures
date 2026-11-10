/* Leva Desk v2 — narrow adapter to the established and tested loan, refinance,
   strategy and capital stack engines. No duplicated finance formulas, IO or storage. */
(function(root,factory){
  const node=typeof module==="object"&&module.exports;
  const api=factory(node?require("./finance.js"):root.LVFinance,
    node?require("./desk-core.js"):root.LVDeskCore,
    node?require("./strategy.js"):root.LVStrategy,
    node?require("./capital-stack.js"):root.LVCapitalStack);
  if(node)module.exports=api;
  if(root)root.LVDeskBridge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(F,D,S,C){
"use strict";
if(!F||!D||!S||!C)throw new Error("Load all four original finance modules before the Desk Bridge.");
const EPS=0.01;
function finite(value,label,minimum=0){
  if(value===null||value===undefined||String(value).trim()==="")
    throw new Error(label+" is required.");
  const n=Number(value);
  if(!Number.isFinite(n)||n<minimum)
    throw new Error(label+" must be a finite number of at least "+minimum+".");
  return n;
}
function loan(assumptions,config){
  const base=D.analyze(assumptions);
  if(!config||!["modeled","custom"].includes(config.mode))
    throw new Error("Choose modeled or custom loan amount.");
  const principal=config.mode==="modeled"?base.proceeds:finite(config.customPrincipal,"Custom loan principal",0.01);
  const termYears=finite(config.termYears,"Loan term",1/12);
  if(termYears>100)throw new Error("Loan term cannot exceed 100 years.");
  const interestOnly=config.interestOnly===true;
  const provenance=config.mode==="modeled"?"Maximum modeled senior proceeds":"User-provided hypothetical loan amount";
  if(principal<EPS&&config.mode==="modeled")
    return{available:false,reason:"No senior loan is supportable under the current modeled underwriting limits.",provenance,loan:null,snapshots:[]};
  const result=F.loan({principal,rate:base.assumptions.rate,termYears,
    amortYears:base.assumptions.amortYears,interestOnly});
  const snapshots=[{month:0,payment:0,principal:0,interest:0,remaining:result.principal},
    ...result.schedule.filter(x=>x.month%12===0||x.month===result.months)];
  return{available:true,provenance,loan:result,snapshots};
}
function capital(assumptions,config){
  const base=D.analyze(assumptions);
  if(!config||!["junior-debt","preferred-equity"].includes(config.type))
    throw new Error("Choose junior debt or preferred equity.");
  const checked={
    type:config.type,
    sponsorCash:finite(config.sponsorCash,"Sponsor cash"),
    additionalCapital:finite(config.additionalCapital,"Supplemental capital"),
    annualReturn:finite(config.annualReturn,"Supplemental current cash-pay rate"),
    feePercent:finite(config.feePercent,"Upfront supplemental capital fee")
  };
  if(checked.annualReturn>100||checked.feePercent>100)
    throw new Error("Illustrative rates and fees cannot exceed 100%.");
  const plan=S.capitalPlan(base.assumptions,checked);
  const allocation=C.build(plan);
  if(Math.abs(plan.uncovered-allocation.shortage)>EPS||
     Math.abs(plan.surplus-allocation.excess)>EPS ||
     Math.abs(allocation.uses-plan.totalUses)>EPS)
    throw new Error("Sources and uses do not reconcile.");
  const detail=checked.type==="preferred-equity"?
    "Preferred equity is modeled with a hypothetical current-pay preferred distribution, not contractual debt service. This cash-pay burden is not a lender DSCR.":
    "Junior debt is modeled with interest-only cash-pay expense. A senior lender may prohibit or restrict additional indebtedness.";
  return{base,config:checked,plan,allocation,detail};
}
function scheduleCSV(result){
  if(!result||result.available!==true||!result.loan)
    throw new Error("No valid loan schedule is available for export.");
  const lines=[
    "Leva Ventures - Illustrative Monthly Amortization Schedule",
    "Model version,2.1",
    "Loan amount source,"+result.provenance,
    "Loan amount,"+result.loan.principal.toFixed(2),
    "Interest rate (percent),"+result.loan.rate.toFixed(6),
    "Month,Payment,Principal,Interest,Remaining balance",
    ...result.loan.schedule.map(row=>[
      row.month,row.payment.toFixed(2),row.principal.toFixed(2),
      row.interest.toFixed(2),row.remaining.toFixed(2)
    ].join(","))
  ];
  return lines.join("\r\n")+"\r\n";
}
return {loan,capital,scheduleCSV};
});
