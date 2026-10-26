import { nutritionProfileKey, targetInputKey } from '../contracts/nutrition.js';

export function nutritionPlanStatus(plan, profile) {
  const fields = ['calories', 'proteinGrams', 'carbsGrams', 'fatsGrams'];
  const totals = Object.fromEntries(fields.map(field => [field, (plan.meals || []).reduce((sum, meal) => sum + Number(meal[field] || 0), 0)]));
  const targets = fields.every(field => Number.isFinite(plan.nutritionTargets?.[field]) && plan.nutritionTargets[field] > 0) ? plan.nutritionTargets : null;
  const proteinShortfall = targets ? Math.max(0, targets.proteinGrams - totals.proteinGrams) : 0;
  const staleProfile = Boolean(profile && (plan.nutritionProfileKey !== nutritionProfileKey(profile) || (profile.nutritionTargets && profile.nutritionTargetInputKey !== targetInputKey(profile)) || (profile.nutritionTargets && fields.some(field => profile.nutritionTargets[field] !== targets?.[field]))));
  const needsUpdate = staleProfile || !targets || fields.some(field => {
    const low = field === 'proteinGrams' ? targets[field] : targets[field] * (field === 'calories' ? 0.9 : 0.85);
    const high = targets[field] * (field === 'calories' ? 1.1 : 1.15);
    return !Number.isFinite(totals[field]) || totals[field] < low || totals[field] > high;
  });
  return { totals, targets, proteinShortfall, needsUpdate, staleProfile };
}
