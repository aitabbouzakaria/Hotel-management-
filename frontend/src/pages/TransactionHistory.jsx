import React, { useState, useEffect } from 'react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/transactions?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      setTransactions(data.transactions || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  const typeLabel = (t) => {
    return {
      booking: 'Room Booking',
      room_service: 'Room Service',
      extra: 'Extra',
      refund: 'Refund',
      payment: 'Payment',
    }[t] || (t || 'Unknown');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>

        <form className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4" onSubmit={(e)=>e.preventDefault()}>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="">All types</option>
            <option value="booking">Booking</option>
            <option value="room_service">Room Service</option>
            <option value="payment">Payment</option>
            <option value="refund">Refund</option>
          </select>

          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
            className="px-3 py-2 border rounded"
          />

          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            className="px-3 py-2 border rounded"
          />

          <div className="flex items-center gap-2">
            <button onClick={() => setFilter({ type: '', startDate: '', endDate: '' })} className="px-4 py-2 bg-gray-200 rounded">
              Reset
            </button>
            <button onClick={fetchTransactions} className="px-4 py-2 bg-blue-600 text-white rounded">
              Apply
            </button>
          </div>
        </form>

        {summary && (
          <div className="mb-4 text-sm text-gray-700">
            <strong>Total:</strong> {summary.totalAmount ?? '0'} — <strong>Count:</strong> {summary.count ?? transactions.length}
          </div>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-600">No transactions found.</div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx._id || tx.id} className="bg-gray-50 p-4 rounded border flex justify-between items-center">
                <div>
                  <div className="font-medium">{typeLabel(tx.type)}</div>
                  <div className="text-sm text-gray-600">{tx.description || tx.note}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${(tx.amount ?? 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{formatDate(tx.createdAt ?? tx.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
