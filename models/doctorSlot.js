import mongoose from 'mongoose';

const doctorSlotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  allSlots: {
    type: [String],
    required: true,
    default: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]
  },
  bookedSlots: [{
    date: String,
    slot: String
  }]
}, {
  timestamps: true,
  collection: 'doctorslots'
});

// Add index for better query performance
doctorSlotSchema.index({ name: 1 });
doctorSlotSchema.index({ specialization: 1 });

const DoctorSlot = mongoose.model('DoctorSlot', doctorSlotSchema);

export default DoctorSlot; 