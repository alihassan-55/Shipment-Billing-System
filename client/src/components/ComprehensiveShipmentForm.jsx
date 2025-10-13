import React, { useState, useMemo } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { countries, searchCountries } from "../utils/countries"
import { Plus, Minus, X, Package } from "lucide-react"

const ComprehensiveShipmentForm = ({ 
  shipmentData, 
  setShipmentData, 
  onSubmit, 
  onCancel, 
  customers = [] 
}) => {
  const [countrySearchTerm, setCountrySearchTerm] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [activeCountryField, setActiveCountryField] = useState("")

  const filteredCountries = useMemo(() => {
    return searchCountries(countrySearchTerm)
  }, [countrySearchTerm])

  const handleCountrySelect = (country, field) => {
    setShipmentData(prev => ({
      ...prev,
      [field]: country.code
    }))
    setCountrySearchTerm(country.name)
    setShowCountryDropdown(false)
    setActiveCountryField("")
  }

  const updateShipmentData = (field, value) => {
    setShipmentData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateDimensionData = (index, field, value) => {
    setShipmentData(prev => ({
      ...prev,
      dimensions: prev.dimensions.map((dim, i) => 
        i === index ? { ...dim, [field]: value } : dim
      )
    }))
  }

  const updateInvoiceItemData = (index, field, value) => {
    setShipmentData(prev => ({
      ...prev,
      invoiceItems: prev.invoiceItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-2">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Consignment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Consignment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referenceNo">Reference No.</Label>
                <Input
                  id="referenceNo"
                  value={shipmentData.referenceNo}
                  onChange={(e) => updateShipmentData('referenceNo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="serviceProvider">Service Provider</Label>
                <select
                  id="serviceProvider"
                  value={shipmentData.serviceProvider}
                  onChange={(e) => updateShipmentData('serviceProvider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DHL">DHL</option>
                  <option value="TNT">TNT</option>
                  <option value="Aramex">Aramex</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="airwayBill">Airway Bill</Label>
                <Input
                  id="airwayBill"
                  value={shipmentData.airwayBill}
                  onChange={(e) => updateShipmentData('airwayBill', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bookingDateTime">Booking Date and Time</Label>
                <Input
                  id="bookingDateTime"
                  type="datetime-local"
                  value={shipmentData.bookingDateTime}
                  onChange={(e) => updateShipmentData('bookingDateTime', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={shipmentData.origin}
                  onChange={(e) => updateShipmentData('origin', e.target.value)}
                  placeholder="SIALKOT"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={shipmentData.description}
                  onChange={(e) => updateShipmentData('description', e.target.value)}
                  placeholder="NON-DOX"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="dutyTax">Duty & Tax</Label>
              <select
                id="dutyTax"
                value={shipmentData.dutyTax}
                onChange={(e) => updateShipmentData('dutyTax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Duty Paid by Receiver">Duty Paid by Receiver</option>
                <option value="Duty Paid by Sender">Duty Paid by Sender</option>
                <option value="DDP">DDP (Delivered Duty Paid)</option>
                <option value="DDU">DDU (Delivered Duty Unpaid)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Shipper Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipper Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipperCompany">Shipper Company</Label>
                <Input
                  id="shipperCompany"
                  value={shipmentData.shipperCompany}
                  onChange={(e) => updateShipmentData('shipperCompany', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shipperPersonName">Person Name *</Label>
                <select
                  id="shipperPersonName"
                  value={shipmentData.shipperPersonName}
                  onChange={(e) => {
                    updateShipmentData('shipperPersonName', e.target.value)
                    // Clear receiver if it's the same as the new sender
                    if (shipmentData.consigneeAttention === e.target.value) {
                      updateShipmentData('consigneeAttention', '')
                    }
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Sender</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.name}>{customer.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipperAddress1">Shipper Address 1</Label>
                <Input
                  id="shipperAddress1"
                  value={shipmentData.shipperAddress1}
                  onChange={(e) => updateShipmentData('shipperAddress1', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shipperAddress2">Shipper Address 2</Label>
                <Input
                  id="shipperAddress2"
                  value={shipmentData.shipperAddress2}
                  onChange={(e) => updateShipmentData('shipperAddress2', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="shipperCity">Shipper City</Label>
                <Input
                  id="shipperCity"
                  value={shipmentData.shipperCity}
                  onChange={(e) => updateShipmentData('shipperCity', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shipperState">Shipper State</Label>
                <Input
                  id="shipperState"
                  value={shipmentData.shipperState}
                  onChange={(e) => updateShipmentData('shipperState', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shipperZipCode">Shipper Zip Code</Label>
                <Input
                  id="shipperZipCode"
                  value={shipmentData.shipperZipCode}
                  onChange={(e) => updateShipmentData('shipperZipCode', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="shipperEmail">Email ID</Label>
                <Input
                  id="shipperEmail"
                  type="email"
                  value={shipmentData.shipperEmail}
                  onChange={(e) => updateShipmentData('shipperEmail', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shipperTelephone">Telephone No.</Label>
                <Input
                  id="shipperTelephone"
                  value={shipmentData.shipperTelephone}
                  onChange={(e) => updateShipmentData('shipperTelephone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shipperCNIC">CNIC No.</Label>
                <Input
                  id="shipperCNIC"
                  value={shipmentData.shipperCNIC}
                  onChange={(e) => updateShipmentData('shipperCNIC', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipperNTN">NTN No.</Label>
                <Input
                  id="shipperNTN"
                  value={shipmentData.shipperNTN}
                  onChange={(e) => updateShipmentData('shipperNTN', e.target.value)}
                />
              </div>
              <div className="relative">
                <Label htmlFor="shipperCountry">Country</Label>
                <Input
                  id="shipperCountry"
                  value={shipmentData.shipperCountry}
                  onChange={(e) => {
                    updateShipmentData('shipperCountry', e.target.value)
                    setCountrySearchTerm(e.target.value)
                    setShowCountryDropdown(true)
                    setActiveCountryField('shipperCountry')
                  }}
                  onFocus={() => {
                    setShowCountryDropdown(true)
                    setActiveCountryField('shipperCountry')
                  }}
                  placeholder="Search countries..."
                />
                {showCountryDropdown && activeCountryField === 'shipperCountry' && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCountries.slice(0, 10).map((country) => (
                      <div
                        key={country.code}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCountrySelect(country, 'shipperCountry')}
                      >
                        {country.name} ({country.code})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consignee Information */}
        <Card>
          <CardHeader>
            <CardTitle>Consignee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consigneeAttention">Consignee Attention *</Label>
                <select
                  id="consigneeAttention"
                  value={shipmentData.consigneeAttention}
                  onChange={(e) => updateShipmentData('consigneeAttention', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Receiver</option>
                  {customers
                    .filter(customer => customer.name !== shipmentData.shipperPersonName)
                    .map(customer => (
                      <option key={customer.id} value={customer.name}>{customer.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <Label htmlFor="consigneeCompany">Consignee Company</Label>
                <Input
                  id="consigneeCompany"
                  value={shipmentData.consigneeCompany}
                  onChange={(e) => updateShipmentData('consigneeCompany', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="consigneeAddress">Consignee Address</Label>
              <Input
                id="consigneeAddress"
                value={shipmentData.consigneeAddress}
                onChange={(e) => updateShipmentData('consigneeAddress', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="relative">
                <Label htmlFor="consigneeCountry">Country</Label>
                <Input
                  id="consigneeCountry"
                  value={shipmentData.consigneeCountry}
                  onChange={(e) => {
                    updateShipmentData('consigneeCountry', e.target.value)
                    setCountrySearchTerm(e.target.value)
                    setShowCountryDropdown(true)
                    setActiveCountryField('consigneeCountry')
                  }}
                  onFocus={() => {
                    setShowCountryDropdown(true)
                    setActiveCountryField('consigneeCountry')
                  }}
                  placeholder="Search countries..."
                />
                {showCountryDropdown && activeCountryField === 'consigneeCountry' && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCountries.slice(0, 10).map((country) => (
                      <div
                        key={country.code}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCountrySelect(country, 'consigneeCountry')}
                      >
                        {country.name} ({country.code})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="consigneeCity">City</Label>
                <Input
                  id="consigneeCity"
                  value={shipmentData.consigneeCity}
                  onChange={(e) => updateShipmentData('consigneeCity', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="consigneeState">State</Label>
                <Input
                  id="consigneeState"
                  value={shipmentData.consigneeState}
                  onChange={(e) => updateShipmentData('consigneeState', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="consigneePostalCode">Postal Code</Label>
                <Input
                  id="consigneePostalCode"
                  value={shipmentData.consigneePostalCode}
                  onChange={(e) => updateShipmentData('consigneePostalCode', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="consigneeEmail">Email</Label>
                <Input
                  id="consigneeEmail"
                  type="email"
                  value={shipmentData.consigneeEmail}
                  onChange={(e) => updateShipmentData('consigneeEmail', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="consigneeTelephone">Telephone No.</Label>
                <Input
                  id="consigneeTelephone"
                  value={shipmentData.consigneeTelephone}
                  onChange={(e) => updateShipmentData('consigneeTelephone', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kycType">KYC TYPE</Label>
                <select
                  id="kycType"
                  value={shipmentData.kycType}
                  onChange={(e) => updateShipmentData('kycType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">SELECT...</option>
                  <option value="CNIC">CNIC</option>
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver License</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="kycNumber">KYC NUMBER</Label>
                <Input
                  id="kycNumber"
                  value={shipmentData.kycNumber}
                  onChange={(e) => updateShipmentData('kycNumber', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goods Information */}
        <Card>
          <CardHeader>
            <CardTitle>Goods Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="goodsDescription">Goods Description</Label>
              <Input
                id="goodsDescription"
                value={shipmentData.goodsDescription}
                onChange={(e) => updateShipmentData('goodsDescription', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="boxes">Boxes</Label>
                <Input
                  id="boxes"
                  type="number"
                  value={shipmentData.boxes}
                  onChange={(e) => updateShipmentData('boxes', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={shipmentData.weight}
                  onChange={(e) => updateShipmentData('weight', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="volumeWeight">Volume Weight</Label>
                <Input
                  id="volumeWeight"
                  type="number"
                  step="0.1"
                  value={shipmentData.volumeWeight}
                  onChange={(e) => updateShipmentData('volumeWeight', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="chargedWeight">Charged Weight</Label>
                <Input
                  id="chargedWeight"
                  type="number"
                  step="0.1"
                  value={shipmentData.chargedWeight}
                  onChange={(e) => updateShipmentData('chargedWeight', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="terms">Terms</Label>
                <select
                  id="terms"
                  value={shipmentData.terms}
                  onChange={(e) => updateShipmentData('terms', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CFR">CFR</option>
                  <option value="CIF">CIF</option>
                  <option value="FOB">FOB</option>
                  <option value="EXW">EXW</option>
                  <option value="DDP">DDP</option>
                </select>
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={shipmentData.currency}
                  onChange={(e) => updateShipmentData('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="PKR">PKR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div>
                <Label htmlFor="custValue">Cust. Value</Label>
                <Input
                  id="custValue"
                  type="number"
                  step="0.01"
                  value={shipmentData.custValue}
                  onChange={(e) => updateShipmentData('custValue', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reasonForExport">Reason for Export</Label>
                <select
                  id="reasonForExport"
                  value={shipmentData.reasonForExport}
                  onChange={(e) => updateShipmentData('reasonForExport', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SAMPLE">SAMPLE</option>
                  <option value="COMMERCIAL">COMMERCIAL</option>
                  <option value="GIFT">GIFT</option>
                  <option value="RETURN">RETURN</option>
                  <option value="REPAIR">REPAIR</option>
                </select>
              </div>
              <div>
                <Label htmlFor="hsCode">HS Code</Label>
                <Input
                  id="hsCode"
                  value={shipmentData.hsCode}
                  onChange={(e) => updateShipmentData('hsCode', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipmentRemarks">Shipment Remarks</Label>
                <Input
                  id="shipmentRemarks"
                  value={shipmentData.shipmentRemarks}
                  onChange={(e) => updateShipmentData('shipmentRemarks', e.target.value)}
                />
              </div>
              <div className="relative">
                <Label htmlFor="webocCountry">We-Boc Country</Label>
                <Input
                  id="webocCountry"
                  value={shipmentData.webocCountry}
                  onChange={(e) => {
                    updateShipmentData('webocCountry', e.target.value)
                    setCountrySearchTerm(e.target.value)
                    setShowCountryDropdown(true)
                    setActiveCountryField('webocCountry')
                  }}
                  onFocus={() => {
                    setShowCountryDropdown(true)
                    setActiveCountryField('webocCountry')
                  }}
                  placeholder="Select Country"
                />
                {showCountryDropdown && activeCountryField === 'webocCountry' && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCountries.slice(0, 10).map((country) => (
                      <div
                        key={country.code}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCountrySelect(country, 'webocCountry')}
                      >
                        {country.name} ({country.code})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimension Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Dimension Information</CardTitle>
              <Button type="button" onClick={() => setShipmentData(prev => ({
                ...prev,
                dimensions: [...prev.dimensions, {
                  srNo: prev.dimensions.length + 1,
                  boxes: "",
                  length: "",
                  width: "",
                  height: "",
                  volWt: "",
                  actWt: ""
                }]
              }))}>
                <Plus className="h-4 w-4 mr-1" />
                Add Row
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-1 text-left">Sr.No.</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Boxes</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Length</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Width</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Height</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Vol. Wt.</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Act. Wt.</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentData.dimensions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="border border-gray-300 px-2 py-4 text-center text-gray-500">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    shipmentData.dimensions.map((dim, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 py-1">{dim.srNo}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={dim.boxes}
                            onChange={(e) => updateDimensionData(index, 'boxes', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={dim.length}
                            onChange={(e) => updateDimensionData(index, 'length', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={dim.width}
                            onChange={(e) => updateDimensionData(index, 'width', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={dim.height}
                            onChange={(e) => updateDimensionData(index, 'height', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={dim.volWt}
                            onChange={(e) => updateDimensionData(index, 'volWt', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={dim.actWt}
                            onChange={(e) => updateDimensionData(index, 'actWt', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShipmentData(prev => ({
                              ...prev,
                              dimensions: prev.dimensions.filter((_, i) => i !== index)
                            }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Invoice Information</CardTitle>
              <Button type="button" onClick={() => setShipmentData(prev => ({
                ...prev,
                invoiceItems: [...prev.invoiceItems, {
                  srNo: prev.invoiceItems.length + 1,
                  boxNo: "",
                  description: "",
                  hsCode: "",
                  pieces: "",
                  unitType: "",
                  rate: "",
                  amount: "",
                  unitWeight: ""
                }]
              }))}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="invoiceNo">Invoice No.</Label>
                <Input
                  id="invoiceNo"
                  value={shipmentData.invoiceNo}
                  onChange={(e) => updateShipmentData('invoiceNo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="refNo">Ref No.</Label>
                <Input
                  id="refNo"
                  value={shipmentData.refNo}
                  onChange={(e) => updateShipmentData('refNo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="freightCharges">Freight Charges.</Label>
                <Input
                  id="freightCharges"
                  type="number"
                  step="0.01"
                  value={shipmentData.freightCharges}
                  onChange={(e) => updateShipmentData('freightCharges', e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-1 text-left">Sr.No.</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Box No.</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">HS Code</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Pieces</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Unit Type</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Rate</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Amount</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Unit Weight</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentData.invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="border border-gray-300 px-2 py-4 text-center text-gray-500">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    shipmentData.invoiceItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 py-1">{item.srNo}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={item.boxNo}
                            onChange={(e) => updateInvoiceItemData(index, 'boxNo', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={item.description}
                            onChange={(e) => updateInvoiceItemData(index, 'description', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={item.hsCode}
                            onChange={(e) => updateInvoiceItemData(index, 'hsCode', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={item.pieces}
                            onChange={(e) => updateInvoiceItemData(index, 'pieces', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={item.unitType}
                            onChange={(e) => updateInvoiceItemData(index, 'unitType', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={item.rate}
                            onChange={(e) => updateInvoiceItemData(index, 'rate', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={item.amount}
                            onChange={(e) => updateInvoiceItemData(index, 'amount', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Input
                            value={item.unitWeight}
                            onChange={(e) => updateInvoiceItemData(index, 'unitWeight', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShipmentData(prev => ({
                              ...prev,
                              invoiceItems: prev.invoiceItems.filter((_, i) => i !== index)
                            }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Package className="mr-2 h-4 w-4" />
            Create Shipment
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ComprehensiveShipmentForm
