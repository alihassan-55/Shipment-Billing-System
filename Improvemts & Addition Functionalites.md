PHASE 1: GLOBAL APPLICATION CHANGES
1.1 Currency System Update
Priority: HIGH | Dependency: None | Impact: Entire Application
Tasks:

 Identify all components displaying currency (invoices, shipments, payments, ledgers, reports)
 Replace dollar ($) symbol with Rs (Pakistani Rupee)
 Update all currency formatting functions to use Rs format (e.g., Rs 1,000.00)
 Check database fields to ensure they support appropriate decimal precision
 Update all static text, labels, and placeholders showing currency
 Verify currency calculations remain accurate after changes
 Test currency display in all views (list views, detail views, forms, PDFs)

Validation:

 Visual inspection of every page that displays money
 Verify no $ symbols remain anywhere in the application
 Check printed/downloaded documents show Rs correctly


PHASE 2: SHIPMENT COMPONENT FIXES & IMPROVEMENTS
2.1 Action Options (Edit & Delete)
Priority: HIGH | Dependency: None
Tasks:

 Locate the Actions dropdown/menu in Shipment list view
 Identify why Edit option is not triggering (check event handlers, routing)
 Fix Edit functionality to open shipment in edit mode
 Populate edit form with existing shipment data
 Test save/update functionality after editing
 Identify why Delete option is not working (check API calls, permissions)
 Implement confirmation dialogue for delete action ("Are you sure you want to delete this shipment?")
 Connect delete action to backend API
 Handle successful deletion (remove from list, show success message)
 Handle deletion errors gracefully

Validation:

 Edit opens correct shipment with all fields populated
 Edited data saves correctly and updates in database
 Delete shows confirmation dialogue
 Delete removes shipment from system
 View option continues to work properly


2.2 Invoices Declared Value - Remove Unpaid Button
Priority: MEDIUM | Dependency: None
Tasks:

 Locate the "Unpaid" button appearing in corner of Declared Value section
 Understand current purpose/functionality of this button
 Remove the button from the UI component
 Ensure Declared Value field remains visible
 Verify removal doesn't break any related functionality
 Update any documentation mentioning this button

Clarification Note: Declared Value is for documentation in case of issues, not payment tracking.
Validation:

 Unpaid button no longer appears
 Declared Value field still functions normally
 Invoice documentation remains intact


2.3 Reference Value Default as Phone Number
Priority: MEDIUM | Dependency: Customer/Shipper data
Tasks:

 Identify Reference Value field in Create Shipment form
 Locate where customer/shipper phone number is stored
 Implement auto-population logic when customer is selected
 Set phone number as default value in Reference field
 Allow manual override if user wants different reference
 Test with various customer selections
 Handle cases where phone number is missing

Validation:

 When customer selected, Reference field auto-fills with phone
 User can still manually change reference if needed
 Works for all customers in database


2.4 Payment Method Radio Button Fix
Priority: HIGH | Dependency: None
Tasks:

 Locate Payment Method radio buttons in Create Shipment form
 Identify why radio buttons are not responding to clicks
 Check form state management (value binding, onChange handlers)
 Fix radio button selection functionality
 Ensure selected value is captured in form data
 Test selection persists until form submission
 Verify selected payment method saves to database

Validation:

 Radio buttons respond to clicks
 Only one option can be selected at a time
 Selected value appears in shipment record after creation


2.5 Payment Method Improvement (Cash with Partial Payment + Credit)
Priority: HIGH | Dependency: 2.4 completed
Current State: Simple radio button selection
Desired State: Cash option with partial payment support, remaining goes to credit/ledger
Tasks:

 Design new payment method structure:

Cash Option: When selected, show input field for amount received
Credit Option: When selected, no additional input (full amount on credit)


 Update UI to show conditional input field for Cash option
 Add validation for Cash amount input (must be valid number, must be ≤ total)
 Calculate remaining balance automatically: Remaining = Total - Cash Amount
 Display remaining balance clearly (e.g., "Remaining: Rs X,XXX will be added to ledger")
 Store payment method breakdown in database:

Payment Method Type: "Cash" or "Credit"
Cash Amount Received: (if Cash selected)
Credit Amount: (remaining amount if Cash < total, or full amount if Credit)


 Update shipment creation API to handle:

Full cash payment (Cash Amount = Total)
Partial cash payment (Cash Amount < Total, remaining to ledger)
Full credit payment (entire amount to ledger)


 If remaining amount > 0, automatically create ledger entry for credit portion
 Link shipment to ledger entry for tracking

UI Flow:
Payment Method:
○ Cash 
  [Selected] → Amount Received: [____] Rs
                Total Amount: Rs 5,000
                Cash Received: Rs 3,000
                → Remaining Rs 2,000 will be added to customer ledger
                
○ Credit 
  [Selected] → Entire amount (Rs 5,000) will be added to customer ledger
```

**Business Logic:**
- If Cash selected and Cash Amount = Total → Payment complete, no ledger entry
- If Cash selected and Cash Amount < Total → Cash recorded, remaining to ledger as credit
- If Credit selected → Full amount to ledger as credit

**Validation:**
- [ ] Cash option shows amount input field
- [ ] Credit option hides amount input field
- [ ] Cash amount validation works (positive number, ≤ total)
- [ ] Remaining calculation displays correctly
- [ ] Partial payments create ledger entries for remaining amount
- [ ] Payment data saves properly with breakdown
- [ ] Full cash payments don't create ledger entries
- [ ] Credit payments create full ledger entry

---

## PHASE 3: INVOICE COMPONENT FIXES & IMPROVEMENTS

### 3.1 Remove "Create Invoice from Shipment" Button
**Priority: LOW** | **Dependency: None**

**Tasks:**
- [ ] Locate "Create Invoice from Shipment" button in Invoice component
- [ ] Remove button from UI
- [ ] Remove associated click handler/function
- [ ] Verify removal doesn't break invoice creation workflow
- [ ] Update any documentation mentioning this feature

**Validation:**
- [ ] Button no longer visible
- [ ] Invoice creation still works through other methods
- [ ] No broken links or console errors

---

### 3.2 Remove View Button from Actions
**Priority: LOW** | **Dependency: None**

**Tasks:**
- [ ] Locate View button in Invoice Actions dropdown/menu
- [ ] Remove View option from actions list
- [ ] Ensure other action options (Download) remain functional
- [ ] Test actions menu still displays correctly

**Validation:**
- [ ] View button no longer appears in actions
- [ ] Other action buttons still work
- [ ] UI looks clean without View option

---

### 3.3 Fix Download Button & Link to PDF
**Priority: HIGH** | **Dependency: None**

**Tasks:**
- [ ] Locate Download button in Invoice Actions
- [ ] Identify current issue (not responding, no PDF generated, etc.)
- [ ] Implement or fix PDF generation functionality
- [ ] Create PDF template with all invoice details (customer, items, amounts, Rs currency)
- [ ] Link Download button to PDF generation function
- [ ] Ensure PDF downloads to user's device
- [ ] Include proper filename (e.g., "Invoice_12345.pdf")
- [ ] Test PDF displays correctly with all data

**PDF Content Requirements:**
- Invoice number and date
- Customer/Shipper details
- Shipment details
- Line items with quantities and amounts in Rs
- Payment status
- Total amount in Rs

**Validation:**
- [ ] Download button triggers PDF generation
- [ ] PDF downloads successfully
- [ ] PDF contains all invoice information
- [ ] PDF formatting is clean and professional
- [ ] Currency displays as Rs

---

### 3.4 Payment Status Options with Manual Control
**Priority: HIGH** | **Dependency: None**

**Current State:** Basic payment status  
**Desired State:** Three distinct payment status options that can be changed manually OR automatically through payment recording

**Tasks:**
- [ ] Update Invoice data model to support new payment status values
- [ ] Add Payment Status field to invoice with three options:
  - **Unpaid**: Invoice generated but no payment received
  - **Paid**: Full payment received
  - **Add to Ledger**: Payment to be tracked in customer ledger
  
- [ ] Create dropdown or radio buttons for status selection in invoice form
- [ ] Allow manual status changes:
  - [ ] Add "Change Status" action in invoice list view
  - [ ] Create status change dialogue with dropdown
  - [ ] Log status change with date and user who made change
  - [ ] Add confirmation for status changes that affect ledger
  
- [ ] Implement automatic status updates:
  - [ ] When payment recorded and amount = invoice total → Status: "Paid"
  - [ ] When payment recorded and amount < invoice total → Status: remains "Unpaid" or "Add to Ledger"
  - [ ] When "Add to Ledger" selected manually → Trigger ledger entry creation
  
- [ ] Add visual indicators for each status (colors, badges, icons):
  - Unpaid: Red badge/icon
  - Paid: Green badge/icon
  - Add to Ledger: Orange/Yellow badge/icon
  
- [ ] Update invoice list view to show status prominently
- [ ] Add filtering option to view invoices by status
- [ ] Add status change history/audit trail

**Manual Status Change Flow:**
1. User clicks "Change Status" on invoice
2. Dialogue opens with current status and dropdown for new status
3. If changing to "Add to Ledger" → Confirm and create ledger entry
4. If changing to "Paid" → Optionally record payment details
5. Save status change with timestamp and user

**Status Definitions:**
- **Unpaid**: No payment received, not in ledger
- **Paid**: Payment completed and recorded
- **Add to Ledger**: Amount added to customer's ledger for future settlement

**Validation:**
- [ ] All three status options available and selectable
- [ ] Status can be changed manually from invoice view
- [ ] Manual status changes save correctly
- [ ] Automatic status updates work when payments recorded
- [ ] Status displays properly in invoice views with visual indicators
- [ ] Filtering by status works correctly
- [ ] Status change history is tracked

---

### 3.5 Add to Ledger Function Integration
**Priority: HIGH** | **Dependency: 3.4 completed, Ledger component functional**

**Purpose:** When "Add to Ledger" status is selected (manually or automatically), create ledger entry for customer

**Tasks:**
- [ ] Detect when "Add to Ledger" status is selected (manual change or new invoice)
- [ ] Identify the customer/shipper associated with the invoice
- [ ] Create ledger entry with following details:
  - **Date**: Invoice date
  - **Reference**: Invoice number
  - **Customer Name**: From invoice
  - **Transaction Type**: Debit (amount owed to company)
  - **Debit Amount**: Invoice total in Rs
  - **Credit Amount**: 0 (no payment yet)
  - **Shipment Reference**: If linked to shipment
  - **Running Balance**: Previous balance + debit amount
  - **Details**: "Invoice #[number] added to ledger"
  
- [ ] Update customer's ledger balance automatically
- [ ] Show confirmation message: "Invoice added to [Customer Name]'s ledger"
- [ ] Create link between invoice and ledger entry (bidirectional reference)
- [ ] Prevent duplicate ledger entries:
  - [ ] Check if invoice already has ledger entry
  - [ ] If status changed from "Add to Ledger" to something else, don't remove entry
  - [ ] If changed back to "Add to Ledger", don't create duplicate
  
- [ ] Handle edge cases:
  - [ ] If invoice deleted, ask whether to keep or remove ledger entry
  - [ ] If invoice amount edited, update ledger entry accordingly

**Validation:**
- [ ] Selecting "Add to Ledger" creates ledger entry automatically
- [ ] Ledger entry contains correct invoice information
- [ ] Customer balance updates correctly
- [ ] No duplicate entries created
- [ ] Link between invoice and ledger entry works
- [ ] Entry persists even if status changed later

---

## PHASE 4: PAYMENTS COMPONENT - NEW FUNCTIONALITY

### 4.1 Record Payment Dialogue Creation
**Priority: HIGH** | **Dependency: Customer data, Invoice data, Shipment data, Ledger component**

**Purpose:** Record payments received from customers and integrate with their ledgers

**Tasks:**
- [ ] Create "Record Payment" button in Payments component (prominently placed)
- [ ] Design dialogue/modal with following fields:

**Field Structure:**

**1. Select Customer (Required)**
- [ ] Dropdown with all customers/shippers
- [ ] Search/filter functionality for long customer lists
- [ ] Display: Customer name, ID, and current balance
- [ ] Show customer's outstanding balance when selected
  
**2. Payment Related To (Optional - can select multiple or none)**
- [ ] Radio buttons or toggles:
  - Specific Invoice
  - Specific Shipment
  - General Payment (not tied to specific document)
  
- [ ] If "Specific Invoice" selected:
  - [ ] Dropdown showing customer's unpaid/partially paid invoices
  - [ ] Display invoice number, date, total amount, amount paid, remaining
  - [ ] Auto-fill payment amount with remaining invoice amount (user can change)
  
- [ ] If "Specific Shipment" selected:
  - [ ] Dropdown showing customer's shipments
  - [ ] Display shipment reference, date
  
- [ ] If "General Payment" selected:
  - [ ] No additional dropdowns, just apply to overall balance
  
**3. Date (Required)**
- [ ] Date picker with default as today's date
- [ ] Allow past dates for backdated entries
- [ ] Validation: Cannot be future date
  
**4. Amount (Required)**
- [ ] Input field with Rs currency formatting
- [ ] Validation: Must be positive number
- [ ] Display outstanding balance for reference
- [ ] If invoice selected, show warning if amount > remaining amount
- [ ] Calculate new balance after payment: `New Balance = Current Balance - Payment Amount`
- [ ] Display new balance in real-time
  
**5. Payment Method (Required)**
- [ ] Dropdown with options:
  - Cash
  - Bank Transfer
  - Check
  - Online Payment
  - Other
- [ ] If "Check" selected, add field for check number
- [ ] If "Bank Transfer" selected, add field for reference number
  
**6. Details/Notes (Optional)**
- [ ] Text area for additional notes
- [ ] Placeholder: "e.g., Payment for multiple invoices, partial payment, etc."

**7. Action Buttons**
- [ ] "Save Payment" button (primary)
- [ ] "Cancel" button (secondary)

**Save Payment Logic:**
- [ ] Validate all required fields
- [ ] Create payment record in database with all details
- [ ] Create credit entry in customer's ledger:
  - Date: Payment date
  - Reference: "Payment Receipt #[auto-generated number]"
  - Credit Amount: Payment amount
  - Invoice/Shipment reference if linked
  - Payment method in details
  
- [ ] Update customer's running balance: Balance = Balance - Payment
- [ ] If payment linked to specific invoice:
  - [ ] Update invoice's paid amount
  - [ ] If paid amount = total → Change status to "Paid"
  - [ ] If paid amount < total → Keep as "Unpaid" or "Add to Ledger"
  - [ ] Track partial payment in invoice history
  
- [ ] Show success message: "Payment of Rs [amount] recorded for [Customer Name]"
- [ ] Generate payment receipt number for reference
- [ ] Clear form and close dialogue
- [ ] Refresh payment table to show new entry

**Validation:**
- [ ] All required fields must be filled
- [ ] Amount must be positive number
- [ ] Customer must be selected
- [ ] Date cannot be in future
- [ ] Payment saves to database correctly
- [ ] Ledger entry created automatically with credit
- [ ] Customer balance updates correctly
- [ ] Invoice status updates if payment linked to invoice
- [ ] Form resets after successful submission

---

### 4.2 Payment Transaction Table
**Priority: HIGH** | **Dependency: 4.1 completed**

**Purpose:** Display all recorded payment transactions in organized table

**Tasks:**
- [ ] Create comprehensive table to display all recorded payments
- [ ] Design table with following columns:
  - **Receipt #**: Auto-generated payment receipt number
  - **Date**: Payment received date
  - **Customer Name**: Who made payment (clickable to view customer details)
  - **Invoice #**: If linked to invoice (clickable to view invoice)
  - **Shipment Ref**: If linked to shipment (clickable to view shipment)
  - **Amount**: Payment amount in Rs (formatted with commas)
  - **Payment Method**: Cash/Bank Transfer/Check/etc.
  - **Details/Notes**: Truncated with "..." if long (hover to see full)
  - **Actions**: View, Edit, Delete buttons
  
- [ ] Implement table features:
  - [ ] Sorting: Click column headers to sort (date, customer, amount)
  - [ ] Default sort: Most recent first (date descending)
  - [ ] Pagination: 20-50 records per page with page navigation
  - [ ] Row highlighting on hover
  - [ ] Responsive design for different screen sizes
  
- [ ] Add filtering options (above table):
  - [ ] Filter by Customer: Dropdown to select specific customer
  - [ ] Filter by Date Range: Start date and end date pickers
  - [ ] Filter by Payment Method: Dropdown
  - [ ] Filter by Invoice: Show only payments linked to invoices
  - [ ] "Clear Filters" button to reset
  
- [ ] Add search functionality:
  - [ ] Search bar to search by: Receipt #, Customer name, Invoice #, Shipment Ref
  - [ ] Real-time search (updates as user types)
  
- [ ] Add summary section (top of table):
  - [ ] Total Received (All Time): Rs [total]
  - [ ] Total Received (Filtered): Rs [total based on current filters]
  - [ ] Number of Transactions: [count]
  - [ ] Average Payment: Rs [average]
  
- [ ] Implement export functionality:
  - [ ] "Export" button with dropdown:
    - Export as CSV
    - Export as PDF
  - [ ] Export respects current filters/search
  - [ ] Include summary data in export
  
- [ ] Add "Record New Payment" button at top (links to 4.1 dialogue)

**Action Buttons:**

**View Action:**
- [ ] Opens read-only dialogue showing full payment details:
  - Receipt number
  - Date
  - Customer name and contact
  - Invoice/Shipment references
  - Amount in Rs
  - Payment method
  - Full details/notes
  - Link to related ledger entry
- [ ] "Close" button to dismiss
- [ ] "Edit" button in dialogue (opens edit mode)

**Edit Action:**
- [ ] Reopen "Record Payment" dialogue pre-filled with existing data
- [ ] Allow modification of:
  - Date
  - Amount (with validation - must update ledger and invoice)
  - Payment method
  - Details/notes
- [ ] Cannot change: Customer (would require deletion and new entry)
- [ ] Save changes and update:
  - Payment record
  - Ledger entry (adjust credit amount)
  - Invoice paid amount (if linked)
  - Customer balance
- [ ] Show confirmation: "Payment updated successfully"

**Delete Action:**
- [ ] Show confirmation dialogue: "Are you sure you want to delete this payment? This will also reverse the ledger entry."
- [ ] Display payment details in confirmation
- [ ] If confirmed:
  - [ ] Delete payment record
  - [ ] Reverse ledger entry (remove credit)
  - [ ] Update customer balance (add amount back)
  - [ ] Update invoice paid amount (subtract payment) if linked
  - [ ] Show success message: "Payment deleted and ledger reversed"
- [ ] If cancelled: Close dialogue, no changes

**Empty State:**
- [ ] If no payments recorded: Show friendly message
- [ ] "No payments recorded yet. Click 'Record New Payment' to get started."
- [ ] Show illustration or icon

**Validation:**
- [ ] All payments display in table correctly
- [ ] Sorting works on all sortable columns
- [ ] Filtering narrows results correctly
- [ ] Search finds relevant records
- [ ] Pagination works smoothly
- [ ] Summary calculations are accurate
- [ ] Export generates correct files
- [ ] View action shows complete information
- [ ] Edit action updates all related records properly
- [ ] Delete action reverses all changes correctly
- [ ] Actions handle errors gracefully

---

## PHASE 5: LEDGER COMPONENT FIXES & IMPROVEMENTS

### 5.1 Invoice Number as Reference
**Priority: HIGH** | **Dependency: None**

**Current State:** Unclear or incorrect references in ledger entries  
**Desired State:** Clear, specific references for all ledger entries

**Tasks:**
- [ ] Update ledger entry data model to include clear reference field
- [ ] Define reference format for different transaction types:
  - **Invoice Transactions**: "Invoice #[invoice_number]"
  - **Payment Receipts**: "Payment Receipt #[receipt_number]"
  - **Shipment Credits**: "Shipment #[shipment_reference]"
  - **Manual Adjustments**: "Adjustment #[adjustment_id]"
  - **General Entries**: Custom reference text
  
- [ ] Update all existing ledger entries to have proper references:
  - [ ] Migrate historical invoice-related entries
  - [ ] Migrate historical payment entries
  - [ ] Add references to entries missing them
  
- [ ] Update ledger display:
  - [ ] Show reference in dedicated "Reference" column
  - [ ] Make references clickable/linked to source documents
  - [ ] Format references consistently
  
- [ ] Implement click functionality:
  - [ ] Click "Invoice #123" → Opens invoice details
  - [ ] Click "Payment Receipt #456" → Opens payment details
  - [ ] Click "Shipment #789" → Opens shipment details
  
- [ ] Add reference to all new ledger entry creation:
  - [ ] When invoice added to ledger → Reference: Invoice number
  - [ ] When payment recorded → Reference: Payment receipt number
  - [ ] Ensure consistency across all entry points

**Reference Display Examples:**
```
Invoice #INV-2024-001
Payment Receipt #PAY-2024-0456
Shipment #SHP-2024-0123
Manual Adjustment #ADJ-001
```

**Validation:**
- [ ] All ledger entries have clear references
- [ ] References match correct source documents
- [ ] Clicking references opens correct document
- [ ] New entries automatically get proper references
- [ ] References are visible and readable in table

---

### 5.2 View Action in Ledger Entries - Detailed Dialogue Box
**Priority: MEDIUM** | **Dependency: 5.1 completed**

**Current State:** View action may not work or show incomplete information  
**Desired State:** View opens comprehensive dialogue with all transaction details

**Tasks:**
- [ ] Locate View action in Ledger Entries table (Actions column)
- [ ] Create detailed dialogue box that displays:

**Dialogue Layout:**

**Header:**
- [ ] Transaction Type: Debit/Credit (with colored indicator)
- [ ] Transaction Date: [Date]

**Main Information Section:**
- [ ] **Reference**: Invoice #/Payment Receipt #/etc. (clickable link)
- [ ] **Customer/Shipper Name**: Full name with ID
- [ ] **Related Shipment**: Shipment reference (if applicable, clickable)

**Financial Details:**
- [ ] **Debit Amount**: Rs [amount] (if debit transaction) - in red
- [ ] **Credit Amount**: Rs [amount] (if credit transaction) - in green
- [ ] **Balance Before Transaction**: Rs [amount]
- [ ] **Balance After Transaction**: Rs [amount] (highlighted)
- [ ] **Outstanding Balance**: Rs [remaining] (if related to invoice)

**Additional Information:**
- [ ] **Payment Method**: (if payment transaction) Cash/Bank Transfer/etc.
- [ ] **Created Date**: When entry was created
- [ ] **Created By**: User who created entry (if tracked)
- [ ] **Details/Notes**: Full text of any notes

**Related Documents Section:**
- [ ] Link to Invoice (if applicable): "View Invoice #XXX"
- [ ] Link to Payment (if applicable): "View Payment Receipt #XXX"
- [ ] Link to Shipment (if applicable): "View Shipment #XXX"

**Action Buttons:**
- [ ] "Close" button (primary)
- [ ] "Edit Entry" button (if user has permission)
- [ ] "Delete Entry" button (if user has permission, with warning)
- [ ] "Print Details" button (optional)

**Dialogue Styling:**
- [ ] Clean, organized layout with sections separated
- [ ] Labels on left, values on right (or stacked for mobile)
- [ ] Use color coding: Debits in red/orange, Credits in green
- [ ] Proper spacing and typography for readability
- [ ] Responsive design for different screen sizes

**Additional Features:**
- [ ] If transaction is part of partial payment series, show:
  - "This is payment X of Y for Invoice #[number]"
  - Link to view all payments for this invoice
  
- [ ] If balance is zero after this transaction:
  - Show badge: "Account Settled"
  
- [ ] If transaction is recent (within 24 hours):
  - Show badge: "Recent Transaction"

**Validation:**
- [ ] View action opens dialogue box
- [ ] All information displays correctly and completely
- [ ] Currency values formatted with Rs
- [ ] Links to related documents work
- [ ] Dialogue is user-friendly and professionally formatted
- [ ] Close button dismisses dialogue
- [ ] Edit/Delete buttons function if included

---

### 5.3 Customer/Shipper Personal Ledgers
**Priority: MEDIUM** | **Dependency: Customer management system, Access control**

**Purpose:** Each customer/shipper has their own ledger showing all their transactions with the company

**Clarification Applied:** 
- This is for **Customer Users/Shippers** (people who ship with you)
- Access is **internal only** (staff/admin view, customers cannot access)

**Tasks:**

**1. Ledger Architecture:**
- [ ] Ensure each customer has unique ledger identifier
- [ ] Link all transactions to specific customer ID
- [ ] Maintain running balance per customer
- [ ] Support multiple customers without cross-contamination

**2. Customer Ledger View Implementation:**
- [ ] Create dedicated "Customer Ledgers" page/section
- [ ] Display list of all customers with ledger summary:
  - Customer name
  - Total debits (what they owe)
  - Total credits (what they've paid)
  - Current balance (outstanding amount)
  - Last transaction date
  - Number of transactions
  
- [ ] Add search/filter for customer list:
  - Search by name, ID, phone
  - Filter by: Customers with outstanding balance, Cleared accounts, All customers
  - Sort by: Name, Balance (highest to lowest), Last activity
  
- [ ] Click customer name → Open their individual ledger

**3. Individual Customer Ledger Display:**
- [ ] Use same ledger table component as main ledger
- [ ] Filter to show only selected customer's transactions
- [ ] Display customer info header:
  - Customer name and contact details
  - Customer ID
  - Account opened date
  - Current outstanding balance (highlighted)
  - Total lifetime debits
  - Total lifetime credits
  
- [ ] Show transaction table with columns:
  - Date
  - Reference (Invoice/Payment/Shipment)
  - Description
  - Debit (Rs)
  - Credit (Rs)
  - Running Balance (Rs)
  - Actions (View details)
  
- [ ] Enable same functionality as main ledger:
  - Sorting by date, amount
  - Date range filtering
  - Search by reference
  - View transaction details (5.2 dialogue)
  - Export customer ledger (PDF/CSV)
  
- [ ] Add customer-specific actions:
  - "Record Payment for this Customer" button (pre-fills customer in 4.1 dialogue)
  - "View Customer Details" button
  - "View All Invoices" button
  - "View All Shipments" button
  - "Print Ledger Statement" button

**4. Navigation Implementation:**
- [ ] Add "Ledgers" menu with submenu:
  - "All Transactions" (master ledger view)
  - "Customer Ledgers" (list of customer ledgers)
  - "Ledger Reports" (optional, for summaries)
  
- [ ] Breadcrumb navigation:
  - Ledgers > Customer Ledgers > [Customer Name]
  
- [ ] Back button to return to customer list

**5. Access Control (Internal Only):**
- [ ] Implement staff/admin authentication check
- [ ] Customers cannot access ledger pages (if customer portal exists)
- [ ] Only authorized staff can view ledgers
- [ ] Optional: Role-based permissions:
  - Admin: Full access
  - Accountant: View and edit ledgers
  - Staff: View only
  - Customer: No access

**6. Ledger Statement Generation:**
- [ ] Create "Print Statement" functionality
- [ ] Generate PDF with:
  - Company header
  - Customer details
  - Date range of statement
  - Transaction table with all entries
  - Summary: Opening balance, Total debits, Total credits, Closing balance
  - Company signature area
  
- [ ] Allow date range selection for statement
- [ ] Professional formatting with company branding

**Customer Ledger Flow Example:**
```
User clicks "Ledgers" → "Customer Ledgers"
↓
Sees list of all customers with balances
↓
Clicks "Muhammad Ahmed" (Balance: Rs 15,000)
↓
Opens Muhammad Ahmed's ledger showing:
- Jan 15: Invoice #001 - Debit Rs 10,000 - Balance: Rs 10,000
- Jan 20: Payment Receipt #045 - Credit Rs 5,000 - Balance: Rs 5,000
- Feb 1: Invoice #015 - Debit Rs 20,000 - Balance: Rs 25,000
- Feb 10: Payment Receipt #067 - Credit Rs 10,000 - Balance: Rs 15,000
↓
User can record new payment, view details, or print statement
Validation:

 Each customer has separate, isolated ledger
 Customer ledgers show only that customer's transactions
 Running balance calculates correctly per customer
 Same ledger functionality works for customer-specific view
 Access control prevents unauthorized access
 Navigation between ledgers works smoothly
 Customer list shows accurate summaries
 Statement generation includes correct data
 Links to invoices/payments/shipments work from customer ledger


5.4 Automatic Ledger Recording from Payments
Priority: HIGH | Dependency: Phase 4 completed, 5.3 completed
Purpose: Ensure all payments recorded in Payment section automatically create corresponding ledger entries
Clarification Applied:

Payments can be partial (remaining goes to ledger)
Multiple payments for same invoice should all link to that invoice

Tasks:
1. Payment-to-Ledger Integration:

 Create automatic ledger entry creation function
 Trigger function whenever payment is recorded (Phase 4.1)
 Function should:

Receive payment details
Create corresponding credit entry in customer's ledger
Update running balance
Link ledger entry to payment record
Link ledger entry to invoice (if payment was for invoice)



2. Ledger Entry Structure for Payments:

 Date: Date of payment (from payment record)
 Reference: Payment Receipt #[number]
 Customer: Customer who made payment
 Transaction Type: Credit
 Credit Amount: Payment amount in Rs
 Debit Amount: 0
 Related Invoice: Invoice number (if payment for specific invoice)
 Related Shipment: Shipment reference (if applicable)




[

  Major Update 2: Changes

PDF GENERATION IMPROVEMENT - DETAILED SPECIFICATIONS
Current Issues & Solutions
Issue 1: Top Section with Logo
Current State: Green/colored top section
Desired State: Clean white top with company logo
Requirements:

 Top section should be completely white background
 Company logo placed at top (centered or left-aligned based on preference)
 Logo should be high resolution and professional
 Adequate white space around logo (padding: 20-30px top/bottom)
 Logo size: Appropriate for A4/Letter size (width: 150-200px recommended)

Implementation Notes:
- Remove green background from header
- Add company logo image file to assets
- Set background: white
- Add logo with proper dimensions
- Ensure logo displays correctly in PDF generation
```

---

### **Issue 2: Black Line Separator**
**Current State:** Green line under header  
**Desired State:** Professional black line separator

**Requirements:**
- [ ] Remove green line styling
- [ ] Add solid black horizontal line
- [ ] Line should span full width of document
- [ ] Line thickness: 2-3px (professional appearance)
- [ ] Positioned directly under logo section
- [ ] Small margin below line before "SHIPMENT RECEIPT" text (10-15px)

**Implementation Notes:**
```
- Replace green border/line with black
- Style: border-bottom: 2px solid #000000;
- Or use <hr> element styled appropriately
- Ensure line prints correctly in PDF
```

---

### **Issue 3: "SHIPMENT RECEIPT" Title Positioning**
**Current State:** Title appears directly after line  
**Desired State:** Title below black line with proper spacing

**Requirements:**
- [ ] Position "SHIPMENT RECEIPT" below black line
- [ ] Center align the title
- [ ] Font: Bold, professional (16-18pt size)
- [ ] Color: Black (#000000)
- [ ] Margin top: 15-20px from black line
- [ ] Margin bottom: 20-25px before next section

**Implementation Notes:**
```
- Text align: center
- Font weight: bold
- Font size: 18px
- Color: #000000
- Remove any green/colored background
```

---

### **Issue 4: Date and Billing Information Layout**
**Current State:** Layout unclear, not properly positioned  
**Desired State:** Date on left, Billing info on right (two-column layout)

**Requirements:**

**Left Side - Date Information:**
- [ ] Position date on left side of document
- [ ] Include following information:
  - Date label: "Date:" or "Shipment Date:"
  - Actual date in clear format (e.g., "October 18, 2025" or "18-10-2025")
  - Tracking Number/Receipt Number (if applicable)
  - Reference Number (phone number as discussed in Phase 2.3)
- [ ] Left align this section
- [ ] Use consistent font and size
- [ ] Color: Black text on white background

**Right Side - Billing Information:**
- [ ] Position billing info on right side (aligned with date section)
- [ ] Display "TOTAL BILLED AMOUNT" clearly
- [ ] Show amount in PKR format: "PKR 30,000.00"
- [ ] Right align this section
- [ ] Make amount prominent but readable (not overly large)
- [ ] Color: Black text (remove green)

**Layout Structure:**
```
[Logo - White Background]
_____________________________ (Black Line)

         SHIPMENT RECEIPT

Date: 18-10-2025              TOTAL BILLED AMOUNT
Receipt #: SHP-2024-001       PKR 30,000.00
Reference: 50343411           

[Rest of document continues below]
```

**Implementation Notes:**
```
- Use two-column flexbox or table layout
- Left column: width 50%, text-align: left
- Right column: width 50%, text-align: right
- Ensure alignment at same vertical level
- Add appropriate spacing between columns
```

---

### **Issue 5: Color Scheme - Readability**
**Current State:** Green colors used, poor readability  
**Desired State:** Professional black and white for print clarity

**Requirements:**

**Primary Colors:**
- [ ] Background: White (#FFFFFF)
- [ ] Text: Black (#000000)
- [ ] Headers: Black, bold
- [ ] Lines/Borders: Black or dark gray (#000000 or #333333)

**Remove All Green Colors:**
- [ ] Remove green from "TOTAL BILLED AMOUNT" section (currently bright green)
- [ ] Remove green from top bar
- [ ] Remove green from any other highlighted areas
- [ ] Remove green line under header

**Text Hierarchy (All in Black):**
- [ ] Main title "SHIPMENT RECEIPT": Bold, 18pt, Black
- [ ] Section headers (RECEIVER, BILLING DETAILS, etc.): Bold, 14pt, Black
- [ ] Body text: Regular, 11-12pt, Black
- [ ] Table headers: Bold, 12pt, Black, with light gray background (#F5F5F5)
- [ ] Table content: Regular, 11pt, Black

**Table Styling:**
- [ ] Table header background: Light gray (#F5F5F5) for contrast
- [ ] Table header text: Bold, Black
- [ ] Table borders: 1px solid black or dark gray
- [ ] Alternating row backgrounds: White and very light gray (#FAFAFA) for readability
- [ ] Table text: Black on white/light gray background

**Amounts and Numbers:**
- [ ] Currency amounts: Regular or semi-bold, Black
- [ ] Format: "PKR 30,000.00" (with proper comma formatting)
- [ ] Make readable but not overly emphasized
- [ ] Remove any colored backgrounds behind amounts

**Implementation Notes:**
```
General Stylesheet for PDF:
- Primary text color: #000000
- Background color: #FFFFFF
- Border color: #000000 or #333333
- Table header background: #F5F5F5
- Alternate row background: #FAFAFA
- Font: Professional sans-serif (Arial, Helvetica) or serif (Times New Roman)
- Ensure high contrast for printing
- Test print to verify readability
```

---

## COMPLETE PDF STRUCTURE SPECIFICATION

### **Final PDF Layout (Top to Bottom):**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [COMPANY LOGO]                         │
│                                                     │
├─────────────────────────────────────────────────────┤ (Black Line)
│                                                     │
│              SHIPMENT RECEIPT                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Date: 18-10-2025          TOTAL BILLED AMOUNT      │
│  Receipt #: SHP-2024-001   PKR 30,000.00           │
│  Reference: 50343411                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  RECEIVER                                          │
│  Receiver Name: Ali Ahmed                          │
│  Address: 7XVG+XJ2 Al Farwaniyah, Al Farwaniyah   │
│  Phone Number: 50343411                            │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  BILLING DETAILS                                   │
│  ┌────────────┬────────┬──────────┬──────────┐    │
│  │ITEM DESC   │WEIGHT  │DM WEIGHT │AMOUNT    │    │
│  ├────────────┼────────┼──────────┼──────────┤    │
│  │Freight 45kg│45 kg   │   ---    │PKR 30000 │    │
│  ├────────────┴────────┴──────────┼──────────┤    │
│  │                   Total:        │PKR 30000 │    │
│  └─────────────────────────────────┴──────────┘    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SHIPMENT DETAILS                                  │
│  Service: FedEx                                    │
│  Actual Weight: 45kg                               │
│  Volumetric Weight: 44kg                           │
│  Charged Weight: 45kg                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SHIPPER                                           │
│  Name: Ali                                         │
│  ID Card Number: 3460262309825                     │
│  NTN: 23508329053                                  │
│                                                     │
└─────────────────────────────────────────────────────┘

All in Black on White - Professional and Print-Ready

IMPLEMENTATION CHECKLIST
Phase 1: Header Redesign

 Remove all green styling from header
 Set header background to white (#FFFFFF)
 Add company logo to assets folder
 Implement logo in PDF template (centered or left-aligned)
 Set logo dimensions (150-200px width)
 Add padding around logo (20-30px)
 Test logo displays correctly in PDF

Phase 2: Black Line Separator

 Remove green line styling
 Add black horizontal line (2-3px solid)
 Position below logo with proper spacing
 Ensure line spans full width
 Test line prints correctly

Phase 3: Title Positioning

 Position "SHIPMENT RECEIPT" below black line
 Center align title
 Set font: Bold, 18pt, Black
 Add proper margins (15-20px top, 20-25px bottom)
 Remove any colored background

Phase 4: Two-Column Layout (Date & Billing)

 Create two-column layout structure
 Left column: Date, Receipt #, Reference
 Right column: Total Billed Amount
 Align both sections at same vertical level
 Format date clearly
 Format amount: "PKR 30,000.00"
 Test layout on different page sizes

Phase 5: Color Scheme Update

 Change all green text to black
 Change all green backgrounds to white
 Update "TOTAL BILLED AMOUNT" from green to black
 Set all section headers to black, bold
 Set all body text to black
 Update table header background to light gray (#F5F5F5)
 Update table borders to black
 Add alternating row colors (white/#FAFAFA)
 Test all colors for print readability

Phase 6: Typography & Formatting

 Set consistent font family (Arial, Helvetica, or Times New Roman)
 Set font sizes:

Title: 18pt
Section headers: 14pt
Body text: 11-12pt


 Set proper line heights for readability
 Ensure proper spacing between sections
 Format currency consistently with commas (PKR 30,000.00)

Phase 7: Testing

 Generate test PDF with all changes
 Verify logo displays correctly
 Verify black line is visible
 Verify two-column layout aligns properly
 Verify all text is black on white
 Print test PDF to check physical appearance
 Test with different amounts and data
 Verify currency formatting with various amounts
 Check alignment on A4 and Letter sizes
 Get user approval on design

Phase 8: Finalization

 Make any adjustments based on testing
 Update PDF generation code with final styles
 Document changes made
 Add logo file to repository
 Update PDF generation function
 Test in production environment
 Get final sign-off from stakeholders


ADDITIONAL RECOMMENDATIONS
Optional Enhancements:

Footer Section:

Add company contact information (address, phone, email)
Add terms and conditions (small print)
Add page numbers if multi-page


Barcode/QR Code:

Add QR code for shipment tracking
Link to online tracking page


Signature Section:

Add signature line for receiver
Add date field for receipt acknowledgment


Watermark:

Add "COPY" or "ORIGINAL" watermark if needed
Differentiate customer copy from office copy


Company Branding:

Add company tagline under logo
Ensure brand consistency




NOTES FOR DEVELOPER
PDF Generation Library Notes:

Ensure the library supports image embedding (for logo)
Verify two-column layout compatibility
Test print margins and page breaks
Ensure fonts embed correctly for consistent rendering
Consider file size optimization

Logo Specifications:

Format: PNG with transparent background (preferred) or JPG
Resolution: 300 DPI for print quality
Dimensions: 600x200px (or similar ratio)
File size: Under 500KB

Color Values Reference:
css/* Use these exact values */
--white: #FFFFFF;
--black: #000000;
--light-gray: #F5F5F5;
--very-light-gray: #FAFAFA;
--dark-gray: #333333;
Testing Checklist:

 Test on screen (PDF viewer)
 Test printed on paper (actual print test)
 Test with color printer
 Test with black & white printer
 Test readability at arm's length
 Test with different amounts of data
 Test page breaks for multi-item shipments




]