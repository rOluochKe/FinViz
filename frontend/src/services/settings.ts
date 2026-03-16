import {
  AppearanceSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  Settings,
} from '../types';
import api from './api';

class SettingsService {
  private static instance: SettingsService;

  private constructor() {}

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<Settings> {
    const response = await api.get<{ user: any }>('/auth/me');
    const user = response.user;

    return {
      currency: user.preferences?.currency || 'USD',
      language: user.preferences?.language || 'en',
      timezone: user.preferences?.timezone || 'America/New_York',
      profile: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        timezone: user.preferences?.timezone || 'America/New_York',
        date_format: user.preferences?.date_format || 'YYYY-MM-DD',
        currency: user.preferences?.currency || 'USD',
        language: user.preferences?.language || 'en',
      },
      notifications: user.preferences?.notifications || {
        email: true,
        push: false,
        budget_alerts: true,
        weekly_summary: true,
        large_transaction_alerts: true,
        marketing_emails: false,
      },
      security: {
        two_factor_enabled: user.two_factor_enabled || false,
        session_timeout: user.session_timeout || 30,
        login_notifications: user.login_notifications || true,
        device_management: true,
        last_password_change: user.last_password_change,
      },
      appearance: user.preferences?.appearance || {
        theme: 'light',
        density: 'comfortable',
        animations: true,
        reduced_motion: false,
        high_contrast: false,
      },
    };
  }

  /**
   * Update profile settings
   */
  async updateProfile(data: Partial<ProfileSettings>): Promise<void> {
    await api.put('/auth/me', data);
  }

  /**
   * Update notification settings
   */
  async updateNotifications(data: Partial<NotificationSettings>): Promise<void> {
    await api.put('/auth/me', { preferences: { notifications: data } });
  }

  /**
   * Update security settings
   */
  async updateSecurity(data: Partial<SecuritySettings>): Promise<void> {
    await api.put('/auth/me', data);
  }

  /**
   * Update appearance settings
   */
  async updateAppearance(data: Partial<AppearanceSettings>): Promise<void> {
    await api.put('/auth/me', { preferences: { appearance: data } });
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(): Promise<void> {
    await api.post('/auth/deactivate');
  }

  /**
   * Get login history
   */
  async getLoginHistory(): Promise<any[]> {
    // This would need a backend endpoint
    return [];
  }

  /**
   * Get connected devices
   */
  async getDevices(): Promise<any[]> {
    // This would need a backend endpoint
    return [];
  }

  /**
   * Revoke device access
   */
  async revokeDevice(deviceId: string): Promise<void> {
    await deviceId;
    // This would need a backend endpoint
  }
}

export default SettingsService.getInstance();
