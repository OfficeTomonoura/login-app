'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './FloatingHomeButton.module.css';

export default function FloatingHomeButton() {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();

    // ホーム画面（ランチャー）やログイン画面では表示しない
    // アプリ使用中（掲示板やマイページ）のみ表示する
    const isAppPage = pathname !== '/' && pathname !== '/dashboard' && !pathname?.startsWith('/auth');

    useEffect(() => {
        if (!isAppPage) return;

        const handleScroll = () => {
            // スクロールしたら表示
            setIsVisible(true);

            // 既存のタイマーをクリア
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // 1秒後に非表示にするタイマーをセット
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 1000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // 初期表示時も少し出してから消すなどの演出を入れてもいいが、
        // 今回は「スクロール中に出現」に忠実に実装する

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isAppPage]);

    if (!isAppPage) return null;

    return (
        <Link
            href="/dashboard"
            className={`${styles.button} ${isVisible ? styles.visible : ''}`}
            aria-label="ホームに戻る"
        >
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        </Link>
    );
}
