import Link from 'next/link';

export default function Home() {
  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2rem', paddingBottom: '10vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          25JC
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'hsl(var(--muted-foreground))' }}>
          25JC専用の多機能プラットフォーム
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/auth/login" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
          ログイン
        </Link>
      </div>
    </main>
  );
}
