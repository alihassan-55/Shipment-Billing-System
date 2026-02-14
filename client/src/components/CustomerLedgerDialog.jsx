import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import LedgerComponent from './LedgerComponent';

const CustomerLedgerDialog = ({ customer, onClose }) => {
    if (!customer) return null;

    return (
        <Dialog open={!!customer} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{customer.name} - Ledger</DialogTitle>
                    <DialogDescription>
                        View all ledger entries and transactions for this customer
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    <LedgerComponent
                        key={customer.id}
                        customerId={customer.id}
                        showCustomerFilter={false}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CustomerLedgerDialog;
