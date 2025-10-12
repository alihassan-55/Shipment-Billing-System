import React, { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Badge } from "../components/ui/badge"
import { useDataStore } from "../stores/dataStore"
import { useToast } from "../lib/use-toast"
import { formatDate } from "../lib/utils"
import { Plus, Search, Package, Eye, Edit } from "lucide-react"

const ShipmentsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [newShipment, setNewShipment] = useState({
    senderId: "",
    receiverId: "",
    pickupAddressId: "",
    deliveryAddressId: "",
    weight: "",
    dimensions: "",
    serviceType: "Standard",
    declaredValue: "",
    codAmount: "",
    expectedDelivery: ""
  })

  const { shipments, shipmentsLoading, fetchShipments, createShipment, customers, fetchCustomers } = useDataStore()
  const { toast } = useToast()

  useEffect(() => {
    fetchShipments()
    fetchCustomers()
  }, [fetchShipments, fetchCustomers])

  const handleCreateShipment = async (e) => {
    e.preventDefault()
    
    const result = await createShipment(newShipment)
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Shipment created with waybill: ${result.data.waybill}`,
      })
      setIsCreateDialogOpen(false)
      setNewShipment({
        senderId: "",
        receiverId: "",
        pickupAddressId: "",
        deliveryAddressId: "",
        weight: "",
        dimensions: "",
        serviceType: "Standard",
        declaredValue: "",
        codAmount: "",
        expectedDelivery: ""
      })
      fetchShipments()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by waybill, sender, or receiver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                    <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell>{formatDate(shipment.bookedAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
            <DialogDescription>
              Add a new shipment to your system
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateShipment} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senderId">Sender *</Label>
                <select
                  id="senderId"
                  value={newShipment.senderId}
                  onChange={(e) => setNewShipment({...newShipment, senderId: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Sender</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="receiverId">Receiver *</Label>
                <select
                  id="receiverId"
                  value={newShipment.receiverId}
                  onChange={(e) => setNewShipment({...newShipment, receiverId: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Receiver</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={newShipment.weight}
                  onChange={(e) => setNewShipment({...newShipment, weight: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="serviceType">Service Type *</Label>
                <select
                  id="serviceType"
                  value={newShipment.serviceType}
                  onChange={(e) => setNewShipment({...newShipment, serviceType: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Standard">Standard</option>
                  <option value="Express">Express</option>
                  <option value="Overnight">Overnight</option>
                  <option value="Same Day">Same Day</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={newShipment.dimensions}
                  onChange={(e) => setNewShipment({...newShipment, dimensions: e.target.value})}
                  placeholder="e.g., 30x20x10 cm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="declaredValue">Declared Value</Label>
                <Input
                  id="declaredValue"
                  type="number"
                  step="0.01"
                  value={newShipment.declaredValue}
                  onChange={(e) => setNewShipment({...newShipment, declaredValue: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="codAmount">COD Amount</Label>
                <Input
                  id="codAmount"
                  type="number"
                  step="0.01"
                  value={newShipment.codAmount}
                  onChange={(e) => setNewShipment({...newShipment, codAmount: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                <Input
                  id="expectedDelivery"
                  type="date"
                  value={newShipment.expectedDelivery}
                  onChange={(e) => setNewShipment({...newShipment, expectedDelivery: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Package className="mr-2 h-4 w-4" />
                Create Shipment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ShipmentsPage
