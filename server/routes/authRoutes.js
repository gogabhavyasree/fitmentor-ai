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

    if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailKey) || typeof password !== 'string' || password.length < 8) {
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
    const { name, age, goal, fitnessLevel, availableTime, equipment, dietPreference, allergens } = req.body;
    const validGoals = ['Weight Loss', 'Muscle Gain', 'General Fitness'];
    const validLevels = ['Beginner', 'Intermediate'];
    const validEquipment = ['Bodyweight', 'Dumbbells', 'Yoga mat', 'Home gym'];
    const validDietPreferences = ['Any', 'Vegetarian', 'Non-vegetarian'];
    const validAllergens = ['dairy', 'egg', 'fish', 'gluten', 'peanut', 'sesame', 'shellfish', 'soy', 'tree nuts'];
    const ageNumber = Number(age);
    const availableTimeNumber = Number(availableTime);
    if (typeof name !== 'string' || !name.trim() || !Number.isInteger(ageNumber) || ageNumber < 13 || ageNumber > 120
      || !validGoals.includes(goal) || !validLevels.includes(fitnessLevel)
      || !Number.isInteger(availableTimeNumber) || availableTimeNumber < 10 || availableTimeNumber > 120
      || !validEquipment.includes(equipment) || !validDietPreferences.includes(dietPreference)
      || !Array.isArray(allergens) || allergens.some((allergen) => !validAllergens.includes(allergen))) {
      return res.status(400).json({ message: 'Enter a valid name, age, and fitness goal.' });
    }

    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        name: name.trim(),
        age: ageNumber,
        goal,
        fitnessLevel,
        availableTime: availableTimeNumber,
        equipment,
        dietPreference,
        allergens: [...new Set(allergens)],
      },
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

module.exports = router;
module.exports.requireAuth = requireAuth;
