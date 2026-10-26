import mongoose from 'mongoose';

const mealSlotSchema = new mongoose.Schema({ id: String, type: { type: String }, label: String, time: String }, { _id: false });

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    age: Number,
    height: Number,
    weight: Number,
    weighInFrequency: { type: String, enum: ['daily', 'weekly', 'when_ready', 'off'], default: 'weekly' },
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
    },
    mealSchedule: { type: [mealSlotSchema], default: undefined },
    nutritionWeightReviewPercent: { type: Number, default: 5 },
    nutritionProfileKey: String,
    nutritionTargets: { source: String, calories: Number, proteinGrams: Number, carbsGrams: Number, fatsGrams: Number },
    nutritionTargetInputKey: String,
    nutritionTargetsUpdatedAt: Date,
    nutritionTargetBasis: { weightKg: Number, measuredOn: String }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
