import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { id, title, content, type, authorName } = await request.json();

        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://login-app-beta-seven.vercel.app';
        const postUrl = id ? `${appUrl}/posts/${id}` : `${appUrl}/apps/board`;

        // デバッグログ
        console.log('[LINE API] Attempting to send message (Broadcast)...');
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
            notice: '#f39c12'  // オレンジ
        };
        const typeLabel = type === 'report' ? '報告' : type === 'request' ? '依頼' : 'お知らせ';
        const color = typeColors[type as string] || '#2ecc71';

        // メッセージの構築 (Flex Message)
        const message = {
            messages: [
                {
                    type: 'flex',
                    altText: `【${typeLabel}】${title}`,
                    contents: {
                        type: 'bubble',
                        header: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: `新着: ${typeLabel}`,
                                    weight: 'bold',
                                    color: '#ffffff',
                                    size: 'sm'
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
                                    text: title,
                                    weight: 'bold',
                                    size: 'xl',
                                    wrap: true
                                },
                                {
                                    type: 'box',
                                    layout: 'vertical',
                                    margin: 'lg',
                                    spacing: 'sm',
                                    contents: [
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
                                                    flex: 1
                                                },
                                                {
                                                    type: 'text',
                                                    text: authorName,
                                                    wrap: true,
                                                    color: '#666666',
                                                    size: 'sm',
                                                    flex: 4
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    type: 'text',
                                    text: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                                    margin: 'lg',
                                    size: 'md',
                                    color: '#333333',
                                    wrap: true
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

        // LINE APIへの送信 (Broadcast)
        const response = await fetch('https://api.line.me/v2/bot/message/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(message)
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
