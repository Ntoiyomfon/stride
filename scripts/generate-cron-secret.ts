#!/usr/bin/env tsx

/**
 * Generate a secure CRON_SECRET for the keep-alive cron job
 * Run with: npx tsx scripts/generate-cron-secret.ts
 */

import crypto from 'crypto';

function generateCronSecret() {
    // Generate a 32-byte random string and convert to base64
    const secret = crypto.randomBytes(32).toString('base64url');
    
    console.log('🔐 Generated CRON_SECRET:');
    console.log('');
    console.log(`CRON_SECRET=${secret}`);
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Copy the secret above');
    console.log('2. Update your .env.local file');
    console.log('3. Add the same secret to your Vercel project environment variables');
    console.log('');
    console.log('🔗 Vercel Environment Variables:');
    console.log('   Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables');
    console.log('');
    console.log('⚠️  Keep this secret secure and never commit it to version control!');
    
    return secret;
}

// Generate multiple options
console.log('🚀 CRON_SECRET Generator\n');

console.log('Option 1 (Recommended):');
generateCronSecret();

console.log('\n' + '='.repeat(60) + '\n');

console.log('Option 2 (Alternative):');
generateCronSecret();

console.log('\n' + '='.repeat(60) + '\n');

console.log('Option 3 (Alternative):');
generateCronSecret();