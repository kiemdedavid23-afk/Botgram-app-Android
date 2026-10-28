/**
 * Feuille d'actions (appui long sur une conversation de la liste).
 * En-tête : avatar + nom ; puis actions groupées avec icônes ;
 * suppression isolée en rouge. Remplace l'Alert native à boutons texte.
 */
import React from 'react';
import {Modal, View, Text, Pressable, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useTheme,
  getShadow,
  fontSize,
  fontWeight,
  space,
  radii,
} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {threadTexts as tt} from '../../thread/texts';
import type {ConversationMenuItem} from './conversationMenu';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | null;
  photoUrl?: string | null;
  initials?: string | null;
  groups: ConversationMenuItem[][];
  /** Action préférée (réglage Discussions) : mise en avant discrète. */
  highlightId?: ConversationMenuItem['id'];
};

const HEADER_AVATAR = 46;
const HANDLE_W = 40;
const HANDLE_H = 4;
const ICON = 22;
const SUBTITLE_SIZE = 13;

export function ConversationActionsSheet({
  visible,
  onClose,
  title,
  subtitle,
  photoUrl,
  initials,
  groups,
  highlightId,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable
        accessibilityLabel={tt.menuClose}
        style={[StyleSheet.absoluteFill, {backgroundColor: colors.overlay}]}
        onPress={onClose}
      />
      <View pointerEvents="box-none" style={styles.anchor}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgPrimary,
              paddingBottom: insets.bottom + space.md,
            },
            getShadow('menu', mode),
          ]}>
          <View style={[styles.handle, {backgroundColor: colors.border}]} />
          <View style={styles.header}>
            <Avatar
              photoUrl={photoUrl}
              initials={initials}
              title={title}
              size={HEADER_AVATAR}
            />
            <View style={styles.headerTexts}>
              <Text
                numberOfLines={1}
                style={{
                  color: colors.textPrimary,
                  fontSize: fontSize.msgDefault + 2,
                  fontWeight: fontWeight.semibold,
                }}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  numberOfLines={1}
                  style={[styles.subtitle, {color: colors.textSecondary}]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
          {groups.map((group, gi) => (
            <View key={gi}>
              <View
                style={[styles.sep, {backgroundColor: colors.divider}]}
              />
              {group.map(({id, label, Icon, onPress, danger, disabled}) => {
                const color = danger ? colors.danger : colors.textPrimary;
                const hl = id === highlightId && !danger;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{disabled: !!disabled}}
                    accessibilityHint={disabled ? tt.menuNeedsNetwork : undefined}
                    disabled={disabled}
                    onPress={() => {
                      onClose();
                      onPress();
                    }}
                    style={({pressed}) => [
                      styles.item,
                      {
                        opacity: disabled ? 0.45 : 1,
                        backgroundColor: pressed
                          ? colors.bgTertiary
                          : hl
                            ? colors.accentSoft
                            : 'transparent',
                      },
                    ]}>
                    <Icon
                      size={ICON}
                      color={hl ? colors.accent : color}
                    />
                    <Text
                      style={{
                        color: hl ? colors.accent : color,
                        fontSize: fontSize.msgDefault,
                        fontWeight: fontWeight.medium,
                      }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  anchor: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    borderTopLeftRadius: radii.bottomSheet,
    borderTopRightRadius: radii.bottomSheet,
    paddingTop: space.sm,
    paddingHorizontal: space.sm,
  },
  handle: {
    alignSelf: 'center',
    width: HANDLE_W,
    height: HANDLE_H,
    borderRadius: HANDLE_H / 2,
    marginBottom: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  headerTexts: {flex: 1, minWidth: 0},
  subtitle: {fontSize: SUBTITLE_SIZE},
  sep: {
    height: StyleSheet.hairlineWidth,
    marginVertical: space.xs,
    marginHorizontal: space.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    minHeight: 52,
    borderRadius: radii.md,
  },
});
