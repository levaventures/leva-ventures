# Leva Financing Intelligence — Launch integration and handoff

**Status:** Prepared in draft branch only. **Not published.**  
**Audience:** Leva Ventures site owner and launch reviewer.  
**Primary page:** https://levaventures.com/tools/commercial-real-estate-loan-calculator/  
**Branch:** `feature/commercial-financing-calculator-v1`  
**Pull request:** https://github.com/levaventures/leva-ventures/pull/1

## Implemented launch experience

- The homepage displays a dedicated, responsive financing-intelligence feature with one primary calculator CTA. The desktop navigation and footer link to the calculator.
- The Insights hub has a distinct free-financing-tool feature and links in navigation and footer.
- All three published financing Insights articles link contextually to the calculator and have a secondary footer link.
- The calculator links to all three relevant articles and to Leva's main website, contact inquiry, privacy and disclosure information.
- The calculator remains **free, no registration**, with optional UK-voice narration and exact-number transcripts, the interactive capital-stack graphic and accessible numeric table.
- The public accessibility page is linked from site footers and describes the current evaluation transparently.
- No $79 paid blueprint checkout or premium product is enabled.

## SEO integration

**Title:** Commercial Real Estate Loan Calculator & Refinance Gap | Leva Ventures  
**Canonical:** https://levaventures.com/tools/commercial-real-estate-loan-calculator/  
**Meta description:** Free commercial real estate loan calculator: estimate monthly payments, balloon balances, DSCR, LTV and refinance funding gaps. Optional narrated explanations.  
**Structured data:** valid WebApplication JSON-LD with free price. No guaranteed rich result.  
**Sitemap:** seven intended publicly indexable URLs, including the calculator and accessibility information page, with 2026-11-04 modification dates reflecting draft edits.  
**Robots:** public crawl allowed; sitemap advertised.  
**Review copies:** six standalone `previews/*.html` files contain `<meta name="robots" content="noindex,nofollow">` and are excluded from the sitemap to avoid duplicate landing pages.

After the public site is published, verify the actual rendered canonical page, request indexing via Google Search Console URL Inspection, submit the sitemap once, and monitor indexing, impressions, clicks and qualified contact inquiries. Robots and sitemap edits are not effective on the public domain until the branch is merged and deployed.

## Production-style preview checks

A GitHub Actions workflow executes `tools/commercial-real-estate-loan-calculator/site-launch-integration.test.js`. It serves repository content at localhost using the same root-relative path pattern as GitHub Pages. It checks:
1. Every intended public page responds with HTML.
2. Titles, unique H1, meta descriptions, canonical URLs and valid JSON-LD.
3. All root-relative links have matching files or index destinations.
4. Sitemap matches publicly indexable pages without duplicates.
5. Preview copies are explicitly `noindex`.
6. Homepage and Insights calculator CTAs appear at desktop and 390px/320px widths without horizontal overflow.
7. The actual calculator renders and Refinance Intelligence populates the capital-stack table.
8. Browser JavaScript errors and responsive screenshots.

The original homepage had a decorative diagonal element that widened the mobile document beyond the viewport; it has been disabled only at smaller widths, with no loss of content. Financial calculation, voice, WCAG automated rules and targeted Windows NVDA checks run separately.

## Remaining release conditions

**Do not merge or deploy without explicit user authorization.** Before publication:
- [ ] User reviews the desktop/mobile screenshots and the copy.
- [ ] Verify site-wide financial, privacy, brokerage/securities and lead-inquiry wording with qualified advisers as appropriate; the user has confirmed independent calculator financial accuracy.
- [ ] Confirm real hosted contact form including Cloudflare Turnstile handles keyboard and screen-reader interactions; automation cannot prove the hosted third-party flow works.
- [ ] Verify custom domain, certificate and GitHub Pages production publishing settings on merge.
- [ ] Do not claim official ADA certification or complete WCAG 2.2 AA conformance from zero automated violations.

After user authorizes publishing:
- [ ] Merge the reviewed PR into `main`; wait for hosting deployment confirmation.
- [ ] Check calculator, sitemap, accessibility page and contact form via actual `https://levaventures.com/` URLs.
- [ ] Retest mobile navigation and optional narration on a real browser.
- [ ] Validate canonical and WebApplication JSON-LD on public URL.
- [ ] Submit the updated sitemap in Google Search Console; monitor coverage and performance.
- [ ] Keep the premium blueprint **unpublished**, then test paid demand with qualified users separately.

No claims of financing availability, lender approval, accessibility certification, or guaranteed search rankings are made by this integration.
