import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {Appearance, type ColorSchemeName} from 'react-native';
import {fireAndForget} from '../../core/utils/fireAndForget';
import {
  defaultAppearance,
  getColors,
  type AppearanceSettings,
  type ColorTokens,
  type ThemeMode,
} from './index';
import {APPEARANCE_STORAGE_KEY, cacheGetString, cacheSetString} from '../../core/storage';

type ThemeContextValue = {
  colors: ColorTokens;
  mode: ThemeMode;
  appearance: AppearanceSettings;
  setAppearance: (patch: Partial<AppearanceSettings>) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveMode(
  appearance: AppearanceSettings,
  system: ColorSchemeName,
): ThemeMode {
  if (appearance.followSystemTheme) {
    return system === 'dark' ? 'dark' : 'light';
  }
  return appearance.theme;
}

type Props = {
  children: ReactNode;
};

export function ThemeProvider({children}: Props): React.JSX.Element {
  const [appearance, setAppearanceState] =
    useState<AppearanceSettings>(defaultAppearance);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() ?? 'light',
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await cacheGetString(APPEARANCE_STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Omit<
            Partial<AppearanceSettings>,
            'swipeAction'
          > & {swipeAction?: string};
          const {swipeAction: savedSwipe, ...savedRest} = parsed;
          // Ancienne valeur 'delete' → 'archive' ; valeur inconnue → ignorée.
          const swipeAction: AppearanceSettings['swipeAction'] | undefined =
            savedSwipe === 'delete'
              ? 'archive'
              : savedSwipe === 'archive' ||
                savedSwipe === 'folder' ||
                savedSwipe === 'pin'
              ? savedSwipe
              : undefined;
          setAppearanceState(prev => ({
            ...prev,
            ...savedRest,
            swipeAction: swipeAction ?? prev.swipeAction,
            customFolders: parsed.customFolders ?? prev.customFolders,
            uiLanguage: parsed.uiLanguage ?? prev.uiLanguage,
          }));
        }
      } catch {
        // ignore corrupt cache
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({colorScheme}) => {
      setSystemScheme(colorScheme ?? 'light');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    fireAndForget(cacheSetString(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance)).catch(() => {
      // Cache indisponible : l'apparence reste en mémoire, aucune erreur remontée.
        }));
  }, [appearance, hydrated]);

  const mode = resolveMode(appearance, systemScheme);
  const colors = useMemo(() => getColors(mode), [mode]);

  const setAppearance = useCallback((patch: Partial<AppearanceSettings>) => {
    setAppearanceState(prev => ({...prev, ...patch}));
  }, []);

  const toggleTheme = useCallback(() => {
    setAppearanceState(prev => ({
      ...prev,
      followSystemTheme: false,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const value = useMemo(
    () => ({
      colors,
      mode,
      appearance,
      setAppearance,
      toggleTheme,
    }),
    [colors, mode, appearance, setAppearance, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return ctx;
}
