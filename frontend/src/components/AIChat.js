import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function getCurrentUsername() {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return 'guest';
  }

  try {
    return JSON.parse(storedUser).username || 'guest';
  } catch (error) {
    return 'guest';
  }
}

function buildHistoryKey(productId) {
  return `buyright-ai-history-${getCurrentUsername()}-${productId}`;
}

function extractReviewSignal(product) {
  const reviewText = product.reviews.map(item => item.text.toLowerCase()).join(' ');

  return {
    quality: reviewText.includes('premium') || reviewText.includes('sturdy') || reviewText.includes('polished') ? 'Strong' : 'Good',
    comfort: reviewText.includes('comfortable') || reviewText.includes('airy') || reviewText.includes('breathable') ? 'High' : 'Moderate',
    material: product.material,
    texture: product.texture
  };
}

function getClothingType(text) {
  const normalized = text.toLowerCase();
  const keywords = ['dress', 'kurti', 'gown', 'jacket', 'blazer', 'anarkali', 'suit', 'co-ord', 'maxi'];
  return keywords.find(keyword => normalized.includes(keyword)) || '';
}

function extractKeywords(text) {
  const keywords = [
    'dress', 'skirt', 'kurti', 'gown', 'jacket',
    'blazer', 'anarkali', 'suit', 'co-ord', 'maxi'
  ];
  const normalized = text.toLowerCase();
  return keywords.filter(keyword => normalized.includes(keyword));
}

function hueDistance(firstHue, secondHue) {
  const distance = Math.abs(firstHue - secondHue);
  return Math.min(distance, 360 - distance);
}

function getImageSignature(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      const sampleSize = 32;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      const cropRatio = 0.5; // focus center 50%
      const cropWidth = image.width * cropRatio;
      const cropHeight = image.height * cropRatio;
      const cropX = (image.width - cropWidth) / 2;
      const cropY = (image.height - cropHeight) / 2;
      context.drawImage(
        image,
        cropX, cropY, cropWidth, cropHeight, // source (cropped center)
        0, 0, sampleSize, sampleSize        // destination
      );

      const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
      let totalRed = 0;
      let totalGreen = 0;
      let totalBlue = 0;
      let totalPixels = 0;

      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3];

        if (alpha === 0) {
          continue;
        }

        totalRed += data[index];
        totalGreen += data[index + 1];
        totalBlue += data[index + 2];
        totalPixels += 1;
      }

      if (totalPixels === 0) {
        reject(new Error('No visible pixels'));
        return;
      }

      const averageRed = totalRed / totalPixels;
      const averageGreen = totalGreen / totalPixels;
      const averageBlue = totalBlue / totalPixels;
      const max = Math.max(averageRed, averageGreen, averageBlue);
      const min = Math.min(averageRed, averageGreen, averageBlue);
      const delta = max - min;
      const lightness = (max + min) / 2;
      const saturation = delta === 0 ? 0 : delta / (255 - Math.abs(2 * lightness - 255));

      let hue = 0;
      if (delta !== 0) {
        if (max === averageRed) {
          hue = ((averageGreen - averageBlue) / delta) % 6;
        } else if (max === averageGreen) {
          hue = (averageBlue - averageRed) / delta + 2;
        } else {
          hue = (averageRed - averageGreen) / delta + 4;
        }
        hue *= 60;
        if (hue < 0) {
          hue += 360;
        }
      }

      resolve({ hue, saturation, lightness });
    };

    image.onerror = () => {
      reject(new Error('Image load failed'));
    };

    image.src = imageUrl;
  });
}

export default function AIChat({ product, allProducts, onFaqAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingFaqQuestion, setPendingFaqQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isAnalyzingSimilar, setIsAnalyzingSimilar] = useState(false);
  const chatMessagesRef = useRef(null);
  const imageSignatureCacheRef = useRef({});

  useEffect(() => {
    setIsAnalysisOpen(false);
    setSimilarProducts([]);

    const storedHistory = localStorage.getItem(buildHistoryKey(product._id));

    if (storedHistory) {
      setMessages(JSON.parse(storedHistory));
      return;
    }

    setMessages([
      {
        role: 'assistant',
        text: 'How can I help you?'
      }
    ]);
  }, [product._id]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(buildHistoryKey(product._id), JSON.stringify(messages));
    }
  }, [messages, product._id]);

  useEffect(() => {
    if (!isOpen || !chatMessagesRef.current) {
      return;
    }

    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [isOpen, messages]);

  const resolveImageSignature = async (item) => {
    if (imageSignatureCacheRef.current[item._id]) {
      return imageSignatureCacheRef.current[item._id];
    }

    try {
      const signature = await getImageSignature(item.image);
      imageSignatureCacheRef.current[item._id] = signature;
      return signature;
    } catch (error) {
      const fallbackSignature = { hue: 0, saturation: 0, lightness: 0 };
      imageSignatureCacheRef.current[item._id] = fallbackSignature;
      return fallbackSignature;
    }
  };

  const buildSimilarResults = async () => {
    const referenceSignature = await resolveImageSignature(product);
    const referenceType = getClothingType(`${product.name} ${product.tags.join(' ')} ${product.description}`);

    const candidates = await Promise.all(
      allProducts
        .filter(item => item._id !== product._id)
        .map(async (item) => {
          const candidateSignature = await resolveImageSignature(item);
          const candidateType = getClothingType(`${item.name} ${item.tags.join(' ')} ${item.description}`);

          const typeScore = referenceType && referenceType === candidateType ? 1 : 0;
          const hueScore = 1 - Math.min(hueDistance(referenceSignature.hue, candidateSignature.hue) / 180, 1);
          const saturationScore = 1 - Math.min(Math.abs(referenceSignature.saturation - candidateSignature.saturation), 1);
          const lightnessScore = 1 - Math.min(Math.abs(referenceSignature.lightness - candidateSignature.lightness) / 255, 1);

          const referenceKeywords = extractKeywords(product.name);
          const candidateKeywords = extractKeywords(item.name);
          const keywordMatches = referenceKeywords.filter(k =>
            candidateKeywords.includes(k)
          );
          const keywordScore = keywordMatches.length > 0 ? 1 : 0;

          return {
            ...item,
            similarity: (keywordScore * 0.5) + (hueScore * 0.25) + (saturationScore * 0.15) + (lightnessScore * 0.10),
            reviewSignal: extractReviewSignal(item)
          };
        })
    );

    return candidates
      .sort((first, second) => second.similarity - first.similarity)
      .slice(0, 3);
  };

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const question = input.trim();
    const nextMessages = [...messages, { role: 'user', text: question }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            name: product.name,
            description: product.description,
            reviews: product.reviews,
            faqs: product.faqs.map(item => item.question || item)
          },
          question,
          history: nextMessages
        })
      });

      const data = await response.json();
      const assistantText = `${data.answer}\nConfidence: ${data.confidence}%`;
      const appendedMessages = [...nextMessages, { role: 'assistant', text: assistantText }];
      const canOfferFaq = Boolean(data.shouldOfferFaq);

      if (canOfferFaq) {
        setPendingFaqQuestion(question);
        appendedMessages.push({
          role: 'assistant',
          text: 'I could not confirm that directly from this product data. Would you like me to add this question to the product FAQs?'
        });
      } else {
        setPendingFaqQuestion('');
      }

      setMessages(appendedMessages);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          text: 'I could not reach the AI service right now. Please try again once the backend and Gemini key are configured.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFaqChoice = (shouldSave) => {
    if (shouldSave && pendingFaqQuestion) {
      onFaqAdd(pendingFaqQuestion);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Saved. This question has been added to the product FAQs for official follow-up.' }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Okay, I will not add this question to the FAQs.' }
      ]);
    }

    setPendingFaqQuestion('');
  };

  const handleAnalyzeSimilar = async () => {
    if (isAnalysisOpen) {
      setIsAnalysisOpen(false);
      return;
    }

    setIsAnalyzingSimilar(true);
    const nextSimilarProducts = await buildSimilarResults();
    setSimilarProducts(nextSimilarProducts);
    setIsAnalysisOpen(true);
    setIsAnalyzingSimilar(false);
  };

  return (
    <>
      <button className="ai-fab" onClick={() => setIsOpen(open => !open)}>
        Know more with AI
      </button>

      {isOpen && (
        <div className="chatbox">
          <div className="chatbox-header">
            <div>
              <strong>Product AI</strong>
              <p>Grounded only in this product&apos;s description and reviews.</p>
            </div>
            <button className="chatbox-close" onClick={() => setIsOpen(false)}>Close</button>
          </div>

          <div className="chatbox-messages" ref={chatMessagesRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          {pendingFaqQuestion && (
            <div className="faq-choice-box">
              <p>Add this question to FAQs?</p>
              <div className="faq-choice-actions">
                <button className="primary-button" onClick={() => handleFaqChoice(true)}>Yes</button>
                <button className="secondary-button" onClick={() => handleFaqChoice(false)}>No</button>
              </div>
            </div>
          )}

          <div className="chatbox-actions">
            <button className="secondary-button" onClick={handleAnalyzeSimilar} disabled={isAnalyzingSimilar}>
              {isAnalyzingSimilar ? 'Analyzing...' : isAnalysisOpen ? 'Close Analysis' : 'Analyze Similar Products'}
            </button>
          </div>

          {isAnalysisOpen && similarProducts.length > 0 && (
            <div className="similar-products-panel">
              <h3>Similar products</h3>
              <div className="similar-product-list">
                {similarProducts.map(item => (
                  <div key={item._id} className="similar-product-card">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <Link
                        to={`/product/${item._id}`}
                        onClick={() => {
                          setIsAnalysisOpen(false);
                          setSimilarProducts([]);
                          setIsOpen(false);
                        }}
                      >
                        {item.name}
                      </Link>
                      <p>Rs. {item.price}</p>
                      <p>{item.reviewSignal.material}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="similar-summary">
                For budget constraints, go for {similarProducts.reduce((lowest, item) => (
                  item.price < lowest.price ? item : lowest
                ), similarProducts[0]).name}. For better material feel, consider {similarProducts[0].name}. For comfort-focused wear, {similarProducts.find(item => item.reviewSignal.comfort === 'High')?.name || similarProducts[0].name} stands out.
              </p>

              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quality</th>
                    <th>Texture</th>
                    <th>Material</th>
                  </tr>
                </thead>
                <tbody>
                  {similarProducts.map(item => (
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td>Rs. {item.price}</td>
                      <td>{item.reviewSignal.quality}</td>
                      <td>{item.reviewSignal.texture}</td>
                      <td>{item.reviewSignal.material}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="chatbox-input-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about this product"
            />
            <button className="primary-button" onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
