import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_STAPLES = [
  { id: 'staple-1', name: 'Oats', category: 'Grains & Staples', quantity: 2, unit: '500g pack', estimatedCost: 75, checked: false },
  { id: 'staple-2', name: 'Eggs', category: 'Protein & Dairy', quantity: 2, unit: 'dozen (12 pcs)', estimatedCost: 84, checked: false },
  { id: 'staple-3', name: 'Soya Chunks', category: 'Protein & Dairy', quantity: 2, unit: '200g pack', estimatedCost: 45, checked: false },
  { id: 'staple-4', name: 'Curd / Milk', category: 'Protein & Dairy', quantity: 4, unit: '500ml pouch', estimatedCost: 32, checked: false },
  { id: 'staple-5', name: 'Bananas', category: 'Vegetables & Fruits', quantity: 2, unit: 'dozen (12 pcs)', estimatedCost: 60, checked: false },
  { id: 'staple-6', name: 'Roasted Chana', category: 'Healthy Snacks', quantity: 2, unit: '250g pack', estimatedCost: 50, checked: false },
  { id: 'staple-7', name: 'Dal (Moong / Toor)', category: 'Grains & Staples', quantity: 1, unit: '1 kg pack', estimatedCost: 110, checked: false },
  { id: 'staple-8', name: 'Peanut Butter', category: 'Healthy Snacks', quantity: 1, unit: '350g jar', estimatedCost: 120, checked: false },
  { id: 'staple-9', name: 'Whole Wheat Bread', category: 'Grains & Staples', quantity: 2, unit: 'packet', estimatedCost: 40, checked: false },
];

const PACK_TEMPLATES = {
  muscle: [
    { name: 'Soya Chunks', category: 'Protein & Dairy', quantity: 3, unit: '200g pack', estimatedCost: 45 },
    { name: 'Eggs', category: 'Protein & Dairy', quantity: 3, unit: 'dozen (12 pcs)', estimatedCost: 84 },
    { name: 'Oats', category: 'Grains & Staples', quantity: 2, unit: '500g pack', estimatedCost: 75 },
    { name: 'Peanut Butter', category: 'Healthy Snacks', quantity: 1, unit: '350g jar', estimatedCost: 120 },
    { name: 'Milk / Curd', category: 'Protein & Dairy', quantity: 5, unit: '500ml pack', estimatedCost: 32 },
    { name: 'Bananas', category: 'Vegetables & Fruits', quantity: 2, unit: 'dozen', estimatedCost: 60 },
    { name: 'Dal (Moong/Toor)', category: 'Grains & Staples', quantity: 1, unit: '1 kg', estimatedCost: 110 },
  ],
  hostel: [
    { name: 'Roasted Chana', category: 'Healthy Snacks', quantity: 3, unit: '250g pack', estimatedCost: 50 },
    { name: 'Whole Wheat Bread', category: 'Grains & Staples', quantity: 2, unit: 'packet', estimatedCost: 40 },
    { name: 'Peanut Butter', category: 'Healthy Snacks', quantity: 1, unit: '350g jar', estimatedCost: 120 },
    { name: 'Milk / Buttermilk', category: 'Protein & Dairy', quantity: 6, unit: 'tetra pack / bottle', estimatedCost: 25 },
    { name: 'Bananas', category: 'Vegetables & Fruits', quantity: 2, unit: 'dozen', estimatedCost: 60 },
    { name: 'Apples', category: 'Vegetables & Fruits', quantity: 1, unit: 'kg (4-5 pcs)', estimatedCost: 90 },
    { name: 'Sprouted Moong', category: 'Healthy Snacks', quantity: 2, unit: '250g pack', estimatedCost: 35 },
  ],
  fatloss: [
    { name: 'Eggs / Egg Whites', category: 'Protein & Dairy', quantity: 3, unit: 'dozen', estimatedCost: 84 },
    { name: 'Greek Yogurt / Curd', category: 'Protein & Dairy', quantity: 4, unit: 'pack', estimatedCost: 35 },
    { name: 'Spinach & Salad Greens', category: 'Vegetables & Fruits', quantity: 2, unit: 'bunch', estimatedCost: 25 },
    { name: 'Dal / Rajma', category: 'Grains & Staples', quantity: 2, unit: '500g pack', estimatedCost: 60 },
    { name: 'Apples / Oranges', category: 'Vegetables & Fruits', quantity: 2, unit: 'kg', estimatedCost: 80 },
    { name: 'Tofu / Paneer', category: 'Protein & Dairy', quantity: 2, unit: '200g block', estimatedCost: 70 },
  ],
};

function GroceryPlannerPage() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('fitmentor-grocery-list');
      if (saved) return JSON.parse(saved);
      const customAdded = localStorage.getItem('fitmentor-custom-groceries');
      if (customAdded) {
        const extra = JSON.parse(customAdded);
        return [...DEFAULT_STAPLES, ...extra];
      }
      return DEFAULT_STAPLES;
    } catch {
      return DEFAULT_STAPLES;
    }
  });

  const [days, setDays] = useState(7);
  const [filterCategory, setFilterCategory] = useState('all');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Protein & Dairy');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pack');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copyToast, setCopyToast] = useState('');

  // Persist grocery items
  useEffect(() => {
    try {
      localStorage.setItem('fitmentor-grocery-list', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const toggleItem = (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const updateQuantity = (id, delta) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const applyTemplate = (templateKey) => {
    const templateItems = PACK_TEMPLATES[templateKey];
    if (!templateItems) return;
    const newItems = templateItems.map((item, idx) => ({
      ...item,
      id: `template-${templateKey}-${Date.now()}-${idx}`,
      checked: false,
    }));
    setItems(newItems);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: 1,
      unit: newItemUnit.trim() || 'pack',
      estimatedCost: Number(newItemCost) || 30,
      checked: false,
    };
    setItems((prev) => [newItem, ...prev]);
    setNewItemName('');
    setNewItemCost('');
    setShowAddModal(false);
  };

  const clearCheckedItems = () => {
    setItems((prev) => prev.filter((item) => !item.checked));
  };

  const resetToDefault = () => {
    setItems(DEFAULT_STAPLES);
  };

  // Cost and summary calculations
  const totalEstimatedCost = items.reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0) * (item.quantity || 1),
    0
  );
  const checkedItemsCount = items.filter((item) => item.checked).length;
  const progressPercent = items.length > 0 ? Math.round((checkedItemsCount / items.length) * 100) : 0;
  const costPerDay = Math.round(totalEstimatedCost / days);

  // Group items by category
  const categories = ['Protein & Dairy', 'Grains & Staples', 'Vegetables & Fruits', 'Healthy Snacks', 'Other'];
  const filteredItems = filterCategory === 'all'
    ? items
    : items.filter((item) => item.category === filterCategory);

  // Share / Copy formatted checklist
  const copyChecklist = () => {
    const lines = [
      `🛒 FitMentor Grocery List (${days}-Day Plan — ₹${totalEstimatedCost} est. / ₹${costPerDay} per day)`,
      '------------------------------------------------',
      ...items.map((item) => {
        const box = item.checked ? '[x]' : '[ ]';
        const costStr = item.estimatedCost ? `(~₹${item.estimatedCost * item.quantity})` : '';
        return `${box} ${item.name} (${item.quantity} ${item.unit}) ${costStr}`;
      }),
      '------------------------------------------------',
      'Generated with FitMentor AI',
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => {
        setCopyToast('✓ Copied grocery list to clipboard! Ready to paste into WhatsApp or Notes.');
        setTimeout(() => setCopyToast(''), 3000);
      })
      .catch(() => {
        setCopyToast('Error copying to clipboard.');
      });
  };

  return (
    <div className="grocery-planner-page">
      <div className="page-header">
        <div>
          <span className="welcome-eyebrow">SHOPPING & MEAL PREPARATION</span>
          <h1>Interactive Grocery Checklist</h1>
          <p className="page-lead">
            Plan your supermarket and kirana shopping. Aggregate ingredients, estimate costs in Rupee (₹), and tick off items as you buy them.
          </p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={copyChecklist} type="button">
            📋 Copy for WhatsApp
          </button>
          <button className="primary-button" onClick={() => setShowAddModal(true)} type="button">
            + Add Custom Item
          </button>
        </div>
      </div>

      {copyToast && (
        <div className="toast-notification success-toast" role="status">
          {copyToast}
        </div>
      )}

      {/* Overview Metric Bar */}
      <div className="grocery-summary-grid">
        <div className="metric-card">
          <span className="metric-symbol">💰</span>
          <span className="metric-label">Estimated Budget</span>
          <strong>₹{totalEstimatedCost}</strong>
          <small>~₹{costPerDay} / day ({days} days plan)</small>
        </div>

        <div className="metric-card">
          <span className="metric-symbol">🛒</span>
          <span className="metric-label">Items Completed</span>
          <strong>{checkedItemsCount} / {items.length}</strong>
          <small>{progressPercent}% of grocery run finished</small>
        </div>

        <div className="metric-card">
          <span className="metric-symbol">📅</span>
          <span className="metric-label">Plan Duration</span>
          <div className="days-picker-row">
            {[3, 7, 14].map((d) => (
              <button
                key={d}
                className={`days-pill ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d)}
                type="button"
              >
                {d} Days
              </button>
            ))}
          </div>
          <small>Adjusts daily cost estimation</small>
        </div>
      </div>

      {/* Quick Packs Presets */}
      <div className="templates-strip form-card">
        <span className="template-label">⚡ Starter Packs:</span>
        <button
          className="template-pill"
          onClick={() => applyTemplate('muscle')}
          type="button"
        >
          💪 Student Muscle Pack
        </button>
        <button
          className="template-pill"
          onClick={() => applyTemplate('hostel')}
          type="button"
        >
          🎒 Hostel No-Cook Pack
        </button>
        <button
          className="template-pill"
          onClick={() => applyTemplate('fatloss')}
          type="button"
        >
          🥗 Budget Fat Loss Pack
        </button>
        <button
          className="template-pill reset-pill"
          onClick={resetToDefault}
          type="button"
        >
          ↺ Reset
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="checklist-controls-row">
        <div className="category-filter-pills">
          <button
            className={`filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
            type="button"
          >
            All Items ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            if (count === 0 && filterCategory !== cat) return null;
            return (
              <button
                key={cat}
                className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
                type="button"
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {checkedItemsCount > 0 && (
          <button className="clear-checked-btn" onClick={clearCheckedItems} type="button">
            Clear Checked ({checkedItemsCount})
          </button>
        )}
      </div>

      {/* Interactive Grocery List */}
      <div className="grocery-list-container">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            No items in this category. Click "+ Add Custom Item" or select another pack!
          </div>
        ) : (
          <div className="checklist-grid">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`grocery-item-card ${item.checked ? 'item-checked' : ''}`}
              >
                <label className="item-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span className="custom-checkmark" />
                  <div className="item-name-group">
                    <span className="item-name">{item.name}</span>
                    <span className="item-unit-badge">{item.unit}</span>
                  </div>
                </label>

                <div className="item-card-right">
                  <div className="quantity-stepper">
                    <button
                      className="step-btn"
                      onClick={() => updateQuantity(item.id, -1)}
                      type="button"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="qty-val">{item.quantity}</span>
                    <button
                      className="step-btn"
                      onClick={() => updateQuantity(item.id, 1)}
                      type="button"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="item-cost-display">
                    <strong>₹{(Number(item.estimatedCost) || 0) * (item.quantity || 1)}</strong>
                    <small>₹{item.estimatedCost} / {item.unit.split(' ')[0]}</small>
                  </div>

                  <button
                    className="delete-item-btn"
                    onClick={() => deleteItem(item.id)}
                    type="button"
                    title="Remove item"
                    aria-label={`Remove ${item.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Item Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content form-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Grocery Item</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)} type="button">✕</button>
            </div>

            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label htmlFor="new-item-name">Item Name</label>
                <input
                  id="new-item-name"
                  type="text"
                  placeholder="e.g. Peanut Butter, Brown Bread, Milk"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-item-cat">Category</label>
                <select
                  id="new-item-cat"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                >
                  <option value="Protein & Dairy">Protein & Dairy</option>
                  <option value="Grains & Staples">Grains & Staples</option>
                  <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                  <option value="Healthy Snacks">Healthy Snacks</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group-split">
                <div className="form-group">
                  <label htmlFor="new-item-unit">Unit / Size</label>
                  <input
                    id="new-item-unit"
                    type="text"
                    placeholder="e.g. 500g, dozen, 1 kg"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-item-cost">Estimated Cost (₹)</label>
                  <input
                    id="new-item-cost"
                    type="number"
                    placeholder="e.g. 50"
                    min="1"
                    max="5000"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setShowAddModal(false)} type="button">
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  + Add to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroceryPlannerPage;
