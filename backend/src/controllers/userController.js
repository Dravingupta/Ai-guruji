import User from '../models/User.js';
import { normalizeMealSchedule, targetInputKey, nutritionProfileKey, weightReviewPercent } from '../contracts/nutrition.js';
import { customNutritionTargets } from '../services/nutritionTargets.js';
import { resolveNutritionProfile } from '../services/nutritionProfileService.js';

export const getProfile = async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.user.uid });
        if (!user) return res.status(404).json({ error: 'Profile not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createOrUpdateProfile = async (req, res) => {
    try {
        const editable = ['name', 'email', 'age', 'height', 'weight', 'gender', 'dietaryPreference', 'region', 'goal', 'activityLevel', 'bodyType', 'bodyAnalysis', 'budgetLevel', 'notes', 'allergies', 'allergyNotes', 'workoutPreference', 'macroMode', 'customMacros', 'mealSchedule', 'nutritionWeightReviewPercent'];
        const profileData = Object.fromEntries(editable.filter(key => Object.hasOwn(req.body, key)).map(key => [key, req.body[key]]));
        // Progress preferences have their own endpoint; stale profile edits must not reset them.
        delete profileData.weighInFrequency;
        // Ensure UID matches token
        profileData.uid = req.user.uid;

        const existing = await User.findOne({ uid: req.user.uid });
        const previous = existing?.toObject ? existing.toObject() : existing || {};
        const merged = { ...previous, ...profileData };
        try {
            profileData.mealSchedule = normalizeMealSchedule(merged.mealSchedule);
            profileData.nutritionWeightReviewPercent = weightReviewPercent(merged);
            if (merged.macroMode && !['auto', 'custom'].includes(merged.macroMode)) throw new Error('Choose automatic or custom targets');
            profileData.nutritionProfileKey = nutritionProfileKey({ ...merged, ...profileData });
            if (merged.macroMode === 'custom') {
                profileData.nutritionTargets = customNutritionTargets(merged);
                profileData.nutritionTargetInputKey = targetInputKey(merged);
                profileData.nutritionTargetsUpdatedAt = previous.nutritionTargetInputKey === profileData.nutritionTargetInputKey ? previous.nutritionTargetsUpdatedAt || new Date() : new Date();
            }
        } catch (error) { return res.status(400).json({ error: error.message }); }

        const user = await User.findOneAndUpdate(
            { uid: req.user.uid },
            profileData,
            { new: true, upsert: true } 
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const ensureNutritionTargets = async (req, res) => {
    try {
        const { profile } = await resolveNutritionProfile(req.user.uid, { review: req.body?.review === true });
        res.json(profile);
    } catch (error) { res.status(error.status || 500).json({ error: error.message || 'Your nutrition targets could not be updated.' }); }
};

export const deleteProfile = async (req, res) => {
    try {
        await User.findOneAndDelete({ uid: req.user.uid });
        res.json({ message: 'Profile deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
