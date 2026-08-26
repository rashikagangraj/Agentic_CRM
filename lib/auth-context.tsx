'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    UserCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { BusinessProfile } from './types';
import { getBusinessProfile } from './firestore';

const LOCAL_USER_KEY = 'agentic_crm_auth_user';

interface AuthContextType {
    user: any | null;
    businessProfile: BusinessProfile | null;
    loading: boolean;
    isDemoMode: boolean;
    login: (email: string, password: string) => Promise<any>;
    signup: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    refreshBusinessProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const isDemoMode = !isFirebaseConfigured;

    useEffect(() => {
        if (isFirebaseConfigured && auth) {
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                setUser(currentUser);

                if (currentUser) {
                    try {
                        const profile = await getBusinessProfile(currentUser.uid);
                        setBusinessProfile(profile);
                    } catch (error) {
                        console.error('Error fetching business profile:', error);
                    }
                } else {
                    setBusinessProfile(null);
                }

                setLoading(false);
            });

            return unsubscribe;
        } else {
            // Local Session / Demo Mode
            try {
                const stored = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_USER_KEY) : null;
                if (stored) {
                    const parsedUser = JSON.parse(stored);
                    setUser(parsedUser);
                    getBusinessProfile(parsedUser.uid || 'demo_user_default').then((profile) => {
                        setBusinessProfile(profile);
                        setLoading(false);
                    });
                } else {
                    // Provide a default active demo session so the user can explore right away
                    const defaultDemoUser = {
                        uid: 'demo_user_default',
                        email: 'demo@agenticcrm.com',
                        displayName: 'Alex Morgan',
                    };
                    setUser(defaultDemoUser);
                    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultDemoUser));
                    getBusinessProfile(defaultDemoUser.uid).then((profile) => {
                        setBusinessProfile(profile);
                        setLoading(false);
                    });
                }
            } catch (err) {
                console.error('Demo auth init error:', err);
                setLoading(false);
            }
        }
    }, []);

    const login = async (email: string, password: string) => {
        if (isFirebaseConfigured && auth) {
            return signInWithEmailAndPassword(auth, email, password);
        }

        // Demo login fallback
        const mockUid = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
        const mockUser = {
            uid: mockUid,
            email,
            displayName: email.split('@')[0],
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
        setUser(mockUser);

        const profile = await getBusinessProfile(mockUid);
        setBusinessProfile(profile);

        return { user: mockUser } as any;
    };

    const signup = async (email: string, password: string) => {
        if (isFirebaseConfigured && auth) {
            return createUserWithEmailAndPassword(auth, email, password);
        }

        // Demo signup fallback
        const mockUid = 'user_' + Date.now();
        const mockUser = {
            uid: mockUid,
            email,
            displayName: email.split('@')[0],
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
        setUser(mockUser);

        return { user: mockUser } as any;
    };

    const logout = async () => {
        if (isFirebaseConfigured && auth) {
            await signOut(auth);
        } else {
            localStorage.removeItem(LOCAL_USER_KEY);
        }
        setUser(null);
        setBusinessProfile(null);
    };

    const refreshBusinessProfile = async () => {
        if (user) {
            const profile = await getBusinessProfile(user.uid);
            setBusinessProfile(profile);
        }
    };

    const value = {
        user,
        businessProfile,
        loading,
        isDemoMode,
        login,
        signup,
        logout,
        refreshBusinessProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

