import { initializeApp, getApps } from 'firebase/app';
import {
  Auth,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * O Firebase 10 possui a persistência React Native no bundle RN.
 * Usamos require para evitar erro de tipagem em alguns projetos Expo/TS.
 */
declare const require: any;
const { getReactNativePersistence } = require('@firebase/auth/dist/rn');

/**
 * Preencha com as credenciais do Firebase Web App do projeto.
 * Caminho no Firebase Console:
 * Configurações do projeto > Geral > Seus apps > SDK setup and configuration.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDAQsRSLQWIhUSNsPrss63nJOIadeX9AoM",
  authDomain: "agrosat-mobile-sprint.firebaseapp.com",
  projectId: "agrosat-mobile-sprint",
  storageBucket: "agrosat-mobile-sprint.firebasestorage.app",
  messagingSenderId: "978660353237",
  appId: "1:978660353237:web:71454173a0ffbd72ef6e5c",
  measurementId: "G-FMX3ZCTYS8"
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.projectId !== '';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

let auth: Auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

export { app, auth };
export default app;
