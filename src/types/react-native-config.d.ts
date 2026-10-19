declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL?: string;
    APP_CHANNEL?: string;
    APP_BUILD?: string;
    APP_VERSION?: string;
    [key: string]: string | undefined;
  }
  const Config: NativeConfig;
  export default Config;
}
