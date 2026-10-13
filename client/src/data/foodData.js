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
  allergens = [],
}) => {
  const foodByName = new Map(foods.map((food) => [food.name, food]));
  const isVegetarian = preference === 'vegetarian';
  const lowBudget = Number(budget) < 120;
  const excludedAllergens = new Set(allergens);
  let omittedItems = 0;
  const available = (...names) => {
    const food = names
      .map((name) => foodByName.get(name))
      .find((item) => item && !(item.allergens || []).some((allergen) => excludedAllergens.has(allergen)));
    if (!food) omittedItems += 1;
    return food;
  };

  const meals = [
    {
      name: 'Breakfast',
      items: availability === 'home'
        ? [
          available(...(isVegetarian
            ? (lowBudget ? ['Poha', 'Idli', 'Oats', 'Banana'] : ['Oats', 'Poha', 'Idli', 'Banana'])
            : ['Eggs', 'Paneer', 'Tofu', 'Soya Chunks', 'Roasted Chana'])),
          ...(isVegetarian ? [] : [available('Whole Wheat Bread', 'Chapati', 'Brown Rice')]),
        ]
        : [
          available(...(isVegetarian
            ? (lowBudget ? ['Idli', 'Poha', 'Oats', 'Banana'] : ['Upma', 'Idli', 'Poha', 'Banana'])
            : ['Eggs', 'Paneer', 'Tofu', 'Soya Chunks', 'Roasted Chana'])),
          ...(isVegetarian || lowBudget ? [] : [available('Whole Wheat Bread', 'Chapati', 'Brown Rice')]),
        ],
    },
    {
      name: 'Lunch',
      items: [
        available('White Rice', 'Brown Rice', 'Quinoa'),
        available(...(availability === 'hostel' ? ['Sambar', 'Dal', 'Rajma', 'Chana Masala'] : ['Dal', 'Rajma', 'Chana Masala', 'Sambar'])),
        available('Mixed Vegetable Curry', 'Spinach', 'Mixed Salad'),
        ...(!isVegetarian && !lowBudget ? [available('Chicken Breast', 'Fish', 'Eggs')] : []),
      ],
    },
    {
      name: 'Snack',
      items: [available('Banana', 'Apple', 'Orange'), available(...(lowBudget
        ? ['Peanuts', 'Roasted Chana', 'Makhana']
        : ['Roasted Chana', 'Peanuts', 'Makhana']))],
    },
    {
      name: 'Dinner',
      items: [
        available('Chapati', 'Brown Rice', 'White Rice'),
        available('Dal', 'Rajma', 'Chana Masala', 'Sambar'),
        available('Mixed Vegetable Curry', 'Spinach', 'Mixed Salad'),
        ...(isVegetarian ? [] : [available(...(lowBudget
          ? ['Eggs', 'Chicken Breast', 'Fish']
          : ['Chicken Breast', 'Eggs', 'Fish']))]),
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
  const proteinAlternatives = (isVegetarian
    ? ['Dal', 'Soya Chunks', 'Roasted Chana', 'Paneer', 'Tofu']
    : ['Eggs', 'Chicken Breast', 'Fish', 'Dal', 'Roasted Chana'])
    .map((name) => foodByName.get(name))
    .filter((food) => food && !(food.allergens || []).some((allergen) => excludedAllergens.has(allergen)))
    .slice(0, 3)
    .map((food) => food.name);
  const alternatives = [
    proteinAlternatives.length
      ? `Lower-cost protein options in this catalog: ${proteinAlternatives.join(', ')}.`
      : 'No catalog protein option is clearly tagged as suitable for your selected allergens. Check ingredients and labels before choosing foods.',
    'Use seasonal fruit and vegetables to reduce cost.',
  ];

  return {
    budget: Number(budget),
    preference,
    goal,
    availability,
    meals,
    nutrition,
    estimatedCost,
    omittedItems,
    goalTip,
    budgetTip,
    alternatives,
  };
};
