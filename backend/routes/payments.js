const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { authenticate } = require('../middleware/auth');

// Create payment intent
router.post('/create-intent', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const result = await paymentService.createPaymentIntent(bookingId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = paymentService.verifyWebhookSignature(req.body, sig);
    await paymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Process refund (Admin only)
router.post('/refund', authenticate, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    
    const refund = await paymentService.processRefund(bookingId, amount);
    res.json(refund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

