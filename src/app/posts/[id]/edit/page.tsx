'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AuthGuard from '@/components/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { PostType } from '@/types/post';
import styles from '../../create/new-post.module.css';

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'report' as PostType,
    });

    // 既存データの読み込み
    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;

            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('id', postId)
                    .single();

                if (error) throw error;
                if (!data) {
                    alert('記事が見つかりません');
                    router.push('/apps/board');
                    return;
                }

                // 本人確認
                if (user && data.author_id !== user.id) {
                    alert('自分の投稿以外は編集できません');
                    router.push(`/posts/${postId}`);
                    return;
                }

                const postData = {
                    title: data.title,
                    content: data.content,
                    type: data.type,
                };
                setFormData(postData);
            } catch (err) {
                console.error('Error fetching post:', err);
                alert('データの読み込みに失敗しました');
                router.push('/apps/board');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId, user, router]);

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
        if (!user || !postId) return;
        setUpdating(true);

        try {
            // Supabase更新
            // reactionsを空配列にすることで確認状況をリセット
            const { error } = await supabase
                .from('posts')
                .update({
                    title: formData.title,
                    content: formData.content,
                    type: formData.type,
                    reactions: [], // 編集時はリセットする
                    updated_at: new Date().toISOString(),
                })
                .eq('id', postId);

            if (error) throw error;

            // 掲示板に戻る
            alert('投稿を更新しました。確認状況はリセットされました。');
            router.push(`/posts/${postId}`);
            router.refresh();
        } catch (error) {
            console.error('Error updating post:', error);
            alert('更新に失敗しました');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <AuthGuard>
                <div className={styles.container}>
                    <p style={{ textAlign: 'center', padding: 40 }}>読み込み中...</p>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className={styles.container}>
                <Link href={`/posts/${postId}`} className={styles.backButton} title="投稿に戻る">
                    ◀︎
                </Link>
                <div className={styles.card}>
                    <h1 className={styles.title}>投稿を編集</h1>

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
                            <Link href={`/posts/${postId}`}>
                                <Button type="button" variant="ghost">
                                    キャンセル
                                </Button>
                            </Link>
                            <Button type="submit" variant="primary" loading={updating}>
                                更新してリセット
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthGuard>
    );
}
