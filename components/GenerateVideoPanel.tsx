/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface GenerateVideoPanelProps {
  onGenerateVideo: (prompt: string) => void;
  isLoading: boolean;
}

const GenerateVideoPanel: React.FC<GenerateVideoPanelProps> = ({ onGenerateVideo, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerateVideo(prompt.trim());
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">Generate Video from Image</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">
        Bring your image to life! Describe a short animation or scene.
        <br />
        <span className="font-semibold text-yellow-400">Note:</span> Video generation can take several minutes.
      </p>

      <div className="w-full max-w-lg flex flex-col md:flex-row items-center gap-4">
        <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'a gentle breeze rustles the leaves'"
            className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
        />
        <button
            onClick={handleGenerate}
            className="w-full md:w-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-purple-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !prompt.trim()}
        >
            Generate Video
        </button>
      </div>
    </div>
  );
};

export default GenerateVideoPanel;
