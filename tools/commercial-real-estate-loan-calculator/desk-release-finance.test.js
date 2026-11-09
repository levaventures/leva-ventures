"use strict";
/* Additional independent financial boundary cases for institutional review.
   These are model-contract checks, not transaction or investment certification. */
const assert=require("node:assert/strict");
const {test}=require("node:test");
const D=require("./desk-core.js");
const F=require("./finance.js");
const I=require("./investment.js");
const W=require("./waterfall.js");
const R=require("./desk-report.js");
const a={value:8000000,noi:520000,payoff:5600000,costs:180000,reserves:0,
  rate:7.5,amortYears:25,dscrMin:1.25,ltvMax:65,debtYieldMin:9};
const options=()=>({
  loan:{mode:"modeled",termYears:10,interestOnly:false,customPrincipal:1000000},
  capital:{type:"junior-debt",sponsorCash:350000,additionalCapital:500000,annualReturn:12,feePercent:2},
  investment:{purchasePrice:8000000,acquisitionCosts:150000,holdYears:5,noiGrowthPct:2,
    exitCapRatePct:6.5,saleCostPct:2,discountRatePct:10,debtMode:"modeled",customPrincipal:3000000},
  waterfall:{lpContributionPct:90,preferredReturnPct:8,lpResidualPct:70,cumulative:true,compound:false},
  scenarios:[{name:"Downside",changes:{noi:468000,rate:8.5}},{name:"Upside",changes:{noi:572000,rate:7}}]
});
const near=(actual,expected,tolerance=.02)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,
  "Expected "+actual+" near "+expected+" within "+tolerance);
test("zero closing uses does not force 100% capital allocation in audited report",()=>{
  const noUses={...a,payoff:0,costs:0,reserves:0};
  const r=R.build(noUses,options());
  assert.equal(r.debt.totalUses,0);
  assert.equal(r.capital.allocation.uses,r.capital.plan.additionalFees);
  near(r.capital.allocation.segments.reduce((total,s)=>total+s.share,0),100,.000001);
  const p=options();p.capital.additionalCapital=0;p.capital.sponsorCash=0;p.capital.feePercent=0;
  const z=R.build(noUses,p);
  near(z.capital.plan.totalUses,0);
  near(z.capital.allocation.segments.reduce((total,s)=>total+s.share,0),0);
  near(z.capital.plan.uncovered,0);
  near(z.capital.plan.surplus,z.debt.proceeds);
});
test("fully amortizing zero interest schedule reconciles principal without interest",()=>{
  const loan=F.loan({principal:120000,rate:0,termYears:10,amortYears:10,interestOnly:false});
  near(loan.monthlyPayment,1000);
  near(loan.balloon,0);
  near(loan.schedule.reduce((sum,row)=>sum+row.interest,0),0);
  near(loan.schedule.reduce((sum,row)=>sum+row.principal,0),120000);
});
test("initial equity IRR is undefined when flows never change sign",()=>{
  const r=I.irr([-100,-20,-10]);
  assert.equal(r.status,"no-solution");
  assert.equal(r.ratePct,null);
  near(I.npv([-100,0,121],10),0,.000001);
});
test("two conventional sign-change alternatives have mathematically distinct IRRs",()=>{
  near(I.irr([-100,110]).ratePct,10,.000001);
  const multiple=I.irr([-100,230,-132]);
  assert.equal(multiple.status,"multiple");
  assert.equal(multiple.ratePct,null);
  near(multiple.rootsPct[0],10,.00001);
  near(multiple.rootsPct[1],20,.00001);
});
test("capital waterfall never distributes more cash than investment produces",()=>{
  for(const flows of [[-100,-25,80,60],[-100,0,0,120],[-100,30,0,0]]){
    const allocation=W.build({cashflows:flows},{lpContributionPct:90,preferredReturnPct:8,
      lpResidualPct:70,cumulative:true,compound:false});
    flows.slice(1).forEach((v,i)=>{
      const row=allocation.rows[i];
      near(row.lpDistribution+row.gpDistribution,Math.max(0,v));
      near(row.lpCall+row.gpCall,Math.max(0,-v));
      assert.ok(row.outstandingLPCapital>=0);
      assert.ok(row.outstandingGPCapital>=0);
    });
  }
});
test("changing financing constraint changes modeled senior but not hypothetical specified debt",()=>{
  const r1=D.analyze(a);
  const r2=D.analyze({...a,noi:572000});
  assert.ok(r2.proceeds>r1.proceeds);
  const custom=options();custom.loan.mode="custom";custom.loan.customPrincipal=2000000;
  custom.investment.debtMode="custom";custom.investment.customPrincipal=1500000;
  const x=R.build(a,custom),y=R.build({...a,noi:572000},custom);
  near(x.loan.loan.principal,y.loan.loan.principal);
  near(x.investment.principal,y.investment.principal);
  assert.ok(x.debt.proceeds<y.debt.proceeds);
});
test("negative investment sale equity persists in final cash flow and totals",()=>{
  const p=options();
  p.investment.exitCapRatePct=100;
  p.investment.saleCostPct=10;
  const r=R.build(a,p);
  assert.ok(r.investment.netExitEquity<0);
  near(r.investment.cashflows.at(-1),r.investment.rows.at(-1).operatingCash+r.investment.netExitEquity);
  near(r.waterfall.totals.distributedLP+r.waterfall.totals.distributedGP,
    r.investment.cashflows.slice(1).reduce((sum,v)=>sum+Math.max(0,v),0));
});
