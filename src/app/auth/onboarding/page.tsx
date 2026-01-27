'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AppUser } from '@/contexts/SupabaseAuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import ImageCropModal from '@/components/ImageCropModal';
import { supabase } from '@/lib/supabase'; // Add supabase import
import DatePicker from '@/components/ui/DatePicker';
import { Committee } from '@/types/post';
import styles from './onboarding.module.css';

type MasterCommittee = {
    id: string;
    year: number;
    name: string;
    category: string;
};

type MasterRole = {
    id: string;
    name: string;
    display_order: number;
};

export default function OnboardingPage() {
    const { user, updateProfile, updatePassword, uploadAvatar, isLoading } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        lastName: '',
        firstName: '',
        lastNameKana: '',
        firstNameKana: '',
        phone1: '',
        phone2: '',
        phone3: '',
        address: '',
        companyName: '',
        birthDate: '',
        avatarUrl: '',
    });
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Password state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Master data state
    const [masterCommittees, setMasterCommittees] = useState<MasterCommittee[]>([]);
    const [masterRoles, setMasterRoles] = useState<MasterRole[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            const { data: committeesData } = await supabase
                .from('master_committees')
                .select('*')
                .eq('year', 2026) // Assuming current year or logic
                .order('name');

            if (committeesData) {
                setMasterCommittees(committeesData);
            }

            const { data: rolesData } = await supabase
                .from('master_roles')
                .select('*')
                .order('display_order');

            if (rolesData) {
                setMasterRoles(rolesData);
            }
        };

        fetchMasterData();
    }, []);

    // ユーザー情報が読み込まれたらフォームに初期値をセット
    const [prevUser, setPrevUser] = useState(user);
    if (user !== prevUser) {
        setPrevUser(user);
        if (user) {
            setFormData(prev => ({
                ...prev,
                lastName: user.lastName || '',
                firstName: user.firstName || '',
                lastNameKana: user.lastNameKana || '',
                firstNameKana: user.firstNameKana || '',
                // phone splitting
                phone1: user.phone ? user.phone.split('-')[0] : '',
                phone2: user.phone ? user.phone.split('-')[1] : '',
                phone3: user.phone ? user.phone.split('-')[2] : '',
                companyName: user.companyName || '',
                avatarUrl: user.avatarUrl || '',
            }));
            if (user.committees && user.committees.length > 0) {
                setCommittees(user.committees);
            }
        }
    }

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/auth/login');
            } else if (!user.isFirstLogin) {
                router.push('/dashboard');
            }
        }
    }, [user, isLoading, router]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleKanaChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // ひらがなチェック
        if (value && !/^[ぁ-んー]*$/.test(value)) {
            setErrors(prev => ({ ...prev, [field]: 'ひらがなで入力してください' }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handlePhoneChange = (field: string, value: string) => {
        // 全角数字を半角に変換
        const normalized = value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        // 数字のみ許可
        if (/^\d*$/.test(normalized)) {
            setFormData(prev => ({ ...prev, [field]: normalized }));
        }
    };

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
            alert('画像の読み込みに失敗しました。別の画像を選択してください。');
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

        try {
            // 入力エラーチェック
            if (Object.keys(errors).length > 0) {
                alert('入力内容に誤りがあります。確認してください。');
                setLoading(false);
                return;
            }

            // パスワード変更処理
            if (password) {
                if (password !== confirmPassword) {
                    alert('パスワードが一致しません');
                    setLoading(false);
                    return;
                }
                if (password.length < 6) {
                    alert('パスワードは6文字以上で設定してください');
                    setLoading(false);
                    return;
                }

                console.log('Calling updatePassword...');
                const { error: pwdError } = await updatePassword(password);
                console.log('updatePassword returned:', pwdError);

                if (pwdError) {
                    console.error('Failed to update password', pwdError);
                    let msg = 'パスワードの更新に失敗しました。';
                    if (pwdError.message?.includes('New password should be different from the old password')) {
                        msg = '新しいパスワードは現在のパスワードと異なる必要があります。\n変更しない場合は、入力欄を空にしてください。';
                    } else if (pwdError.message?.includes('Password should be at least')) {
                        msg = 'パスワードは6文字以上で設定してください。';
                    } else if (pwdError.message) {
                        msg += `\n(${pwdError.message})`;
                    }
                    alert(msg);
                    setLoading(false);
                    return;
                }
                console.log('Password updated successfully');
            }

            const fullName = `${formData.lastName} ${formData.firstName}`;
            const fullPhone = `${formData.phone1}-${formData.phone2}-${formData.phone3}`;

            let avatarUrl = formData.avatarUrl;

            // Upload image if it is base64
            if (avatarUrl && avatarUrl.startsWith('data:')) {
                const { publicUrl, error: uploadError } = await uploadAvatar(avatarUrl);
                if (uploadError) {
                    console.error('Failed to upload avatar', uploadError);
                    // Continue even if image upload fails? Or stop?
                    // Let's alert but continue with old logic (or empty) if critical?
                    // For now, alert and return to be safe.
                    alert('画像のアップロードに失敗しました。');
                    setLoading(false);
                    return;
                }
                if (publicUrl) {
                    avatarUrl = publicUrl;
                }
            }

            await updateProfile({
                name: fullName, // 後方互換性用
                lastName: formData.lastName,
                firstName: formData.firstName,
                lastNameKana: formData.lastNameKana,
                firstNameKana: formData.firstNameKana,
                phone: fullPhone,
                address: formData.address,
                companyName: formData.companyName,
                birthDate: formData.birthDate,
                avatarUrl: avatarUrl,
                committees: committees,
                isFirstLogin: false, // 初回ログインフラグを下ろす
            });
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('プロフィールの更新に失敗しました。時間をおいて再度お試しください。');
            setLoading(false);
        }
    };

    // 委員会を追加
    const addCommittee = () => {
        setCommittees([...committees, { name: '', role: '' }]);
    };

    // 委員会を削除
    const removeCommittee = (index: number) => {
        setCommittees(committees.filter((_, i) => i !== index));
    };

    // 委員会情報を更新
    const updateCommittee = (index: number, field: 'name' | 'role', value: string) => {
        const updated = [...committees];
        updated[index][field] = value;

        if (field === 'name') {
            const selectedMaster = masterCommittees.find(mc => mc.name === value);
            if (selectedMaster) {
                updated[index].year = selectedMaster.year;
            }
        }
        setCommittees(updated);
    };

    if (isLoading || !user) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>ようこそ、{user.name}さん</h1>
                    <p className={styles.subtitle}>
                        初回ログインありがとうございます。<br />
                        プロフィール情報を入力して設定を完了させてください。
                    </p>
                </div>

                <Card className={styles.card}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Avatar Preview */}
                        <div className={styles.avatarSection}>
                            <Avatar
                                src={formData.avatarUrl}
                                alt="Profile Preview"
                                size="xl"
                                fallback={(formData.lastName || '').charAt(0)}
                            />
                            <div className={styles.avatarInputWrapper}>
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
                                    className={styles.fileSelectBtn}
                                >
                                    選択
                                </Button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="姓"
                                value={formData.lastName}
                                onChange={(val) => handleChange('lastName', val)}
                                required
                            />
                            <Input
                                label="名"
                                value={formData.firstName}
                                onChange={(val) => handleChange('firstName', val)}
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <Input
                                    label="姓（ふりがな）"
                                    value={formData.lastNameKana}
                                    onChange={(val) => handleKanaChange('lastNameKana', val)}
                                    required
                                />
                                {errors.lastNameKana && <p className={styles.errorText}>{errors.lastNameKana}</p>}
                            </div>
                            <div>
                                <Input
                                    label="名（ふりがな）"
                                    value={formData.firstNameKana}
                                    onChange={(val) => handleKanaChange('firstNameKana', val)}
                                    required
                                />
                                {errors.firstNameKana && <p className={styles.errorText}>{errors.firstNameKana}</p>}
                            </div>
                        </div>

                        <DatePicker
                            label="生年月日"
                            value={formData.birthDate}
                            onChange={(val) => handleChange('birthDate', val)}
                            required
                        />

                        <div className={styles.phoneSection}>
                            <label className={styles.label}>電話番号</label>
                            <div className={styles.phoneInputs}>
                                <input
                                    type="text"
                                    value={formData.phone1}
                                    onChange={(e) => handlePhoneChange('phone1', e.target.value)}
                                    className={styles.input}
                                    style={{ textAlign: 'center' }}
                                    maxLength={4}
                                    required
                                />
                                <span style={{ color: 'white', alignSelf: 'center' }}>-</span>
                                <input
                                    type="text"
                                    value={formData.phone2}
                                    onChange={(e) => handlePhoneChange('phone2', e.target.value)}
                                    className={styles.input}
                                    style={{ textAlign: 'center' }}
                                    maxLength={4}
                                    required
                                />
                                <span style={{ color: 'white', alignSelf: 'center' }}>-</span>
                                <input
                                    type="text"
                                    value={formData.phone3}
                                    onChange={(e) => handlePhoneChange('phone3', e.target.value)}
                                    className={styles.input}
                                    style={{ textAlign: 'center' }}
                                    maxLength={4}
                                    required
                                />
                            </div>
                        </div>

                        <Input
                            label="住所"
                            value={formData.address}
                            onChange={(val) => handleChange('address', val)}
                            placeholder="広島県福山市..."
                            required
                        />

                        <Input
                            label="会社名"
                            value={formData.companyName}
                            onChange={(val) => handleChange('companyName', val)}
                            placeholder="株式会社..."
                        />



                        {/* 委員会登録セクション */}
                        <div className={styles.committeeSection}>
                            <div className={styles.committeeSectionHeader}>
                                <label className={styles.label}>所属委員会</label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={addCommittee}
                                    className={styles.addCommitteeBtn}
                                >
                                    ➕ 委員会を追加
                                </Button>
                            </div>

                            {committees.length === 0 && (
                                <p className={styles.hint}>※委員会を追加してください(任意)</p>
                            )}

                            {committees.map((committee, index) => (
                                <div key={index} className={styles.committeeCard}>
                                    <div className={styles.committeeInputs}>
                                        <div className={styles.inputWrapper}>
                                            <label className={styles.smallLabel}>委員会名</label>
                                            <select
                                                value={committee.name}
                                                onChange={(e) => updateCommittee(index, 'name', e.target.value)}
                                                className={styles.select}
                                                required
                                            >
                                                <option value="">選択してください</option>
                                                {masterCommittees.map(mc => (
                                                    <option key={mc.id} value={mc.name}>{mc.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className={styles.inputWrapper}>
                                            <label className={styles.smallLabel}>役職</label>
                                            <select
                                                value={committee.role}
                                                onChange={(e) => updateCommittee(index, 'role', e.target.value)}
                                                className={styles.select}
                                                required
                                            >
                                                <option value="">選択してください</option>
                                                {masterRoles.map(mr => (
                                                    <option key={mr.id} value={mr.name}>{mr.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => removeCommittee(index)}
                                        className={styles.removeBtn}
                                    >
                                        🗑️ 削除
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Password Reset Section */}
                        <div className={styles.sectionHeader} style={{ opacity: 0.6 }}>
                            <h2 className={styles.sectionTitle}>パスワード設定 (調整中)</h2>
                            <p style={{ fontSize: '0.875rem', color: '#aaa', marginTop: '0.25rem' }}>
                                ※現在この機能はメンテナンス中です。変更可能になりましたら連絡します。
                            </p>
                        </div>
                        <div style={{ opacity: 0.6, pointerEvents: 'none' }}>
                            <Input
                                label="新しいパスワード"
                                type="password"
                                value={password}
                                onChange={setPassword}
                                placeholder="現在は変更できません"
                                disabled={true}
                            />
                            <Input
                                label="パスワード確認"
                                type="password"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                placeholder="現在は変更できません"
                                disabled={true}
                            />
                        </div>

                        <Button type="submit" loading={loading} className={styles.submitBtn}>
                            設定を完了して始める
                        </Button>
                    </form>
                </Card>
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
    );
}
