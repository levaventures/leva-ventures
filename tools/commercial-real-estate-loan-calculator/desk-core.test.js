"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const D=require("./desk-core.js");
const example={value:8000000,noi:520000,payoff:5600000,costs:180000,reserves:0,
  rate:7.5,amortYears:25,dscrMin:1.25,ltvMax:65,debtYieldMin:9};
const close=(actual,expected,tol=.03)=>assert.ok(Math.abs(actual-expected)<=tol,
  "Expected "+actual+" to be within "+tol+" of "+expected);
test("independent 8m example: three lender ceilings and 1.08892m gap",()=>{
  // Independent reference: amortizing $1 monthly at nominal annual 7.5% / 12.
  const monthly=.075/12,n=300;
  const pvOfOnePayment=(1-Math.pow(1+monthly,-n))/monthly;
  const yearlyBudget=520000/1.25;
  const expectedDSCR=(yearlyBudget/12)*pvOfOnePayment;
  const actual=D.analyze(example);
  close(expectedDSCR,4691079.9084,1);
  close(actual.rankedLimits.find(x=>x.name==="DSCR").amount,expectedDSCR,.03);
  close(actual.rankedLimits.find(x=>x.name==="LTV").amount,5200000);
  close(actual.rankedLimits.find(x=>x.name==="Debt yield").amount,520000/.09,.03);
  close(actual.proceeds,expectedDSCR,.03);
  close(actual.gap,5780000-expectedDSCR,.03);
  assert.deepEqual(actual.binding,["DSCR"]);
  assert.equal(actual.nextConstraint.name,"LTV");
  assert.match(actual.diagnostic.explanation,/appraisal alone does not increase proceeds/);
});
test("10 percent NOI improvement still leaves DSCR below 65 percent LTV ceiling",()=>{
  const upgraded=D.analyze({...example,noi:572000});
  assert.deepEqual(upgraded.binding,["DSCR"]);
  close(upgraded.proceeds,5160187.8993,1);
  assert.ok(upgraded.proceeds<5200000);
});
test("binding transition at the exact DSCR-LTV crossing and beyond",()=>{
  const annualFactor=(.075/12)/(1-Math.pow(1+.075/12,-300))*12;
  const crossing=5200000*annualFactor*1.25;
  const before=D.analyze({...example,noi:crossing-1});
  const at=D.analyze({...example,noi:crossing});
  const after=D.analyze({...example,noi:crossing+1});
  assert.deepEqual(before.binding,["DSCR"]);
  assert.deepEqual(at.binding,["DSCR","LTV"]);
  assert.deepEqual(after.binding,["LTV"]);
  close(after.proceeds,5200000,.03);
});
test("appraisal alone cannot relieve binding DSCR",()=>{
  const baseline=D.analyze(example),raised=D.analyze({...example,value:12000000});
  close(baseline.proceeds,raised.proceeds,.01);
  assert.deepEqual(raised.binding,["DSCR"]);
});
test("required NOI and property value for target proceeds reconcile",()=>{
  const r=D.requirements(example,5780000);
  const higher=D.analyze({...example,value:r.minimumValue,noi:r.minimumNOI});
  close(r.minimumValue,5780000/.65,.02);
  close(r.noiForDebtYield,5780000*.09,.02);
  close(higher.proceeds,5780000,.05);
  close(higher.gap,0,.05);
});
test("zero NOI returns zero senior proceeds and full closing requirement",()=>{
  const r=D.analyze({...example,noi:0});
  assert.equal(r.proceeds,0);
  assert.equal(r.gap,5780000);
  assert.ok(r.binding.includes("DSCR"));
  assert.match(r.diagnostic.headline,/No supportable/);
});
test("zero LTV prevents positive lending even with a strong NOI",()=>{
  const r=D.analyze({...example,ltvMax:0});
  assert.equal(r.proceeds,0);
  assert.equal(r.binding[0],"LTV");
  assert.equal(D.requirements({...example,ltvMax:0},1000).impossibleUnderLTV,true);
});
test("standalone cap value is not mistaken for appraised value",()=>{
  const r=D.valuation({noi:520000,capRate:6.5});
  close(r.impliedValue,8000000,.01);
  assert.match(r.method,/not an appraised/);
});
test("three scenario outputs share engine and carry explicit change audit",()=>{
  const before={...example};
  const rows=D.compare(example,[
    {name:"Downside",changes:{noi:468000,rate:8.5}},
    {name:"Upside",changes:{noi:572000,rate:7}}
  ]);
  assert.equal(rows.length,3);
  assert.equal(rows[0].name,"Base");
  assert.equal(rows[1].changes.length,2);
  assert.equal(rows[2].changes.length,2);
  assert.ok(rows[1].proceeds<rows[0].proceeds);
  assert.ok(rows[2].proceeds>rows[0].proceeds);
  assert.deepEqual(example,before);
});
test("input validation and unsupported changes fail instead of hiding error",()=>{
  assert.throws(()=>D.analyze({...example,noi:""}),/required/);
  assert.throws(()=>D.analyze({...example,value:-1}),/nonnegative/);
  assert.throws(()=>D.analyze({...example,rate:NaN}),/finite/);
  assert.throws(()=>D.analyze({...example,ltvMax:101}),/100/);
  assert.throws(()=>D.valuation({noi:20,capRate:0}),/cap rate/);
  assert.throws(()=>D.compare(example,[{name:"Bad",changes:{assetAddress:"private"}}]),/Unsupported assumption/);
  assert.throws(()=>D.compare(example,[{name:"Base",changes:{noi:20}}]),/unique/);
});
