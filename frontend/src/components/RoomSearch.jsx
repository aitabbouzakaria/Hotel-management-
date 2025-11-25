import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function RoomSearch({ onSearch, rooms = [] }) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now()+86400000).toISOString().split('T')[0];
  const [data, setData] = useState({ checkIn: today, checkOut: tomorrow, guests: 2 });

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="flex items-center gap-2"><Search /> Search</h2>
      <form onSubmit={e => { e.preventDefault(); onSearch(data); }} className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
        <input type="date" value={data.checkIn} onChange={e=>setData({...data, checkIn:e.target.value})} className="p-2 border rounded" />
        <input type="date" value={data.checkOut} onChange={e=>setData({...data, checkOut:e.target.value})} className="p-2 border rounded" />
        <select value={data.guests} onChange={e=>setData({...data, guests: e.target.value})} className="p-2 border rounded">
          {[1,2,3,4].map(n=> <option key={n} value={n}>{n}</option>)}
        </select>
        <button className="bg-blue-600 text-white p-2 rounded">Search</button>
      </form>

      {/* Affichage des chambres */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.length === 0 ? (
          <div className="text-gray-500">Aucune chambre à afficher.</div>
        ) : (
          rooms.map((room, idx) => (
            <div key={idx} className="border rounded p-4">
              <div className="font-bold">{room.name}</div>
              <div>{room.description}</div>
              <div className="text-blue-600 font-semibold mt-2">${room.price}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}