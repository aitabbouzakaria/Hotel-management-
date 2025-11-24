const express = require('express');
const router = express.Router();
const { HousekeepingTask } = require('../models/Housekeeping');
const { Room } = require('../models/Room');
const { authenticate, authorize } = require('../middleware/auth');

// Get all tasks
router.get('/tasks', authenticate, authorize(['admin', 'reception', 'housekeeping']), async (req, res) => {
  try {
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by assigned staff (housekeeping can only see their tasks)
    if (req.user.role === 'housekeeping') {
      query.assignedTo = req.user.userId;
    } else if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    // Filter by date
    if (req.query.date) {
      const startOfDay = new Date(req.query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(req.query.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.scheduledAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const tasks = await HousekeepingTask.find(query)
      .populate('roomId assignedTo')
      .sort({ scheduledAt: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/tasks/:id', authenticate, authorize(['admin', 'reception', 'housekeeping']), async (req, res) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id)
      .populate('roomId assignedTo');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Housekeeping can only see their own tasks
    if (req.user.role === 'housekeeping' && 
        task.assignedTo?._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/tasks', authenticate, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const { roomId, assignedTo, type, priority, scheduledAt, notes } = req.body;

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const task = new HousekeepingTask({
      roomId,
      assignedTo,
      type,
      priority: priority || 'normal',
      scheduledAt: scheduledAt || new Date(),
      notes
    });

    await task.save();
    await task.populate('roomId assignedTo');

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task status
router.patch('/tasks/:id/status', authenticate, authorize(['admin', 'reception', 'housekeeping']), async (req, res) => {
  try {
    const { status, issues } = req.body;
    
    const task = await HousekeepingTask.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Housekeeping can only update their own tasks
    if (req.user.role === 'housekeeping' && 
        task.assignedTo?.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    task.status = status;
    if (issues) task.issues = issues;
    
    if (status === 'completed') {
      task.completedAt = new Date();
      
      // Update room status
      if (task.type === 'clean') {
        await Room.findByIdAndUpdate(task.roomId, {
          status: 'available',
          lastCleaned: new Date()
        });
      }
    } else if (status === 'in_progress') {
      // Update room to cleaning status
      await Room.findByIdAndUpdate(task.roomId, {
        status: 'cleaning'
      });
    }

    await task.save();
    await task.populate('roomId assignedTo');

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task
router.delete('/tasks/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const task = await HousekeepingTask.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;