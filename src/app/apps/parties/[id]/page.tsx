'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Party } from '@/types/party';
import { getParty, updateParty } from '@/lib/parties-db';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import styles from './detail.module.css';

export default function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [party, setParty] = useState<Party | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getParty(id);
            if (!data) {
                // Handle 404 in effect or state
                // We can't call notFound() easily in async effect unless we redirect or set state
                // Setting state to null and checking after loading is better
            }
            setParty(data);
            setIsLoading(false);
        };
        fetchData();
    }, [id]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!party) {
        notFound();
    }

    const copyToClipboard = () => {
        if (!party) return;

        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const dateObj = new Date(party.date);
        const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${days[dateObj.getDay()]}）`;

        const text = `【懇親会】
【日　時】${formattedDate} ${party.time || ''}
【場　所】${party.name}
【会　費】${party.budget || '未定'}
【住　所】${party.address || '-'}
【M  a  p】${party.url || '-'}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('案内文をクリップボードにコピーしました！');
            }).catch(err => {
                console.error('Failed to copy code', err);
                alert('コピーに失敗しました');
            });
        } else {
            // Fallback for http or older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                const msg = successful ? '案内文をクリップボードにコピーしました！' : 'コピーに失敗しました';
                alert(msg);
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
                alert('コピーに失敗しました');
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/apps/parties" className={styles.backButton}>
                    ← 一覧に戻る
                </Link>
                <div className={styles.headerActions}>
                    <Link href={`/apps/parties/${party.id}/edit`} className={styles.editButton}>
                        ✏️ 編集
                    </Link>
                </div>
            </header>

            <div className={styles.hero}>
                {party.image_url ? (
                    <img src={party.image_url} alt={party.name} className={styles.heroImage} />
                ) : (
                    <div className={styles.noImage}>No Image</div>
                )}
                <div className={styles.heroContent}>
                    <div className={styles.statusRow}>
                        <div className={styles.statusBadge}>
                            {party.status === 'visited' ? 'visited' : '計画中'}
                        </div>
                        {party.status === 'planned' && (
                            <button
                                className={styles.statusChangeBtn}
                                onClick={async () => {
                                    if (confirm('ステータスを「行った」に変更しますか？')) {
                                        const { error } = await updateParty({ id: party.id, status: 'visited' });
                                        if (error) {
                                            alert('更新に失敗しました。');
                                        } else {
                                            // Simple reload or state update
                                            window.location.reload();
                                        }
                                    }
                                }}
                            >
                                ↺ 「行った」に変更
                            </button>
                        )}
                    </div>
                    <h1 className={styles.title}>{party.title}</h1>
                    <div className={styles.shopName}>🏠 {party.name}</div>
                    <div className={styles.metaRow}>
                        <span className={styles.date}>📅 {party.date} {party.time && <span style={{ fontSize: '0.9em', marginLeft: '0.5rem', color: '#ccc' }}>({party.time})</span>}</span>
                        <span className={styles.budget}>💰 {party.budget}</span>
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.mainContent}>
                    {party.description && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>📝 メモ</h2>
                            <p className={styles.description}>{party.description}</p>
                        </section>
                    )}

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>📸 写真ギャラリー</h2>
                        <div className={styles.photoGrid}>
                            {party.image_url && (
                                <div className={styles.photoThumbnail}>
                                    <img src={party.image_url} alt="Main" />
                                </div>
                            )}
                            {/* Additional photos logic would go here */}
                        </div>

                        <div className={styles.uploadArea} onClick={() => window.location.href = `/apps/parties/${party.id}/edit`}>
                            <span className={styles.uploadIcon}>☁️</span>
                            <p>ここに写真をドラッグ＆ドロップ</p>
                            <p className={styles.uploadSub}>またはクリックして編集画面で追加</p>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>📍 場所</h2>
                        <p className={styles.address}>{party.address || '住所未登録'}</p>
                        {party.url && (
                            <a href={party.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                🔗 お店等のサイトを見る
                            </a>
                        )}
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((party.address || '') + ' ' + party.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.mapLink}
                        >
                            🗺️ Google Mapsで開く
                        </a>
                    </section>
                </div>

                <div className={styles.sidebar}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>👥 参加メンバー</h2>
                        <div className={styles.memberList}>
                            {party.participants?.map(p => (
                                <div key={p.member_id} className={styles.memberItem}>
                                    <div className={styles.memberAvatar}>
                                        {p.member_name.charAt(0)}
                                    </div>
                                    <span className={styles.memberName}>{p.member_name}</span>
                                </div>
                            ))}
                            {(!party.participants || party.participants.length === 0) && (
                                <p className={styles.noMembers} style={{ color: '#999', fontSize: '0.9rem' }}>参加者情報は登録されていません</p>
                            )}
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>📊 情報</h2>
                        {party.committee_name && (
                            <div className={styles.infoRow}>
                                <span className={styles.label}>委員会</span>
                                <span className={styles.value}>{party.committee_name}</span>
                            </div>
                        )}
                        <div className={styles.infoRow}>
                            <span className={styles.label}>登録者</span>
                            <span className={styles.value}>{party.created_by_name}</span>
                        </div>
                        {party.rating && (
                            <div className={styles.infoRow}>
                                <span className={styles.label}>評価</span>
                                <span className={styles.rating}>{'★'.repeat(party.rating)}</span>
                            </div>
                        )}
                    </section>

                    <section className={styles.section} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 className={styles.sectionTitle}>📋 案内文作成</h2>
                        <div style={{ background: '#222', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#ddd', marginBottom: '1rem', border: '1px dashed #555' }}>
                            {(() => {
                                const days = ['日', '月', '火', '水', '木', '金', '土'];
                                const dateObj = new Date(party.date);
                                const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${days[dateObj.getDay()]}）`;
                                return `【懇親会】
【日　時】${formattedDate} ${party.time || ''}
【場　所】${party.name}
【会　費】${party.budget || '未定'}
【住　所】${party.address || '-'}
【M  a  p】${party.url || '-'}`;
                            })()}
                        </div>
                        <button onClick={copyToClipboard} className={styles.copyButton} style={{ width: '100%', background: '#4CAF50', border: 'none', padding: '0.8rem', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                            案内文をコピーする
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}
