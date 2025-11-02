// Shared UI components for cross-phase functionality
// These components can be used across all phases

import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatCurrency, formatDate, ENTITY_ROUTES } from '../types/integration.js';

// ===== ENTITY REFERENCE COMPONENT =====
export const EntityReference = ({ type, id, reference, className = "" }) => {
  const getReferenceStyle = (type) => {
    switch (type) {
      case 'INVOICE':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'PAYMENT':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'SHIPMENT':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'LEDGER_ENTRY':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleClick = () => {
    if (id && ENTITY_ROUTES[type]) {
      const route = ENTITY_ROUTES[type](id);
      // Navigate to the route (you can use your router here)
      console.log(`Navigate to: ${route}`);
    }
  };

  return (
    <Badge 
      className={`cursor-pointer transition-colors ${getReferenceStyle(type)} ${className}`}
      onClick={handleClick}
    >
      {reference}
    </Badge>
  );
};

// ===== FINANCIAL SUMMARY CARD =====
export const FinancialSummaryCard = ({ 
  title, 
  data, 
  showTrend = false, 
  trendDirection = 'up',
  className = "" 
}) => {
  const getTrendColor = (direction) => {
    return direction === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (direction) => {
    return direction === 'up' ? '↗' : '↘';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{formatCurrency(data)}</div>
          {showTrend && (
            <div className={`text-sm ${getTrendColor(trendDirection)}`}>
              {getTrendIcon(trendDirection)} 12%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ===== CUSTOMER SELECTOR COMPONENT =====
export const CustomerSelector = ({ 
  customers, 
  selectedCustomer, 
  onCustomerSelect, 
  showBalance = true,
  className = "" 
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Customer
      </label>
      <select
        value={selectedCustomer?.id || ''}
        onChange={(e) => {
          const customer = customers.find(c => c.id === e.target.value);
          onCustomerSelect(customer);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Choose a customer...</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name} {customer.company && `(${customer.company})`}
            {showBalance && ` - Balance: ${formatCurrency(customer.ledgerBalance)}`}
          </option>
        ))}
      </select>
    </div>
  );
};

// ===== PAYMENT METHOD SELECTOR =====
export const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodSelect, 
  className = "" 
}) => {
  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Check', label: 'Check' },
    { value: 'Online Payment', label: 'Online Payment' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Payment Method
      </label>
      <select
        value={selectedMethod || ''}
        onChange={(e) => onMethodSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select payment method...</option>
        {paymentMethods.map((method) => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ===== STATUS BADGE COMPONENT =====
export const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusStyle = (status, type) => {
    const baseStyles = {
      INVOICE: {
        'Unpaid': 'bg-red-100 text-red-800',
        'Paid': 'bg-green-100 text-green-800',
        'Add to Ledger': 'bg-orange-100 text-orange-800',
        'Partial': 'bg-yellow-100 text-yellow-800'
      },
      PAYMENT: {
        'Completed': 'bg-green-100 text-green-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Failed': 'bg-red-100 text-red-800'
      },
      SHIPMENT: {
        'Draft': 'bg-gray-100 text-gray-800',
        'CONFIRMED': 'bg-blue-100 text-blue-800',
        'In Transit': 'bg-purple-100 text-purple-800',
        'Delivered': 'bg-green-100 text-green-800'
      },
      LEDGER: {
        'Debit': 'bg-red-100 text-red-800',
        'Credit': 'bg-green-100 text-green-800'
      }
    };

    return baseStyles[type]?.[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Badge className={getStatusStyle(status, type)}>
      {status}
    </Badge>
  );
};

// ===== AMOUNT INPUT COMPONENT =====
export const AmountInput = ({ 
  value, 
  onChange, 
  label = "Amount", 
  placeholder = "0.00",
  showCurrency = true,
  className = "" 
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {showCurrency && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">Rs</span>
          </div>
        )}
        <input
          type="number"
          step="0.01"
          min="0"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className={`w-full ${showCurrency ? 'pl-10' : 'pl-3'} pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
    </div>
  );
};

// ===== DATE INPUT COMPONENT =====
export const DateInput = ({ 
  value, 
  onChange, 
  label = "Date", 
  maxDate = null,
  className = "" 
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        max={maxDate}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

// ===== TRANSACTION TABLE ROW =====
export const TransactionTableRow = ({ transaction, onView, onEdit, onDelete }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {formatDate(transaction.date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <EntityReference 
          type={transaction.type} 
          id={transaction.id} 
          reference={transaction.reference} 
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {transaction.customerName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {transaction.description}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatCurrency(transaction.amount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <StatusBadge status={transaction.status} type={transaction.type} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex space-x-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(transaction)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(transaction)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={() => onDelete(transaction)}>
              Delete
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ===== LOADING SPINNER =====
export const LoadingSpinner = ({ size = 'md', className = "" }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}></div>
  );
};

// ===== ERROR MESSAGE =====
export const ErrorMessage = ({ message, className = "" }) => {
  if (!message) return null;
  
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded ${className}`}>
      {message}
    </div>
  );
};

// ===== SUCCESS MESSAGE =====
export const SuccessMessage = ({ message, className = "" }) => {
  if (!message) return null;
  
  return (
    <div className={`bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded ${className}`}>
      {message}
    </div>
  );
};



