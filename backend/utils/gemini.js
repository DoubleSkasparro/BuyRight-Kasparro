const { GoogleGenerativeAI } = require('@google/generative-ai');

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
}

exports.askAI = async ({ product, question, history }) => {
  const client = createGeminiClient();

  if (!client) {
    return {
      answer: 'I do not have a configured Gemini API key, so I cannot answer right now.',
      confidence: 0,
      shouldOfferFaq: false
    };
  }

  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are BuyRight's product assistant.

STRICT RULES:
- Use ONLY the given product description, reviews, and FAQs.
- DO NOT use outside knowledge.
- DO NOT hallucinate.

INTELLIGENCE RULES:
1. If multiple sources (description + reviews) agree → use that.
2. If there is CONFLICT:
   - Count how many sources support each side
   - Choose the MAJORITY opinion
   - Confidence = (majority count / total mentions) * 100

3. If NO information exists related to the question:
   - answer: "I could not find any information about this in the product data."
   - confidence: 0
   - shouldOfferFaq: true

4. If confidence < 35:
   - shouldOfferFaq MUST be true

5. If answering:
   - Be direct
   - Mention uncertainty if conflict exists
  
RETURN STRICT JSON:
{
  "answer": string,
  "confidence": number (0-100),
  "shouldOfferFaq": boolean
}

Product name: ${product.name}
Description: ${product.description}
Reviews: ${JSON.stringify(product.reviews)}
FAQ questions: ${JSON.stringify(product.faqs || [])}
Chat history: ${JSON.stringify(history || [])}
User question: ${question}
`;

  let result;

  try {
    result = await model.generateContent(prompt);
  } catch (error) {
    if (error && error.status === 429) {
      return {
        answer: 'I am currently rate-limited by the AI provider. You can retry shortly, or add this as an FAQ for follow-up.',
        confidence: 0,
        shouldOfferFaq: true
      };
    }

    throw error;
  }

  let text = '';

  try {
    text = result.response.text();
  } catch (e) {
    console.error("Gemini response error:", result);
    throw new Error("Invalid Gemini response format");
  }

  text = text.trim();
  const normalizedText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
  console.log(normalizedText);

  try {
    const parsed = JSON.parse(normalizedText);
    if (
      parsed.confidence === 0 ||
      parsed.confidence < 35 ||
      !parsed.answer ||
      parsed.answer.toLowerCase().includes('could not find')
    ) {
      parsed.shouldOfferFaq = true;
    }
    if (parsed.confidence > 100) parsed.confidence = 100;
    if (parsed.confidence < 0) parsed.confidence = 0;
    return parsed;
  } catch (error) {
    // const confidenceMatch = normalizedText.match(/confidence[:\s]+(\d{1,3})/i);
    console.error("JSON PARSE ERROR:", normalizedText);
    return {
      answer: normalizedText,
      // confidence: confidenceMatch ? Number(confidenceMatch[1]) : 40,
      confidence: 40,
      shouldOfferFaq: true
    };
  }
};
