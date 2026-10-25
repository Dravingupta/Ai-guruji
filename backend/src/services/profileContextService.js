import WeightCheckIn from '../models/WeightCheckIn.js';
import { todayKey } from './progressValidation.js';

// New plans use the latest actual measurement. Reused/skipped entries never
// become fresh measurements, and the original profile weight is not overwritten.
export async function withLatestWeight(profile, uid) {
    if (!profile) return profile;
    const data = profile.toObject ? profile.toObject() : { ...profile };
    const measured = await WeightCheckIn.findOne({ userId: uid, status: 'measured', date: { $lte: todayKey() } }).sort({ date: -1 }).lean();
    if (measured) { data.weight = measured.weightKg; data.weightRecordedOn = measured.date; }
    return data;
}
