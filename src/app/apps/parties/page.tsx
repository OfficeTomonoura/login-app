'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Party, PartyStatus, TabType } from '@/types/party';
import { getParties } from '@/lib/parties-db';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import styles from './parties.module.css';

export default function PartyListPage() {
    const [activeTab, setActiveTab] = useState<TabType>('visited');
    const [parties, setParties] = useState<Party[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

    // Committee Filter State (using IDs)
    const [selectedCommitteeIds, setSelectedCommitteeIds] = useState<string[]>([]);
    const [availableCommittees, setAvailableCommittees] = useState<{ id: string; name: string }[]>([]);

    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [counts, setCounts] = useState({ visited: 0, planned: 0, my_posts: 0 });

    useEffect(() => {
        const fetchAllCounts = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            const getCount = async (filter?: (q: any) => any) => {
                let q = supabase.from('parties').select('*', { count: 'exact', head: true });
                if (filter) q = filter(q);
                const { count } = await q;
                return count || 0;
            };

            const visited = await getCount(q => q.eq('status', 'visited'));
            const planned = await getCount(q => q.eq('status', 'planned'));
            const my_posts = user ? await getCount(q => q.eq('created_by', user.id)) : 0;

            setCounts({ visited, planned, my_posts });
        };
        fetchAllCounts();

        const fetchData = async () => {
            setIsLoading(true);

            let data: Party[] = [];
            if (activeTab === 'my_posts') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    data = await getParties(undefined, user.id);
                }
            } else {
                data = await getParties(activeTab as PartyStatus);
            }

            setParties(data);

            // Extract available years from data
            const years = Array.from(new Set(data.map(p => p.date.substring(0, 4)))).sort().reverse();
            const currentYear = new Date().getFullYear().toString();
            if (!years.includes(currentYear)) years.unshift(currentYear);
            setAvailableYears(years);

            // Set default year to current year if no selection
            if (!selectedYear) setSelectedYear(currentYear);

            setIsLoading(false);
        };
        fetchData();
    }, [activeTab]);

    // Fetch Committees for filter
    useEffect(() => {
        const fetchCommittees = async () => {
            const { data } = await supabase
                .from('master_committees')
                .select('id, name')
                .eq('year', 2026) // Adjust year if needed (maybe fetch all distinct years or current)
                .order('id');

            if (data) {
                setAvailableCommittees(data);
            }
        };
        fetchCommittees();
    }, []);

    const toggleMonth = (month: string) => {
        setSelectedMonths(prev =>
            prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
        );
    };

    const toggleCommittee = (committeeId: string) => {
        setSelectedCommitteeIds(prev =>
            prev.includes(committeeId) ? prev.filter(c => c !== committeeId) : [...prev, committeeId]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedMonths([]);
        setSelectedCommitteeIds([]);
        setSelectedYear(new Date().getFullYear().toString());
    };

    const filteredParties = parties.filter(party => {
        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const titleMatch = party.title.toLowerCase().includes(query);
            const nameMatch = party.name.toLowerCase().includes(query);
            const addressMatch = (party.address || '').toLowerCase().includes(query);
            if (!titleMatch && !nameMatch && !addressMatch) return false;
        }

        // Year Filter
        const partyYear = party.date.substring(0, 4);
        if (selectedYear && partyYear !== selectedYear) return false;

        // Month Filter
        if (selectedMonths.length > 0) {
            const date = new Date(party.date);
            const month = `${date.getMonth() + 1}`; // 1, 2...
            if (!selectedMonths.includes(month)) return false;
        }

        // Committee Filter
        if (selectedCommitteeIds.length > 0) {
            if (!party.committee_id) return false;
            if (!selectedCommitteeIds.includes(party.committee_id)) return false;
        }
        return true;
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>懇親会ログ</h1>
                </div>
                <Link href="/apps/parties/create" className={styles.createButton}>
                    ＋ 新規登録
                </Link>
            </header>

            {/* Tab Navigation */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'visited' ? styles.active : ''}`}
                    onClick={() => setActiveTab('visited')}
                >
                    行った<span className={styles.count}>({counts.visited}件)</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'planned' ? styles.active : ''}`}
                    onClick={() => setActiveTab('planned')}
                >
                    計画中<span className={styles.count}>({counts.planned}件)</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'my_posts' ? styles.active : ''}`}
                    onClick={() => setActiveTab('my_posts')}
                >
                    私の投稿<span className={styles.count}>({counts.my_posts}件)</span>
                </button>
            </div>

            {/* Filter Section */}
            <div className={styles.filterSection}>
                <h2 className={styles.filterSectionTitle}>絞り込み検索</h2>

                <div className={styles.searchBar} style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="店名、タイトル、エリアで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>開催年月:</span>
                    <select
                        className={styles.miniSelect}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="">全期間</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}年</option>
                        ))}
                    </select>

                    <div className={styles.toggleGroup}>
                        <button
                            className={`${styles.toggleBtn} ${selectedMonths.length === 0 ? styles.active : ''}`}
                            onClick={() => setSelectedMonths([])}
                        >
                            すべて
                        </button>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                            <button
                                key={m}
                                className={`${styles.toggleBtn} ${selectedMonths.includes(m.toString()) ? styles.active : ''}`}
                                onClick={() => toggleMonth(m.toString())}
                            >
                                {m}月
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.filterRow}>
                    <span className={styles.filterLabel}>委員会:</span>
                    <div className={styles.toggleGroup}>
                        <button
                            className={`${styles.toggleBtn} ${selectedCommitteeIds.length === 0 ? styles.active : ''}`}
                            onClick={() => setSelectedCommitteeIds([])}
                        >
                            すべて
                        </button>
                        {availableCommittees.map(c => (
                            <button
                                key={c.id}
                                className={`${styles.toggleBtn} ${selectedCommitteeIds.includes(c.id) ? styles.active : ''}`}
                                onClick={() => toggleCommittee(c.id)}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {(searchQuery || selectedMonths.length > 0 || selectedCommitteeIds.length > 0) && (
                    <button className={styles.clearFilter} onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', marginTop: '0.5rem' }}>
                        × すべてクリア
                    </button>
                )}
            </div>

            {isLoading ? (
                <LoadingScreen />
            ) : (
                <div className={styles.grid}>
                    {filteredParties.map(party => (
                        <Link href={`/apps/parties/${party.id}`} key={party.id} className={styles.card}>
                            <div className={styles.cardImageWrapper}>
                                {party.image_url ? (
                                    <img src={party.image_url} alt={party.name} className={styles.cardImage} />
                                ) : (
                                    <div className={styles.noImage}>No Image</div>
                                )}
                                <div className={styles.cardBudget}>{party.budget || '-'}</div>
                            </div>
                            <div className={styles.cardContent}>
                                <h2 className={styles.cardTitle}>{party.title}</h2>
                                <p className={styles.cardShopName}>🏠 {party.name}</p>
                                <p className={styles.cardDate}>{party.date} {party.time && <span>({party.time})</span>}</p>
                                <p className={styles.cardAddress}>📍 {party.address || '場所不明'}</p>
                                {party.committee_name && (
                                    <span className={styles.committeeBadge}>{party.committee_name}</span>
                                )}

                                {party.rating && party.rating > 0 && (
                                    <div className={styles.rating}>
                                        {'★'.repeat(party.rating)}
                                    </div>
                                )}

                                <div className={styles.cardFooter}>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>👤 {party.created_by_name}</span>
                                    { /* Check generic styles for participant count or remove if not needed. Using simple span for now based on previous css */}
                                    {party.participant_count ? <span style={{ fontSize: '0.8rem', color: '#888' }}>+{party.participant_count}名</span> : null}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {filteredParties.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>表示できるデータがありません。</p>
                            <p>「＋ 新規登録」から最初の一件を投稿してみましょう！</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
