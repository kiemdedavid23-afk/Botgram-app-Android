import React from 'react';
import {StatusBar} from 'react-native';
import {ThemeProvider, useTheme} from '../shared/theme';
import {RootNavigator} from './RootNavigator';

function AppStatusBar(): React.JSX.Element {
  const {mode, colors} = useTheme();
  return (
    <StatusBar
      barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
    />
  );
}

function AppInner(): React.JSX.Element {
  return (
    <>
      <AppStatusBar />
      <RootNavigator />
    </>
  );
}

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
