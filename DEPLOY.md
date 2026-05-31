# Deployment Guide - Fullstack Project

This guide covers deploying the fullstack application to Railway (backend + database) and Vercel (frontend).

---

## Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐
│   Vercel (Frontend) │ ──────► │ Railway (Backend)   │
│   Next.js 14 App    │  HTTPS  │ Spring Boot API     │
│                     │         │ PostgreSQL + Flyway │
└─────────────────────┘         └─────────────────────┘
        Port 443                         Port 8082
```

---

## 1. Deploy Backend to Railway

### Step 1.1: Create Railway Account
1. Go to [railway.app](https://railway.app) and sign up/login
2. Verify your email if prompted

### Step 1.2: Create New Project
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select your repository: `your-username/api-backend`
3. Railway will detect it's a Java/Gradle project

### Step 1.3: Add PostgreSQL Database
1. In your Railway project, click **"Add a Database"**
2. Select **"PostgreSQL"**
3. Wait for the database to provision (2-3 minutes)
4. Click on the PostgreSQL database → **"Variables"** tab
5. Copy these values for later:
   - `POSTGRES_HOST`
   - `POSTGRES_PORT`
   - `POSTGRES_DB`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`

### Step 1.4: Configure Spring Boot Service

1. Go to your **api-backend** service settings

2. **Build Command:**
   ```bash
   ./mvnw package -DskipTests
   ```

3. **Start Command:**
   ```bash
   java -jar target/api-backend-0.0.1-SNAPSHOT.jar
   ```

4. **Health Check:** Railway needs a health endpoint. The app uses port `8082`. Configure:
   - **Port:** `8082`
   - **Healthcheck Path:** `/actuator/health` (if available) or rely on startup logs

### Step 1.5: Set Environment Variables

In your Railway service, add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:<port>/<dbname>` | From PostgreSQL database tab |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Or your custom username |
| `SPRING_DATASOURCE_PASSWORD` | `[your-db-password]` | From PostgreSQL database tab |
| `JWT_SECRET` | `[256-bit hex string]` | Generate below |

**Generate a secure JWT_SECRET:**
```bash
# Using OpenSSL (macOS/Linux)
openssl rand -hex 32
```

Example output: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

### Step 1.6: Deploy

1. Click **"Deploy"** or push a commit to trigger deployment
2. Watch the deployment logs for:
   - Maven build success
   - Flyway migrations executing
   - Application startup on port 8082

3. Once deployed, find your backend URL in:
   - **Networking** → **Public Networking** → Copy the URL
   - Example: `https://api-backend.up.railway.app`

---

## 2. Deploy Frontend to Vercel

### Step 2.1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Connect your GitHub account

### Step 2.2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find and select your `api-backend` repository
3. Configure the project settings:

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./frontend`

**Build Command:** (leave as default)
```bash
npm run build
```

**Install Command:** (leave as default)
```bash
npm install
```

### Step 2.3: Set Environment Variables

In Vercel's project settings, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api-backend.up.railway.app/api/v1` |

**Important:** The variable must be named `NEXT_PUBLIC_API_URL` and point to your Railway backend URL with `/api/v1` suffix.

### Step 2.4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-5 minutes)
3. Your frontend will be live at: `https://your-project.vercel.app`

---

## 3. Database Migrations

### Migration Files Location
All migrations are in `/src/main/resources/db/migration/`:

| Migration | Purpose |
|-----------|---------|
| `V1__*.sql` | Initial schema |
| `V2__*.sql` | User management |
| `V3__*.sql` | Courses module |
| ... | ... |
| `V12__*.sql` | pgvector for RAG |
| `V13__*.sql` | Update vector dim for Gemini |
| `V14__*.sql` | Update vector dim to 768 |
| `V15__*.sql` | Shop module |

### How Migrations Work
- **Automatic:** Flyway runs migrations automatically on application startup
- **No manual steps needed:** Railway will execute migrations when the Spring Boot app starts
- **Verified:** Check Railway logs for "Successfully applied X migrations"

### If Migrations Fail
1. Check Railway logs for the specific migration error
2. Common issues:
   - Missing database columns (recreate with fresh migration)
   - Data conflicts (backup data, clean DB, redeploy)
3. To reset: Drop and recreate the PostgreSQL database in Railway, then redeploy the backend

---

## 4. CORS Configuration

The backend CORS is configured in `SecurityConfig.java`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:3000",
        "https://your-frontend.vercel.app"  // Add your production URL
    ));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    // ...
}
```

**Before going live:**
1. Update the `SecurityConfig.java` with your Vercel frontend URL
2. Commit and push to trigger redeployment

---

## 5. Environment Variables Reference

### Backend (Railway)

```env
# Database Connection
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<dbname>
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<password>

# Authentication
JWT_SECRET=<256-bit-hex-string>

# Optional: Logging
# SPRING_PROFILES_ACTIVE=prod
# LOGGING_LEVEL_ROOT=INFO
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://api-backend.up.railway.app/api/v1
```

---

## 6. Production Checklist

Complete these steps after deployment:

### Pre-flight
- [ ] Backend deployed successfully to Railway
- [ ] PostgreSQL database provisioned
- [ ] All migrations applied (check logs)
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` configured correctly

### Security
- [ ] CORS updated with production frontend URL in `SecurityConfig.java`
- [ ] Strong `JWT_SECRET` generated and set
- [ ] Database credentials secured in Railway
- [ ] No sensitive data in frontend code

### Functionality Tests
- [ ] **Homepage** - `/` loads correctly
- [ ] **Login/Register** - Auth flow works
- [ ] **Shop** - Products display from `/shop`
- [ ] **Product Detail** - Individual product page works
- [ ] **Cart** - Add/remove items
- [ ] **Checkout** - Complete purchase flow
- [ ] **My Orders** - View past orders
- [ ] **AI Chat** - Bot responds to queries
- [ ] **Admin Panel** - Shop, Orders, Discounts, Users management

### API Verification
```bash
# Test backend is responding
curl https://api-backend.up.railway.app/api/v1/health

# Or check a public endpoint
curl https://api-backend.up.railway.app/api/v1/products
```

---

## 7. Troubleshooting

### Backend Issues

**Build fails on Railway:**
```bash
# Locally test the build
./mvnw package -DskipTests

# Check Java version compatibility
java -version  # Should be 17+
```

**Database connection errors:**
- Verify `SPRING_DATASOURCE_URL` format is correct
- Ensure PostgreSQL is reachable from Railway (use internal networking)

**Flyway migration errors:**
```bash
# Check migration logs for details
# Common fix: The database might need manual cleanup

# To clean and re-run (DESTRUCTIVE):
# 1. Drop the database in Railway dashboard
# 2. Recreate it
# 3. Redeploy the backend
```

### Frontend Issues

**API calls failing:**
- Verify `NEXT_PUBLIC_API_URL` ends with `/api/v1`
- Check browser console for CORS errors
- Ensure backend is running and accessible

**Build errors:**
```bash
cd frontend
npm install
npm run build
```

### Image Upload Note

Currently, uploaded images are stored locally on the backend server. For production:

**Option A: Use Railway's disk storage (ephemeral)**
- Images will persist until Railway restarts the service
- Not recommended for production

**Option B: Configure cloud storage**
1. Set up AWS S3 or Cloudinary
2. Update the upload service to use cloud storage
3. Store only the URL in the database

---

## 8. Domain Configuration (Optional)

### Custom Domain - Vercel
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `shop.yourdomain.com`)
3. Update DNS records as instructed
4. Update `SecurityConfig.java` with the new domain

### Custom Domain - Railway
1. Go to Service Settings → Networking
2. Add custom domain (e.g., `api.yourdomain.com`)
3. Update `NEXT_PUBLIC_API_URL` in Vercel to use your custom backend domain

---

## 9. Monitoring & Logs

### Railway
- **Logs:** Project → Service → Deployments → View Logs
- **Metrics:** CPU, Memory, Network usage available in dashboard
- **Status:** https://railway.app/project/status

### Vercel
- **Logs:** Project → Deployments → Function Logs
- **Analytics:** Built-in analytics available
- **Status:** https://status.vercel.com

---

## 10. Quick Reference Commands

### Local Development
```bash
# Backend
cd api-backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm run dev
```

### Database Reset (Development Only)
```bash
# Drop and recreate locally
psql -U postgres -c "DROP DATABASE IF EXISTS api_backend;"
psql -U postgres -c "CREATE DATABASE api_backend;"
# Then restart the backend to run migrations
```

### Verify Deployments
```bash
# Backend health
curl https://api-backend.up.railway.app/actuator/health

# Frontend
curl -I https://your-frontend.vercel.app
```

---

## Support

For issues with:
- **Railway:** https://docs.railway.app
- **Vercel:** https://vercel.com/docs
- **This project:** Check the application logs for detailed error messages

---

*Last updated: June 2026*
