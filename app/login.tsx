import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../src/api/client';
import { AnimatedPressable } from '../src/catalog/shared/AnimatedPressable';
import { useLogin } from '../src/features/session/useLogin';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

/**
 * Real login (SPECS.md §12, amitie/backend `POST /api/login`): username +
 * password are checked against a real password hash for one of the two
 * seeded personas (`demo`/`u_ana`, `accesible`/`u_don`). Not a general auth
 * system — no signup/registration/password-reset — but credentials are
 * genuinely verified, not just a visual gate. Ported from the team's Figma
 * design (Banorte brand) — see CHANGELOG.md's Figma-to-code entry.
 */
export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useLogin();

  const handleLogin = () => {
    login({ username, password }, { onSuccess: () => router.replace('/inicio') });
  };

  const errorMessage =
    error instanceof ApiError && error.status === 401
      ? 'Usuario o contraseña incorrectos.'
      : error
        ? 'Error en Servidor'
        : null;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.brand.primary, colors.brand.primaryDark]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.logoRow}>
            <Text style={styles.logoText}>Banorte</Text>
            <View style={styles.logoBar} />
          </Animated.View>
          <Animated.Text entering={FadeInUp.duration(300).delay(80)} style={styles.tagline}>
            EL BANCO FUERTE DE MÉXICO
          </Animated.Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.cardWrapper}
      >
        <Animated.View entering={FadeInUp.duration(280).delay(60)} style={styles.card}>
          <Text style={styles.cardTitle}>Inicia Sesión</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Usuario o Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu usuario"
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={colors.text.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={styles.eyeButton}
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text.secondary} />
              </Pressable>
            </View>
          </View>

          {/* <Pressable style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>¿Olvidé mi contraseña?</Text>
          </Pressable> */}

          <AnimatedPressable style={styles.loginButton} onPress={handleLogin} disabled={isPending}>
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar de forma segura</Text>
            )}
          </AnimatedPressable>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {/* <Text style={styles.mockHint}>Demo: demo / accesible — contraseña demo1234</Text> */}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },
  header: { height: 260, paddingHorizontal: spacing.xxl },
  headerContent: { flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.xxl, gap: spacing.xs },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoText: { fontSize: 38, fontWeight: '900', color: colors.text.onBrand },
  logoBar: { width: 8, height: 38, backgroundColor: colors.text.onBrand, borderRadius: 4 },
  tagline: { fontSize: 14, fontWeight: '500', color: colors.text.onBrandMuted, textTransform: 'uppercase' },

  cardWrapper: { flex: 1, marginTop: -16 },
  card: {
    flex: 1,
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.xl,
  },
  cardTitle: { ...typography.h2, color: colors.text.primary },

  field: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text.secondary },
  input: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
  },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: 'absolute', right: spacing.lg },

  forgotPassword: { alignSelf: 'flex-end' },
  forgotPasswordText: { ...typography.bodyStrong, color: colors.text.link, fontSize: 14 },

  loginButton: {
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: { ...typography.button, color: colors.text.onBrand },

  mockHint: { ...typography.body, color: colors.text.secondary, fontSize: 12, textAlign: 'center' },
  errorText: { ...typography.body, color: colors.text.danger, fontSize: 13, textAlign: 'center' },
});
