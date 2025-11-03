// Shared state management for cross-phase functionality
// This provides unified state across all components

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiService from '../services/unifiedApiService.js';
import { createFinancialTransaction } from '../types/integration.js';

// Shared financial data store
export const useFinancialStore = create(
  devtools(
    (set, get) => ({
      // State
      customers: [],
      payments: [],
      ledgerEntries: [],
      invoices: [],
      shipments: [],
      
      // Loading states
      loading: {
        customers: false,
        payments: false,
        ledgerEntries: false,
        invoices: false,
        shipments: false
      },

      // Error states
      errors: {
        customers: null,
        payments: null,
        ledgerEntries: null,
        invoices: null,
        shipments: null
      },

      // Selected entities for cross-component operations
      selectedCustomer: null,
      selectedInvoice: null,
      selectedPayment: null,
      selectedShipment: null,

      // Filters and search
      filters: {
        dateRange: null,
        customerId: null,
        status: null,
        paymentMethod: null,
        amountRange: null
      },

      searchQuery: '',

      // Actions
      setLoading: (entity, loading) => set((state) => ({
        loading: { ...state.loading, [entity]: loading }
      })),

      setError: (entity, error) => set((state) => ({
        errors: { ...state.errors, [entity]: error }
      })),

      setSelectedEntity: (entityType, entity) => set((state) => ({
        [`selected${entityType}`]: entity
      })),

      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      // Data fetching actions
      fetchCustomers: async () => {
        set((state) => ({ loading: { ...state.loading, customers: true } }));
        try {
          const response = await apiService.getCustomers();
          if (response.success) {
            set({ customers: response.data, errors: { ...get().errors, customers: null } });
          } else {
            set((state) => ({ errors: { ...state.errors, customers: response.error } }));
          }
        } catch (error) {
          set((state) => ({ errors: { ...state.errors, customers: error.message } }));
        } finally {
          set((state) => ({ loading: { ...state.loading, customers: false } }));
        }
      },

      fetchPayments: async (filters = {}) => {
        set((state) => ({ loading: { ...state.loading, payments: true } }));
        try {
          const response = await apiService.getPayments(filters);
          if (response.success) {
            set({ payments: response.data, errors: { ...get().errors, payments: null } });
          } else {
            set((state) => ({ errors: { ...state.errors, payments: response.error } }));
          }
        } catch (error) {
          set((state) => ({ errors: { ...state.errors, payments: error.message } }));
        } finally {
          set((state) => ({ loading: { ...state.loading, payments: false } }));
        }
      },

      fetchLedgerEntries: async (filters = {}) => {
        set((state) => ({ loading: { ...state.loading, ledgerEntries: true } }));
        try {
          const response = await apiService.getLedgerEntries(filters);
          if (response.success) {
            set({ ledgerEntries: response.data, errors: { ...get().errors, ledgerEntries: null } });
          } else {
            set((state) => ({ errors: { ...state.errors, ledgerEntries: response.error } }));
          }
        } catch (error) {
          set((state) => ({ errors: { ...state.errors, ledgerEntries: error.message } }));
        } finally {
          set((state) => ({ loading: { ...state.loading, ledgerEntries: false } }));
        }
      },

      fetchInvoices: async (filters = {}) => {
        set((state) => ({ loading: { ...state.loading, invoices: true } }));
        try {
          const response = await apiService.getInvoices(filters);
          if (response.success) {
            set({ invoices: response.data, errors: { ...get().errors, invoices: null } }));
          } else {
            set((state) => ({ errors: { ...state.errors, invoices: response.error } }));
          }
        } catch (error) {
          set((state) => ({ errors: { ...state.errors, invoices: error.message } }));
        } finally {
          set((state) => ({ loading: { ...state.loading, invoices: false } }));
        }
      },

      fetchShipments: async (filters = {}) => {
        set((state) => ({ loading: { ...state.loading, shipments: true } }));
        try {
          const response = await apiService.getShipments(filters);
          if (response.success) {
            set({ shipments: response.data, errors: { ...get().errors, shipments: null } }));
          } else {
            set((state) => ({ errors: { ...state.errors, shipments: response.error } }));
          }
        } catch (error) {
          set((state) => ({ errors: { ...state.errors, shipments: error.message } }));
        } finally {
          set((state) => ({ loading: { ...state.loading, shipments: false } }));
        }
      },

      // Integrated operations
      recordPaymentWithLedger: async (paymentData) => {
        try {
          const response = await apiService.recordPaymentWithLedger(paymentData);
          if (response.success) {
            // Refresh related data
            await get().fetchPayments();
            await get().fetchLedgerEntries();
            if (paymentData.customerId) {
              await get().fetchInvoices({ customerId: paymentData.customerId });
            }
            return response;
          }
          return response;
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      updateInvoiceStatus: async (invoiceId, status) => {
        try {
          const response = await apiService.updateInvoiceStatus(invoiceId, status);
          if (response.success) {
            // Refresh invoices and ledger entries
            await get().fetchInvoices();
            await get().fetchLedgerEntries();
            return response;
          }
          return response;
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Utility functions
      getCustomerById: (customerId) => {
        return get().customers.find(customer => customer.id === customerId);
      },

      getPaymentsByCustomer: (customerId) => {
        return get().payments.filter(payment => payment.customerId === customerId);
      },

      getInvoicesByCustomer: (customerId) => {
        return get().invoices.filter(invoice => invoice.customerId === customerId);
      },

      getLedgerEntriesByCustomer: (customerId) => {
        return get().ledgerEntries.filter(entry => entry.customerId === customerId);
      },

      getCustomerFinancialSummary: async (customerId) => {
        try {
          const response = await apiService.getCustomerFinancialSummary(customerId);
          return response;
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Clear all data
      clearAllData: () => set({
        customers: [],
        payments: [],
        ledgerEntries: [],
        invoices: [],
        shipments: [],
        selectedCustomer: null,
        selectedInvoice: null,
        selectedPayment: null,
        selectedShipment: null,
        filters: {
          dateRange: null,
          customerId: null,
          status: null,
          paymentMethod: null,
          amountRange: null
        },
        searchQuery: ''
      })
    }),
    {
      name: 'financial-store',
      partialize: (state) => ({
        selectedCustomer: state.selectedCustomer,
        selectedInvoice: state.selectedInvoice,
        filters: state.filters,
        searchQuery: state.searchQuery
      })
    }
  )
);

// Hook for easy access to financial store
export const useFinancialData = () => {
  const store = useFinancialStore();
  return {
    ...store,
    // Computed values
    filteredPayments: store.payments.filter(payment => {
      if (store.filters.customerId && payment.customerId !== store.filters.customerId) return false;
      if (store.filters.status && payment.status !== store.filters.status) return false;
      if (store.filters.paymentMethod && payment.paymentMethod !== store.filters.paymentMethod) return false;
      if (store.searchQuery) {
        const query = store.searchQuery.toLowerCase();
        return payment.receiptNumber?.toLowerCase().includes(query) ||
               payment.customerName?.toLowerCase().includes(query) ||
               payment.invoiceNumber?.toLowerCase().includes(query);
      }
      return true;
    }),
    
    filteredInvoices: store.invoices.filter(invoice => {
      if (store.filters.customerId && invoice.customerId !== store.filters.customerId) return false;
      if (store.filters.status && invoice.status !== store.filters.status) return false;
      if (store.searchQuery) {
        const query = store.searchQuery.toLowerCase();
        return invoice.invoiceNumber?.toLowerCase().includes(query) ||
               invoice.customerName?.toLowerCase().includes(query);
      }
      return true;
    }),

    filteredLedgerEntries: store.ledgerEntries.filter(entry => {
      if (store.filters.customerId && entry.customerId !== store.filters.customerId) return false;
      if (store.searchQuery) {
        const query = store.searchQuery.toLowerCase();
        return entry.reference?.toLowerCase().includes(query) ||
               entry.description?.toLowerCase().includes(query) ||
               entry.customerName?.toLowerCase().includes(query);
      }
      return true;
    })
  };
};




