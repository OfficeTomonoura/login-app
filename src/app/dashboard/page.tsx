'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { Post, Reaction } from '@/types/post';
import styles from './launcher.module.css';

export default function DashboardLauncher() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());

    // 時計の更新
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 未読数の取得
    useEffect(() => {
        const fetchUnread = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('posts')
                .select('reactions');

            if (error || !data) return;

            // 未読記事数を計算 (自分のリアクションがない記事)
            const count = data.filter((item) => {
                // Supabaseのレスポンスは型がつかないためキャスト
                const reactions = (item.reactions as Reaction[]) || [];
                return !reactions.find((r) => r.userId === user.id);
            }).length;

            setUnreadCount(count);
        };

        fetchUnread();
    }, [user]);

    const formatDate = (date: Date) => {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return `${date.getMonth() + 1}月${date.getDate()}日 (${days[date.getDay()]})`;
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.container}>
            <div className={styles.welcomeSection}>
                <div className={styles.date}>{formatDate(currentTime)}</div>
                <div className={styles.time}>{formatTime(currentTime)}</div>
            </div>

            <div className={styles.grid}>
                {/* 掲示板アプリ */}
                <Link href="/apps/board" className={styles.appItem}>
                    <div className={`${styles.iconWrapper} ${styles.board}`}>
                        📢
                        {unreadCount > 0 && (
                            <div className={styles.badge}>{unreadCount}</div>
                        )}
                    </div>
                    <span className={styles.appName}>掲示板</span>
                </Link>

                {/* 投稿ショートカット */}
                <Link href="/posts/create" className={styles.appItem}>
                    <div className={`${styles.iconWrapper} ${styles.post}`}>
                        ✍️
                    </div>
                    <span className={styles.appName}>新規投稿</span>
                </Link>

                {/* メンバー名簿 */}
                <Link href="/apps/members" className={styles.appItem}>
                    <div className={`${styles.iconWrapper} ${styles.members}`}>
                        👥
                    </div>
                    <span className={styles.appName}>名簿</span>
                </Link>

                {/* マイページ */}
                <Link href="/profile" className={styles.appItem}>
                    <div className={`${styles.iconWrapper} ${styles.profile}`}>
                        👤
                    </div>
                    <span className={styles.appName}>マイページ</span>
                </Link>

                {/* 以下ダミーアプリ */}
                <div className={styles.appItem} onClick={() => alert('準備中です')}>
                    <div className={`${styles.iconWrapper} ${styles.calendar}`}>
                        📅
                    </div>
                    <span className={styles.appName}>カレンダー</span>
                </div>

                <div className={styles.appItem} onClick={() => alert('準備中です')}>
                    <div className={`${styles.iconWrapper} ${styles.expenses}`}>
                        💰
                    </div>
                    <span className={styles.appName}>経費精算</span>
                </div>

                <div className={styles.appItem} onClick={() => alert('サポートへお問い合わせください')}>
                    <div className={`${styles.iconWrapper} ${styles.help}`}>
                        ❓
                    </div>
                    <span className={styles.appName}>ヘルプ</span>
                </div>
            </div>
        </div>
    );
}
