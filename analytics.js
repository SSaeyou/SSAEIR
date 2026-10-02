"use strict";

(() => {
  const config = window.SSAEIR_CONFIG || {};
  const validToken = /^[a-f0-9]{32}$/i.test(config.cloudflareToken || "");
  const production = config.siteOrigin && location.origin === config.siteOrigin && location.protocol === "https:";
  if (!production || !config.analyticsReady || !validToken) return;

  const script = document.createElement("script");
  script.type = "module";
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.setAttribute("data-cf-beacon", JSON.stringify({ token: config.cloudflareToken, spa: false }));
  document.body.append(script);
})();
