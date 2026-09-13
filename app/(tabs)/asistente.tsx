import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { A2UISurface, useA2UIStore } from '../../src/a2ui';
import { ApiError } from '../../src/api/client';
import { agentGreeting, createLoan, createSession, sendMessage } from '../../src/api/endpoints';
import type { MessageRequest, SurfaceResponse } from '../../src/api/types';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { AnimatedOrb } from '../../src/features/assistant-orb/AnimatedOrb';
import { SuggestedPrompts } from '../../src/features/assistant-orb/SuggestedPrompts';
import { detectsLoanIntent } from '../../src/features/loans/detectsLoanIntent';
import { useLoanConsult } from '../../src/features/loans/useLoanConsult';
import { playAudioAsset } from '../../src/features/voice/audioCache';
import { RecordingPulse } from '../../src/features/voice/RecordingPulse';
import { useSpeechToText } from '../../src/features/voice/useSpeechToText';
import { useActiveCatalogId, useSessionStore } from '../../src/state/session.store';
import { useUiStore } from '../../src/state/ui.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

const INTENT_PROMPTS: Record<string, string> = {
  'la-mesa': 'Quiero ayuda para reestructurar mi deuda.',
  'saving-bags': 'Quiero empezar a ahorrar para una meta.',
  'prestamo-nuevo': 'Quiero solicitar un préstamo nuevo.',
};

/**
 * The screen shows exactly one thing: either the idle greeting/mic/input, or
 * the most recently generated A2UI surface taking over the whole panel. Each
 * agent response REPLACES the previous panel state (it is never appended);
 * text-only replies are intentionally not rendered anywhere.
 */
type PanelState = { kind: 'idle' } | { kind: 'surface'; surfaceId: string };

export default function AsistenteScreen() {
  const insets = useSafeAreaInsets();
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const sessionId = useSessionStore((s) => s.sessionId);
  const userId = useSessionStore((s) => s.userId);
  const accessibilityMode = useSessionStore((s) => s.accessibilityMode);
  const setSession = useSessionStore((s) => s.setSession);
  const catalogId = useActiveCatalogId();
  const applyMessages = useA2UIStore((s) => s.applyMessages);
  const isSending = useUiStore((s) => s.turnInFlight);
  const beginTurn = useUiStore((s) => s.beginTurn);
  const endTurn = useUiStore((s) => s.endTurn);
  const speech = useSpeechToText();
  const loanConsult = useLoanConsult();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'la-mesa' | 'loans'>('la-mesa');
  const [panelState, setPanelState] = useState<PanelState>({ kind: 'idle' });
  const [draft, setDraft] = useState('');
  const [showFloatingInput, setShowFloatingInput] = useState(false);
  const [pendingLoanRequest, setPendingLoanRequest] = useState<{ amount: number; months?: number } | null>(null);
  const [isConfirmingLoan, setIsConfirmingLoan] = useState(false);

  const textInputRef = useRef<TextInput>(null);
  const hasSentInitialIntent = useRef(false);
  const greetedForSessionRef = useRef<string | null>(null);
  const isPressingMicRef = useRef(false);

  const baseUrl = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? '';
  const isRecording = speech.state !== 'idle';
  const inputBlocked = isSending || isRecording;

  useEffect(() => {
    loanConsult.setBaseUrl(baseUrl);
  }, [baseUrl, loanConsult]);

  const handleLoanRequestFromCatalog = useCallback((ctx: Record<string, unknown>) => {
    const amount = Number(ctx.amount ?? 0);
    const months = ctx.months ? Number(ctx.months) : undefined;
    setPendingLoanRequest({ amount, months });
  }, []);

  const isUnknownSessionError = (error: unknown): boolean =>
    error instanceof ApiError &&
    error.status === 404 &&
    (error.body as { detail?: string } | undefined)?.detail === 'unknown session';

  /**
   * The persisted session_id can outlive the backend's record of it (e.g. a
   * dev backend restarted with a fresh DB while the device kept the old id
   * in SecureStore) — /api/message then 404s with "unknown session" forever,
   * since nothing else re-mints it. Mint a replacement via the same
   * POST /api/session the app uses at login and retry once.
   */
  const sendMessageResilient = useCallback(
    async (request: MessageRequest): Promise<SurfaceResponse> => {
      try {
        return await sendMessage(request);
      } catch (error) {
        if (!isUnknownSessionError(error) || !userId) throw error;
        const fresh = await createSession(userId);
        await setSession(fresh, accessibilityMode);
        return sendMessage({ ...request, session_id: fresh.session_id });
      }
    },
    [userId, accessibilityMode, setSession],
  );

  const handleConfirmLoan = async () => {
    if (!pendingLoanRequest || !userId || !beginTurn()) return;
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
      } else if (__DEV__) {
        console.warn('[asistente] loan creation failed:', res.issues?.[0]);
      }
    } catch (error) {
      if (__DEV__) console.warn('[asistente] loan creation error:', error);
    } finally {
      setIsConfirmingLoan(false);
      endTurn();
    }
  };

  const submitText = async (text: string) => {
    if (!text.trim() || !beginTurn()) return;
    setDraft('');

    // Check if user text triggers loan intent heuristic when in default mode
    let targetMode = mode;
    if (targetMode === 'la-mesa' && detectsLoanIntent(text)) {
      targetMode = 'loans';
      setMode('loans');
    }

    try {
      if (targetMode === 'loans') {
        if (!loanConsult.sessionId) {
          await loanConsult.greet(userId ?? 'u_ana');
        }

        const consultPayload = await loanConsult.send(text);

        // Only a terminal response renders (text-only intake replies are strict no-ops).
        if (consultPayload.terminal_response) {
          applyMessages(consultPayload.terminal_response.a2ui);
          setPanelState({
            kind: 'surface',
            surfaceId: consultPayload.terminal_response.surface_id,
          });
        }
      } else {
        if (!sessionId) return;
        const response = await sendMessageResilient({ session_id: sessionId, text });
        applyMessages(response.a2ui);
        if (response.surface_id) {
          setPanelState({ kind: 'surface', surfaceId: response.surface_id });
        }
        if (response.audio_ref && catalogId === 'voz-color') {
          void playAudioAsset(response.audio_ref, baseUrl);
        }
      }
    } catch (error) {
      // Text-only failure replies are intentionally not rendered (strict no-text-turns).
      if (__DEV__) console.warn('[asistente] turn failed:', error);
    } finally {
      endTurn();
    }
  };

  const handleMicPressIn = async () => {
    isPressingMicRef.current = true;
    if (useUiStore.getState().turnInFlight || speech.state !== 'idle') return;
    try {
      await speech.start();
      if (!isPressingMicRef.current) {
        const transcript = await speech.stop();
        if (transcript) void submitText(transcript);
      }
    } catch (error) {
      if (__DEV__) console.warn('[asistente] microphone start failed:', error);
    }
  };

  const handleMicPressOut = async () => {
    isPressingMicRef.current = false;
    if (useUiStore.getState().turnInFlight) return;
    if (speech.isListening) {
      const transcript = await speech.stop();
      if (transcript) void submitText(transcript);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (hasSentInitialIntent.current) return;
    if (!sessionId) return; // wait for the persisted session before deciding

    if (intent === 'prestamo-nuevo') {
      if (!beginTurn()) return;
      hasSentInitialIntent.current = true;
      setMode('loans');
      if (!userId) {
        endTurn();
        return;
      }
      void loanConsult
        .greet(userId)
        .catch((error) => {
          if (__DEV__) console.warn('[asistente] loan greeting failed:', error);
        })
        .finally(() => endTurn());
      return;
    }

    const prompt = intent ? INTENT_PROMPTS[intent] : undefined;
    if (!prompt) return; // plain tab open: greeted by the focus effect below
    hasSentInitialIntent.current = true;
    void submitText(prompt);
  }, [intent, sessionId, userId]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  // Greet proactively when the Asistente tab is opened without an explicit
  // intent — the bottom-nav tab and the Inicio banner both land here with none.
  useFocusEffect(
    useCallback(() => {
      if (intent || !sessionId || panelState.kind !== 'idle') return;
      if (greetedForSessionRef.current === sessionId) return;
      if (!beginTurn()) return; // a user turn already claimed the conversation
      greetedForSessionRef.current = sessionId;
      let cancelled = false;

      // Fallback for a backend that predates POST /api/agent/greeting: start the
      // conversation with the existing /api/message turn instead of dead-ending.
      const fallbackToMessage = async () => {
        const response = await sendMessageResilient({ session_id: sessionId, text: 'Hola' });
        if (cancelled) return;
        if (Array.isArray(response.a2ui) && response.a2ui.length > 0) {
          applyMessages(response.a2ui);
        }
        if (response.surface_id) {
          setPanelState({ kind: 'surface', surfaceId: response.surface_id });
        }
        if (response.audio_ref && catalogId === 'voz-color') {
          void playAudioAsset(response.audio_ref, baseUrl);
        }
      };

      void (async () => {
        try {
          const greeting = await agentGreeting(sessionId);
          if (cancelled) return;
          if (Array.isArray(greeting.a2ui) && greeting.a2ui.length > 0) {
            applyMessages(greeting.a2ui);
          }
          if (greeting.surface_id) {
            setPanelState({ kind: 'surface', surfaceId: greeting.surface_id });
          }
          if (greeting.audio_ref && catalogId === 'voz-color') {
            void playAudioAsset(greeting.audio_ref, baseUrl);
          }
        } catch (error) {
          // The dedicated greeting route may not be deployed (404) or the
          // backend may be unreachable (status 0): fall back to /api/message.
          const missingEndpoint =
            error instanceof ApiError && (error.status === 404 || error.status === 0);
          if (!missingEndpoint) {
            greetedForSessionRef.current = null; // allow a retry on next focus
            if (__DEV__) console.warn('[asistente] greeting failed:', error);
            return;
          }
          try {
            await fallbackToMessage();
          } catch (fallbackError) {
            greetedForSessionRef.current = null;
            if (__DEV__) console.warn('[asistente] fallback greeting failed:', fallbackError);
          }
        } finally {
          endTurn();
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [
      intent,
      sessionId,
      panelState.kind,
      catalogId,
      baseUrl,
      applyMessages,
      beginTurn,
      endTurn,
      sendMessageResilient,
    ]),
  );

  const handleIdleSendText = () => {
    if (!draft.trim() || inputBlocked) return;
    void submitText(draft);
  };

  const handleFloatingSendText = () => {
    if (!draft.trim() || inputBlocked) return;
    setShowFloatingInput(false);
    void submitText(draft);
  };

  const micDisabled =
    isSending || speech.state === 'requesting-permission' || speech.state === 'processing';

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

      <View style={styles.content}>
        {panelState.kind === 'surface' ? (
          <Animated.View
            key={panelState.surfaceId}
            entering={SlideInDown.duration(320)}
            style={styles.surfacePanel}
          >
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.surfaceScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <A2UISurface
                surfaceId={panelState.surfaceId}
                catalogId={catalogId}
                onLoanRequest={handleLoanRequestFromCatalog}
              />
            </ScrollView>
          </Animated.View>
        ) : (
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
                      : 'Hola Daniela, soy Luna, tu asesora de crédito. Puedo ayudarte con tus dudas o reestructurar tus préstamos.'}
                </Text>
              </View>

              <View style={styles.micWrapper}>
                <RecordingPulse active={speech.isListening} />
                <AnimatedPressable
                  style={[styles.bigMicButton, speech.isListening && styles.bigMicButtonActive]}
                  onPressIn={handleMicPressIn}
                  onPressOut={handleMicPressOut}
                  disabled={micDisabled}
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
                  editable={!inputBlocked}
                  onSubmitEditing={handleIdleSendText}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={handleIdleSendText}
                  disabled={!draft.trim() || inputBlocked}
                  style={styles.idleSendIcon}
                >
                  {isSending ? (
                    <ActivityIndicator color={colors.brand.primary} />
                  ) : (
                    <Ionicons
                      name="arrow-up-circle"
                      size={32}
                      color={draft.trim() && !inputBlocked ? colors.brand.primary : colors.text.placeholder}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* Floating re-engagement affordance — only while a surface is showing. */}
        {panelState.kind === 'surface' && (
          <View style={styles.floatingLayer} pointerEvents="box-none">
            <SuggestedPrompts onSelect={(prompt) => void submitText(prompt)} />

            {showFloatingInput && (
              <View style={styles.floatingInputPill}>
                <TextInput
                  ref={textInputRef}
                  style={styles.floatingTextInput}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Escribe aquí..."
                  placeholderTextColor={colors.text.placeholder}
                  editable={!inputBlocked}
                  onSubmitEditing={handleFloatingSendText}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={handleFloatingSendText}
                  disabled={!draft.trim() || inputBlocked}
                  style={styles.floatingSendIcon}
                >
                  {isSending ? (
                    <ActivityIndicator color={colors.brand.primary} />
                  ) : (
                    <Ionicons
                      name="arrow-up-circle"
                      size={28}
                      color={draft.trim() && !inputBlocked ? colors.brand.primary : colors.text.placeholder}
                    />
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.floatingControls}>
              <Pressable
                style={styles.floatingKeyboardButton}
                onPress={() => setShowFloatingInput((value) => !value)}
                disabled={micDisabled}
              >
                <Ionicons name={showFloatingInput ? 'close' : 'keypad'} size={20} color={colors.text.primary} />
              </Pressable>

              <AnimatedPressable
                onPressIn={handleMicPressIn}
                onPressOut={handleMicPressOut}
                disabled={micDisabled}
              >
                <AnimatedOrb isListening={speech.isListening} variant="floating" />
              </AnimatedPressable>
            </View>
          </View>
        )}
      </View>

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },
  flex: { flex: 1 },
  content: { flex: 1, position: 'relative' },

  idleTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.brand.primary,
  },
  idleTopBarTitle: { ...typography.h3, color: colors.text.onBrand },

  // Full-panel generated surface: fills the content area below the top bar.
  // Inline content, never a modal — no backdrop, no dismiss gesture.
  surfacePanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface.app,
  },
  surfaceScrollContent: {
    padding: spacing.xl,
    paddingBottom: 200,
    flexGrow: 1,
  },

  micWrapper: { alignItems: 'center', justifyContent: 'center' },

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

  floatingLayer: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  floatingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  floatingKeyboardButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  floatingInputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 240,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  floatingTextInput: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: 14,
  },
  floatingSendIcon: {
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
