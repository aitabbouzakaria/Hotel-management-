const mongoose = require('mongoose');
const { RoomType, Room } = require('./models/Room');
const { MenuItem } = require('./models/Order');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-management');

  // Clear existing data
  await RoomType.deleteMany({});
  await Room.deleteMany({});
  await MenuItem.deleteMany({});
  await User.deleteMany({});

  // Create admin user
  const admin = new User({
    name: 'Admin User',
    email: 'admin@hotel.com',
    passwordHash: 'admin123',
    role: 'admin'
  });
  await admin.save();

  // Create room types
  const deluxe = await RoomType.create({
    name: 'Deluxe Room',
    description: 'Spacious room with city view',
    maxGuests: 2,
    beds: 1,
    amenities: ['wifi', 'tv', 'ac', 'minibar'],
    photos: [],
    basePrice: 150
  });

  const suite = await RoomType.create({
    name: 'Executive Suite',
    description: 'Luxury suite with separate living area',
    maxGuests: 4,
    beds: 2,
    amenities: ['wifi', 'tv', 'ac', 'minibar', 'jacuzzi', 'balcony'],
    photos: [],
    basePrice: 300
  });

  // Create rooms
  for (let floor = 1; floor <= 5; floor++) {
    for (let room = 1; room <= 4; room++) {
      const roomNumber = `${floor}0${room}`;
      await Room.create({
        roomNumber,
        typeId: room <= 2 ? deluxe._id : suite._id,
        floor,
        status: 'available'
      });
    }
  }

  // Create menu items
  const menuItems = [
    { name: 'Club Sandwich', description: 'Triple decker with turkey and bacon', price: 12, category: 'main', prepTimeMin: 15 },
    { name: 'Caesar Salad', description: 'Fresh romaine with parmesan', price: 10, category: 'main', prepTimeMin: 10 },
    { name: 'Margherita Pizza', description: 'Fresh mozzarella and basil', price: 15, category: 'main', prepTimeMin: 20 },
    { name: 'Cheeseburger', description: 'Angus beef with cheddar', price: 14, category: 'main', prepTimeMin: 18 },
    { name: 'Coca Cola', description: 'Chilled soft drink', price: 3, category: 'drink', prepTimeMin: 2 },
    { name: 'Fresh Orange Juice', description: 'Freshly squeezed', price: 5, category: 'drink', prepTimeMin: 5 },
    { name: 'Coffee', description: 'Freshly brewed', price: 4, category: 'drink', prepTimeMin: 5 },
    { name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 8, category: 'dessert', prepTimeMin: 5 },
    { name: 'Ice Cream', description: 'Vanilla, chocolate, or strawberry', price: 6, category: 'dessert', prepTimeMin: 3 }
  ];

  await MenuItem.insertMany(menuItems);

  console.log('✅ Database seeded successfully!');
  console.log('Admin Login: admin@hotel.com / admin123');

  mongoose.disconnect();
}

seed().catch(console.error);
