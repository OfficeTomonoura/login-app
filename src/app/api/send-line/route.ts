import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { title, content, type, authorName } = await request.json();

        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        // デバッグログ
        console.log('[LINE API] Attempting to send message (Broadcast)...');
        console.log(`[LINE API] Token present: ${!!token}`);

        if (!token) {
            console.error('[LINE API] Error: Token is not set in .env.local');
            return NextResponse.json({ success: false, message: 'LINE credentials missing.' }, { status: 500 });
        }

        // メッセージの構築
        const message = {
            messages: [
                {
                    type: 'text',
                    text: `【新着: ${type === 'report' ? '報告' : type === 'request' ? '依頼' : 'お知らせ'}】\n\n` +
                        `タイトル: ${title}\n` +
                        `投稿者: ${authorName}\n\n` +
                        `${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n\n` +
                        `詳細を確認してください。`
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
