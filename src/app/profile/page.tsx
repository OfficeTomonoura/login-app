'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './profile.module.css';

export default function ProfilePage() {
    const { user, updateProfile, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // フォームの状態
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });

    // ユーザーデータがロードされたらフォームにセット
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(formData);
            setMessage({ type: 'success', text: 'プロフィールを更新しました' });
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: '更新に失敗しました' });
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (value: string) => {
        setFormData(prev => ({ ...prev, name: value }));
    };

    const handleEmailChange = (value: string) => {
        setFormData(prev => ({ ...prev, email: value }));
    };

    const handleCancel = () => {
        setIsEditing(false);
        setMessage(null);
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
            });
        }
    };

    return (
        <AuthGuard>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>プロフィール設定</h1>
                </div>

                <div className={styles.card}>
                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
                            {message.text}
                        </div>
                    )}

                    <div className={styles.profileHeader}>
                        <div className={styles.avatarWrapper}>
                            <img
                                src={user?.avatarUrl}
                                alt={user?.name}
                                className={styles.avatar}
                            />
                        </div>
                        <div className={styles.roleTag}>
                            ユーザーID: {user?.id}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="名前"
                            type="text"
                            value={formData.name}
                            onChange={handleNameChange}
                            disabled={!isEditing}
                            required
                        />

                        <Input
                            label="メールアドレス"
                            type="email"
                            value={formData.email}
                            onChange={handleEmailChange}
                            disabled={!isEditing}
                            required
                        />

                        <div className={styles.actions}>
                            {isEditing ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleCancel}
                                        disabled={loading}
                                    >
                                        キャンセル
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={loading}
                                    >
                                        変更を保存
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsEditing(true)}
                                >
                                    プロフィールを編集
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                <div className={styles.logoutSection}>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={logout}
                        className={styles.logoutButton}
                    >
                        ログアウト
                    </Button>
                </div>
            </div>
        </AuthGuard>
    );
}
