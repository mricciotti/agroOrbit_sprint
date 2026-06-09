import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { fazendas } from '../data/mocks';
import { getFazendasCriadas, getJavaFazenda } from '../services/apiService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface PinFazenda {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  status: string;
  area: number;
}

const getPinColor = (status: string) => {
  switch (status) {
    case 'critico': return '#EF4444';
    case 'atencao': return '#F59E0B';
    default: return '#22C55E';
  }
};

const BRASIL_REGION: Region = {
  latitude: -12.0,
  longitude: -52.0,
  latitudeDelta: 42,
  longitudeDelta: 42,
};

export function MapaScreen() {
  const mapRef = useRef<MapView>(null);
  const [apiPins, setApiPins] = useState<PinFazenda[]>([]);

  useEffect(() => {
    const loadApiPins = async () => {
      try {
        const criadas = await getFazendasCriadas();
        const pinsCarregados: PinFazenda[] = [];
        for (const entrada of criadas) {
          try {
            const fazenda = await getJavaFazenda(entrada.email);
            if (fazenda.latitude != null && fazenda.longitude != null) {
              pinsCarregados.push({
                id: `api-${entrada.email}`,
                nome: fazenda.nome ?? 'Fazenda API',
                latitude: fazenda.latitude,
                longitude: fazenda.longitude,
                status: 'normal',
                area: fazenda.areaHectares ?? 0,
              });
            }
          } catch {
            // erro silencioso por fazenda individual
          }
        }
        setApiPins(pinsCarregados);
      } catch {
        // erro silencioso geral
      }
    };
    loadApiPins();
  }, []);

  const mockPins: PinFazenda[] = fazendas.map((f) => ({
    id: f.id,
    nome: f.nome,
    latitude: f.localizacao.latitude,
    longitude: f.localizacao.longitude,
    status: f.statusGeral,
    area: f.area,
  }));

  const allPins: PinFazenda[] = [...mockPins, ...apiPins];

  const totalHectares = allPins.reduce((acc, p) => acc + p.area, 0);
  const totalCriticas = allPins.filter((p) => p.status === 'critico').length;

  const resetZoom = () => {
    mapRef.current?.animateToRegion(BRASIL_REGION, 600);
  };

  const focusPin = (pin: PinFazenda) => {
    mapRef.current?.animateToRegion({
      latitude: pin.latitude,
      longitude: pin.longitude,
      latitudeDelta: 1.5,
      longitudeDelta: 1.5,
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mapa de Fazendas</Text>
        <Text style={styles.subtitle}>Visão geoespacial das propriedades</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType="standard"
          initialRegion={BRASIL_REGION}
          minZoomLevel={3}
          maxZoomLevel={18}
        >
          {allPins.map((pin) => (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              pinColor={getPinColor(pin.status)}
              onCalloutPress={() => focusPin(pin)}
            >
              <Callout tooltip={false}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutNome}>{pin.nome}</Text>
                  <Text style={styles.calloutStatus} numberOfLines={1}>
                    {pin.status === 'critico' ? '🔴 Crítico' : pin.status === 'atencao' ? '🟡 Atenção' : '🟢 Normal'}
                  </Text>
                  <Text style={styles.calloutArea}>{pin.area.toLocaleString('pt-BR')} ha</Text>
                  <Text style={styles.calloutToque}>Toque para aproximar</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Legenda */}
        <View style={styles.legenda}>
          <View style={styles.legendaItem}>
            <View style={[styles.legendaDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendaText}>Normal</Text>
          </View>
          <View style={styles.legendaItem}>
            <View style={[styles.legendaDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendaText}>Atenção</Text>
          </View>
          <View style={styles.legendaItem}>
            <View style={[styles.legendaDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendaText}>Crítico</Text>
          </View>
        </View>

        {/* Controles de zoom */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={resetZoom}>
            <Ionicons name="globe-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={async () => {
              const cam = await mapRef.current?.getCamera();
              if (cam) mapRef.current?.animateCamera({ ...cam, zoom: (cam.zoom ?? 5) + 1 }, { duration: 250 });
            }}
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={async () => {
              const cam = await mapRef.current?.getCamera();
              if (cam) mapRef.current?.animateCamera({ ...cam, zoom: (cam.zoom ?? 5) - 1 }, { duration: 250 });
            }}
          >
            <Ionicons name="remove" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Dica */}
        <View style={styles.dica}>
          <Text style={styles.dicaText}>Toque num pin para aproximar</Text>
        </View>
      </View>

      {/* Card de resumo */}
      <View style={styles.resumoCard}>
        <View style={styles.resumoItem}>
          <Ionicons name="business-outline" size={20} color={colors.primary} />
          <Text style={styles.resumoValor}>{allPins.length}</Text>
          <Text style={styles.resumoLabel}>Fazendas</Text>
        </View>
        <View style={styles.resumoDivider} />
        <View style={styles.resumoItem}>
          <Ionicons name="map-outline" size={20} color={colors.info} />
          <Text style={styles.resumoValor}>{totalHectares.toLocaleString('pt-BR')}</Text>
          <Text style={styles.resumoLabel}>Hectares</Text>
        </View>
        <View style={styles.resumoDivider} />
        <View style={styles.resumoItem}>
          <Ionicons name="warning-outline" size={20} color={colors.danger} />
          <Text style={[styles.resumoValor, totalCriticas > 0 && { color: colors.danger }]}>
            {totalCriticas}
          </Text>
          <Text style={styles.resumoLabel}>Críticas</Text>
        </View>
      </View>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  legenda: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(28,33,40,0.92)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendaDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  legendaText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
  },
  calloutContainer: {
    padding: spacing.sm,
    minWidth: 160,
    maxWidth: 220,
  },
  calloutNome: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#111',
    marginBottom: 4,
  },
  calloutStatus: {
    fontSize: fontSize.xs,
    color: '#333',
    marginBottom: 2,
  },
  calloutArea: {
    fontSize: fontSize.xs,
    color: '#555',
    marginBottom: 4,
  },
  calloutToque: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
  },
  resumoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  resumoItem: {
    alignItems: 'center',
    gap: 4,
  },
  resumoValor: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  resumoLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  resumoDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  zoomControls: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    backgroundColor: 'rgba(28,33,40,0.92)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  dica: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(28,33,40,0.85)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dicaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default MapaScreen;
