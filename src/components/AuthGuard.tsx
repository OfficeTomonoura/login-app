'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/SupabaseAuthContext';

import LoadingSpinner, { LoadingScreen } from '@/components/ui/LoadingSpinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading && !user) {
            console.log('AuthGuard: No user found, redirecting to login...');
            router.push('/auth/login');
        }
    }, [user, isLoading, router, mounted]);

    // ハイドレーションエラー防止のため、マウント前または読込中はスピナーを表示
    if (!mounted || isLoading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return null; // リダイレクト待ち
    }

    return <>{children}</>;
}
