import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function MacroCalculatorPage({ user, setUser }) {
  const [form, setForm] = useState({
    gender: user?.gender || 'male',
    age: user?.age || 21,
    height: user?.height || 172,
    weight: user?.weight || 68,
    activityLevel: user?.activityLevel || 'moderate',
    goalPreset: 'cut-moderate', // cut-aggressive, cut-moderate, maintenance, bulk-lean, bulk-aggressive
    proteinRatio: 2.0, // g per kg
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // Load latest weight from progress if user.weight is not set
  useEffect(() => {
    let active = true;
    const fetchLatestWeight = async () => {
      if (user?.weight) return;
      try {
        const response = await fetch('/api/progress/history', { credentials: 'include' });
        const data = await response.json();
        if (response.ok && data.history?.length > 0 && active) {
          const latest = Number(data.history[0].weight);
          if (latest) {
            setForm((prev) => ({ ...prev, weight: latest }));
          }
        }
      } catch {
        // ignore
      }
    };
    fetchLatestWeight();
    return () => { active = false; };
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    setSaveMessage('');
    setSaveError('');
  };

  // 1. Calculate BMR (Mifflin-St Jeor formula)
  const weight = Number(form.weight) || 68;
  const height = Number(form.height) || 172;
  const age = Number(form.age) || 21;
  const gender = form.gender || 'male';

  const bmr = Math.round(
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161
  );

  // 2. Activity Multipliers
  const activityMultipliers = {
    sedentary: 1.2, // Desk job, little exercise
    light: 1.375, // 1-3 workout days/wk
    moderate: 1.55, // 3-5 workout days/wk
    active: 1.725, // 6-7 workout days/wk
    extreme: 1.9, // Daily intense training or physical labor
  };
  const multiplier = activityMultipliers[form.activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  // 3. Goal Adjustment
  const goalAdjustments = {
    'cut-aggressive': -750,
    'cut-moderate': -500,
    'cut-mild': -250,
    maintenance: 0,
    'bulk-lean': 300,
    'bulk-aggressive': 500,
  };
  const calorieAdjustment = goalAdjustments[form.goalPreset] ?? -500;
  const targetCalories = Math.max(1200, tdee + calorieAdjustment);

  // 4. Macro Splits
  const targetProteinGrams = Math.round(weight * Number(form.proteinRatio));
  const proteinCalories = targetProteinGrams * 4;

  // 25% fat calories (essential for hormone health)
  const fatCalories = Math.round(targetCalories * 0.25);
  const targetFatGrams = Math.round(fatCalories / 9);

  // Remaining calories go to carbs
  const remainingCarbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const targetCarbsGrams = Math.round(remainingCarbCalories / 4);

  // Water requirement (approx 35ml / kg + workout offset)
  const waterLiters = Number(((weight * 0.035) + 0.5).toFixed(1));
  const waterGlasses = Math.round(waterLiters / 0.25);

  // BMI
  const heightInMeters = height / 100;
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  const getBmiCategory = (val) => {
    if (val < 18.5) return { label: 'Underweight', color: 'bmi-yellow' };
    if (val < 25) return { label: 'Normal Weight', color: 'bmi-green' };
    if (val < 30) return { label: 'Overweight', color: 'bmi-orange' };
    return { label: 'Obese', color: 'bmi-red' };
  };
  const bmiInfo = getBmiCategory(bmi);

  const handleSaveGoals = async () => {
    setSaving(true);
    setSaveMessage('');
    setSaveError('');
    try {
      const response = await fetch('/api/auth/macro-targets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height,
          weight,
          gender,
          activityLevel: form.activityLevel,
          targetCalories,
          targetProtein: targetProteinGrams,
          targetCarbs: targetCarbsGrams,
          targetFat: targetFatGrams,
          waterGoal: waterGlasses,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save macro targets.');
      if (setUser) setUser(data.user);
      setSaveMessage('✓ Personalized targets saved! Your dashboard and nutrition planner are now synced.');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="macro-calculator-page">
      <div className="page-header">
        <div>
          <span className="welcome-eyebrow">PRECISION NUTRITION ENGINE</span>
          <h1>BMR, TDEE & Target Macro Calculator</h1>
          <p className="page-lead">
            Calculate your Basal Metabolic Rate, daily maintenance energy, and optimal protein/carb/fat targets backed by the Mifflin-St Jeor equation.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/protein-finder" className="secondary-button">Protein Finder</Link>
          <Link to="/food-nutrition" className="primary-button">Food Nutrition</Link>
        </div>
      </div>

      {saveMessage && (
        <div className="toast-notification success-toast" role="status">
          {saveMessage}
        </div>
      )}
      {saveError && (
        <div className="toast-notification error-toast" role="alert">
          {saveError}
        </div>
      )}

      <div className="calculator-layout-grid">
        {/* Input Parameters Card */}
        <div className="form-card calc-input-card">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">STEP 1</span>
              <h3>Your Physical Profile</h3>
            </div>
            <span className="section-icon">⚙</span>
          </div>

          <div className="calc-form">
            <div className="form-group-split">
              <div className="form-group">
                <label htmlFor="calc-gender">Biological Gender</label>
                <select id="calc-gender" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="calc-age">Age (years)</label>
                <input
                  id="calc-age"
                  name="age"
                  type="number"
                  min="13"
                  max="100"
                  value={form.age}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group-split">
              <div className="form-group">
                <label htmlFor="calc-height">Height (cm)</label>
                <input
                  id="calc-height"
                  name="height"
                  type="number"
                  min="100"
                  max="240"
                  value={form.height}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="calc-weight">Current Weight (kg)</label>
                <input
                  id="calc-weight"
                  name="weight"
                  type="number"
                  step="0.5"
                  min="30"
                  max="250"
                  value={form.weight}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="calc-activity">Daily Activity Level</label>
              <select id="calc-activity" name="activityLevel" value={form.activityLevel} onChange={handleChange}>
                <option value="sedentary">🛋️ Sedentary (Desk job, minimal movement)</option>
                <option value="light">🚶 Lightly Active (1-3 workout days/wk)</option>
                <option value="moderate">🏃 Moderately Active (3-5 workout days/wk)</option>
                <option value="active">🏋️ Very Active (6-7 intense workout days/wk)</option>
                <option value="extreme">⚡ Athlete / High Physical Workload</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="calc-goal">Target Goal & Calorie Strategy</label>
              <select id="calc-goal" name="goalPreset" value={form.goalPreset} onChange={handleChange}>
                <option value="cut-aggressive">🔥 Aggressive Fat Loss (-750 kcal/day)</option>
                <option value="cut-moderate">🎯 Steady Fat Loss (-500 kcal/day - Recommended)</option>
                <option value="cut-mild">🌱 Gentle Recomp (-250 kcal/day)</option>
                <option value="maintenance">⚖️ Maintenance / Performance (+0 kcal/day)</option>
                <option value="bulk-lean">💪 Lean Muscle Bulk (+300 kcal/day)</option>
                <option value="bulk-aggressive">🚀 Maximum Bulk (+500 kcal/day)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="calc-protein">Protein Strategy per kg</label>
              <select id="calc-protein" name="proteinRatio" value={form.proteinRatio} onChange={handleChange}>
                <option value={1.6}>Moderate (1.6g / kg) — General fitness</option>
                <option value={2.0}>High (2.0g / kg) — Muscle hypertrophy (Recommended)</option>
                <option value={2.2}>Athletic (2.2g / kg) — Intense lifting / Deep cut</option>
              </select>
            </div>

            <div className="bmi-strip">
              <span>Body Mass Index (BMI): <strong>{bmi}</strong></span>
              <span className={`bmi-badge ${bmiInfo.color}`}>{bmiInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Results Overview Panel */}
        <div className="calc-results-column">
          <div className="summary-card hero-results-card">
            <div className="section-title-row">
              <div>
                <span className="section-eyebrow">STEP 2</span>
                <h3>Your Personalized Targets</h3>
              </div>
              <span className="badge">Calculated Live</span>
            </div>

            <div className="primary-energy-grid">
              <div className="energy-card">
                <span className="energy-label">Basal Metabolic Rate</span>
                <strong>{bmr}</strong>
                <small>kcal / day at complete rest</small>
              </div>

              <div className="energy-card">
                <span className="energy-label">Maintenance (TDEE)</span>
                <strong>{tdee}</strong>
                <small>kcal / day to stay the same</small>
              </div>

              <div className="energy-card target-energy-card">
                <span className="energy-label">🎯 Target Daily Intake</span>
                <strong className="mint-highlight">{targetCalories}</strong>
                <small>kcal / day for your goal</small>
              </div>
            </div>

            {/* Macro Targets Breakdown */}
            <div className="macro-targets-box">
              <h4>Daily Macronutrient Split</h4>
              <div className="macro-target-cards">
                <div className="macro-chip protein-chip">
                  <div className="chip-head">
                    <span className="macro-indicator protein-dot" />
                    <strong>Protein</strong>
                  </div>
                  <div className="chip-val">
                    <strong>{targetProteinGrams}g</strong>
                    <small>{proteinCalories} kcal ({Math.round(proteinCalories / targetCalories * 100)}%)</small>
                  </div>
                </div>

                <div className="macro-chip carbs-chip">
                  <div className="chip-head">
                    <span className="macro-indicator carbs-dot" />
                    <strong>Carbohydrates</strong>
                  </div>
                  <div className="chip-val">
                    <strong>{targetCarbsGrams}g</strong>
                    <small>{remainingCarbCalories} kcal ({Math.round(remainingCarbCalories / targetCalories * 100)}%)</small>
                  </div>
                </div>

                <div className="macro-chip fat-chip">
                  <div className="chip-head">
                    <span className="macro-indicator fat-dot" />
                    <strong>Healthy Fats</strong>
                  </div>
                  <div className="chip-val">
                    <strong>{targetFatGrams}g</strong>
                    <small>{fatCalories} kcal ({Math.round(fatCalories / targetCalories * 100)}%)</small>
                  </div>
                </div>
              </div>

              {/* Water Requirement */}
              <div className="hydration-target-banner">
                <div className="hydro-icon">💧</div>
                <div className="hydro-info">
                  <strong>Daily Hydration Goal: {waterLiters} Liters</strong>
                  <span>Equivalent to ~{waterGlasses} standard glasses (250ml) throughout the day.</span>
                </div>
              </div>
            </div>

            <div className="save-cta-row">
              <button
                className="primary-button full-width-btn"
                type="button"
                onClick={handleSaveGoals}
                disabled={saving}
              >
                {saving ? 'Saving Targets...' : '💾 Save Targets to My Profile'}
              </button>
              <p className="save-hint">
                Saving will sync these personalized macro goals to your Dashboard, Nutrition page, and Habit tracker.
              </p>
            </div>
          </div>

          {/* Practical Meal Distribution Guide */}
          <div className="summary-card">
            <h4>Sample Daily Meal Distribution</h4>
            <div className="meal-distribution-table">
              <div className="meal-dist-row">
                <strong>Breakfast</strong>
                <span>~{Math.round(targetCalories * 0.25)} kcal</span>
                <span>~{Math.round(targetProteinGrams * 0.25)}g protein</span>
              </div>
              <div className="meal-dist-row">
                <strong>Lunch</strong>
                <span>~{Math.round(targetCalories * 0.35)} kcal</span>
                <span>~{Math.round(targetProteinGrams * 0.35)}g protein</span>
              </div>
              <div className="meal-dist-row">
                <strong>Pre/Post Snack</strong>
                <span>~{Math.round(targetCalories * 0.15)} kcal</span>
                <span>~{Math.round(targetProteinGrams * 0.15)}g protein</span>
              </div>
              <div className="meal-dist-row">
                <strong>Dinner</strong>
                <span>~{Math.round(targetCalories * 0.25)} kcal</span>
                <span>~{Math.round(targetProteinGrams * 0.25)}g protein</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MacroCalculatorPage;
