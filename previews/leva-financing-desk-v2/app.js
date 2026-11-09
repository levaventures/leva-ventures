(function(){
"use strict";
const $=id=>document.getElementById(id), D=globalThis.LVDeskCore;
const usd=n=>Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"Not available";
const pct=n=>Number.isFinite(n)?n.toFixed(1)+"%":"Not available";
const defaultValues={value:8000000,noi:520000,payoff:5600000,costs:180000,reserves:0,rate:7.5,amortYears:25,dscrMin:1.25,ltvMax:65,debtYieldMin:9,
  "down-noi":-10,"down-rate":1,"up-noi":10,"up-rate":-.5};
let current=null,active="debt";
const set=(id,value)=>{$(id).textContent=value;};
const el=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
function assumptions(){
  const data={};
  for(const key of D.INPUTS){const node=$(key);if(!node.validity.valid||node.value.trim()==="")throw new Error(D.LABELS[key]+" requires a valid number.");data[key]=node.value;}
  return D.read(data);
}
function scenarioChange(base,prefix){
 const noiPct=Number($(prefix+"-noi").value), rateDelta=Number($(prefix+"-rate").value);
 if(!Number.isFinite(noiPct)||!Number.isFinite(rateDelta)||!$(prefix+"-noi").validity.valid||!$(prefix+"-rate").validity.valid)
  throw new Error("Scenario NOI and rate changes must be valid numbers.");
 const noi=base.noi*(1+noiPct/100),rate=base.rate+rateDelta;
 if(noi<0||rate<0)throw new Error("Scenario assumptions cannot produce negative NOI or interest rates.");
 return{noi,rate};
}
function renderDebt(r){
 set("debt-proceeds",usd(r.proceeds));
 set("binding-note","Binding test: "+(r.binding.join(" + ")||"none"));
 set("debt-headline",r.diagnostic.headline);
 set("debt-explanation",r.diagnostic.explanation);
 set("next-constraint",r.nextConstraint?"Next ceiling: "+r.nextConstraint.name+" at "+usd(r.nextConstraint.amount)+".":"No higher active constraint under these assumptions.");
 const high=Math.max(1,...r.rankedLimits.map(x=>x.amount));
 const tbody=$("limit-table"),bars=$("limit-bars");
 tbody.replaceChildren();bars.replaceChildren();
 for(const test of r.rankedLimits){
  const row=el("tr",""),name=el("th",test.name),value=el("td",usd(test.amount));name.scope="row";
  if(r.binding.includes(test.name)){name.className="is-binding";value.className="is-binding";}
  row.append(name,value);tbody.append(row);
  const visual=el("div","");visual.className="bar-line";
  const label=el("span",test.name),track=el("div","");
  track.className="bar-track";const fill=el("span","");
  fill.className="bar-fill"+(r.binding.includes(test.name)?" binding":"");
  fill.style.width=Math.max(0,100*test.amount/high)+"%";track.append(fill);visual.append(label,track);bars.append(visual);
 }
}
function renderRef(r){
 set("ref-gap",usd(r.gap));
 set("ref-gap-subtitle",r.gap>0?"Additional sources required before closing":"No modeled funding gap");
 set("ref-payoff",usd(r.assumptions.payoff));
 set("ref-costs",usd(r.assumptions.costs+r.assumptions.reserves));
 set("ref-uses",usd(r.totalUses));
 set("ref-proceeds",usd(r.proceeds));
 set("ref-net",r.gap>0?usd(r.gap)+" shortfall":usd(r.surplus)+" surplus");
 const req=D.requirements(r.assumptions,r.totalUses);
 set("req-noi",usd(req.minimumNOI));
 set("req-value",req.impossibleUnderLTV?"Unavailable with 0% LTV":usd(req.minimumValue));
}
function renderScenarios(base){
 const cases=D.compare(base,[
  {name:"Downside",changes:scenarioChange(base,"down")},
  {name:"Upside",changes:scenarioChange(base,"up")}
 ]);
 const tbody=$("scenario-table");tbody.replaceChildren();
 for(const item of cases){
  const tr=el("tr","");for(const text of [item.name,usd(item.proceeds),usd(item.gap),item.binding.join(" + ")||"None"]){
    const td=el("td",text);tr.append(td);
  }tbody.append(tr);
 }
 return cases;
}
function renderReport(r){
 set("report-meta","Desk model 0.1 · "+new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})+" · Illustrative");
 set("report-finding",r.diagnostic.headline+" "+r.diagnostic.explanation);
 set("report-loan",usd(r.proceeds));set("report-uses",usd(r.totalUses));set("report-gap",usd(r.gap));
 const tbody=$("report-inputs");tbody.replaceChildren();
 for(const key of D.INPUTS){
  const tr=el("tr",""),th=el("th",D.LABELS[key]),value=Number(r.assumptions[key]);
  th.scope="row";
  const formatted=["value","noi","payoff","costs","reserves"].includes(key)?usd(value):key==="dscrMin"?value.toFixed(2)+"x":key==="amortYears"?value+" years":pct(value);
  tr.append(th,el("td",formatted));tbody.append(tr);
 }
}
function calculate(){
 try{
  const a=assumptions(),r=D.analyze(a);
  const cases=renderScenarios(a);
  renderDebt(r);renderRef(r);renderReport(r);
  set("context-headline",r.diagnostic.headline);
  set("context-message","Senior capacity "+usd(r.proceeds)+". Closing requirement "+usd(r.totalUses)+". "+(r.gap?"Unfunded amount "+usd(r.gap)+".":"No modeled gap.")+" Downside gap "+usd(cases[1].gap)+".");
  current=r;$("error").hidden=true;$("error").textContent="";
 }catch(error){
  current=null;$("error").textContent=error.message;$("error").hidden=false;
  for(const id of ["debt-proceeds","ref-gap","report-loan","report-gap","debt-headline","context-headline"])
   set(id,"—");
  $("limit-bars").replaceChildren();$("limit-table").replaceChildren();$("scenario-table").replaceChildren();$("report-inputs").replaceChildren();
 }
}
function switchPanel(name){
 if(!["debt","refinance","scenarios","report"].includes(name))return;
 active=name;
 const titles={debt:"Debt Capacity",refinance:"Refinance Intelligence",scenarios:"Scenario Lab",report:"Analysis Report"};
 set("workspace-title",titles[name]);
 for(const btn of document.querySelectorAll(".module")){
  const on=btn.dataset.panel===name;
  btn.classList.toggle("active",on);btn.setAttribute("aria-pressed",String(on));
 }
 for(const n of Object.keys(titles))$("panel-"+n).hidden=n!==name;
}
for(const btn of document.querySelectorAll(".module"))btn.addEventListener("click",()=>switchPanel(btn.dataset.panel));
for(const input of document.querySelectorAll("input"))input.addEventListener("input",calculate);
$("reset").addEventListener("click",()=>{
 for(const [id,val] of Object.entries(defaultValues))$(id).value=val;
 calculate();
});
$("print").addEventListener("click",()=>{if(current)window.print();});
calculate();switchPanel(active);
})();