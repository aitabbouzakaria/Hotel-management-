const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['reserved', 'checked_in', 'checked_out', 'cancelled'],
    default: 'reserved'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partial'],
    default: 'pending'
  },
  paymentIntentId: String,
  confirmationCode: {
    type: String,
    unique: true,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  extras: [{
    name: String,
    price: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  reservationHoldExpiry: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }
  },
  checkedInAt: Date,
  checkedOutAt: Date,
  specialRequests: String
}, {
  timestamps: true
});

// Generate confirmation code before saving
bookingSchema.pre('save', async function(next) {
  if (!this.confirmationCode) {
    this.confirmationCode = 'HTL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);

