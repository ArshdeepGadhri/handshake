'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Loader2, X, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type ScanState = 'idle' | 'preview' | 'scanning' | 'success' | 'error';

export default function ScanPage() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [extractedName, setExtractedName] = useState<string>('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // This cleanup runs when previewUrl changes OR when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    // Cleanup any pending navigation timer on unmount
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, []);


  // ─── Handle file selected (camera or gallery) ─────────────────────────────
  const handleFileSelected = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      setScanState('error');
      return;
    }
    selectedFileRef.current = file;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setScanState('preview');
  }, []);

  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = '';
  };

  // ─── Clear / retake ────────────────────────────────────────────────────────
  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    selectedFileRef.current = null;
    setScanState('idle');
    setErrorMessage('');
  };

  // ─── Submit image to API ────────────────────────────────────────────────────
  const handleExtract = async () => {
    const file = selectedFileRef.current;
    if (!file) return;

    setScanState('scanning');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || 'Extraction failed. Please try again.');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed.');
      }

      const name = [result.data?.first_name, result.data?.last_name]
        .filter(Boolean)
        .join(' ');
      setExtractedName(name || 'New Contact');
      setScanState('success');

      // Navigate to contacts after short delay so user sees success state
      scanTimerRef.current = setTimeout(() => {
        router.push('/contacts');
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(msg);
      setScanState('error');
    }
  };

  // ─── Render card interior based on state ──────────────────────────────────
  const renderCardContent = () => {
    switch (scanState) {
      case 'idle':
        return (
          <div className="flex flex-col items-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-card-fill flex items-center justify-center text-magenta">
              <Camera className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Take or Upload a Photo</h3>
              <p className="text-sm text-secondary-foreground">
                Point your camera at a business card or conference badge.
              </p>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="relative w-full h-full">
            <Image
              src={previewUrl!}
              alt="Card preview"
              fill
              className="object-contain rounded-lg"
              unoptimized
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'scanning':
        return (
          <div className="flex flex-col items-center space-y-4 text-primary">
            <Loader2 className="w-12 h-12 animate-spin text-magenta" />
            <p className="font-medium animate-pulse">Extracting contact details...</p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center space-y-4 text-primary">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <div className="space-y-1 text-center">
              <p className="font-semibold text-lg">{extractedName}</p>
              <p className="text-sm text-secondary-foreground">Contact saved! Redirecting…</p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center space-y-4 text-primary">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="space-y-1 text-center px-4">
              <p className="font-semibold">Something went wrong</p>
              <p className="text-sm text-secondary-foreground">{errorMessage}</p>
            </div>
          </div>
        );
    }
  };

  const isIdle = scanState === 'idle';
  const isPreview = scanState === 'preview';
  const isScanning = scanState === 'scanning';
  const isSuccess = scanState === 'success';
  const isError = scanState === 'error';

  return (
    <AppLayout>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onCameraChange}
        aria-label="Take photo with camera"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onGalleryChange}
        aria-label="Upload image from gallery"
      />

      <div className="p-4 space-y-4 h-full flex flex-col">
        <div className="flex items-center">
          <Link href="/contacts" className="flex items-center text-secondary-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>Cancel</span>
          </Link>
        </div>

        <div className="flex flex-col space-y-1">
          <h1 className="text-xl font-bold text-primary">Scan Contact</h1>
          <p className="text-secondary-foreground text-xs">
            Capture a business card or conference badge.
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <Card className="w-full max-w-sm aspect-square border-dashed border-2 border-magenta bg-surface-tinted/30 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
            <CardContent className="w-full h-full flex items-center justify-center p-0">
              {renderCardContent()}
            </CardContent>

            {/* Camera Frame Corners — only show when idle */}
            {(isIdle || isError) && (
              <>
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-magenta rounded-tl-lg opacity-50" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-magenta rounded-tr-lg opacity-50" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-magenta rounded-bl-lg opacity-50" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-magenta rounded-br-lg opacity-50" />
              </>
            )}
          </Card>
        </div>

        <div className="space-y-3 pb-8">
          {/* State: idle or error → show capture/upload buttons */}
          {(isIdle || isError) && (
            <>
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full bg-magenta hover:bg-orchid text-white py-6 text-lg rounded-xl shadow-md transition-all active:scale-95"
              >
                <Camera className="mr-2 w-5 h-5" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full border-magenta text-primary hover:bg-surface-tinted py-6 text-lg rounded-xl transition-all"
              >
                <ImageIcon className="mr-2 w-5 h-5" />
                Upload from Gallery
              </Button>
            </>
          )}

          {/* State: preview → show Extract + Retake */}
          {isPreview && (
            <>
              <Button
                onClick={handleExtract}
                className="w-full bg-magenta hover:bg-orchid text-white py-6 text-lg rounded-xl shadow-md transition-all active:scale-95"
              >
                Extract Contact Info
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="w-full border-magenta text-primary hover:bg-surface-tinted py-6 text-lg rounded-xl transition-all"
              >
                Retake / Change Photo
              </Button>
            </>
          )}

          {/* State: scanning → disabled button */}
          {isScanning && (
            <Button
              disabled
              className="w-full bg-magenta text-white py-6 text-lg rounded-xl shadow-md"
            >
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Extracting…
            </Button>
          )}

          {/* State: success → nothing (auto-redirect) */}
          {isSuccess && (
            <Button
              disabled
              className="w-full bg-green-600 text-white py-6 text-lg rounded-xl shadow-md"
            >
              <CheckCircle2 className="mr-2 w-5 h-5" />
              Saved! Redirecting…
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
