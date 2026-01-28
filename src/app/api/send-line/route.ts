import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { id, title, content, type, authorName, source, shopName, date, committeeName, status } = await request.json();
        const isParty = source === 'party';

        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://login-app-beta-seven.vercel.app';
        const postUrl = isParty
            ? `${appUrl}/apps/parties`
            : (id ? `${appUrl}/posts/${id}` : `${appUrl}/apps/board`);

        // デバッグログ
        console.log('[LINE API] Attempting to send message...');
        console.log(`[LINE API] Token present: ${!!token}`);

        if (!token) {
            console.error('[LINE API] Error: LINE_CHANNEL_ACCESS_TOKEN is not set.');
            return NextResponse.json({
                success: false,
                message: 'LINE_CHANNEL_ACCESS_TOKENが設定されていません。本番環境（Vercel等）の環境変数を確認してください。'
            }, { status: 500 });
        }

        // 種別に応じた色の設定
        const typeColors: Record<string, string> = {
            report: '#3498db', // 青
            request: '#e74c3c', // 赤
            notice: '#f39c12',  // オレンジ
            party: '#FF9966'    // 懇親会カラー
        };
        const typeLabel = isParty ? '懇親会ログ' : (type === 'report' ? '報告' : type === 'request' ? '依頼' : 'お知らせ');
        const statusLabel = status === 'visited' ? '行った' : status === 'planned' ? '計画中' : '';
        const color = isParty ? typeColors.party : (typeColors[type as string] || '#2ecc71');
        const statusBadgeColor = status === 'visited' ? '#2ecc71' : '#3498db';

        // 防御策: LINE APIは空文字を許容しないため
        const safeTitle = (title || '無題').trim() || '無題';
        const safeAuthorName = (authorName || '不明なユーザー').trim() || '不明なユーザー';
        const safeShopName = (shopName || '不明な店舗').trim() || '不明な店舗';
        const displayTitle = safeTitle;

        // メッセージの構築 (Flex Message)
        const message = {
            messages: [
                {
                    type: 'flex',
                    altText: isParty ? `【${statusLabel}】${safeTitle}` : `【${typeLabel}】${safeTitle}`,
                    contents: {
                        type: 'bubble',
                        header: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: `新着: ${typeLabel}`,
                                            weight: 'bold',
                                            color: '#ffffff',
                                            size: 'sm',
                                            flex: 1
                                        },
                                        isParty ? {
                                            type: 'box',
                                            layout: 'vertical',
                                            contents: [
                                                {
                                                    type: 'text',
                                                    text: statusLabel,
                                                    size: 'xs',
                                                    color: '#ffffff',
                                                    align: 'center',
                                                    weight: 'bold'
                                                }
                                            ],
                                            backgroundColor: statusBadgeColor,
                                            paddingAll: '4px',
                                            cornerRadius: '4px',
                                            flex: 0
                                        } : { type: 'spacer', size: 'xs' }
                                    ]
                                }
                            ],
                            backgroundColor: color
                        },
                        body: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: displayTitle,
                                    weight: 'bold',
                                    size: 'xl',
                                    wrap: true
                                },
                                {
                                    type: 'box',
                                    layout: 'vertical',
                                    margin: 'lg',
                                    spacing: 'sm',
                                    contents: ([
                                        isParty && shopName ? {
                                            type: 'box',
                                            layout: 'baseline',
                                            spacing: 'sm',
                                            contents: [
                                                {
                                                    type: 'text',
                                                    text: '店名',
                                                    color: '#aaaaaa',
                                                    size: 'sm',
                                                    flex: 2
                                                },
                                                {
                                                    type: 'text',
                                                    text: safeShopName,
                                                    wrap: true,
                                                    color: '#666666',
                                                    size: 'sm',
                                                    flex: 5
                                                }
                                            ]
                                        } : null,
                                        isParty && date ? {
                                            type: 'box',
                                            layout: 'baseline',
                                            spacing: 'sm',
                                            contents: [
                                                {
                                                    type: 'text',
                                                    text: '開催日',
                                                    color: '#aaaaaa',
                                                    size: 'sm',
                                                    flex: 2
                                                },
                                                {
                                                    type: 'text',
                                                    text: date,
                                                    wrap: true,
                                                    color: '#666666',
                                                    size: 'sm',
                                                    flex: 5
                                                }
                                            ]
                                        } : null,
                                        isParty && committeeName ? {
                                            type: 'box',
                                            layout: 'baseline',
                                            spacing: 'sm',
                                            contents: [
                                                {
                                                    type: 'text',
                                                    text: '関連委員会',
                                                    color: '#aaaaaa',
                                                    size: 'sm',
                                                    flex: 2
                                                },
                                                {
                                                    type: 'text',
                                                    text: committeeName,
                                                    wrap: true,
                                                    color: '#666666',
                                                    size: 'sm',
                                                    flex: 5
                                                }
                                            ]
                                        } : null,
                                        {
                                            type: 'box',
                                            layout: 'baseline',
                                            spacing: 'sm',
                                            contents: [
                                                {
                                                    type: 'text',
                                                    text: '投稿者',
                                                    color: '#aaaaaa',
                                                    size: 'sm',
                                                    flex: 2
                                                },
                                                {
                                                    type: 'text',
                                                    text: safeAuthorName,
                                                    wrap: true,
                                                    color: '#666666',
                                                    size: 'sm',
                                                    flex: 5
                                                }
                                            ]
                                        }
                                    ] as any[]).filter(Boolean)
                                }
                            ]
                        },
                        footer: {
                            type: 'box',
                            layout: 'vertical',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'button',
                                    style: 'primary',
                                    height: 'sm',
                                    color: color,
                                    action: {
                                        type: 'uri',
                                        label: '詳細を確認する',
                                        uri: postUrl
                                    }
                                }
                            ],
                            flex: 0
                        }
                    }
                }
            ]
        };

        // 5. システム設定をDBから取得 (メンテナンスモード等の動的切り替え用)
        let dbMaintenance = null;
        let dbRecipients = null;

        try {
            const { data: settings } = await supabase.from('system_settings').select('key, value');
            if (settings) {
                dbMaintenance = settings.find(s => s.key === 'maintenance_mode')?.value;
                dbRecipients = settings.find(s => s.key === 'line_recipients')?.value;
            }
        } catch (err) {
            console.error('[LINE API] Failed to fetch DB settings:', err);
        }

        // 5. LINE APIへの送信 (通常はBroadcast、メンテナンス中は限定送信)
        const rawMaintEnv = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;

        // 判定ロジックを厳格化: DBに設定があればそれを使用し、なければ環境変数を使用
        const hasDbSetting = (dbMaintenance !== null && dbMaintenance !== undefined);
        const isMaintenance = hasDbSetting
            ? dbMaintenance === true
            : (rawMaintEnv || '').trim() === 'true';

        const envRecipientsStr = process.env.MAINTENANCE_LOG_RECIPIENTS;
        const envRecipients = envRecipientsStr ? envRecipientsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
        const recipients = Array.isArray(dbRecipients) ? dbRecipients : envRecipients;

        console.log(`[LINE API] --- SETTINGS DEBUG ---`);
        console.log(`[LINE API] DB_VAL: ${dbMaintenance}, ENV_VAL: "${rawMaintEnv}"`);
        console.log(`[LINE API] DECISION: ${isMaintenance ? 'Maintenance' : 'Standard'} (via ${hasDbSetting ? 'DB' : 'Env'})`);
        console.log(`[LINE API] RECIP_COUNT: ${recipients.length}`);

        let apiUrl = 'https://api.line.me/v2/bot/message/broadcast';
        let body: any = { messages: message.messages };

        if (isMaintenance) {
            if (recipients.length > 0) {
                console.log(`[LINE API] FINAL_TARGET: Multicast (${recipients.length} users)`);
                apiUrl = 'https://api.line.me/v2/bot/message/multicast';
                body = {
                    to: recipients,
                    messages: message.messages
                };
            } else {
                console.warn('[LINE API] FINAL_TARGET: SKIP (Maintenance ON but no recipients)');
                return NextResponse.json({
                    success: true,
                    message: 'メンテナンスモードのため送信をスキップしました。'
                });
            }
        } else {
            console.log('[LINE API] FINAL_TARGET: Broadcast (All users)');
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[LINE API] Failed. Status:', response.status);
            console.error('[LINE API] Error Details:', JSON.stringify(errorData, null, 2));
            return NextResponse.json({ success: false, error: errorData }, { status: response.status });
        }

        console.log('[LINE API] Success!');
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
