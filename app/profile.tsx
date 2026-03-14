import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const GENRE_OPTIONS = ['Rock', 'Blues', 'Jazz', 'Classical', 'Country', 'Metal', 'Pop', 'Folk'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [username, setUsername] = useState(profile?.username || '');
  const [skillLevel, setSkillLevel] = useState<typeof SKILL_LEVELS[number]>(
    (profile?.skill_level as typeof SKILL_LEVELS[number]) || 'beginner'
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    profile?.favorite_genres || []
  );

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await authService.updateProfile(user.id, {
      username,
      skill_level: skillLevel,
      favorite_genres: selectedGenres,
    });

    setLoading(false);

    if (error) {
      const message = error || 'Failed to update profile';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    await refreshProfile();
    setEditing(false);
    
    const message = 'Profile updated successfully!';
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Success', message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  if (!user || !profile) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: 'Profile',
          headerRight: () => (
            <Pressable onPress={() => setEditing(!editing)} style={styles.editButton}>
              <MaterialIcons 
                name={editing ? 'close' : 'edit'} 
                size={24} 
                color={colors.primary} 
              />
            </Pressable>
          ),
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={48} color={colors.primary} />
            </View>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          {/* Profile Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>USERNAME</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={colors.textMuted}
                editable={!loading}
              />
            ) : (
              <Text style={styles.value}>{profile.username}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SKILL LEVEL</Text>
            {editing ? (
              <View style={styles.skillLevels}>
                {SKILL_LEVELS.map(level => (
                  <Pressable
                    key={level}
                    style={[
                      styles.skillLevel,
                      skillLevel === level && styles.skillLevelActive,
                    ]}
                    onPress={() => setSkillLevel(level)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.skillLevelText,
                      skillLevel === level && styles.skillLevelTextActive,
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.value}>
                {profile.skill_level?.charAt(0).toUpperCase() + profile.skill_level?.slice(1)}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FAVORITE GENRES</Text>
            {editing ? (
              <View style={styles.genres}>
                {GENRE_OPTIONS.map(genre => (
                  <Pressable
                    key={genre}
                    style={[
                      styles.genreChip,
                      selectedGenres.includes(genre) && styles.genreChipActive,
                    ]}
                    onPress={() => toggleGenre(genre)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.genreText,
                      selectedGenres.includes(genre) && styles.genreTextActive,
                    ]}>
                      {genre}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.value}>
                {profile.favorite_genres?.join(', ') || 'None selected'}
              </Text>
            )}
          </View>

          {/* Save Button */}
          {editing && (
            <Pressable 
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#000" />
                  <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                </>
              )}
            </Pressable>
          )}

          {/* Account Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/stats' as any)}
            >
              <MaterialIcons name="bar-chart" size={24} color={colors.text} />
              <Text style={styles.actionText}>Practice Stats</Text>
              <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Pressable>

            <Pressable 
              style={styles.actionButton}
              onPress={handleSignOut}
            >
              <MaterialIcons name="logout" size={24} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Sign Out</Text>
              <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    padding: spacing.sm,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 16,
    color: colors.text,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillLevels: {
    gap: spacing.sm,
  },
  skillLevel: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skillLevelActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skillLevelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  skillLevelTextActive: {
    color: '#000',
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreText: {
    fontSize: 14,
    color: colors.text,
  },
  genreTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  actionsSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
