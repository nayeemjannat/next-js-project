# Quick Start Guide - Database Setup

## Option 1: Use Supabase (Recommended - 2 minutes)

1. **Sign up for free at**: https://supabase.com
2. **Create a new project**:
   - Click "New Project"
   - Choose a name (e.g., "homease")
   - Set a database password (save this!)
   - Select a region close to you
   - Click "Create new project"

3. **Get your connection string**:
   - Go to Project Settings → Database
   - Find "Connection string" section
   - Copy the "URI" connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

4. **Create `.env` file** in your project root:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   ```
   Replace `[YOUR-PASSWORD]` with the password you set when creating the project.

5. **Run these commands**:
   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   npm run dev
   ```

## Option 2: Use Neon (Alternative - 2 minutes)

1. **Sign up for free at**: https://neon.tech
2. **Create a new project**
3. **Copy the connection string** from the dashboard
4. **Create `.env` file** with the connection string
5. **Run the same commands as above**

## Option 3: Install PostgreSQL Locally (10-15 minutes)

1. **Download PostgreSQL**: https://www.postgresql.org/download/windows/
2. **Install** with default settings
3. **Remember the password** you set for the `postgres` user
4. **Create a database**:
   ```sql
   CREATE DATABASE homease;
   ```
5. **Create `.env` file**:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/homease"
   ```

---

**I recommend Option 1 (Supabase)** - it's the fastest and easiest!

