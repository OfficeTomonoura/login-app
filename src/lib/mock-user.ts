import { Committee } from '@/types/post';

export const MOCK_USER = {
    id: 'user_1',
    email: 'test',
    password: 'test', // 本来はハッシュ化すべきだがモックのため平文
    name: 'デモ 太郎',
    avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Taro&background=0D8ABC&color=fff',
    isFirstLogin: true,
    phone: '',
    address: '',
    birthDate: '',
    committees: [] as Committee[],
};

export type MockUser = Omit<typeof MOCK_USER, 'password'>;
