import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

/**
 * QR Code Scanner Component
 * Uses @zxing/library for cross-platform QR code scanning
 * Mobile-first with camera access
 */
export function QRScanner({ onScan, onClose, isOpen = true }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    const startScanning = async () => {
      try {
        setError(null);
        setIsScanning(true);

        // Get available video devices
        const videoInputDevices = await codeReader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          throw new Error('No camera found on this device');
        }

        // Prefer back camera on mobile
        const selectedDevice =
          videoInputDevices.find(
            (device) => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear')
          ) || videoInputDevices[0];

        // Start scanning
        await codeReader.decodeFromVideoDevice(selectedDevice.deviceId, videoRef.current!, (result, error) => {
          if (!isMounted) return;

          if (result) {
            const scannedText = result.getText();
            console.log('[QRScanner] Scanned:', scannedText);

            // Success feedback
            toast.success('QR Code Scanned', {
              description: 'Processing check-in...'
            });

            // Call the onScan callback
            onScan(scannedText);

            // Stop scanning after successful scan
            handleStop();
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error('[QRScanner] Scan error:', error);
          }
        });
      } catch (err: any) {
        console.error('[QRScanner] Error starting scanner:', err);
        setError(err.message || 'Failed to access camera');
        toast.error('Camera Error', {
          description: err.message || 'Could not access camera. Please check permissions.'
        });
      }
    };

    startScanning();

    return () => {
      isMounted = false;
      handleStop();
    };
  }, [isOpen, onScan]);

  const handleStop = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    handleStop();
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="relative w-full max-w-md p-6 space-y-4">
        {/* Close button */}
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Camera className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Scan QR Code</h2>
          <p className="text-sm text-muted-foreground">Position the QR code within the frame to check in</p>
        </div>

        {/* Video preview */}
        <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-4 border-primary rounded-lg w-48 h-48 animate-pulse" />
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-white text-center p-4">
                <p className="font-medium">Camera Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-center text-muted-foreground">Make sure the QR code is well lit and in focus</p>

        {/* Cancel button */}
        <Button variant="outline" className="w-full" onClick={handleClose}>
          Cancel
        </Button>
      </Card>
    </div>
  );
}

export default QRScanner;
