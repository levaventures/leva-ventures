# Leva Financing Intelligence — Prelaunch Readiness Review (working draft)
**Review date:** November 2026  
**Scope:** `tools/commercial-real-estate-loan-calculator/` on `feature/commercial-financing-calculator-v1`  
**Production status:** **DRAFT / NOT APPROVED TO DEPLOY**. Do not merge PR #1 without written launch approval.

## Executive decision

**Conditional readiness only.** The financial engine, interactive source-allocation and browser experience have repeatable automated tests. This is not a lender-underwriting application, a financing offer or a source of actual market terms. The scope of any public offering and paid services needs counsel review before launch. A full WCAG 2.2 AA claim cannot be made from an automated test alone.

## Accelerated open-source accessibility verification — November 2026

- **63/63 additional local Chromium/Playwright checks passed**, covering keyboard operation, labeled controls, semantic source tables, tab navigation, slider adjustments, invalid values, forced-colors and reduced-motion behavior, JavaScript exceptions and responsive layouts at 1280, 768, 390 and 320 CSS pixels.
- Existing automated axe-core WCAG 2.2 A/AA tests of both calculator modes and all functional/browser regressions passed in Actions run [41972918262](https://github.com/levaventures/leva-ventures/actions/runs/41972918262).
- **Real NVDA screen-reader automation:** Guidepup + NVDA on Windows GitHub Actions [run 41976441723](https://github.com/levaventures/leva-ventures/actions/runs/41976441723) PASSED 2/2 tests. Verified actual spoken headings for loan calculator, focus speech for the refinance tab, and speech identifying the scrollable capital stack table region.
- Earlier automated NVDA tests failed because scripted heading traversal retained stale browse-mode content after tab switching; targeted focus-and-region checks now pass, but the limitation remains an **untested end-to-end browse-mode flow**, not proof of full accessibility.
- These checks are a **technical accessibility evaluation, not a complete WCAG conformance report**. Do not claim certification or guaranteed ADA compliance.
- User confirms financial model has been individually validated as accurate. Capture independent validation details in the release record if available.

**Fast-track release recommendation:** Do not impose an arbitrary two-week hold. Prepare launch integration on a draft branch immediately. Before publication, resolve any observed critical blocker, verify privacy/financial/legal claims, obtain explicit launch approval, and avoid unverified WCAG compliance claims. Continue broader assistive-technology usability work after launch if no release-blocking defect remains.

## Site-wide accessibility audit and remediation — November 2026

**Target:** WCAG 2.2 AA, across the current unmerged development branch (not live production).

- Full-site open-source axe-core scan initially found **10 rule violations** across the home page and Insights content: low-contrast small print, branding accessible-name mismatch, and incorrectly labeled role-less containers.
- Corrected those defects on the development branch and added semantic regions for article breadcrumb groups, capital-stack sample reports and filter controls.
- Added `accessibility/index.html`, a transparent accessibility/feedback page that avoids unsupported compliance claims; linked to it in site footers.
- Final full-site automated check [Actions run 41979128411](https://github.com/levaventures/leva-ventures/actions/runs/41979128411): **zero detected violations** across **8 page states**, including both calculator modes and the new accessibility page.
- Existing calculator financial and browser CI / targeted Windows NVDA speech checks are complementary, not a substitute for full WCAG-EM evaluation.
- The scan flags some contrast checks over gradients/images as **incomplete** because automatic computation cannot determine the effective background. These still require visual/human validation.
- The live website has **not** received these fixes; no production claim should be made before explicit deployment authorization and live retesting.
- The real Formspree/Cloudflare Turnstile contact challenge remains a third-party workflow requiring keyboard and assistive-technology confirmation in its deployed environment.

The [WCAG-EM 2.0 methodology](https://www.w3.org/TR/WCAG-EM/) requires examining complete pages and processes before a whole-site conformance claim. Automated zero violations are not official certification or legal ADA compliance. Optional third-party verification: [WebAIM Accessible Website Certification](https://webaim.org/services/certification/) involves an expert audit, remediation and conformance verification and cannot be issued simply from automated test output.

## Findings and actions

| ID | Priority | Workstream | Finding | Action or release criterion | Current status |
|---|---|---|---|---|---|
| F-01 | HIGH | Financial methodology | Loan payment and balloon schedule assume a constant fixed rate, monthly compounding and level payments, with no escrows, tax, insurance, lender fees, prepayment fees or reserve costs unless separately entered | Keep assumptions clear and have experienced CRE lender/underwriter independently reproduce at least 10 realistic cases including IO, negative NOI prohibited, near-zero rates and maturity balloons | **Needs independent human review** |
| F-02 | HIGH | Refinance underwriting | Modeled proceeds are the lowest of DSCR, LTV and debt-yield caps. Real lenders have additional constraints such as loan size, cash management, property type, seasoning, stress rate, guarantees, leasing, credit quality, environmental/title issues and existing obligations | Present estimates as assumption-based illustrations only; ensure financing outcomes are never implied or guaranteed | Disclosed in calculator; **human review pending** |
| F-03 | HIGH | Legal / regulatory | Leva connects opportunities and sources of capital; activity, transaction-based fees, securities introductions, lender brokering and tailored advisory services can invoke federal/state regulation depending on structure and jurisdiction | Licensed counsel to review website positioning, inquiry follow-up and referral/compensation model; verify any required BD/lender/broker partner protocols before regulated activity | **External legal sign-off required** |
| F-04 | HIGH | Voice privacy | Calculator inputs stay in browser; optional speech synthesis may send spoken text to a remote OS/browser voice provider | Disclose conditional voice-provider processing, avoid claiming all speech processing stays local; confirm Leva site privacy notice reflects voice feature before publishing | **Improved copy in draft**; final policy review pending |
| F-05 | HIGH | Accessibility | Automated axe WCAG 2.2 A/AA checks passed in two calculator modes, but do not prove full compliance or accessible speech with live assistive technology | Conduct Windows NVDA + Chrome/Edge and Apple VoiceOver + Safari manual checks. Verify tab order, forms, charts as table, error feedback, stop speech, 200–400% zoom/reflow and 320px viewport. Document issues and re-test | **Manual screen-reader review pending** |
| F-06 | MEDIUM | Pricing / paid reports | Proposed $79 blueprint is not built or checked out. Publishing a price can confuse free-tool visitors | Remove proposed price from free-tool landing experience; later commercial validation and payment-product review | **Corrected in draft** |
| F-07 | MEDIUM | Privacy/consent | Optional external inquiry is separate from local calculations, but the privacy section should make distinction clear and explain third-party processors and speech use | Cross-link homepage privacy and important disclosures; don't collect financial input values in analytics by default | **Corrected crosslinks and calculator FAQ**; site-wide legal review pending |
| F-08 | MEDIUM | SEO | Primary landing page is not live nor in homepage menu or sitemap | At release, merge files, add one internal homepage/Insights link, publish canonical tool URL, update sitemap, validate indexing and monitor Search Console. Do not add to sitemap before publication | **Intentionally held pending go-live** |
| F-09 | MEDIUM | SEO structured data | Tool includes WebApplication JSON-LD, canonical, explanatory content and visible FAQs. Rich snippets are not guaranteed. FAQ rich results have restricted eligibility | Validate schema with Google's Rich Results Test after deployment; never promise FAQ-rich eligibility | **Ready to validate after deployment** |
| F-10 | MEDIUM | Performance / privacy | Local code performs calculations without submission. Live design imports fonts from Google; static fonts do not carry calculator inputs, but do make external network requests | Keep performance efficient; validate actual GitHub Pages URLs, third-party requests, browser console and mobile metrics | **Live-host QA pending** |
| F-11 | MEDIUM | Data interpretation | Supplemental debt assumes interest-only cash pay; preferred equity assumes current-pay distributions. These are not actual term sheets, legal rights or available funding. Tier priority and lender restrictions matter | Maintain prominent caveats beside comparison, stack and voice. Never label underfunded or fully sourced scenario as approved | **Caveats present; deal-structure counsel review pending** |
| F-12 | LOW | Product/content | Blueprint sample remains free on-screen text; print buttons use native browser print, while CSV carries cents | Avoid “complete financing report” or “Save PDF” promises beyond browser print; verify download and printing on Windows browsers | Automated browser pass; **human print review advised** |
| F-13 | LOW | Discoverability | Accessibility is an editorial value, not an established Google narration ranking factor | Target the main commercial loan calculator query, explain verified optional narration/accessibility features in copy, seek only legitimate editorial links after launch | **SEO copy refined** |

## Automated test evidence

- GitHub Actions run [41971448168](https://github.com/levaventures/leva-ventures/actions/runs/41971448168) passed: loan and refinance formula tests, strategy and capital-stack tests, exact narrated amounts, desktop/mobile browser flow, offline standalone preview, and axe automated WCAG rule checks.
- After the prelaunch copy changes, GitHub Actions run [41972918262](https://github.com/levaventures/leva-ventures/actions/runs/41972918262) passed: financial unit tests, full browser QA, offline HTML QA, automated accessibility scans, screenshots and preview artifact packaging.
- Exact spoken text sent to speechSynthesis has been verified with an injected UK voice mock. This does not prove actual audible voice quality on every user's browser.
- Browser automation is not financial/legal approval, user acceptance testing, or an accessibility conformance statement.

## Hands-on acceptance checklist before merge

- [ ] Independent senior CRE lending professional reproduces 10 calculations independently and signs off on interest/amortization, DSCR, LTV, yield, payoff, fees and sensitivity results
- [ ] Qualified securities/finance counsel reviews Leva's business model, capital-introduction language, paid blueprint proposition, referral fee practices and partner roles
- [ ] Windows Edge/Chrome + NVDA manual run-through: loan and refinance modes, result summaries, errors, capital-stack table, optional narration and STOP
- [ ] Safari + VoiceOver manual run-through with identical task set
- [ ] Manual mobile 320px, 390px and desktop 200–400% zoom testing, with contrast/focus checks
- [ ] Review site's Privacy Notice for optional operating-system/remote text-to-speech and inquiries
- [ ] Confirm actual home page/Insights/Privacy/Disclosures/Contact destination links
- [ ] Check native print/PDF, CSV and sample blueprint with realistic lender assumptions
- [ ] Confirm SEO copy/title/canonical/sitemap/internal links and search snippet consistency
- [ ] Confirm no payment processor, inadvertent form submission or unconsented financial analytics
- [ ] Obtain explicit approval to merge/deploy (separate from approval to review)

## Proposed on-page SEO elements

**Title:** Commercial Real Estate Loan Calculator & Refinance Gap | Leva Ventures  
**Meta description:** Free commercial real estate loan calculator: estimate monthly payments, balloon balances, DSCR, LTV and refinance funding gaps. Optional narrated explanations.  
**Canonical (on publication):** https://levaventures.com/tools/commercial-real-estate-loan-calculator/  
**Primary intent:** Commercial real estate loan calculator (free, immediate calculation)  
**Secondary benefits:** Commercial refinance funding gap, DSCR/LTV/debt yield sensitivity, hypothetical capital stack, accessible table and optional audio explanations  
**Internal links:** Home / Insights -> calculator, calculator -> two existing CRE financing/preparation Insights articles  
**Structured data:** WebApplication. No assumption of a guaranteed rich-result feature.

## Recommended sequence

1. **Complete external methodology and compliance review**; fix any outcome-affecting issues.
2. **Complete manual assistive-technology review**, log and resolve barriers, retest.
3. **Prepare launch integration changes in the draft PR**, not the production main branch.
4. **Get explicit publication approval**; merge, validate production and only then submit sitemap and monitor Search Console.

## References (official)

- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA tab pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- WAI-ARIA slider pattern: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
- Google people-first guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google software-app structured data: https://developers.google.com/search/docs/appearance/structured-data/software-app
- Google FAQ rich-result limits: https://developers.google.com/search/docs/appearance/structured-data/faqpage
- DOJ business web accessibility: https://www.ada.gov/resources/web-guidance/
- SEC guide to broker-dealer registration: https://www.sec.gov/about/divisions-offices/division-trading-markets/broker-dealers
- FINRA registration basics: https://www.finra.org/registration-exams-ce/registration
