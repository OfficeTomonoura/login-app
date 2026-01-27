'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './login.module.css';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';

/**
 * ログインページコンポーネント
 */
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // ログイン処理と最低1秒の待機を並列実行
            const [loginResult] = await Promise.all([
                login(email, password),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            const { error, user } = loginResult as { error: any; user?: any };

            if (error) {
                console.error('Login failed:', error);
                setError('メールアドレスまたはパスワードが正しくありません。');
                setIsLoading(false);
                return;
            }

            // 初回ログインかどうかで遷移先を分岐
            if (user) {
                if (user.isFirstLogin) {
                    router.push('/auth/onboarding');
                } else {
                    router.push('/dashboard');
                }
                // 画面遷移中もisLoadingを維持（AuthGuardなどの読み込みが始まるまで）
            } else {
                setError('プロフィール情報の取得に失敗しました。通信環境を確認して再度お試しください。');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('ログイン中にエラーが発生しました。');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {isLoading && <LoadingOverlay />}
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>25JC</h1>
                    <p className={styles.subtitle}>25JC専用の多機能プラットフォーム</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="メールアドレス"
                        type="text"
                        placeholder="test@example.com"
                        value={email}
                        onChange={setEmail}
                        required
                    />

                    <Input
                        label="パスワード"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={setPassword}
                        required
                    />

                    {error && <p className={styles.error}>{error}</p>}

                    <Button type="submit" loading={isLoading} className={styles.submitBtn}>
                        ログイン
                    </Button>
                </form>


            </div>
        </div>
    );
}
