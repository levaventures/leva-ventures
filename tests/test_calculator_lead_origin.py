#!/usr/bin/env python3
"""Static privacy contract regression checks; no production data or network calls."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
app = (root / "assets" / "leva-site.js").read_text(encoding="utf-8")
calc = (root / "tools" / "commercial-real-estate-loan-calculator" / "index.html").read_text(encoding="utf-8")
home = (root / "index.html").read_text(encoding="utf-8")
sitemap = (root / "sitemap.xml").read_text(encoding="utf-8")

assert calc.count('href="/?lv_origin=calculator#contact"') >= 1
assert 'new URLSearchParams(window.location.search).get(\'lv_origin\')' in app
assert "origin === 'calculator'" in app
assert "originField.name = 'lead_origin'" in app
assert "originField.value = 'calculator'" in app
assert "form.appendChild(originField)" in app
assert "if (response.ok)" not in app  # success path checks !response.ok
assert "if (!response.ok)" in app
assert "if (success)" in app
assert "source label" in home.lower()
assert "No loan amounts" in home
assert "https://levaventures.com/tools/commercial-real-estate-loan-calculator/" in sitemap

# Provenance must remain independent of calculator's state or user's financial inputs.
for forbidden in ["localStorage", "sessionStorage", "document.cookie", "sendBeacon", "navigator.sendBeacon", "gtag(", "dataLayer.push", "loanAmount", "loan_amount", "dscr", "debtYield", "income", "capitalRequired"]:
    assert forbidden not in app, f"Unexpected telemetry/input reference in form handler: {forbidden}"

print("PASS: fixed calculator-origin label only on voluntary form submission; no financial data plumbing")
