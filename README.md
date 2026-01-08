# Restyle AI (MVP)

Upload a room photo → pick room type + style + intensity → generate 4 restyled variations (async) using Replicate.

## Stack
- Next.js (App Router) + Tailwind
- Clerk auth
- Supabase Postgres (jobs, outputs, credits)
- Cloudinary (image uploads)
- Replicate (image generation)
- QStash (async worker delivery)

---

## 1) Setup

### Requirements
- Node 20+
- Supabase project (Postgres)
- Clerk app
- Cloudinary account
- Replicate API token
- Upstash QStash token + signing keys

### Install
```bash
cp .env.example .env.local
npm install
```

Fill `.env.local` with your keys.

---

## 2) Supabase schema (migration)

Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor.

> Note: this uses the `pgcrypto` extension for UUIDs.

---

## 3) Clerk

In Clerk dashboard, set these URLs:
- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in: `/`
- After sign-up: `/`

Middleware (`middleware.ts`) protects everything except sign-in/up, the QStash worker endpoint, and Stripe webhook.

---

## 4) QStash (important)

The app enqueues a worker call to:

`POST /api/worker/run-job`

### Local dev
QStash cannot call `http://localhost:3000` from the internet. Use **one** of these:
- Deploy to Vercel (recommended), set `APP_URL` to your deployed domain
- Use a tunnel (ngrok / cloudflared), set `APP_URL` to the tunnel URL

---

## 5) Run
```bash
npm run dev
```

Open http://localhost:3000, sign in, upload an image, generate.

---

## Credits model (MVP)
- 1 image = 1 credit
- 1 job generates 4 images = 4 credits
- Free quota is set to 5 images total (tweak in `app/api/jobs/route.ts`)

---

## Replicate model
Pinned to:

`jagilley/controlnet-canny:aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613`

Schema: https://replicate.com/jagilley/controlnet-canny/versions/aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9613/api

Intensity maps to `low_threshold/high_threshold` + `eta` (more creative = fewer edges + more noise).

---

## Next upgrades (not included)
- Stripe checkout + webhook to add credits
- RLS policies (currently you should keep DB access server-side only)
- Persist user credits UI / history view
