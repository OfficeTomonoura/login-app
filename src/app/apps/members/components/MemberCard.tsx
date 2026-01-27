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
    // 最初の委員会情報を取得
    const currentCommittee = member.committees && member.committees.length > 0
        ? member.committees[0]
        : null;

    return (
        <div className={styles.card} onClick={() => onClick && onClick(member)}>
            <div className={styles.mainContainer}>
                <div className={styles.avatarSection}>
                    <Avatar
                        src={member.avatarUrl || ''}
                        alt={member.name}
                        size="lg"
                        fallback={member.lastName ? member.lastName.charAt(0) : member.name.charAt(0)}
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

            <div className={styles.committeeRow}>
                {currentCommittee ? (
                    <div className={styles.committeeInfo}>
                        <span className={styles.committeeName}>{currentCommittee.name}</span>
                        <span className={styles.roleName}>{currentCommittee.role}</span>
                    </div>
                ) : (
                    <div className={styles.noCommittee}>所属情報なし</div>
                )}
            </div>
        </div>
    );
}
