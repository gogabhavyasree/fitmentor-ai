import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormPoseTracker from '../components/FormPoseTracker';
import { getExerciseInstructions, getExerciseRule } from '../utils/formTracking';

const MANUAL_EXERCISES = ['Squats', 'Push-ups', 'Lunges', 'Deadlifts'];

function FormCheckPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const launch = location.state || {};
  const progressSaveRef = useRef(Promise.resolve(true));
  const [selectedExercise, setSelectedExercise] = useState(
    MANUAL_EXERCISES.includes(launch.selectedExercise) ? launch.selectedExercise : 'Squats'
  );
  const [workout, setWorkout] = useState(launch.workout || null);
  const [plannedExercise, setPlannedExercise] = useState(launch.plannedExercise || null);
  const [mode, setMode] = useState(launch.workout ? 'workout' : 'manual');
  const [loadingWorkout, setLoadingWorkout] = useState(!launch.workout);
  const [workoutError, setWorkoutError] = useState('');
  const [tracking, setTracking] = useState(Boolean(launch.selectedExercise));
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (launch.workout) return undefined;
    let active = true;

    const loadLatestWorkout = async () => {
      try {
        const response = await fetch('/api/workouts/latest', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Could not load the latest workout plan.');
        if (active && data.plan) setWorkout(data.plan);
      } catch (error) {
        if (active) setWorkoutError(error.message);
      } finally {
        if (active) setLoadingWorkout(false);
      }
    };

    loadLatestWorkout();
    return () => {
      active = false;
    };
  }, [launch.workout]);

  const manualInstructions = getExerciseInstructions(selectedExercise);
  const today = new Date().toDateString();
  const isWorkoutFromToday = workout?.createdAt && new Date(workout.createdAt).toDateString() === today;

  const selectManualExercise = (exercise) => {
    setSelectedExercise(exercise);
    setPlannedExercise(null);
    setMode('manual');
    setTracking(false);
    setSaveMessage('');
  };

  const selectPlannedExercise = (exercise) => {
    const supported = getExerciseRule(exercise.name);
    if (!supported) return;
    setSelectedExercise(supported);
    setPlannedExercise(exercise);
    setMode('workout');
    setTracking(true);
    setSaveMessage('');
  };

  const saveCompletedExercise = async ({ reps }) => {
    if (!workout?.workoutId || !plannedExercise) return;
    try {
      const response = await fetch('/api/workouts/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout.workoutId,
          exerciseName: plannedExercise.name,
          completed: true,
          skipped: false,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'The exercise target was met, but progress could not be saved.');
      setSaveMessage(`${plannedExercise.name} completed: ${reps} verified reps saved to this workout.`);
      return true;
    } catch (error) {
      setSaveMessage(error.message);
      return false;
    }
  };

  const handleTargetReached = (result) => {
    progressSaveRef.current = saveCompletedExercise(result);
  };

  const handleTrackerStop = async ({ targetReached } = {}) => {
    setTracking(false);
    if (mode === 'workout') {
      const saved = await progressSaveRef.current;
      if (targetReached && !saved) return;
      navigate(launch.returnTo || '/ai-workout');
    }
  };

  const handleTrackerStart = () => {
    setSaveMessage('');
    setTracking(true);
  };

  const openPlannedExercise = (exercise) => {
    const supported = getExerciseRule(exercise.name);
    if (!supported) return;
    setSelectedExercise(supported);
    setPlannedExercise(exercise);
    setMode('workout');
    setTracking(true);
    setSaveMessage('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Form Check</h1>
          <p className="page-intro">Camera-based movement feedback from visible body landmarks. No pose, no score, no guessed reps.</p>
        </div>
        <span className="badge">MediaPipe pose tracking</span>
      </div>

      {mode === 'workout' && plannedExercise && (
        <div className="form-workout-banner">
          <div>
            <span className="section-eyebrow">WORKOUT SESSION</span>
            <strong>{plannedExercise.name}</strong>
            <span>{plannedExercise.sets} sets · {plannedExercise.reps || plannedExercise.duration || '--'} per set</span>
          </div>
          <button className="secondary-button" onClick={() => navigate(launch.returnTo || '/ai-workout')}>Return to workout</button>
        </div>
      )}

      {!launch.selectedExercise && (
        <div className="form-check-options">
          <section className="form-card">
            <span className="section-eyebrow">OPTION A · MANUAL</span>
            <h3>Select an exercise</h3>
            <div className="form-group">
              <label htmlFor="manual-exercise">Exercise</label>
              <select
                id="manual-exercise"
                value={selectedExercise}
                onChange={(event) => selectManualExercise(event.target.value)}
                disabled={tracking}
              >
                {MANUAL_EXERCISES.map((exercise) => <option key={exercise}>{exercise}</option>)}
              </select>
            </div>
            <div className="exercise-guidance">
              <strong>{selectedExercise} setup</strong>
              <p>{manualInstructions?.instructions}</p>
              <p className="muted">{manualInstructions?.setup}</p>
            </div>
            {!tracking && <button className="primary-button" onClick={handleTrackerStart}>Check my form</button>}
          </section>

          <section className="summary-card">
            <span className="section-eyebrow">OPTION B · YOUR PLAN</span>
            <h3>{isWorkoutFromToday ? "Today's planned exercises" : 'Latest workout plan'}</h3>
            {loadingWorkout ? (
              <div className="empty-state">Checking for a saved workout plan...</div>
            ) : workoutError ? (
              <div className="empty-state" role="alert">{workoutError}</div>
            ) : workout?.exercises?.length ? (
              <div className="planned-exercises">
                {workout.exercises.map((exercise, index) => {
                  const supported = getExerciseRule(exercise.name);
                  const eligible = supported && Number.isInteger(Number(exercise.reps)) && Number(exercise.sets) > 0;
                  return (
                    <div className="planned-exercise-row" key={exercise.id || `${exercise.name}-${index}`}>
                      <div>
                        <strong>{exercise.name}</strong>
                        <span>{exercise.sets} sets · {exercise.reps || exercise.duration || '--'} per set</span>
                        {!eligible && <small>Camera tracking not supported for this plan item.</small>}
                      </div>
                      {eligible && (
                        <button className="secondary-button" onClick={() => openPlannedExercise(exercise)}>
                          Check my form
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">No saved workout plan yet. You can still select an exercise manually.</div>
            )}
          </section>
        </div>
      )}

      {tracking && (
        <FormPoseTracker
          key={`${selectedExercise}-${plannedExercise?.name || 'manual'}-${workout?.workoutId || ''}`}
          exercise={selectedExercise}
          plannedExercise={mode === 'workout' ? plannedExercise : null}
          workout={mode === 'workout' ? workout : null}
          onTargetReached={handleTargetReached}
          onStop={handleTrackerStop}
        />
      )}

      {saveMessage && <p className="form-message" role="status">{saveMessage}</p>}

      {!launch.selectedExercise && !tracking && (
        <p className="tracker-note form-limitation">
          Angles and repetitions are estimates, not medical advice. Supported rep tracking uses a full movement cycle; form scores are intentionally not generated.
        </p>
      )}
    </div>
  );
}

export default FormCheckPage;
