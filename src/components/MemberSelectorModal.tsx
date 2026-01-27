'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './member-selector.module.css';

export type Member = {
    id: string;
    name: string;
    company_name?: string;
    avatar_url?: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedIds: string[], selectedMembers: Member[]) => void;
    initialSelectedIds: string[];
};

export default function MemberSelectorModal({ isOpen, onClose, onSelect, initialSelectedIds }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
    const [searchTerm, setSearchTerm] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch members on mount or open
    useEffect(() => {
        const fetchMembers = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('jc_members')
                .select('id, name, company_name, avatar_url')
                .order('name');

            if (error) {
                console.error('Error fetching members:', error);
            } else {
                setMembers(data || []);
            }
            setIsLoading(false);
        };

        if (isOpen && members.length === 0) {
            fetchMembers();
        }
    }, [isOpen, members.length]);

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedIds(initialSelectedIds);
            setSearchTerm('');
        }
    }, [isOpen, initialSelectedIds]);

    if (!isOpen) return null;

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.company_name && m.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleConfirm = () => {
        const selectedMembers = members.filter(m => selectedIds.includes(m.id));
        onSelect(selectedIds, selectedMembers);
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <h2 className={styles.title}>メンバー選択</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </header>

                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="名前や会社名で検索..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.list}>
                    {isLoading ? (
                        <div className={styles.loading}>読み込み中...</div>
                    ) : (
                        <>
                            {filteredMembers.map(member => (
                                <div
                                    key={member.id}
                                    className={`${styles.item} ${selectedIds.includes(member.id) ? styles.selected : ''}`}
                                    onClick={() => toggleSelection(member.id)}
                                >
                                    <div className={styles.avatar}>
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                        ) : (
                                            member.name.charAt(0)
                                        )}
                                    </div>
                                    <div className={styles.info}>
                                        <div className={styles.name}>{member.name}</div>
                                        <div className={styles.committee}>{member.company_name || '-'}</div>
                                    </div>
                                    <div className={styles.checkbox}>
                                        {selectedIds.includes(member.id) ? '✅' : '⬜'}
                                    </div>
                                </div>
                            ))}
                            {filteredMembers.length === 0 && (
                                <p className={styles.empty}>メンバーが見つかりません</p>
                            )}
                        </>
                    )}
                </div>

                <footer className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>キャンセル</button>
                    <button className={styles.confirmBtn} onClick={handleConfirm}>
                        決定 ({selectedIds.length})
                    </button>
                </footer>
            </div>
        </div>
    );
}
