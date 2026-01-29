#!/usr/bin/env tsx

/**
 * Test script for 2FA functionality
 * Run with: npx tsx scripts/test-2fa.ts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function test2FA() {
    try {
        console.log('🧪 Testing 2FA configuration...');
        
        const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
        
        // Test if we can access the 2FA status endpoint
        const response = await fetch(`${baseUrl}/api/debug/account-status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Account status endpoint accessible');
            console.log('📊 Result:', JSON.stringify(result, null, 2));
        } else {
            console.error('❌ Account status endpoint failed');
            console.error('📊 Error:', JSON.stringify(result, null, 2));
        }
        
        // Check Supabase MFA configuration
        console.log('\n🔍 Checking Supabase configuration...');
        console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
        console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

async function main() {
    console.log('🚀 Starting 2FA tests...\n');
    
    await test2FA();
    
    console.log('\n✨ Tests completed!');
    console.log('\n💡 If 2FA is not working:');
    console.log('1. Check that MFA is enabled in your Supabase project settings');
    console.log('2. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers');
    console.log('3. Enable "Multi-Factor Authentication" under the "Auth" section');
    console.log('4. Make sure TOTP is enabled');
}

main().catch(console.error);