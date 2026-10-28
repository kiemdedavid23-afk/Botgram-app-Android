/**
 * Sous-page Discussions — dossiers et envoi des messages.
 * (Vue de la liste et glissement sont dans Apparence, comme la référence.)
 */
import React from 'react';
import {Text, ScrollView, Switch, StyleSheet} from 'react-native';
import {Folder, CornerDownLeft, ChevronRight} from 'lucide-react-native';
import {useTheme} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';
import {SettingsPage} from '../components/SettingsPage';
import {SettingsCard, CardTitle, LinkRow} from '../components/ui';

type Props = {
  onBack: () => void;
  onOpenFolders: () => void;
};

export function DiscussionsScreen({onBack, onOpenFolders}: Props): React.JSX.Element {
  const {colors, appearance, setAppearance} = useTheme();
  return (
    <SettingsPage title={t.discussionsTitle} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingsCard>
          <LinkRow
            Icon={Folder}
            label={t.folders}
            last
            onPress={onOpenFolders}
            trailing={<ChevronRight size={20} color={colors.textHint} />}
          />
        </SettingsCard>

        <SettingsCard>
          <CardTitle>{t.sendSection}</CardTitle>
          <LinkRow
            Icon={CornerDownLeft}
            label={t.sendWithEnter}
            last
            trailing={
              <Switch
                value={appearance.sendWithEnter}
                onValueChange={v => setAppearance({sendWithEnter: v})}
                trackColor={{false: colors.bgTertiary, true: colors.accent}}
              />
            }
          />
        </SettingsCard>
        <Text style={[styles.hint, {color: colors.textSecondary}]}>
          {t.sendWithEnterSub}
        </Text>
      </ScrollView>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingTop: 12, paddingBottom: 24, gap: 12},
  hint: {fontSize: 13, paddingHorizontal: 32, marginTop: -4},
});
