# Leva Financing Intelligence Desk V2 — Access-gated Cloudflare Pages staging

**Status: NOT DEPLOYED.** Separate project, no custom domain, no public SEO route.
This runbook deliberately does not affect `levaventures.com`, GitHub Pages,
existing public calculator, or Cloudflare DNS/response header rules.

## Artifacts
GitHub Actions `Financing Intelligence Desk V2 Review` produces two separate
upload ZIPs. They must **not** be confused:
- `leva-v2-01-public-placeholder.zip`: harmless production default site; no V2 app.
- `leva-v2-02-protected-preview.zip`: functional V2 desk, hub, shared models and assets.
- `v2-staging-manifest.json`: hashes/sizes for release traceability.

## Safe manual setup (Cloudflare Free + Pages)
1. In Cloudflare **Workers & Pages**, create a *new, separate* Pages project using
   **Direct Upload (drag-and-drop)**. Suggested project name:
   `leva-financing-desk-v2-staging` (may have a suffix if taken).
   Do **not** connect the existing production GitHub repository as a production
   deployment, add a custom domain, or change its DNS.
2. Upload **only** `leva-v2-01-public-placeholder.zip` as its initial
   **production** deployment. Verify the `<project>.pages.dev` root shows
   “Internal test environment” and contains no V2 financial tool.
3. BEFORE deploying V2, open the *new Pages project* → **Settings → General** →
   **Enable access policy** for **preview deployments**, and confirm a policy
   allowing ONLY the authorized reviewing email identities. Cloudflare Access
   login must actually be required. Cloudflare notes this toggle protects
   preview deployment URLs, **not** the base `<project>.pages.dev` domain.
4. In the project, **Create new deployment → Preview** (NOT Production);
   choose a branch alias such as `v2-private-review`. Upload
   `leva-v2-02-protected-preview.zip`.
5. In an incognito browser session, verify the exact newly issued preview
   URL first displays the Access login gate. Once authenticated as an authorized
   reviewer, test `/tools/financing-intelligence/` and
   `/tools/financing-intelligence/hub/`. Do NOT publicly share any URL before
   the Access gate is proven.
6. Use browser Network tools to inspect the **V2 page's actual HTTP response**:
   200, `X-Robots-Tag: noindex, nofollow, noarchive`,
   `Content-Security-Policy`, `X-Frame-Options: DENY`,
   `X-Content-Type-Options: nosniff`, permissions, and TLS certificate.
   Confirm JS/CSS/SVG assets 200, all eight workspaces, no console CSP blocks,
   no third-party financial-input network requests, CSV and print-to-PDF, and
   mobile 320/390px. Re-test keyboard, NVDA, and form error announcements.
7. If Access fails, stop and **delete the V2 preview deployment**. Do not fall
   back to relying on `noindex`, `robots.txt`, a hidden URL, or a
   branch-name alias as access controls.

## Important boundaries
- A Pages preview URL is publicly accessible by default, even with noindex.
- The base `<project>.pages.dev` default/production URL is *not*
  protected by Pages' preview-only Access toggle. It must remain the benign
  placeholder unless separately secured with Access.
- Never upload the functional V2 ZIP as the new project's Production deployment.
- GitHub Actions artifact availability is not an authenticated staging URL.
- The preview pages themselves make no financial-input network requests by design;
  browser extensions, Cloudflare Access login and browser print dialogs may
  have their own data-handling behavior.
- Cloudflare Pages `_headers` is the intended edge response-header source, but
  only a real deployed URL can verify it. Current `levaventures.com` CSP rules
  **do not carry over** automatically to the new `*.pages.dev` project.
- GitHub public repository code, if public, may be read regardless of preview
  access; this is not a confidential deal-data storage system.
- Owner approval and a separate public SEO-routing plan are still required
  before any V2 release to `levaventures.com`.

## Rollback
Remove the protected preview deployment; default benign placeholder remains.
Do not alter DNS, nameservers, HSTS, existing Pages/production website, or current
calculator links during staging review.

## Sources
- https://developers.cloudflare.com/pages/configuration/preview-deployments/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/platform/known-issues/
