/* ============================================
   CANZO - Firebase App
   Sidebar toggle, cart persistence, search, interactions
   Firebase Auth + Firestore for all data
   ============================================ */

import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
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
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const STATUS_FLOW = ['accepted', 'preparing', 'prepared', 'delivered'];
const STATUS_LABELS = { accepted: 'Accepted', preparing: 'Preparing', prepared: 'Prepared', delivered: 'Delivered' };
const ACTIVE_STATUSES = ['accepted', 'preparing', 'prepared'];

const Cart = {
    STORAGE_KEY: 'canzo_cart',
    items: [],
    load() { try { const d = localStorage.getItem(this.STORAGE_KEY); this.items = d ? JSON.parse(d) : []; } catch { this.items = []; } return this.items; },
    save() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items)); this.updateBadges(); },
    add(item) { const ex = this.items.find(i => i.id === item.id); if (ex) ex.qty += 1; else this.items.push({ ...item, qty: 1 }); this.save(); },
    remove(id) { this.items = this.items.filter(i => i.id !== id); this.save(); },
    updateQty(id, qty) { const item = this.items.find(i => i.id === id); if (item) { if (qty <= 0) this.remove(id); else { item.qty = qty; this.save(); } } },
    clear() { this.items = []; this.save(); },
    total() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },
    count() { return this.items.reduce((s, i) => s + i.qty, 0); },
    updateBadges() {
        const c = this.count();
        document.querySelectorAll('.app-badge').forEach(b => {
            if (b.closest('.app-nav-link')?.getAttribute('href') === 'cart.html' || b.closest('.app-header-btn')?.getAttribute('href') === 'cart.html') {
                b.textContent = c; b.style.display = c > 0 ? '' : 'none';
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
            if (currentUser.role === 'student' && (!currentUser.registerNumber || !currentUser.department)) {
                showProfileCompleteModal(user);
            }
        } else {
            currentUser = { uid: user.uid, email: user.email, role: 'student', name: user.displayName || user.email.split('@')[0] };
            showProfileCompleteModal(user);
        }
        applyRoleUI();
    } else { currentUser = null; }
});

function applyRoleUI() {
    if (!currentUser) return;
    const currentPage = window.location.pathname.split('/').pop();
    const canteenPages = ['canteen-dashboard.html', 'canteen-menu.html', 'canteen-orders.html', 'canteen-bills.html', 'canteen-analytics.html', 'canteen-settings.html'];
    const studentPages = ['dashboard.html', 'canteens.html', 'menu.html', 'cart.html', 'orders.html', 'bills.html'];
    if (currentUser.role === 'canteen' && studentPages.includes(currentPage)) window.location.href = 'canteen-dashboard.html';
    else if (currentUser.role === 'student' && canteenPages.includes(currentPage)) window.location.href = 'dashboard.html';

    if (currentUser.role === 'canteen') {
        const sidebarNav = document.querySelector('.app-nav');
        if (sidebarNav && !sidebarNav.querySelector('[href="canteen-dashboard.html"]')) {
            sidebarNav.innerHTML = `
                <a href="canteen-dashboard.html" class="app-nav-link${currentPage === 'canteen-dashboard.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Dashboard</a>
                <a href="canteen-menu.html" class="app-nav-link${currentPage === 'canteen-menu.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>Menu</a>
                <a href="canteen-orders.html" class="app-nav-link${currentPage === 'canteen-orders.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>Orders</a>
                <a href="canteen-bills.html" class="app-nav-link${currentPage === 'canteen-bills.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>Bills</a>
                <div class="app-nav-divider"></div>
                <a href="canteen-analytics.html" class="app-nav-link${currentPage === 'canteen-analytics.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Analytics</a>
                <a href="canteen-settings.html" class="app-nav-link${currentPage === 'canteen-settings.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Settings</a>
                <div class="app-nav-divider"></div>
                <a href="#" id="logoutBtn" class="app-nav-link"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>Logout</a>
            `;
        }
        const userName = document.querySelector('.app-user-name');
        const userRole = document.querySelector('.app-user-role');
        if (userName) userName.textContent = canteenSettings.name || 'Food Court';
        if (userRole) userRole.textContent = 'Canteen Admin';
    } else {
        const sidebarNav = document.querySelector('.app-nav');
        if (sidebarNav && !sidebarNav.querySelector('[href="dashboard.html"]') && !sidebarNav.querySelector('[href="canteen-dashboard.html"]')) {
            sidebarNav.innerHTML = `
                <a href="dashboard.html" class="app-nav-link${currentPage === 'dashboard.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Dashboard</a>
                <a href="canteens.html" class="app-nav-link${currentPage === 'canteens.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>Canteens</a>
                <a href="menu.html" class="app-nav-link${currentPage === 'menu.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>Menu</a>
                <a href="cart.html" class="app-nav-link${currentPage === 'cart.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>Cart<span class="app-badge" style="display:none;">0</span></a>
                <div class="app-nav-divider"></div>
                <a href="orders.html" class="app-nav-link${currentPage === 'orders.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>My Orders</a>
                <a href="bills.html" class="app-nav-link${currentPage === 'bills.html' ? ' active' : ''}"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>Bills</a>
                <div class="app-nav-divider"></div>
                <a href="#" id="logoutBtn" class="app-nav-link"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>Logout</a>
            `;
        }
        const userName = document.querySelector('.app-user-name');
        const userRole = document.querySelector('.app-user-role');
        if (userName) userName.textContent = currentUser?.name || 'Student';
        if (userRole) userRole.textContent = currentUser?.email || 'EASA College';
    }

    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => { e.preventDefault(); await signOut(auth); window.location.href = 'login.html'; });
    document.querySelectorAll('.app-nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href === currentPage) link.classList.add('active');
    });
}

async function seedMenuIfEmpty() {
    const snapshot = await getDocs(collection(db, 'menuItems'));
    if (snapshot.empty) { for (const item of SEED_MENU) { await addDoc(collection(db, 'menuItems'), { ...item, createdAt: serverTimestamp() }); } }
}

export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        const role = userDoc.exists() ? userDoc.data().role : 'student';
        window.location.href = role === 'canteen' ? 'canteen-dashboard.html' : 'dashboard.html';
    } catch (error) { alert('Login failed: ' + error.message); }
}

export async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        const result = await signInWithPopup(auth, provider);
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (!data.registerNumber || !data.department || !data.year) {
                showProfileCompleteModal(result.user);
            } else {
                window.location.href = data.role === 'canteen' ? 'canteen-dashboard.html' : 'dashboard.html';
            }
        } else {
            const userData = { email: result.user.email, name: result.user.displayName || 'Student', role: 'student', phone: '', department: '', year: '', registerNumber: '', balance: 0, totalOrders: 0, totalSpent: 0, favoriteItems: [], dietaryPreferences: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
            await setDoc(doc(db, 'users', result.user.uid), userData);
            showProfileCompleteModal(result.user);
        }
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') return;
        if (error.code === 'auth/unauthorized-domain') {
            alert('This domain is not authorized for Google Sign-In. Current domain: ' + window.location.hostname + '\n\nPlease add it in Firebase Console â†’ Authentication â†’ Settings â†’ Authorized domains.\n\nFor local testing, also add: localhost');
        } else if (error.code === 'auth/operation-not-allowed') {
            alert('Google Sign-In is not enabled. Please enable it in Firebase Console â†’ Authentication â†’ Sign-in method.');
        } else {
            alert('Google login failed (' + error.code + '): ' + error.message);
        }
    }
}

let profileModalUserData = null;

function showProfileCompleteModal(user) {
    profileModalUserData = user;
    let modal = document.getElementById('profileCompleteModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'profileCompleteModal';
        modal.className = 'profile-modal';
        modal.innerHTML = `
            <div class="profile-modal-content">
                <h2 class="profile-modal-title">Complete Your Profile</h2>
                <p class="profile-modal-desc">Welcome${user.displayName ? ', ' + user.displayName : ''}! Please fill in your college details to continue.</p>
                <form id="profileCompleteForm" class="profile-modal-form">
                    <div class="form-group">
                        <label class="form-label" for="profileRegNumber">Register Number</label>
                        <input type="text" id="profileRegNumber" class="form-input" placeholder="E720524AM006" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="profileDept">Department</label>
                            <select id="profileDept" class="form-select" required>
                                <option value="">Choose...</option>
                                <option value="cse">CSE</option>
                                <option value="ece">ECE</option>
                                <option value="eee">EEE</option>
                                <option value="mech">MECH</option>
                                <option value="civil">CIVIL</option>
                                <option value="it">IT</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="profileYear">Year</label>
                            <select id="profileYear" class="form-select" required>
                                <option value="">Year</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="profilePhone">Phone Number</label>
                        <input type="tel" id="profilePhone" class="form-input" placeholder="+91 701073672X">
                    </div>
                    <div class="profile-modal-actions">
                        <button type="submit" class="btn btn-primary btn-large btn-full">Continue</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('profileCompleteForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const regNumber = document.getElementById('profileRegNumber').value;
            const dept = document.getElementById('profileDept').value;
            const year = document.getElementById('profileYear').value;
            const phone = document.getElementById('profilePhone').value;
            try {
                await setDoc(doc(db, 'users', profileModalUserData.uid), { registerNumber: regNumber, department: dept, year, phone, updatedAt: serverTimestamp() }, { merge: true });
                modal.classList.remove('active');
                window.location.href = 'dashboard.html';
            } catch (error) { alert('Failed to update profile: ' + error.message); }
        });
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    }
    modal.classList.add('active');
}

export async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    const name = document.getElementById('name')?.value || 'User';
    const phone = document.getElementById('phone')?.value || '';
    const department = document.getElementById('department')?.value || '';
    const year = document.getElementById('year')?.value || '';
    const registerNumber = document.getElementById('registerNumber')?.value || '';
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') || 'student';
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userData = { email, name, role, phone, department, year, registerNumber, balance: 0, totalOrders: 0, totalSpent: 0, favoriteItems: [], dietaryPreferences: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        if (role === 'canteen') { delete userData.year; delete userData.registerNumber; delete userData.balance; delete userData.totalOrders; delete userData.totalSpent; delete userData.favoriteItems; delete userData.dietaryPreferences; userData.managerName = name; }
        await setDoc(doc(db, 'users', cred.user.uid), userData);
        window.location.href = role === 'canteen' ? 'canteen-dashboard.html' : 'dashboard.html';
    } catch (error) { alert('Registration failed: ' + error.message); }
}

function initApp() {
    Cart.load(); Cart.updateBadges();
    const savedTheme = localStorage.getItem('canzo_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle'; toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
    toggleBtn.innerHTML = `<svg class="sun-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg><svg class="moon-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
    toggleBtn.addEventListener('click', () => { const c = document.documentElement.getAttribute('data-theme'); const n = c === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); localStorage.setItem('canzo_theme', n); });
    document.body.appendChild(toggleBtn);

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.addEventListener('click', e => { if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && sidebar.classList.contains('open')) sidebar.classList.remove('open'); });
    }

    // Attach auth form handlers
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Attach Google Sign-In button handlers
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => { console.log('Google login btn clicked'); handleGoogleLogin(); });
    const googleRegisterBtn = document.getElementById('googleRegisterBtn');
    if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', () => { console.log('Google register btn clicked'); handleGoogleLogin(); });

    seedMenuIfEmpty(); listenToMenu(); listenToOrders(); loadCanteenSettings();
    initMenuPage(); initCartPage(); initDashboardPage(); initStudentOrders(); initStudentBills();
    initCanteenDashboard(); initCanteenMenu(); initCanteenOrders(); initCanteenBills(); initCanteenAnalytics(); initCanteenSettings();
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); } else { initApp(); }

function listenToMenu() { onSnapshot(query(collection(db, 'menuItems'), orderBy('createdAt', 'asc')), (snap) => { menuItems = []; snap.forEach(d => menuItems.push({ id: d.id, ...d.data() })); renderMenuIfActive(); renderCanteenMenuIfActive(); renderAnalyticsIfActive(); }); }

function listenToOrders() { onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => { allOrders = []; snap.forEach(d => allOrders.push({ id: d.id, ...d.data() })); renderStudentOrdersIfActive(); renderStudentBillsIfActive(); renderCanteenDashboardIfActive(); renderCanteenOrdersIfActive(); renderCanteenBillsIfActive(); renderAnalyticsIfActive(); renderDashboardIfActive(); }); }

async function loadCanteenSettings() { const d = await getDoc(doc(db, 'settings', 'canteen')); if (d.exists()) canteenSettings = { ...canteenSettings, ...d.data() }; }

function renderMenuIfActive() { const c = document.querySelector('.menu-items'); if (!c || !c.dataset.initialized) return; renderMenuItems(c); }
function renderCanteenMenuIfActive() { const l = document.getElementById('menuManagementList'); if (!l) return; renderCanteenMenuList(l); }
function renderStudentOrdersIfActive() { const a = document.querySelector('.content-card:first-child .order-list, .order-list:not(.order-history-list)'); if (!a) return; renderStudentOrders(a); }
function renderStudentBillsIfActive() { const b = document.querySelector('.bills-list'); if (!b) return; renderStudentBills(b); }
function renderCanteenDashboardIfActive() { const q = document.getElementById('liveOrderQueue'); if (!q) return; renderLiveQueue(q); renderCanteenDashboardStats(); }
function renderCanteenOrdersIfActive() { const t = document.getElementById('canteenOrdersTableBody'); if (!t) return; renderOrdersTable(t); }
function renderCanteenBillsIfActive() { const b = document.querySelector('.canteen-bills-list'); if (!b) return; renderCanteenBills(b); }
function renderAnalyticsIfActive() { const c = document.getElementById('analyticsRevenueChart'); const t = document.getElementById('analyticsTopItems'); if (!c && !t) return; renderAnalytics(c, t, document.getElementById('analyticsFrequencyGrid'), document.getElementById('analyticsLowDemand')); }
function renderDashboardIfActive() { const e = document.querySelector('.stat-card[data-stat="total"] .stat-card-value'); if (!e) return; updateDashboardStats(); }

function updateDashboardStats() {
    const totalOrders = allOrders.length;
    const thisMonth = allOrders.filter(o => { const d = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;
    const totalSpent = allOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
    const tE = document.querySelector('.stat-card[data-stat="total"] .stat-card-value');
    const mE = document.querySelector('.stat-card[data-stat="month"] .stat-card-value');
    const sE = document.querySelector('.stat-card[data-stat="spent"] .stat-card-value');
    if (tE) tE.textContent = totalOrders; if (mE) mE.textContent = thisMonth; if (sE) sE.textContent = `â‚¹${totalSpent}`;
    const sG = document.querySelector('.stats-grid');
    if (sG) { const ob = new IntersectionObserver(en => { en.forEach(e => { if (e.isIntersecting) { document.querySelectorAll('.stat-card-value').forEach(el => animateCounter(el)); ob.disconnect(); } }); }, { threshold: 0.5 }); ob.observe(sG); }
}
