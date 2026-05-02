# Canzo - College Canteen Pre-Order Web App

> A modern web app for Canzo — a college canteen pre-ordering platform built for **EASA College of Engineering and Technology** (Food Court).

## Project Overview

**Canzo** lets students pre-order meals, skip canteen queues, and pick up food when it's ready. The canteen admin panel manages the menu, accepts orders, and tracks analytics.

**Design:** Purplish heavenly theme with floating orbs, gradient backgrounds, dark mode support, and Apple-level polish.

---

## Current Status: Firebase Migrated + Seeded

- [x] Marketing landing page with GSAP scroll animations + loading screen
- [x] "Get Started" links directly to student registration (no role modal)
- [x] Firebase Authentication (Email/Password) for students and canteen admins
- [x] Firestore database for users, orders, menu items, and settings
- [x] Real-time order sync across all tabs via Firestore `onSnapshot` listeners
- [x] Real-time menu sync — admin CRUD reflects instantly on student menu
- [x] Role-based routing (student vs canteen) enforced via Firestore user docs
- [x] Pre-seeded database: 18 menu items, 1 student user, 1 admin user, canteen settings
- [x] Student profile: register number, department, year, phone, balance tracking
- [x] Order details: bill number, line items, tax, payment status, student metadata
- [x] Student stats auto-update on checkout (totalOrders, totalSpent)
- [x] Canteen dashboard with live order queue, stats, analytics
- [x] Canteen menu management (CRUD + stock toggles) with Firestore
- [x] Dark mode toggle (all pages, persists to localStorage)
- [x] Cart persistence via localStorage (client-only state)
- [x] Menu search + category tabs + filtering (18 items)
- [x] Order history + active orders for students
- [x] Canteen analytics: revenue chart, top-selling items, student frequency
- [x] Mobile responsive (sidebar toggle, stacked layouts, form rows collapse)
- [x] Single canteen scope: "Food Court" at EASA College (Near Mess)
- [x] Automated seed script (no manual Firebase Console setup needed)
- [ ] Deploy Firestore security rules (1 manual step remaining)

---

## File Structure

```
D:\canzo\
├── index.html              # Marketing landing page → direct register link
├── login.html              # Login with Firebase Email/Password auth
├── register.html           # Student registration (name, reg#, dept, year, phone)
├── seed.html               # One-time database seeder (run after first deploy)
├── dashboard.html          # Student dashboard (real stats from Firestore)
├── canteens.html           # Food Court card → links to menu
├── menu.html               # Food menu (live from Firestore, search, categories)
├── cart.html               # Shopping cart (localStorage) → checkout to Firestore
├── orders.html             # Student orders (live Firestore listener)
├── canteen-dashboard.html  # Canteen admin (stats, live order queue)
├── canteen-menu.html       # Canteen menu management (Firestore CRUD)
├── canteen-orders.html     # Canteen order management (Firestore table, filters)
├── canteen-analytics.html  # Canteen analytics (revenue, top items, frequency)
├── canteen-settings.html   # Canteen settings (Firestore persistence)
├── firestore.rules         # Firestore security rules
├── README.md               # This file
├── css/
│   ├── style.css           # Landing page styles
│   ├── app.css             # App pages + canteen admin
│   ├── loading.css         # Loading screen
│   └── cursor.css          # Fluid cursor effect
├── js/
│   ├── main.js             # GSAP animations for landing page
│   ├── app.js              # ES module: Firebase + UI logic (Cart, pages, admin)
│   ├── firebase-config.js  # Firebase SDK init (Auth + Firestore)
│   ├── seed.js             # Database seeder (users, menu, settings)
│   ├── loading.js          # Loading screen animation
│   ├── clock.js            # Real-time analog clock component
│   └── cursor.js           # Fluid cursor trail effect
└── assets/
    └── images/             # 18 locally hosted images
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic markup |
| CSS3 | Styling, variables, dark mode, animations, responsive |
| JavaScript ES6+ | App logic, Firebase integration |
| Firebase Auth | Email/Password authentication |
| Firestore | Real-time database (orders, menu, settings, users) |
| GSAP 3.12.5 | Landing page animations |
| Google Fonts | Inter + Space Grotesk |

---

## Firestore Collections

### `users/{userId}`
**Student:**
```js
{
  email: "student@ecet.com",
  name: "Ganesh Kumar",
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
  tags: ["non-veg", "popular", "spicy"],
  servings: 1,
  orderCount: 0,        // auto-tracked for analytics
  revenue: 0,           // total revenue from this item
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `orders/{orderId}` (auto-generated ID)
```js
{
  studentName: "Ganesh Kumar",
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
  maxOrders: 30,
  taxRate: 0.05,
  deliveryFee: 0,
  currency: "INR",
  acceptOrders: true,
  lastUpdated: ISO string,
  createdAt: Timestamp,
  updatedAt: Timestamp
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
Role selection modal → Student: `register.html` | Canteen Admin: `register.html?role=canteen`

### 2. Login (`login.html`)
Firebase Email/Password → role-based redirect from Firestore user doc

### 3. Register (`register.html`)
- Student fields: name, email, phone, department, password
- Canteen: append `?role=canteen` to URL to register as admin
- Creates Firebase user + Firestore user doc

### 4. Student Dashboard (`dashboard.html`)
Stats (Total Orders, This Month, Total Spent) from Firestore orders collection

### 5. Food Court (`canteens.html`)
Single card: Food Court → links to menu.html

### 6. Menu (`menu.html`)
Live from Firestore. Search + category tabs. Add to cart.

### 7. Cart (`cart.html`)
localStorage cart. Checkout creates order in Firestore `orders` collection.

### 8. Orders (`orders.html`)
Live Firestore listener. Active orders + order history.

### 9–13. Canteen Admin Pages
Dashboard (live queue), Menu CRUD, Orders table, Analytics, Settings — all backed by Firestore with real-time sync.

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
                                           → canteen-dashboard.html (admin via seed)

Student: dashboard → canteens → menu → cart → orders
Canteen: dashboard → menu → orders → analytics → settings
```

## Data Flow

```
Student: menu (Firestore) → add to cart (localStorage) → checkout → orders (Firestore)
         → auto-updates user.totalOrders, user.totalSpent
Canteen: live queue (Firestore listener) → accept/prepare/ready → student orders update instantly
Menu: canteen CRUD (Firestore) → student menu updates via onSnapshot listener
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
npm run seed
```
This creates:
- **Student:** `student@ecet.com` / `student123`
- **Admin:** `admin@ecet.com` / `admin123`
- 18 menu items with categories, tags, and pricing
- Canteen settings (Food Court config)

### 3. Deploy Firestore Security Rules
1. Go to [Firestore Rules](https://console.firebase.google.com/project/canzo-459ad/firestore/rules)
2. Paste contents of `firestore.rules`
3. Click **Publish**

Or via CLI:
```bash
firebase login
firebase deploy --only firestore:rules --project canzo-459ad
```

### 4. Verify
```bash
npm start
```
Visit `http://localhost:8000`
- Login as student: `student@ecet.com` / `student123`
- Login as admin: `admin@ecet.com` / `admin123`

---

## Known Limitations

1. **No payment integration** — Checkout creates order directly
2. **Clock hidden on mobile** — Overlay positioning doesn't work well on small screens
3. **Cursor effect hidden on mobile** — Touch devices don't support hover
4. **No push notifications** — Order status changes visible on page refresh/tab switch
5. **No order expiration** — Orders persist until manually cleared

---

## Future Enhancements (TODO)

### Priority: High
- [ ] Add payment integration (UPI, cards)
- [ ] Add push notifications for order status changes
- [ ] Add profile management page for students

### Priority: Medium
- [ ] Add structured data (JSON-LD) for SEO
- [ ] Add order expiration/cancellation timeout
- [ ] Add order history filtering by date range

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

*Last updated: May 2, 2026 — Firebase Auth + Firestore migration, real-time sync, single canteen (Food Court), ES modules*
