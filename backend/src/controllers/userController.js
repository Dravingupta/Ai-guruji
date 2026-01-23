import User from '../models/User.js';

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
        const profileData = req.body;
        // Ensure UID matches token
        profileData.uid = req.user.uid;

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

export const deleteProfile = async (req, res) => {
    try {
        await User.findOneAndDelete({ uid: req.user.uid });
        res.json({ message: 'Profile deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
