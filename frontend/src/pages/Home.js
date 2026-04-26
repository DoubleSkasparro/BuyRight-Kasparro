import React, { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { dummyProducts } from '../data/products';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return dummyProducts;
    }

    return dummyProducts.filter(product =>
      `${product.name} ${product.seller} ${product.tags.join(' ')}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [searchTerm]);

  return (
    <div className="home-page">
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <section className="home-content">
        <div className="hero-copy">
          <p className="eyebrow">Women&apos;s Fashion</p>
          <h1>Fresh picks for everyday wear, work, and festive moments.</h1>
          <p className="subtext">Browse dummy products and use the search bar above to filter the collection.</p>
        </div>
        <div className="grid">
          {filteredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
