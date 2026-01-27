export type PartyStatus = 'visited' | 'planned';
export type TabType = PartyStatus | 'my_posts';

export type Party = {
    id: string;
    title: string;
    name: string; // Shop name
    description?: string;
    url?: string;
    address?: string;
    date: string; // ISO string YYYY-MM-DD
    time?: string; // Time range string e.g. "19:30~21:30"
    budget?: string;
    rating?: number; // 1-5
    status: PartyStatus;
    created_by: string; // user id
    committee_id?: string;
    image_url?: string; // Main image from storage
    created_at?: string;
    updated_at?: string;

    // UI Display helpers (joined data)
    created_by_name?: string;
    committee_name?: string;
    participant_count?: number;
    participants?: PartyParticipant[];
};

export type PartyParticipant = {
    member_id: string;
    member_name: string;
    member_avatar_url?: string;
};
