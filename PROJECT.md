# Flowd — Project Documentation

> **DOCUMENTATION RULE:** Every session working on this project MUST end with an update to this file.
> Log what was built, changed, or fixed under the `## Changelog` section.
> Any AI tool (Claude Code or otherwise) working on this project must read this file first and update it when done.

---

## Overview

**Flowd** is a SaaS platform for Algerian e-commerce business owners.
It unifies order management, AI-powered chatbot, delivery tracking, and platform integrations in one dashboard.

**Vision:** A business owner starts a campaign → customers place orders via Instagram, Messenger, or their store → all orders land in one dashboard → owner ships via delivery companies → owner tracks all parcels in real-time. The AI chatbot handles customer conversations automatically, speaking Darija, French, or English in the owner's own tone.

**Location:** `C:\Users\Dell\Desktop\flowd 0.2`
**Repository branch convention:** `claude/<name>` for Claude-driven work, `main` for production.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth + DB + Realtime | Supabase (`@supabase/ssr` + `@supabase/supabase-js`) |
| AI Chatbot (streaming) | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| AI Style Analysis | Google Gemini 2.5 Flash |
| AI (secondary) | Groq — `llama-3.3-70b-versatile` (`groq-sdk`) |
| State management | Zustand + React Context |
| Data fetching | TanStack Query v5 |
| Tables | TanStack Table v8 |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| Icons | Lucide React |
| Date utilities | date-fns |

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI — Flowd uses Gemini exclusively (Google Gemini 2.5 Flash)
GEMINI_API_KEY=

# Meta OAuth integration (Instagram, Messenger, WhatsApp)
META_APP_ID=                        # From Meta App Settings → Basic
META_APP_SECRET=                    # From Meta App Settings → Basic
META_WEBHOOK_VERIFY_TOKEN=          # Any secret string — must match Meta webhook config
NEXT_PUBLIC_APP_URL=                # Your deployed URL, e.g. https://flowd-nine.vercel.app
NEXT_PUBLIC_META_APP_ID=            # Same as META_APP_ID (exposed to client for WhatsApp SDK)

# Vercel Cron security
CRON_SECRET=                        # Any secret string — Vercel sends this as Bearer token
```

> **Note:** Flowd does NOT use Groq. All AI (chatbot webhook + streaming chat + landing page generation) runs on **Google Gemini 2.5 Flash** via `GEMINI_API_KEY`.

---

## Project Structure

```
flowd 0.2/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx          — Supabase email/password auth
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx            — Main dashboard (metrics, orders, delivery, chatbot feed)
│   │   │       ├── orders/page.tsx     — Full orders table with filters, bulk actions, drawer, create modal
│   │   │       ├── chatbot/page.tsx    — 3-panel chatbot UI with Gemini streaming + Realtime
│   │   │       ├── integrations/page.tsx — Integration cards (Instagram, Messenger, Shopify, etc.)
│   │   │       ├── delivery/page.tsx   — Parcel table + tracking timeline modal
│   │   │       ├── team/page.tsx       — Members table, permissions grid, invite modal
│   │   │       ├── landing-pages/page.tsx — AI landing page generator + pages list
│   │   │       └── settings/page.tsx   — Inner nav: Business, Chatbot, Notifications, Profile, Password, Danger zone
│   │   ├── p/
│   │   │   └── [slug]/page.tsx         — Public product landing page (no auth required)
│   │   ├── api/
│   │   │   ├── auth/callback/route.ts       — Supabase OAuth callback
│   │   │   ├── chatbot/route.ts             — Gemini streaming chat endpoint
│   │   │   ├── orders/route.ts              — CRUD for orders
│   │   │   ├── delivery/sync/route.ts       — Sync parcels from delivery carrier APIs
│   │   │   ├── team/invite/route.ts         — Send team invitation emails
│   │   │   ├── onboarding/route.ts          — Onboarding workspace setup
│   │   │   ├── workspace/route.ts           — Workspace CRUD
│   │   │   ├── workspace/create/route.ts    — Create new workspace
│   │   │   ├── workspace/switch/route.ts    — Switch active workspace
│   │   │   ├── webhooks/meta/route.ts       — Instagram / Messenger webhook receiver
│   │   │   ├── landing-pages/
│   │   │   │   ├── route.ts                 — GET list pages, DELETE page
│   │   │   │   ├── generate/route.ts        — Gemini generates full HTML landing page
│   │   │   │   ├── order/route.ts           — Public: receive order from landing page form
│   │   │   │   ├── analyze-image/route.ts   — Gemini vision auto-fill from product photo
│   │   │   │   └── [id]/route.ts            — PATCH status (active/paused/archived)
│   │   │   └── integrations/
│   │   │       ├── analyze-style/route.ts   — Gemini style analysis from past messages
│   │   │       └── validate/route.ts        — Validate integration credentials
│   │   ├── landing/page.tsx                 — Public landing page
│   │   ├── onboarding/page.tsx              — New user onboarding flow
│   │   └── layout.tsx / globals.css
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   ├── dashboard/
│   │   │   ├── ChatbotFeed.tsx
│   │   │   ├── DashboardShell.tsx
│   │   │   ├── DeliveryPanel.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   └── RecentOrdersTable.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── WorkspaceSwitcher.tsx
│   │   ├── orders/
│   │   │   ├── CreateOrderModal.tsx
│   │   │   ├── OrderDrawer.tsx
│   │   │   └── OrderStatusBadge.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── Spinner.tsx
│   ├── contexts/
│   │   ├── LanguageContext.tsx          — i18n language switching
│   │   ├── MobileNavContext.tsx         — Mobile sidebar open/close state
│   │   └── WorkspaceContext.tsx         — Active workspace context
│   ├── hooks/
│   │   ├── useRealtimeMessages.ts       — Supabase Realtime for chat messages
│   │   ├── useRealtimeOrders.ts         — Supabase Realtime for orders
│   │   └── useRealtimeParcels.ts        — Supabase Realtime for delivery parcels
│   ├── lib/
│   │   ├── claude.ts                    — Gemini client, detectLanguage, buildSystemPrompt, fetchProductCatalog
│   │   ├── groq.ts                      — Groq client (lazy singleton), re-exports from claude.ts
│   │   ├── i18n.ts                      — Translation strings
│   │   ├── active-workspace.ts          — Get current workspace ID from cookie/session
│   │   ├── utils.ts                     — Shared utilities (cn, formatDate, etc.)
│   │   └── supabase/
│   │       ├── client.ts                — Browser Supabase client
│   │       └── server.ts                — Server Supabase client
│   ├── stores/
│   │   └── workspaceStore.ts            — Zustand store for workspace state
│   ├── types/
│   │   └── database.ts                  — All TypeScript types (see Database Schema section)
│   └── constants/
│       └── wilayas.ts                   — All 58 Algerian wilayas
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql       — Full DB schema
│       └── 002_landing_pages.sql        — landing_pages table + RLS + increment functions
├── middleware.ts                        — Auth guard: redirects unauthenticated users, skips login for authed
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema (Supabase)

### Tables

**`workspaces`**
- `id`, `name`, `slug`, `logo_url`
- `chatbot_config` (JSONB): `persona`, `language_mode`, `greeting`, `order_instructions`, `languages`, `style_profile`, `style_analyzed_at`, `style_source`

**`users`** (Supabase auth + profile)
- `id`, `email`, `full_name`, `avatar_url`, `created_at`

**`team_members`**
- `id`, `workspace_id`, `user_id`, `role` (`owner | admin | confirmer | agent`), `invited_by`, `joined_at`

**`orders`**
- `id`, `workspace_id`, `reference`, `customer_name`, `customer_phone`
- `wilaya_code`, `commune`, `address`, `product_name`, `quantity`, `unit_price`, `total_price`
- `status`: `pending | confirmed | ready | shipped | delivered | returned | cancelled`
- `source`: `manual | messenger | instagram | shopify | woocommerce | google_sheets`
- `notes`, `created_by`, `created_at`, `updated_at`

**`conversations`**
- `id`, `workspace_id`, `channel` (`messenger | instagram | web | manual`)
- `external_id`, `customer_name`, `customer_phone`, `customer_ig_handle`, `wilaya_code`
- `status`: `open | resolved | bot | human_takeover`
- `assigned_to`, `order_id`, `language_detected`

**`messages`**
- `id`, `conversation_id`, `role` (`user | assistant | system`), `content`, `metadata`

**`integrations`**
- `id`, `workspace_id`, `type`, `label`, `credentials` (JSONB), `is_active`, `last_synced_at`
- Types: `messenger | instagram | whatsapp | shopify | woocommerce | google_sheets | yalidine | zr_express | maystro | eddyapp`

**`delivery_parcels`**
- `id`, `workspace_id`, `order_id`, `tracking_number`, `carrier`
- `status`: `pending_pickup | picked_up | in_transit | out_for_delivery | delivered | failed_attempt | returned_to_sender | lost`
- `wilaya_code`, `commune`, `recipient_name`, `recipient_phone`, `cod_amount`
- `status_history` (JSONB array), `carrier_raw` (JSONB), `shipped_at`, `delivered_at`

### Realtime
Enable Realtime on these tables in Supabase Dashboard:
- `orders`
- `messages`
- `delivery_parcels`
- `conversations`

---

## AI / Chatbot Architecture

### Chatbot Flow (`/api/chatbot`)
1. Authenticated user POSTs `{ conversationId, content }`
2. Fetch workspace `chatbot_config` from Supabase
3. Load last 20 messages from DB as chat history
4. Detect language via `detectLanguage()` (Darija → Arabic chars or Latin Darija words, French → French words, else English)
5. If Google Sheets integration active → fetch product catalog via Sheets API
6. Build system prompt via `buildSystemPrompt()` — includes language rule, persona, style profile, catalog
7. Stream response from **Gemini 2.5 Flash** using `startChat().sendMessageStream()`
8. Save assistant reply to `messages` table
9. Return streaming `text/plain` response

### Style Analysis Flow (`/api/integrations/analyze-style`)
1. Fetch owner's past messages from Instagram Graph API (`graph.instagram.com/v21.0/{pageId}/conversations`)
2. Fallback: use stored assistant messages from Supabase DB
3. Send sample (up to 80 messages) to Gemini 2.5 Flash with analysis prompt
4. Returns JSON: `tone`, `languages`, `greeting_style`, `confirmation_style`, `emoji_usage`, `common_phrases`, `style_instructions`
5. Save `style_profile` back to `workspaces.chatbot_config`

### Groq (`src/lib/groq.ts`)
- Model: `llama-3.3-70b-versatile`
- Lazy singleton, only instantiated at runtime
- Re-exports `detectLanguage`, `buildSystemPrompt`, `ChatbotConfig`, `StyleProfile` from `claude.ts`

---

## Auth & Routing

**Middleware** (`middleware.ts`):
- Unauthenticated → `/dashboard` or `/onboarding` → redirect to `/`
- Authenticated → `/login` or `/landing` → redirect to `/dashboard`

**Auth flow**: Supabase email/password. Callback at `/api/auth/callback`.

---

## Multi-Workspace

- Users can belong to multiple workspaces
- Active workspace stored in cookie/session via `src/lib/active-workspace.ts`
- Switch workspace via `/api/workspace/switch`
- `WorkspaceSwitcher` component in sidebar
- Zustand store (`workspaceStore.ts`) holds client-side workspace state

---

## Integrations Supported

| Name | Type | Purpose |
|---|---|---|
| Instagram | `instagram` | Chatbot channel + style analysis |
| Messenger | `messenger` | Chatbot channel |
| WhatsApp | `whatsapp` | Future chatbot channel |
| Shopify | `shopify` | Import orders |
| WooCommerce | `woocommerce` | Import orders |
| Google Sheets | `google_sheets` | Product catalog for chatbot |
| Yalidine | `yalidine` | Algerian delivery company |
| ZR Express | `zr_express` | Algerian delivery company |
| Maystro | `maystro` | Algerian delivery company |
| EddyApp | `eddyapp` | Algerian delivery company |

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local   # or create manually — see env vars section above

# 3. Run DB migration
# Go to Supabase Dashboard → SQL Editor → paste supabase/migrations/001_initial_schema.sql

# 4. Enable Realtime in Supabase Dashboard for:
#    orders, messages, delivery_parcels, conversations

# 5. Start dev server
npm run dev
```

---

## Currency & Locale

- All prices in **Algerian Dinar (DA)**
- 58 wilayas defined in `src/constants/wilayas.ts`
- Chatbot supports: **Darija** (Arabic + Latin), **French**, **English**, **Arabic**

---

## Build Status

`npm run build` — passes cleanly as of initial scaffold.

---

## Changelog

### 2026-04-25 — Fix Vercel build TypeScript errors (webhook route)
- Fixed 3 successive TypeScript `never` inference errors caused by untyped Supabase service-role client
- Root cause: `createClient` without a Database generic causes all `.from().select()` chain results to be typed as `never`
- Fix: typed `_supabaseAdmin` as `any` so all query results propagate as `any` instead of `never`
- Deployment `dpl_7dRCgZEaUdQKM9NLstBdbe5KtAof` confirmed READY — flowd-nine.vercel.app is live

### 2026-04-24 — Wire Meta connect buttons into integrations page
- Updated `src/app/(dashboard)/dashboard/integrations/page.tsx`:
  - Imported `useMetaConnect` hook
  - Added three hook calls (instagram, messenger, whatsapp) initialized from live Supabase data
  - Instagram/Messenger/WhatsApp cards now show "Connecter via Meta" OAuth button (idle/error), "Connexion…" spinner (connecting), Configure+Delete (connected)
  - "Manuel" fallback link preserved to open existing wizard/modal
  - Badge updates immediately from hook state; DB refresh triggered on OAuth success

### 2026-04-24 — Meta OAuth one-click integration
- Added `src/app/api/integrations/meta/connect/route.ts` — initiates OAuth popup flow for Instagram, Messenger, WhatsApp
- Added `src/app/api/integrations/meta/callback/route.ts` — exchanges code for long-lived token, subscribes page to webhooks, upserts to `integrations` table
- Added `src/hooks/useMetaConnect.ts` — React hook managing popup lifecycle, postMessage handling, and connect/disconnect status
- Added `src/app/api/integrations/meta/webhook/route.ts` — Meta webhook verification endpoint
- Requires new env vars: `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `NEXT_PUBLIC_APP_URL`

### 2026-04-24 — Fix light/dark theme switcher (all elements now respond)
- `tailwind.config.ts`: replaced all hardcoded dark hex values with CSS variable references (`var(--bg-card)`, `var(--border)`, `var(--text-4)`, etc.) so every Tailwind class flips when `[data-theme="light"]` is applied
- `globals.css`: added `[data-theme="light"] .text-white { color: var(--text-1) }` override so primary text becomes dark in light mode; added input/select color fixes for light theme

### 2026-04-24 — Platform logo + live search bar
- `Sidebar.tsx`: `FlowdLogo` now loads `/logos/flowd.svg` via `<img>` instead of inline SVG path
- `Topbar.tsx`: fully functional live search — debounced (280ms), queries orders + conversations + delivery_parcels via Supabase ilike, shows results dropdown with type badges, click navigates to relevant page; loading spinner during query, empty state, outside-click close

### 2026-04-24 — Real logos + notification panel
- Added `public/logos/` folder with 10 SVG logos: Instagram, Messenger, WhatsApp, Shopify, WooCommerce, Google Sheets, Yalidine, ZR Express, Maystro, Flowd
- Integrations page: replaced emoji icons with real `<img>` logo files per integration card
- Delivery page table: carrier column now shows carrier logo alongside name
- DeliveryPanel (dashboard): carrier logo shown in parcel row icon slot
- Chatbot header + dashboard ChatbotFeed: Instagram/Messenger logo inline with channel name
- Topbar: notification bell now opens a dropdown panel (empty state with icon + "Aucune notification"), closes on outside click

### 2026-04-24 — Security fixes: workspace isolation hardening
- `api/landing-pages/route.ts` GET: now validates requested workspace_id against active workspace cookie (prevents cross-workspace data access)
- `api/delivery/sync/route.ts`: added `workspace_id` filter to `delivery_parcels` update and `integrations` update queries (defense in depth on top of workspace-scoped fetch)

### 2026-04-24 — Full UI redesign: Flowd visual identity
- Added CSS custom properties to `globals.css`: light (`[data-theme="light"]`) and dark (`:root`) themes with full variable set (`--bg-sidebar`, `--bg-card`, `--text-1`…`--text-5`, `--border`, `--shadow`, `--chart-line`, etc.)
- Added utility CSS classes: `.btn`, `.btn-ghost`, `.btn-icon`, `.btn-xs`→`.btn-lg`, `.btn-sq-sm/md`, `.page-pad`, `.fade-in`, `.metric-grid`, `.dash-layout`, `.chart-row`, `.integ-grid`, `.settings-layout`, `.settings-nav`, `.flowd-input`
- Updated `src/app/layout.tsx`: theme init script in `<head>` prevents flash on reload; Toaster uses CSS variables
- Rewrote `Sidebar.tsx`: new `FlowdLogo` SVG component (blue rounded square), 8 custom SVG `NavIcon` icons, all inline styles with CSS variables, workspace name pill
- Rewrote `Topbar.tsx`: `useDarkMode()` hook with localStorage persistence, breadcrumb with page label, search input (desktop), 3-language switcher (FR/EN/AR inline pills), dark/light toggle (sun/moon SVG), notification bell with red dot, user avatar dropdown with sign-out
- Updated `src/app/(dashboard)/layout.tsx`: wrapper uses CSS variable inline styles
- Rewrote `DashboardShell.tsx`: new `MetricCard` (icon + trend badge), `BarChart` SVG (monthly bars, last 3 highlighted in #0052FF), `LineChart` SVG (gradient fill area), uses `.metric-grid`, `.chart-row`, `.fade-in` classes
- Build: `npm run build` passes with 0 errors, 30 routes generated

### 2026-04-10 — Initial scaffold complete
- Built all 8 dashboard pages: `/login`, `/dashboard`, `/orders`, `/chatbot`, `/integrations`, `/delivery`, `/team`, `/settings`
- Set up Supabase auth, DB schema, Realtime hooks
- Integrated Gemini 2.5 Flash for chatbot streaming
- Added Groq (llama-3.3-70b) as secondary AI client
- All API routes implemented
- `npm run build` passes

### 2026-04-10 — Chatbot fixes
- Fixed chat history format for Groq (was using Gemini parts format, switched to plain content)
- Fixed style analysis to use `graph.instagram.com` + DB fallback
- Fixed language enforcement, warm persona, Darija detection improvements
- Rewrote system prompt: more human, conversational, no bullet points
- Fixed lazy Groq init, exported `ChatbotConfig` types

---

### 2026-04-18 — Landing page generator redesign (premium Dribbble-quality output)
- Completely rewrote the Gemini prompt in `/api/landing-pages/generate/route.ts`
- New prompt enforces a 9-section premium layout: sticky navbar, hero with product image, social proof bar, benefits cards, about-product (2-col), how-it-works steps, star-rated testimonials with avatar initials, split order form (product summary + form), multi-column footer
- Added design system spec: CSS custom properties, proper typography scale (clamp), card shadows, hover animations, scroll-triggered fade-in via IntersectionObserver
- Added full mobile responsive breakpoint (768px, all grids collapse to 1 column)
- Testimonials now use CSS avatar circles with initials + realistic Algerian names/cities
- All UI strings externalized into a translation map (French/Arabic) before building the prompt
- Product image (when provided) embedded as base64 in both hero and about sections

### 2026-04-17 — AI Landing Page Generator + Product Photo Upload

**New feature: AI-powered product landing page generator**

- **New table** `landing_pages` — migration `supabase/migrations/002_landing_pages.sql`
  - Fields: `id`, `workspace_id`, `slug`, `product_name`, `product_description`, `product_price`, `product_images`, `html_content`, `status`, `views`, `orders_count`, `created_at`, `updated_at`
  - RLS: public SELECT for active pages, workspace members manage their own pages
  - SQL functions: `increment_landing_page_orders(page_id)`, `increment_landing_page_views(page_id)`

- **New type** `LandingPage` in `src/types/database.ts`

- **New i18n keys** `landingPages` section added to all 3 languages (fr/en/ar) in `src/lib/i18n.ts`

- **New public route** `/p/[slug]` (`src/app/p/[slug]/page.tsx`)
  - No auth required — publicly accessible
  - Renders Gemini-generated HTML directly (dangerouslySetInnerHTML)
  - Increments view count on each visit
  - Full SEO metadata via `generateMetadata`

- **New dashboard page** `/dashboard/landing-pages` (`src/app/(dashboard)/dashboard/landing-pages/page.tsx`)
  - **Section A** — Create new page form:
    - Product photo upload zone (drag & drop or click, max 5 MB, JPEG/PNG/WebP)
    - "Auto-remplir avec l'IA" button: sends image to Gemini vision → auto-populates form fields
    - Form: product name, description, price, category, target audience, key benefits, color picker, language toggle (FR/AR)
    - "Générer avec l'IA ✨" button with rotating loading messages
    - Success banner with public URL + copy link + preview on generation
  - **Section B** — Pages table: status badge, views, orders count, date, copy/preview/pause/delete actions

- **New API routes:**
  - `POST /api/landing-pages/generate` — calls Gemini 2.5 Flash (multimodal if image provided) to generate full HTML landing page, saves to Supabase
  - `POST /api/landing-pages/order` — public endpoint, receives order from embedded form → creates record in `orders` table with `source: 'manual'` and landing page note
  - `POST /api/landing-pages/analyze-image` — Gemini vision analysis of product photo → returns `{ product_name, product_description, product_category, target_audience, key_benefits, suggested_color }`
  - `GET /api/landing-pages` — list pages by workspace
  - `DELETE /api/landing-pages?id=` — delete a page
  - `PATCH /api/landing-pages/[id]` — update page status (active/paused/archived)

- **Sidebar** updated: "Pages produit" nav item (Globe icon) added between Intégrations and Équipe

- **Middleware** updated: `/p/*` routes bypass auth and are always publicly accessible

- **Landing page embedded order form** hits `/api/landing-pages/order` → order flows into workspace `orders` table just like any other order

*Last updated: 2026-04-17*

### 2026-04-14 — Chatbot prompt overhaul + remove Style Analysis

- **Removed** "Style d'écriture IA" feature entirely:
  - Deleted `src/app/api/integrations/analyze-style/route.ts`
  - Removed `StyleAnalyzer` component from `settings/page.tsx`
  - Removed `StyleProfile` type from `src/lib/claude.ts`

- **Rewrote** `buildSystemPrompt()` in `src/lib/claude.ts` with a new Darija-first mega-prompt:
  - Bot auto-detects customer language and mirrors it (Darija, French, English, mixed)
  - Deep Darija understanding: real Algerian expressions, Arabic script by default
  - Built-in capabilities: greeting, product inquiry, order collection, order confirmation (generates `ORD-XXXXXXXX` IDs), delivery questions, price negotiation, unknown questions, order status
  - Strict rules section (no MSA, no hallucinated products, no "I'm an AI", mobile-friendly message length)
  - New function signature: `buildSystemPrompt(config, storeName, catalog?)`

- **Simplified** `ChatbotConfig` interface — now has 3 main fields:
  - `product_category` — what the store sells
  - `delivery_days` — delivery timeframe
  - `payment_methods` — accepted payment methods

- **Updated** `settings/page.tsx` chatbot section: replaced persona/order_instructions/language toggles with the 3 new fields above

- **Updated** `/api/chatbot/route.ts`: now selects `name` from workspace and passes it as `storeName` to the prompt

*Last updated: 2026-04-14*

### 2026-04-21 — Landing page redesign: new visual identity + dark mode + i18n

- **Replaced** `src/app/landing/page.tsx` entirely with the new premium visual from `flowd_landing.html`
- New design: clean light-mode blue/white (`#0052FF` brand), grid hero background, browser mockup dashboard, full sections (logos, features 3-col grid, how-it-works interactive steps, integrations 5-col, pricing 3 plans, testimonials, CTA)
- **Dark / Light mode toggle** — moon/sun button in navbar; persisted to `localStorage`; CSS variables override via `[data-theme="dark"]` on root wrapper
- **Trilingual i18n**: Darija (🇩🇿 Latin script — primary default), Français, English — `localStorage` persisted
- **Mobile responsive**: hamburger menu, full responsive breakpoints (1024px / 768px / 400px), lang switcher in mobile menu
- **All buttons connected**: Sign in → `/login`, all "Get started / Bda majani / Commencer" → `/login?tab=signup`
- Pricing plan buttons: Starter + Growth → `/login?tab=signup`, Pro → `/login`
- How-it-works: 4 interactive steps with live visual preview (dangerouslySetInnerHTML mockups)
- SVG logo rendered as inline React component (blue in light mode, white in dark mode / sidebar / footer)

---

### 2026-04-21 — Full codebase bug scan & fixes (9 bugs fixed)

**CRITICAL**
- `src/app/api/webhooks/meta/route.ts`: Fixed `buildSystemPrompt` called with wrong arguments — was passing detected language string (`"darija"`) as the `storeName` parameter, causing all Meta webhook chatbot replies to show store name as "darija"/"french". Now passes `workspace.name` correctly. Also removed unused `detectLanguage` import and updated fallback `chatbot_config` to current schema.

**HIGH — Security**
- `src/app/api/orders/route.ts` (PATCH): Added `workspace_id` ownership check — previously any authenticated user could update any order by ID.
- `src/app/api/landing-pages/route.ts` (DELETE): Added `workspace_id` ownership check — previously any authenticated user could delete any landing page by ID.
- `src/app/api/landing-pages/[id]/route.ts` (PATCH): Added `workspace_id` ownership check on status update.

**HIGH — Build-time crash**
- `src/app/api/landing-pages/generate/route.ts`: Replaced module-level `new GoogleGenerativeAI(...)` with lazy `getGenAI()` singleton from `@/lib/claude`. Module-level instantiation crashes `next build` when `GEMINI_API_KEY` is unset.
- `src/app/api/landing-pages/analyze-image/route.ts`: Same fix.

**MEDIUM — Logic / UX**
- `src/app/(dashboard)/dashboard/chatbot/page.tsx`: Fixed duplicate messages in chat UI. Realtime `INSERT` handler now deduplicates by message ID. Removed redundant `fetchMessages()` call after streaming ends (Realtime already delivers saved messages).
- `src/app/api/onboarding/route.ts`: Fixed `chatbot_config` created during onboarding — was using old schema (`persona`, `language_mode`, `greeting`, `order_instructions`, `languages`). Now uses current schema (`product_category`, `delivery_days`, `payment_methods`).
- `src/app/api/landing-pages/order/route.ts`: Added input validation on all required fields (`customer_name`, `customer_phone`, `wilaya`, `commune`, `page_slug`) — this is a public unauthenticated endpoint.

**LOW — Stability**
- `src/contexts/LanguageContext.tsx`: Wrapped all `localStorage` calls in `try/catch` — throws in private browsing mode (Safari, Firefox strict).
- `src/app/(dashboard)/dashboard/landing-pages/page.tsx`: Fixed object URL memory leak — previous preview URL now revoked before creating new one, and revoked on component unmount.

---

### 2026-04-25 — Meta integration overhaul (10 fixes, production-ready)

**AI Stack clarification**
- Flowd uses **Google Gemini 2.5 Flash exclusively** for all AI. Groq is NOT used.
- Webhook handler (`/api/webhooks/meta`) migrated from Groq (`llama-3.3-70b`) to Gemini 2.5 Flash.
- Updated env vars documentation to remove `GROQ_API_KEY` and document all Meta + Cron vars.

**Integrations page — UX overhaul**
- Removed the 5-step Instagram wizard entirely (~300 lines deleted). Instagram and Messenger now use the OAuth button exclusively — zero manual token copying.
- Added missing **EddyApp** card to the Livraison category.
- Meta cards (Instagram, Messenger, WhatsApp) show a single "Connecter via Meta" button; non-Meta cards use the standard credentials modal.
- Added `TokenExpiryWarning` component — shows amber badge when token expires in ≤7 days.

**Critical bug fix — workspace_id**
- `src/app/api/integrations/meta/connect/route.ts`: Was querying `workspaces.eq('owner_id', user.id)` — `owner_id` column does not exist. Now resolves workspace via `team_members` table (`.eq('role', 'owner')`). Without this fix, all OAuth integrations were saved with the user's auth ID as workspace_id, breaking chatbot routing entirely.

**Security — webhook signature verification**
- `src/app/api/webhooks/meta/route.ts`: Added `X-Hub-Signature-256` HMAC-SHA256 verification on every POST. Requests that fail verification are rejected with 403. Prevents anyone from injecting fake messages into the chatbot.

**Performance — webhook async processing**
- Webhook now returns `200 OK` to Meta instantly using `waitUntil` from `@vercel/functions`, then processes the message in the background. Eliminates the 20-second timeout risk that caused Meta to disable webhook subscriptions.
- Integration lookup now queries by `credentials->>'page_id'` directly in JSONB instead of loading all integrations and filtering in JS. Scales to thousands of workspaces.

**DB migration — `003_integrations_token_expiry.sql`**
- Added `token_expires_at timestamptz` column to `integrations` table.
- Added `idx_integrations_page_id` index on `(credentials->>'page_id') WHERE is_active = true` for fast webhook routing.

**Token auto-refresh cron**
- New route: `src/app/api/cron/refresh-meta-tokens/route.ts`
- Secured by `CRON_SECRET` Bearer token.
- Runs every Monday at 09:00 UTC (configured in `vercel.json`).
- Calls `graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token` to reset the 60-day expiry on all active Meta tokens.
- Updates `token_expires_at` and `credentials.user_token` in Supabase.
- New file: `vercel.json` with cron schedule.

**Page picker after OAuth**
- `src/app/api/integrations/meta/callback/route.ts`: When the user manages multiple Facebook pages, the callback now sends a `META_PAGE_PICKER` postMessage to the opener instead of blindly taking `data[0]`.
- `integrations/page.tsx`: Listens for `META_PAGE_PICKER` and renders a `PagePickerModal` so the user selects which page to connect. The selected page's token and ID are saved to Supabase directly from the client.

**24-hour messaging window handling**
- Webhook detects if the incoming message timestamp is older than 24 hours (can happen on webhook retries).
- Expired-window conversations are marked `status: 'human_takeover'` in DB and a `WINDOW_EXPIRED` system message is logged.
- When Meta Graph API returns a 24h window error (code 10 or subcode 2018278/2018109), same handling applies.

**Opt-out / opt-in detection**
- Webhook checks for STOP keywords (`stop`, `arrête`, `waqf`, `وقف`, `بطل`, `حبس`, etc.) before calling Gemini.
- On STOP: conversation set to `resolved`, confirmation message sent, no further AI replies.
- On START: conversation reopened to `bot` status.

**New env vars required**
```
META_APP_ID=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_META_APP_ID=
CRON_SECRET=
```
