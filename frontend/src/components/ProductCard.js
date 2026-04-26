import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';

export default function ProductCard({ product }) {
  const nav = useNavigate();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  } = useContext(StoreContext);
  const isWishlisted = isInWishlist(product._id);

  const handleWishlistToggle = (event) => {
    event.stopPropagation();

    if (isWishlisted) {
      removeFromWishlist(product._id);
      return;
    }

    addToWishlist(product);
  };

  return (
    <div className="card" onClick={() => nav(`/product/${product._id}`)}>
      <button
        className={`wishlist-heart-button ${isWishlisted ? 'wishlist-heart-button-active' : ''}`}
        onClick={handleWishlistToggle}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      >
        {'\u2665'}
      </button>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>Rs. {product.price}</p>
    </div>
  );
}
