import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ searchTerm = '', onSearchChange = () => {} }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="navbar">
      <h3 className="navbar-brand" onClick={() => navigate('/home')}>
        BuyRight
      </h3>

      <input
        className="navbar-search"
        placeholder="Search women's clothing..."
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
      />

      <button onClick={() => navigate('/wishlist')}>Wishlist</button>
      <button onClick={() => navigate('/cart')}>Cart</button>

      {user ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <>
          <button onClick={() => navigate('/login')}>Login</button>
          <button onClick={() => navigate('/signup')}>Signup</button>
        </>
      )}
    </div>
  );
}
