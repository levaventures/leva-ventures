"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {build}=require("./capital-stack.js");
const sample={totalUses:3481000,seniorLoan:3023172,additionalCapital:300000,sponsorCash:150000,type:"junior-debt"};
function close(a,b,tolerance=.001){assert.ok(Math.abs(a-b)<tolerance,String(a)+" != "+String(b));}
test("Capital-stack gap matches actual financing uses less sources",()=>{
 const s=build(sample);
 close(s.shortage,7828);close(s.modeledSources,3473172);
 close(s.segments.reduce((a,x)=>a+x.applied,0),3481000);
 close(s.segments.reduce((a,x)=>a+x.share,0),100);
 close(s.segments.find(s=>s.id==="gap").applied,7828);
});
test("Sponsor cash increase directly reduces the funding gap",()=>{
 const s=build({...sample,sponsorCash:175000});
 close(s.shortage,0);close(s.excess,17172);
 close(s.segments.reduce((a,x)=>a+x.applied,0),s.uses);
 close(s.segments.find(s=>s.id==="sponsor").amount,175000);
 close(s.segments.find(s=>s.id==="sponsor").applied,157828);
});
test("Senior debt larger than total uses cannot generate 100%+ in bar",()=>{
 const s=build({...sample,totalUses:250000,seniorLoan:1000000});
 close(s.segments[0].applied,250000);close(s.segments[0].share,100);
 close(s.segments[1].applied,0);close(s.segments[2].applied,0);
 close(s.excess,1200000);
});
test("Zero sources yield a full funding gap",()=>{
 const s=build({...sample,seniorLoan:0,additionalCapital:0,sponsorCash:0});
 close(s.shortage,3481000);close(s.segments.at(-1).share,100);
});
test("Zero uses and nonzero sources are handled",()=>{
 const s=build({...sample,totalUses:0});
 close(s.shortage,0);close(s.excess,s.modeledSources);
 close(s.segments.reduce((a,x)=>a+x.share,0),0);
});
test("Preferred equity is explicitly labeled and amounts remain numerical",()=>{
 const s=build({...sample,type:"preferred-equity"});
 assert.equal(s.segments[1].label,"Preferred equity");
 close(s.segments[1].applied,300000);
});
test("Negative funding amount rejected, no misleading allocation",()=>{
 assert.throws(()=>build({...sample,additionalCapital:-100}),RangeError);
 assert.throws(()=>build({...sample,totalUses:NaN}),RangeError);
});
