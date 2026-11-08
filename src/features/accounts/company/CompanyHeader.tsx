import React from 'react';
import {View, Text, Pressable, StatusBar, StyleSheet} from 'react-native';
import {Plus, UserPlus} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Avatar} from '../../../shared/components/Avatar';
import {useTheme} from '../../../shared/theme';
import {greetingWord, firstName} from '../../dashboard/logic';
import {useWorkspaceStore} from '../store/workspaceStore';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from './companyTheme';
import {CompanyMark} from './components/CompanyMark';

export type CompanyHeaderProps = {
  /** Complet : salutation, avatar et trois boutons. Absent : barre compacte avec `right`. */
  hello?: {
    displayName: string;
    onAvatar: () => void;
    onAdd?: () => void;
    onTeam?: () => void;
    /** Bouton menu (HeaderMenu) rendu dans le troisième carré. */
    menu: React.ReactNode;
  };
  right?: React.ReactNode;
};

function SquareButton({label, onPress, children}: {label: string; onPress: () => void; children: React.ReactNode}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({pressed}) => [styles.square, {backgroundColor: t.soft, opacity: pressed ? 0.7 : 1}]}>
      {children}
    </Pressable>
  );
}

/** En-tête entreprise : sans marque Botgram ; salutation et pastille de l'entreprise à gauche, carrés d'action à droite. */
export function CompanyHeader({hello, right}: CompanyHeaderProps): React.JSX.Element {
  const t = useCompanyTheme();
  const {mode} = useTheme();
  const insets = useSafeAreaInsets();
  const ws = useWorkspaceStore(s => s.workspaces[0] ?? null);
  const hour = new Date().getHours();
  return (
    <View style={{backgroundColor: t.bg}}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={{height: insets.top}} />
      {hello ? (
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Changer de compte ou de bot" onPress={hello.onAvatar}>
            <Avatar size={56} title={hello.displayName} />
          </Pressable>
          <View style={styles.greet}>
            <Text style={[styles.hi, {color: t.inkSoft}]}>{`${greetingWord(hour)},`}</Text>
            <Text style={[styles.name, {color: t.ink}]} numberOfLines={1}>
              {firstName(hello.displayName) || hello.displayName}
            </Text>
            {ws ? (
              <View style={styles.org}>
                <CompanyMark name={ws.name} size={22} />
                <Text style={[styles.orgName, {color: t.ink}]} numberOfLines={1}>
                  {ws.name}
                </Text>
              </View>
            ) : null}
          </View>
          {hello.onAdd ? (
            <SquareButton label="Lier un bot" onPress={hello.onAdd}>
              <Plus size={22} color={t.ink} />
            </SquareButton>
          ) : null}
          {hello.onTeam ? (
            <SquareButton label="Équipe" onPress={hello.onTeam}>
              <UserPlus size={21} color={t.ink} />
            </SquareButton>
          ) : null}
          <View style={[styles.square, {backgroundColor: t.soft}]}>{hello.menu}</View>
        </View>
      ) : (
        <View style={styles.row}>
          {ws ? <CompanyMark name={ws.name} size={28} /> : null}
          <Text style={[styles.compact, {color: t.ink}]} numberOfLines={1}>
            {ws?.name ?? 'Entreprise'}
          </Text>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: cm.pageH, paddingTop: 8, paddingBottom: 14},
  greet: {flex: 1, marginLeft: 6},
  hi: {fontFamily: companyFonts.body, fontSize: cm.greetSize},
  name: {fontFamily: companyFonts.display, fontSize: cm.nameSize, fontWeight: '700', letterSpacing: -0.3},
  org: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4},
  orgName: {flex: 1, fontFamily: companyFonts.value, fontSize: cm.captionSize + 1, fontWeight: '600'},
  square: {width: cm.headerBtn, height: cm.headerBtn, borderRadius: cm.headerBtnRadius, alignItems: 'center', justifyContent: 'center'},
  compact: {flex: 1, fontFamily: companyFonts.display, fontSize: cm.titleSize, fontWeight: '700'},
  right: {flexDirection: 'row', alignItems: 'center'},
});
