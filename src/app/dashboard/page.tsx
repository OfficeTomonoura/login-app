'use client';

import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const { user, logout } = useAuth();

    return (
        <AuthGuard>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>ダッシュボード</h1>
                        <div className={styles.userSection}>
                            <img src={user?.avatarUrl} alt="Avatar" className={styles.avatar} />
                            <span className={styles.userName}>{user?.name}</span>
                            <Button variant="ghost" onClick={logout}>
                                ログアウト
                            </Button>
                        </div>
                    </div>
                </header>

                <main className={styles.main}>
                    <div className={styles.welcome}>
                        <h2 className={styles.welcomeTitle}>ようこそ、{user?.name}さん！</h2>
                        <p className={styles.welcomeText}>
                            ログインに成功しました。このページは認証されたユーザーのみがアクセスできます。
                        </p>
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <div className={styles.cardIcon}>📊</div>
                            <h3 className={styles.cardTitle}>統計情報</h3>
                            <p className={styles.cardValue}>1,234</p>
                            <p className={styles.cardLabel}>総アクセス数</p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardIcon}>📈</div>
                            <h3 className={styles.cardTitle}>成長率</h3>
                            <p className={styles.cardValue}>+24%</p>
                            <p className={styles.cardLabel}>前月比</p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardIcon}>⭐</div>
                            <h3 className={styles.cardTitle}>評価</h3>
                            <p className={styles.cardValue}>4.8</p>
                            <p className={styles.cardLabel}>平均スコア</p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardIcon}>🎯</div>
                            <h3 className={styles.cardTitle}>達成率</h3>
                            <p className={styles.cardValue}>87%</p>
                            <p className={styles.cardLabel}>目標進捗</p>
                        </div>
                    </div>

                    <div className={styles.infoBox}>
                        <h3>💡 このアプリについて</h3>
                        <p>これはダミーアカウントで動作するフロントエンドのデモです。</p>
                        <p>実際のバックエンド連携は行っておらず、認証状態はlocalStorageで管理されています。</p>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
