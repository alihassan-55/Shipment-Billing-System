// Validation utilities for the new shipment system

// Constants
export const VOLUME_DIVISOR = 5000;
export const TERMS_OPTIONS = ['DAP', 'DDP'];
export const PAYMENT_METHODS = ['Cash', 'Credit'];
export const SHIPMENT_STATUSES = ['Draft', 'Confirmed', 'In Transit', 'Delivered'];

// Validation patterns
export const VALIDATION_PATTERNS = {
  referenceNumber: /^[A-Za-z0-9-_/]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  vatNumber: /^[A-Za-z0-9]+$/,
  hsCode: /^[0-9]{4,10}$/,
  numeric: /^\d+(\.\d+)?$/
};

// Validation functions
export const validateReferenceNumber = (referenceNumber) => {
  if (!referenceNumber) {
    return { isValid: false, error: 'Reference Number is required' };
  }
  
  if (!VALIDATION_PATTERNS.referenceNumber.test(referenceNumber)) {
    return { 
      isValid: false, 
      error: 'Reference Number can only contain letters, numbers, hyphens, underscores, and forward slashes' 
    };
  }
  
  return { isValid: true };
};

export const validateServiceProvider = (serviceProviderId) => {
  if (!serviceProviderId) {
    return { isValid: false, error: 'Service Provider is required' };
  }
  
  return { isValid: true };
};

export const validateTerms = (terms) => {
  if (!terms) {
    return { isValid: false, error: 'Terms is required' };
  }
  
  if (!TERMS_OPTIONS.includes(terms)) {
    return { isValid: false, error: 'Terms must be either DAP or DDP' };
  }
  
  return { isValid: true };
};

export const validateShipper = (shipper) => {
  const errors = [];
  
  if (!shipper.personName || shipper.personName.trim().length < 2) {
    errors.push('Shipper Person Name must be at least 2 characters');
  }
  
  if (!shipper.phone || !VALIDATION_PATTERNS.phone.test(shipper.phone)) {
    errors.push('Shipper Phone is required and must be valid');
  }
  
  if (!shipper.address || shipper.address.trim().length < 5) {
    errors.push('Shipper Address must be at least 5 characters');
  }
  
  if (!shipper.city || shipper.city.trim().length < 2) {
    errors.push('Shipper City must be at least 2 characters');
  }
  
  if (shipper.email && !VALIDATION_PATTERNS.email.test(shipper.email)) {
    errors.push('Shipper Email must be valid');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateConsignee = (consignee) => {
  const errors = [];
  
  if (!consignee.personName || consignee.personName.trim().length < 2) {
    errors.push('Consignee Person Name must be at least 2 characters');
  }
  
  if (!consignee.phone || !VALIDATION_PATTERNS.phone.test(consignee.phone)) {
    errors.push('Consignee Phone is required and must be valid');
  }
  
  if (!consignee.address || consignee.address.trim().length < 5) {
    errors.push('Consignee Address must be at least 5 characters');
  }
  
  if (!consignee.city || consignee.city.trim().length < 2) {
    errors.push('Consignee City must be at least 2 characters');
  }
  
  if (!consignee.country || consignee.country.trim().length < 2) {
    errors.push('Consignee Country is required');
  }
  
  if (consignee.email && !VALIDATION_PATTERNS.email.test(consignee.email)) {
    errors.push('Consignee Email must be valid');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateVATNumber = (hasVatNumber, vatNumber) => {
  if (hasVatNumber && (!vatNumber || !VALIDATION_PATTERNS.vatNumber.test(vatNumber))) {
    return { 
      isValid: false, 
      error: 'VAT Number is required and must be alphanumeric when checkbox is checked' 
    };
  }
  
  return { isValid: true };
};

export const validateBoxes = (boxes) => {
  const errors = [];
  
  if (!boxes || boxes.length === 0) {
    errors.push('At least one box is required');
    return { isValid: false, errors };
  }
  
  boxes.forEach((box, index) => {
    const boxNumber = index + 1;
    
    if (!box.lengthCm || box.lengthCm <= 0) {
      errors.push(`Box ${boxNumber}: Length must be greater than 0`);
    }
    
    if (!box.widthCm || box.widthCm <= 0) {
      errors.push(`Box ${boxNumber}: Width must be greater than 0`);
    }
    
    if (!box.heightCm || box.heightCm <= 0) {
      errors.push(`Box ${boxNumber}: Height must be greater than 0`);
    }
    
    if (box.actualWeightKg && box.actualWeightKg < 0) {
      errors.push(`Box ${boxNumber}: Actual weight cannot be negative`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateProductInvoiceItems = (items, boxes) => {
  const errors = [];
  
  if (!items || items.length === 0) {
    errors.push('At least one product invoice item is required');
    return { isValid: false, errors };
  }
  
  items.forEach((item, index) => {
    const itemNumber = index + 1;
    
    if (!item.description || item.description.trim().length < 3) {
      errors.push(`Item ${itemNumber}: Description must be at least 3 characters`);
    }
    
    if (!item.hsCode || !VALIDATION_PATTERNS.hsCode.test(item.hsCode)) {
      errors.push(`Item ${itemNumber}: HS Code must be 4-10 digits`);
    }
    
    if (!item.pieces || item.pieces < 1) {
      errors.push(`Item ${itemNumber}: Pieces must be at least 1`);
    }
    
    if (!item.unitValue || item.unitValue < 0) {
      errors.push(`Item ${itemNumber}: Unit value must be non-negative`);
    }
    
    if (item.boxIndex < 1 || item.boxIndex > boxes.length) {
      errors.push(`Item ${itemNumber}: Box index must be between 1 and ${boxes.length}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateBillingInvoice = (billingData, chargedWeight) => {
  const errors = [];
  
  if (!billingData.ratePerKg && !billingData.totalRate) {
    errors.push('Either Rate per kg or Total Rate must be provided');
  }
  
  if (billingData.ratePerKg && billingData.ratePerKg < 0) {
    errors.push('Rate per kg cannot be negative');
  }
  
  if (billingData.totalRate && billingData.totalRate < 0) {
    errors.push('Total rate cannot be negative');
  }
  
  if (billingData.eFormCharges && billingData.eFormCharges < 0) {
    errors.push('E-Form charges cannot be negative');
  }
  
  if (billingData.remoteAreaCharges && billingData.remoteAreaCharges < 0) {
    errors.push('Remote area charges cannot be negative');
  }
  
  if (billingData.boxCharges && billingData.boxCharges < 0) {
    errors.push('Box charges cannot be negative');
  }
  
  if (!PAYMENT_METHODS.includes(billingData.paymentMethod)) {
    errors.push('Payment method must be either Cash or Credit');
  }
  
  if (billingData.paymentMethod === 'Credit' && !billingData.customerAccountId) {
    errors.push('Customer Account is required for Credit payments');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Comprehensive validation for entire shipment form
export const validateShipmentForm = (formData, boxes, productInvoiceItems, billingData) => {
  const allErrors = [];
  
  // Basic validation
  const referenceValidation = validateReferenceNumber(formData.referenceNumber);
  if (!referenceValidation.isValid) allErrors.push(referenceValidation.error);
  
  const serviceProviderValidation = validateServiceProvider(formData.serviceProviderId);
  if (!serviceProviderValidation.isValid) allErrors.push(serviceProviderValidation.error);
  
  const termsValidation = validateTerms(formData.terms);
  if (!termsValidation.isValid) allErrors.push(termsValidation.error);
  
  // Shipper validation
  const shipperValidation = validateShipper(formData.shipper);
  if (!shipperValidation.isValid) allErrors.push(...shipperValidation.errors);
  
  // Consignee validation
  const consigneeValidation = validateConsignee(formData.consignee);
  if (!consigneeValidation.isValid) allErrors.push(...consigneeValidation.errors);
  
  // VAT validation
  const vatValidation = validateVATNumber(formData.hasVatNumber, formData.vatNumber);
  if (!vatValidation.isValid) allErrors.push(vatValidation.error);
  
  // Boxes validation
  const boxesValidation = validateBoxes(boxes);
  if (!boxesValidation.isValid) allErrors.push(...boxesValidation.errors);
  
  // Product invoice validation
  const productValidation = validateProductInvoiceItems(productInvoiceItems, boxes);
  if (!productValidation.isValid) allErrors.push(...productValidation.errors);
  
  // Billing validation
  const chargedWeight = calculateChargedWeight(
    calculateTotalActualWeight(boxes),
    calculateTotalVolumeWeight(boxes)
  );
  const billingValidation = validateBillingInvoice(billingData, chargedWeight);
  if (!billingValidation.isValid) allErrors.push(...billingValidation.errors);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Helper functions for calculations (re-exported from shipmentCalculations)
import { 
  calculateTotalActualWeight, 
  calculateTotalVolumeWeight, 
  calculateChargedWeight 
} from './shipmentCalculations';

// Business rule validations
export const validateBusinessRules = (shipmentData) => {
  const errors = [];
  
  // Check if shipper and consignee are different
  if (shipmentData.shipper?.personName === shipmentData.consignee?.personName) {
    errors.push('Shipper and Consignee cannot be the same person');
  }
  
  // Check if shipper country is Pakistan
  if (shipmentData.shipper?.country !== 'Pakistan') {
    errors.push('Shipper country must be Pakistan');
  }
  
  // Check reference number uniqueness (this would need to be checked against database)
  // This is handled in the backend
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format validation errors for display
export const formatValidationErrors = (errors) => {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0];
  }
  
  return `Multiple errors found:\n• ${errors.join('\n• ')}`;
};

// Real-time validation helpers
export const validateField = (fieldName, value, context = {}) => {
  switch (fieldName) {
    case 'referenceNumber':
      return validateReferenceNumber(value);
    case 'phone':
      return { 
        isValid: !value || VALIDATION_PATTERNS.phone.test(value), 
        error: 'Phone number must be valid' 
      };
    case 'email':
      return { 
        isValid: !value || VALIDATION_PATTERNS.email.test(value), 
        error: 'Email must be valid' 
      };
    case 'vatNumber':
      return validateVATNumber(context.hasVatNumber, value);
    case 'hsCode':
      return { 
        isValid: !value || VALIDATION_PATTERNS.hsCode.test(value), 
        error: 'HS Code must be 4-10 digits' 
      };
    default:
      return { isValid: true };
  }
};

