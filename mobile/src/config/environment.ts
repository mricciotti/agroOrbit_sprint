/**
 * Configurações centrais do app.
 *
 * Firebase continua responsável pelo login/cadastro/recuperação do app mobile.
 * A API Java/SOA é consumida depois do login para buscar dashboard, alertas e análise real.
 *
 * IMPORTANTE:
 * - Android Emulator: use http://10.0.2.2:8080/api/v1
 * - Celular físico no Expo Go: use http://SEU_IP_DA_MAQUINA:8080/api/v1  -> 192.168.0.7
 * - Web/Browser: pode usar http://localhost:8080/api/v1
 */
export const ENV = {
  // API Java/SOA do AgroOrbit.
  // Troque para o IP da sua máquina se for testar no celular físico.
JAVA_API_BASE_URL: 'http://localhost:8080/api/v1',
//  JAVA_API_BASE_URL: 'http://192.168.0.47:8080/api/v1',

  // Login técnico usado apenas para obter o JWT da API Java.
  // O login visual do app continua sendo Firebase.
  JAVA_API_TECHNICAL_EMAIL: 'fazendeiro@agroorbit.com',
  JAVA_API_TECHNICAL_PASSWORD: 'agroorbit2026',

  // Se true, tenta consumir a API Java real.
  // Se a API falhar, o app cai automaticamente para mock local.
  USE_JAVA_API_DATA: true,

  // Mantém Firebase Auth como autenticação principal do mobile.
  USE_FIREBASE_AUTH: true,

  // Se true, o demoLogin tenta usar a API Java antes de cair no usuário demo local.
  USE_JAVA_API_AUTH: true,

  // Open-Meteo: dados reais de clima usados no Dashboard.
  OPEN_METEO_BASE_URL: 'https://api.open-meteo.com/v1/forecast',
};

export default ENV;
