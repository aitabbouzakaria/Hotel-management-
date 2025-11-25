import React, { useState } from 'react';

export default function BookingForm({ room, searchData, onBack = () => {}, onSuccess = () => {} }) {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // call your API here
      onSuccess({ confirmationCode: 'ABC123' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="text-lg font-semibold">Booking — {room?.name || 'Room'}</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="text-sm">Name</label>
          <input required className="w-full p-2 border rounded" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onBack} className="px-4 py-2 bg-gray-200 rounded">Back</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Booking...' : 'Confirm'}</button>
        </div>
      </form>
    </div>
  );
}