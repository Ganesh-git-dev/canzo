/**
 * Canzo Firebase Setup - Automated
 * Run: npm run setup
 * 
 * This script will:
 * 1. Login to Firebase (opens browser)
 * 2. Initialize project
 * 3. Download service account key
 * 4. Seed the database
 * 5. Deploy Firestore rules
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'canzo-459ad';
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'service-account.json');

function run(cmd, options = {}) {
    console.log(`$ ${cmd}`);
    try {
        return execSync(cmd, { stdio: 'inherit', ...options });
    } catch (error) {
        if (options.ignoreError) return null;
        throw error;
    }
}

async function setup() {
    console.log('🚀 Canzo Firebase Setup\n');

    // Step 1: Login
    console.log('📱 Step 1: Login to Firebase');
    console.log('   A browser will open. Login with the account that owns canzo-459ad.\n');
    run('firebase login');
    console.log('');

    // Step 2: Initialize (use existing project)
    console.log('📁 Step 2: Initialize Firebase project');
    if (!fs.existsSync('firebase.json')) {
        run('firebase init firestore --project canzo-459ad');
    }
    console.log('');

    // Step 3: Generate service account
    console.log('🔑 Step 3: Generate service account key');
    console.log('   This downloads the service account JSON from Firebase...\n');
    try {
        // Use Firebase CLI to export service account
        run(`firebase projects service-accounts export --project ${PROJECT_ID} ${SERVICE_ACCOUNT_FILE}`);
        console.log('   ✅ Service account downloaded');
    } catch (error) {
        console.log('   ⚠️  Could not auto-export service account.');
        console.log('');
        console.log('   Manual step:');
        console.log('   1. Go to: https://console.firebase.google.com/project/canzo-459ad/settings/serviceaccounts/adminsdk');
        console.log('   2. Click "Generate new private key"');
        console.log('   3. Save as "service-account.json" in this folder');
        console.log('   4. Run: npm run seed');
        return;
    }
    console.log('');

    // Step 4: Seed database
    console.log('🌱 Step 4: Seed database');
    run('npm run seed');
    console.log('');

    // Step 5: Deploy Firestore rules
    console.log('🛡️  Step 5: Deploy Firestore security rules');
    run('firebase deploy --only firestore:rules --project canzo-459ad');
    console.log('');

    console.log('🎉 Setup complete!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Student: student@ecet.com / student123');
    console.log('   Admin:   admin@ecet.com / admin123');
    console.log('');
    console.log('Run `npm start` to launch the app.');
}

setup().catch(err => {
    console.error('Setup failed:', err.message);
    process.exit(1);
});
