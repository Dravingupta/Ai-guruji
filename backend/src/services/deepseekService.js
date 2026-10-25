import axios from 'axios';
import { normalizeDietPlan, normalizeMeal } from './dietPlanValidation.js';
import { buildCoachPrompt, getGreetingResponse } from './coachPrompt.js';
import { CHAT_SCOPE_PROMPT, OFF_TOPIC_REPLY, PLAN_REQUEST_REPLY, buildScopeMessage, parseChatScope } from './chatScope.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Fallback Data Generators ---
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

const callDeepSeek = async (messages, systemPrompt = '', jsonOutput = false, requestOptions = {}) => {
    // Check for Groq API Key
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key') {
        throw new Error('Groq API Key missing');
    }

    const allMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;
    const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;

    try {
        console.log("Calling Groq API:", {
            url: GROQ_API_URL,
            model
        });

        const response = await axios.post(
            GROQ_API_URL,
            {
                model,
                messages: allMessages,
                ...(jsonOutput ? { response_format: { type: 'json_object' } } : {}),
                ...requestOptions
            },
            {
                timeout: 60000,
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        const choice = response.data.choices[0];
        if (choice.finish_reason === 'length' || !choice.message?.content?.trim()) throw new Error('AI response was incomplete');
        return choice.message.content;
    } catch (error) {
        console.error('Groq API Error Details:', {
            status: error.response?.status,
            code: error.response?.data?.error?.code || error.code,
            model
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
        Create a complete daily diet plan for an Indian user.
        Include exactly FOUR meals, in this order: breakfast, lunch, snack, dinner.
        Give each meal a distinct name, portion quantities, complete recipe, and numeric estimated nutrition.
        The totalCalories must equal the sum of all four meals. Never omit dinner.
        Follow the saved dietary preference and exclude listed allergens, including ingredients in recipes.
        Context:
        - User: ${profile.name}, Region: ${profile.region}, Goal: ${profile.goal}
        - Age: ${profile.age}, Height: ${profile.height} cm, Weight: ${profile.weight} kg
        - Activity: ${profile.activityLevel}, Dietary preference: ${profile.dietaryPreference}
        - Macro mode: ${profile.macroMode}; custom targets: ${JSON.stringify(profile.customMacros || {})}
        - Preferences: ${profile.notes || 'None'}, Allergy notes: ${profile.allergyNotes || 'None'}
        - Budget: ${budgetInstruction}
        - Allergies: ${profile.allergies?.join(', ') || 'None'}
        
        Output JSON format ONLY:
        {
          "totalCalories": number,
          "meals": [{ "name": "...", "type": "breakfast|lunch|dinner|snack", "calories": number, "proteinGrams": number, "carbsGrams": number, "fatsGrams": number, "shortDescription": "...", "recipeDetail": { "ingredients": [{"name": "...", "quantity": "..."}], "steps": ["..."], "prepTime": "...", "cookTime": "..." } }],
          "tips": ["..."]
        }
        `;

        const response = await callDeepSeek([{ role: 'user', content: prompt }], 'You are an expert Indian nutritionist. JSON only.', true);
        const parsed = normalizeDietPlan(parseJSONResponse(response));
        parsed.meals = parsed.meals.map(m => ({ ...m, id: generateId() }));
        return parsed;

    } catch (error) {
        console.error("Diet generation failed:", error.message);
        throw new Error('A complete meal plan could not be created. Please try again.');
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

        const response = await callDeepSeek([{ role: 'user', content: prompt }], 'You are an expert Indian nutritionist. JSON only.', true);
        const parsed = normalizeMeal(parseJSONResponse(response), currentMeal.type);
        parsed.id = generateId();
        return parsed;
    } catch (error) {
        console.error("Meal swap failed:", error.message);
        throw new Error('A meal alternative could not be created. Please try again.');
    }
};

export const generateWeeklyWorkoutPlan = async (profile, startDateStr) => {
    try {
        const prompt = `
        Create a 7-DAY workout plan starting ${startDateStr}.
        Goal: ${profile.goal}, Location: ${profile.workoutPreference}.
        Activity level: ${profile.activityLevel}, Age: ${profile.age}.
        Return exactly 7 entries in chronological order, beginning on ${startDateStr}.
        dayName must match the actual weekday for each date. Include a meaningful focus (e.g. Upper body strength), not the weekday as focus.
        Include appropriate recovery days with an empty exercises array, and clear warmup/cooldown instructions for training days.
        Output JSON format ONLY:
        { "weekPlan": [{ "dayName": "...", "focus": "...", "duration": "...", "difficulty": "...", "warmup": ["..."], "exercises": [{ "name": "...", "sets": "...", "reps": "...", "description": "...", "estimatedCalories": number }], "cooldown": ["..."] }] }
        `;

        const response = await callDeepSeek([{ role: 'user', content: prompt }], 'You are an expert fitness trainer. JSON only.', true);
        const parsed = parseJSONResponse(response);
        return parsed.weekPlan.map(day => ({
            ...day,
            focus: day.focus || day.dayName,
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

export const chatWithCoach = async (profile, history, message, planContext) => {
    const greeting = getGreetingResponse(profile, message);
    if (greeting) return greeting;
    try {
        const systemPrompt = buildCoachPrompt(profile, planContext);

        // 1. Sanitize history
        const cleanHistory = (Array.isArray(history) ? history : [])
            .map(msg => ({
                role: (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user',
                content: (msg.text || msg.content || msg.parts?.map(part => part.text || '').join('') || '').trim()
            }))
            .filter(msg => msg.content.length > 0).slice(-12); // Keep recent conversation context

        // 2. Sanitize current message
        const userMessageContent = (message || '').trim();
        if (!userMessageContent) throw new Error("Message content cannot be empty");

        // Resolve relevance before providing profile data or generating an answer.
        // Unknown/failed decisions fall through to the connection error, never to an unrestricted answer.
        const scopeResponse = await callDeepSeek(
            [{ role: 'user', content: buildScopeMessage(cleanHistory, userMessageContent) }],
            CHAT_SCOPE_PROMPT,
            true,
            { max_completion_tokens: 1024 }
        );
        const scope = parseChatScope(scopeResponse);
        if (scope === 'off_topic') return OFF_TOPIC_REPLY;
        if (scope === 'plan_request') return PLAN_REQUEST_REPLY;

        const messages = [...cleanHistory, { role: 'user', content: userMessageContent }];

        const responseText = await callDeepSeek(messages, systemPrompt, false, { max_completion_tokens: 1536 });

        // Clean thinking blocks if present
        return responseText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
    } catch (error) {
        console.error("Chat failed:", error.message);
        return "I'm having trouble connecting right now. Please try your question again in a moment.";
    }
};
