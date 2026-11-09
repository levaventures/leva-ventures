/* Leva Ventures — reproducible, local-only financing report snapshot.
   Uses the exact tested engines; no finance formulas are reimplemented by the UI. */
(function(root,factory){
  const node=typeof module==="object"&&module.exports;
  const api=factory(
    node?require("./desk-core.js"):root.LVDeskCore,
    node?require("./desk-bridge.js"):root.LVDeskBridge,
    node?require("./investment.js"):root.LVInvestment,
    node?require("./waterfall.js"):root.LVWaterfall
  );
  if(node)module.exports=api;
  if(root)root.LVDeskReport=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(D,B,I,W){
"use strict";
if(!D||!B||!I||!W)throw new Error("The Leva financial engines must load before the report module.");
const VERSION="2.2-review",CENTS=.011;
function near(actual,expected,label,tolerance=CENTS){
 if(!Number.isFinite(actual)||!Number.isFinite(expected)||Math.abs(actual-expected)>tolerance)
  throw new Error("Financial reconciliation failed: "+label+".");
}
function build(shared,options){
 if(!options||typeof options!=="object"||!options.loan||!options.capital||!options.investment||!options.waterfall||
    !Array.isArray(options.scenarios)||options.scenarios.length!==2)
  throw new Error("All eight workspaces require complete valid assumptions for a consolidated report.");
 const debt=D.analyze(shared);
 const loan=B.loan(debt.assumptions,options.loan);
 const capital=B.capital(debt.assumptions,options.capital);
 const investment=I.analyze(debt.assumptions,options.investment);
 const waterfall=W.build(investment,options.waterfall);
 const scenarios=D.compare(debt.assumptions,options.scenarios);
 const required=debt.totalUses;
 near(required,debt.assumptions.payoff+debt.assumptions.costs+debt.assumptions.reserves,"refinance required uses");
 near(Math.max(0,required-debt.proceeds),debt.gap,"senior funding gap");
 near(capital.plan.totalUses,capital.allocation.uses,"capital closing uses");
 near(capital.plan.uncovered,capital.allocation.shortage,"capital uncovered gap");
 near(capital.plan.surplus,capital.allocation.excess,"capital surplus");
 near(capital.allocation.segments.reduce((sum,x)=>sum+x.share,0),100,"stack percentage totals",.00001);
 if(loan.available&&options.loan.mode==="modeled")
  near(loan.loan.principal,debt.proceeds,"loan modeled principal");
 if(options.investment.debtMode==="modeled")
  near(investment.principal,debt.proceeds,"investment modeled senior debt");
 near(investment.cashflows[0],-investment.initialEquity,"investment initial contribution");
 near(investment.cashflows.reduce((s,x)=>s+Math.max(0,x),0),investment.distributed,"investment distribution totals");
 near(investment.cashflows.reduce((s,x)=>s+Math.max(0,-x),0),investment.contributed,"investment contribution totals");
 for(let j=0;j<investment.rows.length;j++){
  const flow=investment.cashflows[j+1];
  const row=waterfall.rows[j];
  near(row.lpDistribution+row.gpDistribution,Math.max(0,flow),"LP/GP distributions in year "+(j+1));
  near(row.lpCall+row.gpCall,Math.max(0,-flow),"LP/GP capital calls in year "+(j+1));
 }
 near(waterfall.totals.distributedLP+waterfall.totals.distributedGP,waterfall.totals.totalAvailable,
   "total LP GP distributions");
 const warnings=[
  "All values are user-supplied assumptions and deterministic illustrations—not a lender decision or financing commitment.",
  "Refinance capacity and hypothetical acquisition financing are different transaction contexts; modeled debt is not committed capital.",
  "Investment IRR is periodic annual IRR, not date-specific XIRR. It may have multiple roots or no solution.",
  "Income taxes, material capex, lease-up timing and unmodeled transaction expenses are excluded.",
  "The LP/GP waterfall is simplified and is not a legal operating agreement or full promote/catch-up structure.",
  "Capital-stack amounts illustrate uses allocation, not lien, distribution or liquidation priority."
 ];
 const checks=[
  "Refinance funding requirement and loan gap reconcile",
  "Capital-stack sources, uses, shortfall and surplus reconcile",
  "Loan and investment modeled debt tie to the shared underwriting ceiling where selected",
  "Every annual LP/GP distribution and capital call reconciles to the underlying investment cash flow",
  "All generated report fields are derived from the same validated assumptions"
 ];
 return{modelVersion:VERSION,assumptions:{...debt.assumptions},loanSettings:{...options.loan},
   capitalSettings:{...options.capital},investmentSettings:{...options.investment},
   waterfallSettings:{...options.waterfall},
   debt,loan,capital,investment,waterfall,scenarios,warnings,checks};
}
function rawNumber(value){
 if(typeof value!=="number"||!Number.isFinite(value))throw new Error("Report export contains a non-finite number.");
 return value.toFixed(6);
}
function rows(snapshot){
 if(!snapshot||snapshot.modelVersion!==VERSION)throw new Error("A valid consolidated report must be generated first.");
 const out=[],add=(section,metric,n,unit="USD",note="")=>out.push([section,metric,rawNumber(n),unit,note]);
 const a=snapshot.assumptions,d=snapshot.debt,c=snapshot.capital.plan,
  i=snapshot.investment,w=snapshot.waterfall;
 for(const [key,label] of Object.entries(D.LABELS)){
  add("Shared input",label,a[key],["rate","ltvMax","debtYieldMin"].includes(key)?"percent":key==="dscrMin"?"multiple":key==="amortYears"?"years":"USD");
 }
 for(const row of d.rankedLimits)add("Underwriting sizing",row.name+" ceiling",row.amount);
 add("Refinance","Senior proceeds",d.proceeds);add("Refinance","Total uses",d.totalUses);
 add("Refinance","Unfunded gap",d.gap);add("Refinance","Excess senior proceeds",d.surplus);
 for(const s of snapshot.scenarios){
  add("Scenario: "+s.name,"Modeled proceeds",s.proceeds);
  add("Scenario: "+s.name,"Funding gap",s.gap);
 }
 if(snapshot.loan.available){
  const l=snapshot.loan.loan;
  add("Loan & balloon","Principal",l.principal);
  add("Loan & balloon","Monthly payment",l.monthlyPayment);
  add("Loan & balloon","Balloon",l.balloon);
  add("Loan & balloon","Total loan-term interest",l.interestPaid);
  add("Loan & balloon","Term",l.months/12,"years",snapshot.loan.provenance);
 }
 add("Capital structure","Senior loan",c.seniorLoan);
 add("Capital structure","Supplemental capital",c.additionalCapital);
 add("Capital structure","Sponsor contribution",c.sponsorCash);
 add("Capital structure","Upfront supplemental fees",c.additionalFees);
 add("Capital structure","Total modeled sources",c.totalSources);
 add("Capital structure","Total closing uses",c.totalUses);
 add("Capital structure","Remaining gap",c.uncovered);
 add("Capital structure","Excess modeled sources",c.surplus);
 add("Capital structure","Supplemental annual cash-pay",c.annualCashPay);
 add("Investment","Acquisition price",i.assumptions.purchasePrice);
 add("Investment","Acquisition expenses",i.assumptions.acquisitionCosts);
 add("Investment","Loan principal",i.principal);
 add("Investment","Initial equity",i.initialEquity);
 add("Investment","Hold",i.assumptions.holdYears,"years");
 add("Investment","NOI growth",i.assumptions.growthPct,"percent");
 add("Investment","Exit cap",i.assumptions.exitCapPct,"percent");
 add("Investment","Exit sale costs",i.assumptions.saleCostPct,"percent");
 add("Investment","NPV discount",i.assumptions.discountRatePct,"percent");
 add("Investment","NPV",i.npv);
 add("Investment","Equity multiple",i.equityMultiple,"multiple");
 add("Investment","Exit value",i.exitValue);
 add("Investment","Exit debt payoff",i.exitDebtPayoff);
 add("Investment","Net exit equity",i.netExitEquity);
 if(i.irr.status==="unique")add("Investment","Periodic annual IRR",i.irr.ratePct,"percent");
 for(const yr of i.rows){
  const section="Investment year "+yr.year;
  add(section,"NOI",yr.noi);add(section,"Debt service",yr.annualDebtService);
  add(section,"Operating cash",yr.operatingCash);
  add(section,"Net equity cash",yr.netCash);
 }
 add("LP/GP","LP initial and additional contributions",w.totals.contributedLP);
 add("LP/GP","GP initial and additional contributions",w.totals.contributedGP);
 add("LP/GP","LP distributions",w.totals.distributedLP);
 add("LP/GP","GP distributions",w.totals.distributedGP);
 add("LP/GP","Unpaid preferred return",w.totals.unpaidPreferredReturn);
 add("LP/GP","LP pref rate",w.assumptions.preferredReturnPct,"percent");
 add("LP/GP","LP contribution",w.assumptions.lpContributionPct,"percent");
 add("LP/GP","LP residual profit share",w.assumptions.lpResidualPct,"percent");
 if(w.totals.lpIRR.status==="unique")add("LP/GP","LP annual IRR",w.totals.lpIRR.ratePct,"percent");
 if(w.totals.gpIRR.status==="unique")add("LP/GP","GP annual IRR",w.totals.gpIRR.ratePct,"percent");
 for(const yr of w.rows){
  const section="Waterfall year "+yr.year;
  add(section,"Available cash",yr.availableCash);
  add(section,"LP preferred paid",yr.lpPrefPaid);
  add(section,"LP distribution",yr.lpDistribution);
  add(section,"GP distribution",yr.gpDistribution);
  add(section,"LP capital call",yr.lpCall);
  add(section,"GP capital call",yr.gpCall);
  add(section,"Unpaid pref carried",yr.unpaidPreferredReturn);
 }
 return out;
}
function asCSV(snapshot){
 const quote=v=>{
   const str=String(v);
   return '"'+str.replace(/"/g,'""')+'"';
 };
 const lines=[["Section","Metric","Unrounded numeric value (6 decimals)","Unit","Note"]];
 lines.push(...rows(snapshot));
 lines.push(["Audit","Model version",snapshot.modelVersion,"text",""]);
 for(const check of snapshot.checks)lines.push(["Audit","Passed",check,"text",""]);
 for(const warning of snapshot.warnings)lines.push(["Limitation","Disclosure",warning,"text",""]);
 return "\uFEFF"+lines.map(line=>line.map(quote).join(",")).join("\r\n")+"\r\n";
}
return{VERSION,build,rows,asCSV};
});
