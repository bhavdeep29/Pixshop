/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface BackgroundPanelProps {
  onRemoveBackground: () => void;
  isLoading: boolean;
}

const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ onRemoveBackground, isLoading }) => {
    return (
        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-center text-gray-300">Background Removal</h3>
            <p className="text-sm text-gray-400 -mt-2">
                Uses AI to automatically remove the background from the image.
            </p>

            <button
                onClick={onRemoveBackground}
                className="w-full max-w-xs bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
            >
                {isLoading ? 'Removing...' : 'Remove Background'}
            </button>
        </div>
    );
};

export default BackgroundPanel;
