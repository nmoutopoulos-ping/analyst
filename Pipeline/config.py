"""
config.py — Ping Pipeline Configuration
-----------------------------------------
Loads config.json if present (local dev) and exposes typed constants used
across all modules. On Railway/cloud, config.json is absent — all values
must be supplied via environment variables instead.
All paths are resolved relative to this file's parent directory.

Environment variables (required on Railway, override config.json locally):
    RENTCAST_API_KEY  — RentCast API key
    GAS_URL           — Google Apps Script web app URL
    SHEET_ID          — Google Sheets spreadsheet ID
    OUTPUT_DIR        — Output directory path (default: /tmp/ping_output on server)
    EMAIL_ENABLED     — "true"/"false"
    SMTP_HOST         — SMTP server hostname
    SMTP_PORT         — SMTP port (default 587)
    SMTP_USER         — SMTP username
    SMTP_PASS         — SMTP password
"""

import json
import os
from pathlib import Path

PIPELINE_DIR   = Path(__file__).parent
CONFIG_PATH    = PIPELINE_DIR / "config.json"

# Load config.json if present (local dev); fall back to empty dict (env-var-only mode)
if CONFIG_PATH.exists():
    with open(CONFIG_PATH) as _f:
        _CFG = json.load(_f)
else:
    _CFG = {}

# ── External services (env vars override config.json) ──────────────────────────
GAS_URL        = os.environ.get("GAS_URL")           or _CFG.get("gas_url", "")
SHEET_ID       = os.environ.get("SHEET_ID")          or _CFG.get("sheet_id", "")
RC_KEY         = os.environ.get("RENTCAST_API_KEY")  or _CFG.get("rentcast_api_key", "")
RC_BASE        = os.environ.get("RENTCAST_BASE_URL") or _CFG.get("rentcast_base_url", "https://api.rentcast.io/v1")

# ── Paths ──────────────────────────────────────────────────────────────────────
TEMPLATE_PATH  = (PIPELINE_DIR / _CFG.get("excel_template", "templates/Multifamily Underwriting Template V1.xlsx")).resolve()
# OUTPUT_DIR: use env var if set (e.g. /tmp/ping_output on Railway), else config.json value, else default
OUTPUT_DIR     = Path(os.environ.get("OUTPUT_DIR") or (PIPELINE_DIR / _CFG.get("output_dir", "output")).resolve())
PROCESSED_PATH = PIPELINE_DIR / "processed.json"

# ── Email (env vars override config.json) ──────────────────────────────────────
_email_cfg = _CFG.get("email", {})

def _bool_env(key, fallback):
    val = os.environ.get(key)
    if val is None:
        return fallback
    return val.lower() in ("1", "true", "yes")

EMAIL_CFG = {
    "enabled":      _bool_env("EMAIL_ENABLED", _email_cfg.get("enabled", False)),
    "sender":       os.environ.get("EMAIL_SENDER") or _email_cfg.get("sender", ""),
    "smtp_user":    os.environ.get("SMTP_USER") or _email_cfg.get("smtp_user", ""),
    "app_password": os.environ.get("SMTP_PASS") or _email_cfg.get("app_password", ""),
    "default_recipient": _email_cfg.get("default_recipient", ""),
    "subject_prefix":    _email_cfg.get("subject_prefix", "Ping Underwriting Model"),
}

# ── Google Sheets CSV ──────────────────────────────────────────────────────────
SHEET_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/{sheet_id}"
    "/gviz/tq?tqx=out:csv&sheet=Saved+Searches"
)

# Column header → internal field name (matches apps-script.gs column order)
HEADER_MAP = {
    "Search ID":      "searchId",
    "Timestamp":      "timestamp",
    "Email":          "email",
    "Address":        "address",
    "Latitude":       "lat",
    "Longitude":      "lng",
    "Radius (mi)":    "radius",
    "Min Comps":      "minComps",
    "Max Comps":      "maxComps",
    "Status":         "status",
    "Total Units":    "totalUnits",
    "Price":          "price",
    "Cost":           "cost",
    "Building SqFt":  "sqft",
    "Beds":           "beds",
    "Baths":          "baths",
    "Type":           "type",
    "Run Status":        "runStatus",
    "Normal Time":       "normalTime",
    "Units":             "units",
    "Commercial Spaces": "commercial",
}
