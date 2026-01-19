import { Post, User } from '@/types/post';

// 全ユーザーリスト（未読管理用）
export const ALL_USERS: User[] = [
    { id: 'user_1', name: 'デモ 太郎', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 'user_2', name: '佐藤 花子', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { id: 'user_3', name: '鈴木 一郎', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack' },
    { id: 'user_4', name: '高橋 次郎', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan' },
    { id: 'user_5', name: '伊藤 美咲', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella' },
];

export const INITIAL_POSTS: Post[] = [
    {
        id: 'post_1',
        title: '【重要】サーバーメンテナンスのお知らせ',
        content: '1月20日の深夜2:00から4:00まで、定期メンテナンスのためサーバーを停止します。ご協力をお願いいたします。',
        authorId: 'user_2',
        authorName: '佐藤 花子',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        type: 'notice',
        status: 'open',
        createdAt: '2026-01-18T10:00:00.000Z',
        reactions: [
            { userId: 'user_1', userName: 'デモ 太郎', type: 'acknowledged', timestamp: '2026-01-18T10:30:00.000Z' },
            { userId: 'user_3', userName: '鈴木 一郎', type: 'acknowledged', timestamp: '2026-01-18T11:00:00.000Z' },
        ],
    },
    {
        id: 'post_2',
        title: '1月の月次報告書提出について',
        content: '1月度の月次報告書ですが、締め切りを25日までとします。各自作成の上、提出をお願いします。フォーマットは共有フォルダにあります。',
        authorId: 'user_1',
        authorName: 'デモ 太郎',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        type: 'request',
        status: 'open',
        createdAt: '2026-01-19T09:00:00.000Z',
        reactions: [
            { userId: 'user_2', userName: '佐藤 花子', type: 'completed', timestamp: '2026-01-19T09:15:00.000Z' },
        ],
    },
    {
        id: 'post_3',
        title: '新規プロジェクトのキックオフミーティング報告',
        content: '本日行われたキックオフミーティングの議事録を共有します。\n\n決定事項：\n1. スケジュールの確定\n2. 役割分担の仮決定\n\n詳細は添付のPDFをご確認ください。（※デモのため添付なし）',
        authorId: 'user_3',
        authorName: '鈴木 一郎',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
        type: 'report',
        status: 'closed',
        createdAt: '2026-01-17T15:00:00.000Z',
        reactions: [],
    },
];
