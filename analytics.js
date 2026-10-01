"use strict";

(() => {
  const config = window.SSAEIR_CONFIG || {};
  const allowedEvents = new Set([
    "request_start", "request_complete", "copy_success", "image_download_triggered"
  ]);
  const consentKey = "ssaeir-analytics-consent";
  const validId = /^G-[A-Z0-9]+$/.test(config.measurementId || "");
  const production = Boolean(config.siteOrigin && location.origin === config.siteOrigin);
  const enabled = validId && production && config.privacyReady === true && location.protocol === "https:";
  let granted = false;

  function seoulDate(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type).value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  }

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

  function track(name) {
    if (enabled && granted && allowedEvents.has(name) && typeof window.gtag === "function") {
      window.gtag("event", name, {
        page_location: location.origin + location.pathname,
        page_referrer: safeReferrer()
      });
    }
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

  async function loadPublicStats() {
    try {
      const response = await fetch("./public-stats.json", {cache: "no-store"});
      if (!response.ok) return;
      const data = await response.json();
      if (!Number.isSafeInteger(data.totalSessions) || data.totalSessions < 0) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.statsStartDate || "")) return;
      const asOf = new Date(data.asOf);
      if (!Number.isFinite(asOf.getTime())) return;
      const asOfDate = seoulDate(asOf);
      if (data.statsStartDate > asOfDate) return;
      document.querySelector("#total-sessions").textContent = data.totalSessions.toLocaleString("ko-KR");
      document.querySelector("#stats-as-of").textContent =
        `${data.statsStartDate}부터 · ${new Intl.DateTimeFormat("ko-KR", {
          timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric",
          hour: "2-digit", minute: "2-digit"
        }).format(asOf)} 기준`;
      if (asOfDate === seoulDate(new Date()) &&
          Number.isSafeInteger(data.todayUsers) && data.todayUsers >= 0) {
        document.querySelector("#today-users").textContent = data.todayUsers.toLocaleString("ko-KR");
        document.querySelector("#today-stat").hidden = false;
      }
      document.querySelector("#public-stats").hidden = false;
    } catch {
      // 통계 파일이 없거나 읽지 못해도 작성 기능은 계속 동작합니다.
    }
  }

  window.SSAEIR_ANALYTICS = Object.freeze({track});
  document.addEventListener("DOMContentLoaded", () => {
    loadPublicStats();
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
