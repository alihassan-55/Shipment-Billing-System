import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useDataStore } from '../stores/dataStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import AddPaymentModal from './modals/AddPaymentModal';

const LedgerComponent = ({ customerId = null, showCustomerFilter = true }) => {
  const {
    ledgerEntries,
    ledgerLoading,
    ledgerCustomer,
    ledgerPagination,
    ledgerSummary,
    fetchLedgerEntries,
    customers,
    fetchCustomers
  } = useDataStore();

  const [selectedCustomer, setSelectedCustomer] = useState(customerId || 'all');
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('All customers');
  const [filterType, setFilterType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const customersFetchedRef = useRef(false);

  // Debounced fetch customers on query change
  useEffect(() => {
    let timer;
    if (showCustomerFilter) {
      timer = setTimeout(() => {
        fetchCustomers(customerQuery ? { search: customerQuery } : {});
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [customerQuery, fetchCustomers, showCustomerFilter]);

  useEffect(() => {
    if (showCustomerFilter && !customersFetchedRef.current) {
      fetchCustomers();
      customersFetchedRef.current = true;
    }

    // Build params for fetch
    const params = {
      page: currentPage,
      limit: 20,
      sortBy,
      sortOrder
    };

    if (filterType !== 'ALL') params.entryType = filterType;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;

    fetchLedgerEntries(selectedCustomer === 'all' ? null : selectedCustomer, params);
  }, [selectedCustomer, fetchLedgerEntries, fetchCustomers, showCustomerFilter, currentPage, filterType, dateFrom, dateTo, sortBy, sortOrder]);

  // No need for calculating summary locally anymore, use server provided summary
  const summary = ledgerSummary || { totalDebits: 0, totalCredits: 0, balanceDue: 0 };

  // No need for client-side filtering as we do it server-side now, 
  // but keeping 'filteredEntries' name for compatibility for now to minimize diff, 
  // though it's actually just 'ledgerEntries' from store which are already filtered by server.
  const filteredEntries = ledgerEntries;

  // Need to handle null entries case
  const hasEntries = filteredEntries && filteredEntries.length > 0;

  const getEntryTypeBadge = (type) => {
    const variants = { INVOICE: 'destructive', PAYMENT: 'secondary', ADJUSTMENT: 'outline', REFUND: 'outline' };
    return <Badge variant={variants[type] || 'outline'}>{type}</Badge>;
  };

  const handleExport = () => {
    if (!filteredEntries.length) {
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance After'];
    const rows = filteredEntries.map(entry => [
      formatDate(entry.createdAt),
      entry.entryType,
      `"${entry.description.replace(/"/g, '""')}"`, // Escape quotes
      entry.debit || 0,
      entry.credit || 0,
      entry.balanceAfter
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ledger_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (ledgerPagination?.pages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc'); // Default to desc for new column
    }
  };

  const filteredCustomers = (customers || []).filter(c => {
    if (!customerQuery) return true;
    const q = customerQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.personName?.toLowerCase().includes(q);
  }).slice(0, 8);

  const handlePickCustomer = (id, label) => {
    setSelectedCustomer(id);
    setSelectedCustomerLabel(label);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Payments</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCurrency(summary.totalCredit || 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance Due</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCurrency(summary.balanceDue || 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Ledger Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{selectedCustomer === 'all' ? formatCurrency(summary.balanceDue || 0) : formatCurrency(ledgerCustomer?.ledgerBalance || 0)}</CardContent>
        </Card>
      </div>


      {/* Customer Header Box */}
      <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {selectedCustomer && selectedCustomer !== 'all' ? selectedCustomerLabel : 'All Customers'}
          </h2>
          <p className="text-gray-500 mt-1">
            {selectedCustomer && selectedCustomer !== 'all' ? 'Ledger for selected customer' : 'Consolidated ledger for all customers'}
          </p>
        </div>
        <div className="flex space-x-2">
          <AddPaymentModal
            customerId={selectedCustomer === 'all' ? null : selectedCustomer}
            customerName={selectedCustomer === 'all' ? null : selectedCustomerLabel}
            onSuccess={() => {
              // Refresh ledger
              fetchLedgerEntries(selectedCustomer === 'all' ? null : selectedCustomer, {
                page: currentPage,
                limit: 20,
                ...(filterType !== 'ALL' && { entryType: filterType }),
                ...(dateFrom && { from: dateFrom }),
                ...(dateTo && { to: dateTo })
              });
            }}
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {showCustomerFilter && (
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Input
                  placeholder="Leave blank for all"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
                {customerQuery && (
                  <div className="max-h-48 overflow-auto rounded border bg-white z-10 relative">
                    {filteredCustomers.length === 0 ? (
                      <div className="px-3 py-2 text-gray-500">No customer found</div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-50"
                          onClick={() => handlePickCustomer(customer.id, customer.name || customer.personName)}
                        >
                          {customer.name || customer.personName}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Entry Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="INVOICE">Invoices</SelectItem>
                  <SelectItem value="PAYMENT">Payments</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustments</SelectItem>
                  <SelectItem value="REFUND">Refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
          <CardDescription>Complete transaction history with running balance</CardDescription>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <div className="text-gray-600">Loading...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-gray-500">No ledger entries found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center">
                        Date
                        {sortBy === 'createdAt' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('debit')}>
                      <div className="flex items-center">
                        Debit
                        {sortBy === 'debit' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('credit')}>
                      <div className="flex items-center">
                        Credit
                        {sortBy === 'credit' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead>Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.createdAt)}</TableCell>
                      <TableCell>{getEntryTypeBadge(entry.entryType)}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.debit ? formatCurrency(entry.debit) : '-'}</TableCell>
                      <TableCell>{entry.credit ? formatCurrency(entry.credit) : '-'}</TableCell>
                      <TableCell>{entry.balanceAfter != null ? formatCurrency(entry.balanceAfter) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {ledgerPagination && ledgerPagination.pages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {ledgerPagination.pages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === ledgerPagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
};

export default LedgerComponent;
