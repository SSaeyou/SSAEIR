"use strict";

(() => {
  const config = window.SSAEIR_CONFIG || {};
  const login = document.querySelector("#admin-login");
  const logout = document.querySelector("#admin-logout");
  const status = document.querySelector("#admin-status");
  const report = document.querySelector("#admin-report");
  const period = document.querySelector("#report-period");
  const clientId = config.oauthClientId || "";
  const propertyId = config.gaPropertyId || "";
  const ready = /^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/.test(clientId) &&
    /^[0-9]+$/.test(propertyId) && config.siteOrigin === location.origin &&
    location.protocol === "https:";
  let tokenClient = null;
  let accessToken = "";
  let requestVersion = 0;
  let aborter = null;

  function setStatus(message) { status.textContent = message; }
  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed.toLocaleString("ko-KR") : "0";
  }
  function metric(result, index = 0) {
    return result.rows?.[0]?.metricValues?.[index]?.value || "0";
  }

  async function runReport(body, signal) {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal,
        cache: "no-store"
      }
    );
    if (!response.ok) {
      const error = new Error(response.status === 403 ? "권한 없음" : "조회 실패");
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async function loadReport() {
    if (!accessToken) return;
    aborter?.abort();
    aborter = new AbortController();
    const version = ++requestVersion;
    report.hidden = true;
    setStatus("통계를 조회하고 있습니다.");
    const dateRanges = [{startDate: period.value, endDate: "today"}];
    try {
      const [totals, events, traffic] = await Promise.all([
        runReport({dateRanges, metrics: [
          {name: "totalUsers"}, {name: "sessions"}, {name: "screenPageViews"}
        ]}, aborter.signal),
        runReport({dateRanges, dimensions: [{name: "eventName"}],
          metrics: [{name: "eventCount"}], limit: "100"}, aborter.signal),
        runReport({dateRanges, dimensions: [{name: "sessionSourceMedium"}],
          metrics: [{name: "sessions"}], limit: "10",
          orderBys: [{metric: {metricName: "sessions"}, desc: true}]}, aborter.signal)
      ]);
      if (version !== requestVersion || !accessToken) return;
      document.querySelector("#admin-users").textContent = number(metric(totals, 0));
      document.querySelector("#admin-sessions").textContent = number(metric(totals, 1));
      document.querySelector("#admin-views").textContent = number(metric(totals, 2));
      const counts = new Map((events.rows || []).map((row) => [
        row.dimensionValues?.[0]?.value, row.metricValues?.[0]?.value
      ]));
      [["request_start", "#event-start"], ["request_complete", "#event-complete"],
        ["copy_success", "#event-copy"], ["image_download_triggered", "#event-image"]]
        .forEach(([eventName, selector]) => {
          document.querySelector(selector).textContent = number(counts.get(eventName) || "0");
        });
      const table = document.querySelector("#traffic-rows");
      table.replaceChildren();
      for (const row of traffic.rows || []) {
        const tr = document.createElement("tr");
        const source = document.createElement("td");
        const sessions = document.createElement("td");
        source.textContent = row.dimensionValues?.[0]?.value || "(알 수 없음)";
        sessions.textContent = number(row.metricValues?.[0]?.value || "0");
        tr.append(source, sessions);
        table.append(tr);
      }
      if (!table.childElementCount) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 2;
        td.textContent = "해당 기간의 유입 데이터가 없습니다.";
        tr.append(td);
        table.append(tr);
      }
      report.hidden = false;
      setStatus("조회가 완료되었습니다.");
    } catch (error) {
      if (version !== requestVersion || error.name === "AbortError") return;
      if (error.status === 401) {
        accessToken = "";
        logout.hidden = true;
        setStatus("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      } else if (error.status === 403) {
        setStatus("이 Google 계정에는 SSAEIR GA4 속성의 조회 권한이 없습니다.");
      } else {
        setStatus("GA4 데이터를 가져오지 못했습니다. 연결과 권한을 확인해 주세요.");
      }
    }
  }

  if (!ready) {
    setStatus("관리자 연결 설정 전입니다. 사이트 작성 기능은 정상적으로 사용할 수 있습니다.");
    return;
  }

  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.onload = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      callback: (response) => {
        if (!response?.access_token) {
          setStatus("Google 로그인을 완료하지 못했습니다.");
          return;
        }
        accessToken = response.access_token;
        logout.hidden = false;
        loadReport();
      }
    });
    login.disabled = false;
    setStatus("소유자 Google 계정으로 로그인해 주세요.");
  };
  script.onerror = () => setStatus("Google 로그인 기능을 불러오지 못했습니다.");
  document.head.append(script);

  login.addEventListener("click", () => tokenClient?.requestAccessToken());
  logout.addEventListener("click", () => {
    requestVersion++;
    aborter?.abort();
    accessToken = "";
    report.hidden = true;
    logout.hidden = true;
    setStatus("조회가 종료되었습니다. 다시 보려면 Google 계정으로 로그인해 주세요.");
  });
  period.addEventListener("change", loadReport);
})();
