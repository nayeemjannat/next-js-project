# How to Create an Admin User

You have **3 options** to create an admin user:

## Option 1: Use the API Endpoint (Easiest)

1. **Make a POST request** to `/api/admin/create-admin`:

   **Using curl:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/create-admin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@homease.com","password":"admin123","name":"Admin User"}'
   ```

   **Or use your browser's console** (F12 → Console):
   ```javascript
   fetch('/api/admin/create-admin', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'admin@homease.com',
       password: 'admin123',
       name: 'Admin User'
     })
   }).then(r => r.json()).then(console.log)
   ```

   **Default credentials:**
   - Email: `admin@homease.com`
   - Password: `admin123`

## Option 2: Use Prisma Studio (Visual)

1. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```

2. **Click on "User" model**
3. **Click "Add record"**
4. **Fill in the fields:**
   - `id`: Leave empty (auto-generated)
   - `email`: `admin@homease.com`
   - `name`: `Admin User`
   - `password`: You need to hash it first (see below)
   - `userType`: `admin`
   - `avatar`: `https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`
   - `phone`: (optional)
   - `createdAt`: Leave empty (auto-generated)
   - `updatedAt`: Leave empty (auto-generated)

   **To hash the password**, you can:
   - Use the API endpoint (Option 1) - it handles hashing automatically
   - Or use this in Node.js console:
     ```javascript
     const bcrypt = require('bcryptjs');
     bcrypt.hash('admin123', 10).then(console.log);
     ```

## Option 3: Use the Seed Script

1. **Install tsx** (if not already installed):
   ```bash
   npm install --save-dev tsx --legacy-peer-deps
   ```

2. **Run the seed script:**
   ```bash
   npm run db:seed
   ```

   Or directly:
   ```bash
   npx tsx prisma/seed.ts
   ```

---

## After Creating Admin

1. **Login** at `/auth/login` with your admin credentials
2. **Change the password** after first login (you'll need to implement a password change feature)
3. **Delete or protect** the `/api/admin/create-admin` endpoint in production

---

## Security Note

⚠️ **Important:** The `/api/admin/create-admin` endpoint should be:
- Removed in production, OR
- Protected with authentication/authorization, OR
- Only accessible from localhost

