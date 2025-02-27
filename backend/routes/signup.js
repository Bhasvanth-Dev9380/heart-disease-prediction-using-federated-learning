const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.post('/', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  console.log('Received data:', req.body); // ✅ Debugging log

  try {
    // ✅ Ensure the transactionIds array is initialized
    const user = new User({ 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      transactionIds: []  // ✅ Explicitly include this field
    });

    await user.save();
    res.status(201).send({ message: 'User registered successfully' });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({ error: 'Email already exists' });
    }
    res.status(400).send({ error: error.message });
  }
});

module.exports = router;
