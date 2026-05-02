# Canzo - College Canteen Pre-Order Web App

> A modern web app for Canzo — a college canteen pre-ordering platform built for **EASA College of Engineering and Technology** (Food Court).

## Project Overview

**Canzo** lets students pre-order meals, skip canteen queues, and pick up food when it's ready. The canteen admin panel manages the menu, accepts orders, and tracks analytics.

**Design:** Purplish heavenly theme with floating orbs, gradient backgrounds, dark mode support, and Apple-level polish.

---

## Current Status: Fully Integrated with Firestore

- [x] Marketing landing page with GSAP scroll animations + loading screen
- [x] "Get Started" links directly to student registration (no role modal)
- [x] Firebase Authentication (Email/Password + Google Sign-In) for students and canteen admins
- [x] Google Sign-In with profile completion modal (register number, department, year)
- [x] Bills pages for students (`bills.html`) and canteen admins (`canteen-bills.html`)
- [x] Firestore database for users, orders, menu items, and settings
- [x] Real-time order sync across all tabs via Firestore `onSnapshot` listeners
- [x] Real-time menu sync — admin CRUD reflects instantly on student menu
- [x] Role-based routing (student vs canteen) enforced via Firestore user docs
- [x] Pre-seeded database: 8 menu items, 1 student user, 1 admin user, canteen settings
- [x] Student profile: register number, department, year, phone, balance tracking
- [x] Order details: bill number, line items, tax, payment status, student metadata
- [x] Student stats auto-update on checkout (totalOrders, totalSpent)
- [x] Canteen dashboard with live order queue, real-time stats, and peak hours chart
- [x] Canteen menu management (CRUD + stock toggles) with Firestore
- [x] Canteen orders table with status filters, slot filters, search, and tab navigation
- [x] Canteen analytics: revenue chart (7-day), top-selling items, student frequency, low-demand items — all calculated from Firestore
- [x] Dark mode toggle (all pages, persists to localStorage)
- [x] Cart persistence via localStorage (client-only state)
- [x] Menu search + category tabs + filtering
- [x] Order history + active orders for students (live from Firestore)
- [x] Mobile responsive (sidebar toggle, stacked layouts, form rows collapse)
- [x] Single canteen scope: "Food Court" at EASA College (Near Mess)
- [x] Automated seed script (no manual Firebase Console setup needed)
- [x] Logout redirects to `login.html` on all pages
- [x] All stat cards and analytics show real computed values (no mock data)
- [x] Firestore security rules deployed

---

## File Structure

```
D:\canzo\
├── index.html              # Marketing landing page → direct register link
├── login.html              # Login with Firebase Email/Password auth
├── register.html           # Student registration (name, email, reg#, dept, year, phone)
├── dashboard.html          # Student dashboard (real stats from Firestore)
├── canteens.html           # Food Court card → links to menu
├── menu.html               # Food menu (live from Firestore, search, categories)
├── cart.html               # Shopping cart (localStorage) → checkout to Firestore
├── orders.html             # Student orders (live Firestore listener)
├── canteen-dashboard.html  # Canteen admin (stats, live order queue, peak hours)
├── canteen-menu.html       # Canteen menu management (Firestore CRUD)
├── canteen-orders.html     # Canteen order management (Firestore table, filters, tabs)
├── canteen-analytics.html  # Canteen analytics (revenue chart, top items, frequency, low demand)
├── canteen-settings.html   # Canteen settings (Firestore persistence, reset options)
├── firestore.rules         # Firestore security rules (deployed)
├── firebase.json           # Firebase project config
├── package.json            # NPM scripts (seed, update-menu, deploy:rules)
├── seed-database.js        # Node.js REST API seeder (users, menu, settings)
├── update-menu.js          # Node.js script to update menu items
├── README.md               # This file
├── css/
│   ├── style.css           # Landing page styles
│   ├── app.css             # App pages + canteen admin styles
│   ├── loading.css         # Loading screen animation
│   └── cursor.css          # Fluid cursor effect
├── js/
│   ├── main.js             # GSAP animations for landing page
│   ├── app.js              # ES module: Firebase Auth + Firestore + all UI logic
│   ├── firebase-config.js  # Firebase SDK init (Auth + Firestore)
│   ├── loading.js          # Loading screen animation
│   ├── clock.js            # Real-time analog clock component
│   └── cursor.js           # Fluid cursor trail effect
└── assets/
    └── images/             # Locally hosted menu item images
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic markup |
| CSS3 | Styling, CSS variables, dark mode, animations, responsive |
| JavaScript ES6+ (ES Modules) | App logic, Firebase integration |
| Firebase Auth | Email/Password + Google Sign-In (OAuth) |
| Firestore | Real-time database (orders, menu, settings, users) |
| GSAP 3.12.5 | Landing page scroll animations |
| Google Fonts | Inter + Space Grotesk |

---

## Firestore Collections

### `users/{userId}`
**Student:**
```js
{
  email: "student@ecet.com",
  name: "Ganesh",
  role: "student",
  phone: "+91 7010736721",
  department: "cse",
  year: "3rd Year",
  registerNumber: "E720524AM001",
  balance: 0,           // wallet balance (future)
  totalOrders: 0,       // auto-updated on checkout
  totalSpent: 0,        // auto-updated on checkout
  favoriteItems: [],    // array of menu item IDs
  dietaryPreferences: [],// ["veg", "no-onion"]
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Canteen Admin:**
```js
{
  email: "admin@ecet.com",
  name: "Food Court Admin",
  role: "canteen",
  phone: "+91 7010736720",
  managerName: "Ganesh",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `menuItems/{itemId}`
```js
{
  name: "Chicken Biryani",
  description: "Aromatic basmati rice with tender chicken...",
  price: 145,
  category: "biryani",
  image: "assets/images/biryani.jpg",
  inStock: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `orders/{orderId}` (auto-generated ID)
```js
{
  studentName: "Ganesh",
  studentEmail: "student@ecet.com",
  studentId: "firebase-uid",
  registerNumber: "E720524AM001",
  department: "cse",
  year: "3rd Year",
  phone: "+91 7010736721",
  items: [
    { id, name, price, qty, image, lineTotal: price * qty }
  ],
  slot: "Lunch Break",
  subtotal: 145,
  tax: 7,
  taxRate: 0.05,
  deliveryFee: 0,
  total: 152,
  billNumber: "BILL-1714650000000",
  canteen: "Food Court",
  canteenId: "canteen",
  status: "pending",    // pending → accepted → preparing → ready → picked
  paymentMethod: "cash",
  paymentStatus: "pending", // pending → paid
  createdAt: ISO string,
  updatedAt: ISO string
}
```

### `settings/canteen`
```js
{
  name: "Food Court",
  location: "Near Mess, EASA College",
  phone: "+91 7010736720",
  manager: "Ganesh",
  hours: { morning: "10:40 AM - 11:00 AM", lunch: "12:30 PM - 1:10 PM", evening: "2:50 PM - 3:05 PM" },
  isOpen: true,
  autoReject: false,
  autoRejectTime: 10,
  maxOrders: 30
}
```

---

## Firestore Security Rules

- **Users:** Anyone can read. Users can only create/update their own doc.
- **Menu Items:** Public read. Only canteen-role users can write.
- **Orders:** Authenticated users can read. Only students can create. Anyone can update status (canteen). Only canteen can delete.
- **Settings:** Public read. Only canteen-role users can write.

---

## Theme: Purplish Heavenly

### Color Palette (Light Mode)
```css
--color-primary: #1a1040
--color-accent: #7c3aed
--color-accent-light: #a78bfa
--color-accent-dark: #6d28d9
--heavenly-bg-1: #f5f0ff
--heavenly-bg-2: #ede4ff
--heavenly-bg-3: #e0d0ff
```

### Color Palette (Dark Mode)
```css
--color-primary: #e8e0f8
--color-accent: #8b5cf6
--heavenly-bg-1: #0f0825
--heavenly-bg-2: #160d38
--heavenly-bg-3: #1e1250
```

### Dark Mode
- **Toggle:** Floating circular button (bottom-left) on app pages
- **Persistence:** `localStorage.setItem('canzo_theme', 'dark')`
- **Activation:** `data-theme="dark"` attribute on `<html>`

---

## Pages Overview

### 1. Landing Page (`index.html`)
GSAP scroll animations, floating orbs, feature cards, clock widget. "Get Started" → `register.html`

### 2. Login (`login.html`)
Firebase Email/Password → role-based redirect from Firestore user doc → `dashboard.html` (student) or `canteen-dashboard.html` (admin)

### 3. Register (`register.html`)
Student fields: name, email, register number, department, year, phone, password. Creates Firebase user + Firestore user doc.

### 4. Student Dashboard (`dashboard.html`)
**Real stats from Firestore:**
- **Total Orders** — count of all orders placed by student
- **This Month** — orders in current month
- **Total Spent** — sum of `total` from picked orders
- **Recent Orders** — list of recent orders (empty until orders exist)
- Break timings display (Morning, Lunch, Evening)
- Quick action cards → menu and canteens

### 5. Food Court (`canteens.html`)
Single card: Food Court → links to `menu.html`

### 6. Menu (`menu.html`)
Live from Firestore `menuItems` collection. Search bar + category tabs. Add to cart with "Added ✓" feedback. Only in-stock items shown.

### 7. Cart (`cart.html`)
localStorage cart. Item quantity controls (+/−), remove with slide animation. Summary shows subtotal, 5% tax, total. Checkout creates order in Firestore with full student metadata, bill number, and line item totals. Auto-updates `user.totalOrders` and `user.totalSpent`.

### 8. Orders (`orders.html`)
Live Firestore `onSnapshot` listener. Active orders (pending/accepted/preparing/ready) with status badges. Order history (picked/cancelled) with full details.

### 9. Canteen Dashboard (`canteen-dashboard.html`)
**Real stats from Firestore:**
- **Today's Orders** — orders created today
- **Today's Revenue** — sum of `total` from today's picked orders
- **Active Orders** — count of pending/accepted/preparing/ready
- **Total Orders** — all orders in system
- **Live Order Queue** — real-time cards with Accept/Reject/Start Preparing/Mark Ready buttons
- **Peak Hours Chart** — bar chart (all bars at 0% until data exists)

### 10. Canteen Menu (`canteen-menu.html`)
Full CRUD: add, edit, delete menu items via modal. Stock toggle switches. Category filter tabs. All changes sync to Firestore and student menu via `onSnapshot`.

### 11. Canteen Orders (`canteen-orders.html`)
Order table from Firestore with columns: Order ID, Student + Items, Slot, Total, Status dropdown, Status badge. Tab filters (Active/Completed/Cancelled). Status filter, slot filter, search input. Status dropdown updates Firestore in real-time.

### 12. Canteen Analytics (`canteen-analytics.html`)
**All computed from Firestore data:**
- **Total Revenue** — sum of `total` from picked orders
- **Total Orders** — count of all orders
- **Avg Order Value** — total revenue / total orders
- **Avg Prep Time** — placeholder (0 min until tracking added)
- **Revenue Trend** — 7-day bar chart with daily revenue (formatted as ₹X or ₹X.Xk)
- **Top Selling Items** — ranked by quantity sold, with progress bars and revenue
- **Order Frequency** — unique students, avg orders/student, power users (5+ orders)
- **Low Demand Items** — menu items with 0 orders

### 13. Canteen Settings (`canteen-settings.html`)
Edit canteen name, location, auto-reject settings, max orders. Save to Firestore `settings/canteen`. Reset orders (clears all orders). Reset menu (restores default items).

---

## How to Run

### Local Development
**Must use a local server** (ES modules require HTTP, not `file://`):
```bash
python -m http.server 8000
# or
npx serve .
```
Visit `http://localhost:8000`

### Production
Deployed to Vercel: `https://canzo-phi.vercel.app/`

---

## Navigation Flow

```
index.html → register.html → Firebase auth → dashboard.html (student)
                                            → canteen-dashboard.html (admin)

Student: dashboard → canteens → menu → cart → orders → (logout → login.html)
Canteen: dashboard → menu → orders → analytics → settings → (logout → login.html)
```

## Data Flow

```
Student: menu (Firestore onSnapshot) → add to cart (localStorage) → checkout → orders (Firestore addDoc)
          → auto-updates user.totalOrders, user.totalSpent (Firestore updateDoc)

Canteen: live queue (Firestore onSnapshot) → accept/prepare/ready (updateDoc) → student orders update instantly

Menu: canteen CRUD (addDoc/updateDoc/deleteDoc) → student menu updates via onSnapshot listener

Analytics: all computed from allOrders array (filtered by status, date, student, item)
  - Revenue: orders.filter(status === 'picked').reduce(sum + total)
  - Top Items: nested loop over orders → aggregate qty + revenue per item name
  - Frequency: group orders by studentName → count orders + sum spent
  - 7-Day Chart: iterate last 7 days → filter orders by date string → sum revenue
```

---

## LocalStorage Keys (Remaining)

| Key | Type | Description |
|---|---|---|
| `canzo_cart` | JSON array | Cart items `[{ id, name, price, image, qty }]` (client-only) |
| `canzo_visited` | `'true'` | Loading screen skip flag |
| `canzo_theme` | `'dark'` / `'light'` | Theme preference |

---

## How to Set Up Firebase

### 1. Create Firebase Project (if not done)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project named `canzo-459ad` (or update `js/firebase-config.js` with your project ID)
3. Enable **Email/Password** Authentication
4. Create **Firestore Database** in test mode

### 2. Seed the Database (Automated)
```bash
npm install
npm run seed
```
This creates:
- **Student:** `student@ecet.com` / `student123`
- **Admin:** `admin@ecet.com` / `admin123`
- 8 menu items with categories and pricing
- Canteen settings (Food Court config)

### 3. Update Menu (Optional)
```bash
npm run update-menu
```
Updates menu to 18 items with tags and servings.

### 4. Deploy Firestore Security Rules
```bash
firebase login
firebase deploy --only firestore:rules --project canzo-459ad
```

### 5. Verify
```bash
npm start
```
Visit `http://localhost:8000`
- Login as student: `student@ecet.com` / `student123`
- Login as admin: `admin@ecet.com` / `admin123`

---

## Known Limitations

1. **No payment integration** — Checkout creates order directly (cash only)
2. **Clock hidden on mobile** — Overlay positioning doesn't work well on small screens
3. **Cursor effect hidden on mobile** — Touch devices don't support hover
4. **No push notifications** — Order status changes visible on page/tab via Firestore listener
5. **No order expiration** — Orders persist until manually cleared
6. **No image upload** — Menu items use static image paths

---

## Future Enhancements (TODO)

### Priority: High
- [ ] Add payment integration (UPI, cards)
- [ ] Add push notifications for order status changes
- [ ] Add student profile management page (edit name, phone, preferences)
- [ ] Add average prep time tracking (accepted → ready timestamps)

### Priority: Medium
- [ ] Add order expiration/cancellation timeout
- [ ] Add order history filtering by date range
- [ ] Add image upload for menu items (Firebase Storage)
- [ ] Add structured data (JSON-LD) for SEO

### Priority: Low
- [ ] Add Lenis smooth scroll to landing page
- [ ] Add 3D tilt effect on cards
- [ ] PWA manifest + service worker
- [ ] Add blog/resources section

---

## Brand Guidelines

- **Tone:** Confident, modern, trustworthy, student-friendly
- **Primary color:** Violet `#7c3aed`
- **Logo:** `https://canzo.in/assets/image/canzo official logo.png`
- **Tagline:** "Because time matters"
- **College:** EASA College of Engineering and Technology
- **Canteen:** Food Court (Near Mess)

---

## Credits

- **Fonts:** Inter + Space Grotesk (Google Fonts)
- **Animations:** GSAP 3.12.5
- **Images:** Unsplash (downloaded locally)
- **Logo:** Canzo official (canzo.in)
- **Database:** Firebase Firestore

---

*Last updated: May 2, 2026 — Full end-to-end Firestore integration, real-time stats/analytics, logout → login redirect, centered auth logo, full-width form inputs, zero mock data*
