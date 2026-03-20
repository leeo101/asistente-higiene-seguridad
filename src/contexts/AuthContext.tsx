import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  User
} from 'firebase/auth';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';

// Tipos
interface PersonalData {
  name: string;
  email: string;
  photo: string;
  country: string;
  profileComplete: boolean;
  googleAccount: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Crear contexto con tipo
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado con tipo
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Props del Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: name
    });
  };

  const signInWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    // Forzar selección de cuenta siempre
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);

    // Guardar datos básicos del usuario de Google
    const user = result.user;
    if (user) {
      const photoURL: string = user.photoURL || '';
      const personalData: PersonalData = {
        name: user.displayName || '',
        email: user.email,
        photo: photoURL,
        country: 'argentina',
        profileComplete: false,
        googleAccount: true
      };
      localStorage.setItem('personalData', JSON.stringify(personalData));
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    await signOut(auth);
  };

  const deleteAccount = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error('No hay usuario autenticado');
    await deleteUser(auth.currentUser);
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

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    signInWithGoogle,
    logout,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
