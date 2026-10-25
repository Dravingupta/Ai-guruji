import React, { useState } from 'react';
import { Check, Scale } from 'lucide-react';
import { Button, Choice, Field, Modal } from './ui';
import { dayKey, displayDate } from '../utils/progressData';
export default function WeightCheckIn({ entries, initialDate, saving, error, onSave, onClose }) {
  const [date, setDate] = useState(initialDate || dayKey());
  const existing = entries.find(entry => entry.date === date);
  const [mode, setMode] = useState(existing?.status || 'measured');
  const [weight, setWeight] = useState(existing?.status === 'measured' ? String(existing.weightKg) : '');
  const [note, setNote] = useState(existing?.note || '');
  const [validation, setValidation] = useState('');
  const prior = entries.filter(entry => entry.status === 'measured' && entry.date < date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const changeDate = value => { setDate(value); const entry = entries.find(item => item.date === value); setMode(entry?.status || 'measured'); setWeight(entry?.status === 'measured' ? String(entry.weightKg) : ''); setNote(entry?.note || ''); setValidation(''); };
  return <Modal title="Check in, your way." eyebrow="YOUR WEIGHT JOURNAL" onClose={onClose}>
    <p className="muted modal-description">Daily, weekly, or whenever you’re ready. Sharing a number is always optional.</p>
    <form className="form-stack" onSubmit={async event => { event.preventDefault(); setValidation(''); if (mode === 'measured' && (!weight || Number(weight) < 20 || Number(weight) > 500)) return setValidation('Enter a weight between 20 and 500 kg.'); if (await onSave(date, { status: mode, ...(mode === 'measured' ? { weightKg: Number(weight) } : {}), note })) onClose(); }}>
      <Field label="Check-in date"><input type="date" max={dayKey()} value={date} onChange={event => changeDate(event.target.value)} required disabled={saving} /></Field>
      <div className="checkin-choices"><Choice disabled={saving} selected={mode === 'measured'} onClick={() => setMode('measured')}><Scale size={18} /><strong>I weighed myself</strong><small>Add an actual measurement</small></Choice><Choice disabled={saving || !prior} selected={mode === 'reused'} onClick={() => setMode('reused')}><Check size={18} /><strong>Use my last measurement</strong><small>{prior ? `${prior.weightKg} kg · ${displayDate(prior.date)}` : 'Add a measurement first'}</small></Choice><Choice disabled={saving} selected={mode === 'skipped'} onClick={() => setMode('skipped')}><strong>I don’t want to share today</strong><small>No weight will be recorded for this date</small></Choice></div>
      {mode === 'measured' && <Field label="Weight (kg)"><input autoFocus type="number" min="20" max="500" step="0.1" inputMode="decimal" value={weight} onChange={event => setWeight(event.target.value)} placeholder="e.g. 74.5" required disabled={saving} /></Field>}
      {mode === 'reused' && <p className="checkin-explanation">{prior ? `We’ll keep ${prior.weightKg} kg from ${displayDate(prior.date)} as a reference. This won’t count as a new weigh-in. Saving replaces any check-in already recorded for this date.` : 'No earlier measurement is available. Choose a new measurement or skip sharing.'}</p>}
      <Field label="A note for yourself (optional)"><textarea value={note} onChange={event => setNote(event.target.value)} maxLength={280} rows={2} placeholder="How has your routine felt?" disabled={saving} /></Field>
      {(validation || error) && <p className="error-banner" role="alert">{validation || error}</p>}
      <div className="modal-actions"><Button variant="secondary" type="button" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving || !date || mode === 'reused' && !prior}>{saving ? 'Saving…' : existing ? 'Update check-in' : 'Save check-in'}</Button></div>
    </form>
  </Modal>;
}
