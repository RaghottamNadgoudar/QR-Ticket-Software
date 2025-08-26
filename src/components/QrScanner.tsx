'use client';

import React, { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
  onScan: (result: string) => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // In a real app, you'd implement QR code scanning here
  // You could use libraries like jsQR or zxing
  // For now, this is just a placeholder UI

  return (
    <div className="relative">
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full max-w-md rounded-lg shadow-lg"
            playsInline
          />
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded-lg" />
        </>
      )}
    </div>
  );
};
