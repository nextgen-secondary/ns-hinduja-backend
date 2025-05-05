import mongoose from "mongoose";

const visitMemoSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  patientName: { type: String, required: true },
  departments: [{
    departmentId: { type: String, required: true },
    departmentName: { type: String, required: true },
    isVisited: { type: Boolean, default: false },
    visitId: { type: String },
    tokenNumber: { type: Number },
    tests: [{
      testId: { type: String, required: true },
      testName: { type: String, required: true },
      isSelected: { type: Boolean, default: true },
      isCompleted: { type: Boolean, default: false }
    }]
  }],
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active"
  },
  isRead: { type: Boolean, default: false },
  message: { type: String }
}, { timestamps: true });

const visitMemoModel = mongoose.models.visitMemo || mongoose.model("visitMemo", visitMemoSchema);
export default visitMemoModel;