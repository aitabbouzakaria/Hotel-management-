const Booking = require('../models/Booking');
const { Room, RoomType } = require('../models/Room');

class BookingService {
  // Generate unique confirmation code
  generateConfirmationCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BK${timestamp}${random}`;
  }

  // Check room availability
  async checkAvailability(checkIn, checkOut, guests) {
    // Get all room types that can accommodate guests
    const roomTypes = await RoomType.find({
      isActive: true,
      maxGuests: { $gte: guests }
    });

    const results = [];

    for (const roomType of roomTypes) {
      // Get all rooms of this type
      const rooms = await Room.find({
        typeId: roomType._id,
        status: 'available'
      });

      // Check which rooms are available for the date range
      const availableRooms = [];
      
      for (const room of rooms) {
        // Check for booking conflicts
        const conflict = await Booking.findOne({
          roomId: room._id,
          status: { $in: ['reserved', 'checked_in'] },
          $or: [
            {
              checkIn: { $lte: checkOut },
              checkOut: { $gte: checkIn }
            }
          ]
        });

        if (!conflict) {
          availableRooms.push(room);
        }
      }

      if (availableRooms.length > 0) {
        // Calculate price
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const totalPrice = roomType.basePrice * nights;

        results.push({
          roomType: {
            _id: roomType._id,
            name: roomType.name,
            description: roomType.description,
            maxGuests: roomType.maxGuests,
            amenities: roomType.amenities
          },
          availableCount: availableRooms.length,
          nights,
          totalPrice
        });
      }
    }

    return results;
  }

  // Create booking
  async createBooking(bookingData) {
    const { userId, roomTypeId, checkIn, checkOut, guests, extras } = bookingData;

    // Verify room type exists
    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      throw new Error('Room type not found');
    }

    if (!roomType.isActive) {
      throw new Error('Room type is not available');
    }

    // Verify guests count
    if (guests > roomType.maxGuests) {
      throw new Error(`Room can only accommodate ${roomType.maxGuests} guests`);
    }

    // Check availability
    const availability = await this.checkAvailability(checkIn, checkOut, guests);
    const availableRoomType = availability.find(r => r.roomType._id.toString() === roomTypeId.toString());
    
    if (!availableRoomType || availableRoomType.availableCount === 0) {
      throw new Error('No rooms available for selected dates');
    }

    // Calculate price
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const basePrice = roomType.basePrice * nights;
    const extrasTotal = extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
    const totalAmount = basePrice + extrasTotal;

    // Generate confirmation code
    const confirmationCode = this.generateConfirmationCode();

    // Create booking
    const booking = new Booking({
      userId,
      roomTypeId,
      confirmationCode,
      checkIn,
      checkOut,
      guests,
      basePrice,
      extras: extras || [],
      totalAmount,
      reservationHoldExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await booking.save();
    await booking.populate('userId roomTypeId');

    return booking;
  }
}

module.exports = new BookingService();