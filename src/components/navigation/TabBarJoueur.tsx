import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Settings, Search } from 'lucide-react-native';
import { RacketIcon } from '../RacketIcon';
import { useTheme } from '../../context/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

export const TabBarJoueur = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  // Seuls les onglets "Home", "Rackets" et "Settings" sont gérés ici
  // On s'assure que l'ordre correspond à ce que l'utilisateur a demandé :
  // Gauche : Mes raquettes (Rackets)
  // Milieu : Accueil (Home)
  // Droite : Paramètres (Settings)

  return (
    <View style={[styles.container, { bottom: insets.bottom + 8 }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 50 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        <View style={styles.tabContent}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            let Icon;
            if (route.name === 'Home') Icon = Home;
            else if (route.name === 'Settings') Icon = Settings;
            else if (route.name === 'Rackets') Icon = RacketIcon;
            else Icon = Search; // Fallback

            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={(options as any).tabBarAccessibilityLabel}
                testID={(options as any).tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                <View style={[
                  styles.iconWrapper,
                  isFocused && { backgroundColor: theme.colors.badmintonPrimary + '20' }
                ]}>
                  <Icon 
                    size={24} 
                    color={isFocused ? theme.colors.badmintonPrimary : theme.colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  blurContainer: {
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabContent: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 20,
  }
});
