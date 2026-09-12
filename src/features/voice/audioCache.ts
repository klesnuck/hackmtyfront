import { createAudioPlayer } from 'expo-audio';
// Legacy shim (still shipped in SDK 57 as of this writing) — the well-documented,
// stable path for local file caching/download checks used here.
import { cacheDirectory, downloadAsync, getInfoAsync } from 'expo-file-system/legacy';
import { getAudioAssetUrl } from '../../api/endpoints';

/**
 * Caches a backend TTS asset by id (REQ-ACC-05 mirrors the backend's own
 * text-hash cache — a repeated phrase should never re-download on-device
 * either). Returns a local file:// uri ready to play.
 */
async function getCachedAudioUri(assetId: string, baseUrl: string): Promise<string> {
  const localUri = `${cacheDirectory}a2ui-audio-${encodeURIComponent(assetId)}.m4a`;
  const info = await getInfoAsync(localUri);
  if (info.exists) return localUri;

  const remoteUrl = getAudioAssetUrl(assetId, baseUrl);
  const { uri } = await downloadAsync(remoteUrl, localUri);
  return uri;
}

/** Fire-and-forget playback — used for accessible-mode auto-play (REQ-ACC-03). */
export async function playAudioAsset(assetId: string, baseUrl: string): Promise<void> {
  const localUri = await getCachedAudioUri(assetId, baseUrl);
  const player = createAudioPlayer(localUri);
  player.play();
}
