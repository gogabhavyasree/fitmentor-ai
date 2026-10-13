const templates = {
  'Weight Loss': {
    Beginner: [
      { name: 'Jumping Jacks', instructions: 'Keep a steady rhythm and land softly.', sets: 3, reps: 15, rest: '30 sec' },
      { name: 'Bodyweight Squats', instructions: 'Sit back and keep your chest lifted.', sets: 3, reps: 12, rest: '30 sec' },
      { name: 'High Knees', instructions: 'Drive the knees up with control.', sets: 2, reps: 20, rest: '20 sec' },
      { name: 'Mountain Climbers', instructions: 'Alternate legs and stay low in the plank position.', sets: 2, reps: 12, rest: '30 sec' },
    ],
    Intermediate: [
      { name: 'Burpees', instructions: 'Push through the floor and land softly.', sets: 4, reps: 8, rest: '45 sec' },
      { name: 'Reverse Lunges', instructions: 'Keep your front knee aligned with your toes.', sets: 4, reps: 10, rest: '30 sec' },
      { name: 'Fast Feet', instructions: 'Stay light and keep moving quickly.', sets: 3, reps: 20, rest: '20 sec' },
      { name: 'Plank Shoulder Taps', instructions: 'Brace your core and alternate taps.', sets: 3, reps: 12, rest: '30 sec' },
    ],
  },
  'Muscle Gain': {
    Beginner: [
      { name: 'Push-Ups', instructions: 'Keep your body straight and engage the core.', sets: 3, reps: 8, rest: '45 sec' },
      { name: 'Goblet Squats', instructions: 'Keep your weight on your heels and squat down smoothly.', sets: 3, reps: 10, rest: '45 sec' },
      { name: 'Bent-Over Rows', instructions: 'Squeeze the shoulder blades together.', sets: 3, reps: 10, rest: '45 sec' },
      { name: 'Dumbbell Press', instructions: 'Press upward while keeping your lower back tight.', sets: 3, reps: 8, rest: '60 sec' },
    ],
    Intermediate: [
      { name: 'Pull-Ups', instructions: 'Use a band if needed and control the downward motion.', sets: 4, reps: 8, rest: '60 sec' },
      { name: 'Deadlift', instructions: 'Brace the core and lift with the legs.', sets: 4, reps: 6, rest: '60 sec' },
      { name: 'Bench Press', instructions: 'Lower slowly and press with discipline.', sets: 4, reps: 8, rest: '75 sec' },
      { name: 'Overhead Press', instructions: 'Keep the ribs down and press in a straight line.', sets: 3, reps: 8, rest: '60 sec' },
    ],
  },
  'General Fitness': {
    Beginner: [
      { name: 'Warm-Up Walk', instructions: 'Move briskly and keep breathing easy.', sets: 1, reps: '5 min', rest: 'No rest' },
      { name: 'Bodyweight Squats', instructions: 'Move with control and stand tall after each rep.', sets: 3, reps: 12, rest: '30 sec' },
      { name: 'Incline Push-Ups', instructions: 'Use a wall or bench for support if needed.', sets: 3, reps: 8, rest: '30 sec' },
      { name: 'Glute Bridges', instructions: 'Squeeze the glutes at the top position.', sets: 3, reps: 12, rest: '30 sec' },
    ],
    Intermediate: [
      { name: 'Kettlebell Swings', instructions: 'Use the hips to generate the movement.', sets: 3, reps: 12, rest: '45 sec' },
      { name: 'Step-Ups', instructions: 'Drive through the heel and keep balance steady.', sets: 3, reps: 10, rest: '45 sec' },
      { name: 'Russian Twists', instructions: 'Rotate the torso while bracing the core.', sets: 3, reps: 15, rest: '30 sec' },
      { name: 'Plank', instructions: 'Stay in a straight line from head to heels.', sets: 3, duration: '30 sec', rest: '30 sec' },
    ],
  },
};

const equipmentAlternatives = {
  'Goblet Squats': {
    Bodyweight: { name: 'Bodyweight Squats', instructions: 'Sit back into a comfortable squat and stand tall with control.' },
    'Yoga mat': { name: 'Bodyweight Squats', instructions: 'Sit back into a comfortable squat and stand tall with control.' },
  },
  'Bent-Over Rows': {
    Bodyweight: { name: 'Prone Y-T-W Raises', instructions: 'Lie face down and raise your arms into Y, T, and W positions with control.' },
    'Yoga mat': { name: 'Prone Y-T-W Raises', instructions: 'Lie face down and raise your arms into Y, T, and W positions with control.' },
  },
  'Dumbbell Press': {
    Bodyweight: { name: 'Incline Push-Ups', instructions: 'Place your hands on a stable raised surface and perform controlled push-ups.' },
    'Yoga mat': { name: 'Incline Push-Ups', instructions: 'Place your hands on a stable raised surface and perform controlled push-ups.' },
  },
  'Pull-Ups': {
    Bodyweight: { name: 'Prone Y-T-W Raises', instructions: 'Lie face down and raise your arms into Y, T, and W positions with control.' },
    'Yoga mat': { name: 'Prone Y-T-W Raises', instructions: 'Lie face down and raise your arms into Y, T, and W positions with control.' },
    Dumbbells: { name: 'Bent-Over Rows', instructions: 'Hinge at your hips and pull your dumbbells toward your lower ribs.' },
  },
  Deadlift: {
    Bodyweight: { name: 'Hip Hinge Drill', instructions: 'Practice hinging your hips back with a neutral spine, then stand tall.' },
    'Yoga mat': { name: 'Hip Hinge Drill', instructions: 'Practice hinging your hips back with a neutral spine, then stand tall.' },
  },
  'Bench Press': {
    Bodyweight: { name: 'Knee Push-Ups', instructions: 'Keep knees grounded and body aligned while lowering and pressing up.' },
    'Yoga mat': { name: 'Knee Push-Ups', instructions: 'Keep knees grounded and body aligned while lowering and pressing up.' },
  },
  'Overhead Press': {
    Bodyweight: { name: 'Pike Push-Ups', instructions: 'From a comfortable pike position, bend your elbows and press back up with control.' },
    'Yoga mat': { name: 'Pike Push-Ups', instructions: 'From a comfortable pike position, bend your elbows and press back up with control.' },
  },
  'Kettlebell Swings': {
    Bodyweight: { name: 'Glute Bridges', instructions: 'Lie on your back and lift your hips by squeezing your glutes.' },
    'Yoga mat': { name: 'Glute Bridges', instructions: 'Lie on your back and lift your hips by squeezing your glutes.' },
    Dumbbells: { name: 'Dumbbell Romanian Deadlifts', instructions: 'Hinge at your hips while lowering dumbbells close to your legs, then stand tall.' },
  },
};

const getExercises = ({ goal, level, availableTime, equipment }) => {
  const baseList = templates[goal]?.[level] || templates['General Fitness'].Beginner;
  const durationFactor = Number(availableTime) || 20;
  let selected = [...baseList];

  if (durationFactor <= 20) {
    selected = selected.slice(0, 3);
  } else if (durationFactor <= 35) {
    selected = selected.slice(0, 4);
  }

  const extraSets = durationFactor <= 35 ? 0 : durationFactor <= 60 ? 1 : 2;
  return selected.map((exercise) => {
    const alternative = equipmentAlternatives[exercise.name]?.[equipment];
    return {
      ...exercise,
      ...(alternative || {}),
      sets: Math.min(Number(exercise.sets || 1) + extraSets, 5),
    };
  });
};

const generateWorkoutPlan = ({ goal, level, availableTime, equipment }) => {
  const selectedGoal = goal || 'General Fitness';
  const selectedLevel = level || 'Beginner';
  const duration = availableTime || 20;
  const plan = getExercises({
    goal: selectedGoal,
    level: selectedLevel,
    availableTime: duration,
    equipment,
  });

  return {
    goal: selectedGoal,
    level: selectedLevel,
    duration: Number(duration),
    equipment: equipment || 'Bodyweight',
    note: 'This workout uses rule-based guidance and is designed for beginner-friendly training.',
    exercises: plan.map((exercise, index) => ({
      ...exercise,
      id: `${selectedGoal}-${selectedLevel}-${index + 1}`,
    })),
  };
};

module.exports = { generateWorkoutPlan };
