import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { HomeScreen } from '../screens/app/HomeScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { StringerProfileScreen } from '../screens/app/StringerProfileScreen';
import { DashboardScreen } from '../screens/stringer/DashboardScreen';
import { StockScreen } from '../screens/stringer/StockScreen';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { session, loading, userRole } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.badmintonPrimary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontFamily: theme.typography.fonts.semiBold,
          fontSize: theme.typography.sizes.h3
        }
      }}
    >
      {!session ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: '',
              headerStyle: { backgroundColor: theme.colors.background },
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              headerTintColor: theme.colors.textSecondary,
            }}
          />
        </>
      ) : userRole === 'stringer' ? (
        // Stringer Stack
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Stock"
            component={StockScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Paramètres' }}
          />
        </>
      ) : (
        // Client Stack
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StringerProfile"
            component={StringerProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
             name="Settings"
             component={SettingsScreen}
             options={{ title: 'Paramètres' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
