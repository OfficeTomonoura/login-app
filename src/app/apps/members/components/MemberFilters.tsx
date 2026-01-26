'use client';

import React from 'react';
import styles from './MemberFilters.module.css';
import { MemberFilterState } from '@/types/member';

type Props = {
    filters: MemberFilterState;
    onFilterChange: (newFilters: MemberFilterState) => void;
    committees: string[];
    roles: string[];
};

export default function MemberFilters({ filters, onFilterChange, committees, roles }: Props) {
    const handleChange = (field: keyof MemberFilterState, value: string) => {
        onFilterChange({
            ...filters,
            [field]: value
        });
    };

    const handleReset = () => {
        onFilterChange({
            searchQuery: '',
            committee: '',
            role: ''
        });
    };

    return (
        <div className={styles.filterContainer}>
            <div className={styles.searchGroup}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="名前、ふりがなで検索..."
                    value={filters.searchQuery}
                    onChange={(e) => handleChange('searchQuery', e.target.value)}
                />
            </div>

            <div className={styles.filterGroup}>
                <select
                    className={styles.select}
                    value={filters.committee}
                    onChange={(e) => handleChange('committee', e.target.value)}
                >
                    <option value="">全ての委員会</option>
                    {committees.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    className={styles.select}
                    value={filters.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                >
                    <option value="">全ての役職</option>
                    {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>

                {(filters.searchQuery || filters.committee || filters.role) && (
                    <button className={styles.resetBtn} onClick={handleReset}>
                        リセット
                    </button>
                )}
            </div>
        </div>
    );
}
