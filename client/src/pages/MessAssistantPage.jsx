import { useEffect, useMemo, useState } from 'react';
import { buildMealSummary } from '../data/foodData';

function MessAssistantPage() {
  const [foods, setFoods] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState(['White Rice', 'Dal', 'Mixed Vegetable Curry']);
  const [preference, setPreference] = useState('vegetarian');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFoods = async () => {
      try {
        const response = await fetch('/api/food/list', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load the food catalog.');
        setFoods(data.foods);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };
    loadFoods();
  }, []);

  const visibleFoods = foods.filter((food) => (
    (preference === 'non-vegetarian' || food.vegetarian)
    && `${food.name} ${food.category}`.toLowerCase().includes(query.trim().toLowerCase())
  ));
  const selected = foods.filter((food) => selectedFoods.includes(food.name));
  const summary = useMemo(() => buildMealSummary(selected), [selected]);

  const toggleFood = (foodName) => {
    setSelectedFoods((current) => current.includes(foodName)
      ? current.filter((value) => value !== foodName)
      : [...current, foodName]);
  };

  const handlePreferenceChange = (value) => {
    setPreference(value);
    if (value === 'vegetarian') {
      setSelectedFoods((current) => current.filter((name) => foods.find((food) => food.name === name)?.vegetarian));
    }
  };

  const proteinSuggestions = foods.filter((food) => (
    food.category === 'Protein'
    || food.name === 'Dal'
    || food.name === 'Roasted Chana'
  )).filter((food) => (
    !selectedFoods.includes(food.name)
    && (preference === 'non-vegetarian' || food.vegetarian)
  )).slice(0, 3);
  const suggestion = selected.length === 0
    ? 'Select the foods that are available in your meal to get suggestions.'
    : summary.protein < 15
      ? 'This meal may be low in protein. Consider adding one of the available suggestions below.'
      : 'This selection includes a useful protein source. Add vegetables or fruit if available for variety.';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Mess Assistant</h1>
          <p className="page-intro">Select what is actually on your plate for an estimate and practical add-ons.</p>
        </div>
        <span className="badge">Serving-based estimates</span>
      </div>
      <p className="estimate-note">Nutrition is approximate and uses the same food servings as the Food Nutrition page.</p>

      <div className="grid-2">
        <div className="form-card">
          <div className="section-title-row">
            <div><span className="section-eyebrow">YOUR PLATE</span><h3>Foods available today</h3></div>
          </div>
          <div className="form-group">
            <label htmlFor="mess-diet">Diet preference</label>
            <select id="mess-diet" value={preference} onChange={(event) => handlePreferenceChange(event.target.value)}>
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Include non-vegetarian foods</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="mess-search">Find a food</label>
            <input id="mess-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rice, dal, eggs..." />
          </div>
          {loading ? <div className="empty-state">Loading foods...</div> : error ? <div className="empty-state">{error}</div> : (
            <div className="mess-food-list">
              {visibleFoods.map((food) => (
                <label className={selectedFoods.includes(food.name) ? 'mess-food selected' : 'mess-food'} key={food.name}>
                  <input type="checkbox" checked={selectedFoods.includes(food.name)} onChange={() => toggleFood(food.name)} />
                  <span><strong>{food.name}</strong><small>{food.serving} · {food.calories} kcal</small></span>
                </label>
              ))}
              {!visibleFoods.length && <div className="empty-state">No matching foods for this preference.</div>}
            </div>
          )}
        </div>

        <div className="summary-card mess-summary">
          <span className="section-eyebrow">MEAL CHECK</span>
          <h3>Estimated nutrition</h3>
          {selected.length ? (
            <div className="selected-meal-chips">
              {selected.map((food) => <span className="selected-meal-chip" key={food.name}>{food.name}</span>)}
            </div>
          ) : (
            <div className="empty-state">No foods selected yet.</div>
          )}
          <div className="nutrition-totals">
            <div><span>Calories</span><strong>{summary.calories.toFixed(0)}<small> kcal</small></strong></div>
            <div><span>Protein</span><strong>{summary.protein.toFixed(1)}<small> g</small></strong></div>
            <div><span>Carbs</span><strong>{summary.carbs.toFixed(1)}<small> g</small></strong></div>
            <div><span>Fat</span><strong>{summary.fat.toFixed(1)}<small> g</small></strong></div>
          </div>
          <div className="suggestion-box">
            <strong>Suggestion</strong>
            <p className="muted">{suggestion}</p>
            {selected.length > 0 && proteinSuggestions.length > 0 && (
              <div className="suggestion-chips">
                {proteinSuggestions.map((food) => (
                  <button className="suggestion-chip" key={food.name} onClick={() => toggleFood(food.name)}>
                    + {food.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessAssistantPage;
