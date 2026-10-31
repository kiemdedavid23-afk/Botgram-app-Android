/**
 * Barre d'actions du mode sélection (remplace l'en-tête de la liste) :
 * ✕ · nombre · épingler · archiver · supprimer · ⋮ (tout sélectionner, marquer comme lu).
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {
  X,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  ListChecks,
  CheckCheck,
  type LucideIcon,
} from 'lucide-react-native';
import {
  useTheme,
  space,
  fontSize,
  fontWeight,
  brandBarMetrics as bm,
} from '../../../shared/theme';
import {StatusBarStrip} from '../../../shared/components/StatusBarStrip';
import {
  HeaderMenu,
  type HeaderMenuItem,
} from '../../../shared/components/HeaderMenu';
import {conversationsTexts as t} from '../texts';

type MoreId = 'selectAll' | 'markRead';

type Props = {
  count: number;
  allPinned: boolean;
  allArchived: boolean;
  /** Épingler / supprimer / marquer comme lu passent par le serveur. */
  offline: boolean;
  onExit: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onMarkRead: () => void;
};

const MORE: ReadonlyArray<HeaderMenuItem<MoreId>> = [
  {id: 'selectAll', label: t.selectAll, Icon: ListChecks},
  {id: 'markRead', label: t.markSelectedRead, Icon: CheckCheck},
];

export function SelectionBar({
  count,
  allPinned,
  allArchived,
  offline,
  onExit,
  onPin,
  onArchive,
  onDelete,
  onSelectAll,
  onMarkRead,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const none = count === 0;

  const action = (
    Icon: LucideIcon,
    label: string,
    onPress: () => void,
    disabled: boolean,
    color: string,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      hitSlop={space.sm}
      style={[styles.btn, {opacity: disabled ? 0.4 : 1}]}>
      <Icon size={22} color={color} />
    </Pressable>
  );

  return (
    <View style={{backgroundColor: colors.bgPrimary}}>
      <StatusBarStrip seamless />
      <View style={styles.inner}>
        {action(X, t.exitSelection, onExit, false, colors.textPrimary)}
        <Text style={[styles.count, {color: colors.textPrimary}]} numberOfLines={1}>
          {none ? t.selectTitle : String(count)}
        </Text>
        <View style={styles.actions}>
          {action(
            allPinned ? PinOff : Pin,
            allPinned ? t.unpinAction : t.pinAction,
            onPin,
            none || offline,
            colors.textPrimary,
          )}
          {action(
            allArchived ? ArchiveRestore : Archive,
            allArchived ? t.unarchiveAction : t.archiveAction,
            onArchive,
            none,
            colors.textPrimary,
          )}
          {action(Trash2, t.deleteSelected, onDelete, none || offline, colors.textPrimary)}
          <HeaderMenu
            items={MORE}
            activeId={null}
            onSelect={id => (id === 'selectAll' ? onSelectAll() : onMarkRead())}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    height: space.brandBarHeight,
    paddingLeft: space.sm,
    paddingRight: space.brandBarPaddingRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  btn: {padding: space.sm, borderRadius: 999},
  count: {
    flex: 1,
    fontSize: fontSize.brandTitle,
    fontWeight: fontWeight.bold,
    letterSpacing: bm.titleLetterSpacing,
  },
  actions: {flexDirection: 'row', alignItems: 'center', gap: bm.rightGap},
});
