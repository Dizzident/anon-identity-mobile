import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {IdentityProvider} from './src/context/IdentityContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent(): React.JSX.Element {
  const {theme, isDarkMode} = useTheme();
  
  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <GestureHandlerRootView style={{flex: 1, backgroundColor: theme.colors.background}}>
        <IdentityProvider>
          <AppNavigator />
        </IdentityProvider>
      </GestureHandlerRootView>
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
