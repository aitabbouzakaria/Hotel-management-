const mongoose = require('mongoose');

// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['main', 'appetizer', 'dessert', 'drink', 'breakfast', 'lunch', 'dinner'],
    required: true
  },
  prepTimeMin: {
    type: Number,
    default: 15,
    min: 1
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  image: String
}, {
  timestamps: true
});

// Order Schema
const orderSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    name: String // Store name for historical records
  }],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  total: {
    type: Number,
    required: true
  },
  deliveryLocation: {
    type: String,
    default: 'Room'
  },
  specialInstructions: String,
  preparedAt: Date,
  deliveredAt: Date
}, {
  timestamps: true
});

// Calculate total before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.total = this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }
  next();
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = { MenuItem, Order };

