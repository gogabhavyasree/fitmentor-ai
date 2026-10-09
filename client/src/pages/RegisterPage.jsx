import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function RegisterPage({ onRegister }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: 20,
    goal: 'General Fitness',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      onRegister(data.user);
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>FitMentor AI</h1>
        <h2>Register</h2>
        <form onSubmit={handleSubmit} className="auth-actions">
          <div className="form-group">
            <label htmlFor="register-name">Name</label>
            <input id="register-name" name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={handleChange} required />
            <small className="muted">Use at least 8 characters.</small>
          </div>
          <div className="form-group">
            <label htmlFor="register-age">Age</label>
            <input id="register-age" name="age" type="number" min={13} max={120} value={form.age} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="register-goal">Fitness Goal</label>
            <select id="register-goal" name="goal" value={form.goal} onChange={handleChange}>
              <option>Weight Loss</option>
              <option>Muscle Gain</option>
              <option>General Fitness</option>
            </select>
          </div>
          {error && <p className="camera-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default RegisterPage;
