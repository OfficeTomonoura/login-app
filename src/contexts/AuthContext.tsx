'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_USER, MockUser } from '@/lib/mock-user';

type AuthContextType = {
    user: MockUser | null;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (data: { name: string; email: string }) => Promise<void>;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => false,
    logout: () => { },
    updateProfile: async () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<MockUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // 初期ロード時にローカルストレージを確認
    useEffect(() => {
        const storedUser = localStorage.getItem('mock_session_user');
        if (storedUser) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse session', e);
                localStorage.removeItem('mock_session_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, pass: string): Promise<boolean> => {
        // 擬似的なAPI遅延
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (email === MOCK_USER.email && pass === MOCK_USER.password) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...safeUser } = MOCK_USER;
            setUser(safeUser);
            localStorage.setItem('mock_session_user', JSON.stringify(safeUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mock_session_user');
        router.push('/auth/login');
    };

    type UpdateProfileData = {
        name: string;
        email: string;
    };

    const updateProfile = async (data: UpdateProfileData): Promise<void> => {
        // 擬似的なAPI遅延
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (user) {
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('mock_session_user', JSON.stringify(updatedUser));
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateProfile, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
