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
GEMINI_API_KEY=
GROQ_API_KEY=
```

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
