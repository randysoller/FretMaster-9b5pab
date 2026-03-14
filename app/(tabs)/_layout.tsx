import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 56,
      android: insets.bottom + 56,
      default: 56,
    }),
    paddingTop: 0,
    paddingBottom: Platform.select({
      ios: insets.bottom,
      android: insets.bottom,
      default: 0,
    }),
    paddingHorizontal: 0,
    backgroundColor: `rgba(13, 11, 8, 0.92)`, // BG Base at 92% opacity
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          fontFamily: 'Sora',
        },
        tabBarIconStyle: {
          width: 30,
          height: 30,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="music-note" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="metronome"
        options={{
          title: 'Metronome',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="speed" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tuner"
        options={{
          title: 'Tuner',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="tune" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: 'Lessons',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="play-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="library-music" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
