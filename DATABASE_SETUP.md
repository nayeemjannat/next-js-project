# Database Setup Instructions

## Prerequisites

1. **PostgreSQL Database**: Make sure you have PostgreSQL installed and running on your system.
   - Download from: https://www.postgresql.org/download/
   - Or use a cloud service like Supabase, Neon, or Railway

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens (for future use)

### 2. Configure Database Connection

Create a `.env` file in the root directory with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

**Examples:**
- Local PostgreSQL: `postgresql://postgres:password@localhost:5432/homease`
- Supabase: `postgresql://user:password@db.xxxxx.supabase.co:5432/postgres`
- Neon: `postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb`

### 3. Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma Client based on your schema.

### 4. Run Database Migrations

```bash
npm run db:migrate
```

This will:
- Create the `users` table in your database
- Set up all the necessary columns and constraints

### 5. (Optional) Seed Demo Users

If you want to create the demo users from before, you can run this in Prisma Studio:

```bash
npm run db:studio
```

Or create them manually through the registration page.

## Database Schema

The `User` model includes:
- `id` - Unique identifier (CUID)
- `email` - Unique email address
- `name` - User's full name
- `password` - Hashed password (bcrypt)
- `userType` - "customer" | "provider" | "admin"
- `avatar` - Optional avatar URL
- `phone` - Optional phone number
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## API Endpoints

- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/me` - Get current user (placeholder for future JWT implementation)

## Security Features

- Passwords are hashed using bcrypt (10 salt rounds)
- Passwords are never returned in API responses
- Email validation and uniqueness enforced
- Input validation on both client and server side

## Troubleshooting

### Database Connection Error
- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings if using a remote database

### Migration Errors
- Make sure the database exists
- Check user permissions
- Verify connection string format

### Prisma Client Not Found
- Run `npm run db:generate` after schema changes
- Restart your development server

