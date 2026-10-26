/**
 * Menu ⋮ de l'en-tête — liste déroulante (Tableau de bord / Profil / Gestion).
 * L'entrée active est surlignée.
 */
import React, {useState} from 'react';
import {Modal, View, Text, Pressable, StyleSheet} from 'react-native';
import {EllipsisVertical, type LucideIcon} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useTheme,
  getShadow,
  fontSize,
  fontWeight,
  space,
  radii,
} from '../theme';

export type HeaderMenuItem<Id extends string> = {
  id: Id;
  label: string;
  Icon: LucideIcon;
};

type Props<Id extends string> = {
  items: ReadonlyArray<HeaderMenuItem<Id>>;
  activeId: Id;
  onSelect: (id: Id) => void;
};

const MENU_MIN_WIDTH = 240;

export function HeaderMenu<Id extends string>({
  items,
  activeId,
  onSelect,
}: Props<Id>): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menu"
        accessibilityState={{expanded: open}}
        onPress={() => setOpen(true)}
        hitSlop={space.sm}
        style={[styles.button, open && {backgroundColor: colors.accentSoft}]}>
        <EllipsisVertical size={22} color={colors.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityLabel="Fermer le menu"
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
        />
        <View
          pointerEvents="box-none"
          style={[
            styles.menu,
            {
              top: insets.top + space.brandBarHeight - space.sm,
              backgroundColor: colors.bgPrimary,
              borderColor: colors.border,
            },
            getShadow('menu', mode),
          ]}>
          {items.map(({id, label, Icon}) => {
            const active = id === activeId;
            const color = active ? colors.accent : colors.textPrimary;
            return (
              <Pressable
                key={id}
                accessibilityRole="menuitem"
                accessibilityState={{selected: active}}
                onPress={() => {
                  setOpen(false);
                  onSelect(id);
                }}
                style={[
                  styles.item,
                  active && {backgroundColor: colors.accentSoft},
                ]}>
                <Icon size={22} color={color} />
                <Text
                  style={[
                    styles.label,
                    {
                      color,
                      fontWeight: active
                        ? fontWeight.semibold
                        : fontWeight.medium,
                    },
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: space.sm,
    borderRadius: radii.full,
  },
  menu: {
    position: 'absolute',
    right: space.brandBarPaddingRight,
    minWidth: MENU_MIN_WIDTH,
    padding: space.sm - 2,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md - 4,
    borderRadius: radii.md,
  },
  label: {
    fontSize: fontSize.msgDefault,
  },
});
