import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getFazendasCriadas } from '../services/apiService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

type StatusMissao = 'concluida' | 'em_andamento' | 'agendada';

interface Anomalia {
  tipo: string;
  confiancaIA: number;
  area: string;
  recomendacao: string;
}

interface Missao {
  id: string;
  fazenda: string;
  talhao: string;
  data: string;
  status: StatusMissao;
  anomalias: Anomalia[];
  duracao: string;
  cobertura: string;
}

const missoes: Missao[] = [
  {
    id: 'd1',
    fazenda: 'Fazenda Nova Esperança',
    talhao: 'Talhão A',
    data: '2026-06-01T08:00:00Z',
    status: 'concluida',
    anomalias: [
      {
        tipo: 'Falha de Vegetação',
        confiancaIA: 89,
        area: '12 ha',
        recomendacao: 'Replantio recomendado nas áreas com falha detectada.',
      },
    ],
    duracao: '42 min',
    cobertura: '700 ha',
  },
  {
    id: 'd2',
    fazenda: 'Fazenda Boa Vista',
    talhao: 'Talhão Principal',
    data: '2026-06-01T10:30:00Z',
    status: 'em_andamento',
    anomalias: [],
    duracao: '--',
    cobertura: '500 ha',
  },
  {
    id: 'd3',
    fazenda: 'Fazenda Santa Clara',
    talhao: 'Talhão Leste',
    data: '2026-06-02T06:00:00Z',
    status: 'agendada',
    anomalias: [],
    duracao: '--',
    cobertura: '400 ha',
  },
  {
    id: 'd4',
    fazenda: 'Fazenda Santa Clara',
    talhao: 'Talhão Norte',
    data: '2025-12-20T07:00:00Z',
    status: 'concluida',
    anomalias: [],
    duracao: '28 min',
    cobertura: '320 ha',
  },
];

const getStatusColor = (status: StatusMissao) => {
  switch (status) {
    case 'concluida': return colors.success;
    case 'em_andamento': return colors.info;
    case 'agendada': return colors.textMuted;
  }
};

const getStatusLabel = (status: StatusMissao) => {
  switch (status) {
    case 'concluida': return 'Concluída';
    case 'em_andamento': return 'Em Andamento';
    case 'agendada': return 'Agendada';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function DroneScreen() {
  const [selectedMissao, setSelectedMissao] = useState<Missao | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [missoesExtras, setMissoesExtras] = useState<Missao[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const carregarFazendasCriadas = useCallback(async () => {
    const criadas = await getFazendasCriadas();
    const novas: Missao[] = criadas.map((f, i) => ({
      id: `criada-${i}-${f.email}`,
      fazenda: f.nome || f.email.split('@')[0],
      talhao: 'Talhão Principal',
      data: f.criadaEm || new Date().toISOString(),
      status: 'agendada' as StatusMissao,
      anomalias: [],
      duracao: '--',
      cobertura: '--',
    }));
    setMissoesExtras(novas);
    setIsRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { carregarFazendasCriadas(); }, [carregarFazendasCriadas]));

  const todasMissoes = [...missoesExtras, ...missoes];

  const renderMissaoCard = ({ item: missao }: { item: Missao }) => {
    const statusColor = getStatusColor(missao.status);
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftWidth: 4, borderLeftColor: statusColor }]}
        onPress={() => {
          setSelectedMissao(missao);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${statusColor}26` }]}>
            <Ionicons name="airplane" size={20} color={statusColor} />
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}26` }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>
              {getStatusLabel(missao.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.cardFazenda}>{missao.fazenda}</Text>
        <Text style={styles.cardTalhao}>{missao.talhao}</Text>

        <View style={styles.cardInfoRow}>
          <View style={styles.infoChip}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.infoChipText}>{formatDate(missao.data)}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.infoChipText}>{missao.duracao}</Text>
          </View>
        </View>

        {missao.status === 'concluida' && missao.anomalias.length > 0 && (
          <View style={styles.anomaliasBadge}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
            <Text style={styles.anomaliasText}>
              {missao.anomalias.length} anomalia{missao.anomalias.length > 1 ? 's' : ''} detectada{missao.anomalias.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Missões de Drone</Text>
        <Text style={styles.subtitle}>Varredura e análise de talhões</Text>
      </View>

      <FlatList
        data={todasMissoes}
        renderItem={renderMissaoCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); carregarFazendasCriadas(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
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
            {selectedMissao && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Relatório da Missão</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Fazenda</Text>
                    <Text style={styles.infoGridValue}>{selectedMissao.fazenda}</Text>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Talhão</Text>
                    <Text style={styles.infoGridValue}>{selectedMissao.talhao}</Text>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Data</Text>
                    <Text style={styles.infoGridValue}>{formatDate(selectedMissao.data)}</Text>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Duração</Text>
                    <Text style={styles.infoGridValue}>{selectedMissao.duracao}</Text>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Cobertura</Text>
                    <Text style={styles.infoGridValue}>{selectedMissao.cobertura}</Text>
                  </View>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoGridLabel}>Status</Text>
                    <Text
                      style={[
                        styles.infoGridValue,
                        { color: getStatusColor(selectedMissao.status) },
                      ]}
                    >
                      {getStatusLabel(selectedMissao.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Análise de Anomalias</Text>

                {selectedMissao.anomalias.length > 0 ? (
                  selectedMissao.anomalias.map((anomalia, idx) => (
                    <View key={idx} style={styles.anomaliaCard}>
                      <View style={styles.anomaliaHeader}>
                        <Ionicons name="alert-circle" size={16} color={colors.warning} />
                        <Text style={styles.anomaliaTipo}>{anomalia.tipo}</Text>
                      </View>
                      <View style={styles.anomaliaInfoRow}>
                        <Text style={styles.anomaliaLabel}>Confiança IA:</Text>
                        <Text style={styles.anomaliaValor}>{anomalia.confiancaIA}%</Text>
                      </View>
                      <View style={styles.anomaliaInfoRow}>
                        <Text style={styles.anomaliaLabel}>Área afetada:</Text>
                        <Text style={styles.anomaliaValor}>{anomalia.area}</Text>
                      </View>
                      <View style={styles.recomendacaoContainer}>
                        <Text style={styles.anomaliaLabel}>Recomendação:</Text>
                        <Text style={styles.recomendacaoText}>{anomalia.recomendacao}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.semAnomalias}>
                    {selectedMissao.status === 'concluida' ? (
                      <>
                        <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                        <Text style={styles.semAnomaliasText}>
                          Nenhuma anomalia detectada
                        </Text>
                      </>
                    ) : selectedMissao.status === 'agendada' ? (
                      <TouchableOpacity style={styles.iniciarBtn} disabled>
                        <Ionicons name="airplane-outline" size={18} color={colors.background} />
                        <Text style={styles.iniciarBtnText}>Iniciar Missão</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.semAnomaliasText}>
                        Dados disponíveis após conclusão da missão.
                      </Text>
                    )}
                  </View>
                )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  agendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 4,
  },
  agendarBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  separator: {
    height: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  cardFazenda: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  cardTalhao: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardInfoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoChipText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  anomaliasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.warning}1A`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  anomaliasText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.medium,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoGridItem: {
    width: '47%',
    gap: 2,
  },
  infoGridLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  infoGridValue: {
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
  anomaliaCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    gap: spacing.xs,
  },
  anomaliaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  anomaliaTipo: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  anomaliaInfoRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  anomaliaLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  anomaliaValor: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  recomendacaoContainer: {
    gap: 2,
    marginTop: spacing.xs,
  },
  recomendacaoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  semAnomalias: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  semAnomaliasText: {
    fontSize: fontSize.md,
    color: colors.success,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  iniciarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  iniciarBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.background,
  },
});

export default DroneScreen;
