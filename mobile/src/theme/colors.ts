// Cores do tema AgroSat - Dark Mode com tons de Verde/Terra
export const colors = {
  // Cores primárias
  primary: '#22C55E', // Verde vibrante
  primaryLight: '#4ADE80',
  primaryDark: '#16A34A',
  
  // Cores de fundo (Dark Mode)
  background: '#0D1117',
  backgroundSecondary: '#161B22',
  backgroundTertiary: '#21262D',
  surface: '#1C2128',
  surfaceHover: '#262C36',
  
  // Cores de texto
  textPrimary: '#F0F6FC',
  textSecondary: '#8B949E',
  textMuted: '#6E7681',
  
  // Cores de status/severidade
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  
  // Cores para badges de status
  statusNormal: '#22C55E',
  statusAtencao: '#F59E0B',
  statusCritico: '#EF4444',
  
  // Cores para fontes de dados
  fonteSatelite: '#8B5CF6', // Roxo
  fonteDrone: '#06B6D4', // Cyan
  fonteIoT: '#F97316', // Laranja
  
  // Bordas e divisores
  border: '#30363D',
  borderLight: '#21262D',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Gradientes (como strings para uso em estilos)
  gradientPrimary: ['#22C55E', '#16A34A'],
  gradientDark: ['#161B22', '#0D1117'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
};
