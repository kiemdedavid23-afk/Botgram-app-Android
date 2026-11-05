/** Référence de navigation : ouvre l'espace bot depuis une notification push. */
import {createNavigationContainerRef} from '@react-navigation/native';

type RootParams = {BotSpace: undefined};

export const navigationRef = createNavigationContainerRef<RootParams>();
