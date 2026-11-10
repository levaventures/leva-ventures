/* Optional attribution for voluntary V2 inquiry clicks.
   Do not read or transmit calculator inputs; this module makes no requests,
   creates no visitor identifiers and uses no browser storage. */
(function () {
  "use strict";
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const allow = Object.freeze({
    linkedin: "linkedin",
    sior: "sior",
    cre_news_today: "cre_news_today",
    crej: "crej",
    partner_newsletter: "partner_newsletter",
    industry_referral: "industry_referral",
    organic_search: "organic_search"
  });
  if (!source || !Object.prototype.hasOwnProperty.call(allow, source)) return;
  for (const link of document.querySelectorAll('a[href="/?lv_origin=financing_desk_v2#contact"]')) {
    link.setAttribute("href", "/?lv_origin=financing_desk_v2&lv_channel=" + allow[source] + "#contact");
  }
})();
