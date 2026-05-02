/* ============================================
   CANZO - Firebase App
   Sidebar toggle, cart persistence, search, interactions
   Firebase Auth + Firestore for all data
   ============================================ */

import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    addDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const Cart = {
    STORAGE_KEY: 'canzo_cart',
    items: [],
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            this.items = data ? JSON.parse(data) : [];
        } catch { this.items = []; }
        return this.items;
    },
    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        this.updateBadges();
    },
    add(item) {
        const existing = this.items.find(i => i.id === item.id);
        if (existing) existing.qty += 1;
        else this.items.push({ ...item, qty: 1 });
        this.save();
    },
    remove(id) { this.items = this.items.filter(i => i.id !== id); this.save(); },
    updateQty(id, qty) {
        const item = this.items.find(i => i.id === id);
        if (item) { if (qty <= 0) this.remove(id); else { item.qty = qty; this.save(); } }
    },
    clear() { this.items = []; this.save(); },
    total() { return this.items.reduce((sum, i) => sum + i.price * i.qty, 0); },
    count() { return this.items.reduce((sum, i) => sum + i.qty, 0); },
    updateBadges() {
        const count = this.count();
        document.querySelectorAll('.app-badge').forEach(badge => {
            if (badge.closest('.app-nav-link')?.getAttribute('href') === 'cart.html' ||
                badge.closest('.app-header-btn')?.getAttribute('href') === 'cart.html') {
                badge.textContent = count;
                badge.style.display = count > 0 ? '' : 'none';
            }
        });
    }
};

const SEED_MENU = [
    { name: 'Chicken Biryani', description: 'Aromatic basmati rice with tender chicken, saffron, and spices', price: 145, category: 'biryani', image: 'assets/images/biryani.jpg', inStock: true },
    { name: 'Veg Burger', description: 'Crispy veg patty with fresh lettuce, tomato, and special sauce', price: 80, category: 'short-bites', image: 'assets/images/burger.jpg', inStock: true },
    { name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled with peppers and onions', price: 120, category: 'short-bites', image: 'assets/images/paneer-tikka.jpg', inStock: true },
    { name: 'Fresh Salad', description: 'Mixed greens, cherry tomatoes, cucumber with vinaigrette', price: 65, category: 'short-bites', image: 'assets/images/salad.jpg', inStock: true },
    { name: 'Chocolate Pastry', description: 'Rich chocolate cream layered pastry', price: 55, category: 'pastry', image: 'assets/images/pastry.jpg', inStock: true },
    { name: 'Mango Smoothie', description: 'Fresh mango blended with yogurt and honey', price: 75, category: 'juices', image: 'assets/images/smoothie.jpg', inStock: true },
    { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling, sambar and chutney', price: 70, category: 'maggie', image: 'assets/images/dosa.jpg', inStock: true },
    { name: 'Veg Fried Rice', description: 'Wok-tossed rice with mixed vegetables and soy sauce', price: 95, category: 'fried-rice', image: 'assets/images/fried-rice.jpg', inStock: true },
];

let currentUser = null;
let allOrders = [];
let menuItems = [];
let canteenSettings = {
    name: 'Food Court', location: 'Near Mess', phone: '+91 70107 3672X',
    manager: 'Ganesh', hours: { morning: '10:40 AM - 11:00 AM', lunch: '12:30 PM - 1:10 PM', evening: '2:50 PM - 3:05 PM' },
    isOpen: true, autoReject: false, autoRejectTime: 10, maxOrders: 30,
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            currentUser = { uid: user.uid, ...userDoc.data() };
        } else {
            currentUser = { uid: user.uid, email: user.email, role: 'student', name: user.email.split('@')[0] };
        }
        applyRoleUI();
    } else {
        currentUser = null;
    }
});

function applyRoleUI() {
    if (!currentUser) return;
    const currentPage = window.location.pathname.split('/').pop();
    const canteenPages = ['canteen-dashboard.html', 'canteen-menu.html', 'canteen-orders.html', 'canteen-analytics.html', 'canteen-settings.html'];
    const studentPages = ['dashboard.html', 'canteens.html', 'menu.html', 'cart.html', 'orders.html'];

    if (currentUser.role === 'canteen' && studentPages.includes(currentPage)) {
        window.location.href = 'canteen-dashboard.html';
    } else if (currentUser.role === 'student' && canteenPages.includes(currentPage)) {
        window.location.href = 'dashboard.html';
    }

    if (currentUser.role === 'canteen') {
        const sidebarNav = document.querySelector('.app-nav');
        if (sidebarNav && !sidebarNav.querySelector('[href="canteen-dashboard.html"]')) {
            sidebarNav.innerHTML = `
                <a href="canteen-dashboard.html" class="app-nav-link${currentPage === 'canteen-dashboard.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Dashboard</a>
                <a href="canteen-menu.html" class="app-nav-link${currentPage === 'canteen-menu.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>Menu</a>
                <a href="canteen-orders.html" class="app-nav-link${currentPage === 'canteen-orders.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>Orders</a>
                <a href="canteen-analytics.html" class="app-nav-link${currentPage === 'canteen-analytics.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Analytics</a>
                <div class="app-nav-divider"></div>
                <a href="canteen-settings.html" class="app-nav-link${currentPage === 'canteen-settings.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Settings</a>
                <div class="app-nav-divider"></div>
                <a href="#" id="logoutBtn" class="app-nav-link"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>Logout</a>
            `;
        }
        const userName = document.querySelector('.app-user-name');
        const userRole = document.querySelector('.app-user-role');
        if (userName) userName.textContent = canteenSettings.name || 'Food Court';
        if (userRole) userRole.textContent = 'Canteen Admin';
    } else {
        const userName = document.querySelector('.app-user-name');
        const userRole = document.querySelector('.app-user-role');
        if (userName) userName.textContent = currentUser?.name || 'Student';
        if (userRole) userRole.textContent = currentUser?.email || 'EASA College';
    }

    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut(auth);
        window.location.href = 'index.html';
    });

    document.querySelectorAll('.app-nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href === currentPage) link.classList.add('active');
    });
}

async function seedMenuIfEmpty() {
    const snapshot = await getDocs(collection(db, 'menuItems'));
    if (snapshot.empty) {
        const batch = [];
        for (const item of SEED_MENU) {
            batch.push(addDoc(collection(db, 'menuItems'), { ...item, createdAt: serverTimestamp() }));
        }
        await Promise.all(batch);
    }
}

export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const role = userDoc.exists() ? userDoc.data().role : 'student';
        if (role === 'canteen') window.location.href = 'canteen-dashboard.html';
        else window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

export async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    const name = document.getElementById('name')?.value || 'User';
    const phone = document.getElementById('phone')?.value || '';
    const department = document.getElementById('department')?.value || '';
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') || localStorage.getItem('canzo_role') || 'student';
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email, name, role, phone, department, createdAt: serverTimestamp()
        });
        window.location.href = role === 'canteen' ? 'canteen-dashboard.html' : 'dashboard.html';
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

function initApp() {
    Cart.load();
    Cart.updateBadges();

    const savedTheme = localStorage.getItem('canzo_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
    toggleBtn.innerHTML = `
        <svg class="sun-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <svg class="moon-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
    `;
    toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('canzo_theme', next);
    });
    document.body.appendChild(toggleBtn);

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.addEventListener('click', e => {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }

    seedMenuIfEmpty();
    listenToMenu();
    listenToOrders();
    loadCanteenSettings();

    initMenuPage();
    initCartPage();
    initDashboardPage();
    initStudentOrders();
    initCanteenDashboard();
    initCanteenMenu();
    initCanteenOrders();
    initCanteenAnalytics();
    initCanteenSettings();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function listenToMenu() {
    const q = query(collection(db, 'menuItems'), orderBy('createdAt', 'asc'));
    onSnapshot(q, (snapshot) => {
        menuItems = [];
        snapshot.forEach(docSnap => {
            menuItems.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderMenuIfActive();
        renderCanteenMenuIfActive();
        renderAnalyticsIfActive();
    });
}

function listenToOrders() {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        allOrders = [];
        snapshot.forEach(docSnap => {
            allOrders.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderStudentOrdersIfActive();
        renderCanteenDashboardIfActive();
        renderCanteenOrdersIfActive();
        renderAnalyticsIfActive();
        renderDashboardIfActive();
    });
}

async function loadCanteenSettings() {
    const docSnap = await getDoc(doc(db, 'settings', 'canteen'));
    if (docSnap.exists()) {
        canteenSettings = { ...canteenSettings, ...docSnap.data() };
    }
}

function renderMenuIfActive() {
    const container = document.querySelector('.menu-items');
    if (!container || !container.dataset.initialized) return;
    renderMenuItems(container);
}

function renderCanteenMenuIfActive() {
    const list = document.getElementById('menuManagementList');
    if (!list) return;
    renderCanteenMenuList(list);
}

function renderStudentOrdersIfActive() {
    const activeList = document.querySelector('.order-list');
    if (!activeList) return;
    renderStudentOrders(activeList);
}

function renderCanteenDashboardIfActive() {
    const liveQueue = document.getElementById('liveOrderQueue');
    if (!liveQueue) return;
    renderLiveQueue(liveQueue);
}

function renderCanteenOrdersIfActive() {
    const tableBody = document.getElementById('canteenOrdersTableBody');
    if (!tableBody) return;
    renderOrdersTable(tableBody);
}

function renderAnalyticsIfActive() {
    const chartBars = document.getElementById('analyticsRevenueChart');
    const topItemsList = document.getElementById('analyticsTopItems');
    if (!chartBars && !topItemsList) return;
    renderAnalytics(chartBars, topItemsList, document.getElementById('analyticsFrequencyGrid'), document.getElementById('analyticsLowDemand'));
}

function renderDashboardIfActive() {
    const totalEl = document.querySelector('.stat-card[data-stat="total"] .stat-card-value');
    if (!totalEl) return;
    updateDashboardStats();
}

function updateDashboardStats() {
    const totalOrders = allOrders.length;
    const thisMonth = allOrders.filter(o => {
        const d = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const totalSpent = allOrders.filter(o => o.status === 'picked').reduce((sum, o) => sum + o.total, 0);

    const totalEl = document.querySelector('.stat-card[data-stat="total"] .stat-card-value');
    const monthEl = document.querySelector('.stat-card[data-stat="month"] .stat-card-value');
    const spentEl = document.querySelector('.stat-card[data-stat="spent"] .stat-card-value');
    if (totalEl) totalEl.textContent = totalOrders;
    if (monthEl) monthEl.textContent = thisMonth;
    if (spentEl) spentEl.textContent = `₹${totalSpent}`;

    const statValues = document.querySelectorAll('.stat-card-value');
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statValues.forEach(el => animateCounter(el));
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });
        observer.observe(statsGrid);
    }
}

function renderMenuItems(container) {
    container.innerHTML = menuItems.filter(i => i.inStock).map(item => `
        <div class="menu-item" data-id="${item.id}" data-category="${item.category}" data-name="${item.name.toLowerCase()}" data-desc="${item.description.toLowerCase()}">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <div class="menu-item-details">
                <div class="menu-item-header">
                    <h4 class="menu-item-name">${item.name}</h4>
                    <span class="menu-item-price">₹${item.price}</span>
                </div>
                <p class="menu-item-desc">${item.description}</p>
                <button class="menu-item-add" data-id="${item.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.menu-item-add').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemEl = this.closest('.menu-item');
            const id = itemEl.dataset.id;
            const item = menuItems.find(i => i.id === id);
            if (item) {
                Cart.add({ id: item.id, name: item.name, price: item.price, image: item.image });
                const originalText = this.textContent;
                this.textContent = 'Added ✓';
                this.style.background = '#10b981';
                setTimeout(() => { this.textContent = originalText; this.style.background = ''; }, 1500);
            }
        });
    });
}

function initMenuPage() {
    const menuContainer = document.querySelector('.menu-items');
    if (!menuContainer) return;
    menuContainer.dataset.initialized = 'true';

    const categoriesEl = document.querySelector('.menu-categories');
    const searchHTML = `
        <div class="menu-search-wrapper">
            <svg class="menu-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="menu-search-input" id="menuSearch" placeholder="Search for dishes...">
        </div>
    `;
    if (categoriesEl) categoriesEl.insertAdjacentHTML('beforebegin', searchHTML);

    function renderCategories() {
        if (categoriesEl) {
            const cats = [...new Set(menuItems.map(i => i.category))];
            categoriesEl.innerHTML = ['all', ...cats].map((cat, i) =>
                `<button class="menu-category-btn${i === 0 ? ' active' : ''}" data-category="${cat}">${cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`
            ).join('');
        }
    }

    renderCategories();
    renderMenuItems(menuContainer);

    const searchInput = document.getElementById('menuSearch');

    document.querySelectorAll('.menu-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.menu-category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMenu();
        });
    });

    function filterMenu() {
        const activeBtn = document.querySelector('.menu-category-btn.active');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const activeCategory = activeBtn ? activeBtn.dataset.category : 'all';

        menuContainer.querySelectorAll('.menu-item').forEach(item => {
            const name = item.dataset.name;
            const desc = item.dataset.desc;
            const cat = item.dataset.category;
            const matchesSearch = !searchTerm || name.includes(searchTerm) || desc.includes(searchTerm);
            const matchesCategory = activeCategory === 'all' || cat === activeCategory;
            item.style.display = matchesSearch && matchesCategory ? '' : 'none';
        });

        const anyVisible = Array.from(menuContainer.querySelectorAll('.menu-item')).some(i => i.style.display !== 'none');
        let emptyState = document.getElementById('menuEmptyState');
        if (!anyVisible) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.id = 'menuEmptyState';
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
                    <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                    <h3 class="empty-title">No dishes found</h3>
                    <p class="empty-text">Try a different search or category</p>
                `;
                menuContainer.after(emptyState);
            }
            emptyState.style.display = '';
        } else if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    if (searchInput) searchInput.addEventListener('input', filterMenu);
}

function initCartPage() {
    const cartContainer = document.querySelector('.cart-layout .content-card-body');
    const summaryEl = document.querySelector('.cart-summary');
    if (!cartContainer) return;

    renderCart();

    function renderCart() {
        cartContainer.innerHTML = '';
        const items = Cart.items;

        if (items.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></div>
                    <h3 class="empty-title">Your cart is empty</h3>
                    <p class="empty-text">Browse the menu to add some delicious items</p>
                    <a href="menu.html" class="btn btn-primary" style="margin-top: 16px;">Browse Menu</a>
                </div>
            `;
            if (summaryEl) summaryEl.style.display = 'none';
            return;
        }

        if (summaryEl) summaryEl.style.display = '';

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.dataset.id = item.id;
            div.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-price">₹${item.price} each</p>
                    <div class="cart-item-actions">
                        <button class="cart-qty-btn" data-action="dec">−</button>
                        <span class="cart-qty">${item.qty}</span>
                        <button class="cart-qty-btn" data-action="inc">+</button>
                        <span class="cart-item-remove">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </span>
                    </div>
                </div>
            `;
            cartContainer.appendChild(div);
        });

        updateSummary();
        bindCartEvents();
    }

    function updateSummary() {
        const subtotal = Cart.total();
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + tax;

        const subtitleEl = document.querySelector('.app-header-subtitle');
        if (subtitleEl) subtitleEl.textContent = `${Cart.count()} item${Cart.count() !== 1 ? 's' : ''} from Food Court`;

        const rows = document.querySelectorAll('.cart-summary-row');
        if (rows.length >= 4) {
            rows[0].querySelector('span:last-child').textContent = `₹${subtotal}`;
            rows[2].querySelector('span:last-child').textContent = `₹${tax}`;
            rows[3].querySelector('span:last-child').textContent = `₹${total}`;
        }
    }

    function bindCartEvents() {
        cartContainer.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemEl = this.closest('.cart-item');
                const id = itemEl.dataset.id;
                const qtyEl = itemEl.querySelector('.cart-qty');
                let qty = parseInt(qtyEl.textContent);
                if (this.dataset.action === 'inc') qty++;
                else if (this.dataset.action === 'dec' && qty > 1) qty--;
                Cart.updateQty(id, qty);
                qtyEl.textContent = Cart.items.find(i => i.id === id)?.qty || 0;
                updateSummary();
            });
        });

        cartContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemEl = this.closest('.cart-item');
                const id = itemEl.dataset.id;
                itemEl.style.opacity = '0';
                itemEl.style.transform = 'translateX(-20px)';
                itemEl.style.transition = 'all 0.3s ease';
                setTimeout(() => { Cart.remove(id); renderCart(); }, 300);
            });
        });
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (Cart.items.length === 0) return;

            const slot = document.querySelector('.cart-summary .form-select')?.value || 'Lunch Break';
            const subtotal = Cart.total();
            const tax = Math.round(subtotal * 0.05);
            const total = subtotal + tax;

            const order = {
                studentName: currentUser?.name || 'Student',
                studentEmail: currentUser?.email || '',
                studentId: currentUser?.uid || '',
                items: Cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image })),
                slot, subtotal, tax, total,
                canteen: canteenSettings.name,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await addDoc(collection(db, 'orders'), order);
            Cart.clear();
            renderCart();
            alert('Order placed successfully!');
            window.location.href = 'orders.html';
        });
    }
}

function initDashboardPage() {
    const userName = document.querySelector('.app-user-name');
    const userRole = document.querySelector('.app-user-role');
    if (userName) userName.textContent = currentUser?.name || 'Student';
    if (userRole) userRole.textContent = currentUser?.email || 'EASA College';
}

function animateCounter(el) {
    const text = el.textContent;
    const hasPrefix = text.startsWith('₹');
    const hasComma = text.includes(',');
    const hasDecimal = text.includes('.');
    const cleanText = text.replace(/[₹,]/g, '');
    const target = parseFloat(cleanText);
    if (isNaN(target)) return;

    const duration = 1500;
    const start = performance.now();

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        let current = eased * target;
        let display;
        if (hasDecimal) display = current.toFixed(1);
        else display = Math.round(current).toString();
        if (hasComma) display = Number(display).toLocaleString('en-IN');
        if (hasPrefix) display = '₹' + display;
        el.textContent = display;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function initCanteenDashboard() {
    const liveQueue = document.getElementById('liveOrderQueue');
    if (!liveQueue) return;

    function renderLiveQueue(queue) {
        const orders = allOrders.filter(o => o.status === 'pending' || o.status === 'accepted' || o.status === 'preparing');
        queue.innerHTML = '';

        if (orders.length === 0) {
            queue.innerHTML = '<p class="canteen-live-empty">No active orders</p>';
            return;
        }

        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = `live-order-card live-order-card--${order.status}`;
            div.dataset.id = order.id;
            div.innerHTML = `
                <div class="live-order-header">
                    <span class="live-order-id">${order.id.slice(-6)}</span>
                    <span class="live-order-status live-order-status--${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
                <div class="live-order-student">${order.studentName}</div>
                <div class="live-order-items">${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
                <div class="live-order-slot">${order.slot} · ₹${order.total}</div>
                <div class="live-order-actions">
                    ${order.status === 'pending' ? `
                        <button class="live-order-btn live-order-btn--accept" data-action="accept">Accept</button>
                        <button class="live-order-btn live-order-btn--reject" data-action="reject">Reject</button>
                    ` : ''}
                    ${order.status === 'accepted' ? `
                        <button class="live-order-btn live-order-btn--prepare" data-action="prepare">Start Preparing</button>
                    ` : ''}
                    ${order.status === 'preparing' ? `
                        <button class="live-order-btn live-order-btn--ready" data-action="ready">Mark Ready</button>
                    ` : ''}
                </div>
            `;
            queue.appendChild(div);
        });

        queue.querySelectorAll('.live-order-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const action = this.dataset.action;
                const card = this.closest('.live-order-card');
                const orderId = card.dataset.id;
                const statusMap = { accept: 'accepted', reject: 'cancelled', prepare: 'preparing', ready: 'ready' };
                await updateDoc(doc(db, 'orders', orderId), { status: statusMap[action], updatedAt: new Date().toISOString() });
            });
        });
    }

    renderLiveQueue(liveQueue);

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.filter(o => o.status === 'picked').reduce((sum, o) => sum + o.total, 0);
    const activeOrders = allOrders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)).length;
    const todayOrders = allOrders.filter(o => {
        const d = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt);
        return d.toDateString() === new Date().toDateString();
    }).length;

    const totalEl = document.querySelector('.stat-card[data-stat="total"] .stat-card-value');
    const revenueEl = document.querySelector('.stat-card[data-stat="revenue"] .stat-card-value');
    const activeEl = document.querySelector('.stat-card[data-stat="active"] .stat-card-value');
    const todayEl = document.querySelector('.stat-card[data-stat="today"] .stat-card-value');
    if (totalEl) totalEl.textContent = totalOrders;
    if (revenueEl) revenueEl.textContent = `₹${totalRevenue}`;
    if (activeEl) activeEl.textContent = activeOrders;
    if (todayEl) todayEl.textContent = todayOrders;

    const canteenNameEl = document.querySelector('.app-header-subtitle');
    if (canteenNameEl) canteenNameEl.textContent = `${canteenSettings.name} · ${canteenSettings.location}`;
}

function renderCanteenMenuList(list) {
    const categories = ['all', ...new Set(menuItems.map(i => i.category))];

    const tabsContainer = document.querySelector('.menu-management-categories');
    if (tabsContainer) {
        tabsContainer.innerHTML = categories.map((cat, i) =>
            `<button class="menu-category-btn${i === 0 ? ' active' : ''}" data-category="${cat}">${cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`
        ).join('');

        tabsContainer.querySelectorAll('.menu-category-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                tabsContainer.querySelectorAll('.menu-category-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const cat = this.dataset.category;
                list.querySelectorAll('.menu-management-item').forEach(item => {
                    item.style.display = cat === 'all' || item.dataset.category === cat ? '' : 'none';
                });
            });
        });
    }

    list.innerHTML = menuItems.map(item => `
        <div class="menu-management-item" data-id="${item.id}" data-category="${item.category}">
            <div class="menu-management-item-image"><img src="${item.image}" alt="${item.name}"></div>
            <div class="menu-management-item-details">
                <div class="menu-management-item-header"><h4 class="menu-management-item-name">${item.name}</h4><span class="menu-management-item-category">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span></div>
                <p class="menu-management-item-desc">${item.description}</p>
                <div class="menu-management-item-meta"><span class="menu-management-item-price">₹${item.price}</span>
                    <label class="menu-management-item-toggle">
                        <input type="checkbox" ${item.inStock ? 'checked' : ''} data-id="${item.id}">
                        <span class="menu-management-item-toggle-slider"></span>
                        <span class="menu-management-item-toggle-label">${item.inStock ? 'In Stock' : 'Out of Stock'}</span>
                    </label>
                </div>
            </div>
            <div class="menu-management-item-actions">
                <button class="menu-management-item-edit" data-id="${item.id}"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="menu-management-item-delete" data-id="${item.id}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.menu-management-item-toggle input').forEach(toggle => {
        toggle.addEventListener('change', async function() {
            const id = this.dataset.id;
            await updateDoc(doc(db, 'menuItems', id), { inStock: this.checked });
        });
    });

    list.querySelectorAll('.menu-management-item-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const item = menuItems.find(i => i.id === id);
            if (item) openMenuModal(item);
        });
    });

    list.querySelectorAll('.menu-management-item-delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            const itemEl = document.querySelector(`.menu-management-item[data-id="${id}"]`);
            if (itemEl) {
                itemEl.style.opacity = '0';
                itemEl.style.transform = 'translateX(-20px)';
                itemEl.style.transition = 'all 0.3s ease';
                setTimeout(async () => { await deleteDoc(doc(db, 'menuItems', id)); }, 300);
            }
        });
    });
}

function initCanteenMenu() {
    const list = document.getElementById('menuManagementList');
    if (!list) return;
    renderCanteenMenuList(list);

    const modal = document.getElementById('menuModal');
    const addBtn = document.getElementById('addMenuItemBtn');
    const form = document.getElementById('menuForm');

    function openMenuModal(item = null) {
        document.getElementById('menuModalTitle').textContent = item ? 'Edit Item' : 'Add New Item';
        document.getElementById('menuModalSave').textContent = item ? 'Save Changes' : 'Add Item';
        document.getElementById('menuItemName').value = item?.name || '';
        document.getElementById('menuItemDesc').value = item?.description || '';
        document.getElementById('menuItemPrice').value = item?.price || '';
        document.getElementById('menuItemCategory').value = item?.category || 'short-bites';
        document.getElementById('menuItemImage').value = item?.image || '';
        form.dataset.editId = item?.id || '';
        modal.classList.add('active');
    }

    if (addBtn) addBtn.addEventListener('click', () => openMenuModal());
    document.getElementById('menuModalClose')?.addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('menuModalCancel')?.addEventListener('click', () => modal.classList.remove('active'));
    modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = form.dataset.editId;
            const name = document.getElementById('menuItemName').value;
            const desc = document.getElementById('menuItemDesc').value;
            const price = parseInt(document.getElementById('menuItemPrice').value);
            const category = document.getElementById('menuItemCategory').value;
            const imgSrc = document.getElementById('menuItemImage').value || 'assets/images/biryani.jpg';

            if (editId) {
                await updateDoc(doc(db, 'menuItems', editId), { name, description: desc, price, category, image: imgSrc });
            } else {
                await addDoc(collection(db, 'menuItems'), { name, description: desc, price, category, image: imgSrc, inStock: true, createdAt: serverTimestamp() });
            }
            modal.classList.remove('active');
        });
    }
}

function renderOrdersTable(tableBody) {
    tableBody.innerHTML = '';

    if (allOrders.length === 0) {
        tableBody.innerHTML = '<div class="canteen-orders-empty"><p>No orders yet</p></div>';
        return;
    }

    allOrders.forEach(order => {
        const row = document.createElement('div');
        row.className = `canteen-orders-table-row canteen-orders-table-row--${order.status}`;
        row.dataset.id = order.id;
        row.innerHTML = `
            <div class="canteen-orders-table-col">${order.id.slice(-6)}</div>
            <div class="canteen-orders-table-col">
                <strong>${order.studentName}</strong>
                <div style="font-size:12px;color:var(--color-text-light)">${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
            </div>
            <div class="canteen-orders-table-col">${order.slot}</div>
            <div class="canteen-orders-table-col">₹${order.total}</div>
            <div class="canteen-orders-table-col">
                <select class="form-select form-select--xs canteen-order-action-select" data-id="${order.id}">
                    <option value="pending"${order.status === 'pending' ? ' selected' : ''}>Pending</option>
                    <option value="accepted"${order.status === 'accepted' ? ' selected' : ''}>Accepted</option>
                    <option value="preparing"${order.status === 'preparing' ? ' selected' : ''}>Preparing</option>
                    <option value="ready"${order.status === 'ready' ? ' selected' : ''}>Ready</option>
                    <option value="picked"${order.status === 'picked' ? ' selected' : ''}>Picked Up</option>
                    <option value="cancelled"${order.status === 'cancelled' ? ' selected' : ''}>Cancelled</option>
                </select>
            </div>
            <div class="canteen-orders-table-col">
                <span class="canteen-order-status canteen-order-status--${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
        `;
        tableBody.appendChild(row);
    });

    tableBody.querySelectorAll('.canteen-order-action-select').forEach(select => {
        select.addEventListener('change', async function() {
            const orderId = this.dataset.id;
            await updateDoc(doc(db, 'orders', orderId), { status: this.value, updatedAt: new Date().toISOString() });
        });
    });
}

function initCanteenOrders() {
    const tableBody = document.getElementById('canteenOrdersTableBody');
    if (!tableBody) return;
    renderOrdersTable(tableBody);

    const statusFilter = document.getElementById('orderStatusFilter');
    const slotFilter = document.getElementById('orderSlotFilter');
    const searchInput = document.getElementById('orderSearchInput');
    const tabs = document.querySelectorAll('.canteen-orders-tab');

    function applyFilters() {
        const status = statusFilter ? statusFilter.value : 'all';
        const slot = slotFilter ? slotFilter.value : 'all';
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const activeTab = document.querySelector('.canteen-orders-tab.active');
        const tab = activeTab ? activeTab.dataset.tab : 'active';

        tableBody.querySelectorAll('.canteen-orders-table-row').forEach(row => {
            const rowStatus = row.className.match(/--(\w+)/)?.[1] || '';
            const rowSlot = row.querySelector('.canteen-orders-table-col:nth-child(3)')?.textContent.trim().toLowerCase() || '';
            const rowSearch = row.textContent.toLowerCase();

            let visible = true;
            if (tab === 'active' && (rowStatus === 'picked' || rowStatus === 'cancelled')) visible = false;
            if (tab === 'completed' && rowStatus !== 'picked') visible = false;
            if (tab === 'cancelled' && rowStatus !== 'cancelled') visible = false;
            if (status !== 'all' && rowStatus !== status) visible = false;
            if (slot !== 'all' && !rowSlot.includes(slot)) visible = false;
            if (search && !rowSearch.includes(search)) visible = false;

            row.style.display = visible ? '' : 'none';
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });

    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (slotFilter) slotFilter.addEventListener('change', applyFilters);
    if (searchInput) searchInput.addEventListener('input', applyFilters);
}

function initCanteenSettings() {
    const nameInput = document.getElementById('canteenNameInput');
    const locationInput = document.getElementById('canteenLocationInput');
    const autoRejectToggle = document.getElementById('autoRejectToggle');
    const autoRejectTimeInput = document.getElementById('autoRejectTime');
    const maxOrdersInput = document.getElementById('maxOrdersInput');

    if (nameInput) nameInput.value = canteenSettings.name;
    if (locationInput) locationInput.value = canteenSettings.location;
    if (autoRejectToggle) autoRejectToggle.checked = canteenSettings.autoReject;
    if (autoRejectTimeInput) {
        autoRejectTimeInput.value = canteenSettings.autoRejectTime;
        autoRejectTimeInput.disabled = !canteenSettings.autoReject;
    }
    if (maxOrdersInput) maxOrdersInput.value = canteenSettings.maxOrders;

    if (autoRejectToggle) {
        autoRejectToggle.addEventListener('change', function() {
            canteenSettings.autoReject = this.checked;
            if (autoRejectTimeInput) autoRejectTimeInput.disabled = !this.checked;
        });
    }

    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            canteenSettings.name = nameInput?.value || canteenSettings.name;
            canteenSettings.location = locationInput?.value || canteenSettings.location;
            if (autoRejectToggle) canteenSettings.autoReject = autoRejectToggle.checked;
            if (autoRejectTimeInput) canteenSettings.autoRejectTime = parseInt(autoRejectTimeInput.value) || 5;
            if (maxOrdersInput) canteenSettings.maxOrders = parseInt(maxOrdersInput.value) || 20;
            await setDoc(doc(db, 'settings', 'canteen'), canteenSettings);
            const original = this.textContent;
            this.textContent = 'Saved!';
            this.style.background = '#10b981';
            setTimeout(() => { this.textContent = original; this.style.background = ''; }, 2000);
        });
    }

    const resetOrdersBtn = document.getElementById('resetOrdersBtn');
    if (resetOrdersBtn) {
        resetOrdersBtn.addEventListener('click', async () => {
            if (confirm('Are you sure? This will clear all order data.')) {
                const snapshot = await getDocs(collection(db, 'orders'));
                snapshot.forEach(async (docSnap) => { await deleteDoc(docSnap.ref); });
                alert('All orders cleared');
            }
        });
    }

    const resetMenuBtn = document.getElementById('resetMenuBtn');
    if (resetMenuBtn) {
        resetMenuBtn.addEventListener('click', async () => {
            if (confirm('Are you sure? This will restore the default menu.')) {
                const snapshot = await getDocs(collection(db, 'menuItems'));
                snapshot.forEach(async (docSnap) => { await deleteDoc(docSnap.ref); });
                for (const item of SEED_MENU) {
                    await addDoc(collection(db, 'menuItems'), { ...item, createdAt: serverTimestamp() });
                }
                alert('Menu restored to defaults');
            }
        });
    }
}

function renderAnalytics(chartBars, topItemsList, frequencyGrid, lowDemandList) {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toDateString();
        const dayOrders = allOrders.filter(o => {
            const od = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt);
            return od.toDateString() === dateStr && o.status === 'picked';
        });
        const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
        days.push({ name: dayNames[d.getDay()], revenue, orders: dayOrders.length });
    }

    if (chartBars) {
        const maxRev = Math.max(...days.map(d => d.revenue), 1);
        chartBars.innerHTML = days.map(d => {
            const height = Math.max((d.revenue / maxRev) * 100, 4);
            return `<div class="analytics-bar" title="₹${d.revenue}"><div class="analytics-bar-fill" style="height: ${height}%"></div><span class="analytics-bar-label">${d.name}</span></div>`;
        }).join('');
    }

    if (topItemsList) {
        const itemCounts = {};
        allOrders.forEach(o => { o.items.forEach(item => {
            if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, qty: 0, revenue: 0 };
            itemCounts[item.name].qty += item.qty;
            itemCounts[item.name].revenue += item.qty * item.price;
        }); });
        const topItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 8);

        if (topItems.length === 0) {
            topItemsList.innerHTML = '<p class="analytics-empty">No sales data yet</p>';
        } else {
            const maxQty = topItems[0].qty;
            topItemsList.innerHTML = topItems.map((item, i) => {
                const pct = (item.qty / maxQty) * 100;
                return `<div class="analytics-ranking-item"><span class="analytics-ranking-num">#${i + 1}</span><span class="analytics-ranking-name">${item.name}</span><span class="analytics-ranking-bar"><span class="analytics-ranking-fill" style="width: ${pct}%"></span></span><span class="analytics-ranking-qty">${item.qty} sold</span></div>`;
            }).join('');
        }
    }

    if (frequencyGrid) {
        const studentCounts = {};
        allOrders.forEach(o => {
            if (!studentCounts[o.studentName]) studentCounts[o.studentName] = { name: o.studentName, orders: 0, spent: 0 };
            studentCounts[o.studentName].orders++;
            studentCounts[o.studentName].spent += o.total;
        });
        const students = Object.values(studentCounts).sort((a, b) => b.orders - a.orders).slice(0, 12);

        if (students.length === 0) {
            frequencyGrid.innerHTML = '<p class="analytics-empty">No student data yet</p>';
        } else {
            frequencyGrid.innerHTML = students.map(s => {
                const initials = s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return `<div class="analytics-frequency-item"><div class="analytics-frequency-avatar">${initials}</div><div class="analytics-frequency-info"><strong>${s.name}</strong><span>${s.orders} orders · ₹${s.spent}</span></div></div>`;
            }).join('');
        }
    }

    if (lowDemandList) {
        const itemOrderCount = {};
        allOrders.forEach(o => o.items.forEach(i => { itemOrderCount[i.name] = (itemOrderCount[i.name] || 0) + i.qty; }));
        const lowItems = menuItems.filter(item => (itemOrderCount[item.name] || 0) === 0);
        if (lowItems.length === 0) {
            lowDemandList.innerHTML = '<p class="analytics-empty">All items have been ordered!</p>';
        } else {
            lowDemandList.innerHTML = lowItems.map(item => `
                <div class="analytics-low-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div><strong>${item.name}</strong><span>₹${item.price}</span></div>
                </div>
            `).join('');
        }
    }
}

function initCanteenAnalytics() {
    const chartBars = document.getElementById('analyticsRevenueChart');
    const topItemsList = document.getElementById('analyticsTopItems');
    const frequencyGrid = document.getElementById('analyticsFrequencyGrid');
    const lowDemandList = document.getElementById('analyticsLowDemand');
    if (!chartBars && !topItemsList) return;
    renderAnalytics(chartBars, topItemsList, frequencyGrid, lowDemandList);
}

function renderStudentOrders(activeList) {
    const activeOrders = allOrders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
    const historyOrders = allOrders.filter(o => ['picked', 'cancelled'].includes(o.status));

    activeList.innerHTML = '';
    const historyList = document.querySelector('.order-history-list');
    if (historyList) historyList.innerHTML = '';

    if (activeOrders.length === 0) {
        activeList.innerHTML = '<p class="empty-orders-text">No active orders</p>';
    } else {
        const statusLabels = { pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready for Pickup' };
        activeOrders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-card';
            div.innerHTML = `
                <div class="order-card-status ${order.status}">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="order-card-info">
                    <h4>${order.canteen}</h4>
                    <p class="order-card-id">${order.id.slice(-6)}</p>
                    <p class="order-card-items">${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
                    <p class="order-card-time">${new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleString()} · ${order.slot}</p>
                </div>
                <div class="order-card-total">
                    <span class="order-card-badge ${order.status}">${statusLabels[order.status] || order.status}</span>
                    <span class="order-card-amount">₹${order.total}</span>
                </div>
            `;
            activeList.appendChild(div);
        });
    }

    if (historyList) {
        if (historyOrders.length === 0) {
            historyList.innerHTML = '<p class="empty-orders-text">No order history</p>';
        } else {
            historyOrders.forEach(order => {
                const div = document.createElement('div');
                div.className = 'order-card';
                div.innerHTML = `
                    <div class="order-card-status ${order.status}">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div class="order-card-info">
                        <h4>${order.canteen}</h4>
                        <p class="order-card-id">${order.id.slice(-6)}</p>
                        <p class="order-card-items">${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
                        <p class="order-card-time">${new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleString()}</p>
                    </div>
                    <div class="order-card-total">
                        <span class="order-card-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        <span class="order-card-amount">₹${order.total}</span>
                    </div>
                `;
                historyList.appendChild(div);
            });
        }
    }

    const subtitleEl = document.querySelector('.app-header-subtitle');
    if (subtitleEl) subtitleEl.textContent = `${activeOrders.length} active, ${historyOrders.length} completed`;
}

function initStudentOrders() {
    const activeList = document.querySelector('.order-list');
    if (!activeList) return;
    renderStudentOrders(activeList);
}

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
