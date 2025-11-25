import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';
import AuthForm from './components/AuthForm';
import RoomSearch from './components/RoomSearch';
import RoomCard from './components/RoomCard';
import BookingForm from './components/BookingForm';
import MyBookings from './components/MyBookings';
import RoomService from './components/RoomService';
import TransactionHistory from './pages/TransactionHistory';

// icons used in the file
import { Hotel, Search, Calendar, ShoppingCart, Clock, User, LogOut, Menu as MenuIcon, X, AlertCircle } from 'lucide-react';

// Main App Component
const App = () => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('search');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = async (data) => {
    try {
      const results = await api.checkAvailability(data.checkIn, data.checkOut, data.guests);
      setAvailableRooms(results);
      setSearchData(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBook = (room) => {
    setSelectedRoom(room);
  };

  const handleBookingSuccess = (booking) => {
    alert(`Booking confirmed! Your confirmation code is: ${booking.confirmationCode}`);
    setSelectedRoom(null);
    setCurrentPage('bookings');
  };

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Hotel className="w-8 h-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold">Hotel Manager</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => {
                  setCurrentPage('search');
                  setSelectedRoom(null);
                }}
                className={`flex items-center ${currentPage === 'search' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600`}
              >
                <Search className="w-5 h-5 mr-1" />
                Search
              </button>

              <button
                onClick={() => setCurrentPage('bookings')}
                className={`flex items-center ${currentPage === 'bookings' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600`}
              >
                <Calendar className="w-5 h-5 mr-1" />
                My Bookings
              </button>

              <button
                onClick={() => setCurrentPage('service')}
                className={`flex items-center ${currentPage === 'service' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600`}
              >
                <ShoppingCart className="w-5 h-5 mr-1" />
                Room Service
              </button>

              {/* NEW: Transactions button */}
              <button
                onClick={() => setCurrentPage('transactions')}
                className={`flex items-center ${currentPage === 'transactions' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600`}
              >
                <Clock className="w-5 h-5 mr-1" />
                Transactions
              </button>
              
              <div className="flex items-center text-gray-700">
                <User className="w-5 h-5 mr-1" />
                {user.name}
              </div>
              <button
                onClick={logout}
                className="flex items-center text-red-600 hover:text-red-700"
              >
                <LogOut className="w-5 h-5 mr-1" />
                Logout
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <button
                onClick={() => {
                  setCurrentPage('search');
                  setSelectedRoom(null);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Search Rooms
              </button>
              <button
                onClick={() => {
                  setCurrentPage('bookings');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                My Bookings
              </button>
              <button
                onClick={() => {
                  setCurrentPage('service');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Room Service
              </button>

              {/* NEW: mobile Transactions */}
              <button
                onClick={() => {
                  setCurrentPage('transactions');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Transactions
              </button>

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'search' && (
          <>
            {selectedRoom ? (
              <BookingForm
                room={selectedRoom}
                searchData={searchData}
                onBack={() => setSelectedRoom(null)}
                onSuccess={handleBookingSuccess}
              />
            ) : (
              <>
                <RoomSearch onSearch={handleSearch} />
                
                {availableRooms.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {availableRooms.map((room, idx) => (
                        <RoomCard key={idx} room={room} onBook={handleBook} />
                      ))}
                    </div>
                  </div>
                )}
                
                {searchData && availableRooms.length === 0 && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    No rooms available for selected dates. Try different dates.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {currentPage === 'bookings' && <MyBookings />}
        
        {currentPage === 'service' && <RoomService />}

        {/* NEW: Transactions page */}
        {currentPage === 'transactions' && <TransactionHistory />}
      </main>

      <footer className="bg-gray-800 text-white mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 Hotel Manager. All rights reserved.</p>
          
        </div>
      </footer>
    </div>
  );
};

// Root Component with Auth Provider
const HotelManagementApp = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default HotelManagementApp;
