import React, { useEffect, useState } from 'react';

import {
  BellIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

import toast from 'react-hot-toast';

import Spinner from '../../components/common/Spinner';
import AppearanceTab from '../../components/settings/AppearanceTab';
import NotificationsTab from '../../components/settings/NotificationsTab';
import ProfileTab from '../../components/settings/ProfileTab';
import SecurityTab from '../../components/settings/SecurityTab';
import { useAuth } from '../../context/AuthContext';
import settingsService from '../../services/settings';
import {
  AppearanceSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
} from '../../types';

type TabId = 'profile' | 'notifications' | 'security' | 'appearance';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);

  const { updateUser, changePassword, logout } = useAuth();

  // Settings state
  const [profileSettings, setProfileSettings] = useState<ProfileSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(
    null
  );
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await settingsService.getSettings();
      setProfileSettings(settings.profile);
      setNotificationSettings(settings.notifications);
      setSecuritySettings(settings.security);
      setAppearanceSettings(settings.appearance);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (data: Partial<ProfileSettings>) => {
    setSaving(true);
    try {
      await settingsService.updateProfile(data);
      updateUser(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async (data: Partial<NotificationSettings>) => {
    setSaving(true);
    try {
      await settingsService.updateNotifications(data);
      setNotificationSettings((prev) => ({ ...prev!, ...data }));
      toast.success('Notification settings updated');
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async (data: Partial<SecuritySettings>) => {
    setSaving(true);
    try {
      await settingsService.updateSecurity(data);
      setSecuritySettings((prev) => ({ ...prev!, ...data }));
      toast.success('Security settings updated');
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleAppearanceSave = async (data: Partial<AppearanceSettings>) => {
    setSaving(true);
    try {
      await settingsService.updateAppearance(data);
      setAppearanceSettings((prev) => ({ ...prev!, ...data }));
      toast.success('Appearance settings updated');
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (current: string, newPassword: string) => {
    await changePassword(current, newPassword);
  };

  const handleDeactivateAccount = async () => {
    try {
      await settingsService.deactivateAccount();
      await logout();
      toast.success('Account deactivated');
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to deactivate account');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account preferences</p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-8 px-6 min-w-max" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`
                  py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && profileSettings && (
            <ProfileTab settings={profileSettings} onSave={handleProfileSave} />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && notificationSettings && (
            <NotificationsTab settings={notificationSettings} onSave={handleNotificationsSave} />
          )}

          {/* Security Tab */}
          {activeTab === 'security' && securitySettings && (
            <SecurityTab
              settings={securitySettings}
              onSave={handleSecuritySave}
              onChangePassword={handlePasswordChange}
              onDeactivate={handleDeactivateAccount}
            />
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && appearanceSettings && (
            <AppearanceTab settings={appearanceSettings} onSave={handleAppearanceSave} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
