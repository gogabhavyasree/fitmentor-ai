import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function ProteinFinderPage({ user }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState('all'); // all, veg, vegan, non-veg
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [hostelOnly, setHostelOnly] = useState(false);
  const [sortBy, setSortBy] = useState('value'); // value, protein, cost, density
  const [addedItemName, setAddedItemName] = useState('');

  useEffect(() => {
    let active = true;
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/food/protein-rankings', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Could not load protein rankings.');
        if (active) setFoods(data.foods || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRankings();
    return () => { active = false; };
  }, []);

  const addToGroceryList = (food) => {
    try {
      const saved = localStorage.getItem('fitmentor-custom-groceries');
      const items = saved ? JSON.parse(saved) : [];
      const existing = items.find((item) => item.name.toLowerCase() === food.name.toLowerCase());
      if (existing) {
        existing.quantity += 1;
      } else {
        items.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: food.name,
          category: food.category || 'Protein & Staples',
          quantity: 1,
          unit: food.serving,
          estimatedCost: food.cost || 20,
          checked: false,
        });
      }
      localStorage.setItem('fitmentor-custom-groceries', JSON.stringify(items));
      setAddedItemName(food.name);
      setTimeout(() => setAddedItemName(''), 2500);
    } catch {
      // ignore storage error
    }
  };

  // Filter & sort foods
  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase())
      || food.category.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (dietFilter === 'veg' && !food.vegetarian) return false;
    if (dietFilter === 'non-veg' && food.vegetarian) return false;
    if (dietFilter === 'vegan') {
      const isDairyOrEgg = (food.allergens || []).some((a) => ['dairy', 'egg'].includes(a)) || !food.vegetarian;
      if (isDairyOrEgg) return false;
    }

    if (categoryFilter !== 'all' && food.category !== categoryFilter) return false;
    if (hostelOnly && !food.hostelFriendly) return false;

    return true;
  });

  const sortedFoods = [...filteredFoods].sort((a, b) => {
    if (sortBy === 'value') return b.proteinPer10Rupees - a.proteinPer10Rupees;
    if (sortBy === 'protein') return b.protein - a.protein;
    if (sortBy === 'cost') return a.cost - b.cost;
    if (sortBy === 'density') return b.proteinDensity - a.proteinDensity;
    return 0;
  });

  const categories = ['all', ...new Set(foods.map((f) => f.category))];

  return (
    <div className="protein-finder-page">
      <div className="page-header">
        <div>
          <span className="welcome-eyebrow">STUDENT & BUDGET NUTRITION</span>
          <h1>Affordable Protein & Value Finder</h1>
          <p className="page-lead">
            Discover the highest protein per Rupee (₹) in India. Maximize your muscle building and recovery without burning a hole in your pocket.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/calculator" className="secondary-button">Macro Calculator</Link>
          <Link to="/grocery-planner" className="primary-button">View Grocery List</Link>
        </div>
      </div>

      {addedItemName && (
        <div className="toast-notification" role="status">
          ✓ Added <strong>{addedItemName}</strong> to your Grocery Checklist!
        </div>
      )}

      {/* Hero Value Highlights */}
      <section className="protein-hero-grid">
        <div className="hero-value-card king-card">
          <div className="badge-row">
            <span className="value-badge gold-badge">👑 VALUE KING</span>
            <span className="sub-badge">Vegetarian / Vegan</span>
          </div>
          <h3>Soya Chunks</h3>
          <div className="hero-stat-row">
            <div className="hero-stat">
              <strong>21.7g</strong>
              <span>protein / ₹10</span>
            </div>
            <div className="hero-stat">
              <strong>26g</strong>
              <span>protein per 50g</span>
            </div>
            <div className="hero-stat">
              <strong>₹12</strong>
              <span>per serving</span>
            </div>
          </div>
          <p className="card-hint">The undisputed value champion of Indian bodybuilding. Soak, squeeze, and sauté.</p>
        </div>

        <div className="hero-value-card">
          <div className="badge-row">
            <span className="value-badge">🥚 BEST NON-VEG</span>
            <span className="sub-badge">Complete Amino Acid Profile</span>
          </div>
          <h3>Whole Eggs (2 pcs)</h3>
          <div className="hero-stat-row">
            <div className="hero-stat">
              <strong>9.0g</strong>
              <span>protein / ₹10</span>
            </div>
            <div className="hero-stat">
              <strong>12.6g</strong>
              <span>protein per pair</span>
            </div>
            <div className="hero-stat">
              <strong>₹14</strong>
              <span>per serving</span>
            </div>
          </div>
          <p className="card-hint">Perfect bioavailability. Inexpensive, readily available at street corners and hostels.</p>
        </div>

        <div className="hero-value-card">
          <div className="badge-row">
            <span className="value-badge teal-badge">🎒 BEST NO-COOK SNACK</span>
            <span className="sub-badge">Hostel Friendly</span>
          </div>
          <h3>Roasted Chana</h3>
          <div className="hero-stat-row">
            <div className="hero-stat">
              <strong>7.5g</strong>
              <span>protein / ₹10</span>
            </div>
            <div className="hero-stat">
              <strong>6g</strong>
              <span>protein per handful</span>
            </div>
            <div className="hero-stat">
              <strong>₹8</strong>
              <span>per serving</span>
            </div>
          </div>
          <p className="card-hint">Zero cooking, high fiber, crunchy portable snack to keep in your college bag.</p>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="search-filter-section form-card">
        <div className="search-row">
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder="Search foods (e.g., paneer, dal, oats, eggs)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search foods"
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')} aria-label="Clear search">×</button>
            )}
          </div>

          <div className="sort-wrap">
            <label htmlFor="sort-select">Sort by:</label>
            <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="value">⚡ Best Value (Protein per ₹)</option>
              <option value="protein">💪 Total Protein (High to Low)</option>
              <option value="density">🔥 Protein Density (% of kcal)</option>
              <option value="cost">💰 Lowest Cost (₹)</option>
            </select>
          </div>
        </div>

        <div className="filter-pills-row">
          <div className="pill-group">
            <span className="pill-label">Diet:</span>
            <button
              className={`filter-pill ${dietFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDietFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-pill ${dietFilter === 'veg' ? 'active' : ''}`}
              onClick={() => setDietFilter('veg')}
            >
              🌱 Vegetarian
            </button>
            <button
              className={`filter-pill ${dietFilter === 'vegan' ? 'active' : ''}`}
              onClick={() => setDietFilter('vegan')}
            >
              🌿 Vegan
            </button>
            <button
              className={`filter-pill ${dietFilter === 'non-veg' ? 'active' : ''}`}
              onClick={() => setDietFilter('non-veg')}
            >
              🍗 Non-Veg
            </button>
          </div>

          <div className="pill-group">
            <span className="pill-label">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="category-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="pill-group">
            <label className="checkbox-toggle">
              <input
                type="checkbox"
                checked={hostelOnly}
                onChange={(e) => setHostelOnly(e.target.checked)}
              />
              <span>🎒 Hostel / No-Cook Only</span>
            </label>
          </div>
        </div>
      </section>

      {/* Results Header */}
      <div className="results-status-bar">
        <span>Showing <strong>{sortedFoods.length}</strong> protein options</span>
        <span className="cost-footnote">Values calculated based on standard serving sizes & Indian grocery estimates.</span>
      </div>

      {loading ? (
        <div className="loading-state">Analyzing protein rankings...</div>
      ) : error ? (
        <div className="empty-state" role="alert">{error}</div>
      ) : sortedFoods.length === 0 ? (
        <div className="empty-state">
          No foods match your selected filters. Try clearing some filters.
        </div>
      ) : (
        <div className="food-rankings-grid">
          {sortedFoods.map((food, index) => {
            const isTopRanked = sortBy === 'value' && index < 3;
            return (
              <div
                key={food.name}
                className={`food-ranking-card ${isTopRanked ? 'top-card' : ''}`}
              >
                <div className="card-top">
                  <div className="card-title-group">
                    <h4>{food.name}</h4>
                    <span className="food-category-badge">{food.category}</span>
                  </div>
                  <div className="value-metric-pill">
                    <strong>{food.proteinPer10Rupees}g</strong>
                    <small>per ₹10</small>
                  </div>
                </div>

                <div className="badges-list">
                  {(food.badges || []).map((badge) => (
                    <span key={badge} className="tag-badge">{badge}</span>
                  ))}
                  {food.vegetarian ? (
                    <span className="veg-indicator" title="Vegetarian">🟢 Veg</span>
                  ) : (
                    <span className="non-veg-indicator" title="Non-vegetarian">🔴 Non-Veg</span>
                  )}
                </div>

                <div className="nutrition-stats-row">
                  <div className="nut-stat">
                    <strong>{food.protein}g</strong>
                    <span>Protein</span>
                  </div>
                  <div className="nut-stat">
                    <strong>{food.calories}</strong>
                    <span>Calories</span>
                  </div>
                  <div className="nut-stat">
                    <strong>{food.carbs}g</strong>
                    <span>Carbs</span>
                  </div>
                  <div className="nut-stat">
                    <strong>{food.fat}g</strong>
                    <span>Fat</span>
                  </div>
                </div>

                {/* Macro split bar */}
                <div className="macro-bar" title={`Protein: ${food.protein * 4}kcal, Carbs: ${food.carbs * 4}kcal, Fat: ${food.fat * 9}kcal`}>
                  <div
                    className="macro-bar-fill protein-fill"
                    style={{ width: `${Math.min(100, (food.protein * 4 / Math.max(food.calories, 1)) * 100)}%` }}
                  />
                  <div
                    className="macro-bar-fill carbs-fill"
                    style={{ width: `${Math.min(100, (food.carbs * 4 / Math.max(food.calories, 1)) * 100)}%` }}
                  />
                  <div
                    className="macro-bar-fill fat-fill"
                    style={{ width: `${Math.min(100, (food.fat * 9 / Math.max(food.calories, 1)) * 100)}%` }}
                  />
                </div>

                <div className="serving-cost-row">
                  <span className="serving-text">📦 {food.serving}</span>
                  <div className="cost-tag">
                    <strong>₹{food.cost}</strong>
                    <small>(₹{food.costPerGramProtein}/g protein)</small>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="quick-add-btn"
                    onClick={() => addToGroceryList(food)}
                    type="button"
                  >
                    + Add to Grocery List
                  </button>
                  <Link
                    to="/food-nutrition"
                    className="details-link"
                    title="View in food nutrition planner"
                  >
                    Nutrition →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProteinFinderPage;
