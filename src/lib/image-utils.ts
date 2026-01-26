/**
 * 画像を圧縮してData URLを返す
 * @param file - 画像ファイル
 * @param maxWidth - 最大幅（デフォルト: 400px）
 * @param maxHeight - 最大高さ（デフォルト: 400px）
 * @param quality - JPEG品質（0-1、デフォルト: 0.8）
 * @returns 圧縮された画像のData URL
 */
export async function compressImage(
    file: File,
    maxWidth: number = 400,
    maxHeight: number = 400,
    quality: number = 0.8
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // 元の画像サイズ
                let width = img.width;
                let height = img.height;

                // アスペクト比を保ちながらリサイズ
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                // Canvasで画像を描画
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // JPEG形式で圧縮
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Data URLのサイズを計算（バイト単位）
 * @param dataUrl - Data URL
 * @returns サイズ（バイト）
 */
export function getDataUrlSize(dataUrl: string): number {
    // base64部分のみを抽出
    const base64 = dataUrl.split(',')[1];
    // base64は4文字で3バイトを表現するため、実際のサイズは (length * 3) / 4
    return Math.floor((base64.length * 3) / 4);
}

/**
 * サイズを人間が読みやすい形式に変換
 * @param bytes - バイト数
 * @returns フォーマットされた文字列
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
