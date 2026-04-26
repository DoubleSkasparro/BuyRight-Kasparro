# BuyRight - 

Here is the **https://youtube.com/watch?v=pRk88QR8AmQ&feature=shared**:

---

## Problem Statement:  Track 1 - AI Shopping Agent

To build an AI shopping agent that helps users discover the right products and move smoothly from intent to purchase, with a guided conversation.

---

## Proposed Solution and Features

AI-powered e-commerce platform that helps users make informed purchase decisions through a context-aware shopping assistant. Opening a product page, a user can click on the "Know More With AI" button to begin or continue chatting with the agent. This agent gathers product data from its description and all customer reviews, to provide answers along with confidence scores, also handling conflicting reviews. In case of insufficient information, it gracefully declines and enables user to contribute to FAQs. These factors make the agent **Hallucination-free, Grounded, Trustworthy, and Transparent**. The agent also provides analytical product recommendations to make users' buying decisions easier, implementing an AI architecture with Human-in-the-loop design.

**Key features**:
- **Hallucination-Free AI Assistant**:
  The AI agent is strictly constrained to product-specific data (product description + all verified user reviews). It does not generate unsupported claims, ensuring trust and factual reliability.

- **Review-Aware Intelligence**:
  The agent analyzes all user reviews, extracts patterns, sentiments, and recurring themes before responding, thus also acting as an automated review summarizer + advisor.

- **Confidence-Scored Responses**:
  Every AI response is accompanied by a confidence score (0 - 100), giving users a clear signal of how reliable the response is. This improves transparency.

- **Conflict-Aware Reasoning**:
  When reviews contain contradictory opinions (say, “good quality” vs “poor stitching”), the AI:
  - Detects the conflict
  - Explains both perspectives briefly and analytically
  - Reduces the confidence score accordingly

- **Graceful Uncertainty Handling**:
  If the answer cannot be derived from available product data, the AI explicitly says so with a 0 confidence score.

- **Dynamic FAQ Generation**:
  For low-confidence answers ( < 35% ), the agent prompts users to add the query to FAQs, which can then be answered by other users.

- **Product-Specific Conversational Memory**:
  The agent maintains chat context and memory per product, allowing follow-up context-aware questions.

- **AI-Based Comparative Insights**:
  The agent helps user analyze similar products, by comparing them across price, ratings, and review attributes (quality, material, comfort, etc.). It then provides concise decision recommendations. For example, "If you want to go with comfort and good material, go for Product 1. If you have a lower budget, go for Product 2, ..."

- **Human In The Loop Design**:
  The agent allows the final decision to be made by the user, after summarizing all possible comparisons between the recommended products. This gives users a greater control.

**Tech stack**:

- Frontend: React.js
- Backend: Node.js, Express
- Database: MongoDB
- AI/LLM Integration: Google Gemini API

---

## How to run?

Prerequisites are Node.js (LTS recommended), npm, and MongoDB running locally at `mongodb://127.0.0.1:27017`

1. Change directory to `backend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` inside `backend/` with:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start backend server:
   ```bash
   npm start
   ```
   Backend runs on `http://localhost:5000`

5. Change directory to `frontend`
6. Install dependencies:
   ```bash
   npm install
   ```
3. Start frontend:
   ```bash
   npm start
   ```
   Frontend runs on `http://localhost:3000`
