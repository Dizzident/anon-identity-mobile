import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {useTheme} from '../context/ThemeContext';
import {Icon, IconNames} from '../components/Icon';

import IdentityListScreen from '../screens/IdentityListScreen';
import IdentityDetailScreen from '../screens/IdentityDetailScreen';
import QRScannerScreen from '../screens/QRScannerScreen';

export type RootStackParamList = {
  Home: undefined;
  IdentityDetail: {identityId: string};
  QRScanner: undefined;
};

export type TabParamList = {
  Identities: undefined;
  Scan: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function IdentityStack() {
  const {theme} = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          color: theme.colors.text,
        },
      }}>
      <Stack.Screen
        name="Home"
        component={IdentityListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="IdentityDetail"
        component={IdentityDetailScreen}
        options={{title: 'Identity Details'}}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const {theme} = useTheme();
  
  return (
    <NavigationContainer
      theme={{
        dark: theme.dark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.notification,
        },
      }}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          headerStyle: {
            backgroundColor: theme.colors.card,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: {
            color: theme.colors.text,
          },
        }}>
        <Tab.Screen
          name="Identities"
          component={IdentityStack}
          options={{
            headerShown: false,
            tabBarIcon: ({color, size}) => (
              <Icon name={IconNames.identity} color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Scan"
          component={QRScannerScreen}
          options={{
            title: 'Scan QR Code',
            tabBarIcon: ({color, size}) => (
              <Icon name={IconNames.scan} color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}


export default AppNavigator;
