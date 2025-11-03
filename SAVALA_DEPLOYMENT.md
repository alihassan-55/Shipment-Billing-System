# Quick Deployment Guide for Savala

This is a quick reference guide for deploying the Courier Billing System to Savala hosting.

## Quick Steps

### 1. Prepare Your Code
- Ensure all code is committed to Git
- Push to your Git repository (GitHub, GitLab, etc.)

### 2. Set Up Database
- Create a database (PostgreSQL recommended)
- Get your database connection URL
- Run migrations when deploying (or manually before)

### 3. Deploy to Savala

#### Option A: Using Savala Dashboard

1. Log in to Savala
2. Create a new Web Service
3. Connect your Git repository
4. Configure the following:

   **Build Settings:**
   - **Build Command**: `cd server && npm install && cd ../client && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Node Version**: 18 or higher

   **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=your_database_connection_string
   JWT_SECRET=your_secure_secret_key_here
   JWT_EXPIRES_IN=7d
   PORT=3001
   ```
   (Note: PORT may be auto-set by Savala)

#### Option B: Using CLI (if Savala supports it)

```bash
savala deploy \
  --build-command "cd server && npm install && cd ../client && npm install && npm run build" \
  --start-command "cd server && npm start" \
  --env NODE_ENV=production \
  --env DATABASE_URL=your_db_url \
  --env JWT_SECRET=your_secret
```

### 4. After Deployment

1. Visit your deployed URL
2. Check health: `https://your-app.savala.com/api/health`
3. Access the application at: `https://your-app.savala.com`
4. Test login functionality

## Important Notes

- **Single Endpoint**: The application serves both API and client from one endpoint
- **API Routes**: All API calls use `/api` prefix
- **Client Routes**: All other routes serve the React app
- **Database**: Make sure your database is accessible from Savala
- **Migrations**: Run migrations after first deployment:
  ```bash
  cd server
  npm run prisma:generate
  npm run prisma:migrate:deploy
  ```

## Troubleshooting

**If the client doesn't load:**
- Check that `NODE_ENV=production` is set
- Verify the build completed successfully
- Check server logs for errors

**If API calls fail:**
- Verify CORS settings if needed
- Check that routes start with `/api`
- Review server logs

**If database connection fails:**
- Verify `DATABASE_URL` is correct
- Check database is accessible from Savala
- Ensure migrations have run

## Build Commands Reference

From project root:
```bash
npm run build          # Build client only
npm run deploy:build   # Full build for deployment
npm start              # Start server (production)
```

From server directory:
```bash
npm run build          # Build client and prepare
npm start              # Start server
npm run prisma:migrate:deploy  # Run migrations
```

## Support

For Savala-specific issues, refer to Savala documentation or support.


