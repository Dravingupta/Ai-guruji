import React, { useState } from 'react';
import { ArrowRightLeft, Check, ChefHat, Clock, Coffee, Loader2, Moon, Plus, RefreshCw, Sun, Utensils } from 'lucide-react';
import { Button, Field, Modal, Tag } from './ui';
const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Utensils
};
const RecipeModal = ({
  meal,
  onClose
}) => {
  const recipe = meal.recipeDetail || {};
  return <Modal title={meal.name} eyebrow={`${meal.type || 'Meal'} / THE RECIPE`} onClose={onClose} wide>
  <div className="recipe-stats">
    <span><strong>{meal.calories ?? '—'}</strong> kcal</span>
    <span><Clock size={16} /> Prep {recipe.prepTime || '—'}</span>
    <span><ChefHat size={16} /> Cook {recipe.cookTime || '—'}</span>
  </div>
  <div className="recipe-columns">
    <section>
      <p className="eyebrow">WHAT YOU’LL NEED</p>
      <h3>Ingredients</h3>
      <ul className="ingredient-list">{(recipe.ingredients || []).map((item, index) => <li key={index}>
          <span>{item.name}</span>
          <strong>{item.quantity}</strong>
        </li>)}</ul>
    </section>
    <section>
      <p className="eyebrow">MAKE IT HAPPEN</p>
      <h3>The method</h3>
      <ol className="recipe-steps">{(recipe.steps || []).map((item, index) => <li key={index}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{item}</p>
        </li>)}</ol>
    </section>
  </div>
  <div className="macro-strip">{[['Protein', meal.proteinGrams], ['Carbs', meal.carbsGrams], ['Fats', meal.fatsGrams]].map(([label, value]) => <div key={label}>
      <span>{label}</span>
      <strong>
        {value ?? '—'}
        <small> g</small>
      </strong>
    </div>)}</div>
</Modal>;
};
export const AddMealModal = ({
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [type, setType] = useState('snack');
  return <Modal title="A little extra? Log it." eyebrow="YOUR FOOD JOURNAL" onClose={onClose}>
  <p className="muted modal-description">A quick record of what you’ve eaten. An estimate is a useful starting point.</p>
  <form className="form-stack" onSubmit={event => {
      event.preventDefault();
      if (!name.trim() || Number(calories) <= 0) return;
      onSave({
        id: 'manual_' + Math.random().toString(36).slice(2, 11),
        source: 'manual',
        name: name.trim(),
        calories: Math.round(Number(calories)),
        timeOfDay: type
      });
      onClose();
    }}>
    <Field label="What did you have?"><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. A banana and a handful of almonds" required /></Field>
    <div className="form-grid">
      <Field label="Estimated calories (kcal)"><input type="number" min="1" step="1" value={calories} onChange={event => setCalories(event.target.value)} placeholder="200" required /></Field>
      <Field label="Meal"><select value={type} onChange={event => setType(event.target.value)}>{['breakfast', 'lunch', 'dinner', 'snack', 'other'].map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></Field>
    </div>
    <div className="modal-actions">
      <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      <Button type="submit">Add to my day <Plus size={17} /></Button>
    </div>
  </form>
</Modal>;
};
const DietCard = ({
  plan,
  manualMeals = [],
  completedMealIds = [],
  onToggleMeal,
  onAddManualMeal,
  onSwapMeal,
  swappingMealId,
  onRegenerate,
  canRegenerate = false,
  readOnly = false
}) => {
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const order = ['breakfast', 'lunch', 'snack', 'dinner'];
  const slots = order.map(type => ({ type, meal: (plan.meals || []).find(meal => meal.type?.toLowerCase() === type) }));
  const primarySlots = [...slots];
  const primaryIds = new Set(slots.map(({ meal }) => meal?.id).filter(Boolean));
  slots.push(...(plan.meals || []).filter(meal => !primaryIds.has(meal.id)).map(meal => ({ type: meal.type?.toLowerCase() || 'other', meal })));
  const totals = (plan.meals || []).reduce((result, meal) => ({ calories: result.calories + Number(meal.calories || 0), protein: result.protein + Number(meal.proteinGrams || 0), carbs: result.carbs + Number(meal.carbsGrams || 0), fats: result.fats + Number(meal.fatsGrams || 0) }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  const doneCount = primarySlots.filter(({ meal }) => meal && completedMealIds.includes(meal.id)).length;
  const incomplete = primarySlots.some(({ meal }) => !meal);
  return <div className="diet-content">
  <section className="nutrition-summary">
    <div className="nutrition-summary-copy"><p className="eyebrow">YOUR DAILY MENU</p><h2>Fuel for the whole day<span>.</span></h2><p>Four moments to eat well. Recipes and portions, all in one place.</p><div className="nutrition-totals"><div><strong>{totals.calories.toLocaleString()}<small> kcal</small></strong><span>planned energy · estimated</span></div><div className="nutrition-macro-key">{[['Protein', totals.protein, 'protein'], ['Carbs', totals.carbs, 'carbs'], ['Fats', totals.fats, 'fats']].map(([label, value, key]) => <span key={key}><i className={key} /><strong>{Math.round(value)}g</strong>{label}</span>)}</div></div></div>
    <div className="nutrition-summary-art" aria-hidden="true"><img src="/images/food.png" alt="" /><span>FAMILIAR FOOD.<br />FRESH MOMENTUM.</span></div>
  </section>
  <div className="menu-heading"><div><h3>Your meal lineup</h3><span>{doneCount} of 4 meals logged</span></div><div className="menu-progress" aria-label={`${doneCount} of 4 meals logged`}>{primarySlots.map(({ type, meal }) => <span key={type} className={meal && completedMealIds.includes(meal.id) ? 'done' : ''} />)}</div></div>
  {incomplete && <div className="incomplete-plan" role="status"><div><strong>This saved plan is missing a meal.</strong><p>{canRegenerate ? 'Create a full day to fill every slot. Meals you’ve logged will stay in your journal.' : 'Empty slots below show what was missing from this saved day.'}</p></div>{canRegenerate && <Button variant="secondary" onClick={onRegenerate}><RefreshCw size={16} /> Create full day</Button>}</div>}
  <div className="meal-list">{slots.map(({ type, meal }, index) => {
        const Icon = mealIcons[type] || Utensils;
        if (!meal) return <article key={type} className="meal-card meal-missing"><div className="meal-category"><span className={`meal-type-icon type-${type}`}><Icon size={24} /></span><span className="eyebrow">{type}</span><span className="meal-index">0{index + 1}</span></div><h3>No {type} saved</h3><p className="meal-description">This meal wasn’t included in the saved plan.</p><span className="meal-missing-label">Awaiting a complete plan</span></article>;
        const done = completedMealIds.includes(meal.id);
        const swapping = swappingMealId === meal.id;
        const energy = Math.max(1, Number(meal.proteinGrams || 0) * 4 + Number(meal.carbsGrams || 0) * 4 + Number(meal.fatsGrams || 0) * 9);
        return <article key={meal.id} className={`meal-card ${done ? 'is-done' : ''}`}>
      <div className="meal-category"><span className={`meal-type-icon type-${type}`}><Icon size={24} strokeWidth={1.5} /></span><div><span className="eyebrow">{type}</span><small>{['Start with something good', 'Your midday fuel', 'A little afternoon energy', 'Round out your day'][index] || 'More on your menu'}</small></div><span className="meal-index">0{index + 1}</span></div>
      <h3>{meal.name}</h3>
      {meal.shortDescription && <p className="meal-description">{meal.shortDescription}</p>}
      <div className="meal-nutrition"><strong>{meal.calories ?? '—'} <small>kcal</small></strong><span><b>{meal.proteinGrams ?? '—'}g</b> protein</span><span><b>{meal.carbsGrams ?? '—'}g</b> carbs</span><span><b>{meal.fatsGrams ?? '—'}g</b> fats</span></div>
      <div className="macro-energy-bar" aria-hidden="true">{[['protein', meal.proteinGrams, 4], ['carbs', meal.carbsGrams, 4], ['fats', meal.fatsGrams, 9]].map(([key, grams, rate]) => <span key={key} className={key} style={{ width: `${Number(grams || 0) * rate / energy * 100}%` }} />)}</div>
      <div className="meal-actions"><button onClick={() => setSelectedMeal(meal)}><ChefHat size={17} /> Recipe</button><button hidden={readOnly} disabled={done || swapping} onClick={() => onSwapMeal(meal.id)} aria-label={`Swap ${meal.name}`}>{swapping ? <Loader2 size={16} className="spin" /> : <ArrowRightLeft size={16} />}{swapping ? 'Swapping…' : 'Swap'}</button><button disabled={readOnly} className={`meal-log-button ${done ? 'logged' : ''}`} aria-label={`${done ? 'Unmark' : 'Mark'} ${meal.name} as eaten`} aria-pressed={done} onClick={() => onToggleMeal(meal.id, meal.calories)}>{done ? <Check size={16} /> : <Plus size={16} />}{done ? 'Logged' : readOnly ? 'Not logged' : 'Log meal'}</button></div>
    </article>;
      })}</div>
  <div className="journal-section">
    <div className="section-heading">
      <div>
        <p className="eyebrow">THE REST OF YOUR DAY</p>
        <h3>Food journal</h3>
      </div>
      <Button hidden={readOnly} variant="secondary" onClick={() => setShowAdd(true)}><Plus size={15} /> Log food</Button>
    </div>
    {manualMeals.length ? <div className="manual-list">{manualMeals.map(meal => <div className="manual-row" key={meal.id}>
        <span className="journal-icon"><Utensils size={17} /></span>
        <div>
          <strong>{meal.name}</strong>
          <small>{meal.timeOfDay} · {meal.calories} kcal</small>
        </div>
        <button disabled={readOnly} className={`completion-toggle ${completedMealIds.includes(meal.id) ? 'is-checked' : ''}`} aria-label={`Toggle ${meal.name} as eaten`} aria-pressed={completedMealIds.includes(meal.id)} onClick={() => onToggleMeal(meal.id, meal.calories)}>{completedMealIds.includes(meal.id) && <Check size={17} />}</button>
      </div>)}</div> : <p className="journal-empty">{readOnly ? 'No extra food was logged for this day.' : 'A snack, a coffee, something extra. There’s room to record it here.'}</p>}
  </div>
  {plan.tips?.length > 0 && <aside className="coach-note">
    <ChefHat size={21} />
    <div>
      <p className="eyebrow">A NOTE FOR YOUR DAY</p>
      {plan.tips.map((tip, index) => <p key={index}>{tip}</p>)}
    </div>
  </aside>}
  {selectedMeal && <RecipeModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />}
  {showAdd && <AddMealModal onClose={() => setShowAdd(false)} onSave={onAddManualMeal} />}
</div>;
};
export default DietCard;
