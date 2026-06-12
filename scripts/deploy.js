/**
 * Deployment script for EduSupport
 *
 * Prerequisites:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Set up Firebase project: firebase use --add
 * 4. Configure environment variables:
 *    - firebase functions:config:set stripe.secret_key="sk_live_..."
 *    - firebase functions:config:set zoom.account_id="..." zoom.client_id="..." zoom.client_secret="..."
 *    - firebase functions:config:set resend.api_key="re_..."
 * 5. Set .env.local with your Firebase config values
 *
 * Steps:
 * 1. Build Next.js: npm run build
 * 2. Build functions: cd functions && npm run build
 * 3. Deploy: firebase deploy
 *
 * Or run this script: node scripts/deploy.js
 */

const { execSync } = require('child_process')

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

console.log('=== EduSupport Deployment ===\n')

console.log('1. Building Next.js app...')
run('npm run build')

console.log('\n2. Building Cloud Functions...')
run('cd functions && npm install && npm run build')

console.log('\n3. Deploying to Firebase...')
run('firebase deploy')

console.log('\n=== Deployment complete! ===')
