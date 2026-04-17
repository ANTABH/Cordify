import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { StringerProfileScreen } from '../screens/app/StringerProfileScreen';
import { BookingScreen } from '../screens/app/BookingScreen';
import { DashboardScreen } from '../screens/stringer/DashboardScreen';
import { StockScreen } from '../screens/stringer/StockScreen';
import { OrdersScreen } from '../screens/stringer/OrdersScreen';
import { PlayerTabNavigator } from './PlayerTabNavigator';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
            name="Orders"
            component={OrdersScreen}
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
        // Client Stack (Player)
        <>
          <Stack.Screen
            name="MainTabs"
            component={PlayerTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StringerProfile"
            component={StringerProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Booking"
            component={BookingScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
