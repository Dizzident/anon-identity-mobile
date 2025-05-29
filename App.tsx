import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {IdentityProvider} from './src/context/IdentityContext';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <IdentityProvider>
        <AppNavigator />
      </IdentityProvider>
    </GestureHandlerRootView>
  );
}

export default App;
