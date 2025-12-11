import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Fallback Data Generators ---
const getFallbackDietPlan = () => ({
    totalCalories: 2100,
    meals: [
        { id: generateId(), name: "Masala Oats", type: "breakfast", calories: 350, proteinGrams: 12, carbsGrams: 55, fatsGrams: 8, shortDescription: "Spiced oatmeal with veg", recipeDetail: { ingredients: [{ name: "Oats", quantity: "50g" }, { name: "Onion", quantity: "1 small" }, { name: "Tomato", quantity: "1 small" }, { name: "Spices", quantity: "to taste" }], steps: ["Sauté veg", "Add oats and water", "Cook till thickened"], prepTime: "5m", cookTime: "10m" } },
        { id: generateId(), name: "Rajma Chawal", type: "lunch", calories: 650, proteinGrams: 25, carbsGrams: 90, fatsGrams: 15, shortDescription: "Kidney beans with rice", recipeDetail: { ingredients: [{ name: "Rajma", quantity: "1 cup" }, { name: "Rice", quantity: "1.5 cups" }, { name: "Spices", quantity: "mix" }, { name: "Onion", quantity: "1" }], steps: ["Cook rajma", "Serve with steamed rice"], prepTime: "10m", cookTime: "30m" } },
        { id: generateId(), name: "Roasted Chana", type: "snack", calories: 150, proteinGrams: 8, carbsGrams: 20, fatsGrams: 4, shortDescription: "Crunchy snack", recipeDetail: { ingredients: [{ name: "Roasted Chana", quantity: "1 handful" }], steps: ["Ready to eat"], prepTime: "0m", cookTime: "0m" } },
        { id: generateId(), name: "Paneer Bhurji & Roti", type: "dinner", calories: 450, proteinGrams: 22, carbsGrams: 40, fatsGrams: 20, shortDescription: "Scrambled cottage cheese", recipeDetail: { ingredients: [{ name: "Paneer", quantity: "100g" }, { name: "Onion", quantity: "1" }, { name: "Tomato", quantity: "1" }, { name: "Spices", quantity: "to taste" }], steps: ["Sauté masala", "Add crumbled paneer"], prepTime: "10m", cookTime: "15m" } }
    ],
    tips: ["Stay hydrated (3-4L water/day).", "Note: This is a fallback plan (AI service busy)."]
});

const getFallbackWorkoutPlan = (startDateStr) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return {
        weekPlan: days.map(d => ({
            dayName: d,
            duration: "45 mins",
            difficulty: "Beginner",
            warmup: ["Jumping Jacks (2 mins)", "Arm Circles (1 min)"],
            exercises: [
                { name: "Pushups", sets: "3", reps: "10-12", description: "Chest and tricep focus", estimatedCalories: 50 },
                { name: "Bodyweight Squats", sets: "3", reps: "15-20", description: "Legs and glutes", estimatedCalories: 70 },
                { name: "Plank Hold", sets: "3", reps: "30-45s", description: "Core stability", estimatedCalories: 30 }
            ],
            cooldown: ["Full Body Stretch (5 mins)"],
            focus: "Full Body Fitness"
        }))
    };
};

const getFallbackMeal = (currentMeal) => ({
    id: generateId(),
    name: `Alternative to ${currentMeal.name}`,
    type: currentMeal.type,
    calories: currentMeal.calories,
    proteinGrams: 20,
    carbsGrams: 30,
    fatsGrams: 10,
    shortDescription: "Balanced alternative meal",
    recipeDetail: { ingredients: [{ name: "Whole grains", quantity: "1 serving" }, { name: "Protein source", quantity: "100g" }, { name: "Vegetables", quantity: "1 cup" }], steps: ["Combine ingredients", "Cook thoroughly"], prepTime: "10m", cookTime: "15m" }
});


const callDeepSeek = async (messages, systemPrompt = '') => {
    // Check for Groq API Key
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key') {
        throw new Error('Groq API Key missing');
    }

    const allMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

    try {
        console.log("Calling Groq API:", {
            url: GROQ_API_URL,
            model: MODEL,
            key: process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0, 10)}...` : 'MISSING'
        });

        const response = await axios.post(
            GROQ_API_URL,
            { model: MODEL, messages: allMessages },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Groq API Error Details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw new Error('AI service temporarily unavailable');
    }
};


const parseJSONResponse = (text) => {
    try {
        // 1. Remove thinking blocks
        let cleanText = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();

        // 2. Try to find markdown JSON block
        const jsonMatch = cleanText.match(/```json\n?([\s\S]*?)\n?```/) || cleanText.match(/```\n?([\s\S]*?)\n?```/);

        if (jsonMatch) return JSON.parse(jsonMatch[1]);

        // 3. Fallback: Find first '{' and last '}'
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
        }

        // 4. Try parsing whole text
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('JSON Parse Error:', error.message);
        console.error('Raw AI Response:', text);
        throw error; // Re-throw to trigger fallback
    }
};

export const generateDietPlan = async (profile) => {
    try {
        let budgetInstruction = profile.budgetLevel === 'low' ? 'Strictly Low Budget (dal, roti, staples)...' : profile.budgetLevel === 'medium' ? 'Medium Budget...' : 'Flexible Budget...';

        const prompt = `
        Create a detailed daily diet plan for an Indian user.
        Context:
        - User: ${profile.name}, Region: ${profile.region}, Goal: ${profile.goal}
        - Budget: ${budgetInstruction}
        - Allergies: ${profile.allergies?.join(', ') || 'None'}
        
        Output JSON format ONLY:
        {
          "totalCalories": number,
          "meals": [{ "name": "...", "type": "breakfast|lunch|dinner|snack", "calories": number, "proteinGrams": number, "carbsGrams": number, "fatsGrams": number, "shortDescription": "...", "recipeDetail": { "ingredients": [{"name": "...", "quantity": "..."}], "steps": ["..."], "prepTime": "...", "cookTime": "..." } }],
          "tips": ["..."]
        }
        `;

        const response = await callDeepSeek([{ role: 'user', content: prompt }], 'You are an expert Indian nutritionist. JSON only.');
        const parsed = parseJSONResponse(response);
        parsed.meals = parsed.meals.map(m => ({ ...m, id: generateId() }));
        return parsed;

    } catch (error) {
        console.error("Diet generation failed, using fallback:", error.message);
        return getFallbackDietPlan();
    }
};

export const swapMeal = async (profile, currentMeal) => {
    try {
        const prompt = `
        Suggest ONE alternative meal swap for: ${currentMeal.name} (${currentMeal.type}, ${currentMeal.calories} kcal).
        User: ${profile.dietaryPreference}, ${profile.region}. Allergies: ${profile.allergies?.join(', ') || 'None'}.
        
        Output JSON format ONLY:
        {
          "name": "...",
          "type": "${currentMeal.type}",
          "calories": number,
          "proteinGrams": number,
          "carbsGrams": number,
          "fatsGrams": number,
          "shortDescription": "...",
          "recipeDetail": {
            "ingredients": [{"name": "...", "quantity": "..."}],
            "steps": ["..."],
            "prepTime": "...",
            "cookTime": "..."
          }
        }
        `;

        const response = await callDeepSeek([{ role: 'user', content: prompt }], 'You are an expert Indian nutritionist. JSON only.');
        const parsed = parseJSONResponse(response);
        parsed.id = generateId();
        return parsed;
    } catch (error) {
        console.error("Meal swap failed, using fallback:", error.message);
        return getFallbackMeal(currentMeal);
    }
};

export const generateWeeklyWorkoutPlan = async (profile, startDateStr) => {
    try {
        const prompt = `
        Create a 7-DAY workout plan starting ${startDateStr}.
        Goal: ${profile.goal}, Location: ${profile.workoutPreference}.
        Output JSON format ONLY:
        { "weekPlan": [{ "dayName": "...", "duration": "...", "difficulty": "...", "warmup": ["..."], "exercises": [{ "name": "...", "sets": "...", "reps": "...", "description": "...", "estimatedCalories": number }], "cooldown": ["..."] }] }
        `;

        const response = await callDeepSeek([{ role: 'user', content: prompt }], 'You are an expert fitness trainer. JSON only.');
        const parsed = parseJSONResponse(response);
        return parsed.weekPlan.map(day => ({
            ...day,
            focus: day.dayName,
            exercises: day.exercises.map(e => ({ ...e, id: generateId() }))
        }));
    } catch (error) {
        console.error("Workout generation failed, using fallback:", error.message);
        const fallback = getFallbackWorkoutPlan(startDateStr);
        return fallback.weekPlan.map(day => ({
            ...day,
            exercises: day.exercises.map(e => ({ ...e, id: generateId() }))
        }));
    }
};

export const chatWithCoach = async (profile, history, message) => {
    try {
        const systemPrompt = `You are an expert Indian Fitness Coach. User: ${profile.name}, Goal: ${profile.goal}, Region: ${profile.region}. Be encouraging but strict.`;

        // 1. Sanitize history
        const cleanHistory = history
            .map(msg => ({
                role: (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user',
                content: (msg.text || msg.content || '').trim()
            }))
            .filter(msg => msg.content.length > 0); // Remove empty messages

        // 2. Sanitize current message
        const userMessageContent = (message || '').trim();
        if (!userMessageContent) throw new Error("Message content cannot be empty");

        const messages = [...cleanHistory, { role: 'user', content: userMessageContent }];

        const responseText = await callDeepSeek(messages, systemPrompt);

        // Clean thinking blocks if present
        return responseText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
    } catch (error) {
        console.error("Chat failed:", error.message);
        return "I'm having trouble connecting right now, but keep pushing! Drink some water and stay consistent.";
    }
};
