# ⌚ Classic Watch Pro

> A production-grade, security-first luxury watch e-commerce platform — **React 18 · TypeScript · Vite · MUI 6 · Zustand · TanStack Query** — that runs fully in **demo mode with zero configuration** and can switch to **real Firebase auth + Firestore** by adding credentials.

![version](https://img.shields.io/badge/version-3.1.0-212121) ![license](https://img.shields.io/badge/license-MIT-blue) ![tests](https://img.shields.io/badge/tests-152%20passing-success) ![a11y](https://img.shields.io/badge/a11y-WCAG%20AA%20zero%20violations-4CAF50) ![PWA](https://img.shields.io/badge/PWA-ready-5A31F4) ![CI](https://img.shields.io/badge/CI-lint%20·%20tsc%20·%20tests%20·%20build%20·%20audit%20·%20E2E%20·%20Lighthouse-181717)

---

## ✨ What's inside

### Storefront

- **Catalog & discovery** — responsive product grid with category / brand / price / rating filters, sorting, live search, featured & latest rails, and rich product detail pages with real Unsplash watch photography.
- **Reviews & ratings** — rating-distribution summaries, verified-purchase badges, helpful votes, and a write-review flow whose aggregates stay coherent with the catalog (new reviews recompute each product's rating/count).
- **Discovery extras** — a persisted **recently-viewed rail**, **quick-view** on every card, and a **side-by-side compare drawer** across up to four watches (specs, price, availability).
- **Cart & checkout** — persisted cart, Zod + react-hook-form validation, multiple payment methods, **promo codes** (percent/fixed, min-order & usage caps — seeded codes like `WELCOME10`), and order confirmation with a full order-history view.
- **Account area** — customer dashboard, order tracking & per-order activity timelines, wishlist, an in-app **notification center** (order status, refunds, stock alerts), and profile/security management.

### Accounts & security

- **Full auth cycle** — register, login, Google sign-in, **forgot-password**, **email verification** with a route-level "verify your email" gate, anti-enumeration error copy.
- **Two-factor authentication (TOTP)** — enroll with a live secret + `otpauth://` URI, verify-and-enable, disable. Real Firebase MFA path included; a deterministic demo path works offline.
- **Passkeys (WebAuthn)** — _genuine_ WebAuthn ceremonies via `@simplewebauthn` (registration + authentication), cryptographically verified client-side in demo mode, **counter-based replay protection**, and a clearly-labelled legacy fallback for browsers without WebAuthn.
- **Authorization** — `ProtectedRoute` / `AdminRoute` guards enforce sign-in, role, and email-verification; the admin surface is invisible to non-admins (verified by tests + live scans).
- **Audit history** — immutable, timestamped activity trails on orders (placement, status changes, cancellations) and users (role changes), surfaced in Admin Orders, Admin Users, and the customer order page.

### Admin & analytics

- **Dashboard** — revenue / order / customer KPIs, dependency-free **SVG charts** (monthly revenue bars + order-status donut), inventory health, most-reviewed products, and **top customers** by lifetime spend.
- **Sales reports** — export analytics to **CSV** or a **print-to-PDF** report; every export is HTML-escaped so report content can never inject markup.
- **Management** — products CRUD, orders (status workflow + tracking notes + one-click **refunds** that append an immutable audit event), users (roles, 2FA/passkey badges, activity dialogs), a **review moderation queue**, and a **Backup / Restore / Reset** console for the demo database.

### Demo-data layer (no backend required)

- The app runs in **demo mode** out of the box: an in-memory mock database with realistic seed data (16 watches, 6 users, 6 orders) behind the same API shape as the real backend.
- Every mutation **persists across reloads** to `localStorage` inside a **schema-versioned envelope** with a **migration registry** — old snapshots upgrade in place, never silently discard.
- Admins can **export the DB as versioned JSON, validate & import it back**, or reseed; the DB schema is versioned and migration-tested.
- Add Firebase credentials and the same UI talks to Firestore instead — swap, don't rewrite.

### Performance & accessibility (final hardening pass)

- **Lighthouse CI budget** (`.lighthouserc.json`) enforces explicit floors on every PR: perf ≥ 0.70, a11y / best-practices / SEO ≥ 0.90, CLS ≤ 0.10, LCP ≤ 5.5 s, TBT ≤ 600 ms on throttled mobile. Measured locally: **Home 99 · /products 86 · A11y / Best-practices / SEO 100**.
- **Zero-CLS skeletons** — the product-grid skeleton was rebuilt block-for-block to mirror the real card (measured 474 px == 474 px, 0 shift); skeleton card count matches the real page grid.
- **Fast first paint** — critical CSS + an app-shell hero are inlined in `index.html` (FCP ≈ 0.7 s), Google Fonts load asynchronously (non-render-blocking), and the LCP images carry `fetchpriority="high"` while below-fold images stay lazy.
- **Lazy Firebase** — the Firebase SDK is dynamically imported; **demo-mode builds ship zero Firebase bytes** on the critical path, and route-level code splitting keeps page chunks tiny.
- **Dark-mode palette** engineered to **AA+** (key semantic pairs measured ≥ 5.15:1) and every page passes automated **WCAG 2.1 AA** scans in both themes.
- **Luxury design language (v3.1)** — warm ivory canvas + midnight-navy accents in light mode, and an editorial serif display face (Playfair Display, loaded async and CLS-safe) for headings.

---

## 🛠 Tech stack

| Area               | Choice                                                                               |
| ------------------ | ------------------------------------------------------------------------------------ |
| Language / runtime | TypeScript 5.6 · Node ≥ 18                                                           |
| Build / dev server | Vite 5 (SWC React plugin) · PWA plugin                                               |
| UI                 | React 18 · MUI 6                                                                     |
| Routing            | React Router 7                                                                       |
| Client state       | Zustand 5 (+ persist middleware)                                                     |
| Server state       | TanStack Query 5                                                                     |
| Forms / validation | React Hook Form (pinned 7.53.x — avoids a known `formState.errors` regression) + Zod |
| Auth               | Firebase Auth (lazy-loaded) · `@simplewebauthn/browser` + `@simplewebauthn/server`   |
| HTTP               | Axios with interceptors + an in-app mock adapter                                     |
| Tests              | Vitest · React Testing Library · jsdom · **axe-core** · **Playwright E2E**           |
| Error tracking     | Sentry (`@sentry/react`) — lazily loaded only when `VITE_SENTRY_DSN` is set          |
| Quality            | ESLint (incl. `eslint-plugin-security`) · Prettier · `tsc --noEmit`                  |

---

## 🚀 Getting started

**Prerequisites:** Node.js ≥ 18 and npm ≥ 9.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (demo mode — no Firebase needed)
npm run dev
# → http://localhost:5173

# 3. (Optional) enable real auth + Firestore
cp .env.example .env.local
# fill in VITE_FIREBASE_* values, then restart
```

> Without Firebase credentials the app **auto-signs in the demo admin** on load and persists mutations to `localStorage` under a versioned mock-DB key. Use the **Reset demo data** control on the admin dashboard to reseed.

### Demo accounts

In demo mode, sign in with **`demo@classicwatch.local`** and _any_ password of 4+ characters (admin). Additional seeded users appear in **Admin → Manage users**. Explore the 2FA and passkey flows from **Profile → Security**.

### Available scripts

| Command                          | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| `npm run dev`                    | Start the Vite dev server                |
| `npm run build`                  | Type-check + production build to `dist/` |
| `npm run preview`                | Serve the production build locally       |
| `npm run type-check`             | `tsc --noEmit`                           |
| `npm run lint` / `lint:fix`      | ESLint (zero-warning policy)             |
| `npm run format`                 | Prettier across `src/`                   |
| `npm test`                       | Full Vitest suite once                   |
| `npm run test:watch` / `test:ui` | Watch / interactive UI mode              |
| `npm run test:coverage`          | Coverage report                          |
| `npm run generate:icons`         | Regenerate PWA icon set                  |

---

## 🔐 Security posture

- **No secrets in the repo** — Firebase keys live in `.env.local` (git-ignored); missing config is detected and the app falls back to demo mode.
- **Supply chain** — `npm audit --omit=dev --audit-level=high` runs in CI; the production-only scope keeps the check fast _and_ meaningful. Unused dependencies are removed rather than tolerated (e.g. the Framer Motion bundle was dropped during the perf pass).
- **Input & output hardening** — Zod-validated forms, XSS-safe rendering, HTML-escaped export/print views, security-focused ESLint rules (`eslint-plugin-security`).
- **Auth hardening** — anti-enumeration error copy, email-verification gate on protected routes, role-based route guards, TOTP second factor, WebAuthn passkeys with counter replay protection, and immutable audit trails for privileged actions.
- **Dependency pinning** — `react-hook-form` is pinned to the known-good 7.53.x line because 7.86.0 shipped a regression that silently drops `formState.errors` after failed validation.

---

## 🧪 Testing & quality gates

Run the full gate locally (exactly what CI runs):

```bash
npm run lint && npm run type-check && npm test && npm run build
```

**152 unit/component tests across 23 files**, covering:

- **Accessibility regression suite** (`src/features/__tests__/a11y.test.tsx`) — full-page axe-core scans (WCAG 2.1 AA) on 18 routes: storefront, auth, dashboard, checkout and admin surfaces. This suite catches structural defects jsdom renders even when a narrow viewport hides them — it found and drove fixes for heading-order breaks, a price-slider with no accessible name, unlabelled MUI Selects, and bare `<a>` elements inside `<ul>` in the sidebar.
- Store-level behavior — cart **promo-code discount math**, notifications feed (read/unread/cap), recently-viewed dedupe & cap, compare toggle limits.
- Mock-adapter integration — **reviews** (list/create/verified/helpful/delete with aggregate recompute), **promo validation & redemption**, **refund** eligibility + audit, persistence across reloads.
- Auth-store state machines — MFA enrollment/verify/disable, email verification, passkeys incl. legacy fallback.
- Route guards (protected / admin / email-verification) and header navigation.
- Storage round-trips + **schema migrations** + adapter integration (mutation → reload → persistence).
- WebAuthn verification helpers, CSV/print export escaping, chart rendering.

**CI** (`.github/workflows/ci.yml`, three parallel jobs): Quality gates — lint → type-check → unit tests → production build → production-dependency audit — a **Playwright E2E smoke job** (buy flow, auth + admin guard, moderation), and a Lighthouse budget job against the built app. Concurrency cancels stale runs so PRs iterate fast.

> Demo promo codes: `WELCOME10` (10% off) · `LUXE200` ($200 off orders ≥ $1,500) · `SUMMER20` (20% off up to $150, orders ≥ $800).

---

## 📁 Project structure

```
src/
├── api/            # Typed API hooks (React Query) for products/orders/users/wishlist
├── components/     # Layout (Header/Footer/MainLayout), common UI, guards, skeletons
├── config/         # Env-driven app config + demo user
├── features/       # Feature modules: auth, products, cart, orders, admin, dashboard, home
│   ├── admin/      # Dashboard, charts, exports, CRUD, backup/restore controls
│   ├── auth/       # Pages, MFA dialog, layouts
│   └── …
├── lib/            # Firebase bootstrap (lazy), axios client, WebAuthn ceremony helpers
├── mocks/          # Mock DB: seeds, schema-versioned storage, adapter, auth helpers
├── store/          # Zustand stores: auth, cart, wishlist, theme
├── styles/         # Global styles + MUI theme (light & dark, AA+ tuned)
├── test/           # Test setup + factories
├── types/          # Shared domain types
└── utils/          # Helpers, CSV/print export
```

See [`FILE_STRUCTURE.md`](./FILE_STRUCTURE.md) for the full tree and [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) for an architecture deep-dive.

---

## 📚 Documentation

| Document                                       | Contents                                                    |
| ---------------------------------------------- | ----------------------------------------------------------- |
| [`README.md`](./README.md)                     | You are here                                                |
| [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) | Package contents & architecture                             |
| [`QUICK_START.md`](./QUICK_START.md)           | Fast setup walkthrough                                      |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md)             | Deployment checklist & guide                                |
| [`FILE_STRUCTURE.md`](./FILE_STRUCTURE.md)     | Complete file tree                                          |
| [`ROADMAP_V3.md`](./ROADMAP_V3.md)             | Product roadmap (v2.1 baseline → v3.3 AI) — living document |
| [`UPGRADE_SUMMARY.md`](./UPGRADE_SUMMARY.md)   | Migration/upgrade report                                    |

---

## 🤝 Contributing

1. Fork the repository and create a feature branch.
2. Keep changes small and covered by tests — run the quality gate above before pushing.
3. Open a pull request describing the change and the verification performed.

## 📝 License

MIT — free to use for learning or commercial purposes.

---

_Classic Watch Pro · v3.0.0 · built with ❤️ and a lot of ☕_
