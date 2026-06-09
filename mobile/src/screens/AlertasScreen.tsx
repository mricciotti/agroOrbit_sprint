import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, FonteBadge, AlertStatusBadge } from '../components/StatusBadge';
import { CustomButton } from '../components/CustomButton';
import { getAlertas, updateAlertaStatus } from '../services/mockService';
import { getAlertasJavaOrEmpty } from '../services/javaIntegrationService';
import { Alerta, StatusAlerta, fazendas } from '../data/mocks';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

type FilterType = 'todos' | 'aberto' | 'em_andamento' | 'resolvido';

export function AlertasScreen() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [filtro, setFiltro] = useState<FilterType>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAlerta, setSelectedAlerta] = useState<Alerta | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadAlertas = useCallback(async () => {
    try {
      const [mockData, javaData] = await Promise.all([
        getAlertas(),
        getAlertasJavaOrEmpty(),
      ]);

      // Mocks locais sempre aparecem. API Java adiciona alertas reais por cima.
      // Remove da API apenas os que já existem no mock pelo mesmo id (sem nunca filtrar mocks).
      const mockIds = new Set(mockData.map((a) => a.id));
      const javaApenas = javaData.filter((a) => !mockIds.has(a.id));
      setAlertas([...javaApenas, ...mockData]);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlertas();
  }, [loadAlertas]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAlertas();
  }, [loadAlertas]);

  const handleStatusChange = async (alertaId: string, novoStatus: StatusAlerta) => {
    const success = await updateAlertaStatus(alertaId, novoStatus);
    if (success) {
      await loadAlertas();
      setModalVisible(false);
      Alert.alert('Sucesso', 'Status do alerta atualizado!');
    } else {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  const getFazendaNome = (fazendaId: string) => {
    return fazendas.find(f => f.id === fazendaId)?.nome || 'Fazenda Desconhecida';
  };

  const getTalhaoNome = (fazendaId: string, talhaoId: string) => {
    const fazenda = fazendas.find(f => f.id === fazendaId);
    return fazenda?.talhoes.find(t => t.id === talhaoId)?.nome || 'Talhão Desconhecido';
  };

  const filteredAlertas = alertas.filter(a => {
    if (filtro === 'todos') return true;
    return a.status === filtro;
  }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeveridadeColor = (severidade: string) => {
    switch (severidade) {
      case 'critico': return '#EF4444';
      case 'atencao': return '#F59E0B';
      default: return '#22C55E';
    }
  };

  const renderAlertaCard = ({ item: alerta }: { item: Alerta }) => (
    <TouchableOpacity
      style={[styles.alertaCard, { borderLeftWidth: 4, borderLeftColor: getSeveridadeColor(alerta.severidade) }]}
      onPress={() => {
        setSelectedAlerta(alerta);
        setModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      {/* Header: badges à esquerda, status à direita */}
      <View style={styles.alertaHeader}>
        <View style={styles.alertaBadges}>
          <FonteBadge fonte={alerta.tipoFonte} />
          <StatusBadge status={alerta.severidade} size="sm" />
        </View>
        <AlertStatusBadge status={alerta.status} />
      </View>

      <Text style={styles.alertaTitulo} numberOfLines={2}>{alerta.titulo}</Text>
      <Text style={styles.alertaDescricao} numberOfLines={2}>
        {alerta.descricao}
      </Text>

      {/* Info: empilhado verticalmente para não quebrar em telas pequenas */}
      <View style={styles.alertaInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="leaf-outline" size={13} color={colors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {getFazendaNome(alerta.fazendaId)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="grid-outline" size={13} color={colors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {getTalhaoNome(alerta.fazendaId, alerta.talhaoId)}
          </Text>
        </View>
      </View>

      <View style={styles.alertaFooter}>
        <View style={styles.confidenceTag}>
          <Ionicons name="analytics" size={12} color={colors.primary} />
          <Text style={styles.confidenceText}>IA: {alerta.confiancaIA}%</Text>
        </View>
        <Text style={styles.alertaData}>{formatDate(alerta.data)}</Text>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ label, value }: { label: string; value: FilterType }) => (
    <TouchableOpacity
      style={[styles.filterButton, filtro === value && styles.filterButtonActive]}
      onPress={() => setFiltro(value)}
    >
      <Text style={[styles.filterText, filtro === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header fixo */}
      <View style={styles.header}>
        <Text style={styles.title}>Central de Alertas</Text>
        <Text style={styles.subtitle}>
          Monitoramento via Satélite, Drone e IoT{' '}
          <Text style={styles.subtitleBadge}>
            • {alertas.filter(a => a.status !== 'resolvido').length} alertas ativos
          </Text>
        </Text>
      </View>

      {/* Filtros — altura fixa para não encolher o FlatList */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          <FilterButton label="Todos" value="todos" />
          <FilterButton label="Abertos" value="aberto" />
          <FilterButton label="Em Andamento" value="em_andamento" />
          <FilterButton label="Resolvidos" value="resolvido" />
        </ScrollView>
      </View>

      {/* Lista de Alertas */}
      <FlatList
        data={filteredAlertas}
        renderItem={renderAlertaCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.emptyText}>Nenhum alerta encontrado</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Modal de Detalhes */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAlerta && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalhes do Alerta</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBadges}>
                  <FonteBadge fonte={selectedAlerta.tipoFonte} />
                  <StatusBadge status={selectedAlerta.severidade} />
                  <AlertStatusBadge status={selectedAlerta.status} />
                </View>

                <Text style={styles.modalAlertTitle}>{selectedAlerta.titulo}</Text>
                <Text style={styles.modalAlertDesc}>{selectedAlerta.descricao}</Text>

                <View style={styles.modalInfoSection}>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Fazenda:</Text>
                    <Text style={styles.modalInfoValue}>
                      {getFazendaNome(selectedAlerta.fazendaId)}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Talhão:</Text>
                    <Text style={styles.modalInfoValue}>
                      {getTalhaoNome(selectedAlerta.fazendaId, selectedAlerta.talhaoId)}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Confiança da IA:</Text>
                    <Text style={styles.modalInfoValue}>{selectedAlerta.confiancaIA}%</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Data:</Text>
                    <Text style={styles.modalInfoValue}>{formatDate(selectedAlerta.data)}</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Alterar Status</Text>
                <View style={styles.statusButtons}>
                  <CustomButton
                    title="Aberto"
                    variant={selectedAlerta.status === 'aberto' ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => handleStatusChange(selectedAlerta.id, 'aberto')}
                    style={styles.statusButton}
                  />
                  <CustomButton
                    title="Em Andamento"
                    variant={selectedAlerta.status === 'em_andamento' ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => handleStatusChange(selectedAlerta.id, 'em_andamento')}
                    style={styles.statusButton}
                  />
                  <CustomButton
                    title="Resolvido"
                    variant={selectedAlerta.status === 'resolvido' ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => handleStatusChange(selectedAlerta.id, 'resolvido')}
                    style={styles.statusButton}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
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
  subtitleBadge: {
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  filtersWrapper: {
    height: 52,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.background,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  separator: {
    height: spacing.md,
  },
  alertaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  alertaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  alertaTitulo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  alertaDescricao: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  alertaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  infoText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flexShrink: 1,
  },
  alertaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confidenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  alertaData: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modalBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalAlertTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalAlertDesc: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalInfoSection: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalInfoLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  modalInfoValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  modalSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusButton: {
    flex: 1,
  },
});

export default AlertasScreen;
