# OAuth Setup Guide

This guide will help you set up Google and GitHub OAuth authentication for your application.

## Prerequisites

- A Google Cloud Console account
- A GitHub account
- Your application running locally on `http://localhost:3000`

## Step 1: Google OAuth Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

### 1.2 Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: `Stride Job Tracker`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`
5. Save and continue

### 1.3 Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the name: `Stride Web Client`
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Save and copy the Client ID and Client Secret

## Step 2: GitHub OAuth Setup

### 2.1 Create GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: `Stride Job Tracker`
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Register the application
5. Copy the Client ID and generate a Client Secret

## Step 3: Environment Variables

Add the following to your `.env.local` file:

```env
# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## Step 4: Production Setup

For production deployment, make sure to:

1. **Update redirect URIs** in both Google and GitHub to use your production domain
2. **Use secure environment variables** in your hosting platform
3. **Enable HTTPS** for your production domain
4. **Update BETTER_AUTH_URL** environment variable to your production URL

### Production Redirect URIs

- Google: `https://yourdomain.com/api/auth/callback/google`
- GitHub: `https://yourdomain.com/api/auth/callback/github`

## Step 5: Testing

1. Start your development server: `npm run dev`
2. Navigate to the sign-in page
3. Try signing in with Google and GitHub
4. Check that accounts are properly linked in the Settings > Security tab

## Features Implemented

✅ **OAuth Sign-In/Sign-Up**: Users can sign in with Google or GitHub  
✅ **Account Linking**: OAuth accounts are automatically linked to existing email accounts  
✅ **Duplicate Prevention**: No duplicate users are created for the same email  
✅ **Connected Accounts Management**: Users can view and manage connected accounts  
✅ **Provider Disconnection**: Users can disconnect OAuth providers (with safeguards)  
✅ **Seamless UX**: Same flow for both sign-in and sign-up  
✅ **Security**: OAuth state validation and secure callback handling  

## Security Features

- **Email Uniqueness**: Enforced at the database level
- **Account Linking**: Automatic linking prevents duplicate accounts
- **Provider Validation**: OAuth state and callback origin validation
- **Secure Storage**: OAuth tokens are handled by BetterAuth securely
- **Session Management**: Integrated with existing session tracking

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**: Ensure the redirect URI in your OAuth app matches exactly
2. **"Invalid client"**: Check that your client ID and secret are correct
3. **"Access denied"**: User denied permission or OAuth app is not approved
4. **"Email not provided"**: Ensure email scope is requested and user grants permission

### Debug Steps

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test OAuth apps with correct redirect URIs
4. Check BetterAuth logs for detailed error messages

## Next Steps

After setting up OAuth:

1. Test the complete flow with different scenarios
2. Set up production OAuth apps with production URLs
3. Configure proper error handling for OAuth failures
4. Consider adding more OAuth providers if needed
5. Implement account recovery flows for users who lose access to OAuth providers