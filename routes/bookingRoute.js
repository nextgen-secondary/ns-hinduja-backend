import express from "express";
import { createBooking, getAllBookings, getBookingById, updateBookingStatus } from "../controllers/bookingController.js";

const router = express.Router();

// Create a new booking
router.post('/', createBooking);

// Get all bookings
router.get('/', getAllBookings);

// Get booking by ID
router.get('/:id', getBookingById);

router.put("/update/:id", updateBookingStatus); // ✅ change GET to PUT

export default router; 