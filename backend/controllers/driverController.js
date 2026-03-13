const Listing = require('../models/Listing');
const Request = require('../models/Request');
const User = require('../models/User');

// Get all approved requests that need delivery
exports.getAvailableDeliveries = async (req, res) => {
  try {
    const deliveries = await Request.find({ status: 'approved' })
      .populate('listing', 'title foodType quantity pickupAddress pickupLocation expiresAt')
      .populate('donor', 'name organizationName phone address')
      .populate('ngo', 'name organizationName phone address')
      .sort('-createdAt');
    res.json({ success: true, count: deliveries.length, deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver accepts a delivery
exports.acceptDelivery = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Delivery not available' });
    }
    if (request.driver) {
      return res.status(400).json({ success: false, message: 'Delivery already taken by another driver' });
    }
    request.driver = req.user._id;
    request.driverStatus = 'accepted';
    request.driverAcceptedAt = new Date();
    await request.save();
    await request.populate([
      { path: 'listing', select: 'title foodType quantity pickupAddress pickupLocation' },
      { path: 'donor', select: 'name organizationName phone address' },
      { path: 'ngo', select: 'name organizationName phone address' },
      { path: 'driver', select: 'name phone vehicleType vehicleNumber' },
    ]);
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver updates delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['heading_to_pickup', 'picked_up', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    if (request.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    }
    request.driverStatus = status;
    if (status === 'picked_up') request.pickedUpAt = new Date();
    if (status === 'delivered') {
      request.deliveredAt = new Date();
      request.status = 'collected';
      await Listing.findByIdAndUpdate(request.listing, { status: 'collected' });
    }
    await request.save();
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Driver updates their live location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: { latitude, longitude },
    });
    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get driver's active deliveries
exports.getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Request.find({ driver: req.user._id })
      .populate('listing', 'title foodType quantity pickupAddress pickupLocation')
      .populate('donor', 'name organizationName phone address')
      .populate('ngo', 'name organizationName phone address')
      .sort('-createdAt');
    res.json({ success: true, count: deliveries.length, deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};