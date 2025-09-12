/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

interface ResizePanelProps {
  onApplyResize: (width: number, height: number) => void;
  isLoading: boolean;
  dimensions: { width: number; height: number; } | null;
}

const ResizePanel: React.FC<ResizePanelProps> = ({ onApplyResize, isLoading, dimensions }) => {
  const [width, setWidth] = useState<number>(dimensions?.width || 0);
  const [height, setHeight] = useState<number>(dimensions?.height || 0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);

  useEffect(() => {
    if (dimensions) {
      setWidth(dimensions.width);
      setHeight(dimensions.height);
    }
  }, [dimensions]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10) || 0;
    setWidth(newWidth);
    if (maintainAspectRatio && dimensions && dimensions.width > 0) {
      const aspectRatio = dimensions.height / dimensions.width;
      setHeight(Math.round(newWidth * aspectRatio));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10) || 0;
    setHeight(newHeight);
    if (maintainAspectRatio && dimensions && dimensions.height > 0) {
      const aspectRatio = dimensions.width / dimensions.height;
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };
  
  const handleApply = () => {
    if (width > 0 && height > 0) {
      onApplyResize(width, height);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">Resize Image</h3>
      <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-md">
        <div className="flex-1 w-full">
          <label htmlFor="width" className="block text-sm font-medium text-gray-400 mb-1">Width</label>
          <input
            id="width"
            type="number"
            value={width}
            onChange={handleWidthChange}
            className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading}
          />
        </div>
        <div className="text-gray-400 font-bold text-lg mt-6 hidden md:block">×</div>
        <div className="flex-1 w-full">
          <label htmlFor="height" className="block text-sm font-medium text-gray-400 mb-1">Height</label>
          <input
            id="height"
            type="number"
            value={height}
            onChange={handleHeightChange}
            className="w-full bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="aspect-ratio"
          checked={maintainAspectRatio}
          onChange={(e) => setMaintainAspectRatio(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          disabled={isLoading}
        />
        <label htmlFor="aspect-ratio" className="text-sm text-gray-300">Maintain aspect ratio</label>
      </div>
      <button
        onClick={handleApply}
        disabled={isLoading || !width || !height}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        Apply Resize
      </button>
    </div>
  );
};

export default ResizePanel;
