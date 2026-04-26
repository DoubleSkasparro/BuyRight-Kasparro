const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

router.post('/:id/review', async (req, res) => {
  const product = await Product.findById(req.params.id);
  product.reviews.push(req.body);
  await product.save();
  res.json(product);
});

module.exports = router;