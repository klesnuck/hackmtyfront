import { useCallback, useRef, useState } from 'react';
import { loansConsult, loansGreeting } from '../../api/endpoints';
import { playAudioAsset } from '../voice/audioCache';
import type { LoansConsultPayload, LoansGreetingPayload } from '../../api/types';
import type { A2UIMessage } from '../../a2ui/types';

export type LoanConsultStatus = 'idle' | 'greeting' | 'intake' | 'terminal' | 'error';

type LoanConsultState = {
  status: LoanConsultStatus;
  /** Loan-scoped session id (distinct from the login session). */
  sessionId: string | null;
  /** Created by the backend on the first consult turn. */
  loanRequestId: string | null;
  /** The terminal surface A2UI messages once the consult finishes. */
  terminalA2UI: A2UIMessage[] | null;
  terminalSurfaceId: string | null;
  /** The latest response text from the backend (for display). */
  responseText: string | null;
  /** Audio ref for playback. */
  audioRef: string | null;
  /** Error message for display. */
  errorMessage: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  provider_unavailable: 'No pudimos generar la respuesta. Intenta de nuevo.',
  model_call_limit: 'No pudimos generar la respuesta. Intenta de nuevo.',
  agent_error: 'Algo salió mal. Intenta de nuevo.',
  transcription_failed: 'No pudimos entender el audio. Intenta de nuevo o escribe.',
  bad_request: 'Solicitud inválida. Revisa tu mensaje.',
};

/**
 * Hook managing a single loan consult conversation lifecycle:
 * greeting → intake loop → terminal offer (or not-eligible).
 *
 * Holds its own `sessionId` and `loanRequestId` in local state
 * (design.md Decision 4 — these are scoped to one conversation,
 * never persisted across app restarts).
 */
export function useLoanConsult() {
  const [state, setState] = useState<LoanConsultState>({
    status: 'idle',
    sessionId: null,
    loanRequestId: null,
    terminalA2UI: null,
    terminalSurfaceId: null,
    responseText: null,
    audioRef: null,
    errorMessage: null,
  });

  const baseUrlRef = useRef('');

  /** Set the base URL for audio playback. */
  const setBaseUrl = useCallback((url: string) => {
    baseUrlRef.current = url;
  }, []);

  /** Start a new loan conversation — calls POST /api/loans/greeting. */
  const greet = useCallback(
    async (userId: string): Promise<LoansGreetingPayload> => {
      setState((prev) => ({ ...prev, status: 'greeting', errorMessage: null }));

      try {
        const payload = await loansGreeting(userId);
        setState((prev) => ({
          ...prev,
          status: 'intake',
          sessionId: payload.session_id,
          responseText: payload.response_text,
          audioRef: payload.audio_ref,
        }));

        if (payload.audio_ref) {
          void playAudioAsset(payload.audio_ref, baseUrlRef.current);
        }

        return payload;
      } catch (err) {
        const msg = (err as Error).message || 'Error al iniciar la conversación de préstamo.';
        setState((prev) => ({ ...prev, status: 'error', errorMessage: msg }));
        throw err;
      }
    },
    [],
  );

  /** Send a user turn — calls POST /api/loans/consult. */
  const send = useCallback(
    async (text: string): Promise<LoansConsultPayload> => {
      if (!state.sessionId) {
        throw new Error('useLoanConsult.send: no session — call greet() first');
      }

      setState((prev) => ({ ...prev, errorMessage: null }));

      try {
        const payload = await loansConsult({
          session_id: state.sessionId,
          text,
          language: 'es-MX',
          loan_request_id: state.loanRequestId,
        });

        // Handle error status from the backend
        if (payload.status === 'error') {
          const errorCode = (payload as unknown as Record<string, unknown>).error_code as string | null;
          const errorMsg = errorCode && ERROR_MESSAGES[errorCode]
            ? ERROR_MESSAGES[errorCode]
            : (payload as unknown as Record<string, unknown>).message as string || 'Algo salió mal.';
          setState((prev) => ({
            ...prev,
            status: 'error',
            errorMessage: errorMsg,
            loanRequestId: payload.loan_request_id || prev.loanRequestId,
          }));
          return payload;
        }

        if (payload.terminal_response) {
          // Terminal offer received
          setState((prev) => ({
            ...prev,
            status: 'terminal',
            loanRequestId: payload.loan_request_id,
            terminalA2UI: payload.terminal_response!.a2ui,
            terminalSurfaceId: payload.terminal_response!.surface_id,
            responseText: payload.response_text,
            audioRef: payload.audio_ref,
          }));
        } else {
          // Follow-up question — stay in intake
          setState((prev) => ({
            ...prev,
            status: 'intake',
            loanRequestId: payload.loan_request_id,
            responseText: payload.response_text,
            audioRef: payload.audio_ref,
          }));
        }

        if (payload.audio_ref) {
          void playAudioAsset(payload.audio_ref, baseUrlRef.current);
        }

        return payload;
      } catch (err) {
        const msg = (err as Error).message || 'Error al consultar sobre el préstamo.';
        setState((prev) => ({ ...prev, status: 'error', errorMessage: msg }));
        throw err;
      }
    },
    [state.sessionId, state.loanRequestId],
  );

  /** Reset the conversation to idle (e.g. when switching tabs or starting fresh). */
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      sessionId: null,
      loanRequestId: null,
      terminalA2UI: null,
      terminalSurfaceId: null,
      responseText: null,
      audioRef: null,
      errorMessage: null,
    });
  }, []);

  return {
    ...state,
    greet,
    send,
    reset,
    setBaseUrl,
  };
}
