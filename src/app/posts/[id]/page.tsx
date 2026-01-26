'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AuthGuard from '@/components/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import { Post, ReactionType } from '@/types/post';
import styles from './post.module.css';

interface DBMember {
    id: string;
    name: string;
    committees: any[]; // JSONB
    avatar_url?: string;
}

export default function PostDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [activeTab, setActiveTab] = useState<'read' | 'unread'>('unread');
    const [loading, setLoading] = useState(true); // 初期ロード用
    const [actionLoading, setActionLoading] = useState(false); // ボタンアクション用
    const [members, setMembers] = useState<DBMember[]>([]); // 全メンバー

    // 記事データのロード
    useEffect(() => {
        const fetchPostAndMembers = async () => {
            if (!params?.id) {
                console.warn('Post ID is missing');
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching post with ID:', params.id);
                setLoading(true);

                // 1. 投稿データの取得
                const { data: postData, error: postError } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (postError) {
                    console.error('Error fetching post:', postError);
                    setLoading(false);
                    return;
                }

                // 2. メンバーデータの取得
                const { data: membersData, error: membersError } = await supabase
                    .from('jc_members')
                    .select('id, name, committees, avatar_url')
                    .order('name');

                if (membersError) {
                    console.error('Error fetching members:', membersError);
                } else {
                    setMembers(membersData || []);
                }

                if (postData) {
                    console.log('Post fetched successfully:', postData.id);
                    // スネークケース -> キャメルケース変換
                    const formattedPost: Post = {
                        id: postData.id,
                        title: postData.title,
                        content: postData.content,
                        type: postData.type,
                        status: postData.status,
                        authorId: postData.author_id,
                        authorName: postData.author_name,
                        authorAvatar: postData.author_avatar,
                        createdAt: postData.created_at,
                        reactions: postData.reactions || [],
                        favorites: postData.favorites || [],
                        targetUsers: postData.target_users || [],
                        targetCommittees: postData.target_committees || [],
                    };
                    setPost(formattedPost);
                } else {
                    console.warn('No post data returned for ID:', params.id);
                }
                setLoading(false);
            } catch (err) {
                console.error('Unexpected error while fetching post:', err);
                setLoading(false);
            }
        };

        fetchPostAndMembers();
    }, [params]);

    // リアクション処理
    const handleReaction = async (type: ReactionType) => {
        if (!user || !post) return;
        setActionLoading(true);

        const existingReaction = post.reactions.find(r => r.userId === user.id);
        let updatedReactions;

        if (type === 'acknowledged') {
            if (existingReaction) {
                // すでに何らかのリアクション（既読 or 完了）があるなら、すべて削除（既読解除）
                // これにより「既読（了解）を解除するとすべて白紙に戻る」という仕様を実現
                updatedReactions = post.reactions.filter(r => r.userId !== user.id);
            } else {
                // 未選択なら既読にする
                const newReaction = {
                    userId: user.id,
                    userName: user.name,
                    type: 'acknowledged' as ReactionType,
                    timestamp: new Date().toISOString()
                };
                updatedReactions = [
                    ...post.reactions.filter(r => r.userId !== user.id),
                    newReaction
                ];
            }
        } else if (type === 'completed') {
            if (existingReaction?.type === 'completed') {
                // すでに完了済みなら、了解状態へ戻す
                const newReaction = {
                    userId: user.id,
                    userName: user.name,
                    type: 'acknowledged' as ReactionType,
                    timestamp: new Date().toISOString()
                };
                updatedReactions = [
                    ...post.reactions.filter(r => r.userId !== user.id),
                    newReaction
                ];
            } else if (existingReaction?.type === 'acknowledged') {
                // 了解済みから完了へ進む
                const newReaction = {
                    userId: user.id,
                    userName: user.name,
                    type: 'completed' as ReactionType,
                    timestamp: new Date().toISOString()
                };
                updatedReactions = [
                    ...post.reactions.filter(r => r.userId !== user.id),
                    newReaction
                ];
            } else {
                // 未了解の状態で完了は押せない（UIでガードするが念のため）
                return;
            }
        } else {
            updatedReactions = post.reactions;
        }

        // DB更新
        try {
            const { error } = await supabase
                .from('posts')
                .update({ reactions: updatedReactions })
                .eq('id', post.id);

            if (error) throw error;

            // ローカルステート更新
            const updatedPost = { ...post, reactions: updatedReactions };
            setPost(updatedPost);
        } catch (error) {
            console.error('Error updating reaction:', error);
            alert('更新に失敗しました');
        } finally {
            setActionLoading(false);
        }
    };

    // お気に入り処理
    const handleFavorite = async () => {
        if (!user || !post) return;
        setActionLoading(true);

        const isFavorited = post.favorites.includes(user.id || '');
        const updatedFavorites = isFavorited
            ? post.favorites.filter(id => id !== user.id)
            : [...post.favorites, user.id || ''];

        // DB更新
        try {
            const { error } = await supabase
                .from('posts')
                .update({ favorites: updatedFavorites })
                .eq('id', post.id);

            if (error) {
                console.error('Supabase error details:', error);

                // データベースにfavoritesカラムがない場合のエラー
                if (error.message?.includes('column') && error.message?.includes('favorites')) {
                    alert('お気に入り機能を使用するには、データベースの設定が必要です。\n\n以下のSQLをSupabaseで実行してください：\n\nALTER TABLE posts ADD COLUMN favorites jsonb DEFAULT \'[]\'::jsonb;');
                } else {
                    alert(`更新に失敗しました: ${error.message}`);
                }
                throw error;
            }

            // ローカルステート更新
            const updatedPost = { ...post, favorites: updatedFavorites };
            setPost(updatedPost);
        } catch (error) {
            console.error('Error updating favorite:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <AuthGuard>
                <div className={styles.container}>
                    <LoadingSpinner />
                </div>
            </AuthGuard>
        );
    }

    // 閲覧制限チェック
    const checkAccess = () => {
        if (!post || !user) return false;
        const hasTargetUsers = post.targetUsers && post.targetUsers.length > 0;
        const hasTargetCommittees = post.targetCommittees && post.targetCommittees.length > 0;

        if (!hasTargetUsers && !hasTargetCommittees) return true;

        if (post.authorId === user.id) return true;
        if (post.targetUsers?.includes(user.id)) return true;

        const userCommitteeNames = user.committees?.map(c => c.name) || [];
        if (post.targetCommittees?.some(name => userCommitteeNames.includes(name))) return true;

        return false;
    };

    if (!post || !checkAccess()) {
        return (
            <AuthGuard>
                <div className={styles.container}>
                    <article className={styles.article} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h2 style={{ marginBottom: '1rem' }}>閲覧権限がありません</h2>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
                            この投稿は特定のユーザーまたは委員会宛に制限されています。
                        </p>
                        <Link href="/apps/board">
                            <Button variant="secondary">掲示板に戻る</Button>
                        </Link>
                    </article>
                </div>
            </AuthGuard>
        );
    }

    // 自分はこの記事にリアクション済みか？
    const myReaction = user ? post.reactions.find(r => r.userId === user.id) : undefined;

    // 既読・未読ユーザーの集計 (宛先に基づいてフィルタリング)
    const getTargetAudience = () => {
        const hasTargetUsers = post.targetUsers && post.targetUsers.length > 0;
        const hasTargetCommittees = post.targetCommittees && post.targetCommittees.length > 0;

        if (!hasTargetUsers && !hasTargetCommittees) return members;

        return members.filter(u => {
            if (u.id === post.authorId) return true;
            if (post.targetUsers?.includes(u.id)) return true;

            // 委員会のJSONBパースが必要な場合はここで行う。
            // 簡易的に committees に配列が入っていると仮定してチェック。
            // JSONB { name: "...", ... } の配列を想定
            const uCommitteeNames = Array.isArray(u.committees)
                ? u.committees.map((c: any) => c.name || c) // 文字列のみの場合とオブジェクトの場合に対応
                : [];

            if (post.targetCommittees?.some(name => uCommitteeNames.includes(name))) return true;
            return false;
        });
    };

    const targetAudience = getTargetAudience();
    const readUserIds = post.reactions.map(r => r.userId);
    const readUsers = targetAudience.filter(u => readUserIds.includes(u.id));
    const unreadUsers = targetAudience.filter(u => !readUserIds.includes(u.id));

    // 今表示するリスト
    const displayUsers = activeTab === 'read' ? readUsers : unreadUsers;

    return (
        <AuthGuard>
            <div className={styles.container}>
                <Link href="/apps/board" className={styles.backButton} title="掲示板に戻る">
                    ◀︎
                </Link>

                <article className={styles.article}>
                    <div className={styles.header}>
                        <div className={styles.metaHeader}>
                            <div className={styles.authorInfo}>
                                <Avatar
                                    src={post.authorAvatar}
                                    alt={post.authorName}
                                    size="lg"
                                    fallback={post.authorName.charAt(0)}
                                    className={styles.avatar}
                                />
                                <div className={styles.authorText}>
                                    <span className={styles.name}>{post.authorName}</span>
                                    <span className={styles.time}>{new Date(post.createdAt).toLocaleString('ja-JP')}</span>
                                </div>
                            </div>
                            <div className={styles.headerActions}>
                                <button
                                    onClick={handleFavorite}
                                    className={`${styles.favoriteButton} ${post.favorites.includes(user?.id || '') ? styles.favorited : ''}`}
                                    disabled={actionLoading}
                                    title={post.favorites.includes(user?.id || '') ? 'お気に入りから削除' : 'お気に入りに追加'}
                                >
                                    {post.favorites.includes(user?.id || '') ? '★' : '☆'}
                                </button>
                                <div className={styles.badges}>
                                    <Badge type={post.type} />
                                    {post.status !== 'open' && <Badge type={post.status} />}
                                </div>
                            </div>
                        </div>
                        <h1 className={styles.title}>{post.title}</h1>
                    </div>

                    <div className={styles.content}>
                        {post.content}
                        {user && post.authorId === user.id && (
                            <div className={styles.contentEditAction}>
                                <Link href={`/posts/${post.id}/edit`}>
                                    <Button variant="secondary" className={styles.editButton}>✏️ 編集する</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className={styles.actions}>
                        <div className={styles.actionMessage}>
                            {myReaction ? (
                                <>
                                    ✅ あなたは <strong>{myReaction.type === 'acknowledged' ? '了解' : '完了'}</strong> しました
                                    <span style={{ fontSize: '0.8em', marginLeft: '0.5em' }}>
                                        ({new Date(myReaction.timestamp).toLocaleString('ja-JP')})
                                    </span>
                                </>
                            ) : (
                                '内容を確認したら、以下のボタンを押してください'
                            )}
                        </div>
                        <div className={styles.buttons}>
                            <Button
                                variant={myReaction?.type === 'acknowledged' || myReaction?.type === 'completed' ? 'primary' : 'secondary'}
                                onClick={() => handleReaction('acknowledged')}
                                loading={actionLoading}
                                className={myReaction?.type === 'acknowledged' || myReaction?.type === 'completed' ? styles.reactionButtonActive : ''}
                            >
                                {myReaction ? '既読' : '既読をつける'}
                            </Button>
                            {post.type === 'request' && (
                                <Button
                                    variant={myReaction?.type === 'completed' ? 'primary' : 'secondary'}
                                    onClick={() => handleReaction('completed')}
                                    loading={actionLoading}
                                    disabled={!myReaction} // 既読（了解）してなければ押せない
                                    className={myReaction?.type === 'completed' ? styles.reactionButtonActive : (myReaction?.type === 'acknowledged' ? '' : styles.reactionButtonInactive)}
                                    title={!myReaction ? '先に内容を確認（了解）してください' : ''}
                                >
                                    {myReaction?.type === 'completed' ? '完了済み' : '作業完了しました'}
                                </Button>
                            )}
                        </div>
                    </div>
                </article>

                <div className={styles.statusSection}>
                    <div className={styles.statusHeader}>
                        <h3 className={styles.statusTitle}>確認状況</h3>
                        <span className={styles.statusStats}>
                            既読: {readUsers.length} / 対象: {targetAudience.length}
                        </span>
                    </div>

                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'unread' ? styles.active : ''}`}
                            onClick={() => setActiveTab('unread')}
                        >
                            未読 ({unreadUsers.length})
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'read' ? styles.active : ''}`}
                            onClick={() => setActiveTab('read')}
                        >
                            既読 ({readUsers.length})
                        </button>
                    </div>

                    <div className={styles.userList}>
                        {displayUsers.length === 0 ? (
                            <div className={styles.userRow} style={{ justifyContent: 'center', color: 'var(--muted-foreground)' }}>
                                ユーザーはいません
                            </div>
                        ) : (
                            displayUsers.map(u => {
                                const reaction = post.reactions.find(r => r.userId === u.id);
                                return (
                                    <div key={u.id} className={styles.userRow}>
                                        <div className={styles.userInfo}>
                                            <Avatar
                                                src={u.avatar_url}
                                                alt={u.name}
                                                size="sm"
                                                fallback={u.name.charAt(0)}
                                                className={styles.userAvatar}
                                            />
                                            <span>{u.name}</span>
                                        </div>
                                        {activeTab === 'read' ? (
                                            <span className={`${styles.statusBadge} ${styles.statusDone}`}>
                                                {reaction?.type === 'acknowledged' ? '既読' : '完了'}
                                                <small style={{ marginLeft: '0.5em', fontWeight: 400 }}>
                                                    {reaction && new Date(reaction.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                </small>
                                            </span>
                                        ) : (
                                            <span className={`${styles.statusBadge} ${styles.statusPending}`}>未確認</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
