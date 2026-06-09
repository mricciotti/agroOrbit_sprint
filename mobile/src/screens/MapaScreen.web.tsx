import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fazendas } from '../data/mocks';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';

// Dimensões do container do mapa
// Limites geográficos do Brasil + margem
const LNG_MIN = -74.5;
const LNG_MAX = -28.0;
const LAT_MAX = 5.5;
const LAT_MIN = -34.0;

// viewBox efetivo: x:10→500, y:12→492 (490×480)
function lngToX(lng: number) {
  return 10 + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 490;
}
function latToY(lat: number) {
  return 12 + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 480;
}

const STATUS_COLOR: Record<string, string> = {
  normal: '#22C55E',
  atencao: '#F59E0B',
  critico: '#EF4444',
};
const STATUS_LABEL: Record<string, string> = {
  normal: 'Normal',
  atencao: 'Atenção',
  critico: 'Crítico',
};

// Contorno do Brasil — viewBox 0 0 760 680
// Traçado fiel à forma real: Amazônia (topo plano), saliência Nordeste, costa leste, Sul cônico, Acre (recuo SO)
const BRASIL_PATH = `
M 267.6,486.3
L 264.4,479.6 L 269.6,474.0 L 262.7,466.0 L 225.1,443.1 L 217.4,444.3
L 246.5,416.7 L 264.4,405.4 L 264.6,396.0 L 258.7,389.1 L 252.8,391.4
L 256.8,371.1 L 243.7,370.3 L 239.0,351.4 L 213.7,348.3 L 214.5,332.2
L 211.0,325.6 L 214.7,323.2 L 213.6,316.5 L 218.9,302.0 L 216.1,294.6
L 209.6,291.3 L 210.1,279.8 L 187.4,279.3 L 182.9,265.6 L 186.4,265.4
L 183.4,250.0 L 169.1,246.6 L 151.5,236.4 L 138.3,234.5 L 125.5,223.9
L 126.2,202.6 L 110.8,204.6 L 91.6,217.4 L 64.6,217.3 L 65.4,199.3
L 55.7,206.3 L 45.3,206.0 L 40.8,199.7 L 33.0,199.0 L 35.5,193.9
L 24.0,176.1 L 27.1,168.9 L 34.2,165.5 L 36.9,149.5 L 61.7,137.4
L 72.4,138.0 L 78.0,100.4 L 70.9,89.4 L 70.9,80.8 L 80.0,80.0
L 80.4,75.5 L 73.4,74.3 L 73.3,66.9 L 96.3,67.2 L 100.2,63.1
L 105.8,73.8 L 114.6,78.6 L 123.7,77.8 L 149.5,61.2 L 138.9,57.7
L 137.7,42.3 L 132.4,39.2 L 152.8,42.6 L 177.9,33.6 L 182.2,29.0
L 180.7,25.7 L 189.5,27.9 L 188.0,33.1 L 194.8,40.4 L 189.6,54.6
L 193.5,66.0 L 200.8,71.6 L 206.6,72.2 L 220.8,64.1 L 236.7,65.7
L 236.9,57.5 L 272.8,62.1 L 287.9,38.0 L 291.9,37.5 L 301.5,64.7
L 307.8,66.6 L 308.1,74.8 L 299.3,84.5 L 302.9,88.1 L 323.8,90.0
L 324.2,101.8 L 333.2,94.0 L 367.7,105.5 L 373.5,112.4 L 371.6,119.0
L 385.3,115.3 L 408.3,121.6 L 426.0,121.1 L 458.5,144.2 L 477.7,148.0
L 482.0,151.8 L 488.0,174.0 L 483.3,193.5 L 441.4,241.5 L 434.4,298.4
L 428.5,318.8 L 416.6,334.3 L 414.5,346.5 L 405.0,351.6 L 402.2,358.7
L 370.8,363.2 L 335.3,381.3 L 325.3,393.0 L 325.5,408.4 L 320.7,426.1
Z
`;

export function MapaScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedFazenda = selectedId ? fazendas.find((f) => f.id === selectedId) ?? null : null;

  const totalNormais = fazendas.filter((f) => f.statusGeral === 'normal').length;
  const totalAlertas = fazendas.filter((f) => f.statusGeral === 'atencao').length;
  const totalCriticos = fazendas.filter((f) => f.statusGeral === 'critico').length;
  const totalHectares = fazendas.reduce((sum, f) => sum + f.area, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Mapa de Fazendas</Text>
        </View>
        <Text style={styles.headerSub}>{fazendas.length} fazendas</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Mapa */}
        <View style={styles.mapWrapper}>
          {/* @ts-ignore */}
          <svg
            viewBox="10 12 490 480"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%', display: 'block' } as React.CSSProperties}
          >
            {/* Oceano */}
            {/* @ts-ignore */}
            <rect x="10" y="12" width="490" height="480" fill="#0a1628" rx="12" />

            {/* Brasil */}
            {/* @ts-ignore */}
            <path d={BRASIL_PATH} fill="#1e3a2f" stroke="#22C55E" strokeWidth="2" strokeLinejoin="round" />

            {/* Pins */}
            {fazendas.map((f) => {
              const cx = lngToX(f.localizacao.longitude);
              const cy = latToY(f.localizacao.latitude);
              const color = STATUS_COLOR[f.statusGeral] ?? '#8B949E';
              const isSelected = selectedId === f.id;
              const r = isSelected ? 14 : 10;

              return (
                // @ts-ignore
                <g
                  key={f.id}
                  onClick={() => setSelectedId(selectedId === f.id ? null : f.id)}
                  style={{ cursor: 'pointer' } as React.CSSProperties}
                >
                  {isSelected && (
                    // @ts-ignore
                    <circle cx={cx} cy={cy} r={22} fill={color} opacity={0.2} />
                  )}
                  {/* @ts-ignore */}
                  <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.3} />
                  {/* @ts-ignore */}
                  <circle cx={cx} cy={cy} r={isSelected ? 8 : 6} fill={color} />
                  {/* @ts-ignore */}
                  <circle cx={cx} cy={cy} r={2.5} fill="#fff" opacity={0.9} />
                  {/* @ts-ignore */}
                  <text
                    x={cx}
                    y={cy + (isSelected ? 28 : 22)}
                    textAnchor="middle"
                    fill={color}
                    fontSize={isSelected ? 11 : 9}
                    fontWeight="600"
                    style={{ fontFamily: 'system-ui, sans-serif' } as React.CSSProperties}
                  >
                    {f.nome.replace('Fazenda ', '')}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legenda */}
          <View style={styles.legenda}>
            {[['#22C55E', 'Normal'], ['#F59E0B', 'Atenção'], ['#EF4444', 'Crítico']].map(([cor, label]) => (
              <View key={label} style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: cor }]} />
                <Text style={styles.legendaText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detalhe ao clicar */}
        {selectedFazenda && (
          <View style={[styles.detalheCard, { borderColor: STATUS_COLOR[selectedFazenda.statusGeral] }]}>
            <View style={styles.detalheHeader}>
              <Text style={styles.detalheTitle}>{selectedFazenda.nome}</Text>
              <TouchableOpacity onPress={() => setSelectedId(null)}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.detalheGrid}>
              <View style={styles.detalheItem}>
                <Text style={[styles.detalheVal, { color: STATUS_COLOR[selectedFazenda.statusGeral] }]}>
                  {STATUS_LABEL[selectedFazenda.statusGeral]}
                </Text>
                <Text style={styles.detalheLabel}>status</Text>
              </View>
              <View style={styles.detalheItem}>
                <Text style={styles.detalheVal}>{selectedFazenda.area.toLocaleString('pt-BR')}</Text>
                <Text style={styles.detalheLabel}>hectares</Text>
              </View>
              <View style={styles.detalheItem}>
                <Text style={styles.detalheVal}>{selectedFazenda.talhoes.length}</Text>
                <Text style={styles.detalheLabel}>talhões</Text>
              </View>
            </View>
            <View style={styles.coordRow}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={styles.coordText}>
                {selectedFazenda.localizacao.latitude.toFixed(4)}, {selectedFazenda.localizacao.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        )}

        {/* Resumo */}
        <View style={styles.resumoCard}>
          <View style={styles.resumoItem}>
            <Text style={[styles.resumoVal, { color: colors.primary }]}>{totalNormais}</Text>
            <Text style={styles.resumoLabel}>Normais</Text>
          </View>
          <View style={styles.resumoDivider} />
          <View style={styles.resumoItem}>
            <Text style={[styles.resumoVal, { color: '#F59E0B' }]}>{totalAlertas}</Text>
            <Text style={styles.resumoLabel}>Atenção</Text>
          </View>
          <View style={styles.resumoDivider} />
          <View style={styles.resumoItem}>
            <Text style={[styles.resumoVal, { color: colors.danger }]}>{totalCriticos}</Text>
            <Text style={styles.resumoLabel}>Críticas</Text>
          </View>
          <View style={styles.resumoDivider} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoVal}>{totalHectares.toLocaleString('pt-BR')}</Text>
            <Text style={styles.resumoLabel}>Hectares</Text>
          </View>
        </View>

        {/* Lista de fazendas clicáveis */}
        <Text style={styles.listaTitle}>Selecionar fazenda</Text>
        {fazendas.map((f) => {
          const color = STATUS_COLOR[f.statusGeral];
          const isSelected = selectedId === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.fazendaRow, { borderLeftColor: color }, isSelected && styles.fazendaRowSelected]}
              onPress={() => setSelectedId(isSelected ? null : f.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.rowDot, { backgroundColor: color }]} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowNome}>{f.nome}</Text>
                <Text style={styles.rowSub}>{f.area.toLocaleString('pt-BR')} ha • {f.talhoes.length} talhões</Text>
              </View>
              <View style={[styles.rowBadge, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.rowBadgeText, { color }]}>{STATUS_LABEL[f.statusGeral]}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerSub: { fontSize: fontSize.sm, color: colors.textMuted },
  scrollContent: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xxl },
  mapWrapper: {
    width: '100%',
    aspectRatio: 490 / 480,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    marginBottom: spacing.md,
  },
  legenda: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(15,24,40,0.92)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaDot: { width: 8, height: 8, borderRadius: 4 },
  legendaText: { fontSize: fontSize.xs, color: colors.textPrimary },
  detalheCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  detalheHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detalheTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.textPrimary },
  detalheGrid: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: 'space-around',
  },
  detalheItem: { alignItems: 'center' },
  detalheVal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },
  detalheLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coordText: { fontSize: fontSize.xs, color: colors.textMuted },
  resumoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resumoItem: { alignItems: 'center' },
  resumoVal: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  resumoLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  resumoDivider: { width: 1, height: 32, backgroundColor: colors.border },
  listaTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  fazendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  fazendaRowSelected: { backgroundColor: colors.backgroundSecondary },
  rowDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  rowInfo: { flex: 1 },
  rowNome: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  rowSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  rowBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  rowBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});

export default MapaScreen;
