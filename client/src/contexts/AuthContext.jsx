import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getProfile, warmBackend } from '../services/backendService';
import { loadStartupProfile } from '../utils/backendStartup';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pending = useRef(null);
    const revision = useRef(0);

    const loadSession = useCallback(async firebaseUser => {
        pending.current?.abort();
        const controller = new AbortController();
        pending.current = controller;
        const current = ++revision.current;
        setUser(firebaseUser);
        setUserProfile(null);
        setError(null);
        setLoading(Boolean(firebaseUser));
        if (!firebaseUser) {
            // Public pages remain usable; one bounded warm-up stops once ready.
            warmBackend({ signal: controller.signal }).catch(() => {});
            return;
        }
        try {
            const profile = await loadStartupProfile(getProfile, firebaseUser.uid, { signal: controller.signal });
            if (current === revision.current && !controller.signal.aborted) setUserProfile(profile);
        } catch (failure) {
            if (current === revision.current && !controller.signal.aborted) {
                setError('Your fitness service couldn’t connect. Please try again.');
            }
        } finally {
            if (current === revision.current && !controller.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialTimer = setTimeout(() => {
            pending.current?.abort();
            revision.current++;
            setError('Your sign-in session couldn’t be restored. Please try again.');
            setLoading(false);
        }, 20_000);
        const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
            clearTimeout(initialTimer);
            void loadSession(firebaseUser);
        }, () => {
            clearTimeout(initialTimer);
            pending.current?.abort();
            revision.current++;
            setError('Your sign-in session couldn’t be restored. Please try again.');
            setLoading(false);
        });
        return () => { clearTimeout(initialTimer); unsubscribe(); revision.current++; pending.current?.abort(); };
    }, [loadSession]);

    const logout = async () => {
        try { await signOut(auth); }
        catch { setError('We couldn’t sign you out. Please try again.'); }
    };

    const retrySession = () => {
        if (auth.currentUser) return loadSession(auth.currentUser);
        window.location.reload();
    };

    const refreshProfile = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Please sign in again.');
        const current = revision.current;
        const profile = await loadStartupProfile(getProfile, currentUser.uid, { signal: pending.current?.signal });
        if (current !== revision.current || auth.currentUser?.uid !== currentUser.uid) throw new DOMException('Session changed', 'AbortError');
        setUserProfile(profile);
    };

    const acceptProfile = useCallback(profile => {
        if (auth.currentUser?.uid === profile?.uid) setUserProfile(profile);
    }, []);

    return <AuthContext.Provider value={{ user, userProfile, loading, error, logout, refreshProfile, retrySession, acceptProfile }}>
        {children}
    </AuthContext.Provider>;
};
