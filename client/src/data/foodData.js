export const buildMealSummary = (selectedFoods = []) => selectedFoods.reduce(
  (totals, food) => ({
    calories: totals.calories + Number(food.calories || 0),
    protein: totals.protein + Number(food.protein || 0),
    carbs: totals.carbs + Number(food.carbs || 0),
    fat: totals.fat + Number(food.fat || 0),
  }),
  { calories: 0, protein: 0, carbs: 0, fat: 0 }
);

export const getBudgetPlan = ({
  budget = 150,
  preference = 'vegetarian',
  goal = 'Weight Loss',
  availability = 'hostel',
  foods = [],
}) => {
  const foodByName = new Map(foods.map((food) => [food.name, food]));
  const isVegetarian = preference === 'vegetarian';
  const lowBudget = Number(budget) < 120;
  const available = (name) => foodByName.get(name);

  const meals = [
    {
      name: 'Breakfast',
      items: availability === 'home'
        ? [available(isVegetarian ? (lowBudget ? 'Poha' : 'Oats') : 'Eggs'), ...(isVegetarian ? [] : [available('Whole Wheat Bread')])]
        : [available(isVegetarian ? (lowBudget ? 'Idli' : 'Upma') : 'Eggs'), ...(isVegetarian || lowBudget ? [] : [available('Whole Wheat Bread')])],
    },
    {
      name: 'Lunch',
      items: [
        available('White Rice'),
        available(availability === 'hostel' ? 'Sambar' : 'Dal'),
        available('Mixed Vegetable Curry'),
        ...(!isVegetarian && !lowBudget ? [available('Chicken Breast')] : []),
      ],
    },
    {
      name: 'Snack',
      items: [available('Banana'), available(lowBudget ? 'Peanuts' : 'Roasted Chana')],
    },
    {
      name: 'Dinner',
      items: [
        available('Chapati'),
        available('Dal'),
        available('Mixed Vegetable Curry'),
        ...(isVegetarian ? [] : [available(lowBudget ? 'Eggs' : 'Chicken Breast')]),
      ],
    },
  ].map((meal) => ({ ...meal, items: meal.items.filter(Boolean) }));

  const mealFoods = meals.flatMap((meal) => meal.items);
  const nutrition = buildMealSummary(mealFoods);
  const estimatedCost = mealFoods.reduce((sum, food) => sum + Number(food.cost || 0), 0);
  const goalTip = goal === 'Muscle Gain'
    ? 'For muscle gain, include a protein source with each meal and pair it with resistance training.'
    : goal === 'Weight Loss'
      ? 'For weight management, keep portions comfortable and include vegetables and protein with meals.'
      : 'For general fitness, aim for a mix of grains, vegetables, and protein sources through the day.';
  const budgetTip = estimatedCost > Number(budget)
    ? 'This sample plan is above the entered budget. Use the lower-cost alternatives listed below or adjust serving choices.'
    : 'This sample estimate is within the daily budget you entered.';
  const alternatives = isVegetarian
    ? ['Choose dal, soya chunks, or roasted chana for affordable vegetarian protein.', 'Use seasonal fruit and vegetables to reduce cost.']
    : ['Eggs are often a lower-cost protein alternative to chicken.', 'Choose seasonal fruit and vegetables to reduce cost.'];

  return {
    budget: Number(budget),
    preference,
    goal,
    availability,
    meals,
    nutrition,
    estimatedCost,
    goalTip,
    budgetTip,
    alternatives,
  };
};
