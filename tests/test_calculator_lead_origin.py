#!/usr/bin/env python3
"""Direct-link and no-leaked-calculator-inputs contract; no live form submissions."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
site=(root/"assets/leva-site.js").read_text("utf-8")
home=(root/"index.html").read_text("utf-8")
v2=(root/"tools/financing-intelligence/index.html").read_text("utf-8")
original=(root/"tools/commercial-real-estate-loan-calculator/index.html").read_text("utf-8")
article=(root/"insights/dscr-ltv-debt-yield-commercial-loan-sizing/index.html").read_text("utf-8")
kit=(root/"marketing/financing-intelligence-distribution-kit.md").read_text("utf-8")
sitemap=(root/"sitemap.xml").read_text("utf-8")

for name,content in {"home":home,"V2":v2,"original":original,"article":article,"distribution kit":kit}.items():
    assert "source=chatgpt" not in content.lower(),name
    assert "utm_source=" not in content.lower(),name
    assert "lv_origin=" not in content.lower(),name
    assert "lv_channel=" not in content.lower(),name

assert v2.count('href="/#contact"')>=2
assert original.count('href="/#contact"')>=2
assert 'href="/#contact"' in article
assert "campaign-links.js" not in v2
assert not (root/"tools/financing-intelligence/campaign-links.js").exists()

assert "URLSearchParams" not in site
assert "lead_origin" not in site
assert "lead_channel" not in site
assert "addEventListener('submit'" in site
assert "if (!response.ok)" in site
assert "referral_source" in site
assert "Referral Source" in home
assert "No loan amounts" not in home or "loan amounts" in home
for forbidden in ["localStorage","sessionStorage","document.cookie","sendBeacon","navigator.sendBeacon","gtag(","dataLayer.push","loanAmount","loan_amount","debtYield","capitalRequired"]:
    assert forbidden not in site,forbidden
for url in ["https://levaventures.com/tools/financing-intelligence/","https://levaventures.com/tools/commercial-real-estate-loan-calculator/"]:
    assert url in sitemap,url

print("PASS: direct public links, no campaign query strings, optional visible referral field and private calculator inputs")
