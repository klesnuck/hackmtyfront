import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
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
import { A2UISurface, useA2UIStore } from '../../src/a2ui';
import { sendMessage } from '../../src/api/endpoints';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { AnimatedOrb } from '../../src/features/assistant-orb/AnimatedOrb';
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
};

/**
 * Where the actual product happens: every generated surface renders here,
 * inline in the conversation, via the SAME <A2UISurface /> used by the Kill
 * Test (MOBILE_ARCHITECTURE.md §8). This screen owns turn-taking and voice
 * capture; it never inspects or special-cases what the agent generates.
 *
 * It also owns the idle -> active state machine added on top of that
 * (Figma 37:123): the Soporte IA tab lands on a greeting/orb screen until
 * the user picks "Escribir" / "Hablar", a turn is sent, or the screen is
 * reached with a dashboard `intent` already attached (which skips idle
 * entirely and fires the existing initial-intent effect below).
 */
export default function AsistenteScreen() {
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const sessionId = useSessionStore((s) => s.sessionId);
  const catalogId = useActiveCatalogId();
  const applyMessages = useA2UIStore((s) => s.applyMessages);
  const speech = useSpeechToText();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [manualActive, setManualActive] = useState(false);
  const listRef = useRef<FlatList<Turn>>(null);
  const textInputRef = useRef<TextInput>(null);
  const focusDraftOnActive = useRef(false);
  const hasSentInitialIntent = useRef(false);
  const isPressingMicRef = useRef(false);

  const baseUrl = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? '';
  const hasIntentPrompt = Boolean(intent && INTENT_PROMPTS[intent]);
  const isActive = turns.length > 0 || manualActive || hasIntentPrompt;

  // Per the change's tasks.md 4.2: revisiting the tab with no conversation
  // started yet (and no dashboard intent to consume) lands back on the idle
  // greeting — even if the user had tapped "Escribir"/"Hablar" but never
  // actually sent a turn before switching away.
  useFocusEffect(
    useCallback(() => {
      if (turns.length === 0 && !hasIntentPrompt) {
        setManualActive(false);
      }
    }, [turns.length, hasIntentPrompt]),
  );

  const appendTurn = (turn: Turn) => setTurns((prev) => [...prev, turn]);

  const submitText = async (text: string) => {
    if (!sessionId || !text.trim() || isSending) return;
    setIsSending(true);
    appendTurn({ id: `user-${Date.now()}`, role: 'user', text });
    setDraft('');

    try {
      const response = await sendMessage({ session_id: sessionId, text });
      applyMessages(response.a2ui);
      appendTurn({ id: `agent-${Date.now()}`, role: 'agent', surfaceId: response.surface_id });
      if (response.audio_ref && catalogId === 'voz-color') {
        void playAudioAsset(response.audio_ref, baseUrl);
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

  const submitAudio = async (audioB64: string) => {
    if (!sessionId || isSending) return;
    setIsSending(true);
    // Removed appendTurn for user voice messages to allow a fluid conversation UI without bubbles

    try {
      const response = await sendMessage({ session_id: sessionId, audio_b64: audioB64 });
      applyMessages(response.a2ui);
      appendTurn({ id: `agent-${Date.now()}`, role: 'agent', surfaceId: response.surface_id });
      if (response.audio_ref) void playAudioAsset(response.audio_ref, baseUrl);
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

  const handleMicPress = async () => {
    if (speech.isListening) {
      const transcript = await speech.stop();
      if (transcript) void submitText(transcript);
      return;
    }
    try {
      await speech.start();
    } catch {
      appendTurn({ id: `system-${Date.now()}`, role: 'system', text: 'No se pudo acceder al micrófono.' });
    }
  };

  const handleEscribir = () => {
    focusDraftOnActive.current = true;
    setManualActive(true);
  };

  const handleHablar = () => {
    setManualActive(true);
    void handleMicPress();
  };

  // Deliberate one-shot: fires the dashboard's quick-action prompt exactly
  // once (guarded by the ref, not by the dep array) as soon as a session
  // exists. submitText is intentionally omitted from deps — it closes over
  // state that changes every turn, and re-running this effect on every
  // change would re-fire the initial prompt.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (hasSentInitialIntent.current || !sessionId) return;
    hasSentInitialIntent.current = true;
    const prompt = intent ? INTENT_PROMPTS[intent] : undefined;
    if (prompt) void submitText(prompt);
  }, [intent, sessionId]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [turns.length]);

  // "Escribir" focuses the text input once the active view has actually
  // mounted (the TextInput doesn't exist yet during the idle render).
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
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.idleTopBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.onBrand} />
        </Pressable>
        <Text style={styles.idleTopBarTitle}>Asistente IA</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Fixed section (tasks.md 4.1): orb, greeting, mic button, and input
          pill live outside the FlatList so they never scroll away — only
          the turns list below scrolls when the conversation overflows. */}
      <View style={styles.idleHeaderSection}>
        <AnimatedOrb />
        <View style={styles.idleTextGroup}>
          <Text style={styles.idleTitle}>¿En qué te puedo ayudar?</Text>
          <Text style={styles.idleSubtitle}>
            {speech.isListening
              ? speech.partialText || 'Escuchando...'
              : 'Hola Daniela, soy tu asesor de crédito. Puedo ayudarte con tus dudas o reestructurar tus préstamos.'}
          </Text>
        </View>

        {/* Botón de micrófono grande centrado */}
        <View style={styles.micWrapper}>
          <RecordingPulse active={speech.isListening} />
          <AnimatedPressable
            style={[styles.bigMicButton, speech.isListening && styles.bigMicButtonActive]}
            onPress={handleMicPress}
            disabled={speech.state === 'requesting-permission' || speech.state === 'processing'}
          >
            <Ionicons name={speech.isListening ? 'stop' : 'mic'} size={36} color="#fff" />
          </AnimatedPressable>
        </View>

        {/* Recuadro pequeño de texto abajo del micrófono */}
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={turns}
          keyExtractor={(t) => t.id}
          style={styles.turnsList}
          contentContainerStyle={styles.turnsContainer}
          ListHeaderComponent={
            <View style={styles.idleHeaderSection}>
              <AnimatedOrb isListening={recorder.isRecording} />
              <View style={styles.idleTextGroup}>
                <Text style={styles.idleTitle}>
                  {recorder.isRecording ? 'Te escucho...' : '¿En qué te puedo ayudar?'}
                </Text>
                <Text style={styles.idleSubtitle}>
                  {recorder.isRecording
                    ? 'Habla con tranquilidad, estoy procesando tu voz...'
                    : 'Hola Daniela, soy tu asesor de crédito. Puedo ayudarte con tus dudas o reestructurar tus préstamos.'}
                </Text>
              </View>

              {/* Botón de micrófono grande centrado (Mantener presionado para hablar) */}
              <View style={styles.micWrapper}>
                <RecordingPulse active={recorder.isRecording} />
                <AnimatedPressable
                  style={[styles.bigMicButton, recorder.isRecording && styles.bigMicButtonActive]}
                  onPressIn={async () => {
                    isPressingMicRef.current = true;
                    if (recorder.state !== 'requesting-permission' && recorder.state !== 'processing' && !recorder.isRecording) {
                      try {
                        await recorder.start();
                        // If finger was released while recorder was initializing, stop/submit immediately
                        if (!isPressingMicRef.current) {
                          const audioB64 = await recorder.stop();
                          if (audioB64 && audioB64.length > 500) void submitAudio(audioB64);
                        }
                      } catch {
                        appendTurn({ id: `system-${Date.now()}`, role: 'system', text: 'No se pudo acceder al micrófono.' });
                      }
                    }
                  }}
                  onPressOut={async () => {
                    isPressingMicRef.current = false;
                    if (recorder.isRecording) {
                      const audioB64 = await recorder.stop();
                      if (audioB64 && audioB64.length > 500) void submitAudio(audioB64);
                    }
                  }}
                >
                  <Ionicons name="mic" size={36} color="#fff" />
                </AnimatedPressable>
              </View>

              {/* Recuadro pequeño de texto abajo del micrófono */}
              <View style={styles.idleInputContainer}>
                <TextInput
                  ref={textInputRef}
                  style={styles.idleTextInput}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Escribe aquí..."
                  placeholderTextColor={colors.text.placeholder}
                  editable={!recorder.isRecording}
                  onSubmitEditing={handleIdleSendText}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={handleIdleSendText}
                  disabled={!draft.trim() || isSending}
                  style={styles.idleSendIcon}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={32}
                    color={draft.trim() && !isSending ? colors.brand.primary : colors.text.placeholder}
                  />
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => <TurnBubble turn={item} catalogId={catalogId} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TurnBubble({ turn, catalogId }: { turn: Turn; catalogId: 'standard' | 'voz-color' }) {
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

  // Agent turn: render the generated surface inline, using the SAME renderer as the Kill Test.
  return (
    <Animated.View entering={FadeInUp.duration(240)} style={[styles.bubbleRow, styles.bubbleRowAgent]}>
      {/* 
        Removed the text bubble rendering here to prevent the UI from acting like a chat.
        The UI should feel like a fluid voice conversation with just fluid AI Interfaces (surfaces).
      */}
      {turn.surfaceId && (
        <View style={styles.surfaceWrapper}>
          <A2UISurface surfaceId={turn.surfaceId} catalogId={catalogId} />
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
  systemText: { ...typography.caption, color: colors.text.danger },

  surfaceWrapper: { width: '100%' },

  micWrapper: { alignItems: 'center', justifyContent: 'center' },

  idleScreen: { flex: 1, justifyContent: 'space-between' },
  idleTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.brand.primary,
  },
  idleTopBarTitle: { ...typography.h3, color: colors.text.onBrand },

  // Figma 37:123's ai-body uses literal pt-100/pb-64/gap-48 (px-24 = spacing.xxl
  // exactly) — kept as literal pixel values, since the spacing scale has no
  // 48/64/100 step.
  turnsContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
    flexGrow: 1,
  },
  // Layout split (tasks.md 4.2): the turns FlatList fills the remaining
  // space below the fixed header section and scrolls only its own items.
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
});
