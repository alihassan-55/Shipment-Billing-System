import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Download, Eye, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import CompanyLogo from './CompanyLogo';

const InvoiceViewer = ({ invoice, onDownloadPDF, onPrint }) => {
  if (!invoice) return null;

  const getStatusBadge = (status) => {
    const variants = {
      "Unpaid": "destructive",
      "Partial": "outline", 
      "Paid": "secondary",
      "Add to Ledger": "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Invoice Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <div className="flex items-start space-x-4">
            <CompanyLogo size="large" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">COURIER EXPRESS</h1>
              <p className="text-sm text-gray-600">Professional Courier Services</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>123 Business Street, City, State 12345</p>
                <p>Phone: (555) 123-4567 | Email: info@courierexpress.com</p>
              </div>
            </div>
          </div>
          
          {/* Invoice Details */}
          <div className="text-right space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-medium">Date:</span> {formatDate(invoice.issuedDate)}</p>
              <p><span className="font-medium">Due Date:</span> {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-medium">{invoice.customer?.name || 'N/A'}</p>
            {invoice.customer?.company && <p>{invoice.customer.company}</p>}
            {invoice.customer?.email && <p>{invoice.customer.email}</p>}
            {invoice.customer?.phone && <p>{invoice.customer.phone}</p>}
          </div>
        </div>
        
        <div className="text-right">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Status</h3>
          <div className="space-y-2">
            {getStatusBadge(invoice.status)}
            <p className="text-sm text-gray-600">
              Total Amount: <span className="font-medium">{formatCurrency(invoice.total)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Weight</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems?.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{item.description || 'Courier Service'}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity || 1}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">
                      {item.quantity ? `${item.quantity} kg` : '—'}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80 space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Tax:</span>
            <span className="font-medium">{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between py-3 bg-gray-50 px-4 rounded">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="font-bold text-lg text-gray-900">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.payments.map((payment, index) => (
                <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{formatDate(payment.createdAt)}</p>
                    <p className="text-sm text-gray-600">{payment.paymentType}</p>
                    {payment.reference && (
                      <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                    )}
                    {payment.notes && (
                      <p className="text-xs text-gray-500">{payment.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                    {payment.receivedBy && (
                      <p className="text-xs text-gray-500">by {payment.receivedBy}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pb-6">
        <Button variant="outline" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button onClick={onDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
        <p className="mb-2">Thank you for your business!</p>
        <p>For any questions regarding this invoice, please contact us at info@courierexpress.com</p>
      </div>
    </div>
  );
};

export default InvoiceViewer;
