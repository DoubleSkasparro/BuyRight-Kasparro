const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/signup', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});

router.post('/login', async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(401).send('Invalid');
  res.json(user);
});

module.exports = router;