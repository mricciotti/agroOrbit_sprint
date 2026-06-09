import { ENV } from '../config/environment';

export interface WeatherData {
  temperatura: number;
  sensacaoTermica: number;
  umidadeAr: number;
  precipitacao: number;
  probabilidadeChuva: number;
  evapotranspiracao: number;
  deficitPressaoVapor: number;
  coberturaNuvens: number;
  condicao: string;
  riscoSeca: 'normal' | 'atencao' | 'critico';
  recomendacao: string;
  ultimaAtualizacao: string;
}

interface OpenMeteoResponse {
  hourly: Record<string, number[] | string[]>;
  daily: Record<string, number[] | string[]>;
}

const weatherCodeToDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    0: 'Céu limpo',
    1: 'Predominantemente limpo',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Neblina',
    48: 'Neblina com geada',
    51: 'Garoa leve',
    53: 'Garoa moderada',
    55: 'Garoa intensa',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    80: 'Pancadas leves',
    81: 'Pancadas moderadas',
    82: 'Pancadas fortes',
    95: 'Tempestade',
  };
  return descriptions[code] || 'Condição não classificada';
};

const safeNumber = (value: unknown, fallback = 0): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

function getClosestHourIndex(times: unknown): number {
  if (!Array.isArray(times) || times.length === 0) return 0;

  const now = new Date();
  let bestIndex = 0;
  let bestDiff = Number.MAX_SAFE_INTEGER;

  times.forEach((time, index) => {
    const diff = Math.abs(new Date(String(time)).getTime() - now.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function calculateDroughtRisk(params: {
  humidity: number;
  rain: number;
  precipitationProbability: number;
  evapotranspiration: number;
  vapourPressureDeficit: number;
}): Pick<WeatherData, 'riscoSeca' | 'recomendacao'> {
  let score = 0;

  if (params.humidity < 35) score += 2;
  else if (params.humidity < 50) score += 1;

  if (params.rain <= 0) score += 2;
  else if (params.rain < 2) score += 1;

  if (params.precipitationProbability < 30) score += 1;
  if (params.evapotranspiration > 0.25) score += 1;
  if (params.vapourPressureDeficit > 1.5) score += 1;

  if (score >= 5) {
    return {
      riscoSeca: 'critico',
      recomendacao: 'Risco crítico de seca. Priorizar inspeção nos talhões e avaliar manejo emergencial.',
    };
  }

  if (score >= 3) {
    return {
      riscoSeca: 'atencao',
      recomendacao: 'Risco moderado. Acompanhar umidade, chuva e áreas com maior sensibilidade.',
    };
  }

  return {
    riscoSeca: 'normal',
    recomendacao: 'Condição climática estável. Manter monitoramento contínuo da lavoura.',
  };
}

function buildOpenMeteoUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: [
      'weather_code',
      'precipitation_probability_max',
      'precipitation_hours',
      'precipitation_sum',
      'rain_sum',
      'showers_sum',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'precipitation_probability',
      'apparent_temperature',
      'precipitation',
      'showers',
      'rain',
      'snowfall',
      'snow_depth',
      'weather_code',
      'pressure_msl',
      'surface_pressure',
      'cloud_cover_low',
      'cloud_cover',
      'cloud_cover_mid',
      'cloud_cover_high',
      'visibility',
      'vapour_pressure_deficit',
      'evapotranspiration',
      'et0_fao_evapotranspiration',
    ].join(','),
    timezone: 'America/Sao_Paulo',
    past_days: '7',
    forecast_days: '16',
  });

  return `${ENV.OPEN_METEO_BASE_URL}?${params.toString()}`;
}

export const fetchWeatherData = async (
  latitude: number,
  longitude: number,
): Promise<WeatherData> => {
  try {
    const response = await fetch(buildOpenMeteoUrl(latitude, longitude));

    if (!response.ok) {
      throw new Error(`Erro na API Open-Meteo: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();
    const hourly = data.hourly || {};
    const index = getClosestHourIndex(hourly.time);

    const temperatura = Math.round(safeNumber((hourly.temperature_2m as number[])?.[index]));
    const sensacaoTermica = Math.round(safeNumber((hourly.apparent_temperature as number[])?.[index]));
    const umidadeAr = Math.round(safeNumber((hourly.relative_humidity_2m as number[])?.[index]));
    const precipitacao = safeNumber((hourly.precipitation as number[])?.[index]);
    const rain = safeNumber((hourly.rain as number[])?.[index]);
    const probabilidadeChuva = Math.round(safeNumber((hourly.precipitation_probability as number[])?.[index]));
    const evapotranspiracao = safeNumber((hourly.evapotranspiration as number[])?.[index]);
    const deficitPressaoVapor = safeNumber((hourly.vapour_pressure_deficit as number[])?.[index]);
    const coberturaNuvens = Math.round(safeNumber((hourly.cloud_cover as number[])?.[index]));
    const weatherCode = Math.round(safeNumber((hourly.weather_code as number[])?.[index]));

    const risk = calculateDroughtRisk({
      humidity: umidadeAr,
      rain,
      precipitationProbability: probabilidadeChuva,
      evapotranspiration: evapotranspiracao,
      vapourPressureDeficit: deficitPressaoVapor,
    });

    return {
      temperatura,
      sensacaoTermica,
      umidadeAr,
      precipitacao,
      probabilidadeChuva,
      evapotranspiracao,
      deficitPressaoVapor,
      coberturaNuvens,
      condicao: weatherCodeToDescription(weatherCode),
      ...risk,
      ultimaAtualizacao: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  } catch (error) {
    console.error('Erro ao buscar dados climáticos:', error);

    return {
      temperatura: 28,
      sensacaoTermica: 30,
      umidadeAr: 42,
      precipitacao: 0,
      probabilidadeChuva: 20,
      evapotranspiracao: 0.31,
      deficitPressaoVapor: 1.7,
      coberturaNuvens: 35,
      condicao: 'Dados climáticos indisponíveis',
      riscoSeca: 'atencao',
      recomendacao: 'Não foi possível consultar a Open-Meteo. Verifique a conexão e tente novamente.',
      ultimaAtualizacao: '--:--',
    };
  }
};

export default {
  fetchWeatherData,
};
