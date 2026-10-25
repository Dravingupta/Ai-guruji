import { useCallback, useEffect, useRef, useState } from 'react';
import { getProgress, saveWeightCheckIn, saveProgressPreferences } from '../services/backendService';
const defaultApi = { load: getProgress, save: saveWeightCheckIn, preferences: saveProgressPreferences };
export default function useProgress(uid, api = defaultApi) {
  const [entries, setEntries] = useState([]);
  const [frequency, setFrequency] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const live = useRef(false);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true); setError('');
    try { const result = await api.load(); if (live.current && current === revision.current) { setEntries([...result.entries].sort((a, b) => b.date.localeCompare(a.date))); setFrequency(result.frequency); } }
    catch { if (live.current && current === revision.current) setError('Your progress couldn’t be loaded. Try again when your connection is back.'); }
    finally { if (live.current && current === revision.current) setLoading(false); }
  }, [uid, api]);
  useEffect(() => { live.current = true; setEntries([]); setFrequency('weekly'); setSaving(false); refresh(); return () => { live.current = false; revision.current++; }; }, [refresh]);
  const save = async (date, input) => {
    const current = revision.current;
    setSaving(true); setError('');
    try {
      const entry = await api.save(date, input);
      if (live.current && current === revision.current) setEntries(previous => [entry, ...previous.filter(item => item.date !== entry.date)].sort((a, b) => b.date.localeCompare(a.date)));
      return live.current && current === revision.current;
    } catch (error) { if (live.current && current === revision.current) setError(error.response?.data?.error || 'Your check-in couldn’t be saved. Please try again.'); return false; }
    finally { if (live.current && current === revision.current) setSaving(false); }
  };
  const setPreference = async next => {
    const current = revision.current;
    setSaving(true); setError('');
    try { const result = await api.preferences(next); if (live.current && current === revision.current) setFrequency(result.frequency); }
    catch { if (live.current && current === revision.current) setError('Your preference couldn’t be saved. Please try again.'); }
    finally { if (live.current && current === revision.current) setSaving(false); }
  };
  return { entries, frequency, loading, saving, error, refresh, save, setPreference };
}
