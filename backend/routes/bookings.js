const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { Room, RoomType } = require('../models/Room');
const bookingService = require('../services/bookingService');
const { authenticate, authorize } = require('../middleware/auth');

// Check availability
router.get('/availability', async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.query;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut dates are required' });
    }

    const results = await bookingService.checkAvailability(
      new Date(checkIn),
      new Date(checkOut),
      parseInt(guests) || 1
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bookings (filtered by user role)
router.get('/', authenticate, async (req, res) => {
  try {
    const query = {};
    
    // Guests can only see their own bookings
    if (req.user.role === 'guest') {
      query.userId = req.user.userId;
    }
    
    // Staff can filter by status, date, etc.
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.checkIn) {
      query.checkIn = { $gte: new Date(req.query.checkIn) };
    }

    const bookings = await Booking.find(query)
      .populate('userId roomTypeId roomId')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single booking
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId roomTypeId roomId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Guests can only see their own bookings
    if (req.user.role === 'guest' && booking.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { roomTypeId, checkIn, checkOut, guests, extras } = req.body;

    const booking = await bookingService.createBooking({
      userId: req.user.userId,
      roomTypeId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: parseInt(guests),
      extras: extras || []
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Assign room to booking
router.patch('/:id/assign-room', authenticate, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const { roomId } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if room is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'available') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    // Check for conflicts
    const conflict = await Booking.findOne({
      roomId,
      status: { $in: ['reserved', 'checked_in'] },
      $or: [
        {
          checkIn: { $lte: booking.checkOut },
          checkOut: { $gte: booking.checkIn }
        }
      ],
      _id: { $ne: booking._id }
    });

    if (conflict) {
      return res.status(400).json({ error: 'Room is already booked for these dates' });
    }

    booking.roomId = roomId;
    await booking.save();
    await booking.populate('roomId');

    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check in
router.patch('/:id/check-in', authenticate, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'reserved') {
      return res.status(400).json({ error: 'Booking is not in reserved status' });
    }

    if (!booking.roomId) {
      return res.status(400).json({ error: 'Room must be assigned before check-in' });
    }

    booking.status = 'checked_in';
    booking.checkedInAt = new Date();
    
    // Update room status
    await Room.findByIdAndUpdate(booking.roomId, { status: 'occupied' });
    
    await booking.save();
    await booking.populate('roomId roomTypeId userId');

    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check out
router.patch('/:id/check-out', authenticate, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'checked_in') {
      return res.status(400).json({ error: 'Guest is not checked in' });
    }

    booking.status = 'checked_out';
    booking.checkedOutAt = new Date();
    
    // Update room status to cleaning
    if (booking.roomId) {
      await Room.findByIdAndUpdate(booking.roomId, { status: 'cleaning' });
      
      // Create housekeeping task
      const { HousekeepingTask } = require('../models/Housekeeping');
      await HousekeepingTask.create({
        roomId: booking.roomId,
        type: 'clean',
        priority: 'normal',
        scheduledAt: new Date()
      });
    }
    
    await booking.save();
    await booking.populate('roomId roomTypeId userId');

    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel booking
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Guests can only cancel their own bookings
    if (req.user.role === 'guest' && booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (['checked_out', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    // Create transaction record
const Transaction = require('../models/Transaction');

const transaction = new Transaction({
  userId,
  bookingId: booking._id,
  type: 'booking',
  description: `Booking for ${roomType.name} - ${nights} night(s)`,
  amount: totalAmount,
  status: 'completed',
  details: {
    checkIn,
    checkOut,
    nights,
    roomType: roomType.name,
    guests
  }
});

await transaction.save();
    
    // Free up room if assigned
    if (booking.roomId) {
      await Room.findByIdAndUpdate(booking.roomId, { status: 'available' });
    }
    
    await booking.save();
    await booking.populate('roomId roomTypeId userId');

    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

