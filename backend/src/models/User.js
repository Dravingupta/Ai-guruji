import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    age: Number,
    height: Number,
    weight: Number,
    gender: String,
    dietaryPreference: String,
    region: String,
    goal: String,
    activityLevel: String,
    bodyType: String,
    bodyAnalysis: String,
    budgetLevel: String,
    notes: String,
    allergies: [String],
    allergyNotes: String,
    workoutPreference: String,
    macroMode: { type: String, default: 'auto' },
    customMacros: {
        protein: Number,
        carbs: Number,
        fats: Number
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
