'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { PartyStatus } from '@/types/party';
import { getParty, updateParty, deleteParty } from '@/lib/parties-db';
import styles from '../../create/create.module.css'; // Reuse create styles
import MemberSelectorModal from '@/components/MemberSelectorModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';

export default function EditPartyPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user } = useAuth();
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [status, setStatus] = useState<PartyStatus>('visited');
    const [rating, setRating] = useState(3);
    const [title, setTitle] = useState('');
    const [shopName, setShopName] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [address, setAddress] = useState('');
    const [url, setUrl] = useState('');
    const [budget, setBudget] = useState('未定');
    const [description, setDescription] = useState('');
    const [committeeId, setCommitteeId] = useState('');

    // Master Data State
    const [committees, setCommittees] = useState<{ id: string; name: string }[]>([]);

    // Member State
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // We need member names for display.
    type ParticipantDisplay = { id: string; name: string };
    const [selectedMembersDisplay, setSelectedMembersDisplay] = useState<ParticipantDisplay[]>([]);

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Fetch Committees
    useEffect(() => {
        const fetchCommittees = async () => {
            const { data, error } = await supabase
                .from('master_committees')
                .select('id, name')
                .eq('year', 2026)
                .order('id');

            if (data) {
                setCommittees(data);
            }
        };
        fetchCommittees();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const party = await getParty(id);
            if (party) {
                setStatus(party.status);
                setTitle(party.title);
                setShopName(party.name);
                setDate(party.date);
                if (party.time) {
                    const [start, end] = party.time.split('~');
                    setStartTime(start || '');
                    setEndTime(end || '');
                }
                setAddress(party.address || '');
                setUrl(party.url || '');
                setBudget(party.budget || '未定');
                setDescription(party.description || '');
                if (party.rating) setRating(party.rating);
                if (party.image_url) setImagePreview(party.image_url);
                if (party.committee_id) setCommitteeId(party.committee_id);

                if (party.participants) {
                    setSelectedMemberIds(party.participants.map(p => p.member_id));
                    setSelectedMembersDisplay(party.participants.map(p => ({ id: p.member_id, name: p.member_name })));
                }
            } else {
                notFound();
            }
            setIsLoading(false);
        };
        fetchData();
    }, [id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async () => {
        if (!confirm('本当に削除しますか？この操作は取り消せません。')) return;

        setIsSaving(true);
        try {
            const { error } = await deleteParty(id);
            if (error) {
                console.error('[Delete Error]', error);
                alert('削除に失敗しました。時間をおいて再度お試しください。');
                setIsSaving(false);
            } else {
                router.push('/apps/parties');
                router.refresh();
            }
        } catch (err) {
            console.error('[Delete Catch]', err);
            alert('予期せぬエラーが発生しました。');
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('ログインが必要です');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await updateParty({
                id,
                title,
                name: shopName,
                description: description,
                url,
                address,
                date,
                time: startTime && endTime ? `${startTime}~${endTime}` : startTime ? `${startTime}~` : '',
                budget,
                rating: status === 'visited' ? rating : undefined,
                status,
                committee_id: committeeId || undefined,
                participant_ids: selectedMemberIds,
                image_file: imageFile || undefined
            });

            if (error) {
                console.error('[Update Error Full]', error);
                alert(`更新に失敗しました: ${error.message || '不明なエラー'}`);
            } else {
                router.push(`/apps/parties/${id}`);
                router.refresh();
            }
        } catch (err) {
            console.error('[Submit Catch]', err);
            alert('予期せぬエラーが発生しました。時間をおいて再度お試しください。');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href={`/apps/parties/${id}`} className={styles.backButton}>
                </Link>
                <h1 className={styles.title}>懇親会情報の編集</h1>
            </header>

            <form onSubmit={handleSubmit} className={styles.formContainer}>
                {/* Status Selection */}
                <div className={styles.statusGroup}>
                    <label
                        className={`${styles.statusOption} ${status === 'visited' ? styles.active : ''}`}
                    >
                        <input
                            type="radio"
                            name="status"
                            value="visited"
                            checked={status === 'visited'}
                            onChange={() => setStatus('visited')}
                            className={styles.hiddenRadio}
                        />
                        <span className={styles.statusIcon}>🎉</span>
                        <div className={styles.statusText}>
                            <span className={styles.statusLabel}>行った</span>
                            <span className={styles.statusDesc}>懇親会の記録を残す</span>
                        </div>
                    </label>

                    <label
                        className={`${styles.statusOption} ${status === 'planned' ? styles.active : ''}`}
                    >
                        <input
                            type="radio"
                            name="status"
                            value="planned"
                            checked={status === 'planned'}
                            onChange={() => setStatus('planned')}
                            className={styles.hiddenRadio}
                        />
                        <span className={styles.statusIcon}>🤔</span>
                        <div className={styles.statusText}>
                            <span className={styles.statusLabel}>計画中</span>
                            <span className={styles.statusDesc}>候補のお店をメモ</span>
                        </div>
                    </label>
                </div>

                <div className={styles.card}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>懇親会タイトル <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="例: 1月度例会 懇親会"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>お店の名前 <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="例: 居酒屋 瀬戸内"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>開催日 / 予定日</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                            <div>
                                <label className={styles.subLabel} style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.3rem', display: 'block' }}>日付</label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={styles.subLabel} style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.3rem', display: 'block' }}>開始時間</label>
                                <input
                                    type="time"
                                    className={styles.input}
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={styles.subLabel} style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.3rem', display: 'block' }}>終了時間</label>
                                <input
                                    type="time"
                                    className={styles.input}
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>エリア・場所</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="例: 福山駅前、〇〇町"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>公式サイトURL (食べログ等)</label>
                        <input
                            type="url"
                            className={styles.input}
                            placeholder="https://..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>関連する委員会</label>
                        <select
                            className={styles.select}
                            value={committeeId}
                            onChange={(e) => setCommitteeId(e.target.value)}
                        >
                            <option value="">選択してください</option>
                            {committees.map(committee => (
                                <option key={committee.id} value={committee.id}>
                                    {committee.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>予算感</label>
                        <select
                            className={styles.select}
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                        >
                            <option>未定</option>
                            <option>~3,000円</option>
                            <option>3,000円~5,000円</option>
                            <option>5,000円~8,000円</option>
                            <option>8,000円~</option>
                        </select>
                    </div>

                    {status === 'visited' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>評価</label>
                            <div className={styles.ratingInput}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`${styles.starBtn} ${rating >= star ? styles.active : ''}`}
                                        onClick={() => setRating(star)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>コメント・メモ</label>
                        <textarea
                            className={styles.textarea}
                            rows={4}
                            placeholder="料理の感想や、個室の有無など..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>📸 写真</h2>
                    <div className={styles.uploadArea} onClick={() => document.getElementById('imageInput')?.click()}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className={styles.imagePreview} style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px' }} />
                        ) : (
                            <>
                                <span className={styles.uploadIcon}>☁️</span>
                                <p>クリックしてアップロード</p>
                                <p className={styles.uploadSub}>またはドラッグ＆ドロップ (クリックで変更)</p>
                            </>
                        )}
                        <input
                            type="file"
                            id="imageInput"
                            hidden
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>👥 参加メンバー</h2>
                    <div className={styles.memberList}>
                        {selectedMemberIds.map(mid => {
                            // Try to find name in pre-loaded display list
                            const disp = selectedMembersDisplay.find(m => m.id === mid);
                            const name = disp ? disp.name : 'Unknown Member';
                            const avatarUrl = disp ? (disp as any).avatar_url : null; // Hack cast or update type

                            return (
                                <div key={mid} className={styles.memberTag}>
                                    <div className={styles.memberTagAvatar}>
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                        ) : (
                                            name.charAt(0)
                                        )}
                                    </div>
                                    <span className={styles.memberTagName}>{name}</span>
                                    <button
                                        type="button"
                                        className={styles.removeMemberBtn}
                                        onClick={() => {
                                            setSelectedMemberIds(prev => prev.filter(id => id !== mid));
                                            setSelectedMembersDisplay(prev => prev.filter(m => m.id !== mid));
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles.memberPlaceholder}>
                        <button type="button" className={styles.addMemberBtn} onClick={() => setIsMemberModalOpen(true)}>
                            ＋ メンバーを追加
                        </button>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button type="submit" className={styles.submitBtn} disabled={isSaving}>
                        {isSaving ? '更新中...' : '更新する'}
                    </button>
                    <button
                        type="button"
                        className={styles.submitBtn}
                        style={{ background: 'rgba(255, 80, 80, 0.8)' }}
                        onClick={handleDelete}
                        disabled={isSaving}
                    >
                        🗑️ この投稿を削除
                    </button>
                </div>
            </form>

            <MemberSelectorModal
                isOpen={isMemberModalOpen}
                initialSelectedIds={selectedMemberIds}
                onClose={() => setIsMemberModalOpen(false)}
                onSelect={(ids, members) => {
                    setSelectedMemberIds(ids);
                    // Merge or set? Modal returns full selection, so set is fine.
                    // But wait, initial fetch might have populated display with minimal info.
                    // The modal returns full objects.
                    // We should just update the display array with the new objects.
                    setSelectedMembersDisplay(members as any);
                }}
            />
        </div>
    );
}
