import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function DashboardHabitWidget({ user }) {
  const [data, setData] = useState(null);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState('');

  const targetGlasses = user?.waterGoal || 8;

  const loadHabits = async () => {
    try {
      const response = await fetch('/api/coach/habits-summary', { credentials: 'include' });
      const res = await response.json();
      if (response.ok) {
        setData(res);
        if (res.todayCheckIn) {
          setWaterGlasses(res.todayCheckIn.waterGlasses || 0);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleWaterQuickAdd = async (delta) => {
    setUpdating(true);
    try {
      const response = await fetch('/api/coach/quick-water', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const res = await response.json();
      if (response.ok) {
        setWaterGlasses(res.checkIn.waterGlasses);
        setFeedback(delta > 0 ? '+1 Glass! 💧' : '-1 Glass');
        setTimeout(() => setFeedback(''), 2000);
        loadHabits();
      }
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  const streak = data?.currentStreak || 0;
  const habits = data?.todayCheckIn?.habits || {};
  const completedHabitsCount = ['workout', 'hydration', 'nutrition', 'sleep', 'recovery'].filter((k) => habits[k]).length;

  return (
    <section className="dashboard-habit-widget form-card">
      <div className="dash-widget-header">
        <div className="dash-widget-title">
          <span className="section-eyebrow">DAILY CONSISTENCY</span>
          <h3>Habits & Hydration</h3>
        </div>
        <div className="dash-streak-pill">
          <span className="fire-symbol">🔥</span>
          <strong>{streak}</strong>
          <span>Day Streak</span>
        </div>
      </div>

      <div className="dash-widget-body">
        {/* Quick Water Logger */}
        <div className="dash-water-col">
          <div className="dash-water-info">
            <span className="water-label">💧 Today's Water</span>
            <div className="dash-water-metric">
              <strong>{waterGlasses}</strong>
              <small>/ {targetGlasses} glasses ({(waterGlasses * 0.25).toFixed(1)}L)</small>
            </div>
            {feedback && <span className="dash-water-feedback">{feedback}</span>}
          </div>

          <div className="dash-water-btns">
            <button
              className="dash-water-add-btn"
              onClick={() => handleWaterQuickAdd(1)}
              disabled={updating || waterGlasses >= 16}
              type="button"
              title="Add 1 glass of water"
            >
              + 1 Glass
            </button>
            <button
              className="dash-water-sub-btn"
              onClick={() => handleWaterQuickAdd(-1)}
              disabled={updating || waterGlasses <= 0}
              type="button"
              title="Remove 1 glass"
            >
              -
            </button>
          </div>
        </div>

        {/* Quick Habits status */}
        <div className="dash-habits-col">
          <div className="dash-habits-header">
            <span>Core Routines:</span>
            <strong>{completedHabitsCount} / 5 Done</strong>
          </div>
          <div className="dash-habits-mini-row">
            <span className={`mini-habit-tag ${habits.workout ? 'done' : ''}`} title="Workout">
              🏋️ {habits.workout ? 'Done' : 'Workout'}
            </span>
            <span className={`mini-habit-tag ${habits.hydration ? 'done' : ''}`} title="Hydration">
              💧 {habits.hydration ? 'Done' : 'Water'}
            </span>
            <span className={`mini-habit-tag ${habits.nutrition ? 'done' : ''}`} title="Protein / Nutrition">
              🥗 {habits.nutrition ? 'Done' : 'Protein'}
            </span>
            <span className={`mini-habit-tag ${habits.sleep ? 'done' : ''}`} title="Sleep">
              🌙 {habits.sleep ? 'Done' : 'Sleep'}
            </span>
          </div>
        </div>
      </div>

      <div className="dash-widget-footer">
        <Link to="/habits" className="dash-habit-link">
          Open Habit Tracker & 7-Day Consistency →
        </Link>
        <Link to="/protein-finder" className="dash-secondary-link">
          Protein Finder ⚡
        </Link>
      </div>
    </section>
  );
}

export default DashboardHabitWidget;
