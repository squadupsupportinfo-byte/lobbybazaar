/**
 * Universal Cross-Device Microphone & Audio Service
 * Guarantees microphone functionality across iOS Safari, Android Chrome,
 * macOS/Windows browsers, Samsung Internet, Firefox, and WebViews.
 */

export interface MicStreamResult {
  stream: MediaStream;
  usedFallbackConstraints: boolean;
}

/**
 * Detect current platform for targeted user instructions
 */
export function getDevicePlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/android/i.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

/**
 * Universal cross-device getUserMedia with multi-tier fallbacks:
 * Tier 1: High-fidelity audio with hardware echo cancellation, noise suppression, and auto gain control
 * Tier 2: Basic audio constraints { audio: true } for iOS Safari, older Android, or strict audio drivers
 * Tier 3: Legacy navigator.webkitGetUserMedia / navigator.mozGetUserMedia fallback
 */
export async function acquireCrossDeviceMicrophone(): Promise<MicStreamResult> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('Microphone access is not supported in this environment.');
  }

  // Check if mediaDevices exists
  const hasMediaDevices = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const legacyGetUserMedia =
    (navigator as any).webkitGetUserMedia?.bind(navigator) ||
    (navigator as any).mozGetUserMedia?.bind(navigator) ||
    (navigator as any).getUserMedia?.bind(navigator);

  if (!hasMediaDevices && !legacyGetUserMedia) {
    throw new Error(
      'Microphone API is not supported on this browser or restricted by iframe permissions. Please open in Safari or Chrome.'
    );
  }

  // Tier 1: Try optimal high-fidelity constraints first with ideal soft fallbacks for mobile browsers
  try {
    if (hasMediaDevices) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        },
      });

      // Ensure tracks are explicitly enabled and active
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        track.onunmute = () => {
          track.enabled = true;
        };
      });

      return { stream, usedFallbackConstraints: false };
    }
  } catch (tier1Error: any) {
    // If user explicitly denied permissions, rethrow immediately without retrying
    if (isPermissionDeniedError(tier1Error)) {
      throw tier1Error;
    }
    console.warn('Microphone Tier 1 constraints failed, attempting Tier 2 universal fallback:', tier1Error);
  }

  // Tier 2: Universal { audio: true } fallback for mobile Safari & devices with strict constraints
  try {
    if (hasMediaDevices) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      return { stream, usedFallbackConstraints: true };
    }
  } catch (tier2Error: any) {
    if (isPermissionDeniedError(tier2Error)) {
      throw tier2Error;
    }
    console.warn('Microphone Tier 2 fallback failed, attempting Tier 3 legacy fallback:', tier2Error);
  }

  // Tier 3: Legacy browser wrapper
  if (legacyGetUserMedia) {
    return new Promise((resolve, reject) => {
      legacyGetUserMedia(
        { audio: true },
        (stream: MediaStream) => {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });
          resolve({ stream, usedFallbackConstraints: true });
        },
        (legacyErr: any) => {
          reject(legacyErr);
        }
      );
    });
  }

  throw new Error('Failed to access microphone. Please check your device audio settings.');
}

/**
 * Check if the error is due to user/browser permission denial
 */
export function isPermissionDeniedError(err: any): boolean {
  if (!err) return false;
  const name = err.name || '';
  const message = String(err.message || '').toLowerCase();
  return (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    name === 'SecurityError' ||
    message.includes('permission') ||
    message.includes('denied') ||
    message.includes('dismissed')
  );
}

/**
 * Generate platform-tailored, crystal-clear troubleshooting guidance
 */
export function getPlatformMicErrorMessage(err: any): string {
  const platform = getDevicePlatform();
  const denied = isPermissionDeniedError(err);

  if (denied) {
    if (platform === 'ios') {
      return 'Microphone permission blocked in Safari. Tap the "aA" or lock 🔒 icon in the Safari address bar -> Website Settings -> set Microphone to "Allow", then tap Mic again.';
    }
    if (platform === 'android') {
      return 'Microphone permission blocked in Chrome. Tap the lock 🔒 or tune icon in the Chrome URL bar -> Permissions -> set Microphone to "Allow", then tap Mic again.';
    }
    return 'Microphone permission blocked. Click the lock 🔒 or slider icon in your browser address bar and set Microphone to "Allow", then refresh or tap Mic.';
  }

  const name = err?.name || '';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone was detected on this device. Please connect a headset, earbuds, or external microphone.';
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Microphone is currently in use by another application or call. Please close other voice apps and try again.';
  }

  return (
    err?.message ||
    'Could not access microphone on this device. Please verify your browser and system audio permissions.'
  );
}
