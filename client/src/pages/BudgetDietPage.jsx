import { useEffect, useMemo, useState } from 'react';
import { getBudgetPlan } from '../data/foodData';

const DEFAULT_FORM = {
  budget: '150',
  preference: 'vegetarian',
  goal: 'Weight Loss',
  availability: 'hostel',
};

function BudgetDietPage({ user }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFoods = async () => {
      try {
        const response = await fetch('/api/food/list', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load foods for the planner.');
        setFoods(data.foods);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };
    loadFoods();
  }, []);

  const plan = useMemo(
    () => getBudgetPlan({ ...form, foods, allergens: user?.allergens || [] }),
    [form, foods, user?.allergens]
  );
  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Budget Diet Planner</h1>
          <p className="page-intro">Simple Indian meal ideas based on your budget, goal, and available kitchen.</p>
        </div>
        <span className="badge">Estimates in INR</span>
      </div>

      <div className="grid-2">
        <div className="form-card">
          <h3>Your preferences</h3>
          <div className="form-group">
            <label htmlFor="daily-budget">Daily food budget (₹)</label>
            <input id="daily-budget" type="number" min="1" name="budget" value={form.budget} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="diet-preference">Food preference</label>
            <select id="diet-preference" name="preference" value={form.preference} onChange={handleChange}>
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-vegetarian</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="diet-goal">Fitness goal</label>
            <select id="diet-goal" name="goal" value={form.goal} onChange={handleChange}>
              <option>Weight Loss</option>
              <option>Muscle Gain</option>
              <option>General Fitness</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="availability">Food availability</label>
            <select id="availability" name="availability" value={form.availability} onChange={handleChange}>
              <option value="hostel">Hostel / mess</option>
              <option value="home">Home kitchen</option>
            </select>
          </div>
          <p className="estimate-note">Costs are rough per-serving estimates and vary by location and season. This is general guidance, not medical nutrition advice.</p>
        </div>

        <div className="summary-card">
          <span className="section-eyebrow">A PRACTICAL SAMPLE DAY</span>
          <h3>Meal plan</h3>
          {loading ? (
            <div className="empty-state">Loading food database...</div>
          ) : error ? (
            <div className="empty-state">{error}</div>
          ) : (
            <div className="meal-plan-list">
              {plan.meals.map((meal) => (
                <div className="meal-plan-card" key={meal.name}>
                  <div className="meal-plan-heading"><strong>{meal.name}</strong><span>₹{meal.items.reduce((sum, food) => sum + Number(food.cost || 0), 0)}</span></div>
                  {meal.items.map((food) => (
                    <div className="stat-row" key={`${meal.name}-${food.name}`}>
                      <span>{food.name} <small className="muted">· {food.serving}</small></span>
                      <strong>{food.calories} kcal</strong>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && !error && (
        <>
          <div className="budget-total-bar">
            <div><span>Estimated food cost</span><strong>₹{plan.estimatedCost} <small>/ day</small></strong></div>
            <div><span>Your budget</span><strong>₹{plan.budget} <small>/ day</small></strong></div>
            <div className={plan.estimatedCost <= plan.budget ? 'budget-status within' : 'budget-status over'}>
              {plan.estimatedCost <= plan.budget ? 'Within entered budget' : 'Above entered budget'}
            </div>
          </div>
          <p className="muted budget-advice">{plan.budgetTip} {plan.goalTip}</p>
          {!!plan.omittedItems && (
            <p className="estimate-note" role="status">
              {plan.omittedItems} planned food item{plan.omittedItems === 1 ? ' was' : 's were'} omitted because no catalog alternative was tagged as suitable for your profile allergens. Catalog tags are approximate; verify ingredients and cross-contamination.
            </p>
          )}

          <div className="page-card" style={{ marginTop: '1rem' }}>
            <div className="section-title-row">
              <div><span className="section-eyebrow">DAILY ESTIMATE</span><h3>Nutrition overview</h3></div>
            </div>
            <div className="nutrition-totals">
              <div><span>Calories</span><strong>{plan.nutrition.calories.toFixed(0)}<small> kcal</small></strong></div>
              <div><span>Protein</span><strong>{plan.nutrition.protein.toFixed(1)}<small> g</small></strong></div>
              <div><span>Carbohydrates</span><strong>{plan.nutrition.carbs.toFixed(1)}<small> g</small></strong></div>
              <div><span>Fat</span><strong>{plan.nutrition.fat.toFixed(1)}<small> g</small></strong></div>
            </div>
            <h4>Lower-cost alternatives</h4>
            <ul className="suggestion-list">
              {plan.alternatives.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default BudgetDietPage;
