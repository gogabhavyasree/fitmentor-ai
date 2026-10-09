import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { advanceRepState, getExerciseInstructions, measureExercise } from '../utils/formTracking';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const EMPTY_REP_STATE = { phase: 'waiting-for-top', reps: 0, lastAngle: null };

const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

function FormPoseTracker({
  exercise,
  plannedExercise,
  workout,
  onTargetReached,
  onStop,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const frameRef = useRef(null);
  const mountedRef = useRef(false);
  const repStateRef = useRef(EMPTY_REP_STATE);
  const lastStatusUpdateRef = useRef(0);
  const startTimeRef = useRef(0);
  const accumulatedSecondsRef = useRef(0);
  const targetSentRef = useRef(false);
  const onTargetReachedRef = useRef(onTargetReached);
  const angleHistoryRef = useRef([]);

  const [cameraStatus, setCameraStatus] = useState('Camera is off.');
  const [feedback, setFeedback] = useState('Position yourself in front of the camera.');
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [poseVisible, setPoseVisible] = useState(false);
  const [movementDetected, setMovementDetected] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [targetReached, setTargetReached] = useState(false);

  const targetReps = Number.isInteger(Number(plannedExercise?.reps))
    ? Number(plannedExercise?.reps)
    : null;
  const targetSets = Number(plannedExercise?.sets) || null;
  const requiredReps = targetReps && targetSets ? targetReps * targetSets : null;
  const exerciseInstructions = getExerciseInstructions(exercise);

  useEffect(() => {
    onTargetReachedRef.current = onTargetReached;
  }, [onTargetReached]);

  const releaseCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      releaseCamera();
    };
  }, [releaseCamera]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds(accumulatedSecondsRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [running]);

  const stopTracking = useCallback(() => {
    const finalElapsed = accumulatedSecondsRef.current
      + (running ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0);
    accumulatedSecondsRef.current = finalElapsed;
    setElapsedSeconds(finalElapsed);
    setRunning(false);
    setCameraOn(false);
    setCameraStatus('Camera released.');
    releaseCamera();
    onStop?.({
      reps: repStateRef.current.reps,
      elapsedSeconds: finalElapsed,
      targetReached: Boolean(requiredReps && repStateRef.current.reps >= requiredReps),
    });
  }, [onStop, releaseCamera, requiredReps, running]);

  const pauseTracking = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    accumulatedSecondsRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
    angleHistoryRef.current = [];
    setElapsedSeconds(accumulatedSecondsRef.current);
    setRunning(false);
    setCameraStatus('Tracking paused. Camera remains on.');
  };

  const detectNextFrame = useCallback(() => {
    if (!mountedRef.current || !running || !videoRef.current || !landmarkerRef.current) return;
    const video = videoRef.current;
    if (video.readyState >= 2) {
      try {
        const result = landmarkerRef.current.detectForVideo(video, performance.now());
        const landmarks = result.landmarks?.[0];
        const measured = measureExercise(exercise, landmarks, video.videoWidth, video.videoHeight);

        if (!measured) {
          setPoseVisible(false);
          setMovementDetected(false);
          setMetrics(null);
          angleHistoryRef.current = [];
          if (performance.now() - lastStatusUpdateRef.current > 900) {
            lastStatusUpdateRef.current = performance.now();
            setFeedback('Keep the full body and the selected exercise landmarks visible.');
          }
        } else {
          setPoseVisible(true);
          setMetrics(measured);
          const nextState = advanceRepState(
            repStateRef.current,
            measured.jointAngle,
            measured.topAngle,
            measured.bottomAngle
          );
          repStateRef.current = nextState;
          const now = performance.now();
          angleHistoryRef.current = angleHistoryRef.current
            .filter((sample) => now - sample.time <= 900);
          angleHistoryRef.current.push({ time: now, angle: measured.jointAngle });
          const recentAngles = angleHistoryRef.current.map((sample) => sample.angle);
          const angleRange = Math.max(...recentAngles) - Math.min(...recentAngles);
          const movementDetectedNow = angleHistoryRef.current.length > 1 && angleRange >= 8;
          setMovementDetected(movementDetectedNow);
          if (nextState.reps !== repCount) {
            setRepCount(nextState.reps);
            if (requiredReps && nextState.reps >= requiredReps && !targetSentRef.current) {
              targetSentRef.current = true;
              setTargetReached(true);
              onTargetReachedRef.current?.({
                reps: nextState.reps,
                requiredReps,
                elapsedSeconds: accumulatedSecondsRef.current
                  + Math.floor((Date.now() - startTimeRef.current) / 1000),
              });
            }
          }

          if (measured.exercise === 'Push-ups' && measured.alignmentDeviation !== null && measured.alignmentDeviation > 25) {
            setFeedback('Try to maintain a stable body position.');
          } else if (movementDetectedNow) {
            setFeedback('Movement detected.');
          } else {
            setFeedback('Waiting for movement.');
          }
        }
      } catch (trackingError) {
        setError(`Pose tracking paused: ${trackingError.message}`);
        setCameraStatus('Tracking error. Stop and try starting again.');
        setRunning(false);
        return;
      }
    }
    frameRef.current = requestAnimationFrame(detectNextFrame);
  }, [exercise, repCount, requiredReps, running]);

  useEffect(() => {
    if (running) frameRef.current = requestAnimationFrame(detectNextFrame);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [detectNextFrame, running]);

  const startTracking = async () => {
    setStarting(true);
    setError('');
    setCameraStatus('Requesting camera access...');
    setFeedback('Position yourself in front of the camera.');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access requires localhost or HTTPS in a supported browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      setCameraStatus('Camera on. Loading pose tracking model...');

      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minPosePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      if (!mountedRef.current) {
        landmarker.close();
        return;
      }

      landmarkerRef.current = landmarker;
      repStateRef.current = { ...EMPTY_REP_STATE };
      angleHistoryRef.current = [];
      targetSentRef.current = false;
      accumulatedSecondsRef.current = 0;
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      setRepCount(0);
      setMetrics(null);
      setPoseVisible(false);
      setMovementDetected(false);
      setTargetReached(false);
      setCameraStatus('Camera and pose tracker are ready.');
      setRunning(true);
    } catch (startError) {
      releaseCamera();
      if (!mountedRef.current) return;
      const message = startError.name === 'NotAllowedError' || startError.name === 'PermissionDeniedError'
        ? 'Camera permission was denied. Allow camera access in browser settings, then retry.'
        : startError.name === 'NotFoundError'
          ? 'No camera was found. Connect a camera and try again.'
          : startError.name === 'NotReadableError'
            ? 'The camera is busy or blocked by another app. Close other camera apps and retry.'
            : startError.message || 'Could not start camera tracking.';
      setError(message);
      setCameraStatus('Camera unavailable.');
      setFeedback('Position yourself in front of the camera.');
      setCameraOn(false);
      setRunning(false);
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  };

  const pauseOrResume = () => {
    if (running) {
      pauseTracking();
    } else {
      startTimeRef.current = Date.now();
      setCameraStatus('Tracking resumed.');
      setRunning(true);
    }
  };

  return (
    <section className="form-check-session">
      <div className="camera-panel">
        <div className="camera-frame">
          <video ref={videoRef} autoPlay muted playsInline />
          {!cameraOn && (
            <div className="camera-placeholder">
              <span className="camera-placeholder-icon">◉</span>
              <strong>Live camera preview</strong>
              <span>Start tracking when your setup is ready</span>
            </div>
          )}
          {cameraOn && <span className="camera-live"><span className="status-dot" /> LIVE</span>}
        </div>
        <div className="camera-controls">
          <div className="camera-status-copy">
            <strong>{cameraStatus}</strong>
            <span>{feedback}</span>
          </div>
          {!cameraOn ? (
            <button className="primary-button" onClick={startTracking} disabled={starting}>
              {starting ? 'Starting camera...' : 'Start tracking'}
            </button>
          ) : (
            <div className="camera-button-row">
              <button className="secondary-button" onClick={pauseOrResume}>
                {running ? 'Pause' : 'Resume'}
              </button>
              <button className="danger-button" onClick={stopTracking}>
                {workout ? 'Stop & return to workout' : 'Stop tracking'}
              </button>
            </div>
          )}
        </div>
        {error && <p className="camera-error" role="alert">{error}</p>}
        <div className="setup-tips">
          <strong>Camera setup</strong>
          <p>{exerciseInstructions?.instructions}</p>
          <p>{exerciseInstructions?.setup}</p>
          <ul>
            <li>Use a steady camera and bright, even lighting on your whole body.</li>
            <li>{exercise === 'Push-ups' ? 'Use a low side view.' : 'Use a side view at about hip height.'}</li>
            <li>{exercise === 'Push-ups' ? 'Keep shoulder, elbow, wrist, hip, and ankle visible.' : 'Keep your head, hips, knees, and ankles visible.'}</li>
          </ul>
        </div>
      </div>

      <aside className="summary-card camera-results">
        <span className="section-eyebrow">POSE LANDMARK TRACKING</span>
        <h3>Selected exercise: {exercise}</h3>
        <div className="exercise-status">
          <span className="measurement-label">Pose landmarks</span>
          <strong>{poseVisible ? 'Visible' : 'Not detected'}</strong>
        </div>
        <div className="exercise-status">
          <span className="measurement-label">Movement status</span>
          <strong>{movementDetected ? 'Movement detected' : poseVisible ? 'Waiting for movement' : 'Position yourself in front of the camera.'}</strong>
        </div>
        {workout && plannedExercise && (
          <div className="planned-target">
            <strong>Workout target</strong>
            <span>{plannedExercise.sets} sets · {plannedExercise.reps || plannedExercise.duration || '--'} per set</span>
            {targetReps && targetSets && (
              <span>Verified reps: {repCount} / {requiredReps} ({Math.min(targetSets, Math.floor(repCount / targetReps))} / {targetSets} sets)</span>
            )}
            {targetReached && <span className="target-complete">Planned rep target reached.</span>}
          </div>
        )}
        <div className="rep-counter">
          <span>Verified repetitions</span>
          <strong>{repCount}</strong>
          <small>Only complete top-to-bottom-to-top cycles count.</small>
        </div>
        <div className="measurement-row">
          <span>{metrics?.jointLabel || 'Joint angle'}</span>
          <strong>{poseVisible && metrics ? `${Math.round(metrics.jointAngle)}°` : '--'}</strong>
        </div>
        {exercise === 'Squats' || exercise === 'Lunges' ? (
          <div className="measurement-row">
            <span>Hip / knee depth</span>
            <strong>{poseVisible && metrics ? metrics.depth : '--'}</strong>
          </div>
        ) : exercise === 'Push-ups' ? (
          <div className="measurement-row">
            <span>Body alignment deviation</span>
            <strong>{poseVisible && metrics?.alignmentDeviation !== null && metrics?.alignmentDeviation !== undefined
              ? `${Math.round(metrics.alignmentDeviation)}°`
              : '--'}</strong>
          </div>
        ) : null}
        <div className="measurement-row">
          <span>Session duration</span>
          <strong>{formatDuration(elapsedSeconds)}</strong>
        </div>
        <div className="measurement-row">
          <span>Form score</span>
          <strong>Not available</strong>
        </div>
        <p className="tracker-note">
          Angles are estimates from visible 2D landmarks and may be unreliable if body parts are hidden. This tool is not medical advice and does not guarantee injury prevention.
        </p>
      </aside>
    </section>
  );
}

export default FormPoseTracker;
