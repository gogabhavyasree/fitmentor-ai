const express = require('express');
const Workout = require('../models/Workout');
const WorkoutSession = require('../models/WorkoutSession');
const { generateWorkoutPlan } = require('../utils/workoutGenerator');
const { requireAuth } = require('./authRoutes');

const router = express.Router();

const alternativesByName = {
  'Jumping Jacks': [
    { key: 'Step Jacks', name: 'Step Jacks', instructions: 'Step one foot out at a time while lifting your arms.' },
    { key: 'Marching High Knees', name: 'Marching High Knees', instructions: 'March in place and lift each knee with control.' },
  ],
  'Bodyweight Squats': [
    { key: 'Reverse Lunges', name: 'Reverse Lunges', instructions: 'Step back and lower under control, alternating sides.' },
    { key: 'Glute Bridges', name: 'Glute Bridges', instructions: 'Lie on your back and lift your hips by squeezing your glutes.' },
  ],
  'High Knees': [
    { key: 'Marching High Knees', name: 'Marching High Knees', instructions: 'March in place and lift each knee with control.' },
    { key: 'Step Jacks', name: 'Step Jacks', instructions: 'Step one foot out at a time while lifting your arms.' },
  ],
  'Mountain Climbers': [
    { key: 'Plank Shoulder Taps', name: 'Plank Shoulder Taps', instructions: 'From a stable plank, tap each shoulder while keeping your hips steady.' },
    { key: 'Incline Push-Ups', name: 'Incline Push-Ups', instructions: 'Place your hands on a stable raised surface and perform controlled push-ups.' },
  ],
  Burpees: [
    { key: 'Squat to Reach', name: 'Squat to Reach', instructions: 'Perform a controlled squat and reach overhead as you stand.' },
    { key: 'Step Jacks', name: 'Step Jacks', instructions: 'Step one foot out at a time while lifting your arms.' },
  ],
  'Reverse Lunges': [
    { key: 'Bodyweight Squats', name: 'Bodyweight Squats', instructions: 'Sit back into a comfortable squat and stand tall with control.' },
    { key: 'Glute Bridges', name: 'Glute Bridges', instructions: 'Lie on your back and lift your hips by squeezing your glutes.' },
  ],
  'Fast Feet': [
    { key: 'Marching High Knees', name: 'Marching High Knees', instructions: 'March in place and lift each knee with control.' },
    { key: 'Step Jacks', name: 'Step Jacks', instructions: 'Step one foot out at a time while lifting your arms.' },
  ],
  'Plank Shoulder Taps': [
    { key: 'Mountain Climbers', name: 'Mountain Climbers', instructions: 'From a stable plank, alternate drawing your knees forward.' },
    { key: 'Incline Push-Ups', name: 'Incline Push-Ups', instructions: 'Place your hands on a stable raised surface and perform controlled push-ups.' },
  ],
  'Push-Ups': [
    { key: 'Incline Push-Ups', name: 'Incline Push-Ups', instructions: 'Place your hands on a stable raised surface and perform controlled push-ups.' },
    { key: 'Knee Push-Ups', name: 'Knee Push-Ups', instructions: 'Keep knees grounded and body aligned while lowering and pressing up.' },
  ],
  'Goblet Squats': [
    { key: 'Bodyweight Squats', name: 'Bodyweight Squats', instructions: 'Sit back into a comfortable squat and stand tall with control.' },
    { key: 'Reverse Lunges', name: 'Reverse Lunges', instructions: 'Step back and lower under control, alternating sides.' },
  ],
  'Bent-Over Rows': [
    { key: 'Prone Y-T-W Raises', name: 'Prone Y-T-W Raises', instructions: 'Lie face down and raise your arms into Y, T, and W positions with control.' },
    { key: 'Dumbbell Rows', name: 'Dumbbell Rows', instructions: 'Support your body and pull dumbbells toward your hips with control.', equipment: ['Dumbbells', 'Home gym'] },
    { key: 'Resistance Band Rows', name: 'Resistance Band Rows', instructions: 'Anchor a resistance band securely and pull toward your torso.', equipment: ['Home gym'] },
  ],
  'Dumbbell Press': [
    { key: 'Dumbbell Floor Press', name: 'Dumbbell Floor Press', instructions: 'Lie on the floor, lower dumbbells until your upper arms touch down, then press.', equipment: ['Dumbbells', 'Home gym'] },
    { key: 'Incline Push-Ups', name: 'Incline Push-Ups', instructions: 'Place your hands on a stable raised surface and perform controlled push-ups.' },
  ],
  'Pull-Ups': [
    { key: 'Resistance Band Rows', name: 'Resistance Band Rows', instructions: 'Anchor a resistance band securely and pull toward your torso.', equipment: ['Home gym'] },
    { key: 'Bent-Over Rows', name: 'Bent-Over Rows', instructions: 'Hinge at your hips and pull your weights toward your lower ribs.', equipment: ['Dumbbells', 'Home gym'] },
  ],
  Deadlift: [
    { key: 'Glute Bridges', name: 'Glute Bridges', instructions: 'Lie on your back and lift your hips by squeezing your glutes.' },
    { key: 'Hip Hinge Drill', name: 'Hip Hinge Drill', instructions: 'Practice hinging your hips back with a neutral spine and stand tall.' },
  ],
  'Bench Press': [
    { key: 'Dumbbell Floor Press', name: 'Dumbbell Floor Press', instructions: 'Lie on the floor, lower dumbbells until your upper arms touch down, then press.', equipment: ['Dumbbells', 'Home gym'] },
    { key: 'Knee Push-Ups', name: 'Knee Push-Ups', instructions: 'Keep knees grounded and body aligned while lowering and pressing up.' },
  ],
  'Overhead Press': [
    { key: 'Dumbbell Press', name: 'Dumbbell Press', instructions: 'Press dumbbells upward while keeping your ribs down.', equipment: ['Dumbbells', 'Home gym'] },
    { key: 'Incline Push-Ups', name: 'Incline Push-Ups', instructions: 'Place your hands on a stable raised surface and perform controlled push-ups.' },
  ],
  'Warm-Up Walk': [
    { key: 'Marching High Knees', name: 'Marching High Knees', instructions: 'March in place and lift each knee with control.' },
    { key: 'Step Jacks', name: 'Step Jacks', instructions: 'Step one foot out at a time while lifting your arms.' },
  ],
  'Incline Push-Ups': [
    { key: 'Knee Push-Ups', name: 'Knee Push-Ups', instructions: 'Keep knees grounded and body aligned while lowering and pressing up.' },
    { key: 'Push-Ups', name: 'Push-Ups', instructions: 'Keep your body straight and engage your core as you lower and press.' },
  ],
  'Glute Bridges': [
    { key: 'Bodyweight Squats', name: 'Bodyweight Squats', instructions: 'Sit back into a comfortable squat and stand tall with control.' },
    { key: 'Reverse Lunges', name: 'Reverse Lunges', instructions: 'Step back and lower under control, alternating sides.' },
  ],
  'Kettlebell Swings': [
    { key: 'Hip Hinge Drill', name: 'Hip Hinge Drill', instructions: 'Practice hinging your hips back with a neutral spine and stand tall.' },
    { key: 'Glute Bridges', name: 'Glute Bridges', instructions: 'Lie on your back and lift your hips by squeezing your glutes.' },
  ],
  'Step-Ups': [
    { key: 'Reverse Lunges', name: 'Reverse Lunges', instructions: 'Step back and lower under control, alternating sides.' },
    { key: 'Bodyweight Squats', name: 'Bodyweight Squats', instructions: 'Sit back into a comfortable squat and stand tall with control.' },
  ],
  'Russian Twists': [
    { key: 'Plank Shoulder Taps', name: 'Plank Shoulder Taps', instructions: 'From a stable plank, tap each shoulder while keeping your hips steady.' },
    { key: 'Dead Bug', name: 'Dead Bug', instructions: 'Lie on your back and alternate extending opposite arm and leg with control.' },
  ],
  Plank: [
    { key: 'Plank Shoulder Taps', name: 'Plank Shoulder Taps', instructions: 'From a stable plank, tap each shoulder while keeping your hips steady.' },
    { key: 'Dead Bug', name: 'Dead Bug', instructions: 'Lie on your back and alternate extending opposite arm and leg with control.' },
  ],
};

const asPlan = (workout) => ({
  workoutId: workout._id.toString(),
  goal: workout.goal,
  level: workout.level,
  duration: workout.duration,
  equipment: workout.equipment,
  note: workout.note,
  exercises: workout.exercises,
  createdAt: workout.createdAt,
});

const saveGeneratedWorkout = async (req, res, next) => {
  try {
    const requestData = req.method === 'GET' ? req.query : req.body;
    const input = requestData || {};
    const goals = ['Weight Loss', 'Muscle Gain', 'General Fitness'];
    const levels = ['Beginner', 'Intermediate'];
    const equipmentOptions = ['Bodyweight', 'Dumbbells', 'Yoga mat', 'Home gym'];
    const availableTime = Number(input.availableTime);
    if (!goals.includes(input.goal) || !levels.includes(input.level)
      || !Number.isInteger(availableTime) || availableTime < 10 || availableTime > 120
      || !equipmentOptions.includes(input.equipment)) {
      return res.status(400).json({ message: 'Choose a valid goal, level, time between 10 and 120 minutes, and equipment option.' });
    }
    const plan = generateWorkoutPlan({ ...input, availableTime });
    const workout = await Workout.create({
      user: req.session.user._id,
      ...plan,
    });
    res.status(201).json({ plan: asPlan(workout), message: 'Workout plan saved.' });
  } catch (error) {
    next(error);
  }
};

router.post('/generate', requireAuth, saveGeneratedWorkout);
router.get('/generate', requireAuth, saveGeneratedWorkout);

router.get('/latest', requireAuth, async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ user: req.session.user._id }).sort({ createdAt: -1 });
    res.json({ plan: workout ? asPlan(workout) : null });
  } catch (error) {
    next(error);
  }
});

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const [workouts, sessions] = await Promise.all([
      Workout.find({ user: req.session.user._id }).sort({ createdAt: -1 }).limit(30),
      WorkoutSession.find({ user: req.session.user._id }).sort({ createdAt: -1 }).limit(100),
    ]);
    res.json({
      workouts: workouts.map(asPlan),
      sessions: sessions.map((session) => ({ ...session.toObject(), id: session._id.toString() })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:workoutId/exercises/:exerciseId/alternatives', requireAuth, async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.workoutId, user: req.session.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout plan was not found.' });
    const exercise = workout.exercises.find((item) => item.id === req.params.exerciseId);
    if (!exercise) return res.status(404).json({ message: 'Exercise was not found in this workout.' });
    res.json({
      alternatives: (alternativesByName[exercise.name] || [])
        .filter((alternative) => !alternative.equipment || alternative.equipment.includes(req.session.user.equipment)),
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:workoutId/exercises/:exerciseId/alternative', requireAuth, async (req, res, next) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.workoutId, user: req.session.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout plan was not found.' });
    const exercise = workout.exercises.find((item) => item.id === req.params.exerciseId);
    if (!exercise) return res.status(404).json({ message: 'Exercise was not found in this workout.' });
    const alternative = (alternativesByName[exercise.name] || []).find((item) => item.key === req.body.alternative
      && (!item.equipment || item.equipment.includes(req.session.user.equipment)));
    if (!alternative) return res.status(400).json({ message: 'Choose one of the suggested alternatives.' });
    exercise.name = alternative.name;
    exercise.instructions = alternative.instructions;
    await workout.save();
    res.json({ plan: asPlan(workout) });
  } catch (error) {
    next(error);
  }
});

router.post('/complete', requireAuth, async (req, res, next) => {
  try {
    const { exerciseName, completed, skipped, workoutId } = req.body;
    if (typeof exerciseName !== 'string' || !exerciseName.trim()) {
      return res.status(400).json({ message: 'Exercise name is required.' });
    }
    if (typeof completed !== 'boolean' || typeof skipped !== 'boolean' || completed === skipped) {
      return res.status(400).json({ message: 'Mark the exercise as completed or skipped.' });
    }
    if (workoutId && !/^[a-f\d]{24}$/i.test(workoutId)) {
      return res.status(400).json({ message: 'Invalid workout ID.' });
    }
    if (workoutId) {
      const workout = await Workout.findOne({ _id: workoutId, user: req.session.user._id });
      if (!workout || !workout.exercises.some((exercise) => exercise.name === exerciseName.trim())) {
        return res.status(404).json({ message: 'Exercise was not found in this workout.' });
      }
    }
    const session = await WorkoutSession.create({
      user: req.session.user._id,
      ...(workoutId ? { workout: workoutId } : {}),
      exerciseName: exerciseName.trim(),
      completed: Boolean(completed),
      skipped: Boolean(skipped),
    });
    res.status(201).json({ message: 'Workout progress saved.', result: session });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
