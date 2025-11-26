import React, { useEffect, useState } from 'react';
import { fetchTransactions } from '../services/api';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    fetchTransactions()
      .then(data => setTransactions(data.transactions))
      .catch(console.error);
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Transactions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transactions.map(tx => (
          <div
            key={tx._id}
            className="bg-white rounded shadow p-4 border flex flex-col gap-2"
          >
            <div className="font-semibold capitalize">{tx.type || 'Transaction'}</div>
            <div className="text-gray-600 text-sm">
              Date: {tx.createdAt && new Date(tx.createdAt).toLocaleString()}
            </div>
            <div className="text-blue-600 font-bold text-lg">
              {tx.amount || tx.total || 0} $
            </div>
            {tx.status && (
              <div className="text-xs text-gray-500">Status: {tx.status}</div>
            )}
            {tx.description && (
              <div className="text-xs text-gray-500">{tx.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
