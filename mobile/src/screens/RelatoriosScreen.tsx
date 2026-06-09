import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { relatorios, Relatorio } from '../data/mocks';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

const ODS_INFO: Record<number, { nome: string; cor: string }> = {
  2: { nome: 'Fome Zero e Agricultura Sustentável', cor: '#DDA63A' },
  9: { nome: 'Indústria, Inovação e Infraestrutura', cor: '#FD6925' },
  13: { nome: 'Ação Contra a Mudança Global do Clima', cor: '#3F7E44' },
};

export function RelatoriosScreen() {
  const [selectedRelatorio, setSelectedRelatorio] = useState<Relatorio | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (selectedRelatorio) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRelatorio(null)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Relatório</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.relatorioTitulo}>{selectedRelatorio.titulo}</Text>
          <Text style={styles.relatorioSemana}>{selectedRelatorio.semana}</Text>
          <Text style={styles.relatorioResumo}>{selectedRelatorio.resumo}</Text>

          {/* Métricas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas de Monitoramento</Text>
            <View style={styles.metricsGrid}>
              <MetricBox
                icon="earth"
                label="Área Monitorada"
                value={`${selectedRelatorio.metricas.areaMonitorada} ha`}
              />
              <MetricBox
                icon="airplane"
                label="Voos de Drone"
                value={selectedRelatorio.metricas.voosRealizados.toString()}
              />
              <MetricBox
                icon="planet"
                label="Leituras Satélite"
                value={selectedRelatorio.metricas.leiturasSatelite.toString()}
              />
              <MetricBox
                icon="hardware-chip"
                label="Leituras IoT"
                value={selectedRelatorio.metricas.leiturasIoT.toString()}
              />
            </View>
          </View>

          {/* Anomalias Detectadas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anomalias Detectadas pela IA</Text>
            {selectedRelatorio.anomaliasDetectadas.map((anomalia, index) => (
              <View key={index} style={styles.anomaliaCard}>
                <View style={styles.anomaliaHeader}>
                  <View style={styles.anomaliaLeft}>
                    <Ionicons
                      name="warning"
                      size={20}
                      color={colors.warning}
                    />
                    <Text style={styles.anomaliaTipo}>{anomalia.tipo}</Text>
                  </View>
                  <View style={styles.fonteBadge}>
                    <Text style={styles.fonteText}>{anomalia.fonte}</Text>
                  </View>
                </View>
                <View style={styles.anomaliaInfo}>
                  <Text style={styles.anomaliaLabel}>
                    Talhões afetados: <Text style={styles.anomaliaValue}>{anomalia.afetados}</Text>
                  </Text>
                  <Text style={styles.anomaliaLabel}>
                    Confiança IA: <Text style={styles.anomaliaValue}>{anomalia.confiancaIA}%</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Recomendações */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendações</Text>
            {selectedRelatorio.recomendacoes.map((rec, index) => (
              <View key={index} style={styles.recomendacaoItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.recomendacaoText}>{rec}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.geradoEm}>
            Relatório gerado em {formatDate(selectedRelatorio.dataGeracao)}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios Semanais</Text>
        <Text style={styles.subtitle}>Análises automatizadas por IA</Text>
      </View>

      <FlatList
        data={relatorios}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.relatorioCard}
            onPress={() => setSelectedRelatorio(item)}
            activeOpacity={0.7}
          >
            <View style={styles.relatorioCardHeader}>
              <View style={styles.relatorioIcon}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
              </View>
              <View style={styles.relatorioInfo}>
                <Text style={styles.relatorioCardTitle}>{item.titulo}</Text>
                <Text style={styles.relatorioCardSemana}>{item.semana}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
            <Text style={styles.relatorioCardResumo} numberOfLines={2}>
              {item.resumo}
            </Text>
            <View style={styles.relatorioCardFooter}>
              <View style={styles.anomaliaCount}>
                <Ionicons name="warning" size={14} color={colors.warning} />
                <Text style={styles.anomaliaCountText}>
                  {item.anomaliasDetectadas.length} anomalias
                </Text>
              </View>
              <View style={styles.odsIcons}>
                {item.odsRelacionadas.map((odsNum) => (
                  <View
                    key={odsNum}
                    style={[
                      styles.odsIconSmall,
                      { backgroundColor: ODS_INFO[odsNum]?.cor || colors.primary },
                    ]}
                  >
                    <Text style={styles.odsIconText}>{odsNum}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function MetricBox({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
      <Ionicons name={icon} size={24} color={colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  separator: {
    height: spacing.md,
  },
  relatorioCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relatorioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  relatorioIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  relatorioInfo: {
    flex: 1,
  },
  relatorioCardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  relatorioCardSemana: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  relatorioCardResumo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  relatorioCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  anomaliaCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  anomaliaCountText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  odsIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  odsIconSmall: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  odsIconText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  // Detail View
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  detailTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  detailContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  relatorioTitulo: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  relatorioSemana: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  relatorioResumo: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: '48%',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  anomaliaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  anomaliaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  anomaliaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  anomaliaTipo: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  fonteBadge: {
    backgroundColor: `${colors.info}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  fonteText: {
    fontSize: fontSize.xs,
    color: colors.info,
    fontWeight: fontWeight.medium,
  },
  anomaliaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  anomaliaLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  anomaliaValue: {
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  recomendacaoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recomendacaoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  geradoEm: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default RelatoriosScreen;
