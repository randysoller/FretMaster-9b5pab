// Service for managing user calibration profiles
import { supabase } from './supabaseClient';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export interface CalibrationProfile {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  instrumentType: 'acoustic-guitar' | 'electric-guitar' | 'bass';
  settings: {
    noiseGateThreshold: number;
    smoothingFactor: number;
    confidenceThreshold: number;
    a4Frequency: number;
  };
  noiseProfile?: any;
  avgAccuracy?: number;
  totalCalibrations: number;
  lastUsedAt: string;
}

class CalibrationService {
  private currentDeviceName: string = 'Unknown Device';
  private currentDeviceType: 'mobile' | 'tablet' | 'desktop' = 'mobile';

  constructor() {
    this.initializeDeviceInfo();
  }

  private async initializeDeviceInfo() {
    try {
      // Get device name and type
      const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
      this.currentDeviceName = deviceName;

      // Determine device type
      if (Platform.OS === 'web') {
        this.currentDeviceType = 'desktop';
      } else if (Device.deviceType === Device.DeviceType.TABLET) {
        this.currentDeviceType = 'tablet';
      } else {
        this.currentDeviceType = 'mobile';
      }
    } catch (error) {
      console.error('Failed to get device info:', error);
    }
  }

  /**
   * Save calibration profile for current device
   */
  async saveProfile(
    settings: {
      noiseGateThreshold: number;
      smoothingFactor: number;
      confidenceThreshold: number;
      a4Frequency: number;
    },
    instrumentType: 'acoustic-guitar' | 'electric-guitar' | 'bass' = 'acoustic-guitar',
    avgAccuracy?: number,
    noiseProfile?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('save_calibration_profile', {
        p_device_name: this.currentDeviceName,
        p_device_type: this.currentDeviceType,
        p_instrument_type: instrumentType,
        p_settings: settings,
        p_noise_profile: noiseProfile || null,
        p_avg_accuracy: avgAccuracy || null,
      });

      if (error) {
        console.error('Error saving calibration profile:', error);
        return { success: false, error: error.message };
      }

      console.log('Calibration profile saved successfully:', data);
      return { success: true };
    } catch (error) {
      console.error('Failed to save calibration profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Load active calibration profile for current device
   */
  async loadActiveProfile(): Promise<CalibrationProfile | null> {
    try {
      const { data, error } = await supabase.rpc('load_active_calibration_profile');

      if (error) {
        console.error('Error loading calibration profile:', error);
        return null;
      }

      if (!data) {
        console.log('No active calibration profile found');
        return null;
      }

      console.log('Loaded calibration profile:', data);
      return data as CalibrationProfile;
    } catch (error) {
      console.error('Failed to load calibration profile:', error);
      return null;
    }
  }

  /**
   * Get all calibration profiles for current user
   */
  async getAllProfiles(): Promise<CalibrationProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_calibration_profiles')
        .select('*')
        .order('last_used_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }

      return data as CalibrationProfile[];
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
      return [];
    }
  }

  /**
   * Set a profile as active
   */
  async setActiveProfile(profileId: string): Promise<boolean> {
    try {
      // First, deactivate all profiles
      await supabase
        .from('user_calibration_profiles')
        .update({ is_active: false })
        .neq('id', profileId);

      // Then activate the selected profile
      const { error } = await supabase
        .from('user_calibration_profiles')
        .update({ 
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) {
        console.error('Error setting active profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to set active profile:', error);
      return false;
    }
  }

  /**
   * Delete a calibration profile
   */
  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_calibration_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error('Error deleting profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete profile:', error);
      return false;
    }
  }

  /**
   * Get current device info
   */
  getDeviceInfo() {
    return {
      deviceName: this.currentDeviceName,
      deviceType: this.currentDeviceType,
    };
  }
}

export const calibrationService = new CalibrationService();
