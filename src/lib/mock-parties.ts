import { Party } from '@/types/party';

export const MOCK_PARTIES: Party[] = [
    {
        id: '1',
        title: '1月度総務委員会 懇親会',
        name: '居酒屋 瀬戸内',
        description: '魚が美味しいお店。個室があって静かに話せる。コース料理+飲み放題で利用しました。',
        url: 'https://example.com/setouchi',
        address: '福山市元町1-1',
        date: '2026-01-20',
        budget: '5000~6000円',
        rating: 4,
        status: 'visited',
        created_by: 'user-1',
        created_by_name: '山田 太郎',
        committee_name: '総務委員会', // New
        image_url: 'https://placehold.co/600x400/2a2a2a/FFF?text=Izakaya',
        participants: [
            { member_id: 'm1', member_name: '山田 太郎' },
            { member_id: 'm2', member_name: '佐藤 花子' },
            { member_id: 'm3', member_name: '鈴木 一郎' },
        ],
        participant_count: 3
    },
    {
        id: '2',
        title: '2次会',
        name: 'Bar The Night',
        description: '2次会で利用。ウイスキーの種類が豊富。マスターが気さくで良い雰囲気。',
        address: '福山市船町2-2',
        date: '2026-01-20',
        budget: '3000~4000円',
        rating: 5,
        status: 'visited',
        created_by: 'user-1',
        created_by_name: '山田 太郎',
        participants: [
            { member_id: 'm1', member_name: '山田 太郎' },
            { member_id: 'm2', member_name: '佐藤 花子' },
        ],
        participant_count: 2
    },
    {
        id: '3',
        title: '2月度委員会 打ち上げ',
        name: '焼肉 天下',
        description: '次の委員会の打ち上げで行きたいお店。評判が良いらしい。',
        url: 'https://example.com/tenka',
        address: '福山市昭和町3-3',
        date: '2026-02-15', // Future date
        budget: '6000~8000円',
        status: 'planned',
        created_by: 'user-2',
        created_by_name: '佐藤 花子',
        participant_count: 0
    },
    {
        id: '4',
        title: '3月度委員会 企画会議後',
        name: 'イタリアン・テラス',
        description: 'おしゃれな雰囲気。女子会にも良さそう。ランチもやってるみたい。',
        address: '福山市延広町4-4',
        date: '2026-03-01',
        budget: '4000~5000円',
        status: 'planned',
        created_by: 'user-3',
        created_by_name: '鈴木 一郎',
        participant_count: 0
    }
];
