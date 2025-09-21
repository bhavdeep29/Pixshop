/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef } from 'react';
import { ExportIcon } from './icons';

interface VideoModalProps {
  show: boolean;
  onClose: () => void;
  videoUrl: string | null;
}

const VideoModal: React.FC<VideoModalProps> = ({ show, onClose, videoUrl }) => {
  const anchorRef = useRef<HTMLAnchorElement>(null);

  if (!show || !videoUrl) return null;

  const handleDownload = () => {
    if (anchorRef.current) {
      anchorRef.current.click();
    }
  };

  const fileName = `pixshop-video-${Date.now()}.mp4`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl p-6 m-4 text-white flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Video Generated Successfully</h2>
        
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
            />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/10 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all hover:bg-white/20 active:scale-95">
            Close
          </button>
          <a ref={anchorRef} href={videoUrl} download={fileName} className="hidden"></a>
          <button 
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-px active:scale-95"
          >
            <ExportIcon className="w-5 h-5" />
            Download Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
