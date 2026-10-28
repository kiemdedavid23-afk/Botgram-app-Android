/**
 * Dossiers intégrés + création de dossiers locaux.
 */
import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert} from 'react-native';
import {Folder, Plus, Archive} from 'lucide-react-native';
import {useTheme, settingsMetrics as sm} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';
import {SettingsPage} from '../components/SettingsPage';
import {SettingsCard, CardTitle, LinkRow, RowDivider} from '../components/ui';

type Props = {onBack: () => void};

const BUILTIN: {id: string; label: string; sub?: string; archive?: boolean}[] = [
  {id: 'all', label: t.folderAll},
  {id: 'personal', label: t.folderPersonal},
  {id: 'work', label: t.folderWork},
  {id: 'unread', label: t.folderUnread},
  {id: 'archive', label: t.folderArchive, sub: t.folderArchiveSub, archive: true},
];

export function FoldersSettingsScreen({onBack}: Props): React.JSX.Element {
  const {colors, appearance, setAppearance} = useTheme();
  const [draft, setDraft] = useState('');
  const [creating, setCreating] = useState(false);

  const create = () => {
    const name = draft.trim();
    if (!name) {
      return;
    }
    setAppearance({
      customFolders: [...appearance.customFolders, {id: `custom_${Date.now()}`, name}],
    });
    setDraft('');
    setCreating(false);
  };

  const removeCustom = (id: string, name: string) => {
    Alert.alert(t.foldersTitle, name, [
      {text: t.cancel, style: 'cancel'},
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          setAppearance({
            customFolders: appearance.customFolders.filter(f => f.id !== id),
          }),
      },
    ]);
  };

  return (
    <SettingsPage title={t.foldersTitle} onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SettingsCard>
          <CardTitle>{t.foldersBuiltin}</CardTitle>
          {BUILTIN.map((f, i) => (
            <View key={f.id}>
              {i > 0 ? <RowDivider /> : null}
              <FolderLine
                Icon={f.archive ? Archive : Folder}
                label={f.label}
                sub={f.sub}
              />
            </View>
          ))}
        </SettingsCard>

        <SettingsCard>
          <CardTitle>{t.foldersCustom}</CardTitle>
          {appearance.customFolders.length === 0 ? (
            <Text style={[styles.empty, {color: colors.textSecondary}]}>
              {t.emptyCustomFolders}
            </Text>
          ) : (
            appearance.customFolders.map((f, i) => (
              <View key={f.id}>
                {i > 0 ? <RowDivider /> : null}
                <FolderLine
                  Icon={Folder}
                  label={f.name}
                  onLongPress={() => removeCustom(f.id, f.name)}
                />
              </View>
            ))
          )}
          <RowDivider />
          {creating ? (
            <View style={styles.form}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t.newFolderPlaceholder}
                placeholderTextColor={colors.textHint}
                style={[
                  styles.input,
                  {color: colors.textPrimary, backgroundColor: colors.bgSecondary},
                ]}
                autoFocus
                onSubmitEditing={create}
              />
              <View style={styles.actions}>
                <Pressable onPress={() => setCreating(false)} hitSlop={8}>
                  <Text style={[styles.action, {color: colors.textSecondary}]}>
                    {t.cancel}
                  </Text>
                </Pressable>
                <Pressable onPress={create} hitSlop={8}>
                  <Text style={[styles.action, styles.bold, {color: colors.accent}]}>
                    {t.createFolder}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <LinkRow Icon={Plus} label={t.newFolder} last onPress={() => setCreating(true)} />
          )}
        </SettingsCard>
      </ScrollView>
    </SettingsPage>
  );
}

function FolderLine({
  Icon,
  label,
  sub,
  onLongPress,
}: {
  Icon: typeof Folder;
  label: string;
  sub?: string;
  onLongPress?: () => void;
}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Pressable onLongPress={onLongPress} style={styles.line}>
      <Icon size={24} color={colors.accent} strokeWidth={1.75} />
      <View style={styles.labels}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{label}</Text>
        {sub ? (
          <Text style={{color: colors.textSecondary, fontSize: sm.subSize}}>{sub}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingTop: 12, paddingBottom: 24, gap: 12},
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  labels: {flex: 1, gap: 2},
  title: {fontSize: 17},
  empty: {paddingHorizontal: 20, paddingVertical: 12, fontSize: 15},
  form: {padding: 16, gap: 12},
  input: {borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16},
  actions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 24},
  action: {fontSize: 16},
  bold: {fontWeight: '700'},
});
