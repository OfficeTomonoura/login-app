'use client';

import Link from 'next/link';
import { Post, User } from '@/types/post';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import styles from './PostCard.module.css';
import { useAuth } from '@/contexts/SupabaseAuthContext';

type PostCardProps = {
    post: Post;
    unreadCount: number;
    totalUsers: number;
};

export default function PostCard({ post, unreadCount, totalUsers }: PostCardProps) {
    const { user } = useAuth();

    // 自分のリアクションがあるか確認
    const myReaction = user ? post.reactions.find(r => r.userId === user.id) : undefined;

    // 日付フォーマット
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className={`${styles.cardHover} ${myReaction ? styles.read : styles.unread} ${styles[post.type]}`} padding="none">
            <Link href={`/posts/${post.id}`} className={styles.contentLink}>
                {/* Header Section */}
                <div className={styles.header}>
                    <div className={styles.meta}>
                        <Avatar
                            src={post.authorAvatar}
                            alt={post.authorName}
                            size="md"
                            fallback={post.authorName.charAt(0)}
                        />
                        <div className={styles.info}>
                            <span className={styles.author}>{post.authorName}</span>
                            <span className={styles.date}>{formatDate(post.createdAt)}</span>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        {user && post.favorites.includes(user.id || '') && (
                            <span className={styles.favoriteIndicator} title="お気に入り">★</span>
                        )}
                        <div className={styles.badges}>
                            <Badge type={post.type} />
                            {post.status !== 'open' && <Badge type={post.status} />}
                        </div>
                    </div>
                </div>

                <div className={styles.content}>
                    <h3 className={styles.title}>{post.title}</h3>
                    <p className={styles.preview}>{post.content}</p>
                </div>

                <div className={styles.footer}>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <span>既読</span>
                            <strong>{post.reactions.length} / {totalUsers}</strong>
                        </div>
                        {unreadCount > 0 && (
                            <div className={`${styles.statItem} ${styles.warning}`}>
                                <span>未読</span>
                                <strong>{unreadCount}</strong>
                            </div>
                        )}
                    </div>

                    {/* 自分のステータス表示 */}
                    <div className={styles.myStatus}>
                        {myReaction ? (
                            <span className={styles.statusLabel}>
                                {myReaction.type === 'acknowledged' ? '✅ 了解済' : '🎉 完了済'}
                            </span>
                        ) : (
                            <span className={styles.statusLabelPending}>
                                ⚠️ 未確認
                                <span className={styles.newBadge}>NEW</span>
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </Card>
    );
}
