'use client';

import Link from 'next/link';
import { Post, User } from '@/types/post';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './PostCard.module.css';
import { useAuth } from '@/contexts/AuthContext';

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
        <Link href={`/posts/${post.id}`} className={`${styles.card} ${myReaction ? styles.read : styles.unread}`}>
            <div className={styles.header}>
                <div className={styles.meta}>
                    <img src={post.authorAvatar} alt={post.authorName} className={styles.avatar} />
                    <div className={styles.info}>
                        <span className={styles.author}>{post.authorName}</span>
                        <span className={styles.date}>{formatDate(post.createdAt)}</span>
                    </div>
                </div>
                <div className={styles.badges}>
                    <Badge type={post.type} />
                    {post.status !== 'open' && <Badge type={post.status} />}
                </div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{post.title}</h3>
                <p className={styles.preview}>{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</p>
            </div>

            <div className={styles.footer}>
                <div className={styles.stats}>
                    <span className={styles.statItem}>
                        ✅ {post.reactions.length} / {totalUsers}
                    </span>
                    {unreadCount > 0 && (
                        <span className={`${styles.statItem} ${styles.warning}`}>
                            ⏳ 未読 {unreadCount}
                        </span>
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
                            未確認
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
