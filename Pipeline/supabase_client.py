"""
supabase_client.py — Supabase client singleton for Ping Analyst
----------------------------------------------------------------
Provides:
  - get_client()          → authenticated Supabase client
  - upload_deal_file()    → upload Excel/Word to Storage
  - get_download_url()    → signed URL for a stored file
  - insert_deal()         → insert deal row into `deals` table
  - fetch_deals()         → query all deals, newest first
  - update_deal_stage()   → patch deal_stage on a deal row

Credentials are read from env vars (Railway) or config.json (local dev).
"""

import os
from pathlib import Path

from supabase import create_client, Client

# ── Credentials ───────────────────────────────────────────────────────────────

def _get_credentials() -> tuple[str, str]:
    """Return (url, service_role_key) from env vars or config.json."""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not url or not key:
        # Fall back to config.json for local dev
        config_path = Path(__file__).parent / "config.json"
        if config_path.exists():
            import json
            cfg = json.loads(config_path.read_text())
            url = url or cfg.get("SUPABASE_URL", "")
            key = key or cfg.get("SUPABASE_SERVICE_KEY", "")

    if not url or not key:
        raise RuntimeError(
            "Supabase credentials not found. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars, "
            "or add them to config.json."
        )
    return url, key


# ── Singleton client ──────────────────────────────────────────────────────────

_client: Client | None = None

def get_client() -> Client:
    global _client
    if _client is None:
        url, key = _get_credentials()
        _client = create_client(url, key)
    return _client


# ── Storage helpers ───────────────────────────────────────────────────────────

BUCKET = "deal-files"
SIGNED_URL_TTL = 60 * 60  # 1 hour


def upload_deal_file(search_id: str, local_path: Path) -> str:
    """
    Upload a file to Supabase Storage.
    Returns the storage path: "{search_id}/{filename}"
    """
    client = get_client()
    storage_path = f"{search_id}/{local_path.name}"
    with open(local_path, "rb") as f:
        data = f.read()

    # upsert=True so re-runs overwrite cleanly
    client.storage.from_(BUCKET).upload(
        path=storage_path,
        file=data,
        file_options={"upsert": "true"},
    )
    return storage_path


def get_download_url(storage_path: str) -> str:
    """Return a signed download URL valid for SIGNED_URL_TTL seconds."""
    client = get_client()
    result = client.storage.from_(BUCKET).create_signed_url(
        path=storage_path,
        expires_in=SIGNED_URL_TTL,
    )
    return result["signedURL"]


# ── Database helpers ──────────────────────────────────────────────────────────

TABLE = "deals"


def insert_deal(meta: dict) -> None:
    """Insert a completed deal row into the `deals` table."""
    client = get_client()
    client.table(TABLE).insert(meta).execute()


def fetch_deals(api_key: str | None = None) -> list[dict]:
    """
    Return all deals, newest first.
    If api_key is provided, filter to that user's deals only.
    """
    client = get_client()
    query = client.table(TABLE).select("*").order("created_at", desc=True)
    if api_key:
        query = query.eq("api_key", api_key)
    result = query.execute()
    return result.data or []


def update_deal_stage(search_id: str, stage: str) -> None:
    """Update the deal_stage for a given searchId."""
    client = get_client()
    client.table(TABLE).update({"deal_stage": stage}).eq("search_id", search_id).execute()
