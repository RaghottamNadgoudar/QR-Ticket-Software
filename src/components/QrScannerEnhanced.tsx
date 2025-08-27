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

export const QrScannerEnhanced: React.FC<QrScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let detector: BarcodeDetector | null = null;

    const startCameraAndScan = async () => {
      try {
        setDebugInfo('Requesting camera access...');
        
        // Check if BarcodeDetector is available
        if (typeof window !== 'undefined' && !('BarcodeDetector' in window)) {
          setError('❌ QR Scanner not supported in this browser. Please use Chrome or Edge on mobile device.');
          setDebugInfo('BarcodeDetector API not available');
          return;
        }

        setDebugInfo('Accessing camera...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setDebugInfo('Starting video stream...');
          await videoRef.current.play();
          setIsScanning(true);
          setDebugInfo('Camera active, initializing scanner...');
        }

        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          // @ts-expect-error - BarcodeDetector is not in standard DOM types yet
          detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          setDebugInfo('Scanner ready! Point camera at QR code');

          const scanLoop = async () => {
            try {
              if (!videoRef.current || !detector || videoRef.current.readyState !== 4) {
                rafId = requestAnimationFrame(scanLoop);
                return;
              }

              const barcodes = await detector.detect(videoRef.current as HTMLVideoElement);
              if (barcodes && barcodes.length > 0) {
                const raw = barcodes[0].rawValue;
                if (raw && raw !== lastScanned) {
                  setLastScanned(raw);
                  setDebugInfo(`✅ QR Code detected: ${raw.substring(0, 20)}...`);
                  onScan(raw);
                  
                  // Brief pause after successful scan
                  setTimeout(() => {
                    setDebugInfo('Scanner ready! Point camera at QR code');
                  }, 2000);
                }
              }
            } catch (err) {
              console.log('Detection error (normal):', err);
              // These errors are normal during scanning
            }
            rafId = requestAnimationFrame(scanLoop);
          };

          rafId = requestAnimationFrame(scanLoop);
        } else {
          setError('BarcodeDetector API not available in this browser. Use Chrome/Edge on mobile for scanning.');
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('❌ Camera access denied. Please allow camera permissions and refresh the page.');
            setDebugInfo('Camera permission denied by user');
          } else if (err.name === 'NotFoundError') {
            setError('❌ No camera found. Please ensure your device has a camera.');
            setDebugInfo('No camera device found');
          } else if (err.name === 'NotSupportedError') {
            setError('❌ Camera not supported in this browser. Try Chrome or Edge.');
            setDebugInfo('Camera API not supported');
          } else {
            setError(`❌ Camera error: ${err.message}`);
            setDebugInfo(`Camera error: ${err.name}`);
          }
        } else {
          setError('❌ Failed to access camera. Please ensure camera permissions are granted.');
          setDebugInfo('Unknown camera error');
        }
      }
    };

    startCameraAndScan();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setIsScanning(false);
    };
  }, [onScan, lastScanned]);

  return (
    <div className="relative">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <div className="font-medium mb-2">{error}</div>
          <div className="text-sm text-red-600">
            💡 <strong>Tips:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Use Chrome or Edge browser on mobile</li>
              <li>Allow camera permissions when prompted</li>
              <li>Ensure you&apos;re on HTTPS (not HTTP)</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <video 
              ref={videoRef} 
              className="w-full max-w-md rounded-lg shadow-lg bg-gray-900" 
              playsInline 
              muted
            />
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded-lg" />
            {isScanning && (
              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                📹 LIVE
              </div>
            )}
          </div>
          
          {/* Debug info */}
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm">
            <div className="font-medium">Scanner Status:</div>
            <div>{debugInfo}</div>
            <div className="mt-2 text-xs opacity-75">
              Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : navigator.userAgent.includes('Edge') ? 'Edge ✅' : 'Other ⚠️'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
