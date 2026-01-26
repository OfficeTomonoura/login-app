'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './master.module.css';
import CategoryManager from './CategoryManager';

interface Category {
    id: string;
    name: string;
    display_order: number;
}

interface Committee {
    id: string;
    year: number;
    name: string;
    category_id: string;
    // Joined data
    master_categories?: Category | null;
}

interface Props {
    committees: string[];
    onUpdate: () => void;
}

export default function CommitteeManager({ onUpdate }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [year, setYear] = useState(2026);
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState(''); // Stores UUID
    const [editingId, setEditingId] = useState<string | null>(null);
    const [fullList, setFullList] = useState<Committee[]>([]);

    // Category management
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Load full details for editing
    const fetchCommittees = async () => {
        // Create a type-safe query if possible, or cast the result
        const { data, error } = await supabase
            .from('master_committees')
            .select(`
                *,
                master_categories (
                    id,
                    name,
                    display_order
                )
            `)
            .order('year', { ascending: false })
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching committees:', error);
            // alert('委員会の取得に失敗しました: ' + error.message);
            return;
        }

        if (data) {
            // Type assertion for joined data structure
            setFullList(data as any as Committee[]);
        }
    };

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('master_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (data && data.length > 0) {
            setCategories(data);
            // Default select the first one if nothing selected
            if (!categoryId && data.length > 0) {
                setCategoryId(data[0].id);
            }
        }
    };

    // Initial load
    useState(() => {
        // Fetch categories first to set default
        fetchCategories().then(() => {
            fetchCommittees();
        });
    });

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '__EDIT_CATEGORY__') {
            setIsCategoryModalOpen(true);
        } else {
            setCategoryId(val);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('master_committees')
                    .update({
                        year,
                        name,
                        category_id: categoryId
                    })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('master_committees')
                    .insert([{
                        year,
                        name,
                        category_id: categoryId
                    }]);
                if (error) throw error;
            }

            // Reset (keep year and category for convenience)
            setName('');
            setEditingId(null);
            await fetchCommittees();
            onUpdate();
        } catch (error) {
            alert('エラーが発生しました: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return;

        try {
            const { error } = await supabase
                .from('master_committees')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchCommittees();
            onUpdate();
        } catch (error) {
            alert('削除できませんでした: ' + (error as Error).message);
        }
    };

    return (
        <div className="space-y-6">
            <h3>委員会・組織の管理</h3>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.formSection}>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>年度</label>
                        <input
                            type="number"
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>組織名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例: 広報委員会"
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>カテゴリ</label>
                        <select
                            value={categoryId}
                            onChange={handleCategoryChange}
                            className={styles.select}
                        >
                            <option value="" disabled>カテゴリーを選択</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            <option disabled>──────────</option>
                            <option value="__EDIT_CATEGORY__">カテゴリを編集...</option>
                        </select>
                    </div>
                </div>
                <div className={styles.buttonGroup}>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null);
                                setName('');
                            }}
                            className={`${styles.btn} ${styles.btnCancel}`}
                        >
                            キャンセル
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`${styles.btn} ${styles.btnSubmit}`}
                    >
                        {isLoading ? '保存中...' : (editingId ? '更新する' : '追加する')}
                    </button>
                </div>
            </form>

            {/* List */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>年度</th>
                            <th className={styles.th}>組織名</th>
                            <th className={styles.th}>カテゴリ</th>
                            <th className={`${styles.th} text-right`}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fullList.map(item => (
                            <tr key={item.id}>
                                <td className={styles.td}>{item.year}</td>
                                <td className={`${styles.td} font-medium`}>{item.name}</td>
                                <td className={`${styles.td} text-gray-500`}>
                                    {item.master_categories?.name || '不明'}
                                </td>
                                <td className={`${styles.td} ${styles.tdActions}`}>
                                    <button
                                        onClick={() => {
                                            setEditingId(item.id);
                                            setYear(item.year);
                                            setName(item.name);
                                            if (item.category_id) setCategoryId(item.category_id);
                                        }}
                                        className={styles.editBtn}
                                    >
                                        編集
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className={styles.deleteBtn}
                                    >
                                        削除
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {fullList.length === 0 && (
                            <tr>
                                <td colSpan={4} className={styles.emptyRow}>
                                    登録されている組織はありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Category Manager Modal */}
            {isCategoryModalOpen && (
                <CategoryManager
                    onClose={() => setIsCategoryModalOpen(false)}
                    onUpdate={() => {
                        fetchCategories();
                        fetchCommittees(); // Refresh list names too
                    }}
                />
            )}
        </div>
    );
}
