import { useEffect, useMemo, useState } from 'react';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function WeeklySchedulePage() {
  const [plans, setPlans] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [form, setForm] = useState({ workoutId: '', weekdays: [], reminderTime: '18:00' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [plansResponse, scheduleResponse] = await Promise.all([
          fetch('/api/workouts/history', { credentials: 'include' }),
          fetch('/api/schedule', { credentials: 'include' }),
        ]);
        const [plansData, scheduleData] = await Promise.all([plansResponse.json(), scheduleResponse.json()]);
        if (!plansResponse.ok) throw new Error(plansData.message || 'Could not load workout plans.');
        if (!scheduleResponse.ok) throw new Error(scheduleData.message || 'Could not load your schedule.');
        const savedPlans = plansData.workouts || [];
        setPlans(savedPlans);
        setSchedule(scheduleData.schedule);
        setWorkout(scheduleData.workout);
        if (scheduleData.schedule) {
          setForm({
            workoutId: scheduleData.schedule.workoutId,
            weekdays: scheduleData.schedule.weekdays,
            reminderTime: scheduleData.schedule.reminderTime,
          });
        } else if (savedPlans[0]) {
          setForm((current) => ({ ...current, workoutId: savedPlans[0].workoutId }));
        }
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentWeek = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    start.setDate(start.getDate() - start.getDay());
    return WEEKDAYS.map((name, day) => {
      const date = new Date(start);
      date.setDate(start.getDate() + day);
      return { name, date, key: dateKey(date), day };
    });
  }, []);

  const todayKey = dateKey(new Date());
  const toggleDay = (day) => setForm((current) => ({
    ...current,
    weekdays: current.weekdays.includes(day)
      ? current.weekdays.filter((value) => value !== day)
      : [...current.weekdays, day].sort((a, b) => a - b),
  }));

  const saveSchedule = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/schedule', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save your schedule.');
      setSchedule(data.schedule);
      setWorkout(plans.find((plan) => plan.workoutId === form.workoutId) || null);
      setMessage('Weekly workout schedule saved.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const markTodayDone = async () => {
    setMessage('');
    try {
      const response = await fetch('/api/schedule/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not update today’s schedule.');
      setSchedule(data.schedule);
      setMessage('Today’s scheduled workout marked complete by you.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) return <div className="empty-state">Loading your weekly schedule...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Weekly Workout Calendar</h1>
          <p className="page-intro">Choose workout days below. Days you leave unchecked are rest days.</p>
        </div>
        <span className="badge">In-app reminders</span>
      </div>

      {!plans.length ? (
        <div className="empty-state">Generate a workout in AI Workout before setting up your calendar.</div>
      ) : (
        <>
          <section className="form-card">
            <form onSubmit={saveSchedule}>
              <div className="form-group">
                <label htmlFor="schedule-plan">Workout plan</label>
                <select id="schedule-plan" value={form.workoutId} onChange={(event) => setForm((current) => ({ ...current, workoutId: event.target.value }))}>
                  {plans.map((plan) => <option key={plan.workoutId} value={plan.workoutId}>{plan.goal} · {plan.level} · {new Date(plan.createdAt).toLocaleDateString()}</option>)}
                </select>
              </div>
              <fieldset className="weekday-picker">
                <legend>Workout days</legend>
                <div className="weekday-options">
                  {WEEKDAYS.map((day, index) => (
                    <label key={day} className={form.weekdays.includes(index) ? 'weekday-option selected' : 'weekday-option'}>
                      <input type="checkbox" checked={form.weekdays.includes(index)} onChange={() => toggleDay(index)} />
                      {day.slice(0, 3)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="form-group">
                <label htmlFor="reminder-time">Daily reminder time</label>
                <input id="reminder-time" type="time" value={form.reminderTime} onChange={(event) => setForm((current) => ({ ...current, reminderTime: event.target.value }))} />
              </div>
              <p className="estimate-note">Reminders appear in FitMentor while you have the app open. They are not sent while the app is closed.</p>
              <button className="primary-button" type="submit" disabled={saving || !form.weekdays.length}>{saving ? 'Saving schedule...' : 'Save weekly schedule'}</button>
            </form>
          </section>

          <section className="page-card" style={{ marginTop: '1rem' }}>
            <div className="section-title-row">
              <div><span className="section-eyebrow">THIS WEEK</span><h3>{workout ? `${workout.goal} workout` : 'Scheduled workouts'}</h3></div>
            </div>
            <div className="week-calendar">
              {currentWeek.map(({ name, date, key, day }) => {
                const planned = Boolean(schedule?.weekdays.includes(day));
                const completed = schedule?.completedDates.includes(key);
                return (
                  <article className={`calendar-day${key === todayKey ? ' today' : ''}`} key={key}>
                    <span>{name.slice(0, 3)}</span>
                    <strong>{date.getDate()}</strong>
                    <small>{planned ? completed ? 'Marked done' : 'Workout planned' : 'Rest day'}</small>
                  </article>
                );
              })}
            </div>
            {schedule?.weekdays.includes(new Date().getDay()) && !schedule.completedDates.includes(todayKey) && (
              <div className="calendar-completion">
                <span>Mark today’s workout done? This is a self-reported calendar check-in.</span>
                <button className="secondary-button" onClick={markTodayDone}>Mark today complete</button>
              </div>
            )}
          </section>
        </>
      )}
      {message && <p className="form-message" role="status">{message}</p>}
    </div>
  );
}

export default WeeklySchedulePage;
