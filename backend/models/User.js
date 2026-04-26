const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: String,
  wishlist: [String],
  cart: [String]
});

module.exports = mongoose.model('User', userSchema);
