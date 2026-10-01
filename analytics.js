"use strict";

(() => {
  const config = window.SSAEIR_CONFIG || {};
  const consentKey = "ssaeir-analytics-consent";
  const validId = /^G-[A-Z0-9]+$/.test(config.measurementId || "");
  const production = Boolean(config.siteOrigin && location.origin === config.siteOrigin);
  const enabled = validId && production && config.privacyReady === true && location.protocol === "https:";
  let granted = false;

  function safeReferrer() {
    try {
      const url = new URL(document.referrer);
      return /^https?:$/.test(url.protocol) ? url.origin + "/" : "";
    } catch {
      return "";
    }
  }

  function startAnalytics() {
    if (!enabled || granted) return;
    granted = true;
    const safePage = location.origin + location.pathname;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", config.measurementId, {
      send_page_view: false,
      page_location: safePage,
      page_referrer: safeReferrer(),
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: safePage,
      page_referrer: safeReferrer()
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(config.measurementId);
    script.onerror = () => { granted = false; };
    document.head.append(script);
  }

  function readChoice() {
    try { return localStorage.getItem(consentKey); }
    catch { return null; }
  }

  function choose(choice) {
    try { localStorage.setItem(consentKey, choice); } catch { /* 저장 불가 시 현재 탭에만 적용 */ }
    document.querySelector("#analytics-consent").hidden = true;
    document.querySelector("#consent-settings").hidden = false;
    if (choice === "granted") startAnalytics();
    else if (granted) location.reload();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!enabled) return;
    document.querySelector("#consent-accept").addEventListener("click", () => choose("granted"));
    document.querySelector("#consent-reject").addEventListener("click", () => choose("denied"));
    document.querySelector("#consent-settings").addEventListener("click", () => {
      document.querySelector("#analytics-consent").hidden = false;
    });
    const choice = readChoice();
    if (choice === "granted") startAnalytics();
    else if (choice === "denied") document.querySelector("#consent-settings").hidden = false;
    else document.querySelector("#analytics-consent").hidden = false;
  });
})();
