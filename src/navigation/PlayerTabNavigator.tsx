import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/app/HomeScreen';
import { RacketsScreen } from '../screens/app/RacketsScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { TabBarJoueur } from '../components/navigation/TabBarJoueur';

const Tab = createBottomTabNavigator();

export const PlayerTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBarJoueur {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      <Tab.Screen 
        name="Rackets" 
        component={RacketsScreen} 
        options={{ title: 'Mes raquettes' }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};
