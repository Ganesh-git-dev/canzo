# Canzo - Premium Landing Website & Web App

> A modern, scroll-driven marketing website + full web app for Canzo (https://canzo.in) — a college canteen pre-ordering platform built for **EASA College of Engineering and Technology**.

## Project Overview

**Canzo** is a campus dining solution that lets students pre-order meals, skip canteen queues, and pick up food when it's ready. This project includes:
1. **Marketing landing page** (`index.html`) with scroll-driven storytelling, loading screen, real-time clock, and fluid cursor
2. **Student web app** with login, register, dashboard, menu, cart, orders, and canteen listing pages
3. **Canteen admin panel** with dashboard, menu management, order management, analytics, and settings

**Design:** Purplish heavenly theme with floating orbs, gradient backgrounds, dark mode support, Apple-level polish, and Framer/Webflow-quality animations.

**Inspiration:** The Instagram reel style with dramatic expanding images + the Lovable app (canzo.lovable.app) with the real-time clock inside the Canzo logo's "O".

---

## Current Status: COMPLETE

- [x] Responsive marketing landing page with GSAP scroll animations
- [x] Animated loading screen with 5-phase cinematic reveal (clock → logo right-to-left sweep → zoom + bubbles)
- [x] Real-time analog clock inside Canzo logo's "O" (nav + hero)
- [x] Fluid cursor effect with purple trail
- [x] Dark mode toggle (all pages, persists to localStorage) — footer, navbar scrolled, hero tagline/subtitle, and loading screen logo locked to light-mode appearance
- [x] Role-based authentication (Student vs Canteen Admin) — modal on landing page, toggle on login/register
- [x] Role-based routing — canteen users go to canteen-dashboard.html, students go to dashboard.html
- [x] Shared order system between student and canteen via localStorage
- [x] Shared menu system — canteen admin CRUD reflects instantly on student menu page
- [x] Menu seeded with 8 items (biryani, burger, paneer tikka, salad, pastry, smoothie, dosa, fried rice)
- [x] Student checkout creates real orders → appears in canteen dashboard live queue + orders table
- [x] Canteen status updates (accept/preparing/ready/picked) reflect on student orders page
- [x] Real-time cross-tab sync via storage event listeners
- [x] localStorage cart persistence across all app pages
- [x] Menu search bar with real-time filtering by name and description
- [x] Category tabs auto-generated from menu data
- [x] Animated stat counters on dashboard with real order data
- [x] Loading screen caching (shows only on first visit)
- [x] All 18 images downloaded locally to `assets/images/`
- [x] SEO meta tags (OG, Twitter Card, description) on all 13 pages
- [x] Login page with role toggle (Student/Canteen Admin)
- [x] Register page with role toggle, conditional canteen fields
- [x] Student Dashboard with real stats from OrderSystem
- [x] Canteen listing page with 6 canteen cards
- [x] Menu page with dynamic category tabs, search, and food items
- [x] Cart page with dynamic rendering from localStorage
- [x] My Orders page with active + history orders from OrderSystem
- [x] Shared sidebar navigation — student sidebar (static) vs canteen sidebar (JS-generated)
- [x] Canteen admin dashboard with real stats, live order queue (accept/reject/ready)
- [x] Canteen admin menu CRUD with stock toggles, dynamic categories, modal form
- [x] Canteen admin order table with status dropdowns, filters, search, tab navigation
- [x] Canteen admin analytics: 7-day revenue chart, top-selling items, student frequency, low-demand tracking
- [x] Canteen admin settings with localStorage persistence, danger zone resets
- [x] Purplish heavenly theme with animated background orbs
- [x] "What is Canzo?" section with real-time features
- [x] Mobile responsive (sidebar toggles, stacked layouts, clocks hidden)
- [x] All internal navigation (no external redirects)
- [x] Footer updated with Canzo description

---

## File Structure

```
D:\canzo\website\
├── index.html              # Marketing landing page with role selection modal
├── login.html              # Login page with role toggle (Student/Canteen Admin)
├── register.html           # Registration page with role toggle + conditional fields
├── dashboard.html          # Student dashboard (real stats from OrderSystem)
├── canteens.html           # Canteen listing (6 cards)
├── menu.html               # Food menu (dynamic from MenuSystem, search, categories)
├── cart.html               # Shopping cart (dynamic, checkout creates orders)
├── orders.html             # Student orders (from OrderSystem, real-time sync)
├── canteen-dashboard.html  # Canteen admin (stats, live order queue)
├── canteen-menu.html       # Canteen menu management (CRUD, stock toggles)
├── canteen-orders.html     # Canteen order management (table, filters, status)
├── canteen-analytics.html  # Canteen analytics (revenue, top items, frequency)
├── canteen-settings.html   # Canteen settings (persistent, danger zone)
├── README.md               # This file
├── css/
│   ├── style.css           # Landing page styles (~1900 lines)
│   ├── app.css             # App pages + canteen admin + role selector (~2400 lines)
│   ├── loading.css         # Loading screen styles (~190 lines)
│   └── cursor.css          # Fluid cursor effect styles (~80 lines)
├── js/
│   ├── main.js             # GSAP animations for landing page (~400 lines)
│   ├── app.js              # Shared app JS (Cart, MenuSystem, OrderSystem, CanteenSystem, role routing, canteen admin)
│   ├── loading.js          # Loading screen animation with clock (~180 lines)
│   ├── clock.js            # Real-time analog clock component (~100 lines)
│   └── cursor.js           # Fluid cursor trail effect (~130 lines)
└── assets/
    └── images/             # 18 locally downloaded images (no external CDN)
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| HTML5 | - | Semantic markup |
| CSS3 | - | Styling, variables, dark mode, animations, responsive |
| JavaScript (Vanilla) | ES6+ | Cart, search, dark mode, clock, cursor, loading screen |
| GSAP | 3.12.5 | Landing page animations |
| GSAP ScrollTrigger | 3.12.5 | Scroll-driven animations |
| GSAP ScrollToPlugin | 3.12.5 | Smooth anchor scrolling |
| Google Fonts | - | Inter + Space Grotesk |

**CDN Dependencies** (loaded in `<head>`):
- `gsap.min.js`
- `ScrollTrigger.min.js`
- `ScrollToPlugin.min.js`

---

## Theme: Purplish Heavenly

### Color Palette (Light Mode)
```css
--color-primary: #1a1040          /* Deep purple (headings) */
--color-accent: #7c3aed           /* Violet accent (buttons, links) */
--color-accent-light: #a78bfa     /* Lighter violet */
--color-accent-dark: #6d28d9      /* Darker violet (hover) */
--color-accent-glow: rgba(124, 58, 237, 0.4)
--heavenly-bg-1: #f5f0ff          /* Soft lavender white */
--heavenly-bg-2: #ede4ff          /* Light purple */
--heavenly-bg-3: #e0d0ff          /* Medium purple */
--heavenly-glow: rgba(167, 139, 250, 0.15)
```

### Color Palette (Dark Mode)
```css
--color-primary: #e8e0f8          /* Light lavender (headings) */
--color-accent: #8b5cf6           /* Brighter violet */
--heavenly-bg-1: #0f0825          /* Deep dark purple */
--heavenly-bg-2: #160d38          /* Slightly lighter dark purple */
--heavenly-bg-3: #1e1250          /* Mid dark purple */
```

### Dark Mode
- **Toggle:** Navbar button on landing page, floating circular button (bottom-left) on app pages
- **Persistence:** `localStorage.setItem('canzo_theme', 'dark')`
- **Coverage:** All backgrounds, cards, forms, overlays, inputs, text, shadows
- **Activation:** `data-theme="dark"` attribute on `<html>` element
- **Preserved (always light-mode appearance):**
  - Footer (background `#1a1040`, text `#b8a8e0`, headings `#ffffff`, borders `#3c3460`)
  - Navbar scrolled background (dark purple `rgba(15, 8, 37, 0.95)`)
  - Hero tagline & subtitle (`#7c70a8`)
  - Loading screen logo (inverted white via CSS filter)

### Background Effects
- **3 floating orbs** (`.heavenly-orb`) with blur, animation, different positions on every page
- **Body gradient overlay** with animated radial gradients that shift slowly (`heavenlyShift` 20s loop)
- **Section-specific** radial glow accents (features, how-it-works, testimonials, etc.)
- **CTA section** has a rich deep purple gradient with layered radial highlights

### Loading Screen
- Full-screen overlay with heavenly background orbs
- **Phase 1 (0-30%):** Standalone clock alone, zoomed in 8x at center, zooms to 2.1x
- **Phase 2 (30-60%):** Clock moves to "O" position (290px right), zooms 2.1x→0.85x
- **Phase 3 (60-65%):** Clock settled at "O" position, brief pause
- **Phase 4 (65-85%):** Logo reveals right-to-left via `clip-path: inset()`, fast around clock then sweeping left
- **Phase 5 (85-100%):** Everything locks in place, zooms to 150%, 4 background bubbles fade in staggered
- **Total duration:** 4s with cubic ease-in-out
- **Caching:** `canzo_visited` flag in localStorage — loading screen only shows on first visit
- Progress bar with purple glow fill + percentage counter 0→100%
- At 100%: 400ms pause → 600ms fade out → website content fades in
- **Dark mode logo:** Inverted via `brightness(0) invert(1)` filter when `data-theme="dark"` is set
- **Theme detection:** Reads `canzo_theme` from localStorage and applies `data-theme` before injecting loading HTML
- **Background orbs:** 4 bubbles (350-500px, blur 80px), fade in during Phase 5 with staggered delays (0ms, 80ms, 160ms, 240ms)

### Real-Time Clock
- **SVG analog clock** rendered inside the "O" of Canzo logo
- Positioned absolutely: `right: 0.5%, top: 18%, width: 21%, height: 72%`
- Updates every second via `setInterval`
- **Hands:** hour/minute (`#2d3748` dark), second (`#e8a838` golden)
- **Face:** solid white `#ffffff` to cover the logo's built-in hands
- **Tick marks:** 12 hour markers around the edge
- Appears in **navbar** (small) and **hero** (large) and **loading screen**
- Hidden on mobile (`display: none` at `768px`)

### Fluid Cursor Effect
- **Canvas-based fluid trail** following the cursor
- **25 trail points** with organic blob shapes, connecting curved line
- **Purple gradient** (`#7c3aed` → `#6d28d9` → `#5c22b4`) darker than background
- **`mix-blend-mode: multiply`** — subtly tints pixels underneath
- **Glow dot** (blurred purple circle) + **ring** (purple border) follow cursor
- **Hover state:** cursor expands over buttons, cards, links
- **Click effect:** burst of 8 fluid particles
- Hidden on mobile (`display: none` at `768px`)

---

## Pages Overview

### 1. Landing Page (`index.html`)
**Sections in order:**
1. **Loading Screen** — Clock-only zoom-in → "O" reveals → full logo (3.2s, first visit only)
2. **Navigation** — Logo with clock overlay, links, dark mode toggle, CTA, mobile hamburger
3. **Hero** — Canzo logo with real-time clock, "Because time matters" tagline, subtitle, CTAs, stats
4. **3 Expanding Image Sections** — Problem → Solution → Experience (core scroll animation)
5. **What is Canzo?** — Two-column section with description + 3 real-time features
6. **Features Grid** — 6 feature cards in 3×2 layout
7. **How It Works** — 3 alternating steps
8. **Why Canzo** — 4 benefit cards
9. **Testimonials** — 3 student testimonials
10. **Final CTA** — Full-screen dark purple gradient
11. **Footer** — 4-column layout with Canzo description, social icons

### 2. Login (`login.html`)
- Clean auth card with logo, role toggle (Student/Canteen Admin), email + password fields
- Email placeholder: `e720524am006@ecetonline.com`
- Remember me checkbox, forgot password link
- Link to register page
- Student → redirects to `dashboard.html`; Canteen Admin → `canteen-dashboard.html`

### 3. Register (`register.html`)
- Role toggle at top (Student/Canteen Admin) with conditional fields
- Student fields: name, email, phone, college dropdown
- Canteen fields: name, email, phone, canteen name, canteen location
- Student → redirects to `dashboard.html`; Canteen Admin → `canteen-dashboard.html`

### 4. Dashboard (`dashboard.html`)
- **Sidebar** with navigation (Dashboard, Canteens, Menu, Cart, Orders, Favorites, Settings)
- **User info** in footer: populated from `canzo_user_name` and `canzo_user_email`
- **Stats grid** (3 cards): Total Orders, This Month, Total Spent — all from OrderSystem
- **Recent orders** dynamically rendered from order history

### 5. Canteens (`canteens.html`)
- Grid of 6 canteen cards:
  - Main Canteen, Snack Corner, Juice Bar, Pizza Hub, Biryani House, Campus Bakery
  - Each has: image, "Open Now" badge, name, location, rating, ETA
- Click any card → goes to menu page

### 6. Menu (`menu.html`)
- **Dynamic rendering** from MenuSystem (not hardcoded HTML)
- **Search bar** with real-time filtering by name and description
- **Category tabs** auto-generated from menu data (All + unique categories)
- **8 seed items**: Biryani, Burger, Paneer Tikka, Salad, Pastry, Smoothie, Dosa, Fried Rice
- Items filtered by `inStock` — out-of-stock items hidden
- Add to cart saves to localStorage with "Added ✓" animation
- Syncs with canteen menu changes via `storage` event listener

### 7. Cart (`cart.html`)
- **Dynamically rendered** from `localStorage` (not static HTML)
- Cart items with image, name, price, quantity controls (+/-), remove button
- **Order summary sidebar**: Subtotal, free delivery, tax (5%), total — all calculated live
- **Pickup time slot** selector (Morning/Lunch/Evening)
- **Checkout** creates order in OrderSystem with student info, clears cart, redirects to orders page

### 8. Orders (`orders.html`)
- **Active Orders** rendered from OrderSystem (pending, accepted, preparing, ready)
- **Order History** rendered from OrderSystem (picked, cancelled)
- Each order: canteen name, order ID, items, timestamp, status badge, total
- Updates in real-time when canteen changes order status (via `storage` event)

---

## Shared App Components

### Data Systems (`app.js`)
```js
// OrderSystem — shared between student and canteen
OrderSystem.load()            // Load all orders from localStorage
OrderSystem.add(order)        // Create new order (student checkout)
OrderSystem.updateStatus(id, status)  // Update order status (canteen actions)

// MenuSystem — shared between student and canteen
MenuSystem.load()             // Load menu (seeds 8 items if empty)
MenuSystem.add(item)          // Add menu item
MenuSystem.update(id, data)   // Update menu item
MenuSystem.remove(id)         // Delete menu item
MenuSystem.toggleStock(id)    // Toggle in/out of stock

// CanteenSystem — admin settings
CanteenSystem.load()          // Load canteen settings (with defaults)
CanteenSystem.save(settings)  // Persist canteen config

// Cart — student cart
Cart.load()                   // Load from localStorage
Cart.add(item)                // Add item (or increment qty if exists)
Cart.remove(id)               // Remove item by id
Cart.updateQty(id, qty)       // Update quantity (removes if ≤ 0)
Cart.clear()                  // Empty cart
Cart.total()                  // Get subtotal (₹)
Cart.count()                  // Get total item count
Cart.updateBadges()           // Update all cart badge elements
```

### Sidebar (`app.css`)
- Fixed left sidebar, 260px wide
- Purple gradient background (`#1a1040` → `#2d1b69`)
- Nav links with SVG icons, active state with purple glow
- User info card at bottom (avatar, name, college)
- **Role-based**: student sidebar is static HTML; canteen sidebar is JS-generated
- Collapses on mobile, toggled via floating button (bottom-right)

### App Header
- Sticky top header with frosted glass effect (`backdrop-filter: blur(20px)`)
- Page title + subtitle on left
- Notification bell with badge count + home button on right

### Content Cards
- White background, rounded corners (`24px`), subtle purple-tinted shadow
- Header with title, body with content
- Used for stats, orders, menu sections, break timings

### Status Badges
- `delivered`: Green background (`rgba(16, 185, 129, 0.1)`) + text (`#10b981`)
- `preparing`: Purple background (`rgba(124, 58, 237, 0.1)`) + text (`#7c3aed`)
- `cancelled`: Red background (`rgba(239, 68, 68, 0.1)`) + text (`#ef4444`)

### Order Cards
- 3-column layout: status icon → info → total
- Hover effect with shadow elevation

---

## CSS Architecture

### Landing Page (`css/style.css`)
| Section | Description |
|---|---|
| `:root` tokens | Colors, fonts, radii, shadows, transitions (purple theme) |
| `[data-theme="dark"]` | Dark mode CSS variable overrides |
| Body + orbs | Heavenly background, 3 floating animated orbs |
| Clock styles | `.canzo-clock` positioning, SVG drop shadows |
| Loading screen | Full-screen overlay, standalone clock, clip-path logo reveal |
| Nav + logo clock | Sidebar toggle, logo with clock overlay, dark mode toggle |
| Hero | Logo wrapper, tagline, subtitle, stats, scroll indicator |
| Expand sections | Core scroll-driven expanding images (3 sections) |
| What is Canzo | Two-column grid, features list with icons |
| Features | Grid, cards, gradient icons with glow |
| How it works | Steps, alternating layout, large step numbers |
| Why Canzo | Benefits grid with hover zoom |
| Testimonials | Cards, stars, author info |
| Final CTA | Dark purple gradient with radial highlights |
| Footer | Grid, social icons with hover |
| Dark mode | Card backgrounds, form inputs, overlays, text overrides |
| Theme toggle | Nav button + floating button styles |
| Responsive | Tablet (1024px), mobile (768px), small (480px) |

### App Pages (`css/app.css`)
| Component | Description |
|---|---|
| App layout | Sidebar + main content with heavenly background |
| Sidebar | Nav links, user info, active states, responsive |
| App header | Sticky header, buttons, badges, frosted glass |
| Auth pages | Login/register cards, forms, inputs, selects |
| Stats grid | Dashboard stat cards with icons |
| Content cards | Reusable card component |
| Canteen cards | Grid, images, badges, footer |
| Menu items | Category tabs, item cards with add-to-cart |
| Menu search | Search bar with icon, focus ring styling |
| Cart | Dynamic cart items, qty controls, summary sidebar |
| Orders | Order cards, status badges |
| Empty state | Icon + text + CTA (reusable for cart + menu) |
| Dark mode | Card, form, and input overrides |
| Responsive | Tablet and mobile breakpoints |

### Loading Screen (`css/loading.css`)
| Component | Description |
|---|---|
| Loading screen | Full-screen fixed overlay, heavenly bg |
| Background orbs | 4 floating orbs (350-500px), fade in during Phase 5 with staggered delays |
| Logo wrapper | `z-index: 1`, centered, scales to 150% in Phase 5 |
| Standalone clock | Centered, `scale(10)` initial, animated via JS transform |
| Logo container | Absolute, `clip-path: inset()` right-to-left reveal |
| Logo image | Responsive width, drop shadow, inverted in dark mode |
| Clock overlay | Same positioning as hero clock |
| Percentage | Font-primary, uppercase, animated number |
| Progress bar | Thin bar with purple gradient + glow |
| Exit animation | Fade out + scale down |

### Fluid Cursor (`css/cursor.css`)
| Component | Description |
|---|---|
| Canvas overlay | Full-screen, `mix-blend-mode: multiply`, pointer-events none |
| Cursor glow | 30px blurred purple circle, follows cursor |
| Cursor ring | 40px purple border, follows with slight delay |
| Hover state | Expands to 50-60px, intensifies color |
| Mobile hide | All cursor elements disabled at 768px |

---

## GSAP Animation Map (Landing Page Only)

| Animation | Trigger | Scrub | Easing | Notes |
|---|---|---|---|---|
| Loading screen | Auto (0-4s) | No | cubic-in-out | Clock 8x→0.85x→move right, logo inset reveal, 150% zoom + bubbles |
| Content reveal | 4s after load | No | power2.out | Opacity 0→1 over 0.5s |
| Hero entrance | 4.5s after load | No | back.out(1.7) | Logo scales in |
| Hero tagline | After logo | No | power3.out | Fades + slides up |
| Hero subtitle | After tagline | No | power3.out | Fades + slides up |
| Hero buttons | After subtitle | No | power3.out | Slides up, stagger 0.1s |
| Hero stats | After buttons | No | power3.out | Fades + slides up, stagger |
| Expand sections - image | `top 80%` → `top 20%` | 1.2 | power2.out | Scale 0.65→1 |
| Expand sections - content | `top 50%` → `top 20%` | 0.8 | power2.out | Tag→title→text |
| Expand sections - parallax | `top bottom` → `bottom top` | true | none | Image y: -60px |
| What is Canzo | Scroll trigger | No | power3.out | Content fades in |
| Feature cards | `.features-grid top 75%` | No | power3.out | Stagger 0.12s |
| How it works steps | Each step `top 70%` → `top 30%` | 1 | power3.out | Image slide + content |
| Benefit cards | `.benefits-grid top 75%` | No | power3.out | Stagger 0.15s |
| Testimonial cards | `.testimonials-grid top 80%` | No | power3.out | Stagger 0.15s |
| CTA entrance | `.final-cta top 60%` → `top 30%` | 1 | power3.out | Scale 0.9→1 |
| CTA buttons | `.final-cta top 40%` | No | power2.out | Stagger 0.15s |
| Footer | `.footer top 85%` | No | power2.out | Stagger 0.1s |
| Hero parallax (desktop) | `.hero top top` → `bottom top` | true | none | Content y: 100px |
| Nav scroll effect | `top -80px` | No | - | Adds `.scrolled` class |

---

## Real-Time Clock Implementation

### How It Works
The clock is an **SVG analog clock** rendered via JavaScript (`js/clock.js` for page clocks, `js/loading.js` for loading screen clock):

```
1. Finds all .canzo-clock elements on the page
2. Creates an SVG with viewBox 0 0 100 100
3. Draws: white face circle, 12 tick marks, 3 hands, center dot
4. Calculates hand angles from current Date()
5. Updates hand positions via setAttribute every 1000ms
6. Hands: hour = dark gray, minute = dark gray, second = golden
```

### Positioning
The clock is positioned **over the "O" in CANZO** using:
```css
right: 0.5%;
top: 18%;
width: 21%;
height: 72%;
```
This covers the logo's built-in clock hands and replaces them with our real-time clock.

### Loading Screen Clock
A **separate clock instance** is created inside the loading screen via `js/loading.js`. It uses the same SVG logic but is self-contained (no shared gradient IDs).

---

## Fluid Cursor Implementation

### How It Works
The cursor effect (`js/cursor.js`) uses a **canvas overlay** with `mix-blend-mode: multiply`:

```
1. Creates a full-screen canvas element
2. On mousemove, adds trail points (x, y, age, radius)
3. Each frame: draw radial gradient blobs, age them, fade out
4. Connect points with smooth quadratic curves
5. Glow dot and ring div follow cursor position
6. Click creates 8-particle burst effect
7. Hover detection expands glow on interactive elements
```

### Trail Math
- Max 25 trail points
- Each point's radius shrinks by `0.96` per frame
- Points removed after age > 40 frames or radius < 5
- Alpha = `(1 - age/40) * 0.15` for subtle overlay

---

## Images

### Logo
- URL: `https://canzo.in/assets/image/canzo official logo.png`
- Used in: navbar, hero, loading screen, all app pages (sidebar, auth cards, footer)

### Local Images (`assets/images/`)
All 18 images are downloaded locally. No external Unsplash CDN used.

| Filename | Used In | Description |
|---|---|---|
| `canteen-crowd.jpg` | Expand 1, Main Canteen | Restaurant/canteen crowd |
| `pizza-closeup.jpg` | Expand 2, Pizza Hub | Pizza close-up |
| `plated-meal.jpg` | Expand 3, Juice Bar | Plated meal |
| `payment-checkout.jpg` | What is Canzo, Step 2 | Payment/checkout |
| `phone-ordering.jpg` | Step 1 | Phone ordering |
| `food-service.jpg` | Step 3, Biryani House | Food service |
| `fresh-food.jpg` | Benefit 1, Snack Corner | Fresh food |
| `students-group.jpg` | Benefit 2, Campus Bakery | Students group |
| `analytics.jpg` | Benefit 3 | Analytics/dashboard |
| `professional.jpg` | Benefit 4 | Professional |
| `biryani.jpg` | Menu, Cart | Chicken biryani |
| `burger.jpg` | Menu | Veg burger |
| `paneer-tikka.jpg` | Menu | Paneer tikka |
| `salad.jpg` | Menu | Fresh salad |
| `pastry.jpg` | Menu, Cart | Chocolate pastry |
| `smoothie.jpg` | Menu, Cart | Mango smoothie |
| `dosa.jpg` | Menu | Masala dosa |
| `fried-rice.jpg` | Menu | Veg fried rice |

---

## How to Run

1. Open `D:\canzo\website\index.html` directly in a browser
2. Or serve with any static server:
   ```bash
   python -m http.server 8000
   # or
   npx serve D:\canzo\website
   ```
3. Visit `http://localhost:8000`

**No build step required.** Pure HTML/CSS/JS.

**Navigation flow:**
```
index.html (loading → role modal) → register.html (role toggle) → dashboard.html OR canteen-dashboard.html
index.html → login.html (role toggle) → dashboard.html OR canteen-dashboard.html
dashboard.html → canteens.html → menu.html → cart.html → orders.html (placed)
canteen-dashboard.html → canteen-menu.html → canteen-orders.html → canteen-analytics.html → canteen-settings.html
```

**Data flow:**
```
Student: menu → add to cart → checkout → OrderSystem.create() → orders.html shows order
Canteen: dashboard live queue → accept/preparing/ready → orders table updates → student orders page reflects
Menu: canteen menu CRUD → MenuSystem.update() → student menu page reloads (storage event)
```

**To reset loading screen:** Open browser console and run `localStorage.removeItem('canzo_visited')`, then refresh.

**To reset cart:** Open browser console and run `localStorage.removeItem('canzo_cart')`, or clear from the cart page.

**To reset theme:** Run `localStorage.removeItem('canzo_theme')` and refresh.

**To reset all data (roles, orders, menu, settings):** Run `localStorage.clear()` and refresh.

---

## How to Extend (For AI or Developers)

### Adding a New App Page
1. Copy any existing app page (e.g., `orders.html`)
2. Update the sidebar active link (`class="app-nav-link active"`)
3. Update the header title/subtitle
4. Replace the `.app-content` section
5. Ensure `<link rel="stylesheet" href="css/cursor.css">` and `<link rel="stylesheet" href="css/loading.css">` are included
6. Ensure `<script src="js/clock.js"></script>` and `<script src="js/cursor.js"></script>` and `<script src="js/app.js"></script>` are included

### Adding a New Menu Item
Via canteen admin (`canteen-menu.html`): click "Add Item" button, fill the modal form. Or programmatically:
```js
MenuSystem.add({ name: 'New Item', description: '...', price: 99, category: 'short-bites', image: 'assets/images/...' })
```

### Changing the Theme
Edit CSS variables in `css/style.css` `:root` block for light mode, and `[data-theme="dark"]` block for dark mode. The purple theme flows from:
- `--color-accent: #7c3aed` (main violet)
- `--heavenly-bg-1/2/3` (background gradients)
- Orb colors in `style.css` `.heavenly-orb` classes

### Adjusting Animations
- **Loading screen:** Edit `js/loading.js` — `duration` (4000ms), phases (1-5), zoom scales, clip-path percentages, bubble fade-in timing
- **Hero animations:** Edit `js/main.js` — `heroTimeline` delays, durations
- **Scroll animations:** Edit `js/main.js` — `scrollTrigger.start/end`, `scrub` values
- **Clock speed:** Edit `js/clock.js` and `js/loading.js` — `setInterval(updateClock, 1000)`
- **Cursor trail:** Edit `js/cursor.js` — `maxTrail`, radius decay, alpha formula

### Adding a New Expanding Image Section
Follow the exact pattern of `#expand-1`, `#expand-2`, `#expand-3`. The JS uses `document.querySelectorAll('.expand-section')` so it auto-applies.

### Seeding Custom Data
Reset localStorage (`localStorage.clear()`) and reload. Menu seeds with 8 default items. Orders start empty. Modify `MenuSystem.SEED_DATA` in `app.js` for custom defaults.

---

## LocalStorage Keys

| Key | Type | Description |
|---|---|---|
| `canzo_cart` | JSON array | Cart items: `[{ id, name, price, image, qty }]` |
| `canzo_visited` | `'true'` | Loading screen skip flag (set after first visit) |
| `canzo_theme` | `'dark'` / `'light'` | Theme preference |
| `canzo_role` | `'student'` / `'canteen'` | Current role selection on login/register pages |
| `canzo_user_role` | `'student'` / `'canteen'` | Persisted role after login (controls page access) |
| `canzo_user_name` | string | Student's display name |
| `canzo_user_email` | string | Student's email address |
| `canzo_orders` | JSON array | All orders: `[{ id, studentName, studentEmail, items, slot, subtotal, tax, total, canteen, status, createdAt }]` |
| `canzo_menu` | JSON array | Menu items: `[{ id, name, description, price, category, image, inStock }]` |
| `canzo_canteen_settings` | JSON object | Canteen config: `{ name, location, hours, isOpen, autoReject, autoRejectTime, maxOrders }` |

---

## Known Limitations

1. **No backend** — All data stored in localStorage, no server-side persistence
2. **No real authentication** — Role selection replaces actual login; no password validation
3. **No payment integration** — Checkout creates order directly without payment step
4. **Clock hidden on mobile** — The overlay positioning doesn't work well on small screens
5. **Cursor effect hidden on mobile** — Touch devices don't support hover cursor effects
6. **No real-time WebSocket** — Cross-tab sync via storage events only (not real-time push)
7. **Single canteen** — Orders go to "Main Canteen" regardless of canteen selection
8. **No order expiration** — Orders persist until manually cleared or reset

---

## Future Enhancements (TODO)

### Priority: High
- [ ] Add real authentication (Firebase/Auth0)
- [ ] Connect to Canzo backend API with database
- [ ] Add actual checkout flow with payment integration (UPI, cards)
- [ ] Replace default images with actual Canzo screenshots/product photos
- [ ] Add multi-canteen support (orders routed to correct canteen)

### Priority: Medium
- [ ] Real-time WebSocket for live order updates (replace storage event polling)
- [ ] Add push notifications for order status changes
- [ ] Add favorite items functionality
- [ ] Add structured data (JSON-LD) for SEO
- [ ] Add password hashing for local auth simulation
- [ ] Add order expiration/cancellation timeout

### Priority: Low
- [ ] Add Lenis smooth scroll to landing page
- [ ] Add 3D tilt effect on cards (vanilla-tilt.js)
- [ ] Add mouse-follow parallax on hero
- [ ] PWA manifest + service worker
- [ ] Add blog/resources section

---

## Brand Guidelines

- **Tone:** Confident, modern, trustworthy, student-friendly
- **Voice:** Short, punchy headlines. Conversational body copy
- **Primary color:** Violet `#7c3aed`
- **Secondary:** Light purple `#a78bfa`, deep purple `#1a1040`
- **Background:** Heavenly lavender/purple gradients with floating orbs
- **Logo:** Use from `https://canzo.in/assets/image/canzo official logo.png`
- **Tagline:** "Because time matters"
- **College:** EASA College of Engineering and Technology
- **Default user name:** Ganesh (`e720524am006@ecetonline.com`)

---

## Credits

- **Fonts:** Inter + Space Grotesk (Google Fonts)
- **Animations:** GSAP 3.12.5 (greensock.com)
- **Images:** Unsplash (originally, now downloaded locally)
- **Logo:** Canzo official (canzo.in)
- **Clock inspiration:** canzo.lovable.app

---

*Last updated: May 2, 2026 — Role-based auth (Student/Canteen), shared OrderSystem + MenuSystem + CanteenSystem, real-time cross-tab sync, dynamic menu rendering from localStorage, student checkout → canteen dashboard live queue → student orders sync*
