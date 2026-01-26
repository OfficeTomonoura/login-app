import React from 'react';
import styles from './Input.module.css';

type InputProps = {
    label?: string;
    type?: 'text' | 'email' | 'password' | 'date' | 'tel' | 'url';
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
};

export default function Input({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    className = '',
}: InputProps) {
    return (
        <div className={`${styles.inputWrapper} ${className}`}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <input
                type={type}
                className={`${styles.input} ${error ? styles.error : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                required={required}
            />
            {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
    );
}
