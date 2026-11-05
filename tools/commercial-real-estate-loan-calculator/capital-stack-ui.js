/* Leva interactive, screen-reader-readable capital stack. Rendering stays local. */
(function(root,factory){
 const api=factory();
 if(root)root.LVStackUI=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const fmt=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
 const pct=n=>n.toFixed(1)+"%";
 let initialized=false,priorMessage="";
 function row(tag,label,value,id){
   const r=document.createElement("tr");
   if(id)r.dataset.source=id;
   const h=document.createElement("th");h.scope="row";h.textContent=label;
   const d=document.createElement("td");d.textContent=value;
   r.append(h,d);return r;
 }
 function setText(id,text){$(id).textContent=text;}
 function render(plan){
   const data=LVCapitalStack.build(plan);
   const visual=$("capital-stack-visual");
   const detail=$("capital-stack-table").querySelector("tbody");
   visual.replaceChildren();detail.replaceChildren();
   for(const item of data.segments){
     const segment=document.createElement("div");
     segment.className="capital-segment capital-"+item.id;
     segment.style.width=item.share+"%";
     segment.dataset.source=item.id;
     segment.setAttribute("aria-hidden","true");
     segment.title=item.label+": "+fmt(item.applied)+" ("+pct(item.share)+" of modeled uses)";
     visual.append(segment);
   }
   for(const item of data.segments){
     const tr=document.createElement("tr");tr.dataset.source=item.id;
     const th=document.createElement("th");th.scope="row";
     const swatch=document.createElement("span");swatch.className="capital-swatch capital-"+item.id;swatch.setAttribute("aria-hidden","true");
     th.append(swatch,document.createTextNode(item.label));
     const modeled=document.createElement("td");modeled.textContent=fmt(item.amount);
     const applied=document.createElement("td");applied.textContent=fmt(item.applied);
     const share=document.createElement("td");share.textContent=pct(item.share);
     tr.append(th,modeled,applied,share);detail.append(tr);
   }
   const foot=$("capital-stack-table").querySelector("tfoot");
   foot.replaceChildren();
   const total=document.createElement("tr");
   const head=document.createElement("th");head.scope="row";head.textContent="Total funding uses";
   const a=document.createElement("td");a.textContent=fmt(data.modeledSources);
   const b=document.createElement("td");b.textContent=fmt(data.uses);
   const d=document.createElement("td");d.textContent=data.uses>0?"100%":"N/A";
   total.append(head,a,b,d);foot.append(total);
   setText("capital-stack-uses",fmt(data.uses));
   setText("capital-stack-gap",fmt(data.shortage));
   setText("capital-stack-surplus",fmt(data.excess));
   setText("capital-stack-sources",fmt(data.modeledSources));
   setText("capital-stack-note",data.excess>0?
     "Modeled sources exceed funding uses by "+fmt(data.excess)+". The bar shows only the portion allocated to uses; the table shows full modeled contributions. The order is for illustration, not lien or payment priority.":
     "The displayed stack accounts for all funding uses. Each segment represents an illustrative share of funding uses, not confirmed lender or investor capital.");
   const status=data.shortage>0?
     "Modeled funding gap: "+fmt(data.shortage)+". Total modeled uses: "+fmt(data.uses)+".":
     "No modeled funding shortfall. Total modeled uses: "+fmt(data.uses)+". Excess modeled sources: "+fmt(data.excess)+".";
   $("capital-stack-summary").textContent=status;
   // Never speak every keystroke into a screen reader. The dedicated status button
   // and input change announcement provide information on demand or commit.
   priorMessage=status;
   const limit=Math.max(100000,Math.ceil(Math.max(data.uses,plan.sponsorCash,plan.additionalCapital)/100000)*100000);
   for(const [field,amount] of [["cash",plan.sponsorCash],["capital",plan.additionalCapital]]){
     const slider=$("stack-slider-"+field);
     slider.max=String(limit);
     slider.value=String(Math.min(limit,amount));
     slider.setAttribute("aria-valuetext",fmt(amount));
     setText("stack-slider-"+field+"-value",fmt(amount));
   }
 }
 function reset(){
  const ids=["capital-stack-table","capital-stack-visual"];
  $("capital-stack-table").querySelector("tbody").replaceChildren();
  $("capital-stack-table").querySelector("tfoot").replaceChildren();
  $("capital-stack-visual").replaceChildren();
  ["capital-stack-uses","capital-stack-gap","capital-stack-surplus","capital-stack-sources"].forEach(id=>setText(id,"—"));
  setText("capital-stack-summary","Update valid financing inputs to see the calculated capital stack.");
  setText("capital-stack-note","Correct the inputs above to view the capital allocation.");
  priorMessage="";
 }
 function init(){
   if(initialized)return;
   initialized=true;
   const controls=[["cash","st-cash"],["capital","st-capital"]];
   for(const [name,id] of controls){
     $("stack-slider-"+name).addEventListener("input",event=>{
       $(id).value=event.target.value;
       $(id).dispatchEvent(new Event("input",{bubbles:true}));
     });
   }
   $("capital-stack-announce").addEventListener("click",()=>{
      $("capital-stack-live").textContent=priorMessage||"Valid financing values are required to calculate the capital stack.";
   });
 }
 return {render,reset,init};
});