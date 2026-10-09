import { useEffect, useState } from 'react';
import { buildWeightPath } from '../utils/progressCharts';

function ProgressPage() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ weight: '', date: new Date().toISOString().slice(0, 10) });
  const [message, setMessage] = useState('');
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const [progressResponse, workoutResponse] = await Promise.all([
          fetch('/api/progress/history', { credentials: 'include' }),
          fetch('/api/workouts/history', { credentials: 'include' }),
        ]);
        const [data, workoutData] = await Promise.all([progressResponse.json(), workoutResponse.json()]);
        if (!progressResponse.ok) throw new Error(data.message || 'Could not load progress entries.');
        if (!workoutResponse.ok) throw new Error(workoutData.message || 'Could not load workout history.');
        setEntries(data.history || []);
        setWorkouts(workoutData.sessions || []);
      } catch (error) {
        console.error('Cannot load progress entries', error);
        setMessage(error.message);
      }
    };

    loadEntries();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/progress/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save progress');

      setEntries((current) => [data.entry, ...current]);
      setForm({ weight: '', date: new Date().toISOString().slice(0, 10) });
      setMessage('Progress saved to your account.');
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  const chartPoints = buildWeightPath(entries.slice(0, 30));
  const bestWeight = entries.length ? Math.min(...entries.map((entry) => Number(entry.weight))) : null;
  const completedWorkouts = workouts.filter((session) => session.completed && !session.skipped);

  return (
    <div>
      <div className="page-header">
        <h1>Progress Tracking</h1>
        <span className="badge">Progress & records</span>
      </div>

      <div className="grid-2">
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="progress-weight">Weight (kg)</label>
              <input id="progress-weight" type="number" min="1" max="500" step="0.1" value={form.weight} onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))} required />
            </div>

            <div className="form-group">
              <label htmlFor="progress-date">Date</label>
              <input id="progress-date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
            </div>

            <button className="primary-button" type="submit">Save progress</button>
            {message && <p className="form-message" role="status">{message}</p>}
          </form>
        </div>

        <div className="summary-card">
          <h3>Recent entries</h3>
          {entries.length ? (
            <div className="progress-list">
              {entries.slice(0, 5).map((entry) => (
                <div className="progress-item" key={entry.id}>
                  <strong>{entry.weight} kg</strong>
                  <p className="muted">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No progress entries yet.</div>
          )}
        </div>
      </div>

      <div className="metric-grid progress-record-grid">
        <article className="metric-card">
          <span className="metric-label">Verified exercise targets</span>
          <strong>{completedWorkouts.length}</strong>
          <small>Saved after completed tracking targets</small>
        </article>
        <article className="metric-card">
          <span className="metric-label">Lowest logged weight</span>
          <strong>{bestWeight === null ? '—' : `${bestWeight} kg`}</strong>
          <small>From your saved check-ins</small>
        </article>
        <article className="metric-card">
          <span className="metric-label">Progress entries</span>
          <strong>{entries.length}</strong>
          <small>Weight check-ins saved</small>
        </article>
      </div>

      <section className="page-card progress-chart-card">
        <div className="section-title-row">
          <div><span className="section-eyebrow">WEIGHT TREND</span><h3>Recent check-ins</h3></div>
        </div>
        {chartPoints.length > 1 ? (
          <div className="chart-scroll">
            <svg className="weight-chart" viewBox="0 0 640 220" role="img" aria-label="Weight trend line chart">
              {[0, 1, 2, 3].map((line) => <line key={line} x1="30" x2="610" y1={30 + line * 52} y2={30 + line * 52} className="chart-gridline" />)}
              <polyline points={chartPoints.map((point) => `${point.x},${point.y}`).join(' ')} className="chart-line" />
              {chartPoints.map((point) => (
                <g key={`${point.date.toISOString()}-${point.weight}`}>
                  <circle cx={point.x} cy={point.y} r="5" className="chart-dot" />
                  <text x={point.x} y={point.y - 11} className="chart-label">{point.weight}</text>
                </g>
              ))}
            </svg>
            <div className="chart-dates">
              <span>{chartPoints[0].date.toLocaleDateString()}</span>
              <span>{chartPoints.at(-1).date.toLocaleDateString()}</span>
            </div>
          </div>
        ) : <div className="empty-state">Add at least two dated weight check-ins to see a trend line.</div>}
      </section>

      <section className="page-card" style={{ marginTop: '1rem' }}>
        <div className="section-title-row">
          <div><span className="section-eyebrow">WORKOUT RECORD</span><h3>Recent completed targets</h3></div>
        </div>
        {completedWorkouts.length ? (
          <div className="card-list">
            {completedWorkouts.slice(0, 10).map((session) => (
              <div className="progress-item" key={session.id}>
                <div className="stat-row"><strong>{session.exerciseName}</strong><span>{new Date(session.createdAt).toLocaleString()}</span></div>
                <p className="muted">Target completed and saved</p>
              </div>
            ))}
          </div>
        ) : <div className="empty-state">Verified workout targets will appear here when completed.</div>}
      </section>
    </div>
  );
}

export default ProgressPage;
