import {useMemo} from 'react';
import {useTheme} from './ThemeProvider';
import {resolveChatTheme, type ChatTheme} from './chatTheme';

export function useChatTheme(): ChatTheme {
  const {colors, mode, appearance} = useTheme();
  return useMemo(
    () => resolveChatTheme(appearance.wallpaper, mode, colors),
    [appearance.wallpaper, mode, colors],
  );
}
