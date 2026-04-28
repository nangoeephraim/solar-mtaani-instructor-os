/**
 * UserAvatar — Premium avatar component
 *
 * Shows a shimmer skeleton while the image loads, crossfades to the photo,
 * or falls back to a gradient initial — all without any flash.
 */

import React, { useState, useEffect } from 'react';
import { getAvatarStyle } from './comms/helpers';

interface UserAvatarProps {
    name: string;
    avatarUrl?: string | null;
    size?: number;
    className?: string;
    /** 'xl' for chat bubbles, 'full' for circular contexts */
    rounded?: 'xl' | 'full';
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    name,
    avatarUrl,
    size = 36,
    className = '',
    rounded = 'xl',
}) => {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
        avatarUrl ? 'loading' : 'error'
    );

    // When avatarUrl changes (e.g. map populates), reset status
    useEffect(() => {
        if (avatarUrl) {
            setStatus('loading');
        } else {
            setStatus('error');
        }
    }, [avatarUrl]);

    const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
    const initial = (name || '?').charAt(0).toUpperCase();
    const sharedStyle = { width: size, height: size };

    return (
        <div
            className={`relative flex-shrink-0 ${roundedClass} overflow-hidden ${className}`}
            style={sharedStyle}
        >
            {/* Gradient initial — always rendered, hidden by photo when loaded */}
            <div
                className={`absolute inset-0 flex items-center justify-center font-bold text-white ${roundedClass}`}
                style={{ ...getAvatarStyle(name), fontSize: size * 0.42 }}
            >
                {initial}
            </div>

            {/* Shimmer skeleton — shows while image is loading */}
            {status === 'loading' && (
                <div
                    className={`absolute inset-0 ${roundedClass} animate-pulse`}
                    style={{ background: 'var(--md-sys-color-surface-variant)' }}
                />
            )}

            {/* Actual photo — crossfades in */}
            {avatarUrl && (
                <img
                    src={avatarUrl}
                    alt={name}
                    draggable={false}
                    onLoad={() => setStatus('loaded')}
                    onError={() => setStatus('error')}
                    className={`absolute inset-0 w-full h-full object-cover ${roundedClass} transition-opacity duration-300`}
                    style={{ opacity: status === 'loaded' ? 1 : 0 }}
                />
            )}
        </div>
    );
};

export default UserAvatar;
