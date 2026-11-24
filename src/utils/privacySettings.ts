export interface PrivacySettings {
  lockEnabled: boolean;
  pinHash: string | null;
  biometricsEnabled: boolean;
  sharePresence: boolean;
  shareLastSeen: boolean;
  shareTyping: boolean;
  shareReadReceipts: boolean;
  autoExitOnBackground: boolean;
}

const STORAGE_KEY = 'miu_magic_privacy_settings';

const DEFAULT_SETTINGS: PrivacySettings = {
  lockEnabled: false,
  pinHash: null,
  biometricsEnabled: false,
  sharePresence: true,
  shareLastSeen: true,
  shareTyping: true,
  shareReadReceipts: true,
  autoExitOnBackground: false,
};

// Simple SHA-256 hash for local PIN storage
async function computeHash(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(text + '_miu_salt_7392');
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash if subtle crypto not available
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

export function getPrivacySettings(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function savePrivacySettings(updates: Partial<PrivacySettings>): PrivacySettings {
  const current = getPrivacySettings();
  const updated: PrivacySettings = { ...current, ...updates };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save privacy settings', e);
  }
  return updated;
}

export async function setLockPin(pin: string): Promise<void> {
  const hash = await computeHash(pin);
  savePrivacySettings({
    lockEnabled: true,
    pinHash: hash,
  });
}

export function removeLockPin(): void {
  savePrivacySettings({
    lockEnabled: false,
    pinHash: null,
    biometricsEnabled: false,
  });
}

export async function verifyLockPin(enteredPin: string): Promise<boolean> {
  const settings = getPrivacySettings();
  if (!settings.lockEnabled || !settings.pinHash) {
    return true; // Not locked
  }
  const enteredHash = await computeHash(enteredPin);
  return enteredHash === settings.pinHash;
}

export async function isBiometricsAvailable(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    // Check if platform authenticator is available
    const available = await isBiometricsAvailable();
    if (!available) return false;

    // Challenge-response biometric check using WebAuthn
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Mock/Credential request for platform authenticator
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'preferred',
      },
    });

    return !!credential;
  } catch (err: any) {
    // If user cancelled or device doesn't have enrolled biometrics
    if (err?.name === 'NotAllowedError') {
      console.warn('Biometric authentication cancelled by user');
    }
    return false;
  }
}
