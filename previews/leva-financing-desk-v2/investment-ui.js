/* Leva Desk investment visualization: deterministic outputs, local-only controls.
   Financial formulas reside exclusively in investment.js and waterfall.js. */
(function(root){
"use strict";
const $=id=>document.getElementById(id),I=root.LVInvestment,W=root.LVWaterfall;
if(!I||!W)throw new Error("Investment and waterfall engines are required.");
const usd=n=>Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"—";
const pct=n=>Number.isFinite(n)?n.toFixed(2)+"%":"—";
const text=(id,v)=>{$(id).textContent=v;};
const node=(tag,t)=>{const e=document.createElement(tag);e.textContent=t;return e;};
let lastInvestment=null,lastWaterfall=null;
function numeric(id,label){
 const e=$(id);
 if(!e||e.value.trim()===""||!e.validity.valid)throw new Error(label+" requires a valid value.");
 const val=Number(e.value);
 if(!Number.isFinite(val))throw new Error(label+" must be finite.");
 return val;
}
function options(){
 return{purchasePrice:numeric("investment-price","Purchase price"),
   acquisitionCosts:numeric("investment-costs","Acquisition costs"),
   holdYears:numeric("investment-hold","Hold period"),
   noiGrowthPct:numeric("investment-growth","NOI growth"),
   exitCapRatePct:numeric("investment-exitcap","Exit cap rate"),
   saleCostPct:numeric("investment-selling","Selling costs"),
   discountRatePct:numeric("investment-discount","NPV discount rate"),
   debtMode:$("investment-debtmode").value,customPrincipal:$("investment-debt").value};
}
function wfConfig(){
 return{lpContributionPct:numeric("waterfall-lpshare","LP contribution"),
   preferredReturnPct:numeric("waterfall-pref","Preferred return"),
   lpResidualPct:numeric("waterfall-residual","Residual share"),
   cumulative:$("waterfall-cumulative").checked,compound:$("waterfall-compound").checked};
}
function showError(id,err){
 const element=$(id);
 element.textContent=err.message;element.hidden=false;
}
function clearInvestment(){
 lastInvestment=null;
 for(const id of ["investment-irr","investment-multiple","investment-equity",
 "investment-npv","investment-senior","investment-exitvalue","investment-exitdebt",
 "investment-exitnet","report-investment-irr","report-investment-multiple"])text(id,"—");
 $("investment-table").replaceChildren();
}
function clearWaterfall(){
 lastWaterfall=null;
 for(const id of ["waterfall-lp","waterfall-gp","waterfall-lpirr",
 "waterfall-unpaid","report-waterfall-lp","report-waterfall-gp"])text(id,"—");
 $("waterfall-table").replaceChildren();
}
function renderInvestment(r){
 const investment=I.analyze(r.assumptions,options());
 lastInvestment=investment;
 text("investment-irr",investment.irr.status==="unique"?pct(investment.irr.ratePct):
   investment.irr.status==="multiple"?"Multiple possible IRRs":"IRR not defined");
 text("investment-multiple",investment.equityMultiple.toFixed(2)+"x");
 text("investment-equity",usd(investment.initialEquity));
 text("investment-npv",usd(investment.npv));
 text("investment-senior",usd(investment.principal));
 text("investment-exitvalue",usd(investment.exitValue));
 text("investment-exitdebt",usd(investment.exitDebtPayoff));
 text("investment-exitnet",usd(investment.netExitEquity));
 text("report-investment-irr",investment.irr.status==="unique"?pct(investment.irr.ratePct):investment.irr.status);
 text("report-investment-multiple",investment.equityMultiple.toFixed(2)+"x");
 text("investment-explanation",investment.modelNotes.join(" "));
 const tbody=$("investment-table");tbody.replaceChildren();
 const initial=node("tr",""),first=node("th","0");first.scope="row";
 initial.append(first,node("td","—"),node("td","—"),node("td","—"),node("td",usd(investment.cashflows[0])));
 tbody.append(initial);
 for(const row of investment.rows){
  const tr=node("tr",""),year=node("th",String(row.year));year.scope="row";
  tr.append(year,node("td",usd(row.noi)),node("td",usd(row.annualDebtService)),
   node("td",usd(row.operatingCash)),node("td",usd(row.netCash)));
  tbody.append(tr);
 }
 $("investment-error").hidden=true;$("investment-error").textContent="";
}
function renderWaterfall(){
 if(!lastInvestment)throw new Error("Correct investment assumptions before calculating the LP/GP waterfall.");
 const result=W.build(lastInvestment,wfConfig());
 lastWaterfall=result;
 text("waterfall-lp",usd(result.totals.distributedLP));
 text("waterfall-gp",usd(result.totals.distributedGP));
 text("waterfall-lpirr",result.totals.lpIRR.status==="unique"?pct(result.totals.lpIRR.ratePct):"Not uniquely defined");
 text("waterfall-unpaid",usd(result.totals.unpaidPreferredReturn));
 text("report-waterfall-lp",usd(result.totals.distributedLP));
 text("report-waterfall-gp",usd(result.totals.distributedGP));
 const tbody=$("waterfall-table");tbody.replaceChildren();
 for(const row of result.rows){
  const tr=node("tr",""),year=node("th",String(row.year));year.scope="row";
  tr.append(year,node("td",usd(row.availableCash)),node("td",usd(row.lpPrefPaid)),
   node("td",usd(row.lpDistribution)),node("td",usd(row.gpDistribution)),
   node("td",usd(row.lpCall+row.gpCall)));
  tbody.append(tr);
 }
 $("waterfall-error").hidden=true;$("waterfall-error").textContent="";
}
function update(r){
 $("investment-debtgroup").hidden=$("investment-debtmode").value!=="custom";
 try{renderInvestment(r);}catch(err){clearInvestment();showError("investment-error",err);}
 try{renderWaterfall();}catch(err){clearWaterfall();showError("waterfall-error",err);}
}
function reset(){
 const defaults={"investment-price":8000000,"investment-costs":150000,"investment-hold":5,
  "investment-growth":2,"investment-exitcap":6.5,"investment-selling":2,
  "investment-discount":10,"investment-debtmode":"modeled","investment-debt":3000000,
  "waterfall-lpshare":90,"waterfall-pref":8,"waterfall-residual":70};
 for(const [id,v] of Object.entries(defaults))$(id).value=v;
 $("waterfall-cumulative").checked=true;$("waterfall-compound").checked=false;
}
root.LVInvestmentUI={update,reset};
})(typeof globalThis!=="undefined"?globalThis:this);
