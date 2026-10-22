/** Aperçu Telegram — site TelegramPreview.tsx + .bp-preview / .bp-phone */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m, gradients} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {cmdKey, resolveText} from '../utils/edit';
import {langLabel} from '../utils/languages';
import {texts} from '../texts';
import {GradientView} from '../../../shared/components/GradientView';

type Props = {profile: BotProfile; lang: string};

export function TelegramPreview({profile, lang}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const name = resolveText(profile, lang, 'name') || 'Nom du bot';
  const description = resolveText(profile, lang, 'description');
  const short = resolveText(profile, lang, 'short_description');
  const hasCommands =
    (profile.commands[cmdKey('default', DEFAULT_LANG)] ?? []).length > 0;
  const menu = profile.menu_button;
  const showMenu = menu.type !== 'default' || hasCommands;
  const menuLabel =
    menu.type === 'web_app' ? menu.text || 'Ouvrir' : 'Menu';
  const initial = name.trim().charAt(0).toUpperCase() || 'B';

  return (
    <View style={styles.root}>
      <Text style={[styles.label, {color: colors.textHint}]}>
        {texts.previewLabel} · {langLabel(lang)}
      </Text>
      <View style={styles.grid}>
        <View
          style={[
            styles.phone,
            {backgroundColor: colors.bgSecondary, borderColor: colors.border},
          ]}>
          <View style={styles.profile}>
            <GradientView
              colors={gradients.avatar.colors}
              angle={gradients.avatar.angle}
              style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </GradientView>
            <Text style={[styles.name, {color: colors.textPrimary}]}>{name}</Text>
            <Text
              style={[
                styles.tag,
                {backgroundColor: colors.accentSoft, color: colors.accent},
              ]}>
              bot
            </Text>
            <Text style={[styles.short, {color: colors.textSecondary}]}>
              {short || 'Description courte du bot'}
            </Text>
            <Text style={[styles.user, {color: colors.accent}]}>
              @{profile.info.username || 'bot'}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.phone,
            {backgroundColor: colors.bgSecondary, borderColor: colors.border},
          ]}>
          <View style={styles.chat}>
            <View
              style={[
                styles.empty,
                {backgroundColor: colors.bgPrimary},
              ]}>
              <Text style={[styles.emptyTitle, {color: colors.textPrimary}]}>
                {texts.previewWhat}
              </Text>
              <Text style={[styles.emptyBody, {color: colors.textSecondary}]}>
                {description || texts.previewDescPlaceholder}
              </Text>
            </View>
            <View style={styles.bar}>
              {showMenu ? (
                <Text
                  style={[styles.menuPill, {backgroundColor: colors.accent}]}
                  numberOfLines={1}>
                  {menuLabel}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.inputPill,
                  {backgroundColor: colors.bgPrimary, color: colors.textHint},
                ]}>
                {texts.previewMessage}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {gap: 8, marginTop: 8},
  label: {
    paddingHorizontal: 4,
    fontSize: m.labelFontSize,
    fontWeight: m.labelFontWeight,
    letterSpacing: m.labelLetterSpacing,
    textTransform: 'uppercase',
  },
  grid: {gap: m.gridGap},
  phone: {
    borderRadius: m.phoneRadius,
    borderWidth: 1,
    padding: m.phonePadding,
    minHeight: 160,
  },
  profile: {alignItems: 'center', gap: 6},
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: '#fff', fontSize: 24, fontWeight: '700'},
  name: {fontSize: 16, fontWeight: '600', textAlign: 'center'},
  tag: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.06,
    textTransform: 'uppercase',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 99,
    overflow: 'hidden',
  },
  short: {fontSize: 13, lineHeight: 18, textAlign: 'center'},
  user: {fontSize: 12},
  chat: {justifyContent: 'space-between', gap: 12, minHeight: 160},
  empty: {
    borderRadius: m.emptyChatRadius,
    paddingVertical: m.emptyChatPaddingV,
    paddingHorizontal: m.emptyChatPaddingH,
  },
  emptyTitle: {fontSize: 13.5, fontWeight: '700', textAlign: 'center'},
  emptyBody: {marginTop: 6, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
  bar: {flexDirection: 'row', alignItems: 'center', gap: 8},
  menuPill: {
    paddingVertical: m.menuPillPaddingV,
    paddingHorizontal: m.menuPillPaddingH,
    borderRadius: m.menuPillRadius,
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
    maxWidth: '50%',
    overflow: 'hidden',
  },
  inputPill: {
    flex: 1,
    paddingVertical: m.inputPillPaddingV,
    paddingHorizontal: m.inputPillPaddingH,
    borderRadius: 99,
    fontSize: 12.5,
    overflow: 'hidden',
  },
});
