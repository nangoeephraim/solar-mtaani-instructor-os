/* ─── Communications Helper Utilities ─── */

// Deterministic avatar colors based on username hash
const AVATAR_PALETTES = [
    { from: '#4285F4', to: '#1967D2' }, // Google Blue
    { from: '#EA4335', to: '#C5221F' }, // Google Red
    { from: '#FBBC04', to: '#F29900' }, // Google Yellow
    { from: '#34A853', to: '#1E8E3E' }, // Google Green
    { from: '#A142F4', to: '#7627BB' }, // Purple
    { from: '#F538A0', to: '#D01884' }, // Pink
    { from: '#00BCD4', to: '#00838F' }, // Teal
    { from: '#FF6D00', to: '#E65100' }, // Deep Orange
];

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getAvatarGradient(name: string): { from: string; to: string } {
    return AVATAR_PALETTES[hashString(name) % AVATAR_PALETTES.length];
}

export function getAvatarStyle(name: string): React.CSSProperties {
    const { from, to } = getAvatarGradient(name);
    return { background: `linear-gradient(135deg, ${from}, ${to})` };
}

// Date formatting helpers
export function formatDateSeparator(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function isSameDay(d1: string, d2: string): boolean {
    return new Date(d1).toDateString() === new Date(d2).toDateString();
}

// Need React import for CSSProperties
import React from 'react';
