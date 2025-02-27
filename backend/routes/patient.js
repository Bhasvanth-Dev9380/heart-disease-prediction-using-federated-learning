const express = require('express');
const Patient = require('../models/User');
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Invalid token' });
  }
};

router.get('/profile', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select('-password');
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).send({ error: 'Patient not found' });
    }
    patient.firstName = firstName;
    patient.lastName = lastName;
    patient.email = email;
    await patient.save();
    const patientWithoutPassword = patient.toObject();
    delete patientWithoutPassword.password;
    res.json(patientWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.post('/book-appointment', auth, async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId,
      date,
      time,
      reason
    });
    await appointment.save();
    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/available-slots', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const bookedAppointments = await Appointment.find({ doctorId, date });
    const bookedTimes = bookedAppointments.map(app => app.time);
    const allTimeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
    const availableSlots = allTimeSlots.filter(slot => !bookedTimes.includes(slot));
    res.json(availableSlots);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/appointments', auth, async (req, res) => {
  try {
    const patientId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Set to start of day
    
    const appointments = await Appointment.find({
      patientId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // End of day
      }
    })
      .populate('doctorId', 'firstName lastName')
      .sort({ time: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/care-team', auth, async (req, res) => {
  try {
    const patientId = req.user.id;
    const appointments = await Appointment.find({ patientId }).distinct('doctorId');
    const careTeam = await Doctor.find({ _id: { $in: appointments } }).select('firstName lastName specialty');
    res.json(careTeam);
  } catch (error) {
    console.error('Error fetching care team:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

router.get('/prescriptions', auth, async (req, res) => {
  try {
    const patientId = req.user.id;
    const prescriptions = await Prescription.find({ patientId }).populate('doctorId', 'firstName lastName');
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).send({ error: 'Server error' });
  }
});


// ✅ Route to save transaction ID to the patient's document
router.post('/save-transaction', auth, async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // ✅ Find the patient by ID from JWT token
    const patient = await Patient.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // ✅ Ensure transactionIds array exists
    if (!patient.transactionIds) {
      patient.transactionIds = [];
    }

    // ✅ Append the transaction ID to the transactionIds array
    patient.transactionIds.push(transactionId);

    // ✅ Save updated patient data
    await patient.save();

    res.status(200).json({
      message: 'Transaction saved successfully',
      transactionIds: patient.transactionIds, // ✅ Return only transaction IDs for security
    });

  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ error: 'Server error while saving transaction' });
  }
});

module.exports = router;
