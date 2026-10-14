#!/usr/bin/env python3
"""Fetch the official Netflix Global Top 10 TSV and publish a compact JSON mirror.

The script is intentionally fail-safe: network, schema, or validation failures do not
replace a previously published good JSON file.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

SOURCE_URL = "https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv"
USER_AGENT = "Mozilla/5.0 (compatible; NetflixTop10Mirror/1.0; +https://github.com/)"
SCHEMA_VERSION = 1


def parse_int(value: Any) -> int | None:
    if value is None:
        return None
    text = str(value).strip().replace(",", "").replace(" ", "")
    if not text or text.lower() in {"nan", "none", "null", "-"}:
        return None
    try:
        return int(float(text))
    except (ValueError, TypeError):
        return None


def category_kind(value: str) -> str | None:
    category = (value or "").strip().casefold()
    if category.startswith(("film", "movie")):
        return "movie"
    if category.startswith(("tv", "series", "show")):
        return "tv"
    return None


def category_language(value: str) -> str:
    category = (value or "").strip().casefold()
    return "non_english" if "non-english" in category or "non english" in category else "english"


def _normalise_headers(row: dict[str, Any]) -> dict[str, str]:
    return {str(k).lstrip("\ufeff").strip().casefold(): ("" if v is None else str(v).strip())
            for k, v in row.items() if k is not None}


def parse_tsv(content: str) -> tuple[str, list[dict[str, Any]], dict[str, int]]:
    reader = csv.DictReader(io.StringIO(content, newline=""), delimiter="\t")
    if not reader.fieldnames:
        raise ValueError("TSV is empty or has no header")
    headers = {name.lstrip("\ufeff").strip().casefold() for name in reader.fieldnames if name}
    required = {"week", "category", "weekly_rank", "show_title"}
    missing = required - headers
    if missing:
        raise ValueError("Required TSV columns are missing: " + ", ".join(sorted(missing)))
    if "weekly_views" not in headers:
        raise ValueError("TSV has no weekly_views column; views cannot be compared safely")

    rows: list[dict[str, Any]] = []
    for raw in reader:
        row = _normalise_headers(raw)
        week = row.get("week", "")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", week):
            continue
        kind = category_kind(row.get("category", ""))
        if kind not in {"movie", "tv"}:
            continue
        title = row.get("show_title", "").strip()
        rank = parse_int(row.get("weekly_rank"))
        views = parse_int(row.get("weekly_views"))
        if not title or rank is None or rank < 1:
            continue
        rows.append({
            "week": week,
            "category": row.get("category", "").strip(),
            "kind": kind,
            "language": category_language(row.get("category", "")),
            "category_rank": rank,
            "title": title,
            "season_title": row.get("season_title", "").strip(),
            "weekly_views": views,
            "weekly_hours_viewed": parse_int(row.get("weekly_hours_viewed")),
            "runtime": parse_int(row.get("runtime")),
            "cumulative_weeks_in_top_10": parse_int(row.get("cumulative_weeks_in_top_10")),
        })

    if not rows:
        raise ValueError("No usable weekly ranking rows found")
    latest_week = max(r["week"] for r in rows)
    latest = [r for r in rows if r["week"] == latest_week]
    counts: dict[str, int] = {}
    for row in latest:
        counts[row["category"]] = counts.get(row["category"], 0) + 1
    return latest_week, latest, counts


def merge_top10(rows: list[dict[str, Any]], kind: str) -> list[dict[str, Any]]:
    candidates = [r for r in rows if r["kind"] == kind]
    # The merged English + non-English ranking is valid only when Netflix supplied
    # comparable weekly view counts. Never silently substitute country ranks.
    candidates = [r for r in candidates if r["weekly_views"] is not None]
    candidates.sort(key=lambda r: (-r["weekly_views"], r["category_rank"], r["category"].casefold(), r["title"].casefold()))
    output: list[dict[str, Any]] = []
    for rank, row in enumerate(candidates[:10], start=1):
        output.append({
            "rank": rank,
            "category_rank": row["category_rank"],
            "source_category": row["category"],
            "source_language": row["language"],
            "title": row["title"],
            "season_title": row["season_title"] or None,
            "weekly_views": row["weekly_views"],
            "weekly_hours_viewed": row["weekly_hours_viewed"],
            "runtime": row["runtime"],
            "cumulative_weeks_in_top_10": row["cumulative_weeks_in_top_10"],
            "media_type": kind,
        })
    return output


def freshness_status(week: str) -> str:
    try:
        age_days = (datetime.now(timezone.utc).date() - date.fromisoformat(week)).days
    except ValueError:
        return "unknown"
    # Netflix normally publishes on Tuesday for the Sunday-ending week. A 9-day
    # allowance includes normal delays and switches the badge to stale after that.
    return "current" if 0 <= age_days <= 9 else "stale"


def write_json_atomically(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def refresh_existing_freshness(path: Path) -> bool:
    """Refresh only a derived freshness flag when the source itself is unreachable."""
    old = read_existing(path)
    if not old or not isinstance(old.get("week_ending"), str):
        return False
    new_status = freshness_status(old["week_ending"])
    if old.get("freshness_status") == new_status:
        return False
    old["freshness_status"] = new_status
    write_json_atomically(path, old)
    print(f"Updated snapshot freshness flag to {new_status}; ranking data and data timestamp unchanged")
    return True


def build_payload(week: str, rows: list[dict[str, Any]], category_counts: dict[str, int]) -> dict[str, Any]:
    present_pairs = {(row["kind"], row["language"]) for row in rows}
    required_pairs = {(kind, language) for kind in ("movie", "tv") for language in ("english", "non_english")}
    missing_pairs = required_pairs - present_pairs
    if missing_pairs:
        raise ValueError("Latest week is missing one or more English/Non-English source categories; keeping previous data")

    movies = merge_top10(rows, "movie")
    tv = merge_top10(rows, "tv")
    if len(movies) < 10 or len(tv) < 10:
        raise ValueError(
            f"Latest week {week} is incomplete for a merged Top 10 "
            f"(movies={len(movies)}, tv={len(tv)}); keeping previous data"
        )
    if any(item["weekly_views"] is None for item in movies + tv):
        raise ValueError("A published item has no weekly view count")
    return {
        "schema_version": SCHEMA_VERSION,
        "status": "published",
        "freshness_status": freshness_status(week),
        "source": "Netflix Global Top 10",
        "source_url": SOURCE_URL,
        "week_ending": week,
        "updated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "sort_method": "merged English and Non-English lists, sorted by weekly_views descending",
        "source_category_counts": category_counts,
        "movies": movies,
        "tv": tv,
    }


def fetch_source(url: str = SOURCE_URL, timeout: int = 35) -> str:
    request = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "text/tab-separated-values,text/plain,*/*",
        "Cache-Control": "no-cache",
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        status = getattr(response, "status", 200)
        if status < 200 or status >= 300:
            raise RuntimeError(f"Source returned HTTP {status}")
        raw = response.read()
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("Cannot decode Netflix TSV")


def read_existing(path: Path) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(value, dict) and isinstance(value.get("week_ending"), str):
            return value
    except (OSError, json.JSONDecodeError):
        return None
    return None


def update(output: Path, source_text: str) -> bool:
    week, rows, counts = parse_tsv(source_text)
    payload = build_payload(week, rows, counts)
    old = read_existing(output)
    old_week = old.get("week_ending") if old else None
    if old_week and old_week > week:
        print(f"Latest source week {week} is older than stored week {old_week}; preserving existing ranking data")
        refresh_existing_freshness(output)
        return False

    # Avoid rewriting on every retry when the same week's rankings did not change.
    if old and old_week == week:
        comparable_old = dict(old)
        comparable_new = dict(payload)
        comparable_old.pop("updated_at_utc", None)
        comparable_new.pop("updated_at_utc", None)
        old_data = dict(comparable_old)
        new_data = dict(comparable_new)
        old_data.pop("freshness_status", None)
        new_data.pop("freshness_status", None)
        if old_data == new_data:
            if old.get("freshness_status") != payload.get("freshness_status"):
                old["freshness_status"] = payload["freshness_status"]
                write_json_atomically(output, old)
                print(f"Week {week} rankings unchanged; updated freshness flag to {payload['freshness_status']}")
                return True
            print(f"Week {week} is already published and unchanged")
            return False

    write_json_atomically(output, payload)
    print(f"Published week {week}: {len(payload['movies'])} movies, {len(payload['tv'])} TV entries")
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="site/netflix-top10.json", help="Output JSON path")
    parser.add_argument("--source-file", help="Read a local TSV instead of downloading (testing only)")
    parser.add_argument("--url", default=SOURCE_URL, help="Override source URL")
    args = parser.parse_args()
    output = Path(args.output)
    try:
        source_text = Path(args.source_file).read_text(encoding="utf-8-sig") if args.source_file else fetch_source(args.url)
        update(output, source_text)
        return 0
    except Exception as exc:  # fail-safe: preserve ranking data on network/schema errors
        print(f"Netflix Top 10 update failed; previous ranking data is preserved: {exc}", file=sys.stderr)
        if output.exists():
            try:
                refresh_existing_freshness(output)
            except Exception as freshness_error:
                print(f"Could not refresh the stored freshness flag: {freshness_error}", file=sys.stderr)
            return 0
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
