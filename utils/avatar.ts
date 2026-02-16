// Avatar utilities for generating initials and colors

const AVATAR_COLORS = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-red-500',
];

/**
 * Get initials from a name
 * @param name Full name
 * @returns Up to 2 character initials
 */
export function getInitials(name: string): string {
    if (!name) return '?';

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get a consistent color for an avatar based on name
 * @param name Full name
 * @returns Tailwind background color class
 */
export function getAvatarColor(name: string): string {
    if (!name) return AVATAR_COLORS[0];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Generate avatar placeholder component props
 * @param name Full name
 * @returns Object with initials and colorClass
 */
export function getAvatarProps(name: string) {
    return {
        initials: getInitials(name),
        colorClass: getAvatarColor(name),
    };
}
