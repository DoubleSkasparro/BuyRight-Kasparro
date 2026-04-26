const express = require('express');
const router = express.Router();
const { askAI } = require('../utils/gemini');

router.post('/ask', async (req, res) => {
  try {
    const result = await askAI({
      product: req.body.product,
      question: req.body.question,
      history: req.body.history
    });

    res.json(result);
  } catch (error) {
    console.error("AI ERROR:", error);

    res.status(500).json({
      answer: 'I could not process that question right now.',
      confidence: 0,
      shouldOfferFaq: true
    });
  }
});

module.exports = router;
