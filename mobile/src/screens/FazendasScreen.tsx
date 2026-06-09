import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '../components/StatusBadge';
import { fazendas as mockFazendas, Fazenda, Talhao } from '../data/mocks';
import { getJavaFazenda, deleteJavaFazenda, getJavaDashboard, getFazendasCriadas, removerFazendaCriada, JavaFazendaResponseDTO } from '../services/apiService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NovaFazendaModal } from '../components/NovaFazendaModal';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

type FazendaItem =
  | { source: 'mock'; data: Fazenda }
  | { source: 'api'; data: JavaFazendaResponseDTO; nivelRisco: string };

function nivelRiscoToStatus(nivelRisco: string): 'normal' | 'atencao' | 'critico' {
  const r = nivelRisco?.toUpperCase();
  if (r === 'CRITICO' || r === 'CRÍTICO') return 'critico';
  if (r === 'ALERTA') return 'atencao';
  return 'normal';
}

function statusToColor(status: 'normal' | 'atencao' | 'critico'): string {
  if (status === 'critico') return '#EF4444';
  if (status === 'atencao') return '#F59E0B';
  return '#22C55E';
}

export function FazendasScreen() {
  const navigation = useNavigation<any>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNovaFazenda, setShowNovaFazenda] = useState(false);
  const [apiItems, setApiItems] = useState<{ data: JavaFazendaResponseDTO; nivelRisco: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  // Impede reload automático enquanto uma operação local (delete) está em andamento.
  const suppressNextLoad = useRef(false);

  const load = useCallback(async () => {
    // Testa conectividade via dashboard (endpoint que sempre existe).
    try {
      await getJavaDashboard();
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    // Busca apenas as fazendas criadas via "Nova análise" (emails registrados localmente).
    // O email do usuário Firebase NÃO é buscado — ele não existe na API Java.
    const criadas = await getFazendasCriadas();

    if (criadas.length === 0) {
      setApiItems([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const results = await Promise.all(
      criadas.map((entry) =>
        getJavaFazenda(entry.email)
          .then((f) => ({ data: f, nivelRisco: entry.nivelRisco }))
          .catch(() => null),
      ),
    );
    setApiItems(results.filter((r): r is { data: JavaFazendaResponseDTO; nivelRisco: string } => r !== null));

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  // Recarrega ao ganhar foco (ex: voltando do Dashboard após criar fazenda),
  // mas pula se um delete acabou de acontecer.
  useFocusEffect(
    useCallback(() => {
      if (suppressNextLoad.current) {
        suppressNextLoad.current = false;
        return;
      }
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    load();
  }, [load]);

  const handleDelete = async (email: string) => {
    // Remove imediatamente do estado — sem Alert, sem reload.
    setApiItems((prev) => prev.filter((f) => f.data.email !== email));
    suppressNextLoad.current = true;
    await removerFazendaCriada(email);
    deleteJavaFazenda(email).catch(() => {});
  };

  const items: FazendaItem[] = [
    ...apiItems.map((d): FazendaItem => ({ source: 'api', data: d.data, nivelRisco: d.nivelRisco })),
    ...mockFazendas.map((d): FazendaItem => ({ source: 'mock', data: d })),
  ];

  const totalTalhoes = mockFazendas.reduce((acc, f) => acc + f.talhoes.length, 0);

  // Total de hectares: mock + API items
  const totalHectaresMock = mockFazendas.reduce((acc, f) => acc + f.area, 0);
  const totalHectaresApi = apiItems.reduce((acc, f) => acc + (f.data.areaHectares ?? 0), 0);
  const totalHectares = totalHectaresMock + totalHectaresApi;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando fazendas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Minhas Fazendas</Text>
            <Text style={styles.subtitle}>
              {items.length} fazendas • {totalHectares.toLocaleString('pt-BR')} ha
            </Text>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => setShowNovaFazenda(true)}
          >
            <Ionicons name="add" size={16} color={colors.background} />
            <Text style={styles.ctaButtonText}>Nova</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.apiStatusRow}>
          <Ionicons
            name={apiOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={13}
            color={apiOnline ? colors.success : colors.warning}
          />
          <Text style={[styles.apiStatusText, { color: apiOnline ? colors.success : colors.warning }]}>
            {apiOnline ? 'API conectada' : 'API offline — dados locais'}
          </Text>
        </View>
      </View>

      <NovaFazendaModal
        visible={showNovaFazenda}
        onClose={() => setShowNovaFazenda(false)}
        onSuccess={() => load()}
      />

      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.source === 'api' ? `api-${item.data.id}` : `mock-${item.data.id}`
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) =>
          item.source === 'api' ? (
            <ApiFazendaCard
              fazenda={item.data}
              nivelRisco={item.nivelRisco}
              isExpanded={selectedId === `api-${item.data.id}`}
              onPress={() =>
                setSelectedId(selectedId === `api-${item.data.id}` ? null : `api-${item.data.id}`)
              }
              onDelete={() => handleDelete(item.data.email)}
            />
          ) : (
            <MockFazendaCard
              fazenda={item.data}
              isExpanded={selectedId === `mock-${item.data.id}`}
              onPress={() =>
                setSelectedId(selectedId === `mock-${item.data.id}` ? null : `mock-${item.data.id}`)
              }
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function ApiFazendaCard({
  fazenda,
  nivelRisco,
  isExpanded,
  onPress,
  onDelete,
}: {
  fazenda: JavaFazendaResponseDTO;
  nivelRisco: string;
  isExpanded: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const status = nivelRiscoToStatus(nivelRisco);
  const borderColor = statusToColor(status);

  return (
    <View style={[styles.fazendaCard, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
      <View style={styles.fazendaHeader}>
        <TouchableOpacity style={styles.fazendaInfoTouchable} onPress={onPress} activeOpacity={0.7}>
          <View style={styles.fazendaInfo}>
            <View style={styles.fazendaIconContainer}>
              <Ionicons name="leaf" size={24} color={colors.primary} />
            </View>
            <View style={styles.fazendaDetails}>
              <Text style={styles.fazendaNome}>{fazenda.nome}</Text>
              <Text style={styles.fazendaArea}>{fazenda.areaHectares} hectares</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.fazendaRight}>
          <StatusBadge status={status} />
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded && (
        <View style={[styles.talhoesContainer, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
          <View style={styles.talhoesHeader}>
            <Text style={styles.talhoesTitle}>Dados da fazenda</Text>
            <View style={styles.locationTag}>
              <Ionicons name="location" size={12} color={colors.textMuted} />
              <Text style={styles.locationText}>
                {fazenda.latitude?.toFixed(4)}, {fazenda.longitude?.toFixed(4)}
              </Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <InfoRow label="Proprietário" value={fazenda.proprietario} />
            <InfoRow label="Município" value={`${fazenda.municipio} - ${fazenda.estado}`} />
            <InfoRow label="Área" value={`${fazenda.areaHectares} ha`} />
            <InfoRow label="Cultura" value={fazenda.culturaPlantada} />
          </View>
        </View>
      )}
    </View>
  );
}

function MockFazendaCard({
  fazenda,
  isExpanded,
  onPress,
}: {
  fazenda: Fazenda;
  isExpanded: boolean;
  onPress: () => void;
}) {
  const borderColor = statusToColor(fazenda.statusGeral);

  return (
    <View style={[styles.fazendaCard, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
      <TouchableOpacity style={styles.fazendaHeader} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.fazendaInfo}>
          <View style={styles.fazendaIconContainer}>
            <Ionicons name="leaf" size={24} color={colors.primary} />
          </View>
          <View style={styles.fazendaDetails}>
            <Text style={styles.fazendaNome}>{fazenda.nome}</Text>
            <Text style={styles.fazendaArea}>{fazenda.area} hectares</Text>
          </View>
        </View>
        <View style={styles.fazendaRight}>
          <StatusBadge status={fazenda.statusGeral} />
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.talhoesContainer, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
          <View style={styles.talhoesHeader}>
            <Text style={styles.talhoesTitle}>Talhões ({fazenda.talhoes.length})</Text>
            <View style={styles.locationTag}>
              <Ionicons name="location" size={12} color={colors.textMuted} />
              <Text style={styles.locationText}>
                {fazenda.localizacao.latitude.toFixed(4)}, {fazenda.localizacao.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
          {fazenda.talhoes.map((talhao) => (
            <TalhaoCard key={talhao.id} talhao={talhao} />
          ))}
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TalhaoCard({ talhao }: { talhao: Talhao }) {
  const getCulturaIcon = (cultura: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      Soja: 'leaf',
      Milho: 'nutrition',
      Algodão: 'flower',
      Café: 'cafe',
      'Cana-de-açúcar': 'rose',
      Feijão: 'ellipse',
    };
    return icons[cultura] || 'leaf';
  };

  return (
    <View style={styles.talhaoCard}>
      <View style={styles.talhaoHeader}>
        <View style={styles.talhaoLeft}>
          <View style={[styles.culturaIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name={getCulturaIcon(talhao.cultura)} size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.talhaoNome}>{talhao.nome}</Text>
            <Text style={styles.talhaoCultura}>{talhao.cultura} • {talhao.area} ha</Text>
          </View>
        </View>
        <StatusBadge status={talhao.statusSaude} size="sm" />
      </View>

      <View style={styles.talhaoObservacao}>
        <Ionicons
          name={
            talhao.statusSaude === 'critico'
              ? 'warning'
              : talhao.statusSaude === 'atencao'
              ? 'information-circle'
              : 'checkmark-circle'
          }
          size={14}
          color={
            talhao.statusSaude === 'critico'
              ? colors.danger
              : talhao.statusSaude === 'atencao'
              ? colors.warning
              : colors.success
          }
        />
        <Text style={styles.observacaoText}>{talhao.observacao}</Text>
      </View>

      <View style={styles.talhaoFooter}>
        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
        <Text style={styles.ultimaLeitura}>Última leitura: {talhao.ultimaLeitura}</Text>
      </View>
    </View>
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
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ctaButtonText: {
    fontSize: fontSize.sm,
    color: colors.background,
    fontWeight: fontWeight.semibold,
  },
  apiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  apiStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  separator: {
    height: spacing.md,
  },
  fazendaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fazendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  fazendaInfoTouchable: {
    flex: 1,
  },
  fazendaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fazendaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  fazendaDetails: {
    flex: 1,
  },
  fazendaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fazendaArea: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fazendaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteButton: {
    padding: 4,
  },
  infoGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
    textAlign: 'right',
  },
  talhoesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  talhoesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  talhoesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  talhaoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  talhaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  talhaoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  culturaIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  talhaoNome: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  talhaoCultura: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  talhaoObservacao: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  observacaoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  talhaoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ultimaLeitura: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default FazendasScreen;
