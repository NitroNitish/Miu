import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Eye,
  Clock,
  CheckCheck,
  Bell,
  Volume2,
  HardDrive,
  Trash2,
  KeyRound,
  LogOut,
  Shield,
  ChevronRight,
  UserCheck,
  Camera,
  Check,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/common/Avatar';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { ThemeMode } from '../types';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { themeMode, setThemeMode } = useTheme();
  const { partner, user } = useChat();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings toggles
  const [onlineVisibility, setOnlineVisibility] = useState(true);
  const [lastActiveEnabled, setLastActiveEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageSounds, setMessageSounds] = useState(true);
  const [cacheSize, setCacheSize] = useState('142.8 MB');

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editName, setEditName] = useState(partner.name);
  const [editBio, setEditBio] = useState(partner.bio);

  const handleClearCache = () => {
    setCacheSize('0.0 KB');
    setToastMessage('Temporary media cache cleared');
  };

  const themeOptions: { id: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Laptop },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F7] dark:bg-[#111214] pb-24 md:pb-8">
      <Toast
        message={toastMessage || ''}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/90 dark:bg-[#111214]/90 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#303136] px-4 py-3 safe-pt">
        <div className="flex items-baseline gap-1.5">
          <h1 className="text-[27px] font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
            miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
          </h1>
          <span className="text-[11px] text-[#777777] dark:text-[#999999] font-medium tracking-wider uppercase">
            Settings
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile Card Section */}
        <div className="flex flex-col items-center text-center p-6 bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl shadow-xs animate-fade-in relative">
          <div className="relative mb-3">
            <Avatar src={partner.avatar} name={partner.name} size="xl" showOnline />
          </div>

          <h2 className="text-lg font-bold text-[#171717] dark:text-[#F5F5F5]">
            {partner.name}
          </h2>
          <p className="text-xs text-[#777777] dark:text-[#999999] mb-1">
            {partner.handle}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 italic max-w-xs mb-3">
            "{partner.bio}"
          </p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] text-[#35B779] bg-[#35B779]/10 px-2.5 py-0.5 rounded-full font-medium border border-[#35B779]/20 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Direct Encrypted Link</span>
            </span>
          </div>

          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="px-4 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Edit profile
          </button>
        </div>

        {/* SETTINGS GROUP 1: APPEARANCE */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#777777] dark:text-[#999999] uppercase tracking-wider px-1">
            Appearance
          </h3>
          <div className="bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl p-2 shadow-xs">
            <div className="grid grid-cols-3 gap-1.5">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setThemeMode(opt.id);
                      setToastMessage(`Theme set to ${opt.label}`);
                    }}
                    className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-[#171717] dark:text-[#F5F5F5] font-semibold ring-1 ring-neutral-300 dark:ring-neutral-600'
                        : 'text-[#777777] dark:text-[#999999] hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1 stroke-[1.8]" />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SETTINGS GROUP 2: PRIVACY */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#777777] dark:text-[#999999] uppercase tracking-wider px-1">
            Privacy
          </h3>
          <div className="bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl divide-y divide-[#EEEEEC] dark:divide-[#303136] shadow-xs">
            {/* Online visibility */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-neutral-500" />
                <div>
                  <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">
                    Online visibility
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                    Show when you are actively using miu
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={onlineVisibility}
                onChange={(e) => {
                  setOnlineVisibility(e.target.checked);
                  setToastMessage(e.target.checked ? 'Online status visible' : 'Online status hidden');
                }}
                className="w-4 h-4 accent-[#202124] dark:accent-[#B6A4DC] cursor-pointer"
              />
            </div>

            {/* Last active */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-neutral-500" />
                <div>
                  <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">
                    Last active timestamp
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                    Display time since your last interaction
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={lastActiveEnabled}
                onChange={(e) => setLastActiveEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#202124] dark:accent-[#B6A4DC] cursor-pointer"
              />
            </div>

            {/* Read receipts */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <CheckCheck className="w-4 h-4 text-neutral-500" />
                <div>
                  <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">
                    Read receipts
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                    Show double ticks when messages are viewed
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={readReceipts}
                onChange={(e) => {
                  setReadReceipts(e.target.checked);
                  setToastMessage(e.target.checked ? 'Read receipts enabled' : 'Read receipts turned off');
                }}
                className="w-4 h-4 accent-[#202124] dark:accent-[#B6A4DC] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SETTINGS GROUP 3: NOTIFICATIONS */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#777777] dark:text-[#999999] uppercase tracking-wider px-1">
            Notifications
          </h3>
          <div className="bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl divide-y divide-[#EEEEEC] dark:divide-[#303136] shadow-xs">
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-neutral-500" />
                <div>
                  <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">
                    Push notifications
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                    Receive discreet alerts for new messages
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="w-4 h-4 accent-[#202124] dark:accent-[#B6A4DC] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-neutral-500" />
                <div>
                  <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">
                    Message sounds
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                    Subtle acoustic feedback on send and receive
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={messageSounds}
                onChange={(e) => setMessageSounds(e.target.checked)}
                className="w-4 h-4 accent-[#202124] dark:accent-[#B6A4DC] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SETTINGS GROUP 4: STORAGE */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#777777] dark:text-[#999999] uppercase tracking-wider px-1">
            Storage & Data
          </h3>
          <div className="bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">
                  Temporary media cache
                </p>
                <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                  Local cached photos and voice previews ({cacheSize})
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* SETTINGS GROUP 5: ACCOUNT */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#777777] dark:text-[#999999] uppercase tracking-wider px-1">
            Account & Security
          </h3>
          <div className="bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl divide-y divide-[#EEEEEC] dark:divide-[#303136] shadow-xs">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">
                  Change application passcode
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              onClick={() => {
                if (window.confirm('Log out of this private session?')) {
                  navigate('/login');
                }
              }}
              className="w-full flex items-center gap-3 p-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-medium">Log out</span>
            </button>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Partner Profile"
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-neutral-500 uppercase">
              Display Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-[#171717] dark:text-[#F5F5F5] focus:outline-none focus:border-[#A99BCB]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-500 uppercase">
              Bio Note
            </label>
            <input
              type="text"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-[#171717] dark:text-[#F5F5F5] focus:outline-none focus:border-[#A99BCB]"
            />
          </div>

          <button
            onClick={() => {
              setIsEditProfileOpen(false);
              setToastMessage('Profile details saved');
            }}
            className="w-full mt-2 py-2 rounded-xl bg-[#202124] text-white dark:bg-[#B6A4DC] dark:text-[#111214] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Change Passcode Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change App Passcode"
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-neutral-500 uppercase">
              Current Passcode
            </label>
            <input
              type="password"
              placeholder="••••"
              maxLength={6}
              className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-center tracking-widest text-[#171717] dark:text-[#F5F5F5] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-500 uppercase">
              New Passcode
            </label>
            <input
              type="password"
              placeholder="••••"
              maxLength={6}
              className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-center tracking-widest text-[#171717] dark:text-[#F5F5F5] focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setIsPasswordModalOpen(false);
              setToastMessage('Passcode updated successfully');
            }}
            className="w-full mt-2 py-2 rounded-xl bg-[#202124] text-white dark:bg-[#B6A4DC] dark:text-[#111214] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Update Passcode
          </button>
        </div>
      </Modal>
    </div>
  );
};
