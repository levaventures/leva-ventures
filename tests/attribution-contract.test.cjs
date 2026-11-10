"use strict";
/* No network or live form submissions: source parameters must NOT become hidden fields. */
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const siteJS=fs.readFileSync(path.join(root,"assets/leva-site.js"),"utf8");
function initializedFields(search){
 const fields=[];
 const form={appendChild(x){fields.push({name:x.name,value:x.value})},addEventListener(){},querySelector(){return null}};
 let ready;
 const referral={addEventListener(){},value:""};
 const document={
  addEventListener(type,fn){if(type==="DOMContentLoaded")ready=fn},
  getElementById(id){
   if(id==="contact-form")return form;
   if(id==="referral_source")return referral;
   if(id==="referred_by")return {value:""};
   return null;
  },
  querySelector(){return null},
  createElement(){throw Error("Unexpected hidden attribution field")}
 };
 vm.runInNewContext(siteJS,{document,window:{location:{search}},URLSearchParams,Set,FormData,console});
 assert.equal(typeof ready,"function");
 ready();
 return fields;
}
test("link query strings, even if supplied externally, produce no hidden source fields",()=>{
 for(const search of [
  "",
  "?utm_source=linkedin&utm_campaign=v2",
  "?source=chatgpt",
  "?lv_origin=calculator",
  "?lv_origin=financing_desk_v2&lv_channel=sior",
  "?loan_amount=1000000&noi=90000",
 ])assert.deepEqual(initializedFields(search),[]);
});
test("public V2 and original calculators use direct inquiry links",()=>{
 const v2=fs.readFileSync(path.join(root,"tools/financing-intelligence/index.html"),"utf8");
 const original=fs.readFileSync(path.join(root,"tools/commercial-real-estate-loan-calculator/index.html"),"utf8");
 const article=fs.readFileSync(path.join(root,"insights/dscr-ltv-debt-yield-commercial-loan-sizing/index.html"),"utf8");
 assert.equal((v2.match(/href="\/#contact"/g)||[]).length,2);
 assert.ok((original.match(/href="\/#contact"/g)||[]).length>=2);
 assert.ok(article.includes('href="/#contact"'));
 for(const content of [v2,original,article])assert.doesNotMatch(content,/href="[^"]*\?(?:utm_|lv_origin|source=)/);
});
