const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

const getSafeUser = (user) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  age: user.age,
  goal: user.goal,
  fitnessLevel: user.fitnessLevel || 'Beginner',
  availableTime: user.availableTime || 20,
  equipment: user.equipment || 'Bodyweight',
  dietPreference: user.dietPreference || 'Any',
  allergens: user.allergens || [],
  role: user.role,
  height: user.height || null,
  weight: user.weight || null,
  gender: user.gender || 'male',
  activityLevel: user.activityLevel || 'moderate',
  targetCalories: user.targetCalories || null,
  targetProtein: user.targetProtein || null,
  targetCarbs: user.targetCarbs || null,
  targetFat: user.targetFat || null,
  waterGoal: user.waterGoal || 8,
});

const requireAuth = (req, res, next) => {
  if (!req.session.user?._id) {
    return res.status(401).json({ message: 'Please log in first.' });
  }
  next();
};

const establishSession = (req, user) => new Promise((resolve, reject) => {
  req.session.regenerate((error) => {
    if (error) return reject(error);
    req.session.user = getSafeUser(user);
    req.session.save((saveError) => {
      if (saveError) return reject(saveError);
      resolve(req.session.user);
    });
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, age, goal } = req.body;
    const emailKey = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const ageNumber = Number(age);
    const validGoals = ['Weight Loss', 'Muscle Gain', 'General Fitness'];

    if (typeof name !== 'string' || !name.trim()
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailKey)
      || typeof password !== 'string'
      || password.length < 8) {
      return res.status(400).json({ message: 'Enter a name, valid email, and password with at least 8 characters.' });
    }
    if (!Number.isInteger(ageNumber) || ageNumber < 13 || ageNumber > 120 || (goal && !validGoals.includes(goal))) {
      return res.status(400).json({ message: 'Enter a valid age and fitness goal.' });
    }
    if (await User.exists({ email: emailKey })) {
      return res.status(409).json({ message: 'An account already exists for this email.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: emailKey,
      password: await bcrypt.hash(password, 10),
      age: ageNumber,
      goal: goal || 'General Fitness',
      role: 'user',
    });
    const safeUser = await establishSession(req, user);
    res.status(201).json({ message: 'Registration successful.', user: safeUser });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account already exists for this email.' });
    }
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const safeUser = await establishSession(req, user);
    res.json({ message: 'Login successful.', user: safeUser });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    let user = await User.findById(req.session.user._id);
    if (!user) {
      user = await User.findOne({ email: req.session.user.email });
    }
    if (!user) {
      return req.session.destroy(() => res.status(401).json({ message: 'Please log in again.' }));
    }
    req.session.user = getSafeUser(user);
    res.json({ user: req.session.user });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

router.post('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, age, goal, fitnessLevel, availableTime, equipment, dietPreference, allergens, height, weight, gender, activityLevel } = req.body;
    const validGoals = ['Weight Loss', 'Muscle Gain', 'General Fitness'];
    const validLevels = ['Beginner', 'Intermediate'];
    const validEquipment = ['Bodyweight', 'Dumbbells', 'Yoga mat', 'Home gym'];
    const validDietPreferences = ['Any', 'Vegetarian', 'Non-vegetarian'];
    const validAllergens = ['dairy', 'egg', 'fish', 'gluten', 'peanut', 'sesame', 'shellfish', 'soy', 'tree nuts'];
    const validGenders = ['male', 'female', 'other'];
    const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'extreme'];
    const ageNumber = Number(age);
    const availableTimeNumber = Number(availableTime);
    if (typeof name !== 'string' || !name.trim() || !Number.isInteger(ageNumber) || ageNumber < 13 || ageNumber > 120
      || !validGoals.includes(goal) || !validLevels.includes(fitnessLevel)
      || !Number.isInteger(availableTimeNumber) || availableTimeNumber < 10 || availableTimeNumber > 120
      || !validEquipment.includes(equipment) || !validDietPreferences.includes(dietPreference)
      || !Array.isArray(allergens) || allergens.some((allergen) => !validAllergens.includes(allergen))) {
      return res.status(400).json({ message: 'Enter a valid name, age, and fitness goal.' });
    }

    const updateData = {
      name: name.trim(),
      age: ageNumber,
      goal,
      fitnessLevel,
      availableTime: availableTimeNumber,
      equipment,
      dietPreference,
      allergens: [...new Set(allergens)],
    };

    if (height && Number.isFinite(Number(height)) && Number(height) >= 50 && Number(height) <= 250) {
      updateData.height = Number(height);
    }
    if (weight && Number.isFinite(Number(weight)) && Number(weight) >= 20 && Number(weight) <= 500) {
      updateData.weight = Number(weight);
    }
    if (gender && validGenders.includes(gender)) {
      updateData.gender = gender;
    }
    if (activityLevel && validActivityLevels.includes(activityLevel)) {
      updateData.activityLevel = activityLevel;
    }

    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    req.session.user = getSafeUser(user);
    res.json({ message: 'Profile updated successfully.', user: req.session.user });
  } catch (error) {
    next(error);
  }
});

router.post('/macro-targets', requireAuth, async (req, res, next) => {
  try {
    const { targetCalories, targetProtein, targetCarbs, targetFat, waterGoal, height, weight, gender, activityLevel } = req.body;
    const updateData = {};
    if (targetCalories && Number.isFinite(Number(targetCalories)) && Number(targetCalories) >= 500 && Number(targetCalories) <= 10000) {
      updateData.targetCalories = Math.round(Number(targetCalories));
    }
    if (targetProtein && Number.isFinite(Number(targetProtein)) && Number(targetProtein) >= 10 && Number(targetProtein) <= 500) {
      updateData.targetProtein = Math.round(Number(targetProtein));
    }
    if (targetCarbs && Number.isFinite(Number(targetCarbs)) && Number(targetCarbs) >= 10 && Number(targetCarbs) <= 1000) {
      updateData.targetCarbs = Math.round(Number(targetCarbs));
    }
    if (targetFat && Number.isFinite(Number(targetFat)) && Number(targetFat) >= 5 && Number(targetFat) <= 500) {
      updateData.targetFat = Math.round(Number(targetFat));
    }
    if (waterGoal && Number.isFinite(Number(waterGoal)) && Number(waterGoal) >= 1 && Number(waterGoal) <= 20) {
      updateData.waterGoal = Math.round(Number(waterGoal));
    }
    if (height && Number.isFinite(Number(height)) && Number(height) >= 50 && Number(height) <= 250) {
      updateData.height = Number(height);
    }
    if (weight && Number.isFinite(Number(weight)) && Number(weight) >= 20 && Number(weight) <= 500) {
      updateData.weight = Number(weight);
    }
    if (gender && ['male', 'female', 'other'].includes(gender)) {
      updateData.gender = gender;
    }
    if (activityLevel && ['sedentary', 'light', 'moderate', 'active', 'extreme'].includes(activityLevel)) {
      updateData.activityLevel = activityLevel;
    }

    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    req.session.user = getSafeUser(user);
    res.json({ message: 'Personalized macro and fitness targets saved to your profile!', user: req.session.user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
