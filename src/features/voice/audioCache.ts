import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
// Legacy shim (still shipped in SDK 57 as of this writing) — the well-documented,
// stable path for local file caching/download checks used here.
import { cacheDirectory, downloadAsync, getInfoAsync } from 'expo-file-system/legacy';
import { getAudioAssetUrl } from '../../api/endpoints';

/**
 * Caches a backend TTS asset by id (REQ-ACC-05 mirrors the backend's own
 * text-hash cache — a repeated phrase should never re-download on-device
 * either). Returns a local file:// uri ready to play.
 *
 * The backend always serves `audio/mpeg` (MP3). The cached file MUST use the
 * matching extension: iOS's AVPlayer picks its demuxer from the file extension,
 * so saving MP3 bytes as `.m4a` fails to load and playback silently does nothing.
 */
async function getCachedAudioUri(assetId: string, baseUrl: string): Promise<string> {
  const assetKey = assetId.startsWith('/') ? assetId.split('/').filter(Boolean).pop() ?? assetId : assetId;
  const localUri = `${cacheDirectory}a2ui-audio-${encodeURIComponent(assetKey)}.mp3`;
  const info = await getInfoAsync(localUri);
  if (info.exists) return localUri;

  const remoteUrl = getAudioAssetUrl(assetId, baseUrl);
  const { uri } = await downloadAsync(remoteUrl, localUri);
  return uri;
}

/**
 * Fire-and-forget playback — used for accessible-mode auto-play (REQ-ACC-03)
 * and the loans consult. Non-blocking, but a failed download/load/play is
 * surfaced in development instead of being silently discarded.
 */
export async function playAudioAsset(assetId: string, baseUrl: string): Promise<void> {
  try {
    // iOS mutes playback by default when the silent/ringer switch is off, and
    // speech recognition can leave the session in a recording category.
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    const localUri = await getCachedAudioUri(assetId, baseUrl);
    const player = createAudioPlayer(localUri);
    player.play();
  } catch (error) {
    if (__DEV__) console.warn('[audio] playAudioAsset failed:', error);
  }
}
