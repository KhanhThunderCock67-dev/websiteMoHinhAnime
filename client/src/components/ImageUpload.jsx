import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadApi } from '../api';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const ImageUpload = ({
  value = '',
  onChange,
  label = 'Product Image *',
  maxSizeMB = 5,
  disabled = false,
  required = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');


  const fileInputRef = useRef(null);
  const currentObjectUrlRef = useRef(null);

  // Clean up object URLs when local preview changes or component unmounts
  const cleanupObjectUrl = () => {
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupObjectUrl();
    };
  }, []);

  // When value changes from outside (e.g., reset or modal open), clear temporary preview
  useEffect(() => {
    if (!value) {
      setLocalPreviewUrl('');
      cleanupObjectUrl();
    }
  }, [value]);

  const validateFile = (file) => {
    if (!file) return 'No file selected';

    // File type validation
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid format. Only JPEG, PNG, and WebP images are supported.`;
    }

    // File size validation
    const limitBytes = maxSizeMB * 1024 * 1024;
    if (file.size > limitBytes) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${maxSizeMB}MB.`;
    }

    return null;
  };

  const handleProcessFile = async (file) => {
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    // Create local preview immediately
    cleanupObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    currentObjectUrlRef.current = objectUrl;
    setLocalPreviewUrl(objectUrl);

    // Upload to server
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadApi.uploadImage(file, (percent) => {
        setUploadProgress(percent);
      });

      if (response?.data?.success && response.data.data?.url) {
        const uploadedUrl = response.data.data.url;
        onChange(uploadedUrl);
        setSuccessMessage('Image uploaded successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(response?.data?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to upload image. Please try again.';
      setErrorMessage(msg);
      // Revert preview if upload failed and there was no previous value
      if (!value) {
        setLocalPreviewUrl('');
        cleanupObjectUrl();
      }
    } finally {
      setIsUploading(false);
      // Reset input value to allow re-selecting same file if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    cleanupObjectUrl();
    setLocalPreviewUrl('');
    setErrorMessage('');
    setSuccessMessage('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = localPreviewUrl || value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-slate-400 font-semibold">
          {label}
        </label>
      </div>


      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
        id="local-image-file-input"
      />

      {/* Upload & Preview Card */}
      {displayUrl ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Image Preview Box */}
            <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 flex items-center justify-center">
              <img
                src={displayUrl}
                alt="Product preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80';
                }}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mb-1" />
                  <span className="text-[10px] text-amber-400 font-medium">
                    Uploading {uploadProgress}%
                  </span>
                </div>
              )}
            </div>

            {/* Details & Actions */}
            <div className="flex-1 min-w-0 space-y-2 w-full">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {localPreviewUrl ? 'New Upload' : 'Saved Image'}
                </span>
                <span className="text-xs text-slate-500 truncate" title={value || 'New file'}>
                  {value ? (value.startsWith('/uploads/') ? value.replace('/uploads/', '') : value) : 'Ready to save'}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                To replace this picture, select a new file from your device or remove it.
              </p>

              {/* Progress bar if uploading */}
              {isUploading && (
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Replace File
                </button>
                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={handleRemove}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
          } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <div className="text-sm text-slate-200 font-medium">
                Uploading image... ({uploadProgress}%)
              </div>
              <div className="w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Click to upload <span className="text-slate-400 font-normal">or drag & drop</span>
              </div>
              <p className="text-xs text-slate-500">
                Supports JPEG, PNG, and WebP (up to {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="ml-auto p-1 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Success Message Alert */}
      {successMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
