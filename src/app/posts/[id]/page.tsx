'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ALL_USERS } from '@/lib/mock-posts';
import { supabase } from '@/lib/supabase';
import { Post, ReactionType } from '@/types/post';
import styles from './post.module.css';

export default function PostDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [activeTab, setActiveTab] = useState<'read' | 'unread'>('unread');
    const [loading, setLoading] = useState(false);

    // 記事データのロード
    useEffect(() => {
        const fetchPost = async () => {
            if (!params?.id) return;

            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) {
                console.error('Error fetching post:', error);
                return;
            }

            if (data) {
                // スネークケース -> キャメルケース変換
                const formattedPost: Post = {
                    id: data.id,
                    title: data.title,
                    content: data.content,
                    type: data.type,
                    status: data.status,
                    authorId: data.author_id,
                    authorName: data.author_name,
                    authorAvatar: data.author_avatar,
                    createdAt: data.created_at,
                    reactions: data.reactions || []
                };
                setPost(formattedPost);
            }
        };

        fetchPost();
    }, [params]);

    // リアクション処理
    const handleReaction = async (type: ReactionType) => {
        if (!user || !post) return;
        setLoading(true);

        const newReaction = {
            userId: user.id || 'current_user',
            userName: user.name,
            type: type,
            timestamp: new Date().toISOString()
        };

        // 既存のリアクションがあれば削除（上書き）して追加
        const updatedReactions = [
            ...post.reactions.filter(r => r.userId !== user.id),
            newReaction
        ];

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
            setLoading(false);
        }
    };

    if (!post) {
        return (
            <AuthGuard>
                <div className={styles.container}>
                    <p>読み込み中、または記事が見つかりません...</p>
                </div>
            </AuthGuard>
        );
    }

    // 自分はこの記事にリアクション済みか？
    const myReaction = user ? post.reactions.find(r => r.userId === user.id) : undefined;

    // 既読・未読ユーザーの集計
    const readUserIds = post.reactions.map(r => r.userId);
    const readUsers = ALL_USERS.filter(u => readUserIds.includes(u.id));
    const unreadUsers = ALL_USERS.filter(u => !readUserIds.includes(u.id));

    // 今表示するリスト
    const displayUsers = activeTab === 'read' ? readUsers : unreadUsers;

    return (
        <AuthGuard>
            <div className={styles.container}>
                <Link href="/apps/board" className={styles.backLink}>
                    ← 掲示板に戻る
                </Link>

                <article className={styles.article}>
                    <div className={styles.header}>
                        <div className={styles.metaHeader}>
                            <div className={styles.authorInfo}>
                                <img src={post.authorAvatar} alt={post.authorName} className={styles.avatar} />
                                <div className={styles.authorText}>
                                    <span className={styles.name}>{post.authorName}</span>
                                    <span className={styles.time}>{new Date(post.createdAt).toLocaleString('ja-JP')}</span>
                                </div>
                            </div>
                            <div className={styles.badges}>
                                <Badge type={post.type} />
                                {post.status !== 'open' && <Badge type={post.status} />}
                            </div>
                        </div>
                        <h1 className={styles.title}>{post.title}</h1>
                    </div>

                    <div className={styles.content}>
                        {post.content}
                    </div>

                    <div className={styles.actions}>
                        {myReaction ? (
                            <div className={styles.actionMessage}>
                                ✅ あなたは <strong>{myReaction.type === 'acknowledged' ? '了解' : '完了'}</strong> しました
                                <span style={{ fontSize: '0.8em', marginLeft: '0.5em' }}>
                                    ({new Date(myReaction.timestamp).toLocaleString('ja-JP')})
                                </span>
                            </div>
                        ) : (
                            <>
                                <p className={styles.actionMessage}>内容を確認したら、以下のボタンを押してください</p>
                                <div className={styles.buttons}>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleReaction('acknowledged')}
                                        loading={loading}
                                    >
                                        了解しました
                                    </Button>
                                    {post.type === 'request' && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleReaction('completed')}
                                            loading={loading}
                                        >
                                            作業完了しました
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </article>

                <div className={styles.statusSection}>
                    <div className={styles.statusHeader}>
                        <h3 className={styles.statusTitle}>確認状況</h3>
                        <span className={styles.statusStats}>
                            既読: {readUsers.length} / 全員: {ALL_USERS.length}
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
                                            <img src={u.avatarUrl} alt={u.name} className={styles.userAvatar} />
                                            <span>{u.name}</span>
                                        </div>
                                        {activeTab === 'read' ? (
                                            <span className={`${styles.statusBadge} ${styles.statusDone}`}>
                                                {reaction?.type === 'acknowledged' ? '全了解' : '完了'}
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
