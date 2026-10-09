const foodDatabase = [
  { name: 'White Rice', category: 'Grains', serving: '1 cup cooked (158 g)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4, vegetarian: true, cost: 12 },
  { name: 'Brown Rice', category: 'Grains', serving: '1 cup cooked (195 g)', calories: 216, protein: 5, carbs: 45, fat: 1.8, vegetarian: true, cost: 18 },
  { name: 'Oats', category: 'Grains', serving: '40 g dry', calories: 152, protein: 5.3, carbs: 27, fat: 2.7, vegetarian: true, cost: 12 },
  { name: 'Poha', category: 'Indian meals', serving: '1 bowl (180 g)', calories: 250, protein: 5, carbs: 46, fat: 5, vegetarian: true, cost: 20 },
  { name: 'Idli', category: 'Indian meals', serving: '2 medium pieces', calories: 116, protein: 4, carbs: 24, fat: 0.6, vegetarian: true, cost: 15 },
  { name: 'Dosa', category: 'Indian meals', serving: '1 medium plain dosa', calories: 133, protein: 3.5, carbs: 18, fat: 4, vegetarian: true, cost: 20 },
  { name: 'Pesarattu', category: 'Indian meals', serving: '1 medium', calories: 166, protein: 10, carbs: 18, fat: 4.5, vegetarian: true, cost: 25 },
  { name: 'Upma', category: 'Indian meals', serving: '1 bowl (200 g)', calories: 200, protein: 6, carbs: 33, fat: 5, vegetarian: true, cost: 20 },
  { name: 'Pongal', category: 'Indian meals', serving: '1 bowl (200 g)', calories: 240, protein: 8, carbs: 36, fat: 7, vegetarian: true, cost: 24 },
  { name: 'Chapati', category: 'Grains', serving: '1 medium (40 g)', calories: 120, protein: 4, carbs: 22, fat: 1.5, vegetarian: true, cost: 5 },
  { name: 'Paratha', category: 'Grains', serving: '1 medium', calories: 260, protein: 5, carbs: 36, fat: 11, vegetarian: true, cost: 15 },
  { name: 'Whole Wheat Bread', category: 'Grains', serving: '2 slices (56 g)', calories: 138, protein: 7, carbs: 24, fat: 2, vegetarian: true, cost: 10 },
  { name: 'Pasta', category: 'Grains', serving: '1 cup cooked (140 g)', calories: 221, protein: 8, carbs: 43, fat: 1.3, vegetarian: true, cost: 22 },
  { name: 'Quinoa', category: 'Grains', serving: '1 cup cooked (185 g)', calories: 222, protein: 8, carbs: 39, fat: 3.6, vegetarian: true, cost: 45 },
  { name: 'Dal', category: 'Pulses & beans', serving: '1 cup cooked (198 g)', calories: 198, protein: 12, carbs: 30, fat: 4, vegetarian: true, cost: 18 },
  { name: 'Sambar', category: 'Pulses & beans', serving: '1 cup (240 ml)', calories: 120, protein: 5, carbs: 17, fat: 3, vegetarian: true, cost: 14 },
  { name: 'Rajma', category: 'Pulses & beans', serving: '1 cup cooked (177 g)', calories: 225, protein: 15, carbs: 40, fat: 1, vegetarian: true, cost: 25 },
  { name: 'Chana Masala', category: 'Pulses & beans', serving: '1 cup (240 g)', calories: 280, protein: 14, carbs: 45, fat: 6, vegetarian: true, cost: 25 },
  { name: 'Sprouted Moong', category: 'Pulses & beans', serving: '1 cup (100 g)', calories: 100, protein: 7, carbs: 19, fat: 0.5, vegetarian: true, cost: 15 },
  { name: 'Roasted Chana', category: 'Pulses & beans', serving: '30 g handful', calories: 120, protein: 6, carbs: 18, fat: 2, vegetarian: true, cost: 8 },
  { name: 'Paneer', category: 'Protein', serving: '100 g', calories: 265, protein: 18, carbs: 4, fat: 20, vegetarian: true, cost: 45 },
  { name: 'Tofu', category: 'Protein', serving: '100 g', calories: 144, protein: 17, carbs: 3, fat: 9, vegetarian: true, cost: 30 },
  { name: 'Soya Chunks', category: 'Protein', serving: '50 g dry', calories: 173, protein: 26, carbs: 17, fat: 0.5, vegetarian: true, cost: 12 },
  { name: 'Eggs', category: 'Protein', serving: '2 large eggs', calories: 144, protein: 12.6, carbs: 0.7, fat: 9.6, vegetarian: false, cost: 14 },
  { name: 'Chicken Breast', category: 'Protein', serving: '100 g cooked', calories: 165, protein: 31, carbs: 0, fat: 3.6, vegetarian: false, cost: 40 },
  { name: 'Chicken Curry', category: 'Protein', serving: '1 cup (200 g)', calories: 280, protein: 24, carbs: 8, fat: 17, vegetarian: false, cost: 50 },
  { name: 'Fish', category: 'Protein', serving: '100 g cooked', calories: 150, protein: 22, carbs: 0, fat: 6, vegetarian: false, cost: 45 },
  { name: 'Milk', category: 'Dairy', serving: '1 glass (200 ml)', calories: 122, protein: 6.4, carbs: 9.6, fat: 6.6, vegetarian: true, cost: 12 },
  { name: 'Curd', category: 'Dairy', serving: '1 cup (245 g)', calories: 149, protein: 8.5, carbs: 11.4, fat: 8, vegetarian: true, cost: 15 },
  { name: 'Greek Yogurt', category: 'Dairy', serving: '100 g', calories: 97, protein: 9, carbs: 3.9, fat: 5, vegetarian: true, cost: 28 },
  { name: 'Buttermilk', category: 'Dairy', serving: '1 glass (250 ml)', calories: 60, protein: 3, carbs: 8, fat: 1.5, vegetarian: true, cost: 10 },
  { name: 'Cheese', category: 'Dairy', serving: '1 slice (20 g)', calories: 80, protein: 5, carbs: 1, fat: 6, vegetarian: true, cost: 15 },
  { name: 'Mixed Vegetable Curry', category: 'Vegetables', serving: '1 cup (180 g)', calories: 160, protein: 4, carbs: 20, fat: 7, vegetarian: true, cost: 20 },
  { name: 'Palak Paneer', category: 'Vegetables', serving: '1 cup (200 g)', calories: 240, protein: 12, carbs: 12, fat: 16, vegetarian: true, cost: 35 },
  { name: 'Aloo Sabzi', category: 'Vegetables', serving: '1 cup (180 g)', calories: 180, protein: 3, carbs: 30, fat: 6, vegetarian: true, cost: 14 },
  { name: 'Mixed Salad', category: 'Vegetables', serving: '1 bowl (150 g)', calories: 45, protein: 2, carbs: 10, fat: 0.5, vegetarian: true, cost: 15 },
  { name: 'Boiled Potato', category: 'Vegetables', serving: '1 medium (170 g)', calories: 145, protein: 3.2, carbs: 33, fat: 0.2, vegetarian: true, cost: 8 },
  { name: 'Spinach', category: 'Vegetables', serving: '1 cup cooked (180 g)', calories: 41, protein: 5.3, carbs: 7, fat: 0.5, vegetarian: true, cost: 12 },
  { name: 'Broccoli', category: 'Vegetables', serving: '1 cup cooked (156 g)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, vegetarian: true, cost: 30 },
  { name: 'Banana', category: 'Fruit', serving: '1 medium (118 g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, vegetarian: true, cost: 6 },
  { name: 'Apple', category: 'Fruit', serving: '1 medium (182 g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, vegetarian: true, cost: 18 },
  { name: 'Orange', category: 'Fruit', serving: '1 medium (131 g)', calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2, vegetarian: true, cost: 12 },
  { name: 'Papaya', category: 'Fruit', serving: '1 cup (140 g)', calories: 55, protein: 0.9, carbs: 14, fat: 0.2, vegetarian: true, cost: 12 },
  { name: 'Mango', category: 'Fruit', serving: '1 cup sliced (165 g)', calories: 99, protein: 1.4, carbs: 25, fat: 0.6, vegetarian: true, cost: 20 },
  { name: 'Watermelon', category: 'Fruit', serving: '1 cup diced (152 g)', calories: 46, protein: 0.9, carbs: 12, fat: 0.2, vegetarian: true, cost: 10 },
  { name: 'Peanuts', category: 'Nuts & snacks', serving: '28 g handful', calories: 161, protein: 7.3, carbs: 4.6, fat: 14, vegetarian: true, cost: 8 },
  { name: 'Almonds', category: 'Nuts & snacks', serving: '28 g (about 23 nuts)', calories: 164, protein: 6, carbs: 6, fat: 14, vegetarian: true, cost: 25 },
  { name: 'Walnuts', category: 'Nuts & snacks', serving: '28 g handful', calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, vegetarian: true, cost: 30 },
  { name: 'Peanut Butter', category: 'Nuts & snacks', serving: '1 tbsp (16 g)', calories: 94, protein: 3.5, carbs: 3.2, fat: 8, vegetarian: true, cost: 8 },
  { name: 'Makhana', category: 'Nuts & snacks', serving: '25 g', calories: 90, protein: 3, carbs: 18, fat: 0.5, vegetarian: true, cost: 18 },
  { name: 'Samosa', category: 'Snacks', serving: '1 medium piece', calories: 262, protein: 4, carbs: 30, fat: 14, vegetarian: true, cost: 15 },
  { name: 'Idli with Sambar', category: 'Indian meals', serving: '2 idli + 1/2 cup sambar', calories: 176, protein: 6.5, carbs: 33, fat: 2, vegetarian: true, cost: 25 },
  { name: 'Vegetable Biryani', category: 'Indian meals', serving: '1 cup (200 g)', calories: 280, protein: 6, carbs: 45, fat: 8, vegetarian: true, cost: 35 },
  { name: 'Chicken Biryani', category: 'Indian meals', serving: '1 cup (250 g)', calories: 380, protein: 18, carbs: 48, fat: 13, vegetarian: false, cost: 55 },
  { name: 'Dhokla', category: 'Indian meals', serving: '2 pieces (100 g)', calories: 160, protein: 6, carbs: 24, fat: 4, vegetarian: true, cost: 18 },
  { name: 'Besan Chilla', category: 'Indian meals', serving: '2 medium', calories: 220, protein: 12, carbs: 28, fat: 7, vegetarian: true, cost: 20 },
  { name: 'Ragi Mudde', category: 'Indian meals', serving: '1 medium ball (150 g)', calories: 180, protein: 4, carbs: 38, fat: 1, vegetarian: true, cost: 12 },
  { name: 'Pav Bhaji', category: 'Indian meals', serving: '1 plate', calories: 390, protein: 10, carbs: 55, fat: 15, vegetarian: true, cost: 35 },
  { name: 'Upma with Vegetables', category: 'Indian meals', serving: '1 bowl (220 g)', calories: 230, protein: 7, carbs: 37, fat: 6, vegetarian: true, cost: 22 },
  { name: 'Coconut Chutney', category: 'Indian meals', serving: '2 tbsp (30 g)', calories: 75, protein: 1, carbs: 3, fat: 7, vegetarian: true, cost: 5 },
  { name: 'Green Chutney', category: 'Indian meals', serving: '2 tbsp (30 g)', calories: 20, protein: 1, carbs: 4, fat: 0.3, vegetarian: true, cost: 4 },
];

const searchFood = (keyword = '') => {
  const normalized = keyword.trim().toLowerCase();
  return normalized
    ? foodDatabase.filter((food) => `${food.name} ${food.category}`.toLowerCase().includes(normalized))
    : foodDatabase;
};

const calculateMealNutrition = (selectedFoods = []) => selectedFoods.reduce(
  (totals, food) => ({
    calories: totals.calories + food.calories,
    protein: totals.protein + food.protein,
    carbs: totals.carbs + food.carbs,
    fat: totals.fat + food.fat,
  }),
  { calories: 0, protein: 0, carbs: 0, fat: 0 }
);

const getFoodAllergens = (food) => {
  const name = food.name.toLowerCase();
  const allergens = [];
  if (/\b(milk|curd|yogurt|buttermilk|paneer|cheese|cream)\b/.test(name)) allergens.push('dairy');
  if (/\begg(s)?\b/.test(name)) allergens.push('egg');
  if (/\bfish\b/.test(name)) allergens.push('fish');
  if (/\b(wheat|chapati|paratha|bread|pasta|upma|semolina|rava)\b/.test(name)) allergens.push('gluten');
  if (/\b(peanut|peanuts|peanut butter)\b/.test(name)) allergens.push('peanut');
  if (/\bsesame\b/.test(name)) allergens.push('sesame');
  if (/\b(soya|soy|tofu)\b/.test(name)) allergens.push('soy');
  if (/\b(almond|almonds|walnut|walnuts|cashew|pistachio)\b/.test(name)) allergens.push('tree nuts');
  return allergens;
};

module.exports = { foodDatabase, searchFood, calculateMealNutrition, getFoodAllergens };
