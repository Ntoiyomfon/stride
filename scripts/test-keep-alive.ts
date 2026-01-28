#!/usr/bin/env tsx

/**
 * Test script for the keep-alive cron job
 * Run with: npx tsx scripts/test-keep-alive.ts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testKeepAlive() {
    try {
        console.log('🧪 Testing keep-alive cron job...');
        
        const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
        const cronSecret = process.env.CRON_SECRET;
        
        if (!cronSecret) {
            throw new Error('CRON_SECRET environment variable is not set');
        }
        
        const response = await fetch(`${baseUrl}/api/cron/keep-alive`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cronSecret}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Keep-alive test successful!');
            console.log('📊 Result:', JSON.stringify(result, null, 2));
        } else {
            console.error('❌ Keep-alive test failed!');
            console.error('📊 Error:', JSON.stringify(result, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Test unauthorized access
async function testUnauthorized() {
    try {
        console.log('🔒 Testing unauthorized access...');
        
        const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
        
        const response = await fetch(`${baseUrl}/api/cron/keep-alive`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer wrong-secret',
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.status === 401) {
            console.log('✅ Unauthorized test successful - properly rejected!');
        } else {
            console.error('❌ Unauthorized test failed - should have been rejected!');
            console.error('📊 Result:', JSON.stringify(result, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Unauthorized test error:', error);
    }
}

async function main() {
    console.log('🚀 Starting keep-alive cron job tests...\n');
    
    await testKeepAlive();
    console.log('');
    await testUnauthorized();
    
    console.log('\n✨ Tests completed!');
}

main().catch(console.error);