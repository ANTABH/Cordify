import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/app/HomeScreen';
import { RacketsScreen } from '../screens/app/RacketsScreen';
import { OrdersScreen } from '../screens/app/OrdersScreen';
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
        options={{ title: 'Matériel' }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen} 
        options={{ title: 'Commandes' }}
      />
    </Tab.Navigator>
  );
};
