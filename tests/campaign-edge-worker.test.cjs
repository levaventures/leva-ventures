"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const file=pathToFileURL(path.resolve(__dirname,"../campaign-edge/worker.mjs"));
const modPromise=import(file.href);
const routes=["linkedin","sior","cre-news","crej","partners"];
test("GET requests redirect to clean canonical page and write only fixed channel + 1",async()=>{
 const worker=(await modPromise).default;
 for(const channel of routes){
  const events=[];
  const env={CAMPAIGN_COUNTS:{writeDataPoint(payload){events.push(payload)}}};
  const result=await worker.fetch(new Request("https://levaventures.com/go/"+channel+"/?utm_source=chatgpt&noi=550000",{headers:{"Cookie":"private=1","Referer":"https://example.com/private"}}),env);
  assert.equal(result.status,302);
  assert.equal(result.headers.get("Location"),"https://levaventures.com/tools/financing-intelligence/");
  assert.equal(result.headers.get("Cache-Control"),"no-store, max-age=0");
  assert.equal(result.headers.get("Referrer-Policy"),"no-referrer");
  assert.equal(result.headers.get("X-Robots-Tag"),"noindex, nofollow");
  assert.deepEqual(events,[{blobs:[channel],doubles:[1]}]);
 }
});
test("unrecognized paths and HTTP host never count and return 404",async()=>{
 const worker=(await modPromise).default;
 let counts=0;const env={CAMPAIGN_COUNTS:{writeDataPoint(){counts++}}};
 for(const url of ["https://levaventures.com/go/unknown/","https://levaventures.com/tools/financing-intelligence/","https://other.example/go/linkedin/","http://levaventures.com/go/linkedin/"]){
  assert.equal((await worker.fetch(new Request(url),env)).status,404);
 }
 assert.equal(counts,0);
});
test("HEAD and POST are not counted",async()=>{
 const worker=(await modPromise).default;
 let counts=0;const env={CAMPAIGN_COUNTS:{writeDataPoint(){counts++}}};
 for(const method of ["HEAD","POST"]){
  const r=await worker.fetch(new Request("https://levaventures.com/go/sior/",{method}),env);
  assert.equal(r.status,405);
 }
 assert.equal(counts,0);
});
test("redirect remains functional if analytics binding unavailable",async()=>{
 const worker=(await modPromise).default;
 const r=await worker.fetch(new Request("https://levaventures.com/go/partners/"),{});
 assert.equal(r.status,302);
});
