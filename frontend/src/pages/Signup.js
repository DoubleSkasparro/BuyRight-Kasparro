import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSignup = async () => {
    await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    alert('Signup successful');
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Join BuyRight</p>
        <h2>Signup</h2>
        <p className="auth-subtext">Create your account to compare, save, and discover your next favorite look.</p>

        <div className="auth-form">
          <input
            placeholder="Username"
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <button className="auth-submit-button" onClick={handleSignup}>Signup</button>
        </div>
      </div>
    </div>
  );
}
