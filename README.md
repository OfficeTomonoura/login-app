# 25JC Portal App

Supabaseを基盤とした、高機能な会員管理・情報共有プラットフォーム。初期のデモ段階から、実運用を見据えたアーキテクチャへと進化しました。

## 🚀 主要機能

- **高度なユーザー認証**:
    - Supabase Authによる安全な認証システム
    - 初回ログイン時のオンボーディング・フロー
    - パスワード変更・管理機能
- **プロフィール管理**:
    - ユーザー情報の詳細登録（姓名、フリガナ、生年月日、電話番号、住所、勤務先）
    - 所属員会・役職の年度別管理（マスターデータ連動）
    - プロフィール画像の自由なクロップと保存
- **インフラ・ストレージ**:
    - **Supabase DB (PostgreSQL)**: プロフィール、投稿、マスターデータの一元管理
    - **Supabase Storage**: ユーザーごとのセキュアなストレージ空間
    - **RLS (Row Level Security)**: 徹底したアクセス制御（自分のデータのみ管理）
- **モダンなUI/UX**:
    - グラスモーフィズム（Dark Glass）テーマ
    - レスポンシブデザイン（モバイル・PC対応）
    - `DatePicker`による直感的な日付入力

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Vanilla CSS (CSS Modules)
- **バックエンド/BaaS**: Supabase
    - Auth (認証)
    - Database (PostgreSQL)
    - Storage (オブジェクトストレージ)
- **ステート管理**: React Context API
- **主要ライブラリ**: `react-easy-crop`, `@supabase/supabase-js`

## 📦 セットアップ

### 前提条件
- Node.js 18.x 以上
- Supabaseプロジェクトの作成と環境変数の設定

### インストール

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 📁 プロジェクト構成

```
login-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/               # ログイン・オンボーディング
│   │   ├── dashboard/          # メインダッシュボード
│   │   ├── profile/            # プロフィール閲覧・編集
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # Button, Input, DatePicker等
│   │   └── AuthGuard.tsx       # 認証ガード
│   ├── contexts/
│   │   └── SupabaseAuthContext # Supabase連携コンテキスト
│   └── types/                  # 型定義（post.ts等）
├── supabase_schema.sql         # データベース・ストレージ定義
└── package.json
```

## 📝 開発状況の確認
開発の進捗やコミット履歴の詳細は、`dev_portal/index.html`（プロジェクト状況モニター）でリアルタイムに確認できます。

## 👤 作成者
25JC 開発チーム - 2026
