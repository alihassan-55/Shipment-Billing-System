// Shared state management for cross-phase functionality
// This provides unified state across all components

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiService from '../services/unifiedApiService.js';
import { useMemo } from 'react';
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
      setLoading: (entity, isLoading) => set(state => ({
        loading: { ...state.loading, [entity]: isLoading }
      })),

      setError: (entity, error) => set(state => ({
        errors: { ...state.errors, [entity]: error }
      })),

      setSelectedEntity: (entityType, entity) => set(() => ({
        [`selected${entityType}`]: entity
      })),

      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      // Data fetching actions
      fetchCustomers: async () => {
        get().setLoading('customers', true);
        try {
          const response = await apiService.getCustomers();
          if (response.success) {
            set({ customers: response.data });
            get().setError('customers', null);
          } else {
            get().setError('customers', response.error);
          }
        } catch (error) {
          get().setError('customers', error.message);
        } finally {
          get().setLoading('customers', false);
        }
      },

      fetchPayments: async (filters = {}) => {
        get().setLoading('payments', true);
        try {
          const response = await apiService.getPayments(filters);
          if (response.success) {
            set({ payments: response.data });
            get().setError('payments', null);
          } else {
            get().setError('payments', response.error);
          }
        } catch (error) {
          get().setError('payments', error.message);
        } finally {
          get().setLoading('payments', false);
        }
      },

      fetchLedgerEntries: async (filters = {}) => {
        get().setLoading('ledgerEntries', true);
        try {
          const response = await apiService.getLedgerEntries(filters);
          if (response.success) {
            set({ ledgerEntries: response.data });
            get().setError('ledgerEntries', null);
          } else {
            get().setError('ledgerEntries', response.error);
          }
        } catch (error) {
          get().setError('ledgerEntries', error.message);
        } finally {
          get().setLoading('ledgerEntries', false);
        }
      },

      fetchInvoices: async (filters = {}) => {
        get().setLoading('invoices', true);
        try {
          const response = await apiService.getInvoices(filters);
          if (response.success) {
            set({ invoices: response.data });
            get().setError('invoices', null);
          } else {
            get().setError('invoices', response.error);
          }
        } catch (error) {
          get().setError('invoices', error.message);
        } finally {
          get().setLoading('invoices', false);
        }
      },

      fetchShipments: async (filters = {}) => {
        get().setLoading('shipments', true);
        try {
          const response = await apiService.getShipments(filters);
          if (response.success) {
            set({ shipments: response.data });
            get().setError('shipments', null);
          } else {
            get().setError('shipments', response.error);
          }
        } catch (error) {
          get().setError('shipments', error.message);
        } finally {
          get().setLoading('shipments', false);
        }
      },

      // Integrated operations
      recordPaymentWithLedger: async (paymentData) => {
        const response = await apiService.recordPaymentWithLedger(paymentData);
        if (response.success) {
          // Refresh related data
          await get().fetchPayments();
          await get().fetchLedgerEntries();
          if (paymentData.customerId) {
            await get().fetchInvoices({ customerId: paymentData.customerId });
          }
        }
        return response;
      },

      updateInvoiceStatus: async (invoiceId, status) => {
        const response = await apiService.updateInvoiceStatus(invoiceId, status);
        if (response.success) {
          // Refresh invoices and ledger entries
          await get().fetchInvoices();
          await get().fetchLedgerEntries();
        }
        return response;
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
        filters: { // Reset filters to initial state
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
    ...store, // Expose all store properties and actions

    // Memoized computed values for performance
    filteredPayments: useMemo(() =>
      store.payments.filter(payment => {
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
      [store.payments, store.filters, store.searchQuery]
    ),

    filteredInvoices: useMemo(() =>
      store.invoices.filter(invoice => {
        if (store.filters.customerId && invoice.customerId !== store.filters.customerId) return false;
        if (store.filters.status && invoice.status !== store.filters.status) return false;
        if (store.searchQuery) {
          const query = store.searchQuery.toLowerCase();
          return invoice.invoiceNumber?.toLowerCase().includes(query) ||
                 invoice.customerName?.toLowerCase().includes(query);
        }
        return true;
      }),
      [store.invoices, store.filters, store.searchQuery]
    ),

    filteredLedgerEntries: useMemo(() =>
      store.ledgerEntries.filter(entry => {
        if (store.filters.customerId && entry.customerId !== store.filters.customerId) return false;
        if (store.searchQuery) {
          const query = store.searchQuery.toLowerCase();
          return entry.reference?.toLowerCase().includes(query) ||
                 entry.description?.toLowerCase().includes(query) ||
                 entry.customerName?.toLowerCase().includes(query);
        }
        return true;
      }),
      [store.ledgerEntries, store.filters.customerId, store.searchQuery]
    ),
  };
};
