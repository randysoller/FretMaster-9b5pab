import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Platform, Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';
import { cloudSyncService } from '@/services/cloudSyncService';
import Constants from 'expo-constants';

interface Profile {
  id: string;
  username: string;
  skill_level: string;
  favorite_genres: string[];
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Validate environment variables on startup
  useEffect(() => {
    const validateEnvironment = () => {
      const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        const errorMsg = 'Missing Supabase environment variables. Please check your .env file.';
        console.error(errorMsg);
        
        if (Platform.OS === 'web') {
          console.warn(errorMsg);
        } else {
          Alert.alert(
            'Configuration Error',
            'App is not properly configured. Please contact support.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    validateEnvironment();
  }, []);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      setIsAdmin(data?.is_admin || false);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      // Provide user-friendly error message
      const errorMsg = 'Failed to load your profile. Please try signing in again.';
      if (Platform.OS !== 'web') {
        Alert.alert('Profile Error', errorMsg);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing out:', error);
      
      const errorMsg = error.message || 'Failed to sign out. Please try again.';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Sign Out Error', errorMsg);
      }
      throw error;
    }
  };

  // Initialize session on mount
  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        
        // Trigger cloud sync on sign in
        if (event === 'SIGNED_IN') {
          try {
            await cloudSyncService.initializeSync(session.user.id);
            
            const message = 'Your practice data has been synced to the cloud!';
            if (Platform.OS === 'web') {
              console.log(message);
            } else {
              Alert.alert('Sync Complete', message);
            }
          } catch (error: any) {
            console.error('Cloud sync error:', error);
            
            // Non-critical error - don't block sign in
            const errorMsg = 'Signed in successfully, but cloud sync failed. Your local data is safe.';
            if (Platform.OS !== 'web') {
              Alert.alert('Sync Warning', errorMsg);
            }
          }
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        isAdmin,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
