import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureNutritionTargets } from '../services/backendService';
import { targetInputKey, weightReviewPercent } from '../contracts/nutrition.js';

const defaultApi = { ensure: ensureNutritionTargets };
const pending = new Map();
export default function useNutritionProfile(user, measurement, ready, onUpdate, api = defaultApi) {
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const live = useRef(false);
  const revision = useRef(0);
  const callback = useRef(onUpdate);
  callback.current = onUpdate;
  const inputKey = targetInputKey(user);
  const threshold = weightReviewPercent(user);
  const refresh = useCallback(async (review = false) => {
    const current = ++revision.current;
    setLoading(true); setError('');
    const key = `${user.uid}:${inputKey}:${user.weight}:${threshold}:${measurement?.date}:${measurement?.weightKg}:${review}`;
    if (!pending.has(key)) {
      const operation = Promise.resolve().then(() => api.ensure(review));
      pending.set(key, operation);
      operation.finally(() => { if (pending.get(key) === operation) pending.delete(key); }).catch(() => {});
    }
    try {
      const next = await pending.get(key);
      if (next?.uid !== user.uid) throw new Error('Wrong nutrition profile');
      if (live.current && current === revision.current) { setProfile(next); callback.current?.(next); }
      return next;
    } catch (failure) {
      if (live.current && current === revision.current) setError(failure.response?.data?.error || 'Your nutrition targets couldn’t be updated. Your saved menu is kept.');
      return null;
    } finally { if (live.current && current === revision.current) setLoading(false); }
  }, [user.uid, inputKey, user.weight, threshold, measurement?.date, measurement?.weightKg, api]);
  useEffect(() => { setProfile(user); }, [user]);
  useEffect(() => {
    live.current = true;
    if (ready) void refresh();
    return () => { live.current = false; revision.current++; };
  }, [ready, refresh]);
  return { profile, loading, error, refresh, review: () => refresh(true) };
}
