# Network Testing Setup Guide

This guide explains how to expose your Courier Billing System to your network for extensive testing.

## Quick Start

### Windows Users
```bash
# Run the automated setup script
start-network-testing.bat
```

### Linux/Mac Users
```bash
# Make the script executable and run it
chmod +x start-network-testing.sh
./start-network-testing.sh
```

## Manual Setup

### 1. Start Database Services
```bash
# Start PostgreSQL and Redis containers
docker-compose up -d
```

### 2. Start Backend Server
```bash
cd server
npm run dev:network
# or
HOST=0.0.0.0 npm run dev
```

### 3. Start Frontend Server
```bash
cd client
npm run dev:network
# or
npm run dev -- --host 0.0.0.0
```

## Network Access URLs

Once started, your application will be accessible at:

- **Frontend**: `http://YOUR_IP:3000`
- **Backend API**: `http://YOUR_IP:3001`
- **PostgreSQL**: `YOUR_IP:5432`
- **Redis**: `YOUR_IP:6379`

### Finding Your IP Address

#### Windows
```cmd
ipconfig
# Look for "IPv4 Address" under your network adapter
```

#### Linux/Mac
```bash
hostname -I
# or
ifconfig | grep "inet "
```

## Configuration Details

### Server Configuration
- **Host**: `0.0.0.0` (binds to all network interfaces)
- **Port**: `3001` (configurable via PORT environment variable)
- **CORS**: Configured to allow requests from network clients

### Client Configuration
- **Host**: `0.0.0.0` (accepts connections from any IP)
- **Port**: `3000` (configurable via Vite)
- **Proxy**: Routes `/api` requests to backend server

### Database Configuration
- **PostgreSQL**: Exposed on `0.0.0.0:5432`
- **Redis**: Exposed on `0.0.0.0:6379`
- **Network**: Custom bridge network for container communication

## Environment Variables

### Server Environment (`server/env.example`)
```env
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cms_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:3000,http://0.0.0.0:3000
```

### Client Environment (`client/env.example`)
```env
VITE_API_URL=http://localhost:3001/api
VITE_API_BASE_URL=http://localhost:3001
```

## Testing from Other Devices

### Mobile Devices
1. Connect your mobile device to the same network
2. Find your computer's IP address
3. Open browser and navigate to `http://YOUR_IP:3000`

### Other Computers
1. Connect to the same network
2. Open browser and navigate to `http://YOUR_IP:3000`
3. Test all functionality including API calls

### API Testing
Use tools like Postman or curl to test the API directly:
```bash
# Test health endpoint
curl http://YOUR_IP:3001/api/health

# Test authentication
curl -X POST http://YOUR_IP:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Security Considerations

⚠️ **Important**: This setup is for testing purposes only. Do not use in production without proper security measures:

1. **Firewall**: Ensure your firewall allows connections on ports 3000, 3001, 5432, 6379
2. **Authentication**: Test with proper user authentication
3. **HTTPS**: Consider using HTTPS for production deployments
4. **Database Security**: Change default passwords for production
5. **CORS**: Configure CORS properly for your domain

## Troubleshooting

### Connection Issues
1. **Check Firewall**: Ensure ports are not blocked
2. **Verify IP Address**: Make sure you're using the correct IP
3. **Network Connectivity**: Ensure devices are on the same network
4. **Service Status**: Check if all services are running

### Port Conflicts
If ports are already in use:
```bash
# Check what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Kill the process or change ports in configuration
```

### Database Connection Issues
1. Ensure Docker containers are running: `docker ps`
2. Check database logs: `docker logs cms_postgres`
3. Verify connection string in environment variables

## Performance Testing

### Load Testing
Use tools like Apache Bench or Artillery:
```bash
# Test API endpoints
ab -n 1000 -c 10 http://YOUR_IP:3001/api/health

# Test frontend
ab -n 1000 -c 10 http://YOUR_IP:3000
```

### Monitoring
Monitor system resources during testing:
- CPU usage
- Memory consumption
- Network bandwidth
- Database performance

## Cleanup

To stop all services:
```bash
# Stop Node.js processes
# Windows: taskkill /f /im node.exe
# Linux/Mac: pkill node

# Stop Docker containers
docker-compose down
```

## Additional Scripts

### Development Scripts
- `npm run dev:network` - Start with network access
- `npm run start:network` - Production start with network access
- `npm run preview:network` - Preview build with network access

### Database Scripts
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## Support

If you encounter issues:
1. Check the logs in terminal windows
2. Verify all services are running
3. Check network connectivity
4. Review firewall settings
5. Ensure all dependencies are installed

