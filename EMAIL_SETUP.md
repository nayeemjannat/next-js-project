Email / Password Reset Setup

Follow these steps to enable the password reset and email verification flows added to the project.

1) Install dependencies

```powershell
pnpm add nodemailer
```

2) Add required environment variables (for local .env)

```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP settings
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASS=password
FROM_EMAIL="Your App <no-reply@example.com>"
```

3) Run Prisma migration (this will add the `password_resets` and `email_verifications` tables and `emailVerified` on `users`)

```powershell
npx prisma migrate dev --name add-password-reset-and-email-verification
npx prisma generate
```

4) How the flows work (overview)
- Forgot password page: `app/auth/forgot-password/page.tsx` (already present) should POST to `/api/auth/forgot-password` with `{ email }`.
- The API creates a token, stores a hash in `password_resets`, and sends a link: `https://app/auth/reset-password/<token>`.
- Reset page: `app/auth/reset-password/[token]/page.tsx` accepts new password and POSTs `{ token, password }` to `/api/auth/reset-password`.
- Profile email verification: when a user changes their email, call `/api/auth/send-verification` with `{ userId, newEmail }`. The endpoint sends a link to `/auth/verify-email?token=...`.
- The verify page `app/auth/verify-email/page.tsx` calls `/api/auth/verify-email` with the token and updates the user's `email` and `emailVerified`.

5) Tests and safety
- The APIs always respond with a generic success message for privacy.
- Tokens are hashed with SHA256 in the DB and expire after 24 hours.

If you want, I can:
- Wire the frontend profile edit form to call `/api/auth/send-verification` when email changes (both customer and provider flows).
- Add server-side validation, rate-limiting, or transactional email provider integration (SendGrid, SES) instead of SMTP.
