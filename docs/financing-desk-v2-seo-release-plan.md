# Leva Financing Intelligence Desk V2 — Controlled Release and Organic Search Architecture

**Status:** Internal branch review / draft PR #5. This is a release plan, not a published production change. Existing indexed calculator and sitemap remain unchanged.

## Search strategy: one canonical hub first
Existing public URL: \`https://levaventures.com/tools/commercial-real-estate-loan-calculator/\`. Retain it as the canonical destination for the existing broad commercial mortgage and refinancing calculator cluster. It already has public site links and sitemap coverage. Do not remove it, redirect it, or replace it with untested output.

Proposed future **Financing Intelligence Desk** hub (final route to select only after verified deployment setup and Search Console inspection): \`/tools/financing-intelligence/\`. The noindex internal layout at \`previews/leva-financing-desk-v2/hub/index.html\` is a visual/content review only, not a published route.

### First indexed iteration
1. Keep the existing URL and its ranking targets unchanged.
2. Add an optional, visibly distinct navigation path from the existing calculator to the new desk once the desk has passed release gates; link back to the existing calculator from the desk.
3. Launch one new canonical hub with genuinely useful introductory underwriting content, unique FAQs, accessible links, and a functioning calculator. Do not publish eight near-duplicate pages to chase keywords.
4. Add module-specific landing pages **only** after search-intent analysis shows the need for distinct, substantive content. Potential intents:
   - **Debt sizing:** commercial debt sizing calculator; DSCR vs LTV vs debt yield
   - **Refinancing:** commercial refinance gap calculator; CRE refinance shortfall
   - **Loan terms:** commercial mortgage balloon payment calculator; amortization and maturity
   - **Capital:** real estate capital stack calculator; preferred equity vs junior debt
   - **Investment returns:** commercial property IRR calculator; property equity multiple
   - **Waterfalls:** real estate LP GP waterfall calculator; preferred return distribution (include scope limitations)
5. Use a unique title, H1, meta description, visible method explanation, examples, and canonical tags only for pages with materially differentiated content and working tools. The hub should link to relevant Insights articles, not copy their editorial content.
6. Keep draft previews under noindex/nofollow and out of the sitemap. On release, audit all canonical URLs, internal links, structured data, static asset paths, CSP, privacy and 200 responses in a production-style server.

## Product conversion without sensitive-data collection
- Calculate locally by default. Never transmit user loan inputs, rents, capital calls or personally sensitive financial models for SEO analytics.
- Measure aggregate page visits, voluntary tool navigation and **explicit** contact/qualified opportunity submissions only with privacy notice and appropriate consent.
- Preserve a free/no-login path to the basic calculator and basic results.
- A separate qualified-opportunity inquiry may request business contact details voluntarily. Never bundle hidden financial data in links, tracking pixels, emails or third-party connectors.
- Describe private capital sourcing as relationship development, not a promise of financing or a registered broker-dealer placement service.

## Release sequence / gates
1. **Model contract:** financial assumptions, IRR timing, absence of tax and capex, simplified pref waterfall, modeled versus hypothetical debt.
2. **Automated QA:** original loan/strategy/capital-stack regressions; desk tests; report numeric reconciliation, CSV and print verification; 1440px, 390px and 320px; eight-screen accessibility; SEO/crawl isolation.
3. **Visual QA:** capture desktop and mobile screenshots for hub and eight desk modules; check focus, scrolling, print layout, table readability and reduced-motion behavior.
4. **Human finance review:** independently validate assumptions, sample cash flows, exit debt payoff, LP/GP allocation priority and contractual limitations. A clean unit-test result is not investment underwriting certification.
5. **Manual accessibility:** keyboard navigation and real screen-reader passes, zoom/reflow, error announcements, color contrast in print and charts. Automated axe is useful but not a WCAG/ADA certification.
6. **Security and privacy:** review CSP, dependency licenses, static asset delivery, downloads, form actions, injection risks and the site's externally hosted contact form separately.
7. **Release decision:** user review of visuals/copy; merge only after release gates pass and explicit release approval. Verify GitHub Pages/deployment settings and certificate before announcing a working new route.
8. **Post-deploy SEO:** confirm live route, canonical, response code, content indexing eligibility, sitemap and homepage/Insights paths; inspect Google Search Console, then request indexing. Record baseline impressions, queries, clicks and voluntary qualified inquiries. Ranking and conversion performance must be observed, not promised.

## SEO evidence boundary
A static noindex preview is not an SEO launch. Code added on a draft branch is not publicly available merely because a GitHub repository or PR is visible. Sitemap/canonical results are only evidence of correct configuration after the actual production deployment has been verified.

## Success metrics
- Financial integrity: all reconciliation tests and independent assumptions review.
- Reliability: no browser errors across eight workspaces and both 320px/390px narrow layouts.
- Accessibility: no known blockers in automated and manual checks; accurate disclosure of actual conformance status.
- Organic: qualified impressions and clicks for calculator-specific search intent, not merely indexed page count.
- Conversion: voluntary, privacy-conscious qualified inquiries attributed to calculator discovery, not scraped or tracked financial inputs.

**Software:** static HTML/CSS/JS with locally hosted licensed uPlot and Lucide assets. No paid hosting, analytics, or UI subscription required by the new branch.
