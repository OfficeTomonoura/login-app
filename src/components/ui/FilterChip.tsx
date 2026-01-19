import styles from './FilterChip.module.css';

interface FilterChipProps {
    label: string;
    isActive?: boolean;
    hasDropdown?: boolean;
    onClick?: () => void;
    icon?: string;
}

export default function FilterChip({
    label,
    isActive = false,
    hasDropdown = false,
    onClick,
    icon
}: FilterChipProps) {
    return (
        <button
            className={`${styles.chip} ${isActive ? styles.active : ''}`}
            onClick={onClick}
        >
            {icon && <span className={styles.icon}>{icon}</span>}
            <span className={styles.label}>{label}</span>
            {hasDropdown && <span className={styles.arrow}>▼</span>}
        </button>
    );
}
