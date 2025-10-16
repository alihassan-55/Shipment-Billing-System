// Constants
export const VOLUME_DIVISOR = 5000;

// Weight calculation utilities
export const calculateVolumetricWeight = (lengthCm, widthCm, heightCm) => {
  if (!lengthCm || !widthCm || !heightCm) return 0;
  const volume = (lengthCm * widthCm * heightCm) / VOLUME_DIVISOR;
  return Math.ceil(volume); // Round up to next integer
};

export const calculateTotalVolumeWeight = (boxes) => {
  return boxes.reduce((total, box) => {
    return total + calculateVolumetricWeight(box.lengthCm, box.widthCm, box.heightCm);
  }, 0);
};

export const calculateTotalActualWeight = (boxes) => {
  return boxes.reduce((total, box) => {
    return total + (box.actualWeightKg || 0);
  }, 0);
};

export const calculateChargedWeight = (actualWeight, volumeWeight) => {
  return Math.max(actualWeight, volumeWeight);
};

// Reference number generation
export const generateReferenceNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PREFIX-${date}-${random}`;
};

// Billing calculations
export const calculateBillingTotals = (ratePerKg, totalRate, chargedWeight, otherCharges = {}) => {
  let finalRatePerKg = ratePerKg;
  let finalTotalRate = totalRate;

  // Synchronize rates based on charged weight
  if (ratePerKg && chargedWeight > 0) {
    finalTotalRate = ratePerKg * chargedWeight;
  } else if (totalRate && chargedWeight > 0) {
    finalRatePerKg = totalRate / chargedWeight;
  }

  // Calculate other charges total
  const otherChargesTotal = Object.values(otherCharges).reduce((sum, charge) => sum + (charge || 0), 0);

  // Calculate grand total
  const grandTotal = (finalTotalRate || 0) + otherChargesTotal;

  return {
    ratePerKg: finalRatePerKg,
    totalRate: finalTotalRate,
    otherChargesTotal,
    grandTotal
  };
};

// Product invoice calculations
export const calculateProductInvoiceTotal = (items) => {
  return items.reduce((total, item) => {
    const itemTotal = (item.pieces || 0) * (item.unitValue || 0);
    return total + itemTotal;
  }, 0);
};

// Validation utilities
export const validateShipmentData = (formData, boxes, productInvoiceItems, billingData) => {
  const errors = [];

  // Required fields validation
  if (!formData.referenceNumber) errors.push('Reference Number is required');
  if (!formData.serviceProviderId) errors.push('Service Provider is required');
  if (!formData.shipperId) errors.push('Shipper is required');
  if (!formData.consigneeId) errors.push('Consignee is required');
  if (!formData.terms) errors.push('Terms is required');
  if (!['DAP', 'DDP'].includes(formData.terms)) errors.push('Terms must be DAP or DDP');

  // Box validation
  if (boxes.length === 0) errors.push('At least one box is required');
  
  boxes.forEach((box, index) => {
    if (!box.lengthCm || box.lengthCm <= 0) errors.push(`Box ${index + 1}: Length must be greater than 0`);
    if (!box.widthCm || box.widthCm <= 0) errors.push(`Box ${index + 1}: Width must be greater than 0`);
    if (!box.heightCm || box.heightCm <= 0) errors.push(`Box ${index + 1}: Height must be greater than 0`);
  });

  // VAT validation
  if (formData.hasVatNumber && !formData.vatNumber) {
    errors.push('VAT Number is required when checkbox is checked');
  }

  // Billing validation
  if (!billingData.ratePerKg && !billingData.totalRate) {
    errors.push('Either Rate per kg or Total Rate must be provided');
  }

  if (billingData.paymentMethod === 'Credit' && !billingData.customerAccountId) {
    errors.push('Customer Account is required for Credit payments');
  }

  return errors;
};

// Format utilities
export const formatWeight = (weight) => {
  return `${weight.toFixed(1)} kg`;
};

export const formatCurrency = (amount, currency = 'PKR') => {
  return `${amount.toFixed(2)} ${currency}`;
};

// API utilities
export const apiRequest = async (url, options = {}) => {
  // Get token from localStorage - Zustand persist stores it there
  const token = localStorage.getItem('auth-storage');
  let authToken = null;
  
  if (token) {
    try {
      const parsedToken = JSON.parse(token);
      authToken = parsedToken.state?.token;
    } catch (e) {
      console.error('Error parsing auth token:', e);
    }
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : ''
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Debounce utility for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
