import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  averageWaitTime: { type: Number, default: 15 }, // in minutes
  currentQueueSize: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  location: { type: String },
  image: { type: String },
}, { timestamps: true });

const departmentModel = mongoose.models.department || mongoose.model("department", departmentSchema);
export default departmentModel;