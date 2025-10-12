# Courier Management System — SRS & Implementation Blueprint

**Document version:** 1.0

**Date:** 2025-10-08

**Authors:** Project Owner / Dev Team

---

## 1. Purpose
This document is the Software Requirements Specification (SRS) and implementation blueprint for the **Courier Management System (CMS)** built with the stack: **React.js + Vite + Tailwind CSS + ShadCN/UI** (frontend), **Node.js + Express.js** (backend), **PostgreSQL** (database), **JWT** (auth), and **PDFKit** (invoice generation).

It provides detailed functional and non-functional requirements, use cases, user stories, data model summary, API surface, acceptance criteria, testing strategy, and deployment guidance. Use this directly in Cursor, Notion, or any coding assistant as the canonical project brief.

---

## 2. Project Overview
**Goal:** Build a reliable, maintainable courier management system to handle shipments, invoicing, payments, monthly accounts, exports/printing, and search/filtering. The MVP is for moderate traffic (not industrial scale) but is designed for clean code and future upgradeability.

**Primary users / roles:**
- **Admin** — system setup, users, global reports, audit.
- **Operator** — create/modify shipments, add events, prepare invoices.
- **Accountant** — manage invoices, payments, monthly accounts and reports.
- **(Optional Phase 2) Customer** — view shipments and download invoices.

---

## 3. Scope
**In-scope (Phase:1):**
- Create Airway Bill, PDF export and print
- Based On Airway Bill - Invoice creation (single & batch), 
- View All Airway bills by date/time
- Filter/search invoices and shipments by date/time, status, customer, waybill
- Role-based access control and audit logs

**Out-of-scope (Phase:2):**
- Payment recording and payment-status handling
- Monthly accounting/summary reports and CSV export
- Robust validation and CSV bulk import for shipments


**Out-of-scope (Phase 3):**
- Mobile native apps
- Third-party courier integrations
- Multi-tenant SaaS features
- Full-featured BI / Data warehouse

---

## 4. Definitions & Acronyms
- **CMS** — Courier Management System
- **MVP** — Minimum Viable Product
- **API** — Application Programming Interface
- **JWT** — JSON Web Token
- **PDFKit** — Node.js library for programmatic PDF creation

---

## 5. Functional Requirements (FR)
Each FR is uniquely numbered for traceability. Where possible, acceptance criteria are provided.

### FR-1: Authentication & Authorization
- FR-1.1: Users can register (Admin only can create other Admin/Accountant/Operator accounts).
- FR-1.2: Users log in with email and password and receive a JWT.
- FR-1.3: Protect API endpoints; only users with required roles can access certain endpoints.

**Acceptance:** Protected endpoints return 401 for unauthenticated, 403 for unauthorized.

### FR-2: Shipment Management
- FR-2.1: Create shipments with sender, receiver, weight, dimensions, service_type, declared_value, pickup/delivery dates.
- FR-2.2: Each shipment receives a unique `waybill` (format configurable in settings).
- FR-2.3: Update shipment details and status transitions.
- FR-2.4: Add timestamped shipment events (location, notes).
- FR-2.5: Search/filter shipments by waybill, status, sender/receiver, date range, or tracking code.

**Acceptance:** Waybill uniqueness is enforced; invalid transitions rejected with descriptive error.

### FR-3: Invoicing & Billing
- FR-3.1: Create invoice for one or multiple shipments.
- FR-3.2: Invoice supports line items (shipment charge, insurance, COD, taxes, discounts).
- FR-3.3: Calculate subtotal, tax, and total; store in DB.
- FR-3.4: Generate PDF invoice using PDFKit; store in S3 or local storage; provide download link.
- FR-3.5: Edit invoice (version history kept) and cancel invoice.
- FR-3.6: Mark invoice as paid/partial/unpaid and create payment records.

**Acceptance:** Invoice creation is transactional; linked shipments marked as invoiced and cannot be invoiced twice.

### FR-4: Payments
- FR-4.1: Record payments with method, amount, date, reference number, received_by.
- FR-4.2: Support partial payments; compute outstanding balance and update invoice status.

**Acceptance:** Sum of payments + outstanding matches invoice total. Overpayments flagged.

### FR-5: Reporting & Accounts
- FR-5.1: Monthly summary (total invoiced, total received, outstanding) at company and per-customer levels.
- FR-5.2: Filter reports by date range, customer, and status.
- FR-5.3: Export reports to CSV and PDF.

**Acceptance:** Exported CSV passes CSV schema validation and opens in Excel without error.

### FR-6: Bulk Data Entry / Import
- FR-6.1: Accept CSV file for bulk shipments import with validation report (success rows / error rows with messages).

**Acceptance:** No partial writes for a failed row unless `skip_invalid` flag is set; errors returned per row.

### FR-7: Audit & Logs
- FR-7.1: Create audit log entries for create/update/delete of key entities (shipment, invoice, payment, user).

**Acceptance:** Audit logs store user_id, timestamp, entity_type, entity_id, old_data(JSON), new_data(JSON).

### FR-8: Export & Print
- FR-8.1: Print-friendly invoice view.
- FR-8.2: Bulk export of invoices for a selected date range.

**Acceptance:** PDFs are downloadable and display correctly in major PDF readers.

### FR-9: Settings & Config
- FR-9.1: Admin can configure tax rates, currency, waybill format, PDF header/footer templates.

**Acceptance:** Changes to settings apply to new invoices only (unless `recalculate` option used).

---

## 6. Non-Functional Requirements (NFR)

### NFR-1: Performance
- Single-record read/write operations should respond within 300 ms under normal load.
- List endpoints with pagination should respond within 1s for up to 100 items.

### NFR-2: Reliability & Availability
- Target availability: 99.5% (MVP single-region deployment).

### NFR-3: Security
- Passwords hashed (bcrypt recommended).
- JWT tokens with configurable expiry (e.g., 1 day); support refresh tokens if desired.
- HTTPS required in production.
- Role-based access control enforced server-side.

### NFR-4: Maintainability
- Code should follow consistent linting rules (ESLint + Prettier) and pass unit tests in CI.

### NFR-5: Scalability
- Designed to be horizontally scalable: stateless Node app, Redis for background tasks and caching.

### NFR-6: Data retention & backups
- Database backups daily; retention for 30 days by default (configurable).

---

## 7. System Architecture (Brief)
- **Frontend:** React + Vite. UI components with ShadCN. Secure storage for JWT in HttpOnly cookie recommended.
- **Backend:** Express.js application exposing RESTful JSON endpoints.
- **DB:** PostgreSQL (single instance for MVP). Use migrations (e.g., Prisma migrate).
- **Storage:** Local for development; S3 or S3-compatible storage in production for PDFs.
- **Background Worker:** Node worker (Bull/BullMQ with Redis) for PDF generation and heavy imports.

Architecture responsibilities split: controllers (HTTP layer) → services (business logic) → repositories (DB access).

---

## 8. Data Model Summary
(Condensed; use as input for Prisma schema)

- **User**: id, name, email(unique), passwordHash, role, isActive, createdAt, updatedAt
- **Customer**: id, name, company, email, phone, createdAt
- **Address**: id, customerId, type, line1, line2, city, state, postalCode, country
- **Shipment**: id, waybill(unique), senderId, receiverId, pickupAddressId, deliveryAddressId, weight, dimensions, serviceType, declaredValue, codAmount, status, bookedAt, expectedDelivery, deliveredAt, invoiceId
- **ShipmentEvent**: id, shipmentId, eventType, description, location, occurredAt, recordedBy
- **Invoice**: id, invoiceNumber(unique), customerId, issuedDate, dueDate, subtotal, tax, total, currency, status, pdfPath
- **InvoiceLineItem**: id, invoiceId, shipmentId, description, quantity, unitPrice, total
- **Payment**: id, invoiceId, paymentDate, amount, method, reference, receivedBy
- **AuditLog**: id, userId, entityType, entityId, action, oldData(JSON), newData(JSON), createdAt

---

## 9. API Surface (Selected endpoints)
Use JWT in `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth/login` — { email, password } → { token }
- `POST /api/auth/logout` — invalidate token (optional)

### Users
- `POST /api/users` — create user (Admin only)
- `GET /api/users/me` — get current user

### Shipments
- `POST /api/shipments` — create shipment
- `GET /api/shipments` — list w/ query params: ?waybill=&status=&from=&to=&page=&limit=
- `GET /api/shipments/:id` — fetch single
- `PUT /api/shipments/:id` — update
- `POST /api/shipments/:id/events` — add event
- `POST /api/shipments/bulk-upload` — CSV upload

### Invoices
- `POST /api/invoices` — create invoice { shipmentIds: [], taxRate?: }
- `GET /api/invoices` — list invoices (filters: customer, status, from, to)
- `GET /api/invoices/:id` — fetch invoice
- `POST /api/invoices/:id/generate-pdf` — (queued) produce PDF
- `POST /api/invoices/:id/payments` — record payment

### Reports
- `GET /api/reports/monthly?year=&month=` — monthly summary
- `GET /api/reports/accounts?from=&to=&format=csv` — export account ledger

---

## 10. Use Cases (Detailed)

### Use Case UC-1: Create Shipment
**Actor:** Operator
**Precondition:** Authenticated with role `operator` or `admin`.
**Flow:**
1. Operator fills the create shipment form (sender, receiver, addresses, weight, service).
2. Frontend validates required fields and calls `POST /api/shipments`.
3. Backend validates and persists shipment, generates unique waybill.
4. Backend returns 201 with shipment object.
**Postcondition:** Shipment stored; waybill issued.

### Use Case UC-2: Create Invoice from Shipments
**Actor:** Accountant / Operator
**Precondition:** Selected shipments exist and are not already invoiced.
**Flow:**
1. Accountant selects multiple shipments and clicks `Create Invoice`.
2. Frontend POSTs to `/api/invoices` with shipmentIds.
3. Backend (transaction): verifies shipments, computes line items → create invoice → link shipments → commit.
4. Queue PDF generation job. Return invoice object.
**Postcondition:** Invoice exists and PDF job queued.

### Use Case UC-3: Record Payment
**Actor:** Accountant
**Precondition:** Invoice exists.
**Flow:**
1. Accountant enters payment details and submits.
2. Backend creates payment record and recalculates invoice status.
3. Return updated invoice with new payment summary.
**Postcondition:** Payment recorded; invoice status updated.

---

## 11. User Stories (for sprint planning)
Format: `As a <role>, I want <goal> so that <benefit>`

- US-1: As an **Operator**, I want to create shipments quickly so that pickups are recorded and waybills are issued.
- US-2: As an **Accountant**, I want to create invoices for multiple shipments so that billing is efficient.
- US-3: As an **Admin**, I want to manage users and roles so that permissions are controlled.
- US-4: As an **Operator**, I want to import shipments via CSV so that I can onboard bulk data.
- US-5: As an **Accountant**, I want monthly reports exported as CSV so I can provide accounting to stakeholders.

Each user story should have acceptance tests (see section 14).

---

## 12. Acceptance Criteria & Test Cases (selected)

### Shipment
- TC-S1: Valid create shipment returns 201 and contains `waybill`.
- TC-S2: Creating shipment with duplicate waybill fails with 409.

### Invoice
- TC-I1: Creating invoice for valid shipments creates invoice and links shipments.
- TC-I2: Concurrent invoice creation for the same shipment should leave only one invoice linked — test for race condition.

### Payments
- TC-P1: Recording full payment marks invoice `Paid`.
- TC-P2: Partial payments mark invoice `Partial` and compute outstanding.

### Reports
- TC-R1: Monthly report matches aggregated invoices and payments for the period.

---

## 13. Security Considerations
- Use bcrypt with salt rounds >= 10 for password hashing.
- Store JWT signing key securely (vault or env var). Use RS256 if using asymmetric keys.
- Implement rate limiting on auth endpoints.
- Use input validation libraries (Joi / Zod) on both front and back.
- Sanitize all inputs and avoid logging sensitive data.

---

## 14. Testing Strategy
- **Unit tests:** Services, utilities, and validation rules.
- **Integration tests:** API endpoints using Supertest against a test DB.
- **E2E tests (optional):** Cypress for critical flows: login, create shipment, invoice, payment.
- **Load tests (optional):** k6 for baseline throughput testing.

CI should run unit + integration tests on PRs.

---

## 15. Deployment & Environment
- **Local dev:** Docker Compose with Postgres and Redis, Node backend, React front.
- **Staging/Prod:** Docker images deployed to a single-host or small cloud service (DigitalOcean, Railway, or AWS ECS Fargate).
- **Environment variables:** DB_URL, JWT_SECRET, S3_BUCKET, REDIS_URL, NODE_ENV.

---

## 16. Implementation Roadmap (suggested sprints)
- **Sprint 0 (setup):** Repo, linting, CI, Docker Compose skeleton, DB migrations
- **Sprint 1 (auth & users):** Auth endpoints, user management, RBAC middleware
- **Sprint 2 (shipments):** Shipments CRUD, events, filters, waybill generation
- **Sprint 3 (invoices):** Invoice creation, line items, linking shipments
- **Sprint 4 (pdf & payments):** PDFKit integration, payment recording
- **Sprint 5 (reports & bulk import):** Monthly reports, CSV import with validation
- **Sprint 6 (polish):** UI improvements, tests, deployment to staging

---

## 17. UI/UX Notes
- Keep forms short and smart: use stepper for complex shipment entry.
- Validate client-side and show friendly errors; always re-validate server-side.
- Use consistent primary CTA for actions like `Create Shipment` / `Create Invoice`.
- Provide helpful bulk action UIs for invoice creation and exports.

---

## 18. Appendix A — Example Data Formats

**Invoice creation payload (POST /api/invoices)**
```json
{
  "shipmentIds": ["b7f0c6d2-...", "a9e1d2f3-..."],
  "issuedDate": "2025-10-08",
  "dueDate": "2025-10-22",
  "taxRate": 0.18
}
```

**CSV import columns (shipments)**
```
tracking_number, sender_name, sender_phone, receiver_name, receiver_phone, destination, shipment_date, weight_kg, service_type
```

---

## 19. Next Steps (recommended immediate actions)
1. Create repository and add README with tech stack and setup instructions.
2. Initialize backend skeleton with Express, prisma (or chosen ORM), and auth scaffolding.
3. Create DB migrations and seed minimal sample data.
4. Scaffold frontend with Vite + React + Tailwind + ShadCN components.
5. Implement Sprint 1 (auth & users) and write tests.

---

## 20. Contact & Ownership
For any ambiguities in business logic, default to conservative behavior (reject invalid operations) and surface clear error messages to users.

---

*End of SRS & Implementation Blueprint*

