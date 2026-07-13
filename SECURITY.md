# Security Overview — Kailia's Story

This document describes the protections currently in place for children's
data, and what must be added before any cloud features ship. It is the
starting point for the written security program required for a
child-directed app (COPPA).

Last updated: July 2026.

## Architecture today: on-device only

All child data is stored in the browser's localStorage on the family's own
device. **Nothing is uploaded to any server.** The hosting provider
(Vercel) serves the app's code over HTTPS but never receives child data.

Consequences of this design:

- **Access control:** one family can never see another family's data,
  because data never leaves the family's device.
- **No data in URLs:** routes are static (`/play`, `/family`, …); no child
  data appears in URLs, query strings, or referrer headers.
- **Encryption in transit:** the app itself is delivered over HTTPS.
  Child data is not transmitted at all.
- **Encryption at rest:** localStorage relies on the device's own user
  account/disk protections. Acceptable while data is device-local; NOT
  sufficient for servers (see below).

## What was removed

- A legacy Supabase upload sent assessment results (child name, age,
  scores) to a cloud table **with row-level security disabled** — readable
  by anyone holding the app's public key. The upload code, client, and
  dependency were removed in July 2026.
- **Action still required by the owner:** delete the old `assessments`
  table (and any rows in it) in the Supabase dashboard, then rotate or
  delete that Supabase project's keys. The keys in `.env.local` are no
  longer used by the app.

## Data inventory & deletion

- Every localStorage key holding child data is listed in
  `CHILD_DATA_KEYS` (`lib/family.ts`). Parent-facing deletion in
  `/family` wipes all of them plus the family account.
- Metric events are shape-limited (child profile id, domain, task,
  numeric performance data only — no free text or media).

## Third parties

- No analytics, advertising, tracking, or session-replay SDKs.
- Essential service providers only: Vercel (hosting/serving code).

## Requirements before adding ANY cloud/server feature

1. Real parent authentication (email + password or provider sign-in),
   owned by the parent — children never get credentials.
2. Per-family access control from day one (e.g. Postgres RLS scoped to
   the parent account id). Never ship with RLS disabled.
3. TLS for all transport; encryption at rest for child data columns.
4. Server-side deletion completing the 30-day retention promise,
   including backups.
5. Update `/privacy`, `/retention`, and this file before launch of the
   feature — and get legal review.

## Reporting a vulnerability

[Contact email to be added before launch.]
