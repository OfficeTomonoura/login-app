'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import FilterChip from '@/components/ui/FilterChip';
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

    // フィルター状態
    const [filterUnread, setFilterUnread] = useState(false);
    const [filterIncomplete, setFilterIncomplete] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'report' | 'request' | 'notice'>('all');
    const [filterAuthor, setFilterAuthor] = useState<string | 'all'>('all');

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

    // フィルタリングロジック
    const filteredPosts = posts.filter(post => {
        // 未読のみ
        if (filterUnread) {
            const isRead = user && post.reactions.find(r => r.userId === user.id);
            if (isRead) return false;
        }
        // 未完了のみ（自分が担当の依頼で、完了していないもの）
        // ※簡易的に「依頼」かつ「自分が完了リアクションしていない」ものを未完了とする
        if (filterIncomplete) {
            if (post.type !== 'request') return false;
            const myReaction = user && post.reactions.find(r => r.userId === user.id);
            if (myReaction?.type === 'completed') return false;
            // 記事自体のステータスがclosedなら完了済みとみなす
            if (post.status === 'closed') return false;
        }
        // 種別
        if (filterType !== 'all' && post.type !== filterType) {
            return false;
        }
        // 投稿者
        if (filterAuthor !== 'all' && post.authorId !== filterAuthor) {
            return false;
        }
        return true;
    });

    // 投稿者リスト（重複排除・IDなし除外）
    const authors = Array.from(
        posts
            .filter(p => p.authorId) // IDがないものは除外
            .reduce((map, p) => {
                if (!map.has(p.authorId)) {
                    map.set(p.authorId, { id: p.authorId, name: p.authorName || 'Unknown' });
                }
                return map;
            }, new Map<string, { id: string; name: string }>())
            .values()
    );

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

                            {/* フィルターバー */}
                            <div className={styles.filterBar}>
                                <FilterChip
                                    label="🔥 未読"
                                    isActive={filterUnread}
                                    onClick={() => setFilterUnread(!filterUnread)}
                                />
                                <FilterChip
                                    label="⚡️ 未完了"
                                    isActive={filterIncomplete}
                                    onClick={() => setFilterIncomplete(!filterIncomplete)}
                                />

                                <div className={styles.filterSeparator} />

                                {/* 簡易的なドロップダウンUI (今回はセレクトボックスで代用) */}
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className={styles.hiddenSelect}
                                        onChange={(e) => alert('部署データがまだありません')}
                                        value="all"
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    >
                                        <option value="all">部署: すべて</option>
                                    </select>
                                    <FilterChip label="🏢 部署" hasDropdown />
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <select
                                        onChange={(e) => setFilterType(e.target.value as any)}
                                        value={filterType}
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    >
                                        <option value="all">種別: すべて</option>
                                        <option value="report">📘 報告</option>
                                        <option value="request">📕 依頼</option>
                                        <option value="notice">📢 お知らせ</option>
                                    </select>
                                    <FilterChip label={`🏷️ ${filterType === 'all' ? '種別' : filterType}`} isActive={filterType !== 'all'} hasDropdown />
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <select
                                        onChange={(e) => setFilterAuthor(e.target.value)}
                                        value={filterAuthor}
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    >
                                        <option value="all">投稿者: すべて</option>
                                        {authors.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                    <FilterChip
                                        label={`👤 ${filterAuthor === 'all' ? '投稿者' : (authors.find(a => a.id === filterAuthor)?.name || '選択中')}`}
                                        isActive={filterAuthor !== 'all'}
                                        hasDropdown
                                    />
                                </div>
                            </div>

                            <div className={styles.feed}>
                                {filteredPosts.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                                        条件に一致する投稿はありません
                                    </div>
                                ) : (
                                    filteredPosts.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            unreadCount={getUnreadCount(post)}
                                            totalUsers={ALL_USERS.length}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </main>
                )}
            </div>
        </AuthGuard>
    );
}
