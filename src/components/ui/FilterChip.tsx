import styles from './FilterChip.module.css';

interface FilterChipProps {
    label: string;
    isActive?: boolean;
    variant?: 'default' | 'unread' | 'incomplete';
    hasDropdown?: boolean;
    onClick?: () => void;
    icon?: string;
}

export default function FilterChip({
    label,
    isActive = false,
    variant = 'default',
    hasDropdown = false,
    onClick,
    icon
}: FilterChipProps) {
    const activeClass = variant === 'unread' ? styles.activeUnread :
        variant === 'incomplete' ? styles.activeIncomplete :
            styles.active;

    return (
        <button
            className={`${styles.chip} ${isActive ? activeClass : ''}`}
            onClick={onClick}
        >
            {icon && <span className={styles.icon}>{icon}</span>}
            <span className={styles.label}>{label}</span>
            {hasDropdown && <span className={styles.arrow}>▼</span>}
        </button>
    );
}
