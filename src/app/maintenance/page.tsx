'use client';

import styles from './maintenance.module.css';

export default function MaintenancePage() {
    return (
        <div className={styles.container}>
            <div className={styles.backgroundBlobs}>
                <div className={styles.blob1}></div>
                <div className={styles.blob2}></div>
                <div className={styles.blob3}></div>
            </div>

            <div className={styles.glassPanel}>
                <div className={styles.iconWrapper}>
                    <span className={styles.icon}>🛠️</span>
                </div>

                <h1 className={styles.title}>現在メンテナンス中です</h1>

                <p className={styles.message}>
                    より良いサービス提供のため、システムメンテナンスを行っております。<br />
                    作業完了まで今しばらくお待ちください。
                </p>

                <div className={styles.divider}></div>

                <div className={styles.details}>
                    <div className={styles.detailItem}>
                        <span className={styles.label}>状況:</span>
                        <span className={styles.status}>作業進行中</span>
                    </div>
                </div>

                <p className={styles.subtext}>
                    ご不便をおかけしますが、ご理解とご協力をお願い申し上げます。
                </p>
            </div>

            <div className={styles.footer}>
                © 2026 25JC Development Team
            </div>
        </div>
    );
}
