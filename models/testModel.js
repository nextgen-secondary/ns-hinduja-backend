import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },
  departmentName: {
    type: String
  },
  averageProcessTime: {
    type: Number,
    default: 15 // in minutes
  },
  price: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const testModel = mongoose.models.test || mongoose.model("test", testSchema);
export default testModel;