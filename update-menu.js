/**
 * Canzo Menu & Rules Updater
 * Run: npm run update-menu
 * Deletes old menu items and seeds all 18 new ones + deploys rules
 */

const https = require('https');

const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBSNknLdlF1R9j9xplhD6IDBhoIHNwuFo4',
    projectId: 'canzo-459ad',
};

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

function request(url, data, method = 'GET') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = { hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method };
        if (data && method !== 'GET') {
            options.headers = { 'Content-Type': 'application/json' };
        }
        const req = https.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(body); } });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function signIn(email, password) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`;
    return request(url, { email, password, returnSecureToken: true }, 'POST');
}

async function getDocs(collection) {
    return request(`${FIRESTORE_URL}/${collection}?key=${FIREBASE_CONFIG.apiKey}`);
}

async function deleteDoc(collection, docId, idToken) {
    const url = `${FIRESTORE_URL}/${collection}/${docId}?key=${FIREBASE_CONFIG.apiKey}`;
    return request(url, {}, 'DELETE');
}

async function addDoc(collection, data) {
    const firestoreData = { fields: {} };
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') firestoreData.fields[key] = { stringValue: value };
        else if (typeof value === 'number') firestoreData.fields[key] = { integerValue: value };
        else if (typeof value === 'boolean') firestoreData.fields[key] = { booleanValue: value };
        else if (Array.isArray(value)) firestoreData.fields[key] = { arrayValue: { values: value.map(v => {
            if (typeof v === 'string') return { stringValue: v };
            return { stringValue: String(v) };
        })} };
        else if (typeof value === 'object' && value !== null) firestoreData.fields[key] = { mapValue: { fields: {} } };
    }
    return request(`${FIRESTORE_URL}/${collection}?key=${FIREBASE_CONFIG.apiKey}`, firestoreData, 'POST');
}

const NEW_MENU = [
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

async function updateMenuAndRules() {
    console.log('🔄 Updating menu and deploying rules...\n');

    // 1. Delete old menu items
    console.log('🗑️  Deleting old menu items...');
    const menuData = await getDocs('menuItems');
    if (menuData.documents) {
        const authResult = await signIn('student@ecet.com', 'student123');
        for (const doc of menuData.documents) {
            const docId = doc.name.split('/').pop();
            try {
                await deleteDoc('menuItems', docId, authResult.idToken);
                console.log(`   Deleted: ${doc.fields.name?.stringValue || docId}`);
            } catch (e) {
                console.log(`   Skipped: ${docId}`);
            }
        }
        console.log(`   ✅ Deleted ${menuData.documents.length} old items\n`);
    }

    // 2. Add new menu items
    console.log('🍔 Adding 18 new menu items...');
    for (const item of NEW_MENU) {
        await addDoc('menuItems', {
            ...item, orderCount: 0, revenue: 0,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
        console.log(`   ✅ ${item.name} (₹${item.price})`);
    }

    console.log('\n🎉 Menu updated with 18 items!');
    console.log('\n📋 Next step: Deploy Firestore rules');
    console.log('   Run: firebase deploy --only firestore:rules --project canzo-459ad');
    console.log('   Or go to: https://console.firebase.google.com/project/canzo-459ad/firestore/rules');
    console.log('   and paste the contents of firestore.rules');
}

updateMenuAndRules().catch(err => {
    console.error('Update failed:', err.message);
    process.exit(1);
});
