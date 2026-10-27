/**
 * Menu ⋮ de la conversation — toutes les actions possibles sur la
 * conversation, regroupées : Contact / Organisation / Zone dangereuse.
 * Chaque action réutilise l'existant (épingle, archive locale, suppression).
 */
import React, {useState} from 'react';
import {Modal, View, Text, Pressable, StyleSheet} from 'react-native';
import {
  EllipsisVertical,
  UserRound,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useTheme,
  getShadow,
  fontSize,
  fontWeight,
  space,
  radii,
} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {threadTexts as t} from '../texts';
import {conversationsTexts as ct} from '../../conversations/texts';
import {RoundButton} from './RoundButton';

type Props = {
  pinned: boolean;
  archived: boolean;
  /** Pin / suppression exigent le réseau. */
  offline: boolean;
  onViewProfile?: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
};

type Item = {
  id: string;
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export function ThreadMenu({
  pinned,
  archived,
  offline,
  onViewProfile,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const groups: Item[][] = [];
  if (onViewProfile) {
    groups.push([
      {
        id: 'profile',
        label: t.menuViewProfile,
        Icon: UserRound,
        onPress: onViewProfile,
      },
    ]);
  }
  groups.push([
    {
      id: 'pin',
      label: pinned ? ct.unpinAction : ct.pinAction,
      Icon: pinned ? PinOff : Pin,
      onPress: onTogglePin,
      disabled: offline,
    },
    {
      id: 'archive',
      label: archived ? ct.unarchiveAction : ct.archiveAction,
      Icon: archived ? ArchiveRestore : Archive,
      onPress: onToggleArchive,
    },
  ]);
  groups.push([
    {
      id: 'delete',
      label: ct.deleteConversation,
      Icon: Trash2,
      onPress: onDelete,
      danger: true,
      disabled: offline,
    },
  ]);

  const top =
    insets.top +
    tm.floatPadT +
    tm.floatBtnSize +
    tm.menuGapBelowButton;

  return (
    <>
      <RoundButton
        label={t.menuButton}
        onPress={() => setOpen(true)}
        expanded={open}>
        <EllipsisVertical size={22} color={colors.textPrimary} />
      </RoundButton>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityLabel={t.menuClose}
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
        />
        <View
          pointerEvents="box-none"
          style={[
            styles.menu,
            {
              top,
              right: tm.floatPadH,
              backgroundColor: colors.bgPrimary,
              borderColor: colors.border,
            },
            getShadow('menu', mode),
          ]}>
          {groups.map((group, gi) => (
            <View key={gi}>
              {gi > 0 ? (
                <View
                  style={[styles.sep, {backgroundColor: colors.divider}]}
                />
              ) : null}
              {group.map(({id, label, Icon, onPress, danger, disabled}) => {
                const color = danger ? colors.danger : colors.textPrimary;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="menuitem"
                    accessibilityState={{disabled: !!disabled}}
                    accessibilityHint={disabled ? t.menuNeedsNetwork : undefined}
                    disabled={disabled}
                    onPress={() => {
                      setOpen(false);
                      onPress();
                    }}
                    style={({pressed}) => [
                      styles.item,
                      {
                        opacity: disabled ? 0.45 : 1,
                        backgroundColor: pressed
                          ? colors.bgTertiary
                          : 'transparent',
                      },
                    ]}>
                    <Icon size={tm.menuIconSize} color={color} />
                    <Text
                      style={[
                        styles.label,
                        {color, fontWeight: fontWeight.medium},
                      ]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    minWidth: tm.menuMinWidth,
    padding: space.sm - 2,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginVertical: space.xs,
    marginHorizontal: space.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md - 4,
    borderRadius: radii.md,
  },
  label: {fontSize: fontSize.msgDefault},
});
