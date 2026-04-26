import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { StoreContext } from '../context/StoreContext';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart } = useContext(StoreContext);

  return (
    <div className="simple-page">
      <Navbar />
      <div className="simple-page-content">
        <h2>Cart</h2>
        {cart.length === 0 ? (
          <p>No items</p>
        ) : (
          <div className="simple-list">
            {cart.map(item => (
              <div key={item._id} className="simple-list-item">
                <button
                  type="button"
                  className="simple-list-link"
                  onClick={() => navigate(`/product/${item._id}`)}
                >
                  <img src={item.image} alt={item.name} />
                </button>
                <button
                  type="button"
                  className="simple-list-details"
                  onClick={() => navigate(`/product/${item._id}`)}
                >
                  <h4>{item.name}</h4>
                  <p>Rs. {item.price}</p>
                </button>
                <button
                  className="secondary-button simple-list-remove"
                  onClick={() => removeFromCart(item._id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
