const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'collected'],
    default: 'pending',
  },
  pickupTime: { type: Date },
  collectedAt: { type: Date },
  rejectionReason: { type: String },
  ngoLocation: {
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);