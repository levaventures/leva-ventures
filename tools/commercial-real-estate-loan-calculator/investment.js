/* Leva Financing Intelligence Desk — annual investment return analysis.
   Educational financial model. Annual end-of-period operating flows, monthly loan amortization.
   No network access, persistence, or representations of financing availability. */
(function(root,factory){
  const node=typeof module==="object"&&module.exports;
  const api=factory(node?require("./finance.js"):root.LVFinance,
    node?require("./desk-core.js"):root.LVDeskCore);
  if(node)module.exports=api;
  if(root)root.LVInvestment=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(F,D){
"use strict";
if(!F||!D)throw new Error("Leva shared finance engines must load first.");
const MAX_HOLD=30,EPS=.0000001;
function value(raw,label,min=0,max=Number.MAX_VALUE){
  if(raw===undefined||raw===null||String(raw).trim()==="")
    throw new Error(label+" is required.");
  const x=Number(raw);
  if(!Number.isFinite(x)||x<min||x>max)
    throw new Error(label+" must be between "+min+" and "+max+".");
  return x;
}
function npv(cashflows,annualRatePct){
  const rate=value(annualRatePct,"Discount rate",-99.999,1000000)/100;
  if(!Array.isArray(cashflows)||cashflows.length<2||
    cashflows.some(v=>typeof v!=="number"||!Number.isFinite(v)))
    throw new Error("Provide two or more finite annual cash flows.");
  const discount=1/(1+rate);
  let sum=0;
  for(let i=cashflows.length-1;i>=0;i--)sum=cashflows[i]+discount*sum;
  return sum;
}
function irr(cashflows){
  if(!Array.isArray(cashflows)||cashflows.length<2||
      cashflows.some(v=>typeof v!=="number"||!Number.isFinite(v)))
    throw new Error("Provide at least two finite periodic cash flows.");
  const signs=cashflows.filter(v=>v!==0).map(v=>Math.sign(v));
  if(!signs.includes(-1)||!signs.includes(1))
    return {ratePct:null,rootsPct:[],status:"no-solution"};
  const absSum=cashflows.reduce((s,x)=>s+Math.abs(x),0);
  const tolerance=Math.max(1e-8,absSum*1e-13);
  const f=logDiscount=>{
    const q=Math.exp(-logDiscount);
    let acc=0;
    for(let i=cashflows.length-1;i>=0;i--)acc=cashflows[i]+acc*q;
    return acc;
  };
  const roots=[];
  const add=(logX)=>{
    const rate=(Math.exp(logX)-1)*100;
    if(Number.isFinite(rate)&&!roots.some(x=>Math.abs(x-rate)<1e-5))
      roots.push(rate);
  };
  const lower=-9,upper=12,steps=2200;
  let prevX=lower,prevY=f(prevX);
  for(let i=1;i<=steps;i++){
    const x=lower+(upper-lower)*i/steps;
    const y=f(x);
    if(Math.abs(prevY)<=tolerance)add(prevX);
    if(prevY*y<0){
      let lo=prevX,hi=x,ylo=prevY;
      for(let k=0;k<90;k++){
        const mid=(lo+hi)/2,ymid=f(mid);
        if(Math.abs(ymid)<=tolerance||hi-lo<1e-13){lo=hi=mid;break;}
        if(ylo*ymid<=0)hi=mid;
        else {lo=mid;ylo=ymid;}
      }
      add((lo+hi)/2);
    }
    prevX=x;prevY=y;
  }
  if(Math.abs(prevY)<=tolerance)add(prevX);
  roots.sort((a,b)=>a-b);
  return{ratePct:roots.length===1?roots[0]:null,rootsPct:roots,
    status:roots.length===0?"no-solution":roots.length===1?"unique":"multiple"};
}
function analyze(shared,options){
  const base=D.analyze(shared),a=base.assumptions;
  if(!options||typeof options!=="object")throw new Error("Investment assumptions are required.");
  const purchasePrice=value(options.purchasePrice,"Purchase price",.01);
  const acquisitionCosts=value(options.acquisitionCosts,"Acquisition costs");
  const holdYears=value(options.holdYears,"Hold period",1,MAX_HOLD);
  if(!Number.isInteger(holdYears))throw new Error("Hold period must be a whole number of years.");
  const growthPct=value(options.noiGrowthPct,"Annual NOI growth",-99,100);
  const exitCapPct=value(options.exitCapRatePct,"Exit cap rate",.000001,100);
  const saleCostPct=value(options.saleCostPct,"Exit sale cost",0,100);
  const discountRatePct=value(options.discountRatePct,"NPV discount rate",-99,1000);
  if(!["modeled","custom","none"].includes(options.debtMode))
    throw new Error("Debt mode must be modeled, custom or none.");
  const principal=options.debtMode==="modeled"?base.proceeds:
    options.debtMode==="none"?0:value(options.customPrincipal,"Custom debt principal",0);
  const grossBasis=purchasePrice+acquisitionCosts;
  if(principal>=grossBasis-1e-6)
    throw new Error("Initial acquisition debt must remain below the purchase price plus acquisition costs; zero-equity and cash-out cases are outside this model.");
  const initialEquity=grossBasis-principal;
  const termYears=Math.min(holdYears,a.amortYears);
  const loan=principal>EPS?F.loan({principal,rate:a.rate,amortYears:a.amortYears,termYears,interestOnly:false}):null;
  const schedule=loan?loan.schedule:[];
  const rows=[],cashflows=[-initialEquity];
  let lastDebt=principal;
  for(let year=1;year<=holdYears;year++){
    const noi=a.noi*Math.pow(1+growthPct/100,year-1);
    const from=(year-1)*12,to=year*12;
    const annualPayments=schedule.slice(from,to).reduce((s,m)=>s+m.payment,0);
    const endingDebt=to<=schedule.length?(schedule[to-1]?.remaining??lastDebt):0;
    const operatingCash=noi-annualPayments;
    const isExit=year===holdYears;
    const nextYearNOI=isExit?noi*(1+growthPct/100):null;
    const exitValue=isExit?nextYearNOI/(exitCapPct/100):0;
    const sellingCosts=isExit?exitValue*saleCostPct/100:0;
    const exitNetToEquity=isExit?exitValue-sellingCosts-endingDebt:0;
    const netCash=operatingCash+exitNetToEquity;
    if(![noi,annualPayments,endingDebt,exitValue,sellingCosts,netCash].every(Number.isFinite))
      throw new Error("Calculated cash flows exceed supported numeric range.");
    rows.push({year,noi,annualDebtService:annualPayments,operatingCash,
      endingDebt,exitValue,sellingCosts,exitNetToEquity,netCash});
    cashflows.push(netCash);
    lastDebt=endingDebt;
  }
  const roots=irr(cashflows);
  const contributed=cashflows.reduce((s,x)=>s+Math.max(0,-x),0);
  const distributed=cashflows.reduce((s,x)=>s+Math.max(0,x),0);
  const last=rows.at(-1);
  return{
    assumptions:{purchasePrice,acquisitionCosts,holdYears,growthPct,exitCapPct,saleCostPct,discountRatePct,
      debtMode:options.debtMode,customPrincipal:options.debtMode==="custom"?principal:null},
    shared:a,modeledUnderwriting:base,principal,initialEquity,
    rows,cashflows,
    irr:roots, npv:npv(cashflows,discountRatePct),
    equityMultiple:distributed/contributed,
    contributed,distributed,
    yearOneCashOnCash:rows[0].operatingCash/initialEquity,
    exitValue:last.exitValue,exitSellingCosts:last.sellingCosts,exitDebtPayoff:last.endingDebt,
    netExitEquity:last.exitNetToEquity,
    modelNotes:[
      "Levered annual equity cash flows, before income taxes, asset-level capex beyond modeled NOI, and promote or investor fees.",
      "Year 1 underwritten NOI equals the shared deal NOI. Growth applies annually; exit valuation capitalizes Year "+(holdYears+1)+" NOI.",
      "Senior debt uses monthly amortization from the existing Leva loan engine; payments are summed within each year.",
      "Negative annual cash flow is treated as an additional equity contribution; negative sale equity is treated as an exit capital requirement.",
      "Cash flows occur at year-end. IRR is periodic annual IRR, not XIRR; NPV uses the selected annual discount rate.",
      "The hypothetical loan is not a financing offer. Acquisition price and deal expenses are distinct from assumed collateral value."
    ]
  };
}
return{npv,irr,analyze};
});
