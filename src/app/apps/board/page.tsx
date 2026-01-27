'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import FilterChip from '@/components/ui/FilterChip';
import PostCard from '@/components/PostCard';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/post';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalMemberCount, setTotalMemberCount] = useState(0);
    const [committees, setCommittees] = useState<{ id: string; name: string }[]>([]);

    // フィルター状態
    const [filterUnread, setFilterUnread] = useState(false);
    const [filterIncomplete, setFilterIncomplete] = useState(false);
    const [filterFavorite, setFilterFavorite] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'report' | 'request' | 'notice'>('all');
    const [filterAuthor, setFilterAuthor] = useState<string | 'all'>('all');
    const [filterCommittee, setFilterCommittee] = useState<string | 'all'>('all');

    useEffect(() => {
        const fetchData = async () => {
            console.log('Fetching data...');
            try {
                // 1. 投稿データ取得
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (postsError) throw postsError;

                // 2. 全メンバー数取得
                const { count, error: countError } = await supabase
                    .from('jc_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_profile_linked', true);

                if (!countError && count !== null) {
                    setTotalMemberCount(count);
                }

                // 3. 委員会マスター取得
                const { data: committeesData } = await supabase
                    .from('master_committees')
                    .select('id, name')
                    .eq('year', 2026)
                    .order('name');

                if (committeesData) {
                    setCommittees(committeesData);
                }

                if (postsData) {
                    // DBの形式(snake_case)からアプリの形式(camelCase)へ変換
                    const formattedPosts: Post[] = postsData.map(item => ({
                        id: item.id,
                        title: item.title,
                        content: item.content,
                        type: item.type,
                        status: item.status,
                        authorId: item.author_id,
                        authorName: item.author_name,
                        authorAvatar: item.author_avatar,
                        createdAt: item.created_at,
                        reactions: item.reactions || [],
                        favorites: item.favorites || [],
                        targetUsers: item.target_users || [],
                        targetCommittees: item.target_committees || [],
                    }));
                    setPosts(formattedPosts);
                }
            } catch (err: any) {
                console.error('Unexpected error:', err);
                setError(err.message || '予期せぬエラーが発生しました');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 既読・未読の統計数値を計算（投稿者本人を除外）
    const getPostStats = (post: Post) => {
        // 1. 投稿者本人を除いた既読数
        const readCount = post.reactions.filter(r => r.userId !== post.authorId).length;

        // 2. 投稿者本人を除いた母数
        const adjustedTotal = totalMemberCount > 0 ? totalMemberCount - 1 : 0;

        // 3. 未読数
        const unreadCount = adjustedTotal - readCount;

        return {
            readCount,
            totalUsers: adjustedTotal,
            unreadCount: unreadCount > 0 ? unreadCount : 0
        };
    };

    // フィルタリングロジック
    const filteredPosts = posts.filter(post => {
        // --- 閲覧制限ロジック ---
        if (user) {
            const hasTargetUsers = post.targetUsers && post.targetUsers.length > 0;
            const hasTargetCommittees = post.targetCommittees && post.targetCommittees.length > 0;

            if (hasTargetUsers || hasTargetCommittees) {
                const isAuthor = post.authorId === user.id;
                const isTargetUser = post.targetUsers?.includes(user.id);
                const userCommitteeNames = user.committees?.map(c => c.name) || [];
                const isTargetCommittee = post.targetCommittees?.some(name => userCommitteeNames.includes(name));
                if (!isAuthor && !isTargetUser && !isTargetCommittee) return false;
            }
        }

        // --- UIフィルターロジック ---
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
        // お気に入りのみ
        if (filterFavorite) {
            const isFavorited = user && post.favorites.includes(user.id || '');
            if (!isFavorited) return false;
        }
        // 種別
        if (filterType !== 'all' && post.type !== filterType) return false;
        // 投稿者
        if (filterAuthor !== 'all' && post.authorId !== filterAuthor) return false;

        // 委員会フィルター
        if (filterCommittee !== 'all') {
            if (!post.targetCommittees?.includes(filterCommittee)) return false;
        }

        return true;
    });

    // 投稿者リスト（名前で重複排除・IDなし除外）
    const authors = Array.from(
        posts
            .filter(p => p.authorId && p.authorName) // IDと名前があるもの
            .reduce((map, p) => {
                const name = p.authorName;
                if (!map.has(name)) map.set(name, { id: p.authorId, name });
                return map;
            }, new Map<string, { id: string; name: string }>())
            .values()
    );

    return (
        <AuthGuard>
            <div className={styles.container}>
                {loading && <LoadingScreen />}
                {error && <div style={{ padding: 20, color: 'red', textAlign: 'center' }}>エラー: {error}</div>}
                {!loading && !error && (
                    <main className={styles.main}>
                        <div className={styles.feedSection}>
                            <div className={styles.feedHeader}>
                                <h3 className={styles.sectionTitle}>最新の投稿</h3>
                                <Link href="/posts/create">
                                    <Button variant="primary">＋ 新規投稿</Button>
                                </Link>
                            </div>

                            {/* フィルターバー */}
                            <div className={styles.filterBar}>
                                <FilterChip
                                    label="🔥 未読"
                                    isActive={filterUnread}
                                    variant="unread"
                                    onClick={() => setFilterUnread(!filterUnread)}
                                />
                                <FilterChip
                                    label="⚡️ 未完了"
                                    isActive={filterIncomplete}
                                    variant="incomplete"
                                    onClick={() => setFilterIncomplete(!filterIncomplete)}
                                />
                                <FilterChip
                                    label="⭐ お気に入り"
                                    isActive={filterFavorite}
                                    variant="favorite"
                                    onClick={() => setFilterFavorite(!filterFavorite)}
                                />

                                <div className={styles.filterSeparator} />

                                {/* 委員会フィルター */}
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className={styles.hiddenSelect}
                                        onChange={(e) => setFilterCommittee(e.target.value)}
                                        value={filterCommittee}
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    >
                                        <option value="all">委員会: すべて</option>
                                        {committees.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <FilterChip
                                        label={`🤝 ${filterCommittee === 'all' ? '委員会' : filterCommittee}`}
                                        isActive={filterCommittee !== 'all'}
                                        hasDropdown
                                    />
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
                                    <FilterChip
                                        label={`🏷️ ${filterType === 'all' ? '種別' : (filterType === 'report' ? '報告' : filterType === 'request' ? '依頼' : 'お知らせ')}`}
                                        isActive={filterType !== 'all'}
                                        hasDropdown
                                    />
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
                                    filteredPosts.map(post => {
                                        const stats = getPostStats(post);
                                        return (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                readCount={stats.readCount}
                                                unreadCount={stats.unreadCount}
                                                totalUsers={stats.totalUsers}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </main>
                )}
            </div>
        </AuthGuard>
    );
}
