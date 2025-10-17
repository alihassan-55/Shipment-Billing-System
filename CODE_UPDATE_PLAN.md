# Code Update Plan - Invoice & Ledger System

## Files to Update (Backend)

### 1. server/src/services/shipmentInvoiceService.js
**Changes needed:**
- Line 51: `shipment.status !== 'Confirmed'` → `shipment.status !== 'CONFIRMED'`
- Line 103: `status: 'Confirmed'` → `status: 'UNPAID'`
- Line 226: `status: billing.paymentMethod === 'Cash' ? 'Paid' : 'Confirmed'` → `status: billing.paymentMethod === 'Cash' ? 'PAID' : 'UNPAID'`
- Line 256: `status: 'Posted'` → `status: 'PAID'`

### 2. server/src/controllers/shipmentInvoiceController.js
**Changes needed:**
- Line 122: `const validStatuses = ['Draft', 'Confirmed', 'Paid', 'Posted'];` → `const validStatuses = ['DRAFT', 'UNPAID', 'PARTIAL', 'PAID'];`

### 3. server/src/controllers/newShipmentController.js
**Changes needed:**
- Line 34: `status = 'Draft'` → `status = 'DRAFT'`
- Line 418: `['Confirmed', 'In Transit', 'Out for Delivery']` → `['CONFIRMED', 'In Transit', 'Out for Delivery']`
- Line 420: `'Confirmed, In Transit, or Out for Delivery'` → `'CONFIRMED, In Transit, or Out for Delivery'`
- Line 472: `['Confirmed', 'In Transit', 'Out for Delivery']` → `['CONFIRMED', 'In Transit', 'Out for Delivery']`
- Line 520: `status: 'Confirmed'` → `status: 'CONFIRMED'`

### 4. server/src/controllers/invoiceController.js
**Changes needed:**
- Line 197: `status: outstanding <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'` → `status: outstanding <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID'`

### 5. server/src/controllers/paymentController.js
**Changes needed:**
- Line 42: `newStatus = 'Paid';` → `newStatus = 'PAID';`
- Line 44: `newStatus = 'Partial';` → `newStatus = 'PARTIAL';`

## Files to Update (Frontend)

### 1. client/src/components/ShipmentInvoicesPanel.jsx
**Changes needed:**
- Update status comparisons to use new enum values
- Update status display logic

### 2. client/src/pages/InvoicesPage.jsx
**Changes needed:**
- Update status badge variants
- Update status filtering logic

### 3. client/src/stores/dataStore.js
**Changes needed:**
- Update status handling in invoice operations

## Migration Steps
1. Run data migration script
2. Update backend files
3. Update frontend files
4. Test complete flow

## Status
- [x] Schema fixes
- [ ] Data migration
- [ ] Backend updates
- [ ] Frontend updates
- [ ] Testing
