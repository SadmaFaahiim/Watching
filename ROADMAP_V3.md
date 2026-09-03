# 🗺️ Classic Watch Pro — Product Roadmap (v2.1 Baseline → v3.3 AI)

> Living document. Status of each release is tracked under its heading.
> Companion docs: `README.md`, `UPGRADE_SUMMARY.md`, `FILE_STRUCTURE.md`, `DEPLOYMENT.md`.

---

## 1. Reality Check — Audit Result

The docs describe a finished v2.0 (120+ files, all features), but the repository holds ~19 source files. The entire `src/features/` UI layer and `src/components/layout/` are missing, `tsconfig.node.json` is absent (type-check/build fail), and there are no tests or assets.

**What exists and is high quality (the foundation):**

- TypeScript domain types (`src/types/`)
- Zustand stores: auth (Firebase email/password + Google, admin check), cart, wishlist, theme
- React Query API layer: products (list/detail/featured/latest/search + admin CRUD), orders (user list, admin, status update, cancel, delete)
- `src/lib/`: axios with Firebase-token interceptor, Firebase init
- MUI dark/light theme (`#3867D6` primary, Inter, radius-12) + global styles
- Route guards (ProtectedRoute / AdminRoute), LoadingScreen, ErrorFallback
- `App.tsx` lazy-loaded route table, query client, toaster
- PWA + manual-chunk Vite config, utils/helpers

**Missing (docs claim it's done):** all feature pages, layouts (Header/Footer/MainLayout/DashboardLayout/Sidebar), UI primitives, `public/` PWA assets, tests, and working build tooling.

**Verdict:** v2.0 as documented was never finished in code. The foundation is excellent; the feature/UI layer and build config are missing. Every phase below starts from this reality.

---

## 2. Strategy

**Positioning:** a luxury-watch e-commerce experience where trust, curation, and service are the product — not just a catalog.

- **North-star metric:** repeat-buyer + referred-customer revenue share
- **Guardrail metrics:** conversion rate, AOV, cart abandonment, search success, LCP ≤ 2.5s, admin task time
- **Funding rule:** trust & commerce features first (lift conversion), AI second (compounds once data exists)

---
## 3. Release Roadmap

### Release 2.1 — Baseline Completion *(make the documented v2.0 real)*

Roles: Tech Lead, Frontend Developers, QA Engineers

1. **Repair tooling:** add `tsconfig.node.json`, resolve `baseUrl` deprecation → `npm run type-check`, `lint`, `build` all green.
2. **Build the missing UI layer** inside the existing skeleton. Every route in `App.tsx` maps to already-scaffolded work:
   - Layouts: `MainLayout` (Header/Footer), `DashboardLayout` (Sidebar)
   - Home: Hero, Featured/Latest rails (`useFeaturedProducts`, `useLatestProducts`), Categories, Testimonials
   - Products: grid (`useProducts`), filters/sort (`ProductFilters`, `SortOption` types), search (`useSearchProducts`), detail w/ gallery + specs + reviews
   - Cart / Checkout: `useCartStore`; React Hook Form + Zod forms
   - Auth: Login/Register/Profile via `useAuthStore` (email/password + Google implemented)
   - Orders: My Orders + order detail timeline (orders API hooks); Wishlist page (`useWishlistStore`)
   - Admin: stats, product table/form (CRUD hooks), orders table (`useUpdateOrderStatus`, `useCancelOrder`), users
3. **Assets:** `public/` icons so `vite-plugin-pwa` works.
4. **QA:** store unit tests (cart totals, wishlist dedupe, auth state) + RTL tests of the buy flow.
5. **Exit gate:** fresh clone → install → dev → end-to-end purchase works; build passes; Lighthouse ≥ 90; docs updated to match reality.

**Estimate:** 2–4 dev-weeks (single dev), ~1 week paired. | **Status:** ⬜ Not started

---

### Release 3.0 — Trust, Commerce & Experience

Roles: Product Manager, Business Analyst, UX Researcher, Designers, Frontend + Backend Developers

**Commerce & trust (PM/BA):**

- Real payment: wire Stripe (or regional rails); `Order.paymentMethod: card | cod | wallet` is modeled; webhook → `paymentStatus` updates
- Order tracking timeline + notifications; email on status change
- Verified-buyer + photo reviews (`Review` has `verified`, `helpful`, `images`)
- Authenticity, warranty & returns pages; promo codes & gift cards; saved addresses; guest checkout

**UX research (UX Researcher):**

- Personas: first-time luxury buyer, collector, gift-giver
- Test the three money flows: discover → buy, post-purchase tracking, returns
- Funnel analytics event spec before building dashboards

**UI overhaul (Product/UI/UX Designer):** full design-language refresh — see §4.

**Exit gate:** token-level design refactor merged; funnel analytics live; usability tests pass on top-3 flows.

**Estimate:** 6–8 dev-weeks (frontend-heavy), design overlaps from the start. | **Status:** ⬜ Not started

---

### Release 3.1 — Intelligence 1: behavioral AI (zero/low cost)

Roles: Data Analyst, AI/ML Engineers, Backend Developers, Product Analyst

1. **"Frequently bought together" + "Because you viewed"** — item-item co-occurrence from orders and view history (server-side tables; no ML infra)
2. **Recently-viewed rail** (client-side via localStorage)
3. **Price-drop & back-in-stock alerts** (rules + notification; `Product.stock` exists)
4. **Search v1 upgrade:** typo tolerance, synonyms, weighted ranking (stock/rating/margin), no-results → suggestion fallback
5. **Admin intelligence:** revenue & top-product dashboards, low-stock forecasts (moving average), anomaly flags, CSV exports
6. **Structured review capture:** prompt buyers for tags (water resistance, strap comfort, dial legibility…) — feeds Release 3.3 summarization
7. Instrument analytics (GA4/PostHog custom events) as the data backbone

**Exit gate:** recommendation CTR ≥ 8% on home rails; measurable search-success lift; weekly admin dashboard adoption.

**Estimate:** 3–4 dev-weeks + backend API additions. | **Status:** ⬜ Not started

---

### Hardening Track *(runs across all releases)*

Roles: DevOps/SRE, Cloud Engineer, Security/Pentester, QA/Automation/Performance Tester, DBA, Engineering Manager, Technical Writer, Ops/Support/Customer Success

- CI (GitHub Actions: lint → type-check → test → build), preview deploys, Lighthouse CI budget
- Sentry error tracking + structured logging; CD to Firebase/Vercel
- Security: Firestore security rules, backend rate limiting, `npm audit` gate, admin action audit-log, secrets hygiene (**`VITE_` vars are public** — never ship keys), pentest of auth + admin
- Performance: LCP ≤ 2.5s budget; Cloudinary WebP/AVIF pipeline
- QA: Playwright smoke (buy flow, admin CRUD, auth), axe a11y scan, checkout load test
- Ops/CS: support runbook (order issues, refunds, authenticity questions), escalation paths
- **Exit gate:** CI green on every PR; no high-severity pentest findings; p95 checkout < 3s at 2× load

**Status:** ⬜ Not started (continuous once Release 2.1 lands)

---

### Release 3.2 — Intelligence 2: semantic search & recommendations v2

Roles: AI/ML Engineers, Data Engineer, Frontend Developers

1. **Semantic catalog search:** embed product specs + descriptions (the `specifications` object — movement, case diameter, water resistance, strap…) into a vector index (Firestore vector / Typesense), rerank with rules. Answers queries like "waterproof chronograph under $2k for daily wear"
2. **Recommendations v2:** hybrid behavioral + embedding similarity
3. **Stretch:** photo search (upload a watch photo → similar products, CLIP-style embeddings)

**Status:** ⬜ Not started | **Depends on:** Release 3.1 analytics data

---

### Release 3.3 — Intelligence 3: LLM concierge & copilots

Roles: AI/ML Engineers, Security Engineer, Product Manager, Customer Success

1. **AI Shopping Concierge** — RAG chat over catalog + care guides + shipping + FAQs: "dress watch for a 50th anniversary under $5k" → grounded product-card answers with deep links. **Guardrails:** answer only from the indexed corpus; escalate when unsourced; consent + monthly cost cap
2. **Review intelligence:** auto pros/cons + sentiment summaries (buyer product page + admin view)
3. **Admin copilot:** natural-language dashboard Q&A, auto weekly business summary, restock-plan drafts
4. **Content copilot:** SEO description drafts from specs (EN + BN), human-approve workflow
5. **Support deflection:** answer suggestions to CS from the same RAG index

**Exit gate:** concierge deflects ≥ 30% of basic tickets; hallucination eval suite in CI (0 high-severity); measurable recommendation revenue; AI cost under budget cap.

**Status:** ⬜ Not started | **Depends on:** Release 3.2 + backend RAG

---

## 4. UI / UX Change List

**Why:** the current theme is competent but generic-SaaS — bright blue `#3867D6`, flat cards, Inter everywhere. Luxury watch buyers respond to restraint, editorial type, and cinematic imagery.

**Design-system change (token-level, not rewrite):**

- Typography: add a serif display face (e.g., Playfair Display / Cormorant) for headings; keep Inter for body; tightened letter-spacing at display sizes
- Palette: ivory/charcoal neutrals, restrained gold accent (~`#C9A227`) replacing loud blue as signature; full light/dark token parity
- Density & spacing: more whitespace, refined 8/16 radius rhythm, calmer shadows

**Page-by-page:**

- **Home:** full-bleed cinematic hero → curated "Collections" → social proof → editorial lookbook
- **Product cards:** quieter borders, hover quick-view, refined badges, wishlist heart animation
- **Product detail:** sticky image gallery w/ zoom + video teaser, sticky purchase bar, trust row (authentic • insured shipping • warranty), spec-compare drawer, review summary header
- **Catalog:** mobile filter sheet, sort pill bar, recently-viewed rail
- **Checkout:** 3-step progress, guest checkout, sticky order summary
- **Auth:** luxury centered card / split-screen with brand story
- **Dashboard & Admin:** KPI stat cards + charts, bulk row actions, Cloudinary image upload, low-stock & pending-order alert banners
- **System:** skeleton loaders, empty/error states, micro-interactions, dark-mode parity on every page, WCAG AA

---

## 5. AI Feature Backlog — Mapped to This Codebase

| AI feature | Builds on | Cost tier | Release |
|---|---|---|---|
| FBT / "Because you viewed" | order + view data | Free (rules) | 3.1 |
| Recently viewed | localStorage pattern from `wishlist.store` | Free | 3.1 |
| Price-drop / restock alerts | `Product.stock` | Free | 3.1 |
| Search v1 (typo/synonym/ranking) | `useSearchProducts` upgrade | Free | 3.1 |
| Admin insights & forecasts | product/order APIs + analytics | Free | 3.1 |
| Structured review tags | `Review` type (+ tags field) | Free | 3.1 |
| Semantic search | embeddings over `Product.specifications` | Cheap (embeddings + vector) | 3.2 |
| Recommendations v2 | hybrid behavioral + embedding | Cheap | 3.2 |
| Photo search (stretch) | CLIP-style image embeddings | Cheap–medium | 3.2 |
| Review summarization | structured tags + reviews | LLM | 3.3 |
| AI Concierge (RAG chat) | catalog + FAQ corpus + product cards | LLM | 3.3 |
| Admin copilot / weekly summary | analytics + orders | LLM | 3.3 |
| Content copilot (EN/BN SEO drafts) | product specs | LLM | 3.3 |
| CS answer suggestions | same RAG index | LLM | 3.3 |

**Data-readiness prerequisite:** clean taxonomy, normalized specs, analytics events for view/cart/order — every AI phase gates on this (why 3.1 precedes 3.2/3.3).

---

## 6. Sequencing & Effort

| Release | Theme | Effort (single dev ≈) | Depends on |
|---|---|---|---|
| 2.1 | Baseline completion | 2–4 wk | — |
| 3.0 | Trust + commerce + design | 6–8 wk | 2.1 |
| 3.1 | Behavioral AI + analytics | 3–4 wk | 3.0 data events |
| Hardening | CI / security / QA | continuous | 2.1 |
| 3.2 | Semantic search / recs | 4–6 wk | 3.1 data |
| 3.3 | LLM concierge / copilots | 6–8 wk (incremental) | 3.2 + backend RAG |

Realistic path to 3.3: ~6–9 months of steady work with the hardening track woven in.

---

## 7. Risks & Prerequisites

1. **Backend is outside this repo** (`classic-watch-server.onrender.com`): payments, reviews, recommendations, and analytics endpoints are a parallel backend workstream — the biggest hidden dependency
2. **Docs overstate reality:** gate each release on verified working code, not doc claims
3. **No real env credentials** in the repo — needed before live auth/payment testing
4. Free-tier Render cold starts hurt perceived performance — plan a warm-up or move API hosting during hardening

---

## 8. KPI Dashboard (suggested)

| Phase | Primary KPI |
|---|---|
| 2.1 | Build green; buy-flow passes E2E; Lighthouse ≥ 90 |
| 3.0 | Conversion rate, AOV, checkout abandonment |
| 3.1 | Recommendation CTR ≥ 8%; search success; weekly admin adoption |
| Hardening | CI green/PR; pentest findings = 0 high; p95 checkout < 3s @ 2× |
| 3.2 | Semantic-search success & no-results rate |
| 3.3 | Ticket deflection ≥ 30%; hallucination incidents = 0; AI cost ≤ budget |

---

## 9. Immediate Next Steps

1. [x] This roadmap written as a living artifact
2. [ ] Kick off **Release 2.1**: fix tooling (tsconfig + build green), then build pages feature-by-feature
3. [ ] Draft the backend API contract list (payments / recommendations / analytics / reviews) for the server repo
