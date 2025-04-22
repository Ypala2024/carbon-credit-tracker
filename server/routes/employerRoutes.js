const express = require('express');
const router = express.Router();
const User = require('../models/User');


// GET: All employees for this employer's organization
router.get('/:org', async (req, res) => {
    if (!req.user.organization || req.user.role !== 'employer') {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
  try {
    const employees = await User.find({ organization: req.params.org, role: 'employee' })
      .select('-password'); // don't return password
    res.json(employees);
  } catch (err) {
    res.status(500).send('Server error');
  }

  router.get('/:org', verifyToken, async (req, res) => {
    // ...same logic
  });
  

  router.get('/:org', async (req, res) => {
    try {
      console.log('Fetching employees for org:', req.params.org);
  
      const employees = await User.find({
        organization: req.params.org,
        role: 'employee',
      }).select('-password');
  
      console.log('Found employees:', employees); // 🔍 log this
  
      res.json(employees);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });

  // POST: Transfer credits to another org
router.post('/transfer', verifyToken, async (req, res) => {
    if (!req.user.organization || req.user.role !== 'employer') {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
    const { fromOrg, toOrg, amount } = req.body;
  
    try {
      const senderEmployees = await User.find({ organization: fromOrg, role: 'employee' });
      const totalCredits = senderEmployees.reduce((sum, emp) => sum + emp.carbonCredits, 0);
  
      if (totalCredits < amount) {
        return res.status(400).json({ msg: 'Not enough credits to transfer' });
      }
  
      // Deduct credits from sender org employees (evenly)
      let remaining = amount;
      for (let emp of senderEmployees) {
        const deduct = Math.min(emp.carbonCredits, remaining);
        emp.carbonCredits -= deduct;
        remaining -= deduct;
        await emp.save();
        if (remaining <= 0) break;
      }
  
      // Add credits to receiver org employees (evenly)
      const receiverEmployees = await User.find({ organization: toOrg, role: 'employee' });
      const addAmount = Math.floor(amount / receiverEmployees.length);
  
      for (let emp of receiverEmployees) {
        emp.carbonCredits += addAmount;
        await emp.save();
      }
  
      res.json({ msg: `Transferred ${amount} credits from ${fromOrg} to ${toOrg}` });
    } catch (err) {
      console.error(err);
      res.status(500).send('Transfer failed');
    }
  });
  
  
  
});

module.exports = router;
