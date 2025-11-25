import React from 'react';

export default function MyBookings() {
  // placeholder — replace with real fetch logic
  const bookings = [];
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
      {bookings.length === 0 ? <div className="text-gray-600">No bookings yet.</div> : bookings.map(b => <div key={b.id}>{b.id}</div>)}
    </div>
  );
}