"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {loan,refinance,monthlyFactor}=require("./finance.js");
function near(actual,expected,tolerance=0.02){
 assert.ok(Math.abs(actual-expected)<tolerance,"Expected "+actual+" to be within "+tolerance+" of "+expected);
}
test("zero-interest amortization produces equal principal payments and no interest",()=>{
 const r=loan({principal:120000,rate:0,termYears:10,amortYears:10,interestOnly:false});
 near(r.monthlyPayment,1000);near(r.balloon,0);near(r.interestPaid,0);
 assert.equal(r.schedule.length,120);
});
test("interest-only loan keeps entire principal due",()=>{
 const r=loan({principal:1000000,rate:6,termYears:5,amortYears:25,interestOnly:true});
 near(r.monthlyPayment,5000);near(r.balloon,1000000);
 near(r.interestPaid,300000);
});
test("10-year commercial loan amortized over 25 years has balloon",()=>{
 const r=loan({principal:2500000,rate:7.5,termYears:10,amortYears:25,interestOnly:false});
 near(r.monthlyPayment,18474.79,0.1);
 assert.ok(r.balloon>0&&r.balloon<2500000);
 near(r.schedule.at(-1).remaining,r.balloon,0.10);
});
test("loan term exceeding amortization is rejected",()=>{
 assert.throws(()=>loan({principal:100000,rate:8,termYears:20,amortYears:10}),/Loan term/);
});
test("refinance proceeds are minimum of DSCR LTV and debt yield constraints",()=>{
 const p={value:5000000,noi:350000,payoff:3400000,costs:75000,reserves:0,rate:8,amortYears:25,dscrMin:1.25,ltvMax:70,debtYieldMin:9};
 const r=refinance(p);
 near(r.limits.LTV,3500000);near(r.limits["Debt yield"],350000/.09);
 assert.equal(r.binding,"DSCR");
 near(r.proceeds,r.limits.DSCR);near(r.gap,3475000-r.proceeds);
});
test("NOI zero implies no underwritten proceeds and full cash requirement",()=>{
 const r=refinance({value:5000000,noi:0,payoff:3400000,costs:75000,reserves:50000,rate:8,amortYears:25,dscrMin:1.25,ltvMax:70,debtYieldMin:9});
 near(r.proceeds,0);near(r.gap,3525000);
});
test("invalid or negative input fails explicitly",()=>{
 assert.throws(()=>refinance({value:-1}),/Property value/);
 assert.throws(()=>loan({principal:100000,rate:-1,termYears:5,amortYears:25}),/Interest rate/);
});
test("monthly factor correctly handles zero interest",()=>{
 near(monthlyFactor(0,120),1/120,.000000001);
});
