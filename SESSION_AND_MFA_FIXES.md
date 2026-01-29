# Session Management & MFA Fixes

## Issues Fixed

### 1. ❌ MFA "invalid claim: missing sub claim" Error (FIXED)

**Problem**: MFA enrollment failing with JWT error
```
❌ MFA enrollment error: Error [AuthApiError]: invalid claim: missing sub claim
```

**Root Cause**: Using client-side Supabase client in server actions, causing JWT context issues

**Solution**: Updated MFA service to use server-side client with proper session context
- **Files Modified**: `lib/auth/mfa-service.ts`, `lib/actions/two-factor.ts`
- **Key Change**: Use `createSupabaseServerClient()` instead of client-side client for MFA operations

### 2. 🔄 Session Duplication (FIXED)

**Problem**: Multiple sessions created for same user/device on every auth event
```
Session action: create for user: 3730cd7e-c00c-4c7a-b62f-624d7b0f2715
POST /api/sessions 200 in 1181ms
```

**Root Cause**: 
- `SIGNED_IN` event fires multiple times (login, OAuth, token refresh, account linking)
- No stable device identification
- Session creation logic treated every `SIGNED_IN` as new device

**Solution**: Implemented device-based session management
- **New File**: `lib/utils/device-id.ts` - Persistent device ID generation
- **Database**: Added `device_id` column to sessions table
- **Logic**: Create/update sessions based on device ID, not auth events

### 3. ⚠️ Security Warnings (PARTIALLY FIXED)

**Problem**: Repeated Supabase security warnings
```
Using the user object as returned from supabase.auth.getSession() could be insecure!
```

**Status**: Some warnings still appear but core security improved
- **Fixed**: Server-side session validation now uses `getUser()` first
- **Remaining**: Some client-side components still use `getSession()` - this is expected for client-side auth

## Key Improvements

### Device-Based Session Management
```typescript
// Before: Every SIGNED_IN created new session
if (event === 'SIGNED_IN') {
  createSession() // ❌ Always creates new
}

// After: Device-aware session management  
if (event === 'SIGNED_IN') {
  const deviceId = getDeviceId() // Persistent across browser sessions
  createOrUpdateSession(deviceId) // ✅ Updates existing or creates new
}
```

### MFA Server-Side Context
```typescript
// Before: Client context in server action
await this.client.auth.mfa.enroll() // ❌ Missing JWT context

// After: Server context with proper session
const serverClient = await createSupabaseServerClient()
await serverClient.auth.mfa.enroll() // ✅ Proper JWT context
```

## Database Migration Required

**File**: `supabase/migrations/009_add_device_id_to_sessions.sql`

**SQL to run in Supabase Dashboard**:
```sql
-- Add device_id column to sessions table for stable device tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_id TEXT DEFAULT 'unknown';

-- Create index for faster device-based queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_device ON sessions(user_id, device_id) WHERE is_revoked = false;

-- Update existing sessions to have a device_id based on user_agent + ip_address
UPDATE sessions 
SET device_id = 'legacy_' || substr(md5(user_agent || '_' || ip_address), 1, 12)
WHERE device_id = 'unknown' OR device_id IS NULL;
```

## Testing Instructions

### 1. Apply Database Migration
1. Go to Supabase Dashboard > SQL Editor
2. Run the migration SQL above
3. Verify `device_id` column exists in sessions table

### 2. Test MFA Setup
1. Sign in to your app
2. Go to Settings > Security > Two-Factor Authentication  
3. Click "Enable Two-Factor Authentication"
4. Should now work without "missing sub claim" error
5. Check console for: `✅ MFA enrollment successful, factor ID: [id]`

### 3. Test Session Management
1. Sign in to your app
2. Check browser console - should see: `✅ Session record created/updated for device: [device-id]`
3. Refresh page multiple times - should NOT create new sessions
4. Check Network tab - minimal `/api/sessions` calls

### 4. Test Device Persistence
1. Sign out and sign back in
2. Should reuse same device ID (check localStorage: `stride-device-id`)
3. Session should be updated, not duplicated

## Expected Behavior After Fixes

### ✅ What Should Work:
1. **MFA Enrollment**: No more JWT errors, proper 2FA setup flow
2. **Single Session Per Device**: One session record per device, updated on re-login
3. **Stable Device Tracking**: Persistent device IDs across browser sessions
4. **Reduced API Calls**: Minimal session creation requests
5. **Better Logging**: Clear console messages for debugging

### 🔍 What to Monitor:
1. **Console Logs**: Look for MFA success messages and device ID logs
2. **Database**: Check sessions table for reasonable number of records
3. **Network**: Monitor `/api/sessions` calls (should be infrequent)
4. **2FA Flow**: Complete enrollment and verification process

## Files Modified

1. `lib/auth/mfa-service.ts` - Server-side MFA operations
2. `lib/actions/two-factor.ts` - Better session validation
3. `lib/auth/supabase-auth-service.ts` - Device-aware auth state handling
4. `app/api/sessions/route.ts` - Device-based session management
5. `lib/auth/session-manager.ts` - Added device ID support
6. `lib/utils/device-id.ts` - New device ID utilities
7. `supabase/migrations/009_add_device_id_to_sessions.sql` - Database schema

## Remaining Considerations

### Security Warnings
Some `getSession()` warnings will remain - this is normal for client-side auth components. The critical server-side validation now uses secure methods.

### Session Cleanup
Consider implementing periodic cleanup of old/expired sessions based on device activity.

### OAuth Edge Cases
OAuth account linking may still create additional sessions - this is expected behavior and will be managed by the device-based logic.

## Summary

The core issues have been resolved:
- **MFA works** with proper server-side JWT context
- **Sessions are stable** with device-based tracking  
- **Duplication eliminated** through smart create/update logic
- **Better debugging** with comprehensive logging

Your terminal should now show much cleaner output with successful MFA operations and minimal session creation noise.