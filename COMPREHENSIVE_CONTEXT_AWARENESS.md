# Courier Billing System - Comprehensive Context Awareness Document

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema & Models](#database-schema--models)
4. [API Endpoints & Functionality](#api-endpoints--functionality)
5. [Frontend Components & Pages](#frontend-components--pages)
6. [Business Logic & Workflows](#business-logic--workflows)
7. [Authentication & Authorization](#authentication--authorization)
8. [File Structure & Organization](#file-structure--organization)
9. [Key Features & Capabilities](#key-features--capabilities)
10. [Development & Deployment](#development--deployment)

---

## System Overview

The **Courier Billing System** is a comprehensive web application designed for managing courier services, shipments, invoicing, and payments. It's built as a modern, scalable solution with clean architecture principles.

### Core Purpose
- **Shipment Management**: Create, track, and manage courier shipments
- **Customer Management**: Handle shippers, consignees, and service providers
- **Invoicing System**: Generate automated invoices for shipments
- **Payment Processing**: Track payments and manage accounts receivable
- **Reporting**: Generate reports and analytics for business operations

### Key Business Entities
- **Shipments**: Core business entity with detailed tracking
- **Customers**: Unified model for shippers and consignees
- **Invoices**: Automated billing with PDF generation
- **Payments**: Payment tracking and ledger management
- **Service Providers**: Courier service companies (FedEx, DHL, etc.)

---

## Architecture & Technology Stack

### Backend Architecture
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **PDF Generation**: PDFKit
- **File Storage**: Local filesystem (development), S3-ready (production)
- **Validation**: Zod schema validation

### Frontend Architecture
- **Framework**: React 18 with Vite
- **UI Library**: ShadCN/UI components with Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: Zustand stores
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with Prettier
- **Testing**: Jest with Supertest
- **Development**: Nodemon for hot reloading
- **Database Migrations**: Prisma Migrate

---

## Database Schema & Models

### Core Models

#### User Model
```prisma
model User {
  id           String      @id @default(uuid())
  name         String
  email        String      @unique
  passwordHash String
  role         String      // admin, operator, accountant
  isActive     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  shipments    shipments[]
}
```

#### Customer Model (Unified Shipper/Consignee)
```prisma
model Customer {
  id         String    @id @default(uuid())
  name       String
  company    String?
  email      String?
  phone      String?
  // Shipper-specific fields
  personName String?   // For shipper functionality
  address    String?   // For shipper functionality
  city       String?   // For shipper functionality
  country    String?   @default("Pakistan")
  cnic       String?   // Pakistani CNIC
  ntn        String?   // Pakistani NTN
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @default(now()) @updatedAt
  addresses  Address[]
  invoices   Invoice[]
  shipments  shipments[]
}
```

#### Shipment Model
```prisma
model shipments {
  id                    String                  @id
  referenceNumber       String                  @unique
  airwayBillNumber      String?
  serviceProviderId     String
  customerId            String?                 // Shipper
  consigneeId           String
  terms                 String                  // DAP or DDP
  actualWeightKg        Float
  volumeWeightKg        Float
  chargedWeightKg       Float
  customsValue          Float?
  status                String                  @default("Draft")
  bookedAt              DateTime                @default(now())
  expectedDelivery      DateTime?
  deliveredAt           DateTime?
  createdById           String
  updatedAt             DateTime
  // Relations
  events                ShipmentEvent[]
  billing_invoices      billing_invoices?
  product_invoice_items product_invoice_items[]
  shipment_boxes        shipment_boxes[]
  shipment_invoices     shipment_invoices[]
  consignees            consignees
  User                  User
  service_providers     service_providers
  Customer              Customer?
}
```

#### Invoice Models
```prisma
model shipment_invoices {
  id                String                      @id @default(uuid())
  invoiceNumber     String                      @unique
  type              InvoiceType                 // DECLARED_VALUE or BILLING
  shipmentId        String
  customerAccountId String?
  subtotal          Float
  tax               Float                       @default(0)
  total             Float
  currency          String                      @default("PKR")
  status            InvoiceStatus               @default(Draft)
  postedLedgerEntryId String?
  issuedAt          DateTime                    @default(now())
  pdfUrl            String?
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt
  shipments         shipments
  lineItems         shipment_invoice_line_items[]
}

enum InvoiceType {
  DECLARED_VALUE
  BILLING
}

enum InvoiceStatus {
  Draft
  Confirmed
  Paid
  Posted
}
```

### Supporting Models
- **Address**: Customer address management
- **ShipmentEvent**: Tracking events
- **ServiceProvider**: Courier companies
- **Consignee**: Delivery recipients
- **ShipmentBox**: Package dimensions and weights
- **ProductInvoiceItem**: Customs declarations
- **BillingInvoice**: Payment and billing details
- **LedgerEntry**: Credit payment tracking
- **AuditLog**: System audit trail

---

## API Endpoints & Functionality

### Authentication Endpoints
```
POST /api/auth/login
- Login with email/password
- Returns JWT token
- Body: { email, password }

POST /api/auth/logout
- Logout (stateless - client deletes token)
```

### User Management
```
GET /api/users/me
- Get current user profile
- Requires: Bearer token

POST /api/users
- Create new user (Admin only)
- Body: { name, email, password, role }
- Roles: admin, operator, accountant
```

### Customer Management
```
GET /api/customers
- List customers with pagination and search
- Query params: page, limit, search, sortBy, sortOrder, type
- Type: 'shipper' filters for shipper customers

POST /api/customers
- Create customer/shipper
- Body: { name, company, email, phone, addresses, personName, address, city, country, cnic, ntn }

GET /api/customers/:id
- Get customer details with addresses and invoices

PUT /api/customers/:id
- Update customer details

DELETE /api/customers/:id
- Delete customer (if no shipments/invoices exist)
```

### Shipment Management
```
POST /api/shipments
- Create new shipment
- Body: { referenceNumber, serviceProviderId, customerId, consigneeId, terms, boxes, actualWeightKg, productInvoice, billingInvoice, status }

GET /api/shipments
- List shipments with filtering
- Query params: referenceNumber, status, from, to, page, limit

GET /api/shipments/:id
- Get shipment details with all related data

PATCH /api/shipments/:id
- Update shipment (limited fields: status, terms, actualWeightKg, expectedDelivery, deliveredAt)

PATCH /api/shipments/:id/airway-bill
- Update airway bill number (late-night updates)

POST /api/shipments/:id/events
- Add tracking event
- Body: { eventType, description, location, occurredAt }
```

### Invoice Management
```
POST /api/invoices
- Create invoice from shipments
- Body: { shipmentIds, customerId, issuedDate, dueDate, taxRate }

GET /api/invoices
- List invoices with filtering
- Query params: customerId, status, from, to, page, limit

GET /api/invoices/:id
- Get invoice details with payment summary

POST /api/invoices/:id/generate-pdf
- Generate PDF for invoice (Admin/Accountant only)
```

### Shipment Invoice System
```
POST /api/shipments/:id/generate-invoices
- Generate both Declared Value and Billing invoices for shipment

GET /api/shipments/:id/invoices
- Get all invoices for a shipment

POST /api/invoices/:id/pdf
- Generate PDF for specific invoice

PATCH /api/invoices/:id/status
- Update invoice status
- Body: { status }
```

### Service Provider Management
```
GET /api/service-providers
- Get all service providers
- Returns: FedEx, DHL, TNT, Aramex, UPS via DXB, USPS USA, DPD via UK, Parcel Force UK, UPS via UK
```

### Consignee Management
```
GET /api/consignees
- List consignees with search
- Query params: query (for typeahead search)

POST /api/consignees
- Create new consignee
- Body: { personName, phone, address, city, country, email }
```

### Bulk Import
```
POST /api/bulk-import/shipments
- Upload CSV file for bulk shipment import
- Form data: file (CSV file)
- Expected CSV columns: sender_name, sender_phone, sender_email, receiver_name, receiver_phone, receiver_email, destination, shipment_date, weight_kg, service_type, declared_value, cod_amount, pickup_address, pickup_city, pickup_state, pickup_postal, pickup_country, delivery_city, delivery_state, delivery_postal, delivery_country, expected_delivery, dimensions
```

### Payment Management
```
GET /api/payments
- List payments with filtering
- Query params: invoiceId, from, to, page, limit

POST /api/payments
- Record payment
- Body: { invoiceId, paymentDate, amount, method, reference }
```

### Reports
```
GET /api/reports/monthly
- Monthly summary report
- Query params: year, month

GET /api/reports/accounts
- Export accounts report
- Query params: from, to, format (json/csv)
```

---

## Frontend Components & Pages

### Main Application Structure
```
client/src/
├── App.jsx                 # Main app component with routing
├── main.jsx               # Application entry point
├── index.css              # Global styles
├── components/            # Reusable UI components
├── pages/                 # Page components
├── stores/                # Zustand state management
├── lib/                   # Utility functions
└── utils/                 # Business logic utilities
```

### Key Pages

#### DashboardPage.jsx
- **Purpose**: Main dashboard with statistics and quick actions
- **Features**: 
  - Stats cards (total shipments, invoices, revenue, pending payments)
  - Recent activity feed
  - Quick action buttons
- **Data**: Fetches dashboard stats from shipments and invoices

#### NewShipmentsPage.jsx
- **Purpose**: Complete shipment management interface
- **Features**:
  - Shipment list with pagination and filtering
  - Create/edit shipment dialogs
  - Shipment details view
  - Invoice management panel
  - Search and status filtering
- **Components Used**: NewShipmentForm, ShipmentInvoicesPanel

#### CustomersPage.jsx
- **Purpose**: Customer and shipper management
- **Features**:
  - Customer list with search
  - Create/edit customer forms
  - Address management
  - Shipper-specific fields (CNIC, NTN)

#### InvoicesPage.jsx
- **Purpose**: Invoice management and creation
- **Features**:
  - Invoice list with filtering
  - Create invoice from shipments
  - Invoice viewer with PDF download
  - Payment status tracking

### Key Components

#### NewShipmentForm.jsx
- **Purpose**: Comprehensive shipment creation form
- **Features**:
  - Typeahead search for shippers/consignees
  - Dynamic box management
  - Product invoice section
  - Billing invoice section
  - Real-time weight calculations
  - VAT number handling
- **Sub-components**: TypeaheadInput, BoxDimensions, ProductInvoiceSection, BillingInvoiceSection

#### InvoiceViewer.jsx
- **Purpose**: Professional invoice display
- **Features**:
  - Company branding
  - Service breakdown table
  - Payment history
  - Print and download actions
  - Responsive design

#### ShipmentInvoicesPanel.jsx
- **Purpose**: Invoice management for shipments
- **Features**:
  - Generate invoices for shipments
  - View invoice details
  - Download PDFs
  - Status management

### State Management (Zustand Stores)

#### authStore.js
- **Purpose**: Authentication state management
- **Features**:
  - Login/logout functionality
  - Token management
  - User profile
  - Axios interceptors for auth
  - Persistent storage

#### dataStore.js
- **Purpose**: Application data management
- **Features**:
  - Dashboard statistics
  - CRUD operations for all entities
  - Retry logic with exponential backoff
  - Loading states
  - Error handling

---

## Business Logic & Workflows

### Shipment Creation Workflow
1. **Form Initialization**: Generate reference number, load service providers
2. **Shipper Selection**: Typeahead search with create-new option
3. **Consignee Selection**: Typeahead search with create-new option
4. **Box Management**: Add/remove boxes with dimension validation
5. **Weight Calculations**: 
   - Volumetric weight: `ceil((L×W×H)/5000)` per box
   - Charged weight: `max(totalActualWeight, totalVolumeWeight)`
6. **Product Invoice**: Add items per box with HS codes
7. **Billing Invoice**: Set rates and payment method
8. **Validation**: Comprehensive field validation
9. **Submission**: Create shipment with all related data

### Invoice Generation Workflow
1. **Shipment Confirmation**: Change status to "Confirmed"
2. **Automatic Invoice Creation**: 
   - Declared Value Invoice (from product items)
   - Billing Invoice (from billing data)
3. **PDF Generation**: Generate professional PDFs
4. **Ledger Entry**: Create credit entries if payment method is "Credit"
5. **Status Updates**: Update invoice and shipment statuses

### Payment Processing Workflow
1. **Payment Recording**: Record payment with method and reference
2. **Invoice Status Update**: Calculate outstanding balance
3. **Ledger Management**: Update credit accounts
4. **Status Transitions**: Unpaid → Partial → Paid

### Weight Calculation Logic
```javascript
// Volumetric weight calculation
function calculateVolumetricWeight(lengthCm, widthCm, heightCm) {
  const volume = (lengthCm * widthCm * heightCm) / 5000;
  return Math.ceil(volume); // Round up
}

// Charged weight calculation
const chargedWeightKg = Math.max(actualWeight, totalVolumeWeight);
```

### Reference Number Generation
```javascript
// Format: PREFIX-YYYYMMDD-XXXX
function generateReferenceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PREFIX-${date}-${random}`;
}
```

---

## Authentication & Authorization

### JWT Implementation
- **Token Structure**: Contains user ID, role, email, and name
- **Expiration**: 1 day
- **Storage**: Persistent in Zustand store
- **Headers**: `Authorization: Bearer <token>`

### Role-Based Access Control
- **Admin**: Full system access, user management
- **Operator**: Shipment management, customer management
- **Accountant**: Invoice management, payment processing, reports

### Protected Routes
- All API endpoints except `/api/health` and `/api/auth/login` require authentication
- Role-specific endpoints use `requireRoles` middleware
- Frontend routes protected by token presence

### Security Features
- Password hashing with bcrypt
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- CORS configuration
- Helmet.js security headers

---

## File Structure & Organization

### Server Structure
```
server/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── index.js               # Alternative entry point
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── newShipmentController.js
│   │   ├── invoiceController.js
│   │   ├── shipmentInvoiceController.js
│   │   └── ...
│   ├── routes/                # API route definitions
│   │   ├── authRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── newShipmentRoutes.js
│   │   ├── invoiceRoutes.js
│   │   └── ...
│   ├── models/                # Database models (Sequelize)
│   ├── services/              # Business logic services
│   │   └── shipmentInvoiceService.js
│   ├── middleware/             # Express middleware
│   │   ├── auth.js
│   │   └── database.js
│   ├── utils/                  # Utility functions
│   │   ├── pdfGenerator.js
│   │   └── jwt.js
│   └── db/                     # Database configuration
│       ├── client.js
│       └── sequelize.js
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── tests/                     # Test files
├── uploads/                   # File uploads (PDFs)
└── package.json
```

### Client Structure
```
client/src/
├── components/
│   ├── ui/                    # ShadCN/UI components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── input.jsx
│   │   └── ...
│   ├── NewShipmentForm.jsx
│   ├── NewShipmentFormComponents.jsx
│   ├── InvoiceViewer.jsx
│   ├── ShipmentInvoicesPanel.jsx
│   ├── Layout.jsx
│   └── ...
├── pages/
│   ├── DashboardPage.jsx
│   ├── NewShipmentsPage.jsx
│   ├── CustomersPage.jsx
│   ├── InvoicesPage.jsx
│   └── ...
├── stores/
│   ├── authStore.js
│   └── dataStore.js
├── lib/
│   ├── utils.js
│   └── use-toast.js
├── utils/
│   ├── shipmentCalculations.js
│   ├── shipmentValidation.js
│   └── countries.js
├── App.jsx
└── main.jsx
```

---

## Key Features & Capabilities

### Advanced Shipment Management
- **Typeahead Search**: Smart search for shippers and consignees
- **Dynamic Box Management**: Add/remove boxes with real-time calculations
- **Volumetric Weight Calculation**: Automatic dimensional weight calculation
- **Product Invoice**: Per-box product declarations with HS codes
- **Billing Management**: Comprehensive billing with multiple charge types
- **Status Tracking**: Draft → Confirmed → Delivered workflow

### Automated Invoice System
- **Dual Invoice Types**: Declared Value and Billing invoices
- **PDF Generation**: Professional PDFs with company branding
- **Payment Integration**: Cash and credit payment handling
- **Ledger Management**: Automatic credit account entries
- **Status Management**: Draft → Confirmed → Paid → Posted

### Customer Management
- **Unified Model**: Single customer model for shippers and consignees
- **Address Management**: Multiple addresses per customer
- **Document Validation**: CNIC and NTN format validation
- **Search & Filter**: Advanced search capabilities

### Service Provider Integration
- **Multiple Providers**: FedEx, DHL, TNT, Aramex, UPS, USPS, DPD, Parcel Force
- **Service Selection**: Dropdown selection in shipment creation
- **Provider Management**: Easy addition of new providers

### Reporting & Analytics
- **Dashboard Statistics**: Real-time business metrics
- **Monthly Reports**: Comprehensive monthly summaries
- **Account Reports**: Exportable account ledgers
- **Payment Tracking**: Outstanding payment monitoring

### Bulk Operations
- **CSV Import**: Bulk shipment import with validation
- **Batch Invoice Creation**: Create invoices for multiple shipments
- **Export Functionality**: PDF and CSV exports

---

## Development & Deployment

### Development Setup
1. **Prerequisites**: Node.js, PostgreSQL, npm
2. **Database Setup**: 
   ```bash
   cd server
   npm run prisma:generate
   npm run prisma:migrate
   ```
3. **Environment Variables**:
   ```env
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-secret-key
   DATABASE_URL=postgresql://user:password@localhost:5432/database
   ```
4. **Start Services**:
   ```bash
   # Backend
   cd server && npm run dev
   
   # Frontend
   cd client && npm run dev
   ```

### Production Considerations
- **Database**: PostgreSQL with connection pooling
- **File Storage**: S3 or S3-compatible storage for PDFs
- **Security**: HTTPS, secure JWT secrets, environment variables
- **Monitoring**: Health checks, logging, error tracking
- **Scaling**: Stateless application, horizontal scaling ready

### Testing Strategy
- **Unit Tests**: Jest for business logic
- **Integration Tests**: Supertest for API endpoints
- **Frontend Tests**: Component testing (planned)
- **Database Tests**: Transaction testing

### Performance Optimizations
- **Database Indexing**: Proper indexes on frequently queried fields
- **Caching**: Service provider data caching
- **Pagination**: All list endpoints support pagination
- **Retry Logic**: Exponential backoff for failed requests
- **Connection Pooling**: Database connection optimization

---

## Conclusion

The Courier Billing System is a comprehensive, modern web application built with industry best practices. It provides a complete solution for courier service management with advanced features like automated invoicing, PDF generation, and sophisticated shipment tracking.

The system is designed for scalability, maintainability, and user experience, making it suitable for both small courier businesses and larger operations requiring robust shipment and billing management.

### Key Strengths
- **Clean Architecture**: Separation of concerns with clear layers
- **Modern Technology Stack**: Latest versions of React, Node.js, and PostgreSQL
- **Comprehensive Features**: End-to-end shipment and billing management
- **Professional UI**: Modern, responsive interface with excellent UX
- **Robust Business Logic**: Sophisticated calculations and workflows
- **Extensible Design**: Easy to add new features and integrations

### Future Enhancements
- Mobile applications
- Third-party courier API integrations
- Advanced reporting and analytics
- Email notifications
- Barcode generation
- Multi-tenant support

This system represents a production-ready solution that can handle real-world courier business operations with efficiency and reliability.
