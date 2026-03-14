import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { authService } from '@/services/authService';

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', icon: 'stars' },
  { value: 'intermediate', label: 'Intermediate', icon: 'trending-up' },
  { value: 'advanced', label: 'Advanced', icon: 'workspace-premium' },
];

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    // Validate username
    const usernameValidation = authService.validateUsername(username);
    if (!usernameValidation.valid) {
      if (Platform.OS === 'web') {
        alert(usernameValidation.error);
      } else {
        Alert.alert('Invalid Username', usernameValidation.error || '');
      }
      return;
    }

    // Validate email
    const emailValidation = authService.validateEmail(email);
    if (!emailValidation.valid) {
      if (Platform.OS === 'web') {
        alert(emailValidation.error);
      } else {
        Alert.alert('Invalid Email', emailValidation.error || '');
      }
      return;
    }

    // Validate password
    const passwordValidation = authService.validatePassword(password);
    if (!passwordValidation.valid) {
      if (Platform.OS === 'web') {
        alert(passwordValidation.error);
      } else {
        Alert.alert('Invalid Password', passwordValidation.error || '');
      }
      return;
    }

    setLoading(true);
    const { data, error } = await authService.signUp({
      email,
      password,
      username,
      skillLevel,
    });
    setLoading(false);

    if (error) {
      if (Platform.OS === 'web') {
        alert(error);
      } else {
        Alert.alert('Sign Up Failed', error);
      }
      return;
    }

    if (data) {
      const message = 'Account created successfully! You can now sign in.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Success', message);
      }
      router.replace('/sign-in');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: '',
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="music-note" size={48} color={colors.primary} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your guitar learning journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>USERNAME</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password (min. 6 characters)"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons 
                    name={showPassword ? 'visibility' : 'visibility-off'} 
                    size={20} 
                    color={colors.textMuted} 
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SKILL LEVEL</Text>
              <View style={styles.skillLevels}>
                {SKILL_LEVELS.map((level) => (
                  <Pressable
                    key={level.value}
                    style={[
                      styles.skillLevel,
                      skillLevel === level.value && styles.skillLevelActive,
                    ]}
                    onPress={() => setSkillLevel(level.value as any)}
                    disabled={loading}
                  >
                    <MaterialIcons 
                      name={level.icon as any} 
                      size={24} 
                      color={skillLevel === level.value ? '#000' : colors.textMuted} 
                    />
                    <Text style={[
                      styles.skillLevelText,
                      skillLevel === level.value && styles.skillLevelTextActive,
                    ]}>
                      {level.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable 
              style={[styles.signUpButton, loading && styles.buttonDisabled]} 
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <MaterialIcons name="person-add" size={20} color="#000" />
                  <Text style={styles.signUpButtonText}>CREATE ACCOUNT</Text>
                </>
              )}
            </Pressable>

            <Pressable 
              style={styles.signInLink} 
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.signInLinkText}>
                Already have an account? <Text style={styles.signInLinkAccent}>Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  skillLevels: {
    gap: spacing.sm,
  },
  skillLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  skillLevelActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skillLevelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  skillLevelTextActive: {
    color: '#000',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  signInLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  signInLinkAccent: {
    color: colors.primary,
    fontWeight: '700',
  },
});
