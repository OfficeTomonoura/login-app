'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AuthGuard from '@/components/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Committee } from '@/types/post';
import Avatar from '@/components/ui/Avatar';
import ImageCropModal from '@/components/ImageCropModal';
import DatePicker from '@/components/ui/DatePicker';
import styles from './profile.module.css';

export default function ProfilePage() {
    const { user, updateProfile, uploadAvatar, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // フォームの状態
    const [formData, setFormData] = useState({
        lastName: '',
        firstName: '',
        lastNameKana: '',
        firstNameKana: '',
        email: '',
        phone: '',
        address: '',
        companyName: '',
        birthDate: '',
        avatarUrl: '',
        committees: [] as Committee[],
    });

    const [masterCommittees, setMasterCommittees] = useState<string[]>([]);
    const [masterRoles, setMasterRoles] = useState<string[]>([]);

    // ユーザーデータがロードされたらフォームにセット
    useEffect(() => {
        if (user) {
            setFormData({
                lastName: user.lastName || '',
                firstName: user.firstName || '',
                lastNameKana: user.lastNameKana || '',
                firstNameKana: user.firstNameKana || '',
                email: user.email,
                phone: user.phone || '',
                address: user.address || '',
                companyName: user.companyName || '',
                birthDate: user.birthDate || '',
                avatarUrl: user.avatarUrl || '',
                committees: user.committees || [],
            });
        }
    }, [user]);

    // マスターデータの取得
    useEffect(() => {
        const fetchMasterData = async () => {
            const { data: cData } = await supabase.from('master_committees').select('name').eq('year', 2026).order('name');
            const { data: rData } = await supabase.from('master_roles').select('name').order('display_order');
            setMasterCommittees(cData?.map(c => c.name) || []);
            setMasterRoles(rData?.map(r => r.name) || []);
        };
        fetchMasterData();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // ファイルをData URLに変換してクロップモーダルを表示
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setShowCropModal(true);
            };
        } catch (error) {
            console.error('Failed to load image:', error);
            setMessage({ type: 'error', text: '画像の読み込みに失敗しました' });
        }
    };

    const handleCropComplete = (croppedImage: string) => {
        setFormData(prev => ({ ...prev, avatarUrl: croppedImage }));
        setShowCropModal(false);
        setSelectedImage(null);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setSelectedImage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            let avatarUrl = formData.avatarUrl;

            // Upload image if it is base64
            if (avatarUrl && avatarUrl.startsWith('data:')) {
                const { publicUrl, error: uploadError } = await uploadAvatar(avatarUrl);
                if (uploadError) {
                    console.error('Failed to upload avatar', uploadError);
                    setMessage({ type: 'error', text: '画像のアップロードに失敗しました' });
                    setLoading(false);
                    return;
                }
                if (publicUrl) {
                    avatarUrl = publicUrl;
                }
            }

            await updateProfile({
                ...formData,
                avatarUrl,
                name: `${formData.lastName} ${formData.firstName}` // 後方互換性
            });
            setMessage({ type: 'success', text: 'プロフィールを更新しました' });
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: '更新に失敗しました' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCancel = () => {
        setIsEditing(false);
        setMessage(null);
        if (user) {
            setFormData({
                lastName: user.lastName || '',
                firstName: user.firstName || '',
                lastNameKana: user.lastNameKana || '',
                firstNameKana: user.firstNameKana || '',
                email: user.email,
                phone: user.phone || '',
                address: user.address || '',
                companyName: user.companyName || '',
                birthDate: user.birthDate || '',
                avatarUrl: user.avatarUrl || '',
                committees: user.committees || [],
            });
        }
    };

    const handleAddCommittee = () => {
        const newCommittee: Committee = {
            year: 2026,
            name: masterCommittees[0] || '',
            role: masterRoles[0] || '正会員'
        };
        setFormData(prev => ({
            ...prev,
            committees: [...prev.committees, newCommittee]
        }));
    };

    const handleRemoveCommittee = (index: number) => {
        setFormData(prev => ({
            ...prev,
            committees: prev.committees.filter((_, i) => i !== index)
        }));
    };

    const handleCommitteeChange = (index: number, field: keyof Committee, value: any) => {
        setFormData(prev => {
            const newCommittees = [...prev.committees];
            newCommittees[index] = { ...newCommittees[index], [field]: value };
            return { ...prev, committees: newCommittees };
        });
    };

    return (
        <AuthGuard>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>マイページ</h1>
                </div>

                <div className={styles.card}>
                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
                            {message.text}
                        </div>
                    )}

                    <div className={styles.profileHeader}>
                        <div className={styles.avatarWrapper}>
                            <Avatar
                                src={formData.avatarUrl || user?.avatarUrl}
                                alt={user?.name}
                                size="xl"
                                fallback={formData.lastName ? formData.lastName.charAt(0) : '?'}
                            />
                        </div>
                        {/* ユーザーID表示は削除 */}
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {isEditing && (
                            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    id="avatar-upload"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                >
                                    📷 プロフィール画像を変更
                                </Button>
                            </div>
                        )}

                        <div className={styles.sectionTitle}>基本情報</div>
                        <div className={styles.grid}>
                            <Input
                                label="姓"
                                value={formData.lastName}
                                onChange={(val) => handleChange('lastName', val)}
                                disabled={!isEditing}
                                required
                            />
                            <Input
                                label="名"
                                value={formData.firstName}
                                onChange={(val) => handleChange('firstName', val)}
                                disabled={!isEditing}
                                required
                            />
                        </div>
                        <div className={styles.grid}>
                            <Input
                                label="姓（ふりがな）"
                                value={formData.lastNameKana}
                                onChange={(val) => handleChange('lastNameKana', val)}
                                disabled={!isEditing}
                            />
                            <Input
                                label="名（ふりがな）"
                                value={formData.firstNameKana}
                                onChange={(val) => handleChange('firstNameKana', val)}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className={styles.sectionTitle}>連絡先・所属</div>
                        <Input
                            label="メールアドレス"
                            type="email"
                            value={formData.email}
                            onChange={(val) => handleChange('email', val)}
                            disabled={true} // メールアドレスは変更不可
                        />
                        <Input
                            label="電話番号"
                            value={formData.phone}
                            onChange={(val) => handleChange('phone', val)}
                            disabled={!isEditing}
                            placeholder="090-0000-0000"
                        />
                        <Input
                            label="住所"
                            value={formData.address}
                            onChange={(val) => handleChange('address', val)}
                            disabled={!isEditing}
                        />
                        <Input
                            label="会社名"
                            value={formData.companyName}
                            onChange={(val) => handleChange('companyName', val)}
                            disabled={!isEditing}
                        />
                        {isEditing ? (
                            <DatePicker
                                label="生年月日"
                                value={formData.birthDate}
                                onChange={(val) => handleChange('birthDate', val)}
                            />
                        ) : (
                            <Input
                                label="生年月日"
                                value={formData.birthDate}
                                onChange={() => { }} // Read-only
                                disabled={true}
                            />
                        )}

                        <div className={styles.sectionTitle}>所属委員会</div>
                        <div className={styles.committeeSection}>
                            {formData.committees.map((c, i) => (
                                <div key={i} className={styles.committeeEditRow}>
                                    <div className={styles.committeeGrid}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>年度</label>
                                            <input
                                                type="number"
                                                value={c.year}
                                                onChange={(e) => handleCommitteeChange(i, 'year', Number(e.target.value))}
                                                disabled={!isEditing}
                                                className={styles.nativeInput}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>委員会・役割</label>
                                            <select
                                                value={c.name}
                                                onChange={(e) => handleCommitteeChange(i, 'name', e.target.value)}
                                                disabled={!isEditing}
                                                className={styles.nativeSelect}
                                            >
                                                {masterCommittees.map(name => (
                                                    <option key={name} value={name}>{name}</option>
                                                ))}
                                                {!masterCommittees.includes(c.name) && (
                                                    <option value={c.name}>{c.name}</option>
                                                )}
                                            </select>
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>役職</label>
                                            <select
                                                value={c.role}
                                                onChange={(e) => handleCommitteeChange(i, 'role', e.target.value)}
                                                disabled={!isEditing}
                                                className={styles.nativeSelect}
                                            >
                                                {masterRoles.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                                {!masterRoles.includes(c.role) && (
                                                    <option value={c.role}>{c.role}</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            className={styles.removeBtn}
                                            onClick={() => handleRemoveCommittee(i)}
                                            title="削除"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}

                            {isEditing && (
                                <button
                                    type="button"
                                    className={styles.addCommitteeBtn}
                                    onClick={handleAddCommittee}
                                >
                                    <span>＋</span> 所属委員会・組織を追加
                                </button>
                            )}

                            {!isEditing && formData.committees.length === 0 && (
                                <p className={styles.noDataText}>所属情報がありません</p>
                            )}
                        </div>

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
                                        保存する
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

                {/* 画像クロップモーダル */}
                {showCropModal && selectedImage && (
                    <ImageCropModal
                        imageSrc={selectedImage}
                        onComplete={handleCropComplete}
                        onCancel={handleCropCancel}
                    />
                )}
            </div>
        </AuthGuard>
    );
}
