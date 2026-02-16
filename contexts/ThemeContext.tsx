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

// Accent color CSS variable mappings
const ACCENT_COLORS = {
    blue: {
        primary: '#1a73e8',
        primaryHover: '#1765cc',
        primaryContainer: '#d3e3fd',
        onPrimary: '#ffffff',
    },
    orange: {
        primary: '#ea8600',
        primaryHover: '#d67a00',
        primaryContainer: '#ffecd0',
        onPrimary: '#ffffff',
    },
    green: {
        primary: '#1e8e3e',
        primaryHover: '#1a7a35',
        primaryContainer: '#ceead6',
        onPrimary: '#ffffff',
    },
    purple: {
        primary: '#9334e6',
        primaryHover: '#7b2cbf',
        primaryContainer: '#e9d5ff',
        onPrimary: '#ffffff',
    },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<InstructorSettings>(DEFAULT_SETTINGS);

    // Load settings on mount
    useEffect(() => {
        const loaded = getSettings();
        // Migration: ensure preferences exist
        if (!loaded.preferences) {
            setSettings({ ...loaded, preferences: DEFAULT_SETTINGS.preferences });
        } else {
            // Merge with defaults to handle new preference fields
            setSettings({
                ...loaded,
                preferences: { ...DEFAULT_SETTINGS.preferences, ...loaded.preferences },
            });
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        const { theme, reducedMotion } = settings.preferences;

        // Handle theme
        const applyTheme = (isDark: boolean) => {
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
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
    }, [settings.preferences.theme]);

    // Apply accent color
    useEffect(() => {
        const accent = settings.preferences.accentColor || 'blue';
        const colors = ACCENT_COLORS[accent];

        document.documentElement.style.setProperty('--accent-primary', colors.primary);
        document.documentElement.style.setProperty('--accent-primary-hover', colors.primaryHover);
        document.documentElement.style.setProperty('--accent-primary-container', colors.primaryContainer);
        document.documentElement.style.setProperty('--accent-on-primary', colors.onPrimary);
    }, [settings.preferences.accentColor]);

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
