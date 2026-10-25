import WeightCheckIn from '../models/WeightCheckIn.js';
import User from '../models/User.js';
import { validateCheckIn, WEIGH_IN_FREQUENCIES } from '../services/progressValidation.js';

export const getProgress = async (req, res) => {
    try {
        const [profile, entries] = await Promise.all([
            User.findOne({ uid: req.user.uid }),
            WeightCheckIn.find({ userId: req.user.uid }).sort({ date: -1 }).lean()
        ]);
        if (!profile) return res.status(404).json({ error: 'User profile not found' });
        res.json({ entries, frequency: profile.weighInFrequency || 'weekly' });
    } catch { res.status(500).json({ error: 'Your progress couldn’t be loaded. Please try again.' }); }
};
export const saveCheckIn = async (req, res) => {
    let entry;
    try { entry = validateCheckIn(req.params.date, req.body); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    try {
        const profile = await User.findOne({ uid: req.user.uid });
        if (!profile) return res.status(404).json({ error: 'User profile not found' });
        if (entry.status === 'reused') {
            const prior = await WeightCheckIn.findOne({ userId: req.user.uid, status: 'measured', date: { $lt: entry.date } }).sort({ date: -1 }).lean();
            if (!prior) return res.status(400).json({ error: 'Add a measurement before reusing one.' });
            entry.weightKg = prior.weightKg;
            entry.sourceDate = prior.date;
        }
        const filter = { userId: req.user.uid, date: entry.date };
        const update = { $set: { ...entry, userId: req.user.uid } };
        let saved;
        try {
            saved = await WeightCheckIn.findOneAndUpdate(filter, update, { new: true, upsert: true, runValidators: true });
        } catch (error) {
            if (error.code !== 11000) throw error;
            saved = await WeightCheckIn.findOneAndUpdate(filter, update, { new: true, runValidators: true });
        }
        res.json(saved);
    } catch { res.status(500).json({ error: 'Your check-in couldn’t be saved. Please try again.' }); }
};
export const saveProgressPreferences = async (req, res) => {
    const frequency = req.body?.frequency;
    if (!WEIGH_IN_FREQUENCIES.includes(frequency)) return res.status(400).json({ error: 'Choose a check-in frequency.' });
    try {
        const profile = await User.findOneAndUpdate({ uid: req.user.uid }, { $set: { weighInFrequency: frequency } }, { new: true, runValidators: true });
        if (!profile) return res.status(404).json({ error: 'User profile not found' });
        res.json({ frequency: profile.weighInFrequency });
    } catch { res.status(500).json({ error: 'Your preference couldn’t be saved. Please try again.' }); }
};
