import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import App from './src/app/App';
import {registerBackgroundPushHandler} from './src/core/push';
import {name as appName} from './app.json';

registerBackgroundPushHandler();
AppRegistry.registerComponent(appName, () => App);
