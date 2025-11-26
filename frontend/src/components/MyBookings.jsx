import React, { useEffect, useState } from 'react';
import { fetchMyBookings } from '../services/api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  useEffect(() => {
    fetchMyBookings()
      .then(setBookings)
      .catch(console.error);
  }, []);
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="text-gray-600">No bookings yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map(b => (
            <div key={b._id} className="border rounded p-4 shadow">
              <div className="font-bold">{b.roomTypeId?.name || 'Room'}</div>
              <div>{b.status}</div>
              <div>
                {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
              </div>
              <div>Guests: {b.guests}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}