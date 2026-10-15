import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardHabitWidget from '../components/DashboardHabitWidget';

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/user/dashboard', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load your dashboard.');
        setDashboard(data.dashboard);
      } catch (error) {
        console.error('Failed to load dashboard', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="empty-state">Loading dashboard data...</div>;
  }
  if (error || !dashboard) {
    return <div className="empty-state" role="alert">{error || 'Dashboard data is not available.'}</div>;
  }

  return (
    <div>
      <section className="welcome-panel">
        <div>
          <span className="welcome-eyebrow">YOUR FITNESS SNAPSHOT</span>
          <h1>{dashboard.welcomeMessage}</h1>
          <p>A steady routine starts with one small step. Let’s make today count.</p>
          <span className="badge">Current goal · {dashboard.user.goal}</span>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <span>✦</span>
        </div>
      </section>

      <section className="daily-coach-prompt">
        <div>
          <span className="section-eyebrow">MAKE TODAY WORK FOR YOU</span>
          <h2>How are you feeling today?</h2>
          <p>Check in on sleep, stress, recovery, and time. Get a plan that adapts to your day.</p>
        </div>
        <Link className="primary-button" to="/daily-coach">Get today’s guidance</Link>
      </section>

      <DashboardHabitWidget user={dashboard.user} />

      {/* Quick Fitness Tools Bar */}
      <section className="dashboard-quick-tools">
        <Link to="/protein-finder" className="dash-tool-card">
          <span className="tool-emoji">⚡</span>
          <div>
            <strong>Protein Finder</strong>
            <small>Best protein per ₹ in India</small>
          </div>
        </Link>
        <Link to="/calculator" className="dash-tool-card">
          <span className="tool-emoji">🎯</span>
          <div>
            <strong>Macro Calculator</strong>
            <small>BMR, TDEE & macro targets</small>
          </div>
        </Link>
        <Link to="/grocery-planner" className="dash-tool-card">
          <span className="tool-emoji">🛒</span>
          <div>
            <strong>Grocery Checklist</strong>
            <small>Weekly food shopping list</small>
          </div>
        </Link>
        <Link to="/habits" className="dash-tool-card">
          <span className="tool-emoji">🔥</span>
          <div>
            <strong>Habit Tracker</strong>
            <small>Streaks & 7-day consistency</small>
          </div>
        </Link>
      </section>

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-symbol">↗</span>
          <span className="metric-label">Recent workouts</span>
          <strong>{dashboard.recentWorkoutActivity.length}</strong>
          <small>Plans in your recent activity</small>
        </article>
        <article className="metric-card">
          <span className="metric-symbol">◌</span>
          <span className="metric-label">Meals saved</span>
          <strong>{dashboard.dailyNutritionSummary.length}</strong>
          <small>Recent nutrition entries</small>
        </article>
        <article className="metric-card">
          <span className="metric-symbol">⌁</span>
          <span className="metric-label">Latest weight</span>
          <strong>{dashboard.weightSummary.length ? `${dashboard.weightSummary[0].weight} kg` : '—'}</strong>
          <small>{dashboard.weightSummary.length ? 'Most recent check-in' : 'Add your first check-in'}</small>
        </article>
      </div>

      <div className="grid-2">
        <div className="summary-card">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">MOVE WITH PURPOSE</span>
              <h3>Today's workout</h3>
            </div>
            <span className="section-icon">01</span>
          </div>
          {dashboard.todaysWorkout ? (
            <div className="card-list">
              <div className="stat-row"><span>Goal</span><strong>{dashboard.todaysWorkout.goal}</strong></div>
              <div className="stat-row"><span>Level</span><strong>{dashboard.todaysWorkout.level}</strong></div>
              <div className="stat-row"><span>Exercises</span><strong>{dashboard.todaysWorkout.exercises.length}</strong></div>
            </div>
          ) : (
            <div className="empty-state">No workout planned yet. Start a workout plan from the AI Workout page.</div>
          )}
        </div>

        <div className="summary-card">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">FUEL YOUR DAY</span>
              <h3>Nutrition summary</h3>
            </div>
            <span className="section-icon">02</span>
          </div>
          {dashboard.dailyNutritionSummary.length ? (
            <div className="card-list">
              {dashboard.dailyNutritionSummary.slice(0, 2).map((meal) => (
                <div className="stat-row" key={meal.id || Math.random()}>
                  <span>{new Date(meal.createdAt).toLocaleDateString()}</span>
                  <strong>{meal.nutrition.calories} kcal</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No meals logged yet.</div>
          )}
        </div>
      </div>

      <div className="grid-2 dashboard-lower">
        <div className="summary-card">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">KEEP THE MOMENTUM</span>
              <h3>Recent workout activity</h3>
            </div>
            <span className="section-icon">03</span>
          </div>
          {dashboard.recentWorkoutActivity.length ? (
            <div className="card-list">
              {dashboard.recentWorkoutActivity.map((item) => (
                <div className="stat-row" key={item.id || Math.random()}>
                  <span>{item.goal}</span>
                  <strong>{item.level}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Your recent workout history is empty.</div>
          )}
        </div>

        <div className="summary-card">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">YOUR JOURNEY</span>
              <h3>Weight progress</h3>
            </div>
            <span className="section-icon">04</span>
          </div>
          {dashboard.weightSummary.length ? (
            <div className="card-list">
              {dashboard.weightSummary.map((item) => (
                <div className="stat-row" key={item.id || Math.random()}>
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                  <strong>{item.weight} kg</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Start logging your weight in the Progress page.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
