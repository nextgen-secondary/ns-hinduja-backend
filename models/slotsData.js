import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  availableSlots: [String]
});

const slotsData = mongoose.model('Doctor', doctorSchema);
export default slotsData;
