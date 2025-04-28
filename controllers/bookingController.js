import Booking from "../models/bookingModel.js";

// @desc    Create a new booking
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    console.log('Received booking request:', req.body);
    // Extract patientId with fallback to empty string for validation to catch
    const { patientName, doctorId, date, time, patientId = "" } = req.body;

    // Log the booking data for debugging
    console.log('Creating booking with data:', {
      patientId,
      patientName,
      doctorId,
      date,
      time,
      fullBody: req.body
    });

    // Validate required fields
    if (!patientId || !patientName || !doctorId || !date || !time) {
      console.log('Missing required fields:', { patientName, doctorId, date, time, patientId});
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: {
          patientId: !patientId,
          patientName: !patientName,
          doctorId: !doctorId,
          date: !date,
          time: !time
        }
      });
    }

    const existingBooking = await Booking.findOne({
      patientId, 
      doctorId, 
      date, 
      time,
      status: { $ne: 'cancelled' }
    });
    
    if (existingBooking) {
      console.log('Slot already booked:', existingBooking);
      return res.status(400).json({ message: 'This slot is already booked' });
    }

    const booking = new Booking({ 
      patientId,
      patientName, 
      doctorId,
      date, 
      time 
    });
    
    console.log('Attempting to save booking:', booking);
    await booking.save();
    console.log('Booking saved successfully:', booking);

    const io = req.app.get('io');
    io.emit('slot-updated', { doctorId, date, time });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ 
      message: 'Server Error',
      error: err.message 
    });
  }
};


// @desc    Get all bookings
// @route   GET /api/bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Remove this code that's causing the error
// console.log('Creating booking with data:', {
//   patientId,
//   patientName,
//   doctorId,
//   date,
//   time,
//   fullBody: req.body
// });
