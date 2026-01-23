import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
    id: String,
    name: String,
    type: { type: String },
    calories: Number,
    proteinGrams: Number,
    carbsGrams: Number,
    fatsGrams: Number,
    shortDescription: String,
    recipeDetail: {
        ingredients: [{
            name: String,
            quantity: String
        }],
        steps: [String],
        prepTime: String,
        cookTime: String
    },
    source: String
});

const dietPlanSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    totalCalories: Number,
    meals: [mealSchema],
    tips: [String]
}, { timestamps: true });

dietPlanSchema.index({ userId: 1, date: 1 });
export default mongoose.model('DietPlan', dietPlanSchema);
