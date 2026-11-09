/* Leva Financing Intelligence Desk v2 — shared underwriting and diagnostic layer.
   Pure calculations; browser-local; no persistence, network or analytics. */
(function(root,factory){
  const api=factory(typeof module==="object"&&module.exports?require("./finance.js"):root.LVFinance);
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.LVDeskCore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(F){
"use strict";
if(!F||typeof F.refinance!=="function"||typeof F.monthlyFactor!=="function")
  throw new Error("Leva finance engine must load before Desk Core.");
const INPUTS=["value","noi","payoff","costs","reserves","rate","amortYears","dscrMin","ltvMax","debtYieldMin"];
const LABELS={value:"Property value",noi:"Annual NOI",payoff:"Existing loan payoff",
  costs:"Closing costs",reserves:"Required reserves",rate:"Interest rate",
  amortYears:"Amortization years",dscrMin:"Minimum DSCR",ltvMax:"Maximum LTV",
  debtYieldMin:"Minimum debt yield"};
const DEFINITIONS={
  value:"Assumed collateral value, not an appraisal.",
  noi:"Annual lender-underwritten net operating income before debt service.",
  payoff:"Expected outstanding loan balance to discharge at refinance.",
  costs:"Estimated transaction and financing expenses at closing.",
  reserves:"Cash reserves required at closing.",
  rate:"Nominal annual loan interest rate; monthly compounding convention.",
  amortYears:"Years over which payments are amortized; this is not loan maturity.",
  dscrMin:"Illustrative minimum annual NOI / annual debt service.",
  ltvMax:"Illustrative maximum senior debt / collateral value.",
  debtYieldMin:"Illustrative minimum annual NOI / senior debt."};
const EPS=1e-7;
function read(input){
  if(!input||typeof input!=="object")throw new Error("Deal assumptions are required.");
  const out={};
  for(const key of INPUTS){
    const raw=input[key];
    if(raw===null||raw===undefined||String(raw).trim()==="")
      throw new Error(LABELS[key]+" is required.");
    const value=Number(raw);
    if(!Number.isFinite(value)||value<0)
      throw new Error(LABELS[key]+" must be a nonnegative finite number.");
    out[key]=value;
  }
  if(out.value<=0||out.amortYears<=0||out.dscrMin<=0||out.debtYieldMin<=0)
    throw new Error("Property value, amortization, DSCR and debt yield must exceed zero.");
  if(out.ltvMax>100||out.debtYieldMin>100)
    throw new Error("LTV and debt yield cannot exceed 100%.");
  if(Math.round(out.amortYears*12)<1||Math.round(out.amortYears*12)>1200)
    throw new Error("Amortization must be between one month and 100 years.");
  return out;
}
function orderedLimits(limits){
  return Object.entries(limits).map(([name,amount])=>({name,amount}))
    .sort((a,b)=>a.amount-b.amount||a.name.localeCompare(b.name));
}
function diagnose(inputs,r,ordered){
  if(r.proceeds<=EPS)return {
    headline:"No supportable senior proceeds under the modeled tests.",
    explanation:"At least one modeled constraint permits no senior loan. Review underwritten NOI, LTV and the selected underwriting thresholds."
  };
  const names=ordered.filter(x=>Math.abs(x.amount-r.proceeds)<=Math.max(.01,r.proceeds*1e-10)).map(x=>x.name);
  if(names.length>1)return{
    headline:names.join(" and ")+" jointly constrain senior proceeds.",
    explanation:"Two or more modeled loan-size ceilings coincide. Changing only one does not raise proceeds while another ceiling remains unchanged."
  };
  const name=names[0]||ordered[0].name;
  const details={
    DSCR:"Annual NOI relative to required debt service is the tightest test. A higher property appraisal alone does not increase proceeds while DSCR binds.",
    LTV:"The selected share of property value is the tightest test. More NOI or a lower rate alone does not increase proceeds while LTV binds.",
    "Debt yield":"Annual NOI divided by minimum required debt yield is the tightest test. An appraisal or lower interest rate alone will not increase proceeds while debt yield binds."
  };
  return{headline:name+" constrains modeled senior proceeds.",explanation:details[name]};
}
function analyze(input){
  const assumptions=read(input);
  const r=F.refinance(assumptions);
  const ranked=orderedLimits(r.limits);
  const tolerance=Math.max(.01,r.proceeds*1e-10);
  const binding=ranked.filter(x=>Math.abs(x.amount-r.proceeds)<=tolerance).map(x=>x.name);
  const next=ranked.find(x=>x.amount>r.proceeds+tolerance)||null;
  const diagnostic=diagnose(assumptions,r,ranked);
  return{
    assumptions,
    proceeds:r.proceeds,
    totalUses:r.required,
    gap:r.gap,
    surplus:r.surplus,
    monthlyPayment:r.monthlyPayment,
    annualDebtService:r.annualDebtService,
    dscr:r.dscr,
    ltv:r.ltv,
    debtYield:r.debtYield,
    rankedLimits:ranked,
    binding,
    nextConstraint:next,
    diagnostic
  };
}
function requirements(input,target){
  const a=read(input);
  const amount=Number(target);
  if(!Number.isFinite(amount)||amount<0)throw new Error("Target loan must be nonnegative.");
  const factor=F.monthlyFactor(a.rate,Math.round(a.amortYears*12));
  const noiForDSCR=amount*12*factor*a.dscrMin;
  const noiForDebtYield=amount*a.debtYieldMin/100;
  return{
    targetLoan:amount,
    minimumNOI:Math.max(noiForDSCR,noiForDebtYield),
    noiForDSCR,
    noiForDebtYield,
    minimumValue:a.ltvMax>0?amount/(a.ltvMax/100):amount===0?0:null,
    impossibleUnderLTV:a.ltvMax===0&&amount>0
  };
}
function valuation(input){
  if(!input||typeof input!=="object")throw new Error("Valuation inputs required.");
  const noi=Number(input.noi),capRate=Number(input.capRate);
  if(!Number.isFinite(noi)||noi<0||!Number.isFinite(capRate)||capRate<=0||capRate>100)
    throw new Error("NOI must be nonnegative and cap rate must be greater than 0% and at most 100%.");
  return{noi,capRate,impliedValue:noi/(capRate/100),method:"NOI / cap rate; not an appraised collateral value"};
}
function compare(input,variants){
  const baseline=read(input);
  if(!Array.isArray(variants)||variants.length>7)
    throw new Error("Supply up to seven alternative scenarios.");
  const names=new Set(["Base"]);
  const rows=[{name:"Base",changes:[],...analyze(baseline)}];
  for(const variant of variants){
    if(!variant||typeof variant.name!=="string"||!variant.name.trim())
      throw new Error("Each scenario needs a name.");
    const name=variant.name.trim();
    if(names.has(name))throw new Error("Scenario names must be unique.");
    names.add(name);
    const overrides=variant.changes||{};
    for(const key of Object.keys(overrides))
      if(!INPUTS.includes(key))throw new Error("Unsupported assumption: "+key);
    const merged=read({...baseline,...overrides});
    const changes=INPUTS.filter(k=>merged[k]!==baseline[k])
      .map(key=>({key,label:LABELS[key],from:baseline[key],to:merged[key]}));
    rows.push({name,changes,...analyze(merged)});
  }
  return rows;
}
return{INPUTS,LABELS,DEFINITIONS,read,analyze,requirements,valuation,compare};
});
