'use client';

import { useState } from 'react';
import styles from './Avatar.module.css';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: AvatarSize;
    fallback?: string;
    className?: string;
}

export default function Avatar({
    src,
    alt = 'Avatar',
    size = 'md',
    fallback = '?',
    className = ''
}: AvatarProps) {
    const [imageError, setImageError] = useState(false);

    // If there is no source or an error occurred, show fallback
    const showFallback = !src || imageError;

    return (
        <div
            className={`${styles.avatar} ${styles[`size-${size}`]} ${className}`}
            aria-label={alt}
        >
            {showFallback ? (
                <span className={styles.fallback}>{fallback}</span>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={styles.image}
                    onError={() => setImageError(true)}
                />
            )}
        </div>
    );
}
