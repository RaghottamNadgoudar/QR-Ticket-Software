'use client';

import React, { useEffect, useRef, useState } from 'react';

// Ambient declaration for BarcodeDetector (minimal) so TypeScript compiles.
declare global {
  interface BarcodeDetector {
    detect(
      source: HTMLVideoElement | ImageBitmap | ImageData | OffscreenCanvas
    ): Promise<Array<{ rawValue: string }>>;
  }
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): BarcodeDetector;
    };
  }
}

interface QrScannerProps {
  onScan: (result: string) => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let detector: BarcodeDetector | null = null;

    const startCameraAndScan = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          // @ts-expect-error - BarcodeDetector is not in standard DOM types yet
          detector = new window.BarcodeDetector({ formats: ['qr_code'] });

          const scanLoop = async () => {
            try {
              if (!videoRef.current || !detector) return;
              const barcodes = await detector.detect(videoRef.current as HTMLVideoElement);
              if (barcodes && barcodes.length > 0) {
                const raw = barcodes[0].rawValue;
                if (raw && raw !== lastScanned) {
                  setLastScanned(raw);
                  onScan(raw);
                }
              }
            } catch (err) {
              // ignore intermittent detector errors
            }
            rafId = requestAnimationFrame(scanLoop);
          };

          rafId = requestAnimationFrame(scanLoop);
        } else {
          setError('BarcodeDetector API not available in this browser. Use Chrome/Edge on mobile for scanning.');
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
      }
    };

    startCameraAndScan();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [onScan, lastScanned]);

  return (
    <div className="relative">
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      ) : (
        <>
          <video ref={videoRef} className="w-full max-w-md rounded-lg shadow-lg" playsInline />
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded-lg" />
        </>
      )}
    </div>
  );
};
