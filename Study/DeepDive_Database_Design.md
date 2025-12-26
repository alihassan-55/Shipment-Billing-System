# Database Design Masterclass: From Junior to Architect
**Goal**: To not just explain your database, but to arm you with the knowledge to **crack system design interviews** and design robust systems yourself.

---

## Part 1: The Core Concepts (Interview Favorites)
Interviews often start with "Why SQL?" or "Explain Normalization". Here is exactly how to answer using your app as the example.

### 1. Relational Theory & Normalization
**Concept**: Normalization is the process of organizing data to reduce redundancy/duplication.

*   **1NF (First Normal Form)**: *Cells should contain single values, not lists.*
    *   **Bad Example**: A `Shipment` table with a column `box_dimensions` containing `"10x10x10, 20x20x20"`. You can't query "Find all boxes > 15cm".
    *   **Your Design**: You have a separate `shipment_boxes` table. Each box is a row. This is 1NF compliant.
*   **2NF (Second Normal Form)**: *All columns must depend on the Primary Key.*
    *   **Bad Example**: In `InvoiceLineItem`, storing `ShipmentOrigin`. The Origin depends on the *Shipment*, not the *Line Item*. If you fix the Origin in the Shipment table but not the Line Item, you have conflicting data.
    *   **Your Design**: `InvoiceLineItem` only links to `Invoice`. To find the Origin, you traverse the relationship.
*   **3NF (Third Normal Form)**: *No transitive dependencies (A -> B -> C).*
    *   **Concept**: If `Customer` has `City` and `ZipCode`, and `ZipCode` determines the `City`, you technically shouldn't store both.
    *   **Reality Check**: We *do* store both (`city`, `country`). In the real world, strict 3NF is sometimes broken for performance or simplicity (Address fields are the classic exception).

### 2. ACID Transactions (The Banking Standard)
**Interview Question**: "What is ACID and why does it matter?"
*   **A - Atomicity**: "All or Nothing".
    *   **Your Code**: `prisma.$transaction`. When confirming a shipment, you create an Invoice AND a Ledger Entry. If the Ledger Entry fails, the Invoice creation is *rolled back* as if it never happened. This prevents "Ghost Invoices".
*   **C - Consistency**: The database follows the rules.
    *   **Example**: You cannot create a `Shipment` with a `customerId` that doesn't exist. The Foreign Key Constraint enforces this.
*   **I - Isolation**: Transactions don't interfere.
    *   **Scenario**: Two admins edit the same user at the exact same millisecond. Postgres handles the locking so they don't corrupt the record.
*   **D - Durability**: Once saved, it's saved. Even if the power plug is pulled 1ms later, the data is on the disk.

---

## Part 2: Postgres Superpowers (Why we use it)
Postgres is an "Object-Relational" database. It has features that beat standard SQL.

### 1. JSONB (Hybrid NoSQL)
**Feature**: You can store unstructured JSON data inside a structured SQL table.
**Your Usage**: `AuditLog.oldData` (`Json?`).
**Why?**: We don't know what fields changed. It could be `email`, could be `price`. Creating columns for `oldEmail`, `oldPrice`, `oldStatus` is impossible. JSON allows flexibility.
**Interview Tip**: "I use Postgres because it gives me the strictness of SQL for financial data (`Ledger`) but the flexibility of NoSQL for logs (`AuditLog`) via JSONB."

### 2. Indexes (The Speed Layer)
**Question**: "My query is slow. How do I fix it?"
**Answer**: "Add an Index."
*   **How it works**: Imagine a phone book. Finding "Smith" is fast because it's sorted (Indexed). Finding "The person with phone number 555-0199" is slow—you have to read *every single entry* (Full Table Scan).
*   **Your Schema**: `@unique` on `email` automatically creates an index. We should also index `shipmentId` in the `invoices` table to make looking up "Invoices for this shipment" instant.

---

## Part 3: Advanced Patterns & Pitfalls

### 1. The N+1 Problem (The Performance Killer)
**Scenario**: You want to list 50 Shipments and their Customer's name.
*   **Bad Code**:
    1.  `SELECT * FROM Shipments` (1 query).
    2.  Loop through 50 results. For each, `SELECT * FROM Customers WHERE id = ?` (50 queries).
    *   **Total**: 51 Queries.
*   **The Fix**: "Eager Loading" (Joins).
    *   **Your Code**: `prisma.shipments.findMany({ include: { Customer: true } })`.
    *   **Result**: Prisma does 1 or 2 optimized queries to fetch everything.

### 2. Money: Float vs. Decimal
**The Issue**: Computers calculate in binary. `0.1 + 0.2` often equals `0.3000000000004`.
**Your Database**: Uses `Float`.
**Interview Answer**: "In a production financial system, I would use the `DECIMAL` type (or `Int` representing cents) to avoid floating-point math errors. Currently, my app uses Float for simplicity, but I am aware of the precision risks."

### 3. Soft Deletes
**Question**: "A user deleted their account. Do we `DELETE FROM Users`?"
**Answer**: "No. We usually 'Soft Delete'."
*   **Your Implementation**: Checked `api/users`... actually, you likely set `isActive = false` or `deletedAt = timestamp`.
*   **Why**: If you hard delete a User, you might break the Shipments linked to them (Foreign Key Integrity). Soft delete keeps the data but hides it from the UI.

---

## Part 4: How to Design a Database (Step-by-Step)
If you are asked to "Design Uber" or "Design a Chat App", follow this process.

### Step 1: Identify Entities (Nouns)
*   *Write down the nouns:* "User", "Driver", "Ride", "Payment", "Car".

### Step 2: Define Relationships (Verbs)
*   *Connect them:*
    *   User *requests* a Ride (1:N).
    *   Driver *has* a Car (1:1 or 1:N).
    *   Ride *generates* a Payment (1:1).

### Step 3: Attributes (Adjectives)
*   *Describe them:*
    *   User: Name, Phone.
    *   Ride: StartLat, StartLong, EndLat, Status.

### Step 4: Refine & Normalize
*   *Check:* "Am I storing the Car Model in every Ride?" -> Yes? Move it to the Car table.

### Case Study: Your Chat Feature
1.  **Entities**: `User`, `Message`, `Conversation`.
2.  **Relationships**:
    *   User -> Messages (1:N)
    *   Conversation -> Messages (1:N)
    *   User <-> Conversation (M:N - Many Users in Many Conversations).
3.  **Bridge Table**: To handle M:N, we need a middle table `ConversationParticipants` (linking `UserId` and `ConversationId`).

---

## Summary for Interviews
1.  **Structure**: "I use Relational DBs for data integrity."
2.  **Performance**: "I use Indexes for speed and prevent N+1 queries using Joins/Includes."
3.  **Safety**: "I use Transactions (ACID) for anything involving money."
4.  **Flexibility**: "I use JSONB columns when the data schema is unpredictable."
