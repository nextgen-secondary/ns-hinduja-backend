import express from 'express';
import DoctorSlot from '../models/doctorSlot.js';
import Booking from '../models/bookingModel.js';

const router = express.Router();

// Initialize with all slots for each doctor
const ALL_SLOTS = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"];

// GET all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await DoctorSlot.find();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add a new doctor
router.post('/', async (req, res) => {
  try {
    const { name, specialization, allSlots } = req.body;

    // Validate required fields
    if (!name || !specialization) {
      return res.status(400).json({ message: "Name and specialization are required" });
    }

    // Validate slots
    if (!Array.isArray(allSlots) || allSlots.length === 0) {
      return res.status(400).json({ message: "At least one time slot must be selected" });
    }

    const newDoctor = new DoctorSlot({
      name,
      specialization,
      allSlots,
      bookedSlots: []
    });

    const savedDoctor = await newDoctor.save();

    // Get the io instance
    const io = req.app.get('io');
    
    // Emit doctor added event
    io.emit('doctor-added', {
      doctorId: savedDoctor._id,
      doctor: savedDoctor
    });

    res.status(201).json(savedDoctor);
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update a doctor
router.put('/:id', async (req, res) => {
  try {
    const { name, specialization, allSlots } = req.body;
    const doctor = await DoctorSlot.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update doctor fields
    doctor.name = name;
    doctor.specialization = specialization;
    doctor.allSlots = allSlots;
    
    const updatedDoctor = await doctor.save();

    // Get the io instance
    const io = req.app.get('io');
    
    // Emit doctor update event
    io.emit('doctor-update', {
      doctorId: doctor._id,
      updatedDoctor
    });

    res.json({
      message: 'Doctor updated successfully',
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE a doctor
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await DoctorSlot.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Delete all bookings associated with this doctor
    await Booking.deleteMany({ doctorId: doctor._id });

    // Delete the doctor
    await DoctorSlot.findByIdAndDelete(req.params.id);

    // Get the io instance
    const io = req.app.get('io');
    
    // Emit doctor deleted event
    io.emit('doctor-deleted', {
      doctorId: doctor._id
    });

    res.json({
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT book a slot
router.put('/:id/book', async (req, res) => {
  try {
    // Extract parameters with fallbacks and handle both naming conventions
    const { slot, time, date, patientName, patientId } = req.body;
    const doctorId = req.params.id;
    
    // Use time if provided, otherwise use slot
    const timeSlot = time || slot;
    
    console.log('Booking request received:', {
      doctorId,
      date,
      timeSlot,
      patientName,
      patientId
    });

    // Validate required fields
    if (!patientId || !patientName || !date || !timeSlot) {
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: {
          patientId: !patientId,
          patientName: !patientName,
          date: !date,
          timeSlot: !timeSlot
        }
      });
    }

    const doctor = await DoctorSlot.findById(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if slot is already booked for this date
    // Handle both slot and time field names in bookedSlots
    const isSlotBooked = doctor.bookedSlots.some(
      booking => booking.date === date && (booking.slot === timeSlot || booking.time === timeSlot)
    );

    if (isSlotBooked) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // Create a new booking record
    const newBooking = new Booking({
      patientId,
      patientName,
      doctorId,
      date,
      time: timeSlot,
      status: 'confirmed'
    });
    
    console.log('Attempting to save booking:', newBooking);
    await newBooking.save();
    console.log('Booking saved successfully:', newBooking);

    // Add to doctor's booked slots
    doctor.bookedSlots.push({ 
      date, 
      slot: timeSlot, 
      time: timeSlot,
      patientName,
      patientId
    });
    await doctor.save();

    // Get the io instance
    const io = req.app.get('io');
    
    // Emit slot update event
    if (io) {
      io.emit('slot-update', {
        doctorId: doctor._id,
        allSlots: doctor.allSlots,
        bookedSlots: doctor.bookedSlots
      });
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking,
      allSlots: doctor.allSlots,
      bookedSlots: doctor.bookedSlots
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      message: 'Server Error',
      error: error.message 
    });
  }
});

// GET doctor slots
router.get('/:id/slots', async (req, res) => {
  try {
    const doctor = await DoctorSlot.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      allSlots: doctor.allSlots,
      bookedSlots: doctor.bookedSlots
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET queue information for a specific doctor on a specific date
router.get('/:id/queue/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    const doctor = await DoctorSlot.findById(id);
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get all bookings for this doctor on this date
    const bookings = await Booking.find({
      doctorId: id,
      date: date,
      status: 'confirmed'
    }).sort({ time: 1 }); // Sort by time to maintain queue order

    // Create a queue with position information
    const queue = bookings.map((booking, index) => ({
      position: index + 1,
      patientName: booking.patientName,
      time: booking.time,
      status: booking.status
    }));

    res.json({
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      date: date,
      queue: queue,
      totalPatients: queue.length
    });
  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;


// Book a slot for a doctor
router.put('/:doctorId/book', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, time, patientName, patientId } = req.body;
    
    console.log('Booking request received:', {
      doctorId,
      date,
      time,
      patientName,
      patientId
    });

    // Validate required fields
    if (!patientId || !patientName || !date || !time) {
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: {
          patientId: !patientId,
          patientName: !patientName,
          date: !date,
          time: !time
        }
      });
    }

    // Find the doctor
    const doctor = await DoctorSlot.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if the slot is available
    const isSlotBooked = doctor.bookedSlots.some(slot => 
      slot.date === date && slot.time === time && slot.status !== 'cancelled'
    );

    if (isSlotBooked) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }

    // Create a new booking in the Booking model
    const booking = new Booking({
      patientId,
      patientName,
      doctorId,
      date,
      time
    });

    await booking.save();
    console.log('Booking saved successfully:', booking);

    // Update the doctor's bookedSlots
    doctor.bookedSlots.push({
      date,
      time,
      patientName,
      patientId
    });

    await doctor.save();

    // Get the io instance
    const io = req.app.get('io');
    if (io) {
      io.emit('slot-updated', { doctorId, date, time });
    }

    res.status(201).json({
      message: 'Slot booked successfully',
      booking,
      bookedSlots: doctor.bookedSlots
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ 
      message: 'Server Error',
      error: err.message 
    });
  }
});

// Remove the duplicate route handler at the end of the file
// The code below should be removed:
// router.put('/:doctorId/book', async (req, res) => { ... });
