const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { Room, RoomType } = require('../models/Room');
const { Order } = require('../models/Order');
const { Invoice } = require('../models/Housekeeping');
const { authenticate, authorize } = require('../middleware/auth');

// Daily report
router.get('/daily', authenticate, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Total rooms
    const totalRooms = await Room.countDocuments();
    
    // Occupied rooms (checked in on this date or still checked in)
    const occupiedRooms = await Booking.countDocuments({
      status: 'checked_in',
      checkIn: { $lte: endOfDay },
      checkOut: { $gte: startOfDay }
    });

    // New bookings created today
    const newBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Check-ins today
    const checkIns = await Booking.countDocuments({
      checkIn: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['reserved', 'checked_in'] }
    });

    // Check-outs today
    const checkOuts = await Booking.countDocuments({
      checkOut: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['checked_out', 'checked_in'] }
    });

    // Revenue today (from paid bookings)
    const revenueBookings = await Booking.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: 'paid'
    });
    
    const bookingRevenue = revenueBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Revenue from orders
    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });
    
    const orderRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    
    const totalRevenue = bookingRevenue + orderRevenue;

    // Occupancy rate
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(2) : 0;

    // Average Daily Rate (ADR)
    const adr = occupiedRooms > 0 ? (bookingRevenue / occupiedRooms).toFixed(2) : 0;

    // Revenue Per Available Room (RevPAR)
    const revpar = totalRooms > 0 ? (totalRevenue / totalRooms).toFixed(2) : 0;

    res.json({
      date: date.toISOString().split('T')[0],
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      occupancyRate: parseFloat(occupancyRate),
      newBookings,
      checkIns,
      checkOuts,
      revenue: {
        bookings: bookingRevenue,
        orders: orderRevenue,
        total: totalRevenue
      },
      metrics: {
        adr: parseFloat(adr),
        revpar: parseFloat(revpar)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revenue report by date range
router.get('/revenue', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Bookings revenue
    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid'
    }).populate('roomTypeId userId');

    const bookingRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Orders revenue
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    });

    const orderRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    // Group by date
    const dailyBreakdown = {};
    
    bookings.forEach(booking => {
      const date = booking.createdAt.toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { bookings: 0, orders: 0, total: 0 };
      }
      dailyBreakdown[date].bookings += booking.totalAmount;
      dailyBreakdown[date].total += booking.totalAmount;
    });

    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { bookings: 0, orders: 0, total: 0 };
      }
      dailyBreakdown[date].orders += order.total;
      dailyBreakdown[date].total += order.total;
    });

    res.json({
      period: { startDate, endDate },
      summary: {
        totalBookings: bookings.length,
        totalOrders: orders.length,
        bookingRevenue,
        orderRevenue,
        totalRevenue: bookingRevenue + orderRevenue
      },
      dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => a.date.localeCompare(b.date))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Occupancy report
router.get('/occupancy', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const totalRooms = await Room.countDocuments();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const dailyOccupancy = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const occupied = await Booking.countDocuments({
        status: { $in: ['reserved', 'checked_in'] },
        checkIn: { $lt: nextDate },
        checkOut: { $gt: currentDate }
      });

      const occupancyRate = totalRooms > 0 ? (occupied / totalRooms * 100).toFixed(2) : 0;

      dailyOccupancy.push({
        date: currentDate.toISOString().split('T')[0],
        occupied,
        available: totalRooms - occupied,
        occupancyRate: parseFloat(occupancyRate)
      });
    }

    const avgOccupancy = dailyOccupancy.reduce((sum, day) => sum + day.occupancyRate, 0) / days;

    res.json({
      period: { startDate, endDate },
      totalRooms,
      averageOccupancy: parseFloat(avgOccupancy.toFixed(2)),
      dailyOccupancy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Popular room types
router.get('/popular-rooms', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { status: { $in: ['reserved', 'checked_in', 'checked_out'] } };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query).populate('roomTypeId');
    
    const roomTypeStats = {};
    
    bookings.forEach(booking => {
      if (booking.roomTypeId) {
        const typeId = booking.roomTypeId._id.toString();
        
        if (!roomTypeStats[typeId]) {
          roomTypeStats[typeId] = {
            roomType: booking.roomTypeId.name,
            bookings: 0,
            revenue: 0
          };
        }
        
        roomTypeStats[typeId].bookings += 1;
        roomTypeStats[typeId].revenue += booking.totalAmount;
      }
    });

    const stats = Object.values(roomTypeStats).sort((a, b) => b.bookings - a.bookings);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;