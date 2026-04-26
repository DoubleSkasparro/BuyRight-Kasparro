import React, { createContext, useEffect, useMemo, useState } from 'react';

export const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const storedCart = localStorage.getItem('buyright-cart');
    return storedCart ? JSON.parse(storedCart) : [];
  });
  const [wishlist, setWishlist] = useState(() => {
    const storedWishlist = localStorage.getItem('buyright-wishlist');
    return storedWishlist ? JSON.parse(storedWishlist) : [];
  });

  useEffect(() => {
    localStorage.setItem('buyright-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('buyright-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product) => {
    setCart(prev => (
      prev.some(item => item._id === product._id) ? prev : [...prev, product]
    ));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  const addToWishlist = (product) => {
    setWishlist(prev => (
      prev.some(item => item._id === product._id) ? prev : [...prev, product]
    ));
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => item._id !== productId));
  };

  const storeValue = useMemo(() => ({
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
    isInCart: productId => cart.some(item => item._id === productId),
    isInWishlist: productId => wishlist.some(item => item._id === productId)
  }), [cart, wishlist]);

  return (
    <StoreContext.Provider value={storeValue}>
      {children}
    </StoreContext.Provider>
  );
}
