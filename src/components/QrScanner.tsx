'use client';

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QrScannerProps {
  onScan: (result: string) => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrame: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          requestAnimationFrame(scan);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
      }
    };

    const scan = () => {
      if (!videoRef.current || !canvasRef.current || !scanning) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Match canvas size to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for QR detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        try {
          // Verify the QR code contains valid JSON data
          const parsedData = JSON.parse(code.data);
          if (parsedData.data && parsedData.timestamp) {
            setScanning(false);
            onScan(code.data);
            // Resume scanning after 2 seconds
            setTimeout(() => setScanning(true), 2000);
          }
        } catch {
          // If it's not valid JSON, continue scanning
          console.log('Invalid QR code format');
        }
      }

      animationFrame = requestAnimationFrame(scan);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [onScan, scanning]);

  return (
    <div className="relative">
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <div className="relative max-w-md mx-auto">
          <video
            ref={videoRef}
            className="w-full rounded-lg shadow-lg"
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full invisible"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-blue-500 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                {scanning ? (
                  <p className="text-sm text-blue-600 bg-white px-2 py-1 rounded">
                    Scanning...
                  </p>
                ) : (
                  <p className="text-sm text-green-600 bg-white px-2 py-1 rounded">
                    QR Code detected!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
