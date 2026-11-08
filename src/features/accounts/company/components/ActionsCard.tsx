import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Card, CardTitle, Chip, OutlineButton} from './ui';

type Props = {
  /** Absent : pas de « Inviter une personne » (réservé à qui gère l'équipe). */
  onInvite?: () => void;
  onProfile: () => void;
  /** Absent : pas de « Lier un nouveau bot ». */
  onLink?: () => void;
};

/**
 * Raccourcis : uniquement ce qu'on ne trouve pas déjà sur l'écran. L'équipe et la gestion des bots
 * ont leur propre carte (avec flèche) ; ici, inviter, le profil et lier un bot.
 */
export function ActionsCard({onInvite, onProfile, onLink}: Props): React.JSX.Element {
  return (
    <Card>
      <CardTitle title="Raccourcis" />
      <View style={styles.chips}>
        {onInvite ? <Chip label="Inviter une personne" onPress={onInvite} /> : null}
        <Chip label="Mon profil" onPress={onProfile} />
      </View>
      {onLink ? (
        <View style={styles.link}>
          <OutlineButton label="+ Lier un nouveau bot" onPress={onLink} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 18},
  link: {marginTop: 14},
});
