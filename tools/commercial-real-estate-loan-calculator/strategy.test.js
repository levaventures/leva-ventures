"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const S=require("./strategy.js");
const baseline={value:5000000,noi:350000,payoff:3400000,costs:75000,reserves:0,rate:8,amortYears:25,dscrMin:1.25,ltvMax:70,debtYieldMin:9};
const plan={sponsorCash:150000,additionalCapital:300000,annualReturn:12,feePercent:2,type:"junior-debt"};
const alt={rate:10,amortYears:25,dscrMin:1.2,ltvMax:72,debtYieldMin:8.5,extraCosts:45000};
const near=(v,x,t=.02)=>assert.ok(Math.abs(v-x)<t,v+" not within "+t+" of "+x);
test("capital plan correctly nets new fees, sources, cash gap",()=>{
 const p=S.capitalPlan(baseline,plan);
 near(p.additionalFees,6000); near(p.totalUses,3481000);
 near(p.totalSources,p.seniorLoan+450000);
 near(p.uncovered,Math.max(0,p.totalUses-p.totalSources));
 near(p.annualCashPay,36000);
 assert.ok(p.combinedCashCoverage>0);
 assert.equal(p.type,"junior-debt");
});
test("adding sponsor cash reduces remaining gap by exact amount",()=>{
 const noCash=S.capitalPlan(baseline,{...plan,sponsorCash:0});
 const withCash=S.capitalPlan(baseline,{...plan,sponsorCash:50000});
 near(noCash.uncovered-withCash.uncovered,50000);
});
test("increasing extra capital raises fees and its cash-pay burden",()=>{
 const p=S.capitalPlan(baseline,{...plan,additionalCapital:500000});
 near(p.additionalFees,10000);
 near(p.annualCashPay,60000);
});
test("preferred equity is excluded from debt LTV but included in capital to value",()=>{
 const p=S.capitalPlan(baseline,{...plan,type:"preferred-equity"});
 near(p.totalDebt,p.seniorLoan);
 assert.ok(p.capitalToValue>p.combinedLTV);
 assert.ok(p.flags.some(x=>x.includes("Preferred equity")));
});
test("NOI sensitivity is monotonic with proceeds while rate increase worsens DSCR proceeds",()=>{
 const {basis,matrix,drivers}=S.sensitivities(baseline);
 assert.equal(matrix.length,5);assert.equal(matrix[0].length,5);
 assert.ok(matrix[0][2].proceeds<=basis.proceeds+1);
 assert.ok(matrix[4][2].proceeds>=basis.proceeds-1);
 assert.ok(matrix[2][4].proceeds<=matrix[2][0].proceeds+1);
 near(matrix[2][2].gap,basis.gap);
 assert.ok(drivers.every(x=>x.increaseInGap>=-.01));
});
test("break even requirement is constrained by both dscr and debt yield",()=>{
 const b=S.breakEvenRequirements(baseline);
 near(b.targetLoan,3475000);
 near(b.minimumPropertyValue,3475000/.7);
 near(b.minimumNOI,Math.max(b.noiForDebtYield,b.noiForDSCR));
 assert.ok(b.additionalSponsorCash>0);
});
test("comparison returns three distinct, reproducible cases",()=>{
 const c=S.compare(baseline,alt,plan);
 assert.deepEqual(c.map(x=>x.kind),["senior","senior","layered"]);
 near(c[0].fees,75000);
 near(c[1].fees,120000);
 near(c[2].fees,81000);
 assert.ok(c[1].uncovered>=0);
});
test("invalid hypothetical capital assumptions are rejected",()=>{
 assert.throws(()=>S.capitalPlan(baseline,{...plan,feePercent:150}),/100/);
 assert.throws(()=>S.capitalPlan(baseline,{...plan,additionalCapital:-100}),/nonnegative/);
 assert.throws(()=>S.compare(baseline,{...alt,ltvMax:120},plan),/100/);
});
