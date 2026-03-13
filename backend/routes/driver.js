const express = require('express');
const router = express.Router();
const {
  getAvailableDeliveries, acceptDelivery,
  updateDeliveryStatus, updateLocation, getMyDeliveries,
} = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('driver'));

router.get('/deliveries', getAvailableDeliveries);
router.get('/deliveries/mine', getMyDeliveries);
router.put('/deliveries/:id/accept', acceptDelivery);
router.put('/deliveries/:id/status', updateDeliveryStatus);
router.put('/location', updateLocation);

module.exports = router;