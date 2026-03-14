import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name
        });
        return userCredential;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        if (typeof window !== 'undefined') {
            localStorage.clear();
        }
        return signOut(auth);
    };

    const deleteAccount = async () => {
        if (!auth.currentUser) throw new Error("No hay usuario autenticado");
        const { deleteUser } = await import('firebase/auth');
        return deleteUser(auth.currentUser);
    };

    useEffect(() => {
        let isMounted = true;

        // Fallback de ultra-seguridad: si Firebase falla al conectar / leer IndexedDB y cuelga la app
        const emergencyTimer = setTimeout(() => {
            if (isMounted) {
                console.warn('[AUTH] Firebase onAuthStateChanged timeout - Forzando carga');
                setLoading(false);
            }
        }, 2500);

        const unsubscribe = onAuthStateChanged(auth, user => {
            clearTimeout(emergencyTimer);
            if (isMounted) {
                setCurrentUser(user);
                setLoading(false);
            }
        }, (error) => {
            clearTimeout(emergencyTimer);
            console.error('[AUTH] Error en onAuthStateChanged:', error);
            if (isMounted) {
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(emergencyTimer);
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout,
        deleteAccount
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
