import api from './api';
import { retryStartupRead } from '../utils/backendStartup';

// Diet APIs
export const generateDietPlan = async () => {
    const response = await api.post('/diet/generate');
    return response.data;
};

export const swapMeal = async (currentMeal, plan) => {
    const response = await api.post('/diet/swap-meal', { meal: currentMeal, plan });
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
export const getProfile = async (config = {}) => {
    const response = await api.get('/users/profile', config);
    return response.data;
};

export const saveProfile = async (profileData) => {
    const response = await api.post('/users/profile', profileData);
    return response.data;
};

export const ensureNutritionTargets = async (review = false) => (await api.post('/users/nutrition-targets', { review })).data;

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

// Anonymous readiness check: no token, profile data, or paid model call.
export const warmBackend = options => retryStartupRead(async config => {
    const { data } = await api.get('/health', { ...config, skipAuth: true });
    if (data?.service !== 'ai-guruji-api' || data.status !== 'ready') {
        const error = new Error('Fitness service is still starting');
        error.retryable = true;
        throw error;
    }
    return data;
}, options);
