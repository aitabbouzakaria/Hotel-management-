const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

class PaymentService {
  // Create Stripe payment intent
  async createPaymentIntent(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate('userId roomTypeId');

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.paymentStatus === 'paid') {
      throw new Error('Booking already paid');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        confirmationCode: booking.confirmationCode
      },
      description: `Hotel Booking - ${booking.confirmationCode}`,
      receipt_email: booking.userId.email
    });

    // Save payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  }

  // Handle webhook from Stripe
  async handleWebhook(event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(paymentIntent) {
    const booking = await Booking.findOne({
      paymentIntentId: paymentIntent.id
    });

    if (!booking) {
      console.error('Booking not found for payment intent:', paymentIntent.id);
      return;
    }

    booking.paymentStatus = 'paid';
    await booking.save();

    console.log(`Payment successful for booking ${booking.confirmationCode}`);
    
    // Here you would trigger email/SMS notification
    // await notificationService.sendBookingConfirmation(booking);
  }

  // Handle failed payment
  async handlePaymentFailed(paymentIntent) {
    const booking = await Booking.findOne({
      paymentIntentId: paymentIntent.id
    });

    if (!booking) {
      console.error('Booking not found for payment intent:', paymentIntent.id);
      return;
    }

    // Check if reservation hold expired
    if (booking.reservationHoldExpiry < new Date()) {
      booking.status = 'cancelled';
    }

    await booking.save();

    console.log(`Payment failed for booking ${booking.confirmationCode}`);
  }

  // Process refund
  async processRefund(bookingId, amount = null) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.paymentStatus !== 'paid') {
      throw new Error('Booking not paid');
    }

    if (!booking.paymentIntentId) {
      throw new Error('No payment intent found');
    }

    // Process refund
    const refundAmount = amount ? Math.round(amount * 100) : Math.round(booking.totalAmount * 100);
    
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
      amount: refundAmount
    });

    // Update booking
    if (refundAmount >= Math.round(booking.totalAmount * 100)) {
      booking.paymentStatus = 'refunded';
    } else {
      booking.paymentStatus = 'partial';
    }

    await booking.save();

    return refund;
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return event;
    } catch (error) {
      throw new Error('Invalid webhook signature');
    }
  }
}

module.exports = new PaymentService();