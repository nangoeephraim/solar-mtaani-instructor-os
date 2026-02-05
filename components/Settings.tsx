import React, { useState, useEffect } from 'react';
import { InstructorSettings, DEFAULT_SETTINGS, AppPreferences } from '../types';
import { getSettings, saveSettings, resetData, exportDataAsCSV } from '../services/storageService';
import { useToast } from './Toast';
import { Settings as SettingsIcon, User, Building2, Download, RotateCcw, Save, AlertTriangle, FileDown, Info, Moon, Sun, Monitor, Palette, Sparkles, Layout, Smartphone } from 'lucide-react';
import clsx from 'clsx';

interface SettingsProps {
    onDataReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onDataReset }) => {
    const [settings, setSettings] = useState<InstructorSettings>(DEFAULT_SETTINGS);
    const [hasChanges, setHasChanges] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const loaded = getSettings();
        // Merge with default preferences if missing (migration)
        if (!loaded.preferences) {
            setSettings({ ...loaded, preferences: DEFAULT_SETTINGS.preferences });
        } else {
            setSettings(loaded);
        }
    }, []);

    const handleChange = (field: keyof InstructorSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handlePrefChange = (field: keyof AppPreferences, value: any) => {
        setSettings(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [field]: value
            }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        saveSettings(settings);
        setHasChanges(false);
        showToast('Settings saved successfully!', 'success');
        // Force reload to apply changes if needed (e.g. theme)
        // window.location.reload(); 
    };

    const handleExportCSV = () => {
        const csv = exportDataAsCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `solar_mtaani_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Data exported successfully!', 'success');
    };

    const handleReset = () => {
        resetData();
        setSettings(DEFAULT_SETTINGS);
        setHasChanges(false);
        setShowResetConfirm(false);
        onDataReset();
        showToast('All data has been reset to defaults', 'info');
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in space-y-6 pb-10">
            {/* Header */}
            <div className="glass-panel p-6 rounded-2xl">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <SettingsIcon size={24} />
                    </div>
                    Settings
                </h2>
                <p className="text-slate-500 mt-1 font-medium">Configure your instructor profile and app preferences.</p>
            </div>

            {/* Instructor Profile */}
            <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <User size={20} className="text-orange-500" />
                    <h3 className="font-bold text-slate-800">Instructor Profile</h3>
                </div>

                <div className="grid gap-5">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Organization
                        </label>
                        <input
                            type="text"
                            value={settings.organization}
                            onChange={(e) => handleChange('organization', e.target.value)}
                            placeholder="Enter organization name"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* App Customization */}
            <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Palette size={20} className="text-purple-500" />
                    <h3 className="font-bold text-slate-800">App Customization</h3>
                </div>

                <div className="space-y-6">
                    {/* Intelligence Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">Smart AI Insights</p>
                                <p className="text-xs text-slate-500">Show predictive analysis and data trends</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.preferences?.enableAI ?? true}
                                onChange={(e) => handlePrefChange('enableAI', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {/* Theme Preference (Visual only for now) */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                            Appearance
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'light', label: 'Light', icon: Sun },
                                { id: 'dark', label: 'Dark', icon: Moon },
                                { id: 'system', label: 'System', icon: Monitor }
                            ].map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => handlePrefChange('theme', theme.id)}
                                    className={clsx(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                                        settings.preferences?.theme === theme.id
                                            ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    <theme.icon size={18} />
                                    <span className="text-xs font-bold">{theme.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accent Color (Visual only for now) */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                            Accent Color
                        </label>
                        <div className="flex gap-4">
                            {[
                                { id: 'blue', class: 'bg-blue-500' },
                                { id: 'orange', class: 'bg-orange-500' },
                                { id: 'green', class: 'bg-emerald-500' },
                                { id: 'purple', class: 'bg-purple-500' }
                            ].map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => handlePrefChange('accentColor', color.id)}
                                    className={clsx(
                                        "w-10 h-10 rounded-full transition-all ring-2 ring-offset-2",
                                        color.class,
                                        settings.preferences?.accentColor === color.id
                                            ? "ring-slate-400 scale-110"
                                            : "ring-transparent hover:scale-105"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {hasChanges && (
                <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2"
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            )}

            {/* Data Management */}
            <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Download size={20} className="text-blue-500" />
                    <h3 className="font-bold text-slate-800">Data Management</h3>
                </div>

                <div className="space-y-4">
                    {/* Export */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Export Data</p>
                            <p className="text-xs text-slate-500">Download all student data as CSV</p>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            <FileDown size={16} />
                            Export CSV
                        </button>
                    </div>

                    {/* Reset */}
                    <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
                        <div>
                            <p className="font-bold text-rose-800 text-sm">Reset All Data</p>
                            <p className="text-xs text-rose-600">This will delete all students and return to defaults</p>
                        </div>
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className="px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-sm hover:bg-rose-600 transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* App Info */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Info size={20} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">About</h3>
                </div>

                <div className="text-sm text-slate-600 space-y-2">
                    <p><strong>PRISM Instructor OS</strong> v2.0.0</p>
                    <p>A premium competency-based training management system for NITA-compliant assessments.</p>
                    <p className="text-xs text-slate-400 mt-4">© 2025 PRISM. All rights reserved.</p>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-6">
                        <div className="flex items-center gap-3 text-rose-600 mb-4">
                            <AlertTriangle size={24} />
                            <h3 className="font-bold text-lg">Confirm Reset</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-6">
                            This will permanently delete all students, attendance records, and competency data. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors"
                            >
                                Yes, Reset All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
