import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { authService } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    // Validate email
    const validation = authService.validateEmail(email);
    if (!validation.valid) {
      if (Platform.OS === 'web') {
        alert(validation.error);
      } else {
        Alert.alert('Invalid Email', validation.error);
      }
      return;
    }

    setLoading(true);
    const { error } = await authService.sendPasswordResetEmail(email);
    setLoading(false);

    if (error) {
      if (Platform.OS === 'web') {
        alert(error);
      } else {
        Alert.alert('Reset Failed', error);
      }
      return;
    }

    setEmailSent(true);
  };

  if (emailSent) {
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
          <View style={styles.container}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <MaterialIcons name="mark-email-read" size={64} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successMessage}>
                We've sent password reset instructions to:
              </Text>
              <Text style={styles.successEmail}>{email}</Text>
              <Text style={styles.successHint}>
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </Text>

              <Pressable 
                style={styles.backButton} 
                onPress={() => router.replace('/sign-in')}
              >
                <MaterialIcons name="arrow-back" size={20} color="#000" />
                <Text style={styles.backButtonText}>BACK TO SIGN IN</Text>
              </Pressable>

              <Pressable 
                style={styles.resendLink} 
                onPress={() => setEmailSent(false)}
              >
                <Text style={styles.resendLinkText}>
                  Didn't receive the email? <Text style={styles.resendLinkAccent}>Send again</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </Screen>
      </>
    );
  }

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
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="lock-reset" size={48} color={colors.primary} />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
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
                  autoFocus
                  editable={!loading}
                />
              </View>
            </View>

            <Pressable 
              style={[styles.resetButton, loading && styles.buttonDisabled]} 
              onPress={handleSendResetEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#000" />
                  <Text style={styles.resetButtonText}>SEND RESET LINK</Text>
                </>
              )}
            </Pressable>

            <Pressable 
              style={styles.cancelLink} 
              onPress={() => router.back()}
              disabled={loading}
            >
              <MaterialIcons name="arrow-back" size={16} color={colors.textSecondary} />
              <Text style={styles.cancelLinkText}>Back to Sign In</Text>
            </Pressable>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <MaterialIcons name="info-outline" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              For security reasons, you'll receive an email even if this address isn't registered with us.
            </Text>
          </View>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 2,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  form: {
    marginBottom: spacing.xxl,
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  cancelLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  info: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 3,
    borderColor: colors.success,
  },
  successTitle: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.md,
  },
  successMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successEmail: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  successHint: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  backButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  resendLink: {
    paddingVertical: spacing.md,
  },
  resendLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  resendLinkAccent: {
    color: colors.primary,
    fontWeight: '700',
  },
});
