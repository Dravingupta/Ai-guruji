import React, { useState } from 'react';
import { Activity, Check, ChevronDown, Clock, Dumbbell, Flame, Footprints, Plus, Target } from 'lucide-react';
import { Button, Choice, Field, Modal, Tag } from './ui';
export const AddWorkoutModal = ({
  onClose,
  onSave,
  weight = 70
}) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  return <Modal title="Every move counts." eyebrow="YOUR ACTIVITY JOURNAL" onClose={onClose}>
  <p className="muted modal-description">A walk, a gym session, or a little movement between meetings.</p>
  <form className="form-stack" onSubmit={event => {
      event.preventDefault();
      if (!name.trim() || Number(duration) <= 0) return;
      const minutes = Math.round(Number(duration));
      const rate = {
        light: 3.5,
        moderate: 7,
        intense: 11
      }[intensity];
      onSave({
        id: 'manual_wo_' + Math.random().toString(36).slice(2, 11),
        source: 'manual',
        name: name.trim(),
        durationMinutes: minutes,
        intensity,
        estimatedCaloriesBurned: Math.round(minutes * rate * ((Number(weight) || 70) / 70))
      });
      onClose();
    }}>
    <Field label="What got you moving?"><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Evening walk" required /></Field>
    <Field label="Duration (minutes)"><input type="number" min="1" max="1440" step="1" value={duration} onChange={event => setDuration(event.target.value)} placeholder="30" required /></Field>
    <div className="field">
      <span className="field-label">How did it feel?</span>
      <div className="choices">{['light', 'moderate', 'intense'].map(value => <Choice key={value} selected={intensity === value} onClick={() => setIntensity(value)}>{value.charAt(0).toUpperCase() + value.slice(1)}</Choice>)}</div>
      <small className="field-hint">Calorie burn is an estimate based on duration, intensity, and your weight.</small>
    </div>
    <div className="modal-actions">
      <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
      <Button type="submit">Log activity <Plus size={17} /></Button>
    </div>
  </form>
</Modal>;
};
const WorkoutCard = ({
  plan,
  manualWorkouts = [],
  completedExerciseIds = [],
  onToggleExercise,
  onAddManualWorkout,
  userWeight,
  readOnly = false
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const exercises = plan.exercises || [];
  const done = exercises.filter(exercise => completedExerciseIds.includes(exercise.id)).length;
  const estimatedBurn = exercises.reduce((total, exercise) => total + Number(exercise.estimatedCaloriesBurned || exercise.estimatedCalories || (exercise.durationMinutes || 5) * 6), 0);
  const progress = exercises.length ? done / exercises.length * 100 : 0;
  return <div className="workout-content">
  <section className="training-session-hero">
    <div className="session-copy"><p className="eyebrow">{exercises.length ? 'YOUR SESSION / LET’S GET MOVING' : 'RECOVERY IS PART OF PROGRESS'}</p><h2>{plan.focus || plan.dayName || 'Your workout'}<span>.</span></h2><div className="session-metrics"><span><Clock size={18} /><strong>{plan.duration || 'At your pace'}</strong>duration</span><span><Target size={18} /><strong>{plan.difficulty || 'Your level'}</strong>intensity</span><span><Flame size={18} /><strong>~{estimatedBurn} kcal</strong>estimated burn</span></div></div>
    <div className="session-visual"><img src="/images/athlete.png" alt="" /><div className="session-progress" role="progressbar" aria-label="Session completion" aria-valuemin={0} aria-valuemax={exercises.length || 1} aria-valuenow={done} style={{ '--session-progress': `${progress}%` }}><div><strong>{done}<small>/{exercises.length}</small></strong><span>COMPLETED</span></div></div></div>
  </section>
  <div className="routine-grid">{[['Warm up', plan.warmup], ['Cool down', plan.cooldown]].map(([title, items]) => <details className="routine-detail" key={title}><summary><span><span className="routine-dot" />{title}<small>{(items || []).length} movements</small></span><ChevronDown size={17} /></summary>{items?.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="routine-empty">No movements listed for this session.</p>}</details>)}</div>
  <div className="exercise-heading"><div><p className="eyebrow">ONE MOVEMENT AT A TIME</p><h3>{exercises.length ? 'Your exercise lineup' : 'Take a breather'}</h3></div><span>{done} / {exercises.length} complete</span></div>
  {!exercises.length && <p className="recovery-message">No exercises are scheduled in this saved session. Give yourself room to recover.</p>}
  <div className="exercise-list">{exercises.map((exercise, index) => {
        const complete = completedExerciseIds.includes(exercise.id);
        const movement = /walk|run|jog|cycle|cardio|jump/i.test(exercise.name) ? 'cardio' : /plank|stretch|yoga|crunch|core/i.test(exercise.name) ? 'control' : 'strength';
        const Icon = movement === 'cardio' ? Footprints : movement === 'control' ? Activity : Dumbbell;
        const calories = exercise.estimatedCaloriesBurned || exercise.estimatedCalories;
        return <article className={`exercise-card ${complete ? 'is-done' : ''}`} key={exercise.id}>
      <div className={`movement-visual movement-${movement}`} aria-hidden="true"><Icon size={38} strokeWidth={1.25} /><span>{String(index + 1).padStart(2, '0')}</span></div>
      <div className="exercise-info"><div className="exercise-card-heading"><span className="eyebrow">{movement === 'control' ? 'CORE & CONTROL' : movement.toUpperCase()}</span><button disabled={readOnly} className={`completion-toggle ${complete ? 'is-checked' : ''}`} aria-label={`Mark ${exercise.name} as ${complete ? 'incomplete' : 'complete'}`} aria-pressed={complete} onClick={() => onToggleExercise(exercise.id)}>{complete && <Check size={17} />}</button></div><h3>{exercise.name}</h3><div className="exercise-prescription">{exercise.sets && <span><b>{exercise.sets}</b> sets</span>}{exercise.reps && <span><b>{exercise.reps}</b> reps</span>}{exercise.durationMinutes && <span><b>{exercise.durationMinutes}</b> min</span>}{calories > 0 && <span><Flame size={14} />~{calories} kcal</span>}</div>{(exercise.description || exercise.notes) && <details className="exercise-guidance"><summary>Form & guidance <ChevronDown size={14} /></summary>{exercise.description && <p>{exercise.description}</p>}{exercise.notes && <p className="exercise-note">{exercise.notes}</p>}</details>}</div>
    </article>;
      })}</div>
  <div className="journal-section">
    <div className="section-heading">
      <div>
        <p className="eyebrow">BEYOND THE PLAN</p>
        <h3>Extra movement</h3>
      </div>
      <Button hidden={readOnly} variant="secondary" onClick={() => setShowAdd(true)}><Plus size={15} /> Log activity</Button>
    </div>
    {manualWorkouts.length ? <div className="manual-list">{manualWorkouts.map(workout => <div className="manual-row" key={workout.id}>
        <span className="journal-icon"><Dumbbell size={17} /></span>
        <div>
          <strong>{workout.name}</strong>
          <small>{workout.durationMinutes} min · ~{workout.estimatedCaloriesBurned} kcal</small>
        </div>
        <button disabled={readOnly} className={`completion-toggle ${completedExerciseIds.includes(workout.id) ? 'is-checked' : ''}`} aria-label={`Toggle ${workout.name} completion`} aria-pressed={completedExerciseIds.includes(workout.id)} onClick={() => onToggleExercise(workout.id)}>{completedExerciseIds.includes(workout.id) && <Check size={17} />}</button>
      </div>)}</div> : <p className="journal-empty">{readOnly ? 'No extra movement was logged for this day.' : 'Took the stairs? Went for a walk? The little things belong here too.'}</p>}
  </div>
  {showAdd && <AddWorkoutModal onClose={() => setShowAdd(false)} onSave={onAddManualWorkout} weight={userWeight} />}
</div>;
};
export default WorkoutCard;
