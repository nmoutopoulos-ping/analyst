# Ping Analyst — TODO & Next Steps

Outstanding work, known issues, and planned improvements.

---

## 🔴 High Priority

### Email — Resend Domain Verification
- **Status:** Blocked / In Progress
- **Issue:** `pingpayments.org` domain is showing "Failed" in Resend DNS verification. Three DNS records were added to Squarespace (Google Domains panel), but verification is not passing.
- **Root cause:** Domain previously had Vercel nameservers attached. Those have been removed. DNS propagation may still be in progress.
- **Next step:** Wait for full propagation (~24-48h after Vercel removal), then click "Retry" in Resend dashboard. Once verified, set `EMAIL_ENABLED=true` and `EMAIL_SENDER=Ping Analyst <analyst@pingpayments.org>` on Railway.
- **Workaround:** Email is currently disabled (`EMAIL_ENABLED=false`). Pipeline runs and files are generated but not delivered. Users can download from the CRM Deals tab.

### Deal Storage — Ephemeral Filesystem
- **Status:** Known limitation
- **Issue:** Railway's filesystem resets on every redeploy. All job files (Excel, Word, `meta.json`) in `/tmp/ping_output` are lost after each deploy.
- **Impact:** CRM Deals tab will be empty after any redeploy.
- **Fix:** Add persistent storage. Options:
  - **Railway Volume** — persistent disk, easiest path, ~$0.25/GB/month
  - **Supabase / PlanetScale** — hosted Postgres/MySQL, free tier available, more work
  - **S3 / R2** — object storage for files + Postgres/SQLite for metadata
- **Recommended:** Start with a Railway Volume. Change `OUTPUT_DIR` to the mount path.

---

## 🟡 Medium Priority

### CRM — Deal Stage Persistence
- **Status:** Client-side only (MVP)
- **Issue:** Deal stages (New → Review → Offer → Contract → Closed/Pass) are stored in `localStorage`. Clearing browser data or switching devices resets all stages.
- **Fix:** Add a `PATCH /deals/<id>/stage` endpoint on the server. Write stage to `meta.json`. Return stage in `/deals` response.

### CRM — Pipeline Status Polling
- **Status:** Not implemented
- **Issue:** After submitting an analysis from the CRM, there's no feedback that the pipeline is running or has completed. User has to refresh the Deals tab manually.
- **Fix:** Poll `GET /health` after submission. Show a "Processing…" banner while `status === "busy"`. Auto-refresh Deals tab when status returns to `idle`.

### Extension — Chrome Web Store Distribution
- **Status:** Manual install only (Load Unpacked)
- **Issue:** Users must download a zip, extract it, and load via `chrome://extensions`. High friction for new users.
- **Fix:** Publish to Chrome Web Store. Requires a $5 one-time developer fee + review process. Allows one-click install.
- **Note:** Review process can take 1-2 weeks for initial submission.

### Multi-User CRM Access
- **Status:** Not implemented
- **Issue:** The Deals tab shows all deals regardless of which user submitted them. Any valid API key can see all deals.
- **Fix:** Include `api_key` or user identity in `meta.json`. Filter `/deals` response by the requesting user's key. Optionally add an admin view that shows all deals.

---

## 🟢 Low Priority / Nice to Have

### Server — Pipeline Concurrency
- **Status:** Single-threaded (by design)
- **Issue:** Only one pipeline can run at a time. A second submission during an active run returns `503`.
- **Context:** Intentional on Railway's free tier — parallel runs would exhaust memory.
- **Fix (future):** Upgrade Railway plan, move to a job queue (e.g., Redis + RQ), allow multiple concurrent pipelines.

### Extension — Submission History Sync
- **Status:** History stored in `chrome.storage.local` (device-local)
- **Issue:** History doesn't sync across devices.
- **Fix:** Replace `chrome.storage.local` with `chrome.storage.sync` for history, or query the server's `/deals` endpoint using the stored API key.

### CRM — Search Status in Deals Table
- **Status:** Not implemented
- **Issue:** No indication whether a submitted deal's pipeline has completed or is still running.
- **Fix:** Return pipeline status in `/deals` response (or add a `status` field to `meta.json`).

### Excel Template — Version Control
- **Status:** Binary file in git (not ideal)
- **Issue:** `Multifamily Underwriting Template V1.xlsx` is tracked as a binary in git. Diffs are not meaningful. Template changes are hard to review.
- **Fix:** Store the template in a shared drive (Google Drive, Dropbox) and download it at deploy time via a setup script. Or version it by filename (`V2.xlsx`, etc.) and keep old versions for reprocessing.

### Resend — Error Handling
- **Status:** Basic (`raise_for_status`)
- **Issue:** If Resend returns an error (rate limit, bad address, etc.), the pipeline logs it and moves on. The user never knows their email wasn't delivered.
- **Fix:** Capture Resend errors, include failure reason in `meta.json`, surface it in the CRM deal detail.

### keygen — Self-Service Onboarding
- **Status:** Admin-only (manual key generation + redeploy required)
- **Issue:** Adding a new user requires running `keygen.py`, editing `users.py`, and pushing + redeploying.
- **Fix:** Long-term: move user registry to a database. API key generation becomes an API call, no redeploy needed.

---

## ✅ Completed

- [x] Remove Google Sheets / GAS dependency from submission flow
- [x] Switch email from Gmail SMTP to Resend HTTP API (Railway blocks SMTP ports)
- [x] Implement API key authentication (`PING-XXXX-XXXX` format)
- [x] Build `keygen.py` for new user onboarding
- [x] Fix `NameError: unit_cnts` in `docx_writer.py`
- [x] Fix `UnboundLocalError: _unit_cnts` (variable only assigned in `else` branch)
- [x] Fix `TypeError: float() argument... NoneType` for null lat/lng
- [x] Build Ping Analyst CRM web app (`crm.html`) at `/app`
- [x] Add `/deals` API endpoint for CRM Deals tab
- [x] Add `/deals/<id>/download/<file>` endpoint for file downloads
- [x] Write `meta.json` per job directory after pipeline completes
- [x] Update Chrome Extension to use API key instead of email
- [x] Write README.md, ARCHITECTURE.md, PRODUCTS.md, TODO.md
