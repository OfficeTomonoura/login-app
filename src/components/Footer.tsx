import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.section}>
                        <h3 className={styles.title}>Service App</h3>
                        <p className={styles.description}>
                            安全で快適なユーザー向けプラットフォーム
                        </p>
                    </div>

                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>サービス</h4>
                        <ul className={styles.links}>
                            <li><Link href="/dashboard" className={styles.link}>ダッシュボード</Link></li>
                            <li><Link href="/profile" className={styles.link}>プロフィール</Link></li>
                            <li><Link href="/settings" className={styles.link}>設定</Link></li>
                        </ul>
                    </div>

                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>サポート</h4>
                        <ul className={styles.links}>
                            <li><Link href="/help" className={styles.link}>ヘルプ</Link></li>
                            <li><Link href="/contact" className={styles.link}>お問い合わせ</Link></li>
                            <li><Link href="/faq" className={styles.link}>よくある質問</Link></li>
                        </ul>
                    </div>

                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>法的情報</h4>
                        <ul className={styles.links}>
                            <li><Link href="/terms" className={styles.link}>利用規約</Link></li>
                            <li><Link href="/privacy" className={styles.link}>プライバシーポリシー</Link></li>
                            <li><Link href="/legal" className={styles.link}>特定商取引法</Link></li>
                        </ul>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {currentYear} Service App. All rights reserved.
                    </p>
                    <div className={styles.social}>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            Twitter
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
