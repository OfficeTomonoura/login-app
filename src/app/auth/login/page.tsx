'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './login.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const success = await login(email, password);

        if (success) {
            router.push('/dashboard');
        } else {
            setError('メールアドレスまたはパスワードが正しくありません');
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>ログイン</h1>
                    <p className={styles.subtitle}>アカウントにアクセス</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="メールアドレス"
                        type="email"
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

                    <Button type="submit" loading={loading} className={styles.submitBtn}>
                        ログイン
                    </Button>
                </form>

                <div className={styles.hint}>
                    <p>💡 テストアカウント:</p>
                    <p>Email: <code>test@example.com</code></p>
                    <p>Password: <code>password123</code></p>
                </div>
            </div>
        </div>
    );
}
