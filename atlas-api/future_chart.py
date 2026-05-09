"""
ATLAS v9 — New Backend Routes
Add these to your main app.py / server.py

Two new endpoints:
  GET /api/future-chart/<ticker>?period=3M   → Powers FutureChart component
  GET /api/levels/<ticker>                    → Powers SupportResistancePanel

Both use Polygon (Massive) API — same key as the rest of the app.
"""

import requests
import numpy as np
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from config import POLYGON_KEY   # same key — Massive = Polygon

future_bp = Blueprint("future", __name__)


# ─────────────────────────────────────────────────────────────
#  HELPER: fetch daily OHLCV from Polygon
# ─────────────────────────────────────────────────────────────
def _get_daily_aggs(ticker: str, days_back: int = 120):
    end   = datetime.now()
    start = end - timedelta(days=days_back)
    url = (
        f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day"
        f"/{start.strftime('%Y-%m-%d')}/{end.strftime('%Y-%m-%d')}"
        f"?adjusted=true&sort=asc&limit=500&apiKey={POLYGON_KEY}"
    )
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200 and r.json().get("results"):
            return r.json()["results"]
    except Exception:
        pass
    return []


# ─────────────────────────────────────────────────────────────
#  HELPER: linear regression projection
#  Returns slope, intercept for a series of prices
# ─────────────────────────────────────────────────────────────
def _linear_regression(prices: list):
    n = len(prices)
    x = list(range(n))
    x_mean = sum(x) / n
    y_mean = sum(prices) / n
    num   = sum((x[i] - x_mean) * (prices[i] - y_mean) for i in range(n))
    denom = sum((x[i] - x_mean) ** 2 for i in range(n))
    slope     = num / denom if denom != 0 else 0
    intercept = y_mean - slope * x_mean
    return slope, intercept


# ─────────────────────────────────────────────────────────────
#  GET /api/future-chart/<ticker>?period=3M
# ─────────────────────────────────────────────────────────────
@future_bp.route("/api/future-chart/<ticker>")
def future_chart(ticker: str):
    ticker  = ticker.upper()
    period  = request.args.get("period", "3M")

    # Map period to days of history to show
    period_map = {"1M": 30, "3M": 90, "6M": 180}
    hist_days  = period_map.get(period, 90)
    proj_days  = 30   # always project 30 calendar days forward

    # Fetch enough raw data to cover history + buffer
    raw = _get_daily_aggs(ticker, days_back=hist_days + 30)
    if not raw:
        return jsonify({"error": "No data"}), 404

    # Trim to requested history window (last N bars)
    bars_needed = {30: 21, 90: 63, 180: 126}.get(hist_days, 63)
    raw = raw[-bars_needed:] if len(raw) > bars_needed else raw

    # Build history series
    history = [
        {"date": datetime.fromtimestamp(b["t"] / 1000).strftime("%m/%d"), "price": round(b["c"], 2)}
        for b in raw
    ]

    # Calculate volatility (std dev of daily returns)
    closes = [b["c"] for b in raw]
    if len(closes) > 1:
        daily_returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
        vol = float(np.std(daily_returns)) if daily_returns else 0.015
    else:
        vol = 0.015

    # Linear regression on last 20 bars for trend
    trend_closes = closes[-20:] if len(closes) >= 20 else closes
    slope, intercept = _linear_regression(trend_closes)

    # Project forward proj_days calendar days (~22 trading days)
    trading_days = 22
    last_close   = closes[-1]
    last_date    = datetime.fromtimestamp(raw[-1]["t"] / 1000)

    projection = []
    for i in range(1, trading_days + 1):
        # Skip weekends
        proj_date = last_date + timedelta(days=i)
        while proj_date.weekday() >= 5:
            proj_date += timedelta(days=1)

        # Projected price: last close + (slope * i), capped at ±30%
        raw_proj  = last_close + slope * i
        proj_price = max(last_close * 0.70, min(last_close * 1.30, raw_proj))
        proj_price = round(proj_price, 2)

        # Confidence band widens over time: ±1.5 std dev * sqrt(days)
        band = last_close * vol * 1.5 * (i ** 0.5)
        upper = round(proj_price + band, 2)
        lower = round(max(proj_price - band, proj_price * 0.80), 2)

        projection.append({
            "date":  proj_date.strftime("%m/%d"),
            "price": proj_price,
            "upper": upper,
            "lower": lower,
        })

    # Calculate projected return
    proj_return = round((projection[-1]["price"] - last_close) / last_close * 100, 1) if projection else 0

    return jsonify({
        "ticker":            ticker,
        "history":           history,
        "projection":        projection,
        "projection_return": proj_return,
        "projection_days":   proj_days,
        "current_price":     last_close,
        "volatility_pct":    round(vol * 100, 2),
        "trend":             "UP" if slope > 0 else "DOWN",
        "period":            period,
    })


# ─────────────────────────────────────────────────────────────
#  GET /api/levels/<ticker>
#  Returns support & resistance levels from Polygon SMA indicators
#  + pivot points calculated from recent OHLCV
# ─────────────────────────────────────────────────────────────
@future_bp.route("/api/levels/<ticker>")
def levels(ticker: str):
    ticker = ticker.upper()
    result_levels = []

    # 1. Fetch SMA 20, 50, 200 from Polygon indicators
    for period in [20, 50, 200]:
        url = (
            f"https://api.polygon.io/v1/indicators/sma/{ticker}"
            f"?timespan=day&adjusted=true&window={period}&series_type=close"
            f"&limit=1&apiKey={POLYGON_KEY}"
        )
        try:
            r = requests.get(url, timeout=8)
            if r.status_code == 200:
                results = r.json().get("results", {}).get("values", [])
                if results:
                    sma_val = round(results[0]["value"], 2)
                    result_levels.append({
                        "name":     f"SMA {period}",
                        "price":    sma_val,
                        "type":     "resistance" if sma_val > 0 else "support",
                        "strength": "strong" if period == 200 else "moderate" if period == 50 else "weak",
                        "source":   "polygon_sma",
                    })
        except Exception:
            pass

    # 2. Fetch recent OHLCV to calculate classical pivot points
    raw = _get_daily_aggs(ticker, days_back=10)
    if raw and len(raw) >= 2:
        # Use previous day's H, L, C for pivot
        prev = raw[-2]
        H, L, C = prev["h"], prev["l"], prev["c"]

        PP = round((H + L + C) / 3, 2)
        R1 = round(2 * PP - L, 2)
        R2 = round(PP + (H - L), 2)
        S1 = round(2 * PP - H, 2)
        S2 = round(PP - (H - L), 2)

        current_price = raw[-1]["c"]

        pivot_levels = [
            {"name": "Pivot R2", "price": R2, "type": "resistance", "strength": "moderate", "source": "pivot"},
            {"name": "Pivot R1", "price": R1, "type": "resistance", "strength": "strong",   "source": "pivot"},
            {"name": "Pivot PP", "price": PP, "type": "resistance" if PP > current_price else "support", "strength": "strong", "source": "pivot"},
            {"name": "Pivot S1", "price": S1, "type": "support",    "strength": "strong",   "source": "pivot"},
            {"name": "Pivot S2", "price": S2, "type": "support",    "strength": "moderate", "source": "pivot"},
        ]
        result_levels.extend(pivot_levels)

    if not result_levels:
        return jsonify({"error": "No level data"}), 404

    # Deduplicate levels that are within 0.5% of each other
    seen = []
    deduped = []
    for lv in sorted(result_levels, key=lambda x: x["price"], reverse=True):
        too_close = any(abs(lv["price"] - s) / s < 0.005 for s in seen)
        if not too_close:
            deduped.append(lv)
            seen.append(lv["price"])

    return jsonify({
        "ticker": ticker,
        "levels": deduped,
        "source": "polygon_sma_pivot",
        "count":  len(deduped),
    })


# ─────────────────────────────────────────────────────────────
#  HOW TO REGISTER IN YOUR app.py:
#
#  from future_chart import future_bp
#  app.register_blueprint(future_bp)
#
# ─────────────────────────────────────────────────────────────
