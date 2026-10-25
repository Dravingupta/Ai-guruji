import api from './api';

// Diet APIs
export const generateDietPlan = async (profile) => {
    const response = await api.post('/diet/generate', profile); // Profile is part of user in DB, but we might verify it. 
    // Actually, we should trigger generation with stored profile or explicit. 
    // Based on current flow, frontend passes profile to AI. 
    // We'll keep sending profile or let backend fetch it.
    // Backend diet controller expects user to be in DB. 
    // Let's assume we trigger generation.
    return response.data;
};

export const swapMeal = async (currentMeal) => {
    const response = await api.post('/diet/swap-meal', { meal: currentMeal });
    return response.data;
};

export const getDietHistory = async () => {
    const response = await api.get('/diet/history');
    return response.data;
};

// Workout APIs
export const generateWeeklyWorkoutPlan = async (startDate) => {
    const response = await api.post('/workout/generate', { startDate });
    return response.data;
};

export const getWorkoutHistory = async () => {
    const response = await api.get('/workout/history');
    return response.data;
};

// Chat APIs
export const chatWithCoach = async (message, history, planContext) => {
    const response = await api.post('/chat/message', { message, history, planContext });
    return response.data.text;
};

export const getChatHistory = async () => {
    const response = await api.get('/chat/history');
    return response.data;
};

// Profile APIs
export const getProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
};

export const saveProfile = async (profileData) => {
    const response = await api.post('/users/profile', profileData);
    return response.data;
};

export const analyzeBodyImage = async (base64Image) => {
    // Mock or implemented backend endpoint
    // Currently backend returns simple fallback
    return {
        bodyType: 'Not Sure',
        analysis: 'Image analysis currently unavailable'
    };
};


// Optional weight check-ins are account-owned server records.
export const getProgress = async () => (await api.get('/progress')).data;
export const saveWeightCheckIn = async (date, entry) => (await api.put(`/progress/check-ins/${date}`, entry)).data;
export const saveProgressPreferences = async frequency => (await api.put('/progress/preferences', { frequency })).data;
