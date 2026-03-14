# Ping Analyst — System Architecture

## Overview

Ping Analyst is a Python backend deployed on Railway that accepts property submissions from two frontend clients (Chrome Extension and CRM web app), runs a multi-step underwriting pipeline, and delivers results by email.

---

## High-Level Data Flow

```
┌─────────────────────┐     ┌─────────────────────┐
│  Chrome Extension   │     │    CRM Web App       │
│  (Manifest V3)      │     │  (/app on Railway)   │
│                     │     │                      │
│  sidepanel.html/js  │     │  crm.html            │
│  chrome.storage     │     │  localStorage        │
└────────┬────────────┘     └──────────┬───────────┘
         │  POST /trigger               │  POST /trigger
         │  { api_key, address,         │  GET  /deals
         │    combos, ... }             │  GET  /deals/<id>/download/<file>
         └──────────────┬───────────────┘
                        ▼
            ┌───────────────────────┐
            │   Flask Server        │
            │   server.py           │
            │                       │
            │  1. Validate api_key  │
            │  2. Resolve email     │
            │  3. Gen search ID     │
            │  4. Start thread      │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Pipeline            │
            │   main.py             │
            │                       │
            │  Step 2: RentCast     │──▶ RentCast API
            │  Step 3: Excel        │──▶ openpyxl
            │  Step 4: Word doc     │──▶ python-docx
            │  Step 5: Email        │──▶ Resend API
            │  Step 6: meta.json    │
            └───────────────────────┘
```

---

## Components

### Server (`Pipeline/server.py`)

Flask application. Entry point for all requests.

**Routes:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/trigger` | Accept pipeline submission from Extension or CRM |
| GET | `/health` | Returns `idle` or `busy` status |
| GET | `/app` | Serves `crm.html` — the CRM web application |
| GET | `/deals` | Returns JSON list of all completed deals (requires API key) |
| GET | `/deals/<id>/download/<file>` | Serves Excel or Word file for download |
| OPTIONS | all | CORS preflight handler |

**Concurrency model:** A single `threading.Lock` serializes pipeline runs. If a pipeline is already running, `/trigger` returns `503`. This is intentional — one pipeline at a time prevents resource contention on Railway's free tier.

---

### Pipeline (`Pipeline/main.py`)

Orchestrates all steps. Two entry points:

- `run_pipeline_from_payload(payload)` — primary path, called by server on POST /trigger
- `run_pipeline()` — legacy path for Google Sheets-based local dev (not used in production)

**Steps:**

```
Step 1  Parse payload → build search_meta and combos list
Step 2  Fetch RentCast comps in parallel (one thread per unit type combo)
Step 3  Copy Excel template → populate Raw Comps, Assumptions, Inputs sheets
Step 4  Generate Word .docx investment summary
Step 5  Send email via Resend API with Excel + Word attachments
Step 6  Write meta.json to job directory (for CRM Deals tab)
Step 7  Mark search ID as processed in processed.json
```

---

### Authentication (`Pipeline/users.py`)

API key registry. Keys are hardcoded — no database required.

```python
USERS = {
    "PING-XXXX-XXXX": {"email": "user@domain.com", "name": "Name"},
}
```

The server resolves the user's email from their key — users cannot submit analyses under a different email. The same key works in both the Extension and the CRM.

**Adding users:** Run `python3 Pipeline/keygen.py email@domain.com "Name"`, paste the output line into `users.py`, push, redeploy.

---

### RentCast Integration (`Pipeline/fetcher.py`)

Calls the RentCast `/listings/rental/long-term` endpoint for each unit type combo in parallel using `ThreadPoolExecutor`. Returns up to `maxComps` results sorted by distance from the subject property.

Each comp record includes: address, rent, bedrooms, bathrooms, square footage, latitude/longitude, listing status, and last seen date.

---

### Excel Writer (`Pipeline/excel_writer.py`)

Populates three sheets in the Excel template:

- **Raw Comps** — all individual comp records with full metadata
- **Assumptions** — aggregated comp statistics (avg rent, avg sqft, rent/SF) per unit type
- **Inputs** — subject property details: address, price, cost, unit mix, commercial spaces

The template (`templates/Multifamily Underwriting Template V1.xlsx`) contains pre-built formulas for 10-year pro forma, debt schedule, returns analysis, and pricing scenarios. The writer only fills in the data cells — all calculations are formula-driven.

---

### Word Writer (`Pipeline/docx_writer.py`)

Generates a multi-page `.docx` investment summary with:

- Executive summary (property details, acquisition price, improvements)
- Rental comp analysis table (per unit type: count, avg rent, avg sqft, rent/SF)
- Projected income section (unit counts × market rents, gross monthly/annual, CoC estimates)
- Full comp listings (page 2+, grouped by unit type)

Uses `python-docx` with custom XML helpers for cell shading, borders, and typography.

---

### Email Delivery (`Pipeline/emailer.py`)

Sends via **Resend API** (HTTP POST to `https://api.resend.com/emails`). Switched from Gmail SMTP because Railway blocks outbound SMTP ports (465, 587).

Files are Base64-encoded and sent as attachments inline. Requires `RESEND_API_KEY` environment variable and a verified sender domain in the Resend dashboard.

---

### Configuration (`Pipeline/config.py`)

Loads configuration in priority order:

1. Environment variables (used on Railway)
2. `config.json` file (used for local development — gitignored)
3. Hardcoded defaults

Key config values:

| Config Key | Env Var | Description |
|---|---|---|
| `RC_KEY` | `RENTCAST_API_KEY` | RentCast API key |
| `OUTPUT_DIR` | `OUTPUT_DIR` | Where job folders are written (`/tmp/ping_output` on Railway) |
| `EMAIL_CFG.enabled` | `EMAIL_ENABLED` | Toggle email sending |
| `EMAIL_CFG.app_password` | `SMTP_PASS` | Legacy SMTP — no longer used |
| — | `RESEND_API_KEY` | Resend API key (read directly in emailer.py) |
| — | `EMAIL_SENDER` | From address for outbound email |

---

### CRM Web App (`Pipeline/crm.html`)

Single-file HTML/CSS/JS application served at `/app`. No build step, no framework — vanilla JS with `localStorage` for client-side persistence.

**Three views:**

- **New Analysis** — identical submission form to the extension. Uses relative `/trigger` endpoint (same origin, no CORS needed).
- **Deals** — fetches `/deals?api_key=...` and renders a table of all completed analyses. Click any row to open a detail modal with comp summary, deal stage selector, and file download links.
- **Settings** — First Name, Last Name, Email (stored in `localStorage`), API key (masked after save).

**Deal stage:** Tracked client-side in the current MVP. Stages: New → Review → Offer → Contract → Closed / Pass. Server-side persistence is a planned improvement.

---

### Chrome Extension (`Extension/ping-analyst_v1/`)

Manifest V3 Chrome extension. Opens as a side panel on the extension icon click.

**Key flows:**

- **Address geocoding:** User types an address → debounced call to OpenStreetMap Nominatim → lat/lng stored in memory and shown as a pill below the input.
- **Form submission:** Validates all fields → POSTs JSON to `${serverUrl}/trigger` with `api_key` in the body.
- **Settings persistence:** `chrome.storage.sync` — survives browser restarts, syncs across Chrome profiles signed into the same Google account.
- **History:** Last 20 searches stored in `chrome.storage.local`.

**Distribution:** Manual install (Load Unpacked) — not on Chrome Web Store. Users download a zip from a shared link, extract, and load via `chrome://extensions`.

---

## File Storage on Railway

Railway's filesystem is **ephemeral** — it resets on each redeploy. Job output files (Excel, Word, meta.json) are written to `OUTPUT_DIR` (`/tmp/ping_output`) and persist only for the lifetime of the current deployment.

**Implication for CRM Deals tab:** Deals from previous deployments are lost after a redeploy. Persistent deal storage requires a database (see [TODO.md](TODO.md)).

---

## Legacy Code

`Pipeline/fetcher.py` and `Extension/ping-analyst_v1/apps-script.gs` contain the original Google Sheets + Google Apps Script architecture. This was the v1 submission flow:

```
Google Form → Google Sheets → GAS webhook → Python pipeline
```

This has been fully replaced by the direct JSON POST architecture. The legacy files are retained for reference but are not used in production. They are candidates for archival or removal.
