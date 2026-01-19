import styles from './Badge.module.css';
import { PostType, PostStatus } from '@/types/post';

type BadgeProps = {
    type: PostType | PostStatus | 'unread' | 'read';
    label?: string;
};

export default function Badge({ type, label }: BadgeProps) {
    const getLabel = () => {
        if (label) return label;
        switch (type) {
            case 'report': return '報告';
            case 'request': return '依頼';
            case 'notice': return 'お知らせ';
            case 'open': return '募集中';
            case 'closed': return '解決済';
            case 'draft': return '下書き';
            case 'unread': return '未読';
            case 'read': return '既読';
            default: return type;
        }
    };

    return (
        <span className={`${styles.badge} ${styles[type]}`}>
            {getLabel()}
        </span>
    );
}
