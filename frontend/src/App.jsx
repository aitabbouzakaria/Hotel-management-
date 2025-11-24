import React, { useState, createContext, useContext, useEffect } from 'react';
import { Calendar, Hotel, User, ShoppingCart, LogOut, Menu as MenuIcon, X, Search, Clock, Check, AlertCircle } from 'lucide-react';
import TransactionHistory from './pages/TransactionHistory';

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// API Service
const API_URL = 'http://localhost:5000/api';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
  },

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Rooms
  async getRoomTypes() {
    return this.request('/rooms/types');
  },

  async checkAvailability(checkIn, checkOut, guests) {
    const params = new URLSearchParams({ checkIn, checkOut, guests });
    return this.request(`/bookings/availability?${params}`);
  },

  // Bookings
  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  async getMyBookings() {
    return this.request('/bookings');
  },

  // Orders
  async getMenu() {
    return this.request('/orders/menu');
  },

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getMyOrders() {
    return this.request('/orders');
  },
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login/Register Component
const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Hotel className="w-12 h-12 text-blue-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-800">Hotel Manager</h1>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required={!isLogin}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </>
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline font-semibold"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

// Room Search Component
const RoomSearch = ({ onSearch }) => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const [searchData, setSearchData] = useState({
    checkIn: today,
    checkOut: tomorrow,
    guests: 2,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Search className="w-6 h-6 mr-2" />
        Search Available Rooms
      </h2>
      
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Check-in</label>
          <input
            type="date"
            value={searchData.checkIn}
            onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            min={today}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Check-out</label>
          <input
            type="date"
            value={searchData.checkOut}
            onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            min={searchData.checkIn}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Guests</label>
          <select
            value={searchData.guests}
            onChange={(e) => setSearchData({ ...searchData, guests: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

// Room Card Component
const RoomCard = ({ room, onBook }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <Hotel className="w-24 h-24 text-white opacity-50" />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{room.roomType.name}</h3>
        <p className="text-gray-600 mb-4">{room.roomType.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Max Guests</p>
            <p className="font-semibold">{room.roomType.maxGuests} guests</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Available</p>
            <p className="font-semibold">{room.availableCount} rooms</p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Amenities</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {room.roomType.amenities.slice(0, 3).map((amenity, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {amenity}
              </span>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-600">${room.totalPrice}</p>
            <p className="text-xs text-gray-500">{room.nights} night{room.nights > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => onBook(room)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Booking Form Component
const BookingForm = ({ room, searchData, onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const booking = await api.createBooking({
        roomTypeId: room.roomType._id,
        checkIn: searchData.checkIn,
        checkOut: searchData.checkOut,
        guests: searchData.guests,
        extras: [],
      });

      onSuccess(booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <button onClick={onBack} className="text-blue-600 mb-4 flex items-center hover:underline">
        ← Back to search
      </button>
      
      <h2 className="text-2xl font-bold mb-6">Complete Your Booking</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Room Details</h3>
          <p className="text-lg font-bold">{room.roomType.name}</p>
          <p className="text-gray-600">{room.roomType.description}</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Stay Details</h3>
          <p>Check-in: {new Date(searchData.checkIn).toLocaleDateString()}</p>
          <p>Check-out: {new Date(searchData.checkOut).toLocaleDateString()}</p>
          <p>Guests: {searchData.guests}</p>
          <p>Nights: {room.nights}</p>
        </div>
      </div>
      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total Amount:</span>
          <span className="text-2xl text-blue-600">${room.totalPrice}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

// My Bookings Component
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api.getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      reserved: 'bg-yellow-100 text-yellow-800',
      checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
      
      {bookings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No bookings yet</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-lg">{booking.roomTypeId?.name}</p>
                  <p className="text-sm text-gray-600">Confirmation: {booking.confirmationCode}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Check-in</p>
                  <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Check-out</p>
                  <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-bold text-blue-600">${booking.totalAmount}</span>
                <span className={`text-sm ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  Payment: {booking.paymentStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Room Service Component
const RoomService = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menu, bookingsData] = await Promise.all([
        api.getMenu(),
        api.getMyBookings()
      ]);
      
      setMenuItems(menu);
      
      const activeBookings = bookingsData.filter(b => 
        ['reserved', 'checked_in'].includes(b.status)
      );
      setBookings(activeBookings);
      
      if (activeBookings.length > 0) {
        setSelectedBooking(activeBookings[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      setCart(cart.map(c => 
        c._id === item._id ? { ...c, qty: c.qty + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c._id !== itemId));
  };

  const updateQty = (itemId, qty) => {
    if (qty === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(c => c._id === itemId ? { ...c, qty } : c));
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const placeOrder = async () => {
    if (!selectedBooking || cart.length === 0) return;

    try {
      await api.createOrder({
        bookingId: selectedBooking,
        items: cart.map(item => ({
          menuItemId: item._id,
          qty: item.qty
        })),
        deliveryLocation: 'Room'
      });

      setCart([]);
      setOrderPlaced(true);
      setTimeout(() => setOrderPlaced(false), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading menu...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-600">You need an active booking to order room service.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2" />
            Room Service Menu
          </h2>

          {orderPlaced && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
              <Check className="w-5 h-5 mr-2" />
              Order placed successfully!
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Booking</label>
            <select
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {bookings.map(booking => (
                <option key={booking._id} value={booking._id}>
                  {booking.confirmationCode} - {booking.roomTypeId?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map(item => (
              <div key={item._id} className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold mb-1">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">${item.price}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition text-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
          <h3 className="text-xl font-bold mb-4">Your Order</h3>
          
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Cart is empty</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item._id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">${item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item._id, item.qty - 1)}
                        className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item._id, item.qty + 1)}
                        className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Place Order
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

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
