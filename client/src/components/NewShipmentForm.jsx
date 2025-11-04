import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Package, Calculator, Save, X, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { debounce } from '../utils/shipmentCalculations';
import { getApiUrl } from '../utils/apiConfig';
import { 
  TypeaheadInput, 
  BoxDimensions, 
  ProductInvoiceSection, 
  BillingInvoiceSection,
  CreateEntityModal
} from './NewShipmentFormComponents';

const NewShipmentForm = ({ shipment, onSubmit, onCancel, user }) => {
  const { token } = useAuthStore();
  const isEditMode = !!shipment;
  
  // Form state
  const [formData, setFormData] = useState({
    referenceNumber: '',
    serviceProviderId: '',
    customerId: '', // Changed from shipperId to customerId
    consigneeId: '',
    terms: 'DAP',
    actualWeightKg: 0,
    hasVatNumber: false,
    vatNumber: '',
    status: 'Draft'
  });

  // Related data state
  const [shippers, setShippers] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [selectedConsignee, setSelectedConsignee] = useState(null);

  // Dynamic sections state
  const [boxes, setBoxes] = useState([]);
  const [productInvoiceItems, setProductInvoiceItems] = useState([]);
  const [billingData, setBillingData] = useState({
    ratePerKg: null,
    totalRate: null,
    eFormCharges: 0,
    remoteAreaCharges: 0,
    boxCharges: 0,
    grandTotal: 0,
    paymentMethod: 'Cash',
    cashAmount: 0,
    customerAccountId: ''
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [searchingShippers, setSearchingShippers] = useState(false);
  const [searchingConsignees, setSearchingConsignees] = useState(false);
  
  // Create modal states
  const [showCreateShipperModal, setShowCreateShipperModal] = useState(false);
  const [showCreateConsigneeModal, setShowCreateConsigneeModal] = useState(false);
  const [createModalLoading, setCreateModalLoading] = useState(false);
  const [pendingEntityName, setPendingEntityName] = useState('');

  // Auto-populate reference number with customer phone number when selected
  useEffect(() => {
    if (selectedShipper?.phone && !isEditMode) {
      // Use customer phone number as reference
      setFormData(prev => ({
        ...prev,
        referenceNumber: selectedShipper.phone
      }));
    } else if (!formData.referenceNumber && !selectedShipper?.phone && !isEditMode) {
      // Fallback to generated reference if no phone
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setFormData(prev => ({
        ...prev,
        referenceNumber: `PREFIX-${date}-${random}`
      }));
    }
  }, [selectedShipper?.phone, isEditMode]);

  // Load service providers
  useEffect(() => {
    const loadServiceProviders = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/service-providers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setServiceProviders(data);
        }
      } catch (error) {
        console.error('Error loading service providers:', error);
      }
    };

    loadServiceProviders();
  }, []);

  // Populate form when editing an existing shipment
  useEffect(() => {
    if (isEditMode && shipment) {
      // Set form data
      setFormData({
        referenceNumber: shipment.referenceNumber || '',
        serviceProviderId: shipment.serviceProviderId || '',
        customerId: shipment.customerId || '',
        consigneeId: shipment.consigneeId || '',
        terms: shipment.terms || 'DAP',
        actualWeightKg: shipment.actualWeightKg || 0,
        hasVatNumber: !!shipment.vatNumber,
        vatNumber: shipment.vatNumber || '',
        status: shipment.status || 'Draft'
      });

      // Set shipper if exists
      if (shipment.Customer) {
        setSelectedShipper(shipment.Customer);
      }

      // Set consignee if exists
      if (shipment.consignees) {
        setSelectedConsignee(shipment.consignees);
      }

      // Set boxes if they exist
      if (shipment.shipment_boxes && shipment.shipment_boxes.length > 0) {
        const loadedBoxes = shipment.shipment_boxes.map(box => ({
          lengthCm: box.lengthCm || 0,
          widthCm: box.widthCm || 0,
          heightCm: box.heightCm || 0,
          actualWeightKg: box.actualWeightKg || 0
        }));
        setBoxes(loadedBoxes);
      }

      // Set product invoice items if they exist
      if (shipment.product_invoice_items && shipment.product_invoice_items.length > 0) {
        const loadedItems = shipment.product_invoice_items.map(item => ({
          description: item.description || '',
          hsCode: item.hsCode || '',
          pieces: item.pieces || 0,
          unitValue: item.unitValue || 0
        }));
        setProductInvoiceItems(loadedItems);
      }

      // Set billing data if exists
      if (shipment.billing_invoices) {
        const billing = shipment.billing_invoices;
        setBillingData({
          ratePerKg: billing.ratePerKg || 0,
          totalRate: billing.totalRate || 0,
          eFormCharges: billing.eFormCharges || 0,
          remoteAreaCharges: billing.remoteAreaCharges || 0,
          boxCharges: billing.boxCharges || 0,
          grandTotal: billing.grandTotal || 0,
          paymentMethod: billing.paymentMethod || 'Cash',
          cashAmount: billing.cashAmount || 0,
          customerAccountId: billing.customerAccountId || ''
        });
      }
    }
  }, [isEditMode, shipment]);

  // Search shippers by name (existing functionality)
  const searchShippers = async (query) => {
    if (query.length < 2) {
      setShippers([]);
      return;
    }

    setSearchingShippers(true);
    try {
      console.log('Searching shippers with query:', query);
      const response = await fetch(`http://localhost:3001/api/shippers?query=${encodeURIComponent(query)}&type=shipper`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Shippers found:', data);
        console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
        // Handle both array and object with customers property
        const shippers = Array.isArray(data) ? data : (data.customers || []);
        setShippers(shippers);
      } else {
        console.error('Failed to search shippers:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error searching shippers:', error);
    } finally {
      setSearchingShippers(false);
    }
  };

  // Search shippers by phone number (Task 3)
  const searchShippersByPhone = async (phone) => {
    if (!phone || phone.length < 3) {
      return null;
    }

    try {
      console.log('Searching shippers by phone:', phone);
      const url = `http://localhost:3001/api/shippers/search-by-phone?phone=${encodeURIComponent(phone)}`;
      console.log('API URL being called:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Phone search result:', data);
        return data;
      } else {
        console.error('Failed to search shippers by phone:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error searching shippers by phone:', error);
      return null;
    }
  };

  // Search consignees
  const searchConsignees = async (query) => {
    if (query.length < 2) {
      setConsignees([]);
      return;
    }

    setSearchingConsignees(true);
    try {
        const response = await fetch(`http://localhost:3001/api/consignees?query=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      if (response.ok) {
        const data = await response.json();
        setConsignees(data);
      }
    } catch (error) {
      console.error('Error searching consignees:', error);
    } finally {
      setSearchingConsignees(false);
    }
  };

  // Handle shipper selection
  const handleShipperSelect = (shipper) => {
    setSelectedShipper(shipper);
    setFormData(prev => ({ ...prev, customerId: shipper.id })); // Changed from shipperId to customerId
  };

  // Debounced phone search function
  const debouncedPhoneSearch = useMemo(
    () => debounce(async (phone) => {
      console.log('Debounced phone search for:', phone);
      if (phone && phone.length >= 3) {
        const result = await searchShippersByPhone(phone);
        if (result && result.found) {
          // Auto-fill shipper information
          const shipper = result.shipper;
          setSelectedShipper({
            id: shipper.id,
            personName: shipper.personName,
            phone: shipper.phone,
            address: shipper.address,
            city: shipper.city,
            country: shipper.country,
            email: shipper.email,
            cnic: shipper.cnic,
            ntn: shipper.ntn
          });
          setFormData(prev => ({ ...prev, customerId: shipper.id }));
          console.log('Auto-filled shipper from phone:', shipper);
        } else {
          console.log('No existing shipper found for phone:', phone);
        }
      }
    }, 500),
    []
  );

  // Handle phone number input (Task 3)
  const handlePhoneChange = (phone) => {
    console.log('Phone changed to:', phone);
    // Update the selected shipper phone
    setSelectedShipper(prev => ({ ...(prev ?? {}), phone }));
    
    // Set reference number to phone number (or clear if phone is empty)
    if (phone && phone.trim()) {
      setFormData(prev => ({ ...prev, referenceNumber: phone }));
    } else {
      // If phone is cleared, generate a new reference number
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setFormData(prev => ({ ...prev, referenceNumber: `PREFIX-${date}-${random}` }));
    }
    
    // Trigger debounced search
    debouncedPhoneSearch(phone);
  };

  // Handle consignee selection
  const handleConsigneeSelect = (consignee) => {
    setSelectedConsignee(consignee);
    setFormData(prev => ({ ...prev, consigneeId: consignee.id }));
  };

  // Handle creating new shipper
  const handleCreateShipper = (name) => {
    setPendingEntityName(name);
    setShowCreateShipperModal(true);
  };

  // Handle creating new consignee
  const handleCreateConsignee = (name) => {
    setPendingEntityName(name);
    setShowCreateConsigneeModal(true);
  };

  // Create new shipper
  const createShipper = async (shipperData) => {
    setCreateModalLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/shippers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shipperData)
      });

      if (response.ok) {
        const newShipper = await response.json();
        setSelectedShipper(newShipper);
        setFormData(prev => ({ ...prev, customerId: newShipper.id })); // Changed from shipperId to customerId
        // Ensure reference number is set to phone number (Task 3)
        if (newShipper.phone) {
          setFormData(prev => ({ ...prev, referenceNumber: newShipper.phone }));
        }
        setShowCreateShipperModal(false);
        setPendingEntityName('');
      } else {
        alert('Failed to create shipper');
      }
    } catch (error) {
      console.error('Error creating shipper:', error);
      alert('Error creating shipper');
    } finally {
      setCreateModalLoading(false);
    }
  };

  // Create new consignee
  const createConsignee = async (consigneeData) => {
    setCreateModalLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/consignees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(consigneeData)
      });

      if (response.ok) {
        const newConsignee = await response.json();
        setSelectedConsignee(newConsignee);
        setFormData(prev => ({ ...prev, consigneeId: newConsignee.id }));
        setShowCreateConsigneeModal(false);
        setPendingEntityName('');
      } else {
        alert('Failed to create consignee');
      }
    } catch (error) {
      console.error('Error creating consignee:', error);
      alert('Error creating consignee');
    } finally {
      setCreateModalLoading(false);
    }
  };

  // Add box
  const addBox = () => {
    const newBox = {
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,
      actualWeightKg: 0
    };
    setBoxes(prev => [...prev, newBox]);
  };

  // Remove box
  const removeBox = (index) => {
    setBoxes(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate weights
  const { totalVolumeWeight, totalActualWeight, chargedWeight } = useMemo(() => {
    let totalVolumeWeight = 0;
    let totalActualWeight = 0;

    boxes.forEach(box => {
      const volumetricWeight = Math.ceil((box.lengthCm * box.widthCm * box.heightCm) / 5000);
      totalVolumeWeight += volumetricWeight;
      totalActualWeight += box.actualWeightKg || 0;
    });

    const chargedWeight = Math.max(totalActualWeight, totalVolumeWeight);

    return {
      totalVolumeWeight,
      totalActualWeight,
      chargedWeight
    };
  }, [boxes]);

  // Update actual weight when boxes change
  useEffect(() => {
    setFormData(prev => ({ ...prev, actualWeightKg: totalActualWeight }));
  }, [totalActualWeight]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      console.log('Form data:', formData);
      console.log('Selected shipper:', selectedShipper);
      console.log('Selected consignee:', selectedConsignee);
      
      if (!formData.serviceProviderId) {
        alert('Please select a service provider');
        return;
      }
      
      if (!selectedShipper || !selectedShipper.id) {
        alert('Please select a shipper');
        return;
      }
      
      if (!selectedConsignee || !selectedConsignee.id) {
        alert('Please select a consignee');
        return;
      }

      if (boxes.length === 0) {
        alert('Please add at least one box');
        return;
      }

      if (formData.hasVatNumber && !formData.vatNumber) {
        alert('VAT Number is required when checkbox is checked');
        return;
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        serviceProviderId: formData.serviceProviderId,
        customerId: selectedShipper.id, // Changed from shipperId to customerId
        consigneeId: selectedConsignee.id,
        boxes: boxes.map((box, index) => ({
          ...box,
          index: index + 1
        })),
        productInvoice: {
          items: productInvoiceItems
        },
        billingInvoice: billingData
      };

      // Determine if we're creating or updating
      const url = isEditMode 
        ? `http://localhost:3001/api/shipments/${shipment.id}`
        : 'http://localhost:3001/api/shipments';
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const updatedShipment = await response.json();
        onSubmit(updatedShipment);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting shipment:', error);
      alert('Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto pr-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Shipment' : 'Create New Shipment'}</h2>
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-1" />
              {loading ? 'Saving...' : 'Save Shipment'}
            </Button>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Reference number and service provider details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referenceNumber">Reference Number *</Label>
                <Input
                  id="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  required
                  placeholder="PREFIX-YYYYMMDD-XXXX"
                />
              </div>
              <div>
                <Label htmlFor="serviceProvider">Service Provider *</Label>
                <select
                  id="serviceProvider"
                  value={formData.serviceProviderId}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceProviderId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Service Provider</option>
                  {serviceProviders.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="terms">Terms *</Label>
                <select
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DAP">DAP</option>
                  <option value="DDP">DDP</option>
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipper Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipper Information</CardTitle>
            <CardDescription>
              Shipper details (Country is always Pakistan)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <TypeaheadInput
                  label="Person Name"
                  value={selectedShipper?.personName || ''}
                  onChange={(value) => {
                    if (value.length >= 2) {
                      searchShippers(value);
                    }
                  }}
                  onSelect={handleShipperSelect}
                  onCreateNew={handleCreateShipper}
                  suggestions={shippers}
                  placeholder="Type to search shippers..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="shipperPhone">Phone *</Label>
                <Input
                  id="shipperPhone"
                  value={selectedShipper?.phone || ''}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                  placeholder="Phone number (will be used as reference number)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipperAddress">Address *</Label>
                <Input
                  id="shipperAddress"
                  value={selectedShipper?.address || ''}
                  onChange={(e) => setSelectedShipper(prev => ({ ...(prev ?? {}), address: e.target.value }))}
                  required
                  placeholder="Address"
                />
              </div>
              <div>
                <Label htmlFor="shipperCity">City *</Label>
                <Input
                  id="shipperCity"
                  value={selectedShipper?.city || ''}
                  onChange={(e) => setSelectedShipper(prev => ({ ...(prev ?? {}), city: e.target.value }))}
                  required
                  placeholder="City"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipperEmail">Email</Label>
                <Input
                  id="shipperEmail"
                  type="email"
                  value={selectedShipper?.email || ''}
                  onChange={(e) => setSelectedShipper(prev => ({ ...(prev ?? {}), email: e.target.value }))}
                  placeholder="Email (optional)"
                />
              </div>
              <div>
                <Label htmlFor="shipperCountry">Country</Label>
                <Input
                  id="shipperCountry"
                  value="Pakistan"
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* VAT Number Section */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasVatNumber"
                  checked={formData.hasVatNumber}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasVatNumber: checked }))}
                />
                <Label htmlFor="hasVatNumber">Has VAT Number</Label>
              </div>
              {formData.hasVatNumber && (
                <div>
                  <Label htmlFor="vatNumber">VAT Number *</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, vatNumber: e.target.value }))}
                    required={formData.hasVatNumber}
                    placeholder="Enter VAT number"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consignee Information */}
        <Card>
          <CardHeader>
            <CardTitle>Consignee Information</CardTitle>
            <CardDescription>
              Consignee details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <TypeaheadInput
                  label="Person Name"
                  value={selectedConsignee?.personName || ''}
                  onChange={(value) => {
                    if (value.length >= 2) {
                      searchConsignees(value);
                    }
                  }}
                  onSelect={handleConsigneeSelect}
                  onCreateNew={handleCreateConsignee}
                  suggestions={consignees}
                  placeholder="Type to search consignees..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="consigneePhone">Phone *</Label>
                <Input
                  id="consigneePhone"
                  value={selectedConsignee?.phone || ''}
                  onChange={(e) => setSelectedConsignee(prev => ({ ...(prev ?? {}), phone: e.target.value }))}
                  required
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consigneeAddress">Address *</Label>
                <Input
                  id="consigneeAddress"
                  value={selectedConsignee?.address || ''}
                  onChange={(e) => setSelectedConsignee(prev => ({ ...(prev ?? {}), address: e.target.value }))}
                  required
                  placeholder="Address"
                />
              </div>
              <div>
                <Label htmlFor="consigneeCity">City *</Label>
                <Input
                  id="consigneeCity"
                  value={selectedConsignee?.city || ''}
                  onChange={(e) => setSelectedConsignee(prev => ({ ...(prev ?? {}), city: e.target.value }))}
                  required
                  placeholder="City"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consigneeEmail">Email</Label>
                <Input
                  id="consigneeEmail"
                  type="email"
                  value={selectedConsignee?.email || ''}
                  onChange={(e) => setSelectedConsignee(prev => ({ ...(prev ?? {}), email: e.target.value }))}
                  placeholder="Email (optional)"
                />
              </div>
              <div>
                <Label htmlFor="consigneeCountry">Country *</Label>
                <Input
                  id="consigneeCountry"
                  value={selectedConsignee?.country || ''}
                  onChange={(e) => setSelectedConsignee(prev => ({ ...(prev ?? {}), country: e.target.value }))}
                  required
                  placeholder="Country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Weight Information</CardTitle>
                <CardDescription>
                  Box dimensions and weight calculations
                </CardDescription>
              </div>
              <Button type="button" onClick={addBox}>
                <Plus className="h-4 w-4 mr-1" />
                Add Box
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {boxes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No boxes added yet. Click "Add Box" to start.
              </div>
            ) : (
              <BoxDimensions
                boxes={boxes}
                onBoxesChange={setBoxes}
                onDimensionsChange={setBoxes}
              />
            )}

            {/* Weight Summary */}
            {boxes.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium mb-2">Weight Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">Total Actual Weight</div>
                    <div className="font-bold text-lg">{totalActualWeight} kg</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Volume Weight</div>
                    <div className="font-bold text-lg">{totalVolumeWeight} kg</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Charged Weight</div>
                    <div className="font-bold text-lg text-blue-600">{chargedWeight} kg</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Invoice Information */}
        <ProductInvoiceSection
          items={productInvoiceItems}
          onItemsChange={setProductInvoiceItems}
          boxes={boxes}
        />

        {/* Billing Payment Invoice */}
        <BillingInvoiceSection
          billingData={billingData}
          onBillingChange={setBillingData}
          chargedWeight={chargedWeight}
          actualWeight={totalActualWeight}
          volumeWeight={totalVolumeWeight}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Package className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Shipment'}
          </Button>
        </div>
      </form>

      {/* Create Entity Modals */}
      <CreateEntityModal
        isOpen={showCreateShipperModal}
        onClose={() => {
          setShowCreateShipperModal(false);
          setPendingEntityName('');
        }}
        onSubmit={createShipper}
        entityType="shipper"
        initialName={pendingEntityName}
        loading={createModalLoading}
      />

      <CreateEntityModal
        isOpen={showCreateConsigneeModal}
        onClose={() => {
          setShowCreateConsigneeModal(false);
          setPendingEntityName('');
        }}
        onSubmit={createConsignee}
        entityType="consignee"
        initialName={pendingEntityName}
        loading={createModalLoading}
      />
    </div>
  );
};

export default NewShipmentForm;
