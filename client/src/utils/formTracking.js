const EXERCISES = {
  Squats: {
    topAngle: 155,
    bottomAngle: 100,
    instructions: 'Stand side-on with feet about shoulder-width apart. Bend your knees and hips, then return to standing.',
    setup: 'Place the camera at hip height and keep your head, hips, knees, and ankles visible from the side.',
  },
  'Push-ups': {
    topAngle: 150,
    bottomAngle: 90,
    instructions: 'Start in a straight plank. Bend your elbows to lower your chest, then press back to the starting position.',
    setup: 'Place the camera low and side-on so your shoulder, elbow, wrist, hip, and ankle remain visible.',
  },
  Lunges: {
    topAngle: 155,
    bottomAngle: 105,
    instructions: 'Step forward, lower under control by bending both knees, then push back to your starting stance.',
    setup: 'Use a stable side view. Keep your hips, both knees, and ankles visible.',
  },
  Deadlifts: {
    topAngle: 155,
    bottomAngle: 130,
    instructions: 'Hinge at the hips with a comfortable knee bend, then stand tall by extending your hips.',
    setup: 'Place the camera at hip height from the side. Keep your shoulder, hip, knee, and ankle in frame.',
  },
};

const SIDES = {
  left: { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 },
  right: { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 },
};

export const getExerciseRule = (name = '') => {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized.includes('squat')) return 'Squats';
  if (normalized.includes('pushup') || normalized.includes('pushups')) return 'Push-ups';
  if (normalized.includes('lunge')) return 'Lunges';
  if (normalized.includes('deadlift')) return 'Deadlifts';
  return null;
};

const angleAt = (first, center, last, width, height) => {
  const a = { x: (first.x - center.x) * width, y: (first.y - center.y) * height };
  const b = { x: (last.x - center.x) * width, y: (last.y - center.y) * height };
  const magnitude = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
  if (!magnitude) return null;
  const cosine = (a.x * b.x + a.y * b.y) / magnitude;
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * (180 / Math.PI);
};

const pointVisibility = (landmark) => landmark?.visibility ?? landmark?.presence ?? 0;

export const measureExercise = (exercise, landmarks, width, height) => {
  const key = getExerciseRule(exercise);
  const rule = key && EXERCISES[key];
  if (!rule || !landmarks || !width || !height) return null;

  const sideNames = Object.keys(SIDES);
  const selectedSide = sideNames
    .map((sideName) => {
      const side = SIDES[sideName];
      const required = key === 'Push-ups'
        ? [side.shoulder, side.elbow, side.wrist, side.hip, side.ankle]
        : key === 'Deadlifts'
          ? [side.shoulder, side.hip, side.knee, side.ankle]
          : [side.shoulder, side.hip, side.knee, side.ankle];
      const visible = required.map((index) => pointVisibility(landmarks[index]));
      return { side, score: Math.min(...visible), complete: visible.every((value) => value >= 0.55) };
    })
    .sort((first, second) => second.score - first.score)[0];

  if (!selectedSide.complete) return null;

  const points = selectedSide.side;
  const jointAngle = key === 'Push-ups'
    ? angleAt(landmarks[points.shoulder], landmarks[points.elbow], landmarks[points.wrist], width, height)
    : key === 'Deadlifts'
      ? angleAt(landmarks[points.shoulder], landmarks[points.hip], landmarks[points.knee], width, height)
      : angleAt(landmarks[points.hip], landmarks[points.knee], landmarks[points.ankle], width, height);

  if (jointAngle === null) return null;

  let alignmentDeviation = null;
  if (key === 'Push-ups') {
    const bodyAngle = angleAt(
      landmarks[points.shoulder],
      landmarks[points.hip],
      landmarks[points.ankle],
      width,
      height
    );
    alignmentDeviation = bodyAngle === null ? null : Math.abs(180 - bodyAngle);
  }

  let depth = null;
  if (key === 'Squats' || key === 'Lunges') {
    const hip = landmarks[points.hip];
    const knee = landmarks[points.knee];
    depth = hip.y > knee.y ? 'Hip below knee level' : 'Hip above knee level';
  }

  return {
    exercise: key,
    jointLabel: key === 'Push-ups' ? 'Elbow angle' : key === 'Deadlifts' ? 'Hip angle' : 'Knee angle',
    jointAngle,
    alignmentDeviation,
    depth,
    topAngle: rule.topAngle,
    bottomAngle: rule.bottomAngle,
  };
};

export const advanceRepState = (state, angle, topAngle, bottomAngle) => {
  let phase = state.phase;
  let reps = state.reps;

  if (phase === 'waiting-for-top' && angle >= topAngle) {
    phase = 'top';
  } else if (phase === 'top' && angle <= bottomAngle) {
    phase = 'bottom';
  } else if (phase === 'bottom' && angle >= topAngle) {
    phase = 'top';
    reps += 1;
  }

  return {
    phase,
    reps,
    lastAngle: angle,
  };
};

export const getExerciseInstructions = (exercise) => {
  const key = getExerciseRule(exercise);
  if (!key) return null;
  return EXERCISES[key];
};
