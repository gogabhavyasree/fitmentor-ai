import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getExerciseRule } from '../utils/formTracking';

function AIWorkoutPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const coachTime = location.state?.coachTime;
  const [form, setForm] = useState({
    goal: user?.goal || 'Weight Loss',
    level: user?.fitnessLevel || 'Beginner',
    availableTime: String(coachTime || user?.availableTime || 20),
    equipment: user?.equipment || 'Bodyweight',
  });
  const [plan, setPlan] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [alternatives, setAlternatives] = useState({});
  const [alternativeStatus, setAlternativeStatus] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const loadSavedPlan = async () => {
      try {
        const [latestResponse, historyResponse] = await Promise.all([
          fetch('/api/workouts/latest', { credentials: 'include' }),
          fetch('/api/workouts/history', { credentials: 'include' }),
        ]);
        const [data, history] = await Promise.all([latestResponse.json(), historyResponse.json()]);
        if (!latestResponse.ok) throw new Error(data.message || 'Unable to load saved workout.');
        if (!historyResponse.ok) throw new Error(history.message || 'Unable to load workout progress.');
        setSessions(history.sessions || []);
        if (data.plan) {
          setPlan(data.plan);
          setForm({
            goal: coachTime ? user?.goal || data.plan.goal : data.plan.goal,
            level: coachTime ? user?.fitnessLevel || data.plan.level : data.plan.level,
            availableTime: String(coachTime || data.plan.duration),
            equipment: coachTime ? user?.equipment || data.plan.equipment : data.plan.equipment,
          });
          setStatus(coachTime
            ? `Today’s check-in suggested a ${coachTime}-minute session. Generate it when you’re ready.`
            : 'Your latest saved workout is ready.');
        }
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSavedPlan();
  }, [coachTime, user]);

  useEffect(() => {
    if (!plan) return undefined;
    let active = true;
    const loadAlternatives = async () => {
      try {
        const entries = await Promise.all(plan.exercises.map(async (exercise) => {
          const response = await fetch(`/api/workouts/${plan.workoutId}/exercises/${encodeURIComponent(exercise.id)}/alternatives`, { credentials: 'include' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || `Could not load alternatives for ${exercise.name}.`);
          return [exercise.id, data.alternatives || []];
        }));
        if (active) setAlternatives(Object.fromEntries(entries));
      } catch (error) {
        if (active) setAlternativeStatus(error.message);
      }
    };
    loadAlternatives();
    return () => { active = false; };
  }, [plan]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setGenerating(true);
    setStatus('Generating a workout plan...');

    try {
      const response = await fetch('/api/workouts/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to generate workout.');
      }

      setPlan(data.plan);
      setAlternatives({});
      setSessions([]);
      setStatus('Workout plan generated successfully.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const replaceExercise = async (exercise, alternative) => {
    setAlternativeStatus('');
    try {
      const response = await fetch(`/api/workouts/${plan.workoutId}/exercises/${encodeURIComponent(exercise.id)}/alternative`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alternative }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to replace this exercise.');
      setPlan(data.plan);
      setAlternativeStatus('Exercise alternative saved to your workout plan.');
    } catch (error) {
      setAlternativeStatus(error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>AI Workout</h1>
        <span className="badge">Rule-based guidance</span>
      </div>

      <div className="grid-2">
        <div className="form-card">
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label>Fitness goal</label>
              <select name="goal" value={form.goal} onChange={handleChange}>
                <option>Weight Loss</option>
                <option>Muscle Gain</option>
                <option>General Fitness</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fitness level</label>
              <select name="level" value={form.level} onChange={handleChange}>
                <option>Beginner</option>
                <option>Intermediate</option>
              </select>
            </div>

            <div className="form-group">
              <label>Available time</label>
              <input name="availableTime" type="number" min="15" max="60" value={form.availableTime} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Equipment</label>
              <select name="equipment" value={form.equipment} onChange={handleChange}>
                <option>Bodyweight</option>
                <option>Dumbbells</option>
                <option>Yoga mat</option>
                <option>Home gym</option>
              </select>
            </div>

            <button type="submit" className="primary-button" disabled={loading || generating}>
              {loading ? 'Loading saved workout...' : generating ? 'Saving workout...' : 'Generate & Save Workout'}
            </button>
          </form>
          {status && <p className="muted" style={{ marginTop: '1rem' }}>{status}</p>}
        </div>

        <div className="summary-card">
          <h3>Workout details</h3>
          {loading ? (
            <div className="empty-state">Checking your saved workout...</div>
          ) : plan ? (
            <div className="card-list">
              <div className="stat-row"><span>Goal</span><strong>{plan.goal}</strong></div>
              <div className="stat-row"><span>Level</span><strong>{plan.level}</strong></div>
              <div className="stat-row"><span>Duration</span><strong>{plan.duration} min</strong></div>
              <div className="stat-row"><span>Equipment</span><strong>{plan.equipment}</strong></div>
              <p className="muted">{plan.note}</p>
              <p className="saved-note">Saved to your account · {new Date(plan.createdAt).toLocaleString()}</p>
            </div>
          ) : (
            <div className="empty-state">Choose your settings and generate a workout plan.</div>
          )}
        </div>
      </div>

      {plan && (
        <div className="page-card" style={{ marginTop: '1.5rem' }}>
          <h3>Exercise plan</h3>
          <div className="plan-list">
            {plan.exercises.map((exercise) => (
              <div className="plan-item" key={exercise.id}>
                <div className="planned-exercise-title">
                  <strong>{exercise.name}</strong>
                  {sessions.some((session) => session.workout?.toString() === plan.workoutId
                    && session.exerciseName === exercise.name
                    && session.completed)
                    && <span className="exercise-complete-tag">Target completed</span>}
                </div>
                <p className="muted">{exercise.instructions}</p>
                {!!alternatives[exercise.id]?.length && (
                  <div className="alternative-row">
                    <label htmlFor={`alternative-${exercise.id}`}>Swap exercise</label>
                    <select
                      id={`alternative-${exercise.id}`}
                      value=""
                      onChange={(event) => replaceExercise(exercise, event.target.value)}
                    >
                      <option value="">Choose a suggested alternative</option>
                      {alternatives[exercise.id].map((alternative) => (
                        <option key={alternative.key} value={alternative.key}>{alternative.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="stat-row">
                  <span>Sets</span><strong>{exercise.sets}</strong>
                </div>
                <div className="stat-row">
                  <span>Reps / Duration</span><strong>{exercise.reps || exercise.duration}</strong>
                </div>
                <div className="stat-row">
                  <span>Rest</span><strong>{exercise.rest}</strong>
                </div>
                {getExerciseRule(exercise.name) && Number.isInteger(Number(exercise.reps)) && Number(exercise.sets) > 0 ? (
                  <button
                    className="secondary-button"
                    onClick={() => navigate('/form-check', {
                      state: {
                        selectedExercise: getExerciseRule(exercise.name),
                        plannedExercise: exercise,
                        workout: plan,
                        returnTo: '/ai-workout',
                      },
                    })}
                  >
                    Check my form
                  </button>
                ) : (
                  <p className="unsupported-note">Camera form tracking is not available for this exercise.</p>
                )}
              </div>
            ))}
          </div>
          {alternativeStatus && <p className="form-message" role="status">{alternativeStatus}</p>}
        </div>
      )}
    </div>
  );
}

export default AIWorkoutPage;
