"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {speakMoney,numberWords,roundDisplayedDollars}=require("./spoken-amounts.js");
const cases=[
 [0,"zero dollars"],[1,"one dollar"],[2,"two dollars"],[19,"nineteen dollars"],
 [20,"twenty dollars"],[21,"twenty-one dollars"],[100,"one hundred dollars"],
 [101,"one hundred one dollars"],[1000,"one thousand dollars"],
 [1001,"one thousand one dollars"],[1010,"one thousand ten dollars"],
 [1100,"one thousand one hundred dollars"],
 [1000000,"one million dollars"],[1000010,"one million ten dollars"],
 [1001001,"one million one thousand one dollars"],
 [1011011,"one million eleven thousand eleven dollars"],
 [2500000,"two million five hundred thousand dollars"],
 [3475000,"three million four hundred seventy-five thousand dollars"],
 [451828,"four hundred fifty-one thousand eight hundred twenty-eight dollars"],
 [18474.79,"eighteen thousand four hundred seventy-five dollars"],
 [1999.49,"one thousand nine hundred ninety-nine dollars"],
 [1999.5,"two thousand dollars"],[0.49,"zero dollars"],[0.5,"one dollar"],
 [1000000000,"one billion dollars"],[1200340567,"one billion two hundred million three hundred forty thousand five hundred sixty-seven dollars"],
];
for(const [v,expected] of cases){
 test("exact spoken currency amount: "+v,()=>{
  assert.equal(speakMoney(v),expected);
  const displayed=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v);
  assert.equal(Number(displayed.replace(/[^0-9]/g,"")),roundDisplayedDollars(v));
 });
}
test("Narration rejects invalid amounts rather than fabricating financial values",()=>{
 for(const x of [NaN,Infinity,-Infinity,-1,Number.MAX_SAFE_INTEGER+10]){
   assert.throws(()=>speakMoney(x),RangeError);
 }
});
test("All word fragments for 0 through 100000 avoid scale approximations",()=>{
 for(let n=0;n<=100000;n++){
  const words=speakMoney(n);
  assert.ok(words.includes("dollar"),"Missing currency unit for "+n);
  assert.ok(!/million dollars$/.test(words)&&n<1000000);
  assert.equal(roundDisplayedDollars(n),n);
 }
});
test("Word representation uses explicit digits for non-rounded amounts",()=>{
 assert.equal(numberWords(3023172),"three million twenty-three thousand one hundred seventy-two");
});
