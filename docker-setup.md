# Docker PostgreSQL Setup (Alternative)

## Prerequisites
- Install Docker Desktop: https://www.docker.com/products/docker-desktop/

## Quick Start

1. **Start PostgreSQL container:**
   ```bash
   docker-compose up -d
   ```

2. **Update .env file:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/homease"
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Stop container (when done):**
   ```bash
   docker-compose down
   ```

## Default Credentials
- User: `postgres`
- Password: `postgres`
- Database: `homease`
- Port: `5432`

**Note:** Change the password in `docker-compose.yml` for production use!

