'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, Check } from 'lucide-react';

interface ImageUploaderProps {
  currentUrl?: string;
  folder?: string;
  onUploaded: (url: string) => void;
  label?: string;
}

export default function ImageUploader({
  currentUrl,
  folder = 'projects',
  onUploaded,
  label = 'Upload Image',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Upload failed');
      } else {
        setPreview(data.url);
        onUploaded(data.url);
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-uploader-wrap">
      {label && <span className="admin-field-label">{label}</span>}

      <div
        className={`admin-dropzone ${uploading ? 'loading' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="admin-file-hidden"
          onChange={handleFileChange}
        />

        {preview ? (
          <div className="preview-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Upload preview" className="uploaded-preview-img" />
            <div className="preview-overlay">
              <UploadCloud size={20} />
              <span>Click to replace image</span>
            </div>
          </div>
        ) : (
          <div className="dropzone-empty">
            {uploading ? (
              <Loader2 className="spinner text-accent" size={32} />
            ) : (
              <ImageIcon className="text-muted" size={32} />
            )}
            <p className="dropzone-text">
              {uploading ? 'Uploading image...' : 'Click or drop an image here to upload'}
            </p>
            <span className="dropzone-hint">Supports PNG, JPG, WEBP, SVG (Max 10MB)</span>
          </div>
        )}
      </div>

      {error && <span className="uploader-error-msg">{error}</span>}
    </div>
  );
}
