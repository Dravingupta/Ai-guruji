import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getProfile } from '../services/backendService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('🔐 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');

            if (firebaseUser) {
                try {
                    console.log('📡 Fetching profile for UID:', firebaseUser.uid);
                    const profile = await getProfile();
                    console.log('✅ Profile fetched successfully:', profile);
                    // Set both user and profile together to avoid race condition
                    setUserProfile(profile);
                    setUser(firebaseUser);
                } catch (err) {
                    // If profile doesn't exist (404), that's expected for new users
                    // Set userProfile to null so they can create one
                    console.error("❌ Error fetching profile:", err);
                    console.log('Response status:', err.response?.status);
                    console.log('Response data:', err.response?.data);
                    setUserProfile(null);
                    setUser(firebaseUser);
                    setError(err.message);
                } finally {
                    // Only set loading to false after profile fetch completes
                    console.log('🏁 Setting loading to false');
                    setLoading(false);
                }
            } else {
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            try {
                const profile = await getProfile();
                setUserProfile(profile);
            } catch (err) {
                console.error("Error refreshing profile:", err);
            }
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        error,
        logout,
        refreshProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
