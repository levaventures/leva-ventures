# Search Console verification and privacy-first measurement

Updated: 2026-11-05. Site: https://levaventures.com/

## Verified public technical baseline

- https://levaventures.com/robots.txt is accessible, permits indexing, and links the XML sitemap.
- https://levaventures.com/sitemap.xml exposes **eight** current canonical URLs.
- All eight listed URLs were publicly accessible and displayed matching canonical URLs when checked 2026-11-05.
- https://www.levaventures.com/ resolves to the canonical https://levaventures.com/.
- Existing IndexNow GitHub workflow successfully notified IndexNow (HTTP 202 means accepted, not indexed).

These public checks do **not** establish ownership in Google Search Console, Google indexing, rankings or traffic.

## Google Search Console (GSC): authenticate and verify

No Google account is connected to an authenticated Search Console session for this project. Ownership and indexing reports cannot be inspected until the site owner signs in.

1. Sign into https://search.google.com/search-console/ with the Google account authorized to manage Leva Ventures.
2. First inspect the property selector for an already verified `https://levaventures.com/` **URL-prefix** property or a `levaventures.com` **Domain** property. Do not create a duplicate if already verified.
3. For a new Domain property, Google will provide a unique TXT DNS verification record. Enter it through the domain's actual DNS host and then click Verify in Search Console. **Do not publish or guess a token**.
4. Alternatively, use URL-prefix property `https://levaventures.com/`. Choose the HTML verification file option and place the **exact Google-issued file** at the repository root, preserving filename and contents, then deploy. A Google-issued meta tag can also be added to the homepage if available. Do not use a guessed value.
5. Submit the exact sitemap: `https://levaventures.com/sitemap.xml` (the property UI may accept `sitemap.xml`).
6. Inspect the calculator URL with URL Inspection: `https://levaventures.com/tools/commercial-real-estate-loan-calculator/`. Review *Page indexing*, Google-selected canonical, last crawl, and live test. Request indexing if appropriate; it is not guaranteed.
7. Inspect the eight sitemap URLs for indexing status and Pages → reasons for exclusions. Compare performance clicks, impressions, queries, CTR and average position after data accrues. Avoid treating third-party `site:` queries as authoritative indexing status.

Do not provide your Google password, recovery codes, ID or bank details to an agent. Search Console aggregate performance does not require adding third-party tracking code to the website.

## Measurement contracts — what is collected

**Organic search:** use Google's Search Console aggregate clicks, impressions, and query/page data, not individual user identities.

**Calculator visits:** optional Cloudflare Web Analytics can count pageviews after the site owner obtains its unique site token in their Cloudflare account. Currently no Cloudflare token was provided or added in this change. Do not invent one or switch on other vendors' tracking. Consult Cloudflare's current documentation and update the site's privacy disclosure before activating. Pageview products may still process connection metadata (e.g. IP) even without cookies, so do not promise absolute zero-PII processing.

**Actual voluntary opportunity submissions:** continue counting successful Formspree submissions in the existing Formspree dashboard. The website already submits a form only when the visitor deliberately completes its fields and passes the Turnstile check. The backend/Formspree response must be HTTP successful before the on-page Thank You display. Never measure raw submit clicks as confirmed leads.

**Which inquiries came from the calculator:** two calculator CTA links now use `/?lv_origin=calculator#contact`. On the homepage, existing `assets/leva-site.js` checks for the **exact** marker `lv_origin=calculator` and adds a hidden field `lead_origin=calculator` to the same Formspree payload *only when the user voluntarily submits that form*. It ignores all other values. It does not forward URL parameters to Formspree, record source-page paths, use cookies, or identify users. No calculator values, sensitivity assumptions, results, DSCR, LTV or debt yield are accessed. The homepage privacy notice discloses the fixed label.

Two basic dashboard metrics are enough initially:
- Total completed submissions = successful Formspree records in the period.
- Calculator-origin completed submissions = those successful records whose `lead_origin` is `calculator`. Direct homepage forms have no such field.

**Caveat:** this is source-label attribution, not a complete multi-touch conversion model. Someone who visits the calculator, navigates away, then returns directly may lack the label. It is intentionally nonpersistent for privacy.

## Testing — no sensitive information

Run the automated static contract check in `.github/workflows/leva-privacy-attribution-check.yml`. For manual UI smoke testing, visit the calculator and follow its Submit Opportunity link; verify the homepage destination includes `lv_origin=calculator#contact`. Confirm the page still renders and calculator works. Do **not** submit fabricated user information to production Formspree to "test" attribution; use Formspree's authorized testing interface or a consented internal business inquiry when needed. The code creates no analytics requests unless a real form is sent.

## Pending external configuration

- **Google Search Console:** authenticated property verification (requires the site's authorized Google account and/or DNS credentials). Not performed.
- **Google indexing diagnostics:** requires verified property access and subsequent inspection. Not performed.
- **Cloudflare Web Analytics:** optional token issued by user's analytics account, with privacy review. Not installed; no pageview collection started.
- **Formspree reporting:** existing secure dashboard access needed to count completed submissions; website does not expose these to clients or agents.
- Do not add Apollo visitor tracking, GA4, personal identifiers, loan input logging, full URLs or raw form payloads to analytics without a separate privacy decision.

References:
- https://support.google.com/webmasters/answer/9008080
- https://support.google.com/webmasters/answer/7451001
- https://support.google.com/webmasters/answer/9012289
- https://developers.cloudflare.com/web-analytics/
