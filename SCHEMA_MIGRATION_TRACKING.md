# Schema Migration Tracking - Invoice & Ledger System

## Schema Changes Made
- Enhanced `Invoice` model with `amountPaid`, `balanceDue`, `status` enum
- Enhanced `Payment` model with `paymentType`, `customerId`, `notes`
- Replaced `ledger_entries` with `LedgerEntry` model
- Added `ledgerBalance` to `Customer` model
- Updated enums: `InvoiceStatus`, `PaymentType`, `LedgerEntryType`

## Files That Need Updates

### Backend Files (7 files)
1. `server/src/controllers/newShipmentController.js` - References shipment status
2. `server/src/services/shipmentInvoiceService.js` - Uses old InvoiceStatus values
3. `server/src/routes/shipmentInvoiceRoutes.js` - Route definitions
4. `server/src/controllers/shipmentInvoiceController.js` - Controller logic
5. `server/src/controllers/invoiceController.js` - Main invoice controller
6. `server/src/routes/paymentRoutes.js` - Payment routes
7. `server/src/controllers/paymentController.js` - Payment controller

### Frontend Files (12 files)
1. `client/src/components/NewShipmentFormComponents.jsx` - Form components
2. `client/src/pages/NewShipmentsPage.jsx` - Shipment page
3. `client/src/components/NewShipmentForm.jsx` - Main form
4. `client/src/components/ShipmentInvoicesPanel.jsx` - Invoice panel
5. `client/src/App.jsx` - Main app
6. `client/src/utils/shipmentValidation.js` - Validation logic
7. `client/src/pages/InvoicesPage.jsx` - Invoice page
8. `client/src/components/InvoiceViewer.jsx` - Invoice viewer
9. `client/src/stores/dataStore.js` - State management
10. `client/src/components/Layout.jsx` - Layout component
11. `client/src/pages/PaymentsPage.jsx` - Payments page
12. `client/src/pages/DashboardPage.jsx` - Dashboard

## Schema Issues to Fix
1. **Relation Issue**: `LedgerEntry.referenceId` needs `@unique` or change to one-to-many ✅ FIXED
2. **Enum Conflicts**: Update all references from old enum values to new ones
3. **Data Migration Warning**: `ledger_entries` table has 2 rows that will be lost
4. **Enum Values Warning**: Old enum values `[Draft,Confirmed,Paid,Posted]` still used in database

## Backward Compatibility Fixes Applied ✅
1. **User Authentication**: Fixed `req.user.sub` vs `req.user.id` compatibility in all controllers
2. **User Controllers**: Updated both Prisma and Sequelize user controllers
3. **Shipment Controller**: Fixed user ID access in shipment creation and events
4. **Payment Controller**: Fixed user ID access in payment recording
5. **Bulk Import Controller**: Fixed user ID access in bulk operations

## Migration Warnings Found
- The values [Draft,Confirmed,Paid,Posted] on the enum `InvoiceStatus` will be removed ✅ FIXED
- You are about to drop the `ledger_entries` table, which is not empty (2 rows) ✅ MIGRATED

## Migration Steps
1. ✅ Fix schema relation issues
2. ✅ Run data migration script first
3. ✅ Update all code references to new enum values
4. ✅ Run Prisma migration
5. ✅ Update backend controllers and services
6. ✅ Fix backward compatibility issues
7. ⚠️ Update frontend components and stores
8. ⚠️ Test complete flow

## Status
- [ ] Schema fixes
- [ ] Migration run
- [ ] Backend updates
- [ ] Frontend updates
- [ ] Testing
