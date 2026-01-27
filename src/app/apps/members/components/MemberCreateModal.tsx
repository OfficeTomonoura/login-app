'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './MemberCreateModal.module.css';
import DatePicker from '@/components/ui/DatePicker';

type Props = {
    onClose: () => void;
    onMemberCreated: () => void;
    committees: string[];
    roles: string[];
};

export default function MemberCreateModal({ onClose, onMemberCreated, committees, roles }: Props) {
    const [isLoading, setIsLoading] = useState(false);
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
    });

    const [memberCommittees, setMemberCommittees] = useState<{ name: string; role: string; year: number }[]>([
        { name: '', role: '', year: 2026 }
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            birthDate: value
        }));
    };

    const addCommitteeField = () => {
        setMemberCommittees([...memberCommittees, { name: '', role: '', year: 2026 }]);
    };

    const removeCommitteeField = (index: number) => {
        if (memberCommittees.length > 1) {
            setMemberCommittees(memberCommittees.filter((_, i) => i !== index));
        } else {
            setMemberCommittees([{ name: '', role: '', year: 2026 }]);
        }
    };

    const handleCommitteeChange = (index: number, field: 'name' | 'role', value: string) => {
        const updated = [...memberCommittees];
        updated[index][field] = value;
        setMemberCommittees(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const filteredCommittees = memberCommittees.filter(c => c.name !== '');

            const { error } = await supabase
                .from('jc_members')
                .insert({
                    name: `${formData.lastName} ${formData.firstName}`,
                    last_name: formData.lastName,
                    first_name: formData.firstName,
                    last_name_kana: formData.lastNameKana,
                    first_name_kana: formData.firstNameKana,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    company_name: formData.companyName || null,
                    birth_date: formData.birthDate || null,
                    committees: filteredCommittees,
                    is_profile_linked: false
                });

            if (error) throw error;

            alert('メンバーを登録しました');
            onMemberCreated();
            onClose();

        } catch (error) {
            console.error('Error creating member:', error);
            alert('登録に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>新規メンバー登録</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>

                    <div>
                        <h3 className={styles.sectionTitle}>基本情報</h3>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>姓 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="lastName"
                                    className={styles.input}
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="山田"
                                />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>名 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className={styles.input}
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="太郎"
                                />
                            </div>
                        </div>
                        <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>せい (かな)</label>
                                <input
                                    type="text"
                                    name="lastNameKana"
                                    className={styles.input}
                                    value={formData.lastNameKana}
                                    onChange={handleChange}
                                    placeholder="やまだ"
                                />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>めい (かな)</label>
                                <input
                                    type="text"
                                    name="firstNameKana"
                                    className={styles.input}
                                    value={formData.firstNameKana}
                                    onChange={handleChange}
                                    placeholder="たろう"
                                />
                            </div>
                        </div>
                        <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                            <label className={styles.label}>生年月日</label>
                            <DatePicker
                                value={formData.birthDate}
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className={styles.sectionTitle}>所属情報</h3>
                        {memberCommittees.map((mc, index) => (
                            <div key={index} className={styles.committeeRow}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>委員会</label>
                                        <select
                                            className={styles.select}
                                            value={mc.name}
                                            onChange={(e) => handleCommitteeChange(index, 'name', e.target.value)}
                                        >
                                            <option value="">選択してください</option>
                                            {committees.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>役職</label>
                                        <select
                                            className={styles.select}
                                            value={mc.role}
                                            onChange={(e) => handleCommitteeChange(index, 'role', e.target.value)}
                                        >
                                            <option value="">役職なし</option>
                                            {roles.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {memberCommittees.length > 1 && (
                                        <div className={styles.removeAction}>
                                            <button
                                                type="button"
                                                className={styles.removeBtnSmall}
                                                onClick={() => removeCommitteeField(index)}
                                                title="削除"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className={styles.addStepAction}>
                            <button
                                type="button"
                                onClick={addCommitteeField}
                                className={styles.addBtnSmall}
                            >
                                ＋ 委員会情報を追加
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className={styles.sectionTitle}>連絡先・勤務先</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>会社名</label>
                            <input
                                type="text"
                                name="companyName"
                                className={styles.input}
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="株式会社○○"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>住所</label>
                            <input
                                type="text"
                                name="address"
                                className={styles.input}
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="例: 京都市..."
                            />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>メールアドレス</label>
                                <input
                                    type="email"
                                    name="email"
                                    className={styles.input}
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>電話番号</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className={styles.input}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="090-0000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            キャンセル
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? '登録中...' : '登録する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
