import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { CustomButton } from '../components/CustomButton';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

export function LoginScreen() {
  const { signIn, signUp, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErro(null);

    if (!email || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }

    if (!isLogin && !nome) {
      setErro('Preencha seu nome.');
      return;
    }

    if (!isLogin && !email.endsWith('@agroorbit.com')) {
      setErro('Apenas e-mails com domínio @agroorbit.com podem criar conta.');
      return;
    }

    if (!isLogin && senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const success = isLogin
      ? await signIn(email, senha)
      : await signUp(nome, email, senha);

    if (success) {
      if (!isLogin) {
        Alert.alert('Sucesso', 'Conta criada com sucesso. Faça login para continuar.');
        setNome('');
        setSenha('');
        setIsLogin(true);
      }
    } else {
      setErro(isLogin ? 'E-mail ou senha incorretos.' : 'Erro ao criar conta. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo e Título */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="leaf" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>AgroOrbit</Text>
            <Text style={styles.subtitle}>
              Monitoramento Inteligente de Fazendas
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome completo"
                    placeholderTextColor={colors.textMuted}
                    value={nome}
                    onChangeText={setNome}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor={colors.textMuted}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {erro && (
              <View style={styles.erroContainer}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.erroText}>{erro}</Text>
              </View>
            )}

            <CustomButton
              title={isLogin ? 'Entrar' : 'Criar Conta'}
              onPress={handleSubmit}
              isLoading={isLoading}
              style={styles.submitButton}
            />

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => { setIsLogin(!isLogin); setErro(null); }}
            >
              <Text style={styles.switchText}>
                {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                <Text style={styles.switchTextHighlight}>
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Projeto Acadêmico FIAP - 2026
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  erroContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: `${colors.danger}15`,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  erroText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.danger,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  switchText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  switchTextHighlight: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});

export default LoginScreen;
