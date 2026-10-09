import { useState } from 'react';

function FitnessProfilePage({ user, setUser }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age || 20,
    goal: user?.goal || 'General Fitness',
    fitnessLevel: user?.fitnessLevel || 'Beginner',
    availableTime: user?.availableTime || 20,
    equipment: user?.equipment || 'Bodyweight',
    dietPreference: user?.dietPreference || 'Any',
    allergens: user?.allergens || [],
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update profile');
      setUser(data.user);
      setMessage('Profile and personalization preferences saved.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergen = (allergen) => setForm((current) => ({
    ...current,
    allergens: current.allergens.includes(allergen)
      ? current.allergens.filter((item) => item !== allergen)
      : [...current.allergens, allergen],
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Fitness Profile</h1>
        <span className="badge">Update details</span>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="profile-name">Name</label>
            <input id="profile-name" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="profile-age">Age</label>
            <input id="profile-age" name="age" type="number" min={13} max={120} value={form.age} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="profile-goal">Fitness goal</label>
            <select id="profile-goal" name="goal" value={form.goal} onChange={handleChange}>
              <option>Weight Loss</option>
              <option>Muscle Gain</option>
              <option>General Fitness</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fitness-level">Fitness level</label>
            <select id="fitness-level" name="fitnessLevel" value={form.fitnessLevel} onChange={handleChange}>
              <option>Beginner</option>
              <option>Intermediate</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="available-time">Workout time available (minutes)</label>
            <input id="available-time" name="availableTime" type="number" min={10} max={120} value={form.availableTime} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="profile-equipment">Available equipment</label>
            <select id="profile-equipment" name="equipment" value={form.equipment} onChange={handleChange}>
              <option>Bodyweight</option>
              <option>Dumbbells</option>
              <option>Yoga mat</option>
              <option>Home gym</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="diet-preference">Diet preference</label>
            <select id="diet-preference" name="dietPreference" value={form.dietPreference} onChange={handleChange}>
              <option>Any</option>
              <option>Vegetarian</option>
              <option>Non-vegetarian</option>
            </select>
          </div>
          <fieldset className="allergen-picker">
            <legend>Avoid foods containing these allergens</legend>
            <p className="estimate-note">Catalog tags are approximate. Always verify ingredient labels and preparation methods.</p>
            <div className="allergen-options">
              {['dairy', 'egg', 'fish', 'gluten', 'peanut', 'sesame', 'shellfish', 'soy', 'tree nuts'].map((allergen) => (
                <label key={allergen}>
                  <input type="checkbox" checked={form.allergens.includes(allergen)} onChange={() => toggleAllergen(allergen)} />
                  {allergen}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving preferences...' : 'Save profile & preferences'}</button>
          {message && <p className="form-message" role="status">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default FitnessProfilePage;
