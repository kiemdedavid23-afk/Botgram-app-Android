/**
 * Photo du bot (cache partagé) avec repli : affiche l'image si elle existe,
 * sinon `fallback` (icône ou initiale, propre à chaque écran).
 * Le conteneur (taille, rond, fond) reste celui de l'écran appelant.
 */
import React, {useEffect, useState} from 'react';
import {Image, type ImageStyle, type StyleProp} from 'react-native';
import {useBotPhotoUri} from '../botPhoto/useBotPhotoUri';
import {useBotPhotoStore} from '../botPhoto/botPhotoStore';
import {fireAndForget} from '../../core/utils/fireAndForget';

type Props = {
  botId?: string | null;
  style: StyleProp<ImageStyle>;
  fallback: React.ReactNode;
};

export function BotPhoto({botId, style, fallback}: Props): React.JSX.Element {
  const uri = useBotPhotoUri(botId);
  const refresh = useBotPhotoStore(s => s.refresh);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (uri && !failed) {
    return (
      <Image
        source={{uri}}
        style={style}
        resizeMode="cover"
        accessible={false}
        onError={() => {
          // Fichier disparu du téléphone : repli immédiat puis nouveau téléchargement.
          setFailed(true);
          if (botId) fireAndForget(refresh(botId));
        }}
      />
    );
  }
  return <>{fallback}</>;
}
