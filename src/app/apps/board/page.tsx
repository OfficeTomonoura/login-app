'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import PostCard from '@/components/PostCard';
import { ALL_USERS } from '@/lib/mock-posts';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/post';
import { Reaction } from '@/types/post';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            console.log('Fetching posts...');
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching posts:', error);
                    setError(error.message);
                    return;
                }

                console.log('Posts fetched:', data);

                if (data) {
                    // DBの形式(snake_case)からアプリの形式(camelCase)へ変換
                    const formattedPosts: Post[] = data.map(item => ({
                        id: item.id,
                        title: item.title,
                        content: item.content,
                        type: item.type,
                        status: item.status,
                        authorId: item.author_id,
                        authorName: item.author_name,
                        authorAvatar: item.author_avatar,
                        createdAt: item.created_at,
                        reactions: item.reactions || []
                    }));
                    setPosts(formattedPosts);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
                setError('予期せぬエラーが発生しました');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
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
                {loading && <LoadingSpinner />}
                {error && <div style={{ padding: 20, color: 'red', textAlign: 'center' }}>エラー: {error}</div>}
                {!loading && !error && (
                    <main className={styles.main}>
                        <div className={styles.grid}>
                            <div className={styles.card}>
                                <div className={styles.cardIcon}>📬</div>
                                <h3 className={styles.cardTitle}>未読の記事</h3>
                                <p className={styles.cardValue}>
                                    {posts.filter((p: Post) => user && !p.reactions.find((r: Reaction) => r.userId === user.id)).length}
                                </p>
                                <p className={styles.cardLabel}>要確認</p>
                            </div>

                            <div className={styles.card}>
                                <div className={styles.cardIcon}>✅</div>
                                <h3 className={styles.cardTitle}>完了した依頼</h3>
                                <p className={styles.cardValue}>
                                    {posts.filter((p: Post) => p.type === 'request' && p.status === 'closed').length}
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
                )}
            </div>
        </AuthGuard>
    );
}
