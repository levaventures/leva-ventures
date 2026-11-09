"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const W=require("./waterfall.js"),I=require("./investment.js");
const shared={value:8000000,noi:520000,payoff:5600000,costs:180000,reserves:0,
 rate:7.5,amortYears:25,dscrMin:1.25,ltvMax:65,debtYieldMin:9};
const assumptions={purchasePrice:8000000,acquisitionCosts:150000,holdYears:5,noiGrowthPct:2,
 exitCapRatePct:6.5,saleCostPct:2,discountRatePct:10,debtMode:"modeled",customPrincipal:0};
const config={lpContributionPct:90,preferredReturnPct:8,lpResidualPct:70,cumulative:true,compound:false};
const near=(a,b,t=.01)=>assert.ok(Math.abs(a-b)<=t,"Expected "+a+" ~ "+b);
function mock(cashflows){return{cashflows};}
test("initial cash allocated to LP/GP and annual cash reconciles",()=>{
 const x=W.build(I.analyze(shared,assumptions),config);
 near(x.totals.contributedLP,3458920.0915781185*.9);
 near(x.totals.contributedGP,3458920.0915781185*.1);
 x.rows.forEach(row=>{
   near(row.lpDistribution+row.gpDistribution,row.availableCash);
   near(row.lpCall+row.gpCall,row.cashDeficit);
 });
 near(x.totals.distributedLP+x.totals.distributedGP,x.totals.totalAvailable);
 assert.equal(x.rows.length,5);
});
test("cumulative preferred return accrues and is carried before capital",()=>{
 const x=W.build(mock([-100,2,2,200]),{...config,lpContributionPct:80,preferredReturnPct:10,lpResidualPct:50});
 near(x.rows[0].periodPreferredReturn,8);
 near(x.rows[0].lpPrefPaid,2);
 near(x.rows[0].unpaidPreferredReturn,6);
 near(x.rows[1].periodPreferredReturn,8);
 near(x.rows[1].unpaidPreferredReturn,12);
 near(x.rows[2].lpPrefPaid,20);
 near(x.rows[2].lpCapitalReturned,80);
 near(x.rows[2].gpCapitalReturned,20);
 near(x.rows[2].lpProfit,40);
 near(x.rows[2].gpProfit,40);
 near(x.rows[2].unpaidPreferredReturn,0);
});
test("compounding applies to cumulative unpaid pref, not fully returned capital",()=>{
 const raw=mock([-100,0,0,200]);
 const simple=W.build(raw,{...config,lpContributionPct:100,preferredReturnPct:10,lpResidualPct:100});
 const compound=W.build(raw,{...config,lpContributionPct:100,preferredReturnPct:10,lpResidualPct:100,compound:true});
 near(simple.rows[2].lpPrefPaid,30);
 near(compound.rows[2].lpPrefPaid,33.1);
 assert.ok(compound.rows[2].lpPrefPaid>simple.rows[2].lpPrefPaid);
});
test("noncumulative preference does not carry unpaid balances",()=>{
 const x=W.build(mock([-100,0,150]),{...config,lpContributionPct:100,preferredReturnPct:10,cumulative:false});
 near(x.rows[0].unpaidPreferredReturn,0);
 near(x.rows[1].lpPrefPaid,10);
 near(x.rows[1].lpCapitalReturned,100);
 near(x.rows[1].lpProfit,40);
});
test("negative operating years generate LP/GP year-end capital calls",()=>{
 const x=W.build(mock([-100,-20,160]),config);
 near(x.rows[0].lpCall,18);
 near(x.rows[0].gpCall,2);
 near(x.totals.totalCalls,20);
 near(x.totals.contributedLP,108);
 near(x.totals.contributedGP,12);
 near(x.totals.distributedLP+x.totals.distributedGP,160);
});
test("cash never exceeds availability and unreturned capital remains if exit fails",()=>{
 const x=W.build(mock([-100,5,5]),config);
 assert.ok(x.totals.unreturnedLP>0);
 assert.ok(x.totals.unreturnedGP>0);
 x.rows.forEach(r=>assert.ok(r.lpDistribution+r.gpDistribution<=r.availableCash+1e-7));
});
test("zero GP ownership is possible without spurious profit allocation",()=>{
 const x=W.build(mock([-100,200]),{...config,lpContributionPct:100,lpResidualPct:100});
 near(x.totals.distributedGP,0);
 near(x.totals.distributedLP,200);
});
test("reject invalid waterfall specifications",()=>{
 assert.throws(()=>W.build(mock([-100,100]),{...config,preferredReturnPct:""}),/required/);
 assert.throws(()=>W.build(mock([-100,100]),{...config,lpContributionPct:101}),/0 and 100/);
 assert.throws(()=>W.build(mock([-100,100]),{...config,cumulative:false,compound:true}),/requires/);
 assert.throws(()=>W.build(mock([100,20]),config),/positive initial/);
});
