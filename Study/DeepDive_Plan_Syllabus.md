# Deep Dive Learning Plan: Courier Billing System

This document outlines a strategic plan to dissect and understand the codebase functionality by functionality. We will cover the "How" (Implementation) and "Why" (Design Decisions).

## Module 1: The Core Foundation (Schema & Server)
*Objective: Understand where data lives and how the server starts.*
- **Database Schema**: Deep walk-through of `schema.prisma`.
    - Relationship between `Customer`, `Shipments`, and `Invoices`.
    - The role of specific tables like `shipment_boxes` vs `product_invoice_items`.
- **Server Architecture**:
    - `server.js` & `app.js`: Middleware setup (CORS, Helmet, Rate Limiting).
    - `db/client.js`: The Singleton Pattern for DB connections.

## Module 2: Authentication & Security
*Objective: Understand how users get in and stay secure.*
- **The Flow**: Login Page -> API Request -> JWT Generation -> LocalStorage.
- **Code Focus**:
    - Backend: `authRoutes.js`, `verifyToken` middleware.
    - Frontend: `authStore.js` (Zustand with Persistence), Axios Interceptor.
- **Key Concept**: Stateless Authentication.

## Module 3: Shipment Lifecycle (Operational Core)
*Objective: Follow a package from entry to delivery.*
- **Creation**: How `newShipmentRoutes.js` handles complex nested data (boxes, items, consignee) in one transaction.
- **State Machine**: The `status` field flow (`Draft` -> `Confirmed` -> `Delivered`).
- **Tracking**: `ShipmentEvent` logging.

## Module 4: The Financial Engine (Invoicing & Ledger)
*Objective: Understand the money flow (The most complex part).*
- **Dual Invoicing**: Differentiating `Declared Value` (Customs) vs. `Billing` (Service Charges).
- **The Ledger System**:
    - How `ShipmentInvoiceService.js` creates a `LedgerEntry` automatically.
    - The `Invoice` table vs. `shipment_invoices` table.
- **Atomic Transactions**: Why we use `prisma.$transaction` to prevent "Ghost" money.

## Module 5: Output & Integrations
*Objective: How the system talks to the outside world.*
- **PDF Generation**:
    - `pdfGenerator.js`: Drawing pixels instead of HTML.
    - The "Stream to S3" pipeline (generating without saving to disk).
- **Supabase Storage**: How files are organized and accessed.

---
## Execution Strategy
We will tackle these modules sequentially. For each module, I will:
1.  **Explain the Concept**: High-level theory.
2.  **Walk the Code**: Point to specific files and functions.
3.  **Highlight Key Logic**: Explain *why* a specific loop or condition exists.
