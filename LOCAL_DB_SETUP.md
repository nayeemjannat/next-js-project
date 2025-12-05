# Local PostgreSQL Setup Guide

## Option 1: Install PostgreSQL on Windows (Recommended)

### Step 1: Download and Install PostgreSQL

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer" from EnterpriseDB
   - Download the latest version (e.g., PostgreSQL 16.x)

2. **Run the Installer:**
   - Run the downloaded `.exe` file
   - Click "Next" through the setup wizard
   - **Important:** Remember the password you set for the `postgres` superuser
   - Keep the default port: `5432`
   - Keep the default locale
   - Complete the installation

3. **Verify Installation:**
   - PostgreSQL should start automatically as a Windows service
   - You can check in Services (services.msc) - look for "postgresql-x64-16" or similar

### Step 2: Create Database

Open **pgAdmin** (installed with PostgreSQL) or use command line:

**Using pgAdmin:**
1. Open pgAdmin 4
2. Connect to server (use the password you set during installation)
3. Right-click "Databases" → "Create" → "Database"
4. Name: `homease`
5. Click "Save"

**Using Command Line (if psql is in PATH):**
```bash
psql -U postgres
# Enter your password when prompted
CREATE DATABASE homease;
\q
```

### Step 3: Update .env File

Update your `.env` file with:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/homease"
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

### Step 4: Run Migrations

```bash
npx prisma migrate dev --name init
```

Or push schema directly:
```bash
npx prisma db push
```

---

## Option 2: Use Docker (If you install Docker later)

If you install Docker Desktop, you can use the `docker-compose.yml` file I'll create.

---

## Option 3: Use SQLite for Development (Simplest)

If you want to skip PostgreSQL installation, I can configure SQLite instead (file-based, no server needed).

