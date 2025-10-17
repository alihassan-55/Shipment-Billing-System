
# Task 4: Invoice & Ledger System — Comprehensive Breakdown (for Cursor Context)

## Goal
Implement a complete, connected system linking **Shipments → Invoices → Payments → Ledger** within the existing PostgreSQL backend without renaming or breaking prior APIs. This system tracks all customer financial transactions, invoices, and payment records while integrating seamlessly with the Dashboard and Shipment modules.

---

## 1. High-Level Overview

### Flow
Shipment Created → Auto Invoice Generated → Ledger Entry Added  
Payment Received → Invoice Updated → Ledger Updated  
Customer Profile → Shows Invoice + Ledger Summary

---

## 2. Database Models (PostgreSQL)

### invoices
| Column | Type | Description |
|---------|------|--------------|
| id | UUID (PK) | Unique invoice ID |
| customer_id | UUID (FK -> customers.id) | Link to customer |
| total_amount | DECIMAL(12,2) | Total invoice amount |
| amount_paid | DECIMAL(12,2) DEFAULT 0 | Total amount paid so far |
| balance_due | DECIMAL(12,2) | Generated field (total_amount - amount_paid) |
| status | VARCHAR(20) DEFAULT 'draft' | Invoice status: draft, unpaid, partial, paid |
| created_at | TIMESTAMP DEFAULT now() | Creation date |
| updated_at | TIMESTAMP DEFAULT now() | Update date |

### payments
| Column | Type | Description |
|---------|------|--------------|
| id | UUID (PK) | Unique payment record |
| invoice_id | UUID (FK -> invoices.id) | Linked invoice |
| customer_id | UUID (FK -> customers.id) | Linked customer |
| amount | DECIMAL(12,2) | Payment amount |
| payment_type | VARCHAR(30) | Cash, Bank, Online, Credit |
| notes | TEXT | Optional remarks |
| created_at | TIMESTAMP DEFAULT now() | Timestamp |

### ledger_entries
| Column | Type | Description |
|---------|------|--------------|
| id | UUID (PK) | Ledger record ID |
| customer_id | UUID (FK -> customers.id) | Linked customer |
| reference_id | UUID | Related invoice or payment |
| entry_type | VARCHAR(20) | Invoice / Payment / Adjustment |
| description | TEXT | Description of entry |
| debit | DECIMAL(12,2) DEFAULT 0 | Debit amount |
| credit | DECIMAL(12,2) DEFAULT 0 | Credit amount |
| balance_after | DECIMAL(12,2) | Running balance after transaction |
| created_at | TIMESTAMP DEFAULT now() | Timestamp |

---

## 3. Backend Functional Logic

### Invoice Generation (Triggered on Shipment Creation)
1. Check if customer has open invoice (status = 'draft' or 'unpaid').
2. If exists → Add shipment total to existing invoice.
3. If not → Create new invoice for that customer.
4. Create corresponding ledger entry:
   - type: 'Invoice'
   - description: 'Shipment X added to invoice'
   - debit = shipment amount

### Payment Recording
1. Add payment via POST /api/payments.
2. Update linked invoice:
   - `amount_paid += payment.amount`
   - `balance_due = total_amount - amount_paid`
   - `status = 'Paid'` if `balance_due == 0`, else `'Partial'`.
3. Create ledger entry:
   - type: 'Payment'
   - credit = payment.amount
4. Update `customer.ledger_balance` for quick summary lookup.

### Ledger Updates
- Each transaction appends new row in `ledger_entries`.
- Maintain running balance per customer.
- Use transactions to ensure atomic updates between invoice, payment, and ledger tables.

---

## 4. API Endpoints

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/invoices` | GET, POST, PATCH | Create and manage invoices |
| `/api/payments` | POST, GET | Record payments and update invoices |
| `/api/ledger/:customerId` | GET | Retrieve full ledger history for a customer |
| `/api/invoices/:id/summary` | GET | Fetch invoice details with payments and ledger links |

---

## 5. Frontend Components

| Component | Purpose |
|------------|----------|
| `Invoices.jsx` | List all invoices (status, total, paid, balance). |
| `InvoiceDetails.jsx` | Show invoice shipments, payments, and “Add Payment” modal. |
| `AddPaymentModal.jsx` | Allow adding payments and updating invoice status. |
| `LedgerTab.jsx` | Display chronological customer transactions with debit/credit columns. |

---

## 6. Integration Logic with Existing System

- Shipment Creation → `POST /api/shipments/create` → triggers Invoice Logic → updates Ledger.
- Dashboard → fetch total invoices, pending payments, and ledger balances.
- Customer Profile → integrates Invoice + Ledger tabs under one view.

---

## 7. Performance Practices

- Use PostgreSQL **transactions** for atomic updates.
- Add indexes:
  - `CREATE INDEX idx_customer_id ON ledger_entries(customer_id);`
  - `CREATE INDEX idx_invoice_id ON payments(invoice_id);`
- Always `.lean()` queries or pagination for large tables.
- Limit default ledger fetch size to 20 entries (with pagination).

---

## 8. Testing Workflow

1. Create new shipment for an existing customer.
2. Verify automatic invoice generation.
3. Add payment → confirm invoice updates correctly.
4. Retrieve `/api/ledger/:customerId` → check running balance accuracy.
5. Verify dashboard reflects updated revenue and pending balances.

---

## 9. Documentation Requirement

Each new file must include a 3-line doc comment at the top:
```js
// File: ledger.controller.js
// Purpose: Manage all ledger entries, linked to invoices and payments.
// Dependencies: invoices.controller.js, payments.controller.js, shipments.controller.js
```

---

## 10. Expected Outcomes
✅ Fully linked Invoice & Ledger flow.  
✅ Consistent API naming with previous system.  
✅ Accurate financial tracking for all customers.  
✅ Dashboard showing updated payments and pending invoices.
