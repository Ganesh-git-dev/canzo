/**
 * Canzo Database Seeder - REST API Version
 * Uses Firebase REST API (no service account needed)
 * Run: npm run seed
 */

const https = require('https');

const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBSNknLdlF1R9j9xplhD6IDBhoIHNwuFo4',
    projectId: 'canzo-459ad',
    authDomain: 'canzo-459ad.firebaseapp.com',
};

const BASE_URL = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

function request(url, data, method = 'POST') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = https.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function signUp(email, password) {
    const url = `${BASE_URL}/accounts:signUp?key=${FIREBASE_CONFIG.apiKey}`;
    return request(url, { email, password, returnSecureToken: true });
}

async function signIn(email, password) {
    const url = `${BASE_URL}/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`;
    return request(url, { email, password, returnSecureToken: true });
}

async function setDoc(collection, docId, data, idToken) {
    const url = `${FIRESTORE_URL}/${collection}/${docId}`;
    const firestoreData = convertToFirestore(data);
    return request(`${url}?key=${FIREBASE_CONFIG.apiKey}`, firestoreData, 'PATCH');
}

async function addDoc(collection, data, idToken) {
    const url = `${FIRESTORE_URL}/${collection}`;
    const firestoreData = convertToFirestore(data);
    return request(`${url}?key=${FIREBASE_CONFIG.apiKey}`, firestoreData, 'POST');
}

async function getDocs(collection, idToken) {
    const url = `${FIRESTORE_URL}/${collection}?key=${FIREBASE_CONFIG.apiKey}`;
    return request(url, {}, 'GET');
}

function convertToFirestore(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === null) {
            result[key] = { nullValue: null };
        } else if (typeof value === 'string') {
            result[key] = { stringValue: value };
        } else if (typeof value === 'number') {
            result[key] = { integerValue: value };
        } else if (typeof value === 'boolean') {
            result[key] = { booleanValue: value };
        } else if (Array.isArray(value)) {
            result[key] = { arrayValue: { values: value.map(convertToFirestoreValue) } };
        } else if (typeof value === 'object') {
            result[key] = { mapValue: { fields: convertToFirestore(value) } };
        }
    }
    return { fields: result };
}

function convertToFirestoreValue(value) {
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') return { integerValue: value };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(convertToFirestoreValue) } };
    if (typeof value === 'object' && value !== null) return { mapValue: { fields: convertToFirestore(value) } };
    return { nullValue: null };
}

const SEED_USERS = [
    { email: 'student@ecet.com', password: 'student123', userData: {
        email: 'student@ecet.com', name: 'Ganesh', role: 'student',
        phone: '+91 7010736721', department: 'cse', year: '3rd Year',
        registerNumber: 'E720524AM001', balance: 0, totalOrders: 0, totalSpent: 0,
        favoriteItems: [], dietaryPreferences: [],
    }},
    { email: 'admin@ecet.com', password: 'admin123', userData: {
        email: 'admin@ecet.com', name: 'Food Court Admin', role: 'canteen',
        phone: '+91 7010736720', managerName: 'Ganesh',
    }},
];

const SEED_MENU = [
    { name: 'Chicken Biryani', description: 'Aromatic basmati rice with tender chicken, saffron, and spices. Served with raita.', price: 145, category: 'biryani', image: 'assets/images/biryani.jpg', inStock: true, tags: ['non-veg', 'popular', 'spicy'], servings: 1 },
    { name: 'Veg Biryani', description: 'Fragrant rice with mixed vegetables, paneer, and aromatic spices.', price: 120, category: 'biryani', image: 'assets/images/biryani.jpg', inStock: true, tags: ['veg', 'popular'], servings: 1 },
    { name: 'Veg Burger', description: 'Crispy veg patty with fresh lettuce, tomato, and special sauce.', price: 80, category: 'short-bites', image: 'assets/images/burger.jpg', inStock: true, tags: ['veg', 'snack'], servings: 1 },
    { name: 'Chicken Burger', description: 'Grilled chicken patty with mayo, lettuce, and cheese.', price: 100, category: 'short-bites', image: 'assets/images/burger.jpg', inStock: true, tags: ['non-veg', 'snack'], servings: 1 },
    { name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled with peppers and onions. Served with mint chutney.', price: 120, category: 'short-bites', image: 'assets/images/paneer-tikka.jpg', inStock: true, tags: ['veg', 'popular'], servings: 1 },
    { name: 'Chicken 65', description: 'Spicy deep-fried chicken with curry leaves and red chilies.', price: 130, category: 'short-bites', image: 'assets/images/paneer-tikka.jpg', inStock: true, tags: ['non-veg', 'spicy'], servings: 1 },
    { name: 'Fresh Garden Salad', description: 'Mixed greens, cherry tomatoes, cucumber with vinaigrette dressing.', price: 65, category: 'short-bites', image: 'assets/images/salad.jpg', inStock: true, tags: ['veg', 'healthy'], servings: 1 },
    { name: 'Chocolate Pastry', description: 'Rich chocolate cream layered pastry with cocoa dust.', price: 55, category: 'pastry', image: 'assets/images/pastry.jpg', inStock: true, tags: ['veg', 'dessert', 'sweet'], servings: 1 },
    { name: 'Mango Smoothie', description: 'Fresh mango blended with yogurt and honey. Chilled and refreshing.', price: 75, category: 'juices', image: 'assets/images/smoothie.jpg', inStock: true, tags: ['veg', 'drink', 'cold'], servings: 1 },
    { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling, sambar and chutneys.', price: 70, category: 'maggie', image: 'assets/images/dosa.jpg', inStock: true, tags: ['veg', 'popular', 'south-indian'], servings: 1 },
    { name: 'Veg Fried Rice', description: 'Wok-tossed rice with mixed vegetables and soy sauce.', price: 95, category: 'fried-rice', image: 'assets/images/fried-rice.jpg', inStock: true, tags: ['veg', 'chinese'], servings: 1 },
    { name: 'Chicken Fried Rice', description: 'Wok-tossed rice with chicken, eggs, and vegetables.', price: 120, category: 'fried-rice', image: 'assets/images/fried-rice.jpg', inStock: true, tags: ['non-veg', 'chinese'], servings: 1 },
    { name: 'Egg Fried Rice', description: 'Wok-tossed rice with scrambled eggs and vegetables.', price: 100, category: 'fried-rice', image: 'assets/images/fried-rice.jpg', inStock: true, tags: ['egg', 'chinese'], servings: 1 },
    { name: 'Maggie Noodles', description: 'Classic instant noodles with vegetables and spices.', price: 50, category: 'maggie', image: 'assets/images/dosa.jpg', inStock: true, tags: ['veg', 'snack', 'quick'], servings: 1 },
    { name: 'Cheese Maggie', description: 'Maggie loaded with melted cheese and herbs.', price: 70, category: 'maggie', image: 'assets/images/dosa.jpg', inStock: true, tags: ['veg', 'snack', 'popular'], servings: 1 },
    { name: 'Masala Tea', description: 'Hot Indian chai with ginger, cardamom, and spices.', price: 20, category: 'juices', image: 'assets/images/smoothie.jpg', inStock: true, tags: ['veg', 'drink', 'hot'], servings: 1 },
    { name: 'Fresh Lime Soda', description: 'Freshly squeezed lime with soda, salt or sweet.', price: 40, category: 'juices', image: 'assets/images/smoothie.jpg', inStock: true, tags: ['veg', 'drink', 'cold'], servings: 1 },
    { name: 'Butter Naan', description: 'Soft leavened bread brushed with butter.', price: 35, category: 'short-bites', image: 'assets/images/biryani.jpg', inStock: true, tags: ['veg', 'bread'], servings: 2 },
];

const SEED_SETTINGS = {
    name: 'Food Court', location: 'Near Mess, EASA College',
    phone: '+91 7010736720', manager: 'Ganesh',
    hours: { morning: '10:40 AM - 11:00 AM', lunch: '12:30 PM - 1:10 PM', evening: '2:50 PM - 3:05 PM' },
    isOpen: true, autoReject: false, autoRejectTime: 10, maxOrders: 30,
    taxRate: 0.05, deliveryFee: 0, currency: 'INR', acceptOrders: true,
    lastUpdated: new Date().toISOString(),
};

async function seedDatabase() {
    console.log('🌱 Starting Canzo database seed...\n');

    // 1. Create users and store in Firestore
    console.log('📝 Creating Users...');
    const userIds = {};

    for (const user of SEED_USERS) {
        try {
            // Try to sign up
            const result = await signUp(user.email, user.password);
            if (result.idToken) {
                await setDoc('users', result.localId, user.userData, result.idToken);
                userIds[user.email] = result.localId;
                console.log(`   ✅ ${user.email} (${user.userData.role})`);
            }
        } catch (error) {
            // User might already exist, try to sign in to get the ID
            try {
                const result = await signIn(user.email, user.password);
                if (result.idToken) {
                    // Get the user's current ID
                    const usersData = await getDocs('users', result.idToken);
                    // Find the user doc by email
                    if (usersData.documents) {
                        for (const doc of usersData.documents) {
                            if (doc.fields.email?.stringValue === user.email) {
                                const userId = doc.name.split('/').pop();
                                userIds[user.email] = userId;
                                // Update user data
                                await setDoc('users', userId, user.userData, result.idToken);
                                console.log(`   🔄 ${user.email} updated (${user.userData.role})`);
                                break;
                            }
                        }
                    }
                }
            } catch (signInError) {
                console.log(`   ⏭️ ${user.email} already exists (cannot update without ID)`);
            }
        }
    }

    // 2. Seed Menu Items
    console.log('\n🍔 Seeding Menu Items...');
    try {
        const menuData = await getDocs('menuItems', '');
        if (menuData.documents && menuData.documents.length > 0) {
            console.log(`   ⏭️ Menu already has ${menuData.documents.length} items`);
        } else {
            // Sign in to get auth token for Firestore writes
            const authResult = await signIn('student@ecet.com', 'student123');
            const idToken = authResult.idToken;

            for (const item of SEED_MENU) {
                await addDoc('menuItems', {
                    ...item, orderCount: 0, revenue: 0,
                    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                }, idToken);
            }
            console.log(`   ✅ Added ${SEED_MENU.length} menu items`);
        }
    } catch (error) {
        console.log('   ❌ Error seeding menu:', error.message);
    }

    // 3. Seed Settings
    console.log('\n⚙️ Updating Settings...');
    try {
        const authResult = await signIn('student@ecet.com', 'student123');
        await setDoc('settings', 'canteen', SEED_SETTINGS, authResult.idToken);
        console.log('   ✅ Settings updated');
    } catch (error) {
        console.log('   ❌ Error updating settings:', error.message);
    }

    console.log('\n🎉 Database seed complete!');
    console.log('\n📋 Login Credentials:');
    console.log('   Student: student@ecet.com / student123');
    console.log('   Admin:   admin@ecet.com / admin123');
}

seedDatabase().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
