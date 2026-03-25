import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/app/HomeScreen';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { session, loading } = useAuth();

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
        //headerBackTitleVisible: false,
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontFamily: theme.typography.fonts.semiBold,
          fontSize: theme.typography.sizes.h3
        }
      }}
    >
      {session ? (
        // App Stack
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
      ) : (
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
            options={({ route }: any) => {
              const isClient = route.params?.role === 'client';
              return {
                title: '',
                headerTintColor: isClient ? theme.colors.badmintonPrimary : theme.colors.tennisPrimary,
                headerStyle: { backgroundColor: theme.colors.surface }
              }
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
