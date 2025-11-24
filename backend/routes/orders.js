const express = require('express');
const router = express.Router();
const { Order, MenuItem } = require('../models/Order');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const { authenticate, authorize } = require('../middleware/auth');

// Get menu
router.get('/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isAvailable: true })
      .sort({ category: 1, name: 1 });
    
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
router.get('/', authenticate, async (req, res) => {
  try {
    const query = {};
    
    // Guests can only see their own orders
    if (req.user.role === 'guest') {
      const bookings = await Booking.find({ userId: req.user.userId });
      query.bookingId = { $in: bookings.map(b => b._id) };
    }
    
    // Staff can filter
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.bookingId) {
      query.bookingId = req.query.bookingId;
    }

    const orders = await Order.find(query)
      .populate('bookingId items.menuItemId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('bookingId items.menuItemId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Guests can only see their own orders
    if (req.user.role === 'guest') {
      const booking = await Booking.findById(order.bookingId);
      if (booking.userId.toString() !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
router.post('/', authenticate, async (req, res) => {
  try {
    const { bookingId, items, deliveryLocation, specialInstructions } = req.body;

    // Verify booking exists and belongs to user (if guest)
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.role === 'guest' && booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify booking is active
    if (!['reserved', 'checked_in'].includes(booking.status)) {
      return res.status(400).json({ error: 'Booking is not active' });
    }

    // Get menu items and calculate prices
    const orderItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItemId} not found` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ error: `${menuItem.name} is not available` });
      }

      const itemTotal = menuItem.price * item.qty;
      totalAmount += itemTotal;

      orderItems.push({
        menuItemId: menuItem._id,
        qty: item.qty,
        price: menuItem.price,
        name: menuItem.name
      });
    }

    const order = new Order({
      bookingId,
      items: orderItems,
      total: totalAmount,
      deliveryLocation: deliveryLocation || 'Room',
      specialInstructions
    });

    await order.save();
    await order.populate('bookingId items.menuItemId');

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.userId,
      bookingId,
      orderId: order._id,
      type: 'room_service',
      description: `Room service - ${orderItems.length} item(s)`,
      amount: totalAmount,
      status: 'completed',
      paymentMethod: 'card',
      details: {
        items: orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        deliveryLocation: deliveryLocation || 'Room'
      }
    });

    await transaction.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update order status
router.patch('/:id/status', authenticate, authorize(['admin', 'chef', 'reception']), async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    
    if (status === 'ready') {
      order.preparedAt = new Date();
    } else if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();
    await order.populate('bookingId items.menuItemId');

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create/Update menu item (Admin only)
router.post('/menu', authenticate, authorize(['admin', 'chef']), async (req, res) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/menu/:id', authenticate, authorize(['admin', 'chef']), async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;