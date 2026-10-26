import React from 'react';
import { Activity, Calendar, Dumbbell, Flame, Leaf, MapPin, Pencil, ShieldCheck, Target, Utensils } from 'lucide-react';
import { Button, Tag } from './ui';
import { normalizeMealSchedule, targetInputKey } from '../contracts/nutrition.js';

const Detail = ({ label, value }) => <div className="profile-detail"><span>{label}</span><strong>{value || 'Not added'}</strong></div>;

export default function ProfileOverview({ user, stats = {}, weightMeasurement, onEdit, nutrition }) {
  const initials = (user.name || 'You').split(/\s+/).slice(0, 2).map(part => part[0]).join('');
  const joined = user.createdAt && !Number.isNaN(new Date(user.createdAt).getTime()) ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : null;
  const schedule = normalizeMealSchedule(user.mealSchedule);
  const targets = user.nutritionTargets;
  const currentTargets = targets && user.nutritionTargetInputKey === targetInputKey(user);
  return <div className="profile-overview">
    <section className="profile-identity surface">
      <span className="profile-avatar-large">{initials}</span>
      <div className="profile-identity-copy"><p className="eyebrow">YOUR FITNESS IDENTITY</p><h2>{user.name || 'Your profile'}</h2><p>{user.email || 'Your personal fitness space'}</p><div className="profile-identity-tags">{user.region && <span><MapPin size={15} />{user.region}</span>}{joined && <span><Calendar size={15} />Joined {joined}</span>}</div></div>
      <Button variant="secondary" onClick={onEdit}><Pencil size={17} /> Edit profile</Button>
    </section>
    <div className="profile-body-stats">{[['Age', user.age, 'years'], ['Height', user.height, 'cm'], [weightMeasurement ? 'Latest weight' : 'Profile weight', weightMeasurement?.weightKg ?? user.weight, 'kg']].map(([label, value, unit]) => <article className="surface" key={label}><span>{label}</span><strong>{value ?? '—'}<small>{value ? unit : ''}</small></strong></article>)}</div>
    {weightMeasurement && <p className="progress-storage-note">Latest measured weight: {new Date(`${weightMeasurement.date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })}. Your original profile details are kept separately.</p>}
    <div className="profile-panel-grid">
      <section className="surface profile-panel profile-nutrition">
        <div className="profile-panel-title"><Utensils size={21} /><h3>Nutrition, built around you</h3></div>
        <p className="profile-panel-description">{user.macroMode === 'custom' ? 'Your custom daily targets stay in place until you edit them.' : `AI targets are saved and reused. A ${user.nutritionWeightReviewPercent ?? 5}% weight change or a change to your goal or activity can refresh them.`}</p>
        {currentTargets ? <div className="saved-targets">{[['Energy', 'calories', 'kcal'], ['Protein', 'proteinGrams', 'g'], ['Carbs', 'carbsGrams', 'g'], ['Fats', 'fatsGrams', 'g']].map(([label, key, unit]) => <div key={key}><span>{label}</span><strong>{targets[key]}<small>{unit}</small></strong></div>)}</div> : <p className="muted">{nutrition?.loading ? 'Preparing your saved targets…' : 'Targets will be saved when your nutrition setup is ready.'}</p>}
        {user.macroMode !== 'custom' && user.nutritionTargetBasis?.weightKg && <p className="profile-panel-description">Targets based on {user.nutritionTargetBasis.weightKg} kg{user.nutritionTargetsUpdatedAt ? ` · saved ${new Date(user.nutritionTargetsUpdatedAt).toLocaleDateString('en-IN')}` : ''}.</p>}
        <div className="saved-meal-schedule"><h4>{schedule.length} meals in your day</h4><ol>{schedule.map(slot => <li key={slot.id}><span>{slot.label}</span><small>{slot.time || 'Time flexible'}</small></li>)}</ol></div>
        <div className="nutrition-profile-actions"><Button variant="secondary" onClick={onEdit}>Edit targets & schedule</Button>{user.macroMode !== 'custom' && nutrition && <Button variant="ghost" disabled={nutrition.loading} onClick={nutrition.review}>{nutrition.loading ? 'Updating…' : 'Review AI targets'}</Button>}</div>
      </section>
      <section className="surface profile-panel"><div className="profile-panel-title"><Target size={21} /><h3>Your direction</h3></div><div className="profile-goal"><span>Current goal</span><strong>{user.goal || 'Choose your goal'}</strong></div><Detail label="Activity level" value={user.activityLevel} /><Detail label="Training preference" value={user.workoutPreference} /><Detail label="Body type" value={user.bodyType} /></section>
      <section className="surface profile-panel"><div className="profile-panel-title"><Leaf size={21} /><h3>Food & preferences</h3></div><Detail label="Dietary preference" value={user.dietaryPreference} /><Detail label="Food region" value={user.region} /><Detail label="Budget" value={{ low: 'Budget friendly', medium: 'Moderate', flexible: 'Flexible' }[user.budgetLevel] || user.budgetLevel} /><Detail label="Nutrition preferences" value={user.macroMode === 'custom' ? 'Custom macro targets' : 'Saved AI targets'} />{user.macroMode === 'custom' && <div className="profile-macros">{['protein', 'carbs', 'fats'].map(key => <span key={key}><strong>{user.customMacros?.[key] ?? '—'}g</strong>{key}</span>)}</div>}</section>
      <section className="surface profile-panel"><div className="profile-panel-title"><ShieldCheck size={21} /><h3>Allergies & notes</h3></div><p className="profile-panel-description">Preferences saved with your profile.</p><div className="profile-allergies">{user.allergies?.length ? user.allergies.map(allergy => <Tag key={allergy}>{allergy}</Tag>) : <span>No allergies added</span>}</div>{user.allergyNotes && <p className="profile-note">{user.allergyNotes}</p>}{user.notes && <div className="profile-note"><strong>Personal notes</strong><p>{user.notes}</p></div>}<button className="text-link" onClick={onEdit}>Update your preferences <Pencil size={15} /></button></section>
      <section className="surface profile-panel"><div className="profile-panel-title"><Activity size={21} /><h3>Your recent rhythm</h3></div><p className="profile-panel-description">A snapshot from your saved activity on this device.</p><div className="profile-activity-stats"><div><Flame size={19} /><strong>{stats.streak || 0}</strong><span>day streak</span></div><div><Leaf size={19} /><strong>{stats.mealsCount || 0}</strong><span>meals logged · 7 days</span></div><div><Dumbbell size={19} /><strong>{stats.activeMinutes || 0}</strong><span>activity min · 7 days</span></div></div></section>
    </div>
  </div>;
}
