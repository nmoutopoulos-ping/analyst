# Ping Analyst — Products

Two products. One backend. Same analysis.

---

## Ping Analyst Extension

A Chrome side panel for fast, field-friendly deal submission. Open it from any browser tab, fill in the property details, and get results by email.

**Best for:** In-the-field use. Quick submissions while browsing listings, MLS pages, or Zillow.

**How to install:** Manual load — download the zip, extract, go to `chrome://extensions`, enable Developer Mode, click "Load Unpacked." Not on the Chrome Web Store.

**Settings persistence:** `chrome.storage.sync` — survives browser restarts, syncs across Chrome profiles signed into the same Google account.

---

## Ping Analyst CRM

A web app served from the same Railway server at `/app`. Full submission form plus a deal pipeline tracker — all completed analyses are visible, stageable, and downloadable.

**Best for:** Deal management. Reviewing all past analyses, tracking deal stages, downloading the Excel/Word files.

**Access:** Direct URL (e.g., `https://your-railway-app.railway.app/app`). No install required — runs in any browser.

**Settings persistence:** `localStorage` — tied to the browser/device.

---

## Feature Comparison

| Feature | Extension | CRM |
|---|---|---|
| Submit new analysis | ✅ | ✅ |
| Address geocoding (lat/lng) | ✅ | ✅ |
| Unit mix builder | ✅ | ✅ |
| Commercial spaces input | ✅ | ✅ |
| Search radius / comp count controls | ✅ | ✅ |
| Receive results by email | ✅ | ✅ |
| View all past deals | ❌ | ✅ |
| Download Excel / Word files | ❌ | ✅ |
| Deal stage tracking | ❌ | ✅ |
| Comp summary in deal detail | ❌ | ✅ |
| Settings (name, email) | ✅ (side panel) | ✅ (Settings tab) |
| API key storage | `chrome.storage.sync` | `localStorage` |
| Works without installing anything | ❌ | ✅ |
| Works across all browsers | ❌ (Chrome only) | ✅ |
| Syncs across Chrome profiles | ✅ | ❌ |

---

## Shared Infrastructure

Both products use the same:

- **API key** (`PING-XXXX-XXXX`) for authentication — one key works in both
- **`POST /trigger` endpoint** on the Flask server
- **Pipeline** (RentCast → Excel → Word → Email)
- **Email delivery** (Resend API, results arrive regardless of which product triggered the run)

The server resolves the user's email from their API key — users cannot submit analyses under a different email regardless of which product they use.

---

## Planned Improvements

See [TODO.md](TODO.md) for the full list. Notable product-level items:

- **Extension:** Chrome Web Store distribution (currently manual install only)
- **CRM:** Server-side deal stage persistence (currently client-side `localStorage`)
- **CRM:** Push notifications or in-app status polling when a pipeline is running
- **CRM:** Multi-user deal visibility with role-based access
