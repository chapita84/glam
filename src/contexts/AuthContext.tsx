
'use client'

import type { PropsWithChildren } from 'react';
import React, { useEffect, useState, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { CurrentUser } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    currentUser: CurrentUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: PropsWithChildren) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const tokenResult = await user.getIdTokenResult();
                const claims = tokenResult.claims;
                
                const finalCurrentUser: CurrentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    globalRole: claims.globalRole as any,
                };
                setCurrentUser(finalCurrentUser);
            } else {
                setCurrentUser(null);
            }
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!loading) {
            if (user) {
                if (pathname === '/login' || pathname === '/register') {
                    if (currentUser?.globalRole === 'superAdmin' || currentUser?.globalRole === 'client') {
                        router.push('/select-studio');
                    } else {
                        router.push('/dashboard');
                    }
                }
            } else {
                // If not logged in, redirect to login page, but exclude auth pages
                if (pathname !== '/login' && pathname !== '/register' && pathname !== '/forgot-password') {
                    router.push('/login');
                }
            }
        }
    }, [user, loading, router, pathname, currentUser]);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Verificando autenticación...</p></div>;
    }
    
    // Prevent rendering children on auth pages if logged out
    if(!user && pathname !== '/login' && pathname !== '/register' && pathname !== '/forgot-password') return null;

    return <AuthContext.Provider value={{ user, loading, currentUser }}>{children}</AuthContext.Provider>;
}
