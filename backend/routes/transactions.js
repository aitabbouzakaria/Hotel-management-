const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { authenticate } = require('../middleware/auth');

// Get user's transaction history
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const query = { userId: req.user.userId };
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    const transactions = await Transaction.find(query)
      .populate('bookingId orderId')
      .sort({ createdAt: -1 });
    
    // Calculate summary
    const summary = {
      total: transactions.reduce((sum, t) => sum + t.amount, 0),
      byType: {}
    };
    
    transactions.forEach(t => {
      if (!summary.byType[t.type]) {
        summary.byType[t.type] = 0;
      }
      summary.byType[t.type] += t.amount;
    });
    
    res.json({
      transactions,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single transaction
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).populate('bookingId orderId');
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;