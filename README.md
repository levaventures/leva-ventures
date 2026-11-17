# Leva Ventures — Financing Intelligence Desk

**A free interactive commercial real estate financing analysis tool.** Explore illustrative debt capacity, refinance funding gaps, loan amortization, capital structures, and investment scenarios in one browser-based workstation.

### [Open the live Financing Intelligence Desk](https://levaventures.com/tools/financing-intelligence/)

[![Leva Ventures brand preview](https://levaventures.com/levaventures-og-image.png)](https://levaventures.com/tools/financing-intelligence/)

> **Live application:** https://levaventures.com/tools/financing-intelligence/  
> **Pricing:** Free; no login required.  
> **Use:** Educational decision-support estimates, not lender approvals or investment recommendations.

## What the Desk does

| Connected workspace | Purpose |
| --- | --- |
| **Debt Capacity** | Compare DSCR, LTV and debt-yield borrowing ceilings; identify the binding constraint |
| **Loan & Balloon** | Model payments, amortization schedules and illustrative remaining loan balances |
| **Refinance Intelligence** | Compare projected loan proceeds against existing payoff, closing costs and reserves |
| **Capital Structure** | Illustrate senior debt, additional capital, sponsor cash and uncovered closing uses |
| **Scenario Lab** | Compare baseline, downside and upside NOI / rate assumptions |
| **Investment Returns** | Explore hypothetical holding-period cash flows and IRR / equity multiple |
| **Equity Waterfall** | Illustrate simplified LP/GP cash distribution assumptions |
| **Analysis Report** | Review and export assumptions and modeled conclusions |

### Worked hypothetical example: refinancing can require cash despite property equity

| Assumption | Illustrative amount |
| --- | ---: |
| Assumed property value | $8,000,000 |
| Annual lender-underwritten NOI | $520,000 |
| Existing debt payoff | $5,600,000 |
| Closing costs and reserves | $180,000 |
| Modeled borrowing interest / amortization | 7.5% / 25 years |
| Minimum DSCR / maximum LTV / minimum debt yield | 1.25× / 65% / 9% |

With those assumptions, the Desk models **$4,691,080 in senior loan proceeds**, limited by **DSCR**, against **$5,780,000 of closing uses**. The result is a modeled **$1,088,920 refinance funding gap**, not a financing commitment.

**[Read the formulas, all three loan ceilings, sensitivities and reproducible tests](docs/financing-desk-calculation-methodology.md).** The explanation also shows why increasing NOI alone eventually runs into the LTV ceiling.

## Visual review and screenshots

The live application has eight workspace views and responsive layouts. **View the [live, interactive Desk](https://levaventures.com/tools/financing-intelligence/) for the current production interface.** The existing [V2 review workflow](.github/workflows/financing-desk-v2.yml) captures actual desktop and mobile screenshots of all eight modules as an Actions artifact named `leva-desk-v2-visual-review` (retained for 30 days per run). The screenshot generator is in [review-screenshots.js](previews/leva-financing-desk-v2/review-screenshots.js). The brand graphic above is **not a screenshot**.

We intentionally do not publish potentially stale or mockup screenshots as if they were current V2 images.

## Privacy approach

V2's financial calculations run **locally in the user's browser**. The tool does not automatically transmit the numeric inputs entered into its financing workspaces; it does not require registration. Its application-level browser Content Security Policy disallows outbound connections (`connect-src 'none'`) and form submissions (`form-action 'none'`) on the tool page. Any separate voluntary inquiry submitted on Leva's main website is a distinct interaction.

## Financial methodology and verification

- [DSCR, LTV, debt-yield mathematics and worked examples](docs/financing-desk-calculation-methodology.md)
- [Underwriting and input validation tests](tools/commercial-real-estate-loan-calculator/desk-core.test.js)
- [Independent financial boundary checks](tools/commercial-real-estate-loan-calculator/desk-release-finance.test.js)
- [Independent Python reference](tests/desk_v2_independent_financial_reference.py)

This repository contains the website and application needed for Leva's existing deployment. Its materials are not offered for general open-source reuse.

## Other resources

- [CRE refinance gap analysis](https://levaventures.com/insights/commercial-real-estate-refinance-gap-analysis/)
- [Original commercial real estate loan calculator](https://levaventures.com/tools/commercial-real-estate-loan-calculator/)
- [Leva Ventures](https://levaventures.com/)

## Ownership and limitations

**© 2026 Leva Ventures, LLC. All rights reserved with respect to Leva-owned materials.** This repository is **not offered under an open-source license**; see [NOTICE.md](NOTICE.md). Third-party components retain their own licenses. Public source visibility and browser delivery mean code may still be inspected or copied; this notice does not provide technical copy prevention.

All financial outputs are illustrative and assumption-dependent—not investment advice, certified underwriting, an appraisal, an offer of financing, a lending commitment, or a guarantee of capital availability.
