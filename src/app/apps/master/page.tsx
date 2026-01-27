'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CommitteeManager from '@/components/MasterManagement/CommitteeManager';
import RoleManager from '@/components/MasterManagement/RoleManager';
import CategoryManager from '@/components/MasterManagement/CategoryManager';
import styles from './master-page.module.css';

export default function MasterManagementPage() {
    const [activeTab, setActiveTab] = useState<'committee' | 'role' | 'category'>('committee');
    const [masterCommittees, setMasterCommittees] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMasterCommittees = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('master_committees')
            .select('name')
            .eq('year', 2026)
            .order('name');
        setMasterCommittees(data?.map(c => c.name) || []);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMasterCommittees();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <span>⚙️</span> マスターデータ管理
                </h1>
                <p className={styles.subtitle}>委員会、役職、カテゴリーなど、システム全体のマスターデータを管理します。</p>
            </div>

            <div className={styles.tabsWrapper}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'committee' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('committee')}
                    >
                        委員会・組織
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'role' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('role')}
                    >
                        役職
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'category' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('category')}
                    >
                        カテゴリー
                    </button>
                </div>
            </div>

            <div className={styles.contentCard}>
                {isLoading ? (
                    <div className={styles.loading}>読み込み中...</div>
                ) : (
                    <div className={styles.content}>
                        {activeTab === 'committee' && (
                            <CommitteeManager committees={masterCommittees} onUpdate={fetchMasterCommittees} />
                        )}
                        {activeTab === 'role' && (
                            <RoleManager onUpdate={fetchMasterCommittees} />
                        )}
                        {activeTab === 'category' && (
                            <CategoryManager onUpdate={fetchMasterCommittees} isInline={true} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
