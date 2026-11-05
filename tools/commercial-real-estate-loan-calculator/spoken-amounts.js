/* Leva Ventures: lossless words for the exact whole-dollar amounts shown in the UI.
   Screen dollar figures use Intl maximumFractionDigits:0. This module uses the
   same nearest-dollar rounding; it never shortens values to "thousand"/"million". */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.LVSpokenAmounts=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const ones=["zero","one","two","three","four","five","six","seven","eight","nine","ten",
              "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  const scales=["","thousand","million","billion","trillion","quadrillion"];
  function underThousand(n){
    const parts=[];
    if(n>=100){parts.push(ones[Math.floor(n/100)]+" hundred");n%=100;}
    if(n>=20){const t=tens[Math.floor(n/10)];const remainder=n%10;parts.push(remainder?t+"-"+ones[remainder]:t);}
    else if(n>0)parts.push(ones[n]);
    return parts.join(" ");
  }
  function numberWords(n){
    if(!Number.isSafeInteger(n)||n<0)throw new RangeError("The amount is outside the accurate narration range.");
    if(n===0)return "zero";
    const parts=[];
    let scale=0;
    while(n>0){
      const group=n%1000;
      if(group)parts.unshift(underThousand(group)+(scales[scale]?" "+scales[scale]:""));
      n=Math.floor(n/1000);
      scale++;
    }
    return parts.join(" ");
  }
  function roundDisplayedDollars(value){
    if(!Number.isFinite(value)||value<0||value>Number.MAX_SAFE_INTEGER)throw new RangeError("The amount cannot be narrated accurately.");
    // These are the whole-dollar values rendered by the calculator's USD formatter.
    const rounded=Math.round(value);
    if(!Number.isSafeInteger(rounded))throw new RangeError("The amount cannot be narrated accurately.");
    return rounded;
  }
  function speakMoney(value){
    const whole=roundDisplayedDollars(value);
    return numberWords(whole)+(whole===1?" dollar":" dollars");
  }
  return {speakMoney,numberWords,roundDisplayedDollars};
});