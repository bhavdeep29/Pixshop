/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface FaceDetectionPanelProps {
  onDetectFaces: () => void;
  isLoading: boolean;
  faceCount: number;
}

const FaceDetectionPanel: React.FC<FaceDetectionPanelProps> = ({ onDetectFaces, isLoading, faceCount }) => {
    return (
        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-center text-gray-300">Face Detection</h3>
            <p className="text-sm text-gray-400 -mt-2">
                Uses AI to find all human faces in the current image.
            </p>

            <button
                onClick={onDetectFaces}
                className="w-full max-w-xs bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
            >
                {isLoading ? 'Detecting...' : 'Detect Faces'}
            </button>

            {faceCount > 0 && !isLoading && (
                <div className="mt-2 text-center text-green-400 bg-green-900/50 border border-green-700 p-3 rounded-md animate-fade-in">
                    <p className="font-semibold">Found {faceCount} face{faceCount > 1 ? 's' : ''}.</p>
                </div>
            )}
        </div>
    );
};

export default FaceDetectionPanel;