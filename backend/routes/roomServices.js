const express = require('express');
const router = express.Router();
const RoomService = require('../models/RoomService');
const { authenticate } = require('../middleware/auth');

// Créer une demande de service
router.post('/', authenticate, async (req, res) => {
  try {
    const service = new RoomService({
      ...req.body,
      userId: req.user.userId
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Lister les services de l'utilisateur
router.get('/', authenticate, async (req, res) => {
  try {
    const services = await RoomService.find({ userId: req.user.userId });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;