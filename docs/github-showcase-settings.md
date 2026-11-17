# GitHub repository discovery settings — owner checklist

The repository is a **public website deployment repository**, not an open-source project. Do **not** change the repository's visibility, branch, deployment settings or licensing as part of showcase setup.

GitHub repository **Topics** and **About** are repository settings, not ordinary Markdown files. They must be saved in the repository interface by an authorized account with write access. This file records the intended values and provides a reproducible checklist; it **does not claim the topics are already applied**.

## Topics (seven)

`commercial-real-estate`, `financial-calculator`, `dscr`, `refinancing`, `debt-yield`, `loan-calculator`, `real-estate-finance`

## About description

Free CRE Financing Intelligence Desk: DSCR, LTV, debt yield, refinance gap and capital stack modeling | Leva Ventures

## Website

https://levaventures.com/tools/financing-intelligence/

## How to save the Topics and About fields

1. Open the [Leva Ventures GitHub repository](https://github.com/levaventures/leva-ventures).
2. Above or beside the right-hand **About** section, click the **gear / edit** control.
3. Enter the description, the clean V2 website URL and the seven topics from above. Make sure each topic is its own selected token.
4. Save the updated settings; reload the public repository to confirm they are visible.
5. Do **not** add a repository-wide MIT or Apache license. Do not toggle repository visibility or GitHub Pages as part of this task.

## Screenshot review

An existing GitHub Actions workflow captures desktop/mobile screenshots into the `leva-desk-v2-visual-review` artifact for a limited retention period. Those images are generated from the **V2 review preview**, not guaranteed pixel-identical to the latest production deployment.

If owner-approved, a future purely presentational change can store **verified, freshly captured production screenshots** under a public documentation asset folder. Do not upload a simulated or older screenshot labeled as production. Screenshots should omit any private financial assumptions, contact forms, or client data.

## Reminder

The purpose of topics is **GitHub discovery**, not a promised search-ranking effect. Rights and third-party license exceptions are described in [NOTICE.md](../NOTICE.md).
