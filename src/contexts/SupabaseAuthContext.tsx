'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Committee } from '@/types/post';

// アプリケーション内で使用するユーザー型
// SupabaseのUser型とprofilesテーブルのデータを結合したもの
export type AppUser = {
    id: string;
    email: string;
    name: string;
    lastName?: string;
    firstName?: string;
    lastNameKana?: string;
    firstNameKana?: string;
    avatarUrl: string;
    isFirstLogin: boolean;
    phone?: string;
    address?: string;
    companyName?: string;
    birthDate?: string;
    committees?: Committee[];
};

type AuthContextType = {
    user: AppUser | null;
    session: Session | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<{ error: any; user?: AppUser | null }>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<AppUser>) => Promise<void>;
    updatePassword: (password: string) => Promise<{ error: any }>;
    uploadAvatar: (file: File | string) => Promise<{ publicUrl: string | null; error: any }>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
    login: async () => ({ error: null, user: null }),
    logout: async () => { },
    updateProfile: async () => { },
    updatePassword: async () => ({ error: null }),
    uploadAvatar: async () => ({ publicUrl: null, error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // プロフィール情報を取得してAppUserオブジェクトを作成する関数
    const fetchProfileAndSetUser = async (sessionUser: User): Promise<AppUser | null> => {
        const MAX_RETRIES = 3;
        const TIMEOUT_MS = 10000; // 10 seconds per attempt is usually enough for a healthy request

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // プロフィール取得にタイムアウトを設定
                const profilePromise = supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .single();

                const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
                    setTimeout(() => reject(new Error(`Profile fetch timeout (Attempt ${attempt})`)), TIMEOUT_MS)
                );

                const result = await Promise.race([profilePromise, timeoutPromise]) as any;
                const { data: profile, error } = result;

                if (error) {
                    // PGRST116: No rows found (profile doesn't exist yet) -> This is not a transient error, don't retry.
                    if (error.code === 'PGRST116') {
                        console.log('Profile not found, treating as its first login.');
                        const newUser: AppUser = {
                            id: sessionUser.id,
                            email: sessionUser.email || '',
                            name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Unknown',
                            avatarUrl: '',
                            isFirstLogin: true,
                        };
                        setUser(newUser);
                        return newUser;
                    }

                    // If it's another error, throw to trigger retry
                    throw error;
                }

                if (profile) {
                    const appUser: AppUser = {
                        id: profile.id,
                        email: profile.email || sessionUser.email || '',
                        name: profile.name,
                        lastName: profile.last_name,
                        firstName: profile.first_name,
                        lastNameKana: profile.last_name_kana,
                        firstNameKana: profile.first_name_kana,
                        avatarUrl: profile.avatar_url || '',
                        isFirstLogin: profile.is_first_login,
                        phone: profile.phone,
                        address: profile.address,
                        companyName: profile.company_name,
                        birthDate: profile.birth_date,
                        committees: profile.committees,
                    };
                    setUser(appUser);
                    return appUser;
                }
            } catch (err: any) {
                console.warn(`Attempt ${attempt} failed fetching profile:`, err.message || err);
                if (attempt < MAX_RETRIES) {
                    // Wait before retrying (exponential backoff: 1s, 2s, 4s...)
                    await new Promise(res => setTimeout(res, 1000 * attempt));
                    continue;
                }
            }
        }

        console.warn('All attempts to fetch profile failed. Using fallback user data.');

        setUser(null);
        return null;
    };

    useEffect(() => {
        // 初期セッションの取得
        const initializeAuth = async () => {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);

            if (session?.user) {
                await fetchProfileAndSetUser(session.user);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        initializeAuth();

        // 認証状態の変更監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                await fetchProfileAndSetUser(session.user);
            } else {
                setUser(null);
            }
            setIsLoading(false); // 状態に関わらずロードを完了させる
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        let appUser: AppUser | null = null;

        if (data.session?.user) {
            // プロフィール情報の取得を待機してからログイン完了とする
            appUser = await fetchProfileAndSetUser(data.session.user);
        }

        return { error, user: appUser };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        router.push('/auth/login');
    };

    const updateProfile = async (data: Partial<AppUser>) => {
        if (!user) return;

        // Supabaseのテーブル定義に合わせてスネークケースに変換
        const updates: any = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.lastName !== undefined) updates.last_name = data.lastName;
        if (data.firstName !== undefined) updates.first_name = data.firstName;
        if (data.lastNameKana !== undefined) updates.last_name_kana = data.lastNameKana;
        if (data.firstNameKana !== undefined) updates.first_name_kana = data.firstNameKana;
        if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
        if (data.isFirstLogin !== undefined) updates.is_first_login = data.isFirstLogin;
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.address !== undefined) updates.address = data.address;
        if (data.companyName !== undefined) updates.company_name = data.companyName;
        if (data.birthDate !== undefined) updates.birth_date = data.birthDate;
        if (data.committees !== undefined) updates.committees = data.committees;

        // idを含めてupsert（存在しなければ作成、存在すれば更新）
        updates.id = user.id;

        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) {
            throw error;
        }

        // ローカルのステートも更新
        setUser((prev) => prev ? { ...prev, ...data } : null);
    };

    const updatePassword = async (password: string) => {
        console.log('Context: updatePassword called. Session user:', session?.user?.id);

        // Ensure session is fresh
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error('Context: Session refresh error', sessionError);

        const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), 30000); // 30s timeout
        });

        try {
            const { data, error } = await Promise.race([
                supabase.auth.updateUser({ password }),
                timeoutPromise
            ]) as { data: any, error: any };

            console.log('Context: updateUser result', { data, error });
            return { error };
        } catch (err: any) {
            console.error('Context: updateUser exception', err);
            return { error: err.message === 'Request timed out' ? { message: 'サーバーからの応答がありません（タイムアウト）。メール設定を確認してください。' } : err };
        }
    };

    const uploadAvatar = async (file: File | string): Promise<{ publicUrl: string | null; error: any }> => {
        if (!user) return { publicUrl: null, error: 'User not logged in' };

        try {
            let fileBody: Blob;
            let fileExt = 'png'; // Default to png for base64

            if (typeof file === 'string') {
                // Determine extension from base64 header if possible (data:image/jpeg;base64,...)
                if (file.startsWith('data:image/')) {
                    const match = file.match(/data:image\/(\w+);base64,/);
                    if (match?.[1]) fileExt = match[1];
                }

                // Convert Base64 to Blob
                const byteString = atob(file.split(',')[1]);
                const mimeString = file.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                fileBody = new Blob([ab], { type: mimeString });
            } else {
                fileBody = file;
                const parts = file.name.split('.');
                if (parts.length > 1) fileExt = parts.pop()!;
            }

            const fileName = `users/${user.id}/${Date.now()}.${fileExt}`;

            // Add timeout for storage upload
            const uploadPromise = supabase.storage
                .from('avatars')
                .upload(fileName, fileBody, {
                    cacheControl: '3600',
                    upsert: true
                });

            const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 30000)
            );

            const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as { data: any; error: any };

            if (error) {
                console.error('Error uploading avatar:', error);
                return { publicUrl: null, error };
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            return { publicUrl, error: null };
        } catch (error) {
            console.error('Exception uploading avatar:', error);
            return { publicUrl: null, error };
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, login, logout, updateProfile, updatePassword, uploadAvatar, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
