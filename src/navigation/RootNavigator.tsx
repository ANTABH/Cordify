import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/app/HomeScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { StringerProfileScreen } from '../screens/app/StringerProfileScreen';
import { DashboardScreen } from '../screens/stringer/DashboardScreen';
import { StockScreen } from '../screens/stringer/StockScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { session, loading, userRole } = useAuth();
  const { theme } = useTheme();

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
          fontSize: theme.typography.sizes.h3,
          color: theme.colors.textPrimary
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
            name="Login"
            component={LoginScreen}
            options={{
              title: '',
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.textSecondary,
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              title: '',
              headerStyle: { backgroundColor: theme.colors.background },
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
            options={{ 
              title: 'Paramètres',
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.textPrimary,
              headerTitleStyle: {
                color: theme.colors.textPrimary
              }
            }}
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
            options={{ 
              title: 'Paramètres',
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.textPrimary,
              headerTitleStyle: {
                color: theme.colors.textPrimary
              }
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

