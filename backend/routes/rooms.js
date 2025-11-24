const express = require('express');
const router = express.Router();
const { Room, RoomType } = require('../models/Room');
const { authenticate, authorize } = require('../middleware/auth');

// Get all room types
router.get('/types', async (req, res) => {
  try {
    const roomTypes = await RoomType.find({ isActive: true });
    res.json(roomTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single room type
router.get('/types/:id', async (req, res) => {
  try {
    const roomType = await RoomType.findById(req.params.id);
    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }
    res.json(roomType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create room type (admin only)
router.post('/types', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const roomType = new RoomType(req.body);
    await roomType.save();
    res.status(201).json(roomType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update room type
router.patch('/types/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const roomType = await RoomType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }
    
    res.json(roomType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all rooms
router.get('/', authenticate, authorize(['admin', 'reception', 'housekeeping']), async (req, res) => {
  try {
    const query = {};
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.floor) {
      query.floor = parseInt(req.query.floor);
    }

    const rooms = await Room.find(query)
      .populate('typeId')
      .sort({ floor: 1, roomNumber: 1 });
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single room
router.get('/:id', authenticate, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('typeId');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create room
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    await room.populate('typeId');
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update room status
router.patch('/:id/status', authenticate, authorize(['admin', 'reception', 'housekeeping']), async (req, res) => {
  try {
    const { status } = req.body;
    
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('typeId');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update room
router.patch('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('typeId');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;