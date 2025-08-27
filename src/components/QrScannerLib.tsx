'use client';

import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QrScannerLibProps {
  onScan: (result: string) => void;
}

export const QrScannerLib: React.FC<QrScannerLibProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const initializeScanner = async () => {
      if (!videoRef.current || !isMounted) return;

      try {
        setDebugInfo('Checking camera support...');
        
        // Check if camera is supported
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera || !isMounted) {
          if (isMounted) {
            setError('❌ No camera found on this device');
            setDebugInfo('No camera available');
          }
          return;
        }

        if (!isMounted) return;
        setDebugInfo('Camera found, requesting permissions...');

        // Create scanner instance
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            if (!isMounted) return;
            const scannedData = typeof result === 'string' ? result : result.data;
            if (scannedData && scannedData !== lastScanned) {
              setLastScanned(scannedData);
              setDebugInfo(`✅ QR Code scanned: ${scannedData.substring(0, 20)}...`);
              onScan(scannedData);
              
              // Brief feedback then reset status
              setTimeout(() => {
                if (isMounted) {
                  setDebugInfo('Scanner active - Point camera at QR code');
                }
              }, 2000);
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera on mobile
            maxScansPerSecond: 5,
          }
        );

        if (!isMounted) return;
        setDebugInfo('Starting camera...');
        
        // Add a small delay to ensure video element is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted || !scannerRef.current) return;
        
        await scannerRef.current.start();
        
        if (isMounted) {
          setIsScanning(true);
          setDebugInfo('Scanner active - Point camera at QR code');
        }

      } catch (err) {
        if (!isMounted) return;
        
        console.error('QR Scanner error:', err);
        
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('❌ Camera permission denied. Please allow camera access and refresh.');
            setDebugInfo('Camera permission denied');
          } else if (err.name === 'NotFoundError') {
            setError('❌ Camera not found. Please ensure your device has a camera.');
            setDebugInfo('Camera not found');
          } else if (err.name === 'NotSupportedError') {
            setError('❌ Camera not supported in this browser. Try Chrome or Safari.');
            setDebugInfo('Camera not supported');
          } else if (err.name === 'NotReadableError') {
            setError('❌ Camera is being used by another application.');
            setDebugInfo('Camera in use by another app');
          } else if (err.name === 'OverconstrainedError') {
            setError('❌ Camera constraints not satisfied. Trying fallback...');
            setDebugInfo('Camera constraints error');
            
            // Try again with fewer constraints
            try {
              if (scannerRef.current && isMounted) {
                await scannerRef.current.start();
                if (isMounted) {
                  setError(null);
                  setIsScanning(true);
                  setDebugInfo('Scanner active with fallback settings');
                }
              }
            } catch (fallbackErr) {
              if (isMounted) {
                setError('❌ Failed to start camera even with fallback settings.');
                setDebugInfo('Fallback failed');
              }
            }
          } else if (err.message.includes('play() request was interrupted')) {
            setError('❌ Camera initialization interrupted. Retrying...');
            setDebugInfo('Retrying camera initialization...');
            
            // Retry after a delay
            setTimeout(() => {
              if (isMounted && !isScanning) {
                initializeScanner();
              }
            }, 1000);
          } else {
            setError(`❌ Camera error: ${err.message}`);
            setDebugInfo(`Error: ${err.name}`);
          }
        } else {
          setError('❌ Unknown error starting camera');
          setDebugInfo('Unknown error');
        }
      }
    };

    // Add a small delay before initializing to ensure DOM is ready
    const timer = setTimeout(() => {
      if (isMounted) {
        initializeScanner();
      }
    }, 200);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
      
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.destroy();
        } catch (err) {
          console.log('Scanner cleanup error (expected):', err);
        }
        scannerRef.current = null;
      }
      setIsScanning(false);
    };
  }, [onScan, lastScanned]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="font-medium mb-2">{error}</div>
          <div className="text-sm text-red-600">
            💡 <strong>Troubleshooting:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Allow camera permissions when prompted</li>
              <li>Close other apps using the camera</li>
              <li>Try refreshing the page</li>
              <li>Use Chrome or Safari on mobile</li>
              <li>Ensure you're on HTTPS (not HTTP)</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Video element */}
          <div className="relative">
            <video 
              ref={videoRef} 
              className="w-full rounded-lg shadow-lg bg-gray-900"
              playsInline
              muted
            />
            
            {/* Status indicators */}
            {isScanning && (
              <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                SCANNING
              </div>
            )}
          </div>
          
          {/* Debug info panel */}
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Scanner Status</span>
            </div>
            <div className="text-blue-700">{debugInfo}</div>
            
            <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600 space-y-1">
              <div>Library: qr-scanner (Advanced)</div>
              <div>Device: {/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}</div>
              <div>Browser: {
                navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : 
                navigator.userAgent.includes('Safari') ? 'Safari ✅' : 
                navigator.userAgent.includes('Edge') ? 'Edge ✅' : 
                navigator.userAgent.includes('Firefox') ? 'Firefox ⚠️' : 'Other'
              }</div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-700">
            <div className="font-medium mb-1">📱 How to scan:</div>
            <ul className="text-xs space-y-1">
              <li>• Hold your device steady</li>
              <li>• Point camera at QR code</li>
              <li>• Ensure good lighting</li>
              <li>• Keep QR code within the frame</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrScannerLib;
