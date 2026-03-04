import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppPreferences, InstructorSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings, saveSettings } from '../services/storageService';

interface ThemeContextValue {
    preferences: AppPreferences;
    settings: InstructorSettings;
    setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
    setSetting: <K extends keyof InstructorSettings>(key: K, value: InstructorSettings[K]) => void;
    saveAllSettings: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Accent color CSS variable mappings — light AND dark variants + RGB for glow effects
const ACCENT_COLORS: Record<string, {
    primary: string; primaryRgb: string; primaryHover: string;
    onPrimary: string;
    primaryContainer: string; onPrimaryContainer: string;
    dark: { primary: string; primaryRgb: string; primaryContainer: string; onPrimaryContainer: string; };
}> = {
    blue: {
        primary: '#1a73e8', primaryRgb: '26, 115, 232', primaryHover: '#1765cc',
        onPrimary: '#ffffff',
        primaryContainer: '#d3e3fd', onPrimaryContainer: '#1967d2',
        dark: { primary: '#8ab4f8', primaryRgb: '138, 180, 248', primaryContainer: '#0842a0', onPrimaryContainer: '#d3e3fd' },
    },
    orange: {
        primary: '#ea8600', primaryRgb: '234, 134, 0', primaryHover: '#d67a00',
        onPrimary: '#ffffff',
        primaryContainer: '#ffecd0', onPrimaryContainer: '#b36600',
        dark: { primary: '#ffb74d', primaryRgb: '255, 183, 77', primaryContainer: '#7a4500', onPrimaryContainer: '#ffecd0' },
    },
    green: {
        primary: '#1e8e3e', primaryRgb: '30, 142, 62', primaryHover: '#1a7a35',
        onPrimary: '#ffffff',
        primaryContainer: '#ceead6', onPrimaryContainer: '#137333',
        dark: { primary: '#81c995', primaryRgb: '129, 201, 149', primaryContainer: '#0d5226', onPrimaryContainer: '#ceead6' },
    },
    purple: {
        primary: '#9334e6', primaryRgb: '147, 52, 230', primaryHover: '#7b2cbf',
        onPrimary: '#ffffff',
        primaryContainer: '#e9d5ff', onPrimaryContainer: '#7627bb',
        dark: { primary: '#d7aefb', primaryRgb: '215, 174, 251', primaryContainer: '#6a1faa', onPrimaryContainer: '#e9d5ff' },
    },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<InstructorSettings>(DEFAULT_SETTINGS);

    // Load settings on mount
    useEffect(() => {
        const loaded = getSettings();
        if (!loaded.preferences) {
            setSettings({ ...loaded, preferences: DEFAULT_SETTINGS.preferences });
        } else {
            setSettings({
                ...loaded,
                preferences: { ...DEFAULT_SETTINGS.preferences, ...loaded.preferences },
            });
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        const { theme } = settings.preferences;

        const applyTheme = (isDark: boolean) => {
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            // Re-apply accent colors when theme changes (dark needs different values)
            applyAccentColors(isDark);
        };

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches);
            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            applyTheme(theme === 'dark');
        }
    }, [settings.preferences.theme, settings.preferences.accentColor]);

    // Centralized accent application
    const applyAccentColors = useCallback((isDark: boolean) => {
        const accent = settings.preferences.accentColor || 'blue';
        const colors = ACCENT_COLORS[accent] || ACCENT_COLORS.blue;
        const root = document.documentElement;

        if (isDark) {
            root.style.setProperty('--md-sys-color-primary', colors.dark.primary);
            root.style.setProperty('--md-sys-color-primary-rgb', colors.dark.primaryRgb);
            root.style.setProperty('--md-sys-color-primary-container', colors.dark.primaryContainer);
            root.style.setProperty('--md-sys-color-on-primary-container', colors.dark.onPrimaryContainer);
            root.style.setProperty('--accent-primary', colors.dark.primary);
        } else {
            root.style.setProperty('--md-sys-color-primary', colors.primary);
            root.style.setProperty('--md-sys-color-primary-rgb', colors.primaryRgb);
            root.style.setProperty('--md-sys-color-primary-container', colors.primaryContainer);
            root.style.setProperty('--md-sys-color-on-primary-container', colors.onPrimaryContainer);
            root.style.setProperty('--accent-primary', colors.primary);
        }
        root.style.setProperty('--md-sys-color-on-primary', colors.onPrimary);
        root.style.setProperty('--accent-primary-hover', colors.primaryHover);
        root.style.setProperty('--accent-primary-container', isDark ? colors.dark.primaryContainer : colors.primaryContainer);
        root.style.setProperty('--accent-on-primary', colors.onPrimary);
    }, [settings.preferences.accentColor]);

    // Also apply accent on accentColor change directly
    useEffect(() => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        applyAccentColors(isDark);
    }, [settings.preferences.accentColor, applyAccentColors]);

    // Apply reduced motion
    useEffect(() => {
        if (settings.preferences.reducedMotion) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }, [settings.preferences.reducedMotion]);

    const setPreference = useCallback(<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
        setSettings((prev) => {
            const updated = {
                ...prev,
                preferences: { ...prev.preferences, [key]: value },
            };
            // Auto-save on preference change
            saveSettings(updated);
            return updated;
        });
    }, []);

    const setSetting = useCallback(<K extends keyof InstructorSettings>(key: K, value: InstructorSettings[K]) => {
        setSettings((prev) => {
            const updated = { ...prev, [key]: value };
            saveSettings(updated);
            return updated;
        });
    }, []);

    const saveAllSettings = useCallback(() => {
        saveSettings(settings);
    }, [settings]);

    return (
        <ThemeContext.Provider value={{ preferences: settings.preferences, settings, setPreference, setSetting, saveAllSettings }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
