'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import PostCard from '@/components/PostCard';
import { INITIAL_POSTS, ALL_USERS } from '@/lib/mock-posts';
import { Post } from '@/types/post';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        // ローカルストレージから記事を取得、なければ初期データ
        const storedPosts = localStorage.getItem('mock_posts');
        if (storedPosts) {
            setPosts(JSON.parse(storedPosts));
        } else {
            setPosts(INITIAL_POSTS);
            localStorage.setItem('mock_posts', JSON.stringify(INITIAL_POSTS));
        }
    }, []);

    // 自分にとっての未読数を計算
    const getUnreadCount = (post: Post) => {
        // ここでの未読数は「全体での未読者数」を表示する仕様とする
        // （自分が未読かどうかはPostCard内で判定）
        const readCount = post.reactions.length;
        return ALL_USERS.length - readCount;
    };

    return (
        <AuthGuard>
            <div className={styles.container}>
                <main className={styles.main}>
                    <div className={styles.welcome}>
                        <h2 className={styles.welcomeTitle}>ようこそ、{user?.name}さん！</h2>
                        <p className={styles.welcomeText}>
                            社内の報告・連絡・相談を一元管理します。
                        </p>
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <div className={styles.cardIcon}>📬</div>
                            <h3 className={styles.cardTitle}>未読の記事</h3>
                            <p className={styles.cardValue}>
                                {posts.filter(p => user && !p.reactions.find(r => r.userId === user.id)).length}
                            </p>
                            <p className={styles.cardLabel}>要確認</p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardIcon}>✅</div>
                            <h3 className={styles.cardTitle}>完了した依頼</h3>
                            <p className={styles.cardValue}>
                                {posts.filter(p => p.type === 'request' && p.status === 'closed').length}
                            </p>
                            <p className={styles.cardLabel}>今月</p>
                        </div>
                    </div>

                    <div className={styles.feedSection}>
                        <div className={styles.feedHeader}>
                            <h3 className={styles.sectionTitle}>最新の投稿</h3>
                            <Link href="/posts/new">
                                <Button variant="primary">＋ 新規投稿</Button>
                            </Link>
                        </div>
                        <div className={styles.feed}>
                            {posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    unreadCount={getUnreadCount(post)}
                                    totalUsers={ALL_USERS.length}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
