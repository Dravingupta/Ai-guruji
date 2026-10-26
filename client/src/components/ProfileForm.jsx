import React, { useState } from 'react';
import { defaultMealSchedule, normalizeMealSchedule, MEAL_TYPES } from '../contracts/nutrition.js';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Dumbbell, Home, Loader2, Target, Utensils, User } from 'lucide-react';
import { DietaryPreference, Goal, ActivityLevel, BodyType } from '../constants';
import { Brand, Button, Choice, Field } from './ui';
const steps = [{
  title: 'The basics',
  note: 'A little about you',
  icon: User
}, {
  title: 'Your direction',
  note: 'Goals & movement',
  icon: Target
}, {
  title: 'Your preferences',
  note: 'Food, your way',
  icon: Utensils
}];
const ProfileForm = ({
  uid,
  email,
  displayName,
  mode,
  initialData,
  onSave,
  saving = false,
  saveError = '',
  onCancel
}) => {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({
    uid,
    name: displayName || '',
    email: email || '',
    gender: 'Male',
    goal: Goal.FatLoss,
    activityLevel: ActivityLevel.Sedentary,
    workoutPreference: 'Home',
    dietaryPreference: DietaryPreference.Vegetarian,
    region: 'North India',
    budgetLevel: 'medium',
    bodyType: BodyType.Unsure,
    macroMode: 'auto',
    mealSchedule: defaultMealSchedule(),
    nutritionWeightReviewPercent: 5,
    allergies: [],
    allergyNotes: '',
    notes: '',
    ...initialData
  }));
  const [macros, setMacros] = useState({ protein: '', carbs: '', fats: '', ...initialData?.customMacros });
  const update = (name, value) => {
    setForm(previous => ({
      ...previous,
      [name]: value
    }));
    setError('');
  };
  const input = (name, type = 'text', placeholder = '') => <input name={name} type={type} value={form[name] ?? ''} placeholder={placeholder} onChange={event => update(name, type === 'number' ? event.target.value === '' ? undefined : Number(event.target.value) : event.target.value)} />;
  const choices = (name, values) => <div className="choices">{values.map(value => <Choice key={value} selected={form[name] === value} onClick={() => update(name, value)}>{value}</Choice>)}</div>;
  const next = () => {
    if (step === 0) {
      if (!form.name?.trim()) return setError('Please enter your name.');
      if (!form.age || form.age < 10 || form.age > 100) return setError('Enter an age between 10 and 100.');
      if (!form.height || form.height < 50 || form.height > 300) return setError('Enter a height between 50 and 300 cm.');
      if (!form.weight || form.weight < 20 || form.weight > 300) return setError('Enter a weight between 20 and 300 kg.');
    }
    setError('');
    setStep(value => value + 1);
  };
  const save = () => {
    if (form.macroMode === 'custom' && ['protein', 'carbs', 'fats'].some(key => !Number.isFinite(Number(macros[key])) || Number(macros[key]) <= 0)) return setError('Enter a positive target for protein, carbs, and fats.');
    let mealSchedule;
    try { mealSchedule = normalizeMealSchedule(form.mealSchedule); } catch (failure) { return setError(failure.message); }
    onSave({
      ...form,
      mealSchedule,
      uid,
      email: email || form.email,
      customMacros: form.macroMode === 'custom' ? Object.fromEntries(Object.entries(macros).map(([key, value]) => [key, Number(value)])) : undefined
    });
  };
  return <main className="onboarding">
  <aside className="onboarding-aside">
    <Brand />
    <div className="onboarding-intro">
      <p className="eyebrow">LET’S MAKE IT PERSONAL</p>
      <h1>A PLAN THAT<br />STARTS WITH<br /><span>YOU.</span></h1>
      <p>A few details. A better starting point.<br />You can update these anytime.</p>
    </div>
    <ol className="onboarding-steps">{steps.map((item, index) => <li key={item.title} className={index === step ? 'is-active' : index < step ? 'is-complete' : ''}>
        <span>{index < step ? <Check size={17} /> : String(index + 1).padStart(2, '0')}</span>
        <div>
          <strong>{item.title}</strong>
          <small>{item.note}</small>
        </div>
      </li>)}</ol>
    <div className="onboarding-footer"><CheckCircle2 size={17} /> Made to fit your everyday.</div>
  </aside>
  <section className="onboarding-main">
    <div className="onboarding-top">
      <span>YOUR PROFILE</span>
      <span>STEP {String(step + 1).padStart(2, '0')} OF 03</span>
    </div>
    <div className="step-progress"><span style={{
          width: `${(step + 1) / 3 * 100}%`
        }} /></div>
    <div className="profile-content">
      <p className="eyebrow">{steps[step].note}</p>
      <h2>{['First, the essentials.', 'Find your direction.', 'Food that feels like you.'][step]}</h2>
      <p className="muted">{['Let’s get to know the person behind the plan.', 'Choose what matters to you. We’ll work from there.', 'Your routine should make room for your preferences.'][step]}</p>
      {(error || saveError) && <div className="error-banner" role="alert">{error || saveError}</div>}
      {step === 0 && <div className="form-stack">
        <Field label="What should we call you?">{input('name', 'text', 'Your name')}</Field>
        <div className="form-grid">
          <Field label="Age">{input('age', 'number', 'Years')}</Field>
          <Field label="Gender"><select value={form.gender} onChange={event => update('gender', event.target.value)}>{['Male', 'Female', 'Other'].map(value => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Height (cm)">{input('height', 'number', '175')}</Field>
          <Field label="Profile weight (kg)" hint="Log new measurements in Progress.">{input('weight', 'number', '70')}</Field>
        </div>
        <div className="info-note">
          <User size={18} />
          <p>These details help give your profile context. Your progress is about more than a number.</p>
        </div>
      </div>}
      {step === 1 && <div className="form-stack">
        <div className="field">
          <span className="field-label">What would you like to work toward?</span>
          {choices('goal', Object.values(Goal))}
        </div>
        <div className="field">
          <span className="field-label">How active is your usual day?</span>
          {choices('activityLevel', Object.values(ActivityLevel))}
        </div>
        <div className="field">
          <span className="field-label">Where do you like to train?</span>
          <div className="workout-choices">{[{
                value: 'Home',
                icon: Home,
                title: 'At home',
                text: 'Your space. Your routine.'
              }, {
                value: 'Gym',
                icon: Dumbbell,
                title: 'At the gym',
                text: 'Make the most of your equipment.'
              }].map(({
                value,
                icon: Icon,
                title,
                text
              }) => <Choice key={value} selected={form.workoutPreference === value} onClick={() => update('workoutPreference', value)}>
              <Icon size={25} />
              <strong>{title}</strong>
              <small>{text}</small>
            </Choice>)}</div>
        </div>
      </div>}
      {step === 2 && <div className="form-stack">
        <div className="field">
          <span className="field-label">Dietary preference</span>
          {choices('dietaryPreference', Object.values(DietaryPreference))}
        </div>
        <div className="form-grid">
          <Field label="Your region"><select value={form.region} onChange={event => update('region', event.target.value)}>{['North India', 'South India', 'West India', 'East India'].map(value => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Food budget"><select value={form.budgetLevel} onChange={event => update('budgetLevel', event.target.value)}>
              <option value="low">Budget friendly</option>
              <option value="medium">Moderate</option>
              <option value="flexible">Flexible</option>
            </select></Field>
        </div>
        <div className="field">
          <span className="field-label">Allergies & sensitivities <small>Optional · choose any that apply</small></span>
          <div className="choices">{['Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Gluten', 'Soy', 'Seafood'].map(value => <Choice key={value} selected={form.allergies?.includes(value)} onClick={() => update('allergies', form.allergies?.includes(value) ? form.allergies.filter(item => item !== value) : [...(form.allergies || []), value])}>{value}</Choice>)}</div>
        </div>
        <Field label="Anything else about allergies?"> <textarea value={form.allergyNotes || ''} onChange={event => update('allergyNotes', event.target.value)} placeholder="Other allergies or ingredients to avoid…" rows={2} /></Field>
        <div className="field">
          <span className="field-label">Nutrition preferences</span>
          <div className="choices">
            <Choice selected={form.macroMode === 'auto'} onClick={() => update('macroMode', 'auto')}>Let AI set my targets</Choice>
            <Choice selected={form.macroMode === 'custom'} onClick={() => update('macroMode', 'custom')}>Set my macro targets</Choice>
          </div>
          <span className="field-hint">Daily targets are saved on your profile and reused for your meals.</span>
        </div>
        {form.macroMode === 'custom' && <div className="form-grid three-columns">{['protein', 'carbs', 'fats'].map(key => <Field key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)} (g)`}><input type="number" min="1" value={macros[key]} onChange={event => setMacros(previous => ({
                ...previous,
                [key]: event.target.value
              }))} /></Field>)}</div>}
        {form.macroMode !== 'custom' && <Field label="Re-evaluate targets after a weight change"><select value={form.nutritionWeightReviewPercent ?? 5} onChange={event => update('nutritionWeightReviewPercent', Number(event.target.value))}>{[3, 5, 10].map(value => <option key={value} value={value}>{value}% from the weight used for my targets</option>)}</select><small className="field-hint">Smaller weigh-in changes reuse your targets. Your goal or activity changes can also refresh them.</small></Field>}
        <div className="meal-schedule-editor">
          <div><p className="eyebrow">YOUR EATING ROUTINE</p><h3>A schedule that fits your day</h3><p className="field-hint">Use your preferred routine or a schedule from your dietitian. Daily targets are shared across these meals.</p></div>
          <Field label="Meals per day"><select value={(form.mealSchedule || defaultMealSchedule()).length} onChange={event => {
            const previous = normalizeMealSchedule(form.mealSchedule);
            update('mealSchedule', defaultMealSchedule(Number(event.target.value)).map(slot => previous.find(item => item.id === slot.id) || slot));
          }}>{[2, 3, 4, 5, 6].map(count => <option value={count} key={count}>{count} meals</option>)}</select></Field>
          {(form.mealSchedule || defaultMealSchedule()).map((slot, index) => <div className="meal-schedule-row" key={slot.id}>
            <Field label={`Meal ${index + 1} label`}><input maxLength={50} value={slot.label} onChange={event => update('mealSchedule', (form.mealSchedule || defaultMealSchedule()).map(item => item.id === slot.id ? { ...item, label: event.target.value } : item))} /></Field>
            <Field label={`Meal ${index + 1} type`}><select value={slot.type} onChange={event => update('mealSchedule', (form.mealSchedule || defaultMealSchedule()).map(item => item.id === slot.id ? { ...item, type: event.target.value } : item))}>{MEAL_TYPES.map(type => <option value={type} key={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}</select></Field>
            <Field label={`Meal ${index + 1} time (optional)`}><input type="time" value={slot.time || ''} onInput={event => update('mealSchedule', (form.mealSchedule || defaultMealSchedule()).map(item => item.id === slot.id ? { ...item, time: event.target.value } : item))} /></Field>
          </div>)}
        </div>
        <details className="optional-details">
          <summary>More about you <span>Optional</span></summary>
          <div className="form-stack">
            <Field label="Body type"><select value={form.bodyType} onChange={event => update('bodyType', event.target.value)}>{Object.values(BodyType).map(value => <option key={value}>{value}</option>)}</select></Field>
            <Field label="Notes for your profile"><textarea value={form.notes || ''} onChange={event => update('notes', event.target.value)} placeholder="Anything you’d like to keep in mind…" rows={2} /></Field>
          </div>
        </details>
      </div>}
      <footer className="profile-actions">
        {step > 0 ? <Button variant="ghost" disabled={saving} onClick={() => {
            setStep(value => value - 1);
            setError('');
          }}><ArrowLeft size={17} /> Back</Button> : mode === 'edit' ? <Button variant="ghost" onClick={onCancel}>Cancel</Button> : <span />}
        <Button disabled={saving} onClick={step < 2 ? next : save}>{saving ? <><Loader2 size={17} className="spin" /> Saving…</> : step < 2 ? <>Continue <ArrowRight size={17} /></> : <>
            {mode === 'edit' ? 'Save changes' : 'Let’s get started'}
            <Check size={17} />
          </>}</Button>
      </footer>
    </div>
  </section>
</main>;
};
export default ProfileForm;
