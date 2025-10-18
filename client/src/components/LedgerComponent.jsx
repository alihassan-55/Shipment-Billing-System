import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useDataStore } from '../stores/dataStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { Calculator, Filter, Download, Eye } from 'lucide-react';

const LedgerComponent = ({ customerId = null, showCustomerFilter = true }) => {
  const { 
    ledgerEntries, 
    ledgerLoading, 
    fetchLedgerEntries, 
    customers,
    fetchCustomers 
  } = useDataStore();
  
  const [selectedCustomer, setSelectedCustomer] = useState(customerId || 'all');
  const [filterType, setFilterType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (showCustomerFilter && customers.length === 0) {
      fetchCustomers();
    }
    fetchLedgerEntries(selectedCustomer === 'all' ? null : selectedCustomer);
  }, [selectedCustomer, fetchLedgerEntries, fetchCustomers, customers.length, showCustomerFilter]);

  // Calculate ledger summary
  const calculateSummary = () => {
    const totalDebits = ledgerEntries
      .filter(entry => entry.entryType === 'INVOICE')
      .reduce((sum, entry) => sum + (entry.debit || 0), 0);
    
    const totalCredits = ledgerEntries
      .filter(entry => entry.entryType === 'PAYMENT')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);
    
    const netBalance = totalCredits - totalDebits;
    
    return { totalDebits, totalCredits, netBalance };
  };

  const summary = calculateSummary();

  // Filter entries based on selected filters
  const filteredEntries = ledgerEntries.filter(entry => {
    if (filterType !== 'ALL' && entry.entryType !== filterType) return false;
    
    if (dateFrom && new Date(entry.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(entry.createdAt) > new Date(dateTo)) return false;
    
    return true;
  });

  const getEntryTypeBadge = (type) => {
    const variants = {
      'INVOICE': 'destructive',
      'PAYMENT': 'secondary',
      'ADJUSTMENT': 'outline',
      'REFUND': 'outline'
    };
    return <Badge variant={variants[type] || 'outline'}>{type}</Badge>;
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export ledger entries');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Ledger</h2>
          <p className="text-gray-600">
            {selectedCustomer ? 'Customer-specific ledger entries' : 'All ledger entries'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalDebits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Invoices & Charges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalCredits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Payments & Refunds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.netBalance >= 0 ? 'Credit Balance' : 'Debit Balance'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All customers</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries ({filteredEntries.length})</CardTitle>
          <CardDescription>
            Complete transaction history with running balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <div className="text-center py-8">Loading ledger entries...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No ledger entries found</p>
              <p className="text-sm">Entries will appear here as transactions are recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.createdAt)}</TableCell>
                      <TableCell>{getEntryTypeBadge(entry.entryType)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{entry.description}</p>
                          {entry.customer && (
                            <p className="text-sm text-gray-600">{entry.customer.name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.referenceId ? (
                          <span className="text-sm text-blue-600">#{entry.referenceId}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(entry.debit)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(entry.credit)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${
                          (entry.balanceAfter || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(entry.balanceAfter || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
