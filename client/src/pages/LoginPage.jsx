import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: 'admin@fitmentor.ai',
    password: 'admin123',
  });

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      onLogin(data.user);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>FitMentor AI</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="auth-actions">
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
          </div>
          <button className="primary-button" type="submit">Login</button>
        </form>
        <p>Need an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}

export default LoginPage;
