import React from 'react';

export default function RoomCard({ room = {}, onBook = () => {} }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="font-semibold">{room.name || 'Room'}</div>
      <div className="text-sm text-gray-600">{room.description || 'Description'}</div>
      <div className="mt-2 flex justify-between items-center">
        <div className="font-bold">${(room.price ?? 0).toFixed(2)}</div>
        <button onClick={() => onBook(room)} className="px-3 py-1 bg-blue-600 text-white rounded">Book</button>
      </div>
    </div>
  );
}