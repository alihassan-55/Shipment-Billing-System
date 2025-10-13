import React, { useState, useEffect, useMemo } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { useDataStore } from "../stores/dataStore"
import { useToast } from "../lib/use-toast"
import { formatDate } from "../lib/utils"
import { Plus, Search, Package, Eye, Edit, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { countries, searchCountries } from "../utils/countries"
import ComprehensiveShipmentForm from "../components/ComprehensiveShipmentForm"

const ShipmentsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [editingShipment, setEditingShipment] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [countrySearchTerm, setCountrySearchTerm] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  
  const [newShipment, setNewShipment] = useState({
    // Consignment Information
    referenceNo: "",
    serviceProvider: "UPS",
    airwayBill: "",
    bookingDateTime: new Date().toISOString().slice(0, 16),
    origin: "",
    description: "",
    dutyTax: "Duty Paid by Receiver",
    
    // Shipper Information
    shipperCompany: "",
    shipperPersonName: "",
    shipperAddress1: "",
    shipperAddress2: "",
    shipperCity: "",
    shipperState: "",
    shipperEmail: "",
    shipperZipCode: "",
    shipperTelephone: "",
    shipperCNIC: "",
    shipperNTN: "",
    shipperCountry: "US",
    
    // Consignee Information
    consigneeAttention: "",
    consigneeCompany: "",
    consigneeAddress: "",
    consigneeCountry: "US",
    consigneeCity: "",
    consigneeState: "",
    consigneePostalCode: "",
    consigneeEmail: "",
    consigneeTelephone: "",
    kycType: "",
    kycNumber: "",
    
    // Goods Information
    goodsDescription: "",
    boxes: "",
    weight: "",
    volumeWeight: "",
    chargedWeight: "",
    terms: "CFR",
    currency: "USD",
    custValue: "",
    reasonForExport: "SAMPLE",
    shipmentRemarks: "",
    hsCode: "",
    webocCountry: "US",
    
    // Dimension Information
    dimensions: [],
    
    // Invoice Information
    invoiceNo: "",
    refNo: "",
    freightCharges: "",
    invoiceItems: []
  })

  const { shipments, shipmentsLoading, fetchShipments, createShipment, customers, fetchCustomers, updateShipment } = useDataStore()
  const { toast } = useToast()

  useEffect(() => {
    fetchShipments()
    fetchCustomers()
  }, [fetchShipments, fetchCustomers])

  const handleCreateShipment = async (e) => {
    e.preventDefault()
    
    // Find customer IDs by name
    const senderCustomer = customers.find(c => c.name === newShipment.shipperPersonName)
    const receiverCustomer = customers.find(c => c.name === newShipment.consigneeAttention)
    
    if (!senderCustomer) {
      toast({
        title: "Error",
        description: `Sender "${newShipment.shipperPersonName}" not found in customers`,
        variant: "destructive",
      })
      return
    }
    
    if (!receiverCustomer) {
      toast({
        title: "Error", 
        description: `Receiver "${newShipment.consigneeAttention}" not found in customers`,
        variant: "destructive",
      })
      return
    }
    
    // Convert dimensions array to string format
    const dimensionsString = newShipment.dimensions && newShipment.dimensions.length > 0 
      ? newShipment.dimensions.map(dim => 
          `${dim.boxes} boxes (${dim.length}x${dim.width}x${dim.height}cm, Vol:${dim.volWt}kg, Act:${dim.actWt}kg)`
        ).join('; ')
      : `${newShipment.boxes || 1} boxes`;

    // Transform the comprehensive form data to match backend expectations
    const shipmentData = {
      senderId: senderCustomer.id,
      receiverId: receiverCustomer.id,
      weight: parseFloat(newShipment.weight),
      dimensions: dimensionsString,
      serviceType: newShipment.serviceProvider,
      declaredValue: newShipment.custValue ? parseFloat(newShipment.custValue) : null,
      codAmount: newShipment.freightCharges ? parseFloat(newShipment.freightCharges) : null,
      expectedDelivery: newShipment.bookingDateTime,
      // Address information for automatic address creation
      shipperAddress1: newShipment.shipperAddress1,
      shipperAddress2: newShipment.shipperAddress2,
      shipperCity: newShipment.shipperCity,
      shipperState: newShipment.shipperState,
      shipperZipCode: newShipment.shipperZipCode,
      shipperCountry: newShipment.shipperCountry || 'US',
      consigneeAddress: newShipment.consigneeAddress,
      consigneeCity: newShipment.consigneeCity,
      consigneeState: newShipment.consigneeState,
      consigneePostalCode: newShipment.consigneePostalCode,
      consigneeCountry: newShipment.consigneeCountry || 'US',
      // Add all the additional fields for future use (excluding dimensions which is handled above)
      ...Object.fromEntries(
        Object.entries(newShipment).filter(([key]) => key !== 'dimensions')
      )
    }
    
    console.log('Sending shipment data:', shipmentData)
    
    const result = await createShipment(shipmentData)
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Shipment created with waybill: ${result.data.waybill}`,
      })
      setIsCreateDialogOpen(false)
      resetShipmentForm()
      fetchShipments()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    
    setIsSearching(true)
    setShowSearchDropdown(true)
    
    try {
      const response = await fetchShipments({ page: 1, limit: 10, search: searchTerm })
      setSearchResults(response.shipments || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    if (value.trim().length > 2) {
      // Auto-search as user types (debounced)
      const timeoutId = setTimeout(() => {
        handleSearch({ preventDefault: () => {} })
      }, 500)
      
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }

  const handleShipmentSelect = (shipment) => {
    setSelectedShipment(shipment)
    setIsDetailDialogOpen(true)
    setShowSearchDropdown(false)
    setSearchTerm("")
  }

  const handleStatusChange = async (shipmentId, newStatus) => {
    console.log('Changing status for shipment:', shipmentId, 'to:', newStatus)
    const result = await updateShipment(shipmentId, { status: newStatus })
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Shipment status updated to ${newStatus}`,
      })
      fetchShipments() // Refresh the list
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleEditShipment = async (e) => {
    e.preventDefault()
    
    if (!editingShipment) return
    
    // Convert dimensions array back to string if it exists
    let updatedShipment = { ...editingShipment }
    if (editingShipment.dimensionsArray && editingShipment.dimensionsArray.length > 0) {
      const dimensionsString = editingShipment.dimensionsArray.map(dim => 
        `${dim.boxes} boxes (${dim.length}x${dim.width}x${dim.height}cm, Vol:${dim.volWt}kg, Act:${dim.actWt}kg)`
      ).join('; ')
      updatedShipment.dimensions = dimensionsString
    }
    
    // Only send fields that can be updated (exclude relations and computed fields)
    const allowedFields = [
      'status',
      'serviceType', 
      'weight',
      'dimensions',
      'declaredValue',
      'codAmount',
      'expectedDelivery'
    ];
    
    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updatedShipment[field] !== undefined) {
        filteredUpdates[field] = updatedShipment[field];
      }
    });
    
    console.log('Sending filtered updates:', filteredUpdates);
    
    const result = await updateShipment(editingShipment.id, filteredUpdates)
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Shipment updated successfully!",
      })
      setIsEditDialogOpen(false)
      setEditingShipment(null)
      fetchShipments()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const resetShipmentForm = () => {
    setNewShipment({
      referenceNo: "",
      serviceProvider: "UPS",
      airwayBill: "",
      bookingDateTime: new Date().toISOString().slice(0, 16),
      origin: "",
      description: "",
      dutyTax: "Duty Paid by Receiver",
      shipperCompany: "",
      shipperPersonName: "",
      shipperAddress1: "",
      shipperAddress2: "",
      shipperCity: "",
      shipperState: "",
      shipperEmail: "",
      shipperZipCode: "",
      shipperTelephone: "",
      shipperCNIC: "",
      shipperNTN: "",
      shipperCountry: "US",
      consigneeAttention: "",
      consigneeCompany: "",
      consigneeAddress: "",
      consigneeCountry: "US",
      consigneeCity: "",
      consigneeState: "",
      consigneePostalCode: "",
      consigneeEmail: "",
      consigneeTelephone: "",
      kycType: "",
      kycNumber: "",
      goodsDescription: "",
      boxes: "",
      weight: "",
      volumeWeight: "",
      chargedWeight: "",
      terms: "CFR",
      currency: "USD",
      custValue: "",
      reasonForExport: "SAMPLE",
      shipmentRemarks: "",
      hsCode: "",
      webocCountry: "US",
      dimensions: [],
      invoiceNo: "",
      refNo: "",
      freightCharges: "",
      invoiceItems: []
    })
  }

  const addDimensionRow = () => {
    setNewShipment(prev => ({
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
    }))
  }

  const removeDimensionRow = (index) => {
    setNewShipment(prev => ({
      ...prev,
      dimensions: prev.dimensions.filter((_, i) => i !== index)
    }))
  }

  const addInvoiceItem = () => {
    setNewShipment(prev => ({
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
    }))
  }

  const removeInvoiceItem = (index) => {
    setNewShipment(prev => ({
      ...prev,
      invoiceItems: prev.invoiceItems.filter((_, i) => i !== index)
    }))
  }

  const filteredCountries = useMemo(() => {
    return searchCountries(countrySearchTerm)
  }, [countrySearchTerm])

  const getStatusBadge = (status) => {
    const variants = {
      "Pending": "outline",
      "In Transit": "default",
      "Delivered": "secondary",
      "Cancelled": "destructive"
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const filteredShipments = (shipments || []).filter(shipment => {
    const matchesSearch = shipment.waybill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.receiver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || shipment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipments</h1>
          <p className="text-gray-600">Track and manage all shipments</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Shipment
        </Button>
      </div>

      {/* Enhanced Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Shipments</CardTitle>
          <CardDescription>Type to search and select a shipment to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by waybill, sender, receiver, or customer..."
              value={searchTerm}
              onChange={handleSearchInputChange}
              className="pl-10"
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            />
            
            {/* Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Searching...
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-500 border-b">
                      Found {searchResults.length} shipment(s)
                    </div>
                    {searchResults.map((shipment) => (
                      <div
                        key={shipment.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleShipmentSelect(shipment)}
                      >
                        <div className="font-medium text-gray-900">{shipment.waybill}</div>
                        <div className="text-sm text-gray-500">
                          {shipment.sender?.name && `${shipment.sender.name} → `}
                          {shipment.receiver?.name && `${shipment.receiver.name} • `}
                          {shipment.status && `${shipment.status} • `}
                          {shipment.weight && `${shipment.weight}kg`}
                        </div>
                      </div>
                    ))}
                  </>
                ) : searchTerm.trim().length > 2 ? (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    <div className="flex items-center justify-center">
                      <Search className="h-4 w-4 mr-2" />
                      No shipments found
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="mt-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Shipments ({filteredShipments.length})</CardTitle>
          <CardDescription>
            A list of all shipments in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shipmentsLoading ? (
            <div className="text-center py-8">Loading shipments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waybill</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{shipment.waybill}</TableCell>
                    <TableCell>{shipment.sender?.name || "-"}</TableCell>
                    <TableCell>{shipment.receiver?.name || "-"}</TableCell>
                    <TableCell>{shipment.serviceType}</TableCell>
                    <TableCell>{shipment.weight} kg</TableCell>
                    <TableCell>
                      <select
                        value={shipment.status}
                        onChange={(e) => handleStatusChange(shipment.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </TableCell>
                    <TableCell>{formatDate(shipment.bookedAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedShipment(shipment)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingShipment(shipment)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Shipment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
            <DialogDescription>
              Complete shipment information form
            </DialogDescription>
          </DialogHeader>
          
          <ComprehensiveShipmentForm
            shipmentData={newShipment}
            setShipmentData={setNewShipment}
            onSubmit={handleCreateShipment}
            onCancel={() => setIsCreateDialogOpen(false)}
            customers={customers}
          />
        </DialogContent>
      </Dialog>

      {/* Shipment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Shipment Details</DialogTitle>
                <DialogDescription>
                  View shipment information and tracking
                </DialogDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedShipment) {
                      setEditingShipment(selectedShipment)
                      setIsEditDialogOpen(true)
                      setIsDetailDialogOpen(false)
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedShipment) {
                      // Handle delete shipment
                      setIsDetailDialogOpen(false)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {selectedShipment && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Waybill</Label>
                    <div className="text-lg font-semibold">{selectedShipment.waybill}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedShipment.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Service Type</Label>
                    <div className="text-lg">{selectedShipment.serviceType}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Weight</Label>
                    <div className="text-lg">{selectedShipment.weight} kg</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Sender</Label>
                    <div className="text-lg">{selectedShipment.sender?.name || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Receiver</Label>
                    <div className="text-lg">{selectedShipment.receiver?.name || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Dimensions</Label>
                    <div className="text-lg">{selectedShipment.dimensions || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Declared Value</Label>
                    <div className="text-lg">${selectedShipment.declaredValue || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">COD Amount</Label>
                    <div className="text-lg">${selectedShipment.codAmount || "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Expected Delivery</Label>
                    <div className="text-lg">{selectedShipment.expectedDelivery ? formatDate(selectedShipment.expectedDelivery) : "-"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Created At</Label>
                    <div className="text-lg">{formatDate(selectedShipment.bookedAt)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Address Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Pickup Address</Label>
                    <div className="mt-2 p-3 border rounded-lg">
                      {selectedShipment.pickupAddress ? (
                        <div>
                          <div className="font-medium">{selectedShipment.pickupAddress.type}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>{selectedShipment.pickupAddress.line1}</div>
                            {selectedShipment.pickupAddress.line2 && <div>{selectedShipment.pickupAddress.line2}</div>}
                            <div>
                              {selectedShipment.pickupAddress.city}, {selectedShipment.pickupAddress.state} {selectedShipment.pickupAddress.postalCode}
                            </div>
                            <div>{selectedShipment.pickupAddress.country}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">No pickup address</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Delivery Address</Label>
                    <div className="mt-2 p-3 border rounded-lg">
                      {selectedShipment.deliveryAddress ? (
                        <div>
                          <div className="font-medium">{selectedShipment.deliveryAddress.type}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>{selectedShipment.deliveryAddress.line1}</div>
                            {selectedShipment.deliveryAddress.line2 && <div>{selectedShipment.deliveryAddress.line2}</div>}
                            <div>
                              {selectedShipment.deliveryAddress.city}, {selectedShipment.deliveryAddress.state} {selectedShipment.deliveryAddress.postalCode}
                            </div>
                            <div>{selectedShipment.deliveryAddress.country}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">No delivery address</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Events */}
              {selectedShipment.events && selectedShipment.events.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tracking Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedShipment.events.map((event, index) => (
                        <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="font-medium">{event.eventType}</div>
                            <div className="text-sm text-gray-600">{event.description}</div>
                            <div className="text-xs text-gray-500">
                              {event.location && `${event.location} • `}
                              {formatDate(event.occurredAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Shipment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full">
          <DialogHeader>
            <DialogTitle>Edit Shipment</DialogTitle>
            <DialogDescription>
              Update shipment information
            </DialogDescription>
          </DialogHeader>
          
          {editingShipment && (
            <div className="space-y-6">
              {/* Basic Shipment Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-waybill">Waybill</Label>
                    <Input
                      id="edit-waybill"
                      value={editingShipment.waybill}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <select
                      id="edit-status"
                      value={editingShipment.status}
                      onChange={(e) => setEditingShipment(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-serviceType">Service Type</Label>
                    <Input
                      id="edit-serviceType"
                      value={editingShipment.serviceType}
                      onChange={(e) => setEditingShipment(prev => ({ ...prev, serviceType: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-weight">Weight (kg)</Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      step="0.1"
                      value={editingShipment.weight}
                      onChange={(e) => setEditingShipment(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-dimensions">Dimensions</Label>
                    <Input
                      id="edit-dimensions"
                      value={editingShipment.dimensions}
                      onChange={(e) => setEditingShipment(prev => ({ ...prev, dimensions: e.target.value }))}
                      placeholder="e.g., 2 boxes (10x10x10cm, Vol:5kg, Act:4kg); 1 box (20x15x8cm, Vol:3kg, Act:2kg)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-declaredValue">Declared Value ($)</Label>
                    <Input
                      id="edit-declaredValue"
                      type="number"
                      step="0.01"
                      value={editingShipment.declaredValue || ""}
                      onChange={(e) => setEditingShipment(prev => ({ ...prev, declaredValue: parseFloat(e.target.value) || null }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-codAmount">COD Amount ($)</Label>
                    <Input
                      id="edit-codAmount"
                      type="number"
                      step="0.01"
                      value={editingShipment.codAmount || ""}
                      onChange={(e) => setEditingShipment(prev => ({ ...prev, codAmount: parseFloat(e.target.value) || null }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-expectedDelivery">Expected Delivery</Label>
                    <Input
                      id="edit-expectedDelivery"
                      type="datetime-local"
                      value={editingShipment.expectedDelivery ? new Date(editingShipment.expectedDelivery).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditingShipment(prev => ({ ...prev, expectedDelivery: e.target.value ? new Date(e.target.value) : null }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-sender">Sender</Label>
                    <Input
                      id="edit-sender"
                      value={editingShipment.sender?.name || ""}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-receiver">Receiver</Label>
                    <Input
                      id="edit-receiver"
                      value={editingShipment.receiver?.name || ""}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dimensions Editor */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Dimensions</CardTitle>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const currentDimensions = editingShipment.dimensions || ""
                        const dimensionsArray = currentDimensions.split('; ').map((dim, index) => {
                          const match = dim.match(/(\d+) boxes \(([^)]+)\)/)
                          if (match) {
                            const [, boxes, details] = match
                            const detailMatch = details.match(/(\d+)x(\d+)x(\d+)cm, Vol:([^k]+)kg, Act:([^k]+)kg/)
                            if (detailMatch) {
                              const [, length, width, height, volWt, actWt] = detailMatch
                              return { srNo: index + 1, boxes, length, width, height, volWt, actWt }
                            }
                          }
                          return { srNo: index + 1, boxes: "1", length: "10", width: "10", height: "10", volWt: "5", actWt: "4" }
                        })
                        setEditingShipment(prev => ({ ...prev, dimensionsArray: dimensionsArray.length > 0 ? dimensionsArray : [{ srNo: 1, boxes: "1", length: "10", width: "10", height: "10", volWt: "5", actWt: "4" }] }))
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Parse Dimensions
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-dimensions">Dimensions String</Label>
                      <Input
                        id="edit-dimensions"
                        value={editingShipment.dimensions}
                        onChange={(e) => setEditingShipment(prev => ({ ...prev, dimensions: e.target.value }))}
                        placeholder="e.g., 2 boxes (10x10x10cm, Vol:5kg, Act:4kg); 1 box (20x15x8cm, Vol:3kg, Act:2kg)"
                      />
                    </div>
                    
                    {editingShipment.dimensionsArray && editingShipment.dimensionsArray.length > 0 && (
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
                            {editingShipment.dimensionsArray.map((dim, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 px-2 py-1">{dim.srNo}</td>
                                <td className="border border-gray-300 px-2 py-1">
                                  <Input
                                    value={dim.boxes}
                                    onChange={(e) => {
                                      const newDimensions = [...editingShipment.dimensionsArray]
                                      newDimensions[index].boxes = e.target.value
                                      setEditingShipment(prev => ({ ...prev, dimensionsArray: newDimensions }))
                                    }}
                                    className="border-0 p-1 h-8"
                                  />
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  <Input
                                    value={dim.length}
                                    onChange={(e) => {
                                      const newDimensions = [...editingShipment.dimensionsArray]
                                      newDimensions[index].length = e.target.value
                                      setEditingShipment(prev => ({ ...prev, dimensionsArray: newDimensions }))
                                    }}
                                    className="border-0 p-1 h-8"
                                  />
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  <Input
                                    value={dim.width}
                                    onChange={(e) => {
                                      const newDimensions = [...editingShipment.dimensionsArray]
                                      newDimensions[index].width = e.target.value
                                      setEditingShipment(prev => ({ ...prev, dimensionsArray: newDimensions }))
                                    }}
                                    className="border-0 p-1 h-8"
                                  />
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  <Input
                                    value={dim.height}
                                    onChange={(e) => {
                                      const newDimensions = [...editingShipment.dimensionsArray]
                                      newDimensions[index].height = e.target.value
                                      setEditingShipment(prev => ({ ...prev, dimensionsArray: newDimensions }))
                                    }}
                                    className="border-0 p-1 h-8"
                                  />
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  <Input
                                    value={dim.volWt}
                                    onChange={(e) => {
                                      const newDimensions = [...editingShipment.dimensionsArray]
                                      newDimensions[index].volWt = e.target.value
                                      setEditingShipment(prev => ({ ...prev, dimensionsArray: newDimensions }))
                                    }}
                                    className="border-0 p-1 h-8"
                                  />
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  <Input
                                    value={dim.actWt}
                                    onChange={(e) => {
                                      const newDimensions = [...editingShipment.dimensionsArray]
                                      newDimensions[index].actWt = e.target.value
                                      setEditingShipment(prev => ({ ...prev, dimensionsArray: newDimensions }))
                                    }}
                                    className="border-0 p-1 h-8"
                                  />
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newDimensions = editingShipment.dimensionsArray.filter((_, i) => i !== index)
                                      setEditingShipment(prev => ({ ...prev, dimensionsArray: newDimensions }))
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditShipment}>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Shipment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ShipmentsPage
