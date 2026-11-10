"use strict";
/* No live form submissions or personal information: in-memory attribution tests. */
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const siteJS=fs.readFileSync(path.join(root,"assets/leva-site.js"),"utf8");
const campaignJS=fs.readFileSync(path.join(root,"tools/financing-intelligence/campaign-links.js"),"utf8");
function formLabels(search){
 const fields=[];
 const form={
  appendChild(x){fields.push([x.name,x.value])},
  addEventListener(){},
  querySelector(){return null}
 };
 const source={addEventListener(){}};
 let domReady=null;
 const document={
  addEventListener(type,fn){if(type==="DOMContentLoaded")domReady=fn},
  getElementById(id){if(id==="contact-form")return form;if(id==="referral_source")return source;if(id==="referred_by")return {value:""};return null},
  querySelector(){return null},
  createElement(){return {type:"",name:"",value:""}}
 };
 const context={document,window:{location:{search}},URLSearchParams,Set,FormData,console};
 vm.runInNewContext(siteJS,context);
 assert.equal(typeof domReady,"function");
 domReady();
 return Object.fromEntries(fields);
}
function campaignHref(search){
 const links=[{value:"/?lv_origin=financing_desk_v2#contact",setAttribute(key,value){assert.equal(key,"href");this.value=value}}];
 const document={querySelectorAll(selector){assert.equal(selector,'a[href="/?lv_origin=financing_desk_v2#contact"]');return links}};
 vm.runInNewContext(campaignJS,{document,window:{location:{search}},URLSearchParams,Object});
 return links[0].value;
}
test("original calculator fixed source retained",()=>{
 assert.deepEqual(formLabels("?lv_origin=calculator"),{lead_origin:"calculator"});
});
test("V2 source and a known distribution channel are attributed only on contact form",()=>{
 assert.deepEqual(formLabels("?lv_origin=financing_desk_v2&lv_channel=linkedin"),{lead_origin:"financing_desk_v2",lead_channel:"linkedin"});
 assert.equal(campaignHref("?utm_source=linkedin&utm_medium=organic_social&utm_campaign=v2"),"/?lv_origin=financing_desk_v2&lv_channel=linkedin#contact");
});
test("unknown query values never reach form fields",()=>{
 assert.deepEqual(formLabels("?lv_origin=unknown&lv_channel=linkedin&loan_amount=9000000"),{});
 assert.deepEqual(formLabels("?lv_origin=financing_desk_v2&lv_channel=someone%40example.com&noi=700000"),{lead_origin:"financing_desk_v2"});
 assert.equal(campaignHref("?utm_source=%3Cscript%3E&loan_amount=9000000"),"/?lv_origin=financing_desk_v2#contact");
});
test("channel is never attached without an approved source",()=>{
 assert.deepEqual(formLabels("?lv_channel=linkedin"),{});
});
test("known publications get only fixed code labels; no input propagation",()=>{
 for(const channel of ["sior","cre_news_today","crej","partner_newsletter","industry_referral","organic_search"]){
  assert.equal(campaignHref("?utm_source="+channel+"&rate=17&payoff=6000000"),"/?lv_origin=financing_desk_v2&lv_channel="+channel+"#contact");
 }
});
