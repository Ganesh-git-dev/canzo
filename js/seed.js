/* ============================================
   CANZO - Seed Script (run once)
   Creates pre-defined users, menu, and settings
   Load in browser console or add temporarily to index.html
   ============================================ */

import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
    collection,
    doc,
    setDoc,
    addDoc,
    serverTimestamp,
    getDocs
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const SEED_USERS = [
    {
        email: 'student@ecet.com',
        password: 'student123',
        name: 'Ganesh Kumar',
        role: 'student',
        phone: '+91 7010736721',
        department: 'cse',
        year: '3rd Year',
        section: 'A',
        registerNumber: 'E720524AM001',
        balance: 0,
        totalOrders: 0,
        totalSpent: 0,
        favoriteItems: [],
        dietaryPreferences: [],
    },
    {
        email: 'admin@ecet.com',
        password: 'admin123',
        name: 'Food Court Admin',
        role: 'canteen',
        phone: '+91 7010736720',
        managerName: 'Ganesh',
    },
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
    name: 'Food Court',
    location: 'Near Mess, EASA College',
    phone: '+91 7010736720',
    manager: 'Ganesh',
    hours: { morning: '10:40 AM - 11:00 AM', lunch: '12:30 PM - 1:10 PM', evening: '2:50 PM - 3:05 PM' },
    isOpen: true,
    autoReject: false,
    autoRejectTime: 10,
    maxOrders: 30,
    taxRate: 0.05,
    deliveryFee: 0,
    currency: 'INR',
    acceptOrders: true,
    lastUpdated: new Date().toISOString(),
};

export async function seedDatabase() {
    console.log('🌱 Starting Canzo database seed...');

    // Seed users
    for (const userData of SEED_USERS) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const { password, ...rest } = userData;
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                ...rest,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`⏭️ User ${userData.email} already exists, skipping...`);
                const snapshot = await getDocs(collection(db, 'users'));
                const existingUser = snapshot.docs.find(d => d.data().email === userData.email);
                if (existingUser) {
                    await setDoc(doc(db, 'users', existingUser.id), {
                        ...SEED_USERS.find(u => u.email === userData.email),
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    }, { merge: true });
                    console.log(`✅ Updated user data: ${userData.email}`);
                }
            } else {
                console.error(`❌ Error creating ${userData.email}:`, error.message);
            }
        }
    }

    // Seed menu items
    const menuSnapshot = await getDocs(collection(db, 'menuItems'));
    if (menuSnapshot.empty) {
        for (const item of SEED_MENU) {
            await addDoc(collection(db, 'menuItems'), {
                ...item,
                orderCount: 0,
                revenue: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            console.log(`✅ Added menu item: ${item.name}`);
        }
    } else {
        console.log('⏭️ Menu already has items, skipping...');
    }

    // Seed settings
    await setDoc(doc(db, 'settings', 'canteen'), {
        ...SEED_SETTINGS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log('✅ Settings updated');

    console.log('🎉 Database seed complete!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Student: student@ecet.com / student123');
    console.log('   Admin:   admin@ecet.com / admin123');
    console.log('');
    console.log('📊 Data created:');
    console.log(`   - ${SEED_USERS.length} users`);
    console.log(`   - ${SEED_MENU.length} menu items`);
    console.log('   - Canteen settings');
}

window.seedDatabase = seedDatabase;
