/**
 * Pile Paramètres bot : hub + sous-pages.
 * BackHandler : sous-page → hub ; hub laisse remonter (onglet Échanges).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, BackHandler} from 'react-native';
import {
  BotSettingsHubScreen,
  type SettingsRoute,
} from '../screens/BotSettingsHubScreen';
import {AppearanceScreen} from '../screens/AppearanceScreen';
import {DiscussionsScreen} from '../screens/DiscussionsScreen';
import {FoldersSettingsScreen} from '../screens/FoldersSettingsScreen';
import {LanguageScreen} from '../screens/LanguageScreen';
import {PermissionsScreen} from '../screens/PermissionsScreen';
import {ComingSoonScreen} from '../screens/ComingSoonScreen';
import {settingsTexts as t} from '../texts';

export function BotSettingsStack(): React.JSX.Element {
  const [route, setRoute] = useState<SettingsRoute>('hub');

  const goHub = useCallback(() => setRoute('hub'), []);

  useEffect(() => {
    if (route === 'hub') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route === 'folders') {
        setRoute('discussions');
        return true;
      }
      setRoute('hub');
      return true;
    });
    return () => sub.remove();
  }, [route]);

  if (route === 'appearance') {
    return (
      <View style={styles.root}>
        <AppearanceScreen onBack={goHub} />
      </View>
    );
  }
  if (route === 'discussions') {
    return (
      <View style={styles.root}>
        <DiscussionsScreen
          onBack={goHub}
          onOpenFolders={() => setRoute('folders')}
        />
      </View>
    );
  }
  if (route === 'folders') {
    return (
      <View style={styles.root}>
        <FoldersSettingsScreen onBack={() => setRoute('discussions')} />
      </View>
    );
  }
  if (route === 'language') {
    return (
      <View style={styles.root}>
        <LanguageScreen onBack={goHub} />
      </View>
    );
  }
  if (route === 'permissions') {
    return (
      <View style={styles.root}>
        <PermissionsScreen onBack={goHub} />
      </View>
    );
  }
  if (route === 'account') {
    return (
      <View style={styles.root}>
        <ComingSoonScreen title={t.account} onBack={goHub} />
      </View>
    );
  }
  if (route === 'documentation') {
    return (
      <View style={styles.root}>
        <ComingSoonScreen title={t.documentation} onBack={goHub} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BotSettingsHubScreen onNavigate={setRoute} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
});
