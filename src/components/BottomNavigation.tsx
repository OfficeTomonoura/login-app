'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './BottomNavigation.module.css';

export default function BottomNavigation() {
    const pathname = usePathname();
    const { user } = useAuth();

    // ログインしていない、またはログインページの場合は表示しない
    if (!user || pathname === '/auth/login') {
        return null;
    }

    return (
        <nav className={styles.nav}>
            <Link
                href="/dashboard"
                className={`${styles.item} ${pathname === '/dashboard' ? styles.active : ''}`}
            >
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                ホーム
            </Link>

            <Link
                href="/posts/new"
                className={`${styles.item} ${pathname === '/posts/new' ? styles.active : ''} ${styles.createButton}`}
            >
                <div className={styles.createIconBg}>
                    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginBottom: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                投稿
            </Link>

            <Link
                href="/profile"
                className={`${styles.item} ${pathname === '/profile' ? styles.active : ''}`}
            >
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                マイページ
            </Link>
        </nav>
    );
}
