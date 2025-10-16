import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { useToast } from "../lib/use-toast";
import { formatDate } from "../lib/utils";
import { Plus, Search, Package, Eye, Edit, Trash2, ChevronLeft, ChevronRight, X, FileText } from "lucide-react";
import NewShipmentForm from "../components/NewShipmentForm";
import ShipmentInvoicesPanel from "../components/ShipmentInvoicesPanel";
import { useAuthStore } from "../stores/authStore";
import { debounce } from "../utils/shipmentCalculations";

const ShipmentsPage = () => {
  const { token, user } = useAuthStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [editingShipment, setEditingShipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load shipments
  const loadShipments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      if (searchTerm) params.append('referenceNumber', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:3001/api/shipments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments);
        setPagination(data.pagination);
      } else {
        throw new Error('Failed to load shipments');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load shipments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, [currentPage, searchTerm, statusFilter]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term);
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  // Handle shipment creation
  const handleShipmentCreated = (shipment) => {
    toast({
      title: "Success",
      description: `Shipment ${shipment.referenceNumber} created successfully`,
    });
    setIsCreateDialogOpen(false);
    loadShipments();
  };

  // Handle shipment update
  const handleShipmentUpdated = (shipment) => {
    toast({
      title: "Success",
      description: `Shipment ${shipment.referenceNumber} updated successfully`,
    });
    setIsEditDialogOpen(false);
    loadShipments();
  };

  // Handle airway bill update
  const handleAirwayBillUpdate = async (shipmentId, airwayBillNumber) => {
    try {
      const response = await fetch(`http://localhost:3001/api/shipments/${shipmentId}/airway-bill`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ airwayBillNumber })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update airway bill');
      }
      
      toast({
        title: "Success",
        description: "Airway bill updated successfully",
      });
      
      // Reload shipments to show updated data
      loadShipments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update airway bill",
        variant: "destructive"
      });
    }
  };

  // Handle shipment confirmation
  const handleShipmentConfirmation = async (shipmentId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/shipments/${shipmentId}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Shipment confirmed and invoices generated successfully",
        });
        loadShipments();
        setIsDetailDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to confirm shipment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error confirming shipment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm shipment",
        variant: "destructive",
      });
    }
  };

  // Handle shipment deletion
  const handleDeleteShipment = async (shipmentId) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/shipments/${shipmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete shipment');
      }
      
      toast({
        title: "Success",
        description: "Shipment deleted successfully",
      });
      
      loadShipments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shipment",
        variant: "destructive"
      });
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Confirmed': return 'default';
      case 'In Transit': return 'default';
      case 'Delivered': return 'default';
      default: return 'secondary';
    }
  };

  // Format weight display
  const formatWeight = (weight) => {
    return `${weight.toFixed(1)} kg`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `PKR ${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipments</h1>
          <p className="text-gray-600">Manage your courier shipments</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Shipment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by reference number..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipments</CardTitle>
          <CardDescription>
            {pagination.total ? `${pagination.total} shipments found` : 'No shipments found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading shipments...</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shipments found</p>
              <p className="text-sm">Create your first shipment to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Service Provider</TableHead>
                      <TableHead>Shipper</TableHead>
                      <TableHead>Consignee</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">
                          {shipment.referenceNumber}
                        </TableCell>
                        <TableCell>{shipment.service_providers?.name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{shipment.shippers?.personName}</div>
                            <div className="text-sm text-gray-600">{shipment.shippers?.city}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{shipment.consignees?.personName}</div>
                            <div className="text-sm text-gray-600">{shipment.consignees?.city}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Charged: {formatWeight(shipment.chargedWeightKg)}</div>
                            <div className="text-gray-600">
                              Actual: {formatWeight(shipment.actualWeightKg)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(shipment.status)}>
                            {shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(shipment.bookedAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedShipment(shipment);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingShipment(shipment);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteShipment(shipment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                      disabled={currentPage === pagination.pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Shipment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new shipment
            </DialogDescription>
          </DialogHeader>
          <NewShipmentForm
            onSubmit={handleShipmentCreated}
            onCancel={() => setIsCreateDialogOpen(false)}
            user={user}
          />
        </DialogContent>
      </Dialog>

      {/* Shipment Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Shipment Details</span>
              {selectedShipment?.status === 'Draft' && (
                <Button
                  onClick={() => handleShipmentConfirmation(selectedShipment.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm Shipment
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              Reference: {selectedShipment?.referenceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Reference Number</label>
                      <p className="text-lg font-semibold">{selectedShipment.referenceNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Service Provider</label>
                      <p className="text-lg">{selectedShipment.service_providers?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Terms</label>
                      <p className="text-lg">{selectedShipment.terms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <Badge variant={getStatusBadgeVariant(selectedShipment.status)}>
                        {selectedShipment.status}
                      </Badge>
                    </div>
                  </div>
                  {selectedShipment.airwayBillNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Airway Bill</label>
                      <p className="text-lg">{selectedShipment.airwayBillNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipper Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipper Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-lg">{selectedShipment.shippers?.personName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-lg">{selectedShipment.shippers?.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-lg">{selectedShipment.shippers?.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">City</label>
                      <p className="text-lg">{selectedShipment.shippers?.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Country</label>
                      <p className="text-lg">{selectedShipment.shippers?.country}</p>
                    </div>
                    {selectedShipment.shippers?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-lg">{selectedShipment.shippers?.email}</p>
                      </div>
                    )}
                    {selectedShipment.shippers?.cnic && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">CNIC</label>
                        <p className="text-lg">{selectedShipment.shippers?.cnic}</p>
                      </div>
                    )}
                    {selectedShipment.shippers?.ntn && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">NTN</label>
                        <p className="text-lg">{selectedShipment.shippers?.ntn}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Consignee Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Consignee Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-lg">{selectedShipment.consignees?.personName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-lg">{selectedShipment.consignees?.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-lg">{selectedShipment.consignees?.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">City</label>
                      <p className="text-lg">{selectedShipment.consignees?.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Country</label>
                      <p className="text-lg">{selectedShipment.consignees?.country}</p>
                    </div>
                    {selectedShipment.consignees?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-lg">{selectedShipment.consignees?.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weight Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Weight Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-600">Actual Weight</div>
                      <div className="text-xl font-bold">{formatWeight(selectedShipment.actualWeightKg)}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-600">Volume Weight</div>
                      <div className="text-xl font-bold">{formatWeight(selectedShipment.volumeWeightKg)}</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-md">
                      <div className="text-sm text-gray-600">Charged Weight</div>
                      <div className="text-xl font-bold text-blue-600">{formatWeight(selectedShipment.chargedWeightKg)}</div>
                    </div>
                  </div>

                  {/* Box Details */}
                  {selectedShipment.shipment_boxes && selectedShipment.shipment_boxes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Box Details</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-2 py-1 text-left">Box</th>
                              <th className="border border-gray-300 px-2 py-1 text-left">Dimensions (cm)</th>
                              <th className="border border-gray-300 px-2 py-1 text-left">Volumetric Weight</th>
                              <th className="border border-gray-300 px-2 py-1 text-left">Actual Weight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedShipment.shipment_boxes.map((box, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 px-2 py-1">{box.index}</td>
                                <td className="border border-gray-300 px-2 py-1">
                                  {box.lengthCm} × {box.widthCm} × {box.heightCm}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">{formatWeight(box.volumetricWeightKg)}</td>
                                <td className="border border-gray-300 px-2 py-1">{formatWeight(box.actualWeightKg || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Invoice */}
              {selectedShipment.product_invoice_items && selectedShipment.product_invoice_items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Product Invoice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-1 text-left">Box</th>
                            <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                            <th className="border border-gray-300 px-2 py-1 text-left">HS Code</th>
                            <th className="border border-gray-300 px-2 py-1 text-left">Pieces</th>
                            <th className="border border-gray-300 px-2 py-1 text-left">Unit Value</th>
                            <th className="border border-gray-300 px-2 py-1 text-left">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedShipment.product_invoice_items.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-2 py-1">{item.boxIndex}</td>
                              <td className="border border-gray-300 px-2 py-1">{item.description}</td>
                              <td className="border border-gray-300 px-2 py-1">{item.hsCode}</td>
                              <td className="border border-gray-300 px-2 py-1">{item.pieces}</td>
                              <td className="border border-gray-300 px-2 py-1">{formatCurrency(item.unitValue)}</td>
                              <td className="border border-gray-300 px-2 py-1">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedShipment.customsValue && (
                      <div className="mt-4 text-right">
                        <div className="text-lg font-bold">
                          Total Customs Value: {formatCurrency(selectedShipment.customsValue)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Billing Invoice */}
              {selectedShipment.billing_invoices && (
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Invoice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Rate per kg</label>
                          <p className="text-lg">{selectedShipment.billing_invoices.ratePerKg ? formatCurrency(selectedShipment.billing_invoices.ratePerKg) : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Total Rate</label>
                          <p className="text-lg">{selectedShipment.billing_invoices.totalRate ? formatCurrency(selectedShipment.billing_invoices.totalRate) : 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">E-Form Charges</label>
                          <p className="text-lg">{formatCurrency(selectedShipment.billing_invoices.eFormCharges)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Remote Area Charges</label>
                          <p className="text-lg">{formatCurrency(selectedShipment.billing_invoices.remoteAreaCharges)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Box Charges</label>
                          <p className="text-lg">{formatCurrency(selectedShipment.billing_invoices.boxCharges)}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium">Grand Total:</span>
                          <span className="text-xl font-bold text-blue-600">
                            {formatCurrency(selectedShipment.billing_invoices.grandTotal)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <label className="text-sm font-medium text-gray-600">Payment Method</label>
                          <Badge variant={selectedShipment.billing_invoices.paymentMethod === 'Cash' ? 'default' : 'secondary'}>
                            {selectedShipment.billing_invoices.paymentMethod}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shipment Invoices */}
              <ShipmentInvoicesPanel 
                shipmentId={selectedShipment.id} 
                shipmentStatus={selectedShipment.status}
              />

              {/* Airway Bill Update */}
              <Card>
                <CardHeader>
                  <CardTitle>Airway Bill Update</CardTitle>
                  <CardDescription>
                    Update airway bill number (late-night update)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter airway bill number"
                      defaultValue={selectedShipment.airwayBillNumber || ''}
                      id="airwayBillInput"
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById('airwayBillInput');
                        const airwayBillNumber = input.value.trim();
                        if (airwayBillNumber) {
                          handleAirwayBillUpdate(selectedShipment.id, airwayBillNumber);
                        }
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShipmentsPage;
