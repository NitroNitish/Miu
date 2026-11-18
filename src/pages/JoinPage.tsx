import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Sparkles, AlertCircle, ArrowRight, Sun, Moon, KeyRound } from 'lucide-react';

export const JoinPage: React.FC = () => {
  const { token: urlToken } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const { user, validateInvitation, acceptInvitation, register } = useAuth();
  const { isDark, setThemeMode } = useTheme();

  const [activeToken, setActiveToken] = useState<string>(urlToken || '');
  const [inputCode, setInputCode] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(Boolean(urlToken));
  const [isValid, setIsValid] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string>('Your partner');
  const [inviterUsername, setInviterUsername] = useState<string>('');

  // Registration state if user doesn't have an account
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Validate token or code
  const runValidation = async (secret: string) => {
    const clean = secret.trim();
    if (!clean) return;

    setIsValidating(true);
    setErrorMessage(null);
    setFormError(null);

    const res = await validateInvitation(clean);
    setIsValidating(false);

    if (res.valid) {
      setIsValid(true);
      setActiveToken(clean);
      if (res.creatorName) setInviterName(res.creatorName);
      if (res.creatorUsername) setInviterUsername(res.creatorUsername);
    } else {
      setIsValid(false);
      setErrorMessage(res.error || 'This invitation has expired or is invalid.');
    }
  };

  useEffect(() => {
    if (urlToken) {
      runValidation(urlToken);
    } else {
      setIsValidating(false);
    }
  }, [urlToken]);

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    await runValidation(inputCode.trim());
  };

  const handleAcceptLoggedIn = async () => {
    if (!activeToken) return;
    setIsSubmitting(true);
    setFormError(null);

    const res = await acceptInvitation(activeToken);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/chat');
    } else {
      setFormError(res.error || 'Failed to accept invitation.');
    }
  };

  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeToken) return;

    if (!username.trim() || !password) {
      setFormError('Please enter both a username and password.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    // 1. Register account
    const regRes = await register(
      username.trim(),
      password,
      displayName.trim() || username.trim()
    );

    if (!regRes.success) {
      setIsSubmitting(false);
      setFormError(regRes.error || 'Could not create account.');
      return;
    }

    // 2. Accept invitation atomically
    const acceptRes = await acceptInvitation(activeToken);
    setIsSubmitting(false);

    if (acceptRes.success) {
      navigate('/chat');
    } else {
      setFormError(acceptRes.error || 'Account created, but could not link connection.');
    }
  };

  return (
    <div className="miu min-h-screen flex items-center justify-center bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] p-4 transition-colors select-none">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#191A1D] border border-[#EAE5DE] dark:border-[#303136] rounded-[24px] p-6 sm:p-8 shadow-xl flex flex-col relative overflow-hidden animate-fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#EEEEEC] dark:border-[#303136]">
          <div className="flex items-baseline gap-1">
            <h1 className="text-[28px] font-bold tracking-tight text-[#1C1B1F] dark:text-[#F5F5F5]">
              miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
            </h1>
            <span className="text-[11px] text-[#8C867E] dark:text-[#999999] uppercase tracking-wider font-semibold">
              Invitation
            </span>
          </div>

          <button
            type="button"
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            className="p-2 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Body */}
        {isValidating ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#A99BCB] border-t-transparent animate-spin" />
            <p className="text-sm text-[#8C867E] dark:text-[#999999]">
              Verifying private invitation link...
            </p>
          </div>
        ) : !isValid ? (
          /* Enter Code or Error Screen */
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#A99BCB]/15 dark:bg-[#B6A4DC]/20 text-[#A99BCB] dark:text-[#B6A4DC] flex items-center justify-center">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#1C1B1F] dark:text-[#F5F5F5]">
              {errorMessage ? 'Invitation Unavailable' : 'Private Invitation'}
            </h2>
            <p className="text-xs text-[#8C867E] dark:text-[#999999] max-w-xs leading-relaxed">
              {errorMessage || 'Enter the 6-character code or full invitation link from your partner.'}
            </p>

            <form onSubmit={handleManualCodeSubmit} className="w-full space-y-3 pt-2">
              <input
                type="text"
                placeholder="Invitation Code (e.g. 7K9XY2)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full h-11 px-3.5 rounded-xl bg-[#FAF9F7] dark:bg-[#232428] border border-[#EAE5DE] dark:border-[#303136] text-sm text-center font-mono tracking-widest text-[#1C1B1F] dark:text-[#F5F5F5] outline-none focus:border-[#A99BCB]"
                required
              />
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#1E1F24] dark:bg-[#B6A4DC] text-white dark:text-[#111214] font-semibold text-xs hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
              >
                Validate Invitation
              </button>
            </form>

            <button
              onClick={() => navigate('/login')}
              className="text-xs text-[#8C867E] dark:text-[#999999] hover:underline pt-2 cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        ) : (
          /* Valid Invitation Screen */
          <div className="py-6 flex flex-col space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#A99BCB]/15 dark:bg-[#B6A4DC]/20 text-[#A99BCB] dark:text-[#B6A4DC] flex items-center justify-center mb-1">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-[#1C1B1F] dark:text-[#F5F5F5] tracking-tight">
                You've been invited to Miu.
              </h2>
              <p className="text-sm text-[#8C867E] dark:text-[#999999]">
                A private, encrypted space for two.
              </p>

              <div className="mt-2 px-3 py-1.5 rounded-full bg-[#F3F2F0] dark:bg-[#232428] border border-[#EEEEEC] dark:border-[#303136] text-xs font-medium text-[#171717] dark:text-[#F5F5F5] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#35B779]" />
                <span>Invited by <strong className="font-semibold">{inviterName}</strong> {inviterUsername && `(@${inviterUsername})`}</span>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {user ? (
              /* Already logged in: simple Accept button */
              <div className="space-y-3 pt-2">
                <p className="text-xs text-center text-[#8C867E] dark:text-[#999999]">
                  Logged in as <strong className="text-white">@{user.username}</strong>
                </p>
                <button
                  onClick={handleAcceptLoggedIn}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-[#1E1F24] dark:bg-[#B6A4DC] text-white dark:text-[#111214] font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Connecting...'
                  ) : (
                    <>
                      <span>Accept & Establish Connection</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Not logged in: Quick username + password form */
              <form onSubmit={handleRegisterAndAccept} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#8C867E] dark:text-[#999999] uppercase tracking-wider mb-1">
                    Your Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. elena"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#FAF9F7] dark:bg-[#232428] border border-[#EAE5DE] dark:border-[#303136] text-sm text-[#1C1B1F] dark:text-[#F5F5F5] outline-none focus:border-[#A99BCB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8C867E] dark:text-[#999999] uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Elena"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#FAF9F7] dark:bg-[#232428] border border-[#EAE5DE] dark:border-[#303136] text-sm text-[#1C1B1F] dark:text-[#F5F5F5] outline-none focus:border-[#A99BCB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8C867E] dark:text-[#999999] uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#FAF9F7] dark:bg-[#232428] border border-[#EAE5DE] dark:border-[#303136] text-sm text-[#1C1B1F] dark:text-[#F5F5F5] outline-none focus:border-[#A99BCB]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 mt-2 rounded-xl bg-[#1E1F24] dark:bg-[#B6A4DC] text-white dark:text-[#111214] font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    'Creating space...'
                  ) : (
                    <>
                      <span>Accept Invitation & Connect</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinPage;
