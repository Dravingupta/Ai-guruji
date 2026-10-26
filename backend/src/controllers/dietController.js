import { withLatestWeight } from '../services/profileContextService.js';
import DietPlan from '../models/DietPlan.js';
import User from '../models/User.js';
import { generateDietPlan, swapMeal } from '../services/deepseekService.js';
import { resolveNutritionProfile, assertNutritionProfileCurrent } from '../services/nutritionProfileService.js';
import { nutritionProfileKey } from '../contracts/nutrition.js';

// Coalesce concurrent requests (including browser StrictMode replays) in this worker.
// Sequential explicit rebuilds still create new snapshots and preserve past records.
const pendingPlans = new Map();
export const createDietPlan = async (req, res) => {
    const uid = req.user.uid;
    const date = new Date().toISOString().split('T')[0];
    let key, operation;
    try {
        const { profile, effective } = await resolveNutritionProfile(uid);
        const profileKey = nutritionProfileKey(profile);
        key = JSON.stringify([uid, date, profileKey, profile.nutritionTargets]);
        operation = pendingPlans.get(key);
        if (!operation) {
            operation = (async () => {
                const plan = await generateDietPlan(effective, profile.nutritionTargets);
                plan.nutritionProfileKey = profileKey;
                const latest = await User.findOne({ uid });
                if (!latest) throw Object.assign(new Error('User profile not found'), { status: 404 });
                assertNutritionProfileCurrent(plan, latest);
                return DietPlan.create({ userId: uid, date, ...plan });
            })();
            pendingPlans.set(key, operation);
        }
        res.json(await operation);
    } catch (error) {
        console.error('Error creating diet plan:', error.message);
        res.status(error.status || 500).json({ error: error.message });
    } finally { if (key && pendingPlans.get(key) === operation) pendingPlans.delete(key); }
};

export const getDietHistory = async (req, res) => {
    try {
        const plans = await DietPlan.find({ userId: req.user.uid }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

export const swapDietMeal = async (req, res) => {
    try {
        const { meal, plan } = req.body;
        const user = await User.findOne({ uid: req.user.uid });
        if (!user) return res.status(404).json({ error: 'User profile not found' });
        if (plan) assertNutritionProfileCurrent(plan, user);
        const newMeal = await swapMeal(await withLatestWeight(user, req.user.uid), meal, plan);
        res.json(newMeal);
    } catch (error) {
        console.error("Error swapping meal:", error); // Debug log
        res.status(error.status || 500).json({ error: error.message });
    }
};
