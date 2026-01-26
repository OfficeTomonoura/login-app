export type Committee = {
    year?: number;
    name: string;
    role: string;
};

export type User = {
    id: string;
    name: string;
    avatarUrl: string;
    committees?: Committee[];
};

export type ReactionType = 'acknowledged' | 'completed';

export type Reaction = {
    userId: string;
    userName: string;
    type: ReactionType;
    timestamp: string;
};

export type PostType = 'report' | 'request' | 'notice';
export type PostStatus = 'open' | 'closed' | 'draft';

export type Post = {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    type: PostType;
    status: PostStatus;
    createdAt: string;
    reactions: Reaction[];
    favorites: string[]; // ユーザーIDの配列
    targetUsers?: string[]; // 宛先指定されたユーザーのIDリスト
    targetCommittees?: string[]; // 宛先指定された委員会の名称リスト
};
