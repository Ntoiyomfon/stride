# Vercel Cron Job Setup for Supabase Keep-Alive

This document explains how to set up and deploy the Vercel cron job that keeps your Supabase database active on the free tier.

## Overview

The cron job pings your Supabase database every 96 hours (4 days) to prevent it from pausing due to inactivity. This is essential for free tier Supabase projects.

## Files Created

1. **`app/api/cron/keep-alive/route.ts`** - The API endpoint that performs database operations
2. **`vercel.json`** - Vercel configuration file that defines the cron schedule
3. **`scripts/test-keep-alive.ts`** - Test script to verify the cron job works locally

## Configuration

### 1. Environment Variables

You need to generate a secure `CRON_SECRET` for your cron job. Run this command to generate one:

```bash
npm run generate:cron-secret
```

This will generate several secure random secrets. Copy one of them and add it to your `.env.local` file:

```bash
CRON_SECRET=E33qzE76SL3q7zxrUQ6qfzAgdATgFN-zAdIxV95XBIY
```

**Important**: 
- This is a security token that prevents unauthorized access to your cron endpoint
- Keep it secure and never commit it to version control
- Use a different secret for production than development

### 2. Vercel Environment Variables

When deploying to Vercel, you need to add the same environment variables to your Vercel project:

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add the following variables:
   - `CRON_SECRET` - Same value as in your `.env.local` (the one you generated)
   - All your existing Supabase environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

**Screenshot Guide:**
```
Vercel Dashboard → Your Project → Settings → Environment Variables → Add New

Name: CRON_SECRET
Value: E33qzE76SL3q7zxrUQ6qfzAgdATgFN-zAdIxV95XBIY
Environment: Production, Preview, Development
```

### 3. Cron Schedule

The cron job is configured to run every 96 hours (4 days):
- Schedule: `0 0 */4 * *` (at midnight UTC every 4th day)
- This means it runs every 4 days at 00:00 UTC

## What the Cron Job Does

The keep-alive endpoint performs several lightweight database operations:

1. **Count user profiles** - Simple query to keep connection active
2. **Count boards** - Another lightweight query
3. **Clean up expired sessions** - Removes old session records (bonus cleanup)

## Testing

### Local Testing

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```

2. Run the test script:
   ```bash
   npm run test:keep-alive
   ```

### Manual Testing

You can also test manually with curl:

```bash
curl -X GET http://localhost:3000/api/cron/keep-alive \
  -H "Authorization: Bearer your-super-secret-cron-key-here-change-this-in-production"
```

## Deployment

1. **Commit all files** to your repository:
   ```bash
   git add .
   git commit -m "Add Vercel cron job for Supabase keep-alive"
   git push
   ```

2. **Deploy to Vercel** - The cron job will be automatically configured when you deploy

3. **Verify deployment** - Check your Vercel dashboard under Functions → Crons

## Monitoring

### Vercel Dashboard

- Go to your Vercel project dashboard
- Navigate to Functions → Crons
- You'll see the keep-alive cron job and its execution history

### Logs

- Check Vercel function logs to see cron job execution
- Look for success/failure messages in the logs

### Expected Response

Successful execution returns:
```json
{
  "success": true,
  "message": "Database keep-alive ping successful",
  "timestamp": "2025-01-28T10:00:00.000Z",
  "duration": "150ms",
  "operations": {
    "profiles": "success",
    "boards": "success", 
    "sessionCleanup": "success"
  }
}
```

## Security

- The cron job requires a secret token to prevent unauthorized access
- Only Vercel's cron service should be able to call this endpoint
- The secret is verified on every request

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check that `CRON_SECRET` is set correctly in Vercel environment variables
   - Ensure the secret matches between local and production

2. **500 Internal Server Error**
   - Check Supabase connection and credentials
   - Verify database tables exist
   - Check Vercel function logs for detailed error messages

3. **Cron not running**
   - Verify `vercel.json` is in the root directory
   - Check Vercel dashboard for cron configuration
   - Ensure you've deployed after adding the cron configuration

### Debug Steps

1. Test locally first with `npm run test:keep-alive`
2. Check Vercel function logs
3. Verify environment variables in Vercel dashboard
4. Test the endpoint manually with curl

## Cost Considerations

- Vercel cron jobs are included in the free tier (with limits)
- The database operations are very lightweight
- This prevents Supabase from pausing, which is more important than the minimal resource usage

## Alternative Schedules

You can modify the schedule in `vercel.json`:

- Every 2 days: `"0 0 */2 * *"`
- Every 3 days: `"0 0 */3 * *"`
- Every 4 days (current): `"0 0 */4 * *"`
- Every 5 days: `"0 0 */5 * *"`
- Every week: `"0 0 */7 * *"`
- Every 6 hours: `"0 */6 * * *"`
- Daily at midnight: `"0 0 * * *"`

Choose based on your needs and Vercel's cron limits.