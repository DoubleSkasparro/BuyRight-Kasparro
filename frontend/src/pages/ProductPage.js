import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AIChat from '../components/AIChat';
import Navbar from '../components/Navbar';
import { StoreContext } from '../context/StoreContext';
import { dummyProducts, getProductById } from '../data/products';

function buildFallbackTimestamp(totalItems, index) {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, index - totalItems)).toISOString();
}

function normalizeReviews(reviews = []) {
  return reviews.map((review, index) => ({
    ...review,
    createdAt: review.createdAt || buildFallbackTimestamp(reviews.length, index)
  }));
}

function normalizeFaqs(faqs = []) {
  return faqs.map((faq, index) => {
    if (typeof faq === 'string') {
      return {
        question: faq,
        answer: '',
        askedByUsername: 'Guest User',
        askedByEmail: '',
        answeredAt: '',
        createdAt: buildFallbackTimestamp(faqs.length, index)
      };
    }

    return {
      ...faq,
      question: faq.question || '',
      answer: faq.answer || '',
      askedByUsername: faq.askedByUsername || 'Guest User',
      askedByEmail: faq.askedByEmail || '',
      answeredAt: faq.answeredAt || '',
      createdAt: faq.createdAt || buildFallbackTimestamp(faqs.length, index)
    };
  });
}

function getStoredProductState(productId) {
  const stored = localStorage.getItem(`buyright-product-${productId}`);
  return stored ? JSON.parse(stored) : null;
}

function buildCurrentProduct(baseProduct) {
  const storedState = getStoredProductState(baseProduct._id);

  return {
    ...baseProduct,
    reviews: normalizeReviews(storedState?.reviews || baseProduct.reviews),
    faqs: normalizeFaqs(storedState?.faqs || baseProduct.faqs)
  };
}

function buildFaqKey(item, index) {
  return `${item.createdAt || index}-${item.question}`;
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, isInCart, isInWishlist } = useContext(StoreContext);
  const baseProduct = getProductById(id);
  const [reviewText, setReviewText] = useState('');
  const [ratingInput, setRatingInput] = useState('');
  const [product, setProduct] = useState(baseProduct ? buildCurrentProduct(baseProduct) : null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [faqDrafts, setFaqDrafts] = useState({});
  const [activeFaqKey, setActiveFaqKey] = useState('');

  useEffect(() => {
    if (baseProduct) {
      setProduct(buildCurrentProduct(baseProduct));
      setShowAllReviews(false);
      setShowAllFaqs(false);
      setFaqDrafts({});
      setActiveFaqKey('');
    }
  }, [baseProduct, id]);

  const currentUser = useMemo(() => {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      return { username: 'Guest User', email: '' };
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      return {
        username: parsedUser.username || 'Guest User',
        email: parsedUser.email || ''
      };
    } catch (error) {
      return { username: 'Guest User', email: '' };
    }
  }, []);
  const isLoggedInUser = currentUser.username !== 'Guest User';

  const averageRating = useMemo(() => {
    if (!product || product.reviews.length === 0) {
      return 0;
    }

    const ratedReviews = product.reviews.filter(item => item.rating);

    if (ratedReviews.length === 0) {
      return 0;
    }

    const total = ratedReviews.reduce((sum, item) => sum + item.rating, 0);
    return (total / ratedReviews.length).toFixed(1);
  }, [product]);

  const sortedReviews = useMemo(() => {
    if (!product) {
      return [];
    }

    return [...product.reviews].sort((first, second) => (
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    ));
  }, [product]);

  const visibleReviews = useMemo(() => (
    showAllReviews ? sortedReviews : sortedReviews.slice(0, 8)
  ), [showAllReviews, sortedReviews]);

  const sortedFaqs = useMemo(() => {
    if (!product) {
      return [];
    }

    return [...product.faqs].sort((first, second) => (
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    ));
  }, [product]);

  const visibleFaqs = useMemo(() => (
    showAllFaqs ? sortedFaqs : sortedFaqs.slice(0, 5)
  ), [showAllFaqs, sortedFaqs]);

  if (!product) {
    return (
      <div className="simple-page">
        <Navbar />
        <div className="simple-page-content">
          <p>Product not found.</p>
          <button className="secondary-button" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      </div>
    );
  }

  const persistProduct = (nextProduct) => {
    setProduct(nextProduct);
    localStorage.setItem(`buyright-product-${product._id}`, JSON.stringify({
      reviews: nextProduct.reviews,
      faqs: nextProduct.faqs
    }));
  };

  const handleReviewSubmit = () => {
    if (!reviewText.trim() && !ratingInput) {
      return;
    }

    const parsedRating = Number(ratingInput);
    const nextReview = {
      user: currentUser.username,
      text: reviewText.trim() || 'Shared a rating without a written review.',
      rating: Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 5 ? parsedRating : undefined,
      createdAt: new Date().toISOString()
    };

    const nextProduct = {
      ...product,
      reviews: [...product.reviews, nextReview]
    };

    persistProduct(nextProduct);
    setShowAllReviews(false);
    setReviewText('');
    setRatingInput('');
  };

  const handleFaqAnswerChange = (faqKey, value) => {
    setFaqDrafts(prev => ({
      ...prev,
      [faqKey]: value
    }));
  };

  const handleFaqAnswerSubmit = async (faqItem, faqKey) => {
    const answerText = (faqDrafts[faqKey] || '').trim();

    if (!answerText || faqItem.answer) {
      return;
    }

    const nextFaqs = product.faqs.map(item => {
      const itemKey = buildFaqKey(item, 0);

      if (itemKey !== faqKey) {
        return item;
      }

      return {
        ...item,
        answer: answerText,
        answeredAt: new Date().toISOString()
      };
    });

    const nextProduct = {
      ...product,
      faqs: nextFaqs
    };

    persistProduct(nextProduct);
    setFaqDrafts(prev => ({
      ...prev,
      [faqKey]: ''
    }));
    setActiveFaqKey('');

    if (faqItem.askedByEmail) {
      try {
        await fetch('http://localhost:5000/api/notifications/faq-answered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: faqItem.askedByEmail,
            productName: product.name,
            question: faqItem.question,
            answer: answerText
          })
        });
      } catch (error) {
        // Keep UI success even if email fails.
      }
    }
  };

  return (
    <div className="product-page-shell">
      <Navbar />
      <div className="product-page">
        <section className="product-hero">
          <div className="product-image-panel">
            <img src={product.image} alt={product.name} className="product-image" />
          </div>

          <div className="product-details">
            <p className="eyebrow">Sold by {product.seller}</p>
            <h1>{product.name}</h1>
            <p className="product-price">Rs. {product.price}</p>
            <p className="product-rating">
              Current rating: {averageRating} / 5
              <span> ({product.reviews.length} reviews)</span>
            </p>
            <p className="product-description">{product.description}</p>

            <div className="product-meta-grid">
              <div>
                <strong>Material</strong>
                <p>{product.material}</p>
              </div>
              <div>
                <strong>Texture</strong>
                <p>{product.texture}</p>
              </div>
              <div>
                <strong>Occasion</strong>
                <p>{product.occasion}</p>
              </div>
            </div>

            <div className="product-actions">
              {isInWishlist(product._id) ? (
                <button className="secondary-button" onClick={() => navigate('/wishlist')}>
                  GoToWishlist
                </button>
              ) : (
                <button className="secondary-button" onClick={() => addToWishlist(product)}>
                  AddToWishlist
                </button>
              )}

              {isInCart(product._id) ? (
                <button className="primary-button" onClick={() => navigate('/cart')}>
                  GoToCart
                </button>
              ) : (
                <button className="primary-button" onClick={() => addToCart(product)}>
                  AddToCart
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="product-review-layout">
          <div className="review-form-card">
            <h2>Add your review</h2>
            <p className="muted-copy">Your review is shown with your username. Ratings update the current average automatically.</p>
            <textarea
              className="review-textarea"
              placeholder="Write what you liked, disliked, or noticed about fit, quality, or comfort..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
            />
            <input
              className="rating-input"
              type="number"
              min="1"
              max="5"
              step="1"
              placeholder="Add rating (1 to 5)"
              value={ratingInput}
              onChange={e => setRatingInput(e.target.value)}
            />
            <button className="primary-button" onClick={handleReviewSubmit}>Submit Review</button>
          </div>

          <div className="review-list-card">
            <h2>Reviews</h2>
            <div className="review-list">
              {visibleReviews.map((item, index) => (
                <div key={`${item.user}-${index}`} className="review-item">
                  <div className="review-header">
                    <strong>{item.user}</strong>
                    <span>{item.rating ? `${item.rating}/5` : 'No rating'}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
            {sortedReviews.length > 8 && (
              <button
                className="secondary-button review-toggle-button"
                onClick={() => setShowAllReviews(current => !current)}
              >
                {showAllReviews ? 'ShowLess' : 'ShowAllReviews'}
              </button>
            )}
          </div>
        </section>

        <section className="faq-card">
          <h2>FAQs</h2>
          <div className="faq-list">
            {visibleFaqs.map((item, index) => {
              const faqKey = buildFaqKey(item, index);

              return (
                <div key={`${item.question}-${index}`} className="faq-item">
                  <p><strong>Q:</strong> {item.question}</p>
                  {item.answer ? (
                    <p><strong>A:</strong> {item.answer}</p>
                  ) : !isLoggedInUser ? (
                    <p>Please login to answer this FAQ.</p>
                  ) : (
                    <>
                      {activeFaqKey !== faqKey ? (
                        <button
                          className="secondary-button review-toggle-button"
                          onClick={() => setActiveFaqKey(faqKey)}
                          type="button"
                        >
                          Answer
                        </button>
                      ) : (
                        <>
                          <textarea
                            className="review-textarea"
                            placeholder="Type your answer..."
                            value={faqDrafts[faqKey] || ''}
                            onChange={e => handleFaqAnswerChange(faqKey, e.target.value)}
                          />
                          <button
                            className="primary-button"
                            onClick={() => handleFaqAnswerSubmit(item, faqKey)}
                            type="button"
                          >
                            Submit Answer
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {sortedFaqs.length > 5 && (
            <button
              className="secondary-button review-toggle-button"
              onClick={() => setShowAllFaqs(current => !current)}
            >
              {showAllFaqs ? 'ShowLess' : 'ShowAllFAQs'}
            </button>
          )}
        </section>
      </div>

      <AIChat
        product={product}
        allProducts={dummyProducts}
        onFaqAdd={question => {
          const nextProduct = {
            ...product,
            faqs: [
              ...product.faqs,
              {
                question,
                answer: '',
                askedByUsername: currentUser.username,
                askedByEmail: currentUser.email,
                answeredAt: '',
                createdAt: new Date().toISOString()
              }
            ]
          };
          persistProduct(nextProduct);
          setShowAllFaqs(false);
        }}
      />
    </div>
  );
}
