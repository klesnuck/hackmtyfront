import { useEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';

/**
 * Web: Web Audio API (getUserMedia + AnalyserNode), only while `isListening`
 * is true — never opens the mic during idle. Adaptive gain (rolling
 * noise floor / peak) so "how loud is loud" self-calibrates instead of
 * assuming a fixed hardware gain; fast attack / slow release smoothing so
 * the orb pops on speech and eases back down between words.
 */
export function useOrbAmplitude(isListening: boolean) {
  const amplitude = useSharedValue(0);
  const rafRef = useRef<number | undefined>(undefined);
  const ctxRef = useRef<AudioContext | undefined>(undefined);
  const streamRef = useRef<MediaStream | undefined>(undefined);

  useEffect(() => {
    if (!isListening) {
      amplitude.value = 0;
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioCtx: typeof AudioContext =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        ctxRef.current = ctx;
        await ctx.resume().catch(() => {});

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let floor = 0.01;
        let peak = 0.03;

        const tick = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sumSquares += v * v;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);

          floor = rms < floor ? floor + (rms - floor) * 0.05 : floor + (rms - floor) * 0.00015;
          peak = rms > peak ? rms : peak + (rms - peak) * 0.01;
          const range = Math.max(peak - floor, 0.01);
          const level = Math.min(1, Math.max(0, (rms - floor) / range));

          const prev = amplitude.value;
          const smoothing = level > prev ? 0.6 : 0.1;
          amplitude.value = prev + (level - prev) * smoothing;

          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.warn('[useOrbAmplitude] microphone access denied or unavailable', e);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = undefined;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = undefined;
      amplitude.value = 0;
    };
  }, [isListening, amplitude]);

  return amplitude;
}
