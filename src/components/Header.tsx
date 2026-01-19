'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import styles from './Header.module.css';

export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // 認証ページではヘッダーを表示しない
    if (pathname?.startsWith('/auth')) {
        return null;
    }

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🔐</span>
                    <span className={styles.logoText}>Service App</span>
                </Link>

                <nav className={styles.nav}>
                    {user ? (
                        // ログイン後のナビゲーション
                        <div className={styles.userSection}>
                            <Link href="/dashboard" className={styles.navLink}>
                                ホーム
                            </Link>
                            <Link href="/profile" className={styles.navLink}>
                                プロフィール
                            </Link>
                            <div className={styles.userInfo}>
                                <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className={styles.avatar}
                                />
                                <span className={styles.userName}>{user.name}</span>
                            </div>
                            <Button variant="ghost" onClick={logout}>
                                ログアウト
                            </Button>
                        </div>
                    ) : (
                        // ログイン前のナビゲーション
                        <div className={styles.authButtons}>
                            <Link href="/auth/login">
                                <Button variant="ghost">ログイン</Button>
                            </Link>
                            <Link href="/auth/register">
                                <Button variant="primary">新規登録</Button>
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
