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
      // 🛡️ Limpiar solo datos de sesión y datos personales sensibles.
      // NO usar localStorage.clear() porque borra también las preferencias del usuario
      // como "recordarme" (remembered_email, remember_user).
      const SESSION_KEYS = [
        'personalData', 'syncQueue', 'dirtyKeys',
        // Colecciones sincronizadas
        'ppe_items', 'extinguishers_inventory', 'contractors_data', 'workers_data',
        'ehs_capa_db', 'training_history', 'ats_history', 'fire_load_history',
        'inspection_history', 'report_history', 'matrices_history', 'checklist_history',
        'subscriptionData', 'logoData', 'signatureStampData'
      ];
      SESSION_KEYS.forEach(key => localStorage.removeItem(key));

      // Limpiar también cualquier clave de reportes de IA
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ai_report_') || key.startsWith('sync_'))) {
          localStorage.removeItem(key);
        }
      }
    }
    await signOut(auth);
  };

  const deleteAccount = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error('No hay usuario autenticado');

    // Obtener token para autenticar la solicitud al servidor
    const token = await auth.currentUser.getIdToken();

    try {
      // Llamar al endpoint del servidor que:
      //   1. Elimina datos de Firestore recursivamente
      //   2. Elimina archivos de Storage
      //   3. Elimina el usuario de Firebase Auth
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Error al eliminar la cuenta en el servidor');
      }

      // Limpiar localStorage al terminar
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }

    } catch (err) {
      // Si el servidor no está disponible, intentar borrado directo de Auth como fallback
      // Los datos de Firestore/Storage quedarán huérfanos — notificar al usuario
      console.error('[DELETE ACCOUNT] Server deletion failed, falling back to Auth-only delete:', err);
      await deleteUser(auth.currentUser!);
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    }
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
