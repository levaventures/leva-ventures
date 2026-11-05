/* Model for Leva's capital-stack visualization.
   Amounts are illustrative and do not represent committed or available capital.
   Segments are allocated in display order only, not lien or repayment priority. */
(function(root,factory){
  const model=factory();
  if(typeof module==="object"&&module.exports)module.exports=model;
  if(root)root.LVCapitalStack=model;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 function nonnegative(value,label){
   const n=Number(value);
   if(!Number.isFinite(n)||n<0)throw new RangeError(label+" must be a nonnegative amount.");
   return n;
 }
 function build(plan){
   const uses=nonnegative(plan.totalUses,"Total uses");
   const sources=[
     {id:"senior",label:"Senior debt",amount:nonnegative(plan.seniorLoan,"Senior debt")},
     {id:"supplemental",label:plan.type==="preferred-equity"?"Preferred equity":"Junior debt",amount:nonnegative(plan.additionalCapital,"Supplemental capital")},
     {id:"sponsor",label:"Sponsor cash",amount:nonnegative(plan.sponsorCash,"Sponsor cash")}
   ];
   const sum=sources.reduce((acc,item)=>acc+item.amount,0);
   let remaining=uses;
   const segments=sources.map(source=>{
      const applied=Math.max(0,Math.min(source.amount,remaining));
      remaining=Math.max(0,remaining-applied);
      return {...source,applied,share:uses>0?100*applied/uses:0};
   });
   const shortage=Math.max(0,remaining);
   const excess=Math.max(0,sum-uses);
   segments.push({id:"gap",label:"Unfunded gap",amount:shortage,applied:shortage,share:uses>0?100*shortage/uses:0});
   const percentSum=segments.reduce((a,s)=>a+s.share,0);
   if(uses>0&&Math.abs(percentSum-100)>0.00001)throw new Error("Capital stack allocation must equal 100% of total uses.");
   return {uses,modeledSources:sum,shortage,excess,segments};
 }
 return {build};
});