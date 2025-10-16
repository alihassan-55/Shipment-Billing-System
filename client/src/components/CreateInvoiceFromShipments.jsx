import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '../lib/use-toast';
import { useDataStore } from '../stores/dataStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { FileText, Plus, Calendar, DollarSign } from 'lucide-react';

const CreateInvoiceFromShipments = ({ onInvoiceCreated }) => {
  const [selectedShipments, setSelectedShipments] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0.18);
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const { shipments, customers, fetchShipments, fetchCustomers } = useDataStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchShipments();
    fetchCustomers();
  }, [fetchShipments, fetchCustomers]);

  // Filter shipments that are not already invoiced
  const availableShipments = shipments.filter(shipment => !shipment.invoiceId);

  const handleShipmentSelect = (shipmentId, checked) => {
    if (checked) {
      setSelectedShipments(prev => [...prev, shipmentId]);
    } else {
      setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedShipments(availableShipments.map(s => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const calculateInvoiceTotal = () => {
    return selectedShipments.reduce((total, shipmentId) => {
      const shipment = availableShipments.find(s => s.id === shipmentId);
      if (!shipment) return total;
      
      // Simple pricing calculation (same as backend)
      const shipmentCharge = 10 + (shipment.weight * 2);
      const insurance = shipment.declaredValue ? shipment.declaredValue * 0.01 : 0;
      const codFee = shipment.codAmount ? shipment.codAmount * 0.02 : 0;
      
      return total + shipmentCharge + insurance + codFee;
    }, 0);
  };

  const calculateTax = () => {
    return calculateInvoiceTotal() * taxRate;
  };

  const calculateGrandTotal = () => {
    return calculateInvoiceTotal() + calculateTax();
  };

  const handleCreateInvoice = async () => {
    if (selectedShipments.length === 0) {
      toast({
        title: "No shipments selected",
        description: "Please select at least one shipment to create an invoice.",
        variant: "destructive",
      });
      return;
    }

    // Group shipments by customer
    const shipmentsByCustomer = {};
    selectedShipments.forEach(shipmentId => {
      const shipment = availableShipments.find(s => s.id === shipmentId);
      if (shipment) {
        const customerId = shipment.senderId;
        if (!shipmentsByCustomer[customerId]) {
          shipmentsByCustomer[customerId] = [];
        }
        shipmentsByCustomer[customerId].push(shipmentId);
      }
    });

    setIsCreating(true);

    try {
      // Create invoices for each customer
      const invoicePromises = Object.entries(shipmentsByCustomer).map(async ([customerId, shipmentIds]) => {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipmentIds,
            customerId,
            dueDate: dueDate || null,
            taxRate,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create invoice');
        }

        return response.json();
      });

      const createdInvoices = await Promise.all(invoicePromises);

      toast({
        title: "Invoices created successfully",
        description: `Created ${createdInvoices.length} invoice(s) for ${selectedShipments.length} shipment(s).`,
      });

      // Reset form
      setSelectedShipments([]);
      setDueDate('');
      setIsOpen(false);
      
      // Notify parent component
      if (onInvoiceCreated) {
        onInvoiceCreated(createdInvoices);
      }

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error creating invoice",
        description: error.message || "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      "Pending": "outline",
      "In Transit": "secondary",
      "Delivered": "secondary",
      "Cancelled": "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice from Shipments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice from Shipments</DialogTitle>
          <DialogDescription>
            Select shipments to automatically create invoices. Invoices will be grouped by customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Invoice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={taxRate * 100}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipments Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Available Shipments</CardTitle>
              <CardDescription>
                Select shipments to include in the invoice. Only shipments without existing invoices are shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableShipments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No shipments available for invoicing. All shipments may already be invoiced.
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="selectAll"
                      checked={selectedShipments.length === availableShipments.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="selectAll">Select All ({availableShipments.length} shipments)</Label>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Tracking #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableShipments.map((shipment) => {
                          const shipmentCharge = 10 + (shipment.weight * 2);
                          const insurance = shipment.declaredValue ? shipment.declaredValue * 0.01 : 0;
                          const codFee = shipment.codAmount ? shipment.codAmount * 0.02 : 0;
                          const totalAmount = shipmentCharge + insurance + codFee;
                          const customer = customers.find(c => c.id === shipment.senderId);

                          return (
                            <TableRow key={shipment.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedShipments.includes(shipment.id)}
                                  onCheckedChange={(checked) => handleShipmentSelect(shipment.id, checked)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{shipment.waybill}</TableCell>
                              <TableCell>{customer?.name || 'Unknown'}</TableCell>
                              <TableCell>{shipment.serviceType}</TableCell>
                              <TableCell>{shipment.weight} kg</TableCell>
                              <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                              <TableCell>{formatCurrency(totalAmount)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          {selectedShipments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Selected Shipments:</span>
                    <span className="font-medium">{selectedShipments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateInvoiceTotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
                    <span className="font-medium">{formatCurrency(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateGrandTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateInvoice}
              disabled={selectedShipments.length === 0 || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Invoice(s)'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceFromShipments;