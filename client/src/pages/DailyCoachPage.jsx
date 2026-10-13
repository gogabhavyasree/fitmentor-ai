import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const getLocalDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const DEFAULT_CHECK_IN = {
  sleepHours: 7,
  stressLevel: 2,
  sorenessLevel: 2,
  waterGlasses: 5,
  steps: 5000,
  availableMinutes: 30,
  painToday: false,
};

function DailyCoachPage({ user }) {
  const [form, setForm] = useState(DEFAULT_CHECK_IN);
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const date = getLocalDate();

  useEffect(() => {
    let active = true;
    const loadCheckIn = async () => {
      try {
        const response = await fetch(`/api/coach/today?date=${date}`, { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load today’s coach check-in.');
        if (active && data.checkIn) {
          const { sleepHours, stressLevel, sorenessLevel, waterGlasses, steps, availableMinutes, painToday } = data.checkIn;
          setForm({ sleepHours, stressLevel, sorenessLevel, waterGlasses, steps, availableMinutes, painToday });
          setCoaching(data.coaching);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadCheckIn();
    return () => { active = false; };
  }, [date]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : Number(value),
    }));
    setMessage('');
  };

  const saveCheckIn = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/coach/today', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save your check-in.');
      setCoaching(data.coaching);
      setMessage(data.message);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Loading today’s coach check-in...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Daily Life Coach</h1>
          <p className="page-intro">A quick check-in to shape today’s training around how you feel and the time you have.</p>
        </div>
        <span className="badge">Personalized daily check-in</span>
      </div>

      <div className="daily-coach-grid">
        <form className="form-card daily-coach-form" onSubmit={saveCheckIn}>
          <span className="section-eyebrow">HOW ARE YOU TODAY?</span>
          <h3>Your check-in</h3>

          <div className="form-group">
            <label htmlFor="coach-sleep">Sleep last night (hours)</label>
            <input id="coach-sleep" name="sleepHours" type="number" min="0" max="14" step="0.5" value={form.sleepHours} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="coach-stress">Stress level (1 low – 5 high)</label>
            <select id="coach-stress" name="stressLevel" value={form.stressLevel} onChange={handleChange}>
              {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}{level === 1 ? ' · Low' : level === 5 ? ' · High' : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="coach-soreness">Muscle soreness (1 low – 5 high)</label>
            <select id="coach-soreness" name="sorenessLevel" value={form.sorenessLevel} onChange={handleChange}>
              {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}{level === 1 ? ' · Low' : level === 5 ? ' · High' : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="coach-water">Water so far (glasses)</label>
            <input id="coach-water" name="waterGlasses" type="number" min="0" max="16" value={form.waterGlasses} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="coach-steps">Steps so far</label>
            <input id="coach-steps" name="steps" type="number" min="0" max="50000" step="100" value={form.steps} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="coach-time">Time available today (minutes)</label>
            <input id="coach-time" name="availableMinutes" type="number" min="0" max="120" step="5" value={form.availableMinutes} onChange={handleChange} required />
          </div>
          <label className="coach-pain-option">
            <input name="painToday" type="checkbox" checked={form.painToday} onChange={handleChange} />
            I’m experiencing pain today
          </label>

          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving check-in...' : coaching ? 'Update today’s check-in' : 'Get today’s coaching'}
          </button>
          {error && <p className="form-message" role="alert">{error}</p>}
          {message && <p className="form-message" role="status">{message}</p>}
        </form>

        <section className="summary-card daily-coach-result" aria-live="polite">
          <span className="section-eyebrow">TODAY’S GUIDANCE</span>
          {coaching ? (
            <>
              <div className={`recovery-score recovery-${coaching.recommendation.type}`}>
                <div><span>Recovery estimate</span><strong>{coaching.recoveryScore}<small> / 100</small></strong></div>
                <div className="recovery-meter" role="meter" aria-label="Recovery estimate" aria-valuemin="0" aria-valuemax="100" aria-valuenow={coaching.recoveryScore}>
                  <span style={{ width: `${coaching.recoveryScore}%` }} />
                </div>
              </div>
              <h3>{coaching.recommendation.title}</h3>
              <p className="coach-guidance">{coaching.recommendation.message}</p>
              {coaching.recommendation.workoutMinutes > 0 && (
                <div className="coach-workout-action">
                  <div>
                    <span className="measurement-label">Suggested session length</span>
                    <strong>{coaching.recommendation.workoutMinutes} minutes</strong>
                  </div>
                  {coaching.recommendation.workoutMinutes >= 15 && (
                    <Link
                      className="primary-button"
                      to="/ai-workout"
                      state={{ coachTime: coaching.recommendation.workoutMinutes }}
                    >
                      Build today’s workout
                    </Link>
                  )}
                </div>
              )}
              <p className="estimate-note">This is a simple, self-reported wellness estimate—not a medical assessment or diagnosis. Water needs vary by person and conditions.</p>
            </>
          ) : (
            <div className="empty-state daily-coach-empty">
              <strong>Your plan should fit your day.</strong>
              <span>Share a few quick signals to get a recovery estimate and a practical next step.</span>
            </div>
          )}
          <div className="coach-shortcuts">
            <Link to="/budget-diet">Plan affordable meals</Link>
            <Link to="/schedule">Check your weekly plan</Link>
          </div>
          <p className="estimate-note">Check-ins are saved to your FitMentor account for this date. If you feel unwell or have an injury concern, seek advice from a qualified professional.</p>
        </section>
      </div>
      <p className="muted daily-coach-footer">Hi {user?.name || 'there'} — small, consistent choices matter more than a perfect score.</p>
    </div>
  );
}

export default DailyCoachPage;
