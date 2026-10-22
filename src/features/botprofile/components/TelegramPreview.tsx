/** Aperçu Telegram — site TelegramPreview + .bp-preview / .bp-phone */
import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m, gradients} from '../../../shared/theme';
import type {ColorTokens} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {cmdKey, resolveText} from '../utils/edit';
import {langLabel} from '../utils/languages';
import {texts} from '../texts';
import {GradientView} from '../../../shared/components/GradientView';

type Props = {profile: BotProfile; lang: string};

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {gap: 8, marginTop: m.rootMarginTop},
    label: {
      paddingHorizontal: m.labelPadH, fontSize: m.labelFontSize,
      fontWeight: m.labelFontWeight, letterSpacing: m.labelLetterSpacing,
      textTransform: 'uppercase', color: c.textHint,
    },
    grid: {gap: m.gridGap},
    phone: {
      borderRadius: m.phoneRadius, borderWidth: 1, borderColor: c.border,
      padding: m.phonePadding, minHeight: m.phoneMinHeight,
      backgroundColor: c.bgChat,
    },
    profile: {alignItems: 'center', gap: m.profileGap},
    avatar: {
      width: m.avatarSize, height: m.avatarSize, borderRadius: m.avatarSize / 2,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: {
      color: c.white, fontSize: m.avatarTextSize, fontWeight: m.avatarTextWeight,
    },
    name: {
      fontSize: m.nameSize, fontWeight: m.nameWeight, textAlign: 'center',
      color: c.textPrimary,
    },
    tag: {
      fontSize: m.tagSize, fontWeight: m.tagWeight, letterSpacing: m.tagLetterSpacing,
      textTransform: 'uppercase', paddingVertical: m.tagPadV, paddingHorizontal: m.tagPadH,
      borderRadius: 99, overflow: 'hidden',
      backgroundColor: c.accentSoft, color: c.accent,
    },
    short: {
      fontSize: m.shortSize, lineHeight: m.shortLineHeight, textAlign: 'center',
      color: c.textSecondary,
    },
    user: {fontSize: m.userSize, color: c.accent},
    chat: {
      justifyContent: 'space-between', gap: m.chatGap, minHeight: m.chatMinHeight,
    },
    empty: {
      borderRadius: m.emptyChatRadius,
      paddingVertical: m.emptyChatPaddingV, paddingHorizontal: m.emptyChatPaddingH,
      backgroundColor: c.bubbleIn,
    },
    emptyTitle: {
      fontSize: m.emptyTitleSize, fontWeight: m.emptyTitleWeight, textAlign: 'center',
      color: c.bubbleInText,
    },
    emptyBody: {
      marginTop: m.emptyBodyMarginTop, fontSize: m.emptyBodySize,
      lineHeight: m.emptyBodyLineHeight, textAlign: 'center', color: c.textSecondary,
    },
    bar: {flexDirection: 'row', alignItems: 'center', gap: m.barGap},
    menuPill: {
      paddingVertical: m.menuPillPaddingV, paddingHorizontal: m.menuPillPaddingH,
      borderRadius: m.menuPillRadius, backgroundColor: c.accent, color: c.white,
      fontSize: m.menuFontSize, fontWeight: m.menuFontWeight, maxWidth: '50%', overflow: 'hidden',
    },
    inputPill: {
      flex: 1, paddingVertical: m.inputPillPaddingV, paddingHorizontal: m.inputPillPaddingH,
      borderRadius: 99, backgroundColor: c.bgPrimary, color: c.textHint,
      fontSize: m.inputFontSize, overflow: 'hidden',
    },
  });
}

export function TelegramPreview({profile, lang}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const name = resolveText(profile, lang, 'name') || 'Nom du bot';
  const description = resolveText(profile, lang, 'description');
  const short = resolveText(profile, lang, 'short_description');
  const hasCommands =
    (profile.commands[cmdKey('default', DEFAULT_LANG)] ?? []).length > 0;
  const menu = profile.menu_button;
  const showMenu = menu.type !== 'default' || hasCommands;
  const menuLabel = menu.type === 'web_app' ? menu.text || 'Ouvrir' : 'Menu';
  const initial = name.trim().charAt(0).toUpperCase() || 'B';

  return (
    <View style={styles.root}>
      <Text style={styles.label}>
        {texts.previewLabel} · {langLabel(lang)}
      </Text>
      <View style={styles.grid}>
        <View style={styles.phone}>
          <View style={styles.profile}>
            <GradientView
              colors={gradients.avatar.colors}
              angle={gradients.avatar.angle}
              style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </GradientView>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.tag}>bot</Text>
            <Text style={styles.short}>{short || 'Description courte du bot'}</Text>
            <Text style={styles.user}>@{profile.info.username || 'bot'}</Text>
          </View>
        </View>
        <View style={styles.phone}>
          <View style={styles.chat}>
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{texts.previewWhat}</Text>
              <Text style={styles.emptyBody}>
                {description || texts.previewDescPlaceholder}
              </Text>
            </View>
            <View style={styles.bar}>
              {showMenu ? (
                <Text style={styles.menuPill} numberOfLines={1}>{menuLabel}</Text>
              ) : null}
              <Text style={styles.inputPill}>{texts.previewMessage}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
