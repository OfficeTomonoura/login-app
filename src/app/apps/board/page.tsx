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
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalMemberCount, setTotalMemberCount] = useState(0);

    // フィルター状態
    const [filterUnread, setFilterUnread] = useState(false);
    const [filterIncomplete, setFilterIncomplete] = useState(false);
    const [filterFavorite, setFilterFavorite] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'report' | 'request' | 'notice'>('all');
    const [filterAuthor, setFilterAuthor] = useState<string | 'all'>('all');

    useEffect(() => {
        const fetchData = async () => {
            console.log('Fetching data...');
            try {
                // 1. 投稿データ取得
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (postsError) {
                    throw postsError;
                }

                // 2. 全メンバー数取得 (アカウント連携済みのみ)
                const { count, error: countError } = await supabase
                    .from('jc_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_profile_linked', true);

                if (countError) {
                    console.error('Error fetching member count:', countError);
                } else if (count !== null) {
                    setTotalMemberCount(count);
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

    // 自分にとっての未読数を計算
    const getUnreadCount = (post: Post) => {
        // ここでの未読数は「全体での未読者数」を表示する仕様とする
        // （自分が未読かどうかはPostCard内で判定）
        const readCount = post.reactions.length;

        // ターゲット指定がある場合は、母数がtotalMemberCountではないが、
        // 一覧表示時点では厳密なターゲット数を計算するのがコスト高なので、
        // 簡易的に「全体 - 既読数」または「0（マイナスにならないよう）」とする。
        // ※正確にやるなら、各PostのtargetUsers/Committeesを展開して母数を出す必要があるが、
        // Dashboardではパフォーマンスを優先し、全体数をベースにするか、詳細計算を省略するのが一般的。
        // ここでは、一旦簡易計算にとどめる。

        // もし閲覧制限があるなら、未読数は「ターゲット数 - 既読数」になるべきだが、
        // ここでは「全体周知」が多いと仮定して totalMemberCount を使う。
        const unread = totalMemberCount - readCount;
        return unread > 0 ? unread : 0;
    };

    // フィルタリングロジック
    const filteredPosts = posts.filter(post => {
        // --- 閲覧制限ロジック (宛先指定) ---
        if (user) {
            const hasTargetUsers = post.targetUsers && post.targetUsers.length > 0;
            const hasTargetCommittees = post.targetCommittees && post.targetCommittees.length > 0;

            if (hasTargetUsers || hasTargetCommittees) {
                // 投稿者本人は常に閲覧可能
                const isAuthor = post.authorId === user.id;

                // 宛先ユーザーに含まれているか
                const isTargetUser = post.targetUsers?.includes(user.id);

                // 宛先委員会に含まれているか (ユーザーの所属委員会名と照合)
                const userCommitteeNames = user.committees?.map(c => c.name) || [];
                const isTargetCommittee = post.targetCommittees?.some(name => userCommitteeNames.includes(name));

                // いずれにも該当しない場合は非表示
                if (!isAuthor && !isTargetUser && !isTargetCommittee) {
                    return false;
                }
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
        if (filterType !== 'all' && post.type !== filterType) {
            return false;
        }
        // 投稿者
        if (filterAuthor !== 'all' && post.authorId !== filterAuthor) {
            return false;
        }
        return true;
    });

    // 投稿者リスト（名前で重複排除・IDなし除外）
    const authors = Array.from(
        posts
            .filter(p => p.authorId && p.authorName) // IDと名前があるもの
            .reduce((map, p) => {
                const name = p.authorName || 'Unknown';
                if (!map.has(name)) {
                    map.set(name, { id: p.authorId, name });
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

                                {/* 委員会フィルター (ダミー選択肢) */}
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className={styles.hiddenSelect}
                                        onChange={(e) => alert(`${e.target.value}での絞り込みは、メンバー機能実装後に有効になります`)}
                                        value="all"
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                    >
                                        <option value="all">委員会: すべて</option>
                                        <option value="somu">総務委員会</option>
                                        <option value="koho">広報委員会</option>
                                        <option value="kakudai">会員拡大委員会</option>
                                        <option value="shinboku">親睦委員会</option>
                                    </select>
                                    <FilterChip label="🤝 委員会" hasDropdown />
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
                                            totalUsers={totalMemberCount}
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
