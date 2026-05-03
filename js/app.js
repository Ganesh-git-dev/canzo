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
                await updateDoc(doc(db, 'users', profileModalUserData.uid), { registerNumber: regNumber, department: dept, year, phone, updatedAt: serverTimestamp() });
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

function renderMenuItems(container) {
    const inStock = menuItems.filter(i => i.inStock);
    if (inStock.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div><h3 class="empty-title">No items available</h3><p class="empty-text">Check back later for new dishes</p></div>'; return; }
    container.innerHTML = inStock.map(item => `<div class="menu-item" data-id="${item.id}" data-category="${item.category}" data-name="${item.name.toLowerCase()}" data-desc="${item.description.toLowerCase()}"><div class="menu-item-image"><img src="${item.image}" alt="${item.name}" loading="lazy"></div><div class="menu-item-details"><div class="menu-item-header"><h4 class="menu-item-name">${item.name}</h4><span class="menu-item-price">â‚¹${item.price}</span></div><p class="menu-item-desc">${item.description}</p><button class="menu-item-add" data-id="${item.id}">Add to Cart</button></div></div>`).join('');
    container.querySelectorAll('.menu-item-add').forEach(btn => { btn.addEventListener('click', function() { const id = this.closest('.menu-item').dataset.id; const item = menuItems.find(i => i.id === id); if (item) { Cart.add({ id: item.id, name: item.name, price: item.price, image: item.image }); const t = this.textContent; this.textContent = 'Added âœ“'; this.style.background = '#10b981'; setTimeout(() => { this.textContent = t; this.style.background = ''; }, 1500); } }); });
}

function initMenuPage() {
    const mc = document.querySelector('.menu-items'); if (!mc) return; mc.dataset.initialized = 'true';
    const ce = document.querySelector('.menu-categories');
    const sh = `<div class="menu-search-wrapper"><svg class="menu-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" class="menu-search-input" id="menuSearch" placeholder="Search for dishes..."></div>`;
    if (ce) ce.insertAdjacentHTML('beforebegin', sh);
    const renderCats = () => { if (ce) { const cats = [...new Set(menuItems.map(i => i.category))]; ce.innerHTML = ['all', ...cats].map((c, i) => `<button class="menu-category-btn${i === 0 ? ' active' : ''}" data-category="${c}">${c === 'all' ? 'All Items' : c.charAt(0).toUpperCase() + c.slice(1)}</button>`).join(''); } };
    renderCats(); renderMenuItems(mc);
    const si = document.getElementById('menuSearch');
    document.querySelectorAll('.menu-category-btn').forEach(btn => { btn.addEventListener('click', function() { document.querySelectorAll('.menu-category-btn').forEach(b => b.classList.remove('active')); this.classList.add('active'); filterMenu(); }); });
    function filterMenu() { const ac = document.querySelector('.menu-category-btn.active'); const st = si ? si.value.toLowerCase() : ''; const cat = ac ? ac.dataset.category : 'all'; mc.querySelectorAll('.menu-item').forEach(item => { const n = item.dataset.name; const d = item.dataset.desc; const c = item.dataset.category; const ms = !st || n.includes(st) || d.includes(st); const mc2 = cat === 'all' || c === cat; item.style.display = ms && mc2 ? '' : 'none'; });
        const any = Array.from(mc.querySelectorAll('.menu-item')).some(i => i.style.display !== 'none'); let es = document.getElementById('menuEmptyState'); if (!any) { if (!es) { es = document.createElement('div'); es.id = 'menuEmptyState'; es.className = 'empty-state'; es.innerHTML = `<div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><h3 class="empty-title">No dishes found</h3><p class="empty-text">Try a different search or category</p>`; mc.after(es); } es.style.display = ''; } else if (es) es.style.display = 'none'; }
    if (si) si.addEventListener('input', filterMenu);
}

function initCartPage() {
    const cc = document.querySelector('.cart-layout .content-card-body'); const se = document.querySelector('.cart-summary'); if (!cc) return;
    renderCart();
    function renderCart() {
        cc.innerHTML = ''; const items = Cart.items;
        if (items.length === 0) { cc.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></div><h3 class="empty-title">Your cart is empty</h3><p class="empty-text">Browse the menu to add some delicious items</p><a href="menu.html" class="btn btn-primary" style="margin-top:16px;">Browse Menu</a></div>`; if (se) se.style.display = 'none'; return; }
        if (se) se.style.display = '';
        items.forEach(item => { const d = document.createElement('div'); d.className = 'cart-item'; d.dataset.id = item.id; d.innerHTML = `<div class="cart-item-image"><img src="${item.image}" alt="${item.name}" loading="lazy"></div><div class="cart-item-details"><h4 class="cart-item-name">${item.name}</h4><p class="cart-item-price">â‚¹${item.price} each</p><div class="cart-item-actions"><button class="cart-qty-btn" data-action="dec">âˆ’</button><span class="cart-qty">${item.qty}</span><button class="cart-qty-btn" data-action="inc">+</button><span class="cart-item-remove"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></span></div></div>`; cc.appendChild(d); });
        updateSummary(); bindCartEvents();
    }
    function updateSummary() {
        const sub = Cart.total(); const tax = Math.round(sub * 0.05); const tot = sub + tax;
        const su = document.querySelector('.app-header-subtitle'); if (su) su.textContent = `${Cart.count()} item${Cart.count() !== 1 ? 's' : ''} from Food Court`;
        const rows = document.querySelectorAll('.cart-summary-row'); if (rows.length >= 4) { rows[0].querySelector('span:last-child').textContent = `â‚¹${sub}`; rows[2].querySelector('span:last-child').textContent = `â‚¹${tax}`; rows[3].querySelector('span:last-child').textContent = `â‚¹${tot}`; }
    }
    function bindCartEvents() {
        cc.querySelectorAll('.cart-qty-btn').forEach(btn => { btn.addEventListener('click', function() { const id = this.closest('.cart-item').dataset.id; const qe = this.closest('.cart-item').querySelector('.cart-qty'); let q = parseInt(qe.textContent); if (this.dataset.action === 'inc') q++; else if (this.dataset.action === 'dec' && q > 1) q--; Cart.updateQty(id, q); qe.textContent = Cart.items.find(i => i.id === id)?.qty || 0; updateSummary(); }); });
        cc.querySelectorAll('.cart-item-remove').forEach(btn => { btn.addEventListener('click', function() { const id = this.closest('.cart-item').dataset.id; const el = this.closest('.cart-item'); el.style.opacity = '0'; el.style.transform = 'translateX(-20px)'; el.style.transition = 'all 0.3s ease'; setTimeout(() => { Cart.remove(id); renderCart(); }, 300); }); });
    }
    document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
        if (Cart.items.length === 0) return;
        const slot = document.getElementById('cartSlot')?.value || 'Lunch Break';
        const sub = Cart.total(); const tax = Math.round(sub * 0.05); const tot = sub + tax;
        const order = { studentName: currentUser?.name || 'Student', studentEmail: currentUser?.email || '', studentId: currentUser?.uid || '', registerNumber: currentUser?.registerNumber || '', department: currentUser?.department || '', year: currentUser?.year || '', phone: currentUser?.phone || '', items: Cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image, lineTotal: i.price * i.qty })), slot, subtotal: sub, tax, taxRate: 0.05, deliveryFee: 0, total: tot, billNumber: `BILL-${Date.now()}`, canteen: canteenSettings.name, canteenId: 'canteen', status: 'accepted', paymentMethod: 'cash', paymentStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        await addDoc(collection(db, 'orders'), order);
        await updateDoc(doc(db, 'users', currentUser?.uid), { totalOrders: (currentUser?.totalOrders || 0) + 1, totalSpent: (currentUser?.totalSpent || 0) + tot, updatedAt: serverTimestamp() });
        Cart.clear(); renderCart(); alert('Order placed successfully!'); window.location.href = 'orders.html';
    });
}

function initDashboardPage() { const n = document.querySelector('.app-user-name'); const r = document.querySelector('.app-user-role'); if (n) n.textContent = currentUser?.name || 'Student'; if (r) r.textContent = currentUser?.email || 'EASA College'; }
function animateCounter(el) { const t = el.textContent; const p = t.startsWith('â‚¹'); const c = t.includes(','); const d = t.includes('.'); const cl = t.replace(/[â‚¹,]/g, ''); const tg = parseFloat(cl); if (isNaN(tg)) return; const dur = 1500; const st = performance.now(); function step(now) { const pr = Math.min((now - st) / dur, 1); const e = 1 - Math.pow(1 - pr, 3); let cur = e * tg; let disp = d ? cur.toFixed(1) : Math.round(cur).toString(); if (c) disp = Number(disp).toLocaleString('en-IN'); if (p) disp = 'â‚¹' + disp; el.textContent = disp; if (pr < 1) requestAnimationFrame(step); } requestAnimationFrame(step); }

function renderCanteenDashboardStats() {
    const today = allOrders.filter(o => { const d = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt); return d.toDateString() === new Date().toDateString(); });
    const rev = today.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
    const active = allOrders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
    const tE = document.getElementById('statTodayOrders'); const rE = document.getElementById('statTodayRevenue'); const aE = document.getElementById('statItemsSold'); const oE = document.getElementById('statAvgPrep');
    if (tE) tE.textContent = today.length; if (rE) rE.textContent = `â‚¹${rev.toLocaleString('en-IN')}`; if (aE) aE.textContent = active; if (oE) oE.textContent = allOrders.length;
}

function initCanteenDashboard() { const q = document.getElementById('liveOrderQueue'); if (!q) return; renderLiveQueue(q); renderCanteenDashboardStats(); const n = document.querySelector('.app-header-subtitle'); if (n) n.textContent = `${canteenSettings.name} Â· ${canteenSettings.location}`; }

function renderLiveQueue(queue) {
    const orders = allOrders.filter(o => ACTIVE_STATUSES.includes(o.status));
    queue.innerHTML = '';
    if (orders.length === 0) { queue.innerHTML = '<div class="canteen-empty-state">No active orders</div>'; return; }
    orders.forEach(order => {
        const div = document.createElement('div');
        const idx = STATUS_FLOW.indexOf(order.status);
        div.className = `canteen-order-item${order.status === 'preparing' ? ' canteen-order-item--preparing' : ''}`;
        div.dataset.id = order.id;
        const timeStr = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const nextStatus = STATUS_FLOW[idx + 1] || null;
        div.innerHTML = `
            <div class="canteen-order-item-header">
                <span class="canteen-order-id">#${order.id.slice(-4)}</span>
                <span class="canteen-order-time">${timeStr}</span>
                <span class="canteen-order-status canteen-order-status--${order.status}">${STATUS_LABELS[order.status]}</span>
            </div>
            <div class="canteen-order-student">${order.studentName}${order.slot ? ' Â· ' + order.slot : ''}</div>
            <div class="canteen-order-items">${order.items.map(i => `${i.name} Ã—${i.qty}`).join(', ')}</div>
            <div class="canteen-order-footer">
                <span class="canteen-order-total">â‚¹${order.total}</span>
                ${nextStatus ? `<button class="btn-status-advance" data-action="advance">â†’ ${STATUS_LABELS[nextStatus]}</button>` : '<span class="canteen-order-status canteen-order-status--delivered">Delivered</span>'}
            </div>`;
        queue.appendChild(div);
    });
    queue.querySelectorAll('.btn-status-advance').forEach(btn => {
        btn.addEventListener('click', async function() {
            const card = this.closest('.canteen-order-item');
            const orderId = card.dataset.id;
            const order = allOrders.find(o => o.id === orderId);
            if (!order) return;
            const idx = STATUS_FLOW.indexOf(order.status);
            const next = STATUS_FLOW[idx + 1];
            if (next) await updateDoc(doc(db, 'orders', orderId), { status: next, updatedAt: new Date().toISOString() });
        });
    });
}

function renderCanteenMenuList(list) {
    const categories = ['all', ...new Set(menuItems.map(i => i.category))];
    const tc = document.querySelector('.menu-management-categories');
    if (tc) {
        tc.innerHTML = categories.map((c, i) => `<button class="menu-category-btn${i === 0 ? ' active' : ''}" data-category="${c}">${c === 'all' ? 'All Items' : c.charAt(0).toUpperCase() + c.slice(1)}</button>`).join('');
        tc.querySelectorAll('.menu-category-btn').forEach(btn => { btn.addEventListener('click', function() { tc.querySelectorAll('.menu-category-btn').forEach(b => b.classList.remove('active')); this.classList.add('active'); const c = this.dataset.category; list.querySelectorAll('.menu-management-item').forEach(item => { item.style.display = c === 'all' || item.dataset.category === c ? '' : 'none'; }); }); });
    }
    list.innerHTML = menuItems.map(item => `<div class="menu-management-item" data-id="${item.id}" data-category="${item.category}"><div class="menu-management-item-image"><img src="${item.image}" alt="${item.name}"></div><div class="menu-management-item-details"><div class="menu-management-item-header"><h4 class="menu-management-item-name">${item.name}</h4><span class="menu-management-item-category">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span></div><p class="menu-management-item-desc">${item.description}</p><div class="menu-management-item-meta"><span class="menu-management-item-price">â‚¹${item.price}</span><label class="menu-management-item-toggle"><input type="checkbox" ${item.inStock ? 'checked' : ''} data-id="${item.id}"><span class="menu-management-item-toggle-slider"></span><span class="menu-management-item-toggle-label">${item.inStock ? 'In Stock' : 'Out of Stock'}</span></label></div></div><div class="menu-management-item-actions"><button class="menu-management-item-edit" data-id="${item.id}"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="menu-management-item-delete" data-id="${item.id}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></div>`).join('');
    list.querySelectorAll('.menu-management-item-toggle input').forEach(t => { t.addEventListener('change', async function() { await updateDoc(doc(db, 'menuItems', this.dataset.id), { inStock: this.checked }); }); });
    list.querySelectorAll('.menu-management-item-edit').forEach(btn => { btn.addEventListener('click', function() { const item = menuItems.find(i => i.id === this.dataset.id); if (item) openMenuModal(item); }); });
    list.querySelectorAll('.menu-management-item-delete').forEach(btn => { btn.addEventListener('click', async function() { const id = this.dataset.id; const el = document.querySelector(`.menu-management-item[data-id="${id}"]`); if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(-20px)'; el.style.transition = 'all 0.3s ease'; setTimeout(async () => { await deleteDoc(doc(db, 'menuItems', id)); }, 300); } }); });
}

function initCanteenMenu() {
    const list = document.getElementById('menuManagementList'); if (!list) return; renderCanteenMenuList(list);
    const modal = document.getElementById('menuModal'); const form = document.getElementById('menuForm');
    function openMenuModal(item = null) { document.getElementById('menuModalTitle').textContent = item ? 'Edit Item' : 'Add New Item'; document.getElementById('menuModalSave').textContent = item ? 'Save Changes' : 'Add Item'; document.getElementById('menuItemName').value = item?.name || ''; document.getElementById('menuItemDesc').value = item?.description || ''; document.getElementById('menuItemPrice').value = item?.price || ''; document.getElementById('menuItemCategory').value = item?.category || 'short-bites'; document.getElementById('menuItemImage').value = item?.image || ''; form.dataset.editId = item?.id || ''; modal.classList.add('active'); }
    document.getElementById('addMenuItemBtn')?.addEventListener('click', () => openMenuModal());
    document.getElementById('menuModalClose')?.addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('menuModalCancel')?.addEventListener('click', () => modal.classList.remove('active'));
    modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
    if (form) { form.addEventListener('submit', async (e) => { e.preventDefault(); const eid = form.dataset.editId; const name = document.getElementById('menuItemName').value; const desc = document.getElementById('menuItemDesc').value; const price = parseInt(document.getElementById('menuItemPrice').value); const cat = document.getElementById('menuItemCategory').value; const img = document.getElementById('menuItemImage').value || 'assets/images/biryani.jpg'; if (eid) { await updateDoc(doc(db, 'menuItems', eid), { name, description: desc, price, category: cat, image: img }); } else { await addDoc(collection(db, 'menuItems'), { name, description: desc, price, category: cat, image: img, inStock: true, createdAt: serverTimestamp() }); } modal.classList.remove('active'); }); }
}

function renderOrdersTable(tableBody) {
    tableBody.innerHTML = '';
    if (allOrders.length === 0) { tableBody.innerHTML = '<div class="canteen-orders-empty"><p>No orders yet</p></div>'; return; }
    allOrders.forEach(order => {
        const row = document.createElement('div');
        const idx = STATUS_FLOW.indexOf(order.status);
        const isDone = order.status === 'delivered';
        row.className = `canteen-orders-table-row canteen-orders-table-row--${order.status}`;
        row.dataset.id = order.id;
        row.innerHTML = `
            <div class="canteen-orders-table-col">#${order.id.slice(-4)}</div>
            <div class="canteen-orders-table-col"><strong>${order.studentName}</strong></div>
            <div class="canteen-orders-table-col">${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
            <div class="canteen-orders-table-col">${order.slot || 'â€”'}</div>
            <div class="canteen-orders-table-col">â‚¹${order.total}</div>
            <div class="canteen-orders-table-col">
                ${!isDone && idx < STATUS_FLOW.length - 1 ? `<button class="btn-order-advance" data-id="${order.id}">â†’ ${STATUS_LABELS[STATUS_FLOW[idx + 1]]}</button>` : `<span class="canteen-order-status canteen-order-status--${order.status}">${STATUS_LABELS[order.status] || order.status}</span>`}
            </div>`;
        tableBody.appendChild(row);
    });
    tableBody.querySelectorAll('.btn-order-advance').forEach(btn => {
        btn.addEventListener('click', async function() {
            const orderId = this.dataset.id;
            const order = allOrders.find(o => o.id === orderId);
            if (!order) return;
            const idx = STATUS_FLOW.indexOf(order.status);
            const next = STATUS_FLOW[idx + 1];
            if (next) await updateDoc(doc(db, 'orders', orderId), { status: next, updatedAt: new Date().toISOString() });
        });
    });
}

function initCanteenOrders() {
    const tableBody = document.getElementById('canteenOrdersTableBody'); if (!tableBody) return; renderOrdersTable(tableBody);
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
            const rowSlot = row.querySelector('.canteen-orders-table-col:nth-child(4)')?.textContent.trim().toLowerCase() || '';
            const rowSearch = row.textContent.toLowerCase();
            let visible = true;
            if (tab === 'active' && rowStatus === 'delivered') visible = false;
            if (tab === 'completed' && rowStatus !== 'delivered') visible = false;
            if (status !== 'all' && rowStatus !== status) visible = false;
            if (slot !== 'all' && !rowSlot.includes(slot)) visible = false;
            if (search && !rowSearch.includes(search)) visible = false;
            row.style.display = visible ? '' : 'none';
        });
    }
    tabs.forEach(tab => { tab.addEventListener('click', function() { tabs.forEach(t => t.classList.remove('active')); this.classList.add('active'); applyFilters(); }); });
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (slotFilter) slotFilter.addEventListener('change', applyFilters);
    if (searchInput) searchInput.addEventListener('input', applyFilters);
}

function initCanteenSettings() {
    const nI = document.getElementById('canteenNameInput'); const lI = document.getElementById('canteenLocationInput');
    const aT = document.getElementById('autoRejectToggle'); const aI = document.getElementById('autoRejectTime'); const mI = document.getElementById('maxOrdersInput');
    if (nI) nI.value = canteenSettings.name; if (lI) lI.value = canteenSettings.location;
    if (aT) aT.checked = canteenSettings.autoReject; if (aI) { aI.value = canteenSettings.autoRejectTime; aI.disabled = !canteenSettings.autoReject; }
    if (mI) mI.value = canteenSettings.maxOrders;
    if (aT) aT.addEventListener('change', function() { canteenSettings.autoReject = this.checked; if (aI) aI.disabled = !this.checked; });
    document.getElementById('saveSettingsBtn')?.addEventListener('click', async function() {
        canteenSettings.name = nI?.value || canteenSettings.name; canteenSettings.location = lI?.value || canteenSettings.location;
        if (aT) canteenSettings.autoReject = aT.checked; if (aI) canteenSettings.autoRejectTime = parseInt(aI.value) || 5;
        if (mI) canteenSettings.maxOrders = parseInt(mI.value) || 20;
        await setDoc(doc(db, 'settings', 'canteen'), canteenSettings); const o = this.textContent; this.textContent = 'Saved!'; this.style.background = '#10b981'; setTimeout(() => { this.textContent = o; this.style.background = ''; }, 2000);
    });
    document.getElementById('resetOrdersBtn')?.addEventListener('click', async () => { if (confirm('Clear all orders?')) { (await getDocs(collection(db, 'orders'))).forEach(async d => { await deleteDoc(d.ref); }); alert('Orders cleared'); } });
    document.getElementById('resetMenuBtn')?.addEventListener('click', async () => { if (confirm('Restore default menu?')) { (await getDocs(collection(db, 'menuItems'))).forEach(async d => { await deleteDoc(d.ref); }); for (const item of SEED_MENU) await addDoc(collection(db, 'menuItems'), { ...item, createdAt: serverTimestamp() }); alert('Menu restored'); } });
}

function renderAnalytics(chartBars, topItemsList, frequencyGrid, lowDemandList) {
    const delivered = allOrders.filter(o => o.status === 'delivered');
    const totalRevenue = delivered.reduce((s, o) => s + o.total, 0);
    const totalOrd = allOrders.length;
    const avgOrd = totalOrd > 0 ? Math.round(totalRevenue / totalOrd) : 0;
    const rE = document.getElementById('analyticsTotalRevenue'); const oE = document.getElementById('analyticsTotalOrders'); const aE = document.getElementById('analyticsAvgOrder');
    if (rE) rE.textContent = `â‚¹${totalRevenue.toLocaleString('en-IN')}`; if (oE) oE.textContent = totalOrd; if (aE) aE.textContent = `â‚¹${avgOrd}`;
    const days = []; const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const ds = d.toDateString(); const do2 = allOrders.filter(o => { const od = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt); return od.toDateString() === ds && o.status === 'delivered'; }); days.push({ name: dayNames[d.getDay()], revenue: do2.reduce((s, o) => s + o.total, 0), orders: do2.length }); }
    if (chartBars) { const mx = Math.max(...days.map(d => d.revenue), 1); chartBars.innerHTML = days.map(d => { const h = Math.max((d.revenue / mx) * 100, 4); return `<div class="analytics-bar-group"><div class="analytics-bar" style="height:${h}%;"><span class="analytics-bar-value">â‚¹${d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'k' : d.revenue}</span></div><span class="analytics-bar-label">${d.name}</span></div>`; }).join(''); }
    if (topItemsList) { const ic = {}; allOrders.forEach(o => { o.items.forEach(it => { if (!ic[it.name]) ic[it.name] = { name: it.name, qty: 0, rev: 0 }; ic[it.name].qty += it.qty; ic[it.name].rev += it.qty * it.price; }); }); const ti = Object.values(ic).sort((a, b) => b.qty - a.qty).slice(0, 6); topItemsList.innerHTML = ti.length === 0 ? '<div class="analytics-empty-state">No data yet</div>' : ti.map((it, i) => { const p = (it.qty / ti[0].qty) * 100; return `<div class="analytics-top-item"><span class="analytics-top-item-rank">${i + 1}</span><div class="analytics-top-item-info"><div class="analytics-top-item-name">${it.name}</div><div class="analytics-top-item-meta">${it.qty} orders Â· â‚¹${it.rev.toLocaleString('en-IN')}</div></div><div class="analytics-top-item-bar"><div class="analytics-top-item-bar-fill" style="width:${p}%;"></div></div></div>`; }).join(''); }
    if (frequencyGrid) { const sc = {}; allOrders.forEach(o => { if (!sc[o.studentName]) sc[o.studentName] = { name: o.studentName, orders: 0, spent: 0 }; sc[o.studentName].orders++; sc[o.studentName].spent += o.total; }); const students = Object.values(sc).sort((a, b) => b.orders - a.orders); const us = students.length; const ao = us > 0 ? (totalOrd / us).toFixed(1) : 0; const pu = students.filter(s => s.orders >= 5).length; const fv = frequencyGrid.querySelector('.analytics-frequency-value'); if (fv) { frequencyGrid.innerHTML = `<div class="analytics-frequency-card"><div class="analytics-frequency-value">${us}</div><div class="analytics-frequency-label">Unique Students</div></div><div class="analytics-frequency-card"><div class="analytics-frequency-value">${ao}</div><div class="analytics-frequency-label">Avg Orders/Student</div></div><div class="analytics-frequency-card"><div class="analytics-frequency-value">${pu}</div><div class="analytics-frequency-label">Power Users (5+ orders)</div></div>`; } else { frequencyGrid.innerHTML = students.length === 0 ? '<div class="analytics-empty-state">No data yet</div>' : students.map(s => { const ini = s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); return `<div class="analytics-frequency-item"><div class="analytics-frequency-avatar">${ini}</div><div class="analytics-frequency-info"><strong>${s.name}</strong><span>${s.orders} orders Â· â‚¹${s.spent}</span></div></div>`; }).join(''); } }
    if (lowDemandList) { const ioc = {}; allOrders.forEach(o => o.items.forEach(i => { ioc[i.name] = (ioc[i.name] || 0) + i.qty; })); const li = menuItems.filter(item => (ioc[item.name] || 0) === 0); lowDemandList.innerHTML = li.length === 0 ? '<div class="analytics-empty-state">No data yet</div>' : li.map(item => `<div class="analytics-waste-item"><div class="analytics-waste-item-info"><span class="analytics-waste-item-name">${item.name}</span><span class="analytics-waste-item-count">0 orders</span></div><span class="analytics-waste-item-badge analytics-waste-item-badge--very-low">No Orders</span></div>`).join(''); }
}

function initCanteenAnalytics() { const c = document.getElementById('analyticsRevenueChart'); const t = document.getElementById('analyticsTopItems'); const f = document.getElementById('analyticsFrequencyGrid'); const l = document.getElementById('analyticsLowDemand'); if (!c && !t) return; renderAnalytics(c, t, f, l); }

function renderStudentOrders(activeList) {
    const active = allOrders.filter(o => ACTIVE_STATUSES.includes(o.status));
    const history = allOrders.filter(o => o.status === 'delivered');
    const historyList = document.querySelector('.order-history-list');
    activeList.innerHTML = ''; if (historyList) historyList.innerHTML = '';
    if (active.length === 0) { activeList.innerHTML = '<div class="order-empty-state">No active orders</div>'; }
    else {
        const icons = { accepted: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', preparing: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', prepared: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' };
        active.forEach(order => {
            const div = document.createElement('div'); div.className = 'order-card';
            const ts = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleString();
            div.innerHTML = `<div class="order-card-status ${order.status}">${icons[order.status] || ''}</div><div class="order-card-info"><h4>${order.canteen || 'Food Court'}</h4><p class="order-card-id">#${order.id.slice(-4)} Â· ${order.billNumber || ''}</p><p class="order-card-items">${order.items.map(i => `${i.name} Ã—${i.qty}`).join(', ')}</p><p class="order-card-time">${ts} Â· ${order.slot}</p></div><div class="order-card-total"><span class="order-card-badge ${order.status}">${STATUS_LABELS[order.status]}</span><span class="order-card-amount">â‚¹${order.total}</span></div>`;
            activeList.appendChild(div);
        });
    }
    if (historyList) {
        if (history.length === 0) { historyList.innerHTML = '<div class="order-empty-state">No order history</div>'; }
        else { history.forEach(order => { const div = document.createElement('div'); div.className = 'order-card'; const ts = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleString(); div.innerHTML = `<div class="order-card-status delivered"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="order-card-info"><h4>${order.canteen || 'Food Court'}</h4><p class="order-card-id">#${order.id.slice(-4)} Â· ${order.billNumber || ''}</p><p class="order-card-items">${order.items.map(i => `${i.name} Ã—${i.qty}`).join(', ')}</p><p class="order-card-time">${ts}</p></div><div class="order-card-total"><span class="order-card-badge delivered">Delivered</span><span class="order-card-amount">â‚¹${order.total}</span></div>`; historyList.appendChild(div); }); }
    }
    const su = document.querySelector('.app-header-subtitle'); if (su) su.textContent = `${active.length} active, ${history.length} delivered`;
}

function initStudentOrders() { const a = document.querySelector('.content-card:first-child .order-list, .order-list:not(.order-history-list)'); if (!a) return; renderStudentOrders(a); }

function renderStudentBills(list) {
    const orders = allOrders.filter(o => o.status === 'delivered');
    if (orders.length === 0) { list.innerHTML = '<div class="order-empty-state">No bills yet</div>'; return; }
    list.innerHTML = orders.map(order => {
        const ts = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `<div class="bill-card"><div class="bill-header"><div><div class="bill-number">${order.billNumber || '#' + order.id.slice(-6)}</div><div class="bill-date">${ts}</div></div><div class="bill-total">â‚¹${order.total}</div></div><div class="bill-items">${order.items.map(i => `<div class="bill-item-row"><span class="bill-item-name">${i.name} Ã— ${i.qty}</span><span class="bill-item-price">â‚¹${i.lineTotal}</span></div>`).join('')}</div><div class="bill-summary"><div class="bill-summary-row"><span>Subtotal</span><span>â‚¹${order.subtotal || order.total - (order.tax || 0)}</span></div><div class="bill-summary-row"><span>Tax (5%)</span><span>â‚¹${order.tax || 0}</span></div><div class="bill-summary-row total"><span>Total</span><span>â‚¹${order.total}</span></div></div><div class="bill-footer"><span class="bill-slot">${order.slot || ''}</span><span class="bill-payment">${order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod || 'Cash'}</span></div></div>`;
    }).join('');
}

function initStudentBills() { const l = document.querySelector('.bills-list'); if (!l) return; renderStudentBills(l); }

function renderCanteenBills(list) {
    const orders = allOrders.filter(o => o.status === 'delivered');
    const totalRev = orders.reduce((s, o) => s + o.total, 0);
    const revEl = document.getElementById('canteenTotalRevenue');
    if (revEl) revEl.textContent = `â‚¹${totalRev.toLocaleString('en-IN')}`;
    if (orders.length === 0) { list.innerHTML = '<div class="canteen-empty-state">No bills yet</div>'; return; }
    list.innerHTML = orders.map(order => {
        const ts = new Date(order.createdAt?.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `<div class="bill-card"><div class="bill-header"><div><div class="bill-number">${order.billNumber || '#' + order.id.slice(-6)}</div><div class="bill-student">${order.studentName}${order.registerNumber ? ' Â· ' + order.registerNumber : ''}</div></div><div class="bill-total">â‚¹${order.total}</div></div><div class="bill-footer"><span class="bill-date">${ts}</span><span class="bill-slot">${order.slot || ''}</span><span class="bill-payment">${order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod || 'Cash'}</span></div></div>`;
    }).join('');
}

function initCanteenBills() { const l = document.querySelector('.canteen-bills-list'); if (!l) return; renderCanteenBills(l); }

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleGoogleLogin = handleGoogleLogin;

// Attach Google Sign-In button listeners (for when buttons are present)
document.addEventListener('DOMContentLoaded', () => {
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleLogin);

    const googleRegisterBtn = document.getElementById('googleRegisterBtn');
    if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleLogin);
});
