import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { WeatherCard, MetricCard } from '../components/Cards';
import { StatusBadge, FonteBadge } from '../components/StatusBadge';
import { NovaFazendaModal } from '../components/NovaFazendaModal';
import { fetchWeatherData, WeatherData } from '../services/weatherService';
import { countAlertasAtivos, getAlertasCriticos } from '../services/mockService';
import { fazendas, Alerta } from '../data/mocks';
import { getDashboardWithFallback, MobileDashboardData } from '../services/javaIntegrationService';
import { JavaAnaliseResponseDTO } from '../services/apiService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

function GaugeCircle({ value, color }: { value: number; color: string }) {
  const size = 140;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Gauge ocupa 270° (começa em 135°, termina em 45°)
  const arcLength = circumference * 0.75;
  const filled = arcLength * (value / 100);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size}>
      <G rotation="-225" origin={`${cx}, ${cy}`}>
        {/* Trilha */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={`${color}22`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Progresso */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

export function DashboardScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [alertasCriticos, setAlertasCriticos] = useState<Alerta[]>([]);
  const [totalAlertasAtivos, setTotalAlertasAtivos] = useState(0);
  const [dashboardApi, setDashboardApi] = useState<MobileDashboardData | null>(null);
  const [javaOnline, setJavaOnline] = useState(false);
  const [apiSource, setApiSource] = useState<'java-api' | 'mock' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [analiseResult, setAnaliseResult] = useState<JavaAnaliseResponseDTO | null>(null);
  const [showAnaliseModal, setShowAnaliseModal] = useState(false);

  // Calcula status geral usando API Java quando disponível e mock como fallback.
  const statusGeral = dashboardApi?.fazendasCriticas
    ? 'critico'
    : dashboardApi?.fazendasEmAlerta
    ? 'atencao'
    : fazendas.some(f => f.statusGeral === 'critico')
    ? 'critico'
    : fazendas.some(f => f.statusGeral === 'atencao')
    ? 'atencao'
    : 'normal';

  const totalFazendas = dashboardApi?.totalFazendas ?? fazendas.length;
  const totalTalhoes = fazendas.reduce((acc, f) => acc + f.talhoes.length, 0);

  const loadData = useCallback(async () => {
    try {
      // Carrega alertas
      const criticos = await getAlertasCriticos();
      const totalAtivos = await countAlertasAtivos();
      setAlertasCriticos(criticos);
      setTotalAlertasAtivos(totalAtivos);

      // getDashboardWithFallback já faz o login técnico internamente.
      // Não chamamos testJavaConnection aqui para evitar requests duplicados.
      const dashboard = await getDashboardWithFallback();
      setJavaOnline(dashboard.source === 'java-api');
      setDashboardApi(dashboard);
      setApiSource(dashboard.source);

      // Solicita permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError('Permissão de localização negada');
        // Usa coordenadas padrão (São Paulo)
        const defaultWeather = await fetchWeatherData(-23.5505, -46.6333);
        setWeatherData(defaultWeather);
        setLocation({ latitude: -23.5505, longitude: -46.6333 });
      } else {
        // Obtém localização atual
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setLocation(coords);
        setLocationError(null);

        // Busca dados climáticos
        const weather = await fetchWeatherData(coords.latitude, coords.longitude);
        setWeatherData(weather);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLocationError('Erro ao obter localização');
      // Fallback para dados padrão
      const defaultWeather = await fetchWeatherData(-23.5505, -46.6333);
      setWeatherData(defaultWeather);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  // Índice de saúde da operação (0–100)
  const numCriticas = dashboardApi?.fazendasCriticas ?? fazendas.filter(f => f.statusGeral === 'critico').length;
  const numAlerta   = dashboardApi?.fazendasEmAlerta  ?? fazendas.filter(f => f.statusGeral === 'atencao').length;
  const saudeIndex  = Math.max(0, Math.min(100, 100 - numCriticas * 30 - numAlerta * 15));

  const heroColor = statusGeral === 'critico' ? '#EF4444' : statusGeral === 'atencao' ? '#F59E0B' : '#22C55E';
  const heroLabel = statusGeral === 'critico' ? 'Ação Requerida' : statusGeral === 'atencao' ? 'Atenção Necessária' : 'Operação Normal';
  const heroSub   = statusGeral === 'normal'
    ? 'Todas as fazendas saudáveis'
    : statusGeral === 'atencao'
    ? `${numAlerta} fazenda(s) em alerta`
    : `${numCriticas} fazenda(s) crítica(s)`;

  // Cor da borda esquerda dos alertas
  const alertBorderColor = (severidade: string) => {
    if (severidade === 'critico') return colors.danger;
    if (severidade === 'atencao') return colors.warning;
    return colors.success;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.nome?.split(' ')[0] || 'Produtor'}!</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.textMuted} />
              <Text style={styles.locationText}>
                {locationError || `${location?.latitude.toFixed(4)}, ${location?.longitude.toFixed(4)}`}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Hero Card — Gauge circular */}
        <View style={styles.heroCard}>
          <View style={styles.heroBody}>
            {/* Gauge */}
            <View style={styles.gaugeWrapper}>
              <GaugeCircle value={saudeIndex} color={heroColor} />
              <View style={styles.gaugeCenter}>
                <Text style={[styles.gaugeValue, { color: heroColor }]}>{saudeIndex}</Text>
                <Text style={styles.gaugeUnit}>/ 100</Text>
              </View>
            </View>

            {/* Infos à direita */}
            <View style={styles.heroInfo}>
              <Text style={styles.heroCardTitle}>Saúde da{'\n'}Operação</Text>
              <Text style={[styles.heroLabel, { color: heroColor }]}>{heroLabel}</Text>
              <Text style={styles.heroCardSub}>{heroSub}</Text>

              <View style={styles.heroStatsGrid}>
                <View style={styles.heroStatBox}>
                  <Text style={styles.heroStatValue}>{totalFazendas}</Text>
                  <Text style={styles.heroStatLabel}>fazendas</Text>
                </View>
                <View style={styles.heroStatBox}>
                  <Text style={styles.heroStatValue}>{totalTalhoes}</Text>
                  <Text style={styles.heroStatLabel}>talhões</Text>
                </View>
                <View style={styles.heroStatBox}>
                  <Text style={[styles.heroStatValue, { color: colors.danger }]}>{numCriticas}</Text>
                  <Text style={styles.heroStatLabel}>críticas</Text>
                </View>
                <View style={styles.heroStatBox}>
                  <Text style={[styles.heroStatValue, { color: colors.warning }]}>{numAlerta}</Text>
                  <Text style={styles.heroStatLabel}>alertas</Text>
                </View>
              </View>
            </View>
          </View>
        </View>


        {/* Acesso Rápido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickGrid}>
            {/* Fazendas — verde */}
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#0f2a1a' }]} onPress={() => navigation.navigate('Fazendas')} activeOpacity={0.75}>
              <View style={[styles.quickIcon, { backgroundColor: '#22C55E25' }]}>
                <Ionicons name="leaf" size={22} color="#22C55E" />
              </View>
              <Text style={[styles.quickValue, { color: '#22C55E' }]}>{totalFazendas}</Text>
              <Text style={styles.quickTitle}>Fazendas</Text>
              <Text style={styles.quickSub}>monitoradas</Text>
            </TouchableOpacity>

            {/* Alertas — vermelho */}
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#2a0f0f' }]} onPress={() => navigation.navigate('Alertas')} activeOpacity={0.75}>
              <View style={[styles.quickIcon, { backgroundColor: '#EF444425' }]}>
                <Ionicons name="notifications" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.quickValue, { color: '#EF4444' }]}>{totalAlertasAtivos}</Text>
              <Text style={styles.quickTitle}>Alertas</Text>
              <Text style={styles.quickSub}>ativos agora</Text>
            </TouchableOpacity>

            {/* Mapa — azul */}
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#0f1a2a' }]} onPress={() => navigation.navigate('Mapa')} activeOpacity={0.75}>
              <View style={[styles.quickIcon, { backgroundColor: '#3B82F625' }]}>
                <Ionicons name="map" size={22} color="#3B82F6" />
              </View>
              <Text style={[styles.quickValue, { color: '#3B82F6' }]}>{totalFazendas}</Text>
              <Text style={styles.quickTitle}>Mapa</Text>
              <Text style={styles.quickSub}>satélite</Text>
            </TouchableOpacity>

            {/* Drone — roxo */}
            <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#1a0f2a' }]} onPress={() => navigation.navigate('Drone')} activeOpacity={0.75}>
              <View style={[styles.quickIcon, { backgroundColor: '#A855F725' }]}>
                <Ionicons name="airplane" size={22} color="#A855F7" />
              </View>
              <Text style={[styles.quickValue, { color: '#A855F7' }]}>3</Text>
              <Text style={styles.quickTitle}>Drone</Text>
              <Text style={styles.quickSub}>missões</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Clima em Tempo Real */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Clima Atual</Text>
            <Text style={styles.updateTime}>
              Atualizado às {weatherData?.ultimaAtualizacao || '--:--'}
            </Text>
          </View>

          <View style={styles.weatherGrid}>
            <WeatherCard
              icon="thermometer"
              title="Temperatura"
              value={weatherData?.temperatura?.toString() || '--'}
              unit="°C"
              color={colors.danger}
              style={styles.weatherCardItem}
            />
            <WeatherCard
              icon="water"
              title="Umidade Ar"
              value={weatherData?.umidadeAr?.toString() || '--'}
              unit="%"
              color={colors.info}
              style={styles.weatherCardItem}
            />
            <WeatherCard
              icon="leaf"
              title="Chuva"
              value={weatherData?.probabilidadeChuva?.toString() || '--'}
              unit="%"
              color={colors.success}
              style={styles.weatherCardItem}
            />
            <WeatherCard
              icon="cloudy"
              title={weatherData?.condicao || 'Carregando...'}
              value={weatherData?.coberturaNuvens?.toString() || '--'}
              unit="%"
              color={colors.textPrimary}
              style={styles.weatherCardItem}
            />
          </View>
        </View>
        <Text style={styles.sectionTitle}>Adicionar nova fazenda</Text>

        {/* Nova Análise */}
        <TouchableOpacity style={styles.novaAnaliseButton} onPress={() => setShowAnaliseModal(true)}>
          <View style={styles.novaAnaliseIconWrap}>
            <Ionicons name="add" size={28} color={colors.primary} />
          </View>
          <Text style={styles.novaAnaliseTitle}>Nova Fazenda</Text>
          <Text style={styles.novaAnaliseSubtitle}>Análise de risco via satélite</Text>
        </TouchableOpacity>

        {/* Última Análise (resultado) */}
        {analiseResult && (
          <View style={styles.section}>
            <View style={styles.analysisResultCard}>
              <View style={styles.analysisResultHeader}>
                <Text style={styles.analysisResultTitle}>Última análise</Text>
                <TouchableOpacity onPress={() => setAnaliseResult(null)}>
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.analysisResultLabel}>{analiseResult.nomeFazenda}</Text>
              <View style={styles.analysisResultRow}>
                <View style={[styles.riscoBadge, { backgroundColor: analiseResult.nivelRisco === 'CRITICO' ? `${colors.danger}20` : analiseResult.nivelRisco === 'ALERTA' ? `${colors.warning}20` : `${colors.success}20` }]}>
                  <Text style={[styles.riscoBadgeText, { color: analiseResult.nivelRisco === 'CRITICO' ? colors.danger : analiseResult.nivelRisco === 'ALERTA' ? colors.warning : colors.success }]}>
                    {analiseResult.nivelRisco}
                  </Text>
                </View>
                <Text style={styles.analiseScore}>Score: {analiseResult.scoreRisco}</Text>
              </View>
              <Text style={styles.analysisResultText} numberOfLines={3}>{analiseResult.recomendacao}</Text>
            </View>
          </View>
        )}

        <NovaFazendaModal
          visible={showAnaliseModal}
          onClose={() => setShowAnaliseModal(false)}
          onSuccess={(result) => { setAnaliseResult(result); loadData(); }}
        />

        {/* Alertas Ativos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertas Ativos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alertas')}>
              <Text style={styles.actionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.alertSummary}>
            <View style={styles.alertCount}>
              <Text style={styles.alertNumber}>{totalAlertasAtivos}</Text>
              <Text style={styles.alertLabel}>alertas ativos</Text>
            </View>
            <View style={styles.alertCount}>
              <Text style={[styles.alertNumber, { color: colors.danger }]}>
                {alertasCriticos.length}
              </Text>
              <Text style={styles.alertLabel}>críticos</Text>
            </View>
          </View>

          {alertasCriticos.slice(0, 2).map((alerta) => (
            <TouchableOpacity
              key={alerta.id}
              style={[styles.alertItem, { borderLeftColor: alertBorderColor(alerta.severidade) }]}
              onPress={() => navigation.navigate('Alertas')}
              activeOpacity={0.75}
            >
              <View style={[styles.alertIconCol, { backgroundColor: `${alertBorderColor(alerta.severidade)}18` }]}>
                <Ionicons
                  name={alerta.severidade === 'critico' ? 'warning' : alerta.severidade === 'atencao' ? 'alert-circle' : 'checkmark-circle'}
                  size={22}
                  color={alertBorderColor(alerta.severidade)}
                />
              </View>
              <View style={styles.alertBody}>
                <View style={styles.alertItemHeader}>
                  <FonteBadge fonte={alerta.tipoFonte} />
                  <StatusBadge status={alerta.severidade} size="sm" />
                </View>
                <Text style={styles.alertItemTitle}>{alerta.titulo}</Text>
                <Text style={styles.alertItemDesc} numberOfLines={1}>{alerta.descricao}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  // Hero card
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 24,
    textAlign: 'center',
  },
  heroLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
    textAlign: 'center',
  },
  heroCardSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  heroInfo: {
    flex: 1,
    alignItems: 'center',
  },
  gaugeWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    lineHeight: 40,
  },
  gaugeUnit: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroStatBox: {
    width: '45%',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  heroStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Nova Análise button
  novaAnaliseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    gap: spacing.sm,
  },
  novaAnaliseIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  novaAnaliseIconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1.5,
    borderColor: `${colors.primary}50`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  novaAnaliseText: {
    flex: 1,
  },
  novaAnaliseTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  novaAnaliseSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  actionLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  updateTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  weatherGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  weatherCardItem: {
    flexBasis: '22%',
    minWidth: 0,
    maxWidth: 150,
    minHeight: 155,
  },
  analysisResultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  analysisResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  analysisResultTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  analysisResultLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  analysisResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  riscoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  riscoBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  analiseScore: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  analysisResultText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalSectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalSectionHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  sateliteHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  sateliteHintText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  sateliteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sateliteCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  sateliteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  sateliteCardTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    flex: 1,
  },
  sateliteCardRange: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  sateliteInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 6,
    textAlign: 'center',
  },
  sateliteCardHint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldColumn: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  fieldHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  dropdownValue: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Pickers
  pickerOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    maxHeight: 400,
  },
  pickerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  pickerItemSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  pickerItemText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickCard: {
    width: '47%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: 28,
    textAlign: 'center',
  },
  quickTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
    textAlign: 'center',
  },
  quickSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  alertSummary: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
    justifyContent: 'space-around',
  },
  alertCount: {
    alignItems: 'center',
  },
  alertNumber: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  alertLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    gap: spacing.sm,
  },
  alertIconCol: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertBody: {
    flex: 1,
  },
  alertItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertItemTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  alertItemDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

export default DashboardScreen;
