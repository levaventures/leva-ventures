"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const Report=require("./desk-report.js");
const D=require("./desk-core.js");
const assumptions={value:8000000,noi:520000,payoff:5600000,costs:180000,reserves:0,
 rate:7.5,amortYears:25,dscrMin:1.25,ltvMax:65,debtYieldMin:9};
function options(a=assumptions){
 return{
 loan:{mode:"modeled",termYears:10,interestOnly:false,customPrincipal:1000000},
 capital:{type:"junior-debt",sponsorCash:350000,additionalCapital:500000,annualReturn:12,feePercent:2},
 investment:{purchasePrice:8000000,acquisitionCosts:150000,holdYears:5,noiGrowthPct:2,
   exitCapRatePct:6.5,saleCostPct:2,discountRatePct:10,debtMode:"modeled",customPrincipal:3000000},
 waterfall:{lpContributionPct:90,preferredReturnPct:8,lpResidualPct:70,cumulative:true,compound:false},
 scenarios:[
   {name:"Downside",changes:{noi:a.noi*.9,rate:a.rate+1}},
   {name:"Upside",changes:{noi:a.noi*1.1,rate:Math.max(0,a.rate-.5)}}
 ]
 };
}
function near(a,b,t=.02){assert.ok(Math.abs(a-b)<=t,"Expected "+a+" within "+t+" of "+b);}
test("one valid snapshot uses the exact same eight financial engines",()=>{
 const r=Report.build(assumptions,options());
 assert.equal(r.modelVersion,Report.VERSION);
 near(r.debt.proceeds,4691079.9084,.1);
 near(r.debt.totalUses,5780000);
 near(r.debt.gap,1088920.0916,.1);
 near(r.loan.loan.principal,r.debt.proceeds);
 near(r.capital.plan.uncovered,248920.0916,.1);
 near(r.investment.principal,r.debt.proceeds);
 near(r.investment.irr.ratePct,7.97939742,.001);
 assert.equal(r.waterfall.rows.length,5);
 assert.equal(r.scenarios.length,3);
 assert.equal(r.checks.length,5);
 assert.equal(r.warnings.length,6);
});
test("audit CSV preserves decimals, includes all year and tier rows, and is user-input-only",()=>{
 const r=Report.build(assumptions,options()),csv=Report.asCSV(r),rows=Report.rows(r);
 assert.ok(csv.startsWith("\uFEFF\"Section\",\"Metric\",\"Unrounded numeric value (6 decimals)\""));
 assert.ok(csv.includes('"Refinance","Senior proceeds","4691079.9084'));
 assert.ok(csv.includes('"Investment year 5","Net equity cash"'));
 assert.ok(csv.includes('"Waterfall year 5","LP preferred paid"'));
 assert.ok(csv.includes('"Audit","Model version","2.2-review"'));
 assert.ok(csv.includes('"Limitation","Disclosure"'));
 assert.ok(csv.endsWith("\r\n"));
 assert.ok(rows.length>=110);
 assert.ok(!csv.includes("undefined")&&!csv.includes("NaN"));
});
test("investment/loan counterfactual propagates without cross-writing principal",()=>{
 const a={...assumptions,noi:572000},r=Report.build(a,options(a));
 assert.ok(r.debt.proceeds>4691079.9);
 near(r.investment.principal,r.loan.loan.principal);
 assert.deepEqual(assumptions,{value:8000000,noi:520000,payoff:5600000,costs:180000,reserves:0,
 rate:7.5,amortYears:25,dscrMin:1.25,ltvMax:65,debtYieldMin:9});
});
test("custom hypothetical loan stays clearly separate from modeled underwriting",()=>{
 const opt=options();
 opt.loan.mode="custom";opt.loan.customPrincipal=1000000;
 opt.investment.debtMode="custom";opt.investment.customPrincipal=2000000;
 const r=Report.build(assumptions,opt);
 near(r.loan.loan.principal,1000000);
 near(r.investment.principal,2000000);
 near(r.debt.proceeds,4691079.9084,.1);
 assert.match(r.loan.provenance,/User-provided/);
});
test("zero-underwriting capacity is reported as unavailable without inventing a funded senior loan",()=>{
 const a={...assumptions,noi:0};
 const r=Report.build(a,options(a));
 assert.equal(r.debt.proceeds,0);
 assert.equal(r.loan.available,false);
 assert.equal(r.investment.principal,0);
 assert.ok(!Report.rows(r).some(x=>x[0]==="Loan & balloon"));
});
test("invalid subsection prevents outdated professional report generation",()=>{
 assert.throws(()=>Report.build(assumptions,{}),/complete/);
 const bad=options();bad.capital.feePercent=101;
 assert.throws(()=>Report.build(assumptions,bad),/cannot exceed/);
 const investor=options();investor.investment.exitCapRatePct=0;
 assert.throws(()=>Report.build(assumptions,investor),/Exit cap rate/);
 const pref=options();pref.waterfall.cumulative=false;pref.waterfall.compound=true;
 assert.throws(()=>Report.build(assumptions,pref),/requires/);
});
test("ambiguous IRR is not presented as a unique implied investor return",()=>{
 const r=Report.build(assumptions,options());
 assert.equal(r.investment.irr.status,"unique");
 assert.ok(Report.rows(r).find(x=>x[0]==="Investment"&&x[1]==="Periodic annual IRR"));
});
