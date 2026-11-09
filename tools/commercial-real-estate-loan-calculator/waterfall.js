/* Leva Financing Intelligence Desk — simplified LP/GP equity waterfall.
   Convention: annual LP pref -> pro-rata return of outstanding contributed capital
   -> split residual profits. Contributions for annual deficits occur at year end.
   Educational only; not a substitute for partnership legal documents. */
(function(root,factory){
  const node=typeof module==="object"&&module.exports;
  const api=factory(node?require("./investment.js"):root.LVInvestment);
  if(node)module.exports=api;
  if(root)root.LVWaterfall=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Investment){
"use strict";
if(!Investment||typeof Investment.irr!=="function")throw new Error("Investment engine must load first.");
const EPS=1e-7;
function pct(raw,label){
 if(raw===null||raw===undefined||String(raw).trim()==="")
  throw new Error(label+" is required.");
 const v=Number(raw);
 if(!Number.isFinite(v)||v<0||v>100)throw new Error(label+" must be between 0 and 100 percent.");
 return v;
}
function build(investment,config){
 if(!investment||!Array.isArray(investment.cashflows))
  throw new Error("Investment annual cash flows must be calculated first.");
 const flows=investment.cashflows;
 if(flows.length<2||flows.length>31||flows.some(x=>typeof x!=="number"||!Number.isFinite(x))
   ||flows[0]>=-EPS)throw new Error("The waterfall requires a positive initial equity contribution and finite annual cash flows.");
 if(!config||typeof config!=="object")throw new Error("Waterfall assumptions are required.");
 const lpShare=pct(config.lpContributionPct,"LP capital share")/100;
 const prefRate=pct(config.preferredReturnPct,"LP preferred return")/100;
 const residualLPShare=pct(config.lpResidualPct,"LP residual profit share")/100;
 const cumulative=config.cumulative===true,compound=config.compound===true;
 if(compound&&!cumulative)throw new Error("Compounding requires a cumulative preferred return.");
 const initial=-flows[0];
 let unreturnedLP=initial*lpShare,unreturnedGP=initial*(1-lpShare),accruedPref=0;
 let contributedLP=unreturnedLP,contributedGP=unreturnedGP;
 let distributedLP=0,distributedGP=0;
 const lpFlows=[-unreturnedLP],gpFlows=[-unreturnedGP];
 const rows=[];
 for(let year=1;year<flows.length;year++){
  const net=flows[year];
  const periodPref=unreturnedLP*prefRate;
  const beforePref=(cumulative?accruedPref*(compound?1+prefRate:1):0)+periodPref;
  let lpPrefPaid=0,lpCapitalReturned=0,gpCapitalReturned=0,
    lpProfit=0,gpProfit=0,lpCall=0,gpCall=0,remaining=net>0?net:0;
  if(remaining>EPS){
   lpPrefPaid=Math.min(remaining,beforePref);
   remaining-=lpPrefPaid;
   const totalOutstanding=unreturnedLP+unreturnedGP;
   const returnCapital=Math.min(remaining,totalOutstanding);
   if(totalOutstanding>EPS&&returnCapital>EPS){
     lpCapitalReturned=returnCapital*(unreturnedLP/totalOutstanding);
     gpCapitalReturned=returnCapital-lpCapitalReturned;
     unreturnedLP=Math.max(0,unreturnedLP-lpCapitalReturned);
     unreturnedGP=Math.max(0,unreturnedGP-gpCapitalReturned);
     remaining=Math.max(0,remaining-returnCapital);
   }
   lpProfit=remaining*residualLPShare;
   gpProfit=remaining-lpProfit;
  }else if(net< -EPS){
   // No annual positive distributions are available; deficit is supplied as new equity at year end.
   lpCall=-net*lpShare;
   gpCall=-net*(1-lpShare);
   unreturnedLP+=lpCall;unreturnedGP+=gpCall;
   contributedLP+=lpCall;contributedGP+=gpCall;
  }
  const lpDistribution=lpPrefPaid+lpCapitalReturned+lpProfit;
  const gpDistribution=gpCapitalReturned+gpProfit;
  distributedLP+=lpDistribution;distributedGP+=gpDistribution;
  accruedPref=cumulative?Math.max(0,beforePref-lpPrefPaid):0;
  const paid=lpDistribution+gpDistribution;
  const capitalCalls=lpCall+gpCall;
  if(Math.abs(paid-Math.max(0,net))>0.005||
     Math.abs(capitalCalls-Math.max(0,-net))>0.005||
     unreturnedLP< -EPS||unreturnedGP< -EPS)
    throw new Error("Waterfall allocation fails cash conservation.");
  rows.push({year,availableCash:Math.max(0,net),cashDeficit:Math.max(0,-net),
    lpPrefPaid,lpCapitalReturned,gpCapitalReturned,lpProfit,gpProfit,
    lpDistribution,gpDistribution,lpCall,gpCall,
    outstandingLPCapital:unreturnedLP,outstandingGPCapital:unreturnedGP,
    unpaidPreferredReturn:accruedPref,periodPreferredReturn:periodPref});
  lpFlows.push(lpDistribution-lpCall);
  gpFlows.push(gpDistribution-gpCall);
 }
 const totalAvailable=flows.slice(1).reduce((s,x)=>s+Math.max(0,x),0);
 const totalCalls=flows.slice(1).reduce((s,x)=>s+Math.max(0,-x),0);
 if(Math.abs(totalAvailable-distributedLP-distributedGP)>0.01||
   Math.abs(contributedLP+contributedGP-initial-totalCalls)>0.01)
   throw new Error("Waterfall totals fail independent transaction reconciliation.");
 return{
  assumptions:{lpContributionPct:lpShare*100,preferredReturnPct:prefRate*100,
    lpResidualPct:residualLPShare*100,cumulative,compound,
    tierOrder:["LP preferred return","Pro-rata return of contributed capital","LP/GP residual profit split"],
    paymentFrequency:"annual, in arrears",deficitPolicy:"capital calls at year-end in original LP/GP contribution proportions"},
  rows,lpFlows,gpFlows,
  totals:{contributedLP,contributedGP,distributedLP,distributedGP,totalAvailable,totalCalls,
    unreturnedLP,unreturnedGP,unpaidPreferredReturn:accruedPref,
    netLP:distributedLP-contributedLP,netGP:distributedGP-contributedGP,
    lpIRR:Investment.irr(lpFlows),gpIRR:Investment.irr(gpFlows)},
  limitations:[
    "This is a simplified project-level, annual, hypothetical LP/GP waterfall, not a legal partnership agreement.",
    "The LP earns a stated preferred return on unreturned LP capital only; GP does not earn the modeled pref.",
    "The LP preferred return is paid before contributed capital is returned; residual profit is split only afterward.",
    "Unpaid annual preferred return carries forward only when cumulative is selected. Compounded cumulative pref accrues on prior unpaid preferred return.",
    "Any negative annual net equity cash flow generates additional capital calls from LP and GP at year-end in their initial capital proportions.",
    "No catch-up, clawback, escrow, IRR hurdle/promote thresholds, tax allocations, or whole-fund vs deal-by-deal waterfall logic is represented.",
    "This model assumes distributions are freely available as annual equity cash and omits reinvestment restrictions, debt covenants and reserves beyond the investment model."
  ]
 };
}
return{build};
});
