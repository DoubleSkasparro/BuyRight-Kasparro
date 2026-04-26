const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  image: String,
  seller: String,
  description: String,
  price: Number,
  reviews: [
    {
      user: String,
      text: String,
      rating: Number
    }
  ],
  faqs: [
    {
      question: String
    }
  ]
});

module.exports = mongoose.model('Product', productSchema);
