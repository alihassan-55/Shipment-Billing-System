import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Serve static files (PDFs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

export default app;
