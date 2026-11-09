"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const B=require("./desk-bridge.js");
const F=require("./finance.js");
const S=require("./strategy.js");
const C=require("./capital-stack.js");
const base={value:8000000,noi:520000,payoff:5600000,costs:180000,reserves:0,
  rate:7.5,amortYears:25,dscrMin:1.25,ltvMax:65,debtYieldMin:9};
const almost=(x,y,t=.02)=>assert.ok(Math.abs(x-y)<=t, "Expected "+x+" ~ "+y);
test("shared senior proceeds are the default loan principal; balloon matches existing engine",()=>{
 const out=B.loan(base,{mode:"modeled",termYears:10,interestOnly:false});
 assert.equal(out.available,true);
 almost(out.loan.principal,4691079.9084,.1);
 const direct=F.loan({principal:out.loan.principal,rate:7.5,termYears:10,amortYears:25,interestOnly:false});
 almost(out.loan.monthlyPayment,direct.monthlyPayment);
 almost(out.loan.balloon,direct.balloon);
 almost(out.loan.schedule.at(-1).remaining,out.loan.balloon,.02);
 assert.equal(out.snapshots.at(0).month,0);
 assert.equal(out.snapshots.at(-1).month,120);
 assert.equal(out.snapshots.length,11);
});
test("independent loan amortization reconciles interest and principal",()=>{
 const out=B.loan(base,{mode:"custom",customPrincipal:1000000,termYears:5,interestOnly:false});
 const schedule=out.loan.schedule;
 const totalPrincipal=schedule.reduce((s,x)=>s+x.principal,0);
 const totalInterest=schedule.reduce((s,x)=>s+x.interest,0);
 almost(totalPrincipal+out.loan.balloon,1000000,.02);
 almost(totalInterest,out.loan.interestPaid,.02);
 almost(schedule.at(-1).remaining,out.loan.balloon,.02);
});
test("interest-only loan retains full principal due at maturity",()=>{
 const out=B.loan(base,{mode:"custom",customPrincipal:1000000,termYears:5,interestOnly:true});
 almost(out.loan.monthlyPayment,6250);
 almost(out.loan.balloon,1000000);
 almost(out.loan.interestPaid,375000);
 assert.equal(out.loan.schedule.length,60);
});
test("zero modeled loan cannot render a fake zero-principal loan",()=>{
 const out=B.loan({...base,noi:0},{mode:"modeled",termYears:10,interestOnly:false});
 assert.equal(out.available,false);
 assert.equal(out.loan,null);
 assert.equal(out.snapshots.length,0);
});
test("loan option validation rejects negative, blank and unsupported terms",()=>{
 assert.throws(()=>B.loan(base,{mode:"unknown",termYears:10}),/Choose/);
 assert.throws(()=>B.loan(base,{mode:"custom",customPrincipal:"",termYears:10}),/required/);
 assert.throws(()=>B.loan(base,{mode:"custom",customPrincipal:-10,termYears:10}),/at least/);
 assert.throws(()=>B.loan(base,{mode:"modeled",termYears:40,interestOnly:false}),/Loan term cannot exceed amortization/);
});
test("capital plan uses existing strategy and stack with reconciled sources and uses",()=>{
 const config={type:"junior-debt",sponsorCash:350000,additionalCapital:500000,annualReturn:12,feePercent:2};
 const out=B.capital(base,config),existing=S.capitalPlan(base,config),stack=C.build(existing);
 almost(out.plan.totalUses,5790000);
 almost(out.plan.uncovered,out.allocation.shortage);
 almost(out.plan.uncovered,stack.shortage);
 almost(out.plan.seniorLoan,4691079.9084,.1);
 almost(out.plan.annualCashPay,60000);
 almost(out.plan.totalSources+out.plan.uncovered,out.plan.totalUses);
 almost(out.allocation.segments.reduce((s,x)=>s+x.share,0),100,.00001);
 assert.equal(out.allocation.segments.length,4);
 assert.match(out.detail,/additional indebtedness/);
});
test("preferred equity is clearly distinguished from lender debt service",()=>{
 const out=B.capital(base,{type:"preferred-equity",sponsorCash:600000,additionalCapital:500000,annualReturn:10,feePercent:1});
 almost(out.plan.annualCashPay,50000);
 almost(out.plan.totalDebt,out.plan.seniorLoan);
 almost(out.allocation.excess,out.plan.surplus);
 assert.equal(out.allocation.shortage,0);
 assert.match(out.detail,/not a lender DSCR/);
 assert.equal(out.allocation.segments[1].label,"Preferred equity");
});
test("CSV is complete, numeric and matches the loan schedule exactly",()=>{
 const out=B.loan(base,{mode:"custom",customPrincipal:1000000,termYears:1,interestOnly:false});
 const csv=B.scheduleCSV(out);
 const lines=csv.trim().split(/\r\n/);
 assert.equal(lines[5],"Month,Payment,Principal,Interest,Remaining balance");
 assert.equal(lines.length,18);
 assert.equal(lines[6].split(",")[0],"1");
 assert.equal(lines.at(-1).split(",")[0],"12");
 almost(Number(lines.at(-1).split(",")[4]),out.loan.schedule.at(-1).remaining,.01);
 assert.throws(()=>B.scheduleCSV({available:false}),/No valid/);
});
test("invalid capital assumptions never default blank values silently",()=>{
 const cfg={type:"junior-debt",sponsorCash:0,additionalCapital:500000,annualReturn:12,feePercent:2};
 assert.throws(()=>B.capital(base,{...cfg,additionalCapital:""}),/required/);
 assert.throws(()=>B.capital(base,{...cfg,feePercent:101}),/cannot exceed/);
 assert.throws(()=>B.capital(base,{...cfg,type:"mezzanine equity"}),/Choose/);
});
