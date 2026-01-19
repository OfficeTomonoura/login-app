# Login App

ダミーアカウントで動作するログイン機能付きWebアプリケーション

## 🚀 機能

- ✅ ユーザー認証（モックデータ）
- ✅ ログイン/ログアウト
- ✅ 認証状態の永続化（localStorage）
- ✅ 保護されたルート（ダッシュボード）
- ✅ モダンなUI/UX（グラスモーフィズム）
- ✅ レスポンシブデザイン

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Vanilla CSS (CSS Modules)
- **状態管理**: React Context API
- **認証**: モックデータ（本番環境ではFirebase等に置き換え可能）

## 📦 セットアップ

### 前提条件

- Node.js 18.x 以上
- npm または yarn

### インストール

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 🔐 テストアカウント

- **Email**: `test@example.com`
- **Password**: `password123`

## 📁 プロジェクト構成

```
login-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/
│   │   │   └── login/         # ログインページ
│   │   ├── dashboard/         # ダッシュボード（要認証）
│   │   ├── globals.css        # グローバルスタイル
│   │   ├── layout.tsx         # ルートレイアウト
│   │   └── page.tsx           # トップページ
│   ├── components/
│   │   ├── ui/                # 再利用可能なUIコンポーネント
│   │   │   ├── Button.tsx
│   │   │   └── Input.tsx
│   │   └── AuthGuard.tsx      # 認証ガード
│   ├── contexts/
│   │   └── AuthContext.tsx    # 認証コンテキスト
│   └── lib/
│       └── mock-user.ts       # モックユーザーデータ
├── public/                     # 静的ファイル
├── package.json
└── tsconfig.json
```

## 🌐 デプロイ

### Vercel（推奨）

1. GitHubリポジトリを作成
2. Vercelアカウントでインポート
3. 自動デプロイ完了

### その他のプラットフォーム

- Netlify
- Cloudflare Pages
- AWS Amplify

## 📝 ライセンス

MIT

## 👤 作成者

デモプロジェクト - 2026
