# Ping Analyst

**Multifamily real estate underwriting, automated.**

Ping Analyst fetches live rental comp data, populates a professional Excel pro forma, generates a Word investment summary, and emails the results — triggered by a single form submission. It runs as two parallel products under the same backend.

---

## Products

### Ping Analyst Extension
A Chrome side panel that lets users submit a property for underwriting directly from any browser tab. Designed for field use — quick form, one-click submit, results arrive by email.

[→ See Extension docs](docs/EXTENSION.md)

### Ping Analyst CRM
A web application served from the same server. Provides the same deal submission form plus a deal pipeline tracker where all submitted analyses are visible, stageable, and downloadable.

[→ See CRM docs](docs/CRM.md)

---

## How It Works

1. User submits a property (address, price, unit mix) via the Extension or CRM
2. Server validates the API key and starts the pipeline in a background thread
3. Pipeline fetches live rental comps from RentCast API (parallel, per unit type)
4. Pipeline populates the Excel underwriting model with comp data
5. Pipeline generates a Word investment summary document
6. Results are emailed to the user with both files attached
7. Deal metadata is written to the server and appears in the CRM Deals tab

---

## Repository Structure

```
analyst/
├── README.md                          # This file
├── Procfile                           # Railway startup command
├── requirements.txt                   # Python dependencies
├── docs/
│   ├── ARCHITECTURE.md                # System architecture & data flow
│   ├── PRODUCTS.md                    # Extension vs CRM feature comparison
│   └── TODO.md                        # Outstanding work & next steps
├── Pipeline/
│   ├── server.py                      # Flask server — /trigger, /app, /deals
│   ├── main.py                        # Pipeline orchestrator
│   ├── fetcher.py                     # RentCast API + legacy Sheets reader
│   ├── excel_writer.py                # Excel model population
│   ├── docx_writer.py                 # Word summary generation
│   ├── emailer.py                     # Email delivery via Resend API
│   ├── helpers.py                     # Utility functions
│   ├── config.py                      # Config loader (env vars / config.json)
│   ├── users.py                       # API key → user registry
│   ├── keygen.py                      # New user key generator
│   ├── resend_email.py                # Re-send email for existing deal
│   ├── crm.html                       # CRM web app (single file)
│   ├── config.example.json            # Local dev config template
│   └── templates/
│       └── Multifamily Underwriting Template V1.xlsx
└── Extension/
    └── ping-analyst_v1/
        ├── manifest.json              # Chrome Extension Manifest V3
        ├── background.js              # Service worker
        ├── sidepanel.html             # Side panel UI
        ├── sidepanel.js               # Side panel logic
        └── icons/
```

---

## Deployment

The pipeline runs on [Railway](https://railway.app). The same service hosts both the API and the CRM web app.

**Required environment variables on Railway:**

| Variable | Description |
|---|---|
| `RENTCAST_API_KEY` | RentCast API key for comp data |
| `EMAIL_ENABLED` | `true` to enable email delivery |
| `RESEND_API_KEY` | Resend API key for email |
| `EMAIL_SENDER` | From address, e.g. `Ping Analyst <analyst@pingpayments.org>` |
| `OUTPUT_DIR` | Output path, set to `/tmp/ping_output` on Railway |

---

## Adding a New User

```bash
cd Pipeline
python3 keygen.py newuser@company.com "Their Name"
```

Paste the printed line into `Pipeline/users.py` inside the `USERS` dict, then push and redeploy. Send the user their `PING-XXXX-XXXX` key and the extension download link or CRM URL.

---

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Copy and fill in config
cp Pipeline/config.example.json Pipeline/config.json
# Edit config.json with your API keys

# Run the server
python Pipeline/server.py
```

Server starts at `http://localhost:5001`. CRM available at `http://localhost:5001/app`.

---

## Architecture Overview

```
Chrome Extension  ──┐
                    ├──▶  POST /trigger  ──▶  Pipeline  ──▶  Email + Files
CRM Web App (/app) ─┘         │
                               ▼
                         API Key Auth
                         (users.py)
```

[→ Full architecture diagram](docs/ARCHITECTURE.md)
