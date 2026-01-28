# Vercel Environment Variables Setup

This guide shows you exactly how to add the `CRON_SECRET` to your Vercel project.

## Step-by-Step Instructions

### 1. Generate Your CRON_SECRET (Already Done)
Your `.env.local` file now contains:
```bash
CRON_SECRET=E33qzE76SL3q7zxrUQ6qfzAgdATgFN-zAdIxV95XBIY
```

### 2. Add to Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Click on your job application tracker project

3. **Navigate to Settings**
   - Click on the "Settings" tab at the top

4. **Go to Environment Variables**
   - In the left sidebar, click "Environment Variables"

5. **Add New Variable**
   - Click the "Add New" button
   - Fill in the form:
     ```
     Name: CRON_SECRET
     Value: E33qzE76SL3q7zxrUQ6qfzAgdATgFN-zAdIxV95XBIY
     Environment: ✅ Production ✅ Preview ✅ Development
     ```
   - Click "Save"

### 3. Verify Other Required Variables

Make sure these environment variables are also set in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nywzggxnxiticseqreer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_CLIENT_ID=776178373524-k2o1qb6civ87t6e0t7ldvc0ajtq45gn0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GITHUB_CLIENT_ID=Ov23liroPyT4N6Y4WxDD
GITHUB_CLIENT_SECRET=ec91369d05355be34081462348d39fc1b7c684ec
```

### 4. Deploy Your Project

After adding the environment variables:

1. **Commit and Push** your code (including the new cron job files)
   ```bash
   git add .
   git commit -m "Add Vercel cron job for Supabase keep-alive"
   git push
   ```

2. **Vercel will automatically deploy** and configure the cron job

3. **Verify the cron job** in Vercel dashboard:
   - Go to Functions → Crons
   - You should see your keep-alive cron job listed

## Troubleshooting

### If the cron job doesn't appear:
1. Make sure `vercel.json` is in your project root
2. Redeploy your project
3. Check the build logs for errors

### If you get 401 Unauthorized:
1. Double-check the `CRON_SECRET` value in Vercel matches your `.env.local`
2. Make sure there are no extra spaces or characters
3. Regenerate the secret if needed: `npm run generate:cron-secret`

### If you need to change the secret:
1. Run `npm run generate:cron-secret` to get a new one
2. Update your `.env.local` file
3. Update the Vercel environment variable
4. Redeploy your project

## Security Notes

- ✅ The `CRON_SECRET` is now properly secured
- ✅ Only Vercel's cron service can call your endpoint
- ✅ The secret is different from any default values
- ⚠️ Never commit the actual secret to version control
- ⚠️ Use different secrets for different environments if needed