// Load environment variables FIRST before importing app
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import os from 'os';

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// Get local IP address for development
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) addresses and IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on ${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (isProduction) {
    const clientUrl = process.env.CLIENT_URL || 'Not set';
    console.log(`Client URL: ${clientUrl}`);
    console.log('Serving client application from /');
    console.log('API endpoints available at /api');
  } else {
    const localIP = getLocalIP();
    console.log(`Local access: http://localhost:${port}`);
    console.log(`Network access: http://${localIP}:${port}`);
  }
});

