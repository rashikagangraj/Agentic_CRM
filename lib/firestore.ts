import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { BusinessProfile, BusinessAddress, BestSeller } from './types';

const COLLECTIONS = {
    BUSINESS_PROFILES: 'businessProfiles',
};

const LOCAL_STORAGE_KEY = 'agentic_crm_business_profiles';

const DEFAULT_PROFILE: BusinessProfile = {
    userId: 'demo_user_default',
    ownerName: 'Alex Morgan',
    email: 'alex@agenticcrm.com',
    businessName: 'Apex Agentic Studio',
    address: {
        street: '100 Innovation Way',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA',
    },
    category: 'technology',
    niche: 'AI Automation & CRM Agents',
    bestSellers: [
        { productName: 'Autonomous Sales Agent', description: '24/7 AI Lead Qualifier & Booker', averagePrice: 299 },
        { productName: 'Market Intelligence Suite', description: 'Deep web market analysis', averagePrice: 499 },
    ],
    role: 'business_owner',
    createdAt: new Date(),
    updatedAt: new Date(),
};

function getLocalProfiles(): Record<string, BusinessProfile> {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function saveLocalProfiles(profiles: Record<string, BusinessProfile>) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

/**
 * Create a new business profile in Firestore or localStorage.
 * @param userId - The unique identifier of the user (from Auth).
 * @param data - The business profile data to store.
 * @returns Promise that resolves when the profile is created.
 */
export async function createBusinessProfile(
    userId: string,
    data: {
        ownerName: string;
        email: string;
        businessName: string;
        address: BusinessAddress;
        category: string;
        niche: string;
        bestSellers: BestSeller[];
    }
): Promise<void> {
    const profileData: BusinessProfile = {
        userId,
        ownerName: data.ownerName,
        email: data.email,
        businessName: data.businessName,
        address: data.address,
        category: data.category as any,
        niche: data.niche,
        bestSellers: data.bestSellers,
        role: 'business_owner',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    if (isFirebaseConfigured && db) {
        const businessProfileRef = doc(db, COLLECTIONS.BUSINESS_PROFILES, userId);
        await setDoc(businessProfileRef, {
            ...profileData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return;
    }

    // Local Storage fallback
    const profiles = getLocalProfiles();
    profiles[userId] = profileData;
    saveLocalProfiles(profiles);
}

/**
 * Get a business profile from Firestore or localStorage by user ID.
 * @param userId - The unique identifier of the user.
 * @returns Promise resolving to the BusinessProfile object or null if not found.
 */
export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    if (isFirebaseConfigured && db) {
        try {
            const businessProfileRef = doc(db, COLLECTIONS.BUSINESS_PROFILES, userId);
            const docSnap = await getDoc(businessProfileRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                } as BusinessProfile;
            }
        } catch (error) {
            console.error('Error fetching Firestore profile:', error);
        }
    }

    // Local Storage fallback
    const profiles = getLocalProfiles();
    if (profiles[userId]) {
        return profiles[userId];
    }

    // Default profile for demo session
    return {
        ...DEFAULT_PROFILE,
        userId,
    };
}

/**
 * Update a business profile in Firestore or localStorage.
 * Only updates the fields provided in the data object.
 * @param userId - The unique identifier of the user.
 * @param data - The partial business profile data to update.
 * @returns Promise that resolves when the update is complete.
 */
export async function updateBusinessProfile(
    userId: string,
    data: Partial<Omit<BusinessProfile, 'userId' | 'email' | 'role' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
    if (isFirebaseConfigured && db) {
        const businessProfileRef = doc(db, COLLECTIONS.BUSINESS_PROFILES, userId);
        await updateDoc(businessProfileRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return;
    }

    // Local Storage fallback
    const profiles = getLocalProfiles();
    const existing = profiles[userId] || { ...DEFAULT_PROFILE, userId };
    profiles[userId] = {
        ...existing,
        ...data,
        updatedAt: new Date(),
    };
    saveLocalProfiles(profiles);
}

