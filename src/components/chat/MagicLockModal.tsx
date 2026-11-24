import React, { useState } from 'react';
import { Lock, Fingerprint, Shield, X, Check } from 'lucide-react';
import { verifyLockPin, authenticateWithBiometrics, getPrivacySettings } from '../../utils/privacySettings';

interface MagicLockModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MagicLockModal: React.FC<MagicLockModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const settings = getPrivacySettings();

  if (!isOpen) return null;

  const handleVerify = async (inputPin?: string) => {
    const toCheck = inputPin !== undefined ? inputPin : pin;
    const isValid = await verifyLockPin(toCheck);
    if (isValid) {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setPin('');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {}
      }
    }
  };

  const handleBiometrics = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      onSuccess();
    }
  };

  const handleNumClick = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length >= 4) {
        // Auto-check if matches standard 4 or 6 digit
        handleVerify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-[340px] bg-[#16171A] border border-[#2B2D33] rounded-3xl p-6 shadow-2xl text-white flex flex-col items-center">
        {/* Discreet exit / cancel */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          title="Cancel"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-13 h-13 rounded-2xl bg-[#A99BCB]/15 text-[#B6A4DC] flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 stroke-[2]" />
        </div>

        <h3 className="text-lg font-semibold tracking-tight text-white mb-1">
          Verification Required
        </h3>
        <p className="text-xs text-neutral-400 text-center mb-6">
          Enter your security PIN to access this layer
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-500 scale-110'
                    : 'bg-[#B6A4DC] scale-110'
                  : 'bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium mb-3 animate-shake">
            Incorrect PIN. Try again.
          </p>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleNumClick(digit)}
              className="h-13 rounded-2xl bg-[#22242B] hover:bg-[#2C2F38] active:scale-95 text-xl font-semibold text-white transition-all cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Biometrics button (left) */}
          {settings.biometricsEnabled ? (
            <button
              type="button"
              onClick={handleBiometrics}
              className="h-13 rounded-2xl bg-[#22242B] hover:bg-[#2C2F38] active:scale-95 text-[#B6A4DC] transition-all cursor-pointer flex items-center justify-center"
              title="Authenticate with biometrics"
            >
              <Fingerprint className="w-6 h-6" />
            </button>
          ) : (
            <div />
          )}

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleNumClick('0')}
            className="h-13 rounded-2xl bg-[#22242B] hover:bg-[#2C2F38] active:scale-95 text-xl font-semibold text-white transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>

          {/* Delete (right) */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-2xl bg-[#22242B] hover:bg-[#2C2F38] active:scale-95 text-sm font-medium text-neutral-300 transition-all cursor-pointer flex items-center justify-center"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
