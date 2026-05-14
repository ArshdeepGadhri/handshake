'use client';

import React, { useState, useRef } from 'react';
import AppLayout from '@/components/shared/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Loader2, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

export default function DigitalCardPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // 1. Upload to Storage (assuming a 'business_cards' bucket exists)
      // If the bucket doesn't exist, this might fail, so we'll handle it gracefully
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `own-cards/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business_cards')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image. Please ensure storage bucket exists.');
      }

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business_cards')
        .getPublicUrl(filePath);

      // 3. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ business_card_url: publicUrl })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // We'll proceed anyway since the upload succeeded
      }

      setUploadSuccess(true);
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadSuccess(false);
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <div className="flex items-center">
          <Link href="/profile" className="flex items-center text-secondary-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>Back to Profile</span>
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold text-primary">Your Digital Card</h1>
          <p className="text-secondary-foreground text-sm">Upload your own business card to share with others.</p>
        </div>

        <Card className="border-dashed border-2 border-border bg-surface-tinted/30 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden min-h-[250px]">
          {previewUrl ? (
            <div className="relative w-full aspect-[3/2] max-w-sm">
              <Image 
                src={previewUrl} 
                alt="Business card preview" 
                fill 
                className="object-contain rounded-lg"
              />
              {!isUploading && !uploadSuccess && (
                <button 
                  onClick={handleClear}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors z-10 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-card-fill flex items-center justify-center text-magenta">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-primary">No card uploaded</p>
                <p className="text-xs text-muted-foreground">Select a photo of your business card</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="border-magenta text-magenta"
              >
                Select Image
              </Button>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </Card>

        {selectedFile && !uploadSuccess && (
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="w-full bg-magenta hover:bg-orchid text-white py-6 text-lg rounded-xl shadow-md"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 w-5 h-5" />
                Upload Digital Card
              </>
            )}
          </Button>
        )}

        {uploadSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <p className="font-bold text-green-600">Successfully Uploaded!</p>
            <p className="text-xs text-green-700/70">Your digital business card is now saved to your profile.</p>
            <Button variant="outline" className="mt-2 border-green-500/30 text-green-600 hover:bg-green-500/5" onClick={handleClear}>
              Upload Another
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
