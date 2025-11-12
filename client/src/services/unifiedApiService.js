// Unified API service for cross-phase operations
// This provides consistent API calls across all components

import { createApiResponse, validateCrossReference } from '../types/integration.js';
import { useAuthStore } from '../stores/authStore.js';

class UnifiedApiService {
  constructor(baseURL = null) {
    // Use a relative URL. Vite's proxy will handle it in development, 
    // and it will be a same-origin request in production.
    this.baseURL = baseURL || '/api';
  }

  getBaseUrl(includeApiSegment = true) {
    if (includeApiSegment) return this.baseURL;
    return this.baseURL.endsWith('/api') ? this.baseURL.slice(0, -4) : this.baseURL;
  }

  // Generic API call method
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };
    
    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get("content-type");

      // Handle JSON responses
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        return createApiResponse(true, data, 'Success');
      }
      
      // Handle non-JSON error responses
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }
      
      // Handle non-JSON success responses (e.g., file downloads)
      return createApiResponse(true, response, 'Success');
    } catch (error) {
      console.error(`API Error [${config.method || 'GET'} ${endpoint}]:`, error);
      return createApiResponse(false, null, 'Request failed', error.message);
    }
  }

  getToken() {
    return useAuthStore.getState().token;
  }
  // ===== CUSTOMER OPERATIONS =====
  async getCustomers() {
    return this.makeRequest('/customers');
  }

  async getCustomer(id) {
    return this.makeRequest(`/customers/${id}`);
  }

  async getCustomerLedgerBalance(customerId) {
    return this.makeRequest(`/customers/${customerId}/ledger-balance`);
  }

  async getCustomerInvoices(customerId, status = null) {
    const endpoint = status ? 
      `/customers/${customerId}/invoices?status=${status}` : 
      `/customers/${customerId}/invoices`;
    return this.makeRequest(endpoint);
  }

  async getCustomerShipments(customerId) {
    return this.makeRequest(`/customers/${customerId}/shipments`);
  }

  // ===== PAYMENT OPERATIONS =====
  async createPayment(paymentData) {
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getPayments(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/payments?${queryParams}` : '/payments';
    return this.makeRequest(endpoint);
  }

  async getPayment(id) {
    return this.makeRequest(`/payments/${id}`);
  }

  async updatePayment(id, paymentData) {
    return this.makeRequest(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData)
    });
  }

  async deletePayment(id) {
    return this.makeRequest(`/payments/${id}`, {
      method: 'DELETE'
    });
  }

  // ===== LEDGER OPERATIONS =====
  async createLedgerEntry(ledgerData) {
    return this.makeRequest('/ledger-entries', {
      method: 'POST',
      body: JSON.stringify(ledgerData)
    });
  }

  async getLedgerEntries(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/ledger-entries?${queryParams}` : '/ledger-entries';
    return this.makeRequest(endpoint);
  }

  async getCustomerLedgerEntries(customerId, filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? 
      `/customers/${customerId}/ledger-entries?${queryParams}` : 
      `/customers/${customerId}/ledger-entries`;
    return this.makeRequest(endpoint);
  }

  async updateLedgerEntry(id, ledgerData) {
    return this.makeRequest(`/ledger-entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(ledgerData)
    });
  }

  async deleteLedgerEntry(id) {
    return this.makeRequest(`/ledger-entries/${id}`, {
      method: 'DELETE'
    });
  }

  // ===== INVOICE OPERATIONS =====
  async getInvoices(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/invoices?${queryParams}` : '/invoices';
    return this.makeRequest(endpoint);
  }

  async getInvoice(id) {
    return this.makeRequest(`/invoices/${id}`);
  }

  async updateInvoiceStatus(id, status) {
    return this.makeRequest(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async generateInvoicePDF(id) {
    return this.makeRequest(`/invoices/${id}/pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf'
      }
    });
  }

  async regenerateInvoicePDF(id) {
    return this.makeRequest(`/invoices/${id}/pdf`, {
      method: 'POST'
    });
  }

  // ===== SHIPMENT OPERATIONS =====
  async getShipments(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/shipments?${queryParams}` : '/shipments';
    return this.makeRequest(endpoint);
  }

  async getShipment(id) {
    return this.makeRequest(`/shipments/${id}`);
  }

  async getShipmentInvoices(shipmentId) {
    return this.makeRequest(`/shipment-invoices/shipments/${shipmentId}/invoices`);
  }

  async generateShipmentInvoices(shipmentId) {
    return this.makeRequest(`/shipment-invoices/shipments/${shipmentId}/generate-invoices`, {
      method: 'POST'
    });
  }

  async confirmShipment(shipmentId) {
    return this.makeRequest(`/shipment-invoices/shipments/${shipmentId}/confirm`, {
      method: 'PATCH'
    });
  }

  async updateShipmentAirwayBill(shipmentId, airwayBillNumber) {
    return this.makeRequest(`/shipments/${shipmentId}/airway-bill`, {
      method: 'PATCH',
      body: JSON.stringify({ airwayBillNumber })
    });
  }

  async deleteShipment(shipmentId) {
    return this.makeRequest(`/shipments/${shipmentId}`, {
      method: 'DELETE'
    });
  }

  // ===== CROSS-REFERENCE OPERATIONS =====
  async createCrossReference(fromEntityType, fromEntityId, toEntityType, toEntityId, referenceData = {}) {
    if (!validateCrossReference(fromEntityType, fromEntityId, toEntityType, toEntityId)) {
      throw new Error(`Invalid cross-reference: ${fromEntityType} cannot reference ${toEntityType}`);
    }

    return this.makeRequest('/cross-references', {
      method: 'POST',
      body: JSON.stringify({
        fromEntityType,
        fromEntityId,
        toEntityType,
        toEntityId,
        ...referenceData
      })
    });
  }

  async getCrossReferences(entityType, entityId) {
    return this.makeRequest(`/cross-references/${entityType}/${entityId}`);
  }

  // ===== INTEGRATED OPERATIONS =====
  async recordPaymentWithLedger(paymentData) {
    // This will create both payment and ledger entry atomically
    return this.makeRequest('/payments/with-ledger', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async updateInvoiceWithPayment(invoiceId, paymentData) {
    // This will update invoice status and create payment/ledger entries
    return this.makeRequest(`/invoices/${invoiceId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getCustomerFinancialSummary(customerId) {
    // Get comprehensive financial data for a customer
    return this.makeRequest(`/customers/${customerId}/financial-summary`);
  }

  // ===== BULK OPERATIONS =====
  async bulkUpdateInvoiceStatus(invoiceIds, status) {
    return this.makeRequest('/invoices/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify({ invoiceIds, status })
    });
  }

  async exportFinancialData(entityType, filters = {}, format = 'csv') {
    const queryParams = new URLSearchParams({ ...filters, format }).toString();
    return this.makeRequest(`/export/${entityType}?${queryParams}`);
  }
}

// Create singleton instance
const apiService = new UnifiedApiService();

export default apiService;
