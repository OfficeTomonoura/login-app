import React from 'react';
import styles from './Button.module.css';

type ButtonProps = {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    className?: string;
    title?: string;
};

export default function Button({
    children,
    variant = 'primary',
    type = 'button',
    disabled = false,
    loading = false,
    onClick,
    className = '',
    title,
}: ButtonProps) {
    return (
        <button
            type={type}
            className={`${styles.btn} ${styles[variant]} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            title={title}
        >
            {loading ? 'Loading...' : children}
        </button>
    );
}
