const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      index: true
    },
    age: { type: Number, required: true, min: 18, max: 65 },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    location: { type: String, required: true, trim: true, index: true },
    lastDonationDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

donorSchema.index({ bloodGroup: 1, location: 1 });

module.exports = mongoose.model('Donor', donorSchema);
