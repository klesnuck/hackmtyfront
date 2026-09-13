import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { A2UISurface, useA2UIStore } from '../../src/a2ui';
import { createLoan, sendMessage } from '../../src/api/endpoints';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { AnimatedOrb } from '../../src/features/assistant-orb/AnimatedOrb';
import { detectsLoanIntent } from '../../src/features/loans/detectsLoanIntent';
import { useLoanConsult } from '../../src/features/loans/useLoanConsult';
import { playAudioAsset } from '../../src/features/voice/audioCache';
import { RecordingPulse } from '../../src/features/voice/RecordingPulse';
import { useSpeechToText } from '../../src/features/voice/useSpeechToText';
import { useActiveCatalogId, useSessionStore } from '../../src/state/session.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

type Turn =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'agent'; text?: string; surfaceId?: string }
  | { id: string; role: 'system'; text: string };

const INTENT_PROMPTS: Record<string, string> = {
  'la-mesa': 'Quiero ayuda para reestructurar mi deuda.',
  'saving-bags': 'Quiero empezar a ahorrar para una meta.',
  'prestamo-nuevo': 'Quiero solicitar un préstamo nuevo.',
};

/**
 * Where the actual product happens: every generated surface renders here,
 * inline in the conversation, via the SAME <A2UISurface /> used by the Kill
 * Test (MOBILE_ARCHITECTURE.md §8). This screen owns turn-taking and voice
 * capture; it never inspects or special-cases what the agent generates.
 */
export default function AsistenteScreen() {
  const insets = useSafeAreaInsets();
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const sessionId = useSessionStore((s) => s.sessionId);
  const userId = useSessionStore((s) => s.userId);
  const catalogId = useActiveCatalogId();
  const applyMessages = useA2UIStore((s) => s.applyMessages);
  const speech = useSpeechToText();
  const loanConsult = useLoanConsult();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'la-mesa' | 'loans'>('la-mesa');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [manualActive, setManualActive] = useState(false);
  const [pendingLoanRequest, setPendingLoanRequest] = useState<{ amount: number; months?: number } | null>(null);
  const [isConfirmingLoan, setIsConfirmingLoan] = useState(false);

  const listRef = useRef<FlatList<Turn>>(null);
  const textInputRef = useRef<TextInput>(null);
  const focusDraftOnActive = useRef(false);
  const hasSentInitialIntent = useRef(false);
  const isPressingMicRef = useRef(false);

  const baseUrl = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? '';
  const hasIntentPrompt = Boolean(intent && INTENT_PROMPTS[intent]);
  const isActive = turns.length > 0 || manualActive || hasIntentPrompt;

  useEffect(() => {
    loanConsult.setBaseUrl(baseUrl);
  }, [baseUrl, loanConsult]);

  useFocusEffect(
    useCallback(() => {
      if (turns.length === 0 && !hasIntentPrompt) {
        setManualActive(false);
      }
    }, [turns.length, hasIntentPrompt]),
  );

  const appendTurn = (turn: Turn) => setTurns((prev) => [...prev, turn]);

  const handleLoanRequestFromCatalog = useCallback((ctx: Record<string, unknown>) => {
    const amount = Number(ctx.amount ?? 0);
    const months = ctx.months ? Number(ctx.months) : undefined;
    setPendingLoanRequest({ amount, months });
  }, []);

  const handleConfirmLoan = async () => {
    if (!pendingLoanRequest || !userId) return;
    setIsConfirmingLoan(true);
    try {
      const res = await createLoan({
        user_id: userId,
        amount: pendingLoanRequest.amount,
        months: pendingLoanRequest.months,
        loan_request_id: loanConsult.loanRequestId ?? undefined,
      });

      if (res.status === 'ok') {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['liabilities', userId] }),
          queryClient.invalidateQueries({ queryKey: ['accounts', userId] }),
        ]);
        setPendingLoanRequest(null);
        appendTurn({
          id: `system-${Date.now()}`,
          role: 'system',
          text: `¡Préstamo de $${pendingLoanRequest.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} depositado exitosamente en tu cuenta!`,
        });
      } else {
        const issue = res.issues?.[0] || 'No se pudo crear el préstamo.';
        appendTurn({ id: `system-${Date.now()}`, role: 'system', text: issue });
      }
    } catch {
      appendTurn({
        id: `system-${Date.now()}`,
        role: 'system',
        text: 'No se pudo procesar la solicitud del préstamo. Intenta de nuevo.',
      });
    } finally {
      setIsConfirmingLoan(false);
    }
  };

  const submitText = async (text: string, { showUserBubble = true }: { showUserBubble?: boolean } = {}) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    if (showUserBubble) {
      appendTurn({ id: `user-${Date.now()}`, role: 'user', text });
    }
    setDraft('');

    // Check if user text triggers loan intent heuristic when in default mode
    let targetMode = mode;
    if (targetMode === 'la-mesa' && detectsLoanIntent(text)) {
      targetMode = 'loans';
      setMode('loans');
    }

    try {
      if (targetMode === 'loans') {
        let currentSessionId = loanConsult.sessionId;
        if (!currentSessionId) {
          const greetPayload = await loanConsult.greet(userId ?? 'u_ana');
          currentSessionId = greetPayload.session_id;
        }

        const consultPayload = await loanConsult.send(text);

        if (consultPayload.terminal_response) {
          applyMessages(consultPayload.terminal_response.a2ui);
          appendTurn({
            id: `agent-${Date.now()}`,
            role: 'agent',
            surfaceId: consultPayload.terminal_response.surface_id,
          });
        } else if (consultPayload.response_text) {
          appendTurn({
            id: `system-${Date.now()}`,
            role: 'system',
            text: consultPayload.response_text,
          });
        }
      } else {
        if (!sessionId) return;
        const response = await sendMessage({ session_id: sessionId, text });
        applyMessages(response.a2ui);
        appendTurn({ id: `agent-${Date.now()}`, role: 'agent', surfaceId: response.surface_id });
        if (response.audio_ref && catalogId === 'voz-color') {
          void playAudioAsset(response.audio_ref, baseUrl);
        }
      }
    } catch {
      appendTurn({
        id: `system-${Date.now()}`,
        role: 'system',
        text: 'No pude conectar con el asistente. Intenta de nuevo.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMicPressIn = async () => {
    isPressingMicRef.current = true;
    if (speech.state !== 'idle') return;
    try {
      await speech.start();
      if (!isPressingMicRef.current) {
        const transcript = await speech.stop();
        if (transcript) void submitText(transcript, { showUserBubble: false });
      }
    } catch {
      appendTurn({ id: `system-${Date.now()}`, role: 'system', text: 'No se pudo acceder al micrófono.' });
    }
  };

  const handleMicPressOut = async () => {
    isPressingMicRef.current = false;
    if (speech.isListening) {
      const transcript = await speech.stop();
      if (transcript) void submitText(transcript, { showUserBubble: false });
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (hasSentInitialIntent.current) return;
    hasSentInitialIntent.current = true;

    if (intent === 'prestamo-nuevo') {
      setMode('loans');
      if (userId) {
        setIsSending(true);
        void loanConsult
          .greet(userId)
          .then((res) => {
            if (res.response_text) {
              appendTurn({ id: `system-${Date.now()}`, role: 'system', text: res.response_text });
            }
          })
          .catch(() => {
            appendTurn({
              id: `system-${Date.now()}`,
              role: 'system',
              text: 'No pude iniciar la consulta de préstamos.',
            });
          })
          .finally(() => setIsSending(false));
      }
      return;
    }

    const prompt = intent ? INTENT_PROMPTS[intent] : undefined;
    if (prompt && sessionId) void submitText(prompt);
  }, [intent, sessionId, userId]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [turns.length]);

  useEffect(() => {
    if (isActive && focusDraftOnActive.current) {
      focusDraftOnActive.current = false;
      const timer = setTimeout(() => textInputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const handleIdleSendText = () => {
    if (!draft.trim()) return;
    void submitText(draft);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={[styles.idleTopBar, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.onBrand} />
        </Pressable>
        <Text style={styles.idleTopBarTitle}>
          {mode === 'loans' ? 'Asistente de Préstamos' : 'Asistente IA'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.idleHeaderSection}>
          <AnimatedOrb isListening={speech.isListening} />
          <View style={styles.idleTextGroup}>
            <Text style={styles.idleTitle}>¿En qué te puedo ayudar?</Text>
            <Text style={styles.idleSubtitle}>
              {speech.isListening
                ? speech.partialText || 'Escuchando...'
                : mode === 'loans'
                  ? 'Te ayudo a evaluar y solicitar tu nuevo crédito de manera transparente.'
                  : 'Hola Daniela, soy tu asesor de crédito. Puedo ayudarte con tus dudas o reestructurar tus préstamos.'}
            </Text>
          </View>

          <View style={styles.micWrapper}>
            <RecordingPulse active={speech.isListening} />
            <AnimatedPressable
              style={[styles.bigMicButton, speech.isListening && styles.bigMicButtonActive]}
              onPressIn={handleMicPressIn}
              onPressOut={handleMicPressOut}
              disabled={speech.state === 'requesting-permission' || speech.state === 'processing'}
            >
              <Ionicons name={speech.isListening ? 'stop' : 'mic'} size={36} color="#fff" />
            </AnimatedPressable>
          </View>

          <View style={styles.idleInputContainer}>
            <TextInput
              ref={textInputRef}
              style={styles.idleTextInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe aquí..."
              placeholderTextColor={colors.text.placeholder}
              editable={!speech.isListening}
              onSubmitEditing={handleIdleSendText}
              returnKeyType="send"
            />
            <Pressable onPress={handleIdleSendText} disabled={!draft.trim() || isSending} style={styles.idleSendIcon}>
              <Ionicons
                name="arrow-up-circle"
                size={32}
                color={draft.trim() && !isSending ? colors.brand.primary : colors.text.placeholder}
              />
            </Pressable>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={turns}
          keyExtractor={(t) => t.id}
          style={styles.turnsList}
          contentContainerStyle={styles.turnsContainer}
          renderItem={({ item }) => (
            <TurnBubble turn={item} catalogId={catalogId} onLoanRequest={handleLoanRequestFromCatalog} />
          )}
        />
      </KeyboardAvoidingView>

      {/* Confirmation Modal for Client-Routed Loan Request */}
      <Modal
        visible={pendingLoanRequest !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingLoanRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="cash" size={32} color={colors.brand.primary} />
            </View>

            <Text style={styles.modalTitle}>Confirmar Solicitud de Préstamo</Text>
            <Text style={styles.modalSubtitle}>
              Estás a punto de aceptar el crédito y recibir los fondos directamente en tu cuenta de débito.
            </Text>

            {pendingLoanRequest && (
              <View style={styles.modalSummaryBox}>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Monto a recibir:</Text>
                  <Text style={styles.modalSummaryValue}>
                    ${pendingLoanRequest.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                {pendingLoanRequest.months ? (
                  <View style={styles.modalSummaryRow}>
                    <Text style={styles.modalSummaryLabel}>Plazo:</Text>
                    <Text style={styles.modalSummarySubvalue}>{pendingLoanRequest.months} meses</Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.modalActions}>
              <AnimatedPressable
                style={[styles.modalConfirmBtn, isConfirmingLoan && styles.modalBtnDisabled]}
                onPress={handleConfirmLoan}
                disabled={isConfirmingLoan}
              >
                {isConfirmingLoan ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirmar y recibir fondos</Text>
                )}
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.modalCancelBtn}
                onPress={() => setPendingLoanRequest(null)}
                disabled={isConfirmingLoan}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TurnBubble({
  turn,
  catalogId,
  onLoanRequest,
}: {
  turn: Turn;
  catalogId: 'standard' | 'voz-color';
  onLoanRequest?: (ctx: Record<string, unknown>) => void;
}) {
  if (turn.role === 'user') {
    return (
      <Animated.View entering={FadeInUp.duration(220)} style={[styles.bubbleRow, styles.bubbleRowUser]}>
        <View style={[styles.bubble, styles.bubbleUser]}>
          <Text style={styles.bubbleTextUser}>{turn.text}</Text>
        </View>
      </Animated.View>
    );
  }

  if (turn.role === 'system') {
    return (
      <Animated.View entering={FadeInUp.duration(220)} style={styles.systemRow}>
        <Text style={styles.systemText}>{turn.text}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(240)} style={[styles.bubbleRow, styles.bubbleRowAgent]}>
      {turn.surfaceId && (
        <View style={styles.surfaceWrapper}>
          <A2UISurface surfaceId={turn.surfaceId} catalogId={catalogId} onLoanRequest={onLoanRequest} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  topBarTitle: { ...typography.bodyStrong, color: colors.text.primary },

  turns: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1 },

  bubbleRow: { maxWidth: '86%' },
  bubbleRowUser: { alignSelf: 'flex-end' },
  bubbleRowAgent: { alignSelf: 'flex-start', gap: spacing.sm, maxWidth: '100%', width: '100%' },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bubbleUser: { backgroundColor: colors.brand.primary, borderBottomRightRadius: radius.sm },
  bubbleAgent: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderBottomLeftRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  bubbleTextUser: { ...typography.body, color: colors.text.onBrand },
  bubbleTextAgent: { ...typography.body, color: colors.text.primary },

  systemRow: { alignSelf: 'center' },
  systemText: { ...typography.caption, color: colors.text.secondary, textAlign: 'center', marginVertical: spacing.xs },

  surfaceWrapper: { width: '100%' },

  micWrapper: { alignItems: 'center', justifyContent: 'center' },

  idleScreen: { flex: 1, justifyContent: 'space-between' },
  idleTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.brand.primary,
  },
  idleTopBarTitle: { ...typography.h3, color: colors.text.onBrand },

  turnsContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
    flexGrow: 1,
  },
  turnsList: { flex: 1 },
  idleHeaderSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: 64,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    minHeight: '75%',
  },

  idleTextGroup: { alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  idleTitle: { ...typography.h2, color: colors.text.primary, textAlign: 'center' },
  idleSubtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center', fontSize: 15, lineHeight: 22 },

  bigMicButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginVertical: spacing.md,
  },
  bigMicButtonActive: {
    backgroundColor: '#FF007F',
    shadowColor: '#00F2FE',
    shadowOpacity: 0.8,
    shadowRadius: 24,
  },

  idleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    marginTop: spacing.md,
  },
  idleTextInput: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: 14,
  },
  idleSendIcon: {
    padding: spacing.xs,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface.card,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(236, 0, 41, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 14,
  },
  modalSummaryBox: {
    width: '100%',
    backgroundColor: colors.surface.field,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSummaryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  modalSummaryValue: {
    ...typography.h3,
    color: colors.brand.primary,
  },
  modalSummarySubvalue: {
    ...typography.bodyStrong,
    color: colors.text.primary,
  },
  modalActions: {
    width: '100%',
    gap: spacing.md,
  },
  modalConfirmBtn: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDisabled: {
    opacity: 0.7,
  },
  modalConfirmText: {
    ...typography.button,
    color: colors.text.onBrand,
  },
  modalCancelBtn: {
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    ...typography.label,
    color: colors.text.secondary,
  },
});
