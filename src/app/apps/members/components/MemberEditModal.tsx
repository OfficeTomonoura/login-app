'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types/member';
import styles from './MemberCreateModal.module.css'; // スタイルは共通利用
import DatePicker from '@/components/ui/DatePicker';

type Props = {
    member: Member;
    onClose: () => void;
    onMemberUpdated: () => void;
    committees: string[];
    roles: string[];
};

export default function MemberEditModal({ member, onClose, onMemberUpdated, committees, roles }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        lastName: member.lastName || '',
        firstName: member.firstName || '',
        lastNameKana: member.lastNameKana || '',
        firstNameKana: member.firstNameKana || '',
        email: member.email || '',
        phone: member.phone || '',
        address: member.address || '',
        companyName: member.companyName || '',
        birthDate: member.birthDate || '',
        committee: '',
        role: ''
    });

    // 初期値としてメンバーの最初の委員会情報をセット
    useEffect(() => {
        if (member.committees && member.committees.length > 0) {
            setFormData(prev => ({
                ...prev,
                committee: member.committees[0].name,
                role: member.committees[0].role
            }));
        }
    }, [member]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const committeeData = formData.committee ? [{
                name: formData.committee,
                role: formData.role || '委員',
                year: 2026
            }] : [];

            // Supabaseのupdate処理
            const { error } = await supabase
                .from('jc_members')
                .update({
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
                    committees: committeeData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', member.id); // IDで対象を指定

            if (error) throw error;

            alert('メンバー情報を更新しました');
            onMemberUpdated();
            onClose();

        } catch (error: any) {
            console.error('Error updating member:', error);
            // 本人以外の連携済みメンバーを編集しようとした場合のエラーハンドリング
            if (member.isProfileLinked && error.code === '42501') {
                alert('このメンバーはログインアカウントと連携されているため、本人以外は編集できません。');
            } else {
                alert('更新に失敗しました。');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>メンバー情報編集</h2>
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
                        <div className={styles.formRow}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>委員会</label>
                                <select
                                    name="committee"
                                    className={styles.select}
                                    value={formData.committee}
                                    onChange={handleChange}
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
                                    name="role"
                                    className={styles.select}
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="">役職なし</option>
                                    {roles.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
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
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            キャンセル
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? '更新する' : '更新する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
