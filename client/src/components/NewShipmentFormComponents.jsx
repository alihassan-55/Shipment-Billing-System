import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Plus, X, Package, Calculator, User } from 'lucide-react';

const TypeaheadInput = ({
  label,
  value,
  onChange,
  onSelect,
  onCreateNew,
  suggestions = [],
  placeholder = "Type to search...",
  required = false,
  disabled = false,
  showCreateNew = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(newValue.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.personName);
    onChange(suggestion.personName);
    onSelect(suggestion);
    setIsOpen(false);
  };

  const filteredSuggestions = Array.isArray(suggestions) ? suggestions.filter(suggestion =>
    suggestion.personName.toLowerCase().includes(inputValue.toLowerCase())
  ) : [];

  return (
    <div className="relative">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>{label} {required && '*'}</Label>
      <Input
        ref={inputRef}
        id={label.toLowerCase().replace(/\s+/g, '-')}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(inputValue.length > 0)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full"
      />
      {isOpen && (filteredSuggestions.length > 0 || (showCreateNew && inputValue.length >= 2)) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium">{suggestion.personName}</div>
              <div className="text-sm text-gray-600">
                {suggestion.city} • {suggestion.phone}
              </div>
            </div>
          ))}

          {showCreateNew && inputValue.length >= 2 && filteredSuggestions.length === 0 && (
            <div
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-t border-gray-200 bg-blue-50"
              onClick={() => {
                if (onCreateNew) {
                  onCreateNew(inputValue);
                }
                setIsOpen(false);
              }}
            >
              <div className="flex items-center text-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                <span className="font-medium">Create "{inputValue}"</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BoxDimensions = ({ boxes, onBoxesChange, onDimensionsChange }) => {
  const updateBoxDimensions = (index, field, value) => {
    const newBoxes = [...boxes];
    // Use parseInt for dimensions (whole numbers), parseFloat for weight
    const numericValue = field === 'actualWeightKg' ? (parseFloat(value) || 0) : (parseInt(value) || 0);
    newBoxes[index] = { ...newBoxes[index], [field]: numericValue };
    onDimensionsChange(newBoxes);
  };

  const calculateVolumetricWeight = (length, width, height) => {
    if (!length || !width || !height) return 0;
    return Math.ceil((length * width * height) / 5000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Box Dimensions</Label>
        <div className="text-sm text-gray-600">
          Total Boxes: {boxes.length}
        </div>
      </div>

      {boxes.map((box, index) => {
        const volumetricWeight = calculateVolumetricWeight(box.lengthCm, box.widthCm, box.heightCm);

        return (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Box {index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newBoxes = boxes.filter((_, i) => i !== index);
                  onBoxesChange(newBoxes);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <Label htmlFor={`length-${index}`}>Length (cm)</Label>
                <Input
                  id={`length-${index}`}
                  type="number"
                  step="1"
                  min="0"
                  value={box.lengthCm || ''}
                  onChange={(e) => updateBoxDimensions(index, 'lengthCm', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor={`width-${index}`}>Width (cm)</Label>
                <Input
                  id={`width-${index}`}
                  type="number"
                  step="1"
                  min="0"
                  value={box.widthCm || ''}
                  onChange={(e) => updateBoxDimensions(index, 'widthCm', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor={`height-${index}`}>Height (cm)</Label>
                <Input
                  id={`height-${index}`}
                  type="number"
                  step="1"
                  min="0"
                  value={box.heightCm || ''}
                  onChange={(e) => updateBoxDimensions(index, 'heightCm', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`actual-weight-${index}`}>Actual Weight (kg)</Label>
                <Input
                  id={`actual-weight-${index}`}
                  type="number"
                  step="0.1"
                  value={box.actualWeightKg || ''}
                  onChange={(e) => updateBoxDimensions(index, 'actualWeightKg', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Volumetric Weight (kg)</Label>
                <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm">
                  {volumetricWeight}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const ProductInvoiceSection = ({ items, onItemsChange, boxes }) => {
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total
    if (field === 'pieces' || field === 'unitValue') {
      const pieces = parseFloat(newItems[index].pieces) || 0;
      const unitValue = parseFloat(newItems[index].unitValue) || 0;
      newItems[index].total = pieces * unitValue;
    }

    onItemsChange(newItems);
  };

  const addItem = () => {
    const newItem = {
      boxIndex: 1,
      description: '',
      hsCode: '',
      pieces: 1,
      unitValue: 0,
      total: 0
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (index) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const totalCustomsValue = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Invoice Information</CardTitle>
          <Button type="button" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items added yet. Click "Add Item" to start.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-1 text-left">Box No.</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">HS Code</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Pieces</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Unit Value</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Total</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-2 py-1">
                        <select
                          value={item.boxIndex}
                          onChange={(e) => updateItem(index, 'boxIndex', parseInt(e.target.value))}
                          className="border-0 p-1 h-8 w-full"
                        >
                          {boxes.map((_, boxIndex) => (
                            <option key={boxIndex + 1} value={boxIndex + 1}>
                              {boxIndex + 1}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="border-0 p-1 h-8"
                          placeholder="Product description"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <Input
                          value={item.hsCode}
                          onChange={(e) => updateItem(index, 'hsCode', e.target.value)}
                          className="border-0 p-1 h-8"
                          placeholder="HS Code"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={item.pieces}
                          onChange={(e) => updateItem(index, 'pieces', e.target.value)}
                          className="border-0 p-1 h-8"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitValue}
                          onChange={(e) => updateItem(index, 'unitValue', e.target.value)}
                          className="border-0 p-1 h-8"
                          min="0"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <div className="px-2 py-1 text-sm font-medium">
                          {item.total || 0}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="bg-gray-50 px-4 py-2 rounded-md">
                <span className="font-medium">Total Customs Value: </span>
                <span className="font-bold text-lg">{totalCustomsValue.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const BillingInvoiceSection = ({
  billingData,
  onBillingChange,
  chargedWeight,
  actualWeight,
  volumeWeight
}) => {
  const [lastEdited, setLastEdited] = useState('totalRate');
  const [calculationMode, setCalculationMode] = useState('auto'); // 'auto', 'ratePerKg', 'totalRate'

  const updateBillingData = (field, value) => {
    const newData = { ...billingData };

    // Check if field is numeric or text
    const numericFields = ['ratePerKg', 'totalRate', 'eFormCharges', 'remoteAreaCharges', 'boxCharges', 'grandTotal', 'cashAmount'];

    if (numericFields.includes(field)) {
      // Convert value to number for numeric fields
      const numericValue = parseFloat(value) || 0;
      newData[field] = numericValue;

      // Handle bidirectional rate synchronization
      if (field === 'ratePerKg' && chargedWeight > 0) {
        // Forward calculation: Rate per kg × Weight = Total rate
        newData.totalRate = numericValue * chargedWeight;
        setLastEdited('ratePerKg');
        setCalculationMode('ratePerKg');
      } else if (field === 'totalRate' && chargedWeight > 0) {
        // Backward calculation: Total rate ÷ Weight = Rate per kg
        newData.ratePerKg = numericValue / chargedWeight;
        setLastEdited('totalRate');
        setCalculationMode('totalRate');
      }

      // Calculate grand total
      const otherCharges = (newData.eFormCharges || 0) +
        (newData.remoteAreaCharges || 0) +
        (newData.boxCharges || 0);
      newData.grandTotal = (newData.totalRate || 0) + otherCharges;
    } else {
      // For non-numeric fields (like paymentMethod, customerAccountId), use value as-is
      newData[field] = value;
    }

    onBillingChange(newData);
  };

  const updateOtherCharge = (field, value) => {
    const newData = { ...billingData, [field]: parseFloat(value) || 0 };
    const otherCharges = (newData.eFormCharges || 0) +
      (newData.remoteAreaCharges || 0) +
      (newData.boxCharges || 0);
    newData.grandTotal = (newData.totalRate || 0) + otherCharges;
    onBillingChange(newData);
  };

  // Function to recalculate based on current mode
  const recalculateBasedOnMode = (mode) => {
    if (chargedWeight <= 0) return;

    const newData = { ...billingData };

    if (mode === 'ratePerKg' && billingData.ratePerKg) {
      // Calculate total rate from rate per kg
      newData.totalRate = parseFloat(billingData.ratePerKg) * chargedWeight;
    } else if (mode === 'totalRate' && billingData.totalRate) {
      // Calculate rate per kg from total rate
      newData.ratePerKg = parseFloat(billingData.totalRate) / chargedWeight;
    }

    // Recalculate grand total
    const otherCharges = (newData.eFormCharges || 0) +
      (newData.remoteAreaCharges || 0) +
      (newData.boxCharges || 0);
    newData.grandTotal = (newData.totalRate || 0) + otherCharges;

    onBillingChange(newData);
  };

  // Function to safely format numbers
  const formatNumber = (value, decimals = 2) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(decimals);
  };

  // Function to handle weight changes (recalculate if needed)
  const handleWeightChange = () => {
    if (chargedWeight > 0 && calculationMode !== 'auto') {
      recalculateBasedOnMode(calculationMode);
    }
  };

  // Effect to handle weight changes
  useEffect(() => {
    handleWeightChange();
  }, [chargedWeight]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Payment Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weight Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
          <div className="text-center">
            <div className="text-sm text-gray-600">Actual Weight</div>
            <div className="font-bold text-lg">{actualWeight} kg</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Volume Weight</div>
            <div className="font-bold text-lg">{volumeWeight} kg</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Charged Weight</div>
            <div className="font-bold text-lg text-blue-600">{chargedWeight} kg</div>
          </div>
        </div>

        {/* Calculation Mode Indicator */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-800">Calculation Mode:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${calculationMode === 'ratePerKg'
              ? 'bg-green-100 text-green-800'
              : calculationMode === 'totalRate'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
              }`}>
              {calculationMode === 'ratePerKg' ? 'Rate per kg → Total Rate' :
                calculationMode === 'totalRate' ? 'Total Rate → Rate per kg' :
                  'Auto'}
            </span>
          </div>
          <div className="text-xs text-blue-600">
            {chargedWeight > 0 ? `${chargedWeight} kg charged` : 'No weight data'}
          </div>
        </div>

        {/* Rate Input */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ratePerKg" className="flex items-center space-x-2">
              <span>Rate per kg</span>
              {calculationMode === 'ratePerKg' && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Primary</span>
              )}
            </Label>
            <Input
              id="ratePerKg"
              type="number"
              step="0.01"
              value={billingData.ratePerKg || ''}
              onChange={(e) => updateBillingData('ratePerKg', e.target.value)}
              placeholder="0.00"
              className={calculationMode === 'ratePerKg' ? 'border-green-300 bg-green-50' : ''}
            />
            {calculationMode === 'ratePerKg' && chargedWeight > 0 && (
              <p className="text-xs text-green-600 mt-1">
                → Total Rate: Rs {formatNumber(billingData.ratePerKg * chargedWeight)}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="totalRate" className="flex items-center space-x-2">
              <span>Total Rate</span>
              {calculationMode === 'totalRate' && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Primary</span>
              )}
            </Label>
            <Input
              id="totalRate"
              type="number"
              step="0.01"
              value={billingData.totalRate || ''}
              onChange={(e) => updateBillingData('totalRate', e.target.value)}
              placeholder="0.00"
              className={calculationMode === 'totalRate' ? 'border-orange-300 bg-orange-50' : ''}
            />
            {calculationMode === 'totalRate' && chargedWeight > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                → Rate per kg: Rs {formatNumber(billingData.totalRate / chargedWeight)}
              </p>
            )}
          </div>
        </div>

        {/* Quick Rate Presets */}
        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Quick Rate Presets:</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBillingData('ratePerKg', '50')}
              className="text-xs"
            >
              Rs 50/kg
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBillingData('ratePerKg', '75')}
              className="text-xs"
            >
              Rs 75/kg
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBillingData('ratePerKg', '100')}
              className="text-xs"
            >
              Rs 100/kg
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBillingData('totalRate', '500')}
              className="text-xs"
            >
              Flat Rs 500
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBillingData('totalRate', '1000')}
              className="text-xs"
            >
              Flat Rs 1000
            </Button>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Calculation Summary:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-blue-600">Rate per kg:</span>
              <span className="ml-2 font-medium">Rs {formatNumber(billingData.ratePerKg)}</span>
            </div>
            <div>
              <span className="text-blue-600">Total Rate:</span>
              <span className="ml-2 font-medium">Rs {formatNumber(billingData.totalRate)}</span>
            </div>
            <div>
              <span className="text-blue-600">Other Charges:</span>
              <span className="ml-2 font-medium">Rs {formatNumber((billingData.eFormCharges || 0) + (billingData.remoteAreaCharges || 0) + (billingData.boxCharges || 0))}</span>
            </div>
            <div>
              <span className="text-blue-600 font-bold">Grand Total:</span>
              <span className="ml-2 font-bold text-lg">Rs {formatNumber(billingData.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Calculation Help */}
        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Calculation Methods:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Rate per kg:</strong> Enter rate per kg → Total rate is calculated automatically</p>
            <p><strong>Total Rate:</strong> Enter total rate → Rate per kg is calculated automatically</p>
            <p><strong>Flat Rate:</strong> Use "Total Rate" method for fixed charges regardless of weight</p>
          </div>
        </div>

        {/* Other Charges */}
        <div>
          <Label className="text-base font-medium">Other Charges</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <Label htmlFor="eFormCharges">E-Form Charges</Label>
              <Input
                id="eFormCharges"
                type="number"
                step="0.01"
                value={billingData.eFormCharges || ''}
                onChange={(e) => updateOtherCharge('eFormCharges', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="remoteAreaCharges">Remote Area Charges</Label>
              <Input
                id="remoteAreaCharges"
                type="number"
                step="0.01"
                value={billingData.remoteAreaCharges || ''}
                onChange={(e) => updateOtherCharge('remoteAreaCharges', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="boxCharges">Box Charges</Label>
              <Input
                id="boxCharges"
                type="number"
                step="0.01"
                value={billingData.boxCharges || ''}
                onChange={(e) => updateOtherCharge('boxCharges', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex justify-end">
          <div className="bg-blue-50 px-4 py-2 rounded-md">
            <span className="font-medium">Grand Total: </span>
            <span className="font-bold text-lg text-blue-600">
              Rs {formatNumber(billingData.grandTotal)}
            </span>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <Label className="text-base font-medium">Payment Method</Label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="paymentMethod"
                value="Cash"
                checked={billingData.paymentMethod === 'Cash'}
                onChange={(e) => updateBillingData('paymentMethod', e.target.value)}
              />
              <span>Cash</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="paymentMethod"
                value="Credit"
                checked={billingData.paymentMethod === 'Credit'}
                onChange={(e) => updateBillingData('paymentMethod', e.target.value)}
              />
              <span>Credit</span>
            </label>
          </div>

          {/* Cash Amount Input (shown when Cash is selected) */}
          {billingData.paymentMethod === 'Cash' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cashAmount" className="text-sm font-medium">
                    Cash Amount Received
                  </Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    value={billingData.cashAmount || ''}
                    onChange={(e) => updateBillingData('cashAmount', e.target.value)}
                    placeholder="Enter cash received"
                    className="mt-1"
                  />
                </div>

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">Rs {formatNumber(billingData.grandTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash Received:</span>
                    <span className="font-medium text-green-600">
                      Rs {formatNumber(billingData.cashAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span className="font-medium text-gray-700">Remaining Balance:</span>
                    <span className={`font-bold ${((billingData.grandTotal || 0) - (billingData.cashAmount || 0)) > 0
                      ? 'text-orange-600'
                      : 'text-green-600'
                      }`}>
                      Rs {formatNumber(Math.max(0, (billingData.grandTotal || 0) - (billingData.cashAmount || 0)))}
                    </span>
                  </div>
                </div>

                {((billingData.grandTotal || 0) - (billingData.cashAmount || 0)) > 0 && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                    <strong>Note:</strong> Remaining Rs {formatNumber((billingData.grandTotal || 0) - (billingData.cashAmount || 0))} will be added to customer ledger
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Credit Payment Info */}
          {billingData.paymentMethod === 'Credit' && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-800">
                <strong>Entire amount (Rs {formatNumber(billingData.grandTotal || 0)}) will be added to customer ledger</strong>
              </p>
            </div>
          )}
        </div>

        {/* Customer Account (for Credit payments) */}
        {billingData.paymentMethod === 'Credit' && (
          <div>
            <Label htmlFor="customerAccountId">Customer Account</Label>
            <Input
              id="customerAccountId"
              value={billingData.customerAccountId || ''}
              onChange={(e) => updateBillingData('customerAccountId', e.target.value)}
              placeholder="Enter customer account ID"
              required
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Create Entity Modal Component
const CreateEntityModal = ({
  isOpen,
  onClose,
  onSubmit,
  entityType,
  initialName = '',
  loading = false
}) => {
  const [formData, setFormData] = useState({
    personName: initialName,
    phone: '',
    address: '',
    city: '',
    country: entityType === 'shipper' ? 'Pakistan' : '',
    email: '',
    cnic: '',
    ntn: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, personName: initialName }));
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="h-5 w-5 mr-2" />
            Create New {entityType === 'shipper' ? 'Shipper' : 'Consignee'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="personName">Person Name *</Label>
            <Input
              id="personName"
              value={formData.personName}
              onChange={(e) => handleChange('personName', e.target.value)}
              placeholder="Enter person name"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter address"
              required
            />
          </div>

          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Enter city"
              required
            />
          </div>

          {entityType === 'consignee' && (
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Enter country"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email (optional)"
            />
          </div>

          {entityType === 'shipper' && (
            <>
              <div>
                <Label htmlFor="cnic">CNIC</Label>
                <Input
                  id="cnic"
                  value={formData.cnic}
                  onChange={(e) => handleChange('cnic', e.target.value)}
                  placeholder="Enter CNIC (optional)"
                  pattern="[0-9-]{5,20}"
                  title="CNIC should contain only digits and dashes, 5-20 characters"
                />
              </div>

              <div>
                <Label htmlFor="ntn">NTN</Label>
                <Input
                  id="ntn"
                  value={formData.ntn}
                  onChange={(e) => handleChange('ntn', e.target.value)}
                  placeholder="Enter NTN (optional)"
                  pattern="[A-Za-z0-9-]{3,25}"
                  title="NTN should be alphanumeric with dashes, 3-25 characters"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export {
  TypeaheadInput,
  BoxDimensions,
  ProductInvoiceSection,
  BillingInvoiceSection,
  CreateEntityModal
};
