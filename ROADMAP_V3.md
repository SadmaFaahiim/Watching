# 🗺️ Classic Watch Pro — Product Roadmap (living document)

> Reality-checked: every release below is tracked against **working code**, not doc claims.
> Latest shipped: **v3.1.0** (trust & commerce + discovery + admin depth + E2E/telemetry).
> Companion docs: `README.md`, `UPGRADE_SUMMARY.md`, `DEPLOYMENT.md`.

---

## ✅ Release status

| Release | Theme                                                                                 | Status                                |
| ------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| 2.1     | Baseline completion (tooling, UI layer, PWA, tests)                                   | **✅ Shipped** (v2.1)                 |
| 3.0-a   | Trust & commerce — front-end slice (reviews, promos, compare, notifications, refunds) | **✅ Shipped** (v3.1)                 |
| 3.0-b   | Trust & commerce — backend slice (live payments, email/SMS, real backend)             | ⬜ Pending backend repo + credentials |
| 3.1     | Intelligence lite: recently-viewed, notifications, admin analytics depth              | **✅ Shipped** (v3.1)                 |
| —       | Design refresh (ivory/navy palette, serif display face, editorial cards)              | **✅ Shipped** (v3.1)                 |
| —       | QA & hardening: axe suite, Lighthouse CI budgets, Playwright E2E, Sentry              | **✅ Shipped** (v3.1)                 |
| 3.2     | Semantic search & recommendations v2 (embeddings)                                     | ⬜ Depends on real data/backend       |
| 3.3     | LLM concierge, review intelligence, admin/content copilots                            | ⬜ Depends on 3.2 + RAG backend       |

---

## 🚢 v3.1.0 (September 2026) — what actually shipped

**Trust & commerce (customer-facing)**

- Reviews & ratings: per-product list with rating-distribution summary, **verified-purchase badges**, helpful votes, and a write-review dialog. Mock DB gained a seeded `reviews` collection; product `rating`/`reviewCount` aggregates are **recomputed from live rows** on every write/delete, so the catalog never contradicts the review list.
- Promo codes: `WELCOME10` / `LUXE200` / `SUMMER20` seeded in the mock DB (percent + fixed, min-order, usage caps, expiry). Cart stores the applied promo; checkout shows the discount line, and order placement redeems it and records `discount` + `promoCode` on the order.
- Notification center: header bell with unread badge + feed; order placement, status changes, refunds and cancellations push live notifications (toasts too).
- Recently-viewed rail on Home (persisted, deduped, capped) and **quick-view** + **compare drawer** (up to 4 watches, spec-by-spec) on every product card.

**Admin depth**

- One-click **refunds** for paid orders (immutable audit event + notification; ineligible orders are rejected).
- **Top customers** by lifetime spend on the overview.
- **Review moderation queue** (`/admin/reviews`) — search + verified badge + remove (recomputes aggregates).
- Low-stock inventory panel (shipped earlier) kept; stock, orders and most-reviewed panels intact.

**Design & performance/a11y (no regression)**

- Token-level refresh: warm ivory light background, midnight-navy primary, editorial **Playfair Display** headings (async, fixed metrics → CLS-safe swap). Dark mode palette untouched (still AA+).
- 19-page axe regression suite (structural WCAG A/AA) incl. the new reviews page; Lighthouse CI budgets unchanged and green.

**QA & release engineering**

- **Playwright E2E** job in CI: buy-flow (incl. promo apply), auth + admin guard, moderation smoke — against the production build.
- **Sentry** wired but strictly lazy: zero bytes unless `VITE_SENTRY_DSN` is configured.
- **152 unit/component tests (23 files)**; lint 0 / tsc 0; `npm audit --omit=dev` gate kept.

**Demo-data model note:** `reviews` and `promoCodes` are persisted in the schema-versioned envelope and hydrate deterministic seeds when a snapshot predates them — old localStorage/backups upgrade in place, never silently discard.

---

## 🔭 Remaining by theme

### Release 3.0-b — Trust & commerce, backend half _(needs the server repo + credentials)_

- Live payments (Stripe or regional rails) + webhook-driven `paymentStatus`; real email on status change; saved address book; guest checkout; authenticity/warranty/returns pages; gift cards.
- Cross-device accounts once Firestore replaces the demo adapter.

### Hardening track _(continuous)_

- CI is green on every PR (3 jobs). Open items: preview deploys, Firestore security rules for the real backend, structured logging, checkout load test at 2× traffic.

### Release 3.2 — Semantic search & recommendations v2

- Embed product `specifications`/descriptions into a vector index; hybrid behavioral + embedding recommendations. **Gates on real analytics events + backend.**

### Release 3.3 — LLM concierge & copilots

- RAG concierge over the catalog/FAQ corpus (grounded answers + deep links, hallucination eval in CI), review pros/cons + sentiment summaries (structured review tags are captured today in `Review`), admin weekly summary, EN/BN content drafts. **Depends on 3.2 + a backend RAG endpoint.**

---

## ♟️ Sequencing principles

1. **Trust first, AI second** — every AI phase compounds once orders/views/reviews are real; the data readiness prerequisite (clean taxonomy, event capture) is still the gating step.
2. **Demo parity** — anything built client-side keeps working in zero-config demo mode; anything needing a backend is scoped separately and clearly flagged.
3. **Quality gates are non-negotiable** — lint/tsc/tests/build/E2E/Lighthouse/audit all green before merge; a11y (axe) and Lighthouse budgets guard every PR.

## 📊 North-star metrics

Repeat-buyer + referred revenue share; conversion/AOV/cart-abandonment once live analytics exist; recommendation CTR ≥ 8% (3.2); concierge deflection ≥ 30% with 0 high-severity hallucination incidents (3.3).
