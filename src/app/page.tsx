import Link from 'next/link';

export default function Home() {
  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Service App
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'hsl(var(--muted-foreground))' }}>
          安全で快適なユーザー向けプラットフォーム
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/auth/login" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
          ログイン
        </Link>
        <Link href="/auth/register" className="btn btn-ghost" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
          新規登録
        </Link>
      </div>
    </main>
  );
}
