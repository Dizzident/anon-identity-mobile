import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

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
  Scanner: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function IdentityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={IdentityListScreen}
        options={{title: 'My Identities'}}
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
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Identities"
          component={IdentityStack}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="Scanner"
          component={QRScannerScreen}
          options={{title: 'Scan QR Code'}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
