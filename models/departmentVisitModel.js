import mongoose from "mongoose";

const departmentVisitSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  departmentId: { type: String, required: true },
  departmentName: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  status: {
    type: String,
    enum: ["waiting", "in-progress", "completed", "cancelled"],
    default: "waiting"
  },
  estimatedWaitTime: { type: Number }, // in minutes
  checkInTime: { type: Date, default: Date.now },
  completionTime: { type: Date },
}, { timestamps: true });

const departmentVisitModel = mongoose.models.departmentVisit || mongoose.model("departmentVisit", departmentVisitSchema);
export default departmentVisitModel;