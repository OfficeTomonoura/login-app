import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export default function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
    const spinner = (
        <div className={`${styles.spinner} ${styles[size]}`}>
            <div className={styles.circle}></div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className={styles.fullScreenOverlay}>
                {spinner}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {spinner}
        </div>
    );
}
