import type { SharedValue } from 'react-native-reanimated';

/**
 * Platform-agnostic type declaration. Metro resolves `useOrbAmplitude.native.ts`
 * on iOS/Android and `useOrbAmplitude.web.ts` on Web when importing
 * `from './useOrbAmplitude'` without an extension; this file only exists so
 * TypeScript has something to resolve to and is never actually bundled.
 */
export declare function useOrbAmplitude(isListening: boolean): SharedValue<number>;
