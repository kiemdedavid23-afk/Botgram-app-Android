/**
 * Navigation racine — socle étape 1.
 * Le ShellSwitcher est isolé dans dev/ et temporaire.
 */
import React from 'react';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useTheme} from '../shared/theme';
import {ShellSwitcher} from './dev/ShellSwitcher';

export type RootStackParamList = {
  Shell: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const {colors, mode} = useTheme();

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bgSecondary,
      card: colors.bgPrimary,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Shell" component={ShellSwitcher} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
