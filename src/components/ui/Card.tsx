import type { ReactNode } from 'react';
import styles from './Card.module.css';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: CardPadding;
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
    return (
        <div className={`${styles.card} ${styles[`padding-${padding}`]} ${className}`}>
            {children}
        </div>
    );
}
