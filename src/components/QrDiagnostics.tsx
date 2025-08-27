'use client';

import React, { useEffect, useState } from 'react';

export const QrDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<{
    hasBarcodeDetector: boolean;
    hasCamera: boolean;
    isHttps: boolean;
    userAgent: string;
    cameraPermission: string;
  } | null>(null);

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // Check basic capabilities
        const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
        const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        const userAgent = navigator.userAgent;

        // Check camera availability
        let hasCamera = false;
        let cameraPermission = 'unknown';

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          hasCamera = devices.some(device => device.kind === 'videoinput');
          
          // Check permissions
          if (navigator.permissions) {
            const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            cameraPermission = permission.state;
          }
        } catch (err) {
          console.log('Camera check failed:', err);
        }

        setDiagnostics({
          hasBarcodeDetector,
          hasCamera,
          isHttps,
          userAgent,
          cameraPermission
        });
      } catch (err) {
        console.error('Diagnostics failed:', err);
      }
    };

    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return <div>Running diagnostics...</div>;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
      <h3 className="font-bold text-lg mb-3">QR Scanner Diagnostics</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>BarcodeDetector API:</span>
          <span className={diagnostics.hasBarcodeDetector ? 'text-green-600' : 'text-red-600'}>
            {diagnostics.hasBarcodeDetector ? '✅ Available' : '❌ Not Available'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Camera Available:</span>
          <span className={diagnostics.hasCamera ? 'text-green-600' : 'text-red-600'}>
            {diagnostics.hasCamera ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>HTTPS/Localhost:</span>
          <span className={diagnostics.isHttps ? 'text-green-600' : 'text-red-600'}>
            {diagnostics.isHttps ? '✅ Secure' : '❌ Insecure'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Camera Permission:</span>
          <span className={
            diagnostics.cameraPermission === 'granted' ? 'text-green-600' : 
            diagnostics.cameraPermission === 'denied' ? 'text-red-600' : 'text-yellow-600'
          }>
            {diagnostics.cameraPermission === 'granted' ? '✅ Granted' : 
             diagnostics.cameraPermission === 'denied' ? '❌ Denied' : 
             '⚠️ ' + diagnostics.cameraPermission}
          </span>
        </div>
        
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-600">
            <strong>Browser:</strong> {
              diagnostics.userAgent.includes('Chrome') ? 'Chrome' :
              diagnostics.userAgent.includes('Edge') ? 'Edge' :
              diagnostics.userAgent.includes('Safari') ? 'Safari' :
              diagnostics.userAgent.includes('Firefox') ? 'Firefox' : 'Unknown'
            }
          </div>
        </div>
      </div>
      
      {!diagnostics.hasBarcodeDetector && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <strong>⚠️ QR Scanner won&apos;t work:</strong> BarcodeDetector API is not available in this browser. 
          Please use Chrome or Edge on mobile devices.
        </div>
      )}
      
      {!diagnostics.isHttps && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm">
          <strong>⚠️ Camera may not work:</strong> HTTPS is required for camera access (except localhost).
        </div>
      )}
    </div>
  );
};
