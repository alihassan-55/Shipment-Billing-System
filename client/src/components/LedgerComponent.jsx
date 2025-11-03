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
import { Filter, Download } from 'lucide-react';

const LedgerComponent = ({ customerId = null, showCustomerFilter = true }) => {
  const { 
    ledgerEntries, 
    ledgerLoading, 
    ledgerCustomer,
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
    fetchLedgerEntries(selectedCustomer === 'all' ? null : selectedCustomer);
  }, [selectedCustomer, fetchLedgerEntries, fetchCustomers, showCustomerFilter]);

  const calculateSummary = () => {
    const totalDebits = ledgerEntries
      .filter(entry => entry.entryType === 'INVOICE')
      .reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredits = ledgerEntries
      .filter(entry => entry.entryType === 'PAYMENT')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);
    const balanceDue = totalDebits - totalCredits;
    return { totalDebits, totalCredits, balanceDue };
  };

  const summary = calculateSummary();

  const filteredEntries = ledgerEntries.filter(entry => {
    if (filterType !== 'ALL' && entry.entryType !== filterType) return false;
    if (dateFrom && new Date(entry.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(entry.createdAt) > new Date(dateTo)) return false;
    return true;
  });

  const getEntryTypeBadge = (type) => {
    const variants = { INVOICE: 'destructive', PAYMENT: 'secondary', ADJUSTMENT: 'outline', REFUND: 'outline' };
    return <Badge variant={variants[type] || 'outline'}>{type}</Badge>;
  };

  const handleExport = () => { console.log('Export ledger entries'); };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Invoices</CardTitle>
            <CardDescription>Sum of invoice debits</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCurrency(summary.totalDebits || 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Payments</CardTitle>
            <CardDescription>Sum of credits</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCurrency(summary.totalCredits || 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance Due</CardTitle>
            <CardDescription>Invoices minus payments</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCurrency(summary.balanceDue || 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Ledger Balance</CardTitle>
            <CardDescription>From server</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{formatCurrency(ledgerCustomer?.ledgerBalance || 0)}</CardContent>
        </Card>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Ledger</h2>
          <p className="text-gray-600">
            {selectedCustomer && selectedCustomer !== 'all' ? selectedCustomerLabel : 'All ledger entries'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
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
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default LedgerComponent;
