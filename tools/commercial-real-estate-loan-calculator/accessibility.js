/* Accessibility enhancements for Leva commercial financing calculators.
   Uses WAI-ARIA tabs keyboard pattern, explicit validation states, and
   on-demand result announcements to avoid screen-reader chatter during input. */
(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const inputs=[
 "loan-principal","loan-rate","loan-term","loan-amort",
 "ref-value","ref-noi","ref-payoff","ref-costs","ref-reserves","ref-rate","ref-amort","ref-dscr","ref-ltv","ref-yield",
 "st-cash","st-capital","st-return","st-fee","alt-rate","alt-amort","alt-dscr","alt-ltv","alt-yield","alt-fees"
 ];
 const moneyText=id=>$(id).textContent;
 function status(text){$("accessible-status").textContent=text;}
 function updateValidity(){
  for(const id of inputs){
    const input=$(id);
    const invalid=!input.checkValidity()||input.value.trim()===""||!Number.isFinite(Number(input.value));
    if(invalid)input.setAttribute("aria-invalid","true");
    else input.removeAttribute("aria-invalid");
  }
 }
 function initTabs(){
  const tabs=[$("tab-loan"),$("tab-refi")];
  function sync(){
    for(const tab of tabs)tab.tabIndex=tab.getAttribute("aria-selected")==="true"?0:-1;
  }
  tabs.forEach((tab,i)=>tab.addEventListener("keydown",e=>{
    if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){
      e.preventDefault();
      const next=e.key==="Home"?0:e.key==="End"?tabs.length-1:
         (i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
      tabs[next].click();tabs[next].focus();sync();
      status(tabs[next].textContent+" selected.");
    }
  }));
  tabs.forEach(tab=>tab.addEventListener("click",()=>{
    sync();
    const isRef=tab.id==="tab-refi";
    status(isRef?"Refinance Intelligence selected. Review estimated proceeds, funding gap and capital structure scenarios.":
      "Commercial Loan Calculator selected. Review payments, interest and balloon amounts.");
  }));
  sync();
 }
 function announceResults(){
   const isRef=$("tab-refi").getAttribute("aria-selected")==="true";
   if(isRef){
     if($("ref-error").textContent){status("Invalid refinance inputs. "+$("ref-error").textContent);return;}
     status("Refinance results: modeled proceeds "+moneyText("ref-proceeds")+", funds required "+
     moneyText("ref-required")+", shortfall "+moneyText("ref-gap")+".");
   }else{
     if($("loan-error").textContent){status("Invalid loan inputs. "+$("loan-error").textContent);return;}
     status("Commercial loan results: monthly payment "+moneyText("loan-payment")+
     ", annual debt service "+moneyText("loan-annual")+
     ", maturity balloon "+moneyText("loan-balloon")+".");
   }
 }
 function init(){
   initTabs();
   for(const id of inputs){
     $(id).addEventListener("input",updateValidity);
     $(id).addEventListener("change",()=>{updateValidity();});
   }
   $("loan-io").addEventListener("change",()=>{});
   $("accessible-announce").addEventListener("click",announceResults);
   updateValidity();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();