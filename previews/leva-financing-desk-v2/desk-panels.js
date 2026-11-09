/* UI adapter for the existing Leva finance, scenario, and capital stack engines. */
(function(root){
"use strict";
const $=id=>document.getElementById(id);
const Bridge=root.LVDeskBridge;
if(!Bridge)throw new Error("Desk Bridge is required.");
const money=v=>Number.isFinite(v)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v):"—";
const percent=v=>Number.isFinite(v)?v.toFixed(1)+"%":"—";
const multiplier=v=>Number.isFinite(v)?v.toFixed(2)+"x":"N/A";
const create=(tag,value)=>{const node=document.createElement(tag);node.textContent=value;return node;};
const numeric=(id,label)=>{
 const e=$(id);
 if(!e||e.value.trim()===""||!e.validity.valid)throw new Error(label+" must be a valid number.");
 const n=Number(e.value);
 if(!Number.isFinite(n))throw new Error(label+" must be finite.");
 return n;
};
let amortPlot=null,lastLoan=null,lastCapital=null,loanRendered=false,capitalRendered=false;
function chartReady(node){
 return node.getBoundingClientRect().width>0&&typeof root.uPlot==="function";
}
function renderLoan(r){
 const cfg={mode:$("loan-mode").value,customPrincipal:$("loan-amount").value,
   termYears:numeric("loan-term","Loan term"),interestOnly:$("loan-io").checked};
 const result=Bridge.loan(r.assumptions,cfg);
 lastLoan=result;
 if(!result.available)throw new Error(result.reason);
 $("loan-error").hidden=true;$("loan-error").textContent="";
 $("loan-provenance").textContent=result.provenance+"; shared rate "+percent(r.assumptions.rate)+
   ", amortization "+r.assumptions.amortYears+" years.";
 const loan=result.loan;
 for(const [id,value] of Object.entries({
   "loan-monthly":loan.monthlyPayment,"loan-balloon":loan.balloon,
   "loan-annual":loan.annualDebtService,"loan-total-interest":loan.interestPaid
 }))$(id).textContent=money(value);
 const table=$("loan-year-table");table.replaceChildren();
 const rows=result.snapshots;
 for(const row of rows){
  const tr=create("tr","");
  tr.append(create("td",String(row.month)),create("td",money(row.remaining)));
  table.append(tr);
 }
 const target=$("amort-chart");
 if(chartReady(target)){
  const width=Math.max(200,Math.round(target.getBoundingClientRect().width));
  const data=[rows.map(s=>s.month/12),rows.map(s=>s.remaining)];
  if(amortPlot){amortPlot.setData(data);if(Math.abs(width-amortPlot.width)>2)amortPlot.setSize({width,height:200});}
  else {
   amortPlot=new uPlot({
     width,height:200,legend:{show:false},cursor:{show:false},scales:{x:{time:false}},
     axes:[
       {stroke:"#b9c6d2",grid:{stroke:"#344252"},ticks:{stroke:"#344252"},values:(u,v)=>v.map(x=>x+"y")},
       {stroke:"#b9c6d2",grid:{stroke:"#344252"},ticks:{stroke:"#344252"},values:(u,v)=>v.map(x=>x>=1e6?(x/1e6).toFixed(1)+"m":(x/1000).toFixed(0)+"k")}
     ],
     series:[{},{label:"Remaining principal",stroke:"#d0a75c",width:3,points:{show:true,size:4}}]
   },data,target);
  }
 }
 loanRendered=true;
}
function renderCapital(r){
 const config={type:$("capital-type").value,
  additionalCapital:numeric("capital-amount","Additional capital"),
  sponsorCash:numeric("capital-sponsor","Sponsor cash"),
  annualReturn:numeric("capital-rate","Cash-pay rate"),
  feePercent:numeric("capital-fee","Capital fee")};
 const result=Bridge.capital(r.assumptions,config);
 lastCapital=result;
 $("capital-error").hidden=true;$("capital-error").textContent="";
 const plan=result.plan,stack=result.allocation;
 for(const [id,value] of Object.entries({
  "capital-uses":plan.totalUses,"capital-sources":plan.totalSources,
  "capital-gap":plan.uncovered,"capital-excess":plan.surplus,
  "capital-fees":plan.additionalFees,"capital-cashpay":plan.annualCashPay,
  "capital-obligations":plan.annualCashObligations
 }))$(id).textContent=money(value);
 $("capital-coverage").textContent=multiplier(plan.combinedCashCoverage);
 $("capital-disclosure").textContent=result.detail;
 const bars=$("capital-stack-bars"),tbody=$("capital-stack-table");
 bars.replaceChildren();tbody.replaceChildren();
 const colors={senior:"#b4a3d4",supplemental:"#e2c27f",sponsor:"#79b8aa",gap:"#b96b6c"};
 for(const segment of stack.segments){
  const tr=create("tr",""),head=create("th",segment.label);head.scope="row";
  tr.append(head,create("td",money(segment.amount)),create("td",money(segment.applied)),create("td",percent(segment.share)));
  tbody.append(tr);
  if(stack.uses>0&&segment.applied>0){
   const bar=create("span","");
   bar.className="stack-segment";
   bar.style.background=colors[segment.id];
   bar.style.width=segment.share+"%";
   bars.append(bar);
  }
 }
 const flags=$("capital-flags");flags.replaceChildren();
 for(const flag of plan.flags)flags.append(create("li",flag));
 capitalRendered=true;
}
function setError(id,message){
 const node=$(id);node.textContent=message;node.hidden=false;
}
function clearLoan(){
 lastLoan=null;
 for(const id of ["loan-monthly","loan-balloon","loan-annual","loan-total-interest","report-loan-payment","report-balloon"])$(id).textContent="—";
 $("loan-year-table").replaceChildren();
 if(amortPlot){amortPlot.destroy();amortPlot=null;}
 $("amort-chart").replaceChildren();
}
function clearCapital(){
 lastCapital=null;
 for(const id of ["capital-uses","capital-sources","capital-gap","capital-excess","capital-fees","capital-cashpay","capital-obligations","capital-coverage","report-stack-gap"])$(id).textContent="—";
 $("capital-stack-bars").replaceChildren();$("capital-stack-table").replaceChildren();$("capital-flags").replaceChildren();
}
function update(r){
 $("loan-custom-group").hidden=$("loan-mode").value!=="custom";
 try{renderLoan(r);$("report-loan-payment").textContent=money(lastLoan.loan.monthlyPayment);
  $("report-balloon").textContent=money(lastLoan.loan.balloon);
 }catch(e){clearLoan();setError("loan-error",e.message);}
 try{renderCapital(r);$("report-stack-gap").textContent=money(lastCapital.plan.uncovered);
 }catch(e){clearCapital();setError("capital-error",e.message);}
}
function setup(){
 $("loan-csv").addEventListener("click",()=>{
  if(!lastLoan||!lastLoan.available){setError("loan-error","A valid loan schedule is required before exporting.");return;}
  const csv=Bridge.scheduleCSV(lastLoan);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  try{
   const a=document.createElement("a");
   a.href=url;a.download="leva-illustrative-amortization.csv";
   document.body.append(a);a.click();a.remove();
  }finally{setTimeout(()=>URL.revokeObjectURL(url),30000);}
 });
 document.querySelectorAll(".module").forEach(btn=>{
  btn.addEventListener("click",()=>{
   if(btn.dataset.panel==="loan"||btn.dataset.panel==="capital"){
     // The panel becomes visible after the existing navigation handler.
     requestAnimationFrame(()=>{
       if(btn.dataset.panel==="loan"&&lastLoan&&amortPlot){
         const width=Math.round($("amort-chart").getBoundingClientRect().width);
         if(width>0)amortPlot.setSize({width,height:200});
       }
       if(btn.dataset.panel==="loan"&&lastLoan&&!amortPlot){
         const base=root.LVDeskCore.analyze(Object.fromEntries(root.LVDeskCore.INPUTS.map(k=>[k,$(k).value])));
         try{renderLoan(base);}catch(e){clearLoan();setError("loan-error",e.message);}
       }
     });
   }
  });
 });
 root.addEventListener("resize",()=>{
  if(amortPlot&&$("amort-chart").getBoundingClientRect().width>0){
    const width=Math.round($("amort-chart").getBoundingClientRect().width);
    if(Math.abs(width-amortPlot.width)>2)amortPlot.setSize({width,height:200});
  }
 });
}
function reset(){
 const defaults={"loan-mode":"modeled","loan-amount":1000000,"loan-term":10,
   "capital-type":"junior-debt","capital-amount":500000,"capital-sponsor":350000,
   "capital-rate":12,"capital-fee":2};
 for(const [id,value] of Object.entries(defaults))$(id).value=value;
 $("loan-io").checked=false;
}
root.LVDeskPanels={setup,update,reset,clear(){clearLoan();clearCapital();}};
})(typeof globalThis!=="undefined"?globalThis:this);
