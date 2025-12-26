# Courier Billing System: Theoretical Overview

This document provides a theoretical understanding of your application's architecture, key functionalities, and the rationale behind specific technical choices. It is designed to explain *how* things work and *why* they were built that way, without diving into line-by-line code analysis.

## 1. High-Level Architecture

Your application follows a modern **Client-Server Architecture** (specifically the PERN stack: Postgres, Express, React, Node.js), designed for scalability and separation of concerns.

### The Stack
- **Frontend (Client)**: Built with **React** (via Vite), styling with **Tailwind CSS**, and state management with **Zustand**.
- **Backend (Server)**: Built with **Node.js** and **Express**.
- **Database**: **PostgreSQL**, managed via **Prisma ORM**.
- **Storage**: **Supabase Storage** (S3 compatible) for files like PDFs.

### Why this architecture?
1.  **Separation of Concerns**: The frontend handles *presentation* (UI), while the backend handles *business logic* and *data integrity*. This allows them to be developed, tested, and scaled independently.
2.  **Type Safety & Integrity**: Using **Prisma** with PostgreSQL ensures your data follows a strict schema (structure), reducing bugs related to invalid data.
3.  **Stateless Backend**: The server doesn't store files (like generated PDFs) on its own disk. Instead, it uploads them to Cloud Storage (Supabase). This is crucial for cloud deployment (like Vercel or Render) where local files are lost when the server restarts.

---

## 2. Key Functionalities

### A. Authentication & Security
**How it works:**
The app uses **JWT (JSON Web Tokens)**. When a user logs in:
1.  The server verifies credentials and issues a signed "Token".
2.  The Frontend stores this token (using `zustand` persistence).
3.  **Interceptors**: A specialized piece of code (Ayios Interceptor) automatically attaches this token to *every single* request sent to the server.

**Why it's used:**
-   **Statelessness**: The server doesn't need to remember who is logged in (no server-side sessions). It just validates the token signature.
-   **Security**: Tokens can be expired or invalidated.
-   **User Experience**: The `persist` middleware in your store means users stay logged in even if they refresh the page.

### B. The Shipment & Invoicing Engine
This is the core business value of your system.

**1. The "Confirmation" Trigger**
Transactions usually start when a shipment is "Confirmed". The system enforces a rule: *You cannot bill for a shipment that isn't final.*

**2. Dual-Invoice System**
Your system generates TWO types of invoices for every shipment.
*   **Declared Value Invoice**: This lists the *items* inside the package and their value (e.g., "iPhone", "Laptop"). This is important for **Customs** and **Insurance**. It tells authorities *what* is being moved.
*   **Billing Invoice**: This lists the *service charges* (Freight, Fuel Surcharge, Remote Area Fee). This is what the **Customer** actually pays you.

**3. Ledger Integration**
**Why it's important:** Simply generating a PDF isn't enough for a business. The system automatically creates a **Ledger Entry** when an invoice is created.
*   **Double-Entry Tracking**: It debits the customer's account balance immediately.
*   **Automation**: No human needs to manually type "User X owes us $500" into a spreadsheet. The code does it atomically (all-or-nothing) inside a database transaction.

### C. PDF Generation Pipeline
**How it works:**
1.  **Generation**: The system uses `pdfkit` to draw the PDF programmatically (line by line, rectangle by rectangle). It doesn't use HTML-to-PDF.
2.  **Streaming**: The PDF is created in memory (RAM), not on the hard drive.
3.  **Cloud Upload**: As soon as it's generated, it's streamed directly to Supabase Storage.
4.  **Database Link**: The URL of the uploaded file is saved to the invoice record.

**Why `pdfkit` over HTML?**
*   **Precision**: HTML rendering varies by browser. `pdfkit` allows pixel-perfect control over where the text "INVOICE" appears, ensuring a professional, consistent look every time.
*   **Performance**: It is generally faster and lighter than launching a headless browser to render HTML.

---

## 3. Data Flow Example: "Confirming a Shipment"

To visualize how these pieces connect, here is the theoretical flow when a user clicks "Confirm" on a shipment:

1.  **Frontend**: Sends a request to `POST /api/shipments/:id/confirm`.
2.  **Backend Route**: Receives request, checks if the user is authorized (JWT).
3.  **Service Layer (`ShipmentInvoiceService`)**:
    *   **Validation**: "Is this shipment already confirmed?" "Does it have a customer?"
    *   **Transaction Start**: Opens a safety envelope. Everything inside must succeed, or nothing happens.
    *   **Data crunching**: Calculates totals for Declared Value and Freight charges.
    *   **DB Writes**: Saves the `Invoice` records and the `LedgerEntry`.
    *   **Transaction Commit**: Closes the envelope. The data is now permanent.
4.  **Post-Processing**:
    *   Triggers the `pdfGenerator`.
    *   Uploads result to Supabase.
    *   Updates the `pdfUrl` field in the database.
5.  **Response**: Tells the frontend "Success", and the frontend updates the UI to show the new status and download buttons.

## 4. Summary
Your application is designed to be **robust** (using transactions for money-related data), **scalable** (stateless file handling), and **secure** (token-based auth). It automates the critical bridge between "moving a box" (Shipment) and "getting paid" (Billing/Ledger), which is the heart of any logistics software.
