const mongoose = require('mongoose');

const emergencyResponseSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
    donorName: { type: String, required: true, trim: true },
    donorEmail: { type: String, required: true, lowercase: true, trim: true },
    donorPhone: { type: String, trim: true },
    donorLocation: { type: String, trim: true },
    acceptedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const emergencyAlertSchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      index: true
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    recipientCount: { type: Number, default: 0 },
    createdByName: { type: String, trim: true },
    createdByEmail: { type: String, trim: true, lowercase: true },
    responses: { type: [emergencyResponseSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
