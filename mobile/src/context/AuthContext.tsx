import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { ENV } from '../config/environment';
import { clearJavaSession, clearFazendasCriadas } from '../services/apiService';

export interface User {
  id: string;
  nome: string;
  email: string;
  fazendaPrincipal?: string;
  provider: 'firebase' | 'java-api';
  role?: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, senha: string) => Promise<boolean>;
  signUp: (nome: string, email: string, senha: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AUTH_STORAGE_KEY = '@agrosat:auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const suppressNextFirebaseUserRef = useRef(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function bootstrap() {
      if (ENV.USE_FIREBASE_AUTH && isFirebaseConfigured) {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            if (suppressNextFirebaseUserRef.current) {
              await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
              setUser(null);
              setIsLoading(false);
              return;
            }

            const mappedUser: User = {
              id: firebaseUser.uid,
              nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
              email: firebaseUser.email || '',
              fazendaPrincipal: '1',
              provider: 'firebase',
            };
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mappedUser));
            setUser(mappedUser);
          } else {
            const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            if (storedUser) {
              const parsed = JSON.parse(storedUser) as User;
              if (parsed.provider !== 'firebase') setUser(parsed);
              else setUser(null);
            } else {
              setUser(null);
            }
          }
          setIsLoading(false);
        });
        return;
      }

      await loadStoredUser();
    }

    bootstrap();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const persistUser = async (newUser: User) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, senha: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      if (ENV.USE_FIREBASE_AUTH && isFirebaseConfigured) {
        const credential = await signInWithEmailAndPassword(auth, email, senha);
        await persistUser({
          id: credential.user.uid,
          nome: credential.user.displayName || email.split('@')[0],
          email,
          fazendaPrincipal: '1',
          provider: 'firebase',
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (nome: string, email: string, senha: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      if (ENV.USE_FIREBASE_AUTH && isFirebaseConfigured) {
        suppressNextFirebaseUserRef.current = true;
        const credential = await createUserWithEmailAndPassword(auth, email, senha);
        await updateProfile(credential.user, { displayName: nome });
        await firebaseSignOut(auth);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
        suppressNextFirebaseUserRef.current = false;
        return true;
      }

      return false;
    } catch (error) {
      suppressNextFirebaseUserRef.current = false;
      console.error('Erro no cadastro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      if (ENV.USE_FIREBASE_AUTH && isFirebaseConfigured) {
        await sendPasswordResetEmail(auth, email);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await clearJavaSession();
      await clearFazendasCriadas();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      if (ENV.USE_FIREBASE_AUTH && isFirebaseConfigured) {
        await firebaseSignOut(auth);
      }
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}

export default AuthContext;
