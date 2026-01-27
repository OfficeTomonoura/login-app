'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AuthGuard from '@/components/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { PostType } from '@/types/post';
import styles from './new-post.module.css';

// メンバー選択用
interface DBMember {
    id: string;
    name: string;
}

export default function NewPostPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'report' as PostType,
        targetUsers: [] as string[],
        targetCommittees: [] as string[],
    });

    const [masterCommittees, setMasterCommittees] = useState<string[]>([]);
    const [members, setMembers] = useState<DBMember[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            // 1. 委員会取得
            const { data: committeesData } = await supabase
                .from('master_committees')
                .select('name')
                .eq('year', 2026)
                .order('name');

            if (committeesData) {
                const names = Array.from(new Set(committeesData.map(c => c.name)));
                setMasterCommittees(names);
            }

            // 2. メンバー取得
            const { data: membersData } = await supabase
                .from('jc_members')
                .select('id, name')
                .eq('is_profile_linked', true)
                .order('name');

            if (membersData) {
                setMembers(membersData);
            }
        };

        fetchMasterData();
    }, []);

    const handleTitleChange = (value: string) => {
        setFormData(prev => ({ ...prev, title: value }));
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, content: e.target.value }));
    };

    const handleTypeChange = (type: PostType) => {
        setFormData(prev => ({ ...prev, type }));
    };

    const toggleTargetUser = (userId: string) => {
        setFormData(prev => {
            const current = prev.targetUsers;
            const updated = current.includes(userId)
                ? current.filter(id => id !== userId)
                : [...current, userId];
            return { ...prev, targetUsers: updated };
        });
    };

    const toggleTargetCommittee = (name: string) => {
        setFormData(prev => {
            const current = prev.targetCommittees;
            const updated = current.includes(name)
                ? current.filter(n => n !== name)
                : [...current, name];
            return { ...prev, targetCommittees: updated };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // API遅延シミュレーション
            await new Promise(resolve => setTimeout(resolve, 800));

            // Supabaseへ保存
            const { data: insertedData, error } = await supabase
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
                        favorites: [],
                        target_users: formData.targetUsers,
                        target_committees: formData.targetCommittees,
                    }
                ])
                .select('id')
                .single();

            if (error) throw error;

            // LINE通知送信
            const lineRes = await fetch('/api/send-line', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: insertedData?.id,
                    title: formData.title,
                    content: formData.content,
                    type: formData.type,
                    authorName: user.name,
                    targetUsers: formData.targetUsers,
                    targetCommittees: formData.targetCommittees,
                }),
            });

            if (!lineRes.ok) {
                const errData = await lineRes.json();
                console.error('LINE notification failed:', errData);
            }

            router.push('/apps/board');
            router.refresh();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('投稿に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            {user && (
                <div className={styles.container}>
                    <Link href="/apps/board" className={styles.backButton} title="戻る">
                        ◀︎
                    </Link>
                    <h1 className={styles.title}>新規投稿を作成</h1>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* 1. 投稿タイプセクション */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🏷️</span>
                                <h2 className={styles.sectionTitle}>投稿タイプ</h2>
                            </div>
                            <div className={styles.radioGroup}>
                                {(['report', 'request', 'notice'] as PostType[]).map((t) => (
                                    <label key={t} className={styles.radioLabel}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value={t}
                                            checked={formData.type === t}
                                            onChange={() => handleTypeChange(t)}
                                            className={styles.radioInput}
                                        />
                                        {t === 'report' ? '📘 報告' : t === 'request' ? '📕 依頼' : '📢 お知らせ'}
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* 2. 宛先指定セクション */}
                        <section className={`${styles.section} ${styles.underAdjustment}`}>
                            <div className={styles.adjustmentOverlay}>
                                <div className={styles.adjustmentContent}>
                                    <div className={styles.adjustmentBadge}>現在 機能調整中</div>
                                    <span className={styles.adjustmentSubText}>今後のアップデートをお待ちください</span>
                                </div>
                            </div>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>🎯</span>
                                <h2 className={styles.sectionTitle}>宛先指定（任意）</h2>
                            </div>
                            <p className={styles.sectionDescription}>
                                メンバーや委員会を限定して投稿できます。未指定の場合は全員に公開されます。
                            </p>

                            <div className={styles.destinationGrid}>
                                <div className={styles.destinationSubSection}>
                                    <h3 className={styles.destinationSubTitle}>👥 委員会を指定</h3>
                                    <div className={styles.multiSelect}>
                                        {masterCommittees.map(name => (
                                            <label key={name} className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetCommittees.includes(name)}
                                                    onChange={() => toggleTargetCommittee(name)}
                                                    className={styles.checkboxInput}
                                                />
                                                {name}
                                            </label>
                                        ))}
                                        {masterCommittees.length === 0 && (
                                            <p className={styles.loadingText}>委員会データを読み込み中...</p>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.destinationSubSection}>
                                    <h3 className={styles.destinationSubTitle}>👤 ユーザーを指定</h3>
                                    <div className={styles.multiSelect}>
                                        {members.length > 0 ? (
                                            members.map(u => (
                                                <label key={u.id} className={styles.checkboxLabel}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.targetUsers.includes(u.id)}
                                                        onChange={() => toggleTargetUser(u.id)}
                                                        className={styles.checkboxInput}
                                                    />
                                                    {u.name}
                                                </label>
                                            ))
                                        ) : (
                                            <p className={styles.loadingText}>メンバーデータを読み込み中...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. 内容セクション */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>📝</span>
                                <h2 className={styles.sectionTitle}>投稿内容</h2>
                            </div>
                            <div className={styles.grid}>
                                <Input
                                    label="タイトル"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    placeholder="例: 〇〇プロジェクトの進捗報告"
                                    required
                                />

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
                            </div>
                        </section>

                        {/* LINE Preview Section */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>📱</span>
                                <h2 className={styles.sectionTitle}>LINE通知プレビュー</h2>
                            </div>
                            <div className={styles.previewSection}>
                                <div className={styles.previewTitle}>
                                    <span>●</span> LINE通知イメージ
                                </div>

                                {(() => {
                                    const typeColors: Record<string, string> = {
                                        report: '#3498db',
                                        request: '#e74c3c',
                                        notice: '#f39c12'
                                    };
                                    const typeLabel = formData.type === 'report' ? '報告' : formData.type === 'request' ? '依頼' : 'お知らせ';
                                    const color = typeColors[formData.type] || '#2ecc71';

                                    return (
                                        <div className={styles.lineBubble}>
                                            <div className={styles.lineHeader} style={{ backgroundColor: color }}>
                                                新着: {typeLabel}
                                            </div>
                                            <div className={styles.lineBody}>
                                                <div className={styles.linePostTitle}>{formData.title || 'タイトル未入力'}</div>
                                                <div className={styles.lineMeta}>
                                                    <div className={styles.lineMetaLabel}>投稿者</div>
                                                    <div className={styles.lineMetaValue}>{user.name}</div>
                                                </div>
                                                <div className={styles.lineContent}>
                                                    {formData.content ? (
                                                        formData.content.substring(0, 100) + (formData.content.length > 100 ? '...' : '')
                                                    ) : (
                                                        '本文がここに入ります。'
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.lineFooter}>
                                                <div className={styles.lineButton} style={{ backgroundColor: color }}>
                                                    詳細を確認する
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>

                        <div className={styles.actions}>
                            <Link href="/apps/board" className={styles.cancelButton}>
                                キャンセル
                            </Link>
                            <Button type="submit" variant="primary" loading={loading}>
                                投稿を公開する
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </AuthGuard>
    );
}
