# ⌚ Classic Watch Pro

> A production-grade, security-first luxury watch e-commerce platform built with **React 18, TypeScript, Vite, MUI 6, Zustand, and TanStack Query** — with a full demo-data mode that needs no backend, and real Firebase authentication ready to switch on.

![version](https://img.shields.io/badge/version-3.0.0-212121) ![license](https://img.shields.io/badge/license-MIT-blue) ![tests](https://img.shields.io/badge/tests-116%20passing-success) ![PWA](https://img.shields.io/badge/PWA-ready-5A31F4)

---

## ✨ What's inside

### Storefront
- **Catalog & discovery** — responsive product grid, category/brand/price/rating filters, sorting, search, featured & latest rails, and rich product detail pages with real photography.
- **Cart & checkout** — persisted cart, shipping/contact forms with schema validation, multiple payment methods, order confirmation with a full order history.
- **Account area** — customer dashboard, order tracking & detail with per-order activity timelines, wishlist, and profile management.

### Accounts & security (the v3.0 focus)
- **Full auth cycle** — register, login, Google sign-in, **forgot-password**, **email verification**, and a route-level "verify your email" gate.
- **Two-factor authentication (TOTP)** — enroll with a live secret + `otpauth://` URI, verify-and-enable, disable. Real Firebase MFA path included; a deterministic demo path works offline.
- **Passkeys (WebAuthn)** — *real* WebAuthn ceremonies via `@simplewebauthn` (registration + authentication), cryptographically verified client-side in demo mode, with **counter-based replay protection**. Browsers without WebAuthn fall back to a legacy stand-in, clearly labelled in the UI.
- **Authorization** — `ProtectedRoute` / `AdminRoute` guards enforce sign-in, role, and email-verification; the admin surface is invisible to non-admins.
- **Audit history** — immutable, timestamped activity trails on orders (placement, status changes, cancellations) and users (role changes), surfaced in Admin Orders, Admin Users, and the customer order page.

### Admin & analytics
- **Dashboard** — revenue/order/customer KPIs, dependency-free **SVG charts** (monthly revenue bars + order-status donut), inventory health, most-reviewed products.
- **Sales reports** — export the analytics to **CSV** or a **print-to-PDF** report (HTML-escaped — report content can never inject markup).
- **Management** — products CRUD, orders (status workflow + tracking notes), users (roles, 2FA badges, activity dialogs).

### Demo-data layer (no backend required)
- The app runs in **demo mode** out of the box: an in-memory mock database with realistic seed data (16 watches with live photo URLs, 6 users, 6 orders).
- Every mutation **persists across reloads** to `localStorage` inside a **schema-versioned envelope** with a migration registry — old snapshots upgrade in place, never silently discard.
- Admins get **Backup / Restore / Reset** controls: export the DB as versioned JSON, validate & import it back, or reseed.
- Same code paths and API shape as the real backend — swap in Firebase credentials and the UI talks to Firestore instead.

### Developer experience & quality
- 19 test files / **116 tests** (Vitest + Testing Library + jsdom) across stores, guards, charts, WebAuthn ceremonies, exports, persistence & migrations.
- **CI** (`.github/workflows/ci.yml`): lint → type-check → unit tests → production build → production-dependency audit → Lighthouse budget.
- ESLint (incl. `eslint-plugin-security`), Prettier, strict TypeScript, route-level code splitting, PWA (installable, 50+ precached assets).

---

## 🛠 Tech stack

| Area | Choice |
| --- | --- |
| Language / runtime | TypeScript 5.6 · Node ≥ 18 |
| Build / dev server | Vite 5 (SWC React plugin) · PWA plugin |
| UI | React 18 · MUI 6 · Framer Motion |
| Routing | React Router 7 |
| Client state | Zustand 5 (+ persist middleware) |
| Server state | TanStack Query 5 |
| Forms / validation | React Hook Form (pinned 7.53.x) + Zod |
| Auth | Firebase Auth · `@simplewebauthn/browser` + `@simplewebauthn/server` |
| HTTP | Axios with interceptors + an in-app mock adapter |
| Tests | Vitest · React Testing Library · jsdom |
| Quality | ESLint · Prettier · `tsc --noEmit` |

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

### Demo accounts

In demo mode, sign in with **`demo@classicwatch.local`** and *any* password of 4+ characters (admin). Additional seeded users appear in **Admin → Manage users**. The demo admin is the account used by every protected/admin demo flow — try the 2FA and passkey flows from **Profile → Security**.

> Without Firebase credentials the app auto-signs the demo account in on load, and mutations persist to `localStorage` under a versioned mock-DB key. The **Reset demo data** control on the admin dashboard reseeds everything.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint (zero-warning policy) |
| `npm run format` | Prettier across `src/` |
| `npm test` | Run the full Vitest suite once |
| `npm run test:watch` / `test:ui` | Watch / interactive UI mode |
| `npm run test:coverage` | Coverage report |
| `npm run generate:icons` | Regenerate PWA icon set |

---

## 🔐 Security posture

- **No secrets in the repo** — Firebase keys live in `.env.local` (git-ignored); the app detects missing config and falls back to demo mode.
- **Input & output hardening** — Zod-validated forms, XSS-safe rendering, HTML-escaped export/print views, and security-focused ESLint rules.
- **Auth hardening** — anti-enumeration error copy, email-verification gate on protected routes, role-based route guards, TOTP second factor, WebAuthn passkeys with counter replay protection, and a public audit trail for privileged actions.
- **Supply chain** — `npm audit --omit=dev --audit-level=high` runs in CI; a production-only audit keeps the check fast and meaningful.

---

## 🧪 Testing & quality gates

Run the full gate locally (this is exactly what CI runs):

```bash
npm run lint && npm run type-check && npm test && npm run build
```

Coverage highlights: auth-store state machines (MFA, verification, passkeys incl. fallback), route guards & header nav, storage round-trips + schema migrations, adapter integration (mutations → reload → persistence), WebAuthn verification helpers, CSV/print export escaping, and chart rendering.

---

## 📁 Project structure

```
src/
├── api/            # Typed API hooks (React Query) for products/orders/users/wishlist
├── components/     # Layout, common, shared UI (guards, error boundary, skeletons…)
├── config/         # Env-driven app config + demo user
├── features/       # Feature modules: auth, products, cart, orders, admin, dashboard, home
│   ├── admin/      # Dashboard, charts, exports, CRUD, backup/restore controls
│   ├── auth/       # Pages, MFA dialog, layouts
│   └── …
├── lib/            # Firebase bootstrap, axios client, WebAuthn ceremony helpers
├── mocks/          # Mock DB: seeds, storage (schema-versioned), adapter, auth helpers
├── store/          # Zustand stores: auth, cart, wishlist, theme
├── test/           # Test setup + factories
├── types/          # Shared domain types
└── utils/          # Helpers, CSV/print export
```

See [`FILE_STRUCTURE.md`](./FILE_STRUCTURE.md) for the full tree and [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) for a deep dive.

---

## 📚 Documentation

| Document | Contents |
| --- | --- |
| [`README.md`](./README.md) | You are here |
| [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) | Package contents & architecture |
| [`QUICK_START.md`](./QUICK_START.md) | Fast setup walkthrough |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Deployment checklist & guide |
| [`FILE_STRUCTURE.md`](./FILE_STRUCTURE.md) | Complete file tree |
| [`ROADMAP_V3.md`](./ROADMAP_V3.md) | Product roadmap (v2.1 baseline → v3.3 AI) — living document |
| [`UPGRADE_SUMMARY.md`](./UPGRADE_SUMMARY.md) | Migration/upgrade report |

---

## 🤝 Contributing

1. Fork the repository and create a feature branch.
2. Keep changes small and covered by tests — run the quality gate above before pushing.
3. Open a pull request describing the change and the verification performed.

## 📝 License

MIT — free to use for learning or commercial purposes.

---

*Classic Watch Pro · v3.0.0 · built with ❤️ and a lot of ☕*
