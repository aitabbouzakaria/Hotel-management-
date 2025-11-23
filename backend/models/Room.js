const mongoose = require('mongoose');

// Room Type Schema
const roomTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room type name is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  maxGuests: {
    type: Number,
    required: true,
    min: 1
  },
  beds: {
    type: Number,
    required: true,
    min: 1
  },
  amenities: [{
    type: String
  }],
  photos: [{
    type: String
  }],
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Room Schema
const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    unique: true,
    trim: true
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: true
  },
  floor: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'],
    default: 'available'
  },
  lastCleaned: Date,
  notes: String
}, {
  timestamps: true
});

const RoomType = mongoose.model('RoomType', roomTypeSchema);
const Room = mongoose.model('Room', roomSchema);

module.exports = { Room, RoomType };

