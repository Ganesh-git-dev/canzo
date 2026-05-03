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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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

const FAVORITES_KEY = 'canzo_favorites';
const Favorites = {
    items: [],
    load() { try { const d = localStorage.getItem(FAVORITES_KEY); this.items = d ? JSON.parse(d) : []; } catch { this.items = []; } return this.items; },
    save() { localStorage.setItem(FAVORITES_KEY, JSON.stringify(this.items)); this.updateBadges(); },
    // FIX: added clear() method (was called in initStudentSettingsPage but was missing)
    clear() { this.items = []; this.save(); },
    toggle(item) {
        const idx = this.items.findIndex(i => i.id === item.id);
        if (idx > -1) { this.items.splice(idx, 1); }
        else { this.items.push({ id: item.id, name: item.name, price: item.price, image: item.image }); }
        this.save();
    },
    has(id) { return this.items.some(i => i.id === id); },
    updateBadges() {
        const c = this.items.length;
        document.querySelectorAll('.app-nav-link').forEach(link => {
            if (link.getAttribute('href') === 'favorites.html') {
                let badge = link.querySelector('.app-badge');
                if (!badge) { badge = document.createElement('span'); badge.className = 'app-badge'; link.appendChild(badge); }
                badge.textContent = c; badge.style.display = c > 0 ? '' : 'none';
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
            alert('This domain is not authorized for Google Sign-In. Current domain: ' + window.location.hostname + '\n\nPlease add it in Firebase Console → Authentication → Settings → Authorized domains.\n\nFor local testing, also add: localhost');
        } else if (error.code === 'auth/operation-not-allowed') {
            alert('Google Sign-In is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method.');
        } else {
            alert('Google login failed (' + error.code + '): ' + error.message);
        }
    }
}

let profileModalUserData = null;
let duringRegistration = false;

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
        duringRegistration = true;
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userData = { email, name, role, phone, department, year, registerNumber, balance: 0, totalOrders: 0, totalSpent: 0, favoriteItems: [], dietaryPreferences: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        if (role === 'canteen') { delete userData.year; delete userData.registerNumber; delete userData.balance; delete userData.totalOrders; delete userData.totalSpent; delete userData.favoriteItems; delete userData.dietaryPreferences; userData.managerName = name; }
        await setDoc(doc(db, 'users', cred.user.uid), userData);
        if (role === 'student') {
            showProfileCompleteModal(cred.user);
        } else {
            window.location.href = 'canteen-dashboard.html';
        }
        duringRegistration = false;
    } catch (error) { duringRegistration = false; alert('Registration failed: ' + error.message); }
}

function initApp() {
    Cart.load(); Cart.updateBadges();
    const savedTheme = localStorage.getItem('canzo_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle'; toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
    toggleBtn.innerHTML = `<svg class="sun-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg><svg class="moon-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
    const _theme = document.documentElement.getAttribute('data-theme') || 'light';
    toggleBtn.querySelector('.sun-icon').style.display = _theme === 'dark' ? 'none' : '';
    toggleBtn.querySelector('.moon-icon').style.display = _theme === 'dark' ? '' : 'none';
    toggleBtn.addEventListener('click', () => { const c = document.documentElement.getAttribute('data-theme'); const n = c === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); localStorage.setItem('canzo_theme', n); toggleBtn.querySelector('.sun-icon').style.display = n === 'dark' ? 'none' : ''; toggleBtn.querySelector('.moon-icon').style.display = n === 'dark' ? '' : 'none'; });
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
    // Google Sign-In handlers - attach to both login and register pages
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Google login btn clicked');
            handleGoogleLogin();
        });
    }
    const googleRegisterBtn = document.getElementById('googleRegisterBtn');
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Google register btn clicked');
            handleGoogleLogin();
        });
    }

    seedMenuIfEmpty(); listenToMenu(); listenToOrders(); loadCanteenSettings();
    initMenuPage(); initCartPage(); initDashboardPage(); initStudentOrders(); initStudentBills();
    initCanteenDashboard(); initCanteenMenu(); initCanteenOrders(); initCanteenBills(); initCanteenAnalytics(); initCanteenSettings();
    initFavoritesPage();
    initStudentSettingsPage();
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); } else { initApp(); }

// ============================================
// MENU RENDERING
// ============================================

// FIX: merged duplicate renderMenuItems into a single function with optional filterCat param
function renderMenuItems(container, filterCat) {
    Favorites.load();
    let items = menuItems.filter(i => i.inStock);
    if (filterCat && filterCat !== 'all') items = items.filter(i => i.category === filterCat);
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div><h3 class="empty-title">No items available</h3><p class="empty-text">Check back later for new dishes</p></div>';
        return;
    }
    container.innerHTML = items.map(item =>
        '<div class="menu-item" data-id="' + item.id + '" data-category="' + item.category + '" data-name="' + item.name.toLowerCase() + '" data-desc="' + item.description.toLowerCase() + '">' +
        '<div class="menu-item-image"><img src="' + item.image + '" alt="' + item.name + '" loading="lazy"></div>' +
        '<div class="menu-item-details">' +
        '<div class="menu-item-header"><h4 class="menu-item-name">' + item.name + '</h4><span class="menu-item-price">₹' + item.price + '</span></div>' +
        '<p class="menu-item-desc">' + item.description + '</p>' +
        '<button class="menu-item-fav ' + (Favorites.has(item.id) ? 'active' : '') + '" data-id="' + item.id + '">' +
        '<svg viewBox="0 0 24 24" fill="' + (Favorites.has(item.id) ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button>' +
        '<button class="menu-item-add" data-id="' + item.id + '">Add to Cart</button>' +
        '</div></div>'
    ).join('');

    container.querySelectorAll('.menu-item-fav').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.closest('.menu-item').dataset.id;
            const item = menuItems.find(i => i.id === id);
            if (item) { Favorites.toggle(item); this.classList.toggle('active'); this.querySelector('svg').setAttribute('fill', Favorites.has(id) ? 'currentColor' : 'none'); }
        });
    });
    container.querySelectorAll('.menu-item-add').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.closest('.menu-item').dataset.id;
            const item = menuItems.find(i => i.id === id);
            if (item) { Cart.add({ id: item.id, name: item.name, price: item.price, image: item.image }); const t = this.textContent; this.textContent = 'Added ✓'; this.style.background = '#10b981'; setTimeout(() => { this.textContent = t; this.style.background = ''; }, 1500); }
        });
    });
}

function listenToMenu() {
    onSnapshot(query(collection(db, 'menuItems'), orderBy('createdAt', 'asc')), (snap) => {
        menuItems = [];
        snap.forEach(d => menuItems.push({ id: d.id, ...d.data() }));
        renderMenuIfActive();
        renderCanteenMenuIfActive();
        renderAnalyticsIfActive();
    });
}

function listenToOrders() {
    onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
        allOrders = [];
        snap.forEach(d => allOrders.push({ id: d.id, ...d.data() }));
        renderStudentOrdersIfActive();
        renderStudentBillsIfActive();
        renderCanteenDashboardIfActive();
        renderCanteenOrdersIfActive();
        renderCanteenBillsIfActive();
        renderAnalyticsIfActive();
        renderDashboardIfActive();
    });
}

async function loadCanteenSettings() {
    const d = await getDoc(doc(db, 'settings', 'canteen'));
    if (d.exists()) canteenSettings = { ...canteenSettings, ...d.data() };
}

// ============================================
// REACTIVE RENDER TRIGGERS
// ============================================

function renderMenuIfActive() { const c = document.querySelector('.menu-items'); if (!c) return; renderMenuItems(c, 'all'); }

// FIX: renderCanteenMenuIfActive now calls renderCanteenMenuList which is defined below
function renderCanteenMenuIfActive() { const l = document.getElementById('menuManagementList'); if (!l) return; renderCanteenMenuList(l, 'all'); }

// FIX: renderStudentOrdersIfActive delegates to initStudentOrders (renderStudentOrders was never defined)
function renderStudentOrdersIfActive() { const a = document.querySelector('.order-list'); if (!a) return; initStudentOrders(); }

// FIX: renderStudentBillsIfActive delegates to initStudentBills (renderStudentBills was never defined)
function renderStudentBillsIfActive() { const b = document.querySelector('.bills-list'); if (!b) return; initStudentBills(); }

function renderCanteenDashboardIfActive() { const q = document.getElementById('liveOrderQueue'); if (!q) return; renderLiveQueue(q); renderCanteenDashboardStats(); }

function renderCanteenOrdersIfActive() { const t = document.getElementById('canteenOrdersTableBody'); if (!t) return; renderOrdersTable(t); }

// FIX: renderCanteenBillsIfActive delegates to initCanteenBills (renderCanteenBills was never defined)
function renderCanteenBillsIfActive() { const b = document.querySelector('.canteen-bills-list'); if (!b) return; initCanteenBills(); }

function renderAnalyticsIfActive() {
    const c = document.getElementById('analyticsRevenueChart');
    const t = document.getElementById('analyticsTopItems');
    if (!c && !t) return;
    renderAnalytics(c, t, document.getElementById('analyticsFrequencyGrid'), document.getElementById('analyticsLowDemand'));
}

function renderDashboardIfActive() { const e = document.querySelector('.stat-card[data-stat="total"] .stat-card-value'); if (!e) return; updateDashboardStats(); }

// ============================================
// CANTEEN MENU LIST RENDERER (extracted so it can be called from multiple places)
// ============================================

function renderCanteenMenuList(list, filterCat) {
    let items = menuItems;
    if (filterCat && filterCat !== 'all') items = items.filter(i => i.category === filterCat);
    const catLabels = { biryani: 'Biryani', pizza: 'Pizza', burgers: 'Burgers', drinks: 'Drinks', snacks: 'Snacks', desserts: 'Desserts', 'short-bites': 'Short Bites', pastry: 'Pastry', maggie: 'Maggie', 'fried-rice': 'Fried Rice', juices: 'Juices' };
    if (items.length === 0) {
        list.innerHTML = '<div class="empty-state" id="menuEmptyState"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div><h3 class="empty-title">No menu items yet</h3><p class="empty-text">Click "Add Item" to create your first menu item</p></div>';
        return;
    }
    list.innerHTML = items.map(item =>
        '<div class="menu-management-item" data-id="' + item.id + '" data-category="' + item.category + '">' +
        '<div class="menu-management-item-image"><img src="' + item.image + '" alt="' + item.name + '" loading="lazy"></div>' +
        '<div class="menu-management-item-details">' +
        '<div class="menu-management-item-header"><h4 class="menu-management-item-name">' + item.name + '</h4><span class="menu-management-item-category">' + (catLabels[item.category] || item.category) + '</span></div>' +
        '<p class="menu-management-item-desc">' + item.description + '</p>' +
        '<div class="menu-management-item-meta">' +
        '<span class="menu-management-item-price">₹' + item.price + '</span>' +
        '<label class="menu-management-item-toggle">' +
        '<input type="checkbox" ' + (item.inStock ? 'checked' : '') + ' data-id="' + item.id + '">' +
        '<span class="menu-management-item-toggle-slider"></span>' +
        '<span class="menu-management-item-toggle-label">' + (item.inStock ? 'In Stock' : 'Out of Stock') + '</span>' +
        '</label></div></div>' +
        '<div class="menu-management-item-actions">' +
        '<button class="menu-management-item-edit" data-id="' + item.id + '"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
        '<button class="menu-management-item-delete" data-id="' + item.id + '"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>' +
        '</div></div>'
    ).join('');

    list.querySelectorAll('.menu-management-item-toggle input').forEach(cb => {
        cb.addEventListener('change', async function() {
            const id = this.dataset.id;
            const inStock = this.checked;
            try {
                await updateDoc(doc(db, 'menuItems', id), { inStock, updatedAt: serverTimestamp() });
            } catch(e) { alert('Failed to update stock: ' + e.message); this.checked = !inStock; }
        });
    });
    list.querySelectorAll('.menu-management-item-edit').forEach(btn => {
        btn.addEventListener('click', function() { window.openMenuModal(this.dataset.id); });
    });
    list.querySelectorAll('.menu-management-item-delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('Delete this item?')) return;
            try {
                await deleteDoc(doc(db, 'menuItems', this.dataset.id));
            } catch(e) { alert('Failed to delete: ' + e.message); }
        });
    });
}

// ============================================
// ORDERS TABLE RENDERER (extracted for reuse)
// ============================================

function renderOrdersTable(tableBody) {
    if (!tableBody) return;
    if (allOrders.length === 0) { tableBody.innerHTML = '<div class="empty-state"><p>No orders found</p></div>'; return; }
    const statusColors = { pending: 'yellow', accepted: 'blue', preparing: 'orange', ready: 'purple', picked: 'green', cancelled: 'red' };
    tableBody.innerHTML = allOrders.map(o => {
        const items = (o.items || []).map(i => i.name + ' x' + i.qty).join(', ');
        return '<div class="canteen-order-row" data-id="' + o.id + '">' +
            '<div class="canteen-order-col"><span class="order-id">#' + (o.billNumber || o.id.slice(0, 8)) + '</span></div>' +
            '<div class="canteen-order-col"><div class="canteen-order-student">' + (o.studentName || 'Unknown') + '</div><div class="canteen-order-items">' + items + '</div></div>' +
            '<div class="canteen-order-col">' + (o.slot || '-') + '</div>' +
            '<div class="canteen-order-col"><span class="status-badge status-badge--' + (statusColors[o.status] || 'yellow') + '">' + o.status + '</span></div>' +
            '<div class="canteen-order-col"><select class="form-select form-select--sm order-status-select" data-id="' + o.id + '">' +
            '<option value="pending"' + (o.status === 'pending' ? ' selected' : '') + '>Pending</option>' +
            '<option value="accepted"' + (o.status === 'accepted' ? ' selected' : '') + '>Accepted</option>' +
            '<option value="preparing"' + (o.status === 'preparing' ? ' selected' : '') + '>Preparing</option>' +
            '<option value="ready"' + (o.status === 'ready' ? ' selected' : '') + '>Ready</option>' +
            '<option value="picked"' + (o.status === 'picked' ? ' selected' : '') + '>Picked</option>' +
            '<option value="cancelled"' + (o.status === 'cancelled' ? ' selected' : '') + '>Cancelled</option>' +
            '</select></div></div>';
    }).join('');

    tableBody.querySelectorAll('.order-status-select').forEach(sel => {
        sel.addEventListener('change', async function() {
            const id = this.dataset.id;
            const newStatus = this.value;
            try {
                // FIX: was 'serverOrders' (undefined) — corrected to serverTimestamp()
                await updateDoc(doc(db, 'orders', id), { status: newStatus, updatedAt: serverTimestamp() });
            } catch(e) { alert('Failed to update status: ' + e.message); location.reload(); }
        });
    });
}

// ============================================
// FAVORITES PAGE
// ============================================

function initFavoritesPage() {
    const container = document.getElementById('favoritesList');
    if (!container) return;
    Favorites.load();
    if (Favorites.items.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div><h3 class="empty-title">No favorites yet</h3><p class="empty-text">Tap the heart icon on any menu item to add it here</p><a href="menu.html" class="btn btn-primary" style="margin-top:16px;">Browse Menu</a></div>';
        return;
    }
    container.innerHTML = Favorites.items.map(item =>
        '<div class="menu-item" data-id="' + item.id + '">' +
        '<div class="menu-item-image"><img src="' + item.image + '" alt="' + item.name + '" loading="lazy"></div>' +
        '<div class="menu-item-details"><div class="menu-item-header"><h4 class="menu-item-name">' + item.name + '</h4><span class="menu-item-price">₹' + item.price + '</span></div>' +
        '<button class="menu-item-add" data-id="' + item.id + '">Add to Cart</button></div></div>'
    ).join('');
    container.querySelectorAll('.menu-item-add').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const item = Favorites.items.find(i => i.id === id);
            if (item) { Cart.add({ id: item.id, name: item.name, price: item.price, image: item.image }); const t = this.textContent; this.textContent = 'Added ✓'; this.style.background = '#10b981'; setTimeout(() => { this.textContent = t; this.style.background = ''; }, 1500); }
        });
    });
}

// ============================================
// STUDENT SETTINGS PAGE
// ============================================

function initStudentSettingsPage() {
    const nameInput = document.getElementById('studentName');
    const phoneInput = document.getElementById('studentPhone');
    const deptInput = document.getElementById('studentDept');
    const yearInput = document.getElementById('studentYear');
    const regInput = document.getElementById('studentReg');
    if (!nameInput) return;
    if (currentUser) {
        nameInput.value = currentUser.name || '';
        phoneInput.value = currentUser.phone || '';
        deptInput.value = currentUser.department || '';
        yearInput.value = currentUser.year || '';
        regInput.value = currentUser.registerNumber || '';
    }
    document.getElementById('saveStudentSettings')?.addEventListener('click', async () => {
        const name = nameInput.value;
        const phone = phoneInput.value;
        const dept = deptInput.value;
        const year = yearInput.value;
        const reg = regInput.value;
        try {
            await setDoc(doc(db, 'users', currentUser.uid), { name, phone, department: dept, year, registerNumber: reg, updatedAt: serverTimestamp() }, { merge: true });
            currentUser.name = name; currentUser.phone = phone; currentUser.department = dept; currentUser.year = year; currentUser.registerNumber = reg;
            alert('Profile updated!');
        } catch (e) { alert('Failed: ' + e.message); }
    });
    document.getElementById('themeLightBtn')?.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('canzo_theme', 'light');
    });
    document.getElementById('themeDarkBtn')?.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('canzo_theme', 'dark');
    });
    document.getElementById('clearCartBtn')?.addEventListener('click', () => {
        if (confirm('Clear cart?')) { Cart.clear(); alert('Cart cleared'); }
    });
    document.getElementById('clearFavoritesBtn')?.addEventListener('click', () => {
        // FIX: Favorites.clear() now exists (added to Favorites object above)
        if (confirm('Clear favorites?')) { Favorites.clear(); Favorites.updateBadges(); alert('Favorites cleared'); }
    });
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboardStats() {
    const myOrders = currentUser ? allOrders.filter(o => o.userId === currentUser.uid) : [];
    const totalOrders = myOrders.length;
    const thisMonth = myOrders.filter(o => {
        const d = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt);
        const n = new Date();
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length;
    const totalSpent = myOrders.filter(o => o.status === 'picked').reduce((s, o) => s + (o.total || 0), 0);
    const tE = document.querySelector('.stat-card[data-stat="total"] .stat-card-value');
    const mE = document.querySelector('.stat-card[data-stat="month"] .stat-card-value');
    const sE = document.querySelector('.stat-card[data-stat="spent"] .stat-card-value');
    if (tE) tE.textContent = totalOrders;
    if (mE) mE.textContent = thisMonth;
    if (sE) sE.textContent = '₹' + totalSpent;
    const sG = document.querySelector('.stats-grid');
    if (sG) {
        const ob = new IntersectionObserver(en => { en.forEach(e => { if (e.isIntersecting) { document.querySelectorAll('.stat-card-value').forEach(el => animateCounter(el)); ob.disconnect(); } }); }, { threshold: 0.5 });
        ob.observe(sG);
    }
}

// ============================================
// MENU PAGE
// ============================================

function initMenuPage() {
    const catContainer = document.querySelector('.menu-categories');
    const itemsContainer = document.querySelector('.menu-items');
    if (!catContainer || !itemsContainer) return;
    Favorites.load(); Cart.load();
    function buildTabs() {
        const cats = ['all', ...new Set(menuItems.map(i => i.category))];
        const labels = { all: 'All', biryani: 'Biryani', pizza: 'Pizza', burgers: 'Burgers', drinks: 'Drinks', snacks: 'Snacks', desserts: 'Desserts', 'short-bites': 'Short Bites', pastry: 'Pastry', maggie: 'Maggie', 'fried-rice': 'Fried Rice', juices: 'Juices' };
        catContainer.innerHTML = cats.map(c => '<button class="menu-category-btn' + (c === 'all' ? ' active' : '') + '" data-category="' + c + '">' + (labels[c] || c) + '</button>').join('');
        catContainer.querySelectorAll('.menu-category-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                catContainer.querySelectorAll('.menu-category-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                renderMenuItems(itemsContainer, this.dataset.category);
            });
        });
    }
    buildTabs();
    renderMenuItems(itemsContainer, 'all');
    const searchInput = document.getElementById('menuSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const q = this.value.toLowerCase();
            itemsContainer.querySelectorAll('.menu-item').forEach(item => {
                const name = item.dataset.name;
                const desc = item.dataset.desc;
                item.style.display = (name.includes(q) || desc.includes(q)) ? '' : 'none';
            });
        });
    }
}

// ============================================
// CANTEEN MENU MANAGEMENT
// ============================================

function initCanteenMenu() {
    const list = document.getElementById('menuManagementList');
    const catBtns = document.querySelectorAll('#menuCategories .menu-category-btn');
    if (!list) return;
    let currentFilter = 'all';

    renderCanteenMenuList(list, currentFilter);

    catBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            catBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.category;
            renderCanteenMenuList(list, currentFilter);
        });
    });

    const addBtn = document.getElementById('addMenuItemBtn');
    if (addBtn) addBtn.addEventListener('click', () => window.openMenuModal(null));

    const modal = document.getElementById('menuModal');
    const closeBtn = document.getElementById('menuModalClose');
    const cancelBtn = document.getElementById('menuModalCancel');
    const form = document.getElementById('menuForm');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

    let editingId = null;
    window.openMenuModal = function(id) {
        editingId = id || null;
        form.reset();
        document.getElementById('menuModalTitle').textContent = id ? 'Edit Item' : 'Add New Item';
        document.getElementById('menuModalSave').textContent = id ? 'Save Changes' : 'Add Item';
        if (id) {
            const item = menuItems.find(i => i.id === id);
            if (item) {
                document.getElementById('menuItemName').value = item.name;
                document.getElementById('menuItemDesc').value = item.description;
                document.getElementById('menuItemPrice').value = item.price;
                document.getElementById('menuItemCategory').value = item.category;
                document.getElementById('menuItemImage').value = item.image;
            }
        }
        modal.classList.add('active');
    };

    if (form) form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('menuItemName').value,
            description: document.getElementById('menuItemDesc').value,
            price: Number(document.getElementById('menuItemPrice').value),
            category: document.getElementById('menuItemCategory').value,
            image: document.getElementById('menuItemImage').value || 'assets/images/biryani.jpg',
            updatedAt: serverTimestamp()
        };
        try {
            if (editingId) {
                await updateDoc(doc(db, 'menuItems', editingId), data);
            } else {
                data.inStock = true;
                data.createdAt = serverTimestamp();
                await addDoc(collection(db, 'menuItems'), data);
            }
            modal.classList.remove('active');
        } catch(err) { alert('Failed to save: ' + err.message); }
    });
}

// ============================================
// CANTEEN ORDERS
// ============================================

function initCanteenOrders() {
    const tableBody = document.getElementById('canteenOrdersTableBody');
    const tabs = document.querySelectorAll('#canteenOrdersTabs .canteen-orders-tab');
    const statusFilter = document.getElementById('orderStatusFilter');
    const slotFilter = document.getElementById('orderSlotFilter');
    const searchInput = document.getElementById('orderSearchInput');
    if (!tableBody) return;
    let currentTab = 'active';

    function getFilteredOrders() {
        let orders = allOrders;
        if (currentTab === 'active') orders = orders.filter(o => !['picked', 'cancelled'].includes(o.status));
        else if (currentTab === 'completed') orders = orders.filter(o => o.status === 'picked');
        else if (currentTab === 'cancelled') orders = orders.filter(o => o.status === 'cancelled');
        const sf = statusFilter?.value;
        if (sf && sf !== 'all') orders = orders.filter(o => o.status === sf);
        const slf = slotFilter?.value;
        if (slf && slf !== 'all') orders = orders.filter(o => o.slot?.toLowerCase().includes(slf));
        const q = searchInput?.value.toLowerCase();
        if (q) orders = orders.filter(o => (o.studentName || '').toLowerCase().includes(q) || (o.billNumber || '').toLowerCase().includes(q));
        return orders;
    }

    function renderTable() {
        const orders = getFilteredOrders();
        document.querySelectorAll('#canteenOrdersTabs .canteen-orders-tab').forEach(t => {
            const tab = t.dataset.tab;
            const count = allOrders.filter(o => {
                if (tab === 'active') return !['picked', 'cancelled'].includes(o.status);
                if (tab === 'completed') return o.status === 'picked';
                if (tab === 'cancelled') return o.status === 'cancelled';
                return true;
            }).length;
            t.textContent = t.textContent.split('(')[0] + '(' + count + ')';
        });
        if (orders.length === 0) { tableBody.innerHTML = '<div class="empty-state"><p>No orders found</p></div>'; return; }
        const statusColors = { pending: 'yellow', accepted: 'blue', preparing: 'orange', ready: 'purple', picked: 'green', cancelled: 'red' };
        tableBody.innerHTML = orders.map(o => {
            const items = (o.items || []).map(i => i.name + ' x' + i.qty).join(', ');
            return '<div class="canteen-order-row" data-id="' + o.id + '">' +
                '<div class="canteen-order-col"><span class="order-id">#' + (o.billNumber || o.id.slice(0, 8)) + '</span></div>' +
                '<div class="canteen-order-col"><div class="canteen-order-student">' + (o.studentName || 'Unknown') + '</div><div class="canteen-order-items">' + items + '</div></div>' +
                '<div class="canteen-order-col">' + (o.slot || '-') + '</div>' +
                '<div class="canteen-order-col"><span class="status-badge status-badge--' + (statusColors[o.status] || 'yellow') + '">' + o.status + '</span></div>' +
                '<div class="canteen-order-col"><select class="form-select form-select--sm order-status-select" data-id="' + o.id + '">' +
                '<option value="pending"' + (o.status === 'pending' ? ' selected' : '') + '>Pending</option>' +
                '<option value="accepted"' + (o.status === 'accepted' ? ' selected' : '') + '>Accepted</option>' +
                '<option value="preparing"' + (o.status === 'preparing' ? ' selected' : '') + '>Preparing</option>' +
                '<option value="ready"' + (o.status === 'ready' ? ' selected' : '') + '>Ready</option>' +
                '<option value="picked"' + (o.status === 'picked' ? ' selected' : '') + '>Picked</option>' +
                '<option value="cancelled"' + (o.status === 'cancelled' ? ' selected' : '') + '>Cancelled</option>' +
                '</select></div></div>';
        }).join('');
        tableBody.querySelectorAll('.order-status-select').forEach(sel => {
            sel.addEventListener('change', async function() {
                const id = this.dataset.id;
                const newStatus = this.value;
                try {
                    // FIX: was 'serverOrders' (undefined) — corrected to serverTimestamp()
                    await updateDoc(doc(db, 'orders', id), { status: newStatus, updatedAt: serverTimestamp() });
                } catch(e) { alert('Failed to update status: ' + e.message); location.reload(); }
            });
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTab = this.dataset.tab;
            renderTable();
        });
    });
    statusFilter?.addEventListener('change', renderTable);
    slotFilter?.addEventListener('change', renderTable);
    searchInput?.addEventListener('input', renderTable);
    renderTable();
}

// ============================================
// CANTEEN DASHBOARD
// ============================================

function initCanteenDashboard() {
    const statTodayOrders = document.getElementById('statTodayOrders');
    const statTodayRevenue = document.getElementById('statTodayRevenue');
    const statItemsSold = document.getElementById('statItemsSold');
    const statAvgPrep = document.getElementById('statAvgPrep');
    const liveQueue = document.getElementById('liveOrderQueue');
    const statusToggle = document.getElementById('canteenStatusToggle');
    if (!statTodayOrders) return;
    renderCanteenDashboardStats();
    if (liveQueue) renderLiveQueue(liveQueue);
    if (statusToggle) {
        loadCanteenSettings().then(() => {
            const label = statusToggle.querySelector('.canteen-status-label');
            const dot = statusToggle.querySelector('.canteen-status-dot');
            function updateUI() {
                if (label) label.textContent = canteenSettings.isOpen ? 'Open' : 'Closed';
                if (dot) dot.className = 'canteen-status-dot canteen-status-dot--' + (canteenSettings.isOpen ? 'open' : 'closed');
            }
            updateUI();
            statusToggle.style.cursor = 'pointer';
            statusToggle.addEventListener('click', async () => {
                canteenSettings.isOpen = !canteenSettings.isOpen;
                try {
                    await setDoc(doc(db, 'settings', 'canteen'), { isOpen: canteenSettings.isOpen, updatedAt: serverTimestamp() }, { merge: true });
                    updateUI();
                } catch(e) { alert('Failed to update: ' + e.message); canteenSettings.isOpen = !canteenSettings.isOpen; updateUI(); }
            });
        });
    }
}

function renderCanteenDashboardStats() {
    const statTodayOrders = document.getElementById('statTodayOrders');
    const statTodayRevenue = document.getElementById('statTodayRevenue');
    const statItemsSold = document.getElementById('statItemsSold');
    const statAvgPrep = document.getElementById('statAvgPrep');
    if (!statTodayOrders) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaysOrders = allOrders.filter(o => {
        const d = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt);
        return d >= today;
    });
    statTodayOrders.textContent = todaysOrders.length;
    const revenue = todaysOrders.filter(o => o.status === 'picked').reduce((s, o) => s + (o.total || 0), 0);
    if (statTodayRevenue) statTodayRevenue.textContent = '₹' + revenue;
    if (statItemsSold) statItemsSold.textContent = allOrders.filter(o => !['picked', 'cancelled'].includes(o.status)).length;
    if (statAvgPrep) statAvgPrep.textContent = allOrders.length;
}

function renderLiveQueue(container) {
    const active = allOrders.filter(o => !['picked', 'cancelled'].includes(o.status));
    if (active.length === 0) { container.innerHTML = '<div class="canteen-empty-state">No active orders</div>'; return; }
    container.innerHTML = active.map(o =>
        '<div class="canteen-live-order" data-id="' + o.id + '">' +
        '<div class="canteen-live-order-header"><span class="canteen-live-order-id">#' + (o.billNumber || o.id.slice(0, 8)) + '</span>' +
        '<span class="status-badge status-badge--' + (o.status === 'pending' ? 'yellow' : o.status === 'accepted' ? 'blue' : o.status === 'preparing' ? 'orange' : 'purple') + '">' + o.status + '</span></div>' +
        '<div class="canteen-live-order-customer">' + (o.studentName || 'Unknown') + '</div>' +
        '<div class="canteen-live-order-items">' + (o.items || []).map(i => i.name + ' x' + i.qty).join(', ') + '</div>' +
        '<div class="canteen-live-order-actions">' +
        '<button class="btn btn-sm btn-accept" data-id="' + o.id + '" data-action="accepted">Accept</button>' +
        '<button class="btn btn-sm btn-reject" data-id="' + o.id + '" data-action="cancelled">Reject</button>' +
        '<button class="btn btn-sm btn-ready" data-id="' + o.id + '" data-action="preparing">Preparing</button>' +
        '<button class="btn btn-sm btn-pick" data-id="' + o.id + '" data-action="ready">Ready</button>' +
        '</div></div>'
    ).join('');
    container.querySelectorAll('.btn-accept, .btn-reject, .btn-ready, .btn-pick').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            const action = this.dataset.action;
            try {
                await updateDoc(doc(db, 'orders', id), { status: action, updatedAt: serverTimestamp() });
            } catch(e) { alert('Failed: ' + e.message); }
        });
    });
}

// ============================================
// CANTEEN SETTINGS
// ============================================

function initCanteenSettings() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const resetOrdersBtn = document.getElementById('resetOrdersBtn');
    const resetMenuBtn = document.getElementById('resetMenuBtn');
    if (!saveBtn) return;
    loadCanteenSettings().then(() => {
        document.getElementById('canteenNameInput').value = canteenSettings.name || 'Food Court';
        document.getElementById('canteenLocationInput').value = canteenSettings.location || '';
        document.getElementById('canteenPhone').value = canteenSettings.phone || '';
        document.getElementById('canteenManager').value = canteenSettings.manager || '';
        const hours = canteenSettings.hours || {};
        if (hours.morning) { const p = hours.morning.split(' - '); if (p[0]) document.getElementById('morningStart').value = p[0]; if (p[1]) document.getElementById('morningEnd').value = p[1]; }
        if (hours.lunch) { const p = hours.lunch.split(' - '); if (p[0]) document.getElementById('lunchStart').value = p[0]; if (p[1]) document.getElementById('lunchEnd').value = p[1]; }
        if (hours.evening) { const p = hours.evening.split(' - '); if (p[0]) document.getElementById('eveningStart').value = p[0]; if (p[1]) document.getElementById('eveningEnd').value = p[1]; }
        document.getElementById('autoRejectToggle').checked = canteenSettings.autoReject || false;
        document.getElementById('autoRejectTime').value = canteenSettings.autoRejectTime || 10;
        document.getElementById('maxOrdersInput').value = canteenSettings.maxOrders || 30;
    });
    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('canteenNameInput').value;
        const location = document.getElementById('canteenLocationInput').value;
        const phone = document.getElementById('canteenPhone').value;
        const manager = document.getElementById('canteenManager').value;
        const hours = {
            morning: document.getElementById('morningStart').value + ' - ' + document.getElementById('morningEnd').value,
            lunch: document.getElementById('lunchStart').value + ' - ' + document.getElementById('lunchEnd').value,
            evening: document.getElementById('eveningStart').value + ' - ' + document.getElementById('eveningEnd').value
        };
        const data = { name, location, phone, manager, hours, isOpen: canteenSettings.isOpen, autoReject: document.getElementById('autoRejectToggle').checked, autoRejectTime: Number(document.getElementById('autoRejectTime').value), maxOrders: Number(document.getElementById('maxOrdersInput').value), updatedAt: serverTimestamp() };
        try {
            await setDoc(doc(db, 'settings', 'canteen'), data, { merge: true });
            canteenSettings = { ...canteenSettings, ...data };
            alert('Settings saved!');
        } catch(e) { alert('Failed: ' + e.message); }
    });
    resetOrdersBtn?.addEventListener('click', async () => {
        if (!confirm('Clear ALL orders? This cannot be undone.')) return;
        try {
            const snap = await getDocs(collection(db, 'orders'));
            const batch = [];
            snap.forEach(d => batch.push(deleteDoc(doc(db, 'orders', d.id))));
            await Promise.all(batch);
            alert('Orders cleared!');
        } catch(e) { alert('Failed: ' + e.message); }
    });
    resetMenuBtn?.addEventListener('click', async () => {
        if (!confirm('Reset menu to defaults? All custom items will be removed.')) return;
        try {
            const snap = await getDocs(collection(db, 'menuItems'));
            const batch = [];
            snap.forEach(d => batch.push(deleteDoc(doc(db, 'menuItems', d.id))));
            await Promise.all(batch);
            await seedMenuIfEmpty();
            alert('Menu reset!');
        } catch(e) { alert('Failed: ' + e.message); }
    });
}

// ============================================
// STUDENT ORDERS
// ============================================

function initStudentOrders() {
    const orderList = document.querySelector('.order-list:not(.order-history-list)');
    const historyList = document.querySelector('.order-history-list');
    if (!orderList) return;
    const active = allOrders.filter(o => o.studentId === currentUser?.uid && !['picked', 'cancelled'].includes(o.status));
    const history = allOrders.filter(o => o.studentId === currentUser?.uid && ['picked', 'cancelled'].includes(o.status));
    if (active.length === 0) {
        orderList.innerHTML = '<div class="empty-state"><p>No active orders</p></div>';
    } else {
        orderList.innerHTML = active.map(o =>
            '<div class="order-card">' +
            '<div class="order-card-header"><span class="order-id">#' + (o.billNumber || o.id.slice(0, 8)) + '</span>' +
            '<span class="status-badge status-badge--' + (o.status === 'pending' ? 'yellow' : o.status === 'accepted' ? 'blue' : o.status === 'preparing' ? 'orange' : 'purple') + '">' + o.status + '</span></div>' +
            '<div class="order-card-items">' + (o.items || []).map(i => i.name + ' x' + i.qty).join(', ') + '</div>' +
            '<div class="order-card-total">₹' + (o.total || 0) + '</div></div>'
        ).join('');
    }
    if (historyList) {
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-state"><p>No order history</p></div>';
        } else {
            historyList.innerHTML = history.map(o =>
                '<div class="order-card">' +
                '<div class="order-card-header"><span class="order-id">#' + (o.billNumber || o.id.slice(0, 8)) + '</span>' +
                '<span class="status-badge status-badge--' + (o.status === 'picked' ? 'green' : 'red') + '">' + o.status + '</span></div>' +
                '<div class="order-card-items">' + (o.items || []).map(i => i.name + ' x' + i.qty).join(', ') + '</div>' +
                '<div class="order-card-total">₹' + (o.total || 0) + '</div></div>'
            ).join('');
        }
    }
}

// ============================================
// STUDENT BILLS (FIX: was referenced but never defined)
// ============================================

function initStudentBills() {
    const billsList = document.querySelector('.bills-list');
    if (!billsList) return;
    const completedOrders = allOrders.filter(o => o.userId === currentUser?.uid && o.status === 'picked');
    if (completedOrders.length === 0) {
        billsList.innerHTML = '<div class="empty-state"><p>No bills yet</p></div>';
        return;
    }
    billsList.innerHTML = completedOrders.map(o =>
        '<div class="bill-card">' +
        '<div class="bill-card-header"><span class="bill-id">' + (o.billNumber || '#' + o.id.slice(0, 8)) + '</span>' +
        '<span class="bill-date">' + new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toLocaleDateString() + '</span></div>' +
        '<div class="bill-card-items">' + (o.items || []).map(i => i.name + ' x' + i.qty + ' — ₹' + (i.price * i.qty)).join('<br>') + '</div>' +
        '<div class="bill-card-total"><strong>Total: ₹' + (o.total || 0) + '</strong></div></div>'
    ).join('');
}

// ============================================
// CANTEEN BILLS (FIX: was referenced but never defined)
// ============================================

function initCanteenBills() {
    const billsList = document.querySelector('.canteen-bills-list');
    if (!billsList) return;
    const completedOrders = allOrders.filter(o => o.status === 'picked');
    if (completedOrders.length === 0) {
        billsList.innerHTML = '<div class="empty-state"><p>No completed orders yet</p></div>';
        return;
    }
    billsList.innerHTML = completedOrders.map(o =>
        '<div class="bill-card">' +
        '<div class="bill-card-header"><span class="bill-id">' + (o.billNumber || '#' + o.id.slice(0, 8)) + '</span>' +
        '<span class="bill-student">' + (o.studentName || 'Unknown') + '</span>' +
        '<span class="bill-date">' + new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toLocaleDateString() + '</span></div>' +
        '<div class="bill-card-items">' + (o.items || []).map(i => i.name + ' x' + i.qty).join(', ') + '</div>' +
        '<div class="bill-card-total"><strong>Total: ₹' + (o.total || 0) + '</strong></div></div>'
    ).join('');
}

// ============================================
// CANTEEN ANALYTICS (FIX: was referenced but never defined)
// ============================================

function initCanteenAnalytics() {
    const revenueChart = document.getElementById('analyticsRevenueChart');
    const topItems = document.getElementById('analyticsTopItems');
    const freqGrid = document.getElementById('analyticsFrequencyGrid');
    const lowDemand = document.getElementById('analyticsLowDemand');
    if (!revenueChart && !topItems) return;
    renderAnalytics(revenueChart, topItems, freqGrid, lowDemand);
}

function renderAnalytics(revenueChart, topItemsEl, freqGrid, lowDemandEl) {
    // Revenue by day (last 7 days)
    if (revenueChart) {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
            const next = new Date(d); next.setDate(next.getDate() + 1);
            const rev = allOrders
                .filter(o => o.status === 'picked')
                .filter(o => { const t = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt); return t >= d && t < next; })
                .reduce((s, o) => s + (o.total || 0), 0);
            days.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), rev });
        }
        const max = Math.max(...days.map(d => d.rev), 1);
        revenueChart.innerHTML = '<div class="analytics-bar-chart">' +
            days.map(d =>
                '<div class="analytics-bar-col">' +
                '<div class="analytics-bar" style="height:' + Math.round((d.rev / max) * 120) + 'px" title="₹' + d.rev + '"></div>' +
                '<span class="analytics-bar-label">' + d.label + '</span>' +
                '<span class="analytics-bar-val">₹' + d.rev + '</span></div>'
            ).join('') + '</div>';
    }

    // Top items by order count
    if (topItemsEl) {
        const itemCounts = {};
        allOrders.forEach(o => (o.items || []).forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty; }));
        const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        topItemsEl.innerHTML = sorted.length === 0
            ? '<p>No data yet</p>'
            : sorted.map(([name, count], idx) => '<div class="analytics-top-item"><span class="analytics-top-rank">' + (idx + 1) + '</span><span class="analytics-top-name">' + name + '</span><span class="analytics-top-count">' + count + ' sold</span></div>').join('');
    }

    // Frequency grid (orders per hour)
    if (freqGrid) {
        const hours = Array(24).fill(0);
        allOrders.forEach(o => { const h = new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : o.createdAt).getHours(); hours[h]++; });
        const max = Math.max(...hours, 1);
        freqGrid.innerHTML = hours.map((count, h) =>
            '<div class="analytics-freq-cell" style="opacity:' + (0.1 + 0.9 * count / max).toFixed(2) + '" title="' + h + ':00 — ' + count + ' orders">' + h + '</div>'
        ).join('');
    }

    // Low demand items
    if (lowDemandEl) {
        const itemCounts = {};
        allOrders.forEach(o => (o.items || []).forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty; }));
        const low = menuItems.filter(m => (itemCounts[m.name] || 0) < 5);
        lowDemandEl.innerHTML = low.length === 0
            ? '<p>All items are performing well</p>'
            : low.map(m => '<div class="analytics-low-item"><span>' + m.name + '</span><span>' + (itemCounts[m.name] || 0) + ' sold</span></div>').join('');
    }
}

// ============================================
// CART PAGE
// ============================================

function initCartPage() {
    const cartItems = document.querySelector('.cart-items');
    const cartSummary = document.querySelector('.cart-summary');
    if (!cartItems) return;
    Cart.load();
    if (Cart.items.length === 0) {
        cartItems.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></div><h3 class="empty-title">Cart is empty</h3><a href="menu.html" class="btn btn-primary">Browse Menu</a></div>';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    cartItems.innerHTML = Cart.items.map(item =>
        '<div class="cart-item" data-id="' + item.id + '">' +
        '<div class="cart-item-image"><img src="' + item.image + '" alt="' + item.name + '"></div>' +
        '<div class="cart-item-details"><h4 class="cart-item-name">' + item.name + '</h4><span class="cart-item-price">₹' + item.price + '</span></div>' +
        '<div class="cart-item-qty"><button class="qty-btn qty-minus" data-id="' + item.id + '">−</button><span class="qty-value">' + item.qty + '</span><button class="qty-btn qty-plus" data-id="' + item.id + '">+</button></div>' +
        '<button class="cart-item-remove" data-id="' + item.id + '">&times;</button></div>'
    ).join('');
    cartItems.querySelectorAll('.qty-plus').forEach(btn => btn.addEventListener('click', function() { Cart.updateQty(this.dataset.id, (Cart.items.find(i => i.id === this.dataset.id)?.qty || 0) + 1); initCartPage(); }));
    cartItems.querySelectorAll('.qty-minus').forEach(btn => btn.addEventListener('click', function() { Cart.updateQty(this.dataset.id, (Cart.items.find(i => i.id === this.dataset.id)?.qty || 0) - 1); initCartPage(); }));
    cartItems.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', function() { Cart.remove(this.dataset.id); initCartPage(); }));
    const subtotal = Cart.total();
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;
    const subtotalEl = document.getElementById('cartSubtotal');
    const taxEl = document.getElementById('cartTax');
    const totalEl = document.getElementById('cartTotal');
    if (subtotalEl) subtotalEl.textContent = '₹' + subtotal;
    if (taxEl) taxEl.textContent = '₹' + tax;
    if (totalEl) totalEl.textContent = '₹' + total;
    document.getElementById('checkoutBtn')?.addEventListener('click', async function() {
        if (!currentUser) { alert('Please login first'); return; }
        if (Cart.items.length === 0) { alert('Cart is empty'); return; }
        const slotSelect = document.getElementById('slotSelect');
        const slot = slotSelect?.value || 'Lunch Break';
        const items = Cart.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image, lineTotal: i.price * i.qty }));
        const order = {
            studentName: currentUser.name, studentEmail: currentUser.email, studentId: currentUser.uid,
            registerNumber: currentUser.registerNumber || '', department: currentUser.department || '', year: currentUser.year || '', phone: currentUser.phone || '',
            items, slot, subtotal, tax, taxRate: 0.05, deliveryFee: 0, total: subtotal + tax,
            billNumber: 'BILL-' + Date.now(), canteen: 'Food Court', canteenId: 'canteen',
            status: 'pending', paymentMethod: 'cash', paymentStatus: 'pending',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        try {
            await addDoc(collection(db, 'orders'), order);
            await setDoc(doc(db, 'users', currentUser.uid), { totalOrders: (currentUser.totalOrders || 0) + 1, totalSpent: (currentUser.totalSpent || 0) + order.total, updatedAt: serverTimestamp() }, { merge: true });
            Cart.clear();
            window.location.href = 'orders.html';
        } catch(e) { alert('Checkout failed: ' + e.message); }
    });
}

// ============================================
// DASHBOARD PAGE
// ============================================

function initDashboardPage() {
    updateDashboardStats();
    const upcoming = allOrders.filter(o => o.studentId === currentUser?.uid && !['picked', 'cancelled'].includes(o.status));
    const recentContainer = document.querySelector('.recent-orders-list');
    if (recentContainer) {
        if (upcoming.length === 0) {
            recentContainer.innerHTML = '<div class="empty-state"><p>No recent orders</p></div>';
        } else {
            recentContainer.innerHTML = upcoming.slice(0, 5).map(o =>
                '<div class="order-card-mini"><span class="order-id">#' + (o.billNumber || o.id.slice(0, 8)) + '</span>' +
                '<span class="status-badge status-badge--' + (o.status === 'pending' ? 'yellow' : 'blue') + '">' + o.status + '</span></div>'
            ).join('');
        }
    }
}

// ============================================
// UTILITIES
// ============================================

function animateCounter(el) {
    const target = parseInt(el.textContent.replace(/[^\d]/g, '')) || 0;
    if (target === 0) return;
    let current = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => { current += step; if (current >= target) { current = target; clearInterval(timer); } el.textContent = el.textContent.includes('₹') ? '₹' + current : current; }, 30);
}
