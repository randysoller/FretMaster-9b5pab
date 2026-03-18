import { supabase } from './supabaseClient';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  favoriteGenres?: string[];
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  async signUp(data: SignUpData) {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            skill_level: data.skillLevel,
            favorite_genres: data.favoriteGenres || [],
          },
        },
      });

      if (error) throw error;
      return { data: authData, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to sign up' };
    }
  }

  async signIn(data: SignInData) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      return { data: authData, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to sign in' };
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Failed to sign out' };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async updateProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async sendPasswordResetEmail(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'fretmaster://reset-password',
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to send reset email' };
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to update password' };
    }
  }

  validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || !email.trim()) {
      return { valid: false, error: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    return { valid: true };
  }

  validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || !password.trim()) {
      return { valid: false, error: 'Password is required' };
    }
    
    if (password.length < 12) {
      return { valid: false, error: 'Password must be at least 12 characters long' };
    }
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      return { 
        valid: false, 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      };
    }
    
    return { valid: true };
  }

  validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || !username.trim()) {
      return { valid: false, error: 'Username is required' };
    }
    
    if (username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters long' };
    }
    
    if (username.length > 20) {
      return { valid: false, error: 'Username must be less than 20 characters' };
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
    }
    
    return { valid: true };
  }
}

export const authService = new AuthService();
