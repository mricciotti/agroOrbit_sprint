import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/environment';

export interface JavaLoginResponse {
  token: string;
  tipo: string;
  email: string;
  role: string;
  expiresIn: number;
}

export interface JavaDashboardDTO {
  totalFazendas: number;
  fazendasCriticas: number;
  fazendasEmAlerta: number;
  fazendasNormais: number;
  distribuicaoRisco: Record<string, number>;
  mediaNDVIPorEstado: Record<string, number>;
  geradoEm: string;
}

export interface JavaAlertaDTO {
  fazendaId: number;
  nomeFazenda: string;
  proprietario: string;
  estado: string;
  municipio: string;
  culturaPlantada: string;
  indiceNDVI: number;
  nivelRisco: 'NORMAL' | 'ALERTA' | 'CRITICO' | string;
  scoreRisco: number;
  recomendacao: string;
  dataLeitura: string;
}

export interface JavaFazendaRequestDTO {
  nome: string;
  proprietario: string;
  email: string;
  telefone?: string;
  estado: string;
  municipio: string;
  areaHectares: number;
  culturaPlantada: string;
  latitude: number;
  longitude: number;
  indiceNDVI: number;
  temperaturaMedia: number;
  umidadeSolo: number;
  irradianciaSolar: number;
}

export interface JavaAnaliseResponseDTO {
  leituraId: number;
  fazendaId: number;
  nomeFazenda: string;
  proprietario: string;
  estado: string;
  municipio: string;
  culturaPlantada: string;
  indiceNDVI: number;
  temperaturaMedia: number;
  umidadeSolo: number;
  irradianciaSolar: number;
  nivelRisco: 'NORMAL' | 'ALERTA' | 'CRITICO' | string;
  scoreRisco: number;
  recomendacao: string;
  dataLeitura: string;
}

export interface JavaFazendaResponseDTO {
  id: number;
  nome: string;
  proprietario: string;
  email: string;
  telefone?: string;
  estado: string;
  municipio: string;
  areaHectares: number;
  culturaPlantada: string;
  latitude: number;
  longitude: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface JavaAtualizarFazendaDTO {
  nome?: string;
  proprietario?: string;
  telefone?: string;
  estado?: string;
  municipio?: string;
  areaHectares?: number;
  culturaPlantada?: string;
  latitude?: number;
  longitude?: number;
}

export interface JavaConnectionStatus {
  online: boolean;
  baseUrl: string;
  message: string;
  role?: string;
  email?: string;
}

const JAVA_TOKEN_KEY = '@agrosat:javaToken';
const JAVA_USER_KEY = '@agrosat:javaUser';
const FAZENDAS_CRIADAS_KEY = '@agrosat:fazendasCriadas';

export interface FazendaCriadaEntry {
  email: string;
  nivelRisco: string;
  nome?: string;
  criadaEm?: string;
}

export async function registrarFazendaCriada(email: string, nivelRisco: string, nome?: string): Promise<void> {
  const raw = await AsyncStorage.getItem(FAZENDAS_CRIADAS_KEY);
  const lista: FazendaCriadaEntry[] = raw ? JSON.parse(raw) : [];
  const existente = lista.findIndex((e) => e.email === email);
  if (existente >= 0) {
    lista[existente].nivelRisco = nivelRisco;
    if (nome) lista[existente].nome = nome;
  } else {
    lista.push({ email, nivelRisco, nome, criadaEm: new Date().toISOString() });
  }
  await AsyncStorage.setItem(FAZENDAS_CRIADAS_KEY, JSON.stringify(lista));
}

export async function removerFazendaCriada(email: string): Promise<void> {
  const raw = await AsyncStorage.getItem(FAZENDAS_CRIADAS_KEY);
  const lista: FazendaCriadaEntry[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(
    FAZENDAS_CRIADAS_KEY,
    JSON.stringify(lista.filter((e) => e.email !== email)),
  );
}

export async function getFazendasCriadas(): Promise<FazendaCriadaEntry[]> {
  const raw = await AsyncStorage.getItem(FAZENDAS_CRIADAS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearFazendasCriadas(): Promise<void> {
  await AsyncStorage.removeItem(FAZENDAS_CRIADAS_KEY);
}

function joinUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

async function parseResponseBody(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getJavaToken(): Promise<string | null> {
  return AsyncStorage.getItem(JAVA_TOKEN_KEY);
}

async function setJavaSession(data: JavaLoginResponse): Promise<void> {
  await AsyncStorage.multiSet([
    [JAVA_TOKEN_KEY, data.token],
    [JAVA_USER_KEY, JSON.stringify(data)],
  ]);
}

export async function getJavaSession(): Promise<JavaLoginResponse | null> {
  const raw = await AsyncStorage.getItem(JAVA_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearJavaSession(): Promise<void> {
  await AsyncStorage.multiRemove([JAVA_TOKEN_KEY, JAVA_USER_KEY]);
}

async function publicRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(joinUrl(ENV.JAVA_API_BASE_URL, path), {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      body?.erro ||
      body?.mensagem ||
      body?.message ||
      `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

async function authorizedRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  let token = await getJavaToken();

  if (!token) {
    await javaTechnicalLogin();
    token = await getJavaToken();
  }

  const response = await fetch(joinUrl(ENV.JAVA_API_BASE_URL, path), {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });

  const body = await parseResponseBody(response);

  // Token expirado ou inválido: limpa sessão, renova e tenta 1 vez.
  if (response.status === 401 && retry) {
    await clearJavaSession();
    await javaTechnicalLogin();
    return authorizedRequest<T>(path, options, false);
  }

  if (!response.ok) {
    const message =
      body?.erro ||
      body?.mensagem ||
      body?.message ||
      `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

/**
 * Login técnico na API Java.
 *
 * O usuário do app continua autenticando com Firebase.
 * Esse login existe só para pegar o JWT exigido pelos endpoints Java.
 */
export async function javaTechnicalLogin(): Promise<JavaLoginResponse> {
  const data = await publicRequest<JavaLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: ENV.JAVA_API_TECHNICAL_EMAIL,
      senha: ENV.JAVA_API_TECHNICAL_PASSWORD,
    }),
  });

  await setJavaSession(data);
  return data;
}

/**
 * Mantido por compatibilidade, caso alguma tela queira fazer login Java manual.
 */
export async function javaLogin(
  email: string,
  senha: string,
): Promise<JavaLoginResponse> {
  const data = await publicRequest<JavaLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });

  await setJavaSession(data);
  return data;
}

export async function getJavaDashboard(): Promise<JavaDashboardDTO> {
  return authorizedRequest<JavaDashboardDTO>('/dashboard');
}

export async function getJavaAlertas(scoreMinimo = 50): Promise<JavaAlertaDTO[]> {
  return authorizedRequest<JavaAlertaDTO[]>(`/alertas?scoreMinimo=${scoreMinimo}`);
}

export async function getJavaFazenda(email: string): Promise<JavaFazendaResponseDTO> {
  return authorizedRequest<JavaFazendaResponseDTO>(`/fazendas/${encodeURIComponent(email)}`);
}

export async function putJavaFazenda(
  email: string,
  payload: JavaAtualizarFazendaDTO,
): Promise<JavaFazendaResponseDTO> {
  return authorizedRequest<JavaFazendaResponseDTO>(`/fazendas/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteJavaFazenda(email: string): Promise<void> {
  return authorizedRequest<void>(`/fazendas/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
}

export async function postJavaAnalise(
  payload: JavaFazendaRequestDTO,
): Promise<JavaAnaliseResponseDTO> {
  return authorizedRequest<JavaAnaliseResponseDTO>('/analise', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function testJavaConnection(): Promise<JavaConnectionStatus> {
  try {
    const session = await javaTechnicalLogin();
    await getJavaDashboard();

    return {
      online: true,
      baseUrl: ENV.JAVA_API_BASE_URL,
      message: 'API Java conectada com sucesso.',
      role: session.role,
      email: session.email,
    };
  } catch (error) {
    return {
      online: false,
      baseUrl: ENV.JAVA_API_BASE_URL,
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível conectar na API Java.',
    };
  }
}

export default {
  javaLogin,
  javaTechnicalLogin,
  clearJavaSession,
  getJavaSession,
  testJavaConnection,
  getJavaDashboard,
  getJavaAlertas,
  getJavaFazenda,
  putJavaFazenda,
  deleteJavaFazenda,
  postJavaAnalise,
};
