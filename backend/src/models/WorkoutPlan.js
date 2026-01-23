import mongoose from 'mongoose';

const workoutPlanSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    focus: String,
    dayName: String,
    duration: String,
    difficulty: String,
    warmup: [String],
    exercises: [{
        id: String,
        name: String,
        sets: String,
        reps: String,
        durationMinutes: Number,
        description: String,
        notes: String,
        estimatedCalories: Number,
        source: String
    }],
    cooldown: [String]
}, { timestamps: true });

workoutPlanSchema.index({ userId: 1, date: 1 });
export default mongoose.model('WorkoutPlan', workoutPlanSchema);
