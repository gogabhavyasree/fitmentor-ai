import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildMealSummary } from '../data/foodData';

function FoodNutritionPage({ user }) {
  const [foods, setFoods] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All foods');
  const [dietFilter, setDietFilter] = useState(user?.dietPreference || 'Any');
  const [hideAllergens, setHideAllergens] = useState(true);
  const [mealFoods, setMealFoods] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadFoodPage = async () => {
      try {
        const [foodResponse, historyResponse] = await Promise.all([
          fetch('/api/food/list', { credentials: 'include' }),
          fetch('/api/food/history', { credentials: 'include' }),
        ]);
        const [foodData, historyData] = await Promise.all([foodResponse.json(), historyResponse.json()]);
        if (!foodResponse.ok) throw new Error(foodData.message || 'Unable to load the food list.');
        if (!historyResponse.ok) throw new Error(historyData.message || 'Unable to load meal history.');
        setFoods(foodData.foods);
        setHistory(historyData.meals || []);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadFoodPage();
  }, []);

  const categories = useMemo(() => ['All foods', ...new Set(foods.map((food) => food.category))], [foods]);
  const filteredFoods = foods.filter((food) => (
    (category === 'All foods' || food.category === category)
    && `${food.name} ${food.category}`.toLowerCase().includes(query.trim().toLowerCase())
    && (dietFilter === 'Any' || (dietFilter === 'Vegetarian' ? food.vegetarian : !food.vegetarian))
    && (!hideAllergens || !(food.allergens || []).some((allergen) => user?.allergens?.includes(allergen)))
  ));
  const totals = buildMealSummary(mealFoods);

  const addFood = (food) => {
    setMealFoods((current) => [...current, food]);
  };

  const removeFood = (index) => {
    setMealFoods((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const saveMeal = async () => {
    if (!mealFoods.length) return;
    setMessage('');

    try {
      const response = await fetch('/api/food/meal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foods: mealFoods }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save meal.');
      setHistory((current) => [data.meal, ...current]);
      setMealFoods([]);
      setMessage('Meal saved to your account.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleFavorite = async (meal) => {
    setMessage('');
    try {
      const response = await fetch(`/api/food/meal/${meal.id}/favorite`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !meal.favorite }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not update favorite.');
      setHistory((current) => current.map((item) => item.id === meal.id ? data.meal : item));
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Food Nutrition</h1>
          <p className="page-intro">Browse everyday foods and build a meal from estimated serving nutrition.</p>
        </div>
        <div className="header-actions">
          <Link to="/protein-finder" className="secondary-button">⚡ Protein Finder</Link>
          <Link to="/calculator" className="primary-button">🎯 Macro Calculator</Link>
        </div>
      </div>

      <p className="estimate-note">Values are estimates per serving shown. Actual nutrition varies with recipe, brand, and portion size.</p>

      <div className="grid-2 nutrition-layout">
        <div className="form-card">
          <div className="food-filters">
            <div className="form-group">
              <label htmlFor="food-search">Find a food</label>
              <input id="food-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rice, fruit, protein..." />
            </div>
            <div className="form-group">
              <label htmlFor="food-category">Category</label>
              <select id="food-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="food-diet-filter">Diet filter</label>
              <select id="food-diet-filter" value={dietFilter} onChange={(event) => setDietFilter(event.target.value)}>
                <option>Any</option>
                <option>Vegetarian</option>
                <option>Non-vegetarian</option>
              </select>
            </div>
            {!!user?.allergens?.length && (
              <label className="filter-check">
                <input type="checkbox" checked={hideAllergens} onChange={(event) => setHideAllergens(event.target.checked)} />
                Hide foods tagged with your profile allergens ({user.allergens.join(', ')})
              </label>
            )}
          </div>
          <p className="estimate-note">Allergen tags are approximate based on catalog item names, not full recipes or cross-contamination. Check labels and ask about preparation.</p>

          {loading ? (
            <div className="empty-state">Loading food nutrition database...</div>
          ) : (
            <div className="food-list catalog-list">
              {filteredFoods.map((food) => (
                <div className="food-item catalog-item" key={food.name}>
                  <div className="catalog-top">
                    <div>
                      <span className="catalog-category">{food.category}</span>
                      <strong>{food.name}</strong>
                      <span className="food-serving">{food.serving}</span>
                    </div>
                    <button className="secondary-button" onClick={() => addFood(food)}>Add</button>
                  </div>
                  <div className="nutrition-chips">
                    <span>{food.calories} kcal</span>
                    <span>{food.protein}g protein</span>
                    <span>{food.carbs}g carbs</span>
                    <span>{food.fat}g fat</span>
                  </div>
                </div>
              ))}
              {!filteredFoods.length && <div className="empty-state">No foods match this search.</div>}
            </div>
          )}
        </div>

        <div className="summary-card meal-builder">
          <span className="section-eyebrow">BUILD A MEAL</span>
          <h3>Nutrition estimate</h3>
          {mealFoods.length ? (
            <>
              <div className="card-list selected-food-list">
                {mealFoods.map((food, index) => (
                  <div className="stat-row" key={`${food.name}-${index}`}>
                    <span>{food.name} <small className="muted">· {food.serving}</small></span>
                    <button className="remove-food" onClick={() => removeFood(index)} aria-label={`Remove ${food.name}`}>×</button>
                  </div>
                ))}
              </div>
              <div className="nutrition-totals">
                <div><span>Calories</span><strong>{totals.calories.toFixed(0)}<small> kcal</small></strong></div>
                <div><span>Protein</span><strong>{totals.protein.toFixed(1)}<small> g</small></strong></div>
                <div><span>Carbs</span><strong>{totals.carbs.toFixed(1)}<small> g</small></strong></div>
                <div><span>Fat</span><strong>{totals.fat.toFixed(1)}<small> g</small></strong></div>
              </div>
              {user?.targetCalories && user?.targetProtein ? (
                <div className="macro-goal-progress-box">
                  <span className="goal-box-title">🎯 Goal Comparison</span>
                  <div className="goal-progress-text">
                    This meal provides <strong>{Math.round((totals.calories / user.targetCalories) * 100)}%</strong> of your daily calories ({totals.calories.toFixed(0)} / {user.targetCalories} kcal) and <strong>{Math.round((totals.protein / user.targetProtein) * 100)}%</strong> of your daily protein target ({totals.protein.toFixed(0)} / {user.targetProtein}g).
                  </div>
                </div>
              ) : null}
              <button className="primary-button" onClick={saveMeal}>Save meal to history</button>
            </>
          ) : (
            <div className="empty-state">Add one or more foods to see an estimated total.</div>
          )}
          {message && <p className="form-message">{message}</p>}
        </div>
      </div>

      <div className="page-card" style={{ marginTop: '1.25rem' }}>
        <div className="section-title-row">
          <div><span className="section-eyebrow">YOUR RECORDS</span><h3>Meal history</h3></div>
        </div>
        {history.length ? (
          <div className="card-list">
            {history.map((meal) => (
              <div className="progress-item" key={meal.id}>
                <strong>{new Date(meal.createdAt).toLocaleString()}</strong>
                <button className="secondary-button favorite-button" onClick={() => toggleFavorite(meal)} aria-pressed={Boolean(meal.favorite)}>
                  {meal.favorite ? '★ Favorite' : '☆ Add favorite'}
                </button>
                <p className="muted">{meal.foods.map((food) => food.name).join(' · ')}</p>
                <div className="stat-row"><span>Estimated energy</span><strong>{meal.nutrition.calories} kcal</strong></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Meals you save will appear here.</div>
        )}
      </div>
    </div>
  );
}

export default FoodNutritionPage;
