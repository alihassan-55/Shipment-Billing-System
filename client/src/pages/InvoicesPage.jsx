import React, { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { useDataStore } from "../stores/dataStore"
import { useToast } from "../lib/use-toast"
import { formatCurrency, formatDate } from "../lib/utils"
import { Download, Edit } from "lucide-react"
import axios from "axios"

const InvoicesPage = () => {
  const { invoices, invoicesLoading, fetchInvoices } = useDataStore()
  const { toast } = useToast()
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [selectedInvoiceForStatus, setSelectedInvoiceForStatus] = useState(null)

  // Debug logging
  console.log('InvoicesPage: invoices =', invoices)
  console.log('InvoicesPage: invoicesLoading =', invoicesLoading)

  useEffect(() => {
    console.log('InvoicesPage: Fetching invoices...')
    fetchInvoices()
  }, [fetchInvoices])

  const getStatusBadge = (status) => {
    const variants = {
      "Unpaid": "destructive",
      "Paid": "secondary",
      "Add to Ledger": "outline",
      "Partial": "outline"
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const handleDownloadPDF = async (invoiceId) => {
    try {
      // Use the main invoice PDF endpoint
      const response = await axios.post(`/api/invoices/${invoiceId}/generate-pdf`, {}, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
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

  const handleStatusChange = (invoice) => {
    setSelectedInvoiceForStatus(invoice);
    setIsStatusDialogOpen(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      // Convert status to uppercase for server compatibility
      const serverStatus = newStatus === 'Add to Ledger' ? 'ADD_TO_LEDGER' : newStatus.toUpperCase();
      
      console.log('Updating status for invoice:', selectedInvoiceForStatus.id, 'to:', serverStatus);
      console.log('Request URL:', `/invoices/${selectedInvoiceForStatus.id}/status`);
      
      await axios.patch(`/api/invoices/${selectedInvoiceForStatus.id}/status`, {
        status: serverStatus
      });

      toast({
        title: "Status updated",
        description: `Invoice status changed to ${newStatus}`,
      });

      setIsStatusDialogOpen(false);
      setSelectedInvoiceForStatus(null);
      fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error details:', error.response?.data);
      toast({
        title: "Error updating status",
        description: "Failed to update invoice status. Please try again.",
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
                          onClick={() => handleStatusChange(invoice)}
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Invoice Status</DialogTitle>
            <DialogDescription>
              Update the payment status for invoice #{selectedInvoiceForStatus?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Button 
                variant={selectedInvoiceForStatus?.status === 'Unpaid' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => handleUpdateStatus('Unpaid')}
              >
                Unpaid
              </Button>
              <Button 
                variant={selectedInvoiceForStatus?.status === 'Paid' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => handleUpdateStatus('Paid')}
              >
                Paid
              </Button>
              <Button 
                variant={selectedInvoiceForStatus?.status === 'Add to Ledger' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => handleUpdateStatus('Add to Ledger')}
              >
                Add to Ledger
              </Button>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InvoicesPage

