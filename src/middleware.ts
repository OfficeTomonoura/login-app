import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // メンテナンスモードのフラグを確認
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
    const { pathname, searchParams } = request.nextUrl;

    // 1. 合言葉 (?dev=true) が付与されている場合、バイパス用のクッキーをセットしてリダイレクト
    if (searchParams.get('dev') === 'true') {
        const response = NextResponse.redirect(new URL(pathname === '/maintenance' ? '/' : pathname, request.url));
        // maxAge は 1日(86400秒)
        response.cookies.set('maintenance_bypass', 'true', { maxAge: 86400, path: '/' });
        return response;
    }

    // 2. バイパス用クッキーを持っているか確認
    const hasBypassCookie = request.cookies.get('maintenance_bypass')?.value === 'true';

    // メンテナンスページ自体へのリクエストを無限ループさせないための処理
    if (pathname === '/maintenance') {
        // メンテナンスモードでない、またはバイパス許可がある場合はトップへ
        if (!isMaintenanceMode || hasBypassCookie) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // 3. メンテナンスモードが有効 かつ バイパス許可がない場合のみリダイレクト
    if (isMaintenanceMode && !hasBypassCookie) {
        // ただし、静的アセットやAPI、画像などは除外する
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
