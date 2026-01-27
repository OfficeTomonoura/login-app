import styles from './loading.module.css';

export default function LoadingSpinner({ size = 'medium', color = 'primary' }: { size?: 'small' | 'medium' | 'large', color?: 'primary' | 'white' }) {
    return (
        <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`} role="status">
            <span className={styles.srOnly}>Loading...</span>
        </div>
    );
}

export function LoadingScreen() {
    return (
        <div className={styles.screen}>
            <LoadingSpinner size="large" />
            <p className={styles.text}>読み込み中...</p>
        </div>
    );
}
