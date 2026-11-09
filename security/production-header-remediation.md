# Leva Ventures — Production HTTP Security Header Remediation

**Prepared:** 2026-11-09. **Status:** GitHub review only; no DNS changes, Cloudflare account changes, website deployment or live server-header changes have been made.

## Observed evidence

Owner-provided 2026-11-09 screenshots:
- SecurityHeaders.com for `https://levaventures.com/` returned **F**, reporting no HTTP response headers for Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy or Permissions-Policy.
- Qualys SSL Labs report for `www.levaventures.com` showed multiple GitHub Pages IPv4/IPv6 endpoints graded **B**.
- Repository `CNAME` is `levaventures.com`. GitHub Pages origins do not offer site-owner custom response-header configuration from HTML files.
- Pages already contain **HTML meta CSP** and referrer directives; these do not count as server-supplied headers. **frame-ancestors** is ignored when delivered in HTML meta, so server-side protections matter.
- Current production site uses Cloudflare Turnstile and Formspree on the homepage. Existing public calculator exposes an **iframe sharing option**. Security policy must not break those features.
- We do **not** know the registrar, current DNS authority, whether the domain is already on Cloudflare, or whether changes there are authorized. Do not assume the owner has access to Cloudflare.

## Root cause and actionable remedy

GitHub Pages cannot serve these custom HTTP response headers through a standard `_headers` file. Merely committing a `_headers` file or more `<meta>` tags to this GitHub Pages repo will **not** correct the SecurityHeaders.com F.

The preferred practical fix is a trusted CDN/reverse proxy with control over **actual HTTPS response headers**. Cloudflare's free plan is a candidate; availability of specific features must be checked in the account. `security/cloudflare-response-header-rules.json` is a reviewed **starter manifest** for Cloudflare Response Header Transform Rules, not a file that GitHub Pages can automatically load.

### Before touching DNS, HTTPS, or certificates

1. Identify the **current DNS provider, registrar, authoritative nameservers, and GitHub Pages custom domain**. Export a complete DNS-zone snapshot including root/www A/AAAA/CNAME, MX, TXT (SPF/DKIM/DMARC), any verification entries, CAA, and third-party subdomains. **Do not change nameservers or email records casually.**
2. Determine whether Cloudflare already manages the domain. If not, add the domain to a Cloudflare account on a free plan *only after* confirming the imported records against the current zone; cutover should be separately approved.
3. Confirm compatibility with the existing GitHub Pages certificate and custom domain, using Cloudflare's official current guidance for GitHub Pages setups. Avoid a Cloudflare mode that creates redirect loops or weakens end-to-end HTTPS. Test root and `www` independently.
4. Preserve search canonical URLs, redirects, Google Search Console DNS verification, sitemap and social previews. Don't move the website to a different host merely to achieve a higher scanner grade.

### Suggested header rollout (on edge HTTPS responses)

**Base, non-calculator HTML routes:**
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `X-Frame-Options: DENY`
- Response-header `Content-Security-Policy` supplied via edge policy (see manifest)

**Original embeddable calculator URL:** retain its deliberate third-party iframe capability. **Do not set X-Frame-Options DENY or CSP frame-ancestors 'none' for that page**, because the existing share page explicitly offers an iframe embed. This is a product/security tradeoff requiring owner awareness; a future opt-in same-origin-only mode would require removing the embedding feature first.

**CSP:** the existing homepage loads Cloudflare Turnstile and submits an optional contact form to Formspree, while other pages use Google Fonts. The manifest permits these narrowly and preserves existing static CSS and JavaScript (including existing inline CSS) so legitimate site behavior is not blocked. Site-specific future additions must be reviewed. Unlike HTML CSP meta, a **response-header CSP can enforce frame-ancestors**. Test browser console for violations on home, Insights, calculator, share page and accessibility page before enforcement. Consider `Content-Security-Policy-Report-Only` during initial browser checks.

**HSTS:** do not enable long-lived HSTS or `includeSubDomains` until all intended hostnames are verified as HTTPS-functional. After first confirming valid certificates and redirect behavior for apex/www, introduce a short conservative `Strict-Transport-Security: max-age=300` on both hostnames (if supported by edge configuration), test, then lengthen deliberately to `max-age=86400` and ultimately `max-age=31536000` only after a stable observation period. No `preload` or `includeSubDomains` by default.

**TLS score B:** separate from headers grade F. Inspect the **detailed SSL Labs results** for protocol support, key-exchange, certificate chain, and grade-limiting factors. The screenshot only gives a B for GitHub Pages IPs; it does **not** establish which specific TLS setting caused that B. A CDN might improve TLS grade, but **no A grade is guaranteed**. Never disable TLS verification or use Flexible SSL as a shortcut.

### Practical Cloudflare implementation sequence

- If Cloudflare controls the domain, go to its zone dashboard; locate **Rules → Transform Rules → Modify Response Header**, or the relevant current equivalent. Create/edit **route-specific** rules reflecting the manifest. Use a controlled test first, then publish after validation.
- HTTP header security must be applied on *HTTPS origin responses*. Don't assume a `.json` manifest committed to GitHub is active.
- Configure HSTS separately under **SSL/TLS → Edge Certificates → HTTP Strict Transport Security**, subject to verified hostname coverage. Account menus vary.
- Publish only after confirming homepage interactions, Turnstile verification, Formspree submission, Insights navigation, calculator results and its iframe on a neutral test page, mobile navigation, and no browser console CSP violations.
- Retest **both** `https://levaventures.com/` and `https://www.levaventures.com/` with SecurityHeaders.com and SSL Labs, plus `/tools/commercial-real-estate-loan-calculator/` for intentional iframe exceptions. Save observed response headers and dates.
- A lower grade on the intentionally embeddable calculator does not necessarily mean its security is worse; frame-denial is a deliberate functionality tradeoff. HSTS and the remaining headers should still be configured.

## No-go conditions

Do not perform live DNS changes, activate proxying, modify certificates, enforce blanket CSP, or enable long HSTS until DNS/email routing is inventoried and the owner authorizes that separate action. Do not claim the live F is fixed until repeat external scans show the actual response headers. Do not claim a scanner grade establishes comprehensive vulnerability resistance.

## Current repository files

- `security/cloudflare-response-header-rules.json`: example edge rules and route exceptions; **manual integration only**.
- `security/security-header-policy.test.js`: automated configuration assertions.
- Existing site pages and calculator source are **unchanged** by this fix branch.

## Follow-up needed from website owner

**Which service currently manages the DNS/nameservers for `levaventures.com` (Cloudflare, GoDaddy, Namecheap, Squarespace, or another registrar)?** The domain registrar may differ from the authoritative DNS provider. If unknown, provide a screenshot of the domain's **Nameservers** page without account numbers or secrets. This determines whether we can configure the edge headers directly or need a carefully planned nameserver migration.
