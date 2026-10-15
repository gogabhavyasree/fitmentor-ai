import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HABIT_CONFIGS = [
  { key: 'workout', label: 'Workout Completed', icon: '🏋️‍♂️', desc: 'Finished scheduled session or form check' },
  { key: 'hydration', label: 'Hydration Target Met', icon: '💧', desc: 'Drank at least 8 glasses (2.0L) of water' },
  { key: 'nutrition', label: 'Protein Goal Hit', icon: '🥗', desc: 'Reached daily dietary protein target' },
  { key: 'sleep', label: '7+ Hours Sleep', icon: '🌙', desc: 'Restored energy with quality recovery sleep' },
  { key: 'recovery', label: 'Daily Check-in / Mobility', icon: '🧘', desc: 'Completed daily coach reflection or stretch' },
];

function HabitTrackerPage({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [updatingWater, setUpdatingWater] = useState(false);
  const [updatingHabit, setUpdatingHabit] = useState('');
  const [toast, setToast] = useState('');

  const targetGlasses = user?.waterGoal || 8;

  const loadSummary = async () => {
    try {
      const response = await fetch('/api/coach/habits-summary', { credentials: 'include' });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Could not load habit summary.');
      setData(resData);
      if (resData.todayCheckIn) {
        setWaterGlasses(resData.todayCheckIn.waterGlasses || 0);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleWaterDelta = async (delta) => {
    setUpdatingWater(true);
    try {
      const response = await fetch('/api/coach/quick-water', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Could not update water intake.');
      setWaterGlasses(resData.checkIn.waterGlasses);
      setToast(delta > 0 ? '+1 Glass of water logged! 💧' : 'Water glass removed.');
      setTimeout(() => setToast(''), 2500);
      loadSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingWater(false);
    }
  };

  const handleHabitToggle = async (habitKey, currentVal) => {
    setUpdatingHabit(habitKey);
    try {
      const response = await fetch('/api/coach/habit-toggle', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit: habitKey, completed: !currentVal }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Could not toggle habit.');
      loadSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingHabit('');
    }
  };

  const currentHabits = data?.todayCheckIn?.habits || {};
  const currentStreak = data?.currentStreak || 0;
  const bestStreak = data?.bestStreak || 0;
  const completedHabitsCount = HABIT_CONFIGS.filter((h) => currentHabits[h.key]).length;

  const getStreakTier = (streak) => {
    if (streak >= 30) return { title: '30-Day Legend', icon: '🏆', color: 'streak-gold' };
    if (streak >= 14) return { title: '14-Day Champion', icon: '⚡', color: 'streak-purple' };
    if (streak >= 7) return { title: '7-Day Warrior', icon: '🔥', color: 'streak-orange' };
    if (streak >= 3) return { title: '3-Day Spark', icon: '✨', color: 'streak-blue' };
    return { title: 'Building Momentum', icon: '🌱', color: 'streak-gray' };
  };

  const streakInfo = getStreakTier(currentStreak);

  return (
    <div className="habit-tracker-page">
      <div className="page-header">
        <div>
          <span className="welcome-eyebrow">CONSISTENCY & DISCIPLINE</span>
          <h1>Daily Habits & Hydration Tracker</h1>
          <p className="page-lead">
            Small daily habits compound into massive physical results. Log your water, lock in daily routines, and protect your streak.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/daily-coach" className="secondary-button">Daily Coach</Link>
          <Link to="/calculator" className="primary-button">Macro Calculator</Link>
        </div>
      </div>

      {toast && (
        <div className="toast-notification success-toast" role="status">
          {toast}
        </div>
      )}
      {error && (
        <div className="toast-notification error-toast" role="alert">
          {error}
        </div>
      )}

      {/* Streak Hero Banner */}
      <section className="streak-hero-banner">
        <div className="streak-badge-col">
          <div className={`streak-fire-ring ${streakInfo.color}`}>
            <span className="streak-icon">{streakInfo.icon}</span>
            <span className="streak-number">{currentStreak}</span>
          </div>
          <span className="streak-caption">DAY STREAK</span>
        </div>

        <div className="streak-content-col">
          <div className="streak-tier-badge">{streakInfo.title}</div>
          <h2>{currentStreak > 0 ? `You're on a ${currentStreak}-day roll!` : 'Start your streak today!'}</h2>
          <p>
            {currentStreak >= 7
              ? 'Incredible consistency! Your fitness habits are becoming second nature.'
              : 'Complete your workout, meet your water goal, and check in today to keep your streak glowing.'}
          </p>
          <div className="streak-records">
            <span>🔥 Current Streak: <strong>{currentStreak} days</strong></span>
            <span>⭐ Best Streak: <strong>{bestStreak} days</strong></span>
          </div>
        </div>
      </section>

      {/* Main Grid: Water Tracker + Daily Habits */}
      <div className="habits-main-grid">
        {/* Hydration Tracker Card */}
        <div className="form-card water-tracker-card">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">HYDRATION ENGINE</span>
              <h3>Water Intake</h3>
            </div>
            <span className="section-icon">💧</span>
          </div>

          <div className="water-status-hero">
            <div className="water-progress-circle">
              <svg className="water-svg" viewBox="0 0 100 100">
                <circle className="water-bg-circle" cx="50" cy="50" r="42" />
                <circle
                  className="water-bar-circle"
                  cx="50"
                  cy="50"
                  r="42"
                  style={{
                    strokeDasharray: 264,
                    strokeDashoffset: 264 - (264 * Math.min(100, (waterGlasses / targetGlasses) * 100)) / 100,
                  }}
                />
              </svg>
              <div className="water-circle-text">
                <strong>{waterGlasses}</strong>
                <small>/ {targetGlasses} glasses</small>
              </div>
            </div>

            <div className="water-hero-info">
              <h4>{(waterGlasses * 0.25).toFixed(1)} L Drank</h4>
              <p className="water-target-text">
                Target: <strong>{(targetGlasses * 0.25).toFixed(1)} L</strong> ({targetGlasses} glasses)
              </p>
              {waterGlasses >= targetGlasses ? (
                <span className="hydro-badge complete">✓ Daily Goal Met!</span>
              ) : (
                <span className="hydro-badge pending">
                  {targetGlasses - waterGlasses} glasses remaining
                </span>
              )}
            </div>
          </div>

          {/* Glass Rack Visualization */}
          <div className="glass-rack-row" aria-label="Visual water glasses">
            {Array.from({ length: targetGlasses }).map((_, i) => (
              <span
                key={i}
                className={`water-glass-icon ${i < waterGlasses ? 'filled' : 'empty'}`}
                title={`Glass ${i + 1}`}
              >
                🥛
              </span>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="water-actions-row">
            <button
              className="water-btn primary-water-btn"
              onClick={() => handleWaterDelta(1)}
              disabled={updatingWater || waterGlasses >= 16}
              type="button"
            >
              + 1 Glass (250ml)
            </button>
            <button
              className="water-btn secondary-water-btn"
              onClick={() => handleWaterDelta(2)}
              disabled={updatingWater || waterGlasses >= 15}
              type="button"
            >
              + 2 Glasses (500ml)
            </button>
            <button
              className="water-btn sub-water-btn"
              onClick={() => handleWaterDelta(-1)}
              disabled={updatingWater || waterGlasses <= 0}
              type="button"
              title="Remove one glass"
            >
              - 1
            </button>
          </div>
        </div>

        {/* Daily Habits Checklist Card */}
        <div className="summary-card daily-habits-card">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">DAILY DISCIPLINE</span>
              <h3>Today's Core Habits</h3>
            </div>
            <span className="badge">{completedHabitsCount} / {HABIT_CONFIGS.length} Done</span>
          </div>

          <div className="habits-checklist-list">
            {HABIT_CONFIGS.map((habit) => {
              const isDone = Boolean(currentHabits[habit.key]);
              const isUpdating = updatingHabit === habit.key;
              return (
                <div
                  key={habit.key}
                  className={`habit-row-item ${isDone ? 'done' : ''}`}
                  onClick={() => handleHabitToggle(habit.key, isDone)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleHabitToggle(habit.key, isDone);
                  }}
                  aria-pressed={isDone}
                >
                  <div className="habit-icon-wrap">{habit.icon}</div>
                  <div className="habit-text-wrap">
                    <strong>{habit.label}</strong>
                    <p>{habit.desc}</p>
                  </div>
                  <div className="habit-check-box">
                    {isUpdating ? (
                      <span className="spinner-dot" />
                    ) : isDone ? (
                      <span className="check-symbol">✓</span>
                    ) : (
                      <span className="empty-symbol" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Past 7-Day Consistency Grid */}
      <section className="form-card weekly-consistency-section">
        <div className="section-title-row">
          <div>
            <span className="section-eyebrow">PAST 7 DAYS</span>
            <h3>Habit Consistency Matrix</h3>
          </div>
          <span className="section-icon">📊</span>
        </div>

        <div className="seven-days-grid">
          {(data?.pastSevenDays || []).map((day) => {
            const isFull = day.habitsCount >= 4;
            const hasSome = day.habitsCount > 0;
            return (
              <div
                key={day.date}
                className={`day-consistency-card ${day.isToday ? 'is-today' : ''} ${isFull ? 'full-day' : hasSome ? 'partial-day' : 'missed-day'}`}
              >
                <span className="day-name">{day.dayName}</span>
                <span className="day-num">{day.dayNumber}</span>
                <div className="day-status-pill">
                  {isFull ? '🔥 Solid' : hasSome ? `${day.habitsCount} habits` : '—'}
                </div>
                <div className="day-water-sub">
                  <span>💧 {day.waterGlasses} glasses</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default HabitTrackerPage;
