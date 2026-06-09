import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { postJavaAnalise, JavaFazendaRequestDTO, JavaAnaliseResponseDTO, registrarFazendaCriada } from '../services/apiService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const CULTURAS = ['Soja','Milho','Algodão','Café','Cana-de-açúcar','Feijão','Trigo','Arroz','Sorgo','Girassol'];

const generateUniqueEmail = () => `fazenda.${Date.now()}@agroorbit.com`;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (result: JavaAnaliseResponseDTO) => void;
};

export function NovaFazendaModal({ visible, onClose, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [estadoPicker, setEstadoPicker] = useState(false);
  const [culturaPicker, setCulturaPicker] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    proprietario: '',
    estado: 'SP',
    municipio: '',
    areaHectares: '',
    culturaPlantada: 'Soja',
    indiceNDVI: '0.45',
    temperaturaMedia: '28',
    umidadeSolo: '35',
    irradianciaSolar: '750',
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.proprietario.trim() || !form.municipio.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, proprietário e município.');
      return;
    }

    setIsLoading(true);
    let emailUsado = generateUniqueEmail();

    const buildPayload = (email: string): JavaFazendaRequestDTO => ({
      nome: form.nome.trim(),
      proprietario: form.proprietario.trim(),
      email,
      estado: form.estado,
      municipio: form.municipio.trim(),
      areaHectares: Number(form.areaHectares) || 100,
      culturaPlantada: form.culturaPlantada,
      latitude: -15.77,
      longitude: -47.92,
      indiceNDVI: Number(form.indiceNDVI),
      temperaturaMedia: Number(form.temperaturaMedia),
      umidadeSolo: Number(form.umidadeSolo),
      irradianciaSolar: Number(form.irradianciaSolar),
    });

    try {
      let result: JavaAnaliseResponseDTO;
      try {
        result = await postJavaAnalise(buildPayload(emailUsado));
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('Fazenda já cadastrada')) {
          emailUsado = generateUniqueEmail();
          result = await postJavaAnalise(buildPayload(emailUsado));
        } else {
          throw error;
        }
      }

      await registrarFazendaCriada(emailUsado, result.nivelRisco, form.nome.trim());
      onClose();
      onSuccess?.(result);
      Alert.alert('Análise concluída', `Risco: ${result.nivelRisco} — Score: ${result.scoreRisco}`);

      // Reset form
      setForm({
        nome: '',
        proprietario: '',
        estado: 'SP',
        municipio: '',
        areaHectares: '',
        culturaPlantada: 'Soja',
        indiceNDVI: '0.45',
        temperaturaMedia: '28',
        umidadeSolo: '35',
        irradianciaSolar: '750',
      });
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao enviar análise.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Nova fazenda</Text>
                <Text style={styles.subtitle}>Preencha os dados para análise de risco</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Identificação */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location-outline" size={14} color={colors.primary} />
                  <Text style={styles.sectionLabel}>Identificação</Text>
                </View>

                <Text style={styles.fieldLabel}>Nome da fazenda *</Text>
                <TextInput style={styles.fieldInput} value={form.nome} onChangeText={(v) => handleChange('nome', v)} placeholder="Ex: Fazenda Santa Clara" placeholderTextColor={colors.textMuted} />

                <Text style={styles.fieldLabel}>Proprietário *</Text>
                <TextInput style={styles.fieldInput} value={form.proprietario} onChangeText={(v) => handleChange('proprietario', v)} placeholder="Nome completo" placeholderTextColor={colors.textMuted} />

                <View style={styles.fieldRow}>
                  <View style={styles.fieldColumn}>
                    <Text style={styles.fieldLabel}>Estado *</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setEstadoPicker(true)}>
                      <Text style={styles.dropdownValue}>{form.estado}</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.fieldColumn}>
                    <Text style={styles.fieldLabel}>Município *</Text>
                    <TextInput style={styles.fieldInput} value={form.municipio} onChangeText={(v) => handleChange('municipio', v)} placeholder="Ex: Ribeirão Preto" placeholderTextColor={colors.textMuted} />
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldColumn}>
                    <Text style={styles.fieldLabel}>Área (ha)</Text>
                    <TextInput style={styles.fieldInput} value={form.areaHectares} onChangeText={(v) => handleChange('areaHectares', v)} placeholder="Ex: 500" keyboardType="numeric" placeholderTextColor={colors.textMuted} />
                  </View>
                  <View style={styles.fieldColumn}>
                    <Text style={styles.fieldLabel}>Cultura *</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setCulturaPicker(true)}>
                      <Text style={styles.dropdownValue}>{form.culturaPlantada}</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Dados de Satélite */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="satellite-outline" size={14} color={colors.fonteSatelite} />
                  <Text style={[styles.sectionLabel, { color: colors.fonteSatelite }]}>Dados de satélite</Text>
                </View>
                <View style={styles.hintRow}>
                  <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.hintText}>Valores pré-preenchidos. Ajuste se tiver dados reais.</Text>
                </View>

                <View style={styles.sateliteGrid}>
                  <View style={styles.sateliteCard}>
                    <View style={styles.sateliteCardHeader}>
                      <Ionicons name="leaf-outline" size={16} color={colors.success} />
                      <Text style={styles.sateliteCardTitle}>NDVI</Text>
                      <Text style={styles.sateliteCardRange}>0 – 1</Text>
                    </View>
                    <TextInput style={styles.sateliteInput} value={form.indiceNDVI} onChangeText={(v) => handleChange('indiceNDVI', v)} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
                    <Text style={styles.sateliteHint}>{'< 0.2 crítico  •  > 0.5 normal'}</Text>
                  </View>

                  <View style={styles.sateliteCard}>
                    <View style={styles.sateliteCardHeader}>
                      <Ionicons name="thermometer-outline" size={16} color={colors.warning} />
                      <Text style={styles.sateliteCardTitle}>Temperatura</Text>
                      <Text style={styles.sateliteCardRange}>°C</Text>
                    </View>
                    <TextInput style={styles.sateliteInput} value={form.temperaturaMedia} onChangeText={(v) => handleChange('temperaturaMedia', v)} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
                    <Text style={styles.sateliteHint}>{'>35 alerta  •  >40 crítico'}</Text>
                  </View>

                  <View style={styles.sateliteCard}>
                    <View style={styles.sateliteCardHeader}>
                      <Ionicons name="water-outline" size={16} color={colors.info} />
                      <Text style={styles.sateliteCardTitle}>Umidade solo</Text>
                      <Text style={styles.sateliteCardRange}>%</Text>
                    </View>
                    <TextInput style={styles.sateliteInput} value={form.umidadeSolo} onChangeText={(v) => handleChange('umidadeSolo', v)} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
                    <Text style={styles.sateliteHint}>{'< 15 crítico  •  < 30 alerta'}</Text>
                  </View>

                  <View style={styles.sateliteCard}>
                    <View style={styles.sateliteCardHeader}>
                      <Ionicons name="sunny-outline" size={16} color={colors.warning} />
                      <Text style={styles.sateliteCardTitle}>Irradiância</Text>
                      <Text style={styles.sateliteCardRange}>W/m²</Text>
                    </View>
                    <TextInput style={styles.sateliteInput} value={form.irradianciaSolar} onChangeText={(v) => handleChange('irradianciaSolar', v)} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
                    <Text style={styles.sateliteHint}>Típico: 600 – 900</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="analytics-outline" size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>Enviar análise</Text>
                    </View>
                  )}
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Picker Estado */}
      <Modal visible={estadoPicker} animationType="fade" transparent onRequestClose={() => setEstadoPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setEstadoPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Selecione o estado</Text>
            <FlatList
              data={ESTADOS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, form.estado === item && styles.pickerItemSelected]}
                  onPress={() => { handleChange('estado', item); setEstadoPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, form.estado === item && styles.pickerItemTextSelected]}>{item}</Text>
                  {form.estado === item && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Picker Cultura */}
      <Modal visible={culturaPicker} animationType="fade" transparent onRequestClose={() => setCulturaPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setCulturaPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Selecione a cultura</Text>
            <FlatList
              data={CULTURAS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, form.culturaPlantada === item && styles.pickerItemSelected]}
                  onPress={() => { handleChange('culturaPlantada', item); setCulturaPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, form.culturaPlantada === item && styles.pickerItemTextSelected]}>{item}</Text>
                  {form.culturaPlantada === item && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldColumn: {
    flex: 1,
  },
  dropdown: {
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
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  hintText: {
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
  sateliteHint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
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
});
