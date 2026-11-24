import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Radio, Check, Key, Lock, ArrowLeft, X, Smartphone } from 'lucide-react';
import {
  getPrivacySettings,
  savePrivacySettings,
  setLockPin,
  removeLockPin,
  isBiometricsAvailable,
  PrivacySettings,
} from '../../utils/privacySettings';

interface MagicPrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstantExit: () => void;
}

export const MagicPrivacySettingsModal: React.FC<MagicPrivacySettingsModalProps> = ({
  isOpen,
  onClose,
  onInstantExit,
}) => {
  const [settings, setSettings] = useState<PrivacySettings>(getPrivacySettings());
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getPrivacySettings());
      isBiometricsAvailable().then(setHasBiometrics);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof PrivacySettings) => {
    const updated = savePrivacySettings({ [key]: !settings[key] });
    setSettings(updated);
  };

  const handleSavePin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('PIN must be 4 to 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    await setLockPin(newPin);
    setSettings(getPrivacySettings());
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleRemovePin = () => {
    if (window.confirm('Remove PIN lock for Magic Layer?')) {
      removeLockPin();
      setSettings(getPrivacySettings());
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-[420px] bg-[#16171A] border border-[#2B2D33] rounded-3xl p-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2B33] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A99BCB]/15 text-[#B6A4DC] flex items-center justify-center">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white">Magic Layer Privacy</h3>
              <p className="text-[11px] text-neutral-400">Security & stealth controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Setup View */}
        {showPinSetup ? (
          <div className="space-y-4 py-2">
            <h4 className="text-sm font-semibold text-white">Set Security PIN</h4>
            <p className="text-xs text-neutral-400">
              Set a 4–6 digit numeric code required to open Magic Layer.
            </p>

            <div>
              <label className="text-xs text-neutral-300 block mb-1">Enter 4–6 digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                className="w-full bg-[#202228] border border-[#32353E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6A4DC]"
                placeholder="••••"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-300 block mb-1">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                className="w-full bg-[#202228] border border-[#32353E] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#B6A4DC]"
                placeholder="••••"
              />
            </div>

            {pinError && <p className="text-xs text-rose-400 font-medium">{pinError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPinSetup(false);
                  setNewPin('');
                  setConfirmPin('');
                  setPinError('');
                }}
                className="px-3.5 py-2 rounded-xl text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePin}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D91A8E] to-[#6366F1] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Save PIN
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toggles Group */}
            <div className="space-y-3 bg-[#1C1E24] p-3 rounded-2xl border border-[#2B2D36]">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Presence & Receipts
              </span>

              {/* Share Presence */}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="text-xs font-medium text-white">Active Status (Presence)</p>
                  <p className="text-[11px] text-neutral-400">Show when you are currently online</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sharePresence}
                  onChange={() => handleToggle('sharePresence')}
                  className="w-4.5 h-4.5 accent-[#B6A4DC] cursor-pointer"
                />
              </label>

              {/* Typing Indicators */}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="text-xs font-medium text-white">Typing Indicators</p>
                  <p className="text-[11px] text-neutral-400">Broadcast when you are typing a message</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.shareTyping}
                  onChange={() => handleToggle('shareTyping')}
                  className="w-4.5 h-4.5 accent-[#B6A4DC] cursor-pointer"
                />
              </label>

              {/* Read Receipts */}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="text-xs font-medium text-white">Read Receipts</p>
                  <p className="text-[11px] text-neutral-400">Send 'Seen' double checkmark when viewed</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.shareReadReceipts}
                  onChange={() => handleToggle('shareReadReceipts')}
                  className="w-4.5 h-4.5 accent-[#B6A4DC] cursor-pointer"
                />
              </label>

              {/* Last Seen */}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <p className="text-xs font-medium text-white">Share Last Seen</p>
                  <p className="text-[11px] text-neutral-400">Display timestamp of last activity</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.shareLastSeen}
                  onChange={() => handleToggle('shareLastSeen')}
                  className="w-4.5 h-4.5 accent-[#B6A4DC] cursor-pointer"
                />
              </label>
            </div>

            {/* Chat Lock Settings */}
            <div className="space-y-3 bg-[#1C1E24] p-3 rounded-2xl border border-[#2B2D36]">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Security Lock
              </span>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium text-white">
                    PIN Lock: {settings.lockEnabled ? 'Active' : 'Disabled'}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Require PIN code when triggering /qupa
                  </p>
                </div>
                {settings.lockEnabled ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPinSetup(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#2B2D36] text-[11px] text-neutral-200 hover:bg-[#343742] cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      className="px-2.5 py-1 rounded-lg bg-red-950/40 text-[11px] text-red-400 hover:bg-red-900/50 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPinSetup(true)}
                    className="px-3 py-1 rounded-lg bg-[#B6A4DC] text-[11px] font-semibold text-[#111214] hover:opacity-90 cursor-pointer"
                  >
                    Set PIN
                  </button>
                )}
              </div>

              {/* Biometrics Toggle if supported */}
              {hasBiometrics && (
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <p className="text-xs font-medium text-white">Biometric Unlock</p>
                    <p className="text-[11px] text-neutral-400">Use Fingerprint / Face ID</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.biometricsEnabled}
                    onChange={() => handleToggle('biometricsEnabled')}
                    className="w-4.5 h-4.5 accent-[#B6A4DC] cursor-pointer"
                  />
                </label>
              )}
            </div>

            {/* Quick Exit Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInstantExit();
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Instant Return to AI Chatbot (Esc)</span>
              </button>
              <p className="text-[10.5px] text-neutral-400 text-center mt-2">
                Tip: Pressing <kbd className="px-1 py-0.5 bg-neutral-800 rounded">Esc</kbd> or double-tapping the chat header instantly returns to the AI chatbot.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
