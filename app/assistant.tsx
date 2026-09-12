import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { A2UISurface, useA2UIStore } from '../src/a2ui';
import { sendMessage } from '../src/api/endpoints';
import { AnimatedPressable } from '../src/catalog/shared/AnimatedPressable';
import { playAudioAsset } from '../src/features/voice/audioCache';
import { RecordingPulse } from '../src/features/voice/RecordingPulse';
import { useVoiceRecorder } from '../src/features/voice/useVoiceRecorder';
import { useActiveCatalogId, useSessionStore } from '../src/state/session.store';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

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
 */
export default function AssistantScreen() {
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const sessionId = useSessionStore((s) => s.sessionId);
  const catalogId = useActiveCatalogId();
  const applyMessages = useA2UIStore((s) => s.applyMessages);
  const recorder = useVoiceRecorder();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<Turn>>(null);
  const hasSentInitialIntent = useRef(false);

  const baseUrl = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? '';

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
    appendTurn({ id: `user-${Date.now()}`, role: 'user', text: '🎤 Mensaje de voz' });

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
    if (recorder.isRecording) {
      const audioB64 = await recorder.stop();
      if (audioB64) void submitAudio(audioB64);
      return;
    }
    try {
      await recorder.start();
    } catch {
      appendTurn({ id: `system-${Date.now()}`, role: 'system', text: 'No se pudo acceder al micrófono.' });
    }
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Tu asistente</Text>
        <View style={{ width: 24 }} />
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
          contentContainerStyle={styles.turns}
          renderItem={({ item }) => <TurnBubble turn={item} catalogId={catalogId} />}
          ListEmptyComponent={<EmptyState />}
        />

        <View style={styles.inputBar}>
          <View style={styles.micWrapper}>
            <RecordingPulse active={recorder.isRecording} />
            <AnimatedPressable
              style={[styles.micButton, recorder.isRecording && styles.micButtonActive]}
              onPress={handleMicPress}
              disabled={recorder.state === 'requesting-permission' || recorder.state === 'processing'}
            >
              <Ionicons name={recorder.isRecording ? 'stop' : 'mic'} size={22} color="#fff" />
            </AnimatedPressable>
          </View>

          <TextInput
            style={styles.textInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor={colors.text.placeholder}
            editable={!recorder.isRecording}
            onSubmitEditing={() => submitText(draft)}
            returnKeyType="send"
          />

          <Pressable
            onPress={() => submitText(draft)}
            disabled={!draft.trim() || isSending}
            style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <Animated.View entering={FadeInUp.duration(280)} style={styles.emptyState}>
      <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.text.placeholder} />
      <Text style={styles.emptyStateText}>Cuéntale a tu asistente qué necesitas.{'\n'}Por texto o por voz.</Text>
    </Animated.View>
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
      {turn.text && (
        <View style={[styles.bubble, styles.bubbleAgent]}>
          <Text style={styles.bubbleTextAgent}>{turn.text}</Text>
        </View>
      )}
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

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: 80 },
  emptyStateText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },

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

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.surface.card,
  },
  micWrapper: { alignItems: 'center', justifyContent: 'center' },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: { backgroundColor: colors.text.danger },

  textInput: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface.field,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    color: colors.text.primary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
