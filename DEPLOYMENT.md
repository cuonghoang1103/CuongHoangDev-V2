# Deployment Guide

## Quick Deploy (Recommended)

### Frontend: Vercel (Free)
```bash
cd frontend
npx vercel --prod
```
Or connect GitHub repo to Vercel for auto-deploy.

**Vercel Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Backend: Railway (Free tier ~$5/month)
1. Go to railway.app → New Project → Deploy from GitHub
2. Connect your repo
3. Add environment variables:
```
DATABASE_URL=postgresql://user:pass@your-db-host:5432/cuonghoangdev_db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GEMINI_API_KEY=your-gemini-api-key
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
CORS_ORIGINS=https://your-frontend.vercel.app
```
4. Railway will auto-detect Spring Boot (Maven)

**Health check:** `https://your-backend.railway.app/api/v1/system/health`

### Database: Supabase (Free PostgreSQL)
1. Create project at supabase.com
2. Get connection string: `postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres`
3. Run migrations: `flyway migrate` or import `db/migration/` SQL files

### Alternative: Neon (Free PostgreSQL)
1. Create at neon.tech
2. Connection string format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb`

## Alternative: Render + Fly.io

### Backend: Render (Free tier)
```bash
# Create Web Service
# Build Command: ./mvnw clean package -DskipTests
# Start Command: java -jar target/api-backend-1.0.0.jar
```

### Frontend: Vercel (Free)

## Required Environment Variables

### Backend (application.yml override)
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  data:
    redis:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
      password: ${REDIS_PASSWORD}

jwt:
  secret: ${JWT_SECRET}

cors:
  allowed-origins: ${CORS_ORIGINS}

ai:
  gemini:
    api-key: ${GEMINI_API_KEY}
```

### Frontend (.env.production)
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXT_PUBLIC_APP_URL=https://your-site.vercel.app
```

## Docker Deploy

```bash
# Backend
docker build -t api-backend .
docker run -d -p 8080:8080 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="secret" \
  -e GEMINI_API_KEY="key" \
  api-backend

# Frontend
docker build -t frontend .
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="https://api.yoursite.com" \
  frontend
```

## Domain Setup

1. Buy domain (e.g., Namecheap, GoDaddy)
2. Point to Vercel: Add DNS CNAME `www` → `cname.vercel-dns.com`
3. Configure domain in Vercel project settings
4. Backend: Use Railway's custom domain or point subdomain to Railway

## Post-Deploy Checklist

- [ ] Update `NEXT_PUBLIC_API_URL` in Vercel
- [ ] Update `CORS_ORIGINS` in backend
- [ ] Test login/register
- [ ] Test AI chat
- [ ] Test course enrollment
- [ ] Enable SSL (automatic on Vercel/Railway)
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Disable debug mode in production
