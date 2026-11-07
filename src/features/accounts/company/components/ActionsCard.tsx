import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {companyFonts, useCompanyTheme} from '../companyTheme';
import {Card, CardTitle, Chip, OutlineButton} from './ui';

type Props = {
  onInvite?: () => void;
  onTeam: () => void;
  onGestion: () => void;
  onProfile: () => void;
  /** Absent : pas de « Lier un nouveau bot ». */
  onLink?: () => void;
};

/** Raccourcis : pastilles à contour, puis un grand bouton à contour. */
export function ActionsCard({onInvite, onTeam, onGestion, onProfile, onLink}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Card>
      <CardTitle title="Raccourcis" />
      <View style={styles.chips}>
        {onInvite ? <Chip label="Inviter une personne" onPress={onInvite} /> : null}
        <Chip label="Équipe" onPress={onTeam} />
        <Chip label="Gestion des bots" onPress={onGestion} />
        <Chip label="Mon profil" onPress={onProfile} />
      </View>
      {onLink ? (
        <>
          <Text style={[styles.or, {color: t.inkSoft}]}>Ou</Text>
          <OutlineButton label="+ Lier un nouveau bot" onPress={onLink} />
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 18},
  or: {fontFamily: companyFonts.body, fontSize: 17, textAlign: 'center', marginVertical: 14},
});
