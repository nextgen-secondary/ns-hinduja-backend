import express from 'express';
import { loginAdmin, adminDashboard } from '../controllers/adminController.js';
import authAdmin from '../middleware/authAdmin.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.get("/dashboard", authAdmin, adminDashboard)

export default adminRouter; 