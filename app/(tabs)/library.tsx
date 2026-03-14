import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Screen } from '@/components';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function LibraryScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/profile');
      } else {
        router.replace('/sign-in');
      }
    }
  }, [user, loading]);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
