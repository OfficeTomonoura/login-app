'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
    const pathname = usePathname();

    // ルートページ（/）のみでフッターを表示する
    const isRootPage = pathname === '/';

    if (!isRootPage) {
        return null;
    }

    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.section}>
                        <h3 className={styles.title}>25JC</h3>
                        <p className={styles.description}>
                            25JC専用の多機能プラットフォーム
                        </p>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © 2026 Office Tomonoura LLC. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
