import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      const user = await res.json();
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/home');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Welcome Back</p>
        <h2>Login</h2>
        <p className="auth-subtext">Access your account to continue shopping smarter with BuyRight.</p>

        <div className="auth-form">
          <input
            placeholder="Username"
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <button className="auth-submit-button" onClick={handleLogin}>Login</button>
        </div>
      </div>
    </div>
  );
}
