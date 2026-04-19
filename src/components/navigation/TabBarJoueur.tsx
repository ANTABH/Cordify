import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User, Search } from 'lucide-react-native';
import { RacketIcon } from '../RacketIcon';
import { useTheme } from '../../context/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

export const TabBarJoueur = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const themedStyles = styles(theme);

  // Seuls les onglets "Home", "Rackets" et "Settings" sont gérés ici
  // On s'assure que l'ordre correspond à ce que l'utilisateur a demandé :
  // Gauche : Mes raquettes (Rackets)
  // Milieu : Accueil (Home)
  // Droite : Paramètres (Settings)

  return (
    <View style={[themedStyles.container, { bottom: insets.bottom + 8 }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 50 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={themedStyles.blurContainer}
      >
        <View style={themedStyles.tabContent}>
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
            else if (route.name === 'Settings') Icon = User;
            else if (route.name === 'Rackets') Icon = RacketIcon;
            else Icon = Search; // Fallback

            const label = options.title !== undefined ? options.title : route.name;

            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={(options as any).tabBarAccessibilityLabel}
                testID={(options as any).tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={themedStyles.tabItem}
              >
                <View style={[
                  themedStyles.iconWrapper,
                  isFocused && { backgroundColor: theme.colors.badmintonPrimary + '20' }
                ]}>
                  <Icon 
                    size={24} 
                    color={isFocused ? theme.colors.badmintonPrimary : theme.colors.textSecondary} 
                  />
                </View>
                <Text style={[
                  themedStyles.label,
                  { color: isFocused ? theme.colors.badmintonPrimary : theme.colors.textSecondary }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
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
    borderWidth: 0, // Suppression de la bordure blanche
  },
  tabContent: {
    flexDirection: 'row',
    height: 85, // Augmenté pour accueillir le texte
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4, // Espace entre l'icône et le texte
  },
  iconWrapper: {
    padding: 8, // Réduit légèrement pour compenser l'ajout du texte
    borderRadius: 18,
  },
  label: {
    fontSize: 10,
    fontFamily: theme.typography.fonts.medium,
    textAlign: 'center',
  }
});
