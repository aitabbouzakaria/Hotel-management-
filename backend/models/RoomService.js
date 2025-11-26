const mongoose = require('mongoose');

const roomServiceSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String, // ex: 'cleaning', 'breakfast', 'spa', 'laundry'
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['requested', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  price: Number
});

module.exports = mongoose.model('RoomService', roomServiceSchema);