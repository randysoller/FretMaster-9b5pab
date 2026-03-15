import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function LibraryLandingScreen() {
  const router = useRouter();

  const libraries = [
    {
      id: 'chords',
      title: 'Chords',
      icon: 'music-note',
      count: '124 diagrams',
      color: colors.primary,
      route: '/chord-library',
    },
    {
      id: 'scales',
      title: 'Scales',
      icon: 'show-chart',
      count: '15+ patterns',
      color: '#4DB8E8',
      route: '/scale-library',
    },
    {
      id: 'triads',
      title: 'Triads',
      icon: 'change-history',
      count: '36 shapes',
      color: '#8B5CF6',
      route: '/triad-library',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Libraries</Text>
          <Text style={styles.subtitle}>
            Explore comprehensive collections of chords, scales, and triads
          </Text>
        </View>

        {/* Library Cards */}
        <View style={styles.cardsContainer}>
          {libraries.map((library) => (
            <Pressable
              key={library.id}
              style={({ pressed }) => [
                styles.card,
                { borderLeftColor: library.color },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(library.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: library.color + '20' }]}>
                <MaterialIcons name={library.icon as any} size={32} color={library.color} />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{library.title}</Text>
                <Text style={styles.cardCount}>{library.count}</Text>
              </View>

              <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <MaterialIcons name="info-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Tap any library to browse, practice, and create custom presets. Swipe through items in detail view.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    gap: spacing.md,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoSection: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
