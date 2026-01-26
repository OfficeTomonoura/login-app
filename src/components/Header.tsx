'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import styles from './Header.module.css';

export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // ルートページ（/）のみでヘッダーを表示する
    const isRootPage = pathname === '/';

    if (!isRootPage) {
        return null;
    }

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🔐</span>
                    <span className={styles.logoText}>25JC</span>
                </Link>

                <nav className={styles.nav}>
                    {user ? (
                        // ログイン後のナビゲーション（基本的には表示されない想定だが安全性のため維持）
                        <div className={styles.userSection}>
                            <Link href="/dashboard" className={styles.navLink}>
                                ホーム
                            </Link>
                            <Link href="/profile" className={styles.navLink}>
                                プロフィール
                            </Link>
                            <div className={styles.userInfo}>
                                <Avatar
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    size="sm"
                                    fallback={user.name ? user.name.charAt(0) : '?'}
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
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
