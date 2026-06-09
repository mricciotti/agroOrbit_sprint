import { fazendas, Alerta } from '../data/mocks';
import {
  JavaAlertaDTO,
  JavaDashboardDTO,
  getJavaAlertas,
  getJavaDashboard,
  testJavaConnection,
} from './apiService';

export type ApiSource = 'java-api' | 'mock';

export interface MobileDashboardData {
  source: ApiSource;
  totalFazendas: number;
  fazendasCriticas: number;
  fazendasEmAlerta: number;
  fazendasNormais: number;
  distribuicaoRisco: Record<string, number>;
  mediaNDVIPorEstado: Record<string, number>;
  geradoEm?: string;
}

function riskToMobileStatus(nivelRisco: string): Alerta['severidade'] {
  const risk = nivelRisco?.toUpperCase();
  if (risk === 'CRITICO' || risk === 'CRÍTICO') return 'critico';
  if (risk === 'ALERTA') return 'atencao';
  return 'normal';
}

export function mapJavaAlertaToMobile(item: JavaAlertaDTO, index: number): Alerta {
  return {
    id: `java-${item.fazendaId}-${index}`,
    fazendaId: String(item.fazendaId),
    talhaoId: `api-${item.estado || 'talhao'}`,
    tipoFonte: 'Satélite',
    titulo: `${item.nivelRisco} - ${item.nomeFazenda}`,
    descricao:
      item.recomendacao ||
      `Risco ${item.nivelRisco} detectado na cultura ${item.culturaPlantada}.`,
    data: item.dataLeitura || new Date().toISOString(),
    status: 'aberto',
    severidade: riskToMobileStatus(item.nivelRisco),
    confiancaIA: Math.min(99, Math.max(60, item.scoreRisco || 70)),
  };
}

function mapJavaDashboard(data: JavaDashboardDTO): MobileDashboardData {
  return {
    source: 'java-api',
    totalFazendas: data.totalFazendas,
    fazendasCriticas: data.fazendasCriticas,
    fazendasEmAlerta: data.fazendasEmAlerta,
    fazendasNormais: data.fazendasNormais,
    distribuicaoRisco: data.distribuicaoRisco || {},
    mediaNDVIPorEstado: data.mediaNDVIPorEstado || {},
    geradoEm: data.geradoEm,
  };
}

function getMockDashboard(): MobileDashboardData {
  const fazendasCriticas = fazendas.filter((f) => f.statusGeral === 'critico').length;
  const fazendasEmAlerta = fazendas.filter((f) => f.statusGeral === 'atencao').length;
  const fazendasNormais = fazendas.filter((f) => f.statusGeral === 'normal').length;

  return {
    source: 'mock',
    totalFazendas: fazendas.length,
    fazendasCriticas,
    fazendasEmAlerta,
    fazendasNormais,
    distribuicaoRisco: {
      CRITICO: fazendasCriticas,
      ALERTA: fazendasEmAlerta,
      NORMAL: fazendasNormais,
    },
    mediaNDVIPorEstado: {},
    geradoEm: new Date().toISOString(),
  };
}

export async function getDashboardWithFallback(): Promise<MobileDashboardData> {
  try {
    const dashboard = await getJavaDashboard();
    return mapJavaDashboard(dashboard);
  } catch (error) {
    console.warn('Dashboard Java indisponível. Usando mock local.', error);
    return getMockDashboard();
  }
}

export async function getAlertasJavaOrEmpty(): Promise<Alerta[]> {
  try {
    const alertas = await getJavaAlertas(50);
    return alertas.map(mapJavaAlertaToMobile);
  } catch (error) {
    console.warn('Alertas Java indisponíveis.', error);
    return [];
  }
}

export { testJavaConnection };
