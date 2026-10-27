/**
 * Dossiers intégrés + création de dossiers locaux.
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import {Folder, Plus, Archive} from 'lucide-react-native';
import {SettingsShell} from '../../../shared/components/SettingsShell';
import {
  useTheme,
  settingsMetrics as sm,
  getShadow,
} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';

type Props = {onBack: () => void};

const BUILTIN: {id: string; label: string; sub?: string; archive?: boolean}[] = [
  {id: 'all', label: t.folderAll},
  {id: 'personal', label: t.folderPersonal},
  {id: 'work', label: t.folderWork},
  {id: 'unread', label: t.folderUnread},
  {
    id: 'archive',
    label: t.folderArchive,
    sub: t.folderArchiveSub,
    archive: true,
  },
];

export function FoldersSettingsScreen({onBack}: Props): React.JSX.Element {
  const {colors, mode, appearance, setAppearance} = useTheme();
  const [draft, setDraft] = useState('');
  const [creating, setCreating] = useState(false);

  const card = [
    styles.card,
    {backgroundColor: colors.bgPrimary},
    getShadow('sm', mode),
  ];

  const create = () => {
    const name = draft.trim();
    if (!name) return;
    const id = `custom_${Date.now()}`;
    setAppearance({
      customFolders: [...appearance.customFolders, {id, name}],
    });
    setDraft('');
    setCreating(false);
  };

  const removeCustom = (id: string) => {
    Alert.alert(t.foldersTitle, nameFor(id), [
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

  const nameFor = (id: string) =>
    appearance.customFolders.find(f => f.id === id)?.name ?? id;

  return (
    <SettingsShell title={t.foldersTitle} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.section, {color: colors.textHint}]}>
          {t.foldersBuiltin}
        </Text>
        <View style={card}>
          {BUILTIN.map((f, i) => (
            <View key={f.id}>
              {i > 0 ? (
                <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
              ) : null}
              <View style={styles.row}>
                {f.archive ? (
                  <Archive size={18} color={colors.accent} />
                ) : (
                  <Folder size={18} color={colors.accent} />
                )}
                <View style={styles.labels}>
                  <Text style={[styles.title, {color: colors.textPrimary}]}>
                    {f.label}
                  </Text>
                  {f.sub ? (
                    <Text style={{color: colors.textSecondary, fontSize: sm.subSize}}>
                      {f.sub}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.section, {color: colors.textHint}]}>
          {t.foldersCustom}
        </Text>
        <View style={card}>
          {appearance.customFolders.length === 0 ? (
            <Text style={[styles.empty, {color: colors.textSecondary}]}>
              {t.emptyCustomFolders}
            </Text>
          ) : (
            appearance.customFolders.map((f, i) => (
              <View key={f.id}>
                {i > 0 ? (
                  <View
                    style={[styles.sep, {backgroundColor: colors.bgSecondary}]}
                  />
                ) : null}
                <Pressable
                  onLongPress={() => removeCustom(f.id)}
                  style={styles.row}>
                  <Folder size={18} color={colors.accent} />
                  <Text
                    style={[
                      styles.title,
                      styles.grow,
                      {color: colors.textPrimary},
                    ]}>
                    {f.name}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {creating ? (
          <View style={card}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t.newFolderPlaceholder}
              placeholderTextColor={colors.textHint}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.borderSoft,
                  backgroundColor: colors.bgSecondary,
                },
              ]}
              autoFocus
            />
            <View style={styles.actions}>
              <Pressable onPress={() => setCreating(false)}>
                <Text style={{color: colors.textSecondary}}>{t.cancel}</Text>
              </Pressable>
              <Pressable onPress={create}>
                <Text style={[styles.bold, {color: colors.accent}]}>
                  {t.createFolder}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setCreating(true)}
            style={[
              styles.addBtn,
              {backgroundColor: colors.bgPrimary},
              getShadow('sm', mode),
            ]}>
            <Plus size={18} color={colors.accent} />
            <Text style={[styles.bold, {color: colors.accent}]}>
              {t.newFolder}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: sm.cardMarginH,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 8,
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 8,
  },
  card: {
    borderRadius: sm.cardRadius,
    paddingHorizontal: 14,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  labels: {flex: 1, gap: 2},
  empty: {paddingVertical: 8},
  grow: {flex: 1},
  bold: {fontWeight: '700'},
  title: {fontSize: 16, fontWeight: '600'},
  sep: {height: 1},
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    paddingVertical: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: sm.cardRadius,
  },
});
