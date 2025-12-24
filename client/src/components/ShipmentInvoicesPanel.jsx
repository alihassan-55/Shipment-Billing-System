import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { FileText, Download, RefreshCw, Eye } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import apiService from '../services/unifiedApiService';

const ShipmentInvoicesPanel = ({ shipmentId, shipmentStatus }) => {
  const { token } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load invoices when component mounts or shipmentId changes
  useEffect(() => {
    if (shipmentId) {
      loadInvoices();
    }
  }, [shipmentId]);

  // Also refresh invoices when shipment status changes to CONFIRMED
  useEffect(() => {
    if (shipmentId && shipmentStatus === 'CONFIRMED') {
      loadInvoices();
    }
  }, [shipmentStatus]);

  const loadInvoices = async () => {
    setLoading(true);
    console.log('Loading invoices for shipment:', shipmentId, 'status:', shipmentStatus);
    try {
      const response = await apiService.getShipmentInvoices(shipmentId);

      if (response.success) {
        console.log('Invoices loaded:', response.data.invoices);
        setInvoices(response.data.invoices || []);
      } else {
        console.error('Failed to load invoices:', response.error);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoices = async () => {
    setGenerating(true);
    try {
      const response = await apiService.generateShipmentInvoices(shipmentId);

      if (response.success) {
        setInvoices(response.data.invoices ? Object.values(response.data.invoices) : []);
      } else {
        alert('Failed to generate invoices: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      alert('Error generating invoices: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const regeneratePDF = async (invoiceId) => {
    try {
      const response = await apiService.regenerateInvoicePDF(invoiceId);

      if (response.success) {
        alert('PDF regenerated successfully');
        loadInvoices(); // Reload to get updated PDF URL
      } else {
        alert('Failed to regenerate PDF: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error regenerating PDF:', error);
      alert('Error regenerating PDF: ' + error.message);
    }
  };

  const handlePdfAction = async (pdfUrl, action = 'view') => {
    if (!pdfUrl) {
      alert('PDF not available yet. Please regenerate PDF.');
      return;
    }

    try {
      const blob = await apiService.fetchBlob(pdfUrl);
      const url = window.URL.createObjectURL(blob);

      if (action === 'view') {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        // Try to derive filename from url or sensitive default
        const fileName = pdfUrl.split('/').pop() || 'invoice.pdf';
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        // For download trigger, we can revoke shortly after, but for view we rely on browser copy
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Draft': { variant: 'secondary', label: 'Draft' },
      'Confirmed': { variant: 'default', label: 'Confirmed' },
      'Paid': { variant: 'success', label: 'Paid' },
      'Posted': { variant: 'success', label: 'Posted' }
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInvoiceTypeLabel = (type) => {
    return type === 'DECLARED_VALUE' ? 'Declared Value Invoice' : 'Billing Invoice';
  };

  const getInvoiceTypeIcon = (type) => {
    return type === 'DECLARED_VALUE' ? '📋' : '💰';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading invoices...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Invoices</span>
          {invoices.length === 0 && shipmentStatus === 'CONFIRMED' && (
            <Button
              onClick={generateInvoices}
              disabled={generating}
              size="sm"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoices
                </>
              )}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {invoices.length === 0
            ? shipmentStatus === 'CONFIRMED'
              ? 'Invoices are automatically generated when shipment is confirmed'
              : 'Invoices will be automatically generated after shipment confirmation'
            : 'Two invoices are automatically generated for each confirmed shipment'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {shipmentStatus === 'CONFIRMED'
              ? 'Invoices are being generated automatically...'
              : 'Shipment must be confirmed to generate invoices'
            }
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getInvoiceTypeIcon(invoice.type)}</span>
                    <div>
                      <h4 className="font-medium">{getInvoiceTypeLabel(invoice.type)}</h4>
                      <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
                    </div>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium">Rs {invoice.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issued Date</p>
                    <p className="font-medium">{new Date(invoice.issuedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePdfAction(invoice.pdfUrl, 'view')}
                    disabled={!invoice.pdfUrl}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Invoice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePdfAction(invoice.pdfUrl, 'download')}
                    disabled={!invoice.pdfUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regeneratePDF(invoice.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShipmentInvoicesPanel;
