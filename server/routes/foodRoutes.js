const express = require('express');
const { requireAuth } = require('./authRoutes');
const { foodDatabase, searchFood, calculateMealNutrition, getFoodAllergens } = require('../utils/foodDatabase');
const Meal = require('../models/Meal');

const router = express.Router();

router.get('/list', requireAuth, (req, res) => {
  res.json({
    foods: foodDatabase.map((food) => ({ ...food, allergens: getFoodAllergens(food) })),
    servingNote: 'Nutrition values are estimates for the serving size shown.',
  });
});

router.get('/search', requireAuth, (req, res) => {
  res.json({ results: searchFood(typeof req.query.q === 'string' ? req.query.q : '') });
});

router.get('/protein-rankings', requireAuth, (req, res) => {
  const hostelFriendlySet = new Set([
    'Milk', 'Curd', 'Greek Yogurt', 'Buttermilk', 'Peanuts', 'Peanut Butter',
    'Roasted Chana', 'Banana', 'Apple', 'Orange', 'Papaya', 'Mango', 'Watermelon',
    'Sprouted Moong', 'Whole Wheat Bread', 'Cheese', 'Makhana', 'Walnuts', 'Almonds'
  ]);

  const rankedFoods = foodDatabase.map((food) => {
    const cost = Number(food.cost) || 1;
    const protein = Number(food.protein) || 0;
    const calories = Number(food.calories) || 1;
    const proteinPer10Rupees = Number(((protein / cost) * 10).toFixed(1));
    const costPerGramProtein = Number((cost / Math.max(protein, 0.1)).toFixed(2));
    const proteinDensity = Math.min(100, Math.round(((protein * 4) / calories) * 100));
    const hostelFriendly = hostelFriendlySet.has(food.name);

    const badges = [];
    if (proteinPer10Rupees >= 15) badges.push('👑 Budget King');
    else if (proteinPer10Rupees >= 8) badges.push('⚡ High Value');

    if (protein >= 15) badges.push('💪 High Protein');
    if (hostelFriendly) badges.push('🎒 Hostel Ready');
    if (food.vegetarian && protein >= 10) badges.push('🌱 Veg Power');

    return {
      ...food,
      allergens: getFoodAllergens(food),
      proteinPer10Rupees,
      costPerGramProtein,
      proteinDensity,
      hostelFriendly,
      badges,
    };
  });

  res.json({
    foods: rankedFoods,
    note: 'Rankings calculated from catalog serving size and estimated local Indian prices.',
  });
});

router.post('/meal', requireAuth, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.foods) || req.body.foods.length === 0) {
      return res.status(400).json({ message: 'Select at least one food before saving a meal.' });
    }
    const names = req.body.foods.map((food) => food?.name).filter((name) => typeof name === 'string');
    if (names.length !== req.body.foods.length) {
      return res.status(400).json({ message: 'Every selected food must have a valid name.' });
    }
    const selectedFoods = names.map((name) => foodDatabase.find((food) => food.name === name)).filter(Boolean);
    if (!selectedFoods.length || selectedFoods.length !== names.length) {
      return res.status(400).json({ message: 'One or more selected foods are not in the food database.' });
    }
    const meal = await Meal.create({
      user: req.session.user._id,
      foods: selectedFoods,
      nutrition: calculateMealNutrition(selectedFoods),
    });
    res.status(201).json({ message: 'Meal saved to your history.', meal: { ...meal.toObject(), id: meal._id.toString() } });
  } catch (error) {
    next(error);
  }
});

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const meals = await Meal.find({ user: req.session.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json({ meals: meals.map((meal) => ({ ...meal.toObject(), id: meal._id.toString() })) });
  } catch (error) {
    next(error);
  }
});

router.patch('/meal/:id/favorite', requireAuth, async (req, res, next) => {
  try {
    if (typeof req.body.favorite !== 'boolean') {
      return res.status(400).json({ message: 'Choose whether this meal is a favorite.' });
    }
    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, user: req.session.user._id },
      { favorite: req.body.favorite },
      { new: true }
    );
    if (!meal) return res.status(404).json({ message: 'Saved meal was not found.' });
    res.json({ meal: { ...meal.toObject(), id: meal._id.toString() } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
