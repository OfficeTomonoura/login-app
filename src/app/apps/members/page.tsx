'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Member, MemberFilterState } from '@/types/member';
import styles from './members.module.css';
import MemberCard from './components/MemberCard';
import MemberFilters from './components/MemberFilters';
import MemberDetailModal from './components/MemberDetailModal';
import MemberCreateModal from './components/MemberCreateModal';

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [masterCommittees, setMasterCommittees] = useState<string[]>([]);
    const [masterRoles, setMasterRoles] = useState<string[]>([]);

    const [filters, setFilters] = useState<MemberFilterState>({
        searchQuery: '',
        committee: '',
        role: ''
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. メンバーデータの取得 (jc_membersテーブルから)
            const { data: membersData, error: membersError } = await supabase
                .from('jc_members')
                .select('*')
                .order('last_name_kana', { ascending: true });

            if (membersError) throw membersError;

            // 2. データの整形
            const formattedMembers: Member[] = membersData.map(p => ({
                id: p.id,
                email: p.email || '',
                name: p.name,
                lastName: p.last_name,
                firstName: p.first_name,
                lastNameKana: p.last_name_kana,
                firstNameKana: p.first_name_kana,
                avatarUrl: p.avatar_url,
                phone: p.phone,
                address: p.address,
                companyName: p.company_name,
                birthDate: p.birth_date,
                committees: p.committees || [],
                isProfileLinked: p.is_profile_linked,
                profileId: p.profile_id,
                createdAt: p.created_at
            }));

            setMembers(formattedMembers);
            setFilteredMembers(formattedMembers);

            // 3. マスターデータの取得 (DBから直接取得)
            const { data: committeesData } = await supabase
                .from('master_committees')
                .select('name')
                .eq('year', 2026) // 現在の年度のみ取得（必要に応じて調整）
                .order('name');

            const { data: rolesData } = await supabase
                .from('master_roles')
                .select('name')
                .order('display_order');

            const uniqueCommittees = committeesData?.map(c => c.name) || [];
            const uniqueRoles = rolesData?.map(r => r.name) || [];

            setMasterCommittees(uniqueCommittees);
            setMasterRoles(uniqueRoles);

        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // フィルタリングロジック
    useEffect(() => {
        let result = members;

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(query) ||
                (m.lastName && m.lastName.includes(query)) ||
                (m.firstName && m.firstName.includes(query)) ||
                (m.lastNameKana && m.lastNameKana.includes(query)) ||
                (m.firstNameKana && m.firstNameKana.includes(query))
            );
        }

        if (filters.committee) {
            result = result.filter(m =>
                m.committees?.some(c => c.name === filters.committee)
            );
        }

        if (filters.role) {
            result = result.filter(m =>
                m.committees?.some(c => c.role === filters.role)
            );
        }

        setFilteredMembers(result);
    }, [filters, members]);

    const handleMemberClick = (member: Member) => {
        setSelectedMember(member);
    };

    const handleCloseModal = () => {
        setSelectedMember(null);
    };

    return (
        <div className={styles.container}>

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>メンバー名簿</h1>
                    <p className={styles.count}>全 {members.length} 名</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className={styles.addBtn}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <span>＋</span> メンバー追加
                    </button>
                </div>
            </div>

            <MemberFilters
                filters={filters}
                onFilterChange={setFilters}
                committees={masterCommittees}
                roles={masterRoles}
            />

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    Loading...
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredMembers.length > 0 ? (
                        filteredMembers.map(member => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                onClick={handleMemberClick}
                            />
                        ))
                    ) : (
                        <div className={styles.noResults}>
                            該当するメンバーが見つかりませんでした。
                        </div>
                    )}
                </div>
            )}

            {/* 詳細モーダル */}
            {selectedMember && (
                <MemberDetailModal
                    member={selectedMember}
                    onClose={handleCloseModal}
                    onMemberUpdated={fetchData}
                    committees={masterCommittees}
                    roles={masterRoles}
                />
            )}

            {/* 新規登録モーダル */}
            {isCreateModalOpen && (
                <MemberCreateModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onMemberCreated={fetchData}
                    committees={masterCommittees}
                    roles={masterRoles}
                />
            )}
        </div>
    );
}
