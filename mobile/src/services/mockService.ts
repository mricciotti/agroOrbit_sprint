// Serviço para gerenciar dados mockados com persistência via AsyncStorage.
// Quando USE_JAVA_API_DATA=true, tenta consumir a API Java/SOA real e faz fallback para mock se ela estiver indisponível.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { alertasIniciais, Alerta, StatusAlerta } from '../data/mocks';
import { ENV } from '../config/environment';
import { getJavaAlertas } from './apiService';
import { mapJavaAlertaToMobile } from './javaIntegrationService';

const ALERTAS_STORAGE_KEY = '@agrosat:alertas';
const ALERTAS_STATUS_STORAGE_KEY = '@agrosat:alertas-status';

const applyPersistedStatuses = async (alertas: Alerta[]): Promise<Alerta[]> => {
  const raw = await AsyncStorage.getItem(ALERTAS_STATUS_STORAGE_KEY);
  const statuses = raw ? (JSON.parse(raw) as Record<string, StatusAlerta>) : {};

  return alertas.map((alerta) => ({
    ...alerta,
    status: statuses[alerta.id] || alerta.status,
  }));
};

export const initializeAlertas = async (): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(ALERTAS_STORAGE_KEY);
    if (!existingData) {
      await AsyncStorage.setItem(ALERTAS_STORAGE_KEY, JSON.stringify(alertasIniciais));
    }
  } catch (error) {
    console.error('Erro ao inicializar alertas:', error);
  }
};

export const getAlertas = async (): Promise<Alerta[]> => {
  try {
    if (ENV.USE_JAVA_API_DATA) {
      try {
        const javaAlertas = await getJavaAlertas(50);
        return applyPersistedStatuses(javaAlertas.map(mapJavaAlertaToMobile));
      } catch (error) {
        console.warn('API Java indisponível. Usando alertas mockados.', error);
      }
    }

    const data = await AsyncStorage.getItem(ALERTAS_STORAGE_KEY);
    if (data) return applyPersistedStatuses(JSON.parse(data));

    await initializeAlertas();
    return applyPersistedStatuses(alertasIniciais);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return alertasIniciais;
  }
};

export const updateAlertaStatus = async (
  alertaId: string,
  novoStatus: StatusAlerta,
): Promise<boolean> => {
  try {
    const rawStatuses = await AsyncStorage.getItem(ALERTAS_STATUS_STORAGE_KEY);
    const statuses = rawStatuses ? JSON.parse(rawStatuses) : {};
    statuses[alertaId] = novoStatus;
    await AsyncStorage.setItem(ALERTAS_STATUS_STORAGE_KEY, JSON.stringify(statuses));

    const alertas = await getAlertas();
    const alertaIndex = alertas.findIndex((a) => a.id === alertaId);

    if (alertaIndex === -1) {
      console.error('Alerta não encontrado:', alertaId);
      return false;
    }

    alertas[alertaIndex] = {
      ...alertas[alertaIndex],
      status: novoStatus,
    };

    if (!ENV.USE_JAVA_API_DATA) {
      await AsyncStorage.setItem(ALERTAS_STORAGE_KEY, JSON.stringify(alertas));
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar alerta:', error);
    return false;
  }
};

export const getAlertasByFazenda = async (fazendaId: string): Promise<Alerta[]> => {
  try {
    const alertas = await getAlertas();
    return alertas.filter((a) => a.fazendaId === fazendaId);
  } catch (error) {
    console.error('Erro ao buscar alertas por fazenda:', error);
    return [];
  }
};

export const getAlertasByStatus = async (status: StatusAlerta): Promise<Alerta[]> => {
  try {
    const alertas = await getAlertas();
    return alertas.filter((a) => a.status === status);
  } catch (error) {
    console.error('Erro ao buscar alertas por status:', error);
    return [];
  }
};

export const getAlertasCriticos = async (): Promise<Alerta[]> => {
  try {
    const alertas = await getAlertas();
    return alertas.filter(
      (a) => a.severidade === 'critico' && a.status !== 'resolvido',
    );
  } catch (error) {
    console.error('Erro ao buscar alertas críticos:', error);
    return [];
  }
};

export const countAlertasAtivos = async (): Promise<number> => {
  try {
    const alertas = await getAlertas();
    return alertas.filter((a) => a.status !== 'resolvido').length;
  } catch (error) {
    console.error('Erro ao contar alertas ativos:', error);
    return 0;
  }
};

export const resetAlertas = async (): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [ALERTAS_STORAGE_KEY, JSON.stringify(alertasIniciais)],
      [ALERTAS_STATUS_STORAGE_KEY, JSON.stringify({})],
    ]);
  } catch (error) {
    console.error('Erro ao resetar alertas:', error);
  }
};

export default {
  initializeAlertas,
  getAlertas,
  updateAlertaStatus,
  getAlertasByFazenda,
  getAlertasByStatus,
  getAlertasCriticos,
  countAlertasAtivos,
  resetAlertas,
};
