import React from 'react';
import {IdentityProvider} from './src/context/IdentityContext';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <IdentityProvider>
      <AppNavigator />
    </IdentityProvider>
  );
}

export default App;
