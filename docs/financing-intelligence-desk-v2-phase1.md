# Leva Financing Intelligence Desk V2 — Phase 1 architecture and release controls

Status: **feature branch only; not deployed**. Existing public calculator unchanged.

## Scope implemented
- Shared deterministic underwriting and diagnostics module \`desk-core.js\` built on the existing \`finance.js\` module.
- Model definitions and strict validation for value, underwritten NOI, payoff, costs, reserves, rate, amortization, minimum DSCR, maximum LTV and minimum debt yield.
- Explicit binding and next-binding constraints, target-loan requirements and standalone cap-rate implied valuation.
- Three-case analysis (base, downside, upside), with shared assumptions and per-case change audit.
- A nonindexed responsive internal preview with four functional panels: debt capacity, refinance, scenario comparison, and client-side printable report.
- No change to live calculator markup or existing indexed URL; no outbound collection or persistence of inputs.
- Independent financing test suite and desktop/mobile Chromium review test in CI.

## Calculation contract
All figures are *illustrative*, and neither property value nor lender underwriting assumptions are verified. Monthly principal factor = r/(1-(1+r)^-n) for positive monthly rate r and n months; zero-rate factor = 1/n. Annual debt service = 12 × principal × factor. DSCR capacity = NOI / (minimum DSCR × 12 × factor). LTV capacity = value × maximum LTV / 100. Debt-yield capacity = NOI/(minimum debt yield / 100). Supportable senior loan = nonnegative minimum of the three lender ceilings. Refinance uses = payoff + costs + reserves. Gap = max(0, uses - proceeds); surplus = max(0, proceeds - uses). Required NOI for target debt = max(target × 12 × factor × minimum DSCR, target × required debt yield); required collateral value = target / maximum LTV, undefined if target > 0 and LTV = 0. Implied cap-rate value = NOI / (cap rate / 100); *not* an appraisal.

Rounding is for display only (nearest dollar); internal computations retain full precision. Rates in percent, not fractions. Monthly payments occur at each month end. DSCR uses full-period nominal annual debt service. Interest-only, floating-rate, amortization-to-maturity transitions, investor IRR and GP/LP waterfalls are outside this prototype and remain governed by the existing calculator or future separate modules.

## Independent numerical reference
Input: $8m value; $520k NOI; $5.6m payoff; $180k costs/reserves; 7.50% interest; 25-year amortization; 1.25x minimum DSCR; 65% maximum LTV; 9% minimum debt yield.

Expected: DSCR $4,691,079.91; LTV $5,200,000; debt yield $5,777,777.78; senior $4,691,079.91; uses $5,780,000; gap $1,088,920.09. Raising NOI by 10% results in DSCR $5,160,187.90, **still binding**. The exact DSCR-to-LTV crossover occurs when NOI = $5.2m × (monthly loan factor × 12) × 1.25.

## UX and shared-deal architecture
Phase 1 uses a lightweight dedicated preview rather than replacing the production page. No new frontend framework or external font/JS libraries. A central assumption state is read from the input controls; every module delegates calculations to Desk Core (which delegates to existing finance.js). Presentation logic never reimplements the loan sizing formulas. All text comes from numerical state rather than unverified AI. Screen-readable tables accompany the visual loan-limit bars. User changes always recompute the displayed panels, even when a panel is hidden.

## Next engineering steps
1. Review CI results, handle any failed numerical or browser assertions.
2. Independently audit production financial formula conventions and compare equivalent competitor assumptions.
3. Add existing loan and capital-stack functionality to the unified deal model without breaking existing modules.
4. Complete keyboard, screen reader, 400% zoom and security checks; accessibility certification cannot be claimed without actual conformance evaluation.
5. Create a separate, tested public calculator hub and SEO landing-page architecture with original URL preserved.
6. Reassess scope of investments IRR and waterfall *after* contractual conventions are specified and audited.

## Release gate
Never merge directly to main until regression, model, accessibility, mobile, SEO and security checks pass. The preview remains noindex and is intentionally not a new public SEO landing page. No live deployment claimed.