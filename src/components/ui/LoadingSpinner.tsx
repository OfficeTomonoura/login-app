import styles from './loading.module.css';

/**
 * 基本のローディングスピナー
 */
const LoadingSpinner = ({ size = 'medium', color = 'primary' }: { size?: 'small' | 'medium' | 'large', color?: 'primary' | 'white' }) => {
    return (
        <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`} role="status">
            <span className={styles.srOnly}>Loading...</span>
        </div>
    );
}

export default LoadingSpinner;

/**
 * インライン（コンテンツ領域内）で表示するローディング画面
 */
export function LoadingScreen() {
    return (
        <div className={styles.screen}>
            <LoadingSpinner size="large" />
            <p className={styles.text}>読み込み中...</p>
        </div>
    );
}

/**
 * 画面全体を覆うローディングオーバーレイ
 */
export function LoadingOverlay() {
    return (
        <div className={styles.fullScreenOverlay}>
            <LoadingSpinner size="large" />
            <p className={styles.text}>読み込み中...</p>
        </div>
    );
}
