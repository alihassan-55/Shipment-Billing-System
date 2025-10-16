import React, { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { useDataStore } from "../stores/dataStore"
import { useToast } from "../lib/use-toast"
import { formatCurrency, formatDate } from "../lib/utils"
import { FileText, Plus, Eye, Download, Printer } from "lucide-react"
import CreateInvoiceFromShipments from "../components/CreateInvoiceFromShipments"
import SimpleInvoiceCreator from "../components/SimpleInvoiceCreator"
import InvoiceViewer from "../components/InvoiceViewer"
import axios from "axios"

const InvoicesPage = () => {
  const { invoices, invoicesLoading, fetchInvoices, fetchInvoice, shipments, customers } = useDataStore()
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedShipments, setSelectedShipments] = useState([])
  const [taxRate, setTaxRate] = useState(0.18)
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const getStatusBadge = (status) => {
    const variants = {
      "Unpaid": "destructive",
      "Partial": "outline",
      "Paid": "secondary"
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const handleViewInvoice = async (invoiceId) => {
    try {
      const invoice = await fetchInvoice(invoiceId)
      setSelectedInvoice(invoice)
      setIsViewerOpen(true)
    } catch (error) {
      toast({
        title: "Error loading invoice",
        description: "Failed to load invoice details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await axios.post(`/invoices/${invoiceId}/pdf`, {}, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // Check if response is actually a PDF
      if (response.data.type && response.data.type !== 'application/pdf') {
        throw new Error('Invalid PDF response');
      }
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF downloaded",
        description: "Invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error downloading PDF",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrintInvoice = () => {
    if (selectedInvoice) {
      window.print()
    }
  }

  const handleInvoiceCreated = (createdInvoices) => {
    // Refresh the invoices list
    fetchInvoices()
    
    toast({
      title: "Invoices created successfully",
      description: `Created ${createdInvoices.length} invoice(s).`,
    })
  }

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
      const shipment = shipments.find(s => s.id === shipmentId);
      if (shipment) {
        const customerId = shipment.senderId;
        if (!shipmentsByCustomer[customerId]) {
          shipmentsByCustomer[customerId] = [];
        }
        shipmentsByCustomer[customerId].push(shipmentId);
      }
    });

    try {
      // Create invoices for each customer
      const invoicePromises = Object.entries(shipmentsByCustomer).map(async ([customerId, shipmentIds]) => {
        const response = await axios.post('/invoices', {
          shipmentIds,
          customerId,
          taxRate,
        });

        return response.data;
      });

      const createdInvoices = await Promise.all(invoicePromises);

      toast({
        title: "Invoices created successfully",
        description: `Created ${createdInvoices.length} invoice(s) for ${selectedShipments.length} shipment(s).`,
      });

      // Reset form
      setSelectedShipments([]);
      setIsCreateDialogOpen(false);
      
      // Refresh invoices list
      fetchInvoices();

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error creating invoice",
        description: error.message || "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage invoices and billing</p>
        </div>
        <div>
          <Button 
            onClick={() => {
              console.log('Direct invoice button clicked');
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice from Shipments
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
          <CardDescription>
            A list of all invoices in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customer?.name || "-"}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{formatDate(invoice.issuedDate)}</TableCell>
                    <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : "-"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice.id)}
                        >
                          <Download className="h-4 w-4" />
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

      {/* Invoice Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View and manage invoice information
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceViewer 
              invoice={selectedInvoice}
              onDownloadPDF={() => handleDownloadPDF(selectedInvoice.id)}
              onPrint={handlePrintInvoice}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice from Shipments</DialogTitle>
            <DialogDescription>
              Select shipments to automatically create invoices. Invoices will be grouped by customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Tax Rate Setting */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
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
                <CardTitle>Available Shipments ({shipments.filter(s => !s.invoiceId).length})</CardTitle>
                <CardDescription>
                  Select shipments to include in the invoice. Only shipments without existing invoices are shown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shipments.filter(s => !s.invoiceId).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No shipments available for invoicing. All shipments may already be invoiced.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Select</TableHead>
                          <TableHead>Tracking #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipments.filter(s => !s.invoiceId).map((shipment) => {
                          const shipmentCharge = 10 + (shipment.weight * 2);
                          const insurance = shipment.declaredValue ? shipment.declaredValue * 0.01 : 0;
                          const codFee = shipment.codAmount ? shipment.codAmount * 0.02 : 0;
                          const totalAmount = shipmentCharge + insurance + codFee;
                          const customer = customers.find(c => c.id === shipment.senderId);

                          return (
                            <TableRow key={shipment.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedShipments.includes(shipment.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedShipments(prev => [...prev, shipment.id]);
                                    } else {
                                      setSelectedShipments(prev => prev.filter(id => id !== shipment.id));
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{shipment.waybill}</TableCell>
                              <TableCell>{customer?.name || 'Unknown'}</TableCell>
                              <TableCell>{shipment.serviceType}</TableCell>
                              <TableCell>{shipment.weight} kg</TableCell>
                              <TableCell>
                                <Badge variant="outline">{shipment.status}</Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(totalAmount)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateInvoice}
                disabled={selectedShipments.length === 0}
              >
                Create Invoice(s) ({selectedShipments.length} selected)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InvoicesPage

