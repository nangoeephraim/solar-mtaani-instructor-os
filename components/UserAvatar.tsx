/**
 * UserAvatar — Reusable avatar component
 *
 * Shows the user's profile photo if available,
 * otherwise falls back to a gradient-colored initial.
 */

import React, { useState } from 'react';
import { getAvatarStyle } from './comms/helpers';

interface UserAvatarProps {
    name: string;
    avatarUrl?: string | null;
    size?: number;
    className?: string;
    /** Show rounded-xl (default) or rounded-full */
    rounded?: 'xl' | 'full';
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    name,
    avatarUrl,
    size = 36,
    className = '',
    rounded = 'xl',
}) => {
    const [imgError, setImgError] = useState(false);

    const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
    const initial = (name || '?').charAt(0).toUpperCase();

    if (avatarUrl && !imgError) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                onError={() => setImgError(true)}
                className={`${roundedClass} object-cover flex-shrink-0 ${className}`}
                style={{ width: size, height: size }}
                draggable={false}
            />
        );
    }

    // Fallback: gradient initial
    return (
        <div
            className={`${roundedClass} text-white flex items-center justify-center font-bold flex-shrink-0 ${className}`}
            style={{
                ...getAvatarStyle(name),
                width: size,
                height: size,
                fontSize: size * 0.42,
            }}
        >
            {initial}
        </div>
    );
};

export default UserAvatar;
