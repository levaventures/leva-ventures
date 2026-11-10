# Leva Financing Intelligence Desk V2 — Investment Return & Waterfall Specification

**Status:** Draft PR #5; model not deployed; example figures are hypothetical. All calculations run in the browser using Leva-owned deterministic modules. Shared debt-sizing assumptions are inherited from \`desk-core.js\`. No paid third-party engine or external financial API is required.

## Investment returns model (investment.js)
- Acquisition basis = purchase price + acquisition costs.
- Senior funding is either **modeled underwriting proceeds**, a labeled **user-specified hypothetical principal**, or **zero debt**. Initial funded acquisition debt must be less than acquisition basis. Amounts above or equal to acquisition basis are rejected instead of silently implying free equity or a cash-out.
- Initial equity = acquisition basis - debt principal. Year-0 equity cash flow is negative initial equity.
- At each year t from 1 to n: NOI(t) = baseline underwritten NOI × (1 + selected annual growth)^(t - 1). Debt service is the sum of the existing \`finance.js\` monthly payments for the year. End-of-year operating equity cash = annual NOI - annual debt service.
- At exit after year n: **forward NOI** = NOI(n+1); gross exit property value = NOI(n+1) ÷ assumed exit cap rate; sale costs = exit value × assumed selling-cost percentage; outstanding debt = balance after month 12n from the source loan amortization schedule; exit equity = exit value - sale costs - debt repayment.
- Final-year equity cash = annual operating equity cash + exit equity. For every other year, annual equity cash = annual operating equity cash. Negative annual net cash is an additional equity funding requirement.
- **Periodic annual equity IRR** is computed from the year-0 to year-n cash flows. IRR is distinguished from date-sensitive XIRR. If no valid root exists, IRR is unspecified. If more than one root is identified within the documented numerical scan, the model reports a multiple-root condition rather than selecting one arbitrarily. Roots outside the current search domain may not be found; this is an explicit limitation.
- Annual NPV uses the user-selected annual discount rate. Equity multiple = total positive periodic equity distributions divided by all equity funding contributions, including additional negative annual cash. This differs from a simple exit-proceeds / initial-equity metric.
- Year-one cash-on-cash = year-one operating equity cash / initial equity. It may be negative if debt payments exceed NOI.
- Monthly payment timing uses the existing source finance engine, with nominal annual interest divided by 12; operating cash and distributions occur at year end.
- No taxes, rent roll and expense underwriting, reserves beyond modeled costs, loan points, refinancing events, promote catch-up, acquisition mortgage origination costs beyond manually included acquisition costs, capital projects or lease-up periods are represented. Modeled NOI is user supplied. Non-amortizing debt and floating-rate investment models are not represented in this initial module.

## LP/GP waterfall (waterfall.js)
This model is **an explicit simplified annual project waterfall**, not a contractual fund/legal partnership waterfall.

1. Year 0 initial equity is contributed by LP and GP according to the selected LP capital share. GP takes the remainder.
2. Each year, the LP preferred return is calculated on **unreturned LP contributed capital**. When cumulative is selected, unpaid preferred amounts carry forward; optional annual compounding applies to previously unpaid preferred amounts, not to returned contributed capital. A noncumulative preference expires at the end of each year.
3. Positive cash is allocated in order: (a) LP accrued/preferred return, (b) pro-rata return of unreturned contributed LP and GP capital, (c) residual profits split according to the selected LP residual percentage.
4. Negative annual net equity cash is funded through an additional year-end LP and GP capital call using the original contribution percentages. That capital joins unreturned contributed capital beginning with future years.
5. Every row reconciles LP distributions + GP distributions = total available positive cash, and LP cash calls + GP cash calls = the negative cash funding requirement. The sum of all cash and calls reconciles to the underlying investment cash-flow series.
6. Investor IRRs are calculated separately from each investor's annual net cash flows. Cumulative unpaid preferred returns and unreturned capital are disclosed at the end of the modeled holding period.

**Not supported or implied:** IRR-based hurdles; GP promote catch-up; clawbacks; complex tiered promote splits; intra-year accrual and timing; pari passu preferred equity holders; distribution restrictions; liquidation rights; changes to ownership after subsequent contributions; tax allocations; sponsor fees; preferred return on fund-level commitments. The simplified model must not be marketed as a substitute for transaction legal terms.

## Numerical validation and release gate
Independent reference: property value $8M, NOI $520K, 7.5% rate, 25-year amortization, DSCR minimum 1.25x, 65% maximum LTV and 9% debt yield. For acquisition: $8M purchase, $150K acquisition expenses, 5-year hold, 2% annual NOI growth, 6.5% exit cap, 2% sale costs, 10% NPV discount. For modeled loan, approximate independent outputs: $4,691,079.91 debt, $3,458,920.09 equity, $416,000 annual debt service, $4,303,247.22 debt balance at exit, $8,832,646.43 gross exit value, $4,352,746.28 net exit equity, **7.9794% annual IRR**, **−$289,231.94 NPV**, **1.43942x equity multiple**.

Required tests cover multiple-IRR conditions, zero/undefined IRR, negative sale proceeds, unlevered cases, formula invalids, cumulative/noncumulative and compounded preferred accrual, capital conservation, loss funding, GP/LP splits, and report visibility. Browser tests run 1440px, 390px and 320px; axe-based checks run on all eight tabs at desktop and 390px.

**Release requirement:** All old and new CI checks must pass before any merge. Real-world scenario suitability and waterfall legal terms require qualified human review. Accessibility automation cannot establish complete WCAG 2.2 AA or legal ADA conformance. Existing indexed calculator URL and production remain unchanged during draft validation.
