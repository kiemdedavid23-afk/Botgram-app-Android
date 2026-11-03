import React from 'react';
import {StatusBar} from 'react-native';
import {ThemeProvider, useTheme} from '../shared/theme';
import {RootNavigator} from './RootNavigator';
import {useRealtimeLifecycle} from './useRealtimeLifecycle';
import {
  registerMediaStorageCleaner,
  purgeMediaTempOnBoot,
} from '../core/media/registerMediaCleaner';
import {
  bindArchiveStore,
  createOpSqliteArchiveStore,
  registerArchiveStoreCleaner,
} from '../core/archive';
import {
  setCryptoProvider,
  createQuickCryptoProvider,
} from '../core/crypto';
import {fireAndForget} from '../core/utils/fireAndForget';

function AppStatusBar(): React.JSX.Element {
  const {mode} = useTheme();
  return (
    <StatusBar
      barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
    />
  );
}

function AppInner(): React.JSX.Element {
  useRealtimeLifecycle();
  React.useEffect(() => {
    setCryptoProvider(createQuickCryptoProvider());
    registerMediaStorageCleaner();
    bindArchiveStore(createOpSqliteArchiveStore());
    registerArchiveStoreCleaner();
    fireAndForget(purgeMediaTempOnBoot());
  }, []);
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
