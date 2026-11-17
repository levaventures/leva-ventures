# Leva V2: first-party campaign counting Worker (NOT DEPLOYED)

Status: tested code only, no authenticated Cloudflare account, zone or route changes made.

## Objective

Optionally replace the five current **working, static GitHub Pages redirects** at:
- https://levaventures.com/go/linkedin/
- https://levaventures.com/go/sior/
- https://levaventures.com/go/cre-news/
- https://levaventures.com/go/crej/
- https://levaventures.com/go/partners/

with HTTP 302 redirects that count **only** one event consisting of [fixed campaign name, numeric 1] per eligible GET request. They send visitors to the clean destination `https://levaventures.com/tools/financing-intelligence/` with no URL parameters. Only the five known routes are accepted. Non-GET methods, mismatched host/protocol and unknown paths are rejected and not counted.

No cookies, IP addresses, visitor/session/device IDs, financial inputs, referrer headers, raw URL paths or query strings are written. No visitor link to an inquiry is recorded. Counts reflect **raw GET requests**, including crawlers, social previews and repeat visits; **not confirmed humans, unique visitors or financing leads**.

## Before any deployment

1. Confirm that the `levaventures.com` DNS zone is active under Cloudflare and its DNS record is orange-cloud proxied. The public website is hosted on GitHub Pages, which must remain unaffected.
2. Confirm access to the Cloudflare dashboard for the owner, account Free plan, Workers Free plan, Analytics Engine availability and any current usage/pricing limits. Do not enroll in paid services or add billing information.
3. Confirm no existing Worker, redirect/Page rule, or security configuration conflicts on `levaventures.com/go/*`.
4. Review the source, all tests and the five current public links. Have an authorized owner explicitly approve the production route attachment.
5. Install Cloudflare Wrangler in an authorized local environment; authenticate securely in Cloudflare (never paste credentials into a chat or code repository).
6. From `campaign-edge/`, perform a dry run and inspect results, then deploy the Worker **without a route**. `workers_dev = false` and omitted `routes` deliberately prevent accidental public activation.
7. After separate approval, attach **only** `levaventures.com/go/*` to `leva-v2-campaign-counter` in Cloudflare Workers > Settings > Domains & Routes. Ensure `www` and other hostnames are not affected.
8. Immediately smoke-test all five paths, an unknown `/go/` path, the homepage, original calculator, V2, and sitemap. Confirm a real HTTP 302 + clean Location header for known paths. Invalidate or roll back the route at once on error—the static fallback pages remain published on GitHub Pages.
9. Verify the dataset `leva_v2_campaign_requests` exists and a small number of test GETs appear; then begin reporting observed counts, explicitly labeling them "requests" rather than people or leads.

## Rollback

Remove the `levaventures.com/go/*` route from the Worker in the Cloudflare dashboard; GitHub Pages automatically resumes serving the existing static redirect pages. No GitHub code deployment is needed for rollback. Do not delete the static fallback pages.

## Read-only counts query (once dataset exists)

Use Cloudflare Analytics Engine SQL API with an authorized token kept **out of GitHub**:

```sql
SELECT blob1 AS channel, SUM(_sample_interval) AS requests
FROM leva_v2_campaign_requests
WHERE timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY channel
ORDER BY requests DESC
LIMIT 10
```

Workers Analytics Engine can sample data; `SUM(_sample_interval)` compensates for sampling, and high-volume totals may be estimates. No user identity is captured or reconstructed.

## Sources and billing caution

Cloudflare documentation:
- Workers routes: https://developers.cloudflare.com/workers/configuration/routing/routes/
- Analytics Engine write binding: https://developers.cloudflare.com/analytics/analytics-engine/get-started/
- Analytics Engine SQL query: https://developers.cloudflare.com/analytics/analytics-engine/sql-api/
- Analytics Engine pricing: https://developers.cloudflare.com/analytics/analytics-engine/pricing/

As of the documented Free tier, Analytics Engine includes 100,000 datapoint writes/day and 10,000 read queries/day; **verify account-specific current terms before enabling**. Never guarantee zero cost or analytics availability without checking. Worker request quotas also apply.

## Conversion limitation

These aggregate request counts don't prove source-to-inquiry conversion. Use Formspree's voluntary submitted inquiries and optional `referral_source` selections separately; do not join individual sessions or infer which campaign generated a given inquiry. Keep public URLs parameter-free.
