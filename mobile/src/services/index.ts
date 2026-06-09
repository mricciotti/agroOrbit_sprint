export { fetchWeatherData } from './weatherService';
export type { WeatherData } from './weatherService';
export {
  initializeAlertas,
  getAlertas,
  updateAlertaStatus,
  getAlertasByFazenda,
  getAlertasByStatus,
  getAlertasCriticos,
  countAlertasAtivos,
  resetAlertas,
} from './mockService';
export {
  javaLogin,
  clearJavaSession,
  getJavaDashboard,
  getJavaAlertas,
  postJavaAnalise,
} from './apiService';
