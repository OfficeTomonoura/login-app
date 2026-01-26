'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './master.module.css';

interface Role {
    id: string;
    name: string;
    display_order: number;
}

interface Props {
    onUpdate: () => void;
}

export default function RoleManager({ onUpdate }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [fullList, setFullList] = useState<Role[]>([]);

    // Load full details
    const fetchRoles = async () => {
        const { data, error } = await supabase
            .from('master_roles')
            .select('*')
            .order('display_order', { ascending: true });

        if (data) {
            setFullList(data);
            // Auto-increment for new entries
            if (!editingId && data.length > 0) {
                const maxOrder = Math.max(...data.map(r => r.display_order || 0));
                setDisplayOrder(maxOrder + 1);
            }
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('master_roles')
                    .update({ name, display_order: displayOrder })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('master_roles')
                    .insert([{ name, display_order: displayOrder }]);
                if (error) throw error;
            }

            // Reset
            setName('');
            setEditingId(null);
            await fetchRoles();
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
                .from('master_roles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchRoles();
            onUpdate();
        } catch (error) {
            alert('削除できませんでした: ' + (error as Error).message);
        }
    };

    return (
        <div className="space-y-6">
            <h3>役職の管理</h3>
            <p className="text-sm text-gray-500 mb-4">
                名簿での表示順序（ソート）や選択肢として使用されます。
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.formSection}>
                <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>表示順 (数値)</label>
                        <input
                            type="number"
                            value={displayOrder}
                            onChange={e => setDisplayOrder(Number(e.target.value))}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>役職名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例: 副委員長"
                            className={styles.input}
                            required
                        />
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
                            <th className={`${styles.th} w-24`}>順序</th>
                            <th className={styles.th}>役職名</th>
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
    );
}
