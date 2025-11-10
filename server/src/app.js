// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import ledgerRoutes from './routes/ledgerRoutes.js';
import bulkImportRoutes from './routes/bulkImportRoutes.js';
import consigneeRoutes from './routes/consigneeRoutes.js';
import serviceProviderRoutes from './routes/serviceProviderRoutes.js';
import newShipmentRoutes from './routes/newShipmentRoutes.js';
import shipmentInvoiceRoutes from './routes/shipmentInvoiceRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import { checkDatabaseConnection } from './db/client.js';
import { searchShippersByPhone } from './controllers/customerController.js';
import { requireAuth } from './middleware/auth.js';

export function createApp() {
  const app = express();

  // Configure Helmet with a restrictive Content Security Policy.
  // We set default-src to 'self' and explicitly allow the deployment host for
  // fetch/connect requests so client-side API calls to the Fly app are not blocked.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Allow XHR/fetch/websocket connections to self and the Fly deployment
        connectSrc: ["'self'", 'https://shipment-billing-system.fly.dev'],
        // Keep script/style/img defaults conservative but allow self
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"]
      }
    }
  }));
  
  // Configure CORS based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const clientUrl = process.env.CLIENT_URL;
    app.use(cors({
      origin: clientUrl || true, // Use CLIENT_URL if set, otherwise allow all origins
      credentials: true
    }));
  } else {
    // In development, allow all origins for flexibility
    app.use(cors({ origin: true, credentials: true }));
  }
  
  app.use(express.json());
  app.use(morgan('dev'));

  // Serve static files (PDFs)
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Serve built client files if they exist (production or development with build)
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  const indexPath = path.join(clientBuildPath, 'index.html');
  const clientFilesExist = fs.existsSync(indexPath);
  
  if (clientFilesExist) {
    console.log('Serving client from:', clientBuildPath);
    console.log('Client build path exists:', fs.existsSync(clientBuildPath));
    console.log('Index.html exists:', fs.existsSync(indexPath));
    
    // Serve static files from client dist
    app.use(express.static(clientBuildPath, {
      maxAge: isProduction ? '1y' : '0',
      etag: true,
      lastModified: true
    }));
  } else if (isProduction) {
    console.warn('WARNING: Client build files not found at:', clientBuildPath);
  }

  app.get('/api/health', async (_req, res) => {
    const dbConnected = await checkDatabaseConnection();
    res.json({ 
      status: 'ok', 
      env: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/shipments', newShipmentRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/ledger', ledgerRoutes);
  app.use('/api/bulk-import', bulkImportRoutes);
  app.use('/api/shippers', customerRoutes); // Map shippers to customer routes
  app.use('/api/shippers/search-by-phone', requireAuth, searchShippersByPhone); // Direct route for phone search
  app.use('/api/consignees', consigneeRoutes);
  app.use('/api/service-providers', serviceProviderRoutes);
  app.use('/api/shipment-invoices', shipmentInvoiceRoutes);
  app.use('/api/integration', integrationRoutes);

  // Serve client app for all non-API routes if client files exist
  if (clientFilesExist) {
    console.log('Setting up catch-all route to serve index.html from:', indexPath);
    
    // Catch-all handler for client-side routing (must be last, handles all HTTP methods)
    app.use('*', (req, res, next) => {
      // Don't handle API routes here
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not Found', path: req.path });
      }
      
      // Serve index.html for client-side routing
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(500).json({ error: 'Failed to serve application', details: err.message });
        }
      });
    });
  } else {
    // 404 handler when client files don't exist
    app.use((req, res, _next) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not Found', path: req.path });
      }
      res.status(404).json({ 
        error: 'Not Found', 
        path: req.path,
        message: isProduction 
          ? 'Client application not built. Please build the client first.' 
          : 'Client application not found. Run "npm run build" in the client directory or start the client dev server separately.'
      });
    });
  }

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

// Create default app instance for backward compatibility
const app = createApp();
export default app;
