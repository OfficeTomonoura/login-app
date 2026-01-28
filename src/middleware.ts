import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    // 1. 合言葉 (?dev=true) が付与されている場合、バイパス用のクッキーをセットしてリダイレクト
    if (searchParams.get('dev') === 'true') {
        const response = NextResponse.redirect(new URL(pathname === '/maintenance' ? '/' : pathname, request.url));
        response.cookies.set('maintenance_bypass', 'true', { maxAge: 86400, path: '/' });
        return response;
    }

    const hasBypassCookie = request.cookies.get('maintenance_bypass')?.value === 'true';

    // 2. メンテナンスモードのフラグを確認 (DBを優先、フォールバックとして環境変数)
    let isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            // タイムアウトを設定（影響を最小限にするため2秒）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(
                `${supabaseUrl}/rest/v1/system_settings?key=eq.maintenance_mode&select=value`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    },
                    cache: 'no-store',
                    signal: controller.signal
                }
            );
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    isMaintenanceMode = data[0].value === true;
                }
            }
        }
    } catch (err) {
        console.warn('Middleware: Failed to fetch status, using fallback.');
    }

    // メンテナンスページ自体へのリクエストを無限ループさせない
    if (pathname === '/maintenance') {
        if (!isMaintenanceMode || hasBypassCookie) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // 3. メンテナンスモードが有効 かつ バイパス許可がない場合のみリダイレクト
    if (isMaintenanceMode && !hasBypassCookie) {
        const isAsset = pathname.startsWith('/_next') ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/static') ||
            pathname.startsWith('/favicon.ico') ||
            /\.(.*)$/.test(pathname);

        if (!isAsset) {
            return NextResponse.redirect(new URL('/maintenance', request.url));
        }
    }

    return NextResponse.next();
}

// 適用対象となるパスの指定
export const config = {
    matcher: [
        /*
         * 以下のパスを除くすべてのリクエストパスにマッチさせる
         * - api (API routes)
         * - _next (Next.js内部リソース: static, image, chunks etc.)
         * - favicon.ico (ファビコン)
         */
        '/((?!api|_next|static|favicon.ico).*)',
    ],
};
