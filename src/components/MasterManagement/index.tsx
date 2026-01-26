'use client';

import { useState } from 'react';
import CommitteeManager from './CommitteeManager';
import RoleManager from './RoleManager';
import styles from './master.module.css';

interface Props {
    onClose: () => void;
    onUpdate: () => void;
    committees: string[];
}

export default function MasterManagementModal({ onClose, onUpdate, committees }: Props) {
    const [activeTab, setActiveTab] = useState<'committee' | 'role'>('committee');

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <span>⚙️</span> マスターデータ管理
                    </h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        ✕ 閉じる
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'committee' ? styles.activeTab : styles.inactiveTab}`}
                        onClick={() => setActiveTab('committee')}
                    >
                        委員会・組織の管理
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'role' ? styles.activeTab : styles.inactiveTab}`}
                        onClick={() => setActiveTab('role')}
                    >
                        役職の管理
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'committee' ? (
                        <CommitteeManager committees={committees} onUpdate={onUpdate} />
                    ) : (
                        <RoleManager onUpdate={onUpdate} />
                    )}
                </div>
            </div>
        </div>
    );
}
