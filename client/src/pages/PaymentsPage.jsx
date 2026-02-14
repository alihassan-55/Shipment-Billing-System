import React, { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { useDataStore } from "../stores/dataStore"
import { formatCurrency, formatDate } from "../lib/utils"
import { CreditCard, Plus, Eye } from "lucide-react"
import PaginationControls from "../components/PaginationControls"

const PaymentsPage = () => {
  const { payments, paymentsLoading, paymentsPagination, fetchPayments } = useDataStore()
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    console.log('PaymentsPage: Fetching payments...')
    fetchPayments({ page: currentPage, limit: 20 })
  }, [fetchPayments, currentPage])

  console.log('PaymentsPage: payments =', payments)
  console.log('PaymentsPage: paymentsLoading =', paymentsLoading)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and record payments</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments ({payments.length})</CardTitle>
          <CardDescription>
            A list of all payments in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="text-center py-8">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No payments found</p>
              <p className="text-sm">Payments will appear here once they are recorded</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.invoice?.invoiceNumber || "-"}</TableCell>
                    <TableCell>{payment.customer?.name || payment.invoice?.customer?.name || "-"}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.paymentType || payment.method || "-"}</TableCell>
                    <TableCell>{formatDate(payment.createdAt || payment.paymentDate)}</TableCell>
                    <TableCell>{payment.reference || "-"}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <PaginationControls
            pagination={paymentsPagination}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentsPage

