import React from 'react';
import styles from './JCBadge.module.css';

type Props = {
    className?: string;
};

export default function JCBadge({ className }: Props) {
    return (
        <span className={`${styles.badge} ${className || ''}`}>
            25JC
        </span>
    );
}
