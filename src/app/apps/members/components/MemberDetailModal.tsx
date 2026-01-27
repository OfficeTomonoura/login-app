'use client';

import React, { useState } from 'react';
import { Member } from '@/types/member';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Avatar from '@/components/ui/Avatar';
import JCBadge from '@/components/ui/JCBadge';
import styles from './MemberDetailModal.module.css';
import MemberEditModal from './MemberEditModal';

type Props = {
    member: Member;
    onClose: () => void;
    onMemberUpdated: () => void;
    committees: string[];
    roles: string[];
};

export default function MemberDetailModal({ member, onClose, onMemberUpdated, committees, roles }: Props) {
    const { user } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // 編集権限チェック
    const canEdit = !member.isProfileLinked || (user && member.profileId === user.id);

    // 表示名の構築
    const displayName = member.lastName && member.firstName
        ? `${member.lastName} ${member.firstName}`
        : member.name;

    const displayKana = member.lastNameKana && member.firstNameKana
        ? `${member.lastNameKana} ${member.firstNameKana}`
        : '';

    // 日付フォーマット
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleUpdate = () => {
        onMemberUpdated();
        setIsEditModalOpen(false);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <div className={styles.header}>
                    <div className={styles.mainInfo}>
                        <div className={styles.avatarSection}>
                            <Avatar
                                src={member.avatarUrl || ''}
                                alt={displayName}
                                size="xl"
                                fallback={displayName.charAt(0)}
                            />
                            {member.isProfileLinked && (
                                <div className={styles.badgeWrapper}>
                                    <JCBadge />
                                </div>
                            )}
                        </div>

                        <div className={styles.nameSection}>
                            <div className={styles.nameWrapper}>
                                {member.lastName ? (
                                    <ruby className={styles.rubyName}>
                                        <span className={styles.lastName}>{member.lastName}</span>
                                        <rt className={styles.furigana}>{member.lastNameKana}</rt>
                                    </ruby>
                                ) : (
                                    <span className={styles.lastName}>{member.name}</span>
                                )}
                                <span className={styles.nameSpacer} />
                                {member.firstName && (
                                    <ruby className={styles.rubyName}>
                                        <span className={styles.firstName}>{member.firstName}</span>
                                        <rt className={styles.furigana}>{member.firstNameKana}</rt>
                                    </ruby>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.committeeList}>
                        {member.committees && member.committees.length > 0 ? (
                            member.committees.map((c, i) => (
                                <div key={i} className={styles.committeeItem}>
                                    <span className={styles.committeeName}>{c.name}</span>
                                    <span className={styles.roleName}>{c.role}</span>
                                </div>
                            ))
                        ) : (
                            <span className={styles.noCommittee}>所属情報なし</span>
                        )}
                    </div>
                </div>

                <div className={styles.body}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>連絡先情報</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>メールアドレス</span>
                                <span className={styles.value}>{member.email || '-'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>電話番号</span>
                                <span className={styles.value}>{member.phone || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>勤務先・住所</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>会社名</span>
                                <span className={styles.value}>{member.companyName || '-'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>住所</span>
                                <span className={styles.value}>{member.address || '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>パーソナルデータ</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>生年月日</span>
                                <span className={styles.value}>{formatDate(member.birthDate)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 編集ボタン (最下部) */}
                    {canEdit && (
                        <div className={styles.footer}>
                            <button
                                className={styles.editBtn}
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                ✏️ 情報を編集
                            </button>
                        </div>
                    )}
                </div>

                {/* 編集モーダル */}
                {isEditModalOpen && (
                    <MemberEditModal
                        member={member}
                        onClose={() => setIsEditModalOpen(false)}
                        onMemberUpdated={handleUpdate}
                        committees={committees}
                        roles={roles}
                    />
                )}
            </div>
        </div>
    );
}
