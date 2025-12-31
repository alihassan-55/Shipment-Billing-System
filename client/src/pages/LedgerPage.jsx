import React from 'react';
import LedgerComponent from '../components/LedgerComponent';

const LedgerPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ledger Management</h1>
        <p className="text-gray-600">Customer ledger management</p>
      </div>

      <LedgerComponent showCustomerFilter={true} />
    </div>
  );
};

export default LedgerPage;








