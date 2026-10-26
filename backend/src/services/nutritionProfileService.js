import User from '../models/User.js';
import { withLatestWeight } from './profileContextService.js';
import { estimateNutritionTargets } from './deepseekService.js';
import { normalizeNutritionTargets, customNutritionTargets } from './nutritionTargets.js';
import { targetInputKey, nutritionProfileKey, weightNeedsTargetReview } from '../contracts/nutrition.js';

const pending = new Map();
const plain = value => value.toObject ? value.toObject() : { ...value };
const conflict = () => Object.assign(new Error('Your nutrition preferences changed. Please try again.'), { status: 409 });

export async function resolveNutritionProfile(uid, { review = false } = {}) {
    const document = await User.findOne({ uid });
    if (!document) throw Object.assign(new Error('User profile not found'), { status: 404 });
    let profile = plain(document);
    const inputKey = targetInputKey(profile);
    const effective = await withLatestWeight(profile, uid);
    const fresh = await User.findOne({ uid });
    if (!fresh) throw Object.assign(new Error('User profile not found'), { status: 404 });
    if (nutritionProfileKey(fresh) !== nutritionProfileKey(profile) || fresh.weight !== profile.weight) throw conflict();
    profile = plain(fresh);
    let reusable = false;
    try {
        normalizeNutritionTargets(profile.nutritionTargets, profile.macroMode === 'custom' ? 'custom' : 'auto');
        reusable = profile.nutritionTargetInputKey === inputKey && !weightNeedsTargetReview(profile, effective.weight);
    } catch { /* Old profiles resolve targets once, on their next nutrition request. */ }
    if (reusable && !review) return { profile, effective };
    const key = `${uid}:${inputKey}:${effective.weight}:${review}`;
    if (pending.has(key)) return pending.get(key);
    const operation = (async () => {
        const targets = profile.macroMode === 'custom' ? customNutritionTargets(profile) : await estimateNutritionTargets(effective);
        const update = {
            nutritionTargets: targets, nutritionTargetInputKey: inputKey,
            nutritionTargetsUpdatedAt: new Date(),
            nutritionTargetBasis: { weightKg: effective.weight, measuredOn: effective.weightRecordedOn || null },
            nutritionProfileKey: nutritionProfileKey(profile)
        };
        const saved = await User.findOneAndUpdate({ uid, weight: profile.weight, nutritionProfileKey: profile.nutritionProfileKey ?? { $exists: false } }, { $set: update }, { new: true, runValidators: true });
        if (!saved) throw conflict();
        return { profile: plain(saved), effective: { ...effective, ...update } };
    })();
    pending.set(key, operation);
    try { return await operation; }
    finally { if (pending.get(key) === operation) pending.delete(key); }
}

export function assertNutritionProfileCurrent(plan, profile) {
    if (!plan.nutritionProfileKey) return; // Legacy snapshots stay readable/rebuildable.
    if (plan.nutritionProfileKey !== nutritionProfileKey(profile)) throw conflict();
    for (const key of ['calories', 'proteinGrams', 'carbsGrams', 'fatsGrams']) {
        if (plan.nutritionTargets?.[key] !== profile.nutritionTargets?.[key]) throw conflict();
    }
}
