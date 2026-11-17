# Financing Intelligence Desk — Calculation methodology

**Live educational tool:** https://levaventures.com/tools/financing-intelligence/

This is a plain-language explanation of the observable V2 underwriting calculations, using entirely **hypothetical** inputs. It is not a lender credit policy, a certification, an offer of credit, an appraisal, a legal opinion, or an assertion that capital is available. Results are estimates and depend on assumptions.

## Debt capacity: the tightest of three tests controls

V2 uses *annual lender-underwritten net operating income (NOI)*, assumed collateral value, an illustrative interest rate and amortization convention, and three independent ceilings. The modeled senior loan amount is the **minimum** of their results, not their average or sum.

| Test | Meaning | Modeled maximum loan amount |
| --- | --- | --- |
| **DSCR** — debt service coverage ratio | Annual NOI ÷ modeled annual debt service | Annual NOI ÷ (minimum required DSCR × 12 × monthly payment factor) |
| **LTV** — loan-to-value | Senior principal ÷ assumed property value | Assumed property value × maximum permitted LTV |
| **Debt yield** | Annual NOI ÷ senior principal | Annual NOI ÷ minimum required debt yield |

The interest and amortization convention in the finance engine is an **annual nominal rate divided by 12** with monthly amortizing payments, rather than an effective-annual-rate convention. For a loan with interest rate `r` as a decimal and `n` monthly payments:

- Monthly rate `i = r / 12`
- Monthly payment per $1 of principal `f = i / (1 - (1 + i)^(-n))` when `i > 0`
- At zero interest, `f = 1 / n`
- Annual debt service on loan principal `P` is `P × f × 12`
- The DSCR ceiling is `NOI / (minimum_DSCR × f × 12)`

A *binding constraint* is whichever ceiling is smallest. Tied ceilings may bind simultaneously. A higher appraisal does not itself increase proceeds when DSCR is the smaller ceiling; higher NOI does not itself increase proceeds if LTV remains the binding limit.

## Worked hypothetical refinancing example

V2's default example uses:

| Assumption | Hypothetical value |
| --- | ---: |
| Property value | $8,000,000 |
| Annual lender-underwritten NOI | $520,000 |
| Existing loan payoff | $5,600,000 |
| Closing costs | $180,000 |
| Additional required cash reserves | $0 |
| Nominal annual interest rate | 7.50% |
| Amortization | 25 years / 300 monthly payments |
| Minimum DSCR | 1.25× |
| Maximum LTV | 65% |
| Minimum debt yield | 9% |

**Three illustrative senior-debt ceilings:**

1. **DSCR:** Annual debt service budget = `$520,000 / 1.25 = $416,000`. Discount that debt service at the 7.50% / 25-year monthly amortization convention: **$4,691,080** in allowable principal (rounded).
2. **LTV:** `$8,000,000 × 65% = $5,200,000`.
3. **Debt yield:** `$520,000 / 9% = $5,777,778` (rounded).

**Modeled senior proceeds:** `min($4,691,080, $5,200,000, $5,777,778) = $4,691,080`. **DSCR is binding.**

**Total modeled closing uses:** `$5,600,000 payoff + $180,000 closing costs + $0 reserves = $5,780,000`.

**Modeled refinance funding gap:** `max(0, $5,780,000 - $4,691,080) = $1,088,920` (rounded).

A property may therefore have substantial estimated equity but still face a cash-at-closing need under a specific debt-sizing scenario. A funding gap is not a financing offer and does not mean that supplemental financing will be available.

### What changes when NOI improves?

These sensitivities change **only NOI**; property value, rate, underwriting thresholds, and closing uses remain unchanged.

| Scenario | Annual NOI | Binding ceiling | Modeled senior proceeds | Remaining gap |
| --- | ---: | --- | ---: | ---: |
| Baseline | $520,000 | DSCR | $4,691,080 | $1,088,920 |
| NOI +10% | $572,000 | DSCR | $5,160,188 | $619,812 |
| NOI +20% | $624,000 | LTV | $5,200,000 | $580,000 |

The +20% scenario hits the unchanged 65% LTV ceiling; more NOI alone cannot increase modeled proceeds above $5.2 million in that scenario.

## Closing cash, not just estimated collateral equity

For the refinance module, the model calculates:

- **Closing uses** = existing payoff + estimated closing costs and fees + required cash reserves.
- **Modeled funding gap** = `max(0, closing uses - modeled senior proceeds)`.
- **Modeled proceeds surplus** = `max(0, modeled senior proceeds - closing uses)`.

In the standalone modeled capital structure module, additional capital sources and sponsor cash may be considered on **illustrative** terms. Their availability, ranking, permissible combination, economics, and actual lender acceptance require independent verification.

## Related illustrative workspaces

The eight connected V2 modules are **Debt Capacity**, **Loan & Balloon**, **Refinance Intelligence**, **Capital Structure**, **Scenario Lab**, **Investment Returns**, **Equity Waterfall**, and **Analysis Report**. Different modules introduce additional assumptions and output conventions. The investment return and simplified LP/GP distribution calculations are not substitutes for a full investment model, partnership agreement, underwriting package or tax and legal analysis.

## Reproducible model verification

The source repository already contains calculation and edge-case tests. Relevant paths:

- `tools/commercial-real-estate-loan-calculator/finance.js` — amortization, modeled debt sizing, and gap arithmetic.
- `tools/commercial-real-estate-loan-calculator/desk-core.js` — input validation, binding-constraint diagnostics, comparative scenarios.
- `tools/commercial-real-estate-loan-calculator/desk-core.test.js` — independent $8m baseline, sensitivity checks, constraint transitions and validation.
- `tools/commercial-real-estate-loan-calculator/desk-release-finance.test.js` — additional independent boundary and model-contract tests.
- `tests/desk_v2_independent_financial_reference.py` — independent Python financial reference.
- `tests/desk-v2-production.test.cjs` — browser-level checks of V2's reported amounts, eight workspaces, local requests and clean URLs.

For a local checkout with Node.js installed, the core financial checks can be invoked with:

```sh
node --test tools/commercial-real-estate-loan-calculator/finance.test.js tools/commercial-real-estate-loan-calculator/desk-core.test.js tools/commercial-real-estate-loan-calculator/desk-release-finance.test.js
python3 tests/desk_v2_independent_financial_reference.py
```

These are automated reproducibility checks, **not** certified institutional underwriting or a guarantee of correctness for a real deal.

## Data handling and scope

The calculator is deliberately a browser-based, client-side application: financial assumptions are processed locally for the tool's interactive results, with no numeric-input submission endpoint in the V2 application. The page's declared Content Security Policy prohibits outbound browser connections from this page (`connect-src 'none'`) and disallows form submissions (`form-action 'none'`). A separate, voluntary financing inquiry through the company website is a different user action and has its own implications.

**Source rights:** This documentation explains general financial methods; it **does not grant a license** to Leva-owned application code, branding, text, or graphics. See [proprietary rights notice](../NOTICE.md), including third-party license exceptions.
