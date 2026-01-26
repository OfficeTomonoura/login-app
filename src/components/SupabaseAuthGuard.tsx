'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function SupabaseAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 認証不要なパス
        const publicPaths = ['/auth/login', '/auth/register'];

        if (!isLoading && !user && !publicPaths.includes(pathname)) {
            router.push('/auth/login');
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // ログインページにいて、すでにログイン済みならダッシュボードへ
    if (user && pathname === '/auth/login') {
        router.push('/dashboard');
        return null; // またはローディング表示
    }

    return <>{children}</>;
}
