# Changelog

All notable changes to this project will be documented in this file.

## [19.1.0] - 2026-04-01

### Security

- **Fix API key validation bypass** — `checkIPKey()` returned `-1` on failure, which is truthy in JavaScript, allowing any invalid API key to pass validation and access the protected `/api/trades` endpoint. Now returns `false`. (`index.mjs`)
- **Restrict Parse Server master key IPs** — `masterKeyIps` was set to `0.0.0.0/0` (accept from anywhere). Now defaults to `127.0.0.1,::1` (localhost only), configurable via `MASTER_KEY_IPS` environment variable. (`index.mjs`)
- **Fix ParseDashboard crash** — `parseDashboard` variable was used conditionally but never defined (import and instantiation were commented out), causing a runtime crash if `PARSE_DASHBOARD` env var was set. Commented out the dead reference. (`index.mjs`)
- **Scope satisfaction queries to current user** — Both daily and trade satisfaction upsert queries now include `query.equalTo("user", ...)` to prevent cross-user data access. (`Daily.vue`, `daily.js`)

### Bug Fixes

- **Fix "All" date filter showing 12/31/1969 (#83)** — When "All" period is selected, `start=0` and `end=0` caused the Parse query to use `greaterThanOrEqualTo(0)` and `lessThan(0)`, returning no results. Now skips date filtering when both values are 0. (`trades.js`)
- **Fix empty CSV rows crashing import (#122)** — Trailing blank lines in CSV files caused `TypeError: $t[a]['T/D'] is undefined`. Now skips rows with missing `T/D` or `S/D` fields during temp execution creation. (`addTrades.js`)
- **Fix TastyTrade import crash on empty rows (#132)** — `a.Date.localeCompare` threw TypeError when CSV contained empty/invalid rows. Now filters out rows with missing or empty `Date` field before sorting. (`brokers.js`)
- **Fix NinjaTrader import RangeError (#163)** — NinjaTrader exports dates in locale-dependent formats (e.g., `19032026 15:35:46` for DDMMYYYY). Added support for compact DDMMYYYY/MMDDYYYY formats and fallback parsing. Also fixed `Exec Time` extraction to handle non-standard date strings. (`brokers.js`)
- **Fix tagged trades disappearing after reload (#129)** — When creating new tags, their IDs were not added to the `selectedTags` filter array. After page reload, trades with only these new tags were filtered out and appeared deleted. Now syncs newly created tag IDs into `selectedTags` and persists to localStorage. (`Daily.vue`)
- **Fix trade-level satisfaction not saving (#76)** — Trade satisfaction changes were not updating `satisfactionTradeArray` (the source of truth for re-renders), and the Parse `save()` call was not awaited, causing a race condition. Now updates the in-memory array and awaits persistence. (`Daily.vue`)

### Privacy

- **Respect ANALYTICS_OFF for Docker Hub version check (#142)** — The `/api/dockerVersion` endpoint made outbound requests to `hub.docker.com` regardless of privacy settings. Self-hosted instances with `ANALYTICS_OFF=true` now skip this call entirely. (`index.mjs`)

### Infrastructure

- **Add `.env.example`** — Documents all environment variables with descriptions and sensible defaults for self-hosted deployments.
- **Add devcontainer configuration** — `.devcontainer/` with Dockerfile, docker-compose, and VS Code settings for containerized development.
- **Update `docker-compose-local.yml`** — Added `MASTER_KEY_IPS` and `ANALYTICS_OFF` environment variables for local development.
