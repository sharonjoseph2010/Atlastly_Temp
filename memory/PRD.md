# Atlastly — Map-based Event Services Discovery

## Original Problem Statement
Build an accessible, map-based event services discovery platform where:
- **Planners** discover vendors by location via a Mapbox UI.
- **Vendors** list services (business details + map location).
- **Admins** manage all listings.
- **Storage & Auth:** Supabase.

User language: English.

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Shadcn/UI, Mapbox GL JS via react-map-gl.
- **Backend:** FastAPI + Pydantic v2 + Supabase Python client.
- **DB & Auth:** Supabase (PostgreSQL + Supabase Auth, JWT).
- **Rate limiting:** slowapi (per-IP, per-minute).
- **LLM:** Emergent Universal Key (Gemini 2.0 Flash) — used only for category classification fallback.

## Implemented Features
- Three roles: planner / vendor / admin (Supabase Auth + `user_roles` table).
- Mapbox-based vendor discovery with category filter (Planner).
- Vendor self-listing: form + draggable marker + manual lat/lng inputs.
- Admin CRUD: list / create / edit / delete / toggle active.
- **Google Maps URL auto-fill** in admin form (Feb 2026):
  - Paste full Google Maps URL or shortened `maps.app.goo.gl` share link.
  - Backend resolves redirects, extracts place_id / coordinates / business name.
  - Calls Google Places API (New) v1 with FieldMask for: displayName, formattedAddress, location, internationalPhoneNumber, websiteUri, types, addressComponents, editorialSummary.
  - Static `types[]` → category mapping (10 categories), with Gemini Flash fallback when no static match.
  - Free-tier safety: 3 calls/min/IP via slowapi + persistent daily cap (default 200/day) stored in `/app/backend/.api_usage.json`.
  - Endpoints: `POST /api/admin/google-lookup`, `GET /api/admin/google-lookup/quota`.
- **Bulk Google Maps import** (Feb 2026):
  - Modal accessible via "Bulk Import" button in admin header.
  - Paste up to 25 Google Maps URLs (one per line). Two-step flow: fetch → review (with editable name & category, missing-field warnings, per-row checkbox) → create all selected.
  - Backend endpoint: `POST /api/admin/bulk-google-lookup` (no slowapi cap, but each lookup increments daily cap; if cap reached mid-batch, remaining URLs marked "Skipped").
  - Frontend component: `frontend/src/components/BulkImportModal.js`.

## Key Files
- `backend/server.py` — FastAPI app, all routes.
- `backend/google_lookup.py` — URL parsing, Places API, LLM fallback, quota tracking.
- `backend/.env` — Supabase + Google Places + Emergent LLM keys + quota envs.
- `frontend/src/pages/AdminDashboard.js` — admin CRUD + Google auto-fill UI.
- `frontend/src/pages/PlannerDashboard.js` — vendor map discovery.
- `frontend/src/pages/VendorDashboard.js` — vendor self-service.
- `frontend/src/utils/api.js` — typed API wrappers.

## DB Schema (Supabase)
- `user_roles`: `{id, user_id (→ auth.users), role, created_at}`
- `vendors`: `{id, user_id, business_name, category, city, address, phone, description, external_link, latitude, longitude, is_active, created_at, updated_at}`

## Recent Fixes (Feb 2026)
- ✅ **Frontend was using `vendor.vendor_id`, backend returns `id`** — caused all admin Delete/Edit/Toggle and planner marker selection to silently break. Fixed across `AdminDashboard.js`, `PlannerDashboard.js`, `VendorMarker.js`, `VendorDashboard.js`.
- ✅ Cleaned blank user DB on user request.

## Backlog / Roadmap
- **P1 — OTP-based login** (email or phone) via Resend or Twilio.
- **P2** — Refactor: delete obsolete migration scripts (`migrate_to_supabase.py`, `migrate_data_to_supabase.py`, `create_supabase_tables.py`).
- **P3** — Optionally replace per-IP rate limit with per-user (admin user_id) rate limit using a Supabase-backed counter for distributed deployments.

## Test Credentials
None persisted — admins are user-created via signup. See `/app/memory/test_credentials.md`.
