import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, space, fontSize} from '../../../shared/theme';
import {AuthHeader} from '../../auth/components/AuthHeader';
import {useBotsStore} from '../store/botsStore';
import {texts} from '../../dashboard/texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {botId: string; onBack: () => void};

export function BotManageScreen({botId, onBack}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const bot = useBotsStore(s => s.bots.find(b => b.id === botId));
  const setMuted = useBotsStore(s => s.setMuted);

  if (!bot) {
    return (
      <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
        <AuthHeader title="Bot" onBack={onBack} />
        <Text style={[styles.missing, {color: colors.textSecondary}]}>
          Bot introuvable
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <AuthHeader title={bot.name} onBack={onBack} />
      <View style={styles.body}>
        <Text style={[styles.username, {color: colors.textPrimary}]}>
          @{bot.username}
        </Text>
        <Text style={[styles.status, {color: colors.textSecondary}]}>
          {bot.status}
        </Text>
        <Pressable
          style={[styles.action, {backgroundColor: colors.bgTertiary}]}
          onPress={() => {
            fireAndForget(setMuted(bot.id, !bot.muted));
          }}>
          <Text style={[styles.actionText, {color: colors.textPrimary}]}>
            {bot.muted ? texts.unmute : texts.mute}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  body: {flex: 1, padding: space.md},
  missing: {padding: space.md},
  username: {fontSize: fontSize.listName},
  status: {marginTop: space.xs},
  action: {marginTop: 16, padding: 14, borderRadius: 12, alignItems: 'center'},
  actionText: {},
});
