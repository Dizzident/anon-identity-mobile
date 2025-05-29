import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {IdentityProvider} from './src/context/IdentityContext';
import {ThemeProvider} from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider>
        <IdentityProvider>
          <AppNavigator />
        </IdentityProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default App;
