import { useEffect, useState } from 'react';

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetch('/api/admin/summary', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load the admin dashboard.');
        setSummary(data.summary);
      } catch (error) {
        console.error('Unable to fetch admin summary', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return <div className="empty-state">Loading admin dashboard...</div>;
  }
  if (!summary) return <div className="empty-state" role="alert">{error || 'Admin data is unavailable.'}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <span className="badge">Administrator only</span>
      </div>

      <div className="metric-grid admin-metric-grid">
        <article className="metric-card"><span className="metric-label">Registered users</span><strong>{summary.totalUsers}</strong><small>Total accounts in MongoDB</small></article>
        <article className="metric-card"><span className="metric-label">Workout plans</span><strong>{summary.workoutsGenerated}</strong><small>Generated and saved plans</small></article>
        <article className="metric-card"><span className="metric-label">Workout sessions</span><strong>{summary.workoutSessions}</strong><small>Tracked workout records</small></article>
        <article className="metric-card"><span className="metric-label">Completed targets</span><strong>{summary.completedSessions}</strong><small>Targets reported completed</small></article>
        <article className="metric-card"><span className="metric-label">Completion rate</span><strong>{summary.completionRate}%</strong><small>Completed / recorded sessions</small></article>
        <article className="metric-card"><span className="metric-label">Saved nutrition entries</span><strong>{summary.mealsLogged}</strong><small>Meals saved by all accounts</small></article>
        <article className="metric-card"><span className="metric-label">Weight entries</span><strong>{summary.progressEntries}</strong><small>Progress records in MongoDB</small></article>
        <article className="metric-card"><span className="metric-label">Active accounts</span><strong>{summary.activeUsers30d}</strong><small>Accounts updated in the last 30 days</small></article>
      </div>

      <div className="page-card" style={{ marginTop: '1.5rem' }}>
        <div className="section-title-row">
          <div><span className="section-eyebrow">APPLICATION USAGE</span><h3>Per-member activity</h3></div>
        </div>
        {summary.members.length ? <div className="admin-usage-list">
          {summary.members.map((member) => (
            <article className="admin-usage-row" key={member.id}>
              <div className="admin-usage-person"><strong>{member.name}</strong><span>{member.email} · {member.goal}</span></div>
              <div className="admin-member-stats">
                <span>{member.workouts} plans</span>
                <span>{member.completedTargets} completions</span>
                <span>{member.meals} meals</span>
                <span>{member.progressEntries} progress entries</span>
              </div>
            </article>
          ))}
        </div> : <div className="empty-state">No registered users yet.</div>}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
