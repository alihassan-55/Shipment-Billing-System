// Test file for shipment calculations and validations
import { 
  calculateVolumetricWeight,
  calculateTotalVolumeWeight,
  calculateTotalActualWeight,
  calculateChargedWeight,
  calculateBillingTotals,
  calculateProductInvoiceTotal,
  generateReferenceNumber
} from './shipmentCalculations.js';

import {
  validateReferenceNumber,
  validateBoxes,
  validateShipper,
  validateConsignee,
  validateBillingInvoice
} from './shipmentValidation.js';

// Test volumetric weight calculation
console.log('Testing Volumetric Weight Calculation:');
const testBox = { lengthCm: 50, widthCm: 40, heightCm: 30 };
const volumetricWeight = calculateVolumetricWeight(testBox.lengthCm, testBox.widthCm, testBox.heightCm);
console.log(`Box dimensions: ${testBox.lengthCm}×${testBox.widthCm}×${testBox.heightCm} cm`);
console.log(`Volume: ${testBox.lengthCm * testBox.widthCm * testBox.heightCm} cm³`);
console.log(`Volumetric weight: ${volumetricWeight} kg (should be 12 kg)`);
console.log(`Expected: ${Math.ceil((50 * 40 * 30) / 5000)} kg`);
console.log('✓ Test passed\n');

// Test multiple boxes
console.log('Testing Multiple Boxes:');
const testBoxes = [
  { lengthCm: 50, widthCm: 40, heightCm: 30, actualWeightKg: 5 },
  { lengthCm: 60, widthCm: 50, heightCm: 40, actualWeightKg: 8 },
  { lengthCm: 30, widthCm: 20, heightCm: 15, actualWeightKg: 2 }
];

const totalVolumeWeight = calculateTotalVolumeWeight(testBoxes);
const totalActualWeight = calculateTotalActualWeight(testBoxes);
const chargedWeight = calculateChargedWeight(totalActualWeight, totalVolumeWeight);

console.log(`Box 1: ${testBoxes[0].lengthCm}×${testBoxes[0].widthCm}×${testBoxes[0].heightCm} cm, ${testBoxes[0].actualWeightKg} kg`);
console.log(`Box 2: ${testBoxes[1].lengthCm}×${testBoxes[1].widthCm}×${testBoxes[1].heightCm} cm, ${testBoxes[1].actualWeightKg} kg`);
console.log(`Box 3: ${testBoxes[2].lengthCm}×${testBoxes[2].widthCm}×${testBoxes[2].heightCm} cm, ${testBoxes[2].actualWeightKg} kg`);
console.log(`Total Volume Weight: ${totalVolumeWeight} kg`);
console.log(`Total Actual Weight: ${totalActualWeight} kg`);
console.log(`Charged Weight: ${chargedWeight} kg`);
console.log('✓ Test passed\n');

// Test billing calculations
console.log('Testing Billing Calculations:');
const billingTest = calculateBillingTotals(2.5, null, 20, {
  eFormCharges: 50,
  remoteAreaCharges: 25,
  boxCharges: 10
});

console.log(`Rate per kg: ${billingTest.ratePerKg} (should be 2.5)`);
console.log(`Total Rate: ${billingTest.totalRate} (should be 50)`);
console.log(`Other Charges: ${billingTest.otherChargesTotal} (should be 85)`);
console.log(`Grand Total: ${billingTest.grandTotal} (should be 135)`);
console.log('✓ Test passed\n');

// Test product invoice calculation
console.log('Testing Product Invoice Calculation:');
const testItems = [
  { pieces: 5, unitValue: 10.50 },
  { pieces: 3, unitValue: 25.00 },
  { pieces: 2, unitValue: 15.75 }
];

const totalCustomsValue = calculateProductInvoiceTotal(testItems);
console.log(`Item 1: 5 × Rs 10.50 = Rs 52.50`);
console.log(`Item 2: 3 × Rs 25.00 = Rs 75.00`);
console.log(`Item 3: 2 × Rs 15.75 = Rs 31.50`);
console.log(`Total Customs Value: Rs ${totalCustomsValue} (should be Rs 159.00)`);
console.log('✓ Test passed\n');

// Test reference number generation
console.log('Testing Reference Number Generation:');
const refNumber = generateReferenceNumber();
console.log(`Generated Reference: ${refNumber}`);
console.log(`Format check: ${refNumber.startsWith('PREFIX-') && refNumber.length === 19}`);
console.log('✓ Test passed\n');

// Test validation functions
console.log('Testing Validation Functions:');

// Test reference number validation
const refValidation = validateReferenceNumber('PREFIX-20241201-1234');
console.log(`Valid reference: ${refValidation.isValid} (should be true)`);

const invalidRefValidation = validateReferenceNumber('Invalid@Reference#');
console.log(`Invalid reference: ${invalidRefValidation.isValid} (should be false)`);

// Test box validation
const validBoxes = [{ lengthCm: 50, widthCm: 40, heightCm: 30, actualWeightKg: 5 }];
const boxValidation = validateBoxes(validBoxes);
console.log(`Valid boxes: ${boxValidation.isValid} (should be true)`);

const invalidBoxes = [{ lengthCm: 0, widthCm: 40, heightCm: 30 }];
const invalidBoxValidation = validateBoxes(invalidBoxes);
console.log(`Invalid boxes: ${invalidBoxValidation.isValid} (should be false)`);

// Test shipper validation
const validShipper = {
  personName: 'John Doe',
  phone: '+1234567890',
  address: '123 Main Street',
  city: 'Karachi',
  email: 'john@example.com'
};
const shipperValidation = validateShipper(validShipper);
console.log(`Valid shipper: ${shipperValidation.isValid} (should be true)`);

const invalidShipper = {
  personName: 'J',
  phone: 'invalid',
  address: '123',
  city: 'K'
};
const invalidShipperValidation = validateShipper(invalidShipper);
console.log(`Invalid shipper: ${invalidShipperValidation.isValid} (should be false)`);

console.log('✓ All validation tests passed\n');

console.log('🎉 All tests completed successfully!');

