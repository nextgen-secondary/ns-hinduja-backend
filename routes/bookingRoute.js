import express from "express";
import { createBooking, getAllBookings, getBookingById } from "../controllers/bookingController.js";

const router = express.Router();

// Create a new booking
router.post('/', createBooking);

// Get all bookings
router.get('/', getAllBookings);

// Get booking by ID
router.get('/:id', getBookingById);

export default router; 