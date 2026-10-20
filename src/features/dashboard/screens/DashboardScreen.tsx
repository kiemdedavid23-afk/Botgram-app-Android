import {fireAndForget} from '../../../core/utils/fireAndForget';
import {View, Text, ScrollView, Pressable, StyleSheet, RefreshControl} from 'react-native';
import {useTheme, space, fontSize} from '../../../shared/theme';
import {authColors} from '../../../shared/theme/authColors';
import {useBotsStore} from '../../bots/store/botsStore';
import {useQuotaStore} from '../../member/store/quotaStore';
import {texts} from '../texts';

export function DashboardScreen(): React.JSX.Element {
  const {colors} = useTheme();
  const bots = useBotsStore(s => s.bots);
  const loadBots = useBotsStore(s => s.load);
  const quota = useQuotaStore(s => s.quota);
  const loadQuota = useQuotaStore(s => s.load);
  const offline = useBotsStore(s => s.offline);

  useEffect(() => {
    fireAndForget(loadBots());
    fireAndForget(loadQuota());
  }, [loadBots, loadQuota]);

  const active = bots.find(b => b.selected);

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.bgSecondary}}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { fireAndForget(loadBots(true)); fireAndForget(loadQuota(true)); }} />}>
      {offline ? <Text style={styles.banner}>{texts.offline}</Text> : null}
      <View style={styles.section}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{texts.quotaTitle}</Text>
        {quota ? (
          <Text style={{color: colors.textSecondary}}>
            {quota.used} / {quota.limit} ({quota.remaining} restants)
          </Text>
        ) : (
          <Text style={{color: colors.textHint}}>—</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{texts.activeBot}</Text>
        {active ? (
          <Text style={{color: colors.textPrimary}}>{active.name} (@{active.username})</Text>
        ) : (
          <Text style={{color: colors.textHint}}>{texts.noActive}</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{texts.myBots}</Text>
        {bots.map(b => (
          <Pressable key={b.id} style={styles.row}>
            <Text style={{color: colors.textPrimary}}>{b.name}</Text>
            <Text style={{color: colors.textSecondary}}>{b.status}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  banner: {padding: space.md, backgroundColor: authColors.bg, textAlign: 'center'},
  section: {padding: space.md},
  title: {fontSize: fontSize.listName, fontWeight: '600', marginBottom: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth},
});
