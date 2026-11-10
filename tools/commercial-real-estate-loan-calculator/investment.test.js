"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const I=require("./investment.js");
const F=require("./finance.js");
const shared={value:8000000,noi:520000,payoff:5600000,costs:180000,reserves:0,
 rate:7.5,amortYears:25,dscrMin:1.25,ltvMax:65,debtYieldMin:9};
const options={purchasePrice:8000000,acquisitionCosts:150000,holdYears:5,noiGrowthPct:2,
 exitCapRatePct:6.5,saleCostPct:2,discountRatePct:10,debtMode:"modeled",customPrincipal:0};
const near=(a,b,t=.02)=>assert.ok(Math.abs(a-b)<=t,"Expected "+a+" ~ "+b+" (+/- "+t+")");
test("periodic annual IRR: textbook 10% one year",()=>near(I.irr([-100,110]).ratePct,10,.0000001));
test("periodic IRR: multiple valid roots not disguised as unique",()=>{
 const r=I.irr([-100,230,-132]);
 assert.equal(r.status,"multiple"); assert.equal(r.ratePct,null);
 near(r.rootsPct[0],10,1e-6);near(r.rootsPct[1],20,1e-6);
});
test("no defined IRR for all-positive or all-negative cash flows",()=>{
 assert.equal(I.irr([-100,-5,-10]).status,"no-solution");
 assert.equal(I.irr([10,20,30]).ratePct,null);
 assert.throws(()=>I.irr([1,Infinity]),/finite/);
});
test("NPV is discounted by end-of-year periods",()=>{
 near(I.npv([-100,110],10),0,1e-8);
 near(I.npv([-100,0,121],10),0,1e-8);
});
test("independent monthly amortization and five-year exit reconciliation",()=>{
 const result=I.analyze(shared,options);
 const principal=520000/1.25/12*((1-(1+.075/12)**-300)/(.075/12));
 near(result.principal,principal,.01);
 near(result.initialEquity,8150000-principal,.01);
 near(result.rows[0].annualDebtService,416000,.02);
 near(result.rows[0].operatingCash,104000,.02);
 const payment=principal*(.075/12)/(1-(1+.075/12)**-300);
 const balance=principal*Math.pow(1+.075/12,60)-payment*(Math.pow(1+.075/12,60)-1)/(.075/12);
 near(result.exitDebtPayoff,balance,.02);
 near(result.exitValue,520000*Math.pow(1.02,5)/.065,.01);
 near(result.netExitEquity,result.exitValue*.98-balance,.02);
 near(result.irr.ratePct,7.97939742293,.0001);
 near(result.npv,-289231.94237,.03);
 near(result.equityMultiple,1.439422430514,.000001);
 assert.equal(result.rows.length,5);
});
test("exit value reflects forward NOI and exit cap independently",()=>{
 const r=I.analyze(shared,{...options,debtMode:"none",holdYears:3,noiGrowthPct:0});
 near(r.exitValue,520000/.065,.02);
 assert.equal(r.exitDebtPayoff,0);
 near(r.yearOneCashOnCash,520000/8150000,.000001);
});
test("negative exit net equity recognized as capital requirement, not rounded away",()=>{
 const r=I.analyze(shared,{...options,exitCapRatePct:100,saleCostPct:5});
 assert.ok(r.netExitEquity<0);
 near(r.cashflows[5],r.rows[4].operatingCash+r.netExitEquity,.02);
 assert.ok(r.contributed>r.initialEquity);
 assert.ok(r.equityMultiple>=0);
});
test("shared NOI and rate changes propagate correctly; source assumptions unmodified",()=>{
 const a={...shared},r1=I.analyze(shared,options),
 r2=I.analyze({...shared,noi:572000},options);
 assert.ok(r2.principal>r1.principal);
 assert.ok(r2.rows[0].noi>r1.rows[0].noi);
 assert.deepEqual(shared,a);
});
test("reject unrealistic or unsupported financial terms without silent defaults",()=>{
 assert.throws(()=>I.analyze(shared,{...options,exitCapRatePct:0}),/Exit cap rate/);
 assert.throws(()=>I.analyze(shared,{...options,holdYears:0}),/Hold period/);
 assert.throws(()=>I.analyze(shared,{...options,holdYears:3.5}),/whole number/);
 assert.throws(()=>I.analyze(shared,{...options,debtMode:"custom",customPrincipal:9000000}),/below the purchase/);
 assert.throws(()=>I.analyze(shared,{...options,debtMode:"custom",customPrincipal:""}),/required/);
 assert.throws(()=>I.npv([1,2],-100),/Discount rate/);
});
