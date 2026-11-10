#!/usr/bin/env python3
"""Validate SEO publication invariants without external services or personal data."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET
import json, math, re

ROOT=Path(__file__).resolve().parents[1]
SLUGS=(
    "commercial-real-estate-refinance-gap-analysis",
    "value-add-commercial-real-estate-acquisition-financing",
    "private-capital-real-estate-development-financing",
)
class SEOParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.anchors=[]
        self.canonicals=[]
        self.headings=[]
        self.images=[]
        self._cur=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="a": self.anchors.append(a.get("href",""))
        if tag=="link" and a.get("rel")=="canonical": self.canonicals.append(a.get("href",""))
        if tag=="img": self.images.append(a)
        if tag in ("h1","h2"): self.headings.append(tag)

urls=["https://levaventures.com/insights/"+slug+"/" for slug in SLUGS]
for slug,url in zip(SLUGS,urls):
    path=ROOT/"insights"/slug/"index.html"
    text=path.read_text("utf-8")
    p=SEOParser();p.feed(text)
    assert p.canonicals==[url],f"{slug}: canonical mismatch"
    assert p.headings.count("h1")==1,f"{slug}: expected one h1"
    assert "<meta name=\"description\"" in text,slug
    assert 'property="og:title"' in text,slug
    assert '\"@type\":\"BlogPosting\"' in text,slug
    assert '\"@type\":\"BreadcrumbList\"' in text,slug
    assert url in text,slug
    assert 'href="/tools/commercial-real-estate-loan-calculator/"' in text,slug
    assert 'href="/#contact"' in text,slug
    assert "Illustrative" in text or "hypothetical" in text.lower(),slug
    for a in p.anchors:
        if a.startswith("/insights/") and a.endswith("/"):
            assert (ROOT/a.lstrip("/")/"index.html").is_file(),f"{slug}: missing internal article {a}"
        if a.startswith("/tools/") and a.endswith("/"):
            assert (ROOT/a.lstrip("/")/"index.html").is_file(),f"{slug}: missing tool {a}"
    assert all('alt' in im for im in p.images),f"{slug}: missing img alt"

hub=(ROOT/"insights"/"index.html").read_text("utf-8")
calc=(ROOT/"tools"/"commercial-real-estate-loan-calculator"/"index.html").read_text("utf-8")
for slug in SLUGS:
    assert f'href="/insights/{slug}/"' in hub
    assert f'href="/insights/{slug}/"' in calc

sitemap=ET.fromstring((ROOT/"sitemap.xml").read_text("utf-8"))
ns="{http://www.sitemaps.org/schemas/sitemap/0.9}"
sitemap_urls=[x.text for x in sitemap.findall(f"{ns}url/{ns}loc")]
assert len(sitemap_urls)==12 and len(set(sitemap_urls))==12
assert "https://levaventures.com/tools/financing-intelligence/" in sitemap_urls
assert "https://levaventures.com/tools/commercial-real-estate-loan-calculator/" in sitemap_urls
for u in urls: assert u in sitemap_urls,u

rss=ET.fromstring((ROOT/"insights"/"feed.xml").read_text("utf-8"))
entries=rss.findall("./channel/item")
assert len(entries)==7
feed_urls=[e.findtext("link") for e in entries]
for u in urls: assert u in feed_urls,u

# Refinance scenario exact arithmetic: $8m, $520k NOI,
# 65% LTV, 9% debt yield, 1.25 DSCR at 7.50% / 25 years.
m=.075/12; annual_factor=12*m/(1-(1+m)**(-300))
cap_dscr=520000/(1.25*annual_factor)
cap_ltv=8000000*.65
cap_yield=520000/.09
gap=5600000+180000-min(cap_dscr,cap_ltv,cap_yield)
assert abs(cap_dscr-4691079.9084)<2
assert abs(gap-1088920.0916)<2

# Budget examples.
assert sum([6.8,1.0,.25,.45,.3])==8.8
assert abs(sum([2.4,9.5,1.3,.85,.95])-15)<1e-9
print("PASS: three articles, links, canonical tags, schemas, sitemap, RSS, and independent scenario math")
