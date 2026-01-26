import React from 'react';
import { Member } from '@/types/member';
import Avatar from '@/components/ui/Avatar';
import JCBadge from '@/components/ui/JCBadge';
import styles from './MemberCard.module.css';

type Props = {
    member: Member;
    onClick?: (member: Member) => void;
};

export default function MemberCard({ member, onClick }: Props) {
    // 現在年度の委員会情報を取得（なければ最新のもの）
    const currentCommittee = member.committees && member.committees.length > 0
        ? member.committees[0] // 実際には年度でソートなどを考慮すべきだが、まずは配列の先頭を使用
        : null;

    // 表示名の構築
    const displayName = member.lastName && member.firstName
        ? `${member.lastName} ${member.firstName}`
        : member.name;

    const displayKana = member.lastNameKana && member.firstNameKana
        ? `${member.lastNameKana} ${member.firstNameKana}`
        : '';

    return (
        <div className={styles.card} onClick={() => onClick && onClick(member)}>
            <div className={styles.avatarSection}>
                <Avatar
                    src={member.avatarUrl || ''}
                    alt={displayName}
                    size="lg"
                    fallback={displayName.charAt(0)}
                />
                {member.isProfileLinked && (
                    <div className={styles.badgeWrapper}>
                        <JCBadge />
                    </div>
                )}
            </div>

            <div className={styles.nameSection}>
                <h3 className={styles.name}>{displayName}</h3>
                {displayKana && <p className={styles.kana}>{displayKana}</p>}
            </div>

            {currentCommittee && (
                <>
                    {currentCommittee.role && (
                        <div className={styles.roleBadge}>
                            {currentCommittee.role}
                        </div>
                    )}
                    <div className={styles.committee}>
                        {currentCommittee.name}
                    </div>
                </>
            )}

            {member.companyName && (
                <div className={styles.company}>
                    <span>🏢</span>
                    <span>{member.companyName}</span>
                </div>
            )}
        </div>
    );
}
