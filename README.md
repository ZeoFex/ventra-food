# Ventra Food POS

Restaurant **point of sale** UI built with the Next.js App Router. It includes a staff-facing POS shell, kitchen views, and a **guest QR menu** for mobile ordering from the table.

## Tech stack

| Layer | Choice |
|--------|--------|
| Runtime | [Next.js](https://nextjs.org) **16** (App Router) |
| UI | [React](https://react.dev) **19**, [Tailwind CSS](https://tailwindcss.com) **4** |
| Language | TypeScript |
| Icons | [Lucide React](https://lucide.dev) |
| QR codes | [`qrcode.react`](https://github.com/zpao/qrcode.react) |

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:3000** for the POS. Use **http://localhost:3000/menu** for the guest menu and **http://localhost:3000/menu/qr** for staff QR setup.

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint
```

## App routes

Staff and operational screens live under the root `app/` tree:

| Path | Purpose |
|------|---------|
| `/` | POS home (ordering / primary workspace) |
| `/dashboard` | Dashboard |
| `/customers` | Customers |
| `/invoices` | Invoices |
| `/payments` | Payments |
| `/discounts` | Discounts & coupons (create codes, apply at POS) |
| `/finances` | Finances — revenue, expenses, ledger (POS sales auto-post) |
| `/reservations` | Reservations |
| `/tables` | Tables |
| `/settings` | Settings |
| `/kitchen-config` | Kitchen configuration |
| `/kitchen/login` | Kitchen login |
| `/kitchen/board` | Kitchen board |

### QR menu (guest + staff)

| Path | Audience | Description |
|------|-----------|-------------|
| `/menu` | **Guest** | Mobile-first table menu: browse categories, search, cart, place order. Supports `?table=` (e.g. `/menu?table=6`) for table labeling. |
| `/menu/qr` | **Staff** | Generates an on-page QR that deep-links to `/menu` (with optional table query). Copy link, preview guest view, same sidebar chrome as the rest of the POS. |

Guest layout sets dedicated **metadata** and **viewport** (theme color, safe mobile scaling) in `app/menu/(guest)/layout.tsx`.

## Key implementation notes

- **Guest menu UI:** `components/guest-menu/guest-menu-app.tsx` — uses sellable menu + hierarchical categories from context.
- **Menu categories:** `lib/menu-categories.ts`, persisted in `ventra_menu_categories_v1` alongside dishes (`ventra_sellable_dishes_v1`).
- **QR setup:** `components/menu-qr/menu-qr-setup.tsx`, page entry `app/menu/qr/page.tsx`.
- **POS shell:** Sidebar navigation in `components/pos/app-sidebar.tsx` (includes **QR menu** → `/menu/qr`).
- **QR orders in POS:** `components/pos/qr-menu-orders-modal.tsx` lists demo + incoming orders. On open, it merges payloads from **`sessionStorage`** key **`ventra_guest_orders_queue`** (written when a guest taps **Place order**), keyed by order `ref` to avoid duplicates. With **`KV_REST_API_URL`**, **`KV_REST_API_TOKEN`**, and **`NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN`**, guest phones push to Redis and POS polls `/api/qr-orders/poll`.
- **Kitchen board (KLD):** Tickets from **KOT & Print** (and QR→kitchen) sync through **`/api/kitchen-tickets`** when the same Redis + relay token env vars are set. POS pushes on fire; `/kitchen/board` polls every ~800ms. Status changes on the board PATCH back to Redis. Without Redis, tickets stay in **localStorage** (same browser only).

> **Production:** Set Upstash/Vercel KV and a long random **`NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN`** on every deployment (POS + kitchen URLs). Optional: **`NEXT_PUBLIC_KITCHEN_RELAY_TOKEN`** if you want a separate kitchen secret.

## Project layout (high level)

```
app/                    # Routes (App Router)
components/
  guest-menu/           # Guest ordering experience
  menu-qr/              # Staff QR generator page body
  pos/                  # POS layout, header, sidebar, QR orders modal
lib/                    # Shared helpers (e.g. menu data, formatting)
```

## Deploying

Deploy like any Next.js app (e.g. [Vercel](https://vercel.com) or a Node host running `next start`). Ensure the **public URL** used in production is the one encoded in QR codes at `/menu/qr` (the app uses `window.location.origin` on the client).
