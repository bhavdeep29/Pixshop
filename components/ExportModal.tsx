/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface ExportModalProps {
  show: boolean;
  onClose: () => void;
  imageFile: File | null;
}

type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';

const formatToExtension = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const formatToLabel = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
};

const ExportModal: React.FC<ExportModalProps> = ({ show, onClose, imageFile }) => {
  const [format, setFormat] = useState<ExportFormat>('image/png');
  const [quality, setQuality] = useState<number>(0.9);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const anchorRef = useRef<HTMLAnchorElement>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const generatePreview = useCallback(() => {
    if (!imageFile) return;

    setIsProcessing(true);
    const image = new Image();
    const objectUrl = URL.createObjectURL(imageFile);
    image.src = objectUrl;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
          }
          setDownloadUrl(URL.createObjectURL(blob));
          setEstimatedSize(formatBytes(blob.size));
        }
        setIsProcessing(false);
      }, format, quality);

      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
        setIsProcessing(false);
        setEstimatedSize('Error');
    }
  }, [imageFile, format, quality, downloadUrl]);

  useEffect(() => {
    if (show && imageFile) {
        // Debounce the generation to avoid flickering on rapid quality changes
        const handler = setTimeout(() => {
            generatePreview();
        }, 100);

        return () => {
            clearTimeout(handler);
        };
    }
    
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }
    };
  }, [show, imageFile, format, quality]);

  const handleDownload = () => {
    if (anchorRef.current) {
      anchorRef.current.click();
    }
  };
  
  if (!show) return null;

  const fileName = `pixshop-export.${formatToExtension[format]}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6 m-4 text-white" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Export Image</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-300 mb-1">Format</label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          
          {(format === 'image/jpeg' || format === 'image/webp') && (
            <div className="animate-fade-in">
              <label htmlFor="quality" className="block text-sm font-medium text-gray-300 mb-1">
                Quality / Compression <span className="text-gray-400">({Math.round(quality * 100)}%)</span>
              </label>
              <input
                id="quality"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          <div className="bg-gray-900/50 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-400">Estimated File Size</p>
            <p className="text-xl font-bold text-blue-400 h-8 flex items-center justify-center">
              {isProcessing ? 'Calculating...' : estimatedSize}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/10 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all hover:bg-white/20 active:scale-95">
            Cancel
          </button>
          <a ref={anchorRef} href={downloadUrl || '#'} download={fileName} className="hidden"></a>
          <button 
            onClick={handleDownload}
            disabled={!downloadUrl || isProcessing}
            className="flex-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-px active:scale-95 disabled:from-blue-800 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Download ${formatToLabel[format]}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
