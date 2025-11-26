import React, { useEffect, useState } from 'react';
import { fetchRoomServices, createRoomService, fetchMyBookings } from '../services/api';

export default function RoomService() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [desc, setDesc] = useState('');
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    Promise.all([fetchRoomServices(), fetchMyBookings()])
      .then(([services, bookings]) => {
        setServices(services);
        setBookings(bookings);
        if (bookings.length === 1) setBookingId(bookings[0]._id); // auto-select if only one booking
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newService = await createRoomService({ bookingId, serviceType: type, description: desc });
      setServices([newService, ...services]);
      setType('');
      setDesc('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Room Service</h2>
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2 flex-wrap">
        <select value={bookingId} onChange={e => setBookingId(e.target.value)} required className="border p-2 rounded">
          <option value="">Choisir une réservation</option>
          {bookings.map(b => (
            <option key={b._id} value={b._id}>
              {b.roomTypeId?.name || 'Room'} — {new Date(b.checkIn).toLocaleDateString()}
            </option>
          ))}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} required className="border p-2 rounded">
          <option value="">Type de service</option>
          <option value="cleaning">Nettoyage</option>
          <option value="breakfast">Petit-déjeuner</option>
          <option value="spa">Spa</option>
          <option value="laundry">Blanchisserie</option>
        </select>
        <input
          type="text"
          placeholder="Description"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Demander</button>
      </form>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(s => (
            <div key={s._id} className="border rounded p-4 shadow">
              <div className="font-bold capitalize">{s.serviceType}</div>
              <div>{s.description}</div>
              <div className="text-xs text-gray-500">Status: {s.status}</div>
              <div className="text-xs text-gray-400">Demandé le: {new Date(s.requestedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}