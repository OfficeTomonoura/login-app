'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { PostType } from '@/types/post';
import styles from './new-post.module.css';

export default function NewPostPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'report' as PostType,
    });

    const handleTitleChange = (value: string) => {
        setFormData(prev => ({ ...prev, title: value }));
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, content: e.target.value }));
    };

    const handleTypeChange = (type: PostType) => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // API遅延シミュレーション
            await new Promise(resolve => setTimeout(resolve, 800));

            // Supabaseへ保存
            const { error } = await supabase
                .from('posts')
                .insert([
                    {
                        title: formData.title,
                        content: formData.content,
                        type: formData.type,
                        status: 'open',
                        author_id: user.id,
                        author_name: user.name,
                        author_avatar: user.avatarUrl,
                        reactions: [],
                        // created_at はDB側で自動生成されるので省略可
                    }
                ]);

            if (error) throw error;

            // LINE通知送信（非同期で実行し、失敗しても投稿はブロックしない）
            fetch('/api/send-line', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    type: formData.type,
                    authorName: user.name,
                }),
            }).catch(err => console.error('Notification failed:', err));

            // 掲示板に戻る
            router.push('/apps/board');
            router.refresh(); // データ更新を反映させるために必要
        } catch (error) {
            console.error('Error creating post:', error);
            alert('投稿に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            <div className={styles.container}>
                <Link href="/dashboard" className={styles.backLink}>
                    ← ダッシュボードに戻る
                </Link>

                <div className={styles.card}>
                    <h1 className={styles.title}>新規投稿</h1>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* 記事タイプ選択 */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>投稿タイプ</label>
                            <div className={styles.radioGroup}>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="report"
                                        checked={formData.type === 'report'}
                                        onChange={() => handleTypeChange('report')}
                                        className={styles.radioInput}
                                    />
                                    📘 報告 (Report)
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="request"
                                        checked={formData.type === 'request'}
                                        onChange={() => handleTypeChange('request')}
                                        className={styles.radioInput}
                                    />
                                    📕 依頼 (Request)
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="notice"
                                        checked={formData.type === 'notice'}
                                        onChange={() => handleTypeChange('notice')}
                                        className={styles.radioInput}
                                    />
                                    📢 お知らせ (Notice)
                                </label>
                            </div>
                        </div>

                        {/* タイトル */}
                        <Input
                            label="タイトル"
                            value={formData.title}
                            onChange={handleTitleChange}
                            placeholder="例: 〇〇プロジェクトの進捗報告"
                            required
                        />

                        {/* 本文 */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>本文</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleContentChange}
                                placeholder="詳細な内容を入力してください..."
                                className={styles.textarea}
                                required
                            />
                        </div>
                        <div className={styles.actions}>
                            <Link href="/dashboard">
                                <Button variant="ghost" type="button">キャンセル</Button>
                            </Link>
                            <Button type="submit" variant="primary" loading={loading}>
                                投稿する
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthGuard>
    );
}
