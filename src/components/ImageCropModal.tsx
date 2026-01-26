'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import Button from './ui/Button';
import styles from './ImageCropModal.module.css';

interface ImageCropModalProps {
    imageSrc: string;
    onComplete: (croppedImage: string) => void;
    onCancel: () => void;
}

export default function ImageCropModal({ imageSrc, onComplete, onCancel }: ImageCropModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = useCallback(async () => {
        if (!croppedAreaPixels) return;

        try {
            const image = new Image();
            image.src = imageSrc;
            await new Promise((resolve) => {
                image.onload = resolve;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 円形クロップのためのキャンバスサイズ
            const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height);
            canvas.width = size;
            canvas.height = size;

            // 円形クリッピングパスを作成
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();

            // 画像を描画
            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                size,
                size
            );

            // Data URLに変換
            canvas.toBlob((blob) => {
                if (!blob) return;
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    onComplete(base64data);
                };
            }, 'image/jpeg', 0.95);
        } catch (error) {
            console.error('Failed to crop image:', error);
        }
    }, [croppedAreaPixels, imageSrc, onComplete]);

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <div className={styles.cropContainer}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className={styles.controls}>
                    <div className={styles.zoomControl}>
                        <label className={styles.label}>拡大縮小</label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>

                    <div className={styles.buttons}>
                        <Button variant="ghost" onClick={onCancel}>
                            キャンセル
                        </Button>
                        <Button onClick={createCroppedImage}>
                            完了
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
