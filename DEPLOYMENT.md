# Deployment Guide for Courier Billing System

This guide will help you deploy the Courier Billing System to Savala or other free hosting services.

## Overview

The application is configured to serve both the API and client through a single endpoint. The server serves the built React client as static files and handles API requests through the `/api` route.

## Prerequisites

- Node.js 18+ installed
- Database URL (PostgreSQL, MySQL, or SQLite)
- Git repository with your code

## Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=3001
NODE_ENV=production
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

## Build Process

The application has a build script that:
1. Installs client dependencies
2. Builds the React client
3. Prepares the server to serve both API and client

### Local Build Test

Before deploying, test the build locally:

```bash
# From the server directory
cd server
npm run build
NODE_ENV=production node src/server.js
```

The application should be accessible at `http://localhost:3001`

## Deployment to Savala

### Step 1: Prepare Your Repository

1. Ensure all code is committed and pushed to your Git repository
2. Make sure `.env` file is NOT committed (it should be in `.gitignore`)

### Step 2: Configure Database

1. Set up a database (PostgreSQL recommended for production)
2. Run migrations:
   ```bash
   cd server
   npm run prisma:generate
   npm run prisma:migrate
   ```
3. Update your `DATABASE_URL` environment variable

### Step 3: Deploy to Savala

1. Log in to your Savala account
2. Create a new web service
3. Connect your Git repository
4. Configure build settings:
   - **Build Command**: `cd server && npm install && cd ../client && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: Leave empty (or set to project root)
5. Set environment variables in Savala dashboard:
   - `PORT` (Savala may provide this automatically)
   - `NODE_ENV=production`
   - `DATABASE_URL=your_database_url`
   - `JWT_SECRET=your_secure_secret_key`
   - `JWT_EXPIRES_IN=7d`

### Step 4: Verify Deployment

1. After deployment, visit your application URL
2. Check the health endpoint: `https://your-domain.com/api/health`
3. Test login and basic functionality

## Alternative: Manual Build and Deploy

If you need to build manually:

```bash
# Install dependencies
cd client
npm install
cd ../server
npm install

# Build client
cd ../client
npm run build

# Start server in production mode
cd ../server
NODE_ENV=production npm start
```

## Troubleshooting

### Client Not Loading

- Ensure `NODE_ENV=production` is set
- Verify `client/dist` folder exists after build
- Check server logs for file path errors

### API Endpoints Not Working

- Verify CORS settings if accessing from a different domain
- Check that API routes start with `/api`
- Review server logs for error messages

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is accessible from hosting service
- Ensure database migrations have run

### Static Files Not Serving

- Verify the build completed successfully
- Check that `client/dist` contains built files
- Ensure static file paths in `server/src/app.js` are correct

## Production Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Client build completed
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Login functionality works
- [ ] API endpoints accessible
- [ ] Static files loading correctly

## Support

For issues specific to Savala hosting, consult their documentation or support resources.


