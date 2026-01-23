# Google OAuth 2.0 Setup Guide

This guide will help you set up Google OAuth 2.0 authentication for your Next.js application.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: Your app name (e.g., "Homease")
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes:
     - `email`
     - `profile`
   - Add test users (if in testing mode)
   - Save and continue

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: Your app name (e.g., "Homease Web Client")
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
   - Click **Create**

7. Copy your **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist) and add the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# For production, update the redirect URI:
# GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# Application URL (used for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production:
# NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Session Security (required for secure sessions and CSRF protection)
SESSION_SECRET=your-random-secret-key-here-minimum-32-characters
CSRF_SECRET=your-random-csrf-secret-here-minimum-32-characters

# Database (already configured)
DATABASE_URL=your-database-url
```

### Generating Secure Secrets

For `SESSION_SECRET` and `CSRF_SECRET`, generate secure random strings:

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Important:** 
- Never commit `.env.local` to version control
- Use different secrets for development and production
- Keep your secrets secure and rotate them periodically

## Step 3: Verify Configuration

1. Restart your development server after adding environment variables:
   ```bash
   npm run dev
   ```

2. Navigate to `/auth/login` or `/auth/register`

3. Click "Sign in with Google" or "Sign up with Google"

4. You should be redirected to Google's OAuth consent screen

5. After authorization, you'll be redirected back to your app

## Step 4: Production Setup

For production deployment:

1. **Update Google OAuth Credentials:**
   - Add your production domain to Authorized JavaScript origins
   - Add your production callback URL to Authorized redirect URIs
   - Example: `https://yourdomain.com/api/auth/google/callback`

2. **Update Environment Variables:**
   - Set `NEXT_PUBLIC_APP_URL` to your production URL
   - Set `GOOGLE_REDIRECT_URI` to your production callback URL
   - Use strong, unique secrets for `SESSION_SECRET` and `CSRF_SECRET`

3. **OAuth Consent Screen:**
   - Submit your app for verification if you want to make it public
   - Or keep it in testing mode with specific test users

## Security Features Implemented

✅ **CSRF Protection:** OAuth state is signed with JWT and validated on callback
✅ **Secure Cookies:** HttpOnly, Secure (in production), SameSite=Lax
✅ **Session Management:** JWT-based sessions with expiration
✅ **State Validation:** Prevents CSRF attacks with time-limited state tokens
✅ **Error Handling:** Comprehensive error messages for OAuth failures

## Troubleshooting

### "Failed to initiate Google OAuth"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Verify the redirect URI matches exactly in Google Console

### "Invalid redirect URI"
- Ensure the redirect URI in `.env.local` matches exactly what's configured in Google Console
- Check for trailing slashes or protocol mismatches (http vs https)

### "Invalid state" error
- This usually means the OAuth state expired (10 minutes) or was tampered with
- Try signing in again

### OAuth works locally but not in production
- Verify production redirect URI is added to Google Console
- Check that `NEXT_PUBLIC_APP_URL` is set to your production domain
- Ensure `GOOGLE_REDIRECT_URI` matches your production callback URL

## Testing

1. Test sign up with Google (new user)
2. Test sign in with Google (existing user)
3. Test error handling (cancel OAuth flow)
4. Test logout functionality
5. Test session persistence across page refreshes

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)


