export const MOCK_USER = {
    id: 'user_12345',
    email: 'test@example.com',
    password: 'password123', // 本来はハッシュ化すべきだがモックのため平文
    name: 'デモ 太郎',
    avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Taro&background=0D8ABC&color=fff',
};

export type MockUser = Omit<typeof MOCK_USER, 'password'>;
