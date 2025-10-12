# Courier Management System - API Endpoints

Complete API reference for Postman testing.

## Authentication
All endpoints except `/api/health` and `/api/auth/login` require `Authorization: Bearer <token>` header.

### POST /api/auth/login
Login and get JWT token.
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### POST /api/auth/logout
Logout (stateless - client deletes token).

## Users

### GET /api/users/me
Get current user profile.

### POST /api/users (Admin only)
Create new user.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "operator"
}
```

## Customers

### GET /api/customers
List customers with pagination and search.
Query params: `page`, `limit`, `search`

### POST /api/customers (Admin/Operator)
Create customer with addresses.
```json
{
  "name": "Acme Corp",
  "company": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "addresses": [
    {
      "type": "default",
      "line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    }
  ]
}
```

### GET /api/customers/:id
Get customer details with addresses and invoices.

### PUT /api/customers/:id (Admin/Operator)
Update customer details.

## Shipments

### GET /api/shipments
List shipments with filters.
Query params: `waybill`, `status`, `from`, `to`, `page`, `limit`

### POST /api/shipments (Admin/Operator)
Create shipment.
```json
{
  "senderId": "customer-uuid",
  "receiverId": "customer-uuid",
  "pickupAddressId": "address-uuid",
  "deliveryAddressId": "address-uuid",
  "weight": 5.5,
  "dimensions": "30x20x10 cm",
  "serviceType": "Express",
  "declaredValue": 100.00,
  "codAmount": 50.00,
  "expectedDelivery": "2025-01-15"
}
```

### GET /api/shipments/:id
Get shipment details with events and invoice.

### PUT /api/shipments/:id (Admin/Operator)
Update shipment details.

### POST /api/shipments/:id/events (Admin/Operator)
Add tracking event.
```json
{
  "eventType": "In Transit",
  "description": "Package picked up from sender",
  "location": "New York Hub",
  "occurredAt": "2025-01-10T10:00:00Z"
}
```

## Invoices

### GET /api/invoices
List invoices with filters.
Query params: `customerId`, `status`, `from`, `to`, `page`, `limit`

### POST /api/invoices (Admin/Accountant)
Create invoice from shipments.
```json
{
  "shipmentIds": ["shipment-uuid-1", "shipment-uuid-2"],
  "customerId": "customer-uuid",
  "issuedDate": "2025-01-10",
  "dueDate": "2025-01-24",
  "taxRate": 0.18
}
```

### GET /api/invoices/:id
Get invoice details with payment summary.

### POST /api/invoices/:id/generate-pdf (Admin/Accountant)
Generate PDF for invoice.

## Payments

### GET /api/payments
List payments with filters.
Query params: `invoiceId`, `from`, `to`, `page`, `limit`

### POST /api/payments (Admin/Accountant)
Record payment.
```json
{
  "invoiceId": "invoice-uuid",
  "paymentDate": "2025-01-15",
  "amount": 150.00,
  "method": "Bank Transfer",
  "reference": "TXN123456"
}
```

## Reports

### GET /api/reports/monthly (Admin/Accountant)
Monthly summary report.
Query params: `year`, `month`

### GET /api/reports/accounts (Admin/Accountant)
Export accounts report.
Query params: `from`, `to`, `format` (json/csv)

## Bulk Import

### POST /api/bulk-import/shipments (Admin/Operator)
Upload CSV file for bulk shipment import.
Form data: `file` (CSV file)

Expected CSV columns:
```
sender_name, sender_phone, sender_email, receiver_name, receiver_phone, receiver_email, destination, shipment_date, weight_kg, service_type, declared_value, cod_amount, pickup_address, pickup_city, pickup_state, pickup_postal, pickup_country, delivery_city, delivery_state, delivery_postal, delivery_country, expected_delivery, dimensions
```

## Sample Test Flow

1. **Login as admin:**
   ```
   POST /api/auth/login
   { "email": "admin@example.com", "password": "admin123" }
   ```

2. **Create customer:**
   ```
   POST /api/customers
   { "name": "Test Customer", "email": "test@example.com", ... }
   ```

3. **Create shipment:**
   ```
   POST /api/shipments
   { "senderId": "...", "receiverId": "...", ... }
   ```

4. **Create invoice:**
   ```
   POST /api/invoices
   { "shipmentIds": ["..."], "customerId": "..." }
   ```

5. **Record payment:**
   ```
   POST /api/payments
   { "invoiceId": "...", "amount": 150.00, "method": "Cash" }
   ```

6. **View monthly report:**
   ```
   GET /api/reports/monthly?year=2025&month=1
   ```





