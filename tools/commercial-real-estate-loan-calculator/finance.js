/* Leva Ventures — deterministic financial calculation engine. Educational estimates only.
   No user inputs are transmitted or stored by this file. */
(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.LVFinance = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function number(value, label, min = 0) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min) throw new Error(label + " must be at least " + min + ".");
    return n;
  }
  function positive(value, label) {
    const n = number(value, label);
    if (n <= 0) throw new Error(label + " must be greater than zero.");
    return n;
  }
  function periodMonths(years, label) {
    const count = Math.round(positive(years, label) * 12);
    if (count < 1 || count > 1200) throw new Error(label + " must be between 1 month and 100 years.");
    return count;
  }
  function monthlyFactor(ratePercent, months) {
    const rate = number(ratePercent, "Interest rate") / 1200;
    if (!Number.isSafeInteger(months) || months < 1) throw new Error("Invalid amortization period.");
    return rate === 0 ? 1 / months : rate / (1 - Math.pow(1 + rate, -months));
  }
  function remainingBalance(principal, ratePercent, payment, paidMonths) {
    const rate = number(ratePercent, "Interest rate") / 1200;
    if (rate === 0) return Math.max(0, principal - payment * paidMonths);
    const growth = Math.pow(1 + rate, paidMonths);
    return Math.max(0, principal * growth - payment * (growth - 1) / rate);
  }
  function loan(input) {
    const principal = positive(input.principal, "Loan amount");
    const rate = number(input.rate, "Interest rate");
    const months = periodMonths(input.termYears, "Loan term");
    const amortMonths = periodMonths(input.amortYears, "Amortization");
    const interestOnly = Boolean(input.interestOnly);
    if (!interestOnly && months > amortMonths) throw new Error("Loan term cannot exceed amortization for a fully amortizing payment schedule.");
    const monthlyPayment = interestOnly ? principal * rate / 1200 : principal * monthlyFactor(rate, amortMonths);
    const balloon = interestOnly ? principal : (months === amortMonths ? 0 : remainingBalance(principal, rate, monthlyPayment, months));
    const principalRepaid = principal - balloon;
    const interestPaid = Math.max(0, monthlyPayment * months - principalRepaid);
    const monthlyRate = rate / 1200;
    let balance = principal;
    const schedule = [];
    for (let m = 1; m <= months; m++) {
      const interest = balance * monthlyRate;
      const principalPortion = interestOnly ? 0 : Math.min(balance, Math.max(0, monthlyPayment - interest));
      balance = Math.max(0, balance - principalPortion);
      schedule.push({ month: m, payment: monthlyPayment, principal: principalPortion, interest, remaining: balance });
    }
    return { principal, rate, months, amortMonths, interestOnly, monthlyPayment,
      annualDebtService: monthlyPayment * 12, balloon, principalRepaid, interestPaid, schedule };
  }
  function refinance(input) {
    const value = positive(input.value, "Property value");
    const noi = number(input.noi, "Annual NOI");
    const payoff = number(input.payoff, "Existing loan payoff");
    const costs = number(input.costs, "Closing costs and fees");
    const reserves = number(input.reserves, "Reserves");
    const rate = number(input.rate, "Interest rate");
    const amortMonths = periodMonths(input.amortYears, "Amortization");
    const dscrMin = positive(input.dscrMin, "Minimum DSCR");
    const ltvMax = number(input.ltvMax, "Maximum LTV");
    const debtYieldMin = positive(input.debtYieldMin, "Minimum debt yield");
    if (ltvMax > 100 || debtYieldMin > 100) throw new Error("LTV and debt yield percentages cannot exceed 100.");
    const factor = monthlyFactor(rate, amortMonths);
    const dscrLimit = noi / (dscrMin * 12 * factor);
    const ltvLimit = value * ltvMax / 100;
    const debtYieldLimit = noi / (debtYieldMin / 100);
    const limits = { DSCR: dscrLimit, LTV: ltvLimit, "Debt yield": debtYieldLimit };
    const proceeds = Math.max(0, Math.min(dscrLimit, ltvLimit, debtYieldLimit));
    const binding = Object.keys(limits).filter(key => Math.abs(limits[key] - proceeds) < 0.01).join(" & ");
    const required = payoff + costs + reserves;
    const gap = Math.max(0, required - proceeds);
    const surplus = Math.max(0, proceeds - required);
    const annualDebtService = proceeds * factor * 12;
    return { value, noi, payoff, costs, reserves, required, rate, dscrMin, ltvMax, debtYieldMin,
      limits, proceeds, binding, gap, surplus, monthlyPayment: proceeds * factor,
      annualDebtService, dscr: annualDebtService > 0 ? noi / annualDebtService : null,
      ltv: 100 * proceeds / value,
      debtYield: proceeds > 0 ? 100 * noi / proceeds : null };
  }
  return { monthlyFactor, remainingBalance, loan, refinance };
});
