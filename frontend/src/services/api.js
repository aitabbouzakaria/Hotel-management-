export const API_URL = 'http://localhost:5000/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Network error');
  return data;
};

export default {
  request,
  login: (email, pw) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pw }) }),
  register: (user) => request('/auth/register', { method: 'POST', body: JSON.stringify(user) }),
  checkAvailability: (checkIn, checkOut, guests) => request(`/bookings/availability?${new URLSearchParams({ checkIn, checkOut, guests })}`),
  createBooking: (b) => request('/bookings', { method: 'POST', body: JSON.stringify(b) }),
  getMyBookings: () => request('/bookings'),
  getMenu: () => request('/orders/menu'),
  createOrder: (o) => request('/orders', { method: 'POST', body: JSON.stringify(o) }),
  getMyOrders: () => request('/orders'),
};