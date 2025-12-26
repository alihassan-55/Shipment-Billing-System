# Deep Dive Module 1: The Core Foundation

This module dissects the bedrock of your application: **The Database Schema** and the **Server Entry Point**. Understanding this is like understanding the foundation and framing of a house before looking at the paint.

---

## 1. The Database Schema (`schema.prisma`)
Your database is relational (PostgreSQL), managed by **Prisma** (an ORM - Object Relational Mapper). This means we define data structures in `schema.prisma`, and Prisma generates the code to talk to the DB.

### A. The Core Trinity: Customer, Shipment, Invoice
The heart of your logic revolves around these three models.

#### `Customer` (The Entity)
*   **Role**: Represents both "Clients" (who pay you) and "Shippers" (who send packages).
*   **Key Fields**:
    *   `ledgerBalance`: This is critical. It stores the *current live balance* of the customer. It's updated transactionally every time an invoice is generated or payment is made.
    *   `personName` vs `company`: Handles both B2B and B2C logic in one table.

#### `shipments` (The Work Unit)
*   **Role**: The central record of a physical movement.
*   **Physical vs. Financial Data**:
    *   `shipment_boxes`: Represents the **Physical** reality (Length x Width x Height). Used to calculate Volumetric Weight.
    *   `product_invoice_items`: Represents the **Financial/Legal** reality (e.g., "10 iPhones @ $500"). Used for Customs and Declared Value Invoices.
    *   *Why separate them?* You might pack 50 iPhones (Items) into 2 large boxes (Physical). The system needs to know both.

#### `Invoice` vs. `shipment_invoices` (The Dual-Ledger Design)
You have two "Invoice" concepts, which is a sophisticated design choice.
1.  **`shipment_invoices`**: These are **Transaction-Level** documents.
    *   Type: `DECLARED_VALUE` (for customs) or `BILLING` (for freight charges).
    *   Linked directly to a single `shipmentId`.
2.  **`Invoice`**: This is a **Ledger-Level** document.
    *   Represents a debt owed by a `Customer`.
    *   Linked to `InvoiceLineItem`s.
    *   *Why?* A customer might have 10 shipments. You might want to combine them into one Monthly Invoice later. Having a separate `Invoice` table allows this flexibility (even if currently 1 shipment = 1 invoice).

### B. The Ledger (`LedgerEntry`)
*   **Concept**: Double-Entry Bookkeeping Lite.
*   **Function**: Every money movement has a record.
    *   `entryType`: INVOICE (Debit/You are owed money) or PAYMENT (Credit/You received money).
    *   `balanceAfter`: Snapshots the balance at that moment. Crucial for auditing "Why was my balance 500 last Tuesday?".

---

## 2. Server Architecture (`server/src/app.js`)

Your backend uses the **Express.js** framework. Think of it as an assembly line for HTTP requests.

### The "Assembly Line" (Middleware Stack)
When a request hits your server (e.g., `GET /api/shipments`), it goes through layers:

1.  **`helmet()`**: **Security Guard**. Adds HTTP headers to prevent common attacks (XSS, Clickjacking).
2.  **`cors()`**: **Receptionist**. Decides who is allowed to talk to the server.
    *   *Dev*: Allows everyone (`origin: true`).
    *   *Prod*: Strictly allows only your frontend (`process.env.CLIENT_URL`).
3.  **`express.json()`**: **Translator**. Reads the incoming raw bytes and converts them into a JavaScript Object (`req.body`).
4.  **Routes (`app.use('/api/...')`)**: **Department Managers**.
    *   If the URL starts with `/api/auth`, send it to `authRoutes`.
    *   If `/api/shipments`, send to `newShipmentRoutes`.

### The Singleton Database Client (`db/client.js`)
*   **Problem**: In development, every time you save a file, the server restarts/reloads. If you create a `new PrismaClient()` every time, you'll quickly run out of database connections (the "Too many clients" error).
*   **Solution**: You use a `globalForPrisma` variable.
    *   *Logic*: "If a client already exists in the global scope, use it. If not, create one."
    *   *Result*: You only ever have ONE active connection pool, no matter how many times the code reloads.

---

## 3. Why This Matters
*   **Data Integrity**: Separating Physical (Boxes) from Financial (Items) prevents "impossible" data states.
*   **Auditability**: The `LedgerEntry` system means you can trace every rupee.
*   **Scalability**: The Server structure breaks the app into small, manageable routes. You can add `/api/analytics` later without touching `shipments`.

---
**Next Step**: Ready to proceed to **Module 2: Authentication & Security**?
