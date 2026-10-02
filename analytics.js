"use strict";

(() => {
  const config = window.SSAEIR_CONFIG || {};
  const measurementId = config.measurementId || "";
  const production = location.protocol === "https:" && location.origin === config.siteOrigin;
  if (!production || !/^G-[A-Z0-9]+$/.test(measurementId)) return;

  function referrerOrigin() {
    try {
      const referrer = new URL(document.referrer);
      return /^https?:$/.test(referrer.protocol) ? referrer.origin + "/" : "";
    } catch {
      return "";
    }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  window.gtag("set", "ads_data_redaction", true);
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: location.origin + location.pathname,
    page_referrer: referrerOrigin()
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.append(script);
})();
