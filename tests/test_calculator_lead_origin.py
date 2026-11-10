#!/usr/bin/env python3
"""Static privacy contract regression checks; no production data or network calls."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
app = (root / "assets" / "leva-site.js").read_text(encoding="utf-8")
calc = (root / "tools" / "commercial-real-estate-loan-calculator" / "index.html").read_text(encoding="utf-8")
home = (root / "index.html").read_text(encoding="utf-8")
sitemap = (root / "sitemap.xml").read_text(encoding="utf-8")

assert calc.count('href="/?lv_origin=calculator#contact"') >= 1
assert 'new URLSearchParams(window.location.search)' in app
assert "allowedOrigins = new Set(['calculator', 'financing_desk_v2', 'debt_sizing_article'])" in app
assert "allowedChannels = new Set(" in app
assert "addFixedLabel('lead_origin', origin)" in app
assert "addFixedLabel('lead_channel', channel)" in app
assert "form.appendChild(field)" in app
assert "if (response.ok)" not in app  # success path checks !response.ok
assert "if (!response.ok)" in app
assert "if (success)" in app
assert "source label" in " ".join(home.lower().replace("&ldquo;", "").replace("&rdquo;", "").split())
assert "loan amounts" in home
assert "https://levaventures.com/tools/commercial-real-estate-loan-calculator/" in sitemap

# Provenance must remain independent of calculator's state or user's financial inputs.
for forbidden in ["localStorage", "sessionStorage", "document.cookie", "sendBeacon", "navigator.sendBeacon", "gtag(", "dataLayer.push", "loanAmount", "loan_amount", "dscr", "debtYield", "income", "capitalRequired"]:
    assert forbidden not in app, f"Unexpected telemetry/input reference in form handler: {forbidden}"

campaign=(root/"tools"/"financing-intelligence"/"campaign-links.js").read_text("utf-8")
v2=(root/"tools"/"financing-intelligence"/"index.html").read_text("utf-8")
assert '<script src="./campaign-links.js" defer></script>' in v2
assert 'new URLSearchParams(window.location.search)' in campaign
assert 'params.get("utm_source")' in campaign
assert 'lv_channel=' in campaign
assert 'a[href="/?lv_origin=financing_desk_v2#contact"]' in campaign
assert 'Object.prototype.hasOwnProperty.call(allow, source)' in campaign
for forbidden in ["localStorage", "sessionStorage", "document.cookie", "sendBeacon", "fetch(", "XMLHttpRequest", "document.referrer", "loanAmount", "loan_amount", "dscr", "debtYield", "capitalRequired"]:
    assert forbidden not in campaign, "unexpected data sink: "+forbidden
print("PASS: original calculator and V2 allowlisted attribution on voluntary form submission; no financial data plumbing")
