'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './master.module.css';

interface Category {
    id: string;
    name: string;
    display_order: number;
}

interface Props {
    onClose?: () => void;
    onUpdate: () => void; // Parent should refresh its list
    isInline?: boolean;
}

export default function CategoryManager({ onClose, onUpdate, isInline = false }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [fullList, setFullList] = useState<Category[]>([]);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('master_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (data) {
            setFullList(data);
            if (!editingId && data.length > 0) {
                const maxOrder = Math.max(...data.map(r => r.display_order || 0));
                setDisplayOrder(maxOrder + 1);
            }
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('master_categories')
                    .update({ name, display_order: displayOrder })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('master_categories')
                    .insert([{ name, display_order: displayOrder }]);
                if (error) throw error;
            }

            setName('');
            setEditingId(null);
            await fetchCategories();
            onUpdate(); // Notify parent to refresh the dropdown options
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
                .from('master_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchCategories();
            onUpdate();
        } catch (error) {
            alert('削除できませんでした: ' + (error as Error).message);
        }
    };

    const renderContent = () => (
        <div className="space-y-10">
            <div>
                <div className={styles.sectionHeader}>新規登録・編集</div>
                <form onSubmit={handleSubmit} className={styles.formSection}>
                    <div className={styles.formGridTwo} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 2fr' }}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>表示順</label>
                            <input
                                type="number"
                                value={displayOrder}
                                onChange={e => setDisplayOrder(Number(e.target.value))}
                                className={styles.input}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>カテゴリ名</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="例: 出向"
                                className={styles.input}
                                required
                            />
                        </div>
                    </div>
                    <div className={styles.buttonGroup} style={{ marginTop: '1rem' }}>
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
            </div>

            <div>
                <div className={styles.sectionHeader}>登録済み一覧</div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={`${styles.th} w-24`}>順序</th>
                                <th className={styles.th}>名称</th>
                                <th className={`${styles.th} text-right`}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fullList.map(item => (
                                <tr key={item.id}>
                                    <td className={`${styles.td} text-gray-500`}>{item.display_order}</td>
                                    <td className={`${styles.td} font-medium`}>{item.name}</td>
                                    <td className={`${styles.td} ${styles.tdActions}`}>
                                        <button
                                            onClick={() => {
                                                setEditingId(item.id);
                                                setName(item.name);
                                                setDisplayOrder(item.display_order || 0);
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
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (isInline) {
        return (
            <div className="space-y-6">
                <p className="text-sm text-gray-500 mb-4">
                    組織の区分（委員会、三役など）を管理します。
                </p>
                {renderContent()}
            </div>
        );
    }

    return (
        <div className={styles.overlay} style={{ zIndex: 9999 }}>
            <div className={styles.modal} style={{ maxWidth: '40rem', maxHeight: '80vh' }}>
                <div className={styles.header}>
                    <h2 className={styles.title}>カテゴリの管理</h2>
                    <button onClick={onClose} className={styles.closeBtn}>✕ 閉じる</button>
                </div>
                <div className={styles.content}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
