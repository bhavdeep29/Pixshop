/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface ExtractTextPanelProps {
  onExtractText: () => void;
  isLoading: boolean;
  extractedText: string;
}

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v3.042m-7.332 0c.055.194.084.4.084.612v3.042m0 0a2.25 2.25 0 0 0 2.25 2.25h3a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25h-3a2.25 2.25 0 0 0-2.25 2.25" />
    </svg>
);


const ExtractTextPanel: React.FC<ExtractTextPanelProps> = ({ onExtractText, isLoading, extractedText }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = () => {
        if (extractedText) {
            navigator.clipboard.writeText(extractedText).then(() => {
                setCopySuccess('Copied!');
                setTimeout(() => setCopySuccess(''), 2000);
            }, () => {
                setCopySuccess('Failed to copy');
            });
        }
    };

    return (
        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-center text-gray-300">Extract Text from Image (OCR)</h3>
            <p className="text-sm text-gray-400 -mt-2">
                Uses AI to find and extract any text in the current image.
            </p>

            <button
                onClick={onExtractText}
                className="w-full max-w-xs bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
            >
                {isLoading ? 'Extracting...' : 'Extract Text'}
            </button>

            {extractedText && (
                <div className="w-full mt-4 animate-fade-in relative">
                    <textarea
                        readOnly
                        value={extractedText}
                        className="w-full h-48 bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                        placeholder="Extracted text will appear here..."
                    />
                     <button 
                        onClick={handleCopy}
                        className="absolute top-3 right-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 font-semibold py-1 px-3 rounded-md text-xs transition-all flex items-center gap-1.5"
                        title="Copy to clipboard"
                    >
                        {copySuccess ? copySuccess : <><CopyIcon className="w-4 h-4" /> Copy</>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExtractTextPanel;