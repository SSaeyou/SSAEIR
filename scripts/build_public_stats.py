"""GA4의 공개 가능한 두 숫자만 GitHub Pages 산출물에 작성합니다."""
from __future__ import annotations

import json
import os
import re
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

SEOUL = ZoneInfo("Asia/Seoul")
API_SCOPE = "https://www.googleapis.com/auth/analytics.readonly"


def report(session: AuthorizedSession, property_id: str, start: str, end: str, metric: str) -> int | None:
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport"
    response = session.post(
        url,
        json={"dateRanges": [{"startDate": start, "endDate": end}], "metrics": [{"name": metric}]},
        timeout=25,
    )
    response.raise_for_status()
    data = response.json()
    rows = data.get("rows", [])
    if not rows:
        return None
    value = int(rows[0]["metricValues"][0]["value"])
    if value < 0:
        raise ValueError("GA4 returned a negative metric")
    return value


def main() -> None:
    property_id = os.environ["GA_PROPERTY_ID"]
    start_text = os.environ["GA_STATS_START_DATE"]
    if not re.fullmatch(r"[0-9]+", property_id):
        raise ValueError("GA_PROPERTY_ID must be numeric")
    start = date.fromisoformat(start_text)
    now = datetime.now(SEOUL)
    if start > now.date():
        raise ValueError("GA_STATS_START_DATE is in the future")
    info = json.loads(os.environ["GA_SERVICE_ACCOUNT_JSON"])
    if info.get("type") != "service_account":
        raise ValueError("GA_SERVICE_ACCOUNT_JSON is not a service account key")
    credentials = service_account.Credentials.from_service_account_info(info, scopes=[API_SCOPE])
    session = AuthorizedSession(credentials)
    today = now.date().isoformat()
    total_sessions = report(session, property_id, start_text, today, "sessions")
    if total_sessions is None:
        # 실제 수신 데이터가 확인되기 전에는 방문 수를 표시하지 않습니다.
        return
    today_users = report(session, property_id, today, today, "totalUsers")
    public = {
        "statsStartDate": start_text,
        "asOf": now.isoformat(timespec="minutes"),
        "todayUsers": today_users if today_users is not None else 0,
        "totalSessions": total_sessions,
    }
    target = Path("_site/public-stats.json")
    target.write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
