export type Committee = {
    id?: string;
    year?: number;
    name: string;
    role: string;
    category?: string;
};

export type Member = {
    id: string;
    email?: string; // 必須ではない（手動登録の場合）
    name: string;
    lastName?: string;
    firstName?: string;
    lastNameKana?: string;
    firstNameKana?: string;
    avatarUrl?: string;
    phone?: string;
    address?: string;
    companyName?: string;
    birthDate?: string;
    committees: Committee[];
    isProfileLinked?: boolean; // 新規追加
    profileId?: string; // 新規追加
    createdAt?: string;
};

// フィルター用の型
export type MemberFilterState = {
    searchQuery: string;
    committee: string;
    role: string;
};
