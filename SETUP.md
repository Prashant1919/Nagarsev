# Nagarsevak Dashboard — Setup & Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Angular 21 Frontend (Zoneless)       Vercel Serverless (Node)  │
│  ─────────────────────────────        ───────────────────────── │
│  LoginComponent                       POST /api/auth            │
│    └─ AuthService (signals)             └─ JWT sign/verify       │
│                                                                  │
│  SchedulerComponent                   GET  /api/schedule        │
│    └─ ScheduleService (signals) ───►  POST /api/schedule        │
│                                       PUT  /api/schedule/:id    │
│  RecordsComponent                     DEL  /api/schedule/:id    │
│    └─ RecordsService (signals)  ───►                            │
│                                       GET  /api/records         │
│  authInterceptor                      POST /api/records         │
│    └─ attaches JWT to all /api        PUT  /api/records/:id     │
│       requests                        DEL  /api/records/:id     │
│                                         └─ googleapis (SA auth) │
│                                              └─ Google Sheets   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1 — Google Cloud: Service Account Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable the **Google Sheets API**:
   - APIs & Services → Library → search "Google Sheets API" → Enable
4. Create a Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Name: `nagarsevak-sheets-sa`
   - No IAM roles needed at project level
   - Click Done
5. Create a JSON Key:
   - Click the service account → Keys tab → Add Key → Create new key → JSON
   - Download the `*.json` file (keep it safe, never commit it)
6. Note the `client_email` from the JSON (e.g. `nagarsevak-sheets-sa@project.iam.gserviceaccount.com`)

---

## Step 2 — Google Sheet Setup

1. Open your sheet:  
   `https://docs.google.com/spreadsheets/d/1nZjXop8q2K2JwayI84ANrFeM1Tq-3I2kgAz2NKdZtuM/edit`

2. **Share the sheet** with your service account email (from Step 1):
   - Click Share → paste the `client_email` → set role to **Editor** → Send

3. Create two tabs (if not present):

   **Tab: `Schedule`** — Row 1 must contain EXACTLY these headers (copy-paste):
   ```
   id	date	time	title	description	location	status	priority	attendees	createdAt	updatedAt
   ```

   **Tab: `Records`** — Row 1 must contain EXACTLY these headers:
   ```
   id	citizenName	contact	ward	area	category	subject	description	status	priority	followUpDate	internalNotes	resolvedNote	createdAt	updatedAt
   ```

> ⚠️ Headers are tab-separated in the sheet. The column names are case-sensitive and must match exactly.

---

## Step 3 — Local Development Setup

### Prerequisites
- Node.js 18+
- Angular CLI 21: `npm install -g @angular/cli@21`
- Vercel CLI: `npm install -g vercel`

### Install dependencies
```bash
# Install Angular app dependencies
npm install

# Install API dependencies
cd api && npm install && cd ..
```

### Configure environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your actual values
```

Fill in `.env.local`:
```env
ADMIN_USERNAME=nagarsevak_admin
ADMIN_PASSWORD=YourChosenPassword
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
GOOGLE_SERVICE_ACCOUNT_JSON=<paste minified JSON from service account file>
```

To minify the service account JSON:
```bash
node -e "const f=require('./path/to/service-account.json'); console.log(JSON.stringify(f))"
```

### Run locally
```bash
# Terminal 1 — Vercel dev (runs API routes on port 3000)
vercel dev --listen 3000

# Terminal 2 — Angular dev server (proxies /api → localhost:3000)
npm start
```

Open: `http://localhost:4200`

---

## Step 4 — Deploy to Vercel

### First-time setup
```bash
# Link to Vercel
vercel

# Follow prompts:
# - Link to existing project or create new
# - Framework preset: Other
# - Build command: npm run build
# - Output directory: dist/nagarsevak-dashboard/browser
```

### Add environment variables on Vercel
Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add ALL of these for **Production**, **Preview**, and **Development**:

| Variable | Value |
|----------|-------|
| `ADMIN_USERNAME` | `nagarsevak_admin` (or your choice) |
| `ADMIN_PASSWORD` | Your strong password |
| `JWT_SECRET` | Your 48+ char random hex string |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The full minified JSON string |

### Deploy
```bash
vercel --prod
```

---

## Angular 21 Features Used

| Feature | Where Used |
|---------|-----------|
| `provideZonelessChangeDetection()` | `app.config.ts` — full zoneless mode |
| Signals (`signal`, `computed`, `effect`) | All services and components |
| `@if` / `@for` / `@switch` | All component templates |
| Functional `inject()` | All services, guards, interceptors |
| `ChangeDetectionStrategy.OnPush` | All components |
| `withViewTransitions()` | Router — smooth page transitions |
| `withFetch()` | HTTP client — uses native fetch API |
| Functional `CanActivateFn` | auth.guard.ts |
| `HttpInterceptorFn` | auth.interceptor.ts |
| Standalone components only | No NgModules anywhere |
| `withComponentInputBinding()` | Router — route params as inputs |

---

## Project Structure

```
nagarsevak-app/
├── api/                          ← Vercel serverless functions (Node.js)
│   ├── _sheets.js                ← Shared Google Sheets helper
│   ├── auth.js                   ← POST /api/auth
│   ├── schedule/
│   │   ├── index.js              ← GET + POST /api/schedule
│   │   └── [id].js               ← PUT + DELETE /api/schedule/:id
│   └── records/
│       ├── index.js              ← GET + POST /api/records
│       └── [id].js               ← PUT + DELETE /api/records/:id
│
├── src/app/
│   ├── core/
│   │   ├── models.ts             ← All TypeScript interfaces
│   │   ├── auth/
│   │   │   ├── auth.service.ts   ← Signal-based JWT auth
│   │   │   └── auth.guard.ts     ← Functional route guards
│   │   ├── services/
│   │   │   ├── schedule.service.ts
│   │   │   ├── records.service.ts
│   │   │   └── toast.service.ts
│   │   └── interceptors/
│   │       └── auth.interceptor.ts
│   │
│   ├── features/
│   │   ├── login/                ← Login page
│   │   ├── dashboard/            ← Summary dashboard
│   │   ├── scheduler/            ← Calendar + CRUD events
│   │   └── records/              ← Citizen records table + CRUD
│   │
│   ├── layout/
│   │   └── shell/                ← Sidebar nav layout
│   │
│   ├── app.component.ts          ← Root + Toast host
│   ├── app.config.ts             ← Angular providers
│   └── app.routes.ts             ← Lazy-loaded routes
│
├── src/styles.scss               ← Design system + global styles
├── proxy.conf.json               ← Dev proxy: /api → localhost:3000
├── vercel.json                   ← Vercel routing config
└── .env.local.example            ← Env vars template
```

---

## Security Notes

- All API routes verify JWT before processing
- Credentials live only in Vercel env vars, never in frontend code
- No public registration — login is hardcoded single-user
- `robots: noindex` in index.html prevents search indexing
- `.gitignore` blocks all secrets from being committed
- JWT expires after 8 hours; session cleared on tab close (sessionStorage)

---

## Troubleshooting

**"Unauthorized" on all API calls**  
→ Check `JWT_SECRET` matches between your `.env.local` and Vercel env vars.

**"Google Sheets API not enabled"**  
→ Make sure you've enabled the API in Google Cloud Console for your project.

**"The caller does not have permission"**  
→ Confirm the sheet is shared with the service account email (Editor role).

**"Cannot find module 'googleapis'"**  
→ Run `cd api && npm install` — the API has its own package.json.

**Angular build fails on Vercel**  
→ Ensure `ADMIN_USERNAME` etc. are set in Vercel env vars (even though they're only used by API routes, the build needs to complete first).
